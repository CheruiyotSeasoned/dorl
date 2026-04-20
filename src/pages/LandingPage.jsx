import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import {
  Truck, MapPin, Phone, Mail, Clock, ArrowRight,
  Package, RefreshCcw, Store, Shield, Star, Users,
  ChevronRight, Menu, X, CheckCircle, Globe, Zap
} from 'lucide-react'
import heroImg from '../assets/hero.jpg'

const API = (import.meta.env.VITE_API_URL ?? 'http://localhost:8000') + '/api'

const ICON_MAP = { Truck, Package, RefreshCcw, Store, Shield, Star, Users, CheckCircle, Globe, Zap, MapPin }
const SERVICE_ICONS = [Truck, RefreshCcw, Store, Package, Shield, Users]
const WHYUS_ICONS   = [Shield, Star, Globe, CheckCircle, Package, Users]

// ── Nav ──────────────────────────────────────────────────────────────────────
function Navbar() {
  const [open, setOpen] = useState(false)
  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 100, background: '#fff', borderBottom: '1px solid #E5E5E5' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', height: 68 }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <img src="/logo.png" alt="DORL" style={{ height: 36, width: 'auto', objectFit: 'contain' }} />
        </Link>
        <nav style={{ display: 'flex', gap: 32, marginLeft: 48, alignItems: 'center' }} className="desktop-nav">
          {['Home','About','Services','News','Contact'].map(l => (
            <a key={l} href={`#${l.toLowerCase()}`} style={{ fontSize: 14, fontWeight: 500, color: '#6B6B6B', textDecoration: 'none' }}
              onMouseEnter={e => e.target.style.color='#FF5E14'}
              onMouseLeave={e => e.target.style.color='#6B6B6B'}>{l}</a>
          ))}
        </nav>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
          <Link to="/login" style={{ fontSize: 14, fontWeight: 600, color: '#0D0D0D', textDecoration: 'none' }}>Sign in</Link>
          <Link to="/register" style={{ background: '#FF5E14', color: '#fff', padding: '8px 16px', borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
            <MapPin size={14} /> <span className="lp-find-text">Find A Location</span>
          </Link>
          <button onClick={() => setOpen(!open)} style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer' }} className="mobile-menu-btn">
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>
      {open && (
        <div style={{ background: '#fff', borderTop: '1px solid #E5E5E5', padding: '16px 24px' }}>
          {['Home','About','Services','News','Contact'].map(l => (
            <a key={l} href={`#${l.toLowerCase()}`} onClick={() => setOpen(false)}
              style={{ display: 'block', padding: '10px 0', fontSize: 15, fontWeight: 500, color: '#0D0D0D', textDecoration: 'none', borderBottom: '1px solid #F7F7F7' }}>{l}</a>
          ))}
        </div>
      )}
    </header>
  )
}

// ── Delivery Bike SVG illustration ───────────────────────────────────────────
function DeliveryBikeIllustration() {
  return (
    <svg viewBox="0 0 520 380" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', maxWidth: 520, height: 'auto' }} aria-hidden="true">
      {/* Road */}
      <rect x="0" y="310" width="520" height="70" fill="#1a1a1a" />
      <rect x="0" y="308" width="520" height="5" fill="#FF5E14" opacity="0.4" />
      {/* Road dashes */}
      {[0,80,160,240,320,400].map(x => (
        <rect key={x} x={x+10} y="336" width="52" height="8" rx="4" fill="rgba(255,255,255,0.12)" />
      ))}

      {/* Rear wheel */}
      <circle cx="148" cy="310" r="52" fill="#1E1E1E" stroke="#333" strokeWidth="6" />
      <circle cx="148" cy="310" r="36" fill="none" stroke="#444" strokeWidth="4" />
      <circle cx="148" cy="310" r="10" fill="#FF5E14" />
      {[0,45,90,135].map(a => {
        const rad = a * Math.PI / 180
        return <line key={a} x1={148 + Math.cos(rad)*10} y1={310 + Math.sin(rad)*10} x2={148 + Math.cos(rad)*36} y2={310 + Math.sin(rad)*36} stroke="#555" strokeWidth="3" strokeLinecap="round" />
      })}

      {/* Front wheel */}
      <circle cx="376" cy="310" r="52" fill="#1E1E1E" stroke="#333" strokeWidth="6" />
      <circle cx="376" cy="310" r="36" fill="none" stroke="#444" strokeWidth="4" />
      <circle cx="376" cy="310" r="10" fill="#FF5E14" />
      {[0,45,90,135].map(a => {
        const rad = a * Math.PI / 180
        return <line key={a} x1={376 + Math.cos(rad)*10} y1={310 + Math.sin(rad)*10} x2={376 + Math.cos(rad)*36} y2={310 + Math.sin(rad)*36} stroke="#555" strokeWidth="3" strokeLinecap="round" />
      })}

      {/* Swing arm */}
      <path d="M148 310 L230 268" stroke="#444" strokeWidth="10" strokeLinecap="round" />

      {/* Frame */}
      <path d="M230 268 L290 210 L360 210 L376 258" stroke="#FF5E14" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M230 268 L300 268 L360 210" stroke="#CC4A0F" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none" />

      {/* Engine block */}
      <rect x="240" y="255" width="80" height="36" rx="8" fill="#2a2a2a" stroke="#444" strokeWidth="2" />
      <rect x="252" y="263" width="56" height="20" rx="4" fill="#222" />

      {/* Exhaust */}
      <path d="M240 282 Q210 295 195 290 Q180 285 185 310" stroke="#555" strokeWidth="5" strokeLinecap="round" fill="none" />
      <ellipse cx="183" cy="313" rx="8" ry="4" fill="#666" opacity="0.5" />

      {/* Fork */}
      <path d="M360 210 L376 258" stroke="#555" strokeWidth="8" strokeLinecap="round" />
      <path d="M352 210 L368 258" stroke="#444" strokeWidth="6" strokeLinecap="round" />

      {/* Seat */}
      <path d="M255 210 Q275 200 320 200 Q340 200 350 210" stroke="#333" strokeWidth="12" strokeLinecap="round" fill="none" />
      <path d="M255 210 Q275 196 320 196 Q342 196 352 210" stroke="#FF5E14" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.6" />

      {/* Handlebars */}
      <line x1="356" y1="210" x2="380" y2="198" stroke="#555" strokeWidth="6" strokeLinecap="round" />
      <line x1="380" y1="198" x2="390" y2="204" stroke="#FF5E14" strokeWidth="7" strokeLinecap="round" />
      <line x1="380" y1="198" x2="370" y2="192" stroke="#555" strokeWidth="7" strokeLinecap="round" />

      {/* Headlight */}
      <ellipse cx="388" cy="220" rx="14" ry="10" fill="#FF5E14" opacity="0.9" />
      <ellipse cx="388" cy="220" rx="9" ry="6" fill="#FFD580" />
      {/* Light beam */}
      <path d="M398 216 L440 200 M398 220 L445 218 M398 224 L440 236" stroke="#FF5E14" strokeWidth="1.5" strokeLinecap="round" opacity="0.35" />

      {/* Delivery box on rear */}
      <rect x="148" y="178" width="96" height="76" rx="8" fill="#FF5E14" />
      <rect x="154" y="184" width="84" height="64" rx="6" fill="#E04E0A" />
      {/* Box strap */}
      <line x1="196" y1="178" x2="196" y2="254" stroke="#CC4A0F" strokeWidth="3" />
      <line x1="148" y1="216" x2="244" y2="216" stroke="#CC4A0F" strokeWidth="3" />
      {/* Box label */}
      <rect x="166" y="196" width="60" height="36" rx="4" fill="rgba(255,255,255,0.15)" />
      <rect x="172" y="202" width="48" height="4" rx="2" fill="rgba(255,255,255,0.5)" />
      <rect x="172" y="210" width="36" height="4" rx="2" fill="rgba(255,255,255,0.35)" />
      <rect x="172" y="218" width="28" height="4" rx="2" fill="rgba(255,255,255,0.25)" />

      {/* Rider silhouette */}
      {/* Head */}
      <circle cx="295" cy="168" r="22" fill="#222" />
      <circle cx="295" cy="168" r="22" fill="url(#helmetGrad)" />
      {/* Helmet visor */}
      <path d="M278 172 Q295 182 312 172" fill="#FF5E14" opacity="0.85" />
      <path d="M280 164 Q295 158 310 164 Q310 178 295 182 Q280 178 280 164Z" fill="#1a1a1a" opacity="0.6" />
      {/* Body */}
      <path d="M280 190 Q265 220 260 245 L295 248 L330 245 Q325 220 310 190Z" fill="#222" />
      <path d="M280 190 Q265 220 260 245 L295 248 L330 245 Q325 220 310 190Z" fill="url(#jacketGrad)" />
      {/* Arms */}
      <path d="M280 200 Q260 215 255 230" stroke="#222" strokeWidth="14" strokeLinecap="round" fill="none" />
      <path d="M310 200 Q355 215 360 210" stroke="#222" strokeWidth="14" strokeLinecap="round" fill="none" />
      <path d="M310 200 Q355 215 360 210" stroke="#333" strokeWidth="10" strokeLinecap="round" fill="none" />
      {/* Glove */}
      <circle cx="358" cy="210" r="7" fill="#FF5E14" />
      {/* Legs */}
      <path d="M268 245 Q255 268 240 272" stroke="#1a1a1a" strokeWidth="16" strokeLinecap="round" fill="none" />
      <path d="M325 245 Q320 268 305 272" stroke="#1a1a1a" strokeWidth="16" strokeLinecap="round" fill="none" />
      <path d="M268 245 Q255 268 240 272" stroke="#333" strokeWidth="12" strokeLinecap="round" fill="none" />

      {/* Speed lines */}
      {[190,215,240,265].map((y,i) => (
        <line key={y} x1={20 + i*8} y1={y} x2={80 - i*5} y2={y} stroke="#FF5E14" strokeWidth="2" strokeLinecap="round" opacity={0.15 + i*0.06} />
      ))}

      {/* GPS ping */}
      <circle cx="430" cy="120" r="18" fill="rgba(255,94,20,0.15)" />
      <circle cx="430" cy="120" r="10" fill="rgba(255,94,20,0.3)" />
      <circle cx="430" cy="120" r="5" fill="#FF5E14" />
      <path d="M430 90 Q430 78 430 70" stroke="#FF5E14" strokeWidth="1.5" strokeDasharray="4 3" strokeLinecap="round" opacity="0.5" />

      {/* Floating badge: Live Tracking */}
      <rect x="420" y="50" width="92" height="32" rx="10" fill="#1a1a1a" stroke="rgba(255,94,20,0.4)" strokeWidth="1.5" />
      <circle cx="435" cy="66" r="5" fill="#22C55E" />
      <rect x="446" y="60" width="52" height="4" rx="2" fill="rgba(255,255,255,0.6)" />
      <rect x="446" y="68" width="36" height="3" rx="2" fill="rgba(255,255,255,0.3)" />

      {/* Floating badge: On Time */}
      <rect x="18" y="140" width="80" height="32" rx="10" fill="#1a1a1a" stroke="rgba(255,94,20,0.4)" strokeWidth="1.5" />
      <rect x="30" y="151" width="56" height="4" rx="2" fill="rgba(255,255,255,0.6)" />
      <rect x="30" y="159" width="38" height="3" rx="2" fill="rgba(255,255,255,0.3)" />

      <defs>
        <linearGradient id="helmetGrad" x1="280" y1="150" x2="310" y2="190" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#3a3a3a" />
          <stop offset="100%" stopColor="#1a1a1a" />
        </linearGradient>
        <linearGradient id="jacketGrad" x1="280" y1="190" x2="310" y2="248" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2a2a2a" />
          <stop offset="100%" stopColor="#111" />
        </linearGradient>
      </defs>
    </svg>
  )
}

// ── Hero ─────────────────────────────────────────────────────────────────────
function Hero({ c = {} }) {
  const stats = [
    [c.stat1_value ?? '500+', c.stat1_label ?? 'Deliveries Daily'],
    [c.stat2_value ?? '98%',  c.stat2_label ?? 'Success Rate'],
    [c.stat3_value ?? '24/7', c.stat3_label ?? 'Live Support'],
  ]
  return (
    <section id="home" style={{
      minHeight: '92vh',
      display: 'flex',
      alignItems: 'center',
      position: 'relative',
      overflow: 'hidden',
      backgroundImage: `url(${heroImg})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center 40%',
      backgroundRepeat: 'no-repeat',
    }}>
      {/* Dark gradient overlay so text is legible over the photo */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(100deg, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.55) 55%, rgba(0,0,0,0.35) 100%)' }} />
      {/* Subtle orange accent glow */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 20% 60%, rgba(255,94,20,0.18) 0%, transparent 50%)', pointerEvents: 'none' }} />

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '72px 24px', position: 'relative', zIndex: 1, width: '100%' }}>
        <div style={{ maxWidth: 620 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,94,20,0.18)', border: '1px solid rgba(255,94,20,0.4)', borderRadius: 999, padding: '6px 14px', marginBottom: 24 }}>
            <Zap size={13} color="#FF5E14" />
            <span style={{ fontSize: 12, fontWeight: 600, color: '#FF5E14', letterSpacing: '0.5px', textTransform: 'uppercase' }}>{c.badge ?? 'Last-Mile Logistics'}</span>
          </div>
          <h1 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: 'clamp(2rem,6vw,4.2rem)', lineHeight: 1.06, color: '#fff', marginBottom: 8 }}>
            {c.title1 ?? 'Transport anything'}
          </h1>
          <h1 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: 'clamp(2rem,6vw,4.2rem)', lineHeight: 1.06, color: '#FF5E14', marginBottom: 20 }}>
            {c.title2 ?? 'from anywhere.'}
          </h1>
          <p style={{ fontSize: 'clamp(14px,2vw,17px)', color: 'rgba(255,255,255,0.72)', lineHeight: 1.75, maxWidth: 520, marginBottom: 32 }}>
            {c.subtitle ?? 'Transport Business is Movement. DORL connects vendors and riders in real-time — fast dispatch, live tracking, and proof of delivery you can trust.'}
          </p>
          <div className="lp-hero-btns" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link to="/register" className="btn" style={{ background: '#FF5E14', color: '#fff', padding: '13px 28px', borderRadius: 10, fontWeight: 700, fontSize: 15 }}>
              {c.cta_primary ?? 'Get Started'} <ArrowRight size={16} />
            </Link>
            <a href="#services" className="btn" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', padding: '13px 28px', borderRadius: 10, fontWeight: 600, fontSize: 15, border: '1px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)' }}>
              {c.cta_secondary ?? 'Our Solutions'}
            </a>
          </div>
          <div className="lp-stats-row" style={{ display: 'flex', gap: 32, marginTop: 48, flexWrap: 'wrap' }}>
            {stats.map(([v, l]) => (
              <div key={l} style={{ borderLeft: '2px solid rgba(255,94,20,0.5)', paddingLeft: 14 }}>
                <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: 'clamp(18px,3vw,26px)', color: '#fff' }}>{v}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ── About ─────────────────────────────────────────────────────────────────────
function About({ c = {} }) {
  const stats = c.stats ?? [
    { value: '100%', label: 'Compensation on loss or damage' },
    { value: 'KES 10M', label: 'Carrier liability per consignment' },
    { value: 'Real-time', label: 'Live GPS tracking' },
    { value: 'KES 15M', label: 'Burglary coverage value' },
  ]
  return (
    <section id="about" className="lp-pad" style={{ background: '#fff' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }} className="lp-about-grid">
        <div style={{ position: 'relative' }}>
          <div style={{ background: '#F7F7F7', borderRadius: 20, height: 380, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 80, height: 80, background: '#FF5E14', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Truck size={36} color="#fff" />
              </div>
              <p style={{ color: '#6B6B6B', fontSize: 14 }}>DORL Delivery Fleet</p>
            </div>
          </div>
          <div className="lp-about-badge">
            <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: 28, color: '#fff' }}>{c.years ?? '7+'}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>Years of Experience</div>
          </div>
        </div>
        <div>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#FF5E14', textTransform: 'uppercase', letterSpacing: '1px' }}>About DORL</span>
          <h2 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: 36, marginTop: 8, marginBottom: 20, lineHeight: 1.2 }}>
            {c.title ?? 'The preferred last-mile logistics partner'}
          </h2>
          <p style={{ color: '#6B6B6B', lineHeight: 1.8, marginBottom: 16, fontSize: 15 }}>{c.body1 ?? 'DORL Delivery is a last-mile logistics company built for the modern supply chain.'}</p>
          <p style={{ color: '#6B6B6B', lineHeight: 1.8, marginBottom: 28, fontSize: 15 }}>{c.body2 ?? 'From fragile parcels to bulk cargo — we handle it all with transparency and speed.'}</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 32 }}>
            {stats.map(({ value, label }) => (
              <div key={label} style={{ padding: '14px 16px', background: '#F7F7F7', borderRadius: 10 }}>
                <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: 18, color: '#FF5E14' }}>{value}</div>
                <div style={{ fontSize: 12, color: '#6B6B6B', marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <a href="#contact" style={{ background: '#FF5E14', color: '#fff', padding: '11px 24px', borderRadius: 8, fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>Contact Us</a>
            <a href="#services" style={{ border: '1px solid #E5E5E5', color: '#0D0D0D', padding: '11px 24px', borderRadius: 8, fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>Our Services</a>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Services ──────────────────────────────────────────────────────────────────
function Services({ c = [] }) {
  const items = c.length ? c : [
    { title: 'First, Middle & Last Mile',     desc: 'Comprehensive logistics solutions covering the entire supply chain.' },
    { title: 'Reverse Logistics',             desc: 'We handle returns efficiently.' },
    { title: 'PickUp Stations',               desc: 'Hold customer packages for 7 working days.' },
    { title: 'Dedicated Rider / Van Service', desc: 'Exclusive assignment for your business.' },
    { title: 'Warehousing',                   desc: 'Secure storage with same-day dispatch.' },
    { title: 'Staffing / HR Services',        desc: 'Experienced logistics workforce on demand.' },
  ]
  return (
    <section id="services" className="lp-pad" style={{ background: '#F7F7F7' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#FF5E14', textTransform: 'uppercase', letterSpacing: '1px' }}>Our Solutions</span>
          <h2 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: 'clamp(24px,4vw,36px)', marginTop: 8, lineHeight: 1.2 }}>Everything your business needs to move</h2>
          <p style={{ color: '#6B6B6B', marginTop: 12, maxWidth: 520, margin: '12px auto 0', fontSize: 15, lineHeight: 1.7 }}>From single parcels to full logistics operations — DORL scales with you.</p>
        </div>
        <div className="lp-services-grid">
          {items.map(({ title, desc }, idx) => {
            const Icon = SERVICE_ICONS[idx % SERVICE_ICONS.length]
            return (
              <div key={title} style={{ background: '#fff', borderRadius: 16, padding: '28px 24px', border: '1px solid #E5E5E5', transition: 'box-shadow 0.2s, transform 0.2s', cursor: 'default' }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none' }}>
                <div style={{ width: 48, height: 48, background: '#FFF0E8', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <Icon size={22} color="#FF5E14" />
                </div>
                <h3 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 600, fontSize: 17, marginBottom: 10 }}>{title}</h3>
                <p style={{ color: '#6B6B6B', fontSize: 14, lineHeight: 1.7 }}>{desc}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ── Why Choose Us ─────────────────────────────────────────────────────────────
function WhyUs({ c = {} }) {
  const items = c.items ?? [
    { title: '100% Compensation',  desc: 'Full compensation in case of loss or damage — zero excuses.' },
    { title: 'Proven Experience',  desc: '7+ years of last-mile logistics excellence.' },
    { title: 'Wide Presence',      desc: 'Coverage across Nairobi and expanding.' },
    { title: 'Fidelity Guarantee', desc: 'Fidelity coverage up to KES 2,500,000.' },
    { title: "Carrier's Liability",'desc': 'Up to KES 10M per consignment.' },
    { title: 'Employer Liability', desc: 'WIBA up to KES 2M per person.' },
  ]
  return (
    <section className="lp-pad" style={{ background: '#0D0D0D', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 30% 60%, rgba(255,94,20,0.08) 0%, transparent 55%)', pointerEvents: 'none' }} />
      <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#FF5E14', textTransform: 'uppercase', letterSpacing: '1px' }}>Why Choose Us</span>
          <h2 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: 'clamp(24px,4vw,36px)', color: '#fff', marginTop: 8, lineHeight: 1.2 }}>Moving with care and accountability</h2>
        </div>
        <div className="lp-whyus-grid">
          {items.map(({ title, desc }, idx) => {
            const Icon = WHYUS_ICONS[idx % WHYUS_ICONS.length]
            return (
              <div key={title} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '24px' }}>
                <div style={{ width: 44, height: 44, background: 'rgba(255,94,20,0.15)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                  <Icon size={20} color="#FF5E14" />
                </div>
                <h4 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 600, fontSize: 16, color: '#fff', marginBottom: 8 }}>{title}</h4>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, lineHeight: 1.7 }}>{desc}</p>
              </div>
            )
          })}
        </div>
        <div className="lp-whyus-quote" style={{ marginTop: 56, background: 'rgba(255,94,20,0.08)', border: '1px solid rgba(255,94,20,0.2)', borderRadius: 20, padding: '36px 40px', textAlign: 'center' }}>
          <div style={{ fontSize: 40, color: '#FF5E14', fontFamily: 'Georgia, serif', lineHeight: 1, marginBottom: 16 }}>"</div>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 17, lineHeight: 1.8, maxWidth: 720, margin: '0 auto', fontStyle: 'italic' }}>
            {c.quote ?? 'At DORL, we prioritize treating our clients with care and respect.'}
          </p>
        </div>
      </div>
    </section>
  )
}

// ── How It Works ──────────────────────────────────────────────────────────────
function HowItWorks({ c = [] }) {
  const steps = c.length ? c : [
    { n: '01', title: 'Create Package', desc: 'Register your delivery with package details, pickup, and dropoff location.' },
    { n: '02', title: 'View Riders',    desc: 'See available riders near your pickup point in real-time.' },
    { n: '03', title: 'Dispatch',       desc: 'Our system automatically assigns the best rider — or you choose manually.' },
    { n: '04', title: 'Track Live',     desc: 'Follow your delivery in real-time with GPS updates every 5 seconds.' },
  ]
  return (
    <section className="lp-pad" style={{ background: '#fff' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#FF5E14', textTransform: 'uppercase', letterSpacing: '1px' }}>How It Works</span>
          <h2 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: 36, marginTop: 8 }}>Four steps to delivered</h2>
        </div>
        <div className="lp-steps-grid" style={{ gridTemplateColumns: `repeat(${steps.length}, 1fr)` }}>
          {steps.map(({ n, title, desc }, i) => (
            <div key={n} style={{ position: 'relative', textAlign: 'center' }}>
              {i < steps.length - 1 && <div className="lp-step-line" style={{ position: 'absolute', top: 28, left: '60%', width: '80%', height: 1, background: '#E5E5E5', zIndex: 0 }} />}
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ width: 56, height: 56, background: '#FF5E14', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#fff', fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: 16 }}>{n}</div>
                <h4 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 600, fontSize: 16, marginBottom: 8 }}>{title}</h4>
                <p style={{ color: '#6B6B6B', fontSize: 13, lineHeight: 1.7 }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── News ──────────────────────────────────────────────────────────────────────
function News({ c = [] }) {
  const posts = c.length ? c : [
    { cat: 'Logistics',   title: 'DORL expands rider network across Nairobi CBD',  date: 'Apr 2025', excerpt: 'We are growing our fleet to serve more vendors in the Nairobi central business district.' },
    { cat: 'Technology',  title: 'Introducing real-time GPS proof of delivery',     date: 'Mar 2025', excerpt: 'Our new GPS verification ensures every delivery is confirmed within 200 meters.' },
    { cat: 'Partnership', title: 'DORL partners with 28 logistics operators',       date: 'Feb 2025', excerpt: 'A growing network of partners ensures we cover more ground and deliver faster.' },
  ]
  return (
    <section id="news" className="lp-pad" style={{ background: '#F7F7F7' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div className="lp-news-header" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 40 }}>
          <div>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#FF5E14', textTransform: 'uppercase', letterSpacing: '1px' }}>News Feeds</span>
            <h2 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: 32, marginTop: 6 }}>Latest Updates</h2>
          </div>
          <a href="#" style={{ fontSize: 14, fontWeight: 600, color: '#FF5E14', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
            All posts <ChevronRight size={16} />
          </a>
        </div>
        <div className="lp-news-grid">
          {posts.map(({ cat, title, date, excerpt }) => (
            <div key={title} style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', border: '1px solid #E5E5E5' }}>
              <div style={{ height: 160, background: 'linear-gradient(135deg, #0D0D0D 0%, #2a2a2a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Truck size={40} color="rgba(255,94,20,0.6)" />
              </div>
              <div style={{ padding: '20px 20px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#FF5E14', textTransform: 'uppercase' }}>{cat}</span>
                  <span style={{ color: '#E5E5E5' }}>·</span>
                  <span style={{ fontSize: 12, color: '#6B6B6B' }}>{date}</span>
                </div>
                <h4 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 600, fontSize: 16, marginBottom: 8, lineHeight: 1.4 }}>{title}</h4>
                <p style={{ color: '#6B6B6B', fontSize: 13, lineHeight: 1.7 }}>{excerpt}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// sanitize: strip tags and limit length (client-side defence-in-depth)
function sanitize(value, maxLen = 2000) {
  return value
    .replace(/<[^>]*>/g, '')      // strip HTML tags
    .replace(/[<>"'`]/g, '')      // strip remaining dangerous chars
    .slice(0, maxLen)
}

// ── Contact ───────────────────────────────────────────────────────────────────
function Contact({ c = {} }) {
  const [form, setForm]       = useState({ name: '', email: '', phone: '', subject: '', message: '' })
  const [errors, setErrors]   = useState({})
  const [loading, setLoading] = useState(false)
  const [sent, setSent]       = useState(false)

  const info = [
    { icon: MapPin, label: 'Address',      value: c.address ?? 'Ronald Ngala Road, Nairobi' },
    { icon: Phone,  label: 'Phone',        value: c.phone   ?? '+254 746 556 931' },
    { icon: Mail,   label: 'Email',        value: c.email   ?? 'info@dorl.co.ke' },
    { icon: Clock,  label: 'Office Hours', value: c.hours   ?? 'Mon – Sat: 8am to 6pm' },
  ]

  const set = (k, raw, maxLen) => {
    setForm(f => ({ ...f, [k]: sanitize(raw, maxLen) }))
    setErrors(e => ({ ...e, [k]: undefined }))
  }

  const validate = () => {
    const e = {}
    if (!form.name.trim() || form.name.trim().length < 2)
      e.name = 'Name must be at least 2 characters.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim()))
      e.email = 'Enter a valid email address.'
    if (!form.message.trim() || form.message.trim().length < 10)
      e.message = 'Message must be at least 10 characters.'
    if (form.message.length > 2000)
      e.message = 'Message is too long (max 2000 characters).'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    try {
      await axios.post(`${API}/contact`, {
        name:    form.name.trim(),
        email:   form.email.trim().toLowerCase(),
        phone:   form.phone.trim() || undefined,
        subject: form.subject.trim() || undefined,
        message: form.message.trim(),
      })
      setSent(true)
      setForm({ name: '', email: '', phone: '', subject: '', message: '' })
    } catch (err) {
      const serverErrors = err.response?.data?.errors
      if (serverErrors) {
        const mapped = {}
        Object.entries(serverErrors).forEach(([k, msgs]) => { mapped[k] = msgs[0] })
        setErrors(mapped)
      } else if (err.response?.status === 429) {
        setErrors({ _form: err.response.data?.error ?? 'Too many requests. Please wait a moment.' })
      } else {
        setErrors({ _form: 'Something went wrong. Please try again.' })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <section id="contact" className="lp-pad" style={{ background: '#fff' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#FF5E14', textTransform: 'uppercase', letterSpacing: '1px' }}>Get In Touch</span>
          <h2 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: 'clamp(24px,4vw,36px)', marginTop: 8 }}>We're here to help</h2>
        </div>
        <div className="lp-contact-grid">
          <div>
            {info.map(({ icon: Icon, label, value }) => (
              <div key={label} style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
                <div style={{ width: 44, height: 44, background: '#FFF0E8', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={18} color="#FF5E14" />
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#6B6B6B', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: 14, color: '#0D0D0D', lineHeight: 1.5 }}>{value}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ background: '#F7F7F7', borderRadius: 20, padding: 32 }}>
            <h3 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 600, marginBottom: 24 }}>Send us a message</h3>

            {sent ? (
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <div style={{ width: 56, height: 56, background: '#DCFCE7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <CheckCircle size={28} color="#16A34A" />
                </div>
                <h4 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 600, marginBottom: 8 }}>Message Sent!</h4>
                <p style={{ color: '#6B6B6B', fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>Thanks for reaching out. We'll get back to you within 24 hours.</p>
                <button className="btn" style={{ background: '#FF5E14', color: '#fff' }} onClick={() => setSent(false)}>Send another</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate>
                {errors._form && (
                  <div style={{ background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#DC2626' }}>
                    {errors._form}
                  </div>
                )}
                <div className="lp-form-row">
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 500, color: '#6B6B6B', display: 'block', marginBottom: 6 }}>Name <span style={{ color: '#EF4444' }}>*</span></label>
                    <input
                      className="form-control"
                      value={form.name}
                      onChange={e => set('name', e.target.value, 80)}
                      placeholder="Jane Doe"
                      maxLength={80}
                      autoComplete="name"
                      style={errors.name ? { borderColor: '#EF4444' } : {}}
                    />
                    {errors.name && <span style={{ fontSize: 11, color: '#EF4444', marginTop: 3, display: 'block' }}>{errors.name}</span>}
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 500, color: '#6B6B6B', display: 'block', marginBottom: 6 }}>Email <span style={{ color: '#EF4444' }}>*</span></label>
                    <input
                      type="email"
                      className="form-control"
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value.slice(0, 120) }))}
                      placeholder="jane@company.com"
                      maxLength={120}
                      autoComplete="email"
                      style={errors.email ? { borderColor: '#EF4444' } : {}}
                    />
                    {errors.email && <span style={{ fontSize: 11, color: '#EF4444', marginTop: 3, display: 'block' }}>{errors.email}</span>}
                  </div>
                </div>
                <div className="lp-form-row">
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 500, color: '#6B6B6B', display: 'block', marginBottom: 6 }}>Phone</label>
                    <input
                      className="form-control"
                      value={form.phone}
                      onChange={e => set('phone', e.target.value, 30)}
                      placeholder="+254 712 345 678"
                      maxLength={30}
                      autoComplete="tel"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 500, color: '#6B6B6B', display: 'block', marginBottom: 6 }}>Subject</label>
                    <input
                      className="form-control"
                      value={form.subject}
                      onChange={e => set('subject', e.target.value, 120)}
                      placeholder="How can we help?"
                      maxLength={120}
                    />
                  </div>
                </div>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#6B6B6B', display: 'block', marginBottom: 6 }}>
                    Message <span style={{ color: '#EF4444' }}>*</span>
                    <span style={{ float: 'right', fontWeight: 400, fontSize: 11, color: form.message.length > 1800 ? '#EF4444' : '#9CA3AF' }}>
                      {form.message.length}/2000
                    </span>
                  </label>
                  <textarea
                    className="form-control"
                    rows={5}
                    value={form.message}
                    onChange={e => set('message', e.target.value, 2000)}
                    placeholder="Tell us about your delivery needs…"
                    maxLength={2000}
                    style={{ resize: 'vertical', ...(errors.message ? { borderColor: '#EF4444' } : {}) }}
                  />
                  {errors.message && <span style={{ fontSize: 11, color: '#EF4444', marginTop: 3, display: 'block' }}>{errors.message}</span>}
                </div>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center' }}
                  disabled={loading}
                >
                  {loading
                    ? <><span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} /> Sending…</>
                    : <>{c.cta ?? 'Send Message'} <ArrowRight size={15} /></>
                  }
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Footer ────────────────────────────────────────────────────────────────────
function Footer({ contact = {} }) {
  return (
    <footer style={{ background: '#0D0D0D', color: 'rgba(255,255,255,0.6)', padding: '64px 24px 0' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div className="lp-footer-grid">
          <div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ background: '#fff', borderRadius: 6, padding: '4px 10px', display: 'inline-block' }}>
                <img src="/logo.png" alt="DORL" style={{ height: 28, width: 'auto', objectFit: 'contain', display: 'block' }} />
              </div>
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.8, maxWidth: 280, marginBottom: 20 }}>
              A real-time last-mile logistics platform. Package-level intelligence, deterministic dispatching, and transparency-driven trust mechanics.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              {[Phone, Mail, MapPin].map((Icon, i) => (
                <div key={i} style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.06)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={15} color="rgba(255,255,255,0.5)" />
                </div>
              ))}
            </div>
          </div>
          {[
            { title: 'Reservations', links: ['Home','About','Service','Blog','Contact'] },
            { title: 'Our Solutions', links: ['Reverse Logistics','PickUp Stations','Last Mile','Dedicated Rider','Warehousing','Dark Store'] },
            { title: 'Get In Touch', links: [contact.phone ?? '+254 746 556 931', contact.hours ?? 'Mon–Sat 8am–6pm', contact.email ?? 'info@dorl.co.ke'] },
          ].map(({ title, links }) => (
            <div key={title}>
              <h4 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 600, fontSize: 14, color: '#fff', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</h4>
              <ul style={{ listStyle: 'none' }}>
                {links.map(l => (
                  <li key={l} style={{ marginBottom: 10 }}>
                    <a href="#" style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}
                      onMouseEnter={e => e.target.style.color='#FF5E14'}
                      onMouseLeave={e => e.target.style.color='rgba(255,255,255,0.5)'}>{l}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="lp-footer-bottom" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
          <span>Copyright © {new Date().getFullYear()} DORL Delivery. All Rights Reserved.</span>
          <div className="lp-footer-links">
            {['Terms & Conditions','Careers','Get A Quote'].map(l => (
              <a key={l} href="#" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none', fontSize: 12 }}>{l}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const { data } = useQuery({
    queryKey: ['landing-content'],
    queryFn: () => axios.get(`${API}/landing`).then(r => r.data.data),
    staleTime: 5 * 60 * 1000,
  })

  const d = data ?? {}

  return (
    <div className="lp">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Plus+Jakarta+Sans:wght@600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box}
        .lp { font-family:'DM Sans',sans-serif; }
        .form-control { border:1px solid #E5E5E5; border-radius:6px; padding:9px 12px; font-size:15px; color:#0D0D0D; background:#fff; outline:none; width:100%; font-family:'DM Sans',sans-serif; }
        .form-control:focus { border-color:#FF5E14; }
        .btn { display:inline-flex; align-items:center; gap:6px; padding:9px 18px; border-radius:8px; font-size:14px; font-weight:600; border:none; cursor:pointer; text-decoration:none; }
        .btn-primary { background:#FF5E14; color:#fff; }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── section padding ── */
        .lp-pad { padding: 96px 24px; }

        /* ── grids ── */
        .lp-about-grid    { display:grid; grid-template-columns:1fr 1fr; gap:64px; align-items:center; }
        .lp-services-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:24px; }
        .lp-whyus-grid    { display:grid; grid-template-columns:repeat(3,1fr); gap:20px; }
        .lp-steps-grid    { display:grid; gap:24px; }
        .lp-news-grid     { display:grid; grid-template-columns:repeat(3,1fr); gap:24px; }
        .lp-contact-grid  { display:grid; grid-template-columns:1fr 1.4fr; gap:48px; }
        .lp-footer-grid   { display:grid; grid-template-columns:2fr 1fr 1fr 1fr; gap:48px; padding-bottom:48px; border-bottom:1px solid rgba(255,255,255,0.08); }
        .lp-form-row      { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px; }

        /* ── nav ── */
        .desktop-nav { display:flex; }
        .mobile-menu-btn { display:none; background:none; border:none; cursor:pointer; padding:4px; }
        .lp-find-text { display:inline; }

        /* ── footer bottom ── */
        .lp-footer-bottom { display:flex; align-items:center; justify-content:space-between; padding:20px 0; font-size:13px; }
        .lp-footer-links  { display:flex; gap:24px; }

        /* ── about image badge ── */
        .lp-about-badge { position:absolute; bottom:-20px; right:-20px; background:#FF5E14; border-radius:16px; padding:16px 20px; text-align:center; }

        /* ── 1024px tablet ── */
        @media(max-width:1024px){
          .lp-services-grid { grid-template-columns:repeat(2,1fr); }
          .lp-whyus-grid    { grid-template-columns:repeat(2,1fr); }
          .lp-news-grid     { grid-template-columns:repeat(2,1fr); }
          .lp-footer-grid   { grid-template-columns:1fr 1fr; gap:32px; }
          .lp-about-grid    { gap:40px; }
        }

        /* ── 768px mobile ── */
        @media(max-width:768px){
          .lp-pad           { padding:56px 20px; }
          .desktop-nav      { display:none !important; }
          .mobile-menu-btn  { display:block !important; }
          .lp-find-text     { display:none; }
          .lp-about-grid    { grid-template-columns:1fr; gap:32px; }
          .lp-services-grid { grid-template-columns:1fr; }
          .lp-whyus-grid    { grid-template-columns:1fr; }
          .lp-steps-grid    { grid-template-columns:repeat(2,1fr) !important; }
          .lp-news-grid     { grid-template-columns:1fr; }
          .lp-contact-grid  { grid-template-columns:1fr; gap:32px; }
          .lp-footer-grid   { grid-template-columns:1fr; gap:28px; }
          .lp-form-row      { grid-template-columns:1fr; }
          .lp-footer-bottom { flex-direction:column; gap:12px; text-align:center; }
          .lp-footer-links  { flex-wrap:wrap; justify-content:center; gap:16px; }
          .lp-about-badge   { bottom:-12px; right:12px; padding:10px 14px; }
          .lp-hero-btns     { flex-direction:column; align-items:flex-start; }
          .lp-stats-row     { gap:20px; }
          .lp-step-line     { display:none !important; }
          .lp-whyus-quote   { padding:24px 20px !important; }
          .lp-news-header   { flex-direction:column; align-items:flex-start; gap:8px; }
        }

        /* ── 480px small phones ── */
        @media(max-width:480px){
          .lp-steps-grid  { grid-template-columns:1fr !important; }
          .lp-footer-grid { grid-template-columns:1fr; }
        }
      `}</style>
      <Navbar />
      <Hero          c={d.landing_hero} />
      <About         c={d.landing_about} />
      <Services      c={d.landing_services} />
      <WhyUs         c={d.landing_whyus} />
      <HowItWorks    c={d.landing_howitworks} />
      <News          c={d.landing_news} />
      <Contact       c={d.landing_contact} />
      <Footer        contact={d.landing_contact} />
    </div>
  )
}
