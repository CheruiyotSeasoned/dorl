import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './store/authStore'

import LandingPage from './pages/LandingPage'
import BookParcelPage from './pages/BookParcelPage'
import BlogPage from './pages/BlogPage'
import BlogPostPage from './pages/BlogPostPage'
import PrivacyPage from './pages/PrivacyPage'
import TermsPage from './pages/TermsPage'
import CareersPage from './pages/CareersPage'
import SolutionsPage from './pages/SolutionsPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import VerifyEmailPage from './pages/VerifyEmailPage'
import DashboardLayout from './layouts/DashboardLayout'
import DashboardPage from './pages/DashboardPage'
import RiderDashboardPage from './pages/RiderDashboardPage'
import RiderDeliveriesPage from './pages/RiderDeliveriesPage'
import OrdersPage from './pages/OrdersPage'
import OrderDetailPage from './pages/OrderDetailPage'
import NewOrderPage from './pages/NewOrderPage'
import RidersPage from './pages/RidersPage'
import UsersPage from './pages/UsersPage'
import VendorsPage from './pages/VendorsPage'
import InvoicesPage from './pages/InvoicesPage'
import ReportsPage from './pages/ReportsPage'
import SettingsPage from './pages/SettingsPage'
import AuditLogPage from './pages/AuditLogPage'
import EmailInboxPage from './pages/EmailInboxPage'
import TrackingPage from './pages/TrackingPage'
import PublicTrackPage from './pages/PublicTrackPage'
import LandingEditorPage from './pages/LandingEditorPage'
import BlogAdminPage from './pages/BlogAdminPage'
import ContactMessagesPage from './pages/ContactMessagesPage'
import RiderOnboarding from './pages/onboarding/RiderOnboarding'
import VendorOnboarding from './pages/onboarding/VendorOnboarding'
import HubsPage from './pages/HubsPage'
import DispatchSlotsPage from './pages/DispatchSlotsPage'
import PickupStationsPage from './pages/PickupStationsPage'
import ConsolidatedShipmentsPage from './pages/ConsolidatedShipmentsPage'
import CreateShipmentPage from './pages/CreateShipmentPage'
import ShipmentDetailPage from './pages/ShipmentDetailPage'
import StationDashboardPage from './pages/StationDashboardPage'
import PickupCheckoutPage from './pages/PickupCheckoutPage'
import SellerWalletPage from './pages/SellerWalletPage'
import WarehouseDashboardPage from './pages/WarehouseDashboardPage'
import RolePermissionsPage from './pages/RolePermissionsPage'
import SystemHealthPage from './pages/SystemHealthPage'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
})

function Guard({ children, roles }) {
  const { user, needsOnboarding, onboardingPending } = useAuthStore()
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />

  // station_agent and warehouse_staff bypass onboarding
  const bypassOnboarding = ['admin', 'station_agent', 'warehouse_staff'].includes(user.role)
  if (!bypassOnboarding && (needsOnboarding() || onboardingPending())) {
    return <Navigate to="/onboarding" replace />
  }

  return children
}

// Redirect already-onboarded users away from the onboarding page
function OnboardingGuard({ children }) {
  const { user, needsOnboarding, onboardingPending, onboardingRejected } = useAuthStore()
  if (!user) return <Navigate to="/login" replace />
  // Approved users go straight to dashboard
  if (user.role === 'admin') return <Navigate to="/dashboard" replace />
  if (!needsOnboarding() && !onboardingPending() && !onboardingRejected()) {
    return <Navigate to="/dashboard" replace />
  }
  return children
}

function DefaultDashboard() {
  const { user } = useAuthStore()
  if (user?.role === 'rider')           return <RiderDashboardPage />
  if (user?.role === 'station_agent')   return <StationDashboardPage />
  if (user?.role === 'warehouse_staff') return <WarehouseDashboardPage />
  return <DashboardPage />
}

