import { useEffect, useState, useCallback, useMemo } from 'react'
import {
  Table,
  Button,
  Input,
  Select,
  Card,
  Modal,
  Space,
  message,
  Typography,
  Tag,
  Descriptions,
  Form,
  InputNumber,
  Divider,
  DatePicker,
  Popconfirm,
} from 'antd'
import { PlusOutlined, SearchOutlined, EyeOutlined, ShoppingCartOutlined, DeleteOutlined, CloseOutlined } from '@ant-design/icons'
import orderService from '../services/order.service'
import customerService from '../services/customer.service'
import productService from '../services/product.service'
import { useAuth } from '../hooks/useAuth'
import { formatCurrency, formatDateTime } from '../utils/format'

const STATUS_COLORS = {
  PENDING: 'gold',
  CONFIRMED: 'blue',
  SHIPPING: 'cyan',
  COMPLETED: 'green',
  CANCELLED: 'red',
}

const STATUS_OPTIONS = Object.keys(STATUS_COLORS).map((s) => ({ label: s, value: s }))

export default function Orders() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 })
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState(undefined)
  const [dateRange, setDateRange] = useState({ from: undefined, to: undefined })
  const [detail, setDetail] = useState(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [customers, setCustomers] = useState([])
  const [products, setProducts] = useState([])
  const [createForm] = Form.useForm()
  const { hasRole } = useAuth()

  const canCreate = hasRole('ADMIN', 'SALES')
  const canUpdateStatus = hasRole('ADMIN', 'SALES', 'WAREHOUSE')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await orderService.list({
        page: pagination.page,
        limit: pagination.limit,
        search: search || undefined,
        status: status || undefined,
        from: dateRange.from || undefined,
        to: dateRange.to || undefined,
      })
      setItems(data.data)
      setPagination((p) => ({ ...p, total: data.meta.total }))
    } catch (error) {
      message.error(error.message)
    } finally {
      setLoading(false)
    }
  }, [pagination.page, pagination.limit, search, status, dateRange.from, dateRange.to])

  useEffect(() => {
    load()
  }, [load])

  const loadFormData = useCallback(async () => {
    try {
      const [c, p] = await Promise.all([
        customerService.list({ limit: 100 }),
        productService.list({ limit: 100 }),
      ])
      setCustomers(c.data)
      setProducts(p.data)
    } catch (error) {
      message.error(error.message)
    }
  }, [])

  const openCreate = () => {
    createForm.resetFields()
    createForm.setFieldsValue({ items: [{ productId: undefined, quantity: 1 }] })
    loadFormData()
    setCreateOpen(true)
  }

  const showDetail = async (record) => {
    try {
      const data = await orderService.getById(record.id)
      setDetail(data.data)
      setDetailOpen(true)
    } catch (error) {
      message.error(error.message)
    }
  }

  const changeStatus = async (record, newStatus) => {
    try {
      await orderService.updateStatus(record.id, newStatus)
      message.success('Cập nhật trạng thái thành công')
      load()
      if (detail) showDetail(record)
    } catch (error) {
      message.error(error.message)
    }
  }

  const handleCreateOrder = async () => {
    try {
      const values = await createForm.validateFields()
      const payload = {
        customerId: values.customerId,
        paymentMethod: values.paymentMethod || 'CASH',
        note: values.note || undefined,
        items: values.items.filter((i) => i.productId).map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
        })),
      }
      await orderService.create(payload)
      message.success('Tạo đơn hàng thành công')
      setCreateOpen(false)
      load()
    } catch (error) {
      message.error(error.message)
    }
  }

  const columns = useMemo(
    () => [
      { title: 'Mã đơn', dataIndex: 'orderCode', key: 'orderCode', width: 120, render: (v) => <Tag color="blue">{v}</Tag> },
      {
        title: 'Khách hàng',
        key: 'customer',
        render: (_, r) => <span>{r.customer?.fullName}<br /><small style={{ color: '#999' }}>{r.customer?.phone}</small></span>,
      },
      {
        title: 'Nhân viên',
        key: 'user',
        render: (_, r) => r.user?.fullName || '—',
      },
      {
        title: 'Tổng tiền',
        dataIndex: 'totalAmount',
        key: 'totalAmount',
        width: 140,
        render: (v) => <b>{formatCurrency(v)}</b>,
      },
      {
        title: 'Trạng thái',
        dataIndex: 'status',
        key: 'status',
        width: 130,
        render: (s, r) => (
          <Select
            size="small"
            value={s}
            style={{ width: 120 }}
            options={STATUS_OPTIONS}
            onChange={(v) => changeStatus(r, v)}
            disabled={!canUpdateStatus}
            labelRender={(o) => <Tag color={STATUS_COLORS[o.value]} style={{ margin: 0 }}>{o.value}</Tag>}
          />
        ),
      },
      { title: 'Ngày tạo', dataIndex: 'createdAt', key: 'createdAt', width: 150, render: formatDateTime },
      {
        title: 'Thao tác',
        key: 'action',
        width: 150,
        render: (_, r) => (
          <Space>
            <Button size="small" icon={<EyeOutlined />} onClick={() => showDetail(r)}>
              Chi tiết
            </Button>
            {r.status === 'PENDING' && canUpdateStatus && (
              <Popconfirm
                title="Hủy đơn hàng?"
                description="Kho sẽ được cộng lại số lượng đã bán. Thao tác không thể hoàn tác."
                okText="Xác nhận hủy"
                okButtonProps={{ danger: true }}
                cancelText="Không"
                onConfirm={() => changeStatus(r, 'CANCELLED')}
              >
                <Button size="small" danger icon={<CloseOutlined />}>
                  Hủy đơn
                </Button>
              </Popconfirm>
            )}
          </Space>
        ),
      },
    ],
    [canCreate, canUpdateStatus, hasRole]
  )

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>
          Quản lý đơn hàng
        </Typography.Title>
        {canCreate && (
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Tạo đơn hàng
          </Button>
        )}
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Input
            placeholder="Tìm theo mã đơn / khách hàng / SĐT..."
            prefix={<SearchOutlined />}
            style={{ width: 260 }}
            allowClear
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select
            placeholder="Trạng thái"
            style={{ width: 150 }}
            allowClear
            value={status}
            onChange={setStatus}
            options={STATUS_OPTIONS}
          />
          <DatePicker.RangePicker
            onChange={(_, dateStrings) => {
              setDateRange({ from: dateStrings?.[0] || undefined, to: dateStrings?.[1] || undefined })
            }}
          />
        </Space>
      </Card>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={items}
        loading={loading}
        pagination={{
          current: pagination.page,
          pageSize: pagination.limit,
          total: pagination.total,
          onChange: (page, limit) => setPagination((p) => ({ ...p, page, limit })),
          showTotal: (t) => `Tổng ${t} đơn hàng`,
        }}
        scroll={{ x: 900 }}
      />

      {/* Modal chi tiết */}
      <Modal
        title={`Chi tiết đơn ${detail?.orderCode || ''}`}
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={null}
        width={700}
      >
        {detail && (
          <>
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="Khách hàng">{detail.customer?.fullName}</Descriptions.Item>
              <Descriptions.Item label="SĐT">{detail.customer?.phone}</Descriptions.Item>
              <Descriptions.Item label="Nhân viên tạo">{detail.user?.fullName}</Descriptions.Item>
              <Descriptions.Item label="Ngày tạo">{formatDateTime(detail.createdAt)}</Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <Tag color={STATUS_COLORS[detail.status]}>{detail.status}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Tổng tiền">
                <b style={{ color: '#f5222d' }}>{formatCurrency(detail.totalAmount)}</b>
              </Descriptions.Item>
              {detail.note && (
                <Descriptions.Item label="Ghi chú" span={2}>
                  {detail.note}
                </Descriptions.Item>
              )}
            </Descriptions>

            <Divider />
            <Table
              rowKey="id"
              size="small"
              pagination={false}
              dataSource={detail.orderItems}
              columns={[
                { title: 'Sản phẩm', dataIndex: ['product', 'name'], key: 'name' },
                { title: 'SKU', dataIndex: ['product', 'sku'], key: 'sku' },
                { title: 'SL', dataIndex: 'quantity', key: 'quantity' },
                { title: 'Đơn giá', dataIndex: 'price', key: 'price', render: formatCurrency },
                {
                  title: 'Thành tiền',
                  key: 'subtotal',
                  render: (_, r) => formatCurrency(Number(r.price) * r.quantity),
                },
              ]}
            />
          </>
        )}
      </Modal>

      {/* Modal tạo đơn */}
      <Modal
        title="Tạo đơn hàng"
        open={createOpen}
        onOk={handleCreateOrder}
        onCancel={() => setCreateOpen(false)}
        okText="Tạo đơn"
        width={650}
        destroyOnClose
      >
        <Form form={createForm} layout="vertical">
          <Form.Item name="customerId" label="Khách hàng" rules={[{ required: true, message: 'Chọn khách hàng' }]}>
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="Chọn khách hàng"
              options={customers.map((c) => ({ label: `${c.fullName} (${c.phone})`, value: c.id }))}
            />
          </Form.Item>

          <Form.Item
            name="paymentMethod"
            label="Phương thức thanh toán"
            initialValue="CASH"
            rules={[{ required: true, message: 'Chọn phương thức thanh toán' }]}
          >
            <Select
              options={[
                { value: 'CASH', label: 'Tiền mặt' },
                { value: 'TRANSFER', label: 'Chuyển khoản' },
                { value: 'CARD', label: 'Thẻ' },
              ]}
            />
          </Form.Item>

          <Form.List name="items">
            {(fields, { add, remove }) => (
              <>
                {fields.map((field, index) => (
                  <Space key={field.key} align="baseline" style={{ display: 'flex', marginBottom: 8 }}>
                    <Form.Item
                      name={[field.name, 'productId']}
                      rules={[{ required: true, message: 'Chọn sản phẩm' }]}
                      style={{ minWidth: 280 }}
                    >
                      <Select
                        showSearch
                        optionFilterProp="label"
                        placeholder="Chọn sản phẩm"
                        options={products.map((p) => ({
                          label: `${p.name} — ${formatCurrency(p.price)} (còn ${p.stock})`,
                          value: p.id,
                        }))}
                      />
                    </Form.Item>
                    <Form.Item
                      name={[field.name, 'quantity']}
                      rules={[{ required: true, message: 'SL' }]}
                      initialValue={1}
                    >
                      <InputNumber min={1} style={{ width: 80 }} />
                    </Form.Item>
                    {index > 0 && (
                      <Button icon={<DeleteOutlined />} onClick={() => remove(field.name)} danger size="small" />
                    )}
                  </Space>
                ))}
                <Button type="dashed" icon={<ShoppingCartOutlined />} onClick={() => add({ quantity: 1 })} block>
                  Thêm sản phẩm
                </Button>
              </>
            )}
          </Form.List>

          <Form.Item name="note" label="Ghi chú" style={{ marginTop: 12 }}>
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}