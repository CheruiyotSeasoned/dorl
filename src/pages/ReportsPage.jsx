import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '../lib/api'
import { useAuthStore } from '../store/authStore'
import {
  Package, Truck, DollarSign, Clock, TrendingUp, CheckCircle,
  XCircle, AlertTriangle, BarChart2, Star, FileText, Zap,
} from 'lucide-react'
import DatePicker from '../components/DatePicker'

// ── Shared primitives ──────────────────────────────────────────────────────────
function KPI({ label, value, sub, icon: Icon, color = 'var(--primary)' }) {
  return (
    <div className="stat-card">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ minWidth: 0 }}>
          <div className="stat-value" style={{ color }}>{value ?? '—'}</div>
          <div className="stat-label">{label}</div>
          {sub && <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 3 }}>{sub}</div>}
        </div>
        <div style={{ padding: 10, borderRadius: 10, background: color + '18', flexShrink: 0 }}>
          <Icon size={22} color={color} strokeWidth={1.75} />
        </div>
      </div>
    </div>
  )
}

function Card({ title, children }) {
  return (
    <div className="card" style={{ marginBottom: 20 }}>
      {title && <h3 style={{ marginBottom: 16, fontSize: 14 }}>{title}</h3>}
      {children}
    </div>
  )
}

function StatusGrid({ byStatus }) {
  if (!byStatus || Object.keys(byStatus).length === 0) return <p className="text-muted text-sm">No data.</p>
  const colors = {
    completed: 'var(--success)', cancelled: 'var(--danger)', in_progress: 'var(--primary)',
    assigned: 'var(--warning)', awaiting_dispatch: '#8B5CF6', processing: 'var(--text-secondary)',
  }
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 }}>
      {Object.entries(byStatus).map(([status, count]) => (
        <div key={status} style={{ background: 'var(--surface-muted)', borderRadius: 10, padding: '12px 14px', borderLeft: `3px solid ${colors[status] ?? 'var(--border)'}` }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: colors[status] ?? 'var(--text-primary)' }}>{count}</div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2, textTransform: 'capitalize' }}>{status.replace(/_/g, ' ')}</div>
        </div>
      ))}
    </div>
  )
}

