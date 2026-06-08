import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../lib/api'
import toast from 'react-hot-toast'
import { Plus, Trash2, CheckCircle, Clock, Ruler, Receipt, Info, Bookmark } from 'lucide-react'
import AddressAutocomplete from '../components/AddressAutocomplete'
import HereMap from '../components/HereMap'
import { useAuthStore } from '../store/authStore'
import Select from '../components/Select'
import ItemPickerModal from '../components/ItemPickerModal'

const HERE_API_KEY = import.meta.env.VITE_HERE_API_KEY

async function estimateRoute(pickup, dropoff) {
  const url = [
    'https://router.hereapi.com/v8/routes',
    `?transportMode=scooter`,
    `&origin=${pickup.lat},${pickup.lng}`,
    `&destination=${dropoff.lat},${dropoff.lng}`,
    `&return=summary`,
    `&apikey=${HERE_API_KEY}`,
  ].join('')
  const res = await fetch(url)
  const data = await res.json()
  const summary = data.routes?.[0]?.sections?.[0]?.summary
  if (!summary) return null
  return {
    distanceKm: (summary.length / 1000).toFixed(1),
    durationMin: Math.ceil(summary.duration / 60),
  }
}

const emptyPackage = () => ({
  name: '', category: 'parcel', weight_kg: '', declared_value: '',
  is_fragile: false, requires_photo: true, requires_signature: false,
})

function FeeRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>
      <span>{label}</span>
      <span style={{ fontWeight: 500, color: 'var(--text)' }}>KES {value.toLocaleString()}</span>
    </div>
  )
}

