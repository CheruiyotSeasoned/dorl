import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import QRCode from 'react-qr-code'
import { ArrowLeft, Package, MapPin, QrCode, CheckCircle, Truck, Printer, Clock, DollarSign, RefreshCw, ShoppingBag } from 'lucide-react'
import api from '../lib/api'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store/authStore'
import AddressAutocomplete from '../components/AddressAutocomplete'

const STATUS_COLORS = {
  pending: '#6b7280', at_warehouse: '#8b5cf6', sorted: '#3b82f6',
  dispatched_to_station: '#f59e0b', at_station: '#0ea5e9', delivered: '#22c55e', returned: '#ef4444',
}
const STATUS_LABELS = {
  pending: 'Pending', at_warehouse: 'At Warehouse', sorted: 'Sorted',
  dispatched_to_station: 'Dispatched', at_station: 'At Station', delivered: 'Delivered', returned: 'Returned',
}

// Shipment-level journey steps
const SHIPMENT_STEPS = [
  { key: 'draft',                label: 'Created',          desc: 'Shipment registered' },
  { key: 'manifested',           label: 'Manifested',       desc: 'Items listed, labels ready' },
  { key: 'in_transit',           label: 'In Transit',       desc: 'On the way to warehouse' },
  { key: 'arrived_at_warehouse', label: 'At Warehouse',     desc: 'Arrived, awaiting processing' },
  { key: 'processing',           label: 'Sorting',          desc: 'Items sorted per station' },
  { key: 'dispatched',           label: 'Dispatched',       desc: 'Items sent to pickup stations' },
  { key: 'completed',            label: 'Completed',        desc: 'All items delivered' },
]

