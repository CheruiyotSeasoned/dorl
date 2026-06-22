import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { Navbar, Footer } from '../pages/LandingPage'

const API = (import.meta.env.VITE_API_URL ?? 'http://localhost:8000') + '/api'

/**
 * Shared public chrome — same navbar (real logo) + footer as the landing page.
 * Wrap any public page in this so branding/nav/footer stay consistent.
 */
export default function PublicLayout({ children }) {
  const { data } = useQuery({
    queryKey: ['landing-content'],
    queryFn: () => axios.get(`${API}/landing`).then(r => r.data.data),
    staleTime: 5 * 60 * 1000,
  })
  const d = data ?? {}

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', fontFamily: "'DM Sans', sans-serif" }}>
      <Navbar logoUrl={d.branding?.logo_url} siteName={d.landing_seo?.site_name} />
      <main style={{ flex: 1 }}>{children}</main>
      <Footer footer={d.landing_footer} contact={d.landing_contact} seo={d.landing_seo} branding={d.branding} />
    </div>
  )
}
