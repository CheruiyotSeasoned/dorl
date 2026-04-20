import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '../lib/api'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store/authStore'
import { Power, MapPin, Navigation, Package, Star, Clock, ChevronRight, Wifi, WifiOff, Bell, Sun, CheckCircle, AlertTriangle } from 'lucide-react'
import HereMap from '../components/HereMap'
import { useRiderPWA } from '../hooks/useRiderPWA'
import AppDownloadBanner from '../components/AppDownloadBanner'

const PKG_STATUS = {
  assigned_to_rider: { next: 'picked_up',              label: 'Confirm Pickup',   color: 'var(--warning)' },
  picked_up:         { next: 'in_transit',              label: 'Start Transit',    color: 'var(--primary)' },
  in_transit:        { next: 'arrived_at_destination',  label: 'Arrived',          color: 'var(--primary)' },
  arrived_at_destination: { next: 'delivered',          label: 'Mark Delivered',   color: 'var(--success)' },
}

function StatusStep({ status }) {
  const steps = ['assigned_to_rider', 'picked_up', 'in_transit', 'arrived_at_destination', 'delivered']
  const idx = steps.indexOf(status)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 16, overflowX: 'auto' }}>
      {steps.map((s, i) => (
        <div key={s} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : 0 }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
            background: i <= idx ? 'var(--primary)' : 'var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700, color: i <= idx ? '#fff' : 'var(--text-secondary)',
          }}>{i + 1}</div>
          {i < steps.length - 1 && (
            <div style={{ flex: 1, height: 3, background: i < idx ? 'var(--primary)' : 'var(--border)', minWidth: 16 }} />
          )}
        </div>
      ))}
    </div>
  )
}

