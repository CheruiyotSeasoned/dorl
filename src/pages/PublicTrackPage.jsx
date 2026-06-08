import { useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { MapPin, Clock, Package, CheckCircle2, Truck, Search, AlertCircle, Navigation, Phone, Star } from 'lucide-react'
import HereMap from '../components/HereMap'
import api from '../lib/api'

async function fetchTrack(code) {
  const res = await api.get('/track', { params: { code } })
  return res.data.data
}

const STEPS = [
  { key: 'processing',         label: 'Order Placed' },
  { key: 'awaiting_dispatch',  label: 'Awaiting Rider' },
  { key: 'assigned',           label: 'Rider Assigned' },
  { key: 'in_progress',        label: 'Out for Delivery' },
  { key: 'completed',          label: 'Delivered' },
]

const STEP_INDEX = Object.fromEntries(STEPS.map((s, i) => [s.key, i]))

function StatusStepper({ status }) {
  const idx = STEP_INDEX[status] ?? (status === 'cancelled' ? -1 : 0)
  const cancelled = status === 'cancelled'

  if (cancelled) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: '#fef2f2', borderRadius: 10, color: '#dc2626', fontSize: 13, fontWeight: 600 }}>
        <AlertCircle size={16} /> Order cancelled
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
      {STEPS.map((step, i) => (
        <div key={step.key} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
              background: i <= idx ? '#FF5E14' : '#e5e7eb',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.3s',
            }}>
              {i < idx
                ? <CheckCircle2 size={16} color="#fff" />
                : i === idx
                  ? <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#fff' }} />
                  : <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#9ca3af' }} />}
            </div>
            <div style={{ fontSize: 10, fontWeight: i === idx ? 700 : 400, color: i <= idx ? '#FF5E14' : '#9ca3af', whiteSpace: 'nowrap', textAlign: 'center', maxWidth: 70 }}>
              {step.label}
            </div>
          </div>
          {i < STEPS.length - 1 && (
            <div style={{ flex: 1, height: 3, background: i < idx ? '#FF5E14' : '#e5e7eb', margin: '0 4px', marginBottom: 22, transition: 'background 0.3s' }} />
          )}
        </div>
      ))}
    </div>
  )
}

