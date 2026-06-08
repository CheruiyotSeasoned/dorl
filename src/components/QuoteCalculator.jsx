import { useState, useRef, useEffect, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { MapPin, Calculator, ArrowRight, ChevronDown, Search, Check, X } from 'lucide-react'

const API_KEY  = import.meta.env.VITE_HERE_API_KEY
const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'
const KENYA_CENTER = '-1.2921,36.8219'

const WA_SVG = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
)

const DEFAULT_CATEGORIES = [
  { id: 'documents', name: 'Documents',           description: 'Letters, certificates, envelopes (up to 0.5 kg)', base_price: 250,  per_km_rate: 8  },
  { id: 'small',     name: 'Small Parcel',         description: 'Small items, clothing, books (up to 5 kg)',        base_price: 400,  per_km_rate: 14 },
  { id: 'large',     name: 'Large Parcel',         description: 'Bulky or heavier items (up to 20 kg)',             base_price: 700,  per_km_rate: 18 },
  { id: 'fragile',   name: 'Fragile / Electronics','description': 'Screens, appliances, glassware',                base_price: 600,  per_km_rate: 16 },
  { id: 'bulk',      name: 'Bulk / Commercial',    description: 'Large commercial shipments (20 kg+)',              base_price: 1200, per_km_rate: 22 },
]

function haversineKm(a, b) {
  const R = 6371
  const dLat = (b.lat - a.lat) * Math.PI / 180
  const dLng = (b.lng - a.lng) * Math.PI / 180
  const lat1 = a.lat * Math.PI / 180, lat2 = b.lat * Math.PI / 180
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.asin(Math.sqrt(x))
}

