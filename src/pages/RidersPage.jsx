import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import echo from '../lib/echo'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store/authStore'
import {
  Search, MapPin, Wifi, Star, CheckCircle, XCircle,
  Bike, Car, Truck, Zap, X, FileText, ExternalLink,
  AlertTriangle, User, Phone, Mail, Calendar, Hash,
  Shield, ChevronRight,
} from 'lucide-react'
import Select from '../components/Select'

// ── helpers ───────────────────────────────────────────────────────────────────

const STATUS_BADGE = {
  idle: 'badge-success', on_delivery: 'badge-primary',
  reserved: 'badge-warning', offline: 'badge-neutral',
}

const VEHICLE_ICONS = {
  bicycle:   <Bike  size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />,
  motorbike: <Zap   size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />,
  car:       <Car   size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />,
  van:       <Truck size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />,
}

function KycBadge({ status }) {
  const map = {
    approved:  { cls: 'badge-success', label: 'Approved' },
    submitted: { cls: 'badge-warning', label: 'Submitted' },
    rejected:  { cls: 'badge-danger',  label: 'Rejected' },
    pending:   { cls: 'badge-neutral', label: 'Pending' },
  }
  const { cls, label } = map[status] ?? map.pending
  return <span className={`badge ${cls}`}>{label}</span>
}

function DocLink({ label, url }) {
  if (!url) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: '#F7F7F7', borderRadius: 8, border: '1px dashed #E5E5E5' }}>
      <FileText size={14} color="#9B9B9B" />
      <span style={{ fontSize: 13, color: '#9B9B9B' }}>{label} — not uploaded</span>
    </div>
  )
  return (
    <a href={url} target="_blank" rel="noreferrer"
      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: '#F0FDF4', borderRadius: 8, border: '1px solid #BBF7D0', textDecoration: 'none', transition: 'background 0.15s' }}
      onMouseEnter={e => e.currentTarget.style.background = '#DCFCE7'}
      onMouseLeave={e => e.currentTarget.style.background = '#F0FDF4'}>
      <FileText size={14} color="#16A34A" />
      <span style={{ fontSize: 13, color: '#15803D', fontWeight: 500, flex: 1 }}>{label}</span>
      <ExternalLink size={12} color="#16A34A" />
    </a>
  )
}

