import { useState, useRef, useEffect, useCallback } from 'react'
import { MapPin, Loader, Crosshair } from 'lucide-react'

const API_KEY = import.meta.env.VITE_HERE_API_KEY
// Nairobi centre — biases results toward Kenya's main city
const KENYA_AT = '1.2921,36.8219'

function debounce(fn, ms) {
  let t
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms) }
}

function resultTypeLabel(item) {
  const type = item.resultType
  if (type === 'place') {
    const cat = item.categories?.[0]?.name
    return cat ?? 'Place'
  }
  if (type === 'houseNumber') return 'Address'
  if (type === 'street')      return 'Street'
  if (type === 'locality') {
    const sub = item.localityType
    return sub === 'postalCode' ? 'Postcode' : sub === 'subdistrict' ? 'Estate / Area' : 'Area'
  }
  if (type === 'administrativeArea') return 'County / City'
  return null
}

export default function AddressAutocomplete({ label, value, onChange, onSelect, required, placeholder }) {
  const [suggestions, setSuggestions]   = useState([])
  const [loading, setLoading]           = useState(false)
  const [gpsLoading, setGpsLoading]     = useState(false)
  const [open, setOpen]                 = useState(false)
  const containerRef = useRef(null)

  const search = useCallback(
    debounce(async (q) => {
      if (!q || q.length < 2 || !API_KEY || API_KEY === 'your_here_api_key_here') {
        setSuggestions([])
        return
      }
      setLoading(true)
      try {
        const url = [
          'https://autocomplete.search.hereapi.com/v1/autocomplete',
          `?q=${encodeURIComponent(q)}`,
          `&in=countryCode:KEN`,
          `&at=${KENYA_AT}`,
          '&lang=en&limit=7',
          `&apikey=${API_KEY}`,
        ].join('')
        const res = await fetch(url)
        const data = await res.json()
        setSuggestions(data.items ?? [])
        setOpen(true)
      } catch {
        setSuggestions([])
      } finally {
        setLoading(false)
      }
    }, 300),
    []
  )

  const handleInput = (e) => {
    onChange(e.target.value)
    search(e.target.value)
  }

  const handleSelect = async (item) => {
    setOpen(false)
    setSuggestions([])
    const address = item.address?.label ?? item.title
    onChange(address)

    if (item.position) {
      onSelect({ address, lat: item.position.lat, lng: item.position.lng })
      return
    }
    try {
      const res = await fetch(
        `https://lookup.search.hereapi.com/v1/lookup?id=${item.id}&apikey=${API_KEY}`
      )
      const data = await res.json()
      onSelect({ address, lat: data.position?.lat ?? null, lng: data.position?.lng ?? null })
    } catch {
      onSelect({ address, lat: null, lng: null })
    }
  }

  const handleGPS = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.')
      return
    }
    setGpsLoading(true)
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const { latitude: lat, longitude: lng } = coords
        try {
          const res = await fetch(
            `https://revgeocode.search.hereapi.com/v1/revgeocode?at=${lat},${lng}&lang=en&apikey=${API_KEY}`
          )
          const data = await res.json()
          const item = data.items?.[0]
          if (item) {
            const address = item.address?.label ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`
            onChange(address)
            onSelect({ address, lat, lng })
          }
        } catch {
          onChange(`${lat.toFixed(5)}, ${lng.toFixed(5)}`)
          onSelect({ address: `${lat.toFixed(5)}, ${lng.toFixed(5)}`, lat, lng })
        } finally {
          setGpsLoading(false)
        }
      },
      (err) => {
        setGpsLoading(false)
        if (err.code === 1) alert('Location access denied. Please allow location in your browser settings.')
        else alert('Could not get your location. Please type the address manually.')
      },
      { timeout: 10000, maximumAge: 30000 }
    )
  }

  useEffect(() => {
    const handler = (e) => { if (!containerRef.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="form-group" ref={containerRef} style={{ position: 'relative' }}>
      {label && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <label className="form-label" style={{ margin: 0 }}>{label}{required && <span style={{ color: 'var(--danger)', marginLeft: 3 }}>*</span>}</label>
          <button
            type="button"
            title="Use my current location"
            onClick={handleGPS}
            disabled={gpsLoading}
            style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: gpsLoading ? 'var(--text-secondary)' : 'var(--primary)', background: 'none', border: 'none', cursor: gpsLoading ? 'not-allowed' : 'pointer', padding: 0 }}>
            {gpsLoading
              ? <Loader size={12} style={{ animation: 'spin 0.6s linear infinite' }} />
              : <Crosshair size={12} />}
            {gpsLoading ? 'Detecting…' : 'Use my location'}
          </button>
        </div>
      )}

      <div style={{ position: 'relative' }}>
        <MapPin size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', pointerEvents: 'none' }} />
        <input
          className="form-control"
          style={{ paddingLeft: 32, paddingRight: loading ? 32 : 12 }}
          value={value}
          onChange={handleInput}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          required={required}
          placeholder={placeholder ?? 'Search area, estate, business…'}
          autoComplete="off"
        />
        {loading && (
          <Loader size={14} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', animation: 'spin 0.6s linear infinite' }} />
        )}
      </div>

      {open && suggestions.length > 0 && (
        <ul style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200,
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)', boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          listStyle: 'none', margin: '4px 0 0', padding: '4px 0',
          maxHeight: 280, overflowY: 'auto',
        }}>
          {suggestions.map((item) => {
            const typeLabel = resultTypeLabel(item)
            return (
              <li
                key={item.id}
                onMouseDown={() => handleSelect(item)}
                style={{ padding: '10px 14px', cursor: 'pointer', fontSize: 13, display: 'flex', gap: 8, alignItems: 'flex-start' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-muted)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <MapPin size={13} color="var(--primary)" style={{ marginTop: 3, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</div>
                  {item.address?.label && item.address.label !== item.title && (
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.address.label}
                    </div>
                  )}
                </div>
                {typeLabel && (
                  <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--primary)', background: 'var(--surface-muted)', borderRadius: 4, padding: '2px 6px', whiteSpace: 'nowrap', flexShrink: 0, marginTop: 2 }}>
                    {typeLabel}
                  </span>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
