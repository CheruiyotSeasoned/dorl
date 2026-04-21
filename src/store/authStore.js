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
        try { localStorage.setItem('dorl_token', token) } catch {}
        set({ token, user })
        return user
      },

      logout: async () => {
        try { await api.post('/auth/logout') } catch {}
        try { localStorage.removeItem('dorl_token') } catch {}
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
    { name: 'dorl_auth', storage: safeLocalStorage(), partialize: (s) => ({ token: s.token, user: s.user }) }
  )
)
