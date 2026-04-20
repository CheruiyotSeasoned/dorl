import { useState, useRef, useEffect, useCallback } from 'react'
import { MapPin, Loader } from 'lucide-react'

const API_KEY = import.meta.env.VITE_HERE_API_KEY

function debounce(fn, ms) {
  let t
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms) }
}

/**
 * Address autocomplete backed by HERE Geocoding & Search API.
 *
 * Props:
 *   label       — form label string
 *   value       — current address string
 *   onChange    — (address) => void  (text-only updates)
 *   onSelect    — ({ address, lat, lng }) => void  (called on pick)
 *   required    — boolean
 *   placeholder — string
 */
export default function AddressAutocomplete({ label, value, onChange, onSelect, required, placeholder }) {
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)

  const search = useCallback(
    debounce(async (q) => {
      if (!q || q.length < 3 || !API_KEY || API_KEY === 'your_here_api_key_here') {
        setSuggestions([])
        return
      }
      setLoading(true)
      try {
        const res = await fetch(
          `https://autocomplete.search.hereapi.com/v1/autocomplete?q=${encodeURIComponent(q)}&lang=en&limit=6&apikey=${API_KEY}`
        )
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

    // Lookup lat/lng for selected item
    if (item.position) {
      onSelect({ address, lat: item.position.lat, lng: item.position.lng })
      return
    }

    // If no position, do a geocode lookup by id
    try {
      const res = await fetch(
        `https://lookup.search.hereapi.com/v1/lookup?id=${item.id}&apikey=${API_KEY}`
      )
      const data = await res.json()
      if (data.position) {
        onSelect({ address, lat: data.position.lat, lng: data.position.lng })
      }
    } catch {
      onSelect({ address, lat: null, lng: null })
    }
  }

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (!containerRef.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="form-group" ref={containerRef} style={{ position: 'relative' }}>
      {label && <label className="form-label">{label}</label>}
      <div style={{ position: 'relative' }}>
        <MapPin size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', pointerEvents: 'none' }} />
        <input
          className="form-control"
          style={{ paddingLeft: 32, paddingRight: loading ? 32 : 12 }}
          value={value}
          onChange={handleInput}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          required={required}
          placeholder={placeholder ?? 'Type an address…'}
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
          listStyle: 'none', margin: '4px 0 0', padding: '4px 0', maxHeight: 260, overflowY: 'auto',
        }}>
          {suggestions.map((item) => (
            <li
              key={item.id}
              onMouseDown={() => handleSelect(item)}
              style={{ padding: '10px 14px', cursor: 'pointer', fontSize: 13, display: 'flex', gap: 8, alignItems: 'flex-start' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-muted)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <MapPin size={13} color="var(--primary)" style={{ marginTop: 2, flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 500 }}>{item.title}</div>
                {item.address?.label && item.address.label !== item.title && (
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 1 }}>{item.address.label}</div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
