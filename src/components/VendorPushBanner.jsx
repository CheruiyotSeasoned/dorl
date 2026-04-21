import { Bell } from 'lucide-react'
import { useVendorPWA } from '../hooks/useVendorPWA'
import toast from 'react-hot-toast'

const pushSupported = () => 'Notification' in window && 'PushManager' in window

export default function VendorPushBanner() {
  const { pushGranted, requestPushPermission } = useVendorPWA()

  if (!pushSupported() || pushGranted) return null

  return (
    <div style={{
      position: 'fixed', bottom: 16, left: 16, right: 16, zIndex: 1999,
      background: '#0D0D0D', color: '#fff', borderRadius: 14,
      padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12,
      boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
    }}>
      <div style={{ width: 36, height: 36, borderRadius: 8, background: '#FF5E14', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Bell size={18} color="#fff" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14 }}>Enable order notifications</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>
          Get notified when a rider is assigned or your order status changes
        </div>
      </div>
      <button
        onClick={async () => {
          const ok = await requestPushPermission()
          if (ok) toast.success('Notifications enabled!')
          else toast.error('Notifications blocked — check browser settings')
        }}
        style={{ background: '#FF5E14', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', fontWeight: 700, fontSize: 13, cursor: 'pointer', flexShrink: 0 }}
      >
        Enable
      </button>
    </div>
  )
}
