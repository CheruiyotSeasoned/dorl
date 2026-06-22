import { Outlet, NavLink, useNavigate, useMatch } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { useAuthStore } from '../store/authStore'
import {
  LayoutDashboard, Package, Users, Truck, FileText,
  BarChart3, Settings, Shield, Mail, MessageSquare, LogOut, Menu,
  ClipboardList, Globe, Building2, MonitorSmartphone, Warehouse, CalendarClock,
  MapPin, Wallet, QrCode, PackageSearch, Search,
  ShieldCheck, Activity, ChevronLeft, ChevronRight, ArrowLeft, ArrowRight,
} from 'lucide-react'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import DispatchOfferModal from '../components/DispatchOfferModal'
import PWAInstallBanner from '../components/PWAInstallBanner'
import VendorPushBanner from '../components/VendorPushBanner'
import SessionsModal from '../components/SessionsModal'
import NotificationBell from '../components/NotificationBell'
import SiteLogo, { buildLogoUrl } from '../components/SiteLogo'
import api from '../lib/api'

// ─── Design tokens ─────────────────────────────────────────────────────────────
const S = {
  bg:           '#0B0E18',
  bgItem:       'rgba(255,255,255,0.04)',
  activeBg:     'rgba(255,94,20,0.14)',
  activeBorder: 'rgba(255,94,20,0.22)',
  activeAccent: '#FF5E14',
  activeIcon:   '#FF7A45',
  activeText:   '#FFFFFF',
  inactiveIcon: 'rgba(255,255,255,0.36)',
  inactiveText: 'rgba(255,255,255,0.52)',
  sectionLabel: 'rgba(255,255,255,0.22)',
  divider:      'rgba(255,255,255,0.07)',
  tooltip:      '#1C2033',
  tooltipBorder:'rgba(255,255,255,0.1)',
}

const NAV_GROUPS = [
  {
    label: null,
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard',
        roles: ['admin','vendor','rider','station_agent','warehouse_staff'] },
    ],
  },
  {
    label: 'Operations',
    roles: ['vendor','admin'],
    items: [
      { to: '/orders',    icon: Package,       label: 'Orders',    roles: ['vendor','admin'] },
      { to: '/shipments', icon: PackageSearch, label: 'Shipments', roles: ['vendor','admin'] },
      { to: '/riders',    icon: Truck,         label: 'Riders',    roles: ['vendor','admin'] },
    ],
  },
  {
    label: 'Finance',
    roles: ['vendor','admin'],
    items: [
      { to: '/wallet',   icon: Wallet,    label: 'Wallet & Payouts', roles: ['vendor','admin'] },
      { to: '/invoices', icon: FileText,  label: 'Invoices',         roles: ['vendor','admin'] },
      { to: '/reports',  icon: BarChart3, label: 'Reports',          roles: ['vendor','admin'] },
    ],
  },
  {
    label: 'My Work',
    roles: ['rider'],
    items: [
      { to: '/orders',           icon: Package,       label: 'Orders',     roles: ['rider'] },
      { to: '/rider/deliveries', icon: ClipboardList, label: 'Deliveries', roles: ['rider'] },
    ],
  },
  {
    label: 'Station',
    roles: ['station_agent'],
    items: [
      { to: '/station', icon: QrCode, label: 'Scan & Pickup', roles: ['station_agent'] },
    ],
  },
  {
    label: 'Warehouse',
    roles: ['warehouse_staff'],
    items: [
      { to: '/warehouse', icon: Warehouse,    label: 'Inbound Shipments', roles: ['warehouse_staff'] },
      { to: '/shipments', icon: PackageSearch, label: 'All Shipments',   roles: ['warehouse_staff'] },
    ],
  },
  {
    label: 'Fulfillment',
    roles: ['admin'],
    items: [
      { to: '/hubs',            icon: Warehouse,     label: 'Hubs',            roles: ['admin'] },
      { to: '/pickup-stations', icon: MapPin,         label: 'Pickup Stations', roles: ['admin'] },
      { to: '/dispatch-slots',  icon: CalendarClock,  label: 'Dispatch Slots',  roles: ['admin'] },
    ],
  },
  {
    label: 'Management',
    roles: ['admin'],
    items: [
      { to: '/vendors',          icon: Building2,     label: 'Vendors',  roles: ['admin'] },
      { to: '/users',            icon: Users,         label: 'Users',    roles: ['admin'] },
      { to: '/contact-messages', icon: MessageSquare, label: 'Messages', roles: ['admin'] },
      { to: '/email',            icon: Mail,          label: 'Email',    roles: ['admin'] },
    ],
  },
  {
    label: 'System',
    roles: ['admin'],
    items: [
      { to: '/system-health',    icon: Activity,   label: 'System Health',    roles: ['admin'] },
      { to: '/role-permissions', icon: ShieldCheck, label: 'Role Permissions', roles: ['admin'] },
      { to: '/audit-log',        icon: Shield,      label: 'Audit Log',        roles: ['admin'] },
      { to: '/settings',         icon: Settings,    label: 'Settings',         roles: ['admin'] },
      { to: '/landing-editor',   icon: Globe,       label: 'Landing Editor',   roles: ['admin'], superAdminOnly: true },
    ],
  },
]

