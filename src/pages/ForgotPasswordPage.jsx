import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../lib/api'
import toast from 'react-hot-toast'
import { Truck, Mail, ArrowRight, CheckCircle } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/auth/forgot-password', { email })
      setSent(true)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{`
        .fp-wrap { display:flex; min-height:100vh; align-items:center; justify-content:center; padding:32px 20px; background:var(--surface-muted); }
      `}</style>

      <div className="fp-wrap">
        <div style={{ width: '100%', maxWidth: 440 }}>
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ width: 52, height: 52, background: 'var(--primary)', borderRadius: 14, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <Truck size={26} color="#fff" />
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)' }}>Forgot password?</h2>
            <p className="text-muted text-sm" style={{ marginTop: 4 }}>
              Enter your email and we'll send a reset link
            </p>
          </div>

          <div className="card" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
            {sent ? (
              <div style={{ textAlign: 'center', padding: '8px 0' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#DCFCE7', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <CheckCircle size={28} color="var(--success)" />
                </div>
                <h3 style={{ marginBottom: 8 }}>Check your inbox</h3>
                <p className="text-muted text-sm" style={{ lineHeight: 1.7 }}>
                  If <strong>{email}</strong> is registered, you'll receive a password reset link shortly. Check your spam folder if it doesn't arrive.
                </p>
                <Link to="/login" className="btn btn-primary" style={{ marginTop: 24, width: '100%', justifyContent: 'center' }}>
                  Back to Sign in
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Email address</label>
                  <input
                    type="email" className="form-control" required
                    value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    autoFocus
                  />
                </div>
                <button
                  type="submit" className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center', marginTop: 8, padding: '11px 18px', fontSize: 15 }}
                  disabled={loading}
                >
                  {loading
                    ? <span className="spinner" />
                    : <><Mail size={15} /> Send reset link <ArrowRight size={15} /></>
                  }
                </button>
              </form>
            )}

            {!sent && (
              <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text-secondary)' }}>
                Remembered it?{' '}
                <Link to="/login" style={{ fontWeight: 600 }}>Sign in</Link>
              </div>
            )}
          </div>

          <p style={{ textAlign: 'center', marginTop: 24, fontSize: 12, color: 'var(--text-secondary)' }}>
            <Link to="/" style={{ color: 'var(--text-secondary)' }}>← Back to homepage</Link>
          </p>
        </div>
      </div>
    </>
  )
}
