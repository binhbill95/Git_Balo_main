import api from './api'

export const authService = {
  login: (payload) => api.post('/auth/login', payload),
  refresh: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
  changePassword: (payload) => api.post('/auth/change-password', payload),
}

export default authService