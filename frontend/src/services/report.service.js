import api from './api'

export const reportService = {
  dashboard: () => api.get('/reports/dashboard'),
  monthlyRevenue: (year) => api.get('/reports/monthly-revenue', { params: { year } }),
  topProducts: (params) => api.get('/reports/top-products', { params }),
  inventory: () => api.get('/reports/inventory'),
  endOfDay: (date) => api.get('/reports/end-of-day', { params: { date } }),
  customers: (params) => api.get('/reports/customers', { params }),
}

export default reportService