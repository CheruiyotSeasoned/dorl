import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '../lib/api'
import PublicLayout from '../components/PublicLayout'
import { buildLogoUrl } from '../components/SiteLogo'

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''

export default function BlogPage() {
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['posts'],
    queryFn: () => api.get('/posts', { params: { limit: 50 } }).then(r => r.data.data),
  })

  return (
    <PublicLayout>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 20px 72px' }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#FF5E14', textTransform: 'uppercase', letterSpacing: '1.2px' }}>Blog</span>
        <h1 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 'clamp(26px,4vw,40px)', margin: '8px 0 6px' }}>Latest from SendTrack</h1>
        <p style={{ color: '#6B6B6B', fontSize: 15, maxWidth: 560 }}>News, product updates and stories from the SendTrack network.</p>

        {isLoading ? (
          <p style={{ color: '#9ca3af', marginTop: 40 }}>Loading…</p>
        ) : posts.length === 0 ? (
          <p style={{ color: '#9ca3af', marginTop: 40 }}>No posts yet — check back soon.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24, marginTop: 36 }}>
            {posts.map(p => (
              <Link key={p.slug} to={`/blog/${p.slug}`} style={{ textDecoration: 'none', color: 'inherit', border: '1px solid #ececec', borderRadius: 14, overflow: 'hidden', background: '#fff', display: 'flex', flexDirection: 'column', transition: 'box-shadow .15s, transform .15s' }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none' }}>
                <div style={{ height: 170, background: '#f3f4f6', backgroundImage: p.cover_image_url ? `url(${buildLogoUrl(p.cover_image_url)})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }} />
                <div style={{ padding: 18, flex: 1, display: 'flex', flexDirection: 'column' }}>
                  {p.category && <span style={{ fontSize: 11, fontWeight: 700, color: '#FF5E14', textTransform: 'uppercase', letterSpacing: '0.6px' }}>{p.category}</span>}
                  <h3 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 18, margin: '6px 0 8px', lineHeight: 1.3 }}>{p.title}</h3>
                  <p style={{ color: '#6B6B6B', fontSize: 14, lineHeight: 1.6, flex: 1 }}>{p.excerpt}</p>
                  <div style={{ marginTop: 12, fontSize: 12, color: '#9ca3af' }}>{[p.author, fmtDate(p.published_at)].filter(Boolean).join(' · ')}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </PublicLayout>
  )
}