export default function PublicTrackPage() {
  const [params] = useSearchParams()
  const [input, setInput] = useState(params.get('code') ?? '')
  const [code, setCode]   = useState(params.get('code') ?? '')

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['public-track', code],
    queryFn: () => fetchTrack(code),
    enabled: code.length >= 4,
    retry: false,
    staleTime: 20_000,
  })

  const handleSearch = (e) => {
    e.preventDefault()
    setCode(input.trim().toUpperCase())
  }

  const markers = []
  if (data?.pickup_lat && data?.pickup_lng)
    markers.push({ lat: Number(data.pickup_lat), lng: Number(data.pickup_lng), color: '#FF5E14', label: 'P' })
  if (data?.dropoff_lat && data?.dropoff_lng)
    markers.push({ lat: Number(data.dropoff_lat), lng: Number(data.dropoff_lng), color: '#16A34A', label: 'D' })
  if (data?.rider_location?.lat && data?.rider_location?.lng)
    markers.push({ lat: Number(data.rider_location.lat), lng: Number(data.rider_location.lng), color: '#2563EB', type: 'bike' })

  const route = (data?.pickup_lat && data?.dropoff_lat)
    ? { pickup: { lat: Number(data.pickup_lat), lng: Number(data.pickup_lng) }, dropoff: { lat: Number(data.dropoff_lat), lng: Number(data.dropoff_lng) } }
    : null

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'inherit' }}>
      {/* Nav */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: '#FF5E14', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Package size={16} color="#fff" />
          </div>
          <span style={{ fontWeight: 800, fontSize: 18, color: '#111827' }}>SendTrack</span>
        </Link>
        <span style={{ color: '#9ca3af', fontSize: 13, marginLeft: 4 }}>/ Track your order</span>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 16px' }}>
        {/* Search bar */}
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 10, marginBottom: 32 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
            <input
              style={{
                width: '100%', boxSizing: 'border-box', paddingLeft: 42, paddingRight: 16, height: 48,
                border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: 15, fontWeight: 600,
                letterSpacing: '0.1em', outline: 'none', background: '#fff', textTransform: 'uppercase',
              }}
              placeholder="Enter tracking code e.g. X2UMKQ"
              value={input}
              onChange={e => setInput(e.target.value.toUpperCase())}
              maxLength={6}
            />
          </div>
          <button
            type="submit"
            style={{ padding: '0 24px', height: 48, background: '#FF5E14', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: 'pointer', flexShrink: 0 }}
          >
            Track
          </button>
        </form>

        {isLoading && (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <div style={{ width: 36, height: 36, border: '3px solid #e5e7eb', borderTopColor: '#FF5E14', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 12px' }} />
            <p style={{ color: '#6b7280', fontSize: 14 }}>Looking up your order…</p>
          </div>
        )}

        {isError && (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <AlertCircle size={40} color="#e5e7eb" style={{ marginBottom: 12 }} />
            <p style={{ color: '#6b7280', fontSize: 14 }}>
              {error?.response?.data?.error ?? 'No order found for that tracking code. Check and try again.'}
            </p>
          </div>
        )}

        {data && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Status card */}
            <div style={{ background: '#fff', borderRadius: 16, padding: '24px', border: '1px solid #e5e7eb', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <div style={{ fontSize: 12, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Tracking Code</div>
                  <div style={{ fontWeight: 800, fontSize: 22, letterSpacing: '0.12em', color: '#111827' }}>{data.tracking_code}</div>
                </div>
                {data.rider && (
                  <span className="badge" style={{ background: '#eff6ff', color: '#1d4ed8', fontWeight: 600, fontSize: 12, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Truck size={13} /> Rider assigned
                  </span>
                )}
              </div>
              <StatusStepper status={data.status} />
            </div>

            {/* Rider card */}
            {data.rider && (
              <div style={{ background: '#fff', borderRadius: 16, padding: 20, border: '1px solid #e5e7eb', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <div style={{ fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Your Rider</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  {data.rider.profile_photo_url ? (
                    <img src={data.rider.profile_photo_url} alt={data.rider.name} style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: '2px solid #e5e7eb', flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#FF5E14', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 24, flexShrink: 0 }}>
                      {data.rider.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 16, color: '#111827' }}>{data.rider.name}</div>
                    {data.rider.vehicle_color || data.rider.vehicle_make ? (
                      <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>
                        {[data.rider.vehicle_color, data.rider.vehicle_make, data.rider.vehicle_model].filter(Boolean).join(' ')}
                      </div>
                    ) : data.rider.vehicle_type ? (
                      <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>{data.rider.vehicle_type}</div>
                    ) : null}
                    {data.rider.total_deliveries > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
                        <Star size={11} fill="#f59e0b" color="#f59e0b" /> {data.rider.total_deliveries} deliveries
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
                  {/* Number plate */}
                  {data.rider.vehicle_plate && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#111827', color: '#fff', fontFamily: 'monospace', fontWeight: 800, fontSize: 14, letterSpacing: '0.18em', padding: '5px 14px', borderRadius: 6, border: '3px solid #fff', boxShadow: '0 0 0 2px #111827' }}>
                      {data.rider.vehicle_plate}
                    </div>
                  )}
                  {/* Call rider */}
                  {data.rider.phone && (
                    <a href={`tel:${data.rider.phone}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', borderRadius: 8, padding: '6px 14px', fontWeight: 600, fontSize: 13, textDecoration: 'none' }}>
                      <Phone size={13} /> {data.rider.phone}
                    </a>
                  )}
                </div>

                {/* Vehicle image */}
                {data.rider.vehicle_image_url && (
                  <img src={data.rider.vehicle_image_url} alt="Vehicle" style={{ width: '100%', borderRadius: 10, marginTop: 14, objectFit: 'cover', maxHeight: 160, border: '1px solid #e5e7eb' }} />
                )}
              </div>
            )}

            {/* Map */}
            {markers.length > 0 && (
              <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', border: '1px solid #e5e7eb', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <HereMap markers={markers} route={route} height="300px" zoom={13} />
                <div style={{ padding: '12px 16px', display: 'flex', gap: 16, fontSize: 12, flexWrap: 'wrap', borderTop: '1px solid #e5e7eb' }}>
                  {[['#FF5E14', 'P', 'Pickup'], ['#16A34A', 'D', 'Dropoff']].map(([color, letter, label]) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <div style={{ width: 18, height: 18, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 9, fontWeight: 700 }}>{letter}</div>
                      <span style={{ color: '#6b7280' }}>{label}</span>
                    </div>
                  ))}
                  {data.rider_location && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#1d4ed8', fontWeight: 600 }}>
                      <Navigation size={13} /> Rider (live)
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Route addresses */}
            <div style={{ background: '#fff', borderRadius: 16, padding: 20, border: '1px solid #e5e7eb', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { icon: <MapPin size={14} color="#FF5E14" />, label: 'Pickup', addr: data.pickup_address },
                { icon: <MapPin size={14} color="#16A34A" />, label: 'Dropoff', addr: data.dropoff_address },
              ].map(({ icon, label, addr }) => (
                <div key={label} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ marginTop: 2 }}>{icon}</div>
                  <div>
                    <div style={{ fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: '#111827', marginTop: 2 }}>{addr}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Event log */}
            {data.events?.length > 0 && (
              <div style={{ background: '#fff', borderRadius: 16, padding: 20, border: '1px solid #e5e7eb', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: '#111827', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Clock size={14} /> Status History
                </h3>
                <div style={{ borderLeft: '2px solid #e5e7eb', paddingLeft: 16, marginLeft: 4 }}>
                  {[...data.events].reverse().map((ev, i) => (
                    <div key={i} style={{ marginBottom: 14, position: 'relative' }}>
                      <div style={{ position: 'absolute', left: -21, top: 4, width: 8, height: 8, borderRadius: '50%', background: i === 0 ? '#FF5E14' : '#e5e7eb', border: '2px solid #fff' }} />
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{ev.label || ev.status?.replace(/_/g, ' ')}</div>
                      {ev.note && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{ev.note}</div>}
                      {ev.occurred_at && (
                        <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 3, display: 'flex', alignItems: 'center', gap: 3 }}>
                          <Clock size={9} /> {new Date(ev.occurred_at).toLocaleString()}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {!code && !isLoading && (
          <div style={{ textAlign: 'center', padding: '48px 16px' }}>
            <Package size={48} color="#e5e7eb" style={{ marginBottom: 16 }} />
            <p style={{ color: '#6b7280', fontSize: 14 }}>Enter your 6-character tracking code above to see your order status.</p>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
