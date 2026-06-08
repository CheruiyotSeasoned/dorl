import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import toast from 'react-hot-toast'
import { Save, Plus, Trash2, Globe, ExternalLink } from 'lucide-react'

const TABS = [
  { key: 'landing_hero',        label: 'Hero' },
  { key: 'landing_about',       label: 'About' },
  { key: 'landing_services',    label: 'Services' },
  { key: 'landing_whyus',       label: 'Why Us' },
  { key: 'landing_howitworks',  label: 'How It Works' },
  { key: 'landing_news',        label: 'News' },
  { key: 'landing_contact',     label: 'Contact' },
  { key: 'landing_footer',      label: 'Footer' },
  { key: 'landing_seo',         label: 'SEO' },
  { key: 'landing_legal',       label: 'Legal' },
  { key: 'upcountry_rates',     label: 'Delivery Rates' },
]

function Field({ label, value, onChange, multiline, type = 'text', hint }) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      {multiline
        ? <textarea className="form-control" rows={4} value={value ?? ''} onChange={e => onChange(e.target.value)} style={{ resize: 'vertical' }} />
        : <input className="form-control" type={type} value={value ?? ''} onChange={e => onChange(e.target.value)} />
      }
      {hint && <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>{hint}</p>}
    </div>
  )
}

// ── Hero editor ───────────────────────────────────────────────────────────────
function HeroEditor({ data, setData }) {
  const s = (k) => (v) => setData({ ...data, [k]: v })
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <Field label="Badge Text"           value={data.badge}         onChange={s('badge')} />
      <Field label="Title Line 1"         value={data.title1}        onChange={s('title1')} />
      <Field label="Title Line 2 (orange)"value={data.title2}        onChange={s('title2')} />
      <Field label="Subtitle"             value={data.subtitle}      onChange={s('subtitle')} multiline />
      <Field label="Primary CTA"          value={data.cta_primary}   onChange={s('cta_primary')} />
      <Field label="Secondary CTA"        value={data.cta_secondary} onChange={s('cta_secondary')} />
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

// ── Array item editor ─────────────────────────────────────────────────────────
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

// ── Contact editor ────────────────────────────────────────────────────────────
function ContactEditor({ data, setData }) {
  const s = (k) => (v) => setData({ ...data, [k]: v })
  return (
    <div>
      <Field label="Address"      value={data.address}   onChange={s('address')} multiline />
      <Field label="Phone"        value={data.phone}     onChange={s('phone')} />
      <Field label="Email"        value={data.email}     onChange={s('email')} />
      <Field label="Office Hours" value={data.hours}     onChange={s('hours')} />
      <Field label="WhatsApp Number" value={data.whatsapp} onChange={s('whatsapp')}
        hint="Kenyan number e.g. 0708919320 or 254708919320. Used for the WhatsApp chat widget on the landing page." />
    </div>
  )
}

// ── Footer editor ─────────────────────────────────────────────────────────────
function FooterEditor({ data, setData }) {
  const s = (k) => (v) => setData({ ...data, [k]: v })
  return (
    <div>
      <Field label="Company Tagline" value={data.company_tagline} onChange={s('company_tagline')} multiline hint="Short description shown under the logo in the footer." />
      <Field label="Copyright text"  value={data.copyright}       onChange={s('copyright')} hint='e.g. "SendTrack Ltd. All rights reserved." — year is added automatically.' />

      <div style={{ marginTop: 16, marginBottom: 8, fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>Social Media Links</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <Field label="Twitter / X URL"  value={data.social_twitter}   onChange={s('social_twitter')}  hint="Full URL, e.g. https://twitter.com/sendtrackke" />
        <Field label="LinkedIn URL"     value={data.social_linkedin}  onChange={s('social_linkedin')} hint="Full URL" />
        <Field label="Instagram URL"    value={data.social_instagram} onChange={s('social_instagram')} hint="Full URL" />
        <Field label="Facebook URL"     value={data.social_facebook}  onChange={s('social_facebook')} hint="Full URL" />
        <Field label="TikTok URL"       value={data.social_tiktok}    onChange={s('social_tiktok')} hint="Full URL (optional)" />
      </div>

      <div style={{ marginTop: 8, marginBottom: 8, fontWeight: 600, fontSize: 13 }}>Navigation Links</div>
      <ArrayEditor
        data={data.nav_links ?? []}
        setData={v => setData({ ...data, nav_links: v })}
        fields={[{ key: 'label', label: 'Label' }, { key: 'href', label: 'URL or anchor (e.g. #about or /track)' }]}
        addDefault={{ label: '', href: '' }}
      />

      <div style={{ marginTop: 16, marginBottom: 8, fontWeight: 600, fontSize: 13 }}>Our Solutions Links</div>
      <ArrayEditor
        data={data.solutions_links ?? []}
        setData={v => setData({ ...data, solutions_links: v })}
        fields={[{ key: 'label', label: 'Label' }, { key: 'href', label: 'URL or anchor' }]}
        addDefault={{ label: '', href: '' }}
      />

      <div style={{ marginTop: 16, marginBottom: 8, fontWeight: 600, fontSize: 13 }}>Company Links</div>
      <ArrayEditor
        data={data.company_links ?? []}
        setData={v => setData({ ...data, company_links: v })}
        fields={[{ key: 'label', label: 'Label' }, { key: 'href', label: 'URL or anchor (e.g. /privacy or #contact)' }]}
        addDefault={{ label: '', href: '' }}
      />
    </div>
  )
}

// ── SEO editor ────────────────────────────────────────────────────────────────
function SeoEditor({ data, setData }) {
  const s = (k) => (v) => setData({ ...data, [k]: v })
  return (
    <div>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
        These values control how the landing page appears in Google search results and social media link previews.
      </p>
      <Field label="Site Name"        value={data.site_name}        onChange={s('site_name')}        hint="Shown in browser tab and search results (e.g. SendTrack Ltd)" />
      <Field label="Page Title"       value={data.meta_title}       onChange={s('meta_title')}       hint="Keep under 60 characters. Shown in Google results." />
      <Field label="Meta Description" value={data.meta_description} onChange={s('meta_description')} multiline hint="150–160 characters. Shown under the title in Google results." />
      <Field label="Keywords"         value={data.meta_keywords}    onChange={s('meta_keywords')}    hint="Comma-separated keywords. Not heavily used by Google but good practice." />
      <Field label="OG Image URL"     value={data.og_image}         onChange={s('og_image')}         hint="Full URL to the image shown when sharing on social media (1200×630 px recommended)." />
      <Field label="Canonical URL"    value={data.og_url}           onChange={s('og_url')}           hint="Your site's root URL, e.g. https://sendtrack.co.ke" />
      <Field label="Twitter Handle"   value={data.twitter_handle}   onChange={s('twitter_handle')}   hint="e.g. @sendtrackke (optional)" />
    </div>
  )
}

// ── Legal editor ──────────────────────────────────────────────────────────────
function LegalEditor({ data, setData }) {
  const s = (k) => (v) => setData({ ...data, [k]: v })
  return (
    <div>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
        Content for the <strong>/privacy</strong> and <strong>/terms</strong> pages.
        Use <code>**bold**</code> for bold text. Separate paragraphs with a blank line.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <Field label="Privacy Page Title"   value={data.privacy_title}   onChange={s('privacy_title')} />
        <Field label="Privacy Last Updated" value={data.privacy_updated} onChange={s('privacy_updated')} hint='e.g. "June 2026"' />
      </div>
      <Field label="Privacy Policy Content" value={data.privacy_content} onChange={s('privacy_content')} multiline />

      <div style={{ borderTop: '1px solid var(--border)', margin: '28px 0 20px' }} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <Field label="Terms Page Title"   value={data.terms_title}   onChange={s('terms_title')} />
        <Field label="Terms Last Updated" value={data.terms_updated} onChange={s('terms_updated')} hint='e.g. "June 2026"' />
      </div>
      <Field label="Terms & Conditions Content" value={data.terms_content} onChange={s('terms_content')} multiline />
    </div>
  )
}

// ── Upcountry Rates Editor ────────────────────────────────────────────────────
const DEFAULT_RATES = [
  { id: 'documents', name: 'Documents',           description: 'Letters, certificates, envelopes (up to 0.5 kg)', base_price: 250,  per_km_rate: 8  },
  { id: 'small',     name: 'Small Parcel',         description: 'Small items, clothing, books (up to 5 kg)',        base_price: 400,  per_km_rate: 14 },
  { id: 'large',     name: 'Large Parcel',         description: 'Bulky or heavier items (up to 20 kg)',             base_price: 700,  per_km_rate: 18 },
  { id: 'fragile',   name: 'Fragile / Electronics','description': 'Screens, appliances, glassware',                base_price: 600,  per_km_rate: 16 },
  { id: 'bulk',      name: 'Bulk / Commercial',    description: 'Large commercial shipments (20 kg+)',              base_price: 1200, per_km_rate: 22 },
]

function UpcountryRatesEditor() {
  const qc = useQueryClient()
  const { data: serverRates, isLoading } = useQuery({
    queryKey: ['upcountry-rates'],
    queryFn: () => api.get('/upcountry/rates').then(r => r.data.data),
  })
  const [rates, setRates] = useState(null)
  const working = rates ?? serverRates ?? DEFAULT_RATES

  const set = (i, field, val) => {
    const updated = working.map((r, idx) => idx === i ? { ...r, [field]: val } : r)
    setRates(updated)
  }

  const mutation = useMutation({
    mutationFn: () => api.put('/admin/upcountry/rates', { rates: working }),
    onSuccess: () => {
      toast.success('Delivery rates saved!')
      qc.invalidateQueries(['upcountry-rates'])
      qc.invalidateQueries(['landing-content'])
    },
    onError: err => toast.error(err.response?.data?.message ?? 'Save failed'),
  })

  if (isLoading) return <div style={{ padding: 32, display: 'flex', justifyContent: 'center' }}><span className="spinner" /></div>

  return (
    <div>
      <p className="text-sm text-muted" style={{ marginBottom: 20 }}>
        These rates power the instant quote calculator on the landing page.
        Price formula: <strong>KES (base price) + (distance km × per km rate)</strong>
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {working.map((rate, i) => (
          <div key={rate.id} style={{ border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px' }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: 'var(--text-primary)' }}>{rate.name}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: 12 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Base Price (KES)</label>
                <input type="number" className="form-control" value={rate.base_price}
                  onChange={e => set(i, 'base_price', Number(e.target.value))} min={0} step={10} />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Per km Rate (KES)</label>
                <input type="number" className="form-control" value={rate.per_km_rate}
                  onChange={e => set(i, 'per_km_rate', Number(e.target.value))} min={0} step={1} />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Description</label>
                <input className="form-control" value={rate.description ?? ''}
                  onChange={e => set(i, 'description', e.target.value)} />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn btn-primary" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
          {mutation.isPending ? <span className="spinner" /> : <><Save size={14} /> Save Rates</>}
        </button>
      </div>
    </div>
  )
}

// ── Section wrapper ───────────────────────────────────────────────────────────
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
      case 'landing_hero':       return <HeroEditor    data={data} setData={setData} />
      case 'landing_about':      return <AboutEditor   data={data} setData={setData} />
      case 'landing_services':   return <ArrayEditor   data={data} setData={setData} fields={[{ key: 'title', label: 'Title' },{ key: 'desc', label: 'Description', multiline: true }]} addDefault={{ title: '', desc: '' }} />
      case 'landing_whyus':      return <WhyUsEditor   data={data} setData={setData} />
      case 'landing_howitworks': return <ArrayEditor   data={data} setData={setData} fields={[{ key: 'n', label: 'Number (01, 02…)' },{ key: 'title', label: 'Title' },{ key: 'desc', label: 'Description', multiline: true }]} addDefault={{ n: '', title: '', desc: '' }} />
      case 'landing_news':       return <ArrayEditor   data={data} setData={setData} fields={[{ key: 'cat', label: 'Category' },{ key: 'title', label: 'Title' },{ key: 'date', label: 'Date (e.g. Apr 2025)' },{ key: 'excerpt', label: 'Excerpt', multiline: true }]} addDefault={{ cat: '', title: '', date: '', excerpt: '' }} />
      case 'landing_contact':    return <ContactEditor data={data} setData={setData} />
      case 'landing_footer':     return <FooterEditor  data={data} setData={setData} />
      case 'landing_seo':        return <SeoEditor     data={data} setData={setData} />
      case 'landing_legal':      return <LegalEditor   data={data} setData={setData} />
      default: return null
    }
  }

  return (
    <div>
      {renderEditor()}
      <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
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
        <div style={{ display: 'flex', gap: 10 }}>
          <a href="/privacy" target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
            <ExternalLink size={13} /> Privacy
          </a>
          <a href="/terms" target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
            <ExternalLink size={13} /> Terms
          </a>
          <a href="/" target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
            <ExternalLink size={13} /> Preview Site
          </a>
        </div>
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
                  padding: '14px 18px', border: 'none', background: 'none', cursor: 'pointer',
                  fontWeight: activeTab === key ? 700 : 500,
                  fontSize: 13,
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
          <div style={{ padding: 28, maxWidth: 860 }}>
            {activeTab === 'upcountry_rates' ? (
              <UpcountryRatesEditor />
            ) : data && (
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
