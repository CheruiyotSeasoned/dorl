import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import { Search, Plus, Package, Bookmark, X, Check } from 'lucide-react'
import Select from './Select'

const EMPTY_FORM = {
  name: '', category: 'parcel', weight_kg: '', declared_value: '',
  description: '', is_fragile: false, requires_signature: false, requires_photo: true,
}

function ItemCard({ item, onAdd }) {
  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
        border: '1px solid var(--border)', borderRadius: 10, cursor: 'pointer',
        transition: 'border-color 0.15s, background 0.15s',
      }}
      onClick={() => onAdd(item)}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.background = 'var(--surface-muted)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'transparent' }}
    >
      <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--surface-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Package size={16} color="var(--primary)" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 1 }}>
          {item.category} · {item.weight_kg} kg · KES {Number(item.declared_value).toLocaleString()}
          {item.is_fragile && ' · Fragile'}
        </div>
      </div>
      <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Plus size={14} color="#fff" />
      </div>
    </div>
  )
}

export default function ItemPickerModal({ open, onClose, onAdd }) {
  const qc = useQueryClient()
  const [tab, setTab] = useState('library')   // 'library' | 'new'
  const [search, setSearch] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)
  const [saveToLibrary, setSaveToLibrary] = useState(true)
  const [saved, setSaved] = useState(false)

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['vendor-items'],
    queryFn: () => api.get('/vendor-items').then(r => r.data.data),
    enabled: open,
  })

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/vendor-items', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vendor-items'] }),
  })

  const filtered = items.filter(i =>
    !search || i.name.toLowerCase().includes(search.toLowerCase()) || i.category.includes(search.toLowerCase())
  )

  const handleAddNew = async () => {
    if (!form.name || !form.weight_kg || form.declared_value === '') return

    const pkg = {
      name:               form.name,
      category:           form.category,
      weight_kg:          parseFloat(form.weight_kg),
      declared_value:     parseFloat(form.declared_value),
      description:        form.description || undefined,
      is_fragile:         form.is_fragile,
      requires_signature: form.requires_signature,
      requires_photo:     form.requires_photo,
    }

    if (saveToLibrary) {
      try {
        await createMutation.mutateAsync(pkg)
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      } catch {}
    }

    onAdd(pkg)
    setForm(EMPTY_FORM)
  }

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }))

  if (!open) return null

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 500,
      background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
    }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: 'var(--surface)', borderRadius: 16, width: '100%', maxWidth: 520,
        maxHeight: '85vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px 0' }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Add Package</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, padding: '12px 20px 0', borderBottom: '1px solid var(--border)' }}>
          {[['library', <Bookmark size={13} />, 'Saved Items'], ['new', <Plus size={13} />, 'New Item']].map(([key, icon, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px',
                fontWeight: 600, fontSize: 13, background: 'none', border: 'none', cursor: 'pointer',
                borderBottom: tab === key ? '2px solid var(--primary)' : '2px solid transparent',
                color: tab === key ? 'var(--primary)' : 'var(--text-secondary)',
                marginBottom: -1,
              }}
            >{icon}{label}</button>
          ))}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          {tab === 'library' ? (
            <>
              <div style={{ position: 'relative', marginBottom: 12 }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input
                  className="form-control"
                  style={{ paddingLeft: 32 }}
                  placeholder="Search saved items…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>

              {isLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><span className="spinner" /></div>
              ) : filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 16px' }}>
                  <Package size={36} color="var(--border)" style={{ marginBottom: 10 }} />
                  <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: 0 }}>
                    {items.length === 0 ? 'No saved items yet. Create one in the "New Item" tab.' : 'No items match your search.'}
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {filtered.map(item => (
                    <ItemCard key={item.id} item={item} onAdd={(i) => { onAdd(i); onClose() }} />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="grid-2">
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Name <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <input className="form-control" value={form.name} onChange={e => setF('name', e.target.value)} placeholder="e.g. Laptop" />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Category</label>
                  <Select value={form.category} onChange={e => setF('category', e.target.value)}
                    options={['document','food','parcel','fragile','bulky'].map(c => ({ value: c, label: c.charAt(0).toUpperCase()+c.slice(1) }))}
                  />
                </div>
              </div>
              <div className="grid-2">
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Weight (kg) <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <input type="number" step="0.1" min="0.1" className="form-control" value={form.weight_kg} onChange={e => setF('weight_kg', e.target.value)} />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Declared Value (KES) <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <input type="number" min="0" className="form-control" value={form.declared_value} onChange={e => setF('declared_value', e.target.value)} />
                </div>
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Description</label>
                <input className="form-control" value={form.description} onChange={e => setF('description', e.target.value)} placeholder="Optional details" />
              </div>
              <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                {[['is_fragile','Fragile'],['requires_photo','Requires Photo'],['requires_signature','Requires Signature']].map(([key, label]) => (
                  <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                    <input type="checkbox" checked={form[key]} onChange={e => setF(key, e.target.checked)} style={{ width: 14, height: 14 }} />
                    {label}
                  </label>
                ))}
              </div>

              {/* Save to library toggle */}
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', padding: '10px 12px', background: 'var(--surface-muted)', borderRadius: 8 }}>
                <input type="checkbox" checked={saveToLibrary} onChange={e => setSaveToLibrary(e.target.checked)} style={{ width: 14, height: 14 }} />
                <Bookmark size={13} color="var(--primary)" />
                <span>Save to my item library for reuse</span>
              </label>

              <button
                type="button"
                className="btn btn-primary"
                disabled={!form.name || !form.weight_kg || form.declared_value === '' || createMutation.isPending}
                onClick={handleAddNew}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                {saved ? <><Check size={14} /> Saved!</> : <><Plus size={14} /> Add to Order</>}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
