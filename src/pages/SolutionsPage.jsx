import { Link, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import {
  Truck, RefreshCcw, Store, Package, Shield, Users,
  ArrowRight, CheckCircle, ChevronRight, Zap,
  MapPin, Clock, BarChart2, Lock, Headphones, Star,
} from 'lucide-react'
import SiteLogo from '../components/SiteLogo'

const API = (import.meta.env.VITE_API_URL ?? 'http://localhost:8000') + '/api'

const SOLUTIONS = [
  {
    slug: 'last-mile',
    title: 'First, Middle & Last Mile',
    tagline: 'End-to-end delivery from origin to recipient',
    Icon: Truck,
    color: '#FF5E14',
    description: 'SendTrack manages the complete delivery journey — from the moment a package leaves your warehouse to the second it reaches your customer\'s door. Our intelligent dispatch system finds the fastest route and the best-suited rider for every job.',
    features: [
      'Automated rider dispatch within minutes of order creation',
      'Live GPS tracking with real-time status updates',
      'Photo proof of delivery at dropoff',
      'SMS and in-app notifications for recipients',
      'Multi-stop route optimisation for bulk orders',
      'Same-day dispatch available 7 days a week',
    ],
    stats: [
      { value: '< 30min', label: 'Average pickup time' },
      { value: '98%',     label: 'On-time delivery rate' },
      { value: '24/7',    label: 'Operations coverage' },
    ],
    useCases: ['E-commerce fulfilment', 'Restaurant & food delivery', 'Pharmaceutical drops', 'Document courier'],
  },
  {
    slug: 'reverse-logistics',
    title: 'Reverse Logistics',
    tagline: 'Hassle-free returns that protect your customer relationships',
    Icon: RefreshCcw,
    color: '#7C3AED',
    description: 'Returns are a critical part of any online business. SendTrack\'s reverse logistics service makes the process seamless for both your team and your customers — with full tracking, condition reporting, and fast restocking.',
    features: [
      'Scheduled return pickups from customer locations',
      'Item condition photos captured at collection',
      'Digital chain-of-custody from customer to warehouse',
      'Return status notifications to both vendor and customer',
      'Integration with your existing returns policy workflows',
      'Bulk return handling for high-volume operations',
    ],
    stats: [
      { value: '100%',  label: 'Returns tracked' },
      { value: '< 24h', label: 'Return pickup SLA' },
      { value: '0',     label: 'Lost return packages' },
    ],
    useCases: ['Online retail returns', 'Equipment hire collection', 'Failed delivery retrieval', 'Recall management'],
  },
  {
    slug: 'pickup-stations',
    title: 'PickUp Stations',
    tagline: 'A growing network of secure hold points across Nairobi',
    Icon: Store,
    color: '#059669',
    description: 'Not every customer is home for a delivery. Our PickUp Station network gives recipients the flexibility to collect their package at a convenient time and location — while you avoid the cost of failed delivery attempts.',
    features: [
      'Hold packages securely for up to 7 working days',
      'Customer notified by SMS when package is ready',
      'PIN-verified collection to prevent fraud',
      'Real-time visibility of stock across all stations',
      'Station network expanding across Nairobi and beyond',
      'Partner station programme for businesses wanting to join the network',
    ],
    stats: [
      { value: '40+',  label: 'Active stations' },
      { value: '7 days', label: 'Maximum hold period' },
      { value: '99%',  label: 'Successful collections' },
    ],
    useCases: ['E-commerce alternative delivery', 'High-density residential areas', 'Office & business park hubs', 'Weekend shoppers'],
  },
  {
    slug: 'dedicated-rider',
    title: 'Dedicated Rider / Van Service',
    tagline: 'Exclusive fleet capacity assigned to your business',
    Icon: Package,
    color: '#D97706',
    description: 'For businesses with predictable, high-volume delivery needs, a dedicated rider or van ensures you always have capacity when you need it — without competing with other orders for dispatch priority.',
    features: [
      'One or more riders assigned exclusively to your account',
      'Flexible daily, weekly, or monthly contracts',
      'Branded rider uniforms and vehicle wrapping available',
      'Priority dispatch and guaranteed SLA commitments',
      'Dedicated account manager and performance reporting',
      'Scalable — add capacity instantly during peak periods',
    ],
    stats: [
      { value: '100%',  label: 'Capacity guarantee' },
      { value: '< 15min', label: 'Response time SLA' },
      { value: 'Custom', label: 'Contract terms' },
    ],
    useCases: ['High-volume e-commerce brands', 'Chain pharmacies', 'Supermarket & FMCG distribution', 'Corporate document couriers'],
  },
  {
    slug: 'warehousing',
    title: 'Warehousing',
    tagline: 'Secure storage with same-day dispatch capability',
    Icon: Shield,
    color: '#2563EB',
    description: 'Store your inventory at our secure facility and let SendTrack handle fulfilment. Orders placed on your platform trigger automatic pick, pack, and dispatch — so your customers get their goods faster, and you focus on growing.',
    features: [
      'Climate-controlled storage for sensitive goods',
      'Real-time inventory management dashboard',
      'Automated pick-and-pack on order creation',
      'Same-day dispatch for orders placed before 2pm',
      'Barcode scanning and SKU-level tracking',
      'Monthly inventory reports and stock alerts',
    ],
    stats: [
      { value: '5,000 sqft', label: 'Secure storage space' },
      { value: 'Same-day',   label: 'Dispatch cut-off 2pm' },
      { value: '99.9%',      label: 'Inventory accuracy' },
    ],
    useCases: ['D2C brands needing fulfilment', 'Seasonal overflow storage', 'Import distribution hubs', 'Product launch stock management'],
  },
  {
    slug: 'staffing',
    title: 'Staffing / HR Services',
    tagline: 'Vetted logistics workforce on demand',
    Icon: Users,
    color: '#DC2626',
    description: 'Need extra hands without the overhead of hiring? SendTrack supplies experienced, background-checked logistics personnel — from warehouse operatives to team leaders — deployable on short notice.',
    features: [
      'Fully vetted riders, packers, and warehouse staff',
      'WIBA insurance coverage for all deployed personnel',
      'Rapid deployment — staff available within 24–48 hours',
      'Flexible engagement: daily, weekly, or contract basis',
      'Payroll and compliance handled entirely by SendTrack',
      'Performance monitoring and replacement guarantee',
    ],
    stats: [
      { value: '48h',   label: 'Deployment lead time' },
      { value: '100%',  label: 'Staff vetted & insured' },
      { value: 'KES 2M', label: 'WIBA coverage per person' },
    ],
    useCases: ['Peak season staffing', 'Warehouse expansion projects', 'Rider fleet augmentation', 'Corporate logistics outsourcing'],
  },
]

function SolutionSection({ s, index }) {
  const isEven = index % 2 === 0
  return (
    <section
      id={s.slug}
      style={{ padding: '80px 24px', background: isEven ? '#fff' : '#F7F7F7' }}
    >
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 64,
          alignItems: 'center',
          direction: isEven ? 'ltr' : 'rtl',
        }} className="sol-grid">
          {/* Visual card */}
          <div style={{ direction: 'ltr' }}>
            <div style={{ background: '#0D0D0D', borderRadius: 20, padding: 40, position: 'relative', overflow: 'hidden', minHeight: 380, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ position: 'absolute', top: -40, right: -40, width: 220, height: 220, background: `${s.color}14`, borderRadius: '50%', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', bottom: -50, left: -30, width: 180, height: 180, background: `${s.color}0a`, borderRadius: '50%', pointerEvents: 'none' }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ width: 56, height: 56, background: s.color, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                  <s.Icon size={26} color="#fff" />
                </div>
                <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: 20, color: '#fff', marginBottom: 8 }}>{s.title}</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>{s.tagline}</div>
              </div>
              <div style={{ position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginTop: 32 }}>
                {s.stats.map(({ value, label }) => (
                  <div key={label} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 10, padding: '14px 12px', border: '1px solid rgba(255,255,255,0.08)', textAlign: 'center' }}>
                    <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: 15, color: s.color, marginBottom: 4 }}>{value}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', lineHeight: 1.4 }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Text content */}
          <div style={{ direction: 'ltr' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: s.color, textTransform: 'uppercase', letterSpacing: '1.2px' }}>SendTrack Solutions</span>
            <h2 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: 'clamp(22px,3vw,32px)', marginTop: 10, marginBottom: 16, lineHeight: 1.2 }}>
              {s.title}
            </h2>
            <p style={{ color: '#6B6B6B', lineHeight: 1.85, fontSize: 15, marginBottom: 28 }}>{s.description}</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
              {s.features.map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ width: 20, height: 20, background: `${s.color}1a`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                    <CheckCircle size={11} color={s.color} />
                  </div>
                  <span style={{ fontSize: 14, color: '#3D3D3D', lineHeight: 1.5 }}>{f}</span>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#9B9B9B', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>Common use cases</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {s.useCases.map(u => (
                  <span key={u} style={{ fontSize: 12, fontWeight: 500, color: '#3D3D3D', background: '#F0F0F0', borderRadius: 999, padding: '5px 12px' }}>{u}</span>
                ))}
              </div>
            </div>

            <Link to="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: s.color, color: '#fff', padding: '12px 24px', borderRadius: 8, fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>
              Get Started <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

