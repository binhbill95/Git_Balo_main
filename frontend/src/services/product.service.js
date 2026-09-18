import api from './api'

export const productService = {
  list: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  getByBarcode: (code) => api.get(`/products/by-barcode/${encodeURIComponent(code)}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  remove: (id) => api.delete(`/products/${id}`),
  adjustStock: (id, data) => api.patch(`/products/${id}/stock`, data),
  stockLogs: (params) => api.get('/products/stock-logs', { params }),
  importMany: (items) => api.post('/products/import', { items }),
  uploadImage: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/uploads', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}

export default productService