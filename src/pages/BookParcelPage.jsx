import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, Phone } from 'lucide-react'
import api from '../lib/api'
import PublicLayout from '../components/PublicLayout'

const empty = {
  vendor_name: '', vendor_phone: '+254', vendor_email: '',
  customer_name: '', customer_phone: '+254', customer_location: '',
  pickup_station_id: '',
  package_type: '', weight_range: '', package_value: '',
  is_fragile: false, is_spill_prone: false, parcel_details: '',
}

export default function BookParcelPage() {
  const [step, setStep] = useState(1)          // 1,2,3
  const [form, setForm] = useState(empty)
  const [stations, setStations] = useState([])
  const [options, setOptions] = useState({ package_types: [], weight_ranges: [] })
  const [fee, setFee] = useState(null)
  const [booking, setBooking] = useState(null) // { order_id, tracking_code, total_price }
  const [payState, setPayState] = useState('idle') // idle | sending | waiting | paid | failed
  const [busy, setBusy] = useState(false)
  const pollRef = useRef(null)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    api.get('/book/pickup-stations').then(r => setStations(r.data.data)).catch(() => {})
    api.get('/book/options').then(r => setOptions(r.data.data)).catch(() => {})
    return () => clearInterval(pollRef.current)
  }, [])

  // Live fee quote whenever weight/value/fragile change
  useEffect(() => {
    const ready = form.weight_range && form.package_value !== ''
    const t = setTimeout(() => {
      if (!ready) { setFee(null); return }
      api.post('/book/quote', {
        weight_range: form.weight_range,
        package_value: Number(form.package_value) || 0,
        is_fragile: form.is_fragile,
      }).then(r => setFee(r.data.data)).catch(() => setFee(null))
    }, 300)
    return () => clearTimeout(t)
  }, [form.weight_range, form.package_value, form.is_fragile])

  const station = stations.find(s => String(s.id) === String(form.pickup_station_id))

  const validStep1 = form.vendor_name && form.vendor_phone.length > 4 &&
    form.customer_name && form.customer_phone.length > 4 &&
    form.customer_location && form.pickup_station_id
  const validStep2 = form.package_type && form.weight_range && form.package_value !== ''

  // ── Create booking + start payment ──────────────────────────────────────────
  const proceedToPayment = async () => {
    setBusy(true)
    try {
      let bk = booking
      if (!bk) {
        const res = await api.post('/book/create', {
          ...form,
          package_value: Number(form.package_value) || 0,
        })
        bk = res.data.data
        setBooking(bk)
      }
      setPayState('sending')
      await api.post(`/book/${bk.order_id}/pay`, { phone: form.vendor_phone })
      setPayState('waiting')
      startPolling(bk.order_id)
    } catch (err) {
      setPayState('failed')
      toast.error(err.response?.data?.error || 'Could not start payment. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const startPolling = (orderId) => {
    clearInterval(pollRef.current)
    let tries = 0
    pollRef.current = setInterval(async () => {
      tries++
      try {
        const r = await api.get(`/book/${orderId}/poll`)
        const st = r.data.data.payment_status
        if (st === 'paid') { clearInterval(pollRef.current); setPayState('paid'); toast.success('Payment received!') }
        else if (st === 'failed') { clearInterval(pollRef.current); setPayState('failed'); toast.error('Payment failed or cancelled.') }
      } catch { /* keep polling */ }
      if (tries > 40) { clearInterval(pollRef.current); if (payState !== 'paid') setPayState('failed') }
    }, 4000)
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <PublicLayout>
    <div style={{ background: 'var(--surface-muted, #f6f7f9)' }}>
      <style>{`
        .bk-wrap { max-width: 640px; margin: 0 auto; padding: 24px 16px 64px; }
        .bk-card { background: var(--surface, #fff); border: 1px solid var(--border, #e5e7eb); border-radius: 16px; padding: 24px; box-shadow: 0 4px 24px rgba(0,0,0,0.05); }
        .bk-steps { display:flex; gap:8px; margin: 20px 0 24px; }
        .bk-dot { flex:1; height:5px; border-radius:99px; background: var(--border,#e5e7eb); }
        .bk-dot.on { background: var(--primary, #FF5E14); }
        .bk-section-title { font-weight:700; font-size:15px; margin: 18px 0 10px; }
        .bk-row { display:grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        @media(max-width:520px){ .bk-row { grid-template-columns: 1fr; } }
        .bk-actions { display:flex; gap:10px; margin-top:24px; }
        .bk-fee { background: rgba(255,94,20,0.08); border:1px solid rgba(255,94,20,0.2); border-radius:12px; padding:14px 16px; margin-top:16px; }
        .bk-chk { display:flex; align-items:center; gap:8px; font-size:14px; cursor:pointer; }
      `}</style>

      <div className="bk-wrap">
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, textAlign: 'center', margin: '8px 0 0' }}>Book a Parcel</h1>
        <div className="bk-steps">
          {[1, 2, 3].map(n => <div key={n} className={`bk-dot ${step >= n ? 'on' : ''}`} />)}
        </div>

        <div className="bk-card">
          {/* ── STEP 1 ── */}
          {step === 1 && (
            <>
              <h2 style={{ fontFamily: 'var(--font-display)', marginTop: 0 }}>Sender & Customer</h2>
              <div className="bk-section-title">Vendor / Sender Information</div>
              <div className="bk-row">
                <Field label="Vendor / Sender Name *" value={form.vendor_name} onChange={v => set('vendor_name', v)} placeholder="Enter vendor name" />
                <Field label="Sender Phone *" value={form.vendor_phone} onChange={v => set('vendor_phone', v)} placeholder="+254…" hint="Include country code (e.g., +254)" />
              </div>
              <Field label="Sender Email" type="email" value={form.vendor_email} onChange={v => set('vendor_email', v)} placeholder="name@email.com" hint="For your booking confirmation & receipt" />

              <div className="bk-section-title">Customer Information</div>
              <div className="bk-row">
                <Field label="Customer Name *" value={form.customer_name} onChange={v => set('customer_name', v)} placeholder="Enter customer name" />
                <Field label="Phone Number *" value={form.customer_phone} onChange={v => set('customer_phone', v)} placeholder="+254…" />
              </div>
              <Field label="Customer Location *" value={form.customer_location} onChange={v => set('customer_location', v)} placeholder="e.g., Kisumu, Mombasa, Nakuru" />

              <div className="form-group" style={{ marginTop: 12 }}>
                <label className="form-label">Preferred Pickup Point *</label>
                <select className="form-control" value={form.pickup_station_id} onChange={e => set('pickup_station_id', e.target.value)}>
                  <option value="">Select a pickup point</option>
                  {stations.map(s => (
                    <option key={s.id} value={s.id}>{s.name} — {s.town}, {s.county}</option>
                  ))}
                </select>
              </div>

              <div className="bk-actions">
                <button className="btn btn-primary" style={{ marginLeft: 'auto' }} disabled={!validStep1} onClick={() => setStep(2)}>
                  Next <ArrowRight size={16} />
                </button>
              </div>
            </>
          )}

          {/* ── STEP 2 ── */}
          {step === 2 && (
            <>
              <h2 style={{ fontFamily: 'var(--font-display)', marginTop: 0 }}>Package Details</h2>
              <div className="bk-row">
                <div className="form-group">
                  <label className="form-label">Package Type *</label>
                  <select className="form-control" value={form.package_type} onChange={e => set('package_type', e.target.value)}>
                    <option value="">Select package type</option>
                    {options.package_types.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Weight Range *</label>
                  <select className="form-control" value={form.weight_range} onChange={e => set('weight_range', e.target.value)}>
                    <option value="">Select weight range</option>
                    {options.weight_ranges.map(w => <option key={w} value={w}>{w} KG</option>)}
                  </select>
                </div>
              </div>

              <Field label="Package Value (KES) *" type="number" value={form.package_value} onChange={v => set('package_value', v)} placeholder="e.g., 5000" />

              <div className="bk-section-title">Package Properties</div>
              <div style={{ display: 'flex', gap: 20 }}>
                <label className="bk-chk"><input type="checkbox" checked={form.is_fragile} onChange={e => set('is_fragile', e.target.checked)} /> Fragile</label>
                <label className="bk-chk"><input type="checkbox" checked={form.is_spill_prone} onChange={e => set('is_spill_prone', e.target.checked)} /> Spill Prone</label>
              </div>

              <div className="form-group" style={{ marginTop: 14 }}>
                <label className="form-label">Parcel Details</label>
                <textarea className="form-control" rows={3} value={form.parcel_details} onChange={e => set('parcel_details', e.target.value)}
                  placeholder="Enter items name, pieces, and variations. E.g., 2 phones, 1 tablet (Samsung), chargers, etc." />
              </div>

              <div className="bk-fee">
                {fee
                  ? <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Delivery Fee</span>
                      <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--primary)' }}>KES {fee.total_price.toLocaleString()}</span>
                    </div>
                  : <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Select weight range and value to see the delivery fee</span>}
              </div>

              <div className="bk-actions">
                <button className="btn btn-ghost" onClick={() => setStep(1)}><ArrowLeft size={16} /> Back</button>
                <button className="btn btn-primary" style={{ marginLeft: 'auto' }} disabled={!validStep2 || !fee} onClick={() => setStep(3)}>
                  Next <ArrowRight size={16} />
                </button>
              </div>
            </>
          )}

          {/* ── STEP 3 — review + pay ── */}
          {step === 3 && (
            <>
              <h2 style={{ fontFamily: 'var(--font-display)', marginTop: 0 }}>Checkout — Review Your Booking</h2>

              {payState === 'paid' ? (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <CheckCircle2 size={56} color="#16a34a" style={{ margin: '0 auto' }} />
                  <h3 style={{ marginTop: 12 }}>Payment received 🎉</h3>
                  <p className="text-muted">Tracking number</p>
                  <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: 2, color: 'var(--primary)' }}>{booking?.tracking_code}</div>
                  <p className="text-muted text-sm" style={{ marginTop: 8 }}>Drop off your parcel at <b>{station?.name}</b> when you're ready.</p>
                  <Link to="/track" className="btn btn-primary" style={{ marginTop: 16 }}>Track this parcel</Link>
                </div>
              ) : (
                <>
                  <ReviewBlock title="Vendor Information" rows={[['Name', form.vendor_name], ['Phone', form.vendor_phone]]} />
                  <ReviewBlock title="Customer Information" rows={[['Name', form.customer_name], ['Phone', form.customer_phone], ['Location', form.customer_location], ['Pickup Point', station?.name]]} />
                  <ReviewBlock title="Package Details" rows={[
                    ['Type', form.package_type],
                    ['Weight', `${form.weight_range} KG`],
                    ['Value', `KES ${Number(form.package_value).toLocaleString()}`],
                    ['Properties', [form.is_fragile && 'Fragile', form.is_spill_prone && 'Spill Prone'].filter(Boolean).join(', ') || '—'],
                  ]} />

                  <div className="bk-fee" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600 }}>Delivery Fee</span>
                    <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--primary)' }}>KES {(fee?.total_price ?? booking?.total_price)?.toLocaleString()}</span>
                  </div>

                  {booking && (
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 12 }}>
                      <b>Tracking number {booking.tracking_code} created.</b> Pay the parcel fee to get your receipt now.
                    </p>
                  )}

                  {payState === 'waiting' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14, color: 'var(--primary)' }}>
                      <Loader2 size={18} className="spin" /> <span style={{ fontSize: 14 }}>Check your phone — enter your M-Pesa PIN to complete payment…</span>
                    </div>
                  )}
                  {payState === 'failed' && (
                    <p style={{ color: '#dc2626', fontSize: 13, marginTop: 12 }}>Payment didn't go through. You can retry below.</p>
                  )}

                  <div className="bk-actions">
                    <button className="btn btn-ghost" disabled={busy || payState === 'waiting'} onClick={() => setStep(2)}><ArrowLeft size={16} /> Back</button>
                    <button className="btn btn-primary" style={{ marginLeft: 'auto' }} disabled={busy || payState === 'waiting'} onClick={proceedToPayment}>
                      {busy || payState === 'waiting'
                        ? <><Loader2 size={16} className="spin" /> Processing…</>
                        : <><Phone size={16} /> {payState === 'failed' ? 'Retry Payment' : 'Proceed to Payment'}</>}
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        <p style={{ textAlign: 'center', marginTop: 18, fontSize: 13, color: 'var(--text-secondary)' }}>
          Skip the long process & book a parcel in seconds. Drop off when you're ready.
        </p>
      </div>

      <style>{`.spin { animation: bkspin 1s linear infinite } @keyframes bkspin { to { transform: rotate(360deg) } }`}</style>
    </div>
    </PublicLayout>
  )
}

function Field({ label, value, onChange, placeholder, hint, type = 'text' }) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <input className="form-control" type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        autoCapitalize={type === 'text' ? 'words' : 'none'} autoCorrect="off" />
      {hint && <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>{hint}</div>}
    </div>
  )
}

function ReviewBlock({ title, rows }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>{title}</div>
      {rows.map(([k, v]) => (
        <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '3px 0', borderBottom: '1px solid var(--border,#f0f0f0)' }}>
          <span style={{ color: 'var(--text-secondary)' }}>{k}</span>
          <span style={{ fontWeight: 600, textAlign: 'right', maxWidth: '65%' }}>{v || '—'}</span>
        </div>
      ))}
    </div>
  )
}
