import { useState, useEffect } from 'react'
import { Download, X } from 'lucide-react'

export default function PWAInstallBanner() {
  const [prompt, setPrompt] = useState(null)
  const [dismissed, setDismissed] = useState(() => localStorage.getItem('pwa_dismissed') === '1')

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault()
      setPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (!prompt || dismissed) return null

  const install = async () => {
    prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') setPrompt(null)
  }

  const dismiss = () => {
    setDismissed(true)
    localStorage.setItem('pwa_dismissed', '1')
  }

  return (
    <div style={{
      position: 'fixed', bottom: 16, left: 16, right: 16, zIndex: 2000,
      background: '#0D0D0D', color: '#fff', borderRadius: 14,
      padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12,
      boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
    }}>
      <img src="/logo.png" alt="DORL" style={{ width: 36, height: 36, objectFit: 'contain', background: '#fff', borderRadius: 8, padding: 2, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14 }}>Install DORL Rider App</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>Add to home screen for offline access & notifications</div>
      </div>
      <button onClick={install} style={{ background: '#FF5E14', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', fontWeight: 700, fontSize: 13, cursor: 'pointer', flexShrink: 0 }}>
        <Download size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />Install
      </button>
      <button onClick={dismiss} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: 4, flexShrink: 0 }}>
        <X size={16} />
      </button>
    </div>
  )
}
