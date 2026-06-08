import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import api from '../lib/api'
import {
  Package, Truck, Clock, CheckCircle, XCircle,
  MapPin, DollarSign, ArrowUpRight, ArrowDownRight,
  BarChart2, MessageSquare, ExternalLink, Zap,
} from 'lucide-react'
import AppDownloadBanner from '../components/AppDownloadBanner'

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt    = (n) => n != null ? Number(n).toLocaleString() : '—'
const fmtKes = (n) => n != null ? `KES ${Number(n).toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '—'
const pct    = (n) => n != null ? `${Number(n).toFixed(1)}%` : '—'

const STATUS_BADGE = {
  completed: 'badge-success', cancelled: 'badge-danger',
  in_progress: 'badge-primary', assigned: 'badge-warning',
  awaiting_dispatch: 'badge-neutral', processing: 'badge-neutral', created: 'badge-neutral',
}

// ── Trend chip ────────────────────────────────────────────────────────────────
function Trend({ value }) {
  if (value == null) return null
  const up = value >= 0
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 2,
      fontSize: 11, fontWeight: 700, padding: '2px 6px', borderRadius: 99,
      background: up ? 'var(--success-bg)' : 'var(--danger-bg)',
      color: up ? 'var(--success-text)' : 'var(--danger-text)',
    }}>
      {up ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
      {Math.abs(value)}%
    </span>
  )
}

// ── Pure SVG bar chart ────────────────────────────────────────────────────────
function SvgBarChart({ data = [], height = 140 }) {
  if (!data.length) return (
    <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>
      No data yet
    </div>
  )
  const values = data.map(d => Number(d.orders ?? d.value ?? 0))
  const max    = Math.max(...values, 1)
  const w      = 400
  const barW   = Math.min(28, (w / values.length) - 6)
  const gap    = (w - barW * values.length) / (values.length + 1)
  const padTop = 12
  const chartH = height - 24 // 24px for x-labels

  return (
    <svg viewBox={`0 0 ${w} ${height}`} style={{ width: '100%', height, overflow: 'visible' }}>
      {/* Horizontal grid lines */}
      {[0.25, 0.5, 0.75, 1].map(f => {
        const y = padTop + chartH - f * chartH
        return (
          <line key={f} x1={0} y1={y} x2={w} y2={y}
            stroke="var(--border)" strokeWidth={1} strokeDasharray="4 4" />
        )
      })}

      {data.map((d, i) => {
        const v    = values[i]
        const barH = Math.max(4, (v / max) * (chartH - padTop))
        const x    = gap + i * (barW + gap)
        const y    = padTop + chartH - barH
        const isHigh = i === values.indexOf(Math.max(...values))
        const label = d.day ?? d.date
          ? new Date(d.date ?? 0).toLocaleDateString('en', { weekday: 'short' })
          : d.label ?? ''
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={barH} rx={4}
              fill={isHigh ? 'var(--primary)' : 'rgba(99,102,180,0.18)'}
              style={{ transition: 'height 0.4s ease, y 0.4s ease' }}
            />
            {isHigh && v > 0 && (
              <rect x={x} y={y} width={barW} height={barH} rx={4}
                fill="url(#barGrad)" opacity={0.5} />
            )}
            <text x={x + barW / 2} y={height - 4} textAnchor="middle"
              fontSize={9} fill="var(--text-tertiary)" fontFamily="var(--font-body)">
              {label}
            </text>
          </g>
        )
      })}

      <defs>
        <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff" stopOpacity={0.3} />
          <stop offset="100%" stopColor="#fff" stopOpacity={0} />
        </linearGradient>
      </defs>
    </svg>
  )
}

// ── Pure SVG line chart ───────────────────────────────────────────────────────
function SvgLineChart({ data = [], height = 100, color = '#7C5CFC' }) {
  if (!data.length) return null
  const values = data.map(d => Number(d.revenue ?? d.orders ?? d.value ?? 0))
  const max    = Math.max(...values, 1)
  const min    = Math.min(...values, 0)
  const range  = max - min || 1
  const w      = 400
  const padV   = 8

  const points = values.map((v, i) => {
    const x = (i / (values.length - 1 || 1)) * w
    const y = padV + (1 - (v - min) / range) * (height - padV * 2)
    return [x, y]
  })

  const polyline = points.map(([x, y]) => `${x},${y}`).join(' ')

  // Filled area path
  const area = `M${points[0][0]},${height} ` +
    points.map(([x, y]) => `L${x},${y}`).join(' ') +
    ` L${points[points.length - 1][0]},${height} Z`

  // X-axis labels (show every 2nd)
  const labels = data.map((d, i) => {
    if (i % 2 !== 0) return null
    const x = (i / (data.length - 1 || 1)) * w
    const label = d.date
      ? new Date(d.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })
      : ''
    return { x, label }
  }).filter(Boolean)

  return (
    <svg viewBox={`0 0 ${w} ${height + 14}`} style={{ width: '100%', height: height + 14, overflow: 'visible' }}>
      <defs>
        <linearGradient id="lineArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.15} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {[0.25, 0.5, 0.75].map(f => (
        <line key={f} x1={0} y1={padV + (1 - f) * (height - padV * 2)} x2={w} y2={padV + (1 - f) * (height - padV * 2)}
          stroke="var(--border)" strokeWidth={1} strokeDasharray="4 4" />
      ))}

      {/* Area fill */}
      <path d={area} fill="url(#lineArea)" />

      {/* Line */}
      <polyline points={polyline} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />

      {/* Dots on data points */}
      {points.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={3} fill="#fff" stroke={color} strokeWidth={2} />
      ))}

      {/* X labels */}
      {labels.map(({ x, label }) => (
        <text key={x} x={x} y={height + 12} textAnchor="middle" fontSize={9} fill="var(--text-tertiary)" fontFamily="var(--font-body)">
          {label}
        </text>
      ))}
    </svg>
  )
}

// ── Pure SVG donut ────────────────────────────────────────────────────────────
function SvgDonut({ value = 0, size = 140, color = '#FF6B9D', trackColor = '#FFE0EC' }) {
  const p   = Math.min(100, Math.max(0, value))
  const r   = (size - 20) / 2
  const circ = 2 * Math.PI * r
  const dash = (p / 100) * circ

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={trackColor} strokeWidth={14} />
      <circle cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={color} strokeWidth={14}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.6s ease' }}
      />
    </svg>
  )
}

// ── 2×2 grouped stats card ────────────────────────────────────────────────────
function StatsQuad({ stats }) {
  return (
    <div className="card" style={{ padding: 0 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
        {stats.map(({ label, value, trend, icon: Icon, color }, i) => (
          <div key={label} className="stat-quad-cell" style={{
            borderRight: i % 2 === 0 ? '1px solid var(--border)' : 'none',
            borderBottom: i < 2 ? '1px solid var(--border)' : 'none',
          }}>
            <div style={{ position: 'absolute', right: -4, bottom: -8, opacity: 0.05 }}>
              <Icon size={56} />
            </div>
            <div style={{ position: 'absolute', top: 0, left: 0, width: 3, height: '100%', background: color, opacity: 0.7 }} />
            <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', fontWeight: 500, marginBottom: 6 }}>{label}</div>
            <div className="stat-quad-value">{value ?? '—'}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <Trend value={trend} />
              {trend != null && <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>From Last Month</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Revenue card with line chart ──────────────────────────────────────────────
function RevenueCard({ data }) {
  const values = (data ?? [])
  const total  = values.reduce((s, d) => s + Number(d.revenue ?? d.orders ?? 0), 0)
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="chart-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500, marginBottom: 4 }}>Recurring Revenue</div>
          <div className="revenue-amount" style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.03em', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {fmtKes(total)}
            <Trend value={10} />
          </div>
        </div>
        <span className="period-btn" style={{ flexShrink: 0 }}>This Week</span>
      </div>
      <SvgLineChart data={values.slice(-10)} height={100} color="#7C5CFC" />
    </div>
  )
}

// ── Bar chart card ────────────────────────────────────────────────────────────
function ShipmentBarCard({ data }) {
  const chartData = (data ?? []).slice(-7).map(d => ({
    ...d,
    day: d.date ? new Date(d.date).toLocaleDateString('en', { weekday: 'short' }) : '',
  }))
  return (
    <div className="card">
      <div className="chart-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h3 style={{ margin: 0, fontSize: 15 }}>Shipment Over Time</h3>
        <span className="period-btn">This Week</span>
      </div>
      <SvgBarChart data={chartData} height={160} />
    </div>
  )
}

// ── Donut stats card ──────────────────────────────────────────────────────────
function DonutStatsCard({ rate }) {
  const p = Math.min(100, Math.max(0, Number(rate ?? 0)))
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="chart-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <h3 style={{ margin: 0, fontSize: 15 }}>Delivery Stats</h3>
        <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--text-secondary)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#FF6B9D', display: 'inline-block' }} /> Success
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#FFE0EC', display: 'inline-block' }} /> Pending
          </span>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <SvgDonut value={p} size={150} color="#FF6B9D" trackColor="#FFE0EC" />
        <div style={{ position: 'absolute', textAlign: 'center', pointerEvents: 'none' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em' }}>{p.toFixed(0)}%</div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 1 }}>Success rate</div>
        </div>
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-secondary)', textAlign: 'center' }}>
        Rate is <strong style={{ color: p >= 70 ? 'var(--success-text)' : 'var(--danger-text)' }}>
          {p >= 70 ? 'on track' : 'below target'}
        </strong> this week
      </div>
    </div>
  )
}

// ── Dark accent card ──────────────────────────────────────────────────────────
function HighlightCard({ value, label, sub, trend, to }) {
  return (
    <div className="card-dark" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 160 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 600, color: 'rgba(255,255,255,0.65)' }}>
          <Zap size={13} style={{ color: '#A78BFA' }} /> {label}
        </div>
        {to && (
          <Link to={to} style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ExternalLink size={13} style={{ color: '#fff' }} />
          </Link>
        )}
      </div>
      <div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1, marginBottom: 8 }}>
          {value}
        </div>
        {trend != null && (
          <span style={{ background: 'rgba(167,139,250,0.25)', color: '#DDD6FE', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
            <ArrowUpRight size={10} /> {trend}%
          </span>
        )}
      </div>
      {sub != null && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginBottom: 4 }}>{sub}</div>
          <div style={{ height: 5, background: 'rgba(255,255,255,0.1)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.min(100, Math.max(0, parseFloat(value) || trend || 50))}%`, background: 'linear-gradient(90deg, #A78BFA, #7C3AED)', borderRadius: 99 }} />
          </div>
        </div>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user, isAdmin } = useAuthStore()
  const admin = isAdmin()

  const { data: deliveryRaw, isLoading } = useQuery({
    queryKey: ['report-delivery-dash'],
    queryFn: () => admin
      ? api.get('/admin/reports/delivery').then(r => r.data.data)
      : api.get('/reports/my-delivery').then(r => r.data.data),
  })
  const { data: revenueRaw } = useQuery({
    queryKey: ['report-revenue-dash'],
    queryFn: () => api.get('/admin/reports/revenue').then(r => r.data.data),
    enabled: admin,
  })
  const { data: ridersRaw } = useQuery({
    queryKey: ['riders-dash'],
    queryFn: () => api.get('/admin/users?role=rider').then(r => r.data.data),
    enabled: admin,
  })
  const { data: ordersRaw } = useQuery({
    queryKey: ['orders-dash'],
    queryFn: () => admin
      ? api.get('/admin/orders').then(r => r.data.data)
      : api.get('/orders').then(r => r.data.data),
  })
  const { data: messagesRaw } = useQuery({
    queryKey: ['contact-messages-count'],
    queryFn: () => api.get('/admin/contact-messages').then(r => r.data.data),
    enabled: admin,
  })

  const summary     = deliveryRaw?.summary ?? {}
  const dailyVolume = deliveryRaw?.daily_volume ?? []
  const topVendors  = revenueRaw?.byVendor ?? revenueRaw?.by_vendor ?? []
  const allRiders   = ridersRaw?.data ?? ridersRaw ?? []
  const onlineCount = allRiders.filter(r => r.rider_profile?.is_online).length
  const recentOrders= (ordersRaw?.data ?? []).slice(0, 8)
  const unreadMsgs  = (messagesRaw?.data ?? messagesRaw ?? []).filter(m => !m.read_at).length

  return (
    <div className="dash-col">
      {!admin && <AppDownloadBanner role="vendor" />}

      {admin && unreadMsgs > 0 && (
        <Link to="/contact-messages" style={{ textDecoration: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 10, padding: '10px 16px' }}>
            <MessageSquare size={15} color="#EA580C" />
            <span style={{ fontSize: 13, color: '#9A3412', fontWeight: 500 }}>
              <strong>{unreadMsgs}</strong> unread contact message{unreadMsgs !== 1 ? 's' : ''}
            </span>
            <ArrowUpRight size={13} color="#EA580C" style={{ marginLeft: 'auto' }} />
          </div>
        </Link>
      )}

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}><span className="spinner" /></div>
      ) : (
        <>
          {/* Row 1 — grouped stats + revenue chart */}
          <div className="dash-row-2">
            <StatsQuad stats={[
              { label: 'Total Orders',  value: fmt(summary.total_orders), trend: 10,  icon: Package,    color: 'var(--primary)' },
              { label: 'Completed',     value: fmt(summary.completed),    trend: 8,   icon: CheckCircle,color: 'var(--success)' },
              { label: 'In Progress',   value: fmt(Number(summary.in_progress ?? 0) + Number(summary.assigned ?? 0)), trend: -3, icon: Clock, color: 'var(--warning)' },
              { label: 'Cancelled',     value: fmt(summary.cancelled),    trend: -10, icon: XCircle,    color: 'var(--danger)' },
            ]} />
            <RevenueCard data={dailyVolume} />
          </div>

          {/* Row 2 — bar chart + donut + dark card */}
          <div className="dash-row-3">
            <ShipmentBarCard data={dailyVolume} />
            <DonutStatsCard rate={summary.success_rate} />
            {admin ? (
              <HighlightCard
                label="Riders Online"
                value={`${onlineCount}/${allRiders.length}`}
                sub="Active right now"
                trend={onlineCount > 0 ? Math.round((onlineCount / Math.max(allRiders.length, 1)) * 100) : 0}
                to="/riders"
              />
            ) : (
              <HighlightCard
                label="Your Success Rate"
                value={pct(summary.success_rate)}
                sub="Delivery success"
                trend={summary.success_rate ? Math.round(Number(summary.success_rate) - 50) : null}
                to="/reports"
              />
            )}
          </div>

          {/* Row 3 — recent orders + top vendors */}
          <div className={admin && topVendors.length ? 'dash-row-side' : 'dash-row-full'}>
            <div className="card" style={{ padding: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px 0' }}>
                <h3 style={{ margin: 0, fontSize: 15 }}>Recent Orders</h3>
                <Link to="/orders" style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600 }}>View all</Link>
              </div>
              {recentOrders.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon"><Package size={22} /></div>
                  <div className="empty-state-title">No orders yet</div>
                  <div className="empty-state-body">Orders will appear here once created.</div>
                </div>
              ) : (
                <div className="table-wrap" style={{ marginTop: 8 }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Order</th>
                        {admin && <th>Vendor</th>}
                        <th>Route</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'right' }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentOrders.map(o => (
                        <tr key={o.id}>
                          <td>
                            <Link to={`/orders/${o.id}`} style={{ fontWeight: 600, fontSize: 13 }}>#{o.id}</Link>
                            <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{new Date(o.created_at).toLocaleDateString()}</div>
                          </td>
                          {admin && <td style={{ fontSize: 13 }}>{o.vendor?.name ?? '—'}</td>}
                          <td>
                            <div style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-secondary)' }}>
                              <MapPin size={10} color="var(--primary)" style={{ flexShrink: 0 }} />
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>
                                {o.pickup_address?.split(',')[0]} → {o.dropoff_address?.split(',')[0]}
                              </span>
                            </div>
                          </td>
                          <td><span className={`badge ${STATUS_BADGE[o.status] ?? 'badge-neutral'}`}>{o.status?.replace(/_/g, ' ')}</span></td>
                          <td style={{ fontWeight: 700, fontSize: 13, textAlign: 'right', fontFamily: 'var(--font-display)' }}>
                            KES {Number(o.total_price ?? 0).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {admin && topVendors.length > 0 && (
              <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h3 style={{ margin: 0, fontSize: 15 }}>Top Vendors</h3>
                  <Link to="/vendors" style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600 }}>Manage</Link>
                </div>
                {topVendors.slice(0, 6).map((v, i) => {
                  const maxRev = Number(topVendors[0]?.revenue ?? 1)
                  const barW   = Math.max(4, Math.round((Number(v.revenue) / maxRev) * 100))
                  return (
                    <div key={v.vendor_id ?? i}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                        <span style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>
                          {v.vendor?.name ?? `Vendor #${v.vendor_id}`}
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', flexShrink: 0 }}>{fmtKes(v.revenue)}</span>
                      </div>
                      <div style={{ height: 4, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{ width: `${barW}%`, height: '100%', background: 'linear-gradient(90deg, var(--primary), #FF8C5A)', borderRadius: 99 }} />
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>{fmt(v.orders)} orders</div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
