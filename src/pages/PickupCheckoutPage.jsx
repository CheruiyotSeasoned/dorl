import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Package, MapPin, CheckCircle, Phone, CreditCard, Banknote, Loader, AlertCircle, Lock } from 'lucide-react'
import api from '../lib/api'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store/authStore'
import LoginPage from './LoginPage'

export default function PickupCheckoutPage() {
  const { qrToken } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [step, setStep] = useState('order') // order | payment | mpesa_wait | success
  const [paymentMethod, setPaymentMethod] = useState(null)
  const [mpesaPhone, setMpesaPhone] = useState('')
  const [cardRef, setCardRef] = useState('')
  const [transactionId, setTransactionId] = useState(null)
  const [pollInterval, setPollInterval] = useState(null)

  // Load order info (public)
  const { data: orderData, isLoading, error } = useQuery({
    queryKey: ['checkout', qrToken],
    queryFn: () => api.get(`/pickup/checkout/${qrToken}`).then(r => r.data.data),
    retry: false,
  })

  // Auto-fill agent's phone if available
  useEffect(() => {
    if (user?.phone) setMpesaPhone(user.phone)
  }, [user])

  // Poll M-Pesa status
  useEffect(() => {
    if (step !== 'mpesa_wait' || !transactionId) return

    const id = setInterval(async () => {
      try {
        const res = await api.get(`/pickup/transactions/${transactionId}/poll`)
        if (res.data.paid) {
          clearInterval(id)
          setStep('success')
          toast.success('Payment confirmed!')
        } else if (res.data.status === 'failed') {
          clearInterval(id)
          setStep('payment')
          toast.error('Payment was cancelled or failed. Try again.')
        }
      } catch {}
    }, 3000)

    setPollInterval(id)
    return () => clearInterval(id)
  }, [step, transactionId])

  const initiateMpesa = useMutation({
    mutationFn: () => api.post(`/pickup/checkout/${qrToken}/mpesa`, { phone: mpesaPhone }),
    onSuccess: (r) => {
      setTransactionId(r.data.transaction?.id)
      setStep('mpesa_wait')
      toast.success('STK Push sent! Ask customer to check their phone.')
    },
    onError: (e) => toast.error(e.response?.data?.error || 'M-Pesa request failed'),
  })

  const confirmCash = useMutation({
    mutationFn: () => api.post(`/pickup/checkout/${qrToken}/cash`),
    onSuccess: () => { setStep('success'); toast.success('Cash payment recorded!') },
    onError: (e) => toast.error(e.response?.data?.error || 'Failed'),
  })

  const confirmCard = useMutation({
    mutationFn: () => api.post(`/pickup/checkout/${qrToken}/card`, { card_reference: cardRef }),
    onSuccess: () => { setStep('success'); toast.success('Card payment recorded!') },
    onError: (e) => toast.error(e.response?.data?.error || 'Failed'),
  })

  // Not logged in — show login form
  if (!user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'var(--bg)' }}>
        <div style={{ maxWidth: 420, width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <Lock size={32} style={{ color: 'var(--primary)', marginBottom: 8 }} />
            <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Agent Login Required</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: 6, fontSize: 14 }}>
              Log in as a station agent to process this pickup.
            </p>
          </div>
          <LoginPage embedded onSuccess={() => {}} />
        </div>
      </div>
    )
  }

  // Not a station agent (or admin)
  if (user.role !== 'station_agent' && user.role !== 'admin') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ textAlign: 'center' }}>
          <AlertCircle size={40} style={{ color: '#ef4444', marginBottom: 12 }} />
          <h2>Access Denied</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Only station agents can process pickups.</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader size={32} style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    )
  }

  if (error || !orderData) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ textAlign: 'center' }}>
          <AlertCircle size={40} style={{ color: '#ef4444', marginBottom: 12 }} />
          <h2>Package Not Found</h2>
          <p style={{ color: 'var(--text-secondary)' }}>This QR code is invalid or the package no longer exists.</p>
        </div>
      </div>
    )
  }

  const order = orderData

  if (order.payment_status === 'paid' || order.status === 'delivered') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ textAlign: 'center' }}>
          <CheckCircle size={48} style={{ color: '#22c55e', marginBottom: 16 }} />
          <h2 style={{ fontWeight: 700, margin: '0 0 8px' }}>Already Delivered</h2>
          <p style={{ color: 'var(--text-secondary)' }}>This package has already been paid for and collected.</p>
          <div style={{ fontFamily: 'monospace', fontSize: 18, fontWeight: 700, marginTop: 16 }}>{order.item_code}</div>
        </div>
      </div>
    )
  }

  // ── Success screen ──────────────────────────────────────────────────────────
  if (step === 'success') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'var(--bg)' }}>
        <div style={{ maxWidth: 420, width: '100%', textAlign: 'center' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#22c55e18', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <CheckCircle size={40} style={{ color: '#22c55e' }} />
          </div>
          <h1 style={{ fontWeight: 700, fontSize: 24, margin: '0 0 8px' }}>Payment Complete!</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
            Hand the package to the customer. The order is now marked as delivered.
          </p>
          <div className="card" style={{ padding: 20, textAlign: 'left', marginBottom: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{order.customer_name}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{order.item_description}</div>
            <div style={{ fontWeight: 700, fontSize: 20, color: '#22c55e', marginTop: 8 }}>KES {order.unit_price?.toLocaleString()}</div>
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
        </div>
      </div>
    )
  }

  // ── M-Pesa waiting screen ───────────────────────────────────────────────────
  if (step === 'mpesa_wait') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'var(--bg)' }}>
        <div style={{ maxWidth: 420, width: '100%', textAlign: 'center' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(var(--primary-rgb),0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <Phone size={36} style={{ color: 'var(--primary)' }} />
          </div>
          <h1 style={{ fontWeight: 700, fontSize: 22, margin: '0 0 12px' }}>Waiting for Payment</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 8 }}>
            An STK Push has been sent to <strong>{mpesaPhone}</strong>.
          </p>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>
            Ask the customer to enter their M-Pesa PIN to complete payment.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, color: 'var(--text-secondary)', marginBottom: 24 }}>
            <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} />
            Checking payment status…
          </div>
          <div style={{ fontWeight: 700, fontSize: 24, color: 'var(--primary)', marginBottom: 32 }}>
            KES {order.unit_price?.toLocaleString()}
          </div>
          <button className="btn btn-secondary" onClick={() => { clearInterval(pollInterval); setStep('payment') }}>
            Cancel / Try Another Method
          </button>
        </div>
      </div>
    )
  }

  // ── Main checkout ───────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: 20 }}>
      <div style={{ maxWidth: 480, margin: '0 auto', paddingTop: 32 }}>

        {/* Package summary */}
        <div className="card" style={{ padding: 20, marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <div style={{ width: 48, height: 48, borderRadius: 10, background: 'rgba(var(--primary-rgb),0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Package size={22} style={{ color: 'var(--primary)' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 2 }}>{order.item_code}</div>
              <div style={{ fontWeight: 700, fontSize: 17 }}>{order.customer_name}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 2 }}>{order.item_description}</div>
              {order.quantity > 1 && <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Quantity: {order.quantity}</div>}
            </div>
          </div>
          {order.pickup_station && (
            <div style={{ marginTop: 14, padding: '10px 12px', background: 'var(--bg)', borderRadius: 8, display: 'flex', gap: 8, alignItems: 'center', fontSize: 13 }}>
              <MapPin size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />
              <span><strong>{order.pickup_station.name}</strong> — {order.pickup_station.town}</span>
            </div>
          )}
        </div>

        {/* Amount */}
        <div className="card" style={{ padding: 20, marginBottom: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>Amount Due</div>
          <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--primary)' }}>
            KES {order.unit_price?.toLocaleString()}
          </div>
        </div>

        {/* Payment methods */}
        <div className="card" style={{ padding: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px' }}>Select Payment Method</h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
            {[
              { id: 'mpesa', label: 'M-Pesa', icon: Phone, color: '#22c55e' },
              { id: 'cash',  label: 'Cash',   icon: Banknote, color: '#f59e0b' },
              { id: 'card',  label: 'Card',   icon: CreditCard, color: '#3b82f6' },
            ].map(({ id, label, icon: Icon, color }) => (
              <button
                key={id}
                onClick={() => setPaymentMethod(id)}
                style={{
                  padding: '14px 8px', border: `2px solid ${paymentMethod === id ? color : 'var(--border)'}`,
                  borderRadius: 10, background: paymentMethod === id ? color + '12' : 'var(--surface)',
                  cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                  transition: 'all 0.15s',
                }}
              >
                <Icon size={22} style={{ color }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: paymentMethod === id ? color : 'var(--text-primary)' }}>
                  {label}
                </span>
              </button>
            ))}
          </div>

          {/* M-Pesa form */}
          {paymentMethod === 'mpesa' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="form-group">
                <label>Customer's M-Pesa Phone Number</label>
                <input
                  className="form-control"
                  placeholder="07XXXXXXXX or 254XXXXXXXXX"
                  value={mpesaPhone}
                  onChange={e => setMpesaPhone(e.target.value)}
                  type="tel"
                />
              </div>
              <div style={{ padding: 12, background: 'rgba(34,197,94,0.08)', borderRadius: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                An STK Push prompt will be sent to this number. The customer enters their PIN to pay.
              </div>
              <button
                className="btn btn-primary"
                onClick={() => initiateMpesa.mutate()}
                disabled={!mpesaPhone || initiateMpesa.isPending}
                style={{ background: '#22c55e', borderColor: '#22c55e', width: '100%', padding: 14, fontSize: 16 }}
              >
                {initiateMpesa.isPending ? 'Sending…' : `Send M-Pesa Request — KES ${order.unit_price?.toLocaleString()}`}
              </button>
            </div>
          )}

          {/* Cash form */}
          {paymentMethod === 'cash' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ padding: 16, background: 'rgba(245,158,11,0.08)', borderRadius: 8, fontSize: 14 }}>
                <strong>Collect KES {order.unit_price?.toLocaleString()} in cash</strong> from the customer,
                then click confirm. The amount will be added to your cash float and must be deposited by end of day.
              </div>
              <button
                className="btn btn-primary"
                onClick={() => confirmCash.mutate()}
                disabled={confirmCash.isPending}
                style={{ background: '#f59e0b', borderColor: '#f59e0b', width: '100%', padding: 14, fontSize: 16 }}
              >
                {confirmCash.isPending ? 'Processing…' : `Confirm Cash — KES ${order.unit_price?.toLocaleString()}`}
              </button>
            </div>
          )}

          {/* Card form */}
          {paymentMethod === 'card' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="form-group">
                <label>POS Receipt / Transaction Reference</label>
                <input
                  className="form-control"
                  placeholder="Enter POS receipt number"
                  value={cardRef}
                  onChange={e => setCardRef(e.target.value)}
                />
              </div>
              <div style={{ padding: 12, background: 'rgba(59,130,246,0.08)', borderRadius: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                Process payment on your POS device first, then enter the receipt number above.
              </div>
              <button
                className="btn btn-primary"
                onClick={() => confirmCard.mutate()}
                disabled={!cardRef || confirmCard.isPending}
                style={{ background: '#3b82f6', borderColor: '#3b82f6', width: '100%', padding: 14, fontSize: 16 }}
              >
                {confirmCard.isPending ? 'Processing…' : `Confirm Card — KES ${order.unit_price?.toLocaleString()}`}
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