export default function SolutionsPage() {
  const { hash } = useLocation()
  const { data: landingData } = useQuery({
    queryKey: ['landing-content'],
    queryFn: () => axios.get(`${API}/landing`).then(r => r.data.data),
    staleTime: 5 * 60 * 1000,
  })
  const branding = landingData?.branding    ?? {}
  const seo      = landingData?.landing_seo ?? {}

  useEffect(() => {
    if (hash) {
      const el = document.querySelector(hash)
      if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
    } else {
      window.scrollTo(0, 0)
    }
  }, [hash])

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Plus+Jakarta+Sans:wght@600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        .sol-grid { direction: ltr; }
        @media(max-width: 768px) {
          .sol-grid { grid-template-columns: 1fr !important; direction: ltr !important; gap: 32px !important; }
        }
      `}</style>

      {/* Navbar */}
      <header style={{ position: 'sticky', top: 0, zIndex: 100, background: '#fff', borderBottom: '1px solid #E5E5E5', boxShadow: '0 1px 0 rgba(0,0,0,0.04)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', height: 72 }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: '#0D0D0D' }}>
            <SiteLogo logoUrl={branding.logo_url} siteName={seo.site_name ?? 'SendTrack Ltd'} height={36} />
          </Link>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
            <Link to="/" style={{ fontSize: 14, fontWeight: 500, color: '#6B6B6B', textDecoration: 'none', padding: '8px 12px' }}>Home</Link>
            <Link to="/login" style={{ fontSize: 14, fontWeight: 600, color: '#0D0D0D', textDecoration: 'none', padding: '8px 14px' }}>Sign in</Link>
            <Link to="/register" style={{ background: '#FF5E14', color: '#fff', padding: '9px 18px', borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
              Get Started <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section style={{ background: '#0D0D0D', padding: '80px 24px 72px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(ellipse at 20% 60%, rgba(255,94,20,0.14) 0%, transparent 55%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,94,20,0.15)', border: '1px solid rgba(255,94,20,0.35)', borderRadius: 999, padding: '6px 14px', marginBottom: 24 }}>
            <Zap size={12} color="#FF5E14" />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#FF5E14', letterSpacing: '1px', textTransform: 'uppercase' }}>Our Solutions</span>
          </div>
          <h1 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: 'clamp(2rem,5vw,3.6rem)', color: '#fff', lineHeight: 1.1, marginBottom: 20 }}>
            Everything your business needs<br />
            <span style={{ color: '#FF5E14' }}>to move, store & deliver.</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 16, lineHeight: 1.8, maxWidth: 580, margin: '0 auto 40px' }}>
            From single parcels to full logistics operations — SendTrack scales with every business size and need.
          </p>
          {/* Quick nav pills */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
            {SOLUTIONS.map(s => (
              <a key={s.slug} href={`#${s.slug}`}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 999, textDecoration: 'none', fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.7)', transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,94,20,0.2)'; e.currentTarget.style.borderColor = 'rgba(255,94,20,0.5)'; e.currentTarget.style.color = '#FF5E14' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)' }}>
                <s.Icon size={13} /> {s.title}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Solution sections */}
      {SOLUTIONS.map((s, i) => <SolutionSection key={s.slug} s={s} index={i} />)}

      {/* CTA */}
      <section style={{ background: '#FF5E14', padding: '72px 24px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 80% 50%, rgba(255,255,255,0.08) 0%, transparent 55%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <h2 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: 'clamp(22px,4vw,36px)', color: '#fff', lineHeight: 1.2, marginBottom: 14 }}>
            Ready to get started?
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 16, lineHeight: 1.7, marginBottom: 36 }}>
            Join hundreds of businesses using SendTrack for faster, smarter last-mile delivery.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff', color: '#FF5E14', padding: '14px 30px', borderRadius: 10, fontWeight: 700, fontSize: 15, textDecoration: 'none' }}>
              Start For Free <ArrowRight size={16} />
            </Link>
            <Link to="/#contact" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.15)', color: '#fff', padding: '14px 30px', borderRadius: 10, fontWeight: 600, fontSize: 15, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.3)' }}>
              Talk to Sales
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
