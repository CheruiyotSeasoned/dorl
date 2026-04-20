import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './store/authStore'

import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
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
import LandingEditorPage from './pages/LandingEditorPage'
import ContactMessagesPage from './pages/ContactMessagesPage'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
})

function Guard({ children, roles }) {
  const { user } = useAuthStore()
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />
  return children
}

// Send riders to their own dashboard by default
function DefaultDashboard() {
  const { user } = useAuthStore()
  if (user?.role === 'rider') return <RiderDashboardPage />
  return <DashboardPage />
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

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

            {/* Admin only */}
            <Route path="vendors"        element={<Guard roles={['admin']}><VendorsPage /></Guard>} />
            <Route path="users"          element={<Guard roles={['admin']}><UsersPage /></Guard>} />
            <Route path="email"          element={<Guard roles={['admin']}><EmailInboxPage /></Guard>} />
            <Route path="settings"       element={<Guard roles={['admin']}><SettingsPage /></Guard>} />
            <Route path="audit-log"      element={<Guard roles={['admin']}><AuditLogPage /></Guard>} />
            <Route path="landing-editor"      element={<Guard roles={['admin']}><LandingEditorPage /></Guard>} />
            <Route path="contact-messages"   element={<Guard roles={['admin']}><ContactMessagesPage /></Guard>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