function ShipmentStepper({ status }) {
  const currentIdx = SHIPMENT_STEPS.findIndex(s => s.key === status)
  return (
    <div style={{ overflowX: 'auto', paddingBottom: 4 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0, minWidth: 'max-content' }}>
        {SHIPMENT_STEPS.map((step, idx) => {
          const done    = idx < currentIdx
          const active  = idx === currentIdx
          const pending = idx > currentIdx
          const color   = done ? '#22c55e' : active ? 'var(--primary)' : 'var(--border)'
          const textCol = done ? '#16a34a' : active ? 'var(--primary)' : 'var(--text-secondary)'
          return (
            <div key={step.key} style={{ display: 'flex', alignItems: 'flex-start', flex: 1 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 90 }}>
                {/* Circle */}
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  border: `2px solid ${color}`,
                  background: done ? '#22c55e' : active ? 'rgba(255,94,20,0.1)' : 'var(--surface)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  zIndex: 1, flexShrink: 0, transition: 'all 0.2s',
                }}>
                  {done
                    ? <CheckCircle size={16} style={{ color: '#fff' }} />
                    : active
                    ? <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--primary)' }} />
                    : <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--border)' }} />
                  }
                </div>
                {/* Label */}
                <div style={{ fontSize: 11, fontWeight: active ? 700 : 500, color: textCol, marginTop: 6, textAlign: 'center', lineHeight: 1.3 }}>
                  {step.label}
                </div>
                {active && (
                  <div style={{ fontSize: 10, color: 'var(--text-secondary)', textAlign: 'center', marginTop: 2, maxWidth: 80 }}>
                    {step.desc}
                  </div>
                )}
              </div>
              {/* Connector */}
              {idx < SHIPMENT_STEPS.length - 1 && (
                <div style={{
                  flex: 1, height: 2, marginTop: 15,
                  background: done ? '#22c55e' : 'var(--border)',
                  transition: 'background 0.3s',
                }} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Per-item mini status trail
const ITEM_STEPS = [
  { key: 'pending',               label: 'Pending' },
  { key: 'at_warehouse',          label: 'Warehouse' },
  { key: 'sorted',                label: 'Sorted' },
  { key: 'dispatched_to_station', label: 'Dispatched' },
  { key: 'at_station',            label: 'At Station' },
  { key: 'delivered',             label: 'Delivered' },
]

function ItemStatusTrail({ status, paymentStatus }) {
  const currentIdx = ITEM_STEPS.findIndex(s => s.key === status)
  if (currentIdx === -1) return null
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginTop: 8, overflowX: 'auto' }}>
      {ITEM_STEPS.map((step, idx) => {
        const done   = idx < currentIdx
        const active = idx === currentIdx
        const color  = done ? '#22c55e' : active ? 'var(--primary)' : 'rgba(0,0,0,0.1)'
        return (
          <div key={step.key} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 56 }}>
              <div style={{
                width: 20, height: 20, borderRadius: '50%',
                background: done ? '#22c55e' : active ? 'var(--primary)' : 'var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {done && <CheckCircle size={11} style={{ color: '#fff' }} />}
                {active && <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff' }} />}
              </div>
              <div style={{ fontSize: 9, fontWeight: active ? 700 : 400, color: done ? '#16a34a' : active ? 'var(--primary)' : 'var(--text-secondary)', marginTop: 3, whiteSpace: 'nowrap' }}>
                {step.label}
              </div>
            </div>
            {idx < ITEM_STEPS.length - 1 && (
              <div style={{ flex: 1, height: 2, background: done ? '#22c55e' : 'var(--border)', marginBottom: 14 }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function ItemRow({ item, stations, onReceive, onConvertToOrder, isAdmin }) {
  const [showQr, setShowQr] = useState(false)
  const [stationId, setStationId] = useState(item.pickup_station_id || '')
  const [showConvert, setShowConvert] = useState(false)
  const [convertForm, setConvertForm] = useState({
    pickup_address: '',
    pickup_lat: '',
    pickup_lng: '',
    dropoff_address: item.pickup_station?.address ?? (item.pickup_station ? `${item.pickup_station.name}, ${item.pickup_station.town}` : ''),
    dropoff_lat: item.pickup_station?.lat ?? '',
    dropoff_lng: item.pickup_station?.lng ?? '',
  })
  const color = STATUS_COLORS[item.status] || '#6b7280'

  const printLabel = () => {
    const w = window.open('', '_blank')
    w.document.write(`
      <html><body style="font-family:sans-serif;padding:20px;max-width:300px">
        <div style="border:2px solid #000;padding:16px;border-radius:8px">
          <div style="font-size:11px;color:#666">ITEM CODE</div>
          <div style="font-size:18px;font-weight:bold;margin-bottom:12px">${item.item_code}</div>
          <div style="margin-bottom:8px"><strong>${item.customer_name}</strong></div>
          <div style="font-size:12px;color:#444;margin-bottom:4px">${item.item_description}</div>
          <div style="font-size:12px;margin-bottom:8px">Qty: ${item.quantity}</div>
          <div style="font-size:14px;font-weight:bold;margin-bottom:12px">KES ${item.unit_price.toLocaleString()}</div>
          ${item.pickup_station ? `<div style="font-size:12px;border-top:1px solid #ddd;padding-top:8px"><strong>Pickup:</strong> ${item.pickup_station.name}, ${item.pickup_station.town}</div>` : ''}
          <div style="text-align:center;margin-top:12px">
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(item.checkout_url)}" />
            <div style="font-size:10px;color:#666;margin-top:4px">Scan to pay & collect</div>
          </div>
        </div>
      </body></html>
    `)
    w.document.close()
    w.print()
  }

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 10, padding: 16, marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13 }}>{item.item_code}</span>
            <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: color + '18', color }}>
              {STATUS_LABELS[item.status]}
            </span>
            {item.payment_status === 'paid' && (
              <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: '#22c55e18', color: '#16a34a' }}>
                Paid
              </span>
            )}
          </div>
          <div style={{ fontWeight: 600 }}>{item.customer_name}</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{item.customer_phone}</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 2 }}>{item.item_description} × {item.quantity}</div>
          {item.pickup_station && (
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, display: 'flex', gap: 4 }}>
              <MapPin size={12} /> {item.pickup_station.name}, {item.pickup_station.town}
            </div>
          )}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>KES {item.unit_price.toLocaleString()}</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Fee: KES {item.our_fee.toLocaleString()}</div>
          <div style={{ fontSize: 12, color: '#16a34a' }}>Seller: KES {item.seller_amount.toLocaleString()}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
        <button className="btn btn-secondary btn-sm" onClick={() => setShowQr(v => !v)}>
          <QrCode size={13} /> {showQr ? 'Hide QR' : 'QR Code'}
        </button>
        <button className="btn btn-secondary btn-sm" onClick={printLabel}>
          <Printer size={13} /> Print Label
        </button>
        {item.order_id && (
          <Link to={`/orders/${item.order_id}`} className="btn btn-secondary btn-sm" style={{ color: '#3b82f6' }}>
            <ShoppingBag size={13} /> Order #{item.order_id}
          </Link>
        )}
        {!item.order_id && (
          <button
            className="btn btn-secondary btn-sm"
            style={{ color: 'var(--primary)' }}
            onClick={() => setShowConvert(v => !v)}
          >
            <Truck size={13} /> {showConvert ? 'Cancel' : 'Create Order'}
          </button>
        )}
        {isAdmin && item.status === 'pending' && (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <select
              className="form-control"
              style={{ padding: '4px 8px', fontSize: 13, height: 32 }}
              value={stationId}
              onChange={e => setStationId(e.target.value)}
            >
              <option value="">No station</option>
              {stations.map(s => <option key={s.id} value={s.id}>{s.name} — {s.town}</option>)}
            </select>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => onReceive(item.id, stationId || null)}
            >
              <CheckCircle size={13} /> Receive
            </button>
          </div>
        )}
      </div>

      {/* Item status trail */}
      {item.status !== 'returned' && (
        <ItemStatusTrail status={item.status} paymentStatus={item.payment_status} />
      )}

      {/* Convert to Order inline form */}
      {showConvert && (
        <div style={{ marginTop: 14, padding: 14, background: 'var(--surface-alt, #f9fafb)', border: '1px solid var(--border)', borderRadius: 8 }}>
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12 }}>
            Create Delivery Order — {item.customer_name}
          </div>

          <AddressAutocomplete
            label="Pickup Address (warehouse / sender)"
            required
            placeholder="Search warehouse, estate or business…"
            value={convertForm.pickup_address}
            onChange={v => setConvertForm(f => ({ ...f, pickup_address: v, pickup_lat: '', pickup_lng: '' }))}
            onSelect={({ address, lat, lng }) => setConvertForm(f => ({ ...f, pickup_address: address, pickup_lat: lat ?? '', pickup_lng: lng ?? '' }))}
          />
          {convertForm.pickup_lat && (
            <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: -8, marginBottom: 10 }}>
              {Number(convertForm.pickup_lat).toFixed(5)}, {Number(convertForm.pickup_lng).toFixed(5)}
            </div>
          )}

          <AddressAutocomplete
            label="Dropoff Address (station / customer)"
            placeholder="Search destination…"
            value={convertForm.dropoff_address}
            onChange={v => setConvertForm(f => ({ ...f, dropoff_address: v, dropoff_lat: '', dropoff_lng: '' }))}
            onSelect={({ address, lat, lng }) => setConvertForm(f => ({ ...f, dropoff_address: address, dropoff_lat: lat ?? '', dropoff_lng: lng ?? '' }))}
          />
          {convertForm.dropoff_lat && (
            <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: -8, marginBottom: 10 }}>
              {Number(convertForm.dropoff_lat).toFixed(5)}, {Number(convertForm.dropoff_lng).toFixed(5)}
            </div>
          )}

          <button
            className="btn btn-primary btn-sm"
            style={{ marginTop: 4 }}
            onClick={() => onConvertToOrder(item.id, convertForm)}
            disabled={!convertForm.pickup_lat || !convertForm.pickup_lng}
          >
            <Truck size={13} /> Confirm — Create Order
          </button>
        </div>
      )}

      {showQr && item.checkout_url && (
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
          <div style={{ padding: 16, background: '#fff', border: '1px solid var(--border)', borderRadius: 8, display: 'inline-block' }}>
            <QRCode value={item.checkout_url} size={140} />
          </div>
          <code style={{ fontSize: 10, color: 'var(--text-secondary)', wordBreak: 'break-all', maxWidth: 300 }}>
            {item.checkout_url}
          </code>
        </div>
      )}
    </div>
  )
}

