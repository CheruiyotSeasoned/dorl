import { Truck } from 'lucide-react'

const API = (import.meta.env.VITE_API_URL ?? 'http://localhost:8000') + '/api'

export function buildLogoUrl(path) {
  if (!path) return null
  if (path.startsWith('http')) return path
  const base = (import.meta.env.VITE_API_URL ?? 'http://localhost:8000')
  return base + path
}

export default function SiteLogo({ logoUrl, siteName = 'SendTrack Ltd', height = 36 }) {
  if (logoUrl) {
    return (
      <img
        src={buildLogoUrl(logoUrl)}
        alt={siteName}
        style={{ height, width: 'auto', objectFit: 'contain', display: 'block' }}
      />
    )
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ width: height, height, background: '#FF5E14', borderRadius: Math.round(height * 0.25), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Truck size={Math.round(height * 0.5)} color="#fff" />
      </div>
      <span style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: Math.round(height * 0.5), color: 'inherit' }}>{siteName}</span>
    </div>
  )
}
