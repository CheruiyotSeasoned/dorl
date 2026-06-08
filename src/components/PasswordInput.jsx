import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

export default function PasswordInput({ className = 'form-control', style, ...props }) {
  const [show, setShow] = useState(false)
  return (
    <div style={{ position: 'relative', ...style }}>
      <input
        {...props}
        type={show ? 'text' : 'password'}
        className={className}
        style={{ paddingRight: 44 }}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setShow(v => !v)}
        style={{
          position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--text-secondary, #9CA3AF)', padding: 0, display: 'flex',
          alignItems: 'center', lineHeight: 1,
        }}
        aria-label={show ? 'Hide password' : 'Show password'}
      >
        {show ? <EyeOff size={17} /> : <Eye size={17} />}
      </button>
    </div>
  )
}