function InfoRow({ icon: Icon, label, value }) {
  if (!value) return null
  return (
    <div style={{ display: 'flex', gap: 12, paddingBottom: 12, borderBottom: '1px solid #F5F5F5' }}>
      <div style={{ width: 32, height: 32, background: '#FFF0E8', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={14} color="var(--primary)" />
      </div>
      <div>
        <div style={{ fontSize: 11, color: '#9B9B9B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 14, color: '#0D0D0D' }}>{value}</div>
      </div>
    </div>
  )
}

// ── Rider Profile Drawer ──────────────────────────────────────────────────────

function RiderProfileDrawer({ riderId, onClose }) {
  const qc = useQueryClient()
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)

  const { data: r, isLoading } = useQuery({
    queryKey: ['rider-detail', riderId],
    queryFn: () => api.get(`/admin/users/${riderId}`).then(res => res.data.data),
    enabled: !!riderId,
  })

  const profile = r?.rider_profile

  const approve = useMutation({
    mutationFn: () => api.patch(`/admin/kyc/riders/${riderId}/approve`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['riders'] })
      qc.invalidateQueries({ queryKey: ['rider-detail', riderId] })
      toast.success('Rider KYC approved')
      setShowRejectForm(false)
    },
    onError: () => toast.error('Failed to approve'),
  })

  const reject = useMutation({
    mutationFn: () => api.patch(`/admin/kyc/riders/${riderId}/reject`, { reason: rejectReason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['riders'] })
      qc.invalidateQueries({ queryKey: ['rider-detail', riderId] })
      toast.success('Rider KYC rejected')
      setShowRejectForm(false)
      setRejectReason('')
    },
    onError: (err) => toast.error(err.response?.data?.message ?? 'Failed to reject'),
  })

  const canReview = profile && ['submitted', 'pending'].includes(profile.kyc_status)

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200 }} />
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 201,
        width: '100%', maxWidth: 560,
        background: '#fff', boxShadow: '-8px 0 40px rgba(0,0,0,0.15)',
        display: 'flex', flexDirection: 'column', overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, background: '#fff', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, background: '#FFF0E8', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={18} color="var(--primary)" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, fontFamily: 'var(--font-display)' }}>{r?.name ?? 'Rider Details'}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>KYC Review</div>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}><X size={18} /></button>
        </div>

        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><span className="spinner" /></div>
        ) : !r ? (
          <div style={{ padding: 24, color: 'var(--text-secondary)' }}>Rider not found.</div>
        ) : (
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* Status badges */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <KycBadge status={profile?.kyc_status ?? 'pending'} />
              {profile?.admin_approved && <span className="badge badge-success">Approved</span>}
              {profile?.vehicle_type && (
                <span className="badge badge-neutral" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  {VEHICLE_ICONS[profile.vehicle_type]}{profile.vehicle_type}
                </span>
              )}
            </div>

            {/* Rejection reason */}
            {profile?.kyc_status === 'rejected' && profile?.kyc_rejection_reason && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '12px 16px', display: 'flex', gap: 10 }}>
                <AlertTriangle size={16} color="#DC2626" style={{ flexShrink: 0, marginTop: 1 }} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#DC2626', marginBottom: 2 }}>Rejection Reason</div>
                  <div style={{ fontSize: 13, color: '#7F1D1D' }}>{profile.kyc_rejection_reason}</div>
                </div>
              </div>
            )}

            {/* Personal Information */}
            <section>
              <h4 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 14 }}>Personal Information</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <InfoRow icon={User}     label="Full Name"       value={r.name} />
                <InfoRow icon={Mail}     label="Email"           value={r.email} />
                <InfoRow icon={Phone}    label="Phone"           value={r.phone} />
                <InfoRow icon={Calendar} label="Date of Birth"   value={profile?.date_of_birth} />
                <InfoRow icon={MapPin}   label="Home Address"    value={profile?.home_address} />
                <InfoRow icon={Hash}     label="National ID No." value={profile?.national_id_number} />
              </div>
            </section>

            {/* Emergency Contact */}
            {(profile?.emergency_contact_name || profile?.emergency_contact_phone) && (
              <section>
                <h4 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 14 }}>Emergency Contact</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <InfoRow icon={User}  label="Name"  value={profile.emergency_contact_name} />
                  <InfoRow icon={Phone} label="Phone" value={profile.emergency_contact_phone} />
                </div>
              </section>
            )}

            {/* Vehicle Details */}
            {profile?.vehicle_type && (
              <section>
                <h4 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 14 }}>Vehicle Details</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <InfoRow icon={Truck}    label="Vehicle Type"    value={profile.vehicle_type} />
                  <InfoRow icon={Shield}   label="Make & Model"    value={[profile.vehicle_make, profile.vehicle_model].filter(Boolean).join(' ') || null} />
                  <InfoRow icon={Hash}     label="Plate Number"    value={profile.vehicle_plate} />
                  <InfoRow icon={Calendar} label="Year"            value={profile.vehicle_year?.toString()} />
                  <InfoRow icon={Hash}     label="Colour"          value={profile.vehicle_color} />
                  <InfoRow icon={Hash}     label="Licence No."     value={profile.license_number} />
                  <InfoRow icon={Calendar} label="Licence Expiry"  value={profile.license_expiry} />
                </div>
              </section>
            )}

            {/* Delivery Profile */}
            {(profile?.reliability_score !== undefined || profile?.max_weight_kg) && (
              <section>
                <h4 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 14 }}>Delivery Profile</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <InfoRow icon={Star}        label="Reliability Score" value={profile.reliability_score?.toString()} />
                  <InfoRow icon={Shield}      label="Max Weight"        value={profile.max_weight_kg ? `${profile.max_weight_kg} kg` : null} />
                  <InfoRow icon={CheckCircle} label="Fragile Capable"   value={profile.is_fragile_capable ? 'Yes' : 'No'} />
                </div>
              </section>
            )}

            {/* Documents */}
            <section>
              <h4 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 14 }}>Documents</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <DocLink label="National ID — Front"  url={profile?.national_id_front_url} />
                <DocLink label="National ID — Back"   url={profile?.national_id_back_url} />
                <DocLink label="Driver's Licence"     url={profile?.license_front_url} />
                <DocLink label="Vehicle Logbook"      url={profile?.logbook_url} />
                <DocLink label="Vehicle Photo"        url={profile?.vehicle_image_url} />
                <DocLink label="Selfie with ID"       url={profile?.selfie_url} />
              </div>
            </section>

            {/* KYC Actions */}
            {canReview && (
              <section style={{ borderTop: '1px solid var(--border)', paddingTop: 20 }}>
                <h4 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 14 }}>KYC Decision</h4>
                {showRejectForm ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>
                      Rejection reason <span style={{ color: 'var(--danger)' }}>*</span>
                    </label>
                    <textarea
                      className="form-control"
                      rows={3}
                      placeholder="Explain why this application is being rejected…"
                      value={rejectReason}
                      onChange={e => setRejectReason(e.target.value)}
                      style={{ resize: 'vertical' }}
                    />
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }}
                        onClick={() => { setShowRejectForm(false); setRejectReason('') }}>
                        Cancel
                      </button>
                      <button className="btn btn-danger" style={{ flex: 1, justifyContent: 'center' }}
                        disabled={!rejectReason.trim() || reject.isPending}
                        onClick={() => reject.mutate()}>
                        {reject.isPending ? <span className="spinner" /> : <><XCircle size={15} /> Confirm Reject</>}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center', border: '1px solid var(--danger)', color: 'var(--danger)' }}
                      onClick={() => setShowRejectForm(true)}>
                      <XCircle size={15} /> Reject
                    </button>
                    <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', background: 'var(--success)' }}
                      disabled={approve.isPending}
                      onClick={() => approve.mutate()}>
                      {approve.isPending ? <span className="spinner" /> : <><CheckCircle size={15} /> Approve</>}
                    </button>
                  </div>
                )}
              </section>
            )}

            {profile?.kyc_status === 'approved' && (
              <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, padding: '12px 16px', display: 'flex', gap: 10, alignItems: 'center' }}>
                <CheckCircle size={16} color="#16A34A" />
                <span style={{ fontSize: 13, color: '#15803D', fontWeight: 500 }}>KYC approved — rider is active</span>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}

