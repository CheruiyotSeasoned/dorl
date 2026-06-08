export default function StepBar({ steps, current }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 40 }}>
      {steps.map((label, i) => {
        const idx     = i + 1
        const done    = idx < current
        const active  = idx === current
        const last    = i === steps.length - 1
        return (
          <div key={label} style={{ display: 'flex', alignItems: 'center', flex: last ? 0 : 1 }}>
            {/* Circle */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: 14,
                background: done ? '#FF5E14' : active ? '#FF5E14' : '#F7F7F7',
                color: done || active ? '#fff' : '#6B6B6B',
                border: active ? '3px solid rgba(255,94,20,0.25)' : done ? 'none' : '2px solid #E5E5E5',
                boxShadow: active ? '0 0 0 4px rgba(255,94,20,0.1)' : 'none',
                transition: 'all 0.3s',
              }}>
                {done
                  ? <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8l3.5 3.5L13 4.5" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  : idx
                }
              </div>
              <span style={{ fontSize: 11, fontWeight: active ? 600 : 400, color: active ? '#FF5E14' : done ? '#0D0D0D' : '#9CA3AF', whiteSpace: 'nowrap' }}>
                {label}
              </span>
            </div>
            {/* Connector */}
            {!last && (
              <div style={{
                flex: 1, height: 2, marginBottom: 18,
                background: done ? '#FF5E14' : '#E5E5E5',
                transition: 'background 0.3s',
              }} />
            )}
          </div>
        )
      })}
    </div>
  )
}
