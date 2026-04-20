import { useState, useEffect } from 'react'
import api from '../lib/api'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw     = atob(base64)
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)))
}

export function useVendorPWA() {
  const [pushGranted, setPushGranted] = useState(
    typeof Notification !== 'undefined' && Notification.permission === 'granted'
  )

  const subscribe = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !VAPID_PUBLIC_KEY) return false
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') return false
      setPushGranted(true)

      const reg = await navigator.serviceWorker.ready
      let sub   = await reg.pushManager.getSubscription()
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
    } catch {
      return false
    }
  }

  // Auto-subscribe if already granted
  useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      subscribe()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return { pushGranted, requestPushPermission: subscribe }
}
