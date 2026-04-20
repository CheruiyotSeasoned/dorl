import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import toast from 'react-hot-toast'
import { Mail, MailOpen, Trash2, Phone, Clock, Search, RefreshCcw } from 'lucide-react'

function MessageModal({ msg, onClose, onMarkRead, onDelete }) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background: 'var(--surface)', borderRadius: 12, width: '100%', maxWidth: 560, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px 16px', borderBottom: '1px solid var(--border)' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 17 }}>{msg.subject || 'No subject'}</h2>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 3 }}>
              {new Date(msg.created_at).toLocaleString()}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {!msg.read_at && (
              <button className="btn btn-secondary btn-sm" onClick={() => onMarkRead(msg.id)}>
                <MailOpen size={14} /> Mark read
              </button>
            )}
            <button className="btn btn-sm" style={{ background: 'var(--danger)', color: '#fff', border: 'none' }} onClick={() => { onDelete(msg.id); onClose() }}>
              <Trash2 size={14} />
            </button>
          </div>
        </div>
        <div style={{ padding: '20px 24px 24px' }}>
          <div style={{ display: 'flex', gap: 24, marginBottom: 20, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 3 }}>From</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{msg.name}</div>
              <a href={`mailto:${msg.email}`} style={{ fontSize: 13, color: 'var(--primary)', textDecoration: 'none' }}>{msg.email}</a>
            </div>
            {msg.phone && (
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 3 }}>Phone</div>
                <div style={{ fontSize: 14, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Phone size={13} color="var(--text-secondary)" />{msg.phone}
                </div>
              </div>
            )}
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 3 }}>IP Address</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{msg.ip_address ?? '—'}</div>
            </div>
          </div>
          <div style={{ background: 'var(--surface-muted)', borderRadius: 10, padding: '14px 16px', fontSize: 14, lineHeight: 1.75, whiteSpace: 'pre-wrap', color: 'var(--text-primary)' }}>
            {msg.message}
          </div>
          <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ContactMessagesPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [filterUnread, setFilterUnread] = useState(false)
  const [selected, setSelected] = useState(null)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['contact-messages', filterUnread],
    queryFn: () => api.get('/admin/contact-messages', { params: { unread: filterUnread ? 1 : undefined } }).then(r => r.data.data),
  })

  const messages = (data?.data ?? data ?? []).filter(m => {
    if (!search) return true
    const q = search.toLowerCase()
    return m.name?.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q) || m.subject?.toLowerCase().includes(q) || m.message?.toLowerCase().includes(q)
  })

  const unreadCount = (data?.data ?? data ?? []).filter(m => !m.read_at).length

  const markRead = useMutation({
    mutationFn: (id) => api.patch(`/admin/contact-messages/${id}/read`),
    onSuccess: () => {
      qc.invalidateQueries(['contact-messages'])
      if (selected) setSelected(prev => ({ ...prev, read_at: new Date().toISOString() }))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/contact-messages/${id}`),
    onSuccess: () => { toast.success('Message deleted'); qc.invalidateQueries(['contact-messages']) },
    onError: () => toast.error('Failed to delete'),
  })

  const openMessage = (msg) => {
    setSelected(msg)
    if (!msg.read_at) markRead.mutate(msg.id)
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Contact Messages</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-muted">{unreadCount} unread message{unreadCount !== 1 ? 's' : ''}</p>
          )}
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => refetch()}>
          <RefreshCcw size={14} /> Refresh
        </button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200, maxWidth: 320 }}>
          <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input className="form-control" style={{ paddingLeft: 32 }} placeholder="Search messages…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', userSelect: 'none' }}>
          <input type="checkbox" checked={filterUnread} onChange={e => setFilterUnread(e.target.checked)} />
          Unread only
        </label>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><span className="spinner" /></div>
        ) : messages.length === 0 ? (
          <p className="text-muted text-sm" style={{ padding: 24 }}>No messages found.</p>
        ) : (
          messages.map((msg, i) => (
            <div
              key={msg.id}
              onClick={() => openMessage(msg)}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 14,
                padding: '16px 20px',
                borderBottom: i < messages.length - 1 ? '1px solid var(--border)' : 'none',
                cursor: 'pointer',
                background: msg.read_at ? 'transparent' : 'rgba(var(--primary-rgb, 255,94,20), 0.04)',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-muted)'}
              onMouseLeave={e => e.currentTarget.style.background = msg.read_at ? 'transparent' : 'rgba(255,94,20,0.04)'}
            >
              <div style={{ flexShrink: 0, marginTop: 2 }}>
                {msg.read_at
                  ? <MailOpen size={18} color="var(--text-secondary)" />
                  : <Mail size={18} color="var(--primary)" />
                }
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 3 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontWeight: msg.read_at ? 500 : 700, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {msg.name}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {msg.email}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={11} />{new Date(msg.created_at).toLocaleDateString()}
                    </span>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ padding: '2px 6px' }}
                      onClick={e => { e.stopPropagation(); deleteMutation.mutate(msg.id) }}
                      title="Delete"
                    >
                      <Trash2 size={13} color="var(--danger)" />
                    </button>
                  </div>
                </div>
                {msg.subject && (
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {msg.subject}
                  </div>
                )}
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {msg.message}
                </div>
              </div>
              {!msg.read_at && (
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', flexShrink: 0, marginTop: 6 }} />
              )}
            </div>
          ))
        )}
      </div>

      {selected && (
        <MessageModal
          msg={selected}
          onClose={() => setSelected(null)}
          onMarkRead={(id) => markRead.mutate(id)}
          onDelete={(id) => deleteMutation.mutate(id)}
        />
      )}
    </div>
  )
}
