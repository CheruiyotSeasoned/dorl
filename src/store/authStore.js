import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import api from '../lib/api'

// Safe storage — falls back to in-memory if localStorage is blocked (iOS private browsing)
function safeLocalStorage() {
  try {
    localStorage.setItem('__test__', '1')
    localStorage.removeItem('__test__')
    return createJSONStorage(() => localStorage)
  } catch {
    const mem = {}
    return createJSONStorage(() => ({
      getItem: (k) => mem[k] ?? null,
      setItem: (k, v) => { mem[k] = v },
      removeItem: (k) => { delete mem[k] },
    }))
  }
}

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,

      login: async (email, password) => {
        const res = await api.post('/auth/login', { email, password })
        const { token, user } = res.data.data
        try { localStorage.setItem('sendtrack_token', token) } catch {}
        set({ token, user })
        return user
      },

      refreshUser: async () => {
        const res = await api.get('/auth/me')
        set({ user: res.data.data })
        return res.data.data
      },

      logout: async () => {
        try { await api.post('/auth/logout') } catch {}
        try { localStorage.removeItem('sendtrack_token') } catch {}
        set({ user: null, token: null })
      },

      fetchMe: async () => {
        const res = await api.get('/auth/me')
        set({ user: res.data.data })
      },

      isAdmin:          () => get().user?.role === 'admin',
      isVendor:         () => get().user?.role === 'vendor',
      isRider:          () => get().user?.role === 'rider',
      isStationAgent:   () => get().user?.role === 'station_agent',
      isWarehouseStaff: () => get().user?.role === 'warehouse_staff',
      isSuperAdmin:     () => get().user?.role === 'admin' && get().user?.is_super_admin === true,
      vendorId:         () => get().user?.vendor_id ?? null,
      pickupStationId:  () => get().user?.pickup_station_id ?? null,

      // Returns true when the user still needs to complete onboarding
      needsOnboarding: () => {
        const user = get().user
        if (!user) return false
        if (user.role === 'admin') return false
        if (user.role === 'rider') {
          const kyc = user.rider_profile?.kyc_status
          return !kyc || kyc === 'pending'
        }
        if (user.role === 'vendor') {
          const kyc = user.vendor_kyc?.kyc_status
          return !kyc || kyc === 'pending'
        }
        return false
      },

      // Returns true when submitted but waiting for admin review
      onboardingPending: () => {
        const user = get().user
        if (!user) return false
        if (user.role === 'rider')  return user.rider_profile?.kyc_status === 'submitted'
        if (user.role === 'vendor') return user.vendor_kyc?.kyc_status === 'submitted'
        return false
      },

      onboardingRejected: () => {
        const user = get().user
        if (!user) return false
        if (user.role === 'rider')  return user.rider_profile?.kyc_status === 'rejected'
        if (user.role === 'vendor') return user.vendor_kyc?.kyc_status === 'rejected'
        return false
      },
    }),
    { name: 'sendtrack_auth', storage: safeLocalStorage(), partialize: (s) => ({ token: s.token, user: s.user }) }
  )
)