export default function RiderDashboardPage() {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const [isOnline, setIsOnline] = useState(false)
  const [myPos, setMyPos] = useState(null)
  const [locationError, setLocationError] = useState(null)
  const watchRef = useRef(null)
  const sendIntervalRef = useRef(null)

  // Fetch rider profile (online status, score, etc.)
  const { data: profile } = useQuery({
    queryKey: ['rider-profile'],
    queryFn: () => api.get('/auth/me').then(r => r.data.data),
  })

  // Fetch active delivery
  const { data: deliveries } = useQuery({
    queryKey: ['rider-active'],
    queryFn: () => api.get('/rider/deliveries').then(r => r.data.data),
    refetchInterval: 20_000,
  })

  const active = (deliveries?.data ?? deliveries ?? []).find(
    d => ['assigned', 'in_progress'].includes(d.status)
  )

  // Sync online state from profile
  useEffect(() => {
    if (profile?.rider_profile) setIsOnline(profile.rider_profile.is_online)
  }, [profile])

  const toggleOnline = useMutation({
    mutationFn: (online) => api.patch('/rider/status', { is_online: online }),
    onSuccess: (_, online) => {
      setIsOnline(online)
      toast.success(online ? 'You are now online — waiting for deliveries' : 'You are now offline')
      qc.invalidateQueries(['rider-profile'])
    },
    onError: (err) => toast.error(err.response?.data?.error ?? 'Status update failed'),
  })

  // GPS: watch position continuously; send cached position every 15s, heartbeat as fallback
  const lastPosRef = useRef(null)

  useEffect(() => {
    if (!isOnline) {
      if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current)
      clearInterval(sendIntervalRef.current)
      lastPosRef.current = null
      return
    }

    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported by your browser')
      // Still send heartbeats so dispatcher can see this rider
      sendIntervalRef.current = setInterval(() => api.post('/rider/heartbeat').catch(() => {}), 30_000)
      return
    }

    // watchPosition caches the latest fix — no waiting for a new fix on each tick
    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        lastPosRef.current = pos
        setMyPos({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLocationError(null)
      },
      (err) => setLocationError(`GPS: ${err.message}`),
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 15_000 }
    )

    const tick = () => {
      if (lastPosRef.current) {
        // Send last known position — never blocks waiting for a new GPS fix
        api.post('/rider/location', {
          latitude:  lastPosRef.current.coords.latitude,
          longitude: lastPosRef.current.coords.longitude,
          speed:     lastPosRef.current.coords.speed,
          heading:   lastPosRef.current.coords.heading,
        }).catch(() => {})
      } else {
        // No GPS fix yet — send a heartbeat so last_seen_at stays fresh
        api.post('/rider/heartbeat').catch(() => {})
      }
    }

    tick()
    sendIntervalRef.current = setInterval(tick, 15_000)

    return () => {
      if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current)
      clearInterval(sendIntervalRef.current)
    }
  }, [isOnline])

  const updatePackageStatus = useMutation({
    mutationFn: ({ pkgId, status }) => api.patch(`/packages/${pkgId}/status`, { status }),
    onSuccess: () => { toast.success('Status updated'); qc.invalidateQueries(['rider-active']) },
    onError: (err) => toast.error(err.response?.data?.error ?? 'Update failed'),
  })

  const { pushGranted, wakeLockActive, requestPushPermission } = useRiderPWA(isOnline)

  const rp = profile?.rider_profile
  const stats = [
    { label: 'Reliability', value: `${rp?.reliability_score ?? '—'} / 5`, icon: <Star size={14} color="var(--warning)" fill="var(--warning)" />, color: 'var(--warning)' },
    { label: 'Vehicle',     value: rp?.vehicle_type ?? '—', icon: null },
    { label: 'Approved',    value: rp?.admin_approved ? 'Approved' : 'Pending',
      icon: rp?.admin_approved ? <CheckCircle size={14} color="var(--success)" /> : <Clock size={14} color="var(--warning)" />,
      color: rp?.admin_approved ? 'var(--success)' : 'var(--warning)' },
  ]

  const markers = []
  if (active?.pickup_lat)  markers.push({ lat: Number(active.pickup_lat),  lng: Number(active.pickup_lng),  color: '#FF5E14', label: 'P' })
  if (active?.dropoff_lat) markers.push({ lat: Number(active.dropoff_lat), lng: Number(active.dropoff_lng), color: '#16A34A', label: 'D' })
  if (myPos) markers.push({ lat: myPos.lat, lng: myPos.lng, color: '#2563EB', label: 'Me' })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <AppDownloadBanner role="rider" />
      {/* Header with online toggle */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Rider Dashboard</h1>
          <p className="text-sm text-muted">Hello, {user?.name}</p>
        </div>
        <button
          className="btn"
          style={{
            background: isOnline ? 'var(--success)' : 'var(--surface-muted)',
            color: isOnline ? '#fff' : 'var(--text-primary)',
            border: `2px solid ${isOnline ? 'var(--success)' : 'var(--border)'}`,
            fontSize: 15, padding: '10px 20px',
            animation: isOnline ? 'none' : undefined,
          }}
          onClick={() => toggleOnline.mutate(!isOnline)}
          disabled={toggleOnline.isPending}
        >
          <Power size={17} />
          {toggleOnline.isPending ? 'Updating…' : isOnline ? 'Online' : 'Go Online'}
        </button>
      </div>

      {/* Permission banners */}
      {!pushGranted && (
        <div style={{ background: '#FFF7ED', border: '1px solid #FDBA74', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Bell size={18} color="#EA580C" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: '#9A3412' }}>Enable push notifications</div>
            <div style={{ fontSize: 13, color: '#C2410C' }}>Get dispatch offers even when the app is in the background</div>
          </div>
          <button className="btn btn-sm" style={{ background: '#EA580C', color: '#fff', flexShrink: 0 }} onClick={async () => {
            const ok = await requestPushPermission()
            if (ok) toast.success('Push notifications enabled!')
            else toast.error('Notifications blocked — check browser settings')
          }}>Enable</button>
        </div>
      )}

      {locationError && (
        <div style={{ background: '#FFF1F2', border: '1px solid #FECDD3', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <MapPin size={18} color="#E11D48" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: '#9F1239' }}>Location access needed</div>
            <div style={{ fontSize: 13, color: '#BE123C' }}>{locationError}</div>
          </div>
        </div>
      )}

      {/* Status banner */}
      <div className="card" style={{
        background: isOnline ? 'linear-gradient(135deg, #16a34a18, #16a34a08)' : 'var(--surface-muted)',
        border: `1px solid ${isOnline ? '#16a34a40' : 'var(--border)'}`,
        display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px',
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: '50%',
          background: isOnline ? '#16a34a20' : 'var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          {isOnline
            ? <Wifi size={22} color="var(--success)" />
            : <WifiOff size={22} color="var(--text-secondary)" />}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: isOnline ? 'var(--success)' : 'var(--text-secondary)' }}>
            {isOnline ? 'You are online' : 'You are offline'}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
            {isOnline
              ? locationError
                ? <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--danger)' }}><AlertTriangle size={12} />{locationError}</span>
                : myPos
                  ? `GPS active · ${myPos.lat.toFixed(4)}, ${myPos.lng.toFixed(4)}`
                  : 'Acquiring GPS…'
              : 'Go online to receive delivery offers'}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
          {isOnline && myPos && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--success)' }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--success)', animation: 'pulse 2s infinite' }} />
              GPS Live
            </div>
          )}
          {wakeLockActive && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#F59E0B' }}>
              <Sun size={13} color="#F59E0B" /> Screen On
            </div>
          )}
          {pushGranted && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-secondary)' }}>
              <Bell size={13} /> Push On
            </div>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {stats.map(({ label, value, icon, color }) => (
          <div key={label} className="card" style={{ padding: '14px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{label}</div>
            <div style={{ fontWeight: 700, fontSize: 15, color: color ?? 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>{icon}{value}</div>
          </div>
        ))}
      </div>

      {/* Active delivery */}
      {active ? (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0 }}>Active Delivery</h3>
            <Link to={`/orders/${active.id}`} style={{ fontSize: 13, color: 'var(--primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
              Details <ChevronRight size={14} />
            </Link>
          </div>

          {/* Progress steps */}
          {active.packages?.map(pkg => (
            <div key={pkg.id} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{pkg.name}</span>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{pkg.status?.replace(/_/g, ' ')}</span>
              </div>
              <StatusStep status={pkg.status} />
              {PKG_STATUS[pkg.status] && (
                <button
                  className="btn btn-sm"
                  style={{ background: PKG_STATUS[pkg.status].color, color: '#fff', border: 'none', width: '100%', justifyContent: 'center' }}
                  onClick={() => updatePackageStatus.mutate({ pkgId: pkg.id, status: PKG_STATUS[pkg.status].next })}
                  disabled={updatePackageStatus.isPending}
                >
                  {updatePackageStatus.isPending ? <span className="spinner" /> : PKG_STATUS[pkg.status].label}
                </button>
              )}
            </div>
          ))}

          {/* Route addresses */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
            {[
              { label: 'Pickup',  addr: active.pickup_address,  color: '#FF5E14', icon: MapPin },
              { label: 'Dropoff', addr: active.dropoff_address, color: '#16A34A', icon: Navigation },
            ].map(({ label, addr, color, icon: Icon }) => (
              <div key={label} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <Icon size={15} color={color} style={{ marginTop: 2, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{label}</div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{addr}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Map */}
          {markers.length > 0 && (
            <div style={{ marginTop: 16, borderRadius: 10, overflow: 'hidden' }}>
              <HereMap markers={markers} height="220px" zoom={13} />
            </div>
          )}
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '40px 24px' }}>
          <Package size={40} color="var(--border)" style={{ marginBottom: 12 }} />
          <div style={{ fontWeight: 600, marginBottom: 6 }}>No active delivery</div>
          <p className="text-muted text-sm">
            {isOnline ? 'Waiting for a dispatch offer…' : 'Go online to start receiving offers.'}
          </p>
          <Link to="/rider/deliveries" style={{ fontSize: 13, color: 'var(--primary)', textDecoration: 'none', marginTop: 10, display: 'inline-block' }}>
            View delivery history <ChevronRight size={13} style={{ verticalAlign: 'middle' }} />
          </Link>
        </div>
      )}
    </div>
  )
}
