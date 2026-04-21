import axios from 'axios'

const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL ?? 'http://localhost:8000') + '/api',
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
})

const safeGet = (k) => { try { return localStorage.getItem(k) } catch { return null } }
const safeRemove = (k) => { try { localStorage.removeItem(k) } catch {} }

api.interceptors.request.use((config) => {
  const token = safeGet('dorl_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      safeRemove('dorl_token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
