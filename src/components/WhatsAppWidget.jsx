import { useState, useEffect } from 'react'
import { X, MessageCircle } from 'lucide-react'

const WA_SVG = (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
)

// Agent avatar — initials only, no emoji
function Avatar({ size = 28 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: '#128C7E',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0, color: '#fff', fontWeight: 700,
      fontSize: Math.round(size * 0.38),
    }}>SC</div>
  )
}

const FLOWS = [
  {
    key: 'track',
    label: 'Track my package',
    reply: "Sure! Please have your tracking code ready. We will pull it up for you right away on WhatsApp.",
    waMsg: "Hi Sendtrack! I'd like to track my package. My tracking code is: ",
  },
  {
    key: 'pickup',
    label: 'Request a pickup',
    reply: "Great! Share your pickup location, drop-off address, and package details and we will assign a rider immediately.",
    waMsg: "Hi Sendtrack! I'd like to request a package pickup.",
  },
  {
    key: 'quote',
    label: 'Get a delivery quote',
    reply: "We will get you a quote in minutes. Share your pickup and delivery locations plus the package size on WhatsApp.",
    waMsg: "Hi Sendtrack! I'd like a delivery quote for my package.",
  },
  {
    key: 'vendor',
    label: 'Partner with us',
    reply: "We would love to work with you! Let us chat about how Sendtrack can handle your deliveries at scale.",
    waMsg: "Hi Sendtrack! I'm interested in partnering with Sendtrack as a vendor.",
  },
  {
    key: 'other',
    label: 'Other enquiry',
    reply: "No problem at all! Our support team is ready. Tap below and tell us how we can help.",
    waMsg: "Hi Sendtrack! I have an enquiry I'd like help with.",
  },
]

function toE164(phone = '') {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('254')) return digits
  if (digits.startsWith('0'))   return '254' + digits.slice(1)
  return digits
}

