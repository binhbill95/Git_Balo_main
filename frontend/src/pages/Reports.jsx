import { useEffect, useState, useCallback } from 'react'
import dayjs from 'dayjs'
import {
  Card,
  Col,
  Row,
  Typography,
  Select,
  Table,
  Spin,
  Empty,
  Statistic,
  DatePicker,
  Tag,
  Button,
  Space,
  message,
  Tabs,
} from 'antd'
import {
  DollarOutlined,
  ShoppingCartOutlined,
  PrinterOutlined,
  FileExcelOutlined,
  DatabaseOutlined,
  TeamOutlined,
  RiseOutlined,
  CustomerServiceOutlined,
} from '@ant-design/icons'
import { Column } from '@ant-design/plots'
import * as XLSX from 'xlsx'
import reportService from '../services/report.service'
import { formatCurrency, formatDate, formatDateTime } from '../utils/format'

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = [CURRENT_YEAR - 2, CURRENT_YEAR - 1, CURRENT_YEAR]

const PAYMENT_LABEL = { CASH: 'Tiền mặt', TRANSFER: 'Chuyển khoản', CARD: 'Thẻ' }
const STATUS_LABEL = {
  PENDING: 'Chờ xử lý',
  CONFIRMED: 'Đã xác nhận',
  SHIPPING: 'Đang giao',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
}
const STATUS_COLOR = {
  PENDING: 'default',
  CONFIRMED: 'blue',
  SHIPPING: 'geekblue',
  COMPLETED: 'green',
  CANCELLED: 'red',
}

const escapeHtml = (str = '') =>
  String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const printReport = ({ title, subtitle, summary = [], sections = [] }) => {
  const printWin = window.open('', '_blank', 'width=900,height=650')
  if (!printWin) {
    message.warning('Trình duyệt đã chặn cửa sổ in. Vui lòng cho phép pop-up.')
    return
  }

  const sumHtml = summary
    .map((s) => `<div><div class="label">${s.label}</div><div class="value">${s.value}</div></div>`)
    .join('')

  const secHtml = sections
    .map((sec) => {
      const head = (sec.cols || []).map((c) => `<th class="${c.a || 'l'}">${escapeHtml(c.label)}</th>`).join('')
      const body = (sec.rows || [])
        .map((r) => `<tr>${r.map((c) => `<td class="${c.a || 'l'}">${escapeHtml(c.t)}</td>`).join('')}</tr>`)
        .join('')
      return `<h2>${sec.title}</h2><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`
    })
    .join('')

  printWin.document.write(`<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8" />
<title>${title}</title>
<style>
  body { font-family: 'Segoe UI', Tahoma, sans-serif; color: #333; margin: 24px; }
  .header { text-align: center; border-bottom: 2px solid #1677ff; padding-bottom: 12px; margin-bottom: 16px; }
  .header h1 { margin: 0; font-size: 22px; color: #0f2b5b; }
  .header p { margin: 4px 0 0; color: #666; font-size: 13px; }
  .summary { display: flex; gap: 16px; margin-bottom: 20px; flex-wrap: wrap; }
  .summary div { flex: 1; min-width: 150px; border: 1px solid #eee; border-radius: 6px; padding: 12px 16px; background: #fafafa; }
  .summary .label { font-size: 12px; color: #888; }
  .summary .value { font-size: 20px; font-weight: 700; color: #0f2b5b; }
  table { width: 100%; border-collapse: collapse; margin-top: 6px; }
  h2 { font-size: 15px; color: #0f2b5b; margin: 20px 0 4px; }
  th, td { border: 1px solid #ddd; padding: 7px 10px; font-size: 13px; }
  th { background: #f0f6ff; }
  .l { text-align: left; } .c { text-align: center; } .r { text-align: right; }
  .footer { margin-top: 24px; text-align: right; font-size: 12px; color: #999; }
</style>
</head>
<body>
  <div class="header">
    <h1>${title}</h1>
    <p>${subtitle} · Xuất lúc ${new Date().toLocaleString('vi-VN')}</p>
  </div>
  <div class="summary">${sumHtml}</div>
  ${secHtml}
  <div class="footer">Hệ thống quản lý &amp; bán hàng Balo - Túi xách — Bản in tự động</div>
</body>
</html>`)
  printWin.document.close()
  printWin.focus()
  setTimeout(() => printWin.print(), 200)
}