// ── Modern searchable dropdown ─────────────────────────────────────────────────
function Dropdown({ label, placeholder, value, onChange, options, searchable = false, renderOption, renderSelected }) {
  const [open,   setOpen]   = useState(false)
  const [search, setSearch] = useState('')
  const wrapRef  = useRef(null)
  const searchRef = useRef(null)

  useEffect(() => {
    const handler = e => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (open && searchRef.current) searchRef.current.focus()
    if (!open) setSearch('')
  }, [open])

  const filtered = searchable && search
    ? options.filter(o => {
        const label = typeof o === 'string' ? o : o.label ?? o.name ?? ''
        return label.toLowerCase().includes(search.toLowerCase())
      })
    : options

  const getLabel = (o) => typeof o === 'string' ? o : o.label ?? o.name ?? ''
  const getValue = (o) => typeof o === 'string' ? o : o.value ?? o.id ?? o

  const isSelected = (o) => getValue(o) === (value?.value ?? value?.id ?? value)

  const select = (o) => {
    onChange(typeof o === 'string' ? o : o)
    setOpen(false)
  }

  const hasValue = value !== null && value !== undefined && value !== ''

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      {label && (
        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 7 }}>
          {label}
        </label>
      )}

      {/* Trigger */}
      <button type="button" onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 14px', textAlign: 'left', cursor: 'pointer',
          border: `1.5px solid ${hasValue ? 'rgba(255,94,20,0.6)' : open ? 'rgba(255,94,20,0.45)' : 'rgba(255,255,255,0.12)'}`,
          borderRadius: 10, background: open ? 'rgba(255,255,255,0.09)' : 'rgba(255,255,255,0.06)',
          fontFamily: 'inherit', transition: 'border-color 0.15s, background 0.15s',
        }}>
        <span style={{ flex: 1, fontSize: 14, color: hasValue ? '#fff' : 'rgba(255,255,255,0.35)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {hasValue
            ? (renderSelected ? renderSelected(value) : (typeof value === 'string' ? value : getLabel(value)))
            : placeholder}
        </span>
        {hasValue && (
          <span onMouseDown={e => { e.stopPropagation(); onChange(null) }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 18, height: 18, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', flexShrink: 0, cursor: 'pointer' }}>
            <X size={10} color="rgba(255,255,255,0.5)" />
          </span>
        )}
        <ChevronDown size={14} color="rgba(255,255,255,0.4)" style={{ flexShrink: 0, transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }} />
      </button>

      {/* Panel */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 400,
          background: '#161616', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12,
          boxShadow: '0 16px 48px rgba(0,0,0,0.6)', overflow: 'hidden',
          animation: 'qc-drop 0.15s ease',
        }}>
          {searchable && (
            <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <div style={{ position: 'relative' }}>
                <Search size={13} color="rgba(255,255,255,0.3)" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input ref={searchRef} value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search…"
                  style={{
                    width: '100%', paddingLeft: 30, paddingRight: 10, paddingTop: 8, paddingBottom: 8,
                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 7, fontSize: 13, color: '#fff', outline: 'none', fontFamily: 'inherit',
                  }}
                />
              </div>
            </div>
          )}
          <div style={{ maxHeight: 220, overflowY: 'auto' }}>
            {filtered.length === 0 ? (
              <div style={{ padding: '14px 16px', fontSize: 13, color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>
                {search ? 'No matches' : 'No options'}
              </div>
            ) : filtered.map((o, i) => {
              const selected = isSelected(o)
              return (
                <button key={i} type="button" onMouseDown={() => select(o)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 14px',
                    background: selected ? 'rgba(255,94,20,0.12)' : 'none', border: 'none',
                    borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                    cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => { if (!selected) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                  onMouseLeave={e => { if (!selected) e.currentTarget.style.background = 'none' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {renderOption ? renderOption(o) : (
                      <span style={{ fontSize: 13, fontWeight: selected ? 600 : 400, color: selected ? '#FF5E14' : '#fff' }}>
                        {getLabel(o)}
                      </span>
                    )}
                  </div>
                  {selected && <Check size={13} color="#FF5E14" style={{ flexShrink: 0 }} />}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ── HERE Autosuggest for collection point ─────────────────────────────────────
function PlaceSearch({ label, value, onSelect, placeholder }) {
  const [query,   setQuery]   = useState(value?.title ?? '')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [open,    setOpen]    = useState(false)
  const timerRef = useRef(null)
  const wrapRef  = useRef(null)

  useEffect(() => { if (value) setQuery(value.title) }, [value])

  useEffect(() => {
    const handler = e => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const search = useCallback(async (q) => {
    if (!q || q.length < 2) { setResults([]); setOpen(false); return }
    setLoading(true)
    try {
      const url = `https://autosuggest.search.hereapi.com/v1/autosuggest?q=${encodeURIComponent(q)}&at=${KENYA_CENTER}&limit=7&lang=en&apiKey=${API_KEY}`
      const res  = await fetch(url)
      const data = await res.json()
      const items = (data.items ?? []).filter(i => i.position)
      setResults(items)
      setOpen(items.length > 0)
    } catch { setResults([]) }
    finally { setLoading(false) }
  }, [])

  const handleChange = (e) => {
    const q = e.target.value
    setQuery(q)
    if (value) onSelect(null)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => search(q), 320)
  }

  const handleSelect = (item) => {
    const pos = item.position
    onSelect({ title: item.title, address: item.address?.label ?? item.title, lat: pos.lat, lng: pos.lng })
    setQuery(item.title)
    setOpen(false)
    setResults([])
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 7 }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <MapPin size={15} color={value ? '#FF5E14' : 'rgba(255,255,255,0.25)'}
          style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
        <input value={query} onChange={handleChange} onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={placeholder}
          style={{
            width: '100%', paddingLeft: 38, paddingRight: 14, paddingTop: 12, paddingBottom: 12,
            border: `1.5px solid ${value ? 'rgba(255,94,20,0.6)' : 'rgba(255,255,255,0.12)'}`,
            borderRadius: 10, fontSize: 14, color: '#fff', outline: 'none',
            background: 'rgba(255,255,255,0.06)', fontFamily: 'inherit', transition: 'border-color 0.15s',
          }}
          onFocus={e => { e.target.style.borderColor = 'rgba(255,94,20,0.5)'; e.target.style.background = 'rgba(255,255,255,0.09)' }}
          onBlur={e => { e.target.style.borderColor = value ? 'rgba(255,94,20,0.6)' : 'rgba(255,255,255,0.12)'; e.target.style.background = 'rgba(255,255,255,0.06)' }}
        />
        {loading && (
          <div style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)' }}>
            <div style={{ width: 14, height: 14, border: '2px solid #FF5E14', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          </div>
        )}
      </div>
      {open && results.length > 0 && (
        <div style={{ position: 'absolute', top: 'calc(100% + 5px)', left: 0, right: 0, zIndex: 300, background: '#161616', borderRadius: 12, boxShadow: '0 12px 40px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden', animation: 'qc-drop 0.15s ease' }}>
          {results.map((item, i) => (
            <button key={i} onMouseDown={() => handleSelect(item)}
              style={{ display: 'flex', alignItems: 'flex-start', gap: 10, width: '100%', padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', borderBottom: i < results.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', transition: 'background 0.1s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,94,20,0.1)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}>
              <MapPin size={13} color="#FF5E14" style={{ marginTop: 2, flexShrink: 0 }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
                {item.address?.label && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.address.label}</div>}
              </div>
            </button>
          ))}
          <div style={{ padding: '5px 14px', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: 10, color: 'rgba(255,255,255,0.18)' }}>Powered by HERE Maps</div>
        </div>
      )}
    </div>
  )
}

// ── County + Station selector ─────────────────────────────────────────────────
function StationSelector({ county, station, onCountyChange, onStationChange, grouped, counties, loading }) {
  const stations = county ? (grouped[county] ?? []) : []

  return (
    <div>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 7 }}>
        Delivery County &amp; Station
      </label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

        {/* County dropdown */}
        <Dropdown
          placeholder={loading ? 'Loading counties…' : 'Select county…'}
          value={county}
          onChange={val => { onCountyChange(val || null); onStationChange(null) }}
          options={counties}
          searchable
        />

        {/* Station dropdown — only when county chosen */}
        {county && (
          stations.length === 0 ? (
            <div style={{ padding: '11px 14px', border: '1.5px solid rgba(255,255,255,0.07)', borderRadius: 10, fontSize: 13, color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.03)' }}>
              No stations in {county} yet — <a href="#contact" style={{ color: '#FF5E14', textDecoration: 'none' }}>contact us</a> to arrange delivery
            </div>
          ) : (
            <Dropdown
              placeholder="Select pickup station…"
              value={station}
              onChange={onStationChange}
              options={stations}
              renderOption={s => (
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{s.name}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{[s.town, s.address].filter(Boolean).join(' · ')}</div>
                </div>
              )}
              renderSelected={s => s.name}
            />
          )
        )}

        {/* Station detail */}
        {station && (
          <div style={{ padding: '10px 14px', background: 'rgba(255,94,20,0.07)', border: '1px solid rgba(255,94,20,0.14)', borderRadius: 8, fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7 }}>
            <div style={{ fontWeight: 700, color: 'rgba(255,255,255,0.85)', marginBottom: 2, fontSize: 13 }}>{station.name}</div>
            {station.address && <div>{station.address}</div>}
            {station.contact_phone && <div>Tel: {station.contact_phone}</div>}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function QuoteCalculator({ waPhone = '254708919320', categories }) {
  const cats = categories?.length ? categories : DEFAULT_CATEGORIES

  const { data: stationsData, isLoading: stationsLoading } = useQuery({
    queryKey: ['public-upcountry-stations'],
    queryFn: () => axios.get(`${API_BASE}/api/upcountry/stations`).then(r => r.data),
    staleTime: 5 * 60 * 1000,
  })

  const grouped  = stationsData?.grouped  ?? {}
  const counties = stationsData?.counties ?? []

  const [from,    setFrom]    = useState(null)
  const [county,  setCounty]  = useState(null)
  const [station, setStation] = useState(null)
  const [catId,   setCatId]   = useState(null)
  const [quote,   setQuote]   = useState(null)
  const [error,   setError]   = useState('')

  const selectedCat = cats.find(c => c.id === catId)

  const calculate = () => {
    setError('')
    setQuote(null)
    if (!from)    { setError('Please enter a collection location.'); return }
    if (!station) { setError('Please select a delivery county and pickup station.'); return }
    if (!catId)   { setError('Please select a package type.'); return }
    if (!station.lat || !station.lng) { setError('Selected station has no GPS coordinates — contact us for a manual quote.'); return }
    const km   = haversineKm(from, { lat: station.lat, lng: station.lng })
    const low  = Math.round((selectedCat.base_price + km * selectedCat.per_km_rate) / 10) * 10
    const high = Math.round((selectedCat.base_price + km * selectedCat.per_km_rate * 1.3) / 10) * 10
    setQuote({ low, high, km: km.toFixed(1), category: selectedCat.name })
  }

  const waMsg = quote
    ? `Hi Sendtrack! I'd like to book a delivery.\nFrom: ${from?.address}\nTo: ${station?.name}, ${station?.town} (${county})\nPackage: ${quote.category}\nEstimated: KES ${quote.low.toLocaleString()}–${quote.high.toLocaleString()}\nPlease confirm and arrange pickup.`
    : `Hi Sendtrack! I'd like a delivery quote.`

  return (
    <>
      <style>{`
        @keyframes qc-drop {
          from { opacity: 0; transform: translateY(-6px) scale(0.98); }
          to   { opacity: 1; transform: none; }
        }
      `}</style>

      <section id="quote" style={{ background: '#111' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '72px 24px' }}>

          <div style={{ textAlign: 'center', marginBottom: 44 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,94,20,0.14)', border: '1px solid rgba(255,94,20,0.28)', borderRadius: 999, padding: '6px 16px', marginBottom: 18 }}>
              <Calculator size={12} color="#FF5E14" />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#FF5E14', letterSpacing: '1px', textTransform: 'uppercase' }}>Instant Quote</span>
            </div>
            <h2 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", color: '#fff', fontSize: 'clamp(22px,4vw,34px)', fontWeight: 700, margin: '0 0 14px', lineHeight: 1.15 }}>
              Get a delivery price in seconds
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 15, maxWidth: 520, margin: '0 auto', lineHeight: 1.7 }}>
              Enter your collection point, choose your county and pickup station, then select package type for an instant estimate.
            </p>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: 'clamp(20px,4vw,36px)', maxWidth: 820, margin: '0 auto' }}>

            {/* Location row */}
            <div className="lp-quote-grid" style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 12, marginBottom: 24, alignItems: 'start' }}>
              <PlaceSearch
                label="Collection point"
                value={from}
                onSelect={setFrom}
                placeholder="Business, building or address…"
              />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 34, color: 'rgba(255,255,255,0.2)', flexShrink: 0 }}>
                <ArrowRight size={16} />
              </div>
              <StationSelector
                county={county}
                station={station}
                onCountyChange={setCounty}
                onStationChange={setStation}
                grouped={grouped}
                counties={counties}
                loading={stationsLoading}
              />
            </div>

            {/* Package type */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 10 }}>
                Package Type
              </label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {cats.map(cat => (
                  <button key={cat.id} onClick={() => setCatId(cat.id)} title={cat.description}
                    style={{
                      padding: '8px 16px', borderRadius: 8, fontFamily: 'inherit', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                      border: `1.5px solid ${catId === cat.id ? '#FF5E14' : 'rgba(255,255,255,0.1)'}`,
                      background: catId === cat.id ? 'rgba(255,94,20,0.16)' : 'rgba(255,255,255,0.04)',
                      color: catId === cat.id ? '#FF5E14' : 'rgba(255,255,255,0.55)', transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { if (catId !== cat.id) { e.currentTarget.style.borderColor='rgba(255,94,20,0.35)'; e.currentTarget.style.color='rgba(255,255,255,0.8)' } }}
                    onMouseLeave={e => { if (catId !== cat.id) { e.currentTarget.style.borderColor='rgba(255,255,255,0.1)'; e.currentTarget.style.color='rgba(255,255,255,0.55)' } }}>
                    {cat.name}
                  </button>
                ))}
              </div>
              {selectedCat && <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 8 }}>{selectedCat.description}</p>}
            </div>

            {error && (
              <div style={{ color: '#FCA5A5', fontSize: 13, marginBottom: 16, padding: '10px 14px', background: 'rgba(239,68,68,0.08)', borderRadius: 8, border: '1px solid rgba(239,68,68,0.18)' }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <button onClick={calculate}
                style={{ padding: '12px 28px', background: '#FF5E14', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'inherit', transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#D94E0A'}
                onMouseLeave={e => e.currentTarget.style.background = '#FF5E14'}>
                <Calculator size={15} /> Calculate Price
              </button>
              {quote && (
                <a href={`https://wa.me/${waPhone}?text=${encodeURIComponent(waMsg)}`} target="_blank" rel="noopener noreferrer"
                  style={{ padding: '12px 22px', background: '#25D366', color: '#fff', borderRadius: 10, fontWeight: 700, fontSize: 14, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#1ebe57'}
                  onMouseLeave={e => e.currentTarget.style.background = '#25D366'}>
                  {WA_SVG} Book on WhatsApp
                </a>
              )}
            </div>

            {quote && (
              <div style={{ marginTop: 24, padding: '22px 26px', background: 'rgba(255,94,20,0.07)', border: '1px solid rgba(255,94,20,0.18)', borderRadius: 14, display: 'flex', gap: 28, flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ flexShrink: 0 }}>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6 }}>Estimated price</div>
                  <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, fontSize: 36, color: '#FF5E14', lineHeight: 1 }}>
                    KES {quote.low.toLocaleString()}
                  </div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginTop: 5 }}>
                    up to KES {quote.high.toLocaleString()} &nbsp;·&nbsp; ~{quote.km} km
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, marginBottom: 6 }}>
                    Includes {quote.category} handling, real-time GPS tracking, and proof of delivery.
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.22)' }}>
                    * Estimate based on straight-line distance. Final price confirmed on booking.
                  </div>
                </div>
              </div>
            )}

            {counties.length === 0 && !stationsLoading && (
              <div style={{ marginTop: 16, padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, fontSize: 13, color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>
                Delivery stations are being set up.{' '}
                <a href={`https://wa.me/${waPhone}`} target="_blank" rel="noopener noreferrer" style={{ color: '#FF5E14', textDecoration: 'none' }}>Chat with us</a>{' '}
                for a manual quote.
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  )
}
