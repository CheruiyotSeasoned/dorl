import { useState } from 'react'
import { Bell, X } from 'lucide-react'
import { useVendorPWA } from '../hooks/useVendorPWA'
import toast from 'react-hot-toast'

const pushSupported = () => 'Notification' in window && 'PushManager' in window

export default function VendorPushBanner({ isExpanded = true }) {
  const { pushGranted, requestPushPermission } = useVendorPWA()
  const [dismissed, setDismissed] = useState(() => localStorage.getItem('push_banner_v1') === '1')

  if (!pushSupported() || pushGranted || dismissed) return null

  const dismiss = () => {
    setDismissed(true)
    localStorage.setItem('push_banner_v1', '1')
  }

  const enable = async () => {
    const ok = await requestPushPermission()
    if (ok) { toast.success('Notifications enabled!'); dismiss() }
    else toast.error('Notifications blocked — check browser settings')
  }

  if (!isExpanded) {
    return (
      <div style={{ padding: '4px 0 2px', display: 'flex', justifyContent: 'center' }}>
        <button
          onClick={enable}
          title="Enable order notifications"
          style={{
            width: 36, height: 36, borderRadius: 8,
            background: 'rgba(255,94,20,0.15)',
            border: '1px solid rgba(255,94,20,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: '#FF5E14',
          }}
        >
          <Bell size={15} />
        </button>
      </div>
    )
  }

  return (
    <div style={{
      margin: '0 8px 6px',
      background: 'rgba(255,94,20,0.1)',
      border: '1px solid rgba(255,94,20,0.2)',
      borderRadius: 10,
      padding: '10px 10px 10px 12px',
      display: 'flex',
      alignItems: 'flex-start',
      gap: 9,
    }}>
      <Bell size={14} color="#FF5E14" style={{ flexShrink: 0, marginTop: 2 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', lineHeight: 1.3 }}>
          Enable notifications
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2, lineHeight: 1.4 }}>
          Stay updated on order status changes
        </div>
        <button
          onClick={enable}
          style={{
            marginTop: 8, background: '#FF5E14', color: '#fff',
            border: 'none', borderRadius: 6, padding: '5px 10px',
            fontWeight: 700, fontSize: 11, cursor: 'pointer',
          }}
        >
          Enable
        </button>
      </div>
      <button
        onClick={dismiss}
        title="Dismiss"
        style={{
          background: 'none', border: 'none',
          color: 'rgba(255,255,255,0.3)', cursor: 'pointer',
          padding: 0, flexShrink: 0, lineHeight: 1,
        }}
      >
        <X size={13} />
      </button>
    </div>
  )
}
