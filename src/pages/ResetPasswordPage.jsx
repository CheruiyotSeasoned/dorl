import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import api from '../lib/api'
import toast from 'react-hot-toast'
import { Truck, KeyRound, Eye, EyeOff, CheckCircle } from 'lucide-react'

export default function ResetPasswordPage() {
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const navigate = useNavigate()

  const [form, setForm] = useState({ password: '', password_confirmation: '' })
  const [show, setShow] = useState({ password: false, confirm: false })
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password !== form.password_confirmation) {
      toast.error('Passwords do not match')
      return
    }
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    setLoading(true)
    try {
      await api.post('/auth/reset-password', { token, ...form })
      setDone(true)
      setTimeout(() => navigate('/login'), 3000)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Reset failed — link may have expired')
    } finally {
      setLoading(false)
    }
  }

  const pwInput = (field, label, showKey) => (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          type={show[showKey] ? 'text' : 'password'}
          className="form-control" required
          value={form[field]}
          onChange={set(field)}
          placeholder="••••••••"
          autoComplete={field === 'password' ? 'new-password' : 'new-password'}
          style={{ paddingRight: 44 }}
        />
        <button
          type="button"
          onClick={() => setShow(s => ({ ...s, [showKey]: !s[showKey] }))}
          style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 0, display: 'flex' }}
        >
          {show[showKey] ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  )

  if (!token) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div className="card" style={{ maxWidth: 400, textAlign: 'center' }}>
          <p className="text-muted">Invalid reset link. Please request a new one.</p>
          <Link to="/forgot-password" className="btn btn-primary" style={{ marginTop: 16, justifyContent: 'center' }}>
            Request new link
          </Link>
        </div>
      </div>
    )
  }

  return (
    <>
      <style>{`
        .rp-wrap { display:flex; min-height:100vh; align-items:center; justify-content:center; padding:32px 20px; background:var(--surface-muted); }
      `}</style>

      <div className="rp-wrap">
        <div style={{ width: '100%', maxWidth: 440 }}>
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ width: 52, height: 52, background: 'var(--primary)', borderRadius: 14, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <Truck size={26} color="#fff" />
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)' }}>Set new password</h2>
            <p className="text-muted text-sm" style={{ marginTop: 4 }}>
              Choose a strong password for your account
            </p>
          </div>

          <div className="card" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
            {done ? (
              <div style={{ textAlign: 'center', padding: '8px 0' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#DCFCE7', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <CheckCircle size={28} color="var(--success)" />
                </div>
                <h3 style={{ marginBottom: 8 }}>Password updated!</h3>
                <p className="text-muted text-sm">
                  You'll be redirected to the login page in a moment…
                </p>
                <Link to="/login" className="btn btn-primary" style={{ marginTop: 24, width: '100%', justifyContent: 'center' }}>
                  Sign in now
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                {pwInput('password', 'New password', 'password')}
                {pwInput('password_confirmation', 'Confirm new password', 'confirm')}

                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16 }}>
                  Must be at least 8 characters
                </div>

                <button
                  type="submit" className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center', padding: '11px 18px', fontSize: 15 }}
                  disabled={loading}
                >
                  {loading
                    ? <span className="spinner" />
                    : <><KeyRound size={15} /> Reset password</>
                  }
                </button>
              </form>
            )}
          </div>

          <p style={{ textAlign: 'center', marginTop: 24, fontSize: 12, color: 'var(--text-secondary)' }}>
            <Link to="/login" style={{ color: 'var(--text-secondary)' }}>← Back to Sign in</Link>
          </p>
        </div>
      </div>
    </>
  )
}
