import { Check, Minus, Eye, Shield } from 'lucide-react'

// ── Permission levels ─────────────────────────────────────────────────────────
const FULL  = 'full'   // Full create/edit/delete
const VIEW  = 'view'   // Read-only
const NONE  = 'none'   // No access
const OWN   = 'own'    // Only own data

// ── Role columns ─────────────────────────────────────────────────────────────
const ROLES = [
  { key: 'admin',           label: 'Admin',           color: '#7C3AED', bg: '#F5F3FF' },
  { key: 'vendor',          label: 'Seller / Vendor',  color: '#EA580C', bg: '#FFF0E8' },
  { key: 'warehouse_staff', label: 'Warehouse Staff',  color: '#0284C7', bg: '#F0F9FF' },
  { key: 'station_agent',   label: 'Station Agent',    color: '#16A34A', bg: '#F0FDF4' },
  { key: 'rider',           label: 'Rider',            color: '#D97706', bg: '#FFFBEB' },
]

// ── Permission matrix ─────────────────────────────────────────────────────────
// Each row: { section, feature, admin, vendor, warehouse_staff, station_agent, rider }
const PERMISSIONS = [
  {
    section: 'Orders',
    rows: [
      { feature: 'View orders',         admin: FULL, vendor: OWN,  warehouse_staff: VIEW, station_agent: NONE, rider: OWN  },
      { feature: 'Create orders',       admin: FULL, vendor: FULL, warehouse_staff: NONE, station_agent: NONE, rider: NONE },
      { feature: 'Cancel orders',       admin: FULL, vendor: OWN,  warehouse_staff: NONE, station_agent: NONE, rider: NONE },
      { feature: 'Force status',        admin: FULL, vendor: NONE, warehouse_staff: NONE, station_agent: NONE, rider: NONE },
      { feature: 'Assign riders',       admin: FULL, vendor: NONE, warehouse_staff: NONE, station_agent: NONE, rider: NONE },
    ],
  },
  {
    section: 'Consolidated Shipments',
    rows: [
      { feature: 'Create shipment',     admin: FULL, vendor: FULL, warehouse_staff: NONE, station_agent: NONE, rider: NONE },
      { feature: 'View shipments',      admin: FULL, vendor: OWN,  warehouse_staff: FULL, station_agent: NONE, rider: NONE },
      { feature: 'Import items (Excel/CSV/Sheets)', admin: FULL, vendor: FULL, warehouse_staff: NONE, station_agent: NONE, rider: NONE },
      { feature: 'Receive items at warehouse', admin: FULL, vendor: NONE, warehouse_staff: FULL, station_agent: NONE, rider: NONE },
      { feature: 'Sort & assign to stations',  admin: FULL, vendor: NONE, warehouse_staff: FULL, station_agent: NONE, rider: NONE },
      { feature: 'Dispatch to stations',       admin: FULL, vendor: NONE, warehouse_staff: FULL, station_agent: NONE, rider: NONE },
    ],
  },
  {
    section: 'Pickup & Checkout',
    rows: [
      { feature: 'View pickup checkout (QR)', admin: FULL, vendor: NONE, warehouse_staff: NONE, station_agent: FULL, rider: NONE },
      { feature: 'Confirm M-Pesa payment',    admin: FULL, vendor: NONE, warehouse_staff: NONE, station_agent: FULL, rider: NONE },
      { feature: 'Confirm cash/card payment', admin: FULL, vendor: NONE, warehouse_staff: NONE, station_agent: FULL, rider: NONE },
    ],
  },
  {
    section: 'Finance & Wallet',
    rows: [
      { feature: 'View seller wallet',        admin: FULL, vendor: OWN,  warehouse_staff: NONE, station_agent: NONE, rider: NONE },
      { feature: 'Request payout',            admin: FULL, vendor: FULL, warehouse_staff: NONE, station_agent: NONE, rider: NONE },
      { feature: 'Process / approve payout',  admin: FULL, vendor: NONE, warehouse_staff: NONE, station_agent: NONE, rider: NONE },
      { feature: 'View invoices',             admin: FULL, vendor: OWN,  warehouse_staff: NONE, station_agent: NONE, rider: NONE },
      { feature: 'View revenue reports',      admin: FULL, vendor: OWN,  warehouse_staff: NONE, station_agent: NONE, rider: NONE },
    ],
  },
  {
    section: 'Riders & Dispatch',
    rows: [
      { feature: 'View riders list',          admin: FULL, vendor: VIEW, warehouse_staff: NONE, station_agent: NONE, rider: NONE },
      { feature: 'Approve rider KYC',         admin: FULL, vendor: NONE, warehouse_staff: NONE, station_agent: NONE, rider: NONE },
      { feature: 'Accept/reject dispatch',    admin: FULL, vendor: NONE, warehouse_staff: NONE, station_agent: NONE, rider: FULL },
      { feature: 'Update location',           admin: NONE, vendor: NONE, warehouse_staff: NONE, station_agent: NONE, rider: FULL },
      { feature: 'Submit delivery proof',     admin: NONE, vendor: NONE, warehouse_staff: NONE, station_agent: NONE, rider: FULL },
    ],
  },
  {
    section: 'Administration',
    rows: [
      { feature: 'Manage users',              admin: FULL, vendor: NONE, warehouse_staff: NONE, station_agent: NONE, rider: NONE },
      { feature: 'Manage vendors',            admin: FULL, vendor: NONE, warehouse_staff: NONE, station_agent: NONE, rider: NONE },
      { feature: 'Manage pickup stations',    admin: FULL, vendor: NONE, warehouse_staff: NONE, station_agent: NONE, rider: NONE },
      { feature: 'Manage hubs & dispatch slots', admin: FULL, vendor: NONE, warehouse_staff: NONE, station_agent: NONE, rider: NONE },
      { feature: 'View audit logs',           admin: FULL, vendor: NONE, warehouse_staff: NONE, station_agent: NONE, rider: NONE },
      { feature: 'System settings',          admin: FULL, vendor: NONE, warehouse_staff: NONE, station_agent: NONE, rider: NONE },
      { feature: 'Contact messages',         admin: FULL, vendor: NONE, warehouse_staff: NONE, station_agent: NONE, rider: NONE },
      { feature: 'Email inbox',              admin: FULL, vendor: NONE, warehouse_staff: NONE, station_agent: NONE, rider: NONE },
    ],
  },
]

