import { useState, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Package, Search, QrCode, MapPin, CheckCircle, Clock } from 'lucide-react'
import api from '../lib/api'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

export default function StationDashboardPage() {
  const { user } = useAuthStore()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('at_station')
  const [scanInput, setScanInput] = useState('')
  const scanRef = useRef()

  // Fetch items at this station (or all for admin)
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['station-items', statusFilter],
    queryFn: () =>
      api.get('/shipments', { params: { page: 1 } }).then(r => {
        // Flatten all items from all shipments — filter by station and status
        // This is a convenience view; a dedicated endpoint can be added later
        return r.data.data
      }),
    staleTime: 10_000,
  })

  // Dedicated station items query
  const { data: stationItems, isLoading: itemsLoading } = useQuery({
    queryKey: ['station-queue', statusFilter, user?.pickup_station_id],
    queryFn: () =>
      api.get(`/pickup-stations/${user?.pickup_station_id || ''}`, {
        params: { status: statusFilter },
      }).then(r => r.data.data),
    enabled: !!user?.pickup_station_id || user?.role === 'admin',
    staleTime: 15_000,
  })

  const handleScan = (e) => {
    e.preventDefault()
    if (!scanInput.trim()) return
    // If it looks like a UUID (qr_token), navigate to checkout
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (uuidRegex.test(scanInput.trim())) {
      window.location.href = `/pickup/checkout/${scanInput.trim()}`
    } else {
      // Try as item code
      toast.error('Invalid QR token or item code format')
    }
    setScanInput('')
  }

  const stationInfo = user?.pickup_station

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Station Dashboard</h1>
        {stationInfo && (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>
            <MapPin size={13} />
            <strong style={{ color: 'var(--text-primary)' }}>{stationInfo.name}</strong>
            <span>— {stationInfo.town}</span>
            {stationInfo.address && <span>· {stationInfo.address}</span>}
          </div>
        )}
      </div>

      {/* QR Scan input (auto-focused for barcode scanners) */}
      <div className="card" style={{ padding: 20, marginBottom: 20, background: 'rgba(var(--primary-rgb),0.04)' }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 12px', display: 'flex', gap: 8, alignItems: 'center' }}>
          <QrCode size={16} style={{ color: 'var(--primary)' }} /> Scan Package QR
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: '0 0 12px' }}>
          Point the camera at the QR code on the package, or type the item code below.
          The checkout page will open automatically.
        </p>
        <form onSubmit={handleScan} style={{ display: 'flex', gap: 10 }}>
          <input
            ref={scanRef}
            className="form-control"
            placeholder="Paste QR token or item code…"
            value={scanInput}
            onChange={e => setScanInput(e.target.value)}
            autoFocus
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn btn-primary">
            <Search size={15} /> Open
          </button>
        </form>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 8 }}>
          Tip: You can also directly scan the QR code on the package with your phone camera — it will open the checkout page automatically.
        </p>
      </div>

      {/* Quick stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'At Station', status: 'at_station', color: '#0ea5e9' },
          { label: 'Dispatched Here', status: 'dispatched_to_station', color: '#f59e0b' },
          { label: 'Delivered Today', status: 'delivered', color: '#22c55e' },
        ].map(s => (
          <button
            key={s.status}
            onClick={() => setStatusFilter(s.status)}
            className="card"
            style={{
              padding: 16, textAlign: 'center', cursor: 'pointer',
              border: statusFilter === s.status ? `2px solid ${s.color}` : '1px solid var(--border)',
              background: statusFilter === s.status ? s.color + '10' : 'var(--surface)',
            }}
          >
            <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>—</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{s.label}</div>
          </button>
        ))}
      </div>

      {/* Package queue */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>
          {statusFilter === 'at_station' ? 'Ready for Pickup' :
           statusFilter === 'dispatched_to_station' ? 'En Route to Station' : 'Delivered Today'}
        </h2>
        <input
          className="form-control"
          placeholder="Search customer or item…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: 220, fontSize: 13 }}
        />
      </div>

      <div style={{ marginBottom: 12, display: 'flex', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
        <Clock size={14} /> Package queue updates automatically. Ask customers for their item code if QR is unavailable.
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Item Code', 'Customer', 'Description', 'Amount', 'Status', 'Action'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={6} style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: 14 }}>
                <Package size={32} style={{ marginBottom: 8, display: 'block', margin: '0 auto 8px' }} />
                Scan a QR code or use the search above to find a package.
                <br />
                <span style={{ fontSize: 12 }}>Items will appear here as they arrive at your station.</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Recent activity placeholder */}
      <div style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Today's Activity</h2>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#22c55e' }}>0</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Packages Delivered</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#0ea5e9' }}>KES 0</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Cash Collected</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#8b5cf6' }}>KES 0</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>M-Pesa Collected</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
