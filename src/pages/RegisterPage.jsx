import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Truck, Package, Bike, Car, CheckCircle, Zap, FileText } from 'lucide-react'
import PasswordInput from '../components/PasswordInput'
import api from '../lib/api'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const [form, setForm]       = useState({ name: '', email: '', phone: '', password: '', password_confirmation: '', role: 'vendor', vehicle_type: 'motorbike' })
  const [loading, setLoading] = useState(false)

  const { login }             = useAuthStore()
  const navigate              = useNavigate()

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password !== form.password_confirmation) {
      toast.error('Passwords do not match')
      return
    }
    setLoading(true)
    try {
      // Register (no vendor_id — onboarding will set up the vendor)
      const payload = { name: form.name, email: form.email, phone: form.phone, password: form.password, password_confirmation: form.password_confirmation, role: form.role }
      if (form.role === 'rider') payload.vehicle_type = form.vehicle_type
      await api.post('/auth/register', payload)

      toast.success('Account created! Please verify your email, then log in to complete onboarding.')
      navigate('/login')
    } catch (err) {
      const errors = err.response?.data?.errors
      toast.error(errors ? Object.values(errors).flat()[0] : (err.response?.data?.message ?? 'Registration failed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#fff' }}>
      {/* Left panel */}
      <div style={{
        width: 420, flexShrink: 0, background: '#0D0D0D', display: 'flex', flexDirection: 'column',
        padding: '48px 44px', position: 'relative', overflow: 'hidden',
      }} className="ob-left-panel">
        <div style={{ position: 'absolute', top: -60, right: -60, width: 280, height: 280, background: 'rgba(255,94,20,0.07)', borderRadius: '50%', pointerEvents: 'none' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 64 }}>
          <div style={{ width: 36, height: 36, background: '#FF5E14', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Truck size={18} color="#fff" />
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: '#fff' }}>SendTrack</span>
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#FF5E14', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 12 }}>Join SendTrack</div>
          <h2 style={{ color: '#fff', fontSize: 30, lineHeight: 1.2, marginBottom: 20 }}>
            Fast, reliable last-mile logistics.
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, lineHeight: 1.9, marginBottom: 48 }}>
            Create your account and complete a quick onboarding to start sending or delivering packages across Nairobi.
          </p>

          {[
            { Icon: CheckCircle, text: 'Real-time GPS tracking on every order' },
            { Icon: Package,     text: 'Package-level proof of delivery' },
            { Icon: Zap,         text: 'Intelligent auto-dispatch in seconds' },
            { Icon: FileText,    text: 'Automated invoicing & reporting' },
          ].map(({ Icon, text }) => (
            <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div style={{ width: 28, height: 28, background: 'rgba(255,94,20,0.15)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={14} color="#FF5E14" />
              </div>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflowY: 'auto', padding: '40px 24px' }}>
        <div style={{ width: '100%', maxWidth: 440 }}>
          <h2 style={{ marginBottom: 6 }}>Create your account</h2>
          <p style={{ color: '#6B6B6B', fontSize: 14, marginBottom: 32 }}>Takes less than 2 minutes. Onboarding follows after email verification.</p>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Full Name <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input className="form-control" required value={form.name} onChange={e => set('name', e.target.value)} placeholder="Jane Doe" autoComplete="name" />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-control" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+254 7XX XXX XXX" autoComplete="tel" />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email <span style={{ color: 'var(--danger)' }}>*</span></label>
              <input type="email" className="form-control" required value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@company.com" autoComplete="email" />
            </div>

            <div className="form-group">
              <label className="form-label">I want to</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[{ value: 'vendor', label: 'Send packages', Icon: Package }, { value: 'rider', label: 'Deliver packages', Icon: Bike }].map(({ value, label, Icon }) => (
                  <button key={value} type="button" onClick={() => set('role', value)} style={{
                    padding: '12px', border: `2px solid ${form.role === value ? '#FF5E14' : '#E5E5E5'}`,
                    borderRadius: 10, background: form.role === value ? '#FFF0E8' : '#fff', cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, transition: 'all 0.15s',
                  }}>
                    <div style={{ width: 40, height: 40, background: form.role === value ? 'rgba(255,94,20,0.15)' : '#F7F7F7', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={20} color={form.role === value ? '#FF5E14' : '#6B6B6B'} />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: form.role === value ? '#FF5E14' : '#0D0D0D' }}>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {form.role === 'rider' && (
              <div className="form-group">
                <label className="form-label">Vehicle Type</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
                  {[{ v: 'bicycle', l: 'Bicycle', Icon: Bike }, { v: 'motorbike', l: 'Motorbike', Icon: Bike }, { v: 'car', l: 'Car', Icon: Car }, { v: 'van', l: 'Van', Icon: Truck }].map(({ v, l, Icon }) => (
                    <button key={v} type="button" onClick={() => set('vehicle_type', v)} style={{
                      padding: '10px 6px', border: `2px solid ${form.vehicle_type === v ? '#FF5E14' : '#E5E5E5'}`,
                      borderRadius: 8, background: form.vehicle_type === v ? '#FFF0E8' : '#fff', cursor: 'pointer',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, transition: 'all 0.15s',
                    }}>
                      <div style={{ width: 32, height: 32, background: form.vehicle_type === v ? 'rgba(255,94,20,0.15)' : '#F7F7F7', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon size={16} color={form.vehicle_type === v ? '#FF5E14' : '#6B6B6B'} />
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 600, color: form.vehicle_type === v ? '#FF5E14' : '#6B6B6B' }}>{l}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Password <span style={{ color: 'var(--danger)' }}>*</span></label>
              <PasswordInput required value={form.password} onChange={e => set('password', e.target.value)} placeholder="Min. 8 characters" autoComplete="new-password" />
            </div>

            <div className="form-group">
              <label className="form-label">Confirm Password <span style={{ color: 'var(--danger)' }}>*</span></label>
              <PasswordInput required value={form.password_confirmation} onChange={e => set('password_confirmation', e.target.value)} placeholder="Repeat password" autoComplete="new-password" />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', height: 48, fontSize: 15, marginTop: 4 }} disabled={loading}>
              {loading ? <span className="spinner" /> : 'Create Account'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text-secondary)' }}>
            Already have an account? <Link to="/login" style={{ fontWeight: 600 }}>Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
