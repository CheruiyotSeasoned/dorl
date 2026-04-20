import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import echo from '../lib/echo'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store/authStore'
import { Search, MapPin, UserCheck, Wifi, Star, CheckCircle, XCircle, Bike, Car, Truck, Zap } from 'lucide-react'
import Select from '../components/Select'

const STATUS_BADGE = {
  idle: 'badge-success', on_delivery: 'badge-primary',
  reserved: 'badge-warning', offline: 'badge-neutral',
}

const VEHICLE_ICONS = {
  bicycle:   <Bike size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />,
  motorbike: <Zap  size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />,
  car:       <Car  size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />,
  van:       <Truck size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />,
}

function RiderCard({ rider, liveData, isAdmin, onApprove }) {
  const profile = rider.rider_profile ?? rider
  const live = liveData ?? {}

  const isOnline  = live.is_online  ?? profile?.is_online
  const status    = live.status     ?? profile?.status
  const lat       = live.lat        ?? profile?.current_lat
  const lng       = live.lng        ?? profile?.current_lng
  const lastSeen  = live.timestamp  ? new Date(live.timestamp) : (profile?.last_seen_at ? new Date(profile.last_seen_at) : null)
  const hasLive   = !!live.is_online !== undefined && live.timestamp

  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 14 }}>
        <div style={{ width: 46, height: 46, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 18, flexShrink: 0 }}>
          {(rider.name ?? rider.user?.name)?.charAt(0).toUpperCase()}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {rider.name ?? rider.user?.name}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {rider.email ?? rider.user?.email}
          </div>
        </div>
        {hasLive && (
          <Wifi size={13} color="var(--success)" title="Live data" style={{ flexShrink: 0 }} />
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span className={`badge ${STATUS_BADGE[status] ?? 'badge-neutral'}`}>
          {status ?? 'unknown'}
        </span>
        <span style={{ fontSize: 12, color: isOnline ? 'var(--success)' : 'var(--text-secondary)', display: 'flex', gap: 4, alignItems: 'center' }}>
          <span style={{
            width: 8, height: 8, borderRadius: '50%',
            background: isOnline ? 'var(--success)' : 'var(--border)',
            display: 'inline-block',
            animation: isOnline ? 'pulse 2s infinite' : 'none',
          }} />
          {isOnline ? 'Online' : 'Offline'}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 13 }}>
        {[
          ['Vehicle', profile?.vehicle_type ?? '—', VEHICLE_ICONS[profile?.vehicle_type]],
          ['Score',   profile?.reliability_score ?? '—', <Star size={12} color="var(--warning)" style={{ verticalAlign: 'middle' }} />],
          ['Max kg',  profile?.max_weight_kg ? `${profile.max_weight_kg} kg` : '—', null],
          ['Fragile', profile?.is_fragile_capable ? 'Yes' : 'No', profile?.is_fragile_capable
            ? <CheckCircle size={12} color="var(--success)" style={{ verticalAlign: 'middle' }} />
            : <XCircle    size={12} color="var(--text-secondary)" style={{ verticalAlign: 'middle' }} />],
        ].map(([label, val, icon]) => (
          <div key={label} style={{ background: 'var(--surface-muted)', borderRadius: 8, padding: '6px 10px' }}>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 1 }}>{label}</div>
            <div style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>{icon}{val}</div>
          </div>
        ))}
      </div>

      {lat && (
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 10, fontSize: 12, color: 'var(--text-secondary)' }}>
          <MapPin size={12} />
          {Number(lat).toFixed(4)}, {Number(lng).toFixed(4)}
          {lastSeen && <span style={{ marginLeft: 4 }}>· {lastSeen.toLocaleTimeString()}</span>}
        </div>
      )}

      {isAdmin && !profile?.admin_approved && (
        <button
          className="btn btn-primary btn-sm"
          style={{ width: '100%', justifyContent: 'center', marginTop: 12 }}
          onClick={() => onApprove(rider.id)}
        >
          <UserCheck size={14} /> Approve Rider
        </button>
      )}
    </div>
  )
}

