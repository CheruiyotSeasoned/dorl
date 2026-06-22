import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

const API = (import.meta.env.VITE_API_URL ?? 'http://localhost:8000') + '/api'

export function buildLogoUrl(path) {
  if (!path) return null
  if (path.startsWith('http')) return path
  const base = (import.meta.env.VITE_API_URL ?? 'http://localhost:8000')
  return base + path
}

/**
 * Brand logo — always the admin-controlled logo (Settings → Branding).
 * If a logoUrl is passed it's used directly; otherwise we fetch the public
 * branding from /api/landing. No generic placeholder is ever shown — while the
 * logo loads we fall back to the site name text only.
 */
export default function SiteLogo({ logoUrl, siteName, height = 36, color }) {
  const { data } = useQuery({
    queryKey: ['landing-content'],
    queryFn: () => axios.get(`${API}/landing`).then(r => r.data.data),
    staleTime: 10 * 60 * 1000,
    enabled: !logoUrl,           // only fetch when a logo wasn't supplied
  })

  const url  = logoUrl ?? data?.branding?.logo_url
  const name = siteName ?? data?.landing_seo?.site_name ?? 'SendTrack'

  if (url) {
    return (
      <img
        src={buildLogoUrl(url)}
        alt={name}
        style={{ height, width: 'auto', objectFit: 'contain', display: 'block' }}
      />
    )
  }

  return (
    <span style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, fontSize: Math.round(height * 0.52), color: color ?? 'inherit', whiteSpace: 'nowrap' }}>
      {name}
    </span>
  )
}
