import api from './api'

export const deliveryPartnerService = {
  list: (params) => api.get('/delivery-partners', { params }),
  listAll: (params) => api.get('/delivery-partners/all', { params }),
  getById: (id) => api.get(`/delivery-partners/${id}`),
  create: (data) => api.post('/delivery-partners', data),
  update: (id, data) => api.put(`/delivery-partners/${id}`, data),
  remove: (id) => api.delete(`/delivery-partners/${id}`),
}

export default deliveryPartnerService