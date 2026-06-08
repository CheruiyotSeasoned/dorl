import { useEffect, useState, useCallback, useRef } from 'react'
import { Bell, BellOff, Check, CheckCheck, X, Package, Truck, RefreshCw, CircleCheck, AlertTriangle, Info } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import echo from '../lib/echo'
import { playForType, toggleMute, getMuted } from '../lib/sounds'
import { useAuthStore } from '../store/authStore'
import { useNavigate } from 'react-router-dom'

// ── Type config ───────────────────────────────────────────────────────────────

const TYPE = {
  order_created:    { icon: Package,       color: '#2563EB', label: 'New Order'      },
  rider_assigned:   { icon: Truck,         color: '#16A34A', label: 'Rider Assigned' },
  status_changed:   { icon: RefreshCw,     color: '#9333EA', label: 'Status Update'  },
  order_completed:  { icon: CircleCheck,   color: '#16A34A', label: 'Completed'      },
  dispatch_offer:   { icon: Truck,         color: '#FF5E14', label: 'Dispatch Offer' },
  return_requested: { icon: AlertTriangle, color: '#D97706', label: 'Return Request' },
}

function typeConfig(type) {
  return TYPE[type] ?? { icon: Info, color: 'var(--text-secondary)', label: type }
}

function timeAgo(dateStr) {
  const s = Math.floor((Date.now() - new Date(dateStr)) / 1000)
  if (s < 60)    return 'just now'
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

function useIsMobile() {
  const [mobile, setMobile] = useState(() => window.innerWidth < 768)
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  return mobile
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function NotificationBell() {
  const { user } = useAuthStore()
  const navigate  = useNavigate()
  const qc        = useQueryClient()
  const isMobile  = useIsMobile()
  const bellRef   = useRef(null)
  const [open, setOpen]         = useState(false)
  const [muted, setMuted]       = useState(getMuted)
  const [popoverPos, setPopoverPos] = useState(null)

  // ── Fetch ─────────────────────────────────────────────────────────────────

  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn:  () => api.get('/notifications').then(r => r.data),
    refetchInterval: 60_000,
    staleTime: 30_000,
  })

  const notifications = data?.data?.data ?? []
  // Prefer server count; fall back to counting from loaded list
  const unread = data?.unread ?? notifications.filter(n => !n.is_read).length

  // ── Real-time Reverb ──────────────────────────────────────────────────────

  const handleIncoming = useCallback((e) => {
    playForType(e.type)
    qc.invalidateQueries({ queryKey: ['notifications'] })
  }, [qc])

  useEffect(() => {
    if (!user?.id) return
    const ch = echo.channel(`user.${user.id}`)
    ch.listen('.notification', handleIncoming)
    return () => echo.leaveChannel(`user.${user.id}`)
  }, [user?.id, handleIncoming])

  // ── Open: compute popover position on desktop ─────────────────────────────

  const openPanel = () => {
    if (!isMobile && bellRef.current) {
      const rect = bellRef.current.getBoundingClientRect()
      const W = 420
      let left = rect.right - W
      if (left < 8) left = 8
      if (left + W > window.innerWidth - 8) left = window.innerWidth - W - 8
      const maxHeight = Math.min(540, window.innerHeight - rect.bottom - 16)
      setPopoverPos({ top: rect.bottom + 8, left, width: W, maxHeight })
    } else {
      setPopoverPos(null)
    }
    setOpen(true)
  }

  // ── Close on Escape / click-outside ──────────────────────────────────────

  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open])

  // ── Mutations ─────────────────────────────────────────────────────────────

  const markRead = useMutation({
    mutationFn: (id) => api.patch(`/notifications/${id}/read`),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const markAll = useMutation({
    mutationFn: () => api.patch('/notifications/read-all'),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const handleItemClick = (n) => {
    if (!n.is_read) markRead.mutate(n.id)
    if (n.data?.url) { setOpen(false); navigate(n.data.url) }
  }

  const handleToggleMute = () => setMuted(toggleMute())

  // ── Shared panel content ──────────────────────────────────────────────────

  const panel = (
    <div style={{
      background: 'var(--surface)',
      borderRadius: isMobile ? '16px 16px 0 0' : 12,
      width: '100%',
      maxHeight: isMobile ? '88vh' : (popoverPos?.maxHeight ?? 540),
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
      overflow: 'hidden',
      border: isMobile ? 'none' : '1px solid var(--border)',
    }}>

      {/* Mobile drag handle */}
      {isMobile && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 99, background: 'var(--border)' }} />
        </div>
      )}

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: isMobile ? '10px 16px 12px' : '14px 16px 12px',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Bell size={16} color="var(--primary)" />
          <span style={{ fontWeight: 700, fontSize: 15 }}>Notifications</span>
          {unread > 0 && (
            <span style={{
              background: 'var(--primary)', color: '#fff',
              borderRadius: 99, padding: '1px 7px',
              fontSize: 11, fontWeight: 700,
            }}>
              {unread} unread
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
          {/* Mute toggle */}
          <button
            onClick={handleToggleMute}
            title={muted ? 'Unmute sounds' : 'Mute sounds'}
            style={{
              background: muted ? 'rgba(239,68,68,0.1)' : 'var(--surface-muted)',
              border: '1px solid var(--border)',
              borderRadius: 7, padding: '4px 9px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 5,
              fontSize: 11, fontWeight: 500,
              color: muted ? '#ef4444' : 'var(--text-secondary)',
            }}
          >
            {muted ? <BellOff size={12} /> : <Bell size={12} />}
            {muted ? 'Muted' : 'Sound on'}
          </button>

          {/* Mark all read */}
          {unread > 0 && (
            <button
              onClick={() => markAll.mutate()}
              title="Mark all as read"
              style={{
                background: 'var(--surface-muted)',
                border: '1px solid var(--border)',
                borderRadius: 7, padding: '4px 9px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 5,
                fontSize: 11, fontWeight: 500, color: 'var(--text-secondary)',
              }}
            >
              <CheckCheck size={12} /> Mark all read
            </button>
          )}

          {/* Close */}
          <button
            onClick={() => setOpen(false)}
            style={{
              background: 'var(--surface-muted)',
              border: '1px solid var(--border)',
              borderRadius: 7, padding: 5,
              cursor: 'pointer', display: 'flex',
              color: 'var(--text-secondary)',
            }}
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Notification list */}
      <div style={{ overflowY: 'auto', flex: 1 }}>
        {notifications.length === 0 ? (
          <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '48px 24px', gap: 12,
            color: 'var(--text-secondary)',
          }}>
            <Bell size={32} strokeWidth={1.2} />
            <span style={{ fontSize: 13 }}>No notifications yet</span>
          </div>
        ) : (
          notifications.map((n, i) => {
            const cfg  = typeConfig(n.type)
            const Icon = cfg.icon
            return (
              <div
                key={n.id}
                onClick={() => handleItemClick(n)}
                style={{
                  display: 'flex', gap: 12,
                  padding: isMobile ? '12px 16px' : '12px 16px',
                  cursor: n.data?.url ? 'pointer' : 'default',
                  background: n.is_read ? 'transparent' : 'rgba(37,99,235,0.06)',
                  borderBottom: i < notifications.length - 1 ? '1px solid var(--border)' : 'none',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => { if (n.data?.url) e.currentTarget.style.background = 'var(--surface-muted)' }}
                onMouseLeave={e => { e.currentTarget.style.background = n.is_read ? 'transparent' : 'rgba(37,99,235,0.06)' }}
              >
                {/* Type icon */}
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: cfg.color + '20',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, marginTop: 2,
                }}>
                  <Icon size={16} color={cfg.color} />
                </div>

                {/* Text */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, justifyContent: 'space-between' }}>
                    <span style={{
                      fontSize: 13, fontWeight: n.is_read ? 500 : 700,
                      color: 'var(--text-primary)', lineHeight: 1.35,
                    }}>
                      {n.title}
                    </span>
                    {!n.is_read && (
                      <span style={{
                        width: 7, height: 7, borderRadius: '50%',
                        background: 'var(--primary)', flexShrink: 0, marginTop: 4,
                      }} />
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2, lineHeight: 1.5 }}>
                    {n.body}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <span style={{ fontSize: 11, color: cfg.color, fontWeight: 600 }}>{cfg.label}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>·</span>
                    <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{timeAgo(n.created_at)}</span>
                  </div>
                </div>

                {/* Mark single read */}
                {!n.is_read && (
                  <button
                    onClick={(e) => { e.stopPropagation(); markRead.mutate(n.id) }}
                    title="Mark as read"
                    style={{
                      background: 'none', border: '1px solid var(--border)',
                      borderRadius: 6, cursor: 'pointer',
                      padding: '4px 6px', color: 'var(--text-secondary)',
                      flexShrink: 0, alignSelf: 'center',
                      display: 'flex', alignItems: 'center',
                    }}
                  >
                    <Check size={11} />
                  </button>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )

  return (
    <>
      {/* ── Bell button ─────────────────────────────────────────────────── */}
      <button
        ref={bellRef}
        onClick={openPanel}
        title="Notifications"
        style={{
          position: 'relative', background: 'none', border: 'none',
          cursor: 'pointer', padding: 6, borderRadius: 8,
          display: 'flex', alignItems: 'center',
          color: 'rgba(255,255,255,0.7)',
        }}
      >
        <Bell size={20} />
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: 0, right: 0,
            background: '#ef4444', color: '#fff',
            borderRadius: 99,
            minWidth: 16, height: 16,
            padding: '0 4px',
            fontSize: 10, fontWeight: 700, lineHeight: '16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            whiteSpace: 'nowrap',
            transform: 'translate(30%, -30%)',
          }}>
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {/* ── Mobile: bottom sheet with dark overlay ───────────────────────── */}
      {open && isMobile && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'stretch',
            zIndex: 1000,
          }}
        >
          <div style={{ width: '100%' }}>
            {panel}
          </div>
        </div>
      )}

      {/* ── Desktop: anchored popover ────────────────────────────────────── */}
      {open && !isMobile && popoverPos && (
        <>
          {/* transparent backdrop for click-outside */}
          <div
            onClick={() => setOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 999 }}
          />
          <div style={{
            position: 'fixed',
            top: popoverPos.top,
            left: popoverPos.left,
            width: popoverPos.width,
            maxHeight: popoverPos.maxHeight,
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
          }}>
            {panel}
          </div>
        </>
      )}
    </>
  )
}
