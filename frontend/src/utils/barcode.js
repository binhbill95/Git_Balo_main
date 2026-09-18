import JsBarcode from 'jsbarcode'

const computeCheckDigit = (digits) => {
  const s = String(digits).replace(/\D/g, '')
  if (s.length !== 12) return null
  let sum = 0
  for (let i = 0; i < 12; i++) {
    const d = Number(s[i])
    sum += i % 2 === 0 ? d : d * 3
  }
  return s + String((10 - (sum % 10)) % 10)
}

export const isValidEan13 = (value) => {
  const s = String(value ?? '').replace(/\D/g, '')
  if (s.length !== 13) return false
  return computeCheckDigit(s.slice(0, 12)) === s
}

export const makeEan13 = (base12) => computeCheckDigit(base12)

export const ean13FromId = (id) => {
  const base12 = String(Number(id) + 890000000000)
  return computeCheckDigit(base12.slice(0, 12))
}

export const generateEan13 = (id) =>
  id != null ? ean13FromId(id) : computeCheckDigit(String(Date.now()).slice(-12))

export const detectBarcodeFormat = (value) => (/^\d{13}$/.test(value) ? 'EAN13' : 'CODE128')

const SUPPORTED_TAGS = ['CANVAS', 'SVG', 'IMG']

export const renderBarcode = (el, value, options = {}) => {
  if (!el || value === undefined || value === null || value === '') return

  let target = el
  if (!SUPPORTED_TAGS.includes(el.tagName?.toUpperCase())) {
    el.innerHTML = ''
    target = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    el.appendChild(target)
  } else {
    el.innerHTML = ''
  }

  JsBarcode(target, String(value), {
    format: detectBarcodeFormat(value),
    width: 1.5,
    height: 40,
    displayValue: true,
    fontSize: 11,
    margin: 0,
    ...options,
  })
}