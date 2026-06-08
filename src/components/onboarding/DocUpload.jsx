import { useRef, useState } from 'react'
import { Upload, X, FileText, Image } from 'lucide-react'

export default function DocUpload({ label, hint, accept = 'image/*,.pdf', onChange, required, error }) {
  const inputRef          = useRef(null)
  const [preview, setPreview] = useState(null)
  const [fileName, setFileName] = useState(null)

  const handleFile = (file) => {
    if (!file) return
    setFileName(file.name)
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => setPreview(e.target.result)
      reader.readAsDataURL(file)
    } else {
      setPreview('pdf')
    }
    onChange?.(file)
  }

  const onInputChange = (e) => handleFile(e.target.files[0])

  const onDrop = (e) => {
    e.preventDefault()
    handleFile(e.dataTransfer.files[0])
  }

  const clear = (e) => {
    e.stopPropagation()
    setPreview(null)
    setFileName(null)
    inputRef.current.value = ''
    onChange?.(null)
  }

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 13, fontWeight: 500, color: '#6B6B6B', marginBottom: 6 }}>
        {label}{required && <span style={{ color: '#EF4444', marginLeft: 2 }}>*</span>}
      </div>

      <div
        onClick={() => !preview && inputRef.current.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        style={{
          border: `2px dashed ${error ? '#EF4444' : preview ? '#FF5E14' : '#E5E5E5'}`,
          borderRadius: 12, padding: 0, overflow: 'hidden',
          background: preview ? '#FFF8F5' : '#FAFAFA',
          cursor: preview ? 'default' : 'pointer',
          transition: 'all 0.2s',
          position: 'relative', minHeight: 120,
        }}
      >
        {!preview ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '28px 16px', gap: 10 }}>
            <div style={{ width: 44, height: 44, background: '#FFF0E8', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Upload size={20} color="#FF5E14" />
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#0D0D0D' }}>Click to upload</div>
              <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>or drag and drop here</div>
            </div>
            {hint && <div style={{ fontSize: 11, color: '#9CA3AF', textAlign: 'center' }}>{hint}</div>}
          </div>
        ) : preview === 'pdf' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px' }}>
            <div style={{ width: 44, height: 44, background: '#FEE2E2', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <FileText size={22} color="#DC2626" />
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0D0D0D', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fileName}</div>
              <div style={{ fontSize: 12, color: '#16A34A', marginTop: 2 }}>PDF uploaded</div>
            </div>
            <button onClick={clear} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 4, flexShrink: 0 }}>
              <X size={16} />
            </button>
          </div>
        ) : (
          <div style={{ position: 'relative' }}>
            <img src={preview} alt="preview" style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.opacity = 1}
              onMouseLeave={e => e.currentTarget.style.opacity = 0}
            >
              <button onClick={clear} style={{ background: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                <X size={14} /> Remove
              </button>
            </div>
            <div style={{ position: 'absolute', top: 8, right: 8 }}>
              <div style={{ background: '#16A34A', color: '#fff', borderRadius: 6, padding: '3px 8px', fontSize: 11, fontWeight: 600 }}>✓ Ready</div>
            </div>
          </div>
        )}
      </div>

      <input ref={inputRef} type="file" accept={accept} onChange={onInputChange} style={{ display: 'none' }} />
      {error && <div style={{ fontSize: 11, color: '#EF4444', marginTop: 4 }}>{error}</div>}
    </div>
  )
}
