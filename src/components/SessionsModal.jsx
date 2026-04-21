import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import toast from 'react-hot-toast'
import { X, Monitor, Smartphone, Shield, LogOut, Trash2 } from 'lucide-react'

function deviceIcon(name = '') {
  const n = name.toLowerCase()
  if (n.includes('iphone') || n.includes('android') || n.includes('ipad')) {
    return <Smartphone size={18} />
  }
  return <Monitor size={18} />
}

function timeAgo(dateStr) {
  if (!dateStr) return 'Never'
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000)
  if (diff < 60)   return 'Just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400)return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function SessionsModal({ onClose }) {
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => api.get('/auth/sessions').then(r => r.data.data),
  })

  const revokeMutation = useMutation({
    mutationFn: (id) => api.delete(`/auth/sessions/${id}`),
    onSuccess: () => { toast.success('Device logged out'); qc.invalidateQueries(['sessions']) },
    onError: () => toast.error('Failed to revoke session'),
  })

  const revokeAllMutation = useMutation({
    mutationFn: () => api.delete('/auth/sessions'),
    onSuccess: () => { toast.success('All other devices logged out'); qc.invalidateQueries(['sessions']) },
    onError: () => toast.error('Failed to revoke sessions'),
  })

  const sessions = data ?? []
  const others = sessions.filter(s => !s.is_current)

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div className="card" style={{ width: '100%', maxWidth: 480, padding: 24, position: 'relative', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, flexShrink: 0 }}>
          <Shield size={20} color="var(--primary)" />
          <h3 style={{ margin: 0, flex: 1 }}>Active Sessions</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose}><X size={16} /></button>
        </div>

        {/* Session list */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}><span className="spinner" /></div>
          ) : sessions.length === 0 ? (
            <p className="text-muted text-sm" style={{ textAlign: 'center', padding: 24 }}>No active sessions found.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {sessions.map(s => (
                <div
                  key={s.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 14px', borderRadius: 10,
                    border: `1px solid ${s.is_current ? 'var(--primary)' : 'var(--border)'}`,
                    background: s.is_current ? 'var(--primary)10' : 'var(--surface)',
                  }}
                >
                  {/* Icon */}
                  <div style={{
                    width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                    background: s.is_current ? 'var(--primary)' : 'var(--surface-muted)',
                    color: s.is_current ? '#fff' : 'var(--text-secondary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {deviceIcon(s.device_name)}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      <span style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {s.device_name ?? 'Unknown device'}
                      </span>
                      {s.is_current && (
                        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--primary)', background: 'var(--primary)20', padding: '1px 6px', borderRadius: 4, flexShrink: 0 }}>
                          THIS DEVICE
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      {s.ip_address && <span>{s.ip_address}</span>}
                      <span>Active {timeAgo(s.last_active_at)}</span>
                      <span>Logged in {new Date(s.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Revoke button (not on current) */}
                  {!s.is_current && (
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ color: 'var(--danger)', flexShrink: 0 }}
                      onClick={() => revokeMutation.mutate(s.id)}
                      disabled={revokeMutation.isPending}
                      title="Log out this device"
                    >
                      <LogOut size={15} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {others.length > 0 && (
          <div style={{ flexShrink: 0, marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
            <button
              className="btn btn-secondary"
              style={{ width: '100%', justifyContent: 'center', color: 'var(--danger)', borderColor: 'var(--danger)' }}
              onClick={() => revokeAllMutation.mutate()}
              disabled={revokeAllMutation.isPending}
            >
              {revokeAllMutation.isPending
                ? <span className="spinner" />
                : <><Trash2 size={14} /> Log out all other devices ({others.length})</>}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
