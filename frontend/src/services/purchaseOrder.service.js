import api from './api'

export const purchaseOrderService = {
  list: (params) => api.get('/purchase-orders', { params }),
  getById: (id) => api.get(`/purchase-orders/${id}`),
  create: (data) => api.post('/purchase-orders', data),
  updateStatus: (id, status) => api.patch(`/purchase-orders/${id}/status`, { status }),
}

export default purchaseOrderService