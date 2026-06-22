import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { CheckCircle, XCircle, Loader, ArrowRight, RefreshCw } from 'lucide-react'
import SiteLogo from '../components/SiteLogo'
import api from '../lib/api'

export default function VerifyEmailPage() {
  const [params] = useSearchParams()
  const token = params.get('token')

  const [status, setStatus]   = useState('loading') // loading | success | error
  const [message, setMessage] = useState('')
  const [resendEmail, setResendEmail] = useState('')
  const [resending, setResending]     = useState(false)
  const [resent, setResent]           = useState(false)

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('No verification token found in the link.')
      return
    }
    api.post('/auth/verify-email', { token })
      .then(() => setStatus('success'))
      .catch(err => {
        setStatus('error')
        setMessage(err.response?.data?.error ?? 'This link is invalid or has already been used.')
      })
  }, [token])

  const handleResend = async (e) => {
    e.preventDefault()
    if (!resendEmail.trim()) return
    setResending(true)
    try {
      await api.post('/auth/resend-verification', { email: resendEmail.trim() })
      setResent(true)
    } catch {
      // endpoint always returns 200 to avoid enumeration
      setResent(true)
    } finally {
      setResending(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, background: '#F7F7F7' }}>
      {/* Logo */}
      <Link to="/" style={{ display: 'inline-flex', textDecoration: 'none', marginBottom: 40 }}>
        <SiteLogo height={40} />
      </Link>

      <div style={{ background: '#fff', border: '1px solid #E5E5E5', borderRadius: 16, padding: '40px 36px', maxWidth: 440, width: '100%', textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
        {status === 'loading' && (
          <>
            <div style={{ width: 64, height: 64, background: '#FFF0E8', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <Loader size={28} color="#FF5E14" style={{ animation: 'spin 1s linear infinite' }} />
            </div>
            <h2 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: 20, marginBottom: 8 }}>Verifying your email…</h2>
            <p style={{ color: '#6B6B6B', fontSize: 14, lineHeight: 1.6 }}>Please wait while we confirm your address.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={{ width: 64, height: 64, background: '#DCFCE7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <CheckCircle size={30} color="#16A34A" />
            </div>
            <h2 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: 20, marginBottom: 10 }}>Email verified!</h2>
            <p style={{ color: '#6B6B6B', fontSize: 14, lineHeight: 1.6, marginBottom: 28 }}>
              Your account is confirmed. Sign in to complete your onboarding and start using SendTrack.
            </p>
            <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#FF5E14', color: '#fff', padding: '12px 26px', borderRadius: 8, fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>
              Sign in <ArrowRight size={15} />
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{ width: 64, height: 64, background: '#FEE2E2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <XCircle size={30} color="#DC2626" />
            </div>
            <h2 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: 20, marginBottom: 10 }}>Verification failed</h2>
            <p style={{ color: '#6B6B6B', fontSize: 14, lineHeight: 1.6, marginBottom: 28 }}>
              {message}
            </p>

            {!resent ? (
              <form onSubmit={handleResend}>
                <p style={{ fontSize: 13, color: '#6B6B6B', marginBottom: 12 }}>Need a new link? Enter your email below:</p>
                <input
                  type="email" required
                  value={resendEmail} onChange={e => setResendEmail(e.target.value)}
                  placeholder="you@example.com"
                  style={{ border: '1px solid #E5E5E5', borderRadius: 8, padding: '10px 14px', fontSize: 14, width: '100%', outline: 'none', marginBottom: 12, fontFamily: 'inherit' }}
                  onFocus={e => e.target.style.borderColor='#FF5E14'}
                  onBlur={e => e.target.style.borderColor='#E5E5E5'}
                />
                <button type="submit" disabled={resending} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#FF5E14', color: '#fff', padding: '10px 22px', borderRadius: 8, fontWeight: 600, fontSize: 14, border: 'none', cursor: resending ? 'not-allowed' : 'pointer', opacity: resending ? 0.7 : 1 }}>
                  {resending ? <><RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> Sending…</> : <>Resend link <ArrowRight size={14} /></>}
                </button>
              </form>
            ) : (
              <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, padding: '14px 18px', fontSize: 13, color: '#16A34A', lineHeight: 1.6 }}>
                If that email exists and is unverified, a new link has been sent. Check your inbox.
              </div>
            )}

            <div style={{ marginTop: 24, fontSize: 13, color: '#9B9B9B' }}>
              Already verified? <Link to="/login" style={{ color: '#FF5E14', fontWeight: 600 }}>Sign in</Link>
            </div>
          </>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