export default function Reports() {
  const [tab, setTab] = useState('sales')

  // Bán hàng
  const [year, setYear] = useState(CURRENT_YEAR)
  const [months, setMonths] = useState([])
  const [topProducts, setTopProducts] = useState([])
  const [salesLoading, setSalesLoading] = useState(false)
  const [salesRange, setSalesRange] = useState({ from: undefined, to: undefined })

  // Cuối ngày
  const [eodDate, setEodDate] = useState(dayjs())
  const [eodData, setEodData] = useState(null)
  const [eodLoading, setEodLoading] = useState(false)

  // Hàng tồn kho
  const [inventory, setInventory] = useState(null)
  const [invLoading, setInvLoading] = useState(false)

  // Khách hàng
  const [custRange, setCustRange] = useState({ from: undefined, to: undefined })
  const [custData, setCustData] = useState(null)
  const [custLoading, setCustLoading] = useState(false)

  const loadSales = useCallback(async () => {
    setSalesLoading(true)
    try {
      const [m, t] = await Promise.all([
        reportService.monthlyRevenue(year),
        reportService.topProducts({ limit: 10, from: salesRange.from, to: salesRange.to }),
      ])
      setMonths(m.data)
      setTopProducts(t.data)
    } catch (err) {
      message.error(err.message)
    } finally {
      setSalesLoading(false)
    }
  }, [year, salesRange])

  const loadEod = useCallback(async () => {
    setEodLoading(true)
    try {
      const d = await reportService.endOfDay(eodDate.format('YYYY-MM-DD'))
      setEodData(d.data)
    } catch (err) {
      message.error(err.message)
    } finally {
      setEodLoading(false)
    }
  }, [eodDate])

  const loadInventory = useCallback(async () => {
    setInvLoading(true)
    try {
      const d = await reportService.inventory()
      setInventory(d.data)
    } catch (err) {
      message.error(err.message)
    } finally {
      setInvLoading(false)
    }
  }, [])

  const loadCustomers = useCallback(async () => {
    setCustLoading(true)
    try {
      const d = await reportService.customers({ from: custRange.from, to: custRange.to })
      setCustData(d.data)
    } catch (err) {
      message.error(err.message)
    } finally {
      setCustLoading(false)
    }
  }, [custRange])

  useEffect(() => {
    loadSales()
  }, [loadSales])

  useEffect(() => {
    if (tab === 'endOfDay') loadEod()
  }, [tab, loadEod])

  useEffect(() => {
    if (tab === 'inventory') loadInventory()
  }, [tab, loadInventory])

  useEffect(() => {
    if (tab === 'customers') loadCustomers()
  }, [tab, loadCustomers])

  const totalRevenue = months.reduce((s, m) => s + Number(m.revenue), 0)
  const totalOrders = months.reduce((s, m) => s + Number(m.orders || 0), 0)
  const chartData = months.map((m) => ({ month: `Tháng ${m.month}`, value: Number(m.revenue) }))

  // ===== In / Xuất: Bán hàng =====
  const handlePrintSales = () => {
    printReport({
      title: 'BÁO CÁO BÁN HÀNG — BALO & TÚI XÁCH',
      subtitle: `Năm ${year}`,
      summary: [
        { label: `Tổng doanh thu năm ${year}`, value: formatCurrency(totalRevenue) },
        { label: 'Tổng đơn hàng (không gồm hủy)', value: String(totalOrders) },
      ],
      sections: [
        {
          title: `1. Doanh thu theo tháng — ${year}`,
          cols: [
            { label: 'Tháng', a: 'c' },
            { label: 'Doanh thu', a: 'r' },
            { label: 'Số đơn', a: 'c' },
          ],
          rows: months.map((m) => [
            { t: `Tháng ${m.month}`, a: 'c' },
            { t: formatCurrency(m.revenue), a: 'r' },
            { t: String(m.orders || 0), a: 'c' },
          ]),
        },
        {
          title: '2. Top sản phẩm bán chạy',
          cols: [
            { label: 'Hạng', a: 'c' },
            { label: 'Sản phẩm' },
            { label: 'Danh mục' },
            { label: 'SKU' },
            { label: 'Đã bán', a: 'c' },
            { label: 'Doanh thu', a: 'r' },
          ],
          rows: topProducts.map((p, i) => [
            { t: String(i + 1), a: 'c' },
            { t: p.name },
            { t: p.category || '' },
            { t: p.sku || '' },
            { t: String(p.totalSold), a: 'c' },
            { t: formatCurrency(p.revenue), a: 'r' },
          ]),
        },
      ],
    })
  }

  const handleExportSales = () => {
    const wb = XLSX.utils.book_new()

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet([
        { 'Chỉ tiêu': `Tổng doanh thu năm ${year}`, 'Giá trị': totalRevenue },
        { 'Chỉ tiêu': 'Tổng đơn hàng (không gồm hủy)', 'Giá trị': totalOrders },
      ]),
      'Tổng quan'
    )

    const wsMonthly = XLSX.utils.json_to_sheet(
      months.map((m) => ({
        'Tháng': m.month,
        'Doanh thu (đ)': Number(m.revenue),
        'Số đơn hàng': m.orders,
      })),
      { header: ['Tháng', 'Doanh thu (đ)', 'Số đơn hàng'] }
    )
    wsMonthly['!cols'] = [{ wch: 10 }, { wch: 18 }, { wch: 14 }]
    XLSX.utils.book_append_sheet(wb, wsMonthly, `Doanh thu ${year}`)

    const wsTop = XLSX.utils.json_to_sheet(
      topProducts.map((p, i) => ({
        'Hạng': i + 1,
        'Sản phẩm': p.name,
        'Danh mục': p.category || '',
        'SKU': p.sku || '',
        'Đã bán': p.totalSold,
        'Doanh thu (đ)': Number(p.revenue),
      })),
      { header: ['Hạng', 'Sản phẩm', 'Danh mục', 'SKU', 'Đã bán', 'Doanh thu (đ)'] }
    )
    wsTop['!cols'] = [{ wch: 6 }, { wch: 34 }, { wch: 20 }, { wch: 14 }, { wch: 10 }, { wch: 18 }]
    XLSX.utils.book_append_sheet(wb, wsTop, 'Top sản phẩm')

    XLSX.writeFile(wb, `bao-cao-ban-hang-${year}.xlsx`)
    message.success('Xuất Excel thành công')
  }

  // ===== In / Xuất: Cuối ngày =====
  const handlePrintEod = () => {
    if (!eodData) return
    printReport({
      title: 'BÁO CÁO CUỐI NGÀY — BALO & TÚI XÁCH',
      subtitle: `Ngày ${eodDate.format('DD/MM/YYYY')}`,
      summary: [
        { label: 'Tổng doanh thu', value: formatCurrency(eodData.totalRevenue) },
        { label: 'Số đơn hàng', value: String(eodData.totalOrders) },
        { label: 'Số lượng bán', value: String(eodData.totalQuantitySold) },
        { label: 'Trung bình / đơn', value: formatCurrency(eodData.avgOrderValue) },
      ],
      sections: [
        {
          title: '1. Phương thức thanh toán',
          cols: [
            { label: 'Phương thức' },
            { label: 'Số đơn', a: 'c' },
            { label: 'Doanh thu', a: 'r' },
          ],
          rows: (eodData.byPaymentMethod || []).map((p) => [
            { t: PAYMENT_LABEL[p.method] || p.method },
            { t: String(p.count), a: 'c' },
            { t: formatCurrency(p.total), a: 'r' },
          ]),
        },
        {
          title: '2. Danh sách đơn hàng',
          cols: [
            { label: 'Mã đơn' },
            { label: 'Giờ', a: 'c' },
            { label: 'Khách hàng' },
            { label: 'Phương thức', a: 'c' },
            { label: 'Trạng thái', a: 'c' },
            { label: 'Tổng tiền', a: 'r' },
          ],
          rows: (eodData.orders || []).map((o) => [
            { t: o.orderCode },
            { t: new Date(o.createdAt).toLocaleTimeString('vi-VN'), a: 'c' },
            { t: o.customerName },
            { t: PAYMENT_LABEL[o.paymentMethod] || o.paymentMethod, a: 'c' },
            { t: STATUS_LABEL[o.status] || o.status, a: 'c' },
            { t: formatCurrency(o.totalAmount), a: 'r' },
          ]),
        },
      ],
    })
  }

  const handleExportEod = () => {
    if (!eodData) return
    const wb = XLSX.utils.book_new()

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet([
        { 'Chỉ tiêu': `Doanh thu ngày ${eodDate.format('DD/MM/YYYY')}`, 'Giá trị': eodData.totalRevenue },
        { 'Chỉ tiêu': 'Tổng số đơn (không gồm hủy)', 'Giá trị': eodData.totalOrders },
        { 'Chỉ tiêu': 'Số lượng bán ra', 'Giá trị': eodData.totalQuantitySold },
        { 'Chỉ tiêu': 'Trung bình / đơn', 'Giá trị': eodData.avgOrderValue },
      ]),
      'Cuối ngày'
    )

    const wsPay = XLSX.utils.json_to_sheet(
      (eodData.byPaymentMethod || []).map((p) => ({
        'Phương thức': PAYMENT_LABEL[p.method] || p.method,
        'Số đơn': p.count,
        'Doanh thu (đ)': Number(p.total),
      })),
      { header: ['Phương thức', 'Số đơn', 'Doanh thu (đ)'] }
    )
    wsPay['!cols'] = [{ wch: 16 }, { wch: 10 }, { wch: 18 }]
    XLSX.utils.book_append_sheet(wb, wsPay, 'Phương thức TT')

    const wsOrders = XLSX.utils.json_to_sheet(
      (eodData.orders || []).map((o) => ({
        'Mã đơn': o.orderCode,
        'Giờ': formatDateTime(o.createdAt),
        'Khách hàng': o.customerName,
        'Phương thức': PAYMENT_LABEL[o.paymentMethod] || o.paymentMethod,
        'Trạng thái': STATUS_LABEL[o.status] || o.status,
        'Tổng tiền (đ)': Number(o.totalAmount),
      })),
      { header: ['Mã đơn', 'Giờ', 'Khách hàng', 'Phương thức', 'Trạng thái', 'Tổng tiền (đ)'] }
    )
    wsOrders['!cols'] = [{ wch: 20 }, { wch: 20 }, { wch: 24 }, { wch: 16 }, { wch: 14 }, { wch: 18 }]
    XLSX.utils.book_append_sheet(wb, wsOrders, 'Đơn hàng')

    XLSX.writeFile(wb, `bao-cao-cuoi-ngay-${eodDate.format('YYYY-MM-DD')}.xlsx`)
    message.success('Xuất Excel cuối ngày thành công')
  }

  // ===== In / Xuất: Tồn kho =====
  const handlePrintInventory = () => {
    if (!inventory) return
    printReport({
      title: 'BÁO CÁO TỒN KHO — BALO & TÚI XÁCH',
      subtitle: `Thời điểm ${new Date().toLocaleString('vi-VN')}`,
      summary: [
        { label: 'Tổng mặt hàng', value: String(inventory.totalProducts) },
        { label: 'Tổng số lượng tồn', value: String(inventory.totalStock) },
        { label: 'Giá trị tồn (giá bán)', value: formatCurrency(inventory.totalStockValue) },
        { label: 'Lợi nhuận tiềm năng', value: formatCurrency(inventory.potentialProfit) },
        { label: 'Sắp hết (tồn < 10)', value: String(inventory.lowStockCount) },
        { label: 'Hết hàng', value: String(inventory.outOfStockCount) },
      ],
      sections: [
        {
          title: 'Chi tiết sản phẩm tồn kho',
          cols: [
            { label: 'Sản phẩm' },
            { label: 'SKU' },
            { label: 'Danh mục' },
            { label: 'Tồn kho', a: 'c' },
            { label: 'Giá vốn', a: 'r' },
            { label: 'Giá bán', a: 'r' },
            { label: 'Giá trị tồn (giá bán)', a: 'r' },
          ],
          rows: (inventory.items || []).map((i) => [
            { t: i.name },
            { t: i.sku },
            { t: i.category },
            { t: String(i.stock), a: 'c' },
            { t: formatCurrency(i.costPrice), a: 'r' },
            { t: formatCurrency(i.price), a: 'r' },
            { t: formatCurrency(i.stockValue), a: 'r' },
          ]),
        },
      ],
    })
  }

  const handleExportInventory = () => {
    if (!inventory) return
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(
      (inventory.items || []).map((i) => ({
        'Sản phẩm': i.name,
        'SKU': i.sku,
        'Danh mục': i.category,
        'Tồn kho': i.stock,
        'Giá vốn (đ)': i.costPrice,
        'Giá bán (đ)': i.price,
        'Giá trị tồn (đ)': i.stockValue,
      })),
      { header: ['Sản phẩm', 'SKU', 'Danh mục', 'Tồn kho', 'Giá vốn (đ)', 'Giá bán (đ)', 'Giá trị tồn (đ)'] }
    )
    ws['!cols'] = [{ wch: 34 }, { wch: 14 }, { wch: 18 }, { wch: 10 }, { wch: 16 }, { wch: 16 }, { wch: 18 }]
    XLSX.utils.book_append_sheet(wb, ws, 'Tồn kho')
    XLSX.writeFile(wb, 'bao-cao-ton-kho.xlsx')
    message.success('Xuất Excel tồn kho thành công')
  }

  // ===== In / Xuất: Khách hàng =====
  const handlePrintCustomers = () => {
    if (!custData) return
    printReport({
      title: 'BÁO CÁO KHÁCH HÀNG — BALO & TÚI XÁCH',
      subtitle: custRange.from
        ? `${formatDate(custRange.from)} → ${formatDate(custRange.to)}`
        : 'Toàn thời gian',
      summary: [
        { label: 'Tổng khách hàng', value: String(custData.totalCustomers) },
        { label: 'Khách hàng mới trong kỳ', value: String(custData.newCustomers) },
        { label: 'Khách mua hàng trong kỳ', value: String(custData.activeCustomers) },
      ],
      sections: [
        {
          title: 'Top khách hàng mua nhiều nhất',
          cols: [
            { label: 'Hạng', a: 'c' },
            { label: 'Khách hàng' },
            { label: 'SĐT' },
            { label: 'Số đơn', a: 'c' },
            { label: 'Tổng chi tiêu', a: 'r' },
            { label: 'Lần mua cuối' },
          ],
          rows: (custData.topCustomers || []).map((c, i) => [
            { t: String(i + 1), a: 'c' },
            { t: c.fullName },
            { t: c.phone },
            { t: String(c.orderCount), a: 'c' },
            { t: formatCurrency(c.totalSpent), a: 'r' },
            { t: c.lastOrderAt ? formatDate(c.lastOrderAt) : '' },
          ]),
        },
      ],
    })
  }

  const handleExportCustomers = () => {
    if (!custData) return
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet([
        { 'Chỉ tiêu': 'Tổng khách hàng', 'Giá trị': custData.totalCustomers },
        { 'Chỉ tiêu': 'Khách hàng mới', 'Giá trị': custData.newCustomers },
        { 'Chỉ tiêu': 'Khách mua hàng trong kỳ', 'Giá trị': custData.activeCustomers },
      ]),
      'Tổng quan'
    )
    const wsCust = XLSX.utils.json_to_sheet(
      (custData.topCustomers || []).map((c, i) => ({
        'Hạng': i + 1,
        'Khách hàng': c.fullName,
        'SĐT': c.phone,
        'Số đơn': c.orderCount,
        'Tổng chi (đ)': Number(c.totalSpent),
        'Lần mua cuối': c.lastOrderAt ? formatDate(c.lastOrderAt) : '',
      })),
      { header: ['Hạng', 'Khách hàng', 'SĐT', 'Số đơn', 'Tổng chi (đ)', 'Lần mua cuối'] }
    )
    wsCust['!cols'] = [{ wch: 6 }, { wch: 28 }, { wch: 16 }, { wch: 10 }, { wch: 18 }, { wch: 16 }]
    XLSX.utils.book_append_sheet(wb, wsCust, 'Top khách hàng')
    XLSX.writeFile(wb, 'bao-cao-khach-hang.xlsx')
    message.success('Xuất Excel khách hàng thành công')
  }

  // ===== Cột bảng =====
  const topProductCols = [
    { title: 'Thứ hạng', key: 'rank', width: 70, render: (_, __, i) => <b>{i + 1}</b> },
    { title: 'Sản phẩm', dataIndex: 'name', key: 'name' },
    { title: 'Danh mục', dataIndex: 'category', key: 'category' },
    { title: 'SKU', dataIndex: 'sku', key: 'sku' },
    { title: 'Đã bán', dataIndex: 'totalSold', key: 'totalSold', render: (v) => <Tag>{v}</Tag> },
    {
      title: 'Doanh thu',
      dataIndex: 'revenue',
      key: 'revenue',
      render: (v) => <b style={{ color: '#f5222d' }}>{formatCurrency(v)}</b>,
    },
  ]

  const inventoryColumns = [
    { title: 'Sản phẩm', dataIndex: 'name', key: 'name' },
    { title: 'SKU', dataIndex: 'sku', key: 'sku' },
    { title: 'Danh mục', dataIndex: 'category', key: 'category' },
    {
      title: 'Tồn kho',
      dataIndex: 'stock',
      key: 'stock',
      width: 100,
      render: (v) => <Tag color={v === 0 ? 'red' : v < 10 ? 'orange' : 'green'}>{v}</Tag>,
    },
    { title: 'Giá vốn', dataIndex: 'costPrice', key: 'costPrice', render: (v) => formatCurrency(v) },
    { title: 'Giá bán', dataIndex: 'price', key: 'price', render: (v) => formatCurrency(v) },
    {
      title: 'Giá trị tồn kho (theo giá bán)',
      dataIndex: 'stockValue',
      key: 'stockValue',
      render: (v) => <b style={{ color: '#0958d9' }}>{formatCurrency(v)}</b>,
    },
  ]

  const eodOrderCols = [
    { title: 'Mã đơn', dataIndex: 'orderCode', key: 'orderCode', width: 150 },
    {
      title: 'Giờ',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 80,
      render: (v) => new Date(v).toLocaleTimeString('vi-VN'),
    },
    { title: 'Khách hàng', dataIndex: 'customerName', key: 'customerName' },
    {
      title: 'Phương thức',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      render: (v) => PAYMENT_LABEL[v] || v,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (v) => <Tag color={STATUS_COLOR[v] || 'default'}>{STATUS_LABEL[v] || v}</Tag>,
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      align: 'right',
      render: (v) => <b style={{ color: '#f5222d' }}>{formatCurrency(v)}</b>,
    },
  ]

  const eodPayCols = [
    {
      title: 'Phương thức',
      key: 'method',
      render: (_, r) => PAYMENT_LABEL[r.method] || r.method,
    },
    { title: 'Số đơn', dataIndex: 'count', key: 'count', align: 'center', render: (v) => <Tag>{v}</Tag> },
    {
      title: 'Doanh thu',
      dataIndex: 'total',
      key: 'total',
      align: 'right',
      render: (v) => <b style={{ color: '#0958d9' }}>{formatCurrency(v)}</b>,
    },
  ]

  const customerCols = [
    {
      title: 'Hạng',
      key: 'rank',
      width: 70,
      render: (_, __, i) => <b>{i + 1}</b>,
    },
    { title: 'Khách hàng', dataIndex: 'fullName', key: 'fullName' },
    { title: 'SĐT', dataIndex: 'phone', key: 'phone' },
    {
      title: 'Số đơn',
      dataIndex: 'orderCount',
      key: 'orderCount',
      align: 'center',
      render: (v) => <Tag color="blue">{v}</Tag>,
    },
    {
      title: 'Tổng chi tiêu',
      dataIndex: 'totalSpent',
      key: 'totalSpent',
      align: 'right',
      render: (v) => <b style={{ color: '#f5222d' }}>{formatCurrency(v)}</b>,
    },
    {
      title: 'Lần mua cuối',
      dataIndex: 'lastOrderAt',
      key: 'lastOrderAt',
      render: (v) => (v ? formatDate(v) : '—'),
    },
  ]

  // ===== Nội dung từng tab =====
  const salesBody = (
    <>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Select
            value={year}
            onChange={setYear}
            style={{ width: '100%' }}
            options={YEARS.map((y) => ({ label: `Năm ${y}`, value: y }))}
          />
        </Col>
        <Col xs={24} sm={12} md={10}>
          <DatePicker.RangePicker
            style={{ width: '100%' }}
            onChange={(_, str) => setSalesRange({ from: str?.[0] || undefined, to: str?.[1] || undefined })}
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} sm={12}>
          <Card>
            <Statistic
              title={`Tổng doanh thu năm ${year}`}
              value={totalRevenue}
              prefix={<DollarOutlined style={{ color: '#f5222d', marginRight: 8 }} />}
              suffix="đ"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12}>
          <Card>
            <Statistic
              title="Tổng đơn hàng (không gồm hủy)"
              value={totalOrders}
              prefix={<ShoppingCartOutlined style={{ color: '#1677ff', marginRight: 8 }} />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={14}>
          <Card title={`Doanh thu theo tháng - ${year}`}>
            {salesLoading ? (
              <Spin />
            ) : chartData.some((d) => d.value > 0) ? (
              <Column
                data={chartData}
                xField="month"
                yField="value"
                height={320}
                color="#1677ff"
                label={{ position: 'top', formatter: (d) => (Number(d.value) / 1e6).toFixed(1) + 'tr' }}
              />
            ) : (
              <Empty description="Không có dữ liệu" />
            )}
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="Top sản phẩm bán chạy">
            <Table
              rowKey="productId"
              size="small"
              columns={topProductCols}
              dataSource={topProducts}
              pagination={false}
              loading={salesLoading}
              scroll={{ x: 500 }}
            />
          </Card>
        </Col>
      </Row>
    </>
  )

  const eodBody = (
    <>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8} md={6}>
          <DatePicker
            value={eodDate}
            onChange={(d) => setEodDate(d || dayjs())}
            style={{ width: '100%' }}
            allowClear={false}
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title={`Doanh thu ngày ${eodDate.format('DD/MM/YYYY')}`}
              value={eodData?.totalRevenue || 0}
              prefix={<DollarOutlined style={{ color: '#f5222d', marginRight: 8 }} />}
              suffix="đ"
              loading={eodLoading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Số đơn hàng"
              value={eodData?.totalOrders || 0}
              prefix={<ShoppingCartOutlined style={{ color: '#1677ff', marginRight: 8 }} />}
              loading={eodLoading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Số lượng bán ra"
              value={eodData?.totalQuantitySold || 0}
              prefix={<DatabaseOutlined style={{ color: '#52c41a', marginRight: 8 }} />}
              loading={eodLoading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Trung bình / đơn"
              value={eodData?.avgOrderValue || 0}
              prefix={<RiseOutlined style={{ color: '#0958d9', marginRight: 8 }} />}
              suffix="đ"
              loading={eodLoading}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} md={10}>
          <Card title="Phương thức thanh toán">
            <Table
              rowKey="method"
              size="small"
              columns={eodPayCols}
              dataSource={eodData?.byPaymentMethod || []}
              pagination={false}
              loading={eodLoading}
            />
            <div style={{ marginTop: 12 }}>
              <Space wrap>
                {(eodData?.byStatus || []).map((s) => (
                  <Tag key={s.status} color={STATUS_COLOR[s.status] || 'default'}>
                    {STATUS_LABEL[s.status] || s.status}: {s.count}
                  </Tag>
                ))}
              </Space>
            </div>
          </Card>
        </Col>
        <Col xs={24} md={14}>
          <Card title={`Danh sách đơn hàng ngày ${eodDate.format('DD/MM/YYYY')}`}>
            <Table
              rowKey="id"
              size="small"
              columns={eodOrderCols}
              dataSource={eodData?.orders || []}
              loading={eodLoading}
              scroll={{ x: 700 }}
              pagination={{ pageSize: 8, showTotal: (t) => `Tổng ${t} đơn` }}
            />
          </Card>
        </Col>
      </Row>
    </>
  )

  const inventoryBody = (
    <>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Tổng mặt hàng tồn kho"
              value={inventory?.totalProducts || 0}
              prefix={<DatabaseOutlined style={{ color: '#1677ff', marginRight: 8 }} />}
              loading={invLoading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Tổng số lượng tồn"
              value={inventory?.totalStock || 0}
              valueStyle={{ color: '#0958d9' }}
              loading={invLoading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Giá trị tồn kho (theo giá bán)"
              value={inventory?.totalStockValue || 0}
              precision={0}
              suffix="₫"
              valueStyle={{ color: '#f5222d' }}
              loading={invLoading}
            />
          </Card>
        </Col>
      </Row>
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Sản phẩm sắp hết (tồn < 10)"
              value={inventory?.lowStockCount || 0}
              valueStyle={{ color: '#faad14' }}
              loading={invLoading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Sản phẩm hết hàng"
              value={inventory?.outOfStockCount || 0}
              valueStyle={{ color: '#ff4d4f' }}
              loading={invLoading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Lợi nhuận tiềm năng của tồn kho"
              value={inventory?.potentialProfit || 0}
              precision={0}
              suffix="₫"
              valueStyle={{ color: '#52c41a' }}
              loading={invLoading}
            />
          </Card>
        </Col>
      </Row>
      <Card title="Báo cáo tồn kho" style={{ marginTop: 16 }}>
        <Table
          rowKey="productId"
          size="small"
          columns={inventoryColumns}
          dataSource={inventory?.items || []}
          loading={invLoading}
          scroll={{ x: 800 }}
          pagination={{ pageSize: 10, showTotal: (t) => `Tổng ${t} sản phẩm` }}
        />
      </Card>
    </>
  )

  const customersBody = (
    <>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={8}>
          <DatePicker.RangePicker
            style={{ width: '100%' }}
            onChange={(_, str) => setCustRange({ from: str?.[0] || undefined, to: str?.[1] || undefined })}
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Tổng khách hàng"
              value={custData?.totalCustomers || 0}
              prefix={<TeamOutlined style={{ color: '#1677ff', marginRight: 8 }} />}
              loading={custLoading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Khách hàng mới trong kỳ"
              value={custData?.newCustomers || 0}
              prefix={<CustomerServiceOutlined style={{ color: '#52c41a', marginRight: 8 }} />}
              loading={custLoading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Khách mua hàng trong kỳ"
              value={custData?.activeCustomers || 0}
              prefix={<ShoppingCartOutlined style={{ color: '#faad14', marginRight: 8 }} />}
              loading={custLoading}
            />
          </Card>
        </Col>
      </Row>

      <Card title="Top khách hàng mua nhiều nhất" style={{ marginTop: 16 }}>
        <Table
          rowKey="customerId"
          size="small"
          columns={customerCols}
          dataSource={custData?.topCustomers || []}
          loading={custLoading}
          scroll={{ x: 700 }}
          pagination={false}
        />
      </Card>
    </>
  )

  const tabItems = [
    { key: 'sales', label: 'Bán hàng', children: salesBody },
    { key: 'endOfDay', label: 'Cuối ngày', children: eodBody },
    { key: 'inventory', label: 'Hàng tồn kho', children: inventoryBody },
    { key: 'customers', label: 'Khách hàng', children: customersBody },
  ]

  const renderActions = () => {
    switch (tab) {
      case 'endOfDay':
        return (
          <>
            <Button icon={<PrinterOutlined />} onClick={handlePrintEod} disabled={eodLoading || !eodData}>
              In báo cáo
            </Button>
            <Button type="primary" icon={<FileExcelOutlined />} onClick={handleExportEod} disabled={eodLoading || !eodData}>
              Xuất Excel
            </Button>
          </>
        )
      case 'inventory':
        return (
          <>
            <Button icon={<PrinterOutlined />} onClick={handlePrintInventory} disabled={invLoading || !inventory}>
              In báo cáo
            </Button>
            <Button type="primary" icon={<FileExcelOutlined />} onClick={handleExportInventory} disabled={invLoading || !inventory}>
              Xuất Excel
            </Button>
          </>
        )
      case 'customers':
        return (
          <>
            <Button icon={<PrinterOutlined />} onClick={handlePrintCustomers} disabled={custLoading || !custData}>
              In báo cáo
            </Button>
            <Button type="primary" icon={<FileExcelOutlined />} onClick={handleExportCustomers} disabled={custLoading || !custData}>
              Xuất Excel
            </Button>
          </>
        )
      default:
        return (
          <>
            <Button icon={<PrinterOutlined />} onClick={handlePrintSales} disabled={salesLoading}>
              In báo cáo
            </Button>
            <Button type="primary" icon={<FileExcelOutlined />} onClick={handleExportSales} disabled={salesLoading}>
              Xuất Excel
            </Button>
          </>
        )
    }
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8,
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <Typography.Title level={4} style={{ margin: 0 }}>
          Báo cáo thống kê
        </Typography.Title>
        <Space>{renderActions()}</Space>
      </div>

      <Tabs activeKey={tab} onChange={setTab} items={tabItems} />
    </div>
  )
}