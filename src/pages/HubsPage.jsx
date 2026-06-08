import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Building2, Plus, Pencil, Trash2, X, MapPin, Phone, Check, ToggleLeft, ToggleRight } from 'lucide-react'
import api from '../lib/api'
import toast from 'react-hot-toast'

// ── Modal ─────────────────────────────────────────────────────────────────────

function HubModal({ hub, onClose, onSaved }) {
  const qc = useQueryClient()
  const isEdit = Boolean(hub?.id)

  const [form, setForm] = useState({
    name:          hub?.name          ?? '',
    address:       hub?.address       ?? '',
    lat:           hub?.lat           ?? '',
    lng:           hub?.lng           ?? '',
    contact_phone: hub?.contact_phone ?? '',
    is_active:     hub?.is_active     ?? true,
  })

  const save = useMutation({
    mutationFn: () => isEdit
      ? api.patch(`/admin/hubs/${hub.id}`, form)
      : api.post('/admin/hubs', form),
    onSuccess: () => {
      toast.success(isEdit ? 'Hub updated' : 'Hub created')
      qc.invalidateQueries({ queryKey: ['hubs'] })
      onSaved?.()
      onClose()
    },
    onError: (err) => toast.error(err.response?.data?.message ?? 'Save failed'),
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="card" style={{ width: '100%', maxWidth: 500, margin: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <Building2 size={20} color="var(--primary)" />
          <h3 style={{ margin: 0 }}>{isEdit ? 'Edit Hub' : 'Add Hub'}</h3>
          <button className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }} onClick={onClose}><X size={16} /></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Hub Name *</label>
            <input className="form-control" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Westlands Hub" />
          </div>

          <div className="form-group">
            <label className="form-label">Address *</label>
            <input className="form-control" value={form.address} onChange={e => set('address', e.target.value)} placeholder="Physical address" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Latitude</label>
              <input className="form-control" type="number" step="any" value={form.lat} onChange={e => set('lat', e.target.value)} placeholder="-1.2921" />
            </div>
            <div className="form-group">
              <label className="form-label">Longitude</label>
              <input className="form-control" type="number" step="any" value={form.lng} onChange={e => set('lng', e.target.value)} placeholder="36.8219" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Contact Phone</label>
            <input className="form-control" value={form.contact_phone} onChange={e => set('contact_phone', e.target.value)} placeholder="+254700000000" />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              type="button"
              onClick={() => set('is_active', !form.is_active)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: form.is_active ? 'var(--success)' : 'var(--text-secondary)', padding: 0 }}
            >
              {form.is_active ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
              <span style={{ fontSize: 13, fontWeight: 500 }}>{form.is_active ? 'Active' : 'Inactive'}</span>
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => save.mutate()}
            disabled={!form.name || !form.address || save.isPending}
          >
            {save.isPending ? <span className="spinner" /> : (isEdit ? 'Save Changes' : 'Create Hub')}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function HubsPage() {
  const qc = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing]     = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['hubs'],
    queryFn: () => api.get('/admin/hubs').then(r => r.data.data),
  })

  const hubs = data ?? []

  const destroy = useMutation({
    mutationFn: (id) => api.delete(`/admin/hubs/${id}`),
    onSuccess: () => { toast.success('Hub deleted'); qc.invalidateQueries({ queryKey: ['hubs'] }) },
    onError: (err) => toast.error(err.response?.data?.message ?? 'Delete failed'),
  })

  const handleEdit = (hub) => { setEditing(hub); setShowModal(true) }
  const handleAdd  = ()    => { setEditing(null); setShowModal(true) }
  const handleClose = ()   => { setShowModal(false); setEditing(null) }

  return (
    <div>
      {showModal && <HubModal hub={editing} onClose={handleClose} />}

      <div className="page-header">
        <div>
          <h1 className="page-title">Hubs</h1>
          <p className="text-muted" style={{ fontSize: 13, margin: 0 }}>Consolidation offices for hub-and-spoke deliveries</p>
        </div>
        <button className="btn btn-primary" onClick={handleAdd}>
          <Plus size={15} /> Add Hub
        </button>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}><span className="spinner" /></div>
      ) : hubs.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-secondary)' }}>
          <Building2 size={40} strokeWidth={1.2} style={{ marginBottom: 12 }} />
          <p style={{ fontSize: 14, marginBottom: 16 }}>No hubs yet. Add your first consolidation hub.</p>
          <button className="btn btn-primary" onClick={handleAdd}><Plus size={14} /> Add Hub</button>
        </div>
      ) : (
        <div className="table-wrap card" style={{ padding: 0 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Hub</th>
                <th>Address</th>
                <th>Contact</th>
                <th style={{ textAlign: 'center' }}>Slots</th>
                <th style={{ textAlign: 'center' }}>Orders</th>
                <th style={{ textAlign: 'center' }}>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {hubs.map(hub => (
                <tr key={hub.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--primary)', opacity: hub.is_active ? 1 : 0.4, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Building2 size={16} color="#fff" />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{hub.name}</div>
                        {hub.lat && hub.lng && (
                          <div style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 3 }}>
                            <MapPin size={10} /> {Number(hub.lat).toFixed(4)}, {Number(hub.lng).toFixed(4)}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize: 13, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{hub.address}</td>
                  <td style={{ fontSize: 13 }}>
                    {hub.contact_phone
                      ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Phone size={12} /> {hub.contact_phone}</span>
                      : <span style={{ color: 'var(--text-secondary)' }}>—</span>
                    }
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{ fontWeight: 600 }}>{hub.dispatch_slots_count ?? 0}</span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{ fontWeight: 600 }}>{hub.orders_count ?? 0}</span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {hub.is_active
                      ? <span className="badge badge-success">Active</span>
                      : <span className="badge badge-neutral">Inactive</span>
                    }
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleEdit(hub)}
                        title="Edit"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ color: 'var(--danger)' }}
                        onClick={() => {
                          if (window.confirm(`Delete hub "${hub.name}"?`)) destroy.mutate(hub.id)
                        }}
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
