import { useQuery } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import api from '../lib/api'
import PublicLayout from '../components/PublicLayout'
import { buildLogoUrl } from '../components/SiteLogo'

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : ''

export default function BlogPostPage() {
  const { slug } = useParams()
  const { data: post, isLoading, isError } = useQuery({
    queryKey: ['post', slug],
    queryFn: () => api.get(`/posts/${slug}`).then(r => r.data.data),
    retry: false,
  })

  return (
    <PublicLayout>
      <article style={{ maxWidth: 760, margin: '0 auto', padding: '40px 20px 72px' }}>
        <Link to="/blog" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#6B6B6B', textDecoration: 'none', fontSize: 14, marginBottom: 24 }}>
          <ArrowLeft size={16} /> Back to blog
        </Link>

        {isLoading ? (
          <p style={{ color: '#9ca3af' }}>Loading…</p>
        ) : isError || !post ? (
          <p style={{ color: '#9ca3af' }}>This post couldn't be found. <Link to="/blog" style={{ color: '#FF5E14' }}>See all posts</Link>.</p>
        ) : (
          <>
            {post.category && <span style={{ fontSize: 12, fontWeight: 700, color: '#FF5E14', textTransform: 'uppercase', letterSpacing: '1px' }}>{post.category}</span>}
            <h1 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 'clamp(26px,4vw,40px)', lineHeight: 1.2, margin: '10px 0 12px' }}>{post.title}</h1>
            <div style={{ color: '#9ca3af', fontSize: 14, marginBottom: 24 }}>{[post.author, fmtDate(post.published_at)].filter(Boolean).join(' · ')}</div>

            {post.cover_image_url && (
              <img src={buildLogoUrl(post.cover_image_url)} alt={post.title}
                style={{ width: '100%', borderRadius: 14, marginBottom: 28, objectFit: 'cover', maxHeight: 420 }} />
            )}

            <div style={{ fontSize: 17, lineHeight: 1.8, color: '#1f2937' }}>
              {(post.body ?? '').split(/\n{2,}/).map((para, i) => (
                <p key={i} style={{ margin: '0 0 18px', whiteSpace: 'pre-wrap' }}>{para}</p>
              ))}
            </div>
          </>
        )}
      </article>
    </PublicLayout>
  )
}