// ── Cell renderer ─────────────────────────────────────────────────────────────
function PermCell({ level }) {
  if (level === FULL) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ width: 24, height: 24, borderRadius: '50%', background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Check size={13} style={{ color: '#16A34A' }} strokeWidth={2.5} />
      </span>
    </div>
  )
  if (level === VIEW) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ width: 24, height: 24, borderRadius: '50%', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Eye size={12} style={{ color: '#2563EB' }} />
      </span>
    </div>
  )
  if (level === OWN) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontSize: 10, fontWeight: 600, color: '#EA580C', background: '#FFF0E8', padding: '2px 6px', borderRadius: 99 }}>Own</span>
    </div>
  )
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Minus size={14} style={{ color: 'var(--border-strong)' }} />
    </div>
  )
}

export default function RolePermissionsPage() {
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <Shield size={20} style={{ color: 'var(--primary)' }} />
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Role Permissions</h1>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: 0 }}>
          What each user role can access and do in the system.
        </p>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { icon: <Check size={12} strokeWidth={2.5} />, label: 'Full access',  bg: '#F0FDF4', color: '#16A34A' },
          { icon: <Eye size={11} />,                     label: 'View only',    bg: '#EFF6FF', color: '#2563EB' },
          { icon: <span style={{ fontSize: 10, fontWeight: 700 }}>Own</span>,  label: 'Own data only', bg: '#FFF0E8', color: '#EA580C' },
          { icon: <Minus size={12} />,                   label: 'No access',    bg: 'var(--surface-muted)', color: 'var(--text-tertiary)' },
        ].map(({ icon, label, bg, color }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
            <span style={{ width: 22, height: 22, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>
              {icon}
            </span>
            <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Permissions matrix */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
            <thead>
              <tr style={{ background: 'var(--surface-muted)', borderBottom: '2px solid var(--border)' }}>
                <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', width: '30%', minWidth: 200 }}>
                  Feature / Permission
                </th>
                {ROLES.map(r => (
                  <th key={r.key} style={{ padding: '12px 16px', textAlign: 'center', minWidth: 110 }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 99, background: r.bg, color: r.color, fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>
                      {r.label}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERMISSIONS.map(({ section, rows }) => (
                <>
                  {/* Section header row */}
                  <tr key={`section-${section}`} style={{ background: 'var(--bg)' }}>
                    <td colSpan={ROLES.length + 1} style={{ padding: '10px 20px', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.6px', borderBottom: '1px solid var(--border)' }}>
                      {section}
                    </td>
                  </tr>
                  {/* Feature rows */}
                  {rows.map((row, ri) => (
                    <tr
                      key={`${section}-${ri}`}
                      style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.1s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-muted)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '11px 20px', fontSize: 13.5, color: 'var(--text-primary)', fontWeight: 400 }}>
                        {row.feature}
                      </td>
                      {ROLES.map(r => (
                        <td key={r.key} style={{ padding: '11px 16px', textAlign: 'center' }}>
                          <PermCell level={row[r.key]} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p style={{ marginTop: 16, fontSize: 13, color: 'var(--text-tertiary)' }}>
        Assign roles to users in the <a href="/users" style={{ color: 'var(--primary)' }}>Users</a> page. Role changes take effect immediately on next login.
      </p>
    </div>
  )
}
