import { useEffect, useRef, useState } from 'react'
import api from '../lib/api'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw     = atob(base64)
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)))
}

export function useRiderPWA(isOnline) {
  const wakeLockRef      = useRef(null)
  const [pushGranted, setPushGranted] = useState(Notification.permission === 'granted')
  const [wakeLockActive, setWakeLockActive] = useState(false)

  // ── Wake Lock: keep screen on while online ──────────────────────────────────
  useEffect(() => {
    if (!('wakeLock' in navigator)) return

    const acquire = async () => {
      try {
        wakeLockRef.current = await navigator.wakeLock.request('screen')
        setWakeLockActive(true)
        wakeLockRef.current.addEventListener('release', () => setWakeLockActive(false))
      } catch {}
    }

    const release = () => {
      wakeLockRef.current?.release().catch(() => {})
      wakeLockRef.current = null
      setWakeLockActive(false)
    }

    if (isOnline) {
      acquire()
    } else {
      release()
    }

    // Re-acquire after visibility change (Android/iOS releases lock on hide)
    const onVisible = () => { if (isOnline && document.visibilityState === 'visible') acquire() }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      release()
    }
  }, [isOnline])

  // ── Push Notifications: request + subscribe ─────────────────────────────────
  const requestPushPermission = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false
    if (!VAPID_PUBLIC_KEY) return false

    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') return false

      setPushGranted(true)

      const reg = await navigator.serviceWorker.ready
      let sub = await reg.pushManager.getSubscription()

      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly:      true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        })
      }

      const key  = sub.getKey('p256dh')
      const auth = sub.getKey('auth')

      await api.post('/push/subscribe', {
        endpoint: sub.endpoint,
        p256dh:   btoa(String.fromCharCode(...new Uint8Array(key))),
        auth:     btoa(String.fromCharCode(...new Uint8Array(auth))),
      })

      return true
    } catch (e) {
      console.warn('Push subscription failed:', e)
      return false
    }
  }

  // Auto-subscribe when going online (if already granted)
  useEffect(() => {
    if (isOnline && Notification.permission === 'granted') {
      requestPushPermission()
    }
  }, [isOnline])

  return { pushGranted, wakeLockActive, requestPushPermission }
}
