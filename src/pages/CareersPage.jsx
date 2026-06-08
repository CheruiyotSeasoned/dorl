import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { ArrowLeft, MapPin, Clock, ArrowRight } from 'lucide-react'
import SiteLogo from '../components/SiteLogo'

const API = (import.meta.env.VITE_API_URL ?? 'http://localhost:8000') + '/api'

const OPENINGS = [
  {
    title: 'Motorcycle Delivery Rider',
    type: 'Contract',
    location: 'Nairobi, Kenya',
    desc: 'Join our growing fleet of riders delivering packages across Nairobi. Own a motorcycle, valid PSV/DL licence required.',
  },
  {
    title: 'Operations Coordinator',
    type: 'Full-time',
    location: 'Nairobi, Kenya',
    desc: 'Help manage daily dispatch operations, coordinate riders, and ensure SLAs are met across our pickup and delivery network.',
  },
  {
    title: 'Software Engineer (Full-Stack)',
    type: 'Full-time',
    location: 'Remote / Nairobi',
    desc: 'Build and scale the SendTrack platform. Laravel + React stack. Experience with real-time systems a big plus.',
  },
  {
    title: 'Station Agent',
    type: 'Part-time',
    location: 'Various stations, Nairobi',
    desc: 'Manage parcel intake, QR check-in/check-out, and customer handoffs at a SendTrack pickup station near you.',
  },
]

export default function CareersPage() {
  const { data } = useQuery({
    queryKey: ['landing-content'],
    queryFn: () => axios.get(`${API}/landing`).then(r => r.data.data),
    staleTime: 5 * 60 * 1000,
  })
  const seo      = data?.landing_seo ?? {}
  const branding = data?.branding    ?? {}

  return (
    <div style={{ minHeight: '100vh', background: '#fafafa', fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Plus+Jakarta+Sans:wght@600;700&display=swap');`}</style>

      {/* Nav */}
      <nav style={{ background: '#0D0D0D', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: '#fff' }}>
          <SiteLogo logoUrl={branding.logo_url} siteName={seo.site_name ?? 'SendTrack Ltd'} height={34} />
        </Link>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.6)', fontSize: 13, textDecoration: 'none' }}>
          <ArrowLeft size={14} /> Back to Home
        </Link>
      </nav>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg,#0D0D0D 0%,#1a1a1a 100%)', padding: '72px 24px 64px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,94,20,0.15)', border: '1px solid rgba(255,94,20,0.3)', borderRadius: 20, padding: '6px 16px', marginBottom: 24 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#FF5E14' }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: '#FF5E14', letterSpacing: '0.5px', textTransform: 'uppercase' }}>We're Hiring</span>
        </div>
        <h1 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 40, fontWeight: 700, color: '#fff', marginBottom: 16, lineHeight: 1.15 }}>
          Grow with SendTrack
        </h1>
        <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)', maxWidth: 520, margin: '0 auto' }}>
          We're building Kenya's most reliable last-mile logistics network. Join a fast-moving team that ships real products to real people every day.
        </p>
      </div>

      {/* Openings */}
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '64px 24px 80px' }}>
        <h2 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 22, fontWeight: 700, color: '#0D0D0D', marginBottom: 32 }}>
          Open Positions
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {OPENINGS.map(job => (
            <div key={job.title} style={{ background: '#fff', border: '1px solid #E5E5E5', borderRadius: 12, padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 10, transition: 'box-shadow 0.2s', cursor: 'default' }}
              onMouseEnter={e => e.currentTarget.style.boxShadow='0 4px 20px rgba(0,0,0,0.07)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow='none'}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                <h3 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: 16, color: '#0D0D0D', margin: 0 }}>{job.title}</h3>
                <span style={{ background: '#FFF3ED', color: '#FF5E14', fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 20 }}>{job.type}</span>
              </div>
              <div style={{ display: 'flex', gap: 20 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#888' }}><MapPin size={12} />{job.location}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#888' }}><Clock size={12} />{job.type}</span>
              </div>
              <p style={{ fontSize: 14, color: '#555', lineHeight: 1.7, margin: 0 }}>{job.desc}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ marginTop: 48, background: '#0D0D0D', borderRadius: 16, padding: '36px 32px', textAlign: 'center' }}>
          <h3 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: 20, color: '#fff', marginBottom: 10 }}>
            Don't see your role?
          </h3>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', marginBottom: 24 }}>
            Send us your CV and tell us how you'd add value to the team.
          </p>
          <a href="mailto:careers@sendtrack.co.ke"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#FF5E14', color: '#fff', padding: '12px 24px', borderRadius: 8, fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>
            Email Your CV <ArrowRight size={14} />
          </a>
        </div>
      </div>

      {/* Footer strip */}
      <div style={{ background: '#0D0D0D', padding: '24px', textAlign: 'center' }}>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: 0 }}>
          © {new Date().getFullYear()} SendTrack Ltd. All rights reserved.
          &nbsp;·&nbsp;
          <Link to="/terms" style={{ color: 'rgba(255,255,255,0.45)', textDecoration: 'none' }}>Terms</Link>
          &nbsp;·&nbsp;
          <Link to="/privacy" style={{ color: 'rgba(255,255,255,0.45)', textDecoration: 'none' }}>Privacy</Link>
        </p>
      </div>
    </div>
  )
}
