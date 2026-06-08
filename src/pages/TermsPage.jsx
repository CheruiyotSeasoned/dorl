import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { ArrowLeft } from 'lucide-react'
import SiteLogo from '../components/SiteLogo'

const API = (import.meta.env.VITE_API_URL ?? 'http://localhost:8000') + '/api'

function renderMarkdown(text = '') {
  return text
    .split('\n\n')
    .map((para, i) => {
      const html = para
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
      return `<p key="${i}">${html}</p>`
    })
    .join('')
}

export default function TermsPage() {
  const { data } = useQuery({
    queryKey: ['landing-content'],
    queryFn: () => axios.get(`${API}/landing`).then(r => r.data.data),
    staleTime: 5 * 60 * 1000,
  })

  const seo      = data?.landing_seo    ?? {}
  const legal    = data?.landing_legal  ?? {}
  const footer   = data?.landing_footer ?? {}
  const branding = data?.branding       ?? {}

  const title   = legal.terms_title   ?? 'Terms & Conditions'
  const updated = legal.terms_updated ?? 'June 2026'
  const content = legal.terms_content ?? ''

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

      {/* Content */}
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '56px 24px 80px' }}>
        <div style={{ marginBottom: 40 }}>
          <h1 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 36, fontWeight: 700, color: '#0D0D0D', marginBottom: 8, lineHeight: 1.15 }}>
            {title}
          </h1>
          <p style={{ fontSize: 13, color: '#888' }}>Last updated: {updated}</p>
        </div>

        <div
          style={{ fontSize: 15, lineHeight: 1.85, color: '#333' }}
          dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
        />

        <style>{`
          strong { color: #0D0D0D; font-weight: 600; }
          p { margin-bottom: 20px; }
        `}</style>
      </div>

      {/* Footer strip */}
      <div style={{ background: '#0D0D0D', padding: '24px', textAlign: 'center' }}>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: 0 }}>
          © {new Date().getFullYear()} {footer.copyright ?? 'SendTrack Ltd. All rights reserved.'}
          &nbsp;·&nbsp;
          <Link to="/terms" style={{ color: '#FF5E14', textDecoration: 'none' }}>Terms</Link>
          &nbsp;·&nbsp;
          <Link to="/privacy" style={{ color: 'rgba(255,255,255,0.45)', textDecoration: 'none' }}>Privacy</Link>
        </p>
      </div>
    </div>
  )
}
