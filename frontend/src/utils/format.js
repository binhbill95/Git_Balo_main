export const formatCurrency = (value) =>
  Number(value || 0).toLocaleString('vi-VN') + ' đ'

export const formatDate = (value) => {
  if (!value) return ''
  return new Date(value).toLocaleDateString('vi-VN')
}

export const formatDateTime = (value) => {
  if (!value) return ''
  const d = new Date(value)
  return `${d.toLocaleDateString('vi-VN')} ${d.toLocaleTimeString('vi-VN')}`
}