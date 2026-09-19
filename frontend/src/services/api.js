import axios from 'axios'

const STORAGE_KEYS = {
  token: 'accessToken',
  refresh: 'refreshToken',
  user: 'user',
}

const api = axios.create({
  baseURL: '/api/v1',
  timeout: 15000,
})

let refreshPromise = null

const isAuthEndpoint = (url) =>
  !!url && (url.includes('/auth/login') || url.includes('/auth/refresh'))

const clearSession = () => {
  localStorage.removeItem(STORAGE_KEYS.token)
  localStorage.removeItem(STORAGE_KEYS.refresh)
  localStorage.removeItem(STORAGE_KEYS.user)
  if (!window.location.pathname.includes('/login')) {
    window.location.href = '/login'
  }
}

const refreshSession = async () => {
  const refreshToken = localStorage.getItem(STORAGE_KEYS.refresh)
  if (!refreshToken) throw new Error('Không có refresh token')
  const { data } = await axios.post('/api/v1/auth/refresh', { refreshToken })
  const newAccessToken = data?.data?.accessToken
  if (!newAccessToken) throw new Error('Refresh token không hợp lệ')
  localStorage.setItem(STORAGE_KEYS.token, newAccessToken)
  return newAccessToken
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(STORAGE_KEYS.token)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const status = error.response?.status
    const url = error.config?.url || ''
    const config = error.config

    if (status === 401 && !isAuthEndpoint(url) && config && !config._retried) {
      config._retried = true
      try {
        if (!refreshPromise) {
          refreshPromise = refreshSession().finally(() => {
            refreshPromise = null
          })
        }
        const newAccessToken = await refreshPromise
        config.headers.Authorization = `Bearer ${newAccessToken}`
        return api(config)
      } catch {
        clearSession()
      }
    } else if (status === 401 && url.includes('/auth/refresh')) {
      clearSession()
    }

    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      'Đã có lỗi xảy ra, vui lòng thử lại'
    return Promise.reject(new Error(message))
  }
)

export default api