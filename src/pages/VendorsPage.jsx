import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import toast from 'react-hot-toast'
import {
  Plus, Search, X, Users, Building2, ToggleLeft, ToggleRight,
  FileText, ExternalLink, CheckCircle, XCircle, Clock,
  ChevronRight, AlertTriangle, Shield, User, Phone, Mail,
  MapPin, Calendar, Hash, Briefcase,
} from 'lucide-react'

// ── helpers ───────────────────────────────────────────────────────────────────

function KycBadge({ status }) {
  const map = {
    approved:  { cls: 'badge-success',  label: 'Approved' },
    submitted: { cls: 'badge-warning',  label: 'Submitted' },
    rejected:  { cls: 'badge-danger',   label: 'Rejected' },
    pending:   { cls: 'badge-neutral',  label: 'Pending' },
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
  const isImg = /\.(jpg|jpeg|png|webp)(\?|$)/i.test(url)
  return (
    <a href={url} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: '#F0FDF4', borderRadius: 8, border: '1px solid #BBF7D0', textDecoration: 'none', transition: 'background 0.15s' }}
      onMouseEnter={e => e.currentTarget.style.background='#DCFCE7'}
      onMouseLeave={e => e.currentTarget.style.background='#F0FDF4'}>
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

// ── KYC Detail Drawer ─────────────────────────────────────────────────────────

function VendorKycDrawer({ vendorId, onClose }) {
  const qc = useQueryClient()
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)

  const { data: v, isLoading } = useQuery({
    queryKey: ['vendor-detail', vendorId],
    queryFn: () => api.get(`/admin/vendors/${vendorId}`).then(r => r.data.data),
    enabled: !!vendorId,
  })

  const approve = useMutation({
    mutationFn: () => api.patch(`/admin/kyc/vendors/${vendorId}/approve`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vendors'] })
      qc.invalidateQueries({ queryKey: ['vendor-detail', vendorId] })
      toast.success('Vendor KYC approved')
      setShowRejectForm(false)
    },
    onError: () => toast.error('Failed to approve'),
  })

  const reject = useMutation({
    mutationFn: () => api.patch(`/admin/kyc/vendors/${vendorId}/reject`, { reason: rejectReason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vendors'] })
      qc.invalidateQueries({ queryKey: ['vendor-detail', vendorId] })
      toast.success('Vendor KYC rejected')
      setShowRejectForm(false)
      setRejectReason('')
    },
    onError: (err) => toast.error(err.response?.data?.message ?? 'Failed to reject'),
  })

  const canReview = v && ['submitted', 'pending'].includes(v.kyc_status)

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200 }} />

      {/* Drawer */}
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
              <Building2 size={18} color="var(--primary)" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, fontFamily: 'var(--font-display)' }}>{v?.name ?? 'Vendor Details'}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>KYC Review</div>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}><X size={18} /></button>
        </div>

        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><span className="spinner" /></div>
        ) : !v ? (
          <div style={{ padding: 24, color: 'var(--text-secondary)' }}>Vendor not found.</div>
        ) : (
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* Status + type */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <KycBadge status={v.kyc_status} />
              {v.type && (
                <span className={`badge ${v.type === 'contract' ? 'badge-primary' : 'badge-neutral'}`}>
                  {v.type === 'contract' ? 'Contract Account' : 'Cash Account'}
                </span>
              )}
              {v.is_active && <span className="badge badge-success">Active</span>}
            </div>

            {/* Rejection reason if rejected */}
            {v.kyc_status === 'rejected' && v.kyc_rejection_reason && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '12px 16px', display: 'flex', gap: 10 }}>
                <AlertTriangle size={16} color="#DC2626" style={{ flexShrink: 0, marginTop: 1 }} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#DC2626', marginBottom: 2 }}>Rejection Reason</div>
                  <div style={{ fontSize: 13, color: '#7F1D1D' }}>{v.kyc_rejection_reason}</div>
                </div>
              </div>
            )}

            {/* Basic Info */}
            <section>
              <h4 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 14 }}>Business Information</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <InfoRow icon={Building2} label="Business Name"   value={v.name} />
                <InfoRow icon={Mail}     label="Email"            value={v.email} />
                <InfoRow icon={Phone}    label="Phone"            value={v.phone} />
                <InfoRow icon={MapPin}   label="Address"          value={v.address} />
                <InfoRow icon={User}     label="Director Name"    value={v.director_name} />
                <InfoRow icon={Hash}     label="Director ID No."  value={v.director_id_number} />
              </div>
            </section>

            {/* Registration Details */}
            {(v.business_reg_number || v.kra_pin) && (
              <section>
                <h4 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 14 }}>Registration Details</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <InfoRow icon={Briefcase} label="Business Reg. No."  value={v.business_reg_number} />
                  <InfoRow icon={Shield}    label="KRA PIN"            value={v.kra_pin} />
                </div>
              </section>
            )}

            {/* Timeline */}
            <section>
              <h4 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 14 }}>Timeline</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <InfoRow icon={Calendar} label="Submitted At"     value={v.kyc_submitted_at ? new Date(v.kyc_submitted_at).toLocaleString() : null} />
                <InfoRow icon={Calendar} label="Reviewed At"      value={v.kyc_reviewed_at  ? new Date(v.kyc_reviewed_at).toLocaleString()  : null} />
                <InfoRow icon={Calendar} label="Contract Signed"  value={v.contract_signed_at ? new Date(v.contract_signed_at).toLocaleString() : null} />
                {v.contract_ip && <InfoRow icon={Hash} label="Contract IP" value={v.contract_ip} />}
              </div>
            </section>

            {/* Documents */}
            <section>
              <h4 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 14 }}>Documents</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <DocLink label="Business Certificate / Registration" url={v.business_cert_url} />
                <DocLink label="KRA PIN Certificate"                 url={v.kra_cert_url} />
                <DocLink label="Director ID — Front"                 url={v.director_id_front_url} />
                <DocLink label="Director ID — Back"                  url={v.director_id_back_url} />
              </div>
            </section>

            {/* Users */}
            {v.users?.length > 0 && (
              <section>
                <h4 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 14 }}>
                  Users ({v.users.length})
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {v.users.map(u => (
                    <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: '#F7F7F7', borderRadius: 8 }}>
                      <div style={{ width: 32, height: 32, background: '#E5E5E5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <User size={14} color="#6B6B6B" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: '#0D0D0D' }}>{u.name}</div>
                        <div style={{ fontSize: 12, color: '#9B9B9B' }}>{u.email}</div>
                      </div>
                      <span className={`badge ${u.is_active ? 'badge-success' : 'badge-neutral'}`} style={{ fontSize: 10 }}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

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
                      <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => { setShowRejectForm(false); setRejectReason('') }}>
                        Cancel
                      </button>
                      <button className="btn btn-danger" style={{ flex: 1, justifyContent: 'center' }} disabled={!rejectReason.trim() || reject.isPending} onClick={() => reject.mutate()}>
                        {reject.isPending ? <span className="spinner" /> : <><XCircle size={15} /> Confirm Reject</>}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button className="btn btn-secondary btn-danger-outline" style={{ flex: 1, justifyContent: 'center', border: '1px solid var(--danger)', color: 'var(--danger)' }} onClick={() => setShowRejectForm(true)}>
                      <XCircle size={15} /> Reject
                    </button>
                    <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', background: 'var(--success)' }} disabled={approve.isPending} onClick={() => approve.mutate()}>
                      {approve.isPending ? <span className="spinner" /> : <><CheckCircle size={15} /> Approve</>}
                    </button>
                  </div>
                )}
              </section>
            )}

            {v.kyc_status === 'approved' && (
              <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, padding: '12px 16px', display: 'flex', gap: 10, alignItems: 'center' }}>
                <CheckCircle size={16} color="#16A34A" />
                <span style={{ fontSize: 13, color: '#15803D', fontWeight: 500 }}>KYC approved — vendor is active</span>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}

