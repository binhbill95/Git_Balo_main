import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import {
  Row,
  Col,
  Card,
  Input,
  Button,
  Select,
  Image,
  Empty,
  Space,
  Tag,
  InputNumber,
  Modal,
  Form,
  message,
  Typography,
  Checkbox,
  Divider,
} from 'antd'
import {
  SearchOutlined,
  PlusOutlined,
  MinusOutlined,
  DeleteOutlined,
  ShoppingCartOutlined,
  UserAddOutlined,
  ReloadOutlined,
  PrinterOutlined,
  BarcodeOutlined,
} from '@ant-design/icons'
import { Navigate } from 'react-router-dom'
import productService from '../services/product.service'
import categoryService from '../services/category.service'
import customerService from '../services/customer.service'
import orderService from '../services/order.service'
import { useAuth } from '../hooks/useAuth'
import { formatCurrency, formatDateTime } from '../utils/format'
import { QRCodeSVG } from 'qrcode.react'

const PAYMENT_LABEL = {
  CASH: 'Tiền mặt',
  TRANSFER: 'Chuyển khoản',
  CARD: 'Thẻ',
}

// Thông tin tài khoản nhận tiền của cửa hàng (mã QR demo - thay bằng tài khoản thật khi cần)
const BANK_ACCOUNT = {
  bankName: 'BIDV',
  bic: '970418',
  accountNumber: '1234567890',
  accountName: 'CONG TY TNHH BALO TUI XACH',
  branch: 'HANOI',
}

