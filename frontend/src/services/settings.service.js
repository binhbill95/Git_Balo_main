import api from './api'

export const settingsService = {
  getPublic: () => api.get('/settings/public'),
  update: (settings) => api.put('/settings', { settings }),
}

export default settingsService