function nowTime() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function WhatsAppWidget({ phone = '254708919320', agentName = 'Sendtrack Support' }) {
  const [open,    setOpen]    = useState(false)
  const [step,    setStep]    = useState('menu')
  const [pulse,   setPulse]   = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 500)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const t = setTimeout(() => setPulse(true), 3500)
    return () => clearTimeout(t)
  }, [])

  const e164 = toE164(phone)
  const flow = FLOWS.find(f => f.key === step)

  const openWA = (msg) =>
    window.open(`https://wa.me/${e164}?text=${encodeURIComponent(msg)}`, '_blank')

  const handleFabClick = () => {
    setOpen(o => !o)
    setPulse(false)
  }

  return (
    <>
      <style>{`
        @keyframes wa-slide-up {
          from { opacity:0; transform:translateY(14px) scale(0.96); }
          to   { opacity:1; transform:none; }
        }
        @keyframes wa-pulse-ring {
          0%   { transform:scale(1);    opacity:0.6; }
          70%  { transform:scale(1.5);  opacity:0;   }
          100% { transform:scale(1.5);  opacity:0;   }
        }
        .wa-fab:hover  { transform:scale(1.07) !important; }
        .wa-opt:hover  { background:#f0fdf4 !important; border-color:rgba(37,211,102,0.45) !important; }
        .wa-cta:hover  { background:#1ebe57 !important; }
        .wa-back:hover { color:#128C7E !important; }
      `}</style>

      <div style={{
        position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
        display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12,
        opacity: visible ? 1 : 0, transition: 'opacity 0.4s',
      }}>

        {/* ── Chat panel ──────────────────────────────────────────────────────── */}
        {open && (
          <div style={{
            width: 320, background: '#fff', borderRadius: 16,
            boxShadow: '0 12px 48px rgba(0,0,0,0.16), 0 2px 8px rgba(0,0,0,0.06)',
            overflow: 'hidden', animation: 'wa-slide-up 0.2s ease',
          }}>

            {/* Header */}
            <div style={{ background: 'linear-gradient(135deg,#25D366,#128C7E)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 11 }}>
              <Avatar size={44} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#fff', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                  {agentName}
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#A8F0C6', display: 'inline-block' }} />
                  Typically replies instantly
                </div>
              </div>
              <button onClick={() => { setOpen(false); setStep('menu') }}
                style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 7, cursor: 'pointer', color: '#fff', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.28)'}
                onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.15)'}>
                <X size={14} />
              </button>
            </div>

            {/* Chat body */}
            <div style={{ background: '#E5DDD5', padding: '14px 13px 16px' }}>

              {/* MENU */}
              {step === 'menu' && (
                <>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 13, alignItems: 'flex-end' }}>
                    <Avatar size={28} />
                    <div style={{ background: '#fff', borderRadius: '0 12px 12px 12px', padding: '10px 12px', maxWidth: '86%', boxShadow: '0 1px 2px rgba(0,0,0,0.08)' }}>
                      <p style={{ margin: '0 0 5px', fontSize: 13, color: '#111', lineHeight: 1.55 }}>
                        Hello! Welcome to <strong>Sendtrack Courier</strong>.
                      </p>
                      <p style={{ margin: 0, fontSize: 13, color: '#333', lineHeight: 1.55 }}>
                        How can we help you today?
                      </p>
                      <span style={{ fontSize: 11, color: '#aaa', display: 'block', textAlign: 'right', marginTop: 5 }}>{nowTime()}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                    {FLOWS.map(f => (
                      <button key={f.key} className="wa-opt" onClick={() => setStep(f.key)}
                        style={{ background: '#fff', border: '1px solid rgba(37,211,102,0.22)', borderRadius: 9, padding: '9px 13px', textAlign: 'left', cursor: 'pointer', fontSize: 13, color: '#075E54', fontWeight: 600, transition: 'background 0.15s, border-color 0.15s' }}>
                        {f.label}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* FLOW */}
              {flow && (
                <>
                  {/* User bubble */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 9 }}>
                    <div style={{ background: '#DCF8C6', borderRadius: '12px 0 12px 12px', padding: '9px 12px', maxWidth: '80%', boxShadow: '0 1px 2px rgba(0,0,0,0.08)' }}>
                      <p style={{ margin: 0, fontSize: 13, color: '#111' }}>{flow.label}</p>
                      <span style={{ fontSize: 11, color: '#aaa', display: 'block', textAlign: 'right', marginTop: 3 }}>{nowTime()}</span>
                    </div>
                  </div>

                  {/* Agent bubble */}
                  <div style={{ display: 'flex', gap: 8, marginBottom: 13, alignItems: 'flex-end' }}>
                    <Avatar size={28} />
                    <div style={{ background: '#fff', borderRadius: '0 12px 12px 12px', padding: '10px 12px', maxWidth: '86%', boxShadow: '0 1px 2px rgba(0,0,0,0.08)' }}>
                      <p style={{ margin: '0 0 4px', fontSize: 13, color: '#111', lineHeight: 1.55 }}>{flow.reply}</p>
                      <span style={{ fontSize: 11, color: '#aaa', display: 'block', textAlign: 'right', marginTop: 5 }}>{nowTime()}</span>
                    </div>
                  </div>

                  <button className="wa-cta" onClick={() => openWA(flow.waMsg)}
                    style={{ width: '100%', background: '#25D366', color: '#fff', border: 'none', borderRadius: 9, padding: '11px', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'background 0.15s', marginBottom: 8 }}>
                    {WA_SVG}
                    Continue on WhatsApp
                  </button>
                  <button className="wa-back" onClick={() => setStep('menu')}
                    style={{ width: '100%', background: 'none', border: 'none', color: '#777', fontSize: 12, cursor: 'pointer', padding: '4px', transition: 'color 0.15s' }}>
                    Back to menu
                  </button>
                </>
              )}
            </div>

            {/* Footer */}
            <div style={{ background: '#f7f7f7', borderTop: '1px solid #eee', padding: '7px 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <MessageCircle size={11} color="#25D366" />
              <span style={{ fontSize: 11, color: '#bbb' }}>Powered by WhatsApp</span>
            </div>
          </div>
        )}

        {/* ── FAB ─────────────────────────────────────────────────────────────── */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {pulse && !open && (
            <div style={{
              position: 'absolute', width: 58, height: 58, borderRadius: '50%',
              border: '3px solid #25D366', animation: 'wa-pulse-ring 1.8s ease-out infinite',
              pointerEvents: 'none',
            }} />
          )}

          {/* Tooltip */}
          {!open && pulse && (
            <div style={{
              position: 'absolute', right: 68, whiteSpace: 'nowrap',
              background: '#111', color: '#fff', fontSize: 12, fontWeight: 600,
              padding: '6px 11px', borderRadius: 7, pointerEvents: 'none',
            }}>
              Chat with us
              <span style={{ position: 'absolute', right: -5, top: '50%', transform: 'translateY(-50%)', width: 0, height: 0, borderTop: '5px solid transparent', borderBottom: '5px solid transparent', borderLeft: '5px solid #111' }} />
            </div>
          )}

          <button className="wa-fab" onClick={handleFabClick}
            aria-label="Chat on WhatsApp"
            style={{
              width: 58, height: 58, borderRadius: '50%',
              background: open ? '#075E54' : '#25D366',
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', boxShadow: '0 4px 20px rgba(37,211,102,0.4)',
              transition: 'background 0.2s, transform 0.2s',
            }}>
            {open ? <X size={22} /> : WA_SVG}
          </button>
        </div>
      </div>
    </>
  )
}