const crc16ccitt = (str) => {
  let crc = 0xffff
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

const tlv = (id, value) => {
  const v = String(value)
  return `${id}${String(v.length).padStart(2, '0')}${v}`
}

// Tạo mã QR ngân hàng giả lập theo chuẩn VietQR (EMVCo) có CRC hợp lệ
const buildBankQR = ({ amount, reference }) => {
  const amountStr = Math.round(Number(amount) || 0).toString()
  if (!amountStr) return ''
  const body =
    tlv('00', '01') +
    tlv('01', '12') +
    tlv(
      '38',
      tlv('00', 'A000000727') +
        tlv('01', 'QRIBFTTA') +
        tlv('02', BANK_ACCOUNT.bic) +
        tlv('03', BANK_ACCOUNT.accountNumber) +
        tlv('04', '2')
    ) +
    tlv('52', '5499') +
    tlv('53', '704') +
    tlv('54', amountStr) +
    tlv('58', 'VN') +
    tlv('59', BANK_ACCOUNT.accountName) +
    tlv('60', BANK_ACCOUNT.branch) +
    tlv('62', tlv('01', reference || ''))
  const crc = crc16ccitt(body + '6304')
  return body + '6304' + crc
}

export default function POS() {
  const { hasRole } = useAuth()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [customers, setCustomers] = useState([])
  const [cart, setCart] = useState([])
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState(undefined)
  const [customerId, setCustomerId] = useState(undefined)
  const [paymentMethod, setPaymentMethod] = useState('CASH')
  const [received, setReceived] = useState(undefined)
  const [paying, setPaying] = useState(false)
  const [lastOrder, setLastOrder] = useState(null)
  const [lastPayment, setLastPayment] = useState(null)
  const [printOpen, setPrintOpen] = useState(false)
  const [walkIn, setWalkIn] = useState(false)
  const [customerModalOpen, setCustomerModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [scanCode, setScanCode] = useState('')
  const [customerForm] = Form.useForm()
  const scanRef = useRef(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [proRes, cusRes] = await Promise.all([
        productService.list({ limit: 100, isActive: 'true' }),
        customerService.list({ limit: 100 }),
      ])
      setProducts(proRes.data)
      setCustomers(cusRes.data)
    } catch (err) {
      message.error(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    categoryService.all().then((d) => setCategories(d.data.filter((c) => c.isActive))).catch(() => {})
  }, [load])

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (p.stock <= 0) return false
      if (categoryId && p.categoryId !== categoryId) return false
      if (search) {
        const s = search.toLowerCase()
        if (
          !p.name.toLowerCase().includes(s) &&
          !p.sku.toLowerCase().includes(s) &&
          !(p.barcode || '').toLowerCase().includes(s)
        ) {
          return false
        }
      }
      return true
    })
  }, [products, search, categoryId])

  const subtotal = useMemo(
    () => cart.reduce((s, c) => s + Number(c.product.price) * c.quantity, 0),
    [cart]
  )

  const change = useMemo(() => {
    if (received === undefined || received === null || received === '') return null
    return Number(received) - subtotal
  }, [received, subtotal])

  const addToCart = (product) => {
    setCart((prev) => {
      const found = prev.find((c) => c.product.id === product.id)
      if (found) {
        if (found.quantity >= product.stock) {
          message.warning(`"${product.name}" đã hết tồn kho`)
          return prev
        }
        return prev.map((c) =>
          c.product.id === product.id ? { ...c, quantity: c.quantity + 1 } : c
        )
      }
      return [...prev, { product, quantity: 1 }]
    })
  }

  const handleScan = async () => {
    const code = scanCode.trim()
    if (!code) return
    let product = products.find((x) => x.barcode === code)
    if (!product) {
      try {
        const res = await productService.getByBarcode(code)
        product = res.data
      } catch {
        message.error(`Không tìm thấy sản phẩm với mã vạch ${code}`)
        setScanCode('')
        scanRef.current?.focus()
        return
      }
    }
    if (product.stock <= 0) {
      message.warning(`"${product.name}" đã hết tồn kho`)
    } else {
      addToCart(product)
    }
    setScanCode('')
    scanRef.current?.focus()
  }

  const updateQty = (productId, qty) => {
    if (!qty || qty < 1) {
      setCart((prev) => prev.filter((c) => c.product.id !== productId))
      return
    }
    setCart((prev) =>
      prev.map((c) =>
        c.product.id === productId
          ? { ...c, quantity: Math.min(qty, c.product.stock) }
          : c
      )
    )
  }

  const removeItem = (productId) => {
    setCart((prev) => prev.filter((c) => c.product.id !== productId))
  }

  const handleCheckout = async () => {
    if (cart.length === 0) {
      message.warning('Giỏ hàng đang trống')
      return
    }
    if (!walkIn && !customerId) {
      message.warning('Vui lòng chọn khách hàng hoặc chọn "Khách lẻ"')
      return
    }
    setPaying(true)
    try {
      const res = await orderService.create({
        customerId: walkIn ? undefined : customerId,
        paymentMethod,
        items: cart.map((c) => ({ productId: c.product.id, quantity: c.quantity })),
      })
      message.success(`Tạo đơn hàng thành công: ${res.data?.orderCode || ''}`)
      setLastOrder(res.data)
      setLastPayment({
        method: paymentMethod,
        received: paymentMethod === 'CASH' && received !== undefined && received !== null && received !== '' ? Number(received) : null,
        change: paymentMethod === 'CASH' && received !== undefined && received !== null && received !== '' ? Number(received) - subtotal : null,
      })
      setPrintOpen(true)
      setCart([])
      setCustomerId(undefined)
      setWalkIn(false)
      setPaymentMethod('CASH')
      setReceived(undefined)
      load()
    } catch (err) {
      message.error(err.message)
    } finally {
      setPaying(false)
    }
  }

  const handleAddCustomer = async () => {
    try {
      const values = await customerForm.validateFields()
      const res = await customerService.create(values)
      setCustomers((prev) => [...prev, res.data])
      setCustomerId(res.data.id)
      setCustomerModalOpen(false)
      message.success('Thêm khách hàng thành công')
    } catch (err) {
      if (err.errorFields) return
      message.error(err.message)
    }
  }

  if (!hasRole('ADMIN', 'SALES')) return <Navigate to="/dashboard" replace />

  return (
    <div>
      <Typography.Title level={4} style={{ marginBottom: 16 }}>
        Bán hàng (POS)
      </Typography.Title>
      <Row gutter={16} wrap={false} style={{ height: 'calc(100vh - 130px)' }}>
        <Col flex="auto" style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <Card size="small" style={{ marginBottom: 12 }}>
            <Space wrap style={{ width: '100%' }}>
              <Input
                ref={scanRef}
                prefix={<BarcodeOutlined />}
                placeholder="Quét mã vạch..."
                value={scanCode}
                autoFocus
                allowClear
                onChange={(e) => setScanCode(e.target.value)}
                onPressEnter={handleScan}
                style={{ width: 220 }}
              />
              <Input
                placeholder="Tìm sản phẩm..."
                prefix={<SearchOutlined />}
                style={{ flex: 1, minWidth: 200 }}
                allowClear
                onChange={(e) => setSearch(e.target.value)}
              />
              <Select
                placeholder="Danh mục"
                allowClear
                style={{ width: 180 }}
                value={categoryId}
                onChange={setCategoryId}
                options={categories.map((c) => ({ label: c.name, value: c.id }))}
              />
              <Button icon={<ReloadOutlined />} onClick={load} />
            </Space>
          </Card>
          <Card size="small" style={{ flex: 1, overflow: 'auto' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: 60, color: '#999' }}>
                Đang tải sản phẩm...
              </div>
            ) : filteredProducts.length === 0 ? (
              <Empty description="Không tìm thấy sản phẩm" />
            ) : (
              <Row gutter={[12, 12]}>
                {filteredProducts.map((p) => (
                  <Col key={p.id} xs={12} sm={8} md={8} lg={6}>
                    <Card
                      hoverable
                      size="small"
                      onClick={() => addToCart(p)}
                      style={{ textAlign: 'center' }}
                    >
                      {p.imageUrl ? (
                        <Image
                          src={p.imageUrl}
                          width="100%"
                          height={90}
                          style={{ objectFit: 'cover', borderRadius: 6 }}
                          preview={false}
                        />
                      ) : (
                        <div
                          style={{
                            height: 90,
                            backgroundColor: '#f0f2f5',
                            borderRadius: 6,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#bfbfbf',
                          }}
                        >
                          —
                        </div>
                      )}
                      <Typography.Text strong ellipsis style={{ display: 'block', marginTop: 8 }}>
                        {p.name}
                      </Typography.Text>
                      <Space direction="vertical" size={4} style={{ display: 'flex' }}>
                        <Typography.Text type="danger" strong>
                          {formatCurrency(p.price)}
                        </Typography.Text>
                        <Tag color={p.stock < 5 ? 'orange' : 'green'} style={{ margin: 0 }}>
                          Còn {p.stock}
                        </Tag>
                      </Space>
                    </Card>
                  </Col>
                ))}
              </Row>
            )}
          </Card>
        </Col>

        <Col flex="340px">
          <Card
            title={
              <Space>
                <ShoppingCartOutlined />
                <span>Giỏ hàng ({cart.length})</span>
              </Space>
            }
            style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
            styles={{ body: { flex: 1, display: 'flex', flexDirection: 'column', padding: 12 } }}
          >
            <div style={{ flex: 1, overflow: 'auto' }}>
              {cart.length === 0 ? (
                <Empty description="Chưa có sản phẩm" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              ) : (
                cart.map((c) => (
                  <div
                    key={c.product.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 0',
                      borderBottom: '1px solid #f0f0f0',
                      gap: 8,
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Typography.Text strong ellipsis style={{ display: 'block' }}>
                        {c.product.name}
                      </Typography.Text>
                      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                        {formatCurrency(c.product.price)}
                      </Typography.Text>
                    </div>
                    <Space size={4} style={{ flexShrink: 0 }}>
                      <Button
                        size="small"
                        icon={<MinusOutlined />}
                        onClick={() => updateQty(c.product.id, c.quantity - 1)}
                      />
                      <InputNumber
                        size="small"
                        min={1}
                        max={c.product.stock}
                        value={c.quantity}
                        onChange={(v) => updateQty(c.product.id, v)}
                        style={{ width: 55 }}
                      />
                      <Button
                        size="small"
                        icon={<PlusOutlined />}
                        onClick={() => updateQty(c.product.id, c.quantity + 1)}
                      />
                      <Button
                        size="small"
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => removeItem(c.product.id)}
                      />
                    </Space>
                  </div>
                ))
              )}
            </div>

            <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 12, marginTop: 12 }}>
              <div style={{ marginBottom: 12 }}>
                <Space
                  style={{
                    width: '100%',
                    justifyContent: 'space-between',
                    marginBottom: 4,
                  }}
                >
                  <Typography.Text strong>Khách hàng</Typography.Text>
                  <Checkbox
                    checked={walkIn}
                    onChange={(e) => {
                      setWalkIn(e.target.checked)
                      if (e.target.checked) setCustomerId(undefined)
                    }}
                  >
                    Khách lẻ
                  </Checkbox>
                </Space>
                <Space.Compact style={{ width: '100%' }}>
                  <Select
                    showSearch
                    allowClear
                    placeholder="Chọn khách hàng"
                    style={{ flex: 1 }}
                    value={customerId}
                    onChange={setCustomerId}
                    disabled={walkIn}
                    optionFilterProp="label"
                    options={customers.map((c) => ({
                      value: c.id,
                      label: `${c.fullName} (${c.phone})`,
                    }))}
                  />
                  <Button
                    icon={<UserAddOutlined />}
                    title="Thêm khách hàng mới"
                    disabled={walkIn}
                    onClick={() => {
                      setCustomerModalOpen(true)
                      customerForm.resetFields()
                    }}
                  />
                </Space.Compact>
              </div>

              <Space
                style={{
                  width: '100%',
                  justifyContent: 'space-between',
                  marginBottom: 12,
                }}
              >
                <Typography.Text strong>Phương thức:</Typography.Text>
                <Select
                  size="large"
                  style={{ width: 200 }}
                  value={paymentMethod}
                  onChange={setPaymentMethod}
                  options={[
                    { value: 'CASH', label: 'Tiền mặt' },
                    { value: 'TRANSFER', label: 'Chuyển khoản' },
                    { value: 'CARD', label: 'Thẻ' },
                  ]}
                />
              </Space>

              <Space
                style={{
                  width: '100%',
                  justifyContent: 'space-between',
                  marginBottom: 12,
                }}
              >
                <Typography.Text strong>Tạm tính:</Typography.Text>
                <Typography.Text type="danger" strong style={{ fontSize: 18 }}>
                  {formatCurrency(subtotal)}
                </Typography.Text>
              </Space>

              {paymentMethod === 'CASH' && (
                <Space
                  direction="vertical"
                  style={{ width: '100%', marginBottom: 12 }}
                  size={4}
                >
                  <Typography.Text strong>Khách đưa:</Typography.Text>
                  <InputNumber
                    style={{ width: '100%' }}
                    min={0}
                    placeholder="Nhập số tiền khách đưa"
                    value={received}
                    onChange={setReceived}
                    formatter={(v) => (v === undefined || v === null || v === '' ? '' : Number(v).toLocaleString('vi-VN'))}
                    parser={(v) => Number(String(v).replace(/\./g, ''))}
                  />
                  {change !== null && (
                    <Space
                      style={{
                        width: '100%',
                        justifyContent: 'space-between',
                        background: change < 0 ? '#fff1f0' : '#f6ffed',
                        padding: '6px 10px',
                        borderRadius: 6,
                      }}
                    >
                      <Typography.Text strong>Tiền thừa:</Typography.Text>
                      <Typography.Text
                        strong
                        type={change < 0 ? 'danger' : 'success'}
                        style={{ fontSize: 15 }}
                      >
                        {change < 0 ? 'Còn thiếu ' : ''}
                        {formatCurrency(Math.abs(change))}
                      </Typography.Text>
                    </Space>
                  )}
                </Space>
              )}

              <Button
                type="primary"
                block
                size="large"
                icon={<ShoppingCartOutlined />}
                loading={paying}
                disabled={cart.length === 0}
                onClick={handleCheckout}
              >
                THANH TOÁN
              </Button>
            </div>
          </Card>
        </Col>
      </Row>

      <Modal
        title="Thêm khách hàng"
        open={customerModalOpen}
        onOk={handleAddCustomer}
        onCancel={() => setCustomerModalOpen(false)}
        okText="Thêm"
        destroyOnClose
      >
        <Form form={customerForm} layout="vertical">
          <Form.Item
            name="fullName"
            label="Họ tên"
            rules={[{ required: true, message: 'Nhập họ tên' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="phone"
            label="Số điện thoại"
            rules={[{ required: true, message: 'Nhập SĐT' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email">
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={null}
        open={printOpen}
        onCancel={() => setPrintOpen(false)}
        footer={[
          <Button key="close" onClick={() => setPrintOpen(false)}>
            Đóng
          </Button>,
          <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={() => window.print()}>
            In hóa đơn
          </Button>,
        ]}
        width={360}
      >
        {lastOrder && (
          <div id="receipt-area">
            <div style={{ textAlign: 'center', marginBottom: 8 }}>
              <Typography.Title level={5} style={{ margin: 0 }}>
                BALO - TÚI XÁCH
              </Typography.Title>
              <Typography.Text type="secondary">HÓA ĐƠN BÁN HÀNG</Typography.Text>
            </div>
            <Divider style={{ margin: '8px 0' }} />
            <div>
              <Space direction="vertical" style={{ width: '100%' }} size={0}>
                <Typography.Text>
                  <b>Mã:</b> {lastOrder.orderCode}
                </Typography.Text>
                <Typography.Text>
                  <b>Ngày:</b> {formatDateTime(lastOrder.createdAt)}
                </Typography.Text>
                <Typography.Text>
                  <b>Khách:</b> {lastOrder.customer?.fullName || 'Khách lẻ'}
                </Typography.Text>
                <Typography.Text>
                  <b>NV:</b> {lastOrder.user?.fullName || '—'}
                </Typography.Text>
                <Typography.Text>
                  <b>TT:</b> {PAYMENT_LABEL[lastPayment?.method] || '—'}
                </Typography.Text>
              </Space>
            </div>
            <Divider style={{ margin: '8px 0' }} />
            <div>
              {lastOrder.orderItems?.map((it) => (
                <div
                  key={it.id}
                  style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 13 }}
                >
                  <Typography.Text style={{ flex: 1 }}>
                    {it.quantity} x {it.product?.name || `SP#${it.productId}`}
                  </Typography.Text>
                  <Typography.Text>{formatCurrency(Number(it.price) * it.quantity)}</Typography.Text>
                </div>
              ))}
            </div>
            <Divider style={{ margin: '8px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography.Text strong>TỔNG CỘNG</Typography.Text>
              <Typography.Text strong>{formatCurrency(lastOrder.totalAmount)}</Typography.Text>
            </div>
            {lastPayment?.method === 'CASH' && lastPayment.received !== null && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography.Text>Khách đưa</Typography.Text>
                  <Typography.Text>{formatCurrency(lastPayment.received)}</Typography.Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography.Text>Tiền thừa</Typography.Text>
                  <Typography.Text>{formatCurrency(lastPayment.change)}</Typography.Text>
                </div>
              </>
            )}
            {lastPayment?.method !== 'CASH' && lastOrder && (
              <>
                <Divider style={{ margin: '8px 0' }} />
                <div style={{ textAlign: 'center' }}>
                  <Typography.Text strong>
                    {lastPayment.method === 'TRANSFER'
                      ? 'QUÉT MÃ CHUYỂN KHOẢN'
                      : 'QUÉT MÃ THANH TOÁN THẺ'}
                  </Typography.Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', margin: '8px 0' }}>
                  <QRCodeSVG
                    value={buildBankQR({ amount: lastOrder.totalAmount, reference: lastOrder.orderCode })}
                    size={140}
                    marginSize={1}
                    level="M"
                  />
                </div>
                <div style={{ fontSize: 12, textAlign: 'center', lineHeight: 1.7 }}>
                  <Typography.Text>
                    {BANK_ACCOUNT.bankName} ({BANK_ACCOUNT.bic}) - {BANK_ACCOUNT.accountNumber}
                  </Typography.Text>
                  <br />
                  <Typography.Text>{BANK_ACCOUNT.accountName}</Typography.Text>
                  <br />
                  <Typography.Text type="danger" strong>
                    Số tiền: {formatCurrency(lastOrder.totalAmount)}
                  </Typography.Text>
                  <br />
                  <Typography.Text>Nội dung CK: {lastOrder.orderCode}</Typography.Text>
                </div>
              </>
            )}
            <Typography.Text type="secondary" style={{ display: 'block', textAlign: 'center', marginTop: 8 }}>
              Cảm ơn quý khách!
            </Typography.Text>
          </div>
        )}
      </Modal>
    </div>
  )
}