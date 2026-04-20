import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import toast from 'react-hot-toast'
import { Save, Upload } from 'lucide-react'

const GROUPS = ['general', 'pricing', 'dispatch', 'rider', 'proof', 'notifications', 'integrations', 'security', 'invoice', 'branding']

function SettingInput({ setting, value, onChange }) {
  const { type, key } = setting
  if (type === 'boolean') {
    return (
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
        <input type="checkbox" checked={value === 'true' || value === true} onChange={e => onChange(e.target.checked ? 'true' : 'false')} />
        <span style={{ fontSize: 13 }}>Enabled</span>
      </label>
    )
  }
  if (type === 'integer' || type === 'float') {
    return <input type="number" step={type === 'float' ? '0.01' : '1'} className="form-control" value={value} onChange={e => onChange(e.target.value)} style={{ maxWidth: 200 }} />
  }
  if (type === 'json') {
    return <textarea className="form-control" value={typeof value === 'object' ? JSON.stringify(value, null, 2) : value} onChange={e => onChange(e.target.value)} rows={4} style={{ fontFamily: 'monospace', fontSize: 12 }} />
  }
  return <input className="form-control" value={value ?? ''} onChange={e => onChange(e.target.value)} style={{ maxWidth: 360 }} />
}

function UploadField({ label, description, type, currentUrl, onUploaded }) {
  const inputRef = useRef()
  const [preview, setPreview] = useState(currentUrl)
  const [uploading, setUploading] = useState(false)

  const handleFile = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setPreview(URL.createObjectURL(file))
    setUploading(true)
    const form = new FormData()
    form.append('type', type)
    form.append('file', file)
    try {
      const res = await api.post('/admin/branding/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } })
      onUploaded(res.data.data.url)
      toast.success(`${label} updated`)
    } catch {
      toast.error('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={{ paddingBottom: 24, borderBottom: '1px solid var(--border)' }}>
      <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{label}</div>
      {description && <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>{description}</p>}
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{
          width: 120, height: 64, borderRadius: 8, border: '1px solid var(--border)',
          background: 'var(--surface-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden', flexShrink: 0,
        }}>
          {preview
            ? <img src={preview} alt={label} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
            : <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>No image</span>}
        </div>
        <div>
          <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/svg+xml,image/x-icon" style={{ display: 'none' }} onChange={handleFile} />
          <button
            className="btn btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? <span className="spinner" /> : <Upload size={14} />}
            {uploading ? 'Uploading…' : `Upload ${label}`}
          </button>
          <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 6 }}>PNG, JPG, SVG or ICO · max 2 MB</p>
        </div>
      </div>
      {preview && (
        <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-secondary)', wordBreak: 'break-all' }}>
          URL: {preview.startsWith('blob:') ? '(unsaved preview)' : preview}
        </div>
      )}
    </div>
  )
}

function BrandingPanel() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['branding'],
    queryFn: () => api.get('/admin/branding').then(r => r.data.data),
  })

  if (isLoading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}><span className="spinner" /></div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h3 style={{ margin: '0 0 4px', fontSize: 14 }}>Branding Assets</h3>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 20px' }}>
          Upload your logo and favicon. Changes take effect immediately across the app.
        </p>
      </div>
      <UploadField
        label="Logo"
        description="Used in the sidebar, emails, and landing page. Recommended: PNG with transparent background, min 200px wide."
        type="logo"
        currentUrl={data?.logo_url}
        onUploaded={() => qc.invalidateQueries(['branding'])}
      />
      <UploadField
        label="Favicon"
        description="Browser tab icon. Recommended: 32×32 PNG or ICO with transparent background."
        type="favicon"
        currentUrl={data?.favicon_url}
        onUploaded={(url) => {
          // Live-update the favicon in the browser tab
          document.querySelectorAll("link[rel*='icon']").forEach(el => { el.href = url + '?t=' + Date.now() })
          qc.invalidateQueries(['branding'])
        }}
      />
    </div>
  )
}

