import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MapPin, Plus, Pencil, Trash2, Phone, Users, MousePointerClick, X } from 'lucide-react'
import api from '../lib/api'
import toast from 'react-hot-toast'
import HereMap from '../components/HereMap'

const EMPTY = { name: '', county: '', town: '', address: '', lat: '', lng: '', contact_phone: '', is_active: true }

const KE_COUNTIES = [
  'Baringo','Bomet','Bungoma','Busia','Elgeyo-Marakwet','Embu','Garissa','Homa Bay',
  'Isiolo','Kajiado','Kakamega','Kericho','Kiambu','Kilifi','Kirinyaga','Kisii','Kisumu',
  'Kitui','Kwale','Laikipia','Lamu','Machakos','Makueni','Mandera','Marsabit','Meru',
  'Migori','Mombasa','Murang\'a','Nairobi','Nakuru','Nandi','Narok','Nyamira','Nyandarua',
  'Nyeri','Samburu','Siaya','Taita-Taveta','Tana River','Tharaka-Nithi','Trans Nzoia',
  'Turkana','Uasin Gishu','Vihiga','Wajir','West Pokot',
]

export default function PickupStationsPage() {
  const qc = useQueryClient()
  const [modal, setModal] = useState(null) // null | 'create' | station object
  const [form, setForm] = useState(EMPTY)
  const [deleting, setDeleting] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['pickup-stations'],
    queryFn: () => api.get('/pickup-stations').then(r => r.data.data),
  })

  const save = useMutation({
    mutationFn: (payload) =>
      modal === 'create'
        ? api.post('/admin/pickup-stations', payload)
        : api.put(`/admin/pickup-stations/${modal.id}`, payload),
    onSuccess: () => {
      toast.success(modal === 'create' ? 'Station created' : 'Station updated')
      qc.invalidateQueries(['pickup-stations'])
      setModal(null)
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Failed'),
  })

  const remove = useMutation({
    mutationFn: (id) => api.delete(`/admin/pickup-stations/${id}`),
    onSuccess: () => {
      toast.success('Station deleted')
      qc.invalidateQueries(['pickup-stations'])
      setDeleting(null)
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Cannot delete'),
  })

  const openCreate = () => { setForm(EMPTY); setModal('create') }
  const openEdit = (s) => { setForm({ ...s, lat: s.lat ?? '', lng: s.lng ?? '' }); setModal(s) }

  const handleSubmit = (e) => {
    e.preventDefault()
    save.mutate({
      ...form,
      county: form.county || null,
      lat: form.lat !== '' ? parseFloat(form.lat) : null,
      lng: form.lng !== '' ? parseFloat(form.lng) : null,
    })
  }

  const stations = data || []

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Pickup Stations</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: 14 }}>
            Customer-facing collection points across towns
          </p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> New Station</button>
      </div>

      {isLoading ? (
        <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>Loading…</div>
      ) : stations.length === 0 ? (
        <div className="card" style={{ padding: 60, textAlign: 'center' }}>
          <MapPin size={40} style={{ color: 'var(--text-secondary)', marginBottom: 12 }} />
          <p style={{ color: 'var(--text-secondary)' }}>No pickup stations yet. Create one to start.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {stations.map(s => (
            <div key={s.id} className="card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{s.name}</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 2 }}>
                    {[s.county, s.town].filter(Boolean).join(' · ')}
                  </div>
                </div>
                <span style={{
                  fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 20,
                  background: s.is_active ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                  color: s.is_active ? '#16a34a' : '#dc2626',
                }}>
                  {s.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              {s.address && (
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 10, display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                  <MapPin size={13} style={{ flexShrink: 0, marginTop: 2 }} />
                  {s.address}
                </div>
              )}
              {s.contact_phone && (
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 6, display: 'flex', gap: 6 }}>
                  <Phone size={13} style={{ flexShrink: 0 }} />
                  {s.contact_phone}
                </div>
              )}
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 6, display: 'flex', gap: 6 }}>
                <Users size={13} style={{ flexShrink: 0 }} />
                {s.shipment_items_count ?? 0} items assigned
              </div>

              {s.lat && s.lng && (
                <div style={{ marginTop: 12, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
                  <HereMap
                    height="130px"
                    center={{ lat: s.lat, lng: s.lng }}
                    zoom={15}
                    markers={[{ lat: s.lat, lng: s.lng, label: '📍', color: '#FF5E14' }]}
                  />
                </div>
              )}

              <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => openEdit(s)}>
                  <Pencil size={13} /> Edit
                </button>
                <button className="btn btn-danger btn-sm" onClick={() => setDeleting(s)}>
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div
            className="modal"
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: 700, width: '95vw', maxHeight: '92vh', overflowY: 'auto' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0 }}>
                {modal === 'create' ? 'New Pickup Station' : `Edit: ${modal.name}`}
              </h2>
              <button
                type="button"
                onClick={() => setModal(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 4 }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label>Station Name *</label>
                  <input className="form-control" value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label>County</label>
                  <select className="form-control" value={form.county}
                    onChange={e => setForm(f => ({ ...f, county: e.target.value }))}>
                    <option value="">Select county…</option>
                    {KE_COUNTIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Town / Area *</label>
                <input className="form-control" value={form.town}
                  onChange={e => setForm(f => ({ ...f, town: e.target.value }))} required />
              </div>

              <div className="form-group">
                <label>Full Address</label>
                <input className="form-control" value={form.address}
                  onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
              </div>

              {/* ── Map location picker ─────────────────────────────────────── */}
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: 14 }}>
                  Location <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>(click map to pin)</span>
                </label>

                {/* Hint banner */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 12px', borderRadius: 8, marginBottom: 8,
                  background: form.lat ? 'rgba(34,197,94,0.08)' : 'rgba(59,130,246,0.08)',
                  fontSize: 13, color: form.lat ? '#16a34a' : '#3b82f6',
                }}>
                  <MousePointerClick size={14} style={{ flexShrink: 0 }} />
                  {form.lat
                    ? `Pinned: ${parseFloat(form.lat).toFixed(6)}, ${parseFloat(form.lng).toFixed(6)}`
                    : 'Click anywhere on the map to set the exact pickup location'}
                </div>

                <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)' }}>
                  <HereMap
                    height="300px"
                    center={
                      form.lat && form.lng
                        ? { lat: parseFloat(form.lat), lng: parseFloat(form.lng) }
                        : { lat: -1.2921, lng: 36.8219 } // Nairobi default
                    }
                    zoom={form.lat ? 15 : 12}
                    markers={
                      form.lat && form.lng
                        ? [{ lat: parseFloat(form.lat), lng: parseFloat(form.lng), label: '📍', color: '#FF5E14' }]
                        : []
                    }
                    onMapClick={(lat, lng) => {
                      setForm(f => ({
                        ...f,
                        lat: lat.toFixed(7),
                        lng: lng.toFixed(7),
                      }))
                    }}
                  />
                </div>

                {/* Coordinate display + clear */}
                <div style={{ display: 'flex', gap: 10, marginTop: 8, alignItems: 'center' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, flex: 1 }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: 12 }}>Latitude</label>
                      <input
                        type="number" step="any" className="form-control"
                        value={form.lat}
                        onChange={e => setForm(f => ({ ...f, lat: e.target.value }))}
                        placeholder="—"
                        style={{ fontFamily: 'monospace', fontSize: 13 }}
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: 12 }}>Longitude</label>
                      <input
                        type="number" step="any" className="form-control"
                        value={form.lng}
                        onChange={e => setForm(f => ({ ...f, lng: e.target.value }))}
                        placeholder="—"
                        style={{ fontFamily: 'monospace', fontSize: 13 }}
                      />
                    </div>
                  </div>
                  {(form.lat || form.lng) && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ alignSelf: 'flex-end', marginBottom: 1 }}
                      onClick={() => setForm(f => ({ ...f, lat: '', lng: '' }))}
                    >
                      Clear pin
                    </button>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label>Contact Phone</label>
                <input className="form-control" value={form.contact_phone}
                  onChange={e => setForm(f => ({ ...f, contact_phone: e.target.value }))} />
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.is_active}
                  onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
                <span style={{ fontSize: 14 }}>Active</span>
              </label>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={save.isPending}>
                  {save.isPending ? 'Saving…' : 'Save Station'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleting && (
        <div className="modal-overlay" onClick={() => setDeleting(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <h2 style={{ margin: '0 0 12px' }}>Delete Station?</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
              Delete <strong>{deleting.name}</strong>? This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setDeleting(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => remove.mutate(deleting.id)} disabled={remove.isPending}>
                {remove.isPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