function OnboardingRouter() {
  const { user } = useAuthStore()
  if (user?.role === 'rider')  return <RiderOnboarding />
  if (user?.role === 'vendor') return <VendorOnboarding />
  return <Navigate to="/dashboard" replace />
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/book" element={<BookParcelPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:slug" element={<BlogPostPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/careers" element={<CareersPage />} />
          <Route path="/track" element={<PublicTrackPage />} />
          {/* Public pickup checkout — QR scan target (auth handled inside) */}
          <Route path="/pickup/checkout/:qrToken" element={<PickupCheckoutPage />} />
          <Route path="/solutions" element={<SolutionsPage />} />
          <Route path="/solutions/:slug" element={<SolutionsPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />

          {/* Onboarding — only accessible while KYC is incomplete */}
          <Route path="/onboarding" element={<OnboardingGuard><OnboardingRouter /></OnboardingGuard>} />

          <Route path="/" element={<Guard><DashboardLayout /></Guard>}>
            <Route path="dashboard" element={<DefaultDashboard />} />

            {/* Rider-specific */}
            <Route path="rider/deliveries" element={<Guard roles={['rider']}><RiderDeliveriesPage /></Guard>} />

            {/* Shared order routes */}
            <Route path="orders" element={<OrdersPage />} />
            <Route path="orders/new" element={<Guard roles={['vendor','admin']}><NewOrderPage /></Guard>} />
            <Route path="orders/:id" element={<OrderDetailPage />} />
            <Route path="orders/:id/tracking" element={<TrackingPage />} />

            {/* Admin + vendor */}
            <Route path="riders"    element={<Guard roles={['admin','vendor']}><RidersPage /></Guard>} />
            <Route path="invoices"  element={<Guard roles={['admin','vendor']}><InvoicesPage /></Guard>} />
            <Route path="reports"   element={<Guard roles={['admin','vendor']}><ReportsPage /></Guard>} />

            {/* Vendor + Admin: Consolidated Shipments */}
            <Route path="shipments"        element={<Guard roles={['vendor','admin']}><ConsolidatedShipmentsPage /></Guard>} />
            <Route path="shipments/new"    element={<Guard roles={['vendor','admin']}><CreateShipmentPage /></Guard>} />
            <Route path="shipments/:id"    element={<Guard roles={['vendor','admin']}><ShipmentDetailPage /></Guard>} />

            {/* Vendor + Admin: Wallet */}
            <Route path="wallet"           element={<Guard roles={['vendor','admin']}><SellerWalletPage /></Guard>} />

            {/* Station agent */}
            <Route path="station"          element={<Guard roles={['station_agent','admin']}><StationDashboardPage /></Guard>} />

            {/* Warehouse staff */}
            <Route path="warehouse"        element={<Guard roles={['warehouse_staff','admin']}><WarehouseDashboardPage /></Guard>} />

            {/* Admin: role permissions map */}
            <Route path="role-permissions" element={<Guard roles={['admin']}><RolePermissionsPage /></Guard>} />

            {/* Admin only */}
            <Route path="vendors"          element={<Guard roles={['admin']}><VendorsPage /></Guard>} />
            <Route path="hubs"             element={<Guard roles={['admin']}><HubsPage /></Guard>} />
            <Route path="pickup-stations"  element={<Guard roles={['admin']}><PickupStationsPage /></Guard>} />
            <Route path="dispatch-slots"   element={<Guard roles={['admin']}><DispatchSlotsPage /></Guard>} />
            <Route path="users"            element={<Guard roles={['admin']}><UsersPage /></Guard>} />
            <Route path="email"            element={<Guard roles={['admin']}><EmailInboxPage /></Guard>} />
            <Route path="settings"         element={<Guard roles={['admin']}><SettingsPage /></Guard>} />
            <Route path="audit-log"        element={<Guard roles={['admin']}><AuditLogPage /></Guard>} />
            <Route path="landing-editor"   element={<Guard roles={['admin']}><LandingEditorPage /></Guard>} />
            <Route path="posts"            element={<Guard roles={['admin']}><BlogAdminPage /></Guard>} />
            <Route path="contact-messages" element={<Guard roles={['admin']}><ContactMessagesPage /></Guard>} />
            <Route path="system-health"    element={<Guard roles={['admin']}><SystemHealthPage /></Guard>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
