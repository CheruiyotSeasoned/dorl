import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import {
  LayoutDashboard, Package, Users, Truck, FileText,
  BarChart3, Settings, Shield, Mail, MessageSquare, LogOut, Menu, X, ClipboardList, Globe, Building2,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import DispatchOfferModal from '../components/DispatchOfferModal'
import PWAInstallBanner from '../components/PWAInstallBanner'
import VendorPushBanner from '../components/VendorPushBanner'

const NAV = [
  // Admin + vendor + rider
  { to: '/dashboard',        icon: LayoutDashboard, label: 'Dashboard',  roles: ['admin','vendor','rider'] },
  // Rider specific
  { to: '/orders',           icon: Package,         label: 'Orders',     roles: ['rider'] },
  { to: '/rider/deliveries', icon: ClipboardList,   label: 'Deliveries', roles: ['rider'] },
  // Vendor
  { to: '/orders',           icon: Package,         label: 'Orders',     roles: ['vendor','admin'] },
  { to: '/riders',           icon: Truck,           label: 'Riders',     roles: ['admin','vendor'] },
  { to: '/invoices',         icon: FileText,        label: 'Invoices',   roles: ['admin','vendor'] },
  { to: '/reports',          icon: BarChart3,       label: 'Reports',    roles: ['admin','vendor'] },
  // Admin only
  { to: '/vendors',            icon: Building2,       label: 'Vendors',          roles: ['admin'] },
  { to: '/users',              icon: Users,           label: 'Users',            roles: ['admin'] },
  { to: '/contact-messages',   icon: MessageSquare,   label: 'Messages',         roles: ['admin'] },
  { to: '/email',              icon: Mail,            label: 'Email',            roles: ['admin'] },
  { to: '/audit-log',          icon: Shield,          label: 'Audit Log',        roles: ['admin'] },
  { to: '/settings',         icon: Settings,        label: 'Settings',       roles: ['admin'] },
  { to: '/landing-editor',   icon: Globe,           label: 'Landing Editor', roles: ['admin'], superAdminOnly: true },
]

function useIsMobile() {
  const [mobile, setMobile] = useState(() => window.innerWidth < 768)
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  return mobile
}

export default function DashboardLayout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile)
  const [collapsed, setCollapsed] = useState(false)

  const closeMobile = () => { if (isMobile) setSidebarOpen(false) }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const { isSuperAdmin } = useAuthStore()
  const visibleNav = NAV.filter(n => {
    if (!n.roles.includes(user?.role)) return false
    if (n.superAdminOnly && !isSuperAdmin()) return false
    return true
  })

  const sidebarWidth = isMobile ? 240 : (collapsed ? 64 : 240)
  const sidebarVisible = isMobile ? sidebarOpen : true

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Dispatch offer modal — only active for riders */}
      <DispatchOfferModal />
      {/* PWA install banner */}
      {(user?.role === 'rider' || user?.role === 'vendor') && <PWAInstallBanner />}
      {/* Vendor push notification banner */}
      {user?.role === 'vendor' && <VendorPushBanner />}

      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div className="sidebar-overlay active" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside style={{
        width: sidebarWidth,
        background: 'var(--secondary)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        transition: 'width 0.2s, transform 0.2s',
        position: isMobile ? 'fixed' : 'sticky',
        top: 0,
        left: 0,
        height: '100vh',
        overflow: 'hidden',
        zIndex: 50,
        transform: sidebarVisible ? 'translateX(0)' : 'translateX(-100%)',
      }}>
        {/* Logo row */}
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {(!collapsed || isMobile) ? (
              <div style={{ background: '#fff', borderRadius: 6, padding: '3px 8px', flexShrink: 0 }}>
                <img src="/logo.png" alt="DORL" style={{ height: 22, width: 'auto', objectFit: 'contain', display: 'block' }} />
              </div>
            ) : (
              <div style={{ width: 32, height: 32, background: '#fff', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                <img src="/logo.png" alt="DORL" style={{ height: 28, width: 'auto', objectFit: 'contain' }} />
              </div>
            )}
            <button
              onClick={() => isMobile ? setSidebarOpen(false) : setCollapsed(c => !c)}
              style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: 4, flexShrink: 0 }}
            >
              {(isMobile || !collapsed) ? <X size={16} /> : <Menu size={16} />}
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto' }}>
          {visibleNav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={`${to}-${label}`}
              to={to}
              onClick={closeMobile}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px', borderRadius: 8, marginBottom: 2,
                color: isActive ? '#fff' : 'rgba(255,255,255,0.55)',
                background: isActive ? 'rgba(255,94,20,0.18)' : 'transparent',
                borderLeft: isActive ? '3px solid var(--primary)' : '3px solid transparent',
                fontSize: 14, fontWeight: 500, textDecoration: 'none',
                transition: 'all 0.15s', whiteSpace: 'nowrap', overflow: 'hidden',
              })}
            >
              <Icon size={18} strokeWidth={1.75} style={{ flexShrink: 0 }} />
              {(!collapsed || isMobile) && label}
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div style={{ padding: '12px 8px', borderTop: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', overflow: 'hidden' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            {(!collapsed || isMobile) && (
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{user?.role}</div>
              </div>
            )}
          </div>
          <button onClick={handleLogout} className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: (!collapsed || isMobile) ? 'flex-start' : 'center', color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
            <LogOut size={16} />
            {(!collapsed || isMobile) && 'Log out'}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {isMobile && (
          <div style={{ position: 'sticky', top: 0, zIndex: 30, background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => setSidebarOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', padding: 4, display: 'flex' }}>
              <Menu size={22} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <img src="/logo.png" alt="DORL" style={{ height: 24, width: 'auto', objectFit: 'contain' }} />
            </div>
          </div>
        )}

        <main style={{ flex: 1, padding: isMobile ? '20px 16px' : '28px 32px', overflowY: 'auto', maxWidth: '100%' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
