import { useEffect, useState, useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import echo from '../lib/echo'
import api from '../lib/api'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store/authStore'
import { MapPin, Package, Weight, Clock, CheckCircle, XCircle } from 'lucide-react'
import HereMap from './HereMap'

export default function DispatchOfferModal() {
  const { user, isRider } = useAuthStore()
  const [offer, setOffer] = useState(null)
  const [secondsLeft, setSecondsLeft] = useState(0)
  const timerRef = useRef(null)
  const qc = useQueryClient()

  useEffect(() => {
    if (!user || !isRider()) return
    const ch = echo.channel(`rider.${user.id}`)
    ch.listen('.dispatch.offer', (e) => {
      setOffer(e)
      const secs = Math.max(0, Math.round((new Date(e.expires_at) - Date.now()) / 1000))
      setSecondsLeft(secs)
    })
    return () => echo.leaveChannel(`rider.${user.id}`)
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Countdown
  useEffect(() => {
    if (!offer) return
    clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) {
          clearInterval(timerRef.current)
          setOffer(null)
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [offer?.attempt_id])

  const respondMutation = useMutation({
    mutationFn: (action) => api.patch(`/rider/dispatch/${offer.attempt_id}/respond`, { action }),
    onSuccess: (res, action) => {
      toast.success(action === 'accept' ? 'Delivery accepted! Head to pickup.' : 'Offer declined.')
      setOffer(null)
      clearInterval(timerRef.current)
      qc.invalidateQueries(['rider-deliveries'])
      qc.invalidateQueries(['rider-active'])
    },
    onError: (err) => toast.error(err.response?.data?.error ?? 'Failed to respond'),
  })

  if (!offer) return null

  const pct = Math.round((secondsLeft / offer.timeout_seconds) * 100)
  const urgent = secondsLeft <= 10

  const markers = []
  if (offer.pickup_lat && offer.pickup_lng)
    markers.push({ lat: Number(offer.pickup_lat), lng: Number(offer.pickup_lng), color: '#FF5E14', label: 'P' })

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 2000, padding: 16,
    }}>
      <div className="card" style={{ width: '100%', maxWidth: 480, margin: 0, overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ background: 'var(--primary)', margin: '-24px -24px 0', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ color: '#fff' }}>
            <div style={{ fontWeight: 700, fontSize: 16 }}>New Delivery Offer</div>
            <div style={{ fontSize: 12, opacity: 0.85 }}>Respond before the timer runs out</div>
          </div>
          <div style={{
            background: urgent ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.15)',
            borderRadius: 8, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6,
            animation: urgent ? 'pulse 0.8s infinite' : 'none',
          }}>
            <Clock size={15} color="#fff" />
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 18, fontVariantNumeric: 'tabular-nums' }}>
              {secondsLeft}s
            </span>
          </div>
        </div>

        {/* Timer bar */}
        <div style={{ margin: '0 -24px', height: 5, background: 'var(--border)' }}>
          <div style={{
            height: '100%', width: `${pct}%`,
            background: urgent ? 'var(--danger)' : 'var(--primary)',
            transition: 'width 1s linear, background 0.3s',
          }} />
        </div>

        {/* Map preview */}
        <div style={{ margin: '16px -24px 0', height: 160 }}>
          <HereMap markers={markers} height="160px" zoom={14} />
        </div>

        {/* Details */}
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            [MapPin, 'Pickup',   offer.pickup_address,  '#FF5E14'],
            [MapPin, 'Dropoff',  offer.dropoff_address, '#16A34A'],
          ].map(([Icon, label, addr, color]) => (
            <div key={label} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <Icon size={16} color={color} style={{ marginTop: 2, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{label}</div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{addr}</div>
              </div>
            </div>
          ))}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 4 }}>
            {[
              [Package, `${offer.packages_count} pkg${offer.packages_count > 1 ? 's' : ''}`],
              [Weight,  `${offer.total_weight_kg} kg`],
              [null,    `KES ${Number(offer.total_price).toLocaleString()}`],
            ].map(([Icon, val], i) => (
              <div key={i} style={{ background: 'var(--surface-muted)', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
                {Icon && <Icon size={14} color="var(--primary)" style={{ marginBottom: 3 }} />}
                <div style={{ fontWeight: 700, fontSize: 14, color: i === 2 ? 'var(--primary)' : 'var(--text-primary)' }}>{val}</div>
              </div>
            ))}
          </div>

          {offer.distance_km && (
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', textAlign: 'center' }}>
              {offer.distance_km} km from your location
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 20 }}>
          <button
            className="btn btn-sm"
            style={{ background: 'var(--danger)', color: '#fff', border: 'none', justifyContent: 'center', padding: '12px 0' }}
            onClick={() => respondMutation.mutate('reject')}
            disabled={respondMutation.isPending}
          >
            <XCircle size={16} /> Decline
          </button>
          <button
            className="btn btn-primary btn-sm"
            style={{ justifyContent: 'center', padding: '12px 0' }}
            onClick={() => respondMutation.mutate('accept')}
            disabled={respondMutation.isPending}
          >
            {respondMutation.isPending ? <span className="spinner" /> : <><CheckCircle size={16} /> Accept</>}
          </button>
        </div>
      </div>
    </div>
  )
}
