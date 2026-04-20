import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import api from '../lib/api'
import {
  Package, Truck, Clock, CheckCircle, TrendingUp, XCircle,
  Zap, Users, MapPin, DollarSign, ArrowUpRight, BarChart2,
  MessageSquare, AlertCircle,
} from 'lucide-react'

// ── helpers ──────────────────────────────────────────────────────────────────
const fmt   = (n) => n != null ? Number(n).toLocaleString() : '—'
const fmtKes = (n) => n != null ? `KES ${Number(n).toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '—'
const pct   = (n) => n != null ? `${Number(n).toFixed(1)}%` : '—'

const STATUS_BADGE = {
  completed:        'badge-success',
  cancelled:        'badge-danger',
  in_progress:      'badge-primary',
  assigned:         'badge-warning',
  awaiting_dispatch:'badge-neutral',
  processing:       'badge-neutral',
  created:          'badge-neutral',
}

// ── MiniBar: tiny horizontal bar chart ───────────────────────────────────────
function MiniBar({ label, value, max, color }) {
  const pctW = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
          {label.replace(/_/g, ' ')}
        </span>
        <span style={{ fontSize: 12, fontWeight: 600 }}>{value}</span>
      </div>
      <div style={{ height: 6, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ width: `${pctW}%`, height: '100%', background: color, borderRadius: 99, transition: 'width 0.5s ease' }} />
      </div>
    </div>
  )
}

// ── Sparkline: CSS bar trend ──────────────────────────────────────────────────
function Sparkline({ data = [], color = 'var(--primary)' }) {
  if (!data.length) return null
  const max = Math.max(...data.map(d => d.orders ?? 0), 1)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 28 }}>
      {data.slice(-14).map((d, i) => {
        const h = Math.max(3, Math.round(((d.orders ?? 0) / max) * 28))
        return (
          <div key={i} title={`${d.date}: ${d.orders} orders`}
            style={{ flex: 1, height: h, background: color, borderRadius: 2, opacity: 0.7 + (i / data.length) * 0.3 }} />
        )
      })}
    </div>
  )
}

// ── StatCard ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon: Icon, color, trend, sparkData, to }) {
  const inner = (
    <div className="stat-card" style={{ position: 'relative', overflow: 'hidden', height: '100%' }}>
      {/* faint icon watermark */}
      <div style={{ position: 'absolute', right: -8, bottom: -12, opacity: 0.06 }}>
        <Icon size={80} />
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: color + '1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={20} color={color} strokeWidth={1.75} />
        </div>
        {trend != null && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 600, color: trend >= 0 ? 'var(--success)' : 'var(--danger)', background: trend >= 0 ? '#DCFCE7' : '#FEE2E2', padding: '2px 7px', borderRadius: 99 }}>
            <ArrowUpRight size={11} style={{ transform: trend < 0 ? 'rotate(90deg)' : 'none' }} />
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.85rem', fontWeight: 700, lineHeight: 1.1, marginBottom: 2, color: 'var(--text-primary)' }}>
        {value ?? <span style={{ color: 'var(--border)' }}>—</span>}
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: sparkData ? 10 : 0 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{sub}</div>}
      {sparkData && <Sparkline data={sparkData} color={color} />}
    </div>
  )
  return to ? <Link to={to} style={{ textDecoration: 'none', display: 'block' }}>{inner}</Link> : inner
}

// ── DonutRing: simple CSS conic-gradient ring ─────────────────────────────────
function DonutRing({ pct, color, size = 72 }) {
  const p = Math.min(100, Math.max(0, pct ?? 0))
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <div style={{
        width: size, height: size, borderRadius: '50%',
        background: `conic-gradient(${color} 0% ${p}%, var(--border) ${p}% 100%)`,
      }} />
      <div style={{
        position: 'absolute', inset: 8, borderRadius: '50%',
        background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: size < 60 ? 11 : 13,
      }}>
        {p.toFixed(0)}%
      </div>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user, isAdmin } = useAuthStore()
  const admin = isAdmin()

  const { data: deliveryRaw, isLoading: loadingDelivery } = useQuery({
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

  // ── normalise response shapes ───────────────────────────────────────────────
  // admin delivery: { summary, by_status, daily_volume }
  // vendor delivery: { summary, by_status, monthly_trend, invoice_summary }
  const summary     = deliveryRaw?.summary ?? {}
  const byStatus    = deliveryRaw?.by_status ?? {}
  const dailyVolume = deliveryRaw?.daily_volume ?? []

  const revSummary  = revenueRaw?.summary ?? {}
  const topVendors  = revenueRaw?.byVendor ?? revenueRaw?.by_vendor ?? []

  const allRiders   = ridersRaw?.data ?? ridersRaw ?? []
  const onlineCount = allRiders.filter(r => r.rider_profile?.is_online).length
  const idleCount   = allRiders.filter(r => r.rider_profile?.status === 'idle').length

  const recentOrders = (ordersRaw?.data ?? []).slice(0, 6)
  const totalOrders  = ordersRaw?.total

  const unreadMsgs = (messagesRaw?.data ?? messagesRaw ?? []).filter(m => !m.read_at).length

  // status bar max
  const byStatusMax = Math.max(...Object.values(byStatus).map(Number), 1)

  const STATUS_COLORS = {
    completed: 'var(--success)', in_progress: 'var(--primary)',
    assigned: 'var(--warning)', cancelled: 'var(--danger)',
    awaiting_dispatch: '#94A3B8', processing: '#94A3B8',
  }

  return (
    <div>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="page-header" style={{ marginBottom: 28 }}>
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="text-sm text-muted" style={{ marginTop: 2 }}>
            Welcome back, <strong>{user?.name}</strong> ·{' '}
            {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        {admin && (
          <div style={{ display: 'flex', gap: 10 }}>
            <Link to="/orders/new" className="btn btn-primary" style={{ fontSize: 13 }}>
              <Package size={14} /> New Order
            </Link>
          </div>
        )}
      </div>

      {/* ── Unread messages banner ──────────────────────────────────────────── */}
      {admin && unreadMsgs > 0 && (
        <Link to="/contact-messages" style={{ textDecoration: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 10, padding: '10px 16px', marginBottom: 20, cursor: 'pointer' }}>
            <MessageSquare size={16} color="#EA580C" />
            <span style={{ fontSize: 13, color: '#9A3412', fontWeight: 500 }}>
              You have <strong>{unreadMsgs} unread contact message{unreadMsgs !== 1 ? 's' : ''}</strong> — click to view
            </span>
          </div>
        </Link>
      )}

      {/* ── KPI row ────────────────────────────────────────────────────────── */}
      {loadingDelivery ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><span className="spinner" /></div>
      ) : (
        <>
          <div className="grid-4" style={{ marginBottom: 20 }}>
            <StatCard
              label="Total Orders"
              value={fmt(summary.total_orders)}
              sub={totalOrders ? `${fmt(totalOrders)} all-time` : undefined}
              icon={Package}
              color="var(--primary)"
              sparkData={dailyVolume}
              to="/orders"
            />
            <StatCard
              label="Completed"
              value={fmt(summary.completed)}
              icon={CheckCircle}
              color="var(--success)"
            />
            <StatCard
              label="In Progress"
              value={fmt(Number(summary.in_progress ?? 0) + Number(summary.assigned ?? 0))}
              sub={summary.assigned ? `${summary.assigned} assigned` : undefined}
              icon={Clock}
              color="var(--warning)"
            />
            <StatCard
              label="Success Rate"
              value={pct(summary.success_rate)}
              sub={summary.avg_completion_mins ? `avg ${summary.avg_completion_mins} min delivery` : undefined}
              icon={TrendingUp}
              color="#7C3AED"
            />
          </div>

          {admin && (
            <div className="grid-4" style={{ marginBottom: 24 }}>
              <StatCard
                label="Total Revenue"
                value={fmtKes(revSummary.total_revenue)}
                sub={revSummary.order_count ? `${fmt(revSummary.order_count)} paid orders` : undefined}
                icon={DollarSign}
                color="var(--success)"
                to="/reports"
              />
              <StatCard
                label="Avg Order Value"
                value={fmtKes(revSummary.avg_order_value)}
                icon={BarChart2}
                color="var(--primary)"
              />
              <StatCard
                label="Riders Online"
                value={`${onlineCount} / ${allRiders.length}`}
                sub={`${idleCount} available for dispatch`}
                icon={Truck}
                color="#0EA5E9"
                to="/riders"
              />
              <StatCard
                label="Cancelled"
                value={fmt(summary.cancelled)}
                sub={summary.total_orders ? `${pct(summary.cancelled / summary.total_orders * 100)} of orders` : undefined}
                icon={XCircle}
                color="var(--danger)"
              />
            </div>
          )}

          {/* ── Middle row: status breakdown + top metrics ──────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: admin ? '1fr 1fr 1fr' : '1fr 1fr', gap: 20, marginBottom: 24 }}>

            {/* Status breakdown */}
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <h3 style={{ margin: 0 }}>Order Status</h3>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>This month</span>
              </div>
              {Object.keys(byStatus).length === 0 ? (
                <p className="text-muted text-sm">No data yet.</p>
              ) : (
                Object.entries(byStatus).map(([status, count]) => (
                  <MiniBar
                    key={status}
                    label={status}
                    value={Number(count)}
                    max={byStatusMax}
                    color={STATUS_COLORS[status] ?? '#94A3B8'}
                  />
                ))
              )}
            </div>

            {/* Success rate ring + avg time */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <h3 style={{ margin: 0 }}>Performance</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <DonutRing pct={Number(summary.success_rate ?? 0)} color="var(--success)" size={80} />
                <div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>Delivery success rate</div>
                  <div style={{ fontSize: 22, fontFamily: 'var(--font-display)', fontWeight: 700 }}>{pct(summary.success_rate)}</div>
                </div>
              </div>
              {summary.avg_completion_mins && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--surface-muted)', borderRadius: 10, padding: '12px 16px' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: '#FFF0E8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Clock size={18} color="var(--primary)" />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Avg delivery time</div>
                    <div style={{ fontWeight: 700, fontSize: 16, fontFamily: 'var(--font-display)' }}>{summary.avg_completion_mins} min</div>
                  </div>
                </div>
              )}
              <div style={{ display: 'flex', gap: 10 }}>
                {[
                  ['Completed', summary.completed, 'var(--success)'],
                  ['Cancelled', summary.cancelled, 'var(--danger)'],
                  ['Pending',   (Number(summary.awaiting_dispatch ?? 0) + Number(summary.processing ?? 0)), '#94A3B8'],
                ].map(([l, v, c]) => (
                  <div key={l} style={{ flex: 1, background: 'var(--surface-muted)', borderRadius: 8, padding: '8px 10px', borderTop: `3px solid ${c}` }}>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 2 }}>{l}</div>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>{fmt(v)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Riders panel (admin only) */}
            {admin && (
              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <h3 style={{ margin: 0 }}>Riders</h3>
                  <Link to="/riders" style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600 }}>View all</Link>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                  {[
                    ['Total', allRiders.length, '#0EA5E9'],
                    ['Online', onlineCount, 'var(--success)'],
                    ['Available', idleCount, 'var(--warning)'],
                    ['On Delivery', allRiders.filter(r => r.rider_profile?.status === 'on_delivery').length, 'var(--primary)'],
                  ].map(([l, v, c]) => (
                    <div key={l} style={{ background: 'var(--surface-muted)', borderRadius: 8, padding: '10px 12px' }}>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 2 }}>{l}</div>
                      <div style={{ fontWeight: 700, fontSize: 20, fontFamily: 'var(--font-display)', color: c }}>{v}</div>
                    </div>
                  ))}
                </div>
                {allRiders.filter(r => r.rider_profile?.is_online).slice(0, 3).map(r => (
                  <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                      {r.name?.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{r.rider_profile?.vehicle_type} · {r.rider_profile?.status?.replace(/_/g, ' ')}</div>
                    </div>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--success)', flexShrink: 0 }} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Bottom row: recent orders + top vendors ─────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: admin && topVendors.length ? '1fr 320px' : '1fr', gap: 20 }}>

            {/* Recent orders */}
            <div className="card" style={{ padding: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px 14px' }}>
                <h3 style={{ margin: 0 }}>Recent Orders</h3>
                <Link to="/orders" style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600 }}>View all</Link>
              </div>
              {recentOrders.length === 0 ? (
                <p className="text-muted text-sm" style={{ padding: '0 20px 20px' }}>No orders yet.</p>
              ) : (
                <div className="table-wrap">
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
                        <tr key={o.id} style={{ cursor: 'pointer' }}>
                          <td>
                            <Link to={`/orders/${o.id}`} style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>#{o.id}</Link>
                            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{new Date(o.created_at).toLocaleDateString()}</div>
                          </td>
                          {admin && <td style={{ fontSize: 13 }}>{o.vendor?.name ?? '—'}</td>}
                          <td>
                            <div style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <MapPin size={11} color="var(--primary)" style={{ flexShrink: 0 }} />
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>
                                {o.pickup_address?.split(',')[0]} → {o.dropoff_address?.split(',')[0]}
                              </span>
                            </div>
                          </td>
                          <td>
                            <span className={`badge ${STATUS_BADGE[o.status] ?? 'badge-neutral'}`}>
                              {o.status?.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td style={{ fontWeight: 700, fontSize: 13, textAlign: 'right', color: 'var(--primary)' }}>
                            KES {Number(o.total_price ?? 0).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Top vendors by revenue (admin only) */}
            {admin && topVendors.length > 0 && (
              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <h3 style={{ margin: 0 }}>Top Vendors</h3>
                  <Link to="/vendors" style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600 }}>Manage</Link>
                </div>
                {topVendors.slice(0, 6).map((v, i) => {
                  const maxRev = Number(topVendors[0]?.revenue ?? 1)
                  const w = Math.max(4, Math.round((Number(v.revenue) / maxRev) * 100))
                  return (
                    <div key={v.vendor_id ?? i} style={{ marginBottom: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>
                          {v.vendor?.name ?? `Vendor #${v.vendor_id}`}
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', flexShrink: 0 }}>
                          {fmtKes(v.revenue)}
                        </span>
                      </div>
                      <div style={{ height: 5, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{ width: `${w}%`, height: '100%', background: 'var(--primary)', borderRadius: 99 }} />
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{fmt(v.orders)} orders</div>
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
