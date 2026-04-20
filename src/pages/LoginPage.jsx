import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'
import { Truck, Package, MapPin, Shield, ArrowRight } from 'lucide-react'

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const { login } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const user = await login(form.email, form.password)
      toast.success(`Welcome back, ${user.name}!`)
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{`
        .login-wrap { display:flex; min-height:100vh; }
        .login-brand {
          display:flex; flex-direction:column; justify-content:space-between;
          width:42%; padding:48px 40px; background:#0D0D0D;
          position:relative; overflow:hidden;
        }
        .login-brand::before {
          content:''; position:absolute; inset:0;
          background:radial-gradient(circle at 30% 70%, rgba(255,94,20,0.18) 0%, transparent 60%);
          pointer-events:none;
        }
        .login-form-side {
          flex:1; display:flex; align-items:center; justify-content:center;
          padding:32px 24px; background:var(--surface-muted);
        }
        @media(max-width:768px){
          .login-brand { display:none !important; }
          .login-form-side { padding:32px 20px; }
        }
      `}</style>

      <div className="login-wrap">
        {/* ── Left brand panel ──────────────────────────────────────────── */}
        <div className="login-brand">
          {/* Logo */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 48 }}>
              <div style={{ width: 40, height: 40, background: '#FF5E14', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Truck size={20} color="#fff" />
              </div>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: '#fff' }}>DORL Delivery</span>
            </div>

            <div style={{ marginBottom: 12 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#FF5E14', textTransform: 'uppercase', letterSpacing: '1px' }}>Last-Mile Logistics</span>
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem,3vw,2.8rem)', fontWeight: 700, color: '#fff', lineHeight: 1.1, marginBottom: 20 }}>
              Fast. Reliable.<br />
              <span style={{ color: '#FF5E14' }}>Delivered.</span>
            </h1>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.55)', lineHeight: 1.75, maxWidth: 340, marginBottom: 40 }}>
              Connect vendors, riders and customers in real-time. Live dispatch, GPS tracking and proof of delivery you can trust.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { icon: Package,  text: 'Package-level tracking from pickup to door' },
                { icon: MapPin,   text: 'Live GPS updates every few seconds' },
                { icon: Shield,   text: '100% compensation on loss or damage' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(255,94,20,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={16} color="#FF5E14" />
                  </div>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.5 }}>{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom stats */}
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: 28, paddingTop: 32, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            {[['500+','Daily deliveries'],['98%','Success rate'],['24/7','Live support']].map(([v, l]) => (
              <div key={l}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: '#fff' }}>{v}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right form side ───────────────────────────────────────────── */}
        <div className="login-form-side">
          <div style={{ width: '100%', maxWidth: 420 }}>
            {/* Mobile logo */}
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div style={{ width: 52, height: 52, background: 'var(--primary)', borderRadius: 14, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <Truck size={26} color="#fff" />
              </div>
              <h2 style={{ fontFamily: 'var(--font-display)' }}>Sign in</h2>
              <p className="text-muted text-sm" style={{ marginTop: 4 }}>Welcome back — enter your details below</p>
            </div>

            <div className="card" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Email address</label>
                  <input
                    type="email" className="form-control" required
                    value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </div>
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <label className="form-label" style={{ margin: 0 }}>Password</label>
                    <Link to="/forgot-password" style={{ fontSize: 12, color: 'var(--primary)' }}>Forgot password?</Link>
                  </div>
                  <input
                    type="password" className="form-control" required
                    value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center', marginTop: 8, padding: '11px 18px', fontSize: 15 }}
                  disabled={loading}
                >
                  {loading
                    ? <span className="spinner" />
                    : <> Sign in <ArrowRight size={16} /> </>
                  }
                </button>
              </form>

              <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text-secondary)' }}>
                Don't have an account?{' '}
                <Link to="/register" style={{ fontWeight: 600 }}>Create one</Link>
              </div>
            </div>

            <p style={{ textAlign: 'center', marginTop: 24, fontSize: 12, color: 'var(--text-secondary)' }}>
              <Link to="/" style={{ color: 'var(--text-secondary)' }}>← Back to homepage</Link>
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
