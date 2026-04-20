import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '../lib/api'
import { Package, ChevronRight } from 'lucide-react'

const STATUS_COLORS = {
  completed: 'badge-success', cancelled: 'badge-danger',
  in_progress: 'badge-primary', assigned: 'badge-warning',
  awaiting_dispatch: 'badge-neutral', created: 'badge-neutral',
}

export default function RiderDeliveriesPage() {
  const [filter, setFilter] = useState('all')

  const { data, isLoading } = useQuery({
    queryKey: ['rider-deliveries'],
    queryFn: () => api.get('/rider/deliveries').then(r => r.data.data),
    refetchInterval: 30_000,
  })

  const all = data?.data ?? data ?? []
  const deliveries = filter === 'all' ? all : all.filter(d => d.status === filter)

  const stats = {
    total:     all.length,
    completed: all.filter(d => d.status === 'completed').length,
    active:    all.filter(d => ['assigned','in_progress'].includes(d.status)).length,
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Deliveries</h1>
          <p className="text-sm text-muted">{stats.total} total · {stats.completed} completed · {stats.active} active</p>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          ['Total',     stats.total,     'var(--text-primary)'],
          ['Completed', stats.completed, 'var(--success)'],
          ['Active',    stats.active,    'var(--primary)'],
        ].map(([label, val, color]) => (
          <div key={label} className="card" style={{ padding: '14px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{label}</div>
            <div style={{ fontWeight: 800, fontSize: 22, color }}>{val}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {[['all','All'],['assigned','Assigned'],['in_progress','In Progress'],['completed','Completed'],['cancelled','Cancelled']].map(([val, label]) => (
          <button
            key={val}
            onClick={() => setFilter(val)}
            className="btn btn-sm"
            style={{
              background: filter === val ? 'var(--primary)' : 'var(--surface-muted)',
              color: filter === val ? '#fff' : 'var(--text-primary)',
              border: `1px solid ${filter === val ? 'var(--primary)' : 'var(--border)'}`,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}><span className="spinner" /></div>
      ) : deliveries.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px 24px' }}>
          <Package size={36} color="var(--border)" style={{ marginBottom: 12 }} />
          <p className="text-muted text-sm">No deliveries found.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {deliveries.map(d => (
            <Link
              key={d.id}
              to={`/orders/${d.id}`}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', transition: 'box-shadow 0.15s' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--surface-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Package size={20} color="var(--primary)" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>Order #{d.id}</span>
                    <span className={`badge ${STATUS_COLORS[d.status] ?? 'badge-neutral'}`}>{d.status?.replace(/_/g, ' ')}</span>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {d.pickup_address} → {d.dropoff_address}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                    {new Date(d.created_at).toLocaleDateString()} · {d.packages?.length ?? 0} pkg · KES {Number(d.total_price).toLocaleString()}
                  </div>
                </div>
                <ChevronRight size={16} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
