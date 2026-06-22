import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import SiteLogo, { buildLogoUrl } from '../components/SiteLogo'
import WhatsAppWidget from '../components/WhatsAppWidget'
import QuoteCalculator from '../components/QuoteCalculator'
import {
  Truck, MapPin, Phone, Mail, Clock, ArrowRight,
  Package, RefreshCcw, Store, Shield, Star, Users,
  ChevronRight, Menu, X, CheckCircle, Globe, Zap,
  TrendingUp, Award, Headphones, BarChart2, Handshake,
  Quote, Search, ChevronDown, CircleDot, PackageCheck,
} from 'lucide-react'

// Inline social SVG icons (lucide dropped branded icons)
const SvgTwitterX = ({ size = 15, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.261 5.633 5.903-5.633zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
)
const SvgLinkedin = ({ size = 15, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
)
const SvgInstagram = ({ size = 15, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
)
const SvgFacebook = ({ size = 15, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
)
const SvgTikTok = ({ size = 15, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.74a8.18 8.18 0 004.79 1.53V6.79a4.85 4.85 0 01-1.02-.1z"/></svg>
)
const heroImg = '/boybike.avif'

const API = (import.meta.env.VITE_API_URL ?? 'http://localhost:8000') + '/api'

const SERVICE_ICONS = [Truck, RefreshCcw, Store, Package, Shield, Users]
const WHYUS_ICONS   = [Shield, Award, Globe, CheckCircle, TrendingUp, Headphones]

const CAT_COLORS = {
  'Logistics':   { from: '#0D2240', to: '#0a1a30', accent: '#3B82F6', Icon: Truck },
  'Technology':  { from: '#12041F', to: '#1a0830', accent: '#8B5CF6', Icon: Zap },
  'Partnership': { from: '#1A1200', to: '#2a1c00', accent: '#F59E0B', Icon: Handshake },
}

// ── Scroll reveal hook ────────────────────────────────────────────────────────
function useReveal(threshold = 0.08) {
  const ref = useRef(null)
  useEffect(() => {
    const container = ref.current
    if (!container) return
    const targets = container.querySelectorAll('.lp-reveal')
    const all = targets.length ? targets : [container]
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        all.forEach(el => el.classList.add('lp-vis'))
        io.disconnect()
      }
    }, { threshold })
    io.observe(container)
    return () => io.disconnect()
  }, [threshold])
  return ref
}

// ── Navbar ────────────────────────────────────────────────────────────────────
export function Navbar({ logoUrl, siteName }) {
  const [open, setOpen] = useState(false)
  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 100, background: '#fff', borderBottom: '1px solid #E5E5E5', boxShadow: '0 1px 0 rgba(0,0,0,0.04)' }}>
      <style>{`
        .lp-desktop-nav { display: flex; }
        .lp-mobile-btn  { display: none; background: none; border: none; cursor: pointer; padding: 4px; }
        .lp-nav-auth    { display: flex; }
        @media(max-width:768px) {
          .lp-desktop-nav { display: none !important; }
          .lp-mobile-btn  { display: block !important; }
          .lp-nav-auth    { display: none !important; }
        }
      `}</style>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', height: 72 }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: '#0D0D0D' }}>
          <SiteLogo logoUrl={logoUrl} siteName={siteName} height={36} />
        </Link>
        <nav style={{ display: 'flex', gap: 32, marginLeft: 48, alignItems: 'center' }} className="lp-desktop-nav">
          {['Home','About','Services','How It Works','Track','Blog','FAQ','Contact'].map(l => {
            const style = { fontSize: 14, fontWeight: 500, color: '#6B6B6B', textDecoration: 'none', transition: 'color 0.15s' }
            const hover = { onMouseEnter: e => e.target.style.color='#FF5E14', onMouseLeave: e => e.target.style.color='#6B6B6B' }
            return l === 'Blog'
              ? <Link key={l} to="/blog" style={style} {...hover}>{l}</Link>
              : <a key={l} href={`/#${l.toLowerCase().replace(/\s+/g,'-')}`} style={style} {...hover}>{l}</a>
          })}
        </nav>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
          <div className="lp-nav-auth" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <Link to="/book" style={{ fontSize: 14, fontWeight: 700, color: '#FF5E14', textDecoration: 'none', padding: '8px 16px', border: '1.5px solid #FF5E14', borderRadius: 8 }}>Book Parcel</Link>
            <Link to="/login" style={{ fontSize: 14, fontWeight: 600, color: '#0D0D0D', textDecoration: 'none', padding: '8px 14px' }}>Sign in</Link>
            <Link to="/register" style={{ background: '#FF5E14', color: '#fff', padding: '9px 18px', borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
              Get Started <ArrowRight size={14} />
            </Link>
          </div>
          <button onClick={() => setOpen(!open)} style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }} className="lp-mobile-btn">
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>
      {open && (
        <div style={{ background: '#fff', borderTop: '1px solid #E5E5E5', padding: '12px 24px 20px' }}>
          {['Home','About','Services','How It Works','Track','Blog','FAQ','Contact'].map(l => {
            const style = { display: 'block', padding: '12px 0', fontSize: 15, fontWeight: 500, color: '#0D0D0D', textDecoration: 'none', borderBottom: '1px solid #F7F7F7' }
            return l === 'Blog'
              ? <Link key={l} to="/blog" onClick={() => setOpen(false)} style={style}>{l}</Link>
              : <a key={l} href={`/#${l.toLowerCase().replace(/\s+/g,'-')}`} onClick={() => setOpen(false)} style={style}>{l}</a>
          })}
          <Link to="/book" onClick={() => setOpen(false)}
            style={{ display: 'block', background: '#FF5E14', color: '#fff', padding: '12px', borderRadius: 8, fontSize: 15, fontWeight: 700, textDecoration: 'none', textAlign: 'center', marginTop: 14 }}>
            Book a Parcel
          </Link>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
            <Link to="/login" onClick={() => setOpen(false)}
              style={{ display: 'block', background: '#F7F7F7', color: '#0D0D0D', padding: '11px', borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: 'none', textAlign: 'center' }}>
              Sign in
            </Link>
            <Link to="/register" onClick={() => setOpen(false)}
              style={{ display: 'block', background: '#0D0D0D', color: '#fff', padding: '11px', borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: 'none', textAlign: 'center' }}>
              Get Started
            </Link>
          </div>
        </div>
      )}
    </header>
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
      minHeight: '90vh', display: 'flex', alignItems: 'center',
      position: 'relative', overflow: 'hidden',
      backgroundImage: `url(${heroImg})`,
      backgroundSize: 'cover', backgroundPosition: 'center 40%',
    }}>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(105deg, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.6) 55%, rgba(0,0,0,0.3) 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(ellipse at 15% 65%, rgba(255,94,20,0.22) 0%, transparent 52%)', pointerEvents: 'none' }} />

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 24px', position: 'relative', zIndex: 1, width: '100%' }} className="lp-hero-layout">
        {/* Left: text */}
        <div>
          <h1 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: 'clamp(2.2rem,6vw,4.4rem)', lineHeight: 1.05, color: '#fff', marginBottom: 0 }}>
            {c.title1 ?? 'Transport anything'}
          </h1>
          <h1 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: 'clamp(2.2rem,6vw,4.4rem)', lineHeight: 1.05, color: '#FF5E14', marginBottom: 24 }}>
            {c.title2 ?? 'from anywhere.'}
          </h1>
          <p style={{ fontSize: 'clamp(15px,2vw,17px)', color: 'rgba(255,255,255,0.7)', lineHeight: 1.8, maxWidth: 540, marginBottom: 36 }}>
            {c.subtitle ?? 'SendTrack connects vendors and riders in real-time — fast dispatch, live GPS tracking, and proof of delivery you can trust.'}
          </p>
          <div className="lp-hero-btns" style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 52 }}>
            <Link to="/book" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#FF5E14', color: '#fff', padding: '14px 30px', borderRadius: 10, fontWeight: 700, fontSize: 15, textDecoration: 'none', transition: 'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background='#D94E0A'}
              onMouseLeave={e => e.currentTarget.style.background='#FF5E14'}>
              Book a Parcel <ArrowRight size={16} />
            </Link>
            <Link to="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.1)', color: '#fff', padding: '14px 30px', borderRadius: 10, fontWeight: 600, fontSize: 15, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.18)', backdropFilter: 'blur(6px)' }}>
              {c.cta_primary ?? 'Get Started'}
            </Link>
          </div>
          <div className="lp-stats-row" style={{ display: 'flex', gap: 36, flexWrap: 'wrap' }}>
            {stats.map(([v, l]) => (
              <div key={l} style={{ borderLeft: '3px solid #FF5E14', paddingLeft: 16 }}>
                <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: 'clamp(20px,3vw,28px)', color: '#fff', lineHeight: 1 }}>{v}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: floating delivery card — desktop only */}
        <div className="lp-hero-card">
          <div style={{ position: 'relative', animation: 'lp-float 5s ease-in-out infinite', padding: '20px 0' }}>
            {/* Top badge */}
            <div style={{ position: 'absolute', top: 4, right: 20, zIndex: 2, background: '#FF5E14', borderRadius: 10, padding: '7px 14px', boxShadow: '0 6px 20px rgba(255,94,20,0.45)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Zap size={11} color="#fff" />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>Live GPS</span>
            </div>

            <div style={{ background: 'rgba(18,18,18,0.88)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.1)', padding: '28px 24px', boxShadow: '0 24px 64px rgba(0,0,0,0.55)' }}>
              {/* Order header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
                <div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: '2px', fontWeight: 700 }}>ORDER #AB3X7K</div>
                  <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: 16, color: '#fff', marginTop: 4 }}>CBD → Kilimani</div>
                </div>
                <span style={{ background: 'rgba(34,197,94,0.12)', color: '#4ADE80', border: '1px solid rgba(34,197,94,0.22)', padding: '5px 11px', borderRadius: 999, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>
                  On the way
                </span>
              </div>

              {/* Progress bar */}
              <div style={{ height: 4, background: 'rgba(255,255,255,0.07)', borderRadius: 999, marginBottom: 18, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: '65%', background: 'linear-gradient(90deg,#FF5E14,#FF8C4A)', borderRadius: 999 }} />
              </div>

              {/* Steps */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 22 }}>
                {[['Placed',true],['Assigned',true],['Picked',true],['On way',true],['Done',false]].map(([s, done]) => (
                  <div key={s} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: done ? '#FF5E14' : 'rgba(255,255,255,0.07)', border: `1.5px solid ${done ? '#FF5E14' : 'rgba(255,255,255,0.1)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {done ? <CheckCircle size={12} color="#fff" /> : <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.18)' }} />}
                    </div>
                    <span style={{ fontSize: 9, color: done ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.18)', fontWeight: 500 }}>{s}</span>
                  </div>
                ))}
              </div>

              {/* Rider */}
              <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 38, height: 38, background: '#FF5E14', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: 13, color: '#fff' }}>JM</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>James Mwenda</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)', marginTop: 1 }}>⭐ 4.9 · ETA ~12 min</div>
                </div>
                <div style={{ width: 32, height: 32, background: 'rgba(34,197,94,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Phone size={13} color="#4ADE80" />
                </div>
              </div>

              {/* Live indicator */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ width: 8, height: 8, background: '#4ADE80', borderRadius: '50%', animation: 'lp-pulse 2s ease-in-out infinite', flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>GPS tracking active</span>
                <span style={{ marginLeft: 'auto', fontSize: 11, color: 'rgba(255,255,255,0.22)' }}>2.3 km away</span>
              </div>
            </div>

            {/* Bottom badge */}
            <div style={{ position: 'absolute', bottom: 4, left: 16, zIndex: 2, background: '#fff', borderRadius: 10, padding: '7px 13px', boxShadow: '0 6px 20px rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle size={12} color="#16A34A" />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#0D0D0D' }}>98% On-time rate</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Trust Bar ─────────────────────────────────────────────────────────────────
function TrustBar() {
  const partners = ['E-commerce', 'Retail Chains', 'Pharmacies', 'FMCG Brands', 'SMEs', 'Supermarkets', 'Online Stores', 'Hospitality']
  return (
    <div style={{ background: '#0D0D0D', borderBottom: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, height: 54, overflow: 'hidden' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#FF5E14', textTransform: 'uppercase', letterSpacing: '1px', whiteSpace: 'nowrap', paddingRight: 28, borderRight: '1px solid rgba(255,255,255,0.1)', marginRight: 28, flexShrink: 0 }}>
            Trusted by
          </span>
          <div className="lp-trust-scroll">
            {[...partners, ...partners].map((p, i) => (
              <span key={i} style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.45)', whiteSpace: 'nowrap', paddingRight: 40 }}>{p}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Stats Band ────────────────────────────────────────────────────────────────
function StatsBand() {
  const items = [
    { value: '500+',  label: 'Deliveries Daily',    icon: Package },
    { value: '98%',   label: 'On-Time Success Rate', icon: TrendingUp },
    { value: 'KES 10M', label: 'Carrier Liability',  icon: Shield },
    { value: '24/7',  label: 'Live Support',          icon: Headphones },
  ]
  return (
    <section style={{ background: '#FF5E14' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
        <div className="lp-stats-band">
          {items.map(({ value, label, icon: Icon }, i) => (
            <div key={label} style={{
              display: 'flex', alignItems: 'center', gap: 16, padding: '28px 0',
              borderRight: i < items.length - 1 ? '1px solid rgba(255,255,255,0.25)' : 'none',
              paddingRight: i < items.length - 1 ? 24 : 0,
            }}>
              <div style={{ width: 48, height: 48, background: 'rgba(255,255,255,0.15)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={22} color="#fff" />
              </div>
              <div>
                <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: 24, color: '#fff', lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>{label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── About ─────────────────────────────────────────────────────────────────────
function About({ c = {} }) {
  const perks = c.stats ?? [
    { value: '100%',    label: 'Compensation on loss or damage' },
    { value: 'KES 10M', label: 'Carrier liability per consignment' },
    { value: 'Real-time', label: 'Live GPS tracking' },
    { value: 'KES 15M', label: 'Burglary coverage value' },
  ]
  const checks = [
    'Dedicated account manager',
    'Same-day dispatch capability',
    'Tamper-evident packaging',
    'End-to-end digital tracking',
  ]
  return (
    <section id="about" className="lp-pad" style={{ background: '#fff' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div className="lp-about-grid">
          {/* Left visual */}
          <div style={{ position: 'relative' }}>
            <div style={{ background: 'linear-gradient(145deg, #0D0D0D 0%, #1a1a1a 100%)', borderRadius: 20, padding: 40, minHeight: 380, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, background: 'rgba(255,94,20,0.08)', borderRadius: '50%', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', bottom: -60, left: -30, width: 240, height: 240, background: 'rgba(255,94,20,0.05)', borderRadius: '50%', pointerEvents: 'none' }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ width: 56, height: 56, background: '#FF5E14', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                  <Truck size={26} color="#fff" />
                </div>
                <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: 22, color: '#fff', marginBottom: 8 }}>SendTrack Fleet</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>Nairobi & beyond — every package tracked from pickup to door.</div>
              </div>
              <div style={{ position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {perks.map(({ value, label }) => (
                  <div key={label} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: '14px 16px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: 16, color: '#FF5E14' }}>{value}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 3, lineHeight: 1.4 }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ position: 'absolute', bottom: -20, right: -20, background: '#FF5E14', borderRadius: 16, padding: '16px 22px', textAlign: 'center', boxShadow: '0 8px 24px rgba(255,94,20,0.35)' }}>
              <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: 26, color: '#fff' }}>{c.years ?? '7+'}yrs</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)', marginTop: 2 }}>Experience</div>
            </div>
          </div>

          {/* Right text */}
          <div>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#FF5E14', textTransform: 'uppercase', letterSpacing: '1.2px' }}>About SendTrack</span>
            <h2 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: 'clamp(26px,4vw,36px)', marginTop: 10, marginBottom: 20, lineHeight: 1.15 }}>
              {c.title ?? 'The preferred last-mile logistics partner'}
            </h2>
            <p style={{ color: '#6B6B6B', lineHeight: 1.85, marginBottom: 16, fontSize: 15 }}>
              {c.body1 ?? 'SendTrack is a last-mile logistics platform built for the modern supply chain. We connect vendors and riders in real-time, enabling fast dispatch, live tracking, and accountability at every step.'}
            </p>
            <p style={{ color: '#6B6B6B', lineHeight: 1.85, marginBottom: 32, fontSize: 15 }}>
              {c.body2 ?? 'From fragile parcels to bulk cargo — we handle it all with transparency, speed, and full compensation guarantees.'}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 36 }}>
              {checks.map(text => (
                <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 22, height: 22, background: '#FFF0E8', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <CheckCircle size={12} color="#FF5E14" />
                  </div>
                  <span style={{ fontSize: 14, color: '#0D0D0D', fontWeight: 500 }}>{text}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <a href="#contact" style={{ background: '#FF5E14', color: '#fff', padding: '12px 26px', borderRadius: 8, fontWeight: 600, fontSize: 14, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background='#D94E0A'}
                onMouseLeave={e => e.currentTarget.style.background='#FF5E14'}>
                Contact Us <ArrowRight size={14} />
              </a>
              <a href="#services" style={{ border: '1px solid #E5E5E5', color: '#0D0D0D', padding: '12px 26px', borderRadius: 8, fontWeight: 600, fontSize: 14, textDecoration: 'none', transition: 'border-color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor='#FF5E14'}
                onMouseLeave={e => e.currentTarget.style.borderColor='#E5E5E5'}>
                Our Services
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Services ──────────────────────────────────────────────────────────────────
const SERVICE_SLUGS = ['last-mile', 'reverse-logistics', 'pickup-stations', 'dedicated-rider', 'warehousing', 'staffing']

function Services({ c = [] }) {
  const gridRef = useReveal(0.05)
  const items = c.length ? c : [
    { title: 'First, Middle & Last Mile',    desc: 'Comprehensive logistics covering the full supply chain from origin to final recipient.' },
    { title: 'Reverse Logistics',            desc: 'Efficient returns handling that protects your customer relationships and revenue.' },
    { title: 'PickUp Stations',              desc: 'Hold customer packages securely for up to 7 working days at our network locations.' },
    { title: 'Dedicated Rider / Van Service',desc: 'Exclusive fleet assignment for high-volume businesses needing reliable capacity.' },
    { title: 'Warehousing',                  desc: 'Secure storage with same-day dispatch capability and real-time inventory visibility.' },
    { title: 'Staffing / HR Services',       desc: 'Experienced logistics workforce on demand — fully vetted and ready to deploy.' },
  ]
  return (
    <section id="services" className="lp-pad" style={{ background: '#F7F7F7' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#FF5E14', textTransform: 'uppercase', letterSpacing: '1.2px' }}>Our Solutions</span>
          <h2 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: 'clamp(24px,4vw,36px)', marginTop: 10, lineHeight: 1.2, marginBottom: 12 }}>Everything your business needs to move</h2>
          <p style={{ color: '#6B6B6B', maxWidth: 520, margin: '0 auto', fontSize: 15, lineHeight: 1.75 }}>From single parcels to full logistics operations — SendTrack scales with you.</p>
        </div>
        <div className="lp-services-grid" ref={gridRef}>
          {items.map(({ title, desc }, idx) => {
            const Icon = SERVICE_ICONS[idx % SERVICE_ICONS.length]
            return (
              <div key={title} className={`lp-service-card lp-reveal lp-d${idx + 1}`}>
                <div style={{ width: 52, height: 52, background: '#FFF0E8', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, transition: 'background 0.2s' }} className="lp-service-icon">
                  <Icon size={24} color="#FF5E14" />
                </div>
                <h3 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 600, fontSize: 16, marginBottom: 10, lineHeight: 1.3 }}>{title}</h3>
                <p style={{ color: '#6B6B6B', fontSize: 14, lineHeight: 1.75, flexGrow: 1 }}>{desc}</p>
                <Link to={`/solutions#${SERVICE_SLUGS[idx % SERVICE_SLUGS.length]}`} style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600, color: '#FF5E14', textDecoration: 'none' }}>
                  Learn more <ChevronRight size={14} />
                </Link>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ── How It Works ──────────────────────────────────────────────────────────────
function HowItWorks({ c = [] }) {
  const steps = c.length ? c : [
    { n: '01', title: 'Create Package',   desc: 'Register your delivery with package details, pickup and dropoff location in under 60 seconds.' },
    { n: '02', title: 'Rider Assigned',   desc: 'Our system auto-dispatches the nearest available rider — or you choose one manually.' },
    { n: '03', title: 'Live Tracking',    desc: 'Follow your delivery in real-time with GPS updates and instant SMS notifications.' },
    { n: '04', title: 'Proof Delivered',  desc: 'Receive photo confirmation and digital signature at the point of delivery.' },
  ]
  return (
    <section id="how-it-works" className="lp-pad" style={{ background: '#fff' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#FF5E14', textTransform: 'uppercase', letterSpacing: '1.2px' }}>How It Works</span>
          <h2 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: 'clamp(24px,4vw,36px)', marginTop: 10, lineHeight: 1.2 }}>Four steps to delivered</h2>
        </div>
        <div className="lp-steps-grid">
          {steps.map(({ n, title, desc }, i) => (
            <div key={n} style={{ position: 'relative' }}>
              {i < steps.length - 1 && <div className="lp-step-connector" />}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <div style={{ width: 64, height: 64, background: '#FF5E14', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, boxShadow: '0 6px 20px rgba(255,94,20,0.3)', flexShrink: 0 }}>
                  <span style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: 18, color: '#fff' }}>{n}</span>
                </div>
                <h4 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 600, fontSize: 16, marginBottom: 10 }}>{title}</h4>
                <p style={{ color: '#6B6B6B', fontSize: 13, lineHeight: 1.75, maxWidth: 220 }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Why Choose Us ─────────────────────────────────────────────────────────────
function WhyUs({ c = {} }) {
  const gridRef = useReveal(0.05)
  const items = c.items ?? [
    { title: '100% Compensation',   desc: 'Full compensation in case of loss or damage — zero excuses, zero delays.' },
    { title: 'Proven Excellence',   desc: '1+ years of last-mile logistics serving Nairobi businesses of every size.' },
    { title: 'City-Wide Coverage',  desc: 'Growing network of pickup points and riders across Nairobi and beyond.' },
    { title: 'Fidelity Guarantee',  desc: 'Fidelity coverage up to KES 2,500,000 per incident for your peace of mind.' },
    { title: "Carrier's Liability", desc: 'Up to KES 10M per consignment covered — because your cargo matters.' },
    { title: 'Employer Liability',  desc: 'WIBA coverage up to KES 2M per person across our entire rider fleet.' },
  ]
  return (
    <section className="lp-pad" style={{ background: '#0D0D0D', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 25% 55%, rgba(255,94,20,0.1) 0%, transparent 50%)', pointerEvents: 'none' }} />
      <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 56, flexWrap: 'wrap', gap: 20 }}>
          <div>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#FF5E14', textTransform: 'uppercase', letterSpacing: '1.2px' }}>Why Choose Us</span>
            <h2 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: 'clamp(24px,4vw,36px)', color: '#fff', marginTop: 10, lineHeight: 1.2 }}>
              Moving with care and accountability
            </h2>
          </div>
          <Link to="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#FF5E14', color: '#fff', padding: '11px 22px', borderRadius: 8, fontWeight: 600, fontSize: 14, textDecoration: 'none', flexShrink: 0 }}>
            Get Started <ArrowRight size={14} />
          </Link>
        </div>
        <div className="lp-whyus-grid" ref={gridRef}>
          {items.map(({ title, desc }, idx) => {
            const Icon = WHYUS_ICONS[idx % WHYUS_ICONS.length]
            return (
              <div key={title} className={`lp-reveal lp-d${idx + 1}`} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '28px 24px', transition: 'border-color 0.2s, background 0.2s, opacity 0.55s ease, transform 0.55s ease' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(255,94,20,0.3)'; e.currentTarget.style.background='rgba(255,94,20,0.05)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(255,255,255,0.07)'; e.currentTarget.style.background='rgba(255,255,255,0.04)' }}>
                <div style={{ width: 46, height: 46, background: 'rgba(255,94,20,0.15)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <Icon size={20} color="#FF5E14" />
                </div>
                <h4 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 600, fontSize: 15, color: '#fff', marginBottom: 8 }}>{title}</h4>
                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, lineHeight: 1.75 }}>{desc}</p>
              </div>
            )
          })}
        </div>
        {c.quote && (
          <div style={{ marginTop: 56, background: 'rgba(255,94,20,0.08)', border: '1px solid rgba(255,94,20,0.2)', borderRadius: 20, padding: '36px 40px', textAlign: 'center' }}>
            <div style={{ fontSize: 40, color: '#FF5E14', fontFamily: 'Georgia,serif', lineHeight: 1, marginBottom: 16 }}>"</div>
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 17, lineHeight: 1.85, maxWidth: 720, margin: '0 auto', fontStyle: 'italic' }}>{c.quote}</p>
          </div>
        )}
      </div>
    </section>
  )
}

