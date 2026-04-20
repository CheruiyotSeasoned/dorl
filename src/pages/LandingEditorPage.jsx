import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import toast from 'react-hot-toast'
import { Save, Plus, Trash2, Globe } from 'lucide-react'

const TABS = [
  { key: 'landing_hero',        label: 'Hero' },
  { key: 'landing_about',       label: 'About' },
  { key: 'landing_services',    label: 'Services' },
  { key: 'landing_whyus',       label: 'Why Us' },
  { key: 'landing_howitworks',  label: 'How It Works' },
  { key: 'landing_news',        label: 'News' },
  { key: 'landing_contact',     label: 'Contact' },
]

function Field({ label, value, onChange, multiline, type = 'text' }) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      {multiline
        ? <textarea className="form-control" rows={3} value={value ?? ''} onChange={e => onChange(e.target.value)} style={{ resize: 'vertical' }} />
        : <input className="form-control" type={type} value={value ?? ''} onChange={e => onChange(e.target.value)} />
      }
    </div>
  )
}

// ── Hero editor ───────────────────────────────────────────────────────────────
function HeroEditor({ data, setData }) {
  const s = (k) => (v) => setData({ ...data, [k]: v })
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <Field label="Badge Text"      value={data.badge}         onChange={s('badge')} />
      <Field label="Title Line 1"    value={data.title1}        onChange={s('title1')} />
      <Field label="Title Line 2 (orange)" value={data.title2}  onChange={s('title2')} />
      <Field label="Subtitle"        value={data.subtitle}      onChange={s('subtitle')} multiline />
      <Field label="Primary CTA"     value={data.cta_primary}   onChange={s('cta_primary')} />
      <Field label="Secondary CTA"   value={data.cta_secondary} onChange={s('cta_secondary')} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
        {[1,2,3].map(n => (
          <div key={n}>
            <Field label={`Stat ${n} Value`} value={data[`stat${n}_value`]} onChange={s(`stat${n}_value`)} />
            <Field label={`Stat ${n} Label`} value={data[`stat${n}_label`]} onChange={s(`stat${n}_label`)} />
          </div>
        ))}
      </div>
    </div>
  )
}

