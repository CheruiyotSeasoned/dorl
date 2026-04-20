import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import toast from 'react-hot-toast'
import { Plus, Search, X, Users, Building2, ToggleLeft, ToggleRight } from 'lucide-react'

function VendorModal({ vendor, onClose }) {
  const qc = useQueryClient()
  const isEdit = !!vendor

  const [form, setForm] = useState({
    name:    vendor?.name    ?? '',
    email:   vendor?.email   ?? '',
    phone:   vendor?.phone   ?? '',
    address: vendor?.address ?? '',
  })

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const mutation = useMutation({
    mutationFn: (data) => isEdit
      ? api.put(`/admin/vendors/${vendor.id}`, data).then(r => r.data)
      : api.post('/admin/vendors', data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vendors'] })
      toast.success(isEdit ? 'Vendor updated' : 'Vendor created')
      onClose()
    },
    onError: (err) => {
      const errors = err.response?.data?.errors
      toast.error(errors ? Object.values(errors).flat()[0] : 'Failed to save vendor')
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    mutation.mutate(form)
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background: 'var(--surface)', borderRadius: 12, width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px 16px', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ margin: 0, fontSize: 18 }}>{isEdit ? 'Edit Vendor' : 'New Vendor'}</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Shop Name <span style={{ color: 'var(--danger)' }}>*</span></label>
            <input className="form-control" required value={form.name} onChange={e => setF('name', e.target.value)} placeholder="e.g. Jumia Express" />
          </div>
          <div className="form-group">
            <label className="form-label">Email <span style={{ color: 'var(--danger)' }}>*</span></label>
            <input className="form-control" type="email" required value={form.email} onChange={e => setF('email', e.target.value)} placeholder="shop@example.com" />
          </div>
          <div className="form-group">
            <label className="form-label">Phone</label>
            <input className="form-control" value={form.phone} onChange={e => setF('phone', e.target.value)} placeholder="+254 712 345 678" />
          </div>
          <div className="form-group">
            <label className="form-label">Address</label>
            <input className="form-control" value={form.address} onChange={e => setF('address', e.target.value)} placeholder="Physical address or area" />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
              {mutation.isPending ? <span className="spinner" /> : isEdit ? 'Save Changes' : 'Create Vendor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function VendorsPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [modalVendor, setModalVendor] = useState(undefined) // undefined = closed, null = new, obj = edit

  const { data, isLoading } = useQuery({
    queryKey: ['vendors', search],
    queryFn: () => api.get('/admin/vendors', { params: { search, per_page: 50 } }).then(r => r.data.data),
  })

  const vendors = data?.data ?? data ?? []

  const toggleActive = useMutation({
    mutationFn: ({ id, is_active }) => api.put(`/admin/vendors/${id}`, { is_active }).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vendors'] }); toast.success('Updated') },
    onError: () => toast.error('Failed to update'),
  })

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Vendors</h1>
        <button className="btn btn-primary" onClick={() => setModalVendor(null)}>
          <Plus size={16} /> New Vendor
        </button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 300 }}>
          <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input className="form-control" style={{ paddingLeft: 32 }} placeholder="Search vendors…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="card">
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}><span className="spinner" /></div>
        ) : vendors.length === 0 ? (
          <p className="text-muted text-sm">No vendors found.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Shop</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Address</th>
                  <th>Users</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {vendors.map(v => (
                  <tr key={v.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Building2 size={15} color="var(--primary)" />
                        <span style={{ fontWeight: 600 }}>{v.name}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: 13 }}>{v.email}</td>
                    <td style={{ fontSize: 13 }}>{v.phone ?? '—'}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{v.address ?? '—'}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13 }}>
                        <Users size={13} color="var(--text-secondary)" />
                        {v.users_count ?? 0}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${v.is_active ? 'badge-success' : 'badge-neutral'}`}>
                        {v.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          className="btn btn-ghost btn-sm"
                          title={v.is_active ? 'Deactivate' : 'Activate'}
                          onClick={() => toggleActive.mutate({ id: v.id, is_active: !v.is_active })}
                        >
                          {v.is_active ? <ToggleRight size={16} color="var(--success)" /> : <ToggleLeft size={16} color="var(--text-secondary)" />}
                        </button>
                        <button className="btn btn-ghost btn-sm" onClick={() => setModalVendor(v)}>
                          Edit
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

      {modalVendor !== undefined && (
        <VendorModal vendor={modalVendor} onClose={() => setModalVendor(undefined)} />
      )}
    </div>
  )
}
