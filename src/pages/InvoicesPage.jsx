import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../lib/api'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store/authStore'
import { Download, Search, Eye, X } from 'lucide-react'
import Select from '../components/Select'

async function downloadInvoice(id) {
  try {
    const res = await api.get(`/invoices/${id}/download`, { responseType: 'blob' })
    const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
    const a   = document.createElement('a')
    a.href     = url
    a.download = `invoice-${id}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  } catch {
    toast.error('Failed to download invoice')
  }
}

function InvoicePreviewModal({ invoiceId, onClose }) {
  const { data, isLoading } = useQuery({
    queryKey: ['invoice', invoiceId],
    queryFn: () => api.get(`/invoices/${invoiceId}`).then(r => r.data.data),
    enabled: !!invoiceId,
  })

  const inv = data

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: 16,
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: 'var(--surface)', borderRadius: 12, width: '100%', maxWidth: 620,
        maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px 16px', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ margin: 0, fontSize: 18 }}>Invoice Preview</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose}><X size={16} /></button>
        </div>

        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><span className="spinner" /></div>
        ) : !inv ? (
          <p style={{ padding: 24 }} className="text-muted text-sm">Invoice not found.</p>
        ) : (
          <div style={{ padding: '20px 24px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ fontFamily: 'monospace', fontSize: 20, fontWeight: 700, color: 'var(--primary)' }}>{inv.invoice_number}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{inv.vendor_name} · {inv.vendor_email}</div>
              </div>
              <span className={`badge ${inv.status === 'paid' ? 'badge-success' : inv.status === 'void' ? 'badge-danger' : inv.status === 'issued' ? 'badge-primary' : 'badge-neutral'}`} style={{ fontSize: 13, padding: '4px 12px' }}>
                {inv.status}
              </span>
            </div>

            <div className="grid-2" style={{ marginBottom: 20, gap: 12 }}>
              <div style={{ fontSize: 13 }}><span style={{ color: 'var(--text-secondary)' }}>Issued: </span>{inv.issued_at ? new Date(inv.issued_at).toLocaleDateString() : '—'}</div>
              <div style={{ fontSize: 13 }}><span style={{ color: 'var(--text-secondary)' }}>Due: </span>{inv.due_date ? new Date(inv.due_date).toLocaleDateString() : '—'}</div>
              {inv.order && (
                <>
                  <div style={{ fontSize: 13 }}><span style={{ color: 'var(--text-secondary)' }}>Order: </span>#{inv.order.id}</div>
                  <div style={{ fontSize: 13 }}><span style={{ color: 'var(--text-secondary)' }}>Route: </span>{inv.order.pickup_address?.split(',')[0]} → {inv.order.dropoff_address?.split(',')[0]}</div>
                </>
              )}
            </div>

            {Array.isArray(inv.line_items) && inv.line_items.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Line Items</div>
                <div className="table-wrap">
                  <table className="table" style={{ fontSize: 13 }}>
                    <thead>
                      <tr>
                        <th>Description</th>
                        <th style={{ textAlign: 'right' }}>Qty</th>
                        <th style={{ textAlign: 'right' }}>Unit (KES)</th>
                        <th style={{ textAlign: 'right' }}>Total (KES)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inv.line_items.map((item, i) => (
                        <tr key={i}>
                          <td>{item.description}</td>
                          <td style={{ textAlign: 'right' }}>{item.qty ?? 1}</td>
                          <td style={{ textAlign: 'right' }}>{Number(item.unit_price ?? item.amount ?? 0).toLocaleString()}</td>
                          <td style={{ textAlign: 'right', fontWeight: 600 }}>{Number(item.total ?? item.amount ?? 0).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
              <div style={{ fontSize: 13, display: 'flex', gap: 40 }}>
                <span style={{ color: 'var(--text-secondary)' }}>Subtotal</span>
                <span>KES {Number(inv.subtotal ?? 0).toLocaleString()}</span>
              </div>
              {Number(inv.tax_amount) > 0 && (
                <div style={{ fontSize: 13, display: 'flex', gap: 40 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Tax ({inv.tax_rate}%)</span>
                  <span>KES {Number(inv.tax_amount).toLocaleString()}</span>
                </div>
              )}
              <div style={{ fontSize: 16, fontWeight: 700, display: 'flex', gap: 40, color: 'var(--primary)', borderTop: '1px solid var(--border)', paddingTop: 8, marginTop: 4 }}>
                <span>Total</span>
                <span>KES {Number(inv.total_amount).toLocaleString()}</span>
              </div>
            </div>

            {inv.notes && (
              <div style={{ marginTop: 16, fontSize: 12, color: 'var(--text-secondary)', background: 'var(--bg)', borderRadius: 8, padding: '10px 14px' }}>
                {inv.notes}
              </div>
            )}

            <div style={{ marginTop: 20, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={onClose}>Close</button>
              <button className="btn btn-primary" onClick={() => downloadInvoice(inv.id)}>
                <Download size={14} /> Download PDF
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function InvoicesPage() {
  const { isAdmin } = useAuthStore()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [previewId, setPreviewId] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => isAdmin()
      ? api.get('/admin/invoices').then(r => r.data.data)
      : api.get('/invoices').then(r => r.data.data),
  })

  const invoices = (data?.data ?? data ?? []).filter(inv => {
    const matchStatus = statusFilter === 'all' || inv.status === statusFilter
    const matchSearch = !search || inv.invoice_number?.toLowerCase().includes(search.toLowerCase()) || inv.order?.pickup_address?.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  const total = invoices.reduce((s, inv) => s + Number(inv.total_amount ?? 0), 0)

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Invoices</h1>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Filtered Total</div>
          <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--primary)' }}>KES {total.toLocaleString()}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 300 }}>
          <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input className="form-control" style={{ paddingLeft: 32 }} placeholder="Search invoices…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select
          style={{ width: 160 }}
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          options={[
            { value: 'all', label: 'All Statuses' },
            { value: 'draft', label: 'Draft' },
            { value: 'issued', label: 'Issued' },
            { value: 'paid', label: 'Paid' },
            { value: 'void', label: 'Void' },
          ]}
        />
      </div>

      <div className="card">
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}><span className="spinner" /></div>
        ) : invoices.length === 0 ? (
          <p className="text-muted text-sm">No invoices found.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Issued</th>
                  <th>Due</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => (
                  <tr key={inv.id}>
                    <td style={{ fontWeight: 600, fontFamily: 'monospace', fontSize: 13 }}>{inv.invoice_number}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      #{inv.order?.id}
                    </td>
                    <td style={{ fontSize: 13 }}>{inv.vendor?.name ?? '—'}</td>
                    <td style={{ fontWeight: 700, color: 'var(--primary)' }}>KES {Number(inv.total_amount).toLocaleString()}</td>
                    <td>
                      <span className={`badge ${inv.status === 'paid' ? 'badge-success' : inv.status === 'void' ? 'badge-danger' : inv.status === 'issued' ? 'badge-primary' : 'badge-neutral'}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      {inv.issued_at ? new Date(inv.issued_at).toLocaleDateString() : '—'}
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      {inv.due_date ? new Date(inv.due_date).toLocaleDateString() : '—'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-ghost btn-sm" title="Preview" onClick={() => setPreviewId(inv.id)}>
                          <Eye size={14} />
                        </button>
                        <button className="btn btn-ghost btn-sm" title="Download PDF" onClick={() => downloadInvoice(inv.id)}>
                          <Download size={14} />
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

      {previewId && <InvoicePreviewModal invoiceId={previewId} onClose={() => setPreviewId(null)} />}
    </div>
  )
}
