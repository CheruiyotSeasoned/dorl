import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../lib/api'
import toast from 'react-hot-toast'
import { Plus, Trash2, CheckCircle } from 'lucide-react'
import AddressAutocomplete from '../components/AddressAutocomplete'
import HereMap from '../components/HereMap'
import { useAuthStore } from '../store/authStore'
import Select from '../components/Select'

const emptyPackage = () => ({
  name: '', category: 'parcel', weight_kg: '', declared_value: '',
  is_fragile: false, requires_photo: true, requires_signature: false,
})

export default function NewOrderPage() {
  const navigate = useNavigate()
  const { isAdmin } = useAuthStore()
  const admin = isAdmin()
  const [loading, setLoading] = useState(false)
  const [order, setOrder] = useState({
    pickup_address: '', pickup_lat: '', pickup_lng: '',
    dropoff_address: '', dropoff_lat: '', dropoff_lng: '',
    dispatch_mode: 'auto',
    delivery_fee: '',
    recipient_name: '', recipient_phone: '', recipient_notes: '',
    vendor_id: '',
  })
  const [packages, setPackages] = useState([emptyPackage()])

  const { data: vendors } = useQuery({
    queryKey: ['vendors-list'],
    queryFn: () => api.get('/vendors').then(r => r.data.data ?? []),
    enabled: admin,
  })

  const setO = (k, v) => setOrder(o => ({ ...o, [k]: v }))
  const setP = (i, k, v) => setPackages(ps => ps.map((p, idx) => idx === i ? { ...p, [k]: v } : p))
  const addPkg = () => setPackages(ps => [...ps, emptyPackage()])
  const removePkg = (i) => setPackages(ps => ps.filter((_, idx) => idx !== i))

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!order.pickup_lat || !order.pickup_lng) {
      toast.error('Select a pickup address from the suggestions to get coordinates')
      return
    }
    if (!order.dropoff_lat || !order.dropoff_lng) {
      toast.error('Select a dropoff address from the suggestions to get coordinates')
      return
    }
    if (!order.delivery_fee || Number(order.delivery_fee) < 0) {
      toast.error('Enter the delivery fee')
      return
    }
    if (!order.recipient_name.trim()) {
      toast.error('Enter the recipient name')
      return
    }
    if (!order.recipient_phone.trim()) {
      toast.error('Enter the recipient phone number')
      return
    }
    if (admin && !order.vendor_id) {
      toast.error('Select a vendor for this order')
      return
    }

    setLoading(true)
    try {
      const res = await api.post('/orders', { ...order, packages })
      toast.success('Order created!')
      navigate(`/orders/${res.data.data.id}`)
    } catch (err) {
      const errors = err.response?.data?.errors
      toast.error(errors ? Object.values(errors).flat()[0] : 'Failed to create order')
    } finally {
      setLoading(false)
    }
  }

  // Map markers and route preview
  const markers = []
  if (order.pickup_lat && order.pickup_lng)
    markers.push({ lat: Number(order.pickup_lat), lng: Number(order.pickup_lng), color: '#FF5E14', label: 'P' })
  if (order.dropoff_lat && order.dropoff_lng)
    markers.push({ lat: Number(order.dropoff_lat), lng: Number(order.dropoff_lng), color: '#16A34A', label: 'D' })

  const route = (order.pickup_lat && order.dropoff_lat)
    ? { pickup: { lat: Number(order.pickup_lat), lng: Number(order.pickup_lng) }, dropoff: { lat: Number(order.dropoff_lat), lng: Number(order.dropoff_lng) } }
    : null

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">New Order</h1>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Map preview */}
        {(markers.length > 0) && (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <HereMap markers={markers} route={route} height="280px" zoom={12} />
          </div>
        )}

        {/* Admin: vendor selector */}
        {admin && (
          <div className="card">
            <h3 style={{ marginBottom: 16 }}>Vendor</h3>
            <div className="form-group" style={{ maxWidth: 360 }}>
              <label className="form-label">Select Vendor <span style={{ color: 'var(--danger)' }}>*</span></label>
              <Select
                value={order.vendor_id}
                onChange={e => setO('vendor_id', e.target.value)}
                placeholder="— Choose vendor —"
                options={(vendors ?? []).map(v => ({ value: String(v.id), label: v.name }))}
              />
            </div>
          </div>
        )}

        {/* Pickup & Dropoff */}
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>Pickup & Dropoff</h3>
          <div className="grid-2">
            <AddressAutocomplete
              label="Pickup Address"
              value={order.pickup_address}
              onChange={(v) => setO('pickup_address', v)}
              onSelect={({ address, lat, lng }) => setOrder(o => ({ ...o, pickup_address: address, pickup_lat: lat ?? '', pickup_lng: lng ?? '' }))}
              required
              placeholder="e.g. Westlands, Nairobi"
            />
            <AddressAutocomplete
              label="Dropoff Address"
              value={order.dropoff_address}
              onChange={(v) => setO('dropoff_address', v)}
              onSelect={({ address, lat, lng }) => setOrder(o => ({ ...o, dropoff_address: address, dropoff_lat: lat ?? '', dropoff_lng: lng ?? '' }))}
              required
              placeholder="e.g. Kilimani, Nairobi"
            />
          </div>

          {/* Coordinate read-outs (read-only confirmation) */}
          {(order.pickup_lat || order.dropoff_lat) && (
            <div className="grid-2" style={{ marginTop: 4 }}>
              {order.pickup_lat && (
                <div style={{ fontSize: 11, color: 'var(--success)', display: 'flex', gap: 4, alignItems: 'center' }}>
                  <CheckCircle size={11} /> Pickup: {Number(order.pickup_lat).toFixed(5)}, {Number(order.pickup_lng).toFixed(5)}
                </div>
              )}
              {order.dropoff_lat && (
                <div style={{ fontSize: 11, color: 'var(--success)', display: 'flex', gap: 4, alignItems: 'center' }}>
                  <CheckCircle size={11} /> Dropoff: {Number(order.dropoff_lat).toFixed(5)}, {Number(order.dropoff_lng).toFixed(5)}
                </div>
              )}
            </div>
          )}

          <div className="grid-2" style={{ marginTop: 8 }}>
            <div className="form-group">
              <label className="form-label">Dispatch Mode</label>
              <Select
                value={order.dispatch_mode}
                onChange={e => setO('dispatch_mode', e.target.value)}
                options={[
                  { value: 'auto', label: 'Auto Dispatch' },
                  { value: 'request', label: 'Request Dispatch' },
                ]}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Delivery Fee (KES)</label>
              <input
                type="number" min="0" step="0.01" required
                className="form-control"
                placeholder="e.g. 250"
                value={order.delivery_fee}
                onChange={e => setO('delivery_fee', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Recipient */}
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>Recipient</h3>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Recipient Name <span style={{ color: 'var(--danger)' }}>*</span></label>
              <input
                className="form-control" required
                placeholder="e.g. Jane Muthoni"
                value={order.recipient_name}
                onChange={e => setO('recipient_name', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Recipient Phone <span style={{ color: 'var(--danger)' }}>*</span></label>
              <input
                className="form-control" required
                placeholder="e.g. 0712 345 678"
                value={order.recipient_phone}
                onChange={e => setO('recipient_phone', e.target.value)}
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Exact Location / Delivery Notes</label>
            <input
              className="form-control"
              placeholder="e.g. 3rd floor, Suite 12, green gate, near Naivas"
              value={order.recipient_notes}
              onChange={e => setO('recipient_notes', e.target.value)}
            />
          </div>
        </div>

        {/* Packages */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3>Packages</h3>
            <button type="button" className="btn btn-secondary btn-sm" onClick={addPkg}>
              <Plus size={14} /> Add Package
            </button>
          </div>

          {packages.map((pkg, i) => (
            <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 10, padding: 16, marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>Package {i + 1}</span>
                {packages.length > 1 && (
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => removePkg(i)}>
                    <Trash2 size={14} color="var(--danger)" />
                  </button>
                )}
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Name</label>
                  <input className="form-control" required value={pkg.name} onChange={e => setP(i, 'name', e.target.value)} placeholder="e.g. Laptop" />
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <Select
                    value={pkg.category}
                    onChange={e => setP(i, 'category', e.target.value)}
                    options={['document', 'food', 'parcel', 'fragile', 'bulky'].map(c => ({
                      value: c, label: c.charAt(0).toUpperCase() + c.slice(1),
                    }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Weight (kg)</label>
                  <input type="number" step="0.1" min="0.1" className="form-control" required value={pkg.weight_kg} onChange={e => setP(i, 'weight_kg', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Declared Value (KES)</label>
                  <input type="number" min="0" className="form-control" required value={pkg.declared_value} onChange={e => setP(i, 'declared_value', e.target.value)} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 20, marginTop: 4, flexWrap: 'wrap' }}>
                {[['is_fragile', 'Fragile'], ['requires_photo', 'Requires Photo'], ['requires_signature', 'Requires Signature']].map(([key, label]) => (
                  <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                    <input type="checkbox" checked={pkg[key]} onChange={e => setP(i, key, e.target.checked)} />
                    {label}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }} disabled={loading}>
          {loading ? <span className="spinner" /> : 'Create Order'}
        </button>
      </form>
    </div>
  )
}
