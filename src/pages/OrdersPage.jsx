import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '../lib/api'
import { Plus, MapPin, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import Select from '../components/Select'

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'processing', label: 'Processing' },
  { value: 'awaiting_dispatch', label: 'Awaiting Dispatch' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

const statusBadge = (status) => {
  const map = { completed: 'badge-success', cancelled: 'badge-danger', in_progress: 'badge-primary', assigned: 'badge-warning', awaiting_dispatch: 'badge-neutral', created: 'badge-neutral', processing: 'badge-neutral' }
  return <span className={`badge ${map[status] ?? 'badge-neutral'}`}>{status?.replace(/_/g, ' ')}</span>
}

export default function OrdersPage() {
  const { isAdmin } = useAuthStore()
  const admin = isAdmin()

  const [page, setPage]     = useState(1)
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['orders', page, status, search],
    queryFn: () => admin
      ? api.get('/admin/orders', { params: { page, status: status || undefined, search: search || undefined } }).then(r => r.data.data)
      : api.get('/orders', { params: { page } }).then(r => r.data.data),
    keepPreviousData: true,
  })

  const orders   = data?.data ?? []
  const lastPage = data?.last_page ?? 1
  const total    = data?.total ?? 0

  const handleSearch = (e) => {
    e.preventDefault()
    setSearch(searchInput)
    setPage(1)
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">{admin ? 'All Orders' : 'My Orders'}</h1>
        <Link to="/orders/new" className="btn btn-primary"><Plus size={16} /> New Order</Link>
      </div>

      {/* Admin filters */}
      {admin && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, flex: 1, minWidth: 200 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input
                className="input"
                style={{ paddingLeft: 32 }}
                placeholder="Search order ID…"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary btn-sm">Search</button>
          </form>
          <Select
            style={{ width: 190 }}
            value={status}
            onChange={e => { setStatus(e.target.value); setPage(1) }}
            options={STATUS_OPTIONS}
          />
        </div>
      )}

      <div className="card">
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}><span className="spinner" /></div>
        ) : orders.length === 0 ? (
          <p className="text-muted text-sm">No orders found.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  {admin && <th>Vendor</th>}
                  <th>Pickup</th>
                  <th>Dropoff</th>
                  <th>Pkgs</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id}>
                    <td className="text-sm text-muted">#{o.id}</td>
                    {admin && <td style={{ fontSize: 13 }}>{o.vendor?.name ?? '—'}</td>}
                    <td><div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><MapPin size={13} color="var(--text-secondary)" />{o.pickup_address}</div></td>
                    <td>{o.dropoff_address}</td>
                    <td>{o.packages?.length ?? 0}</td>
                    <td style={{ fontWeight: 600 }}>KES {Number(o.total_price).toLocaleString()}</td>
                    <td>{statusBadge(o.status)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <Link to={`/orders/${o.id}`} className="btn btn-ghost btn-sm">View</Link>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, fontSize: 13, color: 'var(--text-secondary)' }}>
            <span>{total} order{total !== 1 ? 's' : ''}</span>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <button className="btn btn-ghost btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}><ChevronLeft size={14} /></button>
              <span>Page {page} / {lastPage}</span>
              <button className="btn btn-ghost btn-sm" disabled={page === lastPage} onClick={() => setPage(p => p + 1)}><ChevronRight size={14} /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
