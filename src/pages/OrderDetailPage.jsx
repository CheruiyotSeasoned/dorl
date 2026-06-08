import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store/authStore'
import { Package, MapPin, ChevronRight, X, AlertTriangle, Map, FileText, Zap, UserCheck, Bike, Star, Phone, User, Building2, Warehouse, CalendarClock, Truck, Printer } from 'lucide-react'
import HereMap from '../components/HereMap'
import Select from '../components/Select'
import RiderPackageActions from '../components/RiderPackageActions'

const STATUS_COLORS = {
  completed: 'badge-success', cancelled: 'badge-danger',
  in_progress: 'badge-primary', assigned: 'badge-warning',
  awaiting_dispatch: 'badge-neutral', created: 'badge-neutral', processing: 'badge-neutral',
  awaiting_collection: 'badge-warning', at_hub: 'badge-primary', in_slot: 'badge-primary',
}

const OUTCOME_COLORS = {
  accepted: 'badge-success', rejected: 'badge-danger',
  timeout: 'badge-warning', pending: 'badge-neutral',
}

function StatusBadge({ status }) {
  return <span className={`badge ${STATUS_COLORS[status] ?? 'badge-neutral'}`}>{status?.replace(/_/g, ' ')}</span>
}

function Timeline({ events }) {
  if (!events?.length) return <p className="text-muted text-sm">No events yet.</p>
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {events.map((ev, i) => (
        <div key={ev.id} style={{ display: 'flex', gap: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: i === 0 ? 'var(--primary)' : 'var(--border)', marginTop: 4, flexShrink: 0 }} />
            {i < events.length - 1 && <div style={{ width: 2, flex: 1, background: 'var(--border)', margin: '4px 0' }} />}
          </div>
          <div style={{ paddingBottom: 16 }}>
            <div style={{ fontWeight: 600, fontSize: 13 }}>{ev.to_status?.replace(/_/g, ' ')}</div>
            {ev.notes && <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{ev.notes}</div>}
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{new Date(ev.occurred_at ?? ev.created_at).toLocaleString()}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

function CancelModal({ onConfirm, onClose, loading }) {
  const [reason, setReason] = useState('')
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div className="card" style={{ width: 420, margin: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <AlertTriangle size={20} color="var(--danger)" />
          <h3 style={{ margin: 0 }}>Cancel Order</h3>
        </div>
        <p className="text-sm text-muted" style={{ marginBottom: 16 }}>This action cannot be undone.</p>
        <div className="form-group">
          <label className="form-label">Reason (optional)</label>
          <input className="form-control" value={reason} onChange={e => setReason(e.target.value)} placeholder="Why are you cancelling?" />
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>Keep Order</button>
          <button className="btn btn-sm" style={{ background: 'var(--danger)', color: '#fff', border: 'none' }} onClick={() => onConfirm(reason)} disabled={loading}>
            {loading ? <span className="spinner" /> : 'Cancel Order'}
          </button>
        </div>
      </div>
    </div>
  )
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function ManualAssignModal({ orderId, pickupLat, pickupLng, onClose, onSuccess }) {
  const [riderId, setRiderId] = useState('')
  const [reason, setReason] = useState('')

  const { data: ridersData, isFetching } = useQuery({
    queryKey: ['riders-available-live'],
    queryFn: () => api.get('/admin/users?role=rider').then(r => r.data.data),
    staleTime: 0,
    refetchOnMount: 'always',
    refetchInterval: 15_000,
  })

  const rawRiders = (ridersData?.data ?? ridersData ?? []).filter(r => {
    const p = r.rider_profile
    return p?.admin_approved && p?.is_online && (p?.status === 'idle' || p?.status === 'online')
  })

  // Sort by distance from pickup if coordinates available
  const riders = [...rawRiders].sort((a, b) => {
    if (!pickupLat || !pickupLng) return 0
    const aLat = a.rider_profile?.current_lat, aLng = a.rider_profile?.current_lng
    const bLat = b.rider_profile?.current_lat, bLng = b.rider_profile?.current_lng
    if (!aLat || !bLat) return 0
    return haversineKm(pickupLat, pickupLng, aLat, aLng) - haversineKm(pickupLat, pickupLng, bLat, bLng)
  })

  const selectedRider = riders.find(r => String(r.id) === String(riderId))

  // Build map markers: pickup + all online riders + highlight selected
  const mapMarkers = []
  if (pickupLat && pickupLng) {
    mapMarkers.push({ lat: Number(pickupLat), lng: Number(pickupLng), label: 'P', color: '#FF5E14' })
  }
  riders.forEach(r => {
    const lat = r.rider_profile?.current_lat
    const lng = r.rider_profile?.current_lng
    if (!lat || !lng) return
    const isSelected = String(r.id) === String(riderId)
    mapMarkers.push({ lat: Number(lat), lng: Number(lng), color: isSelected ? '#16A34A' : '#2563EB', type: 'bike' })
  })

  const assign = useMutation({
    mutationFn: () => api.patch(`/admin/orders/${orderId}/assign-rider`, { rider_id: Number(riderId), reason }),
    onSuccess: () => { toast.success('Rider assigned'); onSuccess() },
    onError: (err) => toast.error(err.response?.data?.message ?? 'Assignment failed'),
  })

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
      <div className="card" style={{ width: '100%', maxWidth: 600, margin: 0, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <UserCheck size={20} color="var(--primary)" />
          <h3 style={{ margin: 0 }}>Manual Assign Rider</h3>
          <button className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }} onClick={onClose}><X size={16} /></button>
        </div>

        {/* Rider map */}
        {mapMarkers.length > 0 && (
          <div style={{ marginBottom: 16, borderRadius: 10, overflow: 'hidden' }}>
            <HereMap markers={mapMarkers} height="260px" zoom={12} />
            <div style={{ display: 'flex', gap: 16, padding: '8px 0', fontSize: 12, color: 'var(--text-secondary)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#FF5E14', display: 'inline-block' }} /> Pickup
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#2563EB', display: 'inline-block' }} /> Available rider
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#16A34A', display: 'inline-block' }} /> Selected
              </span>
            </div>
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Select Rider (online + idle · sorted by proximity)</label>
          <Select
            value={riderId}
            onChange={e => setRiderId(e.target.value)}
            placeholder="— choose a rider —"
            options={riders.map(r => {
              const lat = r.rider_profile?.current_lat
              const lng = r.rider_profile?.current_lng
              const distText = (pickupLat && pickupLng && lat && lng)
                ? ` · ${haversineKm(pickupLat, pickupLng, lat, lng).toFixed(1)} km away`
                : ''
              return {
                value: String(r.id),
                label: `${r.name} · ${r.rider_profile?.vehicle_type}${distText} · Score: ${r.rider_profile?.reliability_score ?? '—'}`,
              }
            })}
          />
          {isFetching && riders.length === 0 && <p className="text-sm text-muted" style={{ marginTop: 6 }}>Loading available riders…</p>}
          {!isFetching && riders.length === 0 && <p className="text-sm text-muted" style={{ marginTop: 6 }}>No idle riders online right now.</p>}
        </div>

        {selectedRider && (
          <div style={{ background: 'var(--surface-muted)', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 13 }}>
            <div style={{ fontWeight: 600, marginBottom: 2 }}>{selectedRider.name}</div>
            <div style={{ color: 'var(--text-secondary)', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <span>Vehicle: {selectedRider.rider_profile?.vehicle_type ?? '—'}</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>Score: <Star size={12} color="var(--warning)" fill="var(--warning)" />{selectedRider.rider_profile?.reliability_score ?? '—'}</span>
              <span>Deliveries: {selectedRider.rider_profile?.total_deliveries ?? 0}</span>
            </div>
          </div>
        )}

        <div className="form-group" style={{ marginTop: 12 }}>
          <label className="form-label">Reason <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>(optional)</span></label>
          <input
            className="form-control"
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="e.g. Closest rider to pickup, urgent order…"
          />
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={() => assign.mutate()} disabled={!riderId || assign.isPending}>
            {assign.isPending ? <span className="spinner" /> : 'Assign Rider'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── CollectionAssignModal ─────────────────────────────────────────────────────

function CollectionAssignModal({ orderId, onClose, onSuccess }) {
  const [riderId, setRiderId] = useState('')
  const [hubId,   setHubId]   = useState('')

  const { data: ridersData, isFetching: fetchingRiders } = useQuery({
    queryKey: ['riders-all'],
    queryFn: () => api.get('/admin/users?role=rider').then(r => r.data.data),
    staleTime: 0,
  })

  const { data: hubsData } = useQuery({
    queryKey: ['hubs'],
    queryFn: () => api.get('/admin/hubs').then(r => r.data.data),
  })

  const riders = (ridersData?.data ?? ridersData ?? []).filter(r => r.rider_profile?.admin_approved)
  const hubs   = (hubsData ?? []).filter(h => h.is_active)

  const assign = useMutation({
    mutationFn: () => api.patch(`/admin/orders/${orderId}/assign-collection`, {
      rider_id: Number(riderId),
      hub_id:   Number(hubId),
    }),
    onSuccess: () => { toast.success('Collection rider assigned'); onSuccess() },
    onError: (err) => toast.error(err.response?.data?.message ?? 'Failed'),
  })

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
      <div className="card" style={{ width: '100%', maxWidth: 480, margin: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <Warehouse size={20} color="var(--primary)" />
          <h3 style={{ margin: 0 }}>Assign Collection Rider</h3>
          <button className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }} onClick={onClose}><X size={16} /></button>
        </div>

        <p className="text-muted text-sm" style={{ marginBottom: 16 }}>
          This converts the order to hub-and-spoke mode. A collection rider will pick up the packages and bring them to the selected hub for consolidation.
        </p>

        <div className="form-group">
          <label className="form-label">Hub *</label>
          <Select
            value={hubId}
            onChange={e => setHubId(e.target.value)}
            placeholder="— select hub —"
            options={hubs.map(h => ({ value: String(h.id), label: `${h.name} · ${h.address}` }))}
          />
        </div>

        <div className="form-group" style={{ marginTop: 12 }}>
          <label className="form-label">Collection Rider *</label>
          <Select
            value={riderId}
            onChange={e => setRiderId(e.target.value)}
            placeholder="— select rider —"
            options={riders.map(r => ({
              value: String(r.id),
              label: `${r.name} · ${r.rider_profile?.vehicle_type ?? ''} · ${r.rider_profile?.is_online ? '🟢 Online' : '⚫ Offline'}`,
            }))}
          />
          {fetchingRiders && <p className="text-sm text-muted" style={{ marginTop: 6 }}>Loading riders…</p>}
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => assign.mutate()}
            disabled={!riderId || !hubId || assign.isPending}
          >
            {assign.isPending ? <span className="spinner" /> : 'Assign Collection Rider'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── HubSpokeInfo ──────────────────────────────────────────────────────────────

const HUB_SPOKE_STEPS = [
  { status: ['awaiting_collection'],  label: 'Awaiting collection',     icon: Truck },
  { status: ['at_hub'],               label: 'Arrived at hub',          icon: Warehouse },
  { status: ['in_slot'],              label: 'In dispatch slot',         icon: CalendarClock },
  { status: ['assigned','in_progress','completed'], label: 'Out for delivery', icon: Truck },
]

function HubSpokeInfo({ order }) {
  if (order.fulfillment_type !== 'hub_spoke') return null

  const currentStepIdx = HUB_SPOKE_STEPS.findIndex(s => s.status.includes(order.status))

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <Warehouse size={16} color="var(--primary)" />
        <h3 style={{ margin: 0, fontSize: 15 }}>Hub & Spoke Consolidation</h3>
      </div>

      {/* Progress steps */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 16 }}>
        {HUB_SPOKE_STEPS.map((step, i) => {
          const done    = i <  currentStepIdx
          const active  = i === currentStepIdx
          const pending = i >  currentStepIdx
          const Icon    = step.icon
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                <div style={{
                  width: 30, height: 30, borderRadius: '50%',
                  background: done ? 'var(--success)' : active ? 'var(--primary)' : 'var(--surface-muted)',
                  border: `2px solid ${done ? 'var(--success)' : active ? 'var(--primary)' : 'var(--border)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 6,
                }}>
                  <Icon size={13} color={done || active ? '#fff' : 'var(--text-secondary)'} />
                </div>
                <div style={{ fontSize: 10, textAlign: 'center', color: active ? 'var(--primary)' : done ? 'var(--success)' : 'var(--text-secondary)', fontWeight: active ? 600 : 400, lineHeight: 1.3 }}>
                  {step.label}
                </div>
              </div>
              {i < HUB_SPOKE_STEPS.length - 1 && (
                <div style={{ height: 2, width: 24, background: done ? 'var(--success)' : 'var(--border)', flexShrink: 0, marginBottom: 22 }} />
              )}
            </div>
          )
        })}
      </div>

      {/* Details */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
        {order.hub && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Hub</span>
            <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Warehouse size={12} /> {order.hub.name}
            </span>
          </div>
        )}
        {order.collection_rider && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Collection Rider</span>
            <span style={{ fontWeight: 600 }}>{order.collection_rider.name}</span>
          </div>
        )}
        {order.hub_arrived_at && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Hub Arrived</span>
            <span>{new Date(order.hub_arrived_at).toLocaleString()}</span>
          </div>
        )}
        {order.slot && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Dispatch Slot</span>
              <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                <CalendarClock size={12} /> {order.slot.name}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Scheduled Dispatch</span>
              <span>{new Date(order.slot.scheduled_at).toLocaleString()}</span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function OrderDetailPage() {
  const { id } = useParams()
  const { isAdmin, isVendor, isRider } = useAuthStore()
  const qc = useQueryClient()
  const [showCancel,     setShowCancel]     = useState(false)
  const [showAssign,     setShowAssign]     = useState(false)
  const [showCollection, setShowCollection] = useState(false)

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => {
      if (isAdmin()) return api.get(`/admin/orders/${id}`).then(r => r.data.data)
      if (isRider()) return api.get(`/rider/orders/${id}`).then(r => r.data.data)
      return api.get(`/orders/${id}`).then(r => r.data.data)
    },
  })

  const cancelMutation = useMutation({
    mutationFn: (reason) => api.delete(`/orders/${id}`, { data: { reason } }),
    onSuccess: () => { toast.success('Order cancelled'); setShowCancel(false); qc.invalidateQueries(['order', id]) },
    onError: (err) => toast.error(err.response?.data?.message ?? 'Cancel failed'),
  })

  const dispatchMutation = useMutation({
    mutationFn: () => isAdmin()
      ? api.post(`/admin/dispatch/${id}/trigger`)
      : api.post(`/orders/${id}/dispatch`),
    onSuccess: (res) => {
      toast.success(res.data.message ?? 'Dispatch triggered')
      qc.invalidateQueries(['order', id])
    },
    onError: (err) => toast.error(err.response?.data?.message ?? 'Dispatch failed'),
  })

  const redispatchMutation = useMutation({
    mutationFn: () => api.post(`/orders/${id}/redispatch`),
    onSuccess: () => { toast.success('Order redispatched successfully'); qc.invalidateQueries(['order', id]) },
    onError: (err) => toast.error(err.response?.data?.error ?? 'Redispatch failed'),
  })

  const markHubMutation = useMutation({
    mutationFn: () => api.patch(`/admin/orders/${id}/mark-hub-arrived`),
    onSuccess: () => { toast.success('Order marked as arrived at hub'); qc.invalidateQueries(['order', id]) },
    onError: (err) => toast.error(err.response?.data?.error ?? 'Failed'),
  })

  const [printingWaybill, setPrintingWaybill] = useState(false)
  const printWaybill = async () => {
    setPrintingWaybill(true)
    try {
      const token = localStorage.getItem('sendtrack_token')
      const base  = (import.meta.env.VITE_API_URL ?? 'http://localhost:8000') + '/api'
      const res   = await fetch(`${base}/orders/${id}/waybill`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error()
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      window.open(url, '_blank')
      setTimeout(() => URL.revokeObjectURL(url), 10000)
    } catch {
      toast.error('Failed to generate waybill')
    } finally {
      setPrintingWaybill(false)
    }
  }

  if (isLoading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}><span className="spinner" /></div>
  if (!order) return <p className="text-muted">Order not found.</p>

  const rider = isRider()
  const canCancel = !rider && ['created', 'awaiting_dispatch', 'processing', 'awaiting_collection', 'at_hub', 'in_slot'].includes(order.status)
  const canDispatch = order.status === 'awaiting_dispatch'
  const isVendorRequestMode = isVendor?.() && order.dispatch_mode === 'request' && canDispatch
  const canRedispatch = !rider && (order.packages ?? []).some(p => p.status === 'returned_to_sender')
  // Hub-spoke admin actions
  const canAssignCollection = isAdmin() && ['processing', 'awaiting_dispatch', 'created'].includes(order.status)
  const canMarkHubArrived   = isAdmin() && order.status === 'awaiting_collection'

  const hasMap = order.pickup_lat && order.pickup_lng && order.dropoff_lat && order.dropoff_lng
  const mapMarkers = hasMap ? [
    { lat: Number(order.pickup_lat), lng: Number(order.pickup_lng), label: 'P', color: '#FF5E14' },
    { lat: Number(order.dropoff_lat), lng: Number(order.dropoff_lng), label: 'D', color: '#16A34A' },
  ] : []
  const mapRoute = hasMap ? [
    { lat: Number(order.pickup_lat), lng: Number(order.pickup_lng) },
    { lat: Number(order.dropoff_lat), lng: Number(order.dropoff_lng) },
  ] : null

  /* ── Rider view ─────────────────────────────────────────────── */
  if (rider) {
    return (
      <div>
        <div className="page-header">
          <div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Link to="/rider/deliveries" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Deliveries</Link>
              <ChevronRight size={12} />
              #{order.id}
            </div>
            <h1 className="page-title" style={{ margin: 0 }}>Order #{order.id}</h1>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <StatusBadge status={order.status} />
            <button className="btn btn-secondary btn-sm" onClick={printWaybill} disabled={printingWaybill}>
              <Printer size={14} /> {printingWaybill ? 'Generating…' : 'Waybill'}
            </button>
          </div>
        </div>

        <div className="detail-grid">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Addresses */}
            <div className="card">
              <h3 style={{ marginBottom: 16 }}>Route</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Pickup</div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <MapPin size={16} color="var(--primary)" style={{ marginTop: 1, flexShrink: 0 }} />
                    <span style={{ fontSize: 14 }}>{order.pickup_address}</span>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Dropoff</div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <MapPin size={16} color="var(--success)" style={{ marginTop: 1, flexShrink: 0 }} />
                    <span style={{ fontSize: 14 }}>{order.dropoff_address}</span>
                  </div>
                </div>
                {order.distance_km && (
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    Distance: <strong style={{ color: 'var(--text-primary)' }}>{Number(order.distance_km).toFixed(2)} km</strong>
                  </div>
                )}
              </div>
              {hasMap && (
                <div style={{ marginTop: 16, borderRadius: 10, overflow: 'hidden' }}>
                  <HereMap markers={mapMarkers} route={mapRoute} height="220px" zoom={13} />
                </div>
              )}
            </div>

            {/* Packages */}
            <div className="card">
              <h3 style={{ marginBottom: 16 }}>
                <Package size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                Packages
              </h3>
              {order.packages?.map((pkg) => (
                <div key={pkg.id} style={{ border: '1px solid var(--border)', borderRadius: 10, padding: 14, marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{pkg.name}</span>
                    <StatusBadge status={pkg.status} />
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    <span>Category: <strong style={{ color: 'var(--text-primary)' }}>{pkg.category}</strong></span>
                    <span>Weight: <strong style={{ color: 'var(--text-primary)' }}>{pkg.weight_kg} kg</strong></span>
                  </div>
                  <div style={{ display: 'flex', gap: 12, marginTop: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
                    {pkg.is_fragile && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--warning)', fontWeight: 600 }}><AlertTriangle size={13} /> Fragile</span>}
                    {pkg.requires_photo && <span>Photo required</span>}
                    {pkg.requires_signature && <span>Signature required</span>}
                  </div>
                  {pkg.description && (
                    <div style={{ marginTop: 8, fontSize: 13, color: 'var(--text-secondary)', background: 'var(--surface-muted)', borderRadius: 6, padding: '6px 10px' }}>
                      {pkg.description}
                    </div>
                  )}
                  {pkg.tracking_events?.length > 0 && (
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                      <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Timeline</div>
                      <Timeline events={pkg.tracking_events} />
                    </div>
                  )}
                  <RiderPackageActions
                    pkg={pkg}
                    orderId={id}
                    onDone={() => qc.invalidateQueries({ queryKey: ['order', id] })}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Recipient */}
            {(order.recipient_name || order.recipient_phone) && (
              <div className="card">
                <h3 style={{ marginBottom: 14 }}>Recipient</h3>
                {order.recipient_name && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <User size={16} color="var(--text-secondary)" />
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{order.recipient_name}</span>
                  </div>
                )}
                {order.recipient_phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <Phone size={16} color="var(--text-secondary)" />
                    <span style={{ fontSize: 14 }}>{order.recipient_phone}</span>
                    <a
                      href={`tel:${order.recipient_phone}`}
                      className="btn btn-primary btn-sm"
                      style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      <Phone size={13} /> Call
                    </a>
                  </div>
                )}
                {order.delivery_notes && (
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Delivery Notes</div>
                    <div style={{ fontSize: 13, background: 'var(--surface-muted)', borderRadius: 8, padding: '8px 12px', lineHeight: 1.5 }}>
                      {order.delivery_notes}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Vendor */}
            {order.vendor && (
              <div className="card">
                <h3 style={{ marginBottom: 12 }}>Vendor</h3>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--surface-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Building2 size={18} color="var(--text-secondary)" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{order.vendor.name ?? order.vendor.business_name}</div>
                    {order.vendor.phone && <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{order.vendor.phone}</div>}
                  </div>
                </div>
              </div>
            )}

            {/* Order info */}
            <div className="card">
              <h3 style={{ marginBottom: 14 }}>Details</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Order #</span>
                  <span style={{ fontWeight: 600 }}>{order.id}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Status</span>
                  <StatusBadge status={order.status} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Created</span>
                  <span>{new Date(order.created_at).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  /* ── Vendor / Admin view ────────────────────────────────────── */
  return (
    <div>
      {showCancel     && <CancelModal onConfirm={cancelMutation.mutate} onClose={() => setShowCancel(false)} loading={cancelMutation.isPending} />}
      {showAssign     && <ManualAssignModal orderId={id} pickupLat={order?.pickup_lat} pickupLng={order?.pickup_lng} onClose={() => setShowAssign(false)} onSuccess={() => { setShowAssign(false); qc.invalidateQueries(['order', id]) }} />}
      {showCollection && <CollectionAssignModal orderId={id} onClose={() => setShowCollection(false)} onSuccess={() => { setShowCollection(false); qc.invalidateQueries(['order', id]) }} />}

      <div className="page-header">
        <div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Link to="/orders" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Orders</Link>
            <ChevronRight size={12} />
            #{order.id}
          </div>
          <h1 className="page-title" style={{ margin: 0 }}>Order Detail</h1>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link to={`/orders/${id}/tracking`} className="btn btn-secondary"><Map size={15} /> Track</Link>

          <button className="btn btn-secondary" onClick={printWaybill} disabled={printingWaybill}>
            <Printer size={15} /> {printingWaybill ? 'Generating…' : 'Waybill'}
          </button>

          {isAdmin() && canDispatch && (
            <>
              <button className="btn btn-primary" onClick={() => dispatchMutation.mutate()} disabled={dispatchMutation.isPending}>
                <Zap size={15} /> {dispatchMutation.isPending ? 'Dispatching…' : 'Trigger Dispatch'}
              </button>
              <button className="btn btn-secondary" onClick={() => setShowAssign(true)}>
                <UserCheck size={15} /> Manual Assign
              </button>
            </>
          )}

          {canAssignCollection && (
            <button className="btn btn-secondary" onClick={() => setShowCollection(true)}>
              <Warehouse size={15} /> Assign Collection
            </button>
          )}

          {canMarkHubArrived && (
            <button className="btn btn-primary" onClick={() => markHubMutation.mutate()} disabled={markHubMutation.isPending}>
              <Warehouse size={15} /> {markHubMutation.isPending ? 'Saving…' : 'Mark Arrived at Hub'}
            </button>
          )}

          {isVendorRequestMode && (
            <button className="btn btn-primary" onClick={() => dispatchMutation.mutate()} disabled={dispatchMutation.isPending}>
              <Zap size={15} /> {dispatchMutation.isPending ? 'Requesting…' : 'Request Dispatch'}
            </button>
          )}

          {canRedispatch && (
            <button className="btn btn-primary" onClick={() => redispatchMutation.mutate()} disabled={redispatchMutation.isPending}>
              <Zap size={15} /> {redispatchMutation.isPending ? 'Redispatching…' : 'Redispatch'}
            </button>
          )}

          {canCancel && (
            <button className="btn btn-secondary" style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={() => setShowCancel(true)}>
              <X size={15} /> Cancel
            </button>
          )}
        </div>
      </div>

      <div className="detail-grid">
        {/* Left */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card">
            <h3 style={{ marginBottom: 16 }}>Summary</h3>
            <div className="grid-2" style={{ gap: 16 }}>
              {[
                ['Status', <StatusBadge status={order.status} />],
                ['Dispatch Mode', order.dispatch_mode?.replace(/_/g, ' ')],
                ['Created', new Date(order.created_at).toLocaleString()],
                ['Total', <strong style={{ color: 'var(--primary)' }}>KES {Number(order.total_price).toLocaleString()}</strong>],
              ].map(([label, val]) => (
                <div key={label}>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 14 }}>{val}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
              {[['Pickup', order.pickup_address, 'var(--primary)'], ['Dropoff', order.dropoff_address, 'var(--success)']].map(([label, addr, color]) => (
                <div key={label}>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{label}</div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                    <MapPin size={14} color={color} style={{ marginTop: 2, flexShrink: 0 }} />
                    <span style={{ fontSize: 13 }}>{addr}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: 16 }}>
              <Package size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
              Packages
            </h3>
            {order.packages?.map((pkg) => (
              <div key={pkg.id} style={{ border: '1px solid var(--border)', borderRadius: 10, padding: 14, marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{pkg.name}</span>
                  <StatusBadge status={pkg.status} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                  <span>Category: <strong style={{ color: 'var(--text-primary)' }}>{pkg.category}</strong></span>
                  <span>Weight: <strong style={{ color: 'var(--text-primary)' }}>{pkg.weight_kg} kg</strong></span>
                  <span>Value: <strong style={{ color: 'var(--text-primary)' }}>KES {Number(pkg.declared_value).toLocaleString()}</strong></span>
                </div>
                <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
                  {pkg.is_fragile && <span>Fragile</span>}
                  {pkg.requires_photo && <span>Photo required</span>}
                  {pkg.requires_signature && <span>Signature required</span>}
                </div>
                {pkg.tracking_events?.length > 0 && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Timeline</div>
                    <Timeline events={pkg.tracking_events} />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="card">
            <h3 style={{ marginBottom: 16 }}>Pricing Breakdown</h3>
            <div className="table-wrap">
              <table className="table">
                <tbody>
                  {[
                    ['Distance', `${Number(order.distance_km ?? 0).toFixed(2)} km`],
                    ['Base Fee', `KES ${Number(order.base_fee ?? 0).toLocaleString()}`],
                    ['Distance Fee', `KES ${Number(order.distance_fee ?? 0).toLocaleString()}`],
                    ['Weight Fee', `KES ${Number(order.weight_fee ?? 0).toLocaleString()}`],
                    ['Handling Fee', `KES ${Number(order.handling_fee ?? 0).toLocaleString()}`],
                  ].map(([k, v]) => (
                    <tr key={k}><td style={{ color: 'var(--text-secondary)' }}>{k}</td><td style={{ textAlign: 'right' }}>{v}</td></tr>
                  ))}
                  <tr>
                    <td style={{ fontWeight: 700, paddingTop: 12, borderTop: '2px solid var(--border)' }}>Total</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--primary)', paddingTop: 12, borderTop: '2px solid var(--border)' }}>
                      KES {Number(order.total_price).toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Hub & Spoke info — visible to all roles when relevant */}
          <HubSpokeInfo order={order} />

          {order.rider && (
            <div className="card">
              <h3 style={{ marginBottom: 12 }}>Assigned Rider</h3>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, flexShrink: 0 }}>
                  {order.rider.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{order.rider.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{order.rider.email}</div>
                  {order.rider.rider_profile && (
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                      {order.rider.rider_profile.vehicle_type} · <Star size={11} color="var(--warning)" fill="var(--warning)" style={{ verticalAlign: 'middle' }} /> {order.rider.rider_profile.reliability_score}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {order.invoice && (
            <div className="card">
              <h3 style={{ marginBottom: 12 }}>
                <FileText size={15} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                Invoice
              </h3>
              <div style={{ fontSize: 13, marginBottom: 4 }}>
                <strong>{order.invoice.invoice_number}</strong>
              </div>
              <div style={{ marginBottom: 8 }}>
                <span className={`badge ${order.invoice.status === 'paid' ? 'badge-success' : 'badge-neutral'}`}>{order.invoice.status}</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>
                Issued: {new Date(order.invoice.issued_at).toLocaleDateString()}
              </div>
              <a
                href={`${(import.meta.env.VITE_API_URL ?? 'http://localhost:8000')}/api/invoices/${order.invoice.id}/download`}
                target="_blank" rel="noreferrer"
                className="btn btn-secondary btn-sm"
                style={{ width: '100%', justifyContent: 'center', display: 'flex' }}
              >
                Download PDF
              </a>
            </div>
          )}

          {isAdmin() && (
            <div className="card">
              <h3 style={{ marginBottom: 12 }}>Dispatch Attempts</h3>
              {!order.dispatch_attempts?.length ? (
                <p className="text-muted text-sm">No dispatch attempts yet.</p>
              ) : order.dispatch_attempts.map(da => (
                <div key={da.id} style={{ fontSize: 13, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600 }}>#{da.attempt_number} — {da.rider?.name ?? 'Unknown'}</span>
                    <span className={`badge ${OUTCOME_COLORS[da.outcome] ?? 'badge-neutral'}`}>{da.outcome}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, display: 'flex', gap: 12 }}>
                    <span>Offered: {new Date(da.offered_at).toLocaleTimeString()}</span>
                    {da.responded_at && <span>Responded: {new Date(da.responded_at).toLocaleTimeString()}</span>}
                    {da.distance_km && <span>{da.distance_km} km away</span>}
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
