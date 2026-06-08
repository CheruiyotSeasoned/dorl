import { useState, useEffect, useRef, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '../lib/api'
import { Plus, MapPin, Search, ChevronLeft, ChevronRight, X, SlidersHorizontal, Package } from 'lucide-react'
import { useAuthStore } from '../store/authStore'

// ── Status tabs config ────────────────────────────────────────────────────────
const STATUS_TABS = [
  { value: '',                  label: 'All' },
  { value: 'created',           label: 'Created' },
  { value: 'processing',        label: 'Processing' },
  { value: 'awaiting_dispatch', label: 'Awaiting Dispatch' },
  { value: 'assigned',          label: 'Assigned' },
  { value: 'in_progress',       label: 'In Progress' },
  { value: 'completed',         label: 'Completed' },
  { value: 'cancelled',         label: 'Cancelled' },
]

const STATUS_BADGE = {
  completed:        'badge-success',
  cancelled:        'badge-danger',
  in_progress:      'badge-primary',
  assigned:         'badge-warning',
  awaiting_dispatch:'badge-neutral',
  processing:       'badge-neutral',
  created:          'badge-neutral',
  at_hub:           'badge-secondary',
  in_slot:          'badge-secondary',
}

function StatusBadge({ status }) {
  return (
    <span className={`badge ${STATUS_BADGE[status] ?? 'badge-neutral'}`}>
      {status?.replace(/_/g, ' ')}
    </span>
  )
}

export default function OrdersPage() {
  const { isAdmin, isVendor } = useAuthStore()
  const admin  = isAdmin()
  const vendor = isVendor()

  const [page,         setPage]         = useState(1)
  const [status,       setStatus]       = useState('')
  const [searchInput,  setSearchInput]  = useState('')
  const [search,       setSearch]       = useState('')   // debounced value
  const [showFilters,  setShowFilters]  = useState(false)
  const inputRef = useRef()

  // Debounce search: only hit API 350ms after user stops typing
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput)
      setPage(1)
    }, 350)
    return () => clearTimeout(t)
  }, [searchInput])

  const clearSearch = () => {
    setSearchInput('')
    setSearch('')
    setPage(1)
    inputRef.current?.focus()
  }

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['orders', page, status, search],
    queryFn: () => admin
      ? api.get('/admin/orders', { params: { page, status: status || undefined, search: search || undefined } }).then(r => r.data.data)
      : api.get('/orders', { params: { page, status: status || undefined } }).then(r => r.data.data),
    placeholderData: (prev) => prev,
  })

  const orders   = data?.data ?? []
  const lastPage = data?.last_page ?? 1
  const total    = data?.total ?? 0

  const activeFilters = [
    search  && { key: 'search',  label: `"${search}"`,              clear: clearSearch },
    status  && { key: 'status',  label: STATUS_TABS.find(t => t.value === status)?.label ?? status, clear: () => { setStatus(''); setPage(1) } },
  ].filter(Boolean)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Page header ── */}
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <h1 className="page-title">{admin ? 'All Orders' : 'My Orders'}</h1>
          {total > 0 && (
            <p style={{ margin: '3px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
              {total.toLocaleString()} order{total !== 1 ? 's' : ''}
              {(search || status) && ' matching filters'}
            </p>
          )}
        </div>
        {(admin || vendor) && (
          <Link to="/orders/new" className="btn btn-primary">
            <Plus size={15} /> New Order
          </Link>
        )}
      </div>

      {/* ── Search + filters bar ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* Search input */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', gap: 8,
            background: 'var(--surface)',
            border: `1.5px solid ${searchInput ? 'var(--primary)' : 'var(--border)'}`,
            borderRadius: 10,
            padding: '0 12px',
            boxShadow: searchInput ? '0 0 0 3px rgba(255,94,20,0.10)' : 'var(--shadow-xs)',
            transition: 'border-color 0.15s, box-shadow 0.15s',
            height: 42,
          }}>
            <Search size={15} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
            <input
              ref={inputRef}
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder={admin ? 'Search by order #, tracking code, recipient name, phone, address…' : 'Search orders…'}
              style={{
                flex: 1, background: 'none', border: 'none', outline: 'none',
                fontSize: 14, color: 'var(--text-primary)', minWidth: 0,
              }}
            />
            {/* Loading spinner while debounce / fetching */}
            {isFetching && !isLoading && (
              <span className="spinner" style={{ width: 14, height: 14, flexShrink: 0 }} />
            )}
            {searchInput && !isFetching && (
              <button
                onClick={clearSearch}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', display: 'flex', padding: 2, borderRadius: 4 }}
                title="Clear search"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Mobile filter toggle */}
          <button
            className="btn btn-secondary"
            style={{ height: 42, padding: '0 14px', flexShrink: 0, position: 'relative' }}
            onClick={() => setShowFilters(f => !f)}
          >
            <SlidersHorizontal size={15} />
            {activeFilters.length > 0 && (
              <span style={{ position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: '50%', background: 'var(--primary)', color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {activeFilters.length}
              </span>
            )}
          </button>
        </div>

        {/* Status tabs — always visible on desktop, toggle on mobile */}
        <div style={{
          overflowX: 'auto',
          display: showFilters || window.innerWidth >= 640 ? 'flex' : 'none',
          gap: 6,
          paddingBottom: 2,
        }}>
          {STATUS_TABS.map(tab => (
            <button
              key={tab.value}
              onClick={() => { setStatus(tab.value); setPage(1) }}
              style={{
                padding: '5px 14px', borderRadius: 20, fontSize: 13, fontWeight: 500,
                border: '1.5px solid',
                borderColor: status === tab.value ? 'var(--primary)' : 'var(--border)',
                background: status === tab.value ? 'rgba(255,94,20,0.08)' : 'var(--surface)',
                color: status === tab.value ? 'var(--primary)' : 'var(--text-secondary)',
                cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                transition: 'all 0.12s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Active filter chips */}
        {activeFilters.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Filtered by:</span>
            {activeFilters.map(f => (
              <span key={f.key} style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '3px 8px 3px 10px', borderRadius: 99,
                background: 'rgba(255,94,20,0.08)', color: 'var(--primary)',
                fontSize: 12, fontWeight: 500,
              }}>
                {f.label}
                <button onClick={f.clear} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', display: 'flex', padding: 1 }}>
                  <X size={12} />
                </button>
              </span>
            ))}
            {activeFilters.length > 1 && (
              <button
                onClick={() => { clearSearch(); setStatus('') }}
                style={{ fontSize: 12, color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
              >
                Clear all
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Orders table ── */}
      <div className="card" style={{ padding: 0 }}>
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
            <span className="spinner" />
          </div>
        ) : orders.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Package size={22} /></div>
            <div className="empty-state-title">
              {search || status ? 'No orders match your filters' : 'No orders yet'}
            </div>
            <div className="empty-state-body">
              {search
                ? `Nothing found for "${search}". Try a different search term.`
                : status
                ? 'Try selecting a different status filter.'
                : 'Orders will appear here once created.'}
            </div>
            {(search || status) && (
              <button className="btn btn-secondary" style={{ marginTop: 12 }} onClick={() => { clearSearch(); setStatus('') }}>
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Order</th>
                  {admin && <th>Vendor</th>}
                  <th>Recipient</th>
                  <th>Route</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th style={{ width: 100 }}></th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id} style={{ opacity: isFetching ? 0.6 : 1, transition: 'opacity 0.15s' }}>
                    <td>
                      <Link to={`/orders/${o.id}`} style={{ fontWeight: 700, fontSize: 13, fontFamily: 'var(--font-display)' }}>
                        #{o.tracking_code ?? o.id}
                      </Link>
                      <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 1 }}>
                        {new Date(o.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    {admin && (
                      <td style={{ fontSize: 13 }}>{o.vendor?.name ?? '—'}</td>
                    )}
                    <td>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{o.recipient_name || '—'}</div>
                      {o.recipient_phone && (
                        <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{o.recipient_phone}</div>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 5, fontSize: 12, color: 'var(--text-secondary)', maxWidth: 220 }}>
                        <MapPin size={11} color="var(--primary)" style={{ flexShrink: 0, marginTop: 2 }} />
                        <div>
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {o.pickup_address?.split(',')[0]}
                          </div>
                          <div style={{ color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            → {o.dropoff_address?.split(',')[0]}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, fontSize: 13, fontFamily: 'var(--font-display)', color: 'var(--primary)' }}>
                        KES {Number(o.total_price ?? 0).toLocaleString()}
                      </span>
                    </td>
                    <td><StatusBadge status={o.status} /></td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <Link to={`/orders/${o.id}`} className="btn btn-secondary btn-sm">View</Link>
                        <Link to={`/orders/${o.id}/tracking`} className="btn btn-ghost btn-sm">Track</Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {lastPage > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderTop: '1px solid var(--border)', fontSize: 13, color: 'var(--text-secondary)' }}>
            <span>{total.toLocaleString()} total</span>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft size={14} />
              </button>
              {/* Page number pills */}
              {Array.from({ length: Math.min(lastPage, 5) }, (_, i) => {
                const p = lastPage <= 5 ? i + 1
                  : page <= 3 ? i + 1
                  : page >= lastPage - 2 ? lastPage - 4 + i
                  : page - 2 + i
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    style={{
                      width: 32, height: 32, borderRadius: 8, fontSize: 13, fontWeight: p === page ? 700 : 400,
                      border: `1.5px solid ${p === page ? 'var(--primary)' : 'var(--border)'}`,
                      background: p === page ? 'rgba(255,94,20,0.08)' : 'var(--surface)',
                      color: p === page ? 'var(--primary)' : 'var(--text-secondary)',
                      cursor: 'pointer',
                    }}
                  >
                    {p}
                  </button>
                )
              })}
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
