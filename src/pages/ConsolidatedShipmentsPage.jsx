import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Package, Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import api from '../lib/api'
import { useAuthStore } from '../store/authStore'

const STATUS_CONFIG = {
  draft:                { label: 'Draft',          color: '#6B7280' },
  manifested:           { label: 'Manifested',      color: '#3B82F6' },
  in_transit:           { label: 'In Transit',      color: '#F59E0B' },
  arrived_at_warehouse: { label: 'At Warehouse',    color: '#8B5CF6' },
  processing:           { label: 'Processing',      color: '#EC4899' },
  dispatched:           { label: 'Dispatched',      color: '#0EA5E9' },
  completed:            { label: 'Completed',       color: '#22C55E' },
}

export default function ConsolidatedShipmentsPage() {
  const { isAdmin, isWarehouseStaff, isVendor } = useAuthStore()
  const admin     = isAdmin()
  const warehouse = isWarehouseStaff()
  const canCreate = admin || isVendor()
  const showSeller = admin || warehouse  // both need to see which seller owns the shipment

  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['shipments', statusFilter, page],
    queryFn: () =>
      api.get('/shipments', { params: { status: statusFilter || undefined, page } })
         .then(r => r.data.data),
    placeholderData: (prev) => prev,
  })

  // Laravel paginate puts pagination fields at root of the data object
  const shipments = data?.data || []
  const lastPage  = data?.last_page ?? 1
  const total     = data?.total ?? 0
  const curPage   = data?.current_page ?? page

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Header */}
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <h1 className="page-title">Consolidated Shipments</h1>
          {total > 0 && (
            <p style={{ margin: '3px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
              {total} shipment{total !== 1 ? 's' : ''}
              {statusFilter ? ` · ${STATUS_CONFIG[statusFilter]?.label}` : ''}
            </p>
          )}
        </div>
        {canCreate && (
          <Link to="/shipments/new" className="btn btn-primary">
            <Plus size={15} /> New Shipment
          </Link>
        )}
      </div>

      {/* Status filter tabs */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2, flexWrap: 'nowrap' }}>
        {[{ value: '', label: 'All' }, ...Object.entries(STATUS_CONFIG).map(([v, c]) => ({ value: v, label: c.label }))].map(tab => (
          <button
            key={tab.value}
            onClick={() => { setStatusFilter(tab.value); setPage(1) }}
            style={{
              padding: '5px 14px', borderRadius: 20, fontSize: 13, fontWeight: 500,
              border: '1.5px solid',
              borderColor: statusFilter === tab.value ? 'var(--primary)' : 'var(--border)',
              background: statusFilter === tab.value ? 'rgba(255,94,20,0.08)' : 'var(--surface)',
              color: statusFilter === tab.value ? 'var(--primary)' : 'var(--text-secondary)',
              cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
              transition: 'all 0.12s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table card */}
      <div className="card" style={{ padding: 0 }}>
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
            <span className="spinner" />
          </div>
        ) : shipments.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Package size={24} /></div>
            <div className="empty-state-title">No shipments found</div>
            <div className="empty-state-body">
              {statusFilter ? 'Try selecting a different status filter.' : 'Shipments will appear here once created by sellers.'}
            </div>
            {canCreate && !statusFilter && (
              <Link to="/shipments/new" className="btn btn-primary" style={{ marginTop: 12 }}>
                <Plus size={15} /> Create First Shipment
              </Link>
            )}
            {statusFilter && (
              <button className="btn btn-secondary" style={{ marginTop: 12 }} onClick={() => setStatusFilter('')}>
                Clear filter
              </button>
            )}
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table" style={{ opacity: isFetching ? 0.7 : 1, transition: 'opacity 0.15s' }}>
              <thead>
                <tr>
                  <th>Master Code</th>
                  <th>Title</th>
                  {showSeller && <th>Seller</th>}
                  <th>Items</th>
                  <th>Carrier / Tracking</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th style={{ width: 70 }}></th>
                </tr>
              </thead>
              <tbody>
                {shipments.map(s => {
                  const cfg = STATUS_CONFIG[s.status] ?? STATUS_CONFIG.draft
                  return (
                    <tr key={s.id}>
                      <td>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 13, color: 'var(--primary)' }}>
                          {s.master_code}
                        </span>
                      </td>
                      <td style={{ fontWeight: 500, maxWidth: 200 }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</div>
                      </td>
                      {showSeller && (
                        <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{s.vendor?.name ?? '—'}</td>
                      )}
                      <td>
                        <span style={{ background: 'rgba(255,94,20,0.1)', color: 'var(--primary)', padding: '2px 9px', borderRadius: 12, fontWeight: 700, fontSize: 12 }}>
                          {s.items_count ?? 0}
                        </span>
                      </td>
                      <td style={{ fontSize: 12 }}>
                        <div style={{ color: 'var(--text-secondary)' }}>{s.carrier || '—'}</div>
                        {s.carrier_tracking && (
                          <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', fontSize: 11 }}>{s.carrier_tracking}</div>
                        )}
                      </td>
                      <td>
                        <span style={{ fontSize: 11.5, fontWeight: 600, padding: '3px 9px', borderRadius: 20, background: cfg.color + '18', color: cfg.color }}>
                          {cfg.label}
                        </span>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                        {new Date(s.created_at).toLocaleDateString()}
                      </td>
                      <td>
                        <Link to={`/shipments/${s.id}`} className="btn btn-secondary btn-sm">View</Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {lastPage > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderTop: '1px solid var(--border)', fontSize: 13, color: 'var(--text-secondary)' }}>
            <span>{total} total</span>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft size={14} />
              </button>
              <span style={{ padding: '0 8px' }}>Page {curPage} of {lastPage}</span>
              <button className="btn btn-secondary btn-sm" disabled={page === lastPage} onClick={() => setPage(p => p + 1)}>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
