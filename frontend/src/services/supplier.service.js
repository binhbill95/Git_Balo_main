import api from './api'

export const supplierService = {
  list: (params) => api.get('/suppliers', { params }),
  all: () => api.get('/suppliers/all'),
  getById: (id) => api.get(`/suppliers/${id}`),
  create: (data) => api.post('/suppliers', data),
  update: (id, data) => api.put(`/suppliers/${id}`, data),
  remove: (id) => api.delete(`/suppliers/${id}`),
}

export default supplierService