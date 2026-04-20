import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../lib/api'
import echo from '../lib/echo'
import { useAuthStore } from '../store/authStore'
import { ChevronRight, Wifi, Package, MapPin, Clock, Star, Zap } from 'lucide-react'
import HereMap from '../components/HereMap'

const PKG_STATUS_COLORS = {
  delivered: 'badge-success', failed_delivery: 'badge-danger',
  in_transit: 'badge-primary', picked_up: 'badge-primary',
  assigned_to_rider: 'badge-warning', arrived_at_destination: 'badge-warning',
  created: 'badge-neutral', returned_to_sender: 'badge-neutral',
}

const ORDER_STATUS_COLORS = {
  completed: 'badge-success', cancelled: 'badge-danger',
  in_progress: 'badge-primary', assigned: 'badge-warning',
  awaiting_dispatch: 'badge-neutral', processing: 'badge-neutral',
}

export default function TrackingPage() {
  const { id }  = useParams()
  const { isAdmin, isVendor } = useAuthStore()
  const adminOrSuper = isAdmin()
  const vendor       = isVendor()
  const [liveRider, setLiveRider] = useState(null)

  const { data: order, isLoading } = useQuery({
    queryKey: ['order-track', id],
    queryFn: () => adminOrSuper
      ? api.get(`/admin/orders/${id}`).then(r => r.data.data)
      : api.get(`/orders/${id}`).then(r => r.data.data),
    refetchInterval: 30_000,
  })

  // Live rider location via WebSocket — admins only
  useEffect(() => {
    if (!order?.rider_id || !adminOrSuper) return
    const ch = echo.channel(`rider.${order.rider_id}`)
    ch.listen('.location.updated', (e) => {
      setLiveRider({ lat: e.latitude, lng: e.longitude, timestamp: e.timestamp })
    })
    return () => echo.leaveChannel(`rider.${order.rider_id}`)
  }, [order?.rider_id, adminOrSuper])

  if (isLoading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}><span className="spinner" /></div>
  if (!order)   return <p className="text-muted" style={{ padding: 32 }}>Order not found or access denied.</p>

  const riderProfile = order.rider?.rider_profile

  // Rider location only shown to admin
  const riderLat = adminOrSuper ? (liveRider?.lat ?? riderProfile?.current_lat) : null
  const riderLng = adminOrSuper ? (liveRider?.lng ?? riderProfile?.current_lng) : null
  const isLive   = !!liveRider

  // Map markers
  const markers = []
  if (order.pickup_lat  && order.pickup_lng)  markers.push({ lat: Number(order.pickup_lat),  lng: Number(order.pickup_lng),  color: '#FF5E14', label: 'P' })
  if (order.dropoff_lat && order.dropoff_lng) markers.push({ lat: Number(order.dropoff_lat), lng: Number(order.dropoff_lng), color: '#16A34A', label: 'D' })
  if (riderLat && riderLng)                  markers.push({ lat: Number(riderLat), lng: Number(riderLng), color: '#2563EB', type: 'bike' })

  const route = (order.pickup_lat && order.dropoff_lat)
    ? { pickup: { lat: Number(order.pickup_lat), lng: Number(order.pickup_lng) }, dropoff: { lat: Number(order.dropoff_lat), lng: Number(order.dropoff_lng) } }
    : null

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Link to="/orders" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Orders</Link>
            <ChevronRight size={12} />
            <Link to={`/orders/${id}`} style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>#{id}</Link>
            <ChevronRight size={12} />
            Tracking
          </div>
          <h1 className="page-title" style={{ margin: 0 }}>
            {adminOrSuper ? 'Rider & Package Tracking' : 'Package Tracking'} — Order #{id}
          </h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className={`badge ${ORDER_STATUS_COLORS[order.status] ?? 'badge-neutral'}`} style={{ fontSize: 12 }}>
            {order.status?.replace(/_/g, ' ')}
          </span>
          {adminOrSuper && order.rider_id && (
            isLive ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--success)', fontSize: 13, fontWeight: 600 }}>
                <Wifi size={14} color="var(--success)" /> Live
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-secondary)', fontSize: 13 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--warning)', animation: 'pulse 2s infinite' }} />
                Polling 30s
              </div>
            )
          )}
        </div>
      </div>

      {/* Map legend */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 12, fontSize: 12, flexWrap: 'wrap' }}>
        {[['#FF5E14','P','Pickup'], ['#16A34A','D','Dropoff']].map(([color, letter, label]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 10, fontWeight: 700 }}>{letter}</div>
            <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
          </div>
        ))}
        {riderLat && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <Zap size={11} fill="#fff" />
            </div>
            <span style={{ color: 'var(--text-secondary)' }}>Rider {isLive ? '(live)' : '(last known)'}</span>
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 24, height: 4, background: '#FF5E14', borderRadius: 2 }} />
          <span style={{ color: 'var(--text-secondary)' }}>Route</span>
        </div>
      </div>

      <div className="detail-grid">
        {/* Map */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <HereMap markers={markers} route={route} height="480px" zoom={13} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Route card */}
          <div className="card">
            <h3 style={{ marginBottom: 14, fontSize: 14 }}>Route</h3>
            {[
              { label: 'Pickup',  addr: order.pickup_address,  color: '#FF5E14' },
              { label: 'Dropoff', addr: order.dropoff_address, color: '#16A34A' },
            ].map(({ label, addr, color }) => (
              <div key={label} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, marginTop: 4, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                  <div style={{ fontSize: 13, fontWeight: 500, marginTop: 2 }}>{addr}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Rider card */}
          {order.rider ? (
            <div className="card">
              <h3 style={{ marginBottom: 12, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                Rider
                {adminOrSuper && isLive && <Wifi size={13} color="var(--success)" />}
              </h3>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 18, flexShrink: 0 }}>
                  {order.rider.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 600 }}>{order.rider.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{riderProfile?.vehicle_type ?? '—'}</div>
                </div>
              </div>

              {/* Admin: full stats + location */}
              {adminOrSuper && riderProfile && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                  {[
                    ['Status',     riderProfile.status?.replace(/_/g,' '), null],
                    ['Score',      riderProfile.reliability_score ?? '—', <Star size={12} color="var(--warning)" fill="var(--warning)" />],
                    ['Deliveries', riderProfile.total_deliveries ?? 0, null],
                    ['Vehicle',    riderProfile.vehicle_type ?? '—', null],
                  ].map(([label, val, icon]) => (
                    <div key={label} style={{ background: 'var(--surface-muted)', borderRadius: 8, padding: '8px 10px' }}>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 2 }}>{label}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>{icon}{val}</div>
                    </div>
                  ))}
                </div>
              )}
              {adminOrSuper && riderLat && (
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <MapPin size={12} />
                  {isLive
                    ? `Live · updated ${new Date(liveRider.timestamp).toLocaleTimeString()}`
                    : `Last seen · ${riderProfile?.last_seen_at ? new Date(riderProfile.last_seen_at).toLocaleTimeString() : '—'}`}
                </div>
              )}

              {/* Vendor: delivery progress steps only */}
              {vendor && (order.packages ?? []).length > 0 && (
                <div style={{ marginTop: 4 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Delivery Progress</div>
                  {(order.packages ?? []).map(pkg => {
                    const STEPS = ['assigned_to_rider', 'picked_up', 'in_transit', 'arrived_at_destination', 'delivered']
                    const LABELS = ['Assigned', 'Picked Up', 'In Transit', 'At Destination', 'Delivered']
                    const idx = STEPS.indexOf(pkg.status)
                    return (
                      <div key={pkg.id} style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>{pkg.name}</div>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          {STEPS.map((s, i) => (
                            <div key={s} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 0 }}>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                <div style={{
                                  width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                                  background: i <= idx ? 'var(--primary)' : 'var(--border)',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: 10, fontWeight: 700,
                                  color: i <= idx ? '#fff' : 'var(--text-secondary)',
                                }}>{i + 1}</div>
                                <div style={{ fontSize: 9, color: i <= idx ? 'var(--primary)' : 'var(--text-secondary)', whiteSpace: 'nowrap', fontWeight: i === idx ? 700 : 400 }}>
                                  {LABELS[i]}
                                </div>
                              </div>
                              {i < STEPS.length - 1 && (
                                <div style={{ flex: 1, height: 3, background: i < idx ? 'var(--primary)' : 'var(--border)', margin: '0 2px', marginBottom: 16 }} />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="card">
              <p className="text-muted text-sm">No rider assigned yet.</p>
            </div>
          )}

          {/* Packages with tracking events */}
          <div className="card">
            <h3 style={{ marginBottom: 14, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Package size={15} /> Packages
            </h3>
            {(order.packages ?? []).length === 0 && <p className="text-muted text-sm">No packages.</p>}
            {(order.packages ?? []).map((pkg, idx) => (
              <div key={pkg.id} style={{ marginBottom: idx < order.packages.length - 1 ? 20 : 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{pkg.name}</span>
                  <span className={`badge ${PKG_STATUS_COLORS[pkg.status] ?? 'badge-neutral'}`} style={{ fontSize: 10 }}>
                    {pkg.status?.replace(/_/g, ' ')}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  {pkg.category} · {pkg.weight_kg} kg
                </div>

                {/* Tracking timeline */}
                {(pkg.tracking_events ?? []).length > 0 ? (
                  <div style={{ borderLeft: '2px solid var(--border)', paddingLeft: 12, marginLeft: 4 }}>
                    {[...(pkg.tracking_events ?? [])].reverse().slice(0, 5).map(ev => (
                      <div key={ev.id} style={{ marginBottom: 8, position: 'relative' }}>
                        <div style={{ position: 'absolute', left: -17, top: 4, width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', border: '2px solid var(--surface)' }} />
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                          {ev.status?.replace(/_/g, ' ')}
                        </div>
                        {ev.notes && <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{ev.notes}</div>}
                        <div style={{ fontSize: 10, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 3, marginTop: 2 }}>
                          <Clock size={9} />
                          {new Date(ev.created_at).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>No events yet.</div>
                )}
              </div>
            ))}
          </div>

          {/* Dispatch attempts — admin only */}
          {adminOrSuper && (order.dispatch_attempts ?? []).length > 0 && (
            <div className="card">
              <h3 style={{ marginBottom: 12, fontSize: 14 }}>Dispatch Attempts</h3>
              {(order.dispatch_attempts ?? []).map(da => (
                <div key={da.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                  <div>
                    <span style={{ fontWeight: 600 }}>#{da.attempt_number}</span>
                    <span style={{ color: 'var(--text-secondary)', marginLeft: 8 }}>{da.rider?.name ?? '—'}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {da.distance_km && <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{da.distance_km} km</span>}
                    <span className={`badge ${da.outcome === 'accepted' ? 'badge-success' : da.outcome === 'rejected' ? 'badge-danger' : da.outcome === 'timeout' ? 'badge-warning' : 'badge-neutral'}`} style={{ fontSize: 10 }}>
                      {da.outcome}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
