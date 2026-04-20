import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../lib/api'
import toast from 'react-hot-toast'
import { Truck } from 'lucide-react'
import Select from '../components/Select'

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', password_confirmation: '', role: 'vendor', vendor_id: '', vehicle_type: 'motorbike' })
  const [loading, setLoading] = useState(false)
  const [vendors, setVendors] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/vendors').then(r => setVendors(r.data.data ?? [])).catch(() => {})
  }, [])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/auth/register', form)
      toast.success('Registered! Please verify your email.')
      navigate('/login')
    } catch (err) {
      const errors = err.response?.data?.errors
      toast.error(errors ? Object.values(errors).flat()[0] : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-muted)', padding: '32px 16px' }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ width: 52, height: 52, background: 'var(--primary)', borderRadius: 14, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
            <Truck size={26} color="#fff" />
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)' }}>Create Account</h2>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-control" required value={form.name} onChange={e => set('name', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-control" value={form.phone} onChange={e => set('phone', e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="email" className="form-control" required value={form.email} onChange={e => set('email', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">I am a</label>
              <Select
                value={form.role}
                onChange={e => set('role', e.target.value)}
                options={[
                  { value: 'vendor', label: 'Vendor' },
                  { value: 'rider', label: 'Rider' },
                ]}
              />
            </div>
            {form.role === 'vendor' && (
              <div className="form-group">
                <label className="form-label">Vendor Shop <span style={{ color: 'var(--danger)' }}>*</span></label>
                <Select
                  value={form.vendor_id}
                  onChange={e => set('vendor_id', e.target.value)}
                  placeholder="— Select your shop —"
                  options={vendors.map(v => ({ value: String(v.id), label: v.name }))}
                />
                <span style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4, display: 'block' }}>Your shop must be registered by an admin first</span>
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
              <label className="form-label">Password</label>
              <input type="password" className="form-control" required value={form.password} onChange={e => set('password', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input type="password" className="form-control" required value={form.password_confirmation} onChange={e => set('password_confirmation', e.target.value)} />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 4 }} disabled={loading}>
              {loading ? <span className="spinner" /> : 'Create Account'}
            </button>
          </form>
          <div style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--text-secondary)' }}>
            Already have an account? <Link to="/login">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