// ── About editor ──────────────────────────────────────────────────────────────
function AboutEditor({ data, setData }) {
  const s = (k) => (v) => setData({ ...data, [k]: v })
  const setStatField = (idx, field, val) => {
    const stats = [...(data.stats ?? [])]
    stats[idx] = { ...stats[idx], [field]: val }
    setData({ ...data, stats })
  }
  return (
    <div>
      <Field label="Years of Experience" value={data.years} onChange={s('years')} />
      <Field label="Title"               value={data.title} onChange={s('title')} />
      <Field label="Body Paragraph 1"    value={data.body1} onChange={s('body1')} multiline />
      <Field label="Body Paragraph 2"    value={data.body2} onChange={s('body2')} multiline />
      <div style={{ marginTop: 8 }}>
        <label className="form-label">Stats (up to 4)</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {(data.stats ?? []).map((st, i) => (
            <div key={i} style={{ background: 'var(--surface-muted)', borderRadius: 8, padding: 12 }}>
              <Field label="Value" value={st.value} onChange={v => setStatField(i, 'value', v)} />
              <Field label="Label" value={st.label} onChange={v => setStatField(i, 'label', v)} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Array item editor (Services, WhyUs items, How It Works, News) ─────────────
function ArrayEditor({ data, setData, fields, addDefault }) {
  const items = Array.isArray(data) ? data : []
  const update = (idx, key, val) => {
    const next = items.map((it, i) => i === idx ? { ...it, [key]: val } : it)
    setData(next)
  }
  const remove = (idx) => setData(items.filter((_, i) => i !== idx))
  const add    = () => setData([...items, addDefault])

  return (
    <div>
      {items.map((item, idx) => (
        <div key={idx} style={{ border: '1px solid var(--border)', borderRadius: 10, padding: 16, marginBottom: 12, position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontWeight: 600, fontSize: 13 }}>Item {idx + 1}</span>
            <button className="btn btn-ghost btn-sm" onClick={() => remove(idx)}><Trash2 size={14} color="var(--danger)" /></button>
          </div>
          {fields.map(({ key, label, multiline }) => (
            <Field key={key} label={label} value={item[key]} onChange={v => update(idx, key, v)} multiline={multiline} />
          ))}
        </div>
      ))}
      <button className="btn btn-secondary btn-sm" onClick={add}>
        <Plus size={14} /> Add Item
      </button>
    </div>
  )
}

// ── WhyUs editor ──────────────────────────────────────────────────────────────
function WhyUsEditor({ data, setData }) {
  return (
    <div>
      <Field label="Quote" value={data.quote} onChange={v => setData({ ...data, quote: v })} multiline />
      <div style={{ marginTop: 8 }}>
        <label className="form-label" style={{ marginBottom: 8, display: 'block' }}>Reasons / Features</label>
        <ArrayEditor
          data={data.items ?? []}
          setData={items => setData({ ...data, items })}
          fields={[{ key: 'title', label: 'Title' }, { key: 'desc', label: 'Description', multiline: true }]}
          addDefault={{ title: '', desc: '' }}
        />
      </div>
    </div>
  )
}

// ── Contact editor ─────────────────────────────────────────────────────────────
function ContactEditor({ data, setData }) {
  const s = (k) => (v) => setData({ ...data, [k]: v })
  return (
    <div>
      <Field label="Address"      value={data.address} onChange={s('address')} multiline />
      <Field label="Phone"        value={data.phone}   onChange={s('phone')} />
      <Field label="Email"        value={data.email}   onChange={s('email')} />
      <Field label="Office Hours" value={data.hours}   onChange={s('hours')} />
    </div>
  )
}

// ── Section wrapper ────────────────────────────────────────────────────────────
function SectionEditor({ sectionKey, initial }) {
  const qc = useQueryClient()
  const [data, setData] = useState(initial)

  const mutation = useMutation({
    mutationFn: () => api.put(`/admin/landing/${sectionKey}`, { data }),
    onSuccess: () => {
      toast.success('Section saved!')
      qc.invalidateQueries(['landing-content'])
    },
    onError: (err) => toast.error(err.response?.data?.error ?? 'Save failed'),
  })

  const renderEditor = () => {
    switch (sectionKey) {
      case 'landing_hero':       return <HeroEditor data={data}    setData={setData} />
      case 'landing_about':      return <AboutEditor data={data}   setData={setData} />
      case 'landing_services':   return <ArrayEditor data={data}   setData={setData} fields={[{ key: 'title', label: 'Title' },{ key: 'desc', label: 'Description', multiline: true }]} addDefault={{ title: '', desc: '' }} />
      case 'landing_whyus':      return <WhyUsEditor data={data}   setData={setData} />
      case 'landing_howitworks': return <ArrayEditor data={data}   setData={setData} fields={[{ key: 'n', label: 'Number (01, 02…)' },{ key: 'title', label: 'Title' },{ key: 'desc', label: 'Description', multiline: true }]} addDefault={{ n: '', title: '', desc: '' }} />
      case 'landing_news':       return <ArrayEditor data={data}   setData={setData} fields={[{ key: 'cat', label: 'Category' },{ key: 'title', label: 'Title' },{ key: 'date', label: 'Date (e.g. Apr 2025)' },{ key: 'excerpt', label: 'Excerpt', multiline: true }]} addDefault={{ cat: '', title: '', date: '', excerpt: '' }} />
      case 'landing_contact':    return <ContactEditor data={data} setData={setData} />
      default: return null
    }
  }

  return (
    <div>
      {renderEditor()}
      <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn btn-primary" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
          {mutation.isPending ? <span className="spinner" /> : <><Save size={14} /> Save Section</>}
        </button>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function LandingEditorPage() {
  const [activeTab, setActiveTab] = useState('landing_hero')

  const { data, isLoading } = useQuery({
    queryKey: ['landing-content'],
    queryFn: () => api.get('/landing').then(r => r.data.data),
  })

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title"><Globe size={20} style={{ marginRight: 8, verticalAlign: 'middle' }} />Landing Page Editor</h1>
          <p className="text-sm text-muted">Super admin only — changes appear live on the public landing page</p>
        </div>
        <a href="/" target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
          Preview Landing Page
        </a>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}><span className="spinner" /></div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', overflowX: 'auto' }}>
            {TABS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                style={{
                  padding: '14px 20px', border: 'none', background: 'none', cursor: 'pointer',
                  fontWeight: activeTab === key ? 700 : 500,
                  fontSize: 14,
                  color: activeTab === key ? 'var(--primary)' : 'var(--text-secondary)',
                  borderBottom: activeTab === key ? '2px solid var(--primary)' : '2px solid transparent',
                  whiteSpace: 'nowrap',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Editor */}
          <div style={{ padding: 28, maxWidth: 800 }}>
            {data && (
              <SectionEditor
                key={activeTab}
                sectionKey={activeTab}
                initial={data[activeTab] ?? {}}
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