const ROLE_LABELS = {
  admin:           'Administrator',
  vendor:          'Seller',
  rider:           'Rider',
  station_agent:   'Station Agent',
  warehouse_staff: 'Warehouse Staff',
}

const EXPANDED_W = 252
const COLLAPSED_W = 62

// ─── Tooltip (floating label shown when sidebar is collapsed) ──────────────────
function Tooltip({ label, anchorY, sidebarWidth }) {
  return (
    <div style={{
      position: 'fixed',
      left: sidebarWidth + 10,
      top: anchorY,
      transform: 'translateY(-50%)',
      background: S.tooltip,
      border: `1px solid ${S.tooltipBorder}`,
      borderRadius: 8,
      padding: '6px 12px',
      fontSize: 12,
      fontWeight: 600,
      color: '#fff',
      zIndex: 9999,
      pointerEvents: 'none',
      whiteSpace: 'nowrap',
      boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
      letterSpacing: '0.01em',
    }}>
      {label}
      {/* Arrow */}
      <span style={{
        position: 'absolute',
        left: -5, top: '50%', transform: 'translateY(-50%)',
        width: 0, height: 0,
        borderTop: '5px solid transparent',
        borderBottom: '5px solid transparent',
        borderRight: `5px solid ${S.tooltipBorder}`,
      }} />
    </div>
  )
}

// ─── Nav item ──────────────────────────────────────────────────────────────────
function NavItem({ to, icon: Icon, label, isExpanded, closeMobile, onTooltip, offTooltip }) {
  const match = useMatch({ path: to, end: to === '/dashboard' })
  const isActive = !!match

  return (
    <NavLink
      to={to}
      onClick={closeMobile}
      onMouseEnter={e => {
        if (!isExpanded) {
          const rect = e.currentTarget.getBoundingClientRect()
          onTooltip(label, rect.top + rect.height / 2)
        }
      }}
      onMouseLeave={offTooltip}
      style={({ isActive: _ }) => ({
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: isExpanded ? '0 12px' : '0',
        justifyContent: isExpanded ? 'flex-start' : 'center',
        height: 40,
        borderRadius: 10,
        marginBottom: 2,
        color: isActive ? S.activeText : S.inactiveText,
        background: isActive ? S.activeBg : 'transparent',
        border: `1px solid ${isActive ? S.activeBorder : 'transparent'}`,
        boxShadow: isActive ? `inset 3px 0 0 ${S.activeAccent}` : 'none',
        fontSize: 13,
        fontWeight: isActive ? 600 : 400,
        textDecoration: 'none',
        transition: 'background 0.15s, color 0.15s, box-shadow 0.15s',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        flexShrink: 0,
      })}
    >
      <Icon
        size={17}
        strokeWidth={isActive ? 2.1 : 1.65}
        style={{
          flexShrink: 0,
          color: isActive ? S.activeIcon : S.inactiveIcon,
          transition: 'color 0.15s',
        }}
      />
      {isExpanded && (
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {label}
        </span>
      )}
      {isExpanded && isActive && (
        <ChevronRight size={12} style={{ color: 'rgba(255,94,20,0.55)', flexShrink: 0 }} />
      )}
    </NavLink>
  )
}

function useIsMobile() {
  const [mobile, setMobile] = useState(() => window.innerWidth < 768)
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  return mobile
}

