import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Wallet, TrendingUp, ArrowDownLeft, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import api from '../lib/api'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store/authStore'

const PAYOUT_STATUS = {
  requested:  { label: 'Requested',  color: '#f59e0b' },
  processing: { label: 'Processing', color: '#3b82f6' },
  paid:       { label: 'Paid',       color: '#22c55e' },
  rejected:   { label: 'Rejected',   color: '#ef4444' },
}

function PayoutRequestModal({ balances, onClose, onSubmit }) {
  const [form, setForm] = useState({ amount: '', bank_name: '', account_number: '', account_name: '', notes: '' })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (parseFloat(form.amount) > balances.available) {
      toast.error('Amount exceeds available balance')
      return
    }
    onSubmit(form)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
        <h2 style={{ margin: '0 0 8px' }}>Request Payout</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 20 }}>
          Available balance: <strong style={{ color: '#22c55e' }}>KES {balances.available?.toLocaleString()}</strong>
        </p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label>Amount (KES) *</label>
            <input type="number" className="form-control" min="1" max={balances.available}
              value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required />
          </div>
          <div className="form-group">
            <label>Bank Name *</label>
            <input className="form-control" placeholder="e.g. Equity Bank, KCB, M-Pesa Paybill"
              value={form.bank_name} onChange={e => setForm(f => ({ ...f, bank_name: e.target.value }))} required />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label>Account Number *</label>
              <input className="form-control" value={form.account_number}
                onChange={e => setForm(f => ({ ...f, account_number: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label>Account Name *</label>
              <input className="form-control" value={form.account_name}
                onChange={e => setForm(f => ({ ...f, account_name: e.target.value }))} required />
            </div>
          </div>
          <div className="form-group">
            <label>Notes</label>
            <textarea className="form-control" rows={2} value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Submit Request</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function SellerWalletPage() {
  const { isAdmin } = useAuthStore()
  const qc = useQueryClient()
  const [showPayoutModal, setShowPayoutModal] = useState(false)
  const [processingPayout, setProcessingPayout] = useState(null)
  const [bankRef, setBankRef] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['wallet'],
    queryFn: () => api.get('/wallet').then(r => r.data.data),
  })

  const { data: adminPayouts } = useQuery({
    queryKey: ['admin-payouts'],
    queryFn: () => api.get('/admin/payouts').then(r => r.data.data.data),
    enabled: isAdmin(),
  })

  const requestPayout = useMutation({
    mutationFn: (form) => api.post('/payouts', form),
    onSuccess: () => {
      toast.success('Payout request submitted')
      qc.invalidateQueries(['wallet'])
      setShowPayoutModal(false)
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Failed'),
  })

  const processPayout = useMutation({
    mutationFn: ({ id, bank_reference }) => api.post(`/admin/payouts/${id}/process`, { bank_reference }),
    onSuccess: () => {
      toast.success('Payout processed')
      qc.invalidateQueries(['admin-payouts'])
      qc.invalidateQueries(['wallet'])
      setProcessingPayout(null)
      setBankRef('')
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Failed'),
  })

  const rejectPayout = useMutation({
    mutationFn: (id) => api.post(`/admin/payouts/${id}/reject`, { rejection_reason: 'Rejected by admin' }),
    onSuccess: () => { toast.success('Payout rejected'); qc.invalidateQueries(['admin-payouts']) },
    onError: (e) => toast.error(e.response?.data?.error || 'Failed'),
  })

  const balances = data?.balances || {}
  const payouts = data?.payouts || []
  const recentCredits = data?.recent_credits || []

  if (isLoading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading…</div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Seller Wallet</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: 14 }}>Earnings from your delivered items</p>
        </div>
        {!isAdmin() && (
          <button className="btn btn-primary" onClick={() => setShowPayoutModal(true)}
            disabled={!balances.available || balances.available <= 0}>
            <ArrowDownLeft size={16} /> Request Payout
          </button>
        )}
      </div>

      {/* Balance cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Available to Withdraw', value: balances.available || 0, color: '#22c55e', icon: Wallet },
          { label: 'Pending Clearance', value: balances.pending || 0, color: '#f59e0b', icon: Clock },
          { label: 'Total Earned', value: balances.total_earned || 0, color: '#3b82f6', icon: TrendingUp },
          { label: 'Total Paid Out', value: balances.paid_out || 0, color: '#8b5cf6', icon: CheckCircle },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={18} style={{ color }} />
              </div>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color }}>KES {value.toLocaleString()}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isAdmin() ? '1fr' : '1fr 1fr', gap: 20 }}>

        {/* Admin: payout management */}
        {isAdmin() && (
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontWeight: 700 }}>
              Payout Requests
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Vendor', 'Amount', 'Bank', 'Account', 'Status', 'Action'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(adminPayouts || []).length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: 'var(--text-secondary)' }}>No payout requests</td></tr>
                ) : (adminPayouts || []).map(p => {
                  const cfg = PAYOUT_STATUS[p.status] || PAYOUT_STATUS.requested
                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 14px', fontWeight: 500 }}>{p.vendor?.name}</td>
                      <td style={{ padding: '12px 14px', fontWeight: 700 }}>KES {p.amount?.toLocaleString()}</td>
                      <td style={{ padding: '12px 14px', fontSize: 13 }}>{p.bank_name}</td>
                      <td style={{ padding: '12px 14px', fontSize: 12, fontFamily: 'monospace' }}>
                        {p.account_number}<br/><span style={{ color: 'var(--text-secondary)' }}>{p.account_name}</span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 20, background: cfg.color + '18', color: cfg.color }}>
                          {cfg.label}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        {p.status === 'requested' && (
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="btn btn-primary btn-sm" onClick={() => setProcessingPayout(p)}>
                              <CheckCircle size={12} /> Process
                            </button>
                            <button className="btn btn-danger btn-sm" onClick={() => rejectPayout.mutate(p.id)}>
                              <XCircle size={12} />
                            </button>
                          </div>
                        )}
                        {p.status === 'paid' && (
                          <span style={{ fontSize: 12, color: '#22c55e' }}>Ref: {p.bank_reference}</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Payout history */}
        {!isAdmin() && (
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontWeight: 700 }}>Payout History</div>
            {payouts.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-secondary)' }}>No payout requests yet.</div>
            ) : (
              <div>
                {payouts.map(p => {
                  const cfg = PAYOUT_STATUS[p.status] || PAYOUT_STATUS.requested
                  return (
                    <div key={p.id} style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>KES {p.amount?.toLocaleString()}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{p.bank_name} · {p.account_number}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{new Date(p.created_at).toLocaleDateString()}</div>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: cfg.color + '18', color: cfg.color }}>
                        {cfg.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Recent credits */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontWeight: 700 }}>Recent Earnings</div>
          {recentCredits.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-secondary)' }}>
              <AlertCircle size={24} style={{ marginBottom: 8 }} />
              No earnings yet. Earnings appear here when items are delivered and paid for.
            </div>
          ) : (
            recentCredits.map(entry => (
              <div key={entry.id} style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{entry.item?.item_code} — {entry.item?.customer_name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{entry.description}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{new Date(entry.created_at).toLocaleDateString()}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, color: '#22c55e' }}>+KES {entry.seller_amount?.toLocaleString()}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Fee: KES {entry.our_fee?.toLocaleString()}</div>
                  <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 10,
                    background: entry.status === 'cleared' ? '#22c55e18' : '#f59e0b18',
                    color: entry.status === 'cleared' ? '#16a34a' : '#d97706' }}>
                    {entry.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Payout request modal */}
      {showPayoutModal && (
        <PayoutRequestModal
          balances={balances}
          onClose={() => setShowPayoutModal(false)}
          onSubmit={(form) => requestPayout.mutate(form)}
        />
      )}

      {/* Admin process payout modal */}
      {processingPayout && (
        <div className="modal-overlay" onClick={() => setProcessingPayout(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <h2 style={{ margin: '0 0 12px' }}>Process Payout</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 16 }}>
              <strong>KES {processingPayout.amount?.toLocaleString()}</strong> to {processingPayout.account_name} via {processingPayout.bank_name}
            </p>
            <div className="form-group">
              <label>Bank / M-Pesa Transaction Reference *</label>
              <input className="form-control" value={bankRef} onChange={e => setBankRef(e.target.value)}
                placeholder="Enter bank transaction reference" />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
              <button className="btn btn-secondary" onClick={() => setProcessingPayout(null)}>Cancel</button>
              <button className="btn btn-primary" disabled={!bankRef || processPayout.isPending}
                onClick={() => processPayout.mutate({ id: processingPayout.id, bank_reference: bankRef })}>
                {processPayout.isPending ? 'Processing…' : 'Confirm Payout'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