export default function ShipmentDetailPage() {
  const { id } = useParams()
  const qc = useQueryClient()
  const { isAdmin, isWarehouseStaff } = useAuthStore()
  const canProcess = isAdmin() || isWarehouseStaff()
  // Admins use /admin prefix; warehouse staff use /warehouse prefix
  const warehousePrefix = isAdmin() ? 'admin' : 'warehouse'
  const [statusFilter, setStatusFilter] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['shipment', id],
    queryFn: () => api.get(`/shipments/${id}`).then(r => r.data.data),
  })

  const { data: stations } = useQuery({
    queryKey: ['pickup-stations'],
    queryFn: () => api.get('/pickup-stations').then(r => r.data.data),
    enabled: canProcess,
  })

  const updateStatus = useMutation({
    mutationFn: (status) => api.patch(`/${warehousePrefix}/shipments/${id}/status`, { status }),
    onSuccess: () => { toast.success('Status updated'); qc.invalidateQueries(['shipment', id]) },
    onError: (e) => toast.error(e.response?.data?.error || 'Failed'),
  })

  const dispatchAll = useMutation({
    mutationFn: () => api.post(`/${warehousePrefix}/shipments/${id}/dispatch`),
    onSuccess: (r) => {
      toast.success(`${r.data.dispatched} items dispatched to stations`)
      qc.invalidateQueries(['shipment', id])
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Failed'),
  })

  const receiveItem = useMutation({
    mutationFn: ({ itemId, stationId }) =>
      api.patch(`/${warehousePrefix}/shipments/${id}/items/${itemId}/receive`, { pickup_station_id: stationId || null }),
    onSuccess: () => { toast.success('Item received at warehouse'); qc.invalidateQueries(['shipment', id]) },
    onError: (e) => toast.error(e.response?.data?.error || 'Failed'),
  })

  const convertToOrder = useMutation({
    mutationFn: ({ itemId, form }) =>
      api.post(`/shipments/${id}/items/${itemId}/convert-to-order`, {
        pickup_address:  form.pickup_address,
        pickup_lat:      parseFloat(form.pickup_lat),
        pickup_lng:      parseFloat(form.pickup_lng),
        dropoff_address: form.dropoff_address || undefined,
        dropoff_lat:     form.dropoff_lat ? parseFloat(form.dropoff_lat) : undefined,
        dropoff_lng:     form.dropoff_lng ? parseFloat(form.dropoff_lng) : undefined,
      }),
    onSuccess: (r) => {
      toast.success(`Order #${r.data.order.id} created`)
      qc.invalidateQueries(['shipment', id])
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Failed to create order'),
  })

  if (isLoading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading…</div>
  if (!data) return null

  const shipment = data
  const items = shipment.items || []
  const filtered = statusFilter ? items.filter(i => i.status === statusFilter) : items

  const deliveredCount = items.filter(i => i.status === 'delivered').length
  const paidCount = items.filter(i => i.payment_status === 'paid').length
  const totalRevenue = items.filter(i => i.payment_status === 'paid').reduce((s, i) => s + i.unit_price, 0)

  const SHIPMENT_STATUSES = ['draft','manifested','in_transit','arrived_at_warehouse','processing','dispatched','completed']

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Link to="/shipments" className="btn btn-secondary btn-sm"><ArrowLeft size={15} /> Back</Link>
        <div>
          <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 18 }}>{shipment.master_code}</span>
          <span style={{ marginLeft: 12, color: 'var(--text-secondary)', fontSize: 14 }}>{shipment.title}</span>
        </div>
      </div>

      {/* Journey stepper */}
      <div className="card" style={{ padding: '20px 24px', marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Shipment Journey</span>
          {canProcess && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <select
                className="form-control"
                style={{ height: 32, fontSize: 12, padding: '0 8px' }}
                value={shipment.status}
                onChange={e => updateStatus.mutate(e.target.value)}
              >
                {SHIPMENT_STATUSES.map(s => (
                  <option key={s} value={s}>{s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
                ))}
              </select>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => dispatchAll.mutate()}
                disabled={dispatchAll.isPending || shipment.status !== 'processing'}
              >
                <Truck size={13} /> Dispatch Sorted
              </button>
            </div>
          )}
        </div>
        <ShipmentStepper status={shipment.status} />
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Items',  value: items.length,                              icon: Package,    color: '#3b82f6' },
          { label: 'Delivered',    value: deliveredCount,                            icon: CheckCircle,color: '#22c55e' },
          { label: 'Pending',      value: items.length - deliveredCount,             icon: Clock,      color: '#f59e0b' },
          { label: 'Seller Share', value: `KES ${(totalRevenue * 0.75 || 0).toLocaleString()}`, icon: DollarSign, color: '#8b5cf6' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card" style={{ padding: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={16} style={{ color }} />
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{value}</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Shipment meta */}
      <div className="card" style={{ padding: '14px 20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', alignItems: 'center' }}>
          <div><div style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>Seller</div><div style={{ fontWeight: 600, fontSize: 14 }}>{shipment.vendor?.name}</div></div>
          <div><div style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>Origin</div><div style={{ fontSize: 14 }}>{shipment.origin_country || '—'}</div></div>
          <div><div style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>Carrier</div><div style={{ fontSize: 14 }}>{shipment.carrier || '—'}</div></div>
          <div>
            <div style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>Tracking Ref</div>
            <div style={{ fontFamily: 'monospace', fontSize: 13, color: 'var(--primary)', fontWeight: 600 }}>{shipment.carrier_tracking || '—'}</div>
          </div>
          {shipment.arrived_at && (
            <div><div style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>Arrived</div><div style={{ fontSize: 13 }}>{new Date(shipment.arrived_at).toLocaleDateString()}</div></div>
          )}
        </div>
      </div>

      {/* Items */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Items ({items.length})</h2>
        <div style={{ display: 'flex', gap: 6 }}>
          {['', 'pending', 'at_warehouse', 'sorted', 'dispatched_to_station', 'at_station', 'delivered'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-secondary'}`}>
              {s ? STATUS_LABELS[s] : 'All'}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
          No items match the selected filter.
        </div>
      ) : (
        filtered.map(item => (
          <ItemRow
            key={item.id}
            item={item}
            stations={stations || []}
            isAdmin={canProcess}
            onReceive={(itemId, stationId) => receiveItem.mutate({ itemId, stationId })}
            onConvertToOrder={(itemId, form) => convertToOrder.mutate({ itemId, form })}
          />
        ))
      )}
    </div>
  )
}