function MiniBar({ rows, valueKey, labelKey, maxValue, color = 'var(--primary)', formatValue }) {
  if (!rows?.length) return <p className="text-muted text-sm">No data.</p>
  const max = maxValue ?? Math.max(...rows.map(r => Number(r[valueKey]) || 0), 1)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {rows.map((r, i) => {
        const val = Number(r[valueKey]) || 0
        const pct = Math.round((val / max) * 100)
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 80, fontSize: 11, color: 'var(--text-secondary)', flexShrink: 0, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {r[labelKey]}
            </div>
            <div style={{ flex: 1, height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.4s' }} />
            </div>
            <div style={{ width: 64, fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', flexShrink: 0 }}>
              {formatValue ? formatValue(val) : val}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function DateFilter({ from, to, onFrom, onTo }) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
      <DatePicker value={from} onChange={onFrom} placeholder="From date" style={{ width: 168 }} maxDate={to || undefined} />
      <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>—</span>
      <DatePicker value={to} onChange={onTo} placeholder="To date" style={{ width: 168 }} minDate={from || undefined} />
    </div>
  )
}

const fmt  = (n) => n != null ? `KES ${Number(n).toLocaleString()}` : '—'
const pct  = (n) => n != null ? `${n}%` : '—'
const mins = (n) => n != null ? `${n} min` : '—'

// ── Admin reports ──────────────────────────────────────────────────────────────
function AdminReports({ from, to, qs }) {
  const { data: delivery, isLoading: ld } = useQuery({
    queryKey: ['rpt-delivery', from, to],
    queryFn: () => api.get(`/admin/reports/delivery${qs}`).then(r => r.data.data),
  })
  const { data: revenue, isLoading: lr } = useQuery({
    queryKey: ['rpt-revenue', from, to],
    queryFn: () => api.get(`/admin/reports/revenue${qs}`).then(r => r.data.data),
  })
  const { data: riderData, isLoading: lrd } = useQuery({
    queryKey: ['rpt-rider', from, to],
    queryFn: () => api.get(`/admin/reports/rider${qs}`).then(r => r.data.data),
  })
  const { data: dispatchData } = useQuery({
    queryKey: ['rpt-dispatch', from, to],
    queryFn: () => api.get(`/admin/reports/dispatch${qs}`).then(r => r.data.data),
  })

  if (ld || lr || lrd) return <div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}><span className="spinner" /></div>

  const s  = delivery?.summary
  const rv = revenue?.summary
  const iv = revenue?.invoiceSummary
  const ds = dispatchData?.summary

  return (
    <>
      {/* Delivery KPIs */}
      <div className="grid-4" style={{ marginBottom: 20 }}>
        <KPI label="Total Orders"     value={s?.total_orders}              icon={Package}     color="var(--primary)" />
        <KPI label="Completed"        value={s?.completed}                 icon={CheckCircle} color="var(--success)" />
        <KPI label="Success Rate"     value={pct(s?.success_rate)}         icon={TrendingUp}  color="var(--success)" />
        <KPI label="Avg Completion"   value={mins(s?.avg_completion_mins)} icon={Clock}       color="var(--warning)" sub="pickup → delivered" />
      </div>

      {/* Revenue KPIs */}
      <div className="grid-4" style={{ marginBottom: 20 }}>
        <KPI label="Total Revenue"    value={fmt(rv?.total_revenue)}       icon={DollarSign}  color="var(--primary)" />
        <KPI label="Avg Order Value"  value={rv?.avg_order_value ? `KES ${Number(rv.avg_order_value).toFixed(0)}` : '—'} icon={TrendingUp} color="var(--success)" />
        <KPI label="Collected"        value={fmt(iv?.paid_revenue)}        icon={CheckCircle} color="var(--success)" sub={`${iv?.paid_count ?? 0} invoices paid`} />
        <KPI label="Outstanding"      value={fmt(iv?.pending_revenue)}     icon={AlertTriangle} color="var(--warning)" sub={`${iv?.unpaid_count ?? 0} unpaid`} />
      </div>

      {/* Dispatch KPIs */}
      {ds && (
        <div className="grid-4" style={{ marginBottom: 20 }}>
          <KPI label="Dispatch Attempts"  value={ds.total_attempts}            icon={Zap}          color="var(--primary)" />
          <KPI label="Acceptance Rate"    value={pct(ds.acceptance_rate)}      icon={CheckCircle}  color="var(--success)" />
          <KPI label="Rejection Rate"     value={pct(ds.rejection_rate)}       icon={XCircle}      color="var(--danger)" />
          <KPI label="Avg Response Time"  value={ds.avg_response_secs ? `${ds.avg_response_secs}s` : '—'} icon={Clock} color="var(--warning)" />
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Orders by status */}
        <Card title="Orders by Status">
          <StatusGrid byStatus={delivery?.by_status} />
        </Card>

        {/* Daily volume */}
        <Card title="Daily Volume (this period)">
          <MiniBar
            rows={delivery?.daily_volume ?? []}
            labelKey="date"
            valueKey="orders"
            color="var(--primary)"
          />
        </Card>
      </div>

      {/* Revenue by vendor */}
      <Card title="Revenue by Vendor">
        {!revenue?.byVendor?.length ? (
          <p className="text-muted text-sm">No completed orders in this period.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Vendor</th><th>Orders</th><th>Revenue</th></tr></thead>
              <tbody>
                {revenue.byVendor.map(v => (
                  <tr key={v.vendor_id}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{v.vendor?.name ?? '—'}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{v.vendor?.email}</div>
                    </td>
                    <td>{v.orders}</td>
                    <td style={{ fontWeight: 600 }}>{fmt(v.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Monthly revenue trend */}
      {revenue?.monthlyTrend?.length > 0 && (
        <Card title="Revenue Trend — Last 6 Months">
          <MiniBar
            rows={revenue.monthlyTrend}
            labelKey="month"
            valueKey="revenue"
            color="var(--success)"
            formatValue={fmt}
          />
        </Card>
      )}

      {/* Rider performance */}
      <Card title="Rider Performance">
        {!riderData?.length ? (
          <p className="text-muted text-sm">No rider data yet.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Rider</th>
                  <th>Deliveries</th>
                  <th>Completed</th>
                  <th>Success Rate</th>
                  <th>Avg Time</th>
                  <th>Score</th>
                </tr>
              </thead>
              <tbody>
                {riderData.map(r => (
                  <tr key={r.rider_id}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{r.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{r.vehicle_type}</div>
                    </td>
                    <td>{r.total_deliveries}</td>
                    <td>{r.completed}</td>
                    <td>
                      {r.success_rate != null ? (
                        <span className={`badge ${r.success_rate >= 80 ? 'badge-success' : r.success_rate >= 50 ? 'badge-warning' : 'badge-danger'}`}>
                          {r.success_rate}%
                        </span>
                      ) : '—'}
                    </td>
                    <td style={{ fontSize: 12 }}>{mins(r.avg_delivery_time_mins)}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Star size={12} color="var(--warning)" fill="var(--warning)" />
                        {r.reliability_score ?? '—'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Dispatch per rider */}
      {dispatchData?.perRider?.length > 0 && (
        <Card title="Dispatch — Top Riders by Offers">
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Rider</th><th>Offers</th><th>Accepted</th><th>Rejected</th><th>Accept Rate</th></tr></thead>
              <tbody>
                {dispatchData.perRider.map(r => (
                  <tr key={r.rider_id}>
                    <td style={{ fontWeight: 600, fontSize: 13 }}>{r.rider?.name ?? '—'}</td>
                    <td>{r.offers}</td>
                    <td style={{ color: 'var(--success)', fontWeight: 600 }}>{r.accepted}</td>
                    <td style={{ color: 'var(--danger)' }}>{r.rejected}</td>
                    <td>
                      <span className={`badge ${r.offers > 0 && r.accepted / r.offers >= 0.7 ? 'badge-success' : 'badge-warning'}`}>
                        {r.offers > 0 ? Math.round(r.accepted / r.offers * 100) : 0}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </>
  )
}

// ── Vendor reports ─────────────────────────────────────────────────────────────
function VendorReports({ from, to, qs }) {
  const { data, isLoading } = useQuery({
    queryKey: ['rpt-vendor', from, to],
    queryFn: () => api.get(`/reports/my-delivery${qs}`).then(r => r.data.data),
  })

  if (isLoading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}><span className="spinner" /></div>

  const s  = data?.summary
  const iv = data?.invoiceSummary

  return (
    <>
      {/* Delivery KPIs */}
      <div className="grid-4" style={{ marginBottom: 20 }}>
        <KPI label="My Orders"      value={s?.total_orders}              icon={Package}     color="var(--primary)" />
        <KPI label="Completed"      value={s?.completed}                 icon={CheckCircle} color="var(--success)" />
        <KPI label="Success Rate"   value={pct(s?.success_rate)}         icon={TrendingUp}  color="var(--success)" />
        <KPI label="Avg Delivery"   value={mins(s?.avg_completion_mins)} icon={Clock}       color="var(--warning)" sub="end-to-end time" />
      </div>

      {/* Invoice / spend KPIs */}
      <div className="grid-4" style={{ marginBottom: 20 }}>
        <KPI label="Total Spend"    value={fmt(s?.total_spend)}          icon={DollarSign}  color="var(--primary)" />
        <KPI label="Total Billed"   value={fmt(iv?.total_billed)}        icon={FileText}    color="var(--secondary)" sub={`${iv?.total ?? 0} invoices`} />
        <KPI label="Amount Paid"    value={fmt(iv?.paid_amount)}         icon={CheckCircle} color="var(--success)" sub={`${iv?.paid_count ?? 0} invoices`} />
        <KPI label="Outstanding"    value={fmt(iv?.outstanding)}         icon={AlertTriangle} color="var(--warning)" sub={`${iv?.unpaid_count ?? 0} unpaid`} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Orders by status */}
        <Card title="My Orders by Status">
          <StatusGrid byStatus={data?.byStatus} />
        </Card>

        {/* Monthly trend */}
        <Card title="Monthly Order Trend">
          <MiniBar
            rows={data?.monthlyTrend ?? []}
            labelKey="month"
            valueKey="orders"
            color="var(--primary)"
          />
        </Card>
      </div>

      {/* Monthly spend trend */}
      {data?.monthlyTrend?.length > 0 && (
        <Card title="Monthly Spend Trend">
          <MiniBar
            rows={data.monthlyTrend}
            labelKey="month"
            valueKey="spend"
            color="var(--success)"
            formatValue={fmt}
          />
        </Card>
      )}

      {/* Outstanding invoices CTA */}
      {iv?.outstanding > 0 && (
        <div style={{ background: '#FFF7ED', border: '1px solid #FDBA74', borderRadius: 12, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#92400E' }}>
              {fmt(iv.outstanding)} outstanding
            </div>
            <div style={{ fontSize: 13, color: '#B45309', marginTop: 2 }}>
              You have {iv.unpaid_count} unpaid invoice{iv.unpaid_count !== 1 ? 's' : ''}
            </div>
          </div>
          <Link to="/invoices" className="btn btn-sm" style={{ background: '#EA580C', color: '#fff', border: 'none' }}>
            View Invoices
          </Link>
        </div>
      )}
    </>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const { isAdmin } = useAuthStore()
  const admin = isAdmin()

  const [from, setFrom] = useState(() => {
    const d = new Date(); d.setDate(1)
    return d.toISOString().split('T')[0]
  })
  const [to, setTo] = useState(() => new Date().toISOString().split('T')[0])

  const params = new URLSearchParams()
  if (from) params.set('from', from)
  if (to)   params.set('to', to)
  const qs = '?' + params.toString()

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="text-sm text-muted">{admin ? 'Platform-wide analytics' : 'Your delivery analytics'}</p>
        </div>
        <DateFilter from={from} to={to} onFrom={setFrom} onTo={setTo} />
      </div>

      {admin
        ? <AdminReports from={from} to={to} qs={qs} />
        : <VendorReports from={from} to={to} qs={qs} />
      }
    </div>
  )
}