// ── Rider Card (non-admin / vendor view) ──────────────────────────────────────

function RiderCard({ rider, liveData }) {
  const profile = rider.rider_profile ?? rider
  const live = liveData ?? {}

  const isOnline = live.is_online ?? profile?.is_online
  const status   = live.status    ?? profile?.status
  const lat      = live.lat       ?? profile?.current_lat
  const lng      = live.lng       ?? profile?.current_lng
  const lastSeen = live.timestamp ? new Date(live.timestamp) : (profile?.last_seen_at ? new Date(profile.last_seen_at) : null)
  const hasLive  = !!live.is_online !== undefined && live.timestamp

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
        {hasLive && <Wifi size={13} color="var(--success)" title="Live data" style={{ flexShrink: 0 }} />}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span className={`badge ${STATUS_BADGE[status] ?? 'badge-neutral'}`}>{status ?? 'unknown'}</span>
        <span style={{ fontSize: 12, color: isOnline ? 'var(--success)' : 'var(--text-secondary)', display: 'flex', gap: 4, alignItems: 'center' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: isOnline ? 'var(--success)' : 'var(--border)', display: 'inline-block', animation: isOnline ? 'pulse 2s infinite' : 'none' }} />
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
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function RidersPage() {
  const { isAdmin } = useAuthStore()
  const qc = useQueryClient()
  const [search, setSearch]           = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [kycFilter, setKycFilter]     = useState('')
  const [drawerRiderId, setDrawerRiderId] = useState(null)
  const [liveMap, setLiveMap]         = useState({})
  const channelsRef = useRef([])
  const admin = isAdmin()

  const { data, isLoading, error } = useQuery({
    queryKey: ['riders', admin],
    queryFn: () => admin
      ? api.get('/admin/users?role=rider').then(r => r.data.data)
      : api.get('/riders/available').then(r => r.data.data),
    refetchInterval: 60_000,
  })

  useEffect(() => {
    const ch = echo.channel('riders')
    ch.listen('.status.updated', (e) => {
      setLiveMap(prev => ({ ...prev, [e.rider_id]: { ...prev[e.rider_id], ...e } }))
      if (e.is_online) qc.invalidateQueries(['riders'])
    })
    channelsRef.current.push(ch)
    return () => { echo.leaveChannel('riders') }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const raw = data?.data ?? data ?? []
    channelsRef.current.forEach(ch => {
      if (ch.name?.startsWith('rider.')) echo.leaveChannel(ch.name)
    })
    raw.forEach(rider => {
      const riderId = rider.id ?? rider.user_id
      if (!riderId) return
      const ch = echo.channel(`rider.${riderId}`)
      ch.listen('.location.updated', (e) => {
        setLiveMap(prev => ({ ...prev, [riderId]: { ...prev[riderId], lat: e.latitude, lng: e.longitude, timestamp: e.timestamp } }))
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

  const raw = data?.data ?? data ?? []

  const riders = raw.filter(r => {
    const profile = r.rider_profile ?? r
    const live = liveMap[r.id ?? r.user_id] ?? {}
    const name = r.name ?? r.user?.name ?? ''
    const effectiveStatus = live.status ?? profile?.status
    const matchSearch = !search || name.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || effectiveStatus === statusFilter
    const matchKyc    = !kycFilter  || (profile?.kyc_status ?? 'pending') === kycFilter
    return matchSearch && matchStatus && matchKyc
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
        <div style={{ position: 'relative', flex: 1, minWidth: 180, maxWidth: 300 }}>
          <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input className="form-control" style={{ paddingLeft: 32 }} placeholder="Search riders…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {admin ? (
          <select className="form-control" style={{ width: 'auto' }} value={kycFilter} onChange={e => setKycFilter(e.target.value)}>
            <option value="">All KYC statuses</option>
            <option value="pending">Pending</option>
            <option value="submitted">Submitted</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        ) : (
          <Select
            style={{ width: 170 }}
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            options={[
              { value: 'all',         label: 'All Statuses' },
              { value: 'idle',        label: 'Available' },
              { value: 'on_delivery', label: 'On Delivery' },
              { value: 'reserved',    label: 'Reserved' },
              { value: 'offline',     label: 'Offline' },
            ]}
          />
        )}
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}><span className="spinner" /></div>
      ) : error ? (
        <div className="card">
          <p className="text-muted text-sm">Failed to load riders — {error.response?.data?.error ?? error.message}</p>
        </div>
      ) : riders.length === 0 ? (
        <div className="card">
          <p className="text-muted text-sm">{admin ? 'No riders registered yet.' : 'No riders available right now.'}</p>
        </div>
      ) : admin ? (

        // ── Admin: table view (like vendors) ─────────────────────────────────
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Rider</th>
                  <th>Contact</th>
                  <th>Vehicle</th>
                  <th>KYC</th>
                  <th>Status</th>
                  <th>Score</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {riders.map(rider => {
                  const profile = rider.rider_profile ?? rider
                  const live = liveMap[rider.id ?? rider.user_id] ?? {}
                  const isOnline = live.is_online ?? profile?.is_online
                  const status   = live.status    ?? profile?.status
                  return (
                    <tr key={rider.id} style={{ cursor: 'pointer' }} onClick={() => setDrawerRiderId(rider.id)}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 34, height: 34, background: '#FFF0E8', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 700, color: 'var(--primary)', fontSize: 14 }}>
                            {rider.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 14 }}>{rider.name}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{rider.phone ?? '—'}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: 13 }}>{rider.email}</div>
                      </td>
                      <td>
                        {profile?.vehicle_type ? (
                          <span style={{ display: 'flex', alignItems: 'center', fontSize: 13 }}>
                            {VEHICLE_ICONS[profile.vehicle_type]}{profile.vehicle_type}
                          </span>
                        ) : <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>—</span>}
                      </td>
                      <td><KycBadge status={profile?.kyc_status ?? 'pending'} /></td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ width: 7, height: 7, borderRadius: '50%', background: isOnline ? 'var(--success)' : 'var(--border)', display: 'inline-block', flexShrink: 0, animation: isOnline ? 'pulse 2s infinite' : 'none' }} />
                          <span className={`badge ${STATUS_BADGE[status] ?? 'badge-neutral'}`}>{status ?? 'offline'}</span>
                        </div>
                      </td>
                      <td>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
                          <Star size={12} color="var(--warning)" />
                          {profile?.reliability_score ?? '—'}
                        </span>
                      </td>
                      <td onClick={e => e.stopPropagation()}>
                        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--primary)' }} onClick={() => setDrawerRiderId(rider.id)}>
                          View <ChevronRight size={13} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

      ) : (

        // ── Vendor / non-admin: card grid ─────────────────────────────────────
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
          {riders.map(rider => (
            <RiderCard
              key={rider.id ?? rider.rider_id}
              rider={rider}
              liveData={liveMap[rider.id ?? rider.user_id]}
            />
          ))}
        </div>

      )}

      {drawerRiderId && (
        <RiderProfileDrawer riderId={drawerRiderId} onClose={() => setDrawerRiderId(null)} />
      )}
    </div>
  )
}
