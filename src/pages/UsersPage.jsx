import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store/authStore'
import { Search, UserPlus, CheckCircle, XCircle, Trash2, UserCheck, ShieldCheck, ShieldOff, X, Star } from 'lucide-react'
import Select from '../components/Select'

const ROLE_BADGE = { admin: 'badge-primary', vendor: 'badge-neutral', rider: 'badge-warning' }

function Avatar({ name }) {
  return (
    <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
      {name?.charAt(0).toUpperCase()}
    </div>
  )
}

function CreateUserModal({ onClose, onSuccess, currentUserIsSuperAdmin }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', role: 'vendor', vendor_id: '', vehicle_type: 'motorbike', is_super_admin: false })
  const [loading, setLoading] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const { data: vendorsList } = useQuery({
    queryKey: ['vendors-list'],
    queryFn: () => api.get('/vendors').then(r => r.data.data ?? []),
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/admin/users', form)
      toast.success('User created successfully')
      onSuccess()
    } catch (err) {
      const errors = err.response?.data?.errors
      toast.error(errors ? Object.values(errors).flat()[0] : err.response?.data?.error ?? 'Failed to create user')
    } finally {
      setLoading(false)
    }
  }

  const availableRoles = currentUserIsSuperAdmin
    ? [['vendor', 'Vendor'], ['rider', 'Rider'], ['admin', 'Admin']]
    : [['vendor', 'Vendor'], ['rider', 'Rider']]

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
      <div className="card" style={{ width: '100%', maxWidth: 480, margin: 0, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0 }}>Create User</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose}><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-control" required value={form.name} onChange={e => set('name', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-control" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+254700000000" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <input type="email" className="form-control" required value={form.email} onChange={e => set('email', e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label">Role</label>
            <Select value={form.role} onChange={e => set('role', e.target.value)} options={availableRoles} />
          </div>

          {form.role === 'vendor' && (
            <div className="form-group">
              <label className="form-label">Vendor Shop <span style={{ color: 'var(--danger)' }}>*</span></label>
              <Select
                value={form.vendor_id}
                onChange={e => set('vendor_id', e.target.value)}
                placeholder="— Select vendor —"
                options={(vendorsList ?? []).map(v => ({ value: v.id, label: v.name }))}
              />
            </div>
          )}

          {form.role === 'rider' && (
            <div className="form-group">
              <label className="form-label">Vehicle Type</label>
              <Select
                value={form.vehicle_type}
                onChange={e => set('vehicle_type', e.target.value)}
                options={[
                  { value: 'bicycle', label: 'Bicycle' },
                  { value: 'motorbike', label: 'Motorbike' },
                  { value: 'car', label: 'Car' },
                  { value: 'van', label: 'Van' },
                ]}
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Temporary Password</label>
            <input type="password" className="form-control" required minLength={8} value={form.password} onChange={e => set('password', e.target.value)} />
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>User can change this after logging in</span>
          </div>

          {form.role === 'admin' && currentUserIsSuperAdmin && (
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                <input type="checkbox" checked={form.is_super_admin} onChange={e => set('is_super_admin', e.target.checked)} />
                Grant Super Admin privileges
              </label>
              <span style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>Super admins can create other admins and manage all admin accounts</span>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner" /> : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function RoleChangeModal({ user, onClose, onSuccess, currentUserIsSuperAdmin }) {
  const [role, setRole] = useState(user.role)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.patch(`/admin/users/${user.id}/role`, { role })
      toast.success('Role updated')
      onSuccess()
    } catch (err) {
      toast.error(err.response?.data?.error ?? 'Failed to update role')
    } finally {
      setLoading(false)
    }
  }

  const availableRoles = currentUserIsSuperAdmin
    ? [['vendor', 'Vendor'], ['rider', 'Rider'], ['admin', 'Admin']]
    : [['vendor', 'Vendor'], ['rider', 'Rider']]

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div className="card" style={{ width: 360, margin: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0 }}>Change Role</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose}><X size={16} /></button>
        </div>
        <p className="text-sm text-muted" style={{ marginBottom: 16 }}>Changing role for <strong>{user.name}</strong></p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">New Role</label>
            <Select value={role} onChange={e => setRole(e.target.value)} options={availableRoles} />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={loading || role === user.role}>
              {loading ? <span className="spinner" /> : 'Save Role'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function UsersPage() {
  const { user: me, isSuperAdmin } = useAuthStore()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [showCreate, setShowCreate] = useState(false)
  const [roleModal, setRoleModal] = useState(null)

  const superAdmin = isSuperAdmin()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => api.get('/admin/users').then(r => r.data.data),
  })

  const refetch = () => qc.invalidateQueries(['admin-users'])

  const toggleActive = useMutation({
    mutationFn: ({ id, is_active }) => api.patch(`/admin/users/${id}`, { is_active }),
    onSuccess: () => { toast.success('User updated'); refetch() },
    onError: (err) => toast.error(err.response?.data?.error ?? 'Update failed'),
  })

  const approveRider = useMutation({
    mutationFn: (id) => api.patch(`/admin/users/${id}/approve`),
    onSuccess: () => { toast.success('Rider approved'); refetch() },
    onError: (err) => toast.error(err.response?.data?.error ?? 'Approval failed'),
  })

  const toggleSuperAdmin = useMutation({
    mutationFn: (id) => api.patch(`/admin/users/${id}/toggle-super-admin`),
    onSuccess: () => { toast.success('Super admin status updated'); refetch() },
    onError: (err) => toast.error(err.response?.data?.error ?? 'Failed'),
  })

  const deleteUser = useMutation({
    mutationFn: (id) => api.delete(`/admin/users/${id}`),
    onSuccess: () => { toast.success('User deleted'); refetch() },
    onError: (err) => toast.error(err.response?.data?.error ?? 'Delete failed'),
  })

  const allUsers = data?.data ?? data ?? []
  const users = allUsers.filter(u => {
    const matchRole = roleFilter === 'all' || u.role === roleFilter
    const matchSearch = !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase())
    return matchRole && matchSearch
  })

  const canActOn = (u) => {
    if (u.id === me?.id) return false
    if (u.role === 'admin' && !superAdmin) return false
    return true
  }

  return (
    <div>
      {showCreate && (
        <CreateUserModal
          currentUserIsSuperAdmin={superAdmin}
          onClose={() => setShowCreate(false)}
          onSuccess={() => { setShowCreate(false); refetch() }}
        />
      )}
      {roleModal && (
        <RoleChangeModal
          user={roleModal}
          currentUserIsSuperAdmin={superAdmin}
          onClose={() => setRoleModal(null)}
          onSuccess={() => { setRoleModal(null); refetch() }}
        />
      )}

      <div className="page-header">
        <div>
          <h1 className="page-title">Users</h1>
          <p className="text-sm text-muted">{users.length} user{users.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          <UserPlus size={15} /> Create User
        </button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200, maxWidth: 320 }}>
          <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input className="form-control" style={{ paddingLeft: 32 }} placeholder="Search by name or email…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select
          style={{ width: 150 }}
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          options={[
            { value: 'all', label: 'All Roles' },
            { value: 'admin', label: 'Admin' },
            { value: 'vendor', label: 'Vendor' },
            { value: 'rider', label: 'Rider' },
          ]}
        />
      </div>

      <div className="card">
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}><span className="spinner" /></div>
        ) : users.length === 0 ? (
          <p className="text-muted text-sm">No users found.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Vehicle / Score</th>
                  <th>Joined</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <Avatar name={u.name} />
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontWeight: 600, fontSize: 13 }}>{u.name}</span>
                            {u.is_super_admin && (
                              <span title="Super Admin" style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, background: '#FFF0E8', color: 'var(--primary)', borderRadius: 4, padding: '1px 6px', fontWeight: 600 }}>
                                <ShieldCheck size={10} /> Super Admin
                              </span>
                            )}
                            {u.id === me?.id && (
                              <span style={{ fontSize: 11, color: 'var(--text-secondary)', background: 'var(--surface-muted)', borderRadius: 4, padding: '1px 6px' }}>You</span>
                            )}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{u.email}</div>
                          {u.phone && <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{u.phone}</div>}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${ROLE_BADGE[u.role] ?? 'badge-neutral'}`}>{u.role}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <span className={`badge ${u.is_active ? 'badge-success' : 'badge-danger'}`}>
                          {u.is_active ? 'Active' : 'Suspended'}
                        </span>
                        {u.role === 'rider' && (
                          <span className={`badge ${u.rider_profile?.admin_approved ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: 10 }}>
                            {u.rider_profile?.admin_approved ? 'Approved' : 'Pending approval'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                      {u.rider_profile ? (
                        <div>
                          <div>{u.rider_profile.vehicle_type}</div>
                          <div style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 3 }}><Star size={11} color="var(--warning)" fill="var(--warning)" />{u.rider_profile.reliability_score}</div>
                        </div>
                      ) : '—'}
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                        {/* Approve pending rider */}
                        {u.role === 'rider' && !u.rider_profile?.admin_approved && canActOn(u) && (
                          <button className="btn btn-ghost btn-sm" title="Approve rider" onClick={() => approveRider.mutate(u.id)}>
                            <UserCheck size={14} color="var(--success)" />
                          </button>
                        )}

                        {/* Change role */}
                        {canActOn(u) && (
                          <button className="btn btn-ghost btn-sm" title="Change role" onClick={() => setRoleModal(u)}>
                            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>Role</span>
                          </button>
                        )}

                        {/* Toggle super admin (only super admin, only on other admins) */}
                        {superAdmin && u.role === 'admin' && u.id !== me?.id && (
                          <button
                            className="btn btn-ghost btn-sm"
                            title={u.is_super_admin ? 'Revoke Super Admin' : 'Grant Super Admin'}
                            onClick={() => toggleSuperAdmin.mutate(u.id)}
                          >
                            {u.is_super_admin
                              ? <ShieldOff size={14} color="var(--danger)" />
                              : <ShieldCheck size={14} color="var(--primary)" />}
                          </button>
                        )}

                        {/* Suspend / Activate */}
                        {canActOn(u) && (
                          <button
                            className="btn btn-ghost btn-sm"
                            title={u.is_active ? 'Suspend' : 'Activate'}
                            onClick={() => {
                              if (u.is_active) {
                                const reason = prompt('Reason for suspension?')
                                if (!reason) return
                                api.patch(`/admin/users/${u.id}/suspend`, { reason })
                                  .then(() => { toast.success('User suspended'); refetch() })
                                  .catch(err => toast.error(err.response?.data?.error ?? 'Failed'))
                              } else {
                                toggleActive.mutate({ id: u.id, is_active: true })
                              }
                            }}
                          >
                            {u.is_active
                              ? <XCircle size={14} color="var(--danger)" />
                              : <CheckCircle size={14} color="var(--success)" />}
                          </button>
                        )}

                        {/* Delete */}
                        {canActOn(u) && (
                          <button
                            className="btn btn-ghost btn-sm"
                            title="Delete user"
                            onClick={() => { if (confirm(`Permanently delete ${u.name}?`)) deleteUser.mutate(u.id) }}
                          >
                            <Trash2 size={14} color="var(--danger)" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