export default function SettingsPage() {
  const qc = useQueryClient()
  const [activeGroup, setActiveGroup] = useState('general')
  const [localValues, setLocalValues] = useState({})
  const [dirty, setDirty] = useState({})

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.get('/admin/settings').then(r => r.data.data),
  })

  useEffect(() => {
    if (settings) {
      const vals = {}
      settings.forEach(s => { vals[s.key] = s.value })
      setLocalValues(vals)
    }
  }, [settings])

  const saveMutation = useMutation({
    mutationFn: (updates) => api.put('/admin/settings', { settings: updates }),
    onSuccess: () => {
      toast.success('Settings saved')
      setDirty({})
      qc.invalidateQueries(['settings'])
    },
    onError: () => toast.error('Save failed'),
  })

  const handleChange = (key, val) => {
    setLocalValues(prev => ({ ...prev, [key]: val }))
    setDirty(prev => ({ ...prev, [key]: true }))
  }

  const handleSave = () => {
    const updates = Object.keys(dirty).map(key => ({ key, value: localValues[key] }))
    if (!updates.length) return toast('No changes to save')
    saveMutation.mutate(updates)
  }

  const grouped = settings
    ? GROUPS.reduce((acc, g) => { acc[g] = settings.filter(s => s.group === g); return acc }, {})
    : {}

  const currentSettings = grouped[activeGroup] ?? []
  const dirtyCount = Object.keys(dirty).length

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <button className="btn btn-primary" onClick={handleSave} disabled={saveMutation.isPending || !dirtyCount}>
          {saveMutation.isPending ? <span className="spinner" /> : <><Save size={15} /> Save{dirtyCount > 0 ? ` (${dirtyCount})` : ''}</>}
        </button>
      </div>

      <div className="settings-grid">
        {/* Sidebar */}
        <div className="card settings-sidebar" style={{ padding: '8px 0', height: 'fit-content', borderRight: '1px solid var(--border)' }}>
          {GROUPS.map(g => {
            const gDirty = settings?.filter(s => s.group === g && dirty[s.key]).length ?? 0
            return (
              <button
                key={g}
                onClick={() => setActiveGroup(g)}
                style={{
                  width: '100%', textAlign: 'left', padding: '8px 16px', border: 'none', cursor: 'pointer',
                  background: activeGroup === g ? 'var(--primary)' : 'transparent',
                  color: activeGroup === g ? '#fff' : 'var(--text-primary)',
                  fontSize: 13, fontWeight: activeGroup === g ? 600 : 400,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  borderRadius: 0,
                }}
              >
                {g.charAt(0).toUpperCase() + g.slice(1)}
                {gDirty > 0 && <span style={{ width: 6, height: 6, borderRadius: '50%', background: activeGroup === g ? '#fff' : 'var(--primary)' }} />}
              </button>
            )
          })}
        </div>

        {/* Settings form */}
        <div className="card">
          {activeGroup === 'branding' ? (
            <BrandingPanel />
          ) : isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}><span className="spinner" /></div>
          ) : currentSettings.length === 0 ? (
            <p className="text-muted text-sm">No settings in this group.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {currentSettings.map(s => (
                <div key={s.key} style={{ paddingBottom: 20, borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                    <label style={{ fontWeight: 600, fontSize: 13 }}>{s.label ?? s.key}</label>
                    {dirty[s.key] && <span style={{ fontSize: 10, color: 'var(--primary)', background: 'var(--primary)18', padding: '1px 6px', borderRadius: 4 }}>modified</span>}
                  </div>
                  {s.description && <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>{s.description}</p>}
                  <SettingInput setting={s} value={localValues[s.key] ?? ''} onChange={v => handleChange(s.key, v)} />
                  <div style={{ fontSize: 11, color: 'var(--border)', marginTop: 4 }}>Key: <code>{s.key}</code></div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
