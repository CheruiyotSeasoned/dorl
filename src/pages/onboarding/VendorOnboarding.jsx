import { useState } from 'react'
import { Building2, FileText, PenLine, CheckCircle, AlertCircle, ArrowRight, ArrowLeft, LogOut, Zap, Handshake } from 'lucide-react'
import api from '../../lib/api'
import { useAuthStore } from '../../store/authStore'
import StepBar from '../../components/onboarding/StepBar'
import DocUpload from '../../components/onboarding/DocUpload'
import toast from 'react-hot-toast'

const CONTRACT_TEXT = `SENDTRACK DELIVERY SERVICES AGREEMENT

This Service Agreement ("Agreement") is entered into between SendTrack ("Platform") and the Vendor ("Client") upon acceptance of the terms below.

1. SERVICES
SendTrack will provide last-mile delivery dispatch services including rider assignment, real-time tracking, proof of delivery, and invoicing for all orders placed through the platform.

2. FEES & PAYMENTS
Service fees are calculated per delivery based on distance, weight, and package type as configured in the platform settings. Invoices are generated upon delivery completion and are due within 30 days.

3. KYC & COMPLIANCE
The Client agrees to provide accurate business information and documents as requested. SendTrack reserves the right to suspend accounts with incomplete or inaccurate KYC information.

4. LIABILITY
SendTrack carries carrier liability up to KES 10,000,000 per consignment and burglary coverage up to KES 15,000,000 as per our standard insurance policy.

5. TERMINATION
Either party may terminate this agreement with 30 days written notice. Outstanding balances remain due regardless of termination.

6. GOVERNING LAW
This agreement is governed by the laws of Kenya. Any disputes shall be resolved through arbitration in Nairobi.

By signing below, the Client confirms they have read, understood, and agree to be bound by the terms of this agreement.`

const STEPS_CONTRACT = ['Account Type', 'Business Details', 'Documents', 'Sign Contract']
const STEPS_CASH     = ['Account Type', 'Business Details', 'Submit']

const LEFT_ITEMS = [
  { Icon: Zap,       label: 'Cash-based: quick setup, pay per delivery' },
  { Icon: Handshake, label: 'Contract-based: monthly invoicing & credit terms' },
]

