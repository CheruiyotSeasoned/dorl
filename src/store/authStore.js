import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../lib/api'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,

      login: async (email, password) => {
        const res = await api.post('/auth/login', { email, password })
        const { token, user } = res.data.data
        localStorage.setItem('dorl_token', token)
        set({ token, user })
        return user
      },

      logout: async () => {
        try { await api.post('/auth/logout') } catch {}
        localStorage.removeItem('dorl_token')
        set({ user: null, token: null })
      },

      fetchMe: async () => {
        const res = await api.get('/auth/me')
        set({ user: res.data.data })
      },

      isAdmin:      () => get().user?.role === 'admin',
      isVendor:     () => get().user?.role === 'vendor',
      isRider:      () => get().user?.role === 'rider',
      isSuperAdmin: () => get().user?.role === 'admin' && get().user?.is_super_admin === true,
      vendorId:     () => get().user?.vendor_id ?? null,
    }),
    { name: 'dorl_auth', partialize: (s) => ({ token: s.token, user: s.user }) }
  )
)