export default function NewOrderPage() {
  const navigate = useNavigate()
  const { isAdmin } = useAuthStore()
  const admin = isAdmin()
  const [loading, setLoading] = useState(false)
  const [order, setOrder] = useState({
    pickup_address: '', pickup_lat: '', pickup_lng: '',
    dropoff_address: '', dropoff_lat: '', dropoff_lng: '',
    dispatch_mode: 'auto',
    recipient_name: '', recipient_phone: '', recipient_notes: '',
    vendor_id: '',
  })
  const [packages, setPackages]     = useState([emptyPackage()])
  const [estimate, setEstimate]     = useState(null)   // { distanceKm, durationMin }
  const [estLoading, setEstLoading] = useState(false)
  const [fee, setFee]               = useState(null)   // computed breakdown
  const estimateTimer = useRef(null)

  // Fetch admin rate card
  const { data: rates } = useQuery({
    queryKey: ['pricing-rates'],
    queryFn: () => api.get('/pricing').then(r => r.data.data),
    staleTime: 5 * 60_000,
  })

  const { data: vendors } = useQuery({
    queryKey: ['vendors-list'],
    queryFn: () => api.get('/vendors').then(r => r.data.data ?? []),
    enabled: admin,
  })

  // Re-estimate route whenever both coordinates are available
  useEffect(() => {
    clearTimeout(estimateTimer.current)
    if (!order.pickup_lat || !order.pickup_lng || !order.dropoff_lat || !order.dropoff_lng) {
      setEstimate(null)
      setFee(null)
      return
    }
    setEstLoading(true)
    estimateTimer.current = setTimeout(async () => {
      try {
        const result = await estimateRoute(
          { lat: order.pickup_lat, lng: order.pickup_lng },
          { lat: order.dropoff_lat, lng: order.dropoff_lng },
        )
        setEstimate(result)
      } catch {
        setEstimate(null)
      } finally {
        setEstLoading(false)
      }
    }, 400)
    return () => clearTimeout(estimateTimer.current)
  }, [order.pickup_lat, order.pickup_lng, order.dropoff_lat, order.dropoff_lng])

  // Recalculate fee whenever estimate or packages or rates change
  useEffect(() => {
    if (!estimate || !rates) { setFee(null); return }

    const r = rates
    const distKm      = parseFloat(estimate.distanceKm) || 0
    const freeDist    = parseFloat(r.free_distance_km)  || 0
    const billableKm  = Math.max(0, distKm - freeDist)
    const distFee     = billableKm * (parseFloat(r.distance_rate_per_km) || 0)

    const totalWeight = packages.reduce((s, p) => s + (parseFloat(p.weight_kg) || 0), 0)
    const threshold   = parseFloat(r.weight_surcharge_threshold) || 0
    const billableKg  = Math.max(0, totalWeight - threshold)
    const weightFee   = billableKg * (parseFloat(r.weight_rate_per_kg) || 0)

    // fix: DB stores booleans as strings — "false" is truthy in JS
    const foodEnabled = r.food_priority_fee_enabled === true || r.food_priority_fee_enabled === 'true' || r.food_priority_fee_enabled === '1' || r.food_priority_fee_enabled === 1

    const hasFragile = packages.some(p => p.is_fragile || p.category === 'fragile')
    const fragileFee = hasFragile ? (parseFloat(r.fragile_surcharge) || 0) : 0

    const totalValue  = packages.reduce((s, p) => s + (parseFloat(p.declared_value) || 0), 0)
    const hvThresh    = parseFloat(r.high_value_threshold) || 0
    const insurancePct = (parseFloat(r.high_value_insurance_percent) || 0) / 100
    const insuranceFee = totalValue > hvThresh ? totalValue * insurancePct : 0

    const hasFood = packages.some(p => p.category === 'food')
    const foodFee = hasFood && foodEnabled ? (parseFloat(r.food_priority_fee) || 0) : 0

    const baseFee = parseFloat(r.base_fee) || 0
    const total   = baseFee + distFee + weightFee + fragileFee + insuranceFee + foodFee

    setFee({
      baseFee:      Math.round(baseFee),
      distFee:      Math.round(distFee),
      weightFee:    Math.round(weightFee),
      fragileFee:   Math.round(fragileFee),
      insuranceFee: Math.round(insuranceFee),
      foodFee:      Math.round(foodFee),
      total:        Math.round(total),
      distKm,
      totalWeight,
      totalValue,
      hvThresh,
      insurancePct: parseFloat(r.high_value_insurance_percent) || 0,
      hasFragile,
      hasFood:      hasFood && foodEnabled,
    })
  }, [estimate, packages, rates])

  const [pickerOpen, setPickerOpen] = useState(false)

  const setO = (k, v) => setOrder(o => ({ ...o, [k]: v }))
  const setP = (i, k, v) => setPackages(ps => ps.map((p, idx) => idx === i ? { ...p, [k]: v } : p))
  const addPkg = () => setPackages(ps => [...ps, emptyPackage()])
  const removePkg = (i) => setPackages(ps => ps.filter((_, idx) => idx !== i))
  const addFromLibrary = (item) => setPackages(ps => [...ps, {
    name:               item.name,
    category:           item.category,
    weight_kg:          String(item.weight_kg),
    declared_value:     String(item.declared_value),
    is_fragile:         item.is_fragile ?? false,
    requires_photo:     item.requires_photo ?? true,
    requires_signature: item.requires_signature ?? false,
    description:        item.description ?? '',
  }])

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
    if (!fee) {
      toast.error('Set both addresses to calculate the delivery fee')
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
      const res = await api.post('/orders', { ...order, packages, delivery_fee: fee?.total ?? 0 })
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
              placeholder="Search area, estate, business…"
            />
            <AddressAutocomplete
              label="Dropoff Address"
              value={order.dropoff_address}
              onChange={(v) => setO('dropoff_address', v)}
              onSelect={({ address, lat, lng }) => setOrder(o => ({ ...o, dropoff_address: address, dropoff_lat: lat ?? '', dropoff_lng: lng ?? '' }))}
              required
              placeholder="Search area, estate, business…"
            />
          </div>

          {/* Coordinate confirmations */}
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

          {/* Route estimate */}
          {(estLoading || estimate) && (
            <div style={{ marginTop: 12, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              {estLoading ? (
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="spinner" style={{ width: 12, height: 12 }} /> Calculating route…
                </span>
              ) : estimate ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--surface-muted)', borderRadius: 8, padding: '6px 12px', fontSize: 13, fontWeight: 600 }}>
                    <Ruler size={13} color="var(--primary)" /> {estimate.distanceKm} km
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--surface-muted)', borderRadius: 8, padding: '6px 12px', fontSize: 13, fontWeight: 600 }}>
                    <Clock size={13} color="var(--primary)" /> ~{estimate.durationMin} min
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>estimated by road</span>
                </>
              ) : null}
            </div>
          )}

          <div style={{ marginTop: 8, maxWidth: 280 }}>
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
          </div>

          {/* Fee breakdown */}
          {(estLoading || fee) && (
            <div style={{ marginTop: 4, background: 'var(--surface-muted)', borderRadius: 10, padding: '16px 18px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: 13, marginBottom: 12, color: 'var(--text-secondary)' }}>
                <Receipt size={14} /> Delivery Fee Breakdown
              </div>
              {estLoading || !fee ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                  <span className="spinner" style={{ width: 12, height: 12 }} /> Calculating…
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 7, fontSize: 13 }}>
                    <FeeRow label="Base fee" value={fee.baseFee} />
                    <FeeRow label={`Distance (${fee.distKm} km)`} value={fee.distFee} />
                    {fee.weightFee > 0 && <FeeRow label={`Weight surcharge (${fee.totalWeight.toFixed(1)} kg)`} value={fee.weightFee} />}
                    {fee.fragileFee > 0 && <FeeRow label="Fragile handling" value={fee.fragileFee} />}
                    {fee.insuranceFee > 0 && <FeeRow label={`Insurance (${fee.insurancePct}% of KES ${fee.totalValue.toLocaleString()})`} value={fee.insuranceFee} />}
                    {fee.foodFee > 0 && <FeeRow label="Food priority" value={fee.foodFee} />}
                  </div>
                  <div style={{ borderTop: '1px solid var(--border)', marginTop: 10, paddingTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>Total</span>
                    <span style={{ fontWeight: 700, fontSize: 18, color: 'var(--primary)' }}>KES {fee.total.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 8, fontSize: 11, color: 'var(--text-secondary)' }}>
                    <Info size={11} /> Calculated from the admin rate card. Final fee is confirmed on the server.
                  </div>
                </>
              )}
            </div>
          )}
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
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setPickerOpen(true)}>
                <Bookmark size={14} /> From Library
              </button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={addPkg}>
                <Plus size={14} /> New
              </button>
            </div>
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

      <ItemPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onAdd={(item) => { addFromLibrary(item); setPickerOpen(false) }}
      />
    </div>
  )
}
