import { useState, useRef, useEffect } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

function parseDate(str) {
  if (!str) return null
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function fmt(date) {
  if (!date) return ''
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function toISO(date) {
  if (!date) return ''
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function buildGrid(year, month) {
  const first = new Date(year, month, 1)
  const last  = new Date(year, month + 1, 0)
  const cells = []
  for (let i = 0; i < first.getDay(); i++) cells.push(null)
  for (let d = 1; d <= last.getDate(); d++) cells.push(new Date(year, month, d))
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

export default function DatePicker({ value, onChange, placeholder = 'Pick a date', style, minDate, maxDate }) {
  const [open, setOpen]   = useState(false)
  const ref = useRef(null)
  const today  = new Date()
  const parsed = parseDate(value)
  const init   = parsed ?? today

  const [viewYear, setViewYear]   = useState(init.getFullYear())
  const [viewMonth, setViewMonth] = useState(init.getMonth())

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const prev = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }
  const next = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }

  const pick = (date) => {
    onChange(toISO(date))
    setOpen(false)
  }

  const isSelected = (date) => date && parsed && toISO(date) === toISO(parsed)
  const isToday    = (date) => date && toISO(date) === toISO(today)
  const isDisabled = (date) => {
    if (!date) return true
    if (minDate && toISO(date) < minDate) return true
    if (maxDate && toISO(date) > maxDate) return true
    return false
  }

  const grid = buildGrid(viewYear, viewMonth)

  return (
    <div ref={ref} style={{ position: 'relative', ...style }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 8,
          padding: '9px 12px', background: 'var(--surface)',
          border: '1px solid ' + (open ? 'var(--primary)' : 'var(--border)'),
          borderRadius: 'var(--radius-sm)', cursor: 'pointer',
          fontSize: 14, color: value ? 'var(--text-primary)' : 'var(--text-secondary)',
          fontFamily: 'var(--font-body)', outline: 'none',
          transition: 'border-color 0.15s',
        }}
      >
        <CalendarDays size={15} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
        <span>{value ? fmt(parsed) : placeholder}</span>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 300,
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)', boxShadow: '0 8px 24px rgba(0,0,0,0.14)',
          padding: 16, width: 280,
          animation: 'selectFadeIn 0.1s ease',
        }}>
          {/* Month/Year header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <button type="button" onClick={prev} style={navBtn}><ChevronLeft size={16} /></button>
            <span style={{ fontWeight: 600, fontSize: 14 }}>{MONTHS[viewMonth]} {viewYear}</span>
            <button type="button" onClick={next} style={navBtn}><ChevronRight size={16} /></button>
          </div>

          {/* Day headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
            {DAYS.map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', padding: '2px 0' }}>{d}</div>
            ))}
          </div>

          {/* Day cells */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
            {grid.map((date, i) => {
              if (!date) return <div key={i} />
              const sel  = isSelected(date)
              const tod  = isToday(date)
              const dis  = isDisabled(date)
              return (
                <button
                  key={i}
                  type="button"
                  disabled={dis}
                  onMouseDown={() => !dis && pick(date)}
                  style={{
                    width: '100%', aspectRatio: '1', border: 'none', outline: 'none',
                    borderRadius: 'var(--radius-sm)', cursor: dis ? 'not-allowed' : 'pointer',
                    fontSize: 13, fontWeight: sel ? 700 : tod ? 600 : 400,
                    background: sel ? 'var(--primary)' : tod ? 'var(--surface-muted)' : 'transparent',
                    color: sel ? '#fff' : dis ? 'var(--border)' : tod ? 'var(--primary)' : 'var(--text-primary)',
                    border: tod && !sel ? '1px solid var(--primary)' : 'none',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => { if (!dis && !sel) e.currentTarget.style.background = 'var(--surface-muted)' }}
                  onMouseLeave={e => { if (!sel) e.currentTarget.style.background = tod ? 'var(--surface-muted)' : 'transparent' }}
                >
                  {date.getDate()}
                </button>
              )
            })}
          </div>

          {/* Clear */}
          {value && (
            <button
              type="button"
              onMouseDown={() => { onChange(''); setOpen(false) }}
              style={{ marginTop: 12, width: '100%', padding: '6px', background: 'none', border: 'none', fontSize: 12, color: 'var(--text-secondary)', cursor: 'pointer', borderRadius: 'var(--radius-sm)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-muted)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  )
}

const navBtn = {
  background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px',
  borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', color: 'var(--text-primary)',
}