function VendorLayout({ step, steps, isContract, user, logout, children }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#fff' }}>
      <div style={{
        width: 380, flexShrink: 0, background: '#0D0D0D', display: 'flex', flexDirection: 'column',
        padding: '48px 40px', position: 'relative', overflow: 'hidden',
      }} className="ob-left-panel">
        <div style={{ position: 'absolute', top: -60, right: -60, width: 280, height: 280, background: 'rgba(255,94,20,0.08)', borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -40, left: -40, width: 200, height: 200, background: 'rgba(255,94,20,0.05)', borderRadius: '50%', pointerEvents: 'none' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 56 }}>
          <div style={{ width: 36, height: 36, background: '#FF5E14', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Building2 size={18} color="#fff" />
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: '#fff' }}>SendTrack</span>
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#FF5E14', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 12 }}>Vendor Application</div>
          <h2 style={{ color: '#fff', fontSize: 28, lineHeight: 1.25, marginBottom: 16 }}>
            {step === 1  && 'Choose your account'}
            {step === 2  && 'Business information'}
            {step === 3  && 'Upload documents'}
            {step === 4  && (isContract ? 'Review & sign' : 'Final step')}
            {step === 99 && 'Under review'}
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, lineHeight: 1.8 }}>
            {step === 1  && 'Select the account type that matches your business model.'}
            {step === 2  && 'Provide your business details for KYC verification.'}
            {step === 3  && 'Upload clear, legible copies of your business documents.'}
            {step === 4  && (isContract ? 'Read and sign the service agreement to activate your account.' : 'Submit your application for review.')}
            {step === 99 && 'Our team will review your application within 1–2 business days.'}
          </p>

          {step < 99 && (
            <div style={{ marginTop: 48, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {LEFT_ITEMS.map(({ Icon, label }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <Icon size={15} color="#FF5E14" style={{ marginTop: 2, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>{label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <button onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', fontSize: 13, padding: 0 }}>
          <LogOut size={14} /> Sign out
        </button>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        <div style={{ maxWidth: 560, width: '100%', margin: '0 auto', padding: '56px 40px 80px' }}>
          {step < 99 && <StepBar steps={steps} current={step} />}
          {children}
        </div>
      </div>
    </div>
  )
}

export default function VendorOnboarding() {
  const { user, logout, refreshUser } = useAuthStore()

  const vendor      = user?.vendor_kyc
  const kycStatus   = vendor?.kyc_status ?? 'pending'
  const vendorType  = vendor?.type

  const initialStep = vendor?.kyc_step ?? 0
  const [step, setStep]       = useState(kycStatus === 'submitted' ? 99 : Math.max(initialStep + 1, 1))
  const [loading, setLoading] = useState(false)
  const [errors, setErrors]   = useState({})

  // Step 1
  const [type, setType] = useState(vendorType ?? '')

  // Step 2
  const [details, setDetails] = useState({
    name: user?.name ?? '', phone: user?.phone ?? '', address: '',
    director_name: '', business_reg_number: '', kra_pin: '', director_id_number: '',
  })

  // Step 3 (contract only)
  const [docsFiles, setDocsFiles] = useState({
    business_cert: null, kra_cert: null, director_id_front: null, director_id_back: null,
  })

  // Step 4 / final contract
  const [agreed, setAgreed] = useState(false)

  const setD = (k, v) => { setDetails(p => ({ ...p, [k]: v })); setErrors(e => ({ ...e, [k]: null })) }
  const setF = (k, v) => { setDocsFiles(p => ({ ...p, [k]: v })); setErrors(e => ({ ...e, [k]: null })) }

  const apiErrors = (err) => {
    const e = err.response?.data?.errors
    if (e) { setErrors(Object.fromEntries(Object.entries(e).map(([k, v]) => [k, v[0]]))); return }
    toast.error(err.response?.data?.message ?? 'Something went wrong')
  }

  const isContract = type === 'contract'
  const steps      = isContract ? STEPS_CONTRACT : STEPS_CASH

  const submitType = async () => {
    if (!type) { toast.error('Please select an account type'); return }
    setLoading(true)
    try {
      await api.post('/onboarding/vendor/type', { type })
      await refreshUser()
      setStep(2)
    } catch (e) { apiErrors(e) } finally { setLoading(false) }
  }

  const submitDetails = async () => {
    setLoading(true)
    try {
      await api.post('/onboarding/vendor/details', details)
      await refreshUser()
      setStep(3)
    } catch (e) { apiErrors(e) } finally { setLoading(false) }
  }

  const submitDocuments = async () => {
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('business_cert',     docsFiles.business_cert)
      fd.append('kra_cert',          docsFiles.kra_cert)
      fd.append('director_id_front', docsFiles.director_id_front)
      fd.append('director_id_back',  docsFiles.director_id_back)
      await api.post('/onboarding/vendor/documents', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      await refreshUser()
      setStep(4)
    } catch (e) { apiErrors(e) } finally { setLoading(false) }
  }

  const submitFinal = async () => {
    if (isContract && !agreed) { toast.error('Please read and accept the agreement'); return }
    setLoading(true)
    try {
      await api.post('/onboarding/vendor/submit', { agreed: agreed ? '1' : '0' })
      await refreshUser()
      setStep(99)
    } catch (e) { apiErrors(e) } finally { setLoading(false) }
  }

  // ── Step 1: Type selection ────────────────────────────────────────────────
  if (step === 1) return (
    <VendorLayout step={step} steps={steps} isContract={isContract} user={user} logout={logout}>
      <h3 style={{ marginBottom: 8 }}>Choose Account Type</h3>
      <p style={{ color: '#6B6B6B', fontSize: 14, marginBottom: 32 }}>Select the model that best fits your business. You can upgrade later.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
        {[
          {
            value: 'cash',
            icon: Zap,
            title: 'Cash Account',
            badge: 'Quick setup',
            badgeColor: '#16A34A',
            desc: 'Pay per delivery. No long-term commitment. Ideal for small businesses and individuals just getting started.',
            perks: ['Basic KYC only', 'No minimum orders', 'Pay as you go', 'Instant activation after approval'],
          },
          {
            value: 'contract',
            icon: Handshake,
            title: 'Contract Account',
            badge: 'Best for businesses',
            badgeColor: '#1D4ED8',
            desc: 'Monthly invoicing, credit terms, and volume discounts. Full KYC with business documents and e-signature required.',
            perks: ['Monthly consolidated invoicing', 'Volume discounts', 'Dedicated account manager', 'Priority dispatch'],
          },
        ].map(({ value, icon: Icon, title, badge, badgeColor, desc, perks }) => (
          <button key={value} onClick={() => setType(value)} style={{
            border: `2px solid ${type === value ? '#FF5E14' : '#E5E5E5'}`,
            borderRadius: 16, padding: '20px 22px', background: type === value ? '#FFF8F5' : '#fff',
            cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s', width: '100%',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: type === value ? '#FF5E14' : '#F7F7F7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' }}>
                <Icon size={20} color={type === value ? '#fff' : '#6B6B6B'} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: '#0D0D0D' }}>{title}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', background: badgeColor, borderRadius: 4, padding: '2px 7px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{badge}</span>
                </div>
                <p style={{ fontSize: 13, color: '#6B6B6B', lineHeight: 1.6, marginBottom: 12 }}>{desc}</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px' }}>
                  {perks.map(p => (
                    <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#6B6B6B' }}>
                      <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#FF5E14', flexShrink: 0 }} />
                      {p}
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ width: 22, height: 22, borderRadius: '50%', border: `2px solid ${type === value ? '#FF5E14' : '#E5E5E5'}`, background: type === value ? '#FF5E14' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 4 }}>
                {type === value && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />}
              </div>
            </div>
          </button>
        ))}
      </div>

      <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', height: 48, fontSize: 15 }} onClick={submitType} disabled={loading || !type}>
        {loading ? <span className="spinner" /> : <>Continue <ArrowRight size={16} /></>}
      </button>
    </VendorLayout>
  )

  // ── Step 2: Business details ──────────────────────────────────────────────
  if (step === 2) return (
    <VendorLayout step={step} steps={steps} isContract={isContract} user={user} logout={logout}>
      <h3 style={{ marginBottom: 8 }}>Business Information</h3>
      <p style={{ color: '#6B6B6B', fontSize: 14, marginBottom: 32 }}>
        {isContract ? 'Provide your company details as they appear on your registration documents.' : 'Tell us a bit about your business.'}
      </p>

      <div className="form-group">
        <label className="form-label">Business Name <span style={{ color: 'var(--danger)' }}>*</span></label>
        <input className="form-control" placeholder="e.g. Acme Logistics Ltd" value={details.name} onChange={e => setD('name', e.target.value)} style={errors.name ? { borderColor: '#EF4444' } : {}} />
        {errors.name && <span style={{ fontSize: 11, color: '#EF4444' }}>{errors.name}</span>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="form-group">
          <label className="form-label">Phone <span style={{ color: 'var(--danger)' }}>*</span></label>
          <input className="form-control" placeholder="+254 7XX XXX XXX" value={details.phone} onChange={e => setD('phone', e.target.value)} style={errors.phone ? { borderColor: '#EF4444' } : {}} />
          {errors.phone && <span style={{ fontSize: 11, color: '#EF4444' }}>{errors.phone}</span>}
        </div>
        <div className="form-group">
          <label className="form-label">Director Name <span style={{ color: 'var(--danger)' }}>*</span></label>
          <input className="form-control" placeholder="Full legal name" value={details.director_name} onChange={e => setD('director_name', e.target.value)} style={errors.director_name ? { borderColor: '#EF4444' } : {}} />
          {errors.director_name && <span style={{ fontSize: 11, color: '#EF4444' }}>{errors.director_name}</span>}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Business Address <span style={{ color: 'var(--danger)' }}>*</span></label>
        <input className="form-control" placeholder="Building, Street, City" value={details.address} onChange={e => setD('address', e.target.value)} style={errors.address ? { borderColor: '#EF4444' } : {}} />
        {errors.address && <span style={{ fontSize: 11, color: '#EF4444' }}>{errors.address}</span>}
      </div>

      {isContract && (
        <>
          <div style={{ height: 1, background: '#F0F0F0', margin: '8px 0 20px' }} />
          <div style={{ fontSize: 13, fontWeight: 600, color: '#0D0D0D', marginBottom: 16 }}>Registration Details</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Business Reg. No. <span style={{ color: 'var(--danger)' }}>*</span></label>
              <input className="form-control" placeholder="e.g. CPR/2020/12345" value={details.business_reg_number} onChange={e => setD('business_reg_number', e.target.value)} style={errors.business_reg_number ? { borderColor: '#EF4444' } : {}} />
              {errors.business_reg_number && <span style={{ fontSize: 11, color: '#EF4444' }}>{errors.business_reg_number}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">KRA PIN <span style={{ color: 'var(--danger)' }}>*</span></label>
              <input className="form-control" placeholder="e.g. P0512345678A" value={details.kra_pin} onChange={e => setD('kra_pin', e.target.value.toUpperCase())} style={errors.kra_pin ? { borderColor: '#EF4444' } : {}} />
              {errors.kra_pin && <span style={{ fontSize: 11, color: '#EF4444' }}>{errors.kra_pin}</span>}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Director ID Number <span style={{ color: 'var(--danger)' }}>*</span></label>
            <input className="form-control" placeholder="National ID of the signing director" value={details.director_id_number} onChange={e => setD('director_id_number', e.target.value)} style={errors.director_id_number ? { borderColor: '#EF4444' } : {}} />
            {errors.director_id_number && <span style={{ fontSize: 11, color: '#EF4444' }}>{errors.director_id_number}</span>}
          </div>
        </>
      )}

      <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
        <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center', height: 48 }} onClick={() => setStep(1)}>
          <ArrowLeft size={16} /> Back
        </button>
        <button className="btn btn-primary" style={{ flex: 2, justifyContent: 'center', height: 48, fontSize: 15 }} onClick={submitDetails} disabled={loading}>
          {loading ? <span className="spinner" /> : <>Continue <ArrowRight size={16} /></>}
        </button>
      </div>
    </VendorLayout>
  )

  // ── Step 3: Documents (contract only) / Submit (cash) ─────────────────────
  if (step === 3) {
    if (!isContract) {
      // Cash — go straight to submit
      return (
        <VendorLayout step={step} steps={steps} isContract={isContract} user={user} logout={logout}>
          <h3 style={{ marginBottom: 8 }}>Submit Your Application</h3>
          <p style={{ color: '#6B6B6B', fontSize: 14, marginBottom: 32 }}>
            Your basic information has been collected. Submit now and we'll activate your account within 1 business day.
          </p>
          <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 12, padding: '18px 20px', marginBottom: 32 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#16A34A', marginBottom: 8 }}>Cash Account — What to expect</div>
            <ul style={{ margin: 0, paddingLeft: 18, color: '#15803D', fontSize: 13, lineHeight: 2 }}>
              <li>Account reviewed within 1 business day</li>
              <li>Email notification when approved</li>
              <li>Pay per delivery — no upfront costs</li>
            </ul>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center', height: 48 }} onClick={() => setStep(2)}>
              <ArrowLeft size={16} /> Back
            </button>
            <button className="btn btn-primary" style={{ flex: 2, justifyContent: 'center', height: 48, fontSize: 15 }} onClick={submitFinal} disabled={loading}>
              {loading ? <span className="spinner" /> : <>Submit Application <ArrowRight size={16} /></>}
            </button>
          </div>
        </VendorLayout>
      )
    }

    return (
      <VendorLayout step={step} steps={steps} isContract={isContract} user={user} logout={logout}>
        <h3 style={{ marginBottom: 8 }}>Business Documents</h3>
        <p style={{ color: '#6B6B6B', fontSize: 14, marginBottom: 32 }}>Upload clear, readable copies. Accepted: JPG, PNG, PDF · Max 10MB each.</p>

        <DocUpload label="Certificate of Incorporation / Business Registration" required hint="Official registration certificate from the Registrar of Companies" onChange={f => setF('business_cert', f)} error={errors.business_cert} />
        <DocUpload label="KRA PIN Certificate" required hint="PIN certificate from the Kenya Revenue Authority" onChange={f => setF('kra_cert', f)} error={errors.kra_cert} />

        <div style={{ fontSize: 13, fontWeight: 600, color: '#0D0D0D', marginBottom: 12, paddingTop: 8, borderTop: '1px solid #F0F0F0' }}>Director's National ID</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <DocUpload label="Front Side" required hint="Max 5MB" onChange={f => setF('director_id_front', f)} error={errors.director_id_front} />
          <DocUpload label="Back Side"  required hint="Max 5MB" onChange={f => setF('director_id_back', f)}  error={errors.director_id_back} />
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
          <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center', height: 48 }} onClick={() => setStep(2)}>
            <ArrowLeft size={16} /> Back
          </button>
          <button className="btn btn-primary" style={{ flex: 2, justifyContent: 'center', height: 48, fontSize: 15 }} onClick={submitDocuments} disabled={loading}>
            {loading ? <span className="spinner" /> : <>Continue <ArrowRight size={16} /></>}
          </button>
        </div>
      </VendorLayout>
    )
  }

  // ── Step 4: Contract signing ──────────────────────────────────────────────
  if (step === 4 && isContract) return (
    <VendorLayout step={step} steps={steps} isContract={isContract} user={user} logout={logout}>
      <h3 style={{ marginBottom: 8 }}>Service Agreement</h3>
      <p style={{ color: '#6B6B6B', fontSize: 14, marginBottom: 24 }}>Please read the agreement carefully before signing.</p>

      <div style={{ background: '#F7F7F7', borderRadius: 12, padding: '20px 22px', maxHeight: 340, overflowY: 'auto', marginBottom: 24, fontSize: 13, lineHeight: 1.9, color: '#333', whiteSpace: 'pre-line', border: '1px solid #E5E5E5' }}>
        {CONTRACT_TEXT}
      </div>

      <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer', padding: '16px', background: agreed ? '#FFF0E8' : '#F7F7F7', borderRadius: 12, border: `2px solid ${agreed ? '#FF5E14' : '#E5E5E5'}`, transition: 'all 0.2s', marginBottom: 8 }}>
        <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} style={{ marginTop: 2, accentColor: '#FF5E14', width: 18, height: 18, flexShrink: 0 }} />
        <div>
          <div style={{ fontWeight: 600, fontSize: 14, color: '#0D0D0D', marginBottom: 2 }}>I agree to the terms of this Service Agreement</div>
          <div style={{ fontSize: 12, color: '#6B6B6B' }}>By checking this box, I confirm I have read, understood, and accept all the terms and conditions above. This serves as my electronic signature.</div>
        </div>
      </label>

      {agreed && (
        <div style={{ fontSize: 12, color: '#6B6B6B', marginBottom: 20, padding: '10px 14px', background: '#F0FDF4', borderRadius: 8, border: '1px solid #BBF7D0' }}>
          Signed by <strong>{user?.name}</strong> · {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      )}

      <div style={{ display: 'flex', gap: 12 }}>
        <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center', height: 48 }} onClick={() => setStep(3)}>
          <ArrowLeft size={16} /> Back
        </button>
        <button className="btn btn-primary" style={{ flex: 2, justifyContent: 'center', height: 48, fontSize: 15 }} onClick={submitFinal} disabled={loading || !agreed}>
          {loading ? <span className="spinner" /> : <><PenLine size={16} /> Sign & Submit</>}
        </button>
      </div>
    </VendorLayout>
  )

  // ── Step 99: Submitted / Pending ──────────────────────────────────────────
  const isRejected = kycStatus === 'rejected' || user?.vendor_kyc?.kyc_status === 'rejected'

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F7F7F7', padding: 24 }}>
      <div style={{ maxWidth: 480, width: '100%', textAlign: 'center' }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: isRejected ? '#FEE2E2' : '#FFF0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          {isRejected ? <AlertCircle size={36} color="#DC2626" /> : <CheckCircle size={36} color="#FF5E14" />}
        </div>
        <h2 style={{ marginBottom: 12 }}>{isRejected ? 'Application Not Approved' : 'Application Submitted!'}</h2>
        <p style={{ color: '#6B6B6B', lineHeight: 1.8, marginBottom: 32, fontSize: 15 }}>
          {isRejected
            ? <>Your application was not approved. Reason: <strong>{user?.vendor_kyc?.kyc_rejection_reason ?? 'See email for details'}</strong>. Please correct and resubmit.</>
            : 'Our team will review your application within 1–2 business days. You\'ll receive an email once activated.'
          }
        </p>
        {isRejected && (
          <button className="btn btn-primary" style={{ justifyContent: 'center', width: '100%', height: 48, marginBottom: 12 }} onClick={() => setStep(1)}>
            Resubmit Application
          </button>
        )}
        <button className="btn btn-secondary" style={{ justifyContent: 'center', width: '100%', height: 48 }} onClick={logout}>
          Sign Out
        </button>
      </div>
    </div>
  )
}
