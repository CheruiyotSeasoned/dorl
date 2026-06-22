import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Plus, Trash2, Pencil, X, Upload, Loader2 } from 'lucide-react'
import api from '../lib/api'
import { buildLogoUrl } from '../components/SiteLogo'

const blank = { title: '', category: '', excerpt: '', cover_image_url: '', body: '', status: 'draft' }
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''

export default function BlogAdminPage() {
  const qc = useQueryClient()
  const [editing, setEditing] = useState(null)   // null = closed, {} = new, {...} = edit
  const [form, setForm] = useState(blank)
  const [uploading, setUploading] = useState(false)

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['admin-posts'],
    queryFn: () => api.get('/admin/posts').then(r => r.data.data),
  })

  const open = (post) => {
    setForm(post ? { ...blank, ...post } : blank)
    setEditing(post ?? {})
  }
  const close = () => { setEditing(null); setForm(blank) }
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const save = useMutation({
    mutationFn: () => editing?.id
      ? api.put(`/admin/posts/${editing.id}`, form)
      : api.post('/admin/posts', form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-posts'] }); qc.invalidateQueries({ queryKey: ['posts'] }); toast.success('Saved'); close() },
    onError: (e) => toast.error(e.response?.data?.message || 'Save failed'),
  })

  const remove = useMutation({
    mutationFn: (id) => api.delete(`/admin/posts/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-posts'] }); qc.invalidateQueries({ queryKey: ['posts'] }); toast.success('Deleted') },
    onError: () => toast.error('Delete failed'),
  })

  const uploadCover = async (file) => {
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const r = await api.post('/admin/posts/cover', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      set('cover_image_url', r.data.data.url)
      toast.success('Cover uploaded')
    } catch (e) {
      toast.error(e.response?.data?.message || 'Upload failed')
    } finally { setUploading(false) }
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0 }}>Blog</h1>
          <p className="text-muted text-sm" style={{ margin: '4px 0 0' }}>Write and publish posts shown on /blog and the landing page.</p>
        </div>
        <button className="btn btn-primary" style={{ marginLeft: 'auto' }} onClick={() => open(null)}><Plus size={16} /> New post</button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {isLoading ? <div style={{ padding: 20 }} className="text-muted">Loading…</div>
        : posts.length === 0 ? <div style={{ padding: 20 }} className="text-muted">No posts yet. Click “New post”.</div>
        : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', fontSize: 12, color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '12px 16px' }}>Title</th><th>Status</th><th>Category</th><th>Date</th><th></th>
              </tr>
            </thead>
            <tbody>
              {posts.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid var(--border)', fontSize: 14 }}>
                  <td style={{ padding: '12px 16px', fontWeight: 600 }}>{p.title}</td>
                  <td><span style={{ fontSize: 12, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: p.status === 'published' ? 'rgba(22,163,74,0.12)' : 'rgba(156,163,175,0.18)', color: p.status === 'published' ? '#16a34a' : '#6b7280' }}>{p.status}</span></td>
                  <td style={{ color: 'var(--text-secondary)' }}>{p.category || '—'}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{fmtDate(p.published_at)}</td>
                  <td style={{ textAlign: 'right', paddingRight: 16, whiteSpace: 'nowrap' }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => open(p)}><Pencil size={14} /></button>
                    <button className="btn btn-ghost btn-sm" style={{ color: '#dc2626' }} onClick={() => window.confirm('Delete this post?') && remove.mutate(p.id)}><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Editor drawer */}
      {editing && (
        <>
          <div onClick={close} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200 }} />
          <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '100%', maxWidth: 600, background: 'var(--surface)', zIndex: 201, overflowY: 'auto', boxShadow: '-8px 0 30px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ margin: 0 }}>{editing?.id ? 'Edit post' : 'New post'}</h3>
              <button className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }} onClick={close}><X size={18} /></button>
            </div>
            <div style={{ padding: 20 }}>
              <div className="form-group"><label className="form-label">Title *</label>
                <input className="form-control" value={form.title} onChange={e => set('title', e.target.value)} placeholder="Post title" /></div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group"><label className="form-label">Category</label>
                  <input className="form-control" value={form.category} onChange={e => set('category', e.target.value)} placeholder="e.g. Logistics" /></div>
                <div className="form-group"><label className="form-label">Status</label>
                  <select className="form-control" value={form.status} onChange={e => set('status', e.target.value)}>
                    <option value="draft">Draft</option><option value="published">Published</option>
                  </select></div>
              </div>

              <div className="form-group"><label className="form-label">Excerpt</label>
                <textarea className="form-control" rows={2} value={form.excerpt} onChange={e => set('excerpt', e.target.value)} placeholder="Short summary shown on cards" maxLength={500} /></div>

              <div className="form-group">
                <label className="form-label">Cover image</label>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{ width: 96, height: 64, borderRadius: 8, background: '#f3f4f6', backgroundImage: form.cover_image_url ? `url(${buildLogoUrl(form.cover_image_url)})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', flexShrink: 0, border: '1px solid var(--border)' }} />
                  <label className="btn btn-ghost btn-sm" style={{ cursor: 'pointer' }}>
                    {uploading ? <Loader2 size={14} className="spin" /> : <Upload size={14} />} {uploading ? 'Uploading…' : 'Upload'}
                    <input type="file" accept="image/*" hidden onChange={e => uploadCover(e.target.files?.[0])} />
                  </label>
                </div>
              </div>

              <div className="form-group"><label className="form-label">Body</label>
                <textarea className="form-control" rows={14} value={form.body} onChange={e => set('body', e.target.value)} placeholder="Write your post… (blank line = new paragraph)" style={{ fontFamily: 'inherit', lineHeight: 1.6 }} /></div>

              <button className="btn btn-primary" style={{ width: '100%' }} disabled={!form.title || save.isPending} onClick={() => save.mutate()}>
                {save.isPending ? <><Loader2 size={16} className="spin" /> Saving…</> : (form.status === 'published' ? 'Publish' : 'Save draft')}
              </button>
            </div>
          </div>
          <style>{`.spin { animation: blogspin 1s linear infinite } @keyframes blogspin { to { transform: rotate(360deg) } }`}</style>
        </>
      )}
    </div>
  )
}