// ── Testimonials ──────────────────────────────────────────────────────────────
function Testimonials() {
  const gridRef = useReveal(0.05)
  const reviews = [
    { name: 'Amina Hassan',    role: 'E-commerce Owner',    rating: 5, text: 'SendTrack cut our average delivery time in half. The real-time tracking gives our customers confidence and has dramatically reduced "where is my order?" support calls.' },
    { name: 'David Mwangi',    role: 'Retail Chain Manager', rating: 5, text: 'We handle over 200 dispatches daily. The auto-dispatch feature and live rider visibility have made our logistics team incredibly efficient.' },
    { name: 'Grace Otieno',    role: 'Pharmacy Director',    rating: 5, text: 'For pharmaceutical deliveries, accountability is everything. SendTrack\'s proof of delivery with photo confirmation is exactly what we needed.' },
  ]
  return (
    <section className="lp-pad" style={{ background: '#F7F7F7' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#FF5E14', textTransform: 'uppercase', letterSpacing: '1.2px' }}>Testimonials</span>
          <h2 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: 'clamp(24px,4vw,36px)', marginTop: 10, lineHeight: 1.2 }}>What our clients say</h2>
        </div>
        <div className="lp-testimonials-grid" ref={gridRef}>
          {reviews.map(({ name, role, rating, text }, idx) => (
            <div key={name} className={`lp-reveal lp-d${idx + 1}`} style={{ background: '#fff', borderRadius: 16, padding: 28, border: '1px solid #E5E5E5', display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'flex', gap: 4 }}>
                {Array.from({ length: rating }).map((_, i) => (
                  <Star key={i} size={15} color="#FF5E14" fill="#FF5E14" />
                ))}
              </div>
              <Quote size={28} color="rgba(255,94,20,0.2)" style={{ flexShrink: 0 }} />
              <p style={{ color: '#3D3D3D', fontSize: 14, lineHeight: 1.8, flexGrow: 1, marginTop: -12 }}>{text}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 16, borderTop: '1px solid #F0F0F0' }}>
                <div style={{ width: 40, height: 40, background: '#FFF0E8', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Users size={17} color="#FF5E14" />
                </div>
                <div>
                  <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 600, fontSize: 14, color: '#0D0D0D' }}>{name}</div>
                  <div style={{ fontSize: 12, color: '#9B9B9B', marginTop: 1 }}>{role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── CTA Banner ────────────────────────────────────────────────────────────────
function CtaBanner() {
  return (
    <section style={{ background: '#FF5E14', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 80% 50%, rgba(255,255,255,0.08) 0%, transparent 55%)', pointerEvents: 'none' }} />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '72px 24px', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 32 }}>
          <div style={{ maxWidth: 580 }}>
            <h2 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: 'clamp(24px,4vw,38px)', color: '#fff', lineHeight: 1.15, marginBottom: 14 }}>
              Ready to transform your last-mile logistics?
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 16, lineHeight: 1.7 }}>
              Join hundreds of Nairobi businesses that trust SendTrack to deliver — on time, every time.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <Link to="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff', color: '#FF5E14', padding: '14px 30px', borderRadius: 10, fontWeight: 700, fontSize: 15, textDecoration: 'none' }}>
              Start For Free <ArrowRight size={16} />
            </Link>
            <a href="#contact" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.15)', color: '#fff', padding: '14px 30px', borderRadius: 10, fontWeight: 600, fontSize: 15, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.3)' }}>
              Talk to Sales
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── News ──────────────────────────────────────────────────────────────────────
function News({ c = [] }) {
  const gridRef = useReveal(0.05)
  const { data: live = [] } = useQuery({
    queryKey: ['posts'],
    queryFn: () => axios.get(`${API}/posts`, { params: { limit: 3 } }).then(r => r.data.data),
    staleTime: 5 * 60 * 1000,
  })

  const fallback = c.length ? c : [
    { cat: 'Logistics',   title: 'SendTrack expands rider network across Nairobi CBD',     date: 'Apr 2025', excerpt: 'We are growing our fleet to serve more vendors in the Nairobi central business district with faster dispatch times.' },
    { cat: 'Technology',  title: 'Introducing real-time GPS proof of delivery',            date: 'Mar 2025', excerpt: 'Our new GPS verification feature ensures every delivery is confirmed within 200 metres of the dropoff point.' },
    { cat: 'Partnership', title: 'SendTrack partners with 28 logistics operators',         date: 'Feb 2025', excerpt: 'A growing network of delivery partners ensures we cover more ground and deliver faster across Nairobi.' },
  ]

  const posts = live.length
    ? live.map(p => ({
        cat: p.category || 'News',
        title: p.title,
        date: p.published_at ? new Date(p.published_at).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : '',
        excerpt: p.excerpt,
        slug: p.slug,
        cover: p.cover_image_url,
      }))
    : fallback

  return (
    <section id="news" className="lp-pad" style={{ background: '#fff' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 44, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#FF5E14', textTransform: 'uppercase', letterSpacing: '1.2px' }}>News & Updates</span>
            <h2 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: 'clamp(22px,4vw,32px)', marginTop: 8 }}>Latest from SendTrack</h2>
          </div>
          <Link to="/blog" style={{ fontSize: 14, fontWeight: 600, color: '#FF5E14', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
            All posts <ChevronRight size={16} />
          </Link>
        </div>
        <div className="lp-news-grid" ref={gridRef}>
          {posts.map((post, idx) => {
            const { cat, title, date, excerpt, slug, cover } = post
            const palette = CAT_COLORS[cat] ?? CAT_COLORS['Logistics']
            const ThumbIcon = palette.Icon
            const inner = (
              <>
              <div style={{ height: 180, background: cover ? '#f3f4f6' : `linear-gradient(135deg, ${palette.from} 0%, ${palette.to} 100%)`, backgroundImage: cover ? `url(${buildLogoUrl(cover)})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                {!cover && <>
                  <div style={{ position: 'absolute', inset: 0, backgroundImage: `radial-gradient(circle at 70% 30%, ${palette.accent}26 0%, transparent 65%)`, pointerEvents: 'none' }} />
                  <div style={{ width: 72, height: 72, background: `${palette.accent}1a`, border: `1px solid ${palette.accent}33`, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
                    <ThumbIcon size={32} color={palette.accent} />
                  </div>
                </>}
              </div>
              <div style={{ padding: '22px 22px 26px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#FF5E14', textTransform: 'uppercase', letterSpacing: '0.5px', background: '#FFF0E8', padding: '3px 8px', borderRadius: 999 }}>{cat}</span>
                  <span style={{ fontSize: 12, color: '#9B9B9B' }}>{date}</span>
                </div>
                <h4 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 600, fontSize: 16, marginBottom: 10, lineHeight: 1.4 }}>{title}</h4>
                <p style={{ color: '#6B6B6B', fontSize: 13, lineHeight: 1.75 }}>{excerpt}</p>
                <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600, color: '#FF5E14' }}>
                  Read more <ChevronRight size={14} />
                </div>
              </div>
              </>
            )
            const cardStyle = { background: '#fff', borderRadius: 16, overflow: 'hidden', border: '1px solid #E5E5E5', transition: 'box-shadow 0.2s, transform 0.2s, opacity 0.55s ease', cursor: 'pointer', textDecoration: 'none', color: 'inherit', display: 'block' }
            const hover = {
              onMouseEnter: e => { e.currentTarget.style.boxShadow='0 8px 32px rgba(0,0,0,0.08)'; e.currentTarget.style.transform='translateY(-3px)' },
              onMouseLeave: e => { e.currentTarget.style.boxShadow='none'; e.currentTarget.style.transform='none' },
            }
            return slug
              ? <Link key={slug} to={`/blog/${slug}`} className={`lp-reveal lp-d${idx + 1}`} style={cardStyle} {...hover}>{inner}</Link>
              : <div key={title} className={`lp-reveal lp-d${idx + 1}`} style={cardStyle} {...hover}>{inner}</div>
          })}
        </div>
      </div>
    </section>
  )
}

// ── Tracking Widget ───────────────────────────────────────────────────────────
const STATUS_STEPS = ['pending', 'assigned', 'picked_up', 'in_transit', 'delivered']
const STATUS_LABELS = {
  pending:    'Order Placed',
  assigned:   'Rider Assigned',
  picked_up:  'Picked Up',
  in_transit: 'Out for Delivery',
  delivered:  'Delivered',
  failed:     'Delivery Attempted',
  cancelled:  'Cancelled',
}

function TrackingWidget() {
  const [orderId, setOrderId] = useState('')
  const [result, setResult]   = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const handleTrack = async (e) => {
    e.preventDefault()
    const id = orderId.trim()
    if (!id) return
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await axios.get(`${API}/track?code=${encodeURIComponent(id)}`)
      setResult(res.data.data)
    } catch (err) {
      setError(err.response?.data?.error ?? 'Order not found. Check the order number and try again.')
    } finally {
      setLoading(false)
    }
  }

  const activeStep = result ? STATUS_STEPS.indexOf(result.status) : -1
  const isCancelled = result?.status === 'cancelled' || result?.status === 'failed'

  return (
    <section id="track" style={{ background: '#0D0D0D', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 70% 40%, rgba(255,94,20,0.1) 0%, transparent 55%)', pointerEvents: 'none' }} />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 24px', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#FF5E14', textTransform: 'uppercase', letterSpacing: '1.2px' }}>Real-Time Tracking</span>
          <h2 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: 'clamp(24px,4vw,36px)', color: '#fff', marginTop: 10, lineHeight: 1.2 }}>Where is my delivery?</h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15, marginTop: 12 }}>Enter your order number to see live status.</p>
        </div>

        <form onSubmit={handleTrack} style={{ display: 'flex', gap: 12, maxWidth: 560, margin: '0 auto 40px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, position: 'relative', minWidth: 200 }}>
            <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.35)', pointerEvents: 'none' }} />
            <input
              value={orderId}
              onChange={e => setOrderId(e.target.value)}
              placeholder="Tracking code e.g. AB3X7K"
              style={{ width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '14px 14px 14px 42px', fontSize: 15, color: '#fff', outline: 'none', fontFamily: 'DM Sans,sans-serif', transition: 'border-color 0.15s' }}
              onFocus={e => e.target.style.borderColor = '#FF5E14'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
            />
          </div>
          <button type="submit" disabled={loading || !orderId.trim()} style={{ background: '#FF5E14', color: '#fff', border: 'none', padding: '14px 28px', borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: loading || !orderId.trim() ? 'not-allowed' : 'pointer', opacity: loading || !orderId.trim() ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'DM Sans,sans-serif', transition: 'background 0.15s' }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#D94E0A' }}
            onMouseLeave={e => e.currentTarget.style.background = '#FF5E14'}>
            {loading ? <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} /> : <><PackageCheck size={16} /> Track</>}
          </button>
        </form>

        {error && (
          <div style={{ maxWidth: 560, margin: '0 auto 24px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '12px 16px', fontSize: 14, color: '#FCA5A5', textAlign: 'center' }}>
            {error}
          </div>
        )}

        {result && (
          <div style={{ maxWidth: 640, margin: '0 auto', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 32 }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 4, fontFamily: 'monospace', letterSpacing: '2px' }}>{result.tracking_code}</div>
                <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: 20, color: '#fff' }}>{result.status_label}</div>
              </div>
              <span style={{ padding: '6px 14px', borderRadius: 999, fontSize: 13, fontWeight: 600, background: isCancelled ? 'rgba(239,68,68,0.15)' : result.status === 'delivered' ? 'rgba(34,197,94,0.15)' : 'rgba(255,94,20,0.15)', color: isCancelled ? '#FCA5A5' : result.status === 'delivered' ? '#86EFAC' : '#FF5E14', border: `1px solid ${isCancelled ? 'rgba(239,68,68,0.3)' : result.status === 'delivered' ? 'rgba(34,197,94,0.3)' : 'rgba(255,94,20,0.3)'}` }}>
                {result.status_label}
              </span>
            </div>

            {/* Addresses */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 28 }} className="lp-track-addrs">
              {[['Pickup', result.pickup_address], ['Dropoff', result.dropoff_address]].map(([label, addr]) => (
                <div key={label} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '12px 14px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.5 }}>{addr ?? '—'}</div>
                </div>
              ))}
            </div>

            {/* Progress steps */}
            {!isCancelled && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, position: 'relative' }} className="lp-track-steps">
                <div style={{ position: 'absolute', top: 14, left: '10%', right: '10%', height: 2, background: 'rgba(255,255,255,0.08)', zIndex: 0 }} />
                <div style={{ position: 'absolute', top: 14, left: '10%', height: 2, background: '#FF5E14', zIndex: 0, width: `${Math.max(0, activeStep / (STATUS_STEPS.length - 1)) * 80}%`, transition: 'width 0.4s' }} />
                {STATUS_STEPS.map((s, i) => {
                  const done = i <= activeStep
                  return (
                    <div key={s} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, position: 'relative', zIndex: 1, flex: 1 }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: done ? '#FF5E14' : 'rgba(255,255,255,0.08)', border: `2px solid ${done ? '#FF5E14' : 'rgba(255,255,255,0.12)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s' }}>
                        {done ? <CheckCircle size={14} color="#fff" /> : <CircleDot size={14} color="rgba(255,255,255,0.2)" />}
                      </div>
                      <span style={{ fontSize: 10, color: done ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.25)', fontWeight: done ? 600 : 400, textAlign: 'center', lineHeight: 1.3 }}>{STATUS_LABELS[s]}</span>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Event log */}
            {result.events?.length > 0 && (
              <div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 14 }}>Activity</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[...result.events].reverse().map((ev, i) => (
                    <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: i === 0 ? '#FF5E14' : 'rgba(255,255,255,0.2)', marginTop: 5, flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: 13, color: i === 0 ? '#fff' : 'rgba(255,255,255,0.55)', fontWeight: i === 0 ? 600 : 400 }}>{ev.label}</div>
                        {ev.note && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{ev.note}</div>}
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 2 }}>{new Date(ev.occurred_at).toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

// ── FAQ ───────────────────────────────────────────────────────────────────────
const FAQ_ITEMS = [
  { q: 'How do I place a delivery order?', a: 'Sign up as a vendor, then create an order from your dashboard. Enter pickup and dropoff details, package info, and our system will auto-dispatch the nearest available rider within minutes.' },
  { q: 'How do I track my delivery in real-time?', a: 'Every order comes with a live tracking link. You can follow your rider\'s GPS position on the map from the moment they pick up your package until it\'s delivered.' },
  { q: 'What areas do you currently serve?', a: 'We currently operate in Nairobi and the greater Nairobi metropolitan area. We\'re expanding rapidly — contact us to check coverage in your specific area.' },
  { q: 'What happens if my package is lost or damaged?', a: 'SendTrack provides 100% compensation for loss or damage. Our carrier liability covers up to KES 10M per consignment, and all riders are vetted and insured under our WIBA policy.' },
  { q: 'How long does delivery take?', a: 'Standard deliveries within Nairobi are completed same-day. Most orders are picked up within 30–60 minutes of dispatch. Express slots are available for time-critical packages.' },
  { q: 'Can I get a dedicated rider for my business?', a: 'Yes. Our Dedicated Rider / Van Service assigns an exclusive rider or fleet to your business. This is ideal for high-volume operations like e-commerce, pharmacies, or restaurant chains.' },
  { q: 'What payment methods do you accept?', a: 'We support M-Pesa, bank transfer, and contract invoicing for business accounts. Cash-on-delivery and card payments are available for select plans.' },
  { q: 'How do I become a delivery rider?', a: 'Apply through the SendTrack app, complete our KYC verification, and pass our vehicle and background checks. Approved riders get access to deliveries immediately.' },
]

function FAQ() {
  const [open, setOpen] = useState(null)
  return (
    <section id="faq" className="lp-pad" style={{ background: '#fff' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#FF5E14', textTransform: 'uppercase', letterSpacing: '1.2px' }}>FAQ</span>
          <h2 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: 'clamp(24px,4vw,36px)', marginTop: 10, lineHeight: 1.2 }}>Frequently asked questions</h2>
          <p style={{ color: '#6B6B6B', fontSize: 15, marginTop: 12 }}>Can't find the answer you need? <a href="#contact" style={{ color: '#FF5E14', textDecoration: 'none', fontWeight: 600 }}>Contact us</a></p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {FAQ_ITEMS.map(({ q, a }, i) => {
            const isOpen = open === i
            return (
              <div key={q}
                style={{ border: `1px solid ${isOpen ? '#FF5E14' : '#E5E5E5'}`, borderRadius: 12, overflow: 'hidden', transition: 'border-color 0.2s' }}>
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', background: isOpen ? '#FFF8F5' : '#fff', border: 'none', cursor: 'pointer', textAlign: 'left', gap: 16, transition: 'background 0.2s' }}>
                  <span style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 600, fontSize: 15, color: '#0D0D0D', lineHeight: 1.4 }}>{q}</span>
                  <ChevronDown size={18} color="#FF5E14" style={{ flexShrink: 0, transition: 'transform 0.25s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                </button>
                {isOpen && (
                  <div style={{ padding: '0 22px 20px', background: '#FFF8F5' }}>
                    <p style={{ color: '#6B6B6B', fontSize: 14, lineHeight: 1.8, margin: 0 }}>{a}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// sanitize: strip tags and limit length
function sanitize(value, maxLen = 2000) {
  return value.replace(/<[^>]*>/g, '').replace(/[<>"'`]/g, '').slice(0, maxLen)
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
    { icon: Mail,   label: 'Email',        value: c.email   ?? 'info@sendtrack.co.ke' },
    { icon: Clock,  label: 'Office Hours', value: c.hours   ?? 'Mon – Sat: 8am to 6pm' },
  ]

  const set = (k, raw, maxLen) => {
    setForm(f => ({ ...f, [k]: sanitize(raw, maxLen) }))
    setErrors(e => ({ ...e, [k]: undefined }))
  }

  const validate = () => {
    const e = {}
    if (!form.name.trim() || form.name.trim().length < 2) e.name = 'Name must be at least 2 characters.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) e.email = 'Enter a valid email address.'
    if (!form.message.trim() || form.message.trim().length < 10) e.message = 'Message must be at least 10 characters.'
    if (form.message.length > 2000) e.message = 'Message is too long (max 2000 characters).'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    try {
      await axios.post(`${API}/contact`, {
        name: form.name.trim(), email: form.email.trim().toLowerCase(),
        phone: form.phone.trim() || undefined, subject: form.subject.trim() || undefined,
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
    <section id="contact" className="lp-pad" style={{ background: '#F7F7F7' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#FF5E14', textTransform: 'uppercase', letterSpacing: '1.2px' }}>Get In Touch</span>
          <h2 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: 'clamp(24px,4vw,36px)', marginTop: 10 }}>We're here to help</h2>
        </div>
        <div className="lp-contact-grid">
          {/* Left info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {info.map(({ icon: Icon, label, value }) => (
              <div key={label} style={{ display: 'flex', gap: 16, padding: '18px 20px', background: '#fff', borderRadius: 12, border: '1px solid #E5E5E5', marginBottom: 12 }}>
                <div style={{ width: 44, height: 44, background: '#FFF0E8', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={18} color="#FF5E14" />
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#9B9B9B', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 3 }}>{label}</div>
                  <div style={{ fontSize: 14, color: '#0D0D0D', lineHeight: 1.5 }}>{value}</div>
                </div>
              </div>
            ))}
            <div style={{ marginTop: 4, padding: '22px', background: '#0D0D0D', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 44, height: 44, background: 'rgba(255,94,20,0.15)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Handshake size={20} color="#FF5E14" />
              </div>
              <div>
                <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 600, fontSize: 14, color: '#fff', marginBottom: 4 }}>Become a partner</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Interested in a volume partnership? We'd love to talk.</div>
              </div>
            </div>
          </div>

          {/* Right form */}
          <div style={{ background: '#fff', borderRadius: 20, padding: 36, border: '1px solid #E5E5E5' }}>
            <h3 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 600, marginBottom: 6 }}>Send us a message</h3>
            <p style={{ color: '#9B9B9B', fontSize: 14, marginBottom: 28 }}>We typically respond within a few hours.</p>

            {sent ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div style={{ width: 60, height: 60, background: '#DCFCE7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                  <CheckCircle size={28} color="#16A34A" />
                </div>
                <h4 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 600, marginBottom: 8 }}>Message Sent!</h4>
                <p style={{ color: '#6B6B6B', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>Thanks for reaching out. We'll get back to you within 24 hours.</p>
                <button style={{ background: '#FF5E14', color: '#fff', padding: '10px 24px', borderRadius: 8, fontWeight: 600, border: 'none', cursor: 'pointer', fontSize: 14 }} onClick={() => setSent(false)}>Send another</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate>
                {errors._form && (
                  <div style={{ background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#DC2626' }}>{errors._form}</div>
                )}
                <div className="lp-form-row">
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 500, color: '#6B6B6B', display: 'block', marginBottom: 6 }}>Name <span style={{ color: '#EF4444' }}>*</span></label>
                    <input className="lp-input" value={form.name} onChange={e => set('name', e.target.value, 80)} placeholder="Jane Doe" maxLength={80} autoComplete="name" style={errors.name ? { borderColor: '#EF4444' } : {}} />
                    {errors.name && <span style={{ fontSize: 11, color: '#EF4444', marginTop: 3, display: 'block' }}>{errors.name}</span>}
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 500, color: '#6B6B6B', display: 'block', marginBottom: 6 }}>Email <span style={{ color: '#EF4444' }}>*</span></label>
                    <input type="email" className="lp-input" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value.slice(0, 120) }))} placeholder="jane@company.com" maxLength={120} autoComplete="email" style={errors.email ? { borderColor: '#EF4444' } : {}} />
                    {errors.email && <span style={{ fontSize: 11, color: '#EF4444', marginTop: 3, display: 'block' }}>{errors.email}</span>}
                  </div>
                </div>
                <div className="lp-form-row">
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 500, color: '#6B6B6B', display: 'block', marginBottom: 6 }}>Phone</label>
                    <input className="lp-input" value={form.phone} onChange={e => set('phone', e.target.value, 30)} placeholder="+254 712 345 678" maxLength={30} autoComplete="tel" />
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 500, color: '#6B6B6B', display: 'block', marginBottom: 6 }}>Subject</label>
                    <input className="lp-input" value={form.subject} onChange={e => set('subject', e.target.value, 120)} placeholder="How can we help?" maxLength={120} />
                  </div>
                </div>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#6B6B6B', display: 'block', marginBottom: 6 }}>
                    Message <span style={{ color: '#EF4444' }}>*</span>
                    <span style={{ float: 'right', fontWeight: 400, fontSize: 11, color: form.message.length > 1800 ? '#EF4444' : '#9CA3AF' }}>{form.message.length}/2000</span>
                  </label>
                  <textarea className="lp-input" rows={5} value={form.message} onChange={e => set('message', e.target.value, 2000)} placeholder="Tell us about your delivery needs…" maxLength={2000} style={{ resize: 'vertical', ...(errors.message ? { borderColor: '#EF4444' } : {}) }} />
                  {errors.message && <span style={{ fontSize: 11, color: '#EF4444', marginTop: 3, display: 'block' }}>{errors.message}</span>}
                </div>
                <button type="submit" style={{ width: '100%', background: '#FF5E14', color: '#fff', padding: '13px', borderRadius: 8, fontWeight: 600, fontSize: 15, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'background 0.15s' }} disabled={loading}
                  onMouseEnter={e => { if (!loading) e.currentTarget.style.background='#D94E0A' }}
                  onMouseLeave={e => e.currentTarget.style.background='#FF5E14'}>
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

// ── Floating CTA ─────────────────────────────────────────────────────────────
function FloatingCTA() {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const fn = () => setVisible(window.scrollY > 600)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])
  return (
    <Link to="/register" style={{
      position: 'fixed', bottom: 28, left: 28, zIndex: 900,
      background: '#FF5E14', color: '#fff', padding: '13px 22px',
      borderRadius: 50, fontWeight: 700, fontSize: 14, textDecoration: 'none',
      boxShadow: '0 4px 20px rgba(255,94,20,0.45)',
      display: 'flex', alignItems: 'center', gap: 8,
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(12px)',
      pointerEvents: visible ? 'auto' : 'none',
      transition: 'opacity 0.25s, transform 0.25s',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform='scale(1.06)'; e.currentTarget.style.boxShadow='0 6px 28px rgba(255,94,20,0.55)' }}
      onMouseLeave={e => { e.currentTarget.style.transform='scale(1)'; e.currentTarget.style.boxShadow='0 4px 20px rgba(255,94,20,0.45)' }}>
      <Truck size={15} /> Get Started
    </Link>
  )
}

// ── Footer ────────────────────────────────────────────────────────────────────
const SOCIAL_ICONS = { twitter: SvgTwitterX, linkedin: SvgLinkedin, instagram: SvgInstagram, facebook: SvgFacebook, tiktok: SvgTikTok }

function FooterLink({ href, children }) {
  const isInternal = href && (href.startsWith('/') || href.startsWith('#'))
  const style = { fontSize: 13, color: 'rgba(255,255,255,0.45)', textDecoration: 'none', transition: 'color 0.15s' }
  const enter = e => { e.target.style.color = '#FF5E14' }
  const leave = e => { e.target.style.color = 'rgba(255,255,255,0.45)' }
  if (href?.startsWith('/')) {
    return <Link to={href} style={style} onMouseEnter={enter} onMouseLeave={leave}>{children}</Link>
  }
  return <a href={href ?? '#'} style={style} onMouseEnter={enter} onMouseLeave={leave}>{children}</a>
}

export function Footer({ footer = {}, contact = {}, seo = {}, branding = {} }) {
  const tagline     = footer.company_tagline  ?? 'A real-time last-mile logistics platform. Package-level intelligence, deterministic dispatching, and transparency-driven delivery trust.'
  const navLinks    = footer.nav_links        ?? []
  const solLinks    = footer.solutions_links  ?? []
  const coLinks     = footer.company_links    ?? []
  const copyright   = footer.copyright       ?? 'SendTrack Ltd. All rights reserved.'
  const siteName    = seo.site_name           ?? 'SendTrack Ltd'

  const socials = ['twitter','linkedin','instagram','facebook'].filter(k => footer[`social_${k}`])

  return (
    <footer style={{ background: '#0D0D0D', color: 'rgba(255,255,255,0.55)' }}>
      <style>{`
        .lp-footer-grid   { display: grid; grid-template-columns: 1.8fr 1fr 1fr 1fr; gap: 48px; padding-bottom: 48px; border-bottom: 1px solid rgba(255,255,255,0.07); }
        .lp-footer-bottom { display: flex; align-items: center; justify-content: space-between; }
        @media(max-width:1024px) { .lp-footer-grid { grid-template-columns: 1fr 1fr; gap: 32px; } }
        @media(max-width:768px)  {
          .lp-footer-grid   { grid-template-columns: 1fr; gap: 28px; }
          .lp-footer-bottom { flex-direction: column; gap: 12px; text-align: center; }
        }
      `}</style>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '64px 24px 0' }}>
        <div className="lp-footer-grid">

          {/* Brand column */}
          <div>
            <div style={{ marginBottom: 18, color: '#fff' }}>
              <SiteLogo logoUrl={branding.logo_url} siteName={siteName} height={36} />
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.85, maxWidth: 270, marginBottom: 24 }}>{tagline}</p>

            {/* Contact icons */}
            <div style={{ display: 'flex', gap: 8, marginBottom: socials.length ? 16 : 0 }}>
              {[
                { Icon: Phone, href: `tel:${contact.phone ?? '+254746556931'}` },
                { Icon: Mail,  href: `mailto:${contact.email ?? 'info@sendtrack.co.ke'}` },
                { Icon: MapPin,href: '#contact' },
              ].map(({ Icon, href }, i) => (
                <a key={i} href={href} style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.06)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s', textDecoration: 'none' }}
                  onMouseEnter={e => e.currentTarget.style.background='rgba(255,94,20,0.2)'}
                  onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.06)'}>
                  <Icon size={15} color="rgba(255,255,255,0.5)" />
                </a>
              ))}
            </div>

            {/* Social icons */}
            {socials.length > 0 && (
              <div style={{ display: 'flex', gap: 8 }}>
                {socials.map(k => {
                  const Icon = SOCIAL_ICONS[k]
                  return (
                    <a key={k} href={footer[`social_${k}`]} target="_blank" rel="noopener noreferrer"
                      style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.06)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background='rgba(255,94,20,0.2)'}
                      onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.06)'}>
                      <Icon size={15} color="rgba(255,255,255,0.5)" />
                    </a>
                  )
                })}
              </div>
            )}
          </div>

          {/* Nav links column */}
          {navLinks.length > 0 && (
            <div>
              <h4 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 600, fontSize: 13, color: '#fff', marginBottom: 18, textTransform: 'uppercase', letterSpacing: '0.6px' }}>Navigation</h4>
              <ul style={{ listStyle: 'none' }}>
                {navLinks.map(({ label, href }) => (
                  <li key={label} style={{ marginBottom: 12 }}>
                    <FooterLink href={href}>{label}</FooterLink>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Solutions column */}
          {solLinks.length > 0 && (
            <div>
              <h4 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 600, fontSize: 13, color: '#fff', marginBottom: 18, textTransform: 'uppercase', letterSpacing: '0.6px' }}>Our Solutions</h4>
              <ul style={{ listStyle: 'none' }}>
                {solLinks.map(({ label, href }) => (
                  <li key={label} style={{ marginBottom: 12 }}>
                    <FooterLink href={href}>{label}</FooterLink>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Company column */}
          {coLinks.length > 0 && (
            <div>
              <h4 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 600, fontSize: 13, color: '#fff', marginBottom: 18, textTransform: 'uppercase', letterSpacing: '0.6px' }}>Company</h4>
              <ul style={{ listStyle: 'none' }}>
                {coLinks.map(({ label, href }) => (
                  <li key={label} style={{ marginBottom: 12 }}>
                    <FooterLink href={href}>{label}</FooterLink>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Bottom bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 0', borderTop: '1px solid rgba(255,255,255,0.07)', flexWrap: 'wrap', gap: 12 }} className="lp-footer-bottom">
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
            © {new Date().getFullYear()} {copyright}
          </span>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <Link to="/terms"   style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }} onMouseEnter={e => e.target.style.color='#FF5E14'} onMouseLeave={e => e.target.style.color='rgba(255,255,255,0.35)'}>Terms</Link>
            <Link to="/privacy" style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }} onMouseEnter={e => e.target.style.color='#FF5E14'} onMouseLeave={e => e.target.style.color='rgba(255,255,255,0.35)'}>Privacy</Link>
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

  // SEO: update document.title + meta tags when data loads
  useEffect(() => {
    const seo = d.landing_seo ?? {}
    if (!seo.meta_title) return

    document.title = seo.meta_title

    const setMeta = (name, content, attr = 'name') => {
      if (!content) return
      let el = document.querySelector(`meta[${attr}="${name}"]`)
      if (!el) { el = document.createElement('meta'); el.setAttribute(attr, name); document.head.appendChild(el) }
      el.setAttribute('content', content)
    }

    setMeta('description',       seo.meta_description)
    setMeta('keywords',          seo.meta_keywords)
    setMeta('og:title',          seo.meta_title,       'property')
    setMeta('og:description',    seo.meta_description, 'property')
    setMeta('og:image',          seo.og_image,         'property')
    setMeta('og:url',            seo.og_url,           'property')
    setMeta('twitter:title',     seo.meta_title)
    setMeta('twitter:description', seo.meta_description)
    setMeta('twitter:image',     seo.og_image)
  }, [d.landing_seo])

  return (
    <div className="lp">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Plus+Jakarta+Sans:wght@600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        .lp { font-family: 'DM Sans', sans-serif; }
        @keyframes spin       { to { transform: rotate(360deg); } }
        @keyframes lp-scroll  { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes lp-float   { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-14px); } }
        @keyframes lp-pulse   { 0%,100% { opacity:1; box-shadow:0 0 0 0 rgba(74,222,128,0.45); } 60% { opacity:0.85; box-shadow:0 0 0 7px rgba(74,222,128,0); } }

        /* scroll reveal */
        .lp-reveal { opacity: 0; transform: translateY(22px); transition: opacity 0.55s ease, transform 0.55s ease; }
        .lp-vis    { opacity: 1 !important; transform: none !important; }
        .lp-d1 { transition-delay: 0.06s; }
        .lp-d2 { transition-delay: 0.14s; }
        .lp-d3 { transition-delay: 0.22s; }
        .lp-d4 { transition-delay: 0.30s; }
        .lp-d5 { transition-delay: 0.38s; }
        .lp-d6 { transition-delay: 0.46s; }

        /* hero 2-col layout */
        .lp-hero-layout { display: flex; flex-direction: column; }
        .lp-hero-card   { display: none; }
        @media(min-width:960px) {
          .lp-hero-layout { display: grid; grid-template-columns: 1fr 400px; gap: 64px; align-items: center; }
          .lp-hero-card   { display: block; position: relative; }
        }

        /* ── input ── */
        .lp-input {
          border: 1px solid #E5E5E5; border-radius: 8px; padding: 10px 14px;
          font-size: 14px; color: #0D0D0D; background: #fff; outline: none;
          width: 100%; font-family: 'DM Sans', sans-serif; transition: border-color 0.15s;
        }
        .lp-input:focus { border-color: #FF5E14; }

        /* ── trust bar scroll ── */
        .lp-trust-scroll {
          display: flex; white-space: nowrap;
          animation: lp-scroll 22s linear infinite;
        }

        /* ── section padding ── */
        .lp-pad { padding: 96px 24px; }

        /* ── stats band ── */
        .lp-stats-band { display: grid; grid-template-columns: repeat(4,1fr); gap: 0; }

        /* ── grids ── */
        .lp-about-grid       { display: grid; grid-template-columns: 1fr 1fr; gap: 64px; align-items: center; }
        .lp-services-grid    { display: grid; grid-template-columns: repeat(3,1fr); gap: 24px; }
        .lp-steps-grid       { display: grid; grid-template-columns: repeat(4,1fr); gap: 32px; }
        .lp-whyus-grid       { display: grid; grid-template-columns: repeat(3,1fr); gap: 20px; }
        .lp-testimonials-grid{ display: grid; grid-template-columns: repeat(3,1fr); gap: 24px; }
        .lp-news-grid        { display: grid; grid-template-columns: repeat(3,1fr); gap: 24px; }
        .lp-contact-grid     { display: grid; grid-template-columns: 1fr 1.5fr; gap: 40px; }
        .lp-footer-grid      { display: grid; grid-template-columns: 1.8fr 1fr 1fr 1fr; gap: 48px; padding-bottom: 48px; border-bottom: 1px solid rgba(255,255,255,0.07); }
        .lp-form-row         { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }

        /* ── service card ── */
        .lp-service-card {
          background: #fff; border-radius: 16px; padding: 28px 24px;
          border: 1px solid #E5E5E5; display: flex; flex-direction: column;
          transition: box-shadow 0.2s, transform 0.2s, border-color 0.2s;
          cursor: default;
        }
        .lp-service-card:hover { box-shadow: 0 8px 32px rgba(0,0,0,0.08); transform: translateY(-3px); border-color: rgba(255,94,20,0.2); }
        .lp-service-card:hover .lp-service-icon { background: #FF5E14 !important; }
        .lp-service-card:hover .lp-service-icon svg { color: #fff !important; }

        /* ── step connector ── */
        .lp-step-connector {
          position: absolute; top: 32px; left: 60%; width: 80%; height: 1px;
          background: #E5E5E5; z-index: 0;
        }

        /* ── nav ── */
        .lp-desktop-nav { display: flex; }
        .lp-mobile-btn  { display: none; background: none; border: none; cursor: pointer; padding: 4px; }
        .lp-nav-auth    { display: flex; }

        /* ── footer bottom ── */
        .lp-footer-bottom { display: flex; align-items: center; justify-content: space-between; }

        /* ── 1024px ── */
        @media(max-width:1024px) {
          .lp-services-grid     { grid-template-columns: repeat(2,1fr); }
          .lp-whyus-grid        { grid-template-columns: repeat(2,1fr); }
          .lp-testimonials-grid { grid-template-columns: repeat(2,1fr); }
          .lp-news-grid         { grid-template-columns: repeat(2,1fr); }
          .lp-steps-grid        { grid-template-columns: repeat(2,1fr); }
          .lp-footer-grid       { grid-template-columns: 1fr 1fr; gap: 32px; }
          .lp-about-grid        { gap: 40px; }
          .lp-stats-band        { grid-template-columns: repeat(2,1fr); }
        }

        /* ── 768px ── */
        @media(max-width:768px) {
          .lp-pad               { padding: 60px 20px; }
          .lp-desktop-nav       { display: none !important; }
          .lp-mobile-btn        { display: block !important; }
          .lp-nav-auth          { display: none !important; }
          .lp-quote-grid        { grid-template-columns: 1fr !important; }
          .lp-quote-grid > *:nth-child(2) { display: none !important; }
          .lp-about-grid        { grid-template-columns: 1fr; gap: 32px; }
          .lp-services-grid     { grid-template-columns: 1fr; }
          .lp-whyus-grid        { grid-template-columns: 1fr; }
          .lp-steps-grid        { grid-template-columns: repeat(2,1fr) !important; }
          .lp-testimonials-grid { grid-template-columns: 1fr; }
          .lp-news-grid         { grid-template-columns: 1fr; }
          .lp-contact-grid      { grid-template-columns: 1fr; gap: 28px; }
          .lp-footer-grid       { grid-template-columns: 1fr; gap: 28px; }
          .lp-form-row          { grid-template-columns: 1fr; }
          .lp-footer-bottom     { flex-direction: column; gap: 12px; text-align: center; }
          .lp-step-connector    { display: none !important; }
          .lp-hero-btns         { flex-direction: column; align-items: flex-start; }
          .lp-stats-row         { gap: 20px; }
          .lp-stats-band        { grid-template-columns: repeat(2,1fr); }
        }

        /* ── 480px ── */
        @media(max-width:480px) {
          .lp-steps-grid   { grid-template-columns: 1fr !important; }
          .lp-stats-band   { grid-template-columns: 1fr 1fr; }
          .lp-track-addrs  { grid-template-columns: 1fr !important; }
          .lp-track-steps  { gap: 4px; }
          .lp-track-steps span { font-size: 9px !important; }
        }
      `}</style>

      <Navbar logoUrl={d.branding?.logo_url} siteName={d.landing_seo?.site_name} />
      <Hero         c={d.landing_hero} />
      <QuoteCalculator waPhone={d.landing_contact?.whatsapp ? (d.landing_contact.whatsapp.replace(/\D/g,'').replace(/^0/,'254')) : '254708919320'} categories={d.upcountry_rates} />
      <TrustBar />
      <StatsBand />
      <About        c={d.landing_about} />
      <Services     c={d.landing_services} />
      <HowItWorks   c={d.landing_howitworks} />
      <TrackingWidget />
      <WhyUs        c={d.landing_whyus} />
      <Testimonials />
      <FAQ />
      <CtaBanner />
      <News         c={d.landing_news} />
      <Contact      c={d.landing_contact} />
      <Footer       footer={d.landing_footer} contact={d.landing_contact} seo={d.landing_seo} branding={d.branding} />
      <FloatingCTA />
      <WhatsAppWidget phone={d.landing_contact?.whatsapp} agentName={d.landing_seo?.site_name ?? 'Sendtrack Support'} />
    </div>
  )
}