export default function RidersPage() {
  const { isAdmin } = useAuthStore()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [liveMap, setLiveMap] = useState({}) // { riderId: { is_online, status, lat, lng, timestamp } }
  const channelsRef = useRef([])
  const admin = isAdmin()

  const { data, isLoading, error } = useQuery({
    queryKey: ['riders', admin],
    queryFn: () => admin
      ? api.get('/admin/users?role=rider').then(r => r.data.data)
      : api.get('/riders/available').then(r => r.data.data),
    refetchInterval: 60_000, // less aggressive now — WebSocket handles live updates
  })

  // Subscribe to the global riders channel for availability changes
  useEffect(() => {
    const ch = echo.channel('riders')
    ch.listen('.status.updated', (e) => {
      setLiveMap(prev => ({ ...prev, [e.rider_id]: { ...prev[e.rider_id], ...e } }))
      // Refetch the list when a rider comes online so new riders appear
      if (e.is_online) qc.invalidateQueries(['riders'])
    })
    channelsRef.current.push(ch)
    return () => { echo.leaveChannel('riders') }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Subscribe to each rider's individual location channel
  useEffect(() => {
    const raw = data?.data ?? data ?? []
    // Leave old individual channels
    channelsRef.current.forEach(ch => {
      if (ch.name?.startsWith('rider.')) echo.leaveChannel(ch.name)
    })

    raw.forEach(rider => {
      const riderId = rider.id ?? rider.user_id
      if (!riderId) return
      const ch = echo.channel(`rider.${riderId}`)
      ch.listen('.location.updated', (e) => {
        setLiveMap(prev => ({
          ...prev,
          [riderId]: { ...prev[riderId], lat: e.latitude, lng: e.longitude, timestamp: e.timestamp },
        }))
      })
      channelsRef.current.push(ch)
    })

    return () => {
      const raw2 = data?.data ?? data ?? []
      raw2.forEach(rider => {
        const riderId = rider.id ?? rider.user_id
        if (riderId) echo.leaveChannel(`rider.${riderId}`)
      })
    }
  }, [data]) // eslint-disable-line react-hooks/exhaustive-deps

  const approveRider = useMutation({
    mutationFn: (id) => api.patch(`/admin/users/${id}/approve`),
    onSuccess: () => { toast.success('Rider approved'); qc.invalidateQueries(['riders']) },
    onError: (err) => toast.error(err.response?.data?.error ?? 'Approval failed'),
  })

  const raw = data?.data ?? data ?? []

  const riders = raw.filter(r => {
    const profile = r.rider_profile ?? r
    const live = liveMap[r.id ?? r.user_id] ?? {}
    const name = r.name ?? r.user?.name ?? ''
    const effectiveStatus = live.status ?? profile?.status
    const matchStatus = statusFilter === 'all' || effectiveStatus === statusFilter
    const matchSearch = !search || name.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  const onlineCount = raw.filter(r => {
    const live = liveMap[r.id ?? r.user_id]
    const profile = r.rider_profile ?? r
    return live ? live.is_online : profile?.is_online
  }).length

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Riders</h1>
          <p className="text-sm text-muted" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {admin ? 'All registered riders' : 'Available riders right now'}
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--success)', display: 'inline-block', animation: 'pulse 2s infinite' }} />
              <strong style={{ color: 'var(--success)' }}>{onlineCount} online</strong>
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--text-secondary)', fontSize: 12 }}>
              <Wifi size={11} /> live
            </span>
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 180, maxWidth: 280 }}>
          <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input className="form-control" style={{ paddingLeft: 32 }} placeholder="Search riders…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select
          style={{ width: 170 }}
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          options={[
            { value: 'all', label: 'All Statuses' },
            { value: 'idle', label: 'Available' },
            { value: 'on_delivery', label: 'On Delivery' },
            { value: 'reserved', label: 'Reserved' },
            { value: 'offline', label: 'Offline' },
          ]}
        />
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}><span className="spinner" /></div>
      ) : error ? (
        <div className="card">
          <p className="text-muted text-sm">Failed to load riders — {error.response?.data?.error ?? error.message}</p>
        </div>
      ) : riders.length === 0 ? (
        <div className="card">
          <p className="text-muted text-sm">
            {admin ? 'No riders registered yet.' : 'No riders available right now.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
          {riders.map(rider => (
            <RiderCard
              key={rider.id ?? rider.rider_id}
              rider={rider}
              liveData={liveMap[rider.id ?? rider.user_id]}
              isAdmin={admin}
              onApprove={approveRider.mutate}
            />
          ))}
        </div>
      )}
    </div>
  )
}
