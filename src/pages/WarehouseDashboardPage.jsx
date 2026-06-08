import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Package, CheckCircle, Clock, Truck, ArrowRight, PackageSearch } from 'lucide-react'
import api from '../lib/api'

const SHIPMENT_STATUS_COLOR = {
  arrived_at_warehouse: { bg: '#EFF6FF', color: '#1D4ED8', label: 'Arrived — Ready to Process' },
  processing:           { bg: '#FFF7ED', color: '#C2410C', label: 'Processing' },
  in_transit:           { bg: '#F0FDF4', color: '#15803D', label: 'In Transit' },
  dispatched:           { bg: '#F5F3FF', color: '#7C3AED', label: 'Dispatched to Stations' },
  draft:                { bg: 'var(--surface-muted)', color: 'var(--text-secondary)', label: 'Draft' },
}

export default function WarehouseDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['warehouse-shipments'],
    queryFn: () => api.get('/shipments', { params: { page: 1 } }).then(r => r.data.data),
    refetchInterval: 30_000,
  })

  const shipments    = data?.data ?? []
  const needsWork    = shipments.filter(s => ['arrived_at_warehouse','processing'].includes(s.status))
  const inTransit    = shipments.filter(s => s.status === 'in_transit')
  const dispatched   = shipments.filter(s => s.status === 'dispatched')
  const totalItems   = shipments.reduce((sum, s) => sum + (s.items_count ?? 0), 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px' }}>Warehouse</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: 0 }}>
          Inbound shipments, de-consolidation and sorting
        </p>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14 }}>
        {[
          { label: 'Needs Processing', value: needsWork.length, icon: Clock,         color: '#F59E0B', bg: '#FFFBEB' },
          { label: 'In Transit',       value: inTransit.length,  icon: Truck,         color: '#3B82F6', bg: '#EFF6FF' },
          { label: 'Dispatched',       value: dispatched.length, icon: CheckCircle,   color: '#22C55E', bg: '#F0FDF4' },
          { label: 'Total Items',      value: totalItems,         icon: Package,       color: 'var(--primary)', bg: '#FFF0E8' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card" style={{ padding: '16px 18px', display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={18} style={{ color }} />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 2 }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Action highlight: shipments needing work */}
      {needsWork.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>
              Needs Your Attention
            </h2>
            <Link to="/shipments" style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              All shipments <ArrowRight size={13} />
            </Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {needsWork.map(s => {
              const cfg = SHIPMENT_STATUS_COLOR[s.status] ?? SHIPMENT_STATUS_COLOR.draft
              return (
                <Link
                  key={s.id}
                  to={`/shipments/${s.id}`}
                  style={{ textDecoration: 'none' }}
                >
                  <div className="card card-hover" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer' }}>
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <PackageSearch size={20} style={{ color: cfg.color }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15 }}>{s.master_code}</span>
                        <span style={{ fontSize: 11.5, fontWeight: 600, padding: '2px 8px', borderRadius: 99, background: cfg.bg, color: cfg.color }}>
                          {cfg.label}
                        </span>
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>{s.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>
                        {s.items_count ?? '—'} items · {s.carrier ?? 'Unknown carrier'} · {s.origin_country ?? '—'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                      <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                        {new Date(s.created_at).toLocaleDateString()}
                      </span>
                      <ArrowRight size={16} style={{ color: 'var(--text-tertiary)' }} />
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* In transit section */}
      {inTransit.length > 0 && (
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 10px' }}>In Transit (Incoming)</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
            {inTransit.map(s => (
              <Link key={s.id} to={`/shipments/${s.id}`} style={{ textDecoration: 'none' }}>
                <div className="card card-hover" style={{ padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14 }}>{s.master_code}</span>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: '#EFF6FF', color: '#1D4ED8', fontWeight: 600 }}>In Transit</span>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '6px 0 4px' }}>{s.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                    {s.items_count ?? '—'} items · {s.carrier ?? '—'} · {s.carrier_tracking}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {isLoading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
          <span className="spinner" />
        </div>
      )}

      {!isLoading && shipments.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon"><Package size={24} /></div>
          <div className="empty-state-title">No shipments yet</div>
          <div className="empty-state-body">Consolidated shipments from sellers will appear here once created.</div>
        </div>
      )}
    </div>
  )
}
