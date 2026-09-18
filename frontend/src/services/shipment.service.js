import api from './api'

export const shipmentService = {
  list: (params) => api.get('/shipments', { params }),
  getById: (id) => api.get(`/shipments/${id}`),
  create: (data) => api.post('/shipments', data),
  update: (id, data) => api.put(`/shipments/${id}`, data),
  updateStatus: (id, status) => api.patch(`/shipments/${id}/status`, { status }),
}

export default shipmentService