// ── Edit Modal ────────────────────────────────────────────────────────────────

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

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 16 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'var(--surface)', borderRadius: 12, width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px 16px', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ margin: 0, fontSize: 18 }}>{isEdit ? 'Edit Vendor' : 'New Vendor'}</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={e => { e.preventDefault(); mutation.mutate(form) }} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
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

// ── Page ──────────────────────────────────────────────────────────────────────

export default function VendorsPage() {
  const qc = useQueryClient()
  const [search, setSearch]         = useState('')
  const [kycFilter, setKycFilter]   = useState('')
  const [modalVendor, setModalVendor] = useState(undefined)
  const [drawerVendorId, setDrawerVendorId] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['vendors', search, kycFilter],
    queryFn: () => api.get('/admin/vendors', { params: { search, per_page: 50, kyc_status: kycFilter || undefined } }).then(r => r.data.data),
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

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 300 }}>
          <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input className="form-control" style={{ paddingLeft: 32 }} placeholder="Search vendors…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="form-control" style={{ width: 'auto' }} value={kycFilter} onChange={e => setKycFilter(e.target.value)}>
          <option value="">All KYC statuses</option>
          <option value="pending">Pending</option>
          <option value="submitted">Submitted</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}><span className="spinner" /></div>
        ) : vendors.length === 0 ? (
          <p className="text-muted text-sm" style={{ padding: 24 }}>No vendors found.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Vendor</th>
                  <th>Contact</th>
                  <th>Type</th>
                  <th>KYC</th>
                  <th>Users</th>
                  <th>Active</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {vendors.map(v => (
                  <tr key={v.id} style={{ cursor: 'pointer' }} onClick={() => setDrawerVendorId(v.id)}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 34, height: 34, background: '#FFF0E8', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Building2 size={15} color="var(--primary)" />
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{v.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{v.address ?? '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: 13 }}>{v.email}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{v.phone ?? '—'}</div>
                    </td>
                    <td>
                      {v.type ? (
                        <span className={`badge ${v.type === 'contract' ? 'badge-primary' : 'badge-neutral'}`}>
                          {v.type}
                        </span>
                      ) : <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>—</span>}
                    </td>
                    <td><KycBadge status={v.kyc_status ?? 'pending'} /></td>
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
                    <td onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <button className="btn btn-ghost btn-sm" title={v.is_active ? 'Deactivate' : 'Activate'}
                          onClick={() => toggleActive.mutate({ id: v.id, is_active: !v.is_active })}>
                          {v.is_active
                            ? <ToggleRight size={16} color="var(--success)" />
                            : <ToggleLeft size={16} color="var(--text-secondary)" />}
                        </button>
                        <button className="btn btn-ghost btn-sm" onClick={() => setModalVendor(v)}>Edit</button>
                        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--primary)' }} onClick={() => setDrawerVendorId(v.id)}>
                          View <ChevronRight size={13} />
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

      {drawerVendorId && (
        <VendorKycDrawer vendorId={drawerVendorId} onClose={() => setDrawerVendorId(null)} />
      )}

      {modalVendor !== undefined && (
        <VendorModal vendor={modalVendor} onClose={() => setModalVendor(undefined)} />
      )}
    </div>
  )
}