// True when launched as an installed PWA (no browser chrome → no back/forward buttons)
function useIsStandalone() {
  const check = () =>
    window.matchMedia?.('(display-mode: standalone)').matches === true ||
    window.navigator.standalone === true // iOS Safari
  const [standalone, setStandalone] = useState(check)
  useEffect(() => {
    const mq = window.matchMedia('(display-mode: standalone)')
    const fn = () => setStandalone(check())
    mq.addEventListener?.('change', fn)
    return () => mq.removeEventListener?.('change', fn)
  }, [])
  return standalone
}

// ─── Main layout ───────────────────────────────────────────────────────────────
export default function DashboardLayout() {
  const { user, logout, isSuperAdmin } = useAuthStore()
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const isStandalone = useIsStandalone()

  const { data: branding } = useQuery({
    queryKey: ['branding'],
    queryFn: () => api.get('/branding').then(r => r.data.data),
    staleTime: 10 * 60 * 1000,
  })
  const logoUrl = branding?.logo_url ? buildLogoUrl(branding.logo_url) : null
  const [sidebarOpen, setSidebarOpen]   = useState(!isMobile)
  const [collapsed, setCollapsed]       = useState(false)
  const [showSessions, setShowSessions] = useState(false)
  const [tooltip, setTooltip]           = useState(null) // { label, y }

  const closeMobile = () => { if (isMobile) setSidebarOpen(false) }
  const handleLogout = async () => { await logout(); navigate('/login') }

  const isExpanded = !collapsed || isMobile
  const sidebarWidth = isMobile ? EXPANDED_W : (collapsed ? COLLAPSED_W : EXPANDED_W)
  const sidebarVisible = isMobile ? sidebarOpen : true

  const showTooltip  = useCallback((label, y) => setTooltip({ label, y }), [])
  const hideTooltip  = useCallback(() => setTooltip(null), [])

  const visibleGroups = NAV_GROUPS
    .map(g => ({
      ...g,
      items: g.items.filter(item => {
        if (!item.roles.includes(user?.role)) return false
        if (item.superAdminOnly && !isSuperAdmin()) return false
        return true
      }),
    }))
    .filter(g => g.items.length > 0)

  return (
    <div style={{ display: 'flex', minHeight: '100dvh', background: 'var(--bg)' }}>
      {showSessions && <SessionsModal onClose={() => setShowSessions(false)} />}
      <DispatchOfferModal />
      {(user?.role === 'rider' || user?.role === 'vendor') && <PWAInstallBanner />}

      {/* Floating tooltip — rendered in body via portal to escape stacking contexts */}
      {tooltip && collapsed && !isMobile && createPortal(
        <Tooltip label={tooltip.label} anchorY={tooltip.y} sidebarWidth={COLLAPSED_W} />,
        document.body
      )}

      {/* Mobile backdrop */}
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 40,
            background: 'rgba(0,0,0,0.55)',
            backdropFilter: 'blur(2px)',
          }}
        />
      )}

      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside style={{
        width: sidebarWidth,
        background: S.bg,
        borderRight: `1px solid ${S.divider}`,
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1), transform 0.25s ease',
        position: isMobile ? 'fixed' : 'sticky',
        top: 0, left: 0,
        height: '100dvh',
        overflowX: 'hidden',
        overflowY: 'hidden',
        zIndex: 50,
        transform: sidebarVisible ? 'translateX(0)' : 'translateX(-100%)',
      }}>

        {/* ── Logo row ─────────────────────────────────────────────────── */}
        <div style={{
          height: 64,
          padding: `0 ${isExpanded ? 18 : 8}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: isExpanded ? 'flex-start' : 'center',
          flexShrink: 0,
          borderBottom: `1px solid ${S.divider}`,
          overflow: 'hidden',
          background: '#fff',
        }}>
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="Logo"
              style={{
                height: isExpanded ? 36 : 30,
                width: isExpanded ? 'auto' : 30,
                maxWidth: isExpanded ? 180 : 30,
                objectFit: 'contain',
                display: 'block',
              }}
            />
          ) : (
            <>
              <div style={{
                width: 34, height: 34,
                background: 'linear-gradient(135deg, #FF5E14, #FF9A5C)',
                borderRadius: 10,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 4px 12px rgba(255,94,20,0.35)',
              }}>
                <img src="/logo.png" alt="S"
                  style={{ height: 22, width: 22, objectFit: 'contain', filter: 'brightness(0) invert(1)' }}
                  onError={e => { e.target.style.display='none' }}
                />
              </div>
              {isExpanded && (
                <div style={{ overflow: 'hidden', marginLeft: 10 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                    SendTrack
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    Logistics Platform
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Nav ──────────────────────────────────────────────────────── */}
        <nav style={{
          flex: 1,
          padding: `12px ${isExpanded ? 10 : 8}px 8px`,
          overflowY: 'auto',
          overflowX: 'hidden',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
          className="hide-scrollbar"
        >
          {visibleGroups.map((group, gi) => (
            <div key={gi} style={{ marginBottom: isExpanded ? 4 : 2 }}>

              {/* Section label */}
              {group.label && isExpanded && (
                <div style={{
                  fontSize: 10, fontWeight: 700,
                  color: S.sectionLabel,
                  textTransform: 'uppercase',
                  letterSpacing: '0.9px',
                  padding: '12px 12px 5px',
                  userSelect: 'none',
                }}>
                  {group.label}
                </div>
              )}

              {/* Divider in collapsed mode */}
              {group.label && !isExpanded && gi > 0 && (
                <div style={{ height: 1, background: S.divider, margin: '8px 6px' }} />
              )}

              {group.items.map(({ to, icon, label }) => (
                <NavItem
                  key={to}
                  to={to}
                  icon={icon}
                  label={label}
                  isExpanded={isExpanded}
                  closeMobile={closeMobile}
                  onTooltip={showTooltip}
                  offTooltip={hideTooltip}
                />
              ))}
            </div>
          ))}
        </nav>

        {/* Vendor push banner */}
        {user?.role === 'vendor' && <VendorPushBanner isExpanded={isExpanded} />}

        {/* ── Footer ───────────────────────────────────────────────────── */}
        <div style={{
          flexShrink: 0,
          borderTop: `1px solid ${S.divider}`,
          padding: isExpanded ? '12px 10px 10px' : '12px 8px 10px',
        }}>
          {/* User row */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: isExpanded ? '8px 10px' : '8px 0',
            justifyContent: isExpanded ? 'flex-start' : 'center',
            borderRadius: 10,
            marginBottom: 6,
            background: isExpanded ? 'rgba(255,255,255,0.04)' : 'transparent',
          }}>
            {/* Avatar */}
            <div style={{
              width: 34, height: 34, borderRadius: 10, flexShrink: 0,
              background: 'linear-gradient(135deg, #FF5E14, #FF9A5C)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 800, fontSize: 14,
              boxShadow: '0 2px 8px rgba(255,94,20,0.3)',
            }}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            {isExpanded && (
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.name}
                </div>
                <div style={{ fontSize: 10, fontWeight: 500, color: 'rgba(255,255,255,0.38)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {ROLE_LABELS[user?.role] ?? user?.role}
                </div>
              </div>
            )}
            {isExpanded && (
              <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                <NotificationBell />
              </div>
            )}
          </div>

          {/* Action buttons */}
          {isExpanded ? (
            <div style={{ display: 'flex', gap: 4 }}>
              <button
                onClick={() => setShowSessions(true)}
                style={{
                  flex: 1, height: 36, borderRadius: 8, cursor: 'pointer',
                  background: 'rgba(255,255,255,0.05)',
                  border: `1px solid ${S.divider}`,
                  color: 'rgba(255,255,255,0.45)', fontSize: 12, fontWeight: 500,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  transition: 'background 0.15s',
                }}
                title="Active sessions"
              >
                <MonitorSmartphone size={14} />
                <span>Sessions</span>
              </button>
              <button
                onClick={handleLogout}
                style={{
                  flex: 1, height: 36, borderRadius: 8, cursor: 'pointer',
                  background: 'rgba(255,255,255,0.05)',
                  border: `1px solid ${S.divider}`,
                  color: 'rgba(255,255,255,0.45)', fontSize: 12, fontWeight: 500,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  transition: 'background 0.15s',
                }}
                title="Log out"
              >
                <LogOut size={14} />
                <span>Log out</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <NotificationBell />
              <button
                onClick={() => setShowSessions(true)}
                style={iconBtnStyle}
                title="Sessions"
              >
                <MonitorSmartphone size={15} color="rgba(255,255,255,0.4)" />
              </button>
              <button
                onClick={handleLogout}
                style={iconBtnStyle}
                title="Log out"
              >
                <LogOut size={15} color="rgba(255,255,255,0.4)" />
              </button>
            </div>
          )}

          {/* Collapse toggle — like Thor's "Collapse Sidebar" */}
          {!isMobile && (
            <button
              onClick={() => setCollapsed(c => !c)}
              style={{
                marginTop: 8,
                width: '100%', height: 36, borderRadius: 8,
                cursor: 'pointer',
                background: 'transparent',
                border: `1px solid ${S.divider}`,
                color: 'rgba(255,255,255,0.3)',
                display: 'flex', alignItems: 'center',
                justifyContent: isExpanded ? 'flex-start' : 'center',
                gap: 8,
                padding: isExpanded ? '0 12px' : '0',
                fontSize: 12, fontWeight: 500,
                transition: 'all 0.15s',
              }}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed
                ? <ChevronRight size={14} />
                : <>
                    <ChevronLeft size={14} />
                    <span>Collapse</span>
                  </>
              }
            </button>
          )}
        </div>
      </aside>

      {/* ── Main content ────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {!isMobile && (
          <DesktopHeader user={user} onLogout={handleLogout} onSessions={() => setShowSessions(true)} />
        )}

        {isMobile && (
          <div style={{
            position: 'sticky', top: 0, zIndex: 30,
            background: 'var(--surface)',
            borderBottom: '1px solid var(--border)',
            padding: '10px 16px',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <button
              onClick={() => setSidebarOpen(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', padding: 6, display: 'flex', borderRadius: 8 }}
            >
              <Menu size={22} />
            </button>

            {/* Back / forward — shown in installed PWA where browser chrome is absent */}
            {isStandalone && (
              <div style={{ display: 'flex', gap: 2 }}>
                <button
                  onClick={() => navigate(-1)}
                  aria-label="Go back"
                  style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: 6, cursor: 'pointer', color: 'var(--text-primary)', display: 'flex' }}
                >
                  <ArrowLeft size={20} />
                </button>
                <button
                  onClick={() => navigate(1)}
                  aria-label="Go forward"
                  style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: 6, cursor: 'pointer', color: 'var(--text-primary)', display: 'flex' }}
                >
                  <ArrowRight size={20} />
                </button>
              </div>
            )}

            {logoUrl
              ? <img src={logoUrl} alt="Logo" style={{ height: 26, width: 'auto', maxWidth: 120, objectFit: 'contain' }} />
              : <img src="/logo.png" alt="SendTrack" style={{ height: 26, width: 'auto', objectFit: 'contain' }} />
            }
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{ROLE_LABELS[user?.role] ?? user?.role}</div>
            </div>
            <NotificationBell />
            <button
              onClick={() => setShowSessions(true)}
              style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}
            >
              <MonitorSmartphone size={16} />
            </button>
            <button
              onClick={handleLogout}
              style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 12px', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <LogOut size={15} /> Logout
            </button>
          </div>
        )}

        <main style={{ flex: 1, padding: isMobile ? '20px 16px' : '24px 32px', overflowY: 'auto', maxWidth: '100%' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

const iconBtnStyle = {
  width: 38, height: 38, borderRadius: 9, cursor: 'pointer',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.07)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  transition: 'background 0.15s',
}

// ─── Desktop top header ────────────────────────────────────────────────────────
function DesktopHeader({ user, onLogout, onSessions }) {
  const searchRef = useRef()
  return (
    <header className="top-header">
      <span style={{
        fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16,
        color: 'var(--text-primary)', letterSpacing: '-0.03em',
      }}>
        SendTrack
      </span>

      <div className="top-header-search" onClick={() => searchRef.current?.focus()}>
        <Search size={14} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
        <input ref={searchRef} placeholder="Search orders, shipments, customers…" />
      </div>

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
        <NotificationBell />

        <button
          onClick={onSessions}
          style={{
            width: 36, height: 36, borderRadius: 10,
            border: '1px solid var(--border)', background: 'var(--surface)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--text-secondary)', transition: 'all 0.12s',
          }}
          title="Sessions"
        >
          <MonitorSmartphone size={16} />
        </button>

        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '4px 10px 4px 4px',
          border: '1px solid var(--border)', borderRadius: 99,
          background: 'var(--surface)', cursor: 'pointer',
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: 'linear-gradient(135deg, #FF5E14, #FF9A5C)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 800, fontSize: 12,
          }}>
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.name?.split(' ')[0]}
          </span>
        </div>
      </div>
    </header>
  )
}
