import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  CalendarClock, Plus, X, Package, Truck, ChevronRight,
  Clock, CheckCircle2, CircleSlash, AlertTriangle, Layers,
  Trash2, Pencil, Zap, UserCheck, Scale,
} from 'lucide-react'
import api from '../lib/api'
import toast from 'react-hot-toast'
import Select from '../components/Select'

// ── Helpers ───────────────────────────────────────────────────────────────────

const SLOT_STATUS = {
  open:       { label: 'Open',       color: '#16A34A', cls: 'badge-success' },
  closed:     { label: 'Closed',     color: '#9333EA', cls: 'badge-warning' },
  dispatched: { label: 'Dispatched', color: '#2563EB', cls: 'badge-primary' },
  cancelled:  { label: 'Cancelled',  color: '#EF4444', cls: 'badge-danger'  },
}

function fmt(date) {
  if (!date) return '—'
  return new Date(date).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function fmtDate(date) {
  if (!date) return '—'
  return new Date(date).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function toInputDateTime(date) {
  if (!date) return ''
  return new Date(date).toISOString().slice(0, 16)
}

// ── Create Slot Modal ─────────────────────────────────────────────────────────

function CreateSlotModal({ onClose }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({ hub_id: '', name: '', cutoff_at: '', scheduled_at: '', notes: '' })

  const { data: hubsData } = useQuery({
    queryKey: ['hubs'],
    queryFn: () => api.get('/admin/hubs').then(r => r.data.data),
  })
  const hubs = (hubsData ?? []).filter(h => h.is_active)

  const save = useMutation({
    mutationFn: () => api.post('/admin/dispatch-slots', form),
    onSuccess: () => {
      toast.success('Slot created')
      qc.invalidateQueries({ queryKey: ['dispatch-slots'] })
      onClose()
    },
    onError: (err) => toast.error(err.response?.data?.message ?? 'Failed to create slot'),
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const canSave = form.hub_id && form.name && form.cutoff_at && form.scheduled_at

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="card" style={{ width: '100%', maxWidth: 500, margin: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <CalendarClock size={20} color="var(--primary)" />
          <h3 style={{ margin: 0 }}>New Dispatch Slot</h3>
          <button className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }} onClick={onClose}><X size={16} /></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Hub *</label>
            <Select
              value={form.hub_id}
              onChange={e => set('hub_id', e.target.value)}
              placeholder="— select hub —"
              options={(hubs ?? []).map(h => ({ value: String(h.id), label: h.name }))}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Slot Name *</label>
            <input className="form-control" value={form.name} onChange={e => set('name', e.target.value)} placeholder='e.g. "Morning Run – 23 May"' />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Order Cutoff *</label>
              <input className="form-control" type="datetime-local" value={form.cutoff_at} onChange={e => set('cutoff_at', e.target.value)} />
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>Stop accepting orders after this time</div>
            </div>
            <div className="form-group">
              <label className="form-label">Dispatch Time *</label>
              <input className="form-control" type="datetime-local" value={form.scheduled_at} onChange={e => set('scheduled_at', e.target.value)} />
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>Planned dispatch to last-mile rider</div>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea className="form-control" rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Internal notes…" style={{ resize: 'vertical' }} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={() => save.mutate()} disabled={!canSave || save.isPending}>
            {save.isPending ? <span className="spinner" /> : 'Create Slot'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Slot Detail Modal ─────────────────────────────────────────────────────────

function SlotDetailModal({ slotId, onClose }) {
  const qc = useQueryClient()
  const [addOrderId, setAddOrderId]   = useState('')
  const [dispatchRider, setDispatchRider] = useState('')
  const [showDispatch, setShowDispatch]   = useState(false)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['dispatch-slot', slotId],
    queryFn: () => api.get(`/admin/dispatch-slots/${slotId}`).then(r => r.data),
    refetchInterval: 20_000,
  })

  // Orders at hub for this slot's hub (for add-order picker)
  const { data: hubOrders } = useQuery({
    queryKey: ['orders-at-hub', data?.data?.hub_id],
    queryFn: () => api.get(`/admin/orders?status=at_hub&hub_id=${data.data.hub_id}`).then(r => r.data.data?.data ?? []),
    enabled: Boolean(data?.data?.hub_id),
  })

  // Available riders
  const { data: ridersData } = useQuery({
    queryKey: ['riders-available'],
    queryFn: () => api.get('/admin/users?role=rider').then(r => r.data.data),
    enabled: showDispatch,
  })
  const availableRiders = (ridersData?.data ?? ridersData ?? []).filter(r => {
    const p = r.rider_profile
    return p?.admin_approved && p?.is_online && (p?.status === 'idle' || p?.status === 'online' || p?.status === 'on_delivery')
  })

  const addOrder = useMutation({
    mutationFn: () => api.post(`/admin/dispatch-slots/${slotId}/add-order`, { order_id: Number(addOrderId) }),
    onSuccess: () => { toast.success('Order added to slot'); setAddOrderId(''); refetch(); qc.invalidateQueries({ queryKey: ['orders-at-hub'] }) },
    onError: (err) => toast.error(err.response?.data?.error ?? 'Failed to add order'),
  })

  const removeOrder = useMutation({
    mutationFn: (orderId) => api.delete(`/admin/dispatch-slots/${slotId}/orders/${orderId}`),
    onSuccess: () => { toast.success('Order removed'); refetch() },
    onError: (err) => toast.error(err.response?.data?.error ?? 'Failed to remove order'),
  })

  const closeSlot = useMutation({
    mutationFn: () => api.patch(`/admin/dispatch-slots/${slotId}/close`),
    onSuccess: () => { toast.success('Slot closed'); refetch(); qc.invalidateQueries({ queryKey: ['dispatch-slots'] }) },
    onError: (err) => toast.error(err.response?.data?.error ?? 'Failed'),
  })

  const dispatchSlot = useMutation({
    mutationFn: () => api.post(`/admin/dispatch-slots/${slotId}/dispatch`, { rider_id: Number(dispatchRider) }),
    onSuccess: (res) => {
      toast.success(res.data.message)
      refetch()
      qc.invalidateQueries({ queryKey: ['dispatch-slots'] })
      setShowDispatch(false)
    },
    onError: (err) => toast.error(err.response?.data?.error ?? 'Dispatch failed'),
  })

  const slot   = data?.data
  const orders = slot?.orders ?? []
  const cfg    = SLOT_STATUS[slot?.status] ?? SLOT_STATUS.open

  // Orders at this hub not already in a slot
  const addableOrders = (hubOrders ?? []).filter(o => !o.slot_id)

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="card" style={{ width: '100%', maxWidth: 680, margin: 0, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16, flexShrink: 0 }}>
          <div style={{ flex: 1 }}>
            {isLoading ? (
              <div style={{ height: 24, background: 'var(--surface-muted)', borderRadius: 4, width: 200 }} />
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <h3 style={{ margin: 0 }}>{slot?.name}</h3>
                  <span className={`badge ${cfg.cls}`}>{cfg.label}</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  {slot?.hub?.name} · Dispatch: {fmtDate(slot?.scheduled_at)}
                </div>
              </>
            )}
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}><X size={16} /></button>
        </div>

        {/* Stats */}
        {slot && (
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexShrink: 0 }}>
            {[
              { icon: Package, label: 'Orders',   value: orders.length },
              { icon: Layers,  label: 'Packages', value: data?.package_count ?? 0 },
              { icon: Scale,   label: 'Weight',   value: `${(data?.total_weight_kg ?? 0).toFixed(1)} kg` },
              { icon: Clock,   label: 'Cutoff',   value: fmtDate(slot?.cutoff_at) },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} style={{ flex: 1, background: 'var(--surface-muted)', borderRadius: 8, padding: '10px 14px', textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{label}</div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Add order (only when open) */}
        {slot?.status === 'open' && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexShrink: 0 }}>
            <div style={{ flex: 1 }}>
              <Select
                value={addOrderId}
                onChange={e => setAddOrderId(e.target.value)}
                placeholder="— add order to slot (at hub) —"
                options={(addableOrders).map(o => ({
                  value: String(o.id),
                  label: `#${o.id} · ${o.vendor?.name ?? 'Vendor'} · ${o.pickup_address?.slice(0, 40)}`,
                }))}
              />
            </div>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => addOrder.mutate()}
              disabled={!addOrderId || addOrder.isPending}
            >
              {addOrder.isPending ? <span className="spinner" /> : <><Plus size={14} /> Add</>}
            </button>
          </div>
        )}

        {/* Orders list */}
        <div style={{ flex: 1, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 10, minHeight: 0 }}>
          {isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}><span className="spinner" /></div>
          ) : orders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 24px', color: 'var(--text-secondary)' }}>
              <Package size={32} strokeWidth={1.2} style={{ marginBottom: 8 }} />
              <p style={{ fontSize: 13, margin: 0 }}>No orders in this slot yet.</p>
            </div>
          ) : (
            orders.map((order, i) => (
              <div key={order.id} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                borderBottom: i < orders.length - 1 ? '1px solid var(--border)' : 'none',
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>Order #{order.id}</span>
                    <span className={`badge badge-${order.status === 'in_slot' ? 'primary' : 'neutral'}`} style={{ fontSize: 10 }}>{order.status?.replace(/_/g,' ')}</span>
                    {order.vendor && <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>· {order.vendor.name}</span>}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', gap: 12 }}>
                    <span>{order.packages?.length ?? 0} pkg{(order.packages?.length ?? 0) !== 1 ? 's' : ''}</span>
                    <span>{Number(order.total_weight_kg ?? 0).toFixed(1)} kg</span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>{order.dropoff_address}</span>
                  </div>
                </div>
                {slot?.status === 'open' && (
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ color: 'var(--danger)', flexShrink: 0 }}
                    onClick={() => {
                      if (window.confirm(`Remove order #${order.id} from slot?`)) removeOrder.mutate(order.id)
                    }}
                    title="Remove from slot"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {/* Actions */}
        {slot && !['dispatched', 'cancelled'].includes(slot.status) && (
          <div style={{ marginTop: 16, flexShrink: 0 }}>
            {showDispatch ? (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <Select
                    value={dispatchRider}
                    onChange={e => setDispatchRider(e.target.value)}
                    placeholder="— select rider to dispatch all orders —"
                    options={(availableRiders).map(r => ({
                      value: String(r.id),
                      label: `${r.name} · ${r.rider_profile?.vehicle_type ?? ''} · Score: ${r.rider_profile?.reliability_score ?? '—'}`,
                    }))}
                  />
                </div>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => dispatchSlot.mutate()}
                  disabled={!dispatchRider || dispatchSlot.isPending || orders.length === 0}
                >
                  {dispatchSlot.isPending ? <span className="spinner" /> : <><Zap size={14} /> Dispatch</>}
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => setShowDispatch(false)}>Cancel</button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                {slot.status === 'open' && (
                  <button className="btn btn-secondary btn-sm" onClick={() => closeSlot.mutate()} disabled={closeSlot.isPending}>
                    <CircleSlash size={14} /> Close Slot
                  </button>
                )}
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => setShowDispatch(true)}
                  disabled={orders.filter(o => o.status === 'in_slot').length === 0}
                >
                  <UserCheck size={14} /> Assign Rider & Dispatch
                </button>
              </div>
            )}
          </div>
        )}

        {slot?.status === 'dispatched' && (
          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(37,99,235,0.08)', borderRadius: 8, flexShrink: 0 }}>
            <CheckCircle2 size={16} color="var(--primary)" />
            <span style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 500 }}>This slot has been dispatched to a last-mile rider.</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DispatchSlotsPage() {
  const [showCreate, setShowCreate]   = useState(false)
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [filterHub, setFilterHub]     = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  const { data: hubsData } = useQuery({
    queryKey: ['hubs'],
    queryFn: () => api.get('/admin/hubs').then(r => r.data.data),
  })

  const { data, isLoading } = useQuery({
    queryKey: ['dispatch-slots', filterHub, filterStatus],
    queryFn: () => {
      const params = new URLSearchParams()
      if (filterHub)    params.append('hub_id', filterHub)
      if (filterStatus) params.append('status', filterStatus)
      return api.get(`/admin/dispatch-slots?${params}`).then(r => r.data.data)
    },
    refetchInterval: 30_000,
  })

  const slots = data?.data ?? []
  const hubs  = hubsData ?? []

  return (
    <div>
      {showCreate  && <CreateSlotModal onClose={() => setShowCreate(false)} />}
      {selectedSlot && <SlotDetailModal slotId={selectedSlot} onClose={() => setSelectedSlot(null)} />}

      <div className="page-header">
        <div>
          <h1 className="page-title">Dispatch Slots</h1>
          <p className="text-muted" style={{ fontSize: 13, margin: 0 }}>Time-windows for consolidating and dispatching hub orders</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          <Plus size={15} /> New Slot
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ minWidth: 180 }}>
          <Select
            value={filterHub}
            onChange={e => setFilterHub(e.target.value)}
            placeholder="All hubs"
            options={hubs.map(h => ({ value: String(h.id), label: h.name }))}
          />
        </div>
        <div style={{ minWidth: 160 }}>
          <Select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            placeholder="All statuses"
            options={Object.entries(SLOT_STATUS).map(([val, cfg]) => ({ value: val, label: cfg.label }))}
          />
        </div>
        {(filterHub || filterStatus) && (
          <button className="btn btn-ghost btn-sm" onClick={() => { setFilterHub(''); setFilterStatus('') }} style={{ color: 'var(--text-secondary)' }}>
            <X size={14} /> Clear
          </button>
        )}
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}><span className="spinner" /></div>
      ) : slots.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-secondary)' }}>
          <CalendarClock size={40} strokeWidth={1.2} style={{ marginBottom: 12 }} />
          <p style={{ fontSize: 14, marginBottom: 16 }}>No dispatch slots found. Create one to start batching hub orders.</p>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}><Plus size={14} /> New Slot</button>
        </div>
      ) : (
        <div className="table-wrap card" style={{ padding: 0 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Slot</th>
                <th>Hub</th>
                <th>Cutoff</th>
                <th>Dispatch Time</th>
                <th style={{ textAlign: 'center' }}>Orders</th>
                <th style={{ textAlign: 'center' }}>Status</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {slots.map(slot => {
                const cfg = SLOT_STATUS[slot.status] ?? SLOT_STATUS.open
                const isPast = new Date(slot.cutoff_at) < new Date()
                return (
                  <tr
                    key={slot.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelectedSlot(slot.id)}
                  >
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{slot.name}</div>
                      {slot.notes && (
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {slot.notes}
                        </div>
                      )}
                    </td>
                    <td style={{ fontSize: 13 }}>{slot.hub?.name ?? '—'}</td>
                    <td style={{ fontSize: 13 }}>
                      <span style={{ color: isPast && slot.status === 'open' ? 'var(--danger)' : 'inherit' }}>
                        {fmtDate(slot.cutoff_at)}
                      </span>
                    </td>
                    <td style={{ fontSize: 13 }}>{fmtDate(slot.scheduled_at)}</td>
                    <td style={{ textAlign: 'center', fontWeight: 600 }}>{slot.orders_count ?? 0}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`badge ${cfg.cls}`}>{cfg.label}</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={e => { e.stopPropagation(); setSelectedSlot(slot.id) }}
                      >
                        <ChevronRight size={14} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
