import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bike, User, Car, Truck, FileText, Camera, CheckCircle, AlertCircle, ArrowRight, ArrowLeft, LogOut } from 'lucide-react'
import api from '../../lib/api'
import { useAuthStore } from '../../store/authStore'
import StepBar from '../../components/onboarding/StepBar'
import DocUpload from '../../components/onboarding/DocUpload'
import toast from 'react-hot-toast'

const STEPS = ['Personal', 'Vehicle', 'Documents', 'Photos']

const VEHICLE_TYPES = [
  { value: 'bicycle',  label: 'Bicycle',   Icon: Bike  },
  { value: 'motorbike',label: 'Motorbike', Icon: Bike  },
  { value: 'car',      label: 'Car',       Icon: Car   },
  { value: 'van',      label: 'Van',       Icon: Truck },
]

const THIS_YEAR = new Date().getFullYear()

const LEFT_CHECKLIST = [
  { Icon: User,        label: 'Identity verification' },
  { Icon: Car,         label: 'Vehicle inspection' },
  { Icon: FileText,    label: 'Document review' },
  { Icon: CheckCircle, label: 'Account activation' },
]

function RiderLayout({ step, logout, children }) {
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
            <Bike size={18} color="#fff" />
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: '#fff' }}>SendTrack</span>
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#FF5E14', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 12 }}>Rider Application</div>
          <h2 style={{ color: '#fff', fontSize: 28, lineHeight: 1.25, marginBottom: 16 }}>
            {step === 1 && 'Tell us about yourself'}
            {step === 2 && 'Your vehicle details'}
            {step === 3 && 'Upload your documents'}
            {step === 4 && 'Almost there!'}
            {step === 5 && 'Under review'}
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, lineHeight: 1.8 }}>
            {step === 1 && 'We need to verify your identity before you can start delivering.'}
            {step === 2 && "Tell us about the vehicle you'll use for deliveries."}
            {step === 3 && 'Upload clear photos of your documents. Make sure all text is readable.'}
            {step === 4 && 'Upload a photo of your vehicle and a selfie to complete your application.'}
            {step === 5 && 'Our team is reviewing your application. This typically takes 1–2 business days.'}
          </p>

          {step < 5 && (
            <div style={{ marginTop: 48 }}>
              {LEFT_CHECKLIST.map(({ Icon, label }, i) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: i < step ? 'rgba(255,94,20,0.2)' : 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={15} color={i < step ? '#FF5E14' : 'rgba(255,255,255,0.3)'} />
                  </div>
                  <span style={{ fontSize: 13, color: i < step ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.3)', fontWeight: i < step ? 500 : 400 }}>{label}</span>
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
          {step < 5 && <StepBar steps={STEPS} current={step} />}
          {children}
        </div>
      </div>
    </div>
  )
}

export default function RiderOnboarding() {
  const { user, logout, refreshUser } = useAuthStore()
  const navigate = useNavigate()

  const initialStep = user?.rider_profile?.kyc_step ?? 0
  const kycStatus   = user?.rider_profile?.kyc_status ?? 'pending'

  const [step, setStep]       = useState(kycStatus === 'submitted' ? 5 : Math.max(initialStep + 1, 1))
  const [loading, setLoading] = useState(false)
  const [errors, setErrors]   = useState({})

  // Step 1 state
  const [personal, setPersonal] = useState({
    date_of_birth: '', home_address: '', national_id_number: '',
    emergency_contact_name: '', emergency_contact_phone: '',
  })

  // Step 2 state
  const [vehicle, setVehicle] = useState({
    vehicle_type: user?.rider_profile?.vehicle_type ?? 'motorbike',
    vehicle_make: '', vehicle_model: '', vehicle_year: '',
    vehicle_plate: '', vehicle_color: '',
  })

  // Step 3 state
  const [docs, setDocs]   = useState({
    national_id_front: null, national_id_back: null,
    license_number: '', license_expiry: '',
    license_front: null, logbook: null,
  })

  // Step 4 state
  const [media, setMedia] = useState({ profile_photo: null, vehicle_image: null, selfie: null })

  const setP = (k, v) => { setPersonal(p => ({ ...p, [k]: v })); setErrors(e => ({ ...e, [k]: null })) }
  const setV = (k, v) => { setVehicle(p => ({ ...p, [k]: v }));  setErrors(e => ({ ...e, [k]: null })) }
  const setD = (k, v) => { setDocs(p => ({ ...p, [k]: v }));     setErrors(e => ({ ...e, [k]: null })) }
  const setM = (k, v) => { setMedia(p => ({ ...p, [k]: v }));    setErrors(e => ({ ...e, [k]: null })) }

  const apiErrors = (err) => {
    const e = err.response?.data?.errors
    if (e) { setErrors(Object.fromEntries(Object.entries(e).map(([k, v]) => [k, v[0]]))); return }
    toast.error(err.response?.data?.message ?? 'Something went wrong')
  }

  // ── Step submissions ──────────────────────────────────────────────────────

  const submitPersonal = async () => {
    setLoading(true)
    try {
      await api.post('/onboarding/rider/personal', personal)
      await refreshUser()
      setStep(2)
    } catch (e) { apiErrors(e) } finally { setLoading(false) }
  }

  const submitVehicle = async () => {
    setLoading(true)
    try {
      await api.post('/onboarding/rider/vehicle', vehicle)
      await refreshUser()
      setStep(3)
    } catch (e) { apiErrors(e) } finally { setLoading(false) }
  }

  const submitDocuments = async () => {
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('national_id_front', docs.national_id_front)
      fd.append('national_id_back',  docs.national_id_back)
      fd.append('license_number',    docs.license_number)
      fd.append('license_expiry',    docs.license_expiry)
      fd.append('license_front',     docs.license_front)
      fd.append('logbook',           docs.logbook)
      await api.post('/onboarding/rider/documents', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      await refreshUser()
      setStep(4)
    } catch (e) { apiErrors(e) } finally { setLoading(false) }
  }

  const submitMedia = async () => {
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('profile_photo', media.profile_photo)
      fd.append('vehicle_image', media.vehicle_image)
      fd.append('selfie',        media.selfie)
      await api.post('/onboarding/rider/media', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      await refreshUser()
      setStep(5)
    } catch (e) { apiErrors(e) } finally { setLoading(false) }
  }

  // ── Step 1: Personal ──────────────────────────────────────────────────────
  if (step === 1) return (
    <RiderLayout step={step} logout={logout}>
      <h3 style={{ marginBottom: 8 }}>Personal Information</h3>
      <p style={{ color: '#6B6B6B', fontSize: 14, marginBottom: 32 }}>This information is used to verify your identity.</p>

      <div className="form-group">
        <label className="form-label">Date of Birth <span style={{ color: 'var(--danger)' }}>*</span></label>
        <input type="date" className="form-control" value={personal.date_of_birth} onChange={e => setP('date_of_birth', e.target.value)} max={new Date(Date.now() - 18*365.25*24*3600*1000).toISOString().split('T')[0]} style={errors.date_of_birth ? { borderColor: '#EF4444' } : {}} />
        {errors.date_of_birth && <span style={{ fontSize: 11, color: '#EF4444' }}>{errors.date_of_birth}</span>}
      </div>

      <div className="form-group">
        <label className="form-label">National ID Number <span style={{ color: 'var(--danger)' }}>*</span></label>
        <input className="form-control" placeholder="e.g. 12345678" value={personal.national_id_number} onChange={e => setP('national_id_number', e.target.value)} style={errors.national_id_number ? { borderColor: '#EF4444' } : {}} />
        {errors.national_id_number && <span style={{ fontSize: 11, color: '#EF4444' }}>{errors.national_id_number}</span>}
      </div>

      <div className="form-group">
        <label className="form-label">Home Address <span style={{ color: 'var(--danger)' }}>*</span></label>
        <input className="form-control" placeholder="Estate, Street, City" value={personal.home_address} onChange={e => setP('home_address', e.target.value)} style={errors.home_address ? { borderColor: '#EF4444' } : {}} />
        {errors.home_address && <span style={{ fontSize: 11, color: '#EF4444' }}>{errors.home_address}</span>}
      </div>

      <div style={{ background: '#F7F7F7', borderRadius: 12, padding: '20px 20px 4px', marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14, color: '#0D0D0D' }}>Emergency Contact</div>
        <div className="form-group">
          <label className="form-label">Full Name <span style={{ color: 'var(--danger)' }}>*</span></label>
          <input className="form-control" placeholder="Contact person name" value={personal.emergency_contact_name} onChange={e => setP('emergency_contact_name', e.target.value)} style={errors.emergency_contact_name ? { borderColor: '#EF4444' } : {}} />
          {errors.emergency_contact_name && <span style={{ fontSize: 11, color: '#EF4444' }}>{errors.emergency_contact_name}</span>}
        </div>
        <div className="form-group">
          <label className="form-label">Phone Number <span style={{ color: 'var(--danger)' }}>*</span></label>
          <input className="form-control" placeholder="+254 7XX XXX XXX" value={personal.emergency_contact_phone} onChange={e => setP('emergency_contact_phone', e.target.value)} style={errors.emergency_contact_phone ? { borderColor: '#EF4444' } : {}} />
          {errors.emergency_contact_phone && <span style={{ fontSize: 11, color: '#EF4444' }}>{errors.emergency_contact_phone}</span>}
        </div>
      </div>

      <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', height: 48, fontSize: 15 }} onClick={submitPersonal} disabled={loading}>
        {loading ? <span className="spinner" /> : <>Continue <ArrowRight size={16} /></>}
      </button>
    </RiderLayout>
  )

  // ── Step 2: Vehicle ───────────────────────────────────────────────────────
  if (step === 2) return (
    <RiderLayout step={step} logout={logout}>
      <h3 style={{ marginBottom: 8 }}>Vehicle Details</h3>
      <p style={{ color: '#6B6B6B', fontSize: 14, marginBottom: 32 }}>Tell us about the vehicle you'll use for deliveries.</p>

      <div style={{ marginBottom: 24 }}>
        <div className="form-label" style={{ marginBottom: 10 }}>Vehicle Type <span style={{ color: 'var(--danger)' }}>*</span></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
          {VEHICLE_TYPES.map(({ value, label, Icon }) => (
            <button key={value} onClick={() => setV('vehicle_type', value)} style={{
              padding: '14px 12px', border: `2px solid ${vehicle.vehicle_type === value ? '#FF5E14' : '#E5E5E5'}`,
              borderRadius: 10, background: vehicle.vehicle_type === value ? '#FFF0E8' : '#fff',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left', transition: 'all 0.15s',
            }}>
              <div style={{ width: 34, height: 34, background: vehicle.vehicle_type === value ? 'rgba(255,94,20,0.15)' : '#F7F7F7', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={17} color={vehicle.vehicle_type === value ? '#FF5E14' : '#6B6B6B'} />
              </div>
              <span style={{ fontWeight: 600, fontSize: 14, color: vehicle.vehicle_type === value ? '#FF5E14' : '#0D0D0D' }}>{label}</span>
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="form-group">
          <label className="form-label">Make <span style={{ color: 'var(--danger)' }}>*</span></label>
          <input className="form-control" placeholder="e.g. Honda" value={vehicle.vehicle_make} onChange={e => setV('vehicle_make', e.target.value)} style={errors.vehicle_make ? { borderColor: '#EF4444' } : {}} />
          {errors.vehicle_make && <span style={{ fontSize: 11, color: '#EF4444' }}>{errors.vehicle_make}</span>}
        </div>
        <div className="form-group">
          <label className="form-label">Model <span style={{ color: 'var(--danger)' }}>*</span></label>
          <input className="form-control" placeholder="e.g. CB125" value={vehicle.vehicle_model} onChange={e => setV('vehicle_model', e.target.value)} style={errors.vehicle_model ? { borderColor: '#EF4444' } : {}} />
          {errors.vehicle_model && <span style={{ fontSize: 11, color: '#EF4444' }}>{errors.vehicle_model}</span>}
        </div>
        <div className="form-group">
          <label className="form-label">Year <span style={{ color: 'var(--danger)' }}>*</span></label>
          <input type="number" className="form-control" placeholder="e.g. 2020" min="1990" max={THIS_YEAR + 1} value={vehicle.vehicle_year} onChange={e => setV('vehicle_year', e.target.value)} style={errors.vehicle_year ? { borderColor: '#EF4444' } : {}} />
          {errors.vehicle_year && <span style={{ fontSize: 11, color: '#EF4444' }}>{errors.vehicle_year}</span>}
        </div>
        <div className="form-group">
          <label className="form-label">Colour <span style={{ color: 'var(--danger)' }}>*</span></label>
          <input className="form-control" placeholder="e.g. Black" value={vehicle.vehicle_color} onChange={e => setV('vehicle_color', e.target.value)} style={errors.vehicle_color ? { borderColor: '#EF4444' } : {}} />
          {errors.vehicle_color && <span style={{ fontSize: 11, color: '#EF4444' }}>{errors.vehicle_color}</span>}
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Number Plate <span style={{ color: 'var(--danger)' }}>*</span></label>
        <input className="form-control" placeholder="e.g. KAA 123B" value={vehicle.vehicle_plate} onChange={e => setV('vehicle_plate', e.target.value.toUpperCase())} style={errors.vehicle_plate ? { borderColor: '#EF4444' } : {}} />
        {errors.vehicle_plate && <span style={{ fontSize: 11, color: '#EF4444' }}>{errors.vehicle_plate}</span>}
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
        <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center', height: 48 }} onClick={() => setStep(1)}>
          <ArrowLeft size={16} /> Back
        </button>
        <button className="btn btn-primary" style={{ flex: 2, justifyContent: 'center', height: 48, fontSize: 15 }} onClick={submitVehicle} disabled={loading}>
          {loading ? <span className="spinner" /> : <>Continue <ArrowRight size={16} /></>}
        </button>
      </div>
    </RiderLayout>
  )

  // ── Step 3: Documents ─────────────────────────────────────────────────────
  if (step === 3) return (
    <RiderLayout step={step} logout={logout}>
      <h3 style={{ marginBottom: 8 }}>Upload Documents</h3>
      <p style={{ color: '#6B6B6B', fontSize: 14, marginBottom: 32 }}>Ensure documents are clear and not expired. Accepted: JPG, PNG, PDF.</p>

      <div style={{ fontSize: 13, fontWeight: 600, color: '#0D0D0D', marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid #F0F0F0' }}>National ID</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 8 }}>
        <DocUpload label="Front Side" required hint="JPG, PNG or PDF · Max 5MB" onChange={f => setD('national_id_front', f)} error={errors.national_id_front} />
        <DocUpload label="Back Side"  required hint="JPG, PNG or PDF · Max 5MB" onChange={f => setD('national_id_back', f)}  error={errors.national_id_back} />
      </div>

      <div style={{ fontSize: 13, fontWeight: 600, color: '#0D0D0D', marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid #F0F0F0', marginTop: 8 }}>Driver's Licence</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <div className="form-group">
          <label className="form-label">Licence Number <span style={{ color: 'var(--danger)' }}>*</span></label>
          <input className="form-control" placeholder="e.g. A1234567" value={docs.license_number} onChange={e => setD('license_number', e.target.value)} style={errors.license_number ? { borderColor: '#EF4444' } : {}} />
          {errors.license_number && <span style={{ fontSize: 11, color: '#EF4444' }}>{errors.license_number}</span>}
        </div>
        <div className="form-group">
          <label className="form-label">Expiry Date <span style={{ color: 'var(--danger)' }}>*</span></label>
          <input type="date" className="form-control" value={docs.license_expiry} onChange={e => setD('license_expiry', e.target.value)} min={new Date().toISOString().split('T')[0]} style={errors.license_expiry ? { borderColor: '#EF4444' } : {}} />
          {errors.license_expiry && <span style={{ fontSize: 11, color: '#EF4444' }}>{errors.license_expiry}</span>}
        </div>
      </div>
      <DocUpload label="Licence (Front)" required hint="Show front of your driving licence" onChange={f => setD('license_front', f)} error={errors.license_front} />

      <div style={{ fontSize: 13, fontWeight: 600, color: '#0D0D0D', marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid #F0F0F0', marginTop: 8 }}>Vehicle Logbook</div>
      <DocUpload label="Logbook / Vehicle Registration" required hint="Upload the vehicle registration document" onChange={f => setD('logbook', f)} error={errors.logbook} />

      <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
        <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center', height: 48 }} onClick={() => setStep(2)}>
          <ArrowLeft size={16} /> Back
        </button>
        <button className="btn btn-primary" style={{ flex: 2, justifyContent: 'center', height: 48, fontSize: 15 }} onClick={submitDocuments} disabled={loading}>
          {loading ? <span className="spinner" /> : <>Continue <ArrowRight size={16} /></>}
        </button>
      </div>
    </RiderLayout>
  )

  // ── Step 4: Photos ────────────────────────────────────────────────────────
  if (step === 4) return (
    <RiderLayout step={step} logout={logout}>
      <h3 style={{ marginBottom: 8 }}>Photos</h3>
      <p style={{ color: '#6B6B6B', fontSize: 14, marginBottom: 32 }}>These verify your identity and will be shown to vendors during deliveries.</p>

      <DocUpload label="Profile Photo" required hint="Clear photo of your face only — no sunglasses, no hat. This is shown to vendors tracking their orders." onChange={f => setM('profile_photo', f)} error={errors.profile_photo} />
      <DocUpload label="Vehicle Photo" required hint="Side-on photo of your vehicle. The number plate must be clearly visible." onChange={f => setM('vehicle_image', f)} error={errors.vehicle_image} />
      <DocUpload label="ID Selfie (KYC)" required hint="Selfie holding your National ID open. Used for identity verification only — not shown publicly." onChange={f => setM('selfie', f)} error={errors.selfie} />

      <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 10, padding: '14px 16px', marginBottom: 24, fontSize: 13, color: '#92400E', display: 'flex', gap: 10 }}>
        <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
        <span>Your application will be reviewed within 1–2 business days. You'll receive an email notification when it's approved.</span>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center', height: 48 }} onClick={() => setStep(3)}>
          <ArrowLeft size={16} /> Back
        </button>
        <button className="btn btn-primary" style={{ flex: 2, justifyContent: 'center', height: 48, fontSize: 15 }} onClick={submitMedia} disabled={loading}>
          {loading ? <span className="spinner" /> : <>Submit Application <ArrowRight size={16} /></>}
        </button>
      </div>
    </RiderLayout>
  )

  // ── Step 5: Submitted / Pending ───────────────────────────────────────────
  const isRejected = kycStatus === 'rejected' || user?.rider_profile?.kyc_status === 'rejected'

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F7F7F7', padding: 24 }}>
      <div style={{ maxWidth: 480, width: '100%', textAlign: 'center' }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: isRejected ? '#FEE2E2' : '#FFF0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          {isRejected ? <AlertCircle size={36} color="#DC2626" /> : <CheckCircle size={36} color="#FF5E14" />}
        </div>
        <h2 style={{ marginBottom: 12 }}>{isRejected ? 'Application Not Approved' : 'Application Submitted!'}</h2>
        <p style={{ color: '#6B6B6B', lineHeight: 1.8, marginBottom: 32, fontSize: 15 }}>
          {isRejected
            ? <>Your application was not approved. Reason: <strong>{user?.rider_profile?.kyc_rejection_reason ?? 'See email for details'}</strong>. Please correct and resubmit.</>
            : 'Our team is reviewing your documents. This typically takes 1–2 business days. You\'ll get an email as soon as it\'s done.'
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
