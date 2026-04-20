import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import toast from 'react-hot-toast'
import { Mail, Send, ChevronLeft, Inbox, PenSquare, X } from 'lucide-react'

function ThreadList({ threads, selectedId, onSelect }) {
  if (!threads.length) return <p className="text-muted text-sm" style={{ padding: 16 }}>No threads yet.</p>
  return (
    <div>
      {threads.map(t => {
        const preview = t.messages?.[0]
        const sender = preview?.from_address ?? (t.participants?.[0] ?? '—')
        return (
          <div
            key={t.id}
            onClick={() => onSelect(t)}
            style={{
              padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid var(--border)',
              background: selectedId === t.id ? 'var(--primary)08' : 'transparent',
              borderLeft: selectedId === t.id ? '3px solid var(--primary)' : '3px solid transparent',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
              <span style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>
                {t.subject ?? '(no subject)'}
              </span>
              <span className={`badge ${t.status === 'open' ? 'badge-success' : 'badge-neutral'}`} style={{ fontSize: 10 }}>{t.status}</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sender}</div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>
              {new Date(t.updated_at).toLocaleString()}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function MessageBubble({ msg }) {
  const isOutbound = msg.direction === 'outbound'
  return (
    <div style={{ display: 'flex', justifyContent: isOutbound ? 'flex-end' : 'flex-start', marginBottom: 12 }}>
      <div style={{
        maxWidth: '70%', padding: '10px 14px',
        borderRadius: isOutbound ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
        background: isOutbound ? 'var(--primary)' : 'var(--surface-muted)',
        color: isOutbound ? '#fff' : 'var(--text-primary)',
      }}>
        <div style={{ fontSize: 13, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
          {msg.body_html
            ? <span dangerouslySetInnerHTML={{ __html: msg.body_html }} />
            : msg.body_text}
        </div>
        <div style={{ fontSize: 10, marginTop: 4, opacity: 0.7, textAlign: isOutbound ? 'right' : 'left' }}>
          {msg.from_address} · {new Date(msg.created_at).toLocaleTimeString()}
        </div>
      </div>
    </div>
  )
}

function ThreadDetail({ thread, onBack }) {
  const qc = useQueryClient()
  const [reply, setReply] = useState('')

  const { data: threadData, isLoading } = useQuery({
    queryKey: ['email-thread', thread.id],
    queryFn: () => api.get(`/admin/email/threads/${thread.id}`).then(r => r.data.data),
    refetchInterval: 15_000,
  })

  const messages = threadData?.messages ?? []

  const sendMutation = useMutation({
    mutationFn: (body) => api.post(`/admin/email/threads/${thread.id}/reply`, { body }),
    onSuccess: () => {
      toast.success('Reply sent')
      setReply('')
      qc.invalidateQueries(['email-thread', thread.id])
      qc.invalidateQueries(['email-threads'])
    },
    onError: (err) => toast.error(err.response?.data?.error ?? 'Failed to send reply'),
  })

  const closeMutation = useMutation({
    mutationFn: () => api.patch(`/admin/email/threads/${thread.id}/close`),
    onSuccess: () => {
      toast.success('Thread closed')
      qc.invalidateQueries(['email-threads'])
      onBack()
    },
  })

  const sender = thread.participants?.[0] ?? messages.find(m => m.direction === 'inbound')?.from_address ?? '—'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 10, alignItems: 'center' }}>
        <button className="btn btn-ghost btn-sm" onClick={onBack}><ChevronLeft size={16} /></button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {thread.subject ?? '(no subject)'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{sender}</div>
        </div>
        {thread.status === 'open' && (
          <button className="btn btn-secondary btn-sm" onClick={() => closeMutation.mutate()} disabled={closeMutation.isPending}>
            Close
          </button>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}><span className="spinner" /></div>
        ) : messages.length === 0 ? (
          <p className="text-muted text-sm" style={{ textAlign: 'center', padding: 32 }}>No messages yet.</p>
        ) : (
          messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)
        )}
      </div>

      {thread.status !== 'closed' && (
        <div style={{ padding: 16, borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <textarea
              className="form-control"
              rows={3}
              placeholder="Type a reply…"
              value={reply}
              onChange={e => setReply(e.target.value)}
              style={{ flex: 1, resize: 'none' }}
              onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey && reply.trim()) sendMutation.mutate(reply) }}
            />
            <button
              className="btn btn-primary"
              style={{ alignSelf: 'flex-end' }}
              onClick={() => reply.trim() && sendMutation.mutate(reply)}
              disabled={sendMutation.isPending || !reply.trim()}
            >
              {sendMutation.isPending ? <span className="spinner" /> : <><Send size={14} /> Send</>}
            </button>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>Ctrl+Enter to send</div>
        </div>
      )}
    </div>
  )
}

function ComposeModal({ onClose }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({ to: '', subject: '', body: '' })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const mutation = useMutation({
    mutationFn: () => api.post('/admin/email/compose', form),
    onSuccess: () => {
      toast.success('Email sent!')
      qc.invalidateQueries(['email-threads'])
      onClose()
    },
    onError: (err) => {
      const errors = err.response?.data?.errors
      toast.error(errors ? Object.values(errors).flat()[0] : 'Failed to send email')
    },
  })

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div className="card" style={{ width: '100%', maxWidth: 520, padding: 24, position: 'relative' }}>
        <button className="btn btn-ghost btn-sm" style={{ position: 'absolute', top: 12, right: 12 }} onClick={onClose}><X size={16} /></button>
        <h3 style={{ marginBottom: 20 }}>New Email</h3>

        <div className="form-group">
          <label className="form-label">To</label>
          <input className="form-control" type="email" placeholder="recipient@example.com" value={form.to} onChange={e => set('to', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Subject</label>
          <input className="form-control" placeholder="Subject" value={form.subject} onChange={e => set('subject', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Message</label>
          <textarea className="form-control" rows={6} placeholder="Write your message…" value={form.body} onChange={e => set('body', e.target.value)} style={{ resize: 'vertical' }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !form.to || !form.subject || !form.body}
          >
            {mutation.isPending ? <span className="spinner" /> : <><Send size={14} /> Send Email</>}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function EmailInboxPage() {
  const [selectedThread, setSelectedThread] = useState(null)
  const [composing, setComposing] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['email-threads'],
    queryFn: () => api.get('/admin/email/threads').then(r => r.data.data),
    refetchInterval: 30_000,
  })

  const threads = data?.data ?? data ?? []

  return (
    <div>
      {composing && <ComposeModal onClose={() => setComposing(false)} />}

      <div className="page-header">
        <h1 className="page-title"><Inbox size={20} style={{ marginRight: 8, verticalAlign: 'middle' }} />Email Inbox</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)' }} />
            <span className="text-muted text-sm">Auto-refreshing every 30s</span>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => setComposing(true)}>
            <PenSquare size={14} /> Compose
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: selectedThread ? '300px 1fr' : '1fr', minHeight: 500 }}>
          {/* Thread list */}
          <div style={{ borderRight: selectedThread ? '1px solid var(--border)' : 'none' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Mail size={15} color="var(--text-secondary)" />
              <span style={{ fontWeight: 600, fontSize: 13 }}>Threads</span>
              {threads.length > 0 && (
                <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-secondary)' }}>{threads.length}</span>
              )}
            </div>
            {isLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}><span className="spinner" /></div>
            ) : (
              <ThreadList threads={threads} selectedId={selectedThread?.id} onSelect={setSelectedThread} />
            )}
          </div>

          {/* Thread detail */}
          {selectedThread ? (
            <ThreadDetail thread={selectedThread} onBack={() => setSelectedThread(null)} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 48, color: 'var(--text-secondary)' }}>
              <Mail size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
              <p className="text-sm">Select a thread to read messages</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
