import { useState, useEffect } from 'react'
import { Download, X, Smartphone, Share } from 'lucide-react'

const DISMISSED_KEY = 'app_banner_dismissed'
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent)
const isInStandaloneMode = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  window.navigator.standalone === true

export default function AppDownloadBanner({ role = 'vendor' }) {
  const [installPrompt, setInstallPrompt] = useState(null)
  const [showIOSGuide, setShowIOSGuide] = useState(false)
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(DISMISSED_KEY) === '1'
  )
  const [installed, setInstalled] = useState(isInStandaloneMode)

  useEffect(() => {
    if (isInStandaloneMode()) { setInstalled(true); return }

    const handler = (e) => { e.preventDefault(); setInstallPrompt(e) }
    window.addEventListener('beforeinstallprompt', handler)

    const onAppInstalled = () => setInstalled(true)
    window.addEventListener('appinstalled', onAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      window.removeEventListener('appinstalled', onAppInstalled)
    }
  }, [])

  const dismiss = () => {
    setDismissed(true)
    localStorage.setItem(DISMISSED_KEY, '1')
  }

  const handleInstall = async () => {
    if (installPrompt) {
      installPrompt.prompt()
      const { outcome } = await installPrompt.userChoice
      if (outcome === 'accepted') { setInstalled(true); setInstallPrompt(null) }
    } else if (isIOS()) {
      setShowIOSGuide(v => !v)
    }
  }

  // Don't show if already installed, dismissed, or nothing to show
  if (installed || dismissed) return null
  // On desktop Chrome without prompt yet, and not iOS — skip until prompt fires
  if (!installPrompt && !isIOS()) return null

  const isRider = role === 'rider'
  const appName = isRider ? 'DORL Rider' : 'DORL Vendor'
  const appDesc = isRider
    ? 'Install the app for push notifications, offline access & GPS tracking'
    : 'Install the app for instant order alerts & quick access'

  return (
    <>
      <style>{`
        .adb-wrap {
          display: flex; align-items: flex-start; gap: 14;
          background: linear-gradient(135deg, #0D0D0D 0%, #1a1a1a 100%);
          border-radius: 14px; padding: 16px 18px; margin-bottom: 20px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15);
          border: 1px solid rgba(255,94,20,0.2);
          position: relative; overflow: hidden;
        }
        .adb-wrap::before {
          content: ''; position: absolute; inset: 0;
          background: radial-gradient(circle at 90% 50%, rgba(255,94,20,0.12) 0%, transparent 60%);
          pointer-events: none;
        }
        .adb-icon {
          width: 44px; height: 44px; border-radius: 12px;
          background: #FF5E14; display: flex; align-items: center;
          justify-content: center; flex-shrink: 0;
        }
        .adb-content { flex: 1; min-width: 0; }
        .adb-title { font-weight: 700; font-size: 14px; color: #fff; margin-bottom: 2px; }
        .adb-desc { font-size: 12px; color: rgba(255,255,255,0.55); line-height: 1.5; }
        .adb-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
        .adb-btn {
          background: #FF5E14; color: #fff; border: none; border-radius: 9px;
          padding: 9px 16px; font-weight: 700; font-size: 13px; cursor: pointer;
          display: flex; align-items: center; gap: 6px; white-space: nowrap;
          transition: opacity 0.15s;
        }
        .adb-btn:hover { opacity: 0.88; }
        .adb-dismiss {
          background: none; border: none; color: rgba(255,255,255,0.35);
          cursor: pointer; padding: 4px; display: flex; align-items: center;
          transition: color 0.15s; flex-shrink: 0;
        }
        .adb-dismiss:hover { color: rgba(255,255,255,0.7); }
        .adb-ios-guide {
          margin-top: 12px; padding: 12px 14px;
          background: rgba(255,255,255,0.06); border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.1);
        }
        .adb-ios-step {
          display: flex; align-items: flex-start; gap: 10;
          font-size: 12px; color: rgba(255,255,255,0.65); margin-bottom: 8px;
          line-height: 1.5;
        }
        .adb-ios-step:last-child { margin-bottom: 0; }
        .adb-ios-num {
          width: 20px; height: 20px; border-radius: 50%; background: rgba(255,94,20,0.25);
          color: #FF5E14; font-size: 11px; font-weight: 700;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        @media(max-width: 600px) {
          .adb-wrap { flex-wrap: wrap; gap: 10px; }
          .adb-actions { width: 100%; justify-content: space-between; }
        }
      `}</style>

      <div className="adb-wrap" style={{ gap: 14 }}>
        <div className="adb-icon">
          <Smartphone size={22} color="#fff" />
        </div>

        <div className="adb-content" style={{ position: 'relative', zIndex: 1 }}>
          <div className="adb-title">{appName}</div>
          <div className="adb-desc">{appDesc}</div>

          {showIOSGuide && (
            <div className="adb-ios-guide">
              <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginBottom: 10 }}>
                How to install on iOS:
              </div>
              {[
                <>Tap the <strong style={{ color: '#fff' }}>Share</strong> button at the bottom of Safari <Share size={12} style={{ verticalAlign: 'middle', display: 'inline' }} /></>,
                <>Scroll down and tap <strong style={{ color: '#fff' }}>"Add to Home Screen"</strong></>,
                <>Tap <strong style={{ color: '#fff' }}>"Add"</strong> to confirm</>,
              ].map((step, i) => (
                <div key={i} className="adb-ios-step">
                  <div className="adb-ios-num">{i + 1}</div>
                  <div>{step}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="adb-actions" style={{ position: 'relative', zIndex: 1 }}>
          <button className="adb-btn" onClick={handleInstall}>
            {isIOS()
              ? <><Share size={14} /> How to install</>
              : <><Download size={14} /> Install App</>
            }
          </button>
          <button className="adb-dismiss" onClick={dismiss} title="Dismiss">
            <X size={16} />
          </button>
        </div>
      </div>
    </>
  )
}
