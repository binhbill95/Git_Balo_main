import api from './api'

export const categoryService = {
  list: (params) => api.get('/categories', { params }),
  all: () => api.get('/categories/all'),
  getById: (id) => api.get(`/categories/${id}`),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  remove: (id) => api.delete(`/categories/${id}`),
}

export default categoryService