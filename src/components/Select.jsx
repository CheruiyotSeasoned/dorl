import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'

/**
 * options: array of { value, label } or [value, label]
 * value, onChange, placeholder, style, className
 */
export default function Select({ options = [], value, onChange, placeholder = 'Select…', style, className, disabled }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const normalised = options.map(o => Array.isArray(o) ? { value: o[0], label: o[1] } : o)
  const selected = normalised.find(o => String(o.value) === String(value))

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const pick = (val) => {
    onChange({ target: { value: val } })
    setOpen(false)
  }

  return (
    <div ref={ref} style={{ position: 'relative', ...style }} className={className}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 8, padding: '9px 12px',
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderColor: open ? 'var(--primary)' : 'var(--border)',
          borderRadius: 'var(--radius-sm)', cursor: disabled ? 'not-allowed' : 'pointer',
          fontSize: 14, color: selected ? 'var(--text-primary)' : 'var(--text-secondary)',
          fontFamily: 'var(--font-body)', outline: 'none',
          transition: 'border-color 0.15s',
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown size={15} color="var(--text-secondary)" style={{ flexShrink: 0, transition: 'transform 0.15s', transform: open ? 'rotate(180deg)' : 'none' }} />
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 200,
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)', boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          maxHeight: 260, overflowY: 'auto',
          animation: 'selectFadeIn 0.1s ease',
        }}>
          {normalised.map(opt => (
            <div
              key={opt.value}
              onMouseDown={() => pick(opt.value)}
              style={{
                padding: '9px 12px', cursor: 'pointer', fontSize: 14,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: String(opt.value) === String(value) ? 'var(--surface-muted)' : 'transparent',
                color: String(opt.value) === String(value) ? 'var(--primary)' : 'var(--text-primary)',
                fontWeight: String(opt.value) === String(value) ? 600 : 400,
              }}
              onMouseEnter={e => { if (String(opt.value) !== String(value)) e.currentTarget.style.background = 'var(--surface-muted)' }}
              onMouseLeave={e => { if (String(opt.value) !== String(value)) e.currentTarget.style.background = 'transparent' }}
            >
              {opt.label}
              {String(opt.value) === String(value) && <Check size={13} color="var(--primary)" />}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
