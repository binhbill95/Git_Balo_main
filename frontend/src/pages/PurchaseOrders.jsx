import { useEffect, useState, useCallback, useMemo } from 'react'
import {
  Table,
  Button,
  Input,
  Select,
  Card,
  Modal,
  Form,
  Space,
  message,
  Typography,
  Tag,
  Descriptions,
  InputNumber,
  DatePicker,
  Divider,
} from 'antd'
import { PlusOutlined, SearchOutlined, EyeOutlined, DeleteOutlined } from '@ant-design/icons'
import purchaseOrderService from '../services/purchaseOrder.service'
import supplierService from '../services/supplier.service'
import productService from '../services/product.service'
import { useAuth } from '../hooks/useAuth'
import { formatCurrency, formatDateTime } from '../utils/format'

const PO_STATUS = {
  PENDING: { color: 'gold', label: 'Chờ duyệt' },
  APPROVED: { color: 'blue', label: 'Đã duyệt' },
  RECEIVED: { color: 'green', label: 'Đã nhập kho' },
  CANCELLED: { color: 'red', label: 'Đã hủy' },
}

const STATUS_OPTIONS = Object.keys(PO_STATUS).map((s) => ({
  value: s,
  label: PO_STATUS[s].label,
}))

export default function PurchaseOrders() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 })
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState(undefined)
  const [supplierFilter, setSupplierFilter] = useState(undefined)
  const [dateRange, setDateRange] = useState({ from: undefined, to: undefined })
  const [supplierOptions, setSupplierOptions] = useState([])
  const [productOptions, setProductOptions] = useState([])
  const [detail, setDetail] = useState(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form] = Form.useForm()
  const { hasRole } = useAuth()

  const canManage = hasRole('ADMIN', 'WAREHOUSE')
  const itemsValue = Form.useWatch('items', form) || []
  const totalAmount = itemsValue.reduce(
    (sum, it) => sum + (Number(it?.quantity) || 0) * (Number(it?.unitPrice) || 0),
    0
  )

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await purchaseOrderService.list({
        page: pagination.page,
        limit: pagination.limit,
        search: search || undefined,
        status: status || undefined,
        supplierId: supplierFilter || undefined,
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
  }, [pagination.page, pagination.limit, search, status, supplierFilter, dateRange.from, dateRange.to])

  useEffect(() => {
    load()
  }, [load])

  const loadOptions = useCallback(async () => {
    try {
      const [suppliers, products] = await Promise.all([
        supplierService.all(),
        productService.list({ limit: 100, isActive: true }),
      ])
      setSupplierOptions(
        suppliers.data.map((s) => ({ label: `${s.code} — ${s.name}`, value: s.id }))
      )
      setProductOptions(
        products.data.map((p) => ({
          label: `${p.name} (${p.sku}) — tồn ${p.stock}`,
          value: p.id,
        }))
      )
    } catch (error) {
      message.error(error.message)
    }
  }, [])

  const openCreate = () => {
    form.resetFields()
    form.setFieldsValue({
      items: [{ productId: undefined, quantity: 1, unitPrice: 0 }],
    })
    loadOptions()
    setModalOpen(true)
  }

  const showDetail = async (record) => {
    try {
      const data = await purchaseOrderService.getById(record.id)
      setDetail(data.data)
      setDetailOpen(true)
    } catch (error) {
      message.error(error.message)
    }
  }

  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      setSubmitting(true)
      await purchaseOrderService.create({
        supplierId: values.supplierId,
        note: values.note || undefined,
        items: values.items.map((it) => ({
          productId: it.productId,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
        })),
      })
      message.success('Tạo đơn nhập hàng thành công')
      setModalOpen(false)
      load()
    } catch (error) {
      if (error.errorFields) return
      message.error(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const changeStatus = (record, newStatus) => {
    const doUpdate = async () => {
      try {
        await purchaseOrderService.updateStatus(record.id, newStatus)
        message.success('Cập nhật trạng thái đơn nhập thành công')
        load()
      } catch (error) {
        message.error(error.message)
        load()
      }
    }
    if (newStatus === 'RECEIVED') {
      Modal.confirm({
        title: 'Xác nhận nhập kho?',
        content: 'Hàng sẽ được cộng vào tồn kho, cập nhật giá vốn và KHÔNG THỂ hoàn tác.',
        okText: 'Nhập kho',
        cancelText: 'Không',
        onOk: doUpdate,
      })
    } else if (newStatus === 'CANCELLED') {
      Modal.confirm({
        title: 'Xác nhận hủy đơn nhập?',
        content: 'Hủy đơn nhập hàng. Tồn kho không bị ảnh hưởng.',
        okText: 'Hủy đơn',
        okButtonProps: { danger: true },
        cancelText: 'Không',
        onOk: doUpdate,
      })
    } else {
      doUpdate()
    }
  }

  const columns = useMemo(
    () => [
      {
        title: 'Mã đơn nhập',
        dataIndex: 'poCode',
        key: 'poCode',
        width: 150,
        render: (v) => <Tag color="blue">{v}</Tag>,
      },
      {
        title: 'Nhà cung cấp',
        key: 'supplier',
        width: 190,
        render: (_, r) => (
          <span>
            {r.supplier?.name}
            <br />
            <small style={{ color: '#999' }}>{r.supplier?.code}</small>
          </span>
        ),
      },
      {
        title: 'Người tạo',
        key: 'user',
        width: 150,
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
        width: 160,
        render: (s, r) =>
          canManage ? (
            <Select
              size="small"
              value={s}
              style={{ width: 145 }}
              options={STATUS_OPTIONS}
              onChange={(v) => changeStatus(r, v)}
              labelRender={(o) => (
                <Tag color={PO_STATUS[o.value]?.color} style={{ margin: 0 }}>
                  {PO_STATUS[o.value]?.label}
                </Tag>
              )}
            />
          ) : (
            <Tag color={PO_STATUS[s]?.color}>{PO_STATUS[s]?.label || s}</Tag>
          ),
      },
      { title: 'Ngày tạo', dataIndex: 'createdAt', key: 'createdAt', width: 150, render: formatDateTime },
      {
        title: 'Thao tác',
        key: 'action',
        width: 110,
        render: (_, r) => (
          <Button size="small" icon={<EyeOutlined />} onClick={() => showDetail(r)}>
            Chi tiết
          </Button>
        ),
      },
    ],
    [canManage]
  )

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>
          Quản lý đơn nhập hàng
        </Typography.Title>
        {canManage && (
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Tạo đơn nhập
          </Button>
        )}
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Input
            placeholder="Tìm mã đơn / nhà cung cấp..."
            prefix={<SearchOutlined />}
            style={{ width: 240 }}
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
          <Select
            placeholder="Nhà cung cấp"
            style={{ width: 220 }}
            allowClear
            showSearch
            optionFilterProp="label"
            value={supplierFilter}
            onChange={setSupplierFilter}
            options={supplierOptions}
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
          showTotal: (t) => `Tổng ${t} đơn nhập`,
        }}
        scroll={{ x: 1100 }}
      />

      <Modal
        title={`Chi tiết đơn nhập ${detail?.poCode || ''}`}
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={null}
        width={760}
      >
        {detail && (
          <>
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="Mã đơn nhập">
                <Tag color="blue">{detail.poCode}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <Tag color={PO_STATUS[detail.status]?.color}>
                  {PO_STATUS[detail.status]?.label || detail.status}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Nhà cung cấp" span={2}>
                {detail.supplier?.name}
                {detail.supplier?.address ? ` — ${detail.supplier.address}` : ''}
              </Descriptions.Item>
              <Descriptions.Item label="Người tạo">{detail.user?.fullName}</Descriptions.Item>
              <Descriptions.Item label="Người nhập kho">
                {detail.status === 'RECEIVED' ? `${detail.user?.fullName}` : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày tạo">{formatDateTime(detail.createdAt)}</Descriptions.Item>
              <Descriptions.Item label="Ngày nhập kho">
                {detail.receivedAt ? formatDateTime(detail.receivedAt) : '—'}
              </Descriptions.Item>
            </Descriptions>

            <Divider style={{ margin: '16px 0' }} />
            <Typography.Text strong>Sản phẩm nhập</Typography.Text>
            <Table
              rowKey="id"
              size="small"
              style={{ marginTop: 8 }}
              pagination={false}
              dataSource={detail.items || []}
              columns={[
                { title: 'Sản phẩm', key: 'product', render: (_, it) => it.product?.name || '—' },
                { title: 'SKU', key: 'sku', width: 110, render: (_, it) => it.product?.sku || '—' },
                { title: 'Số lượng', dataIndex: 'quantity', key: 'quantity', width: 100 },
                { title: 'Giá nhập', dataIndex: 'unitPrice', key: 'unitPrice', width: 120, render: formatCurrency },
                {
                  title: 'Thành tiền',
                  key: 'lineTotal',
                  width: 140,
                  render: (_, it) => formatCurrency(Number(it.unitPrice) * Number(it.quantity)),
                },
              ]}
            />
            <div style={{ textAlign: 'right', marginTop: 12 }}>
              <Typography.Text strong>Tổng tiền: {formatCurrency(detail.totalAmount)}</Typography.Text>
            </div>

            {detail.note && (
              <>
                <Divider />
                <Typography.Text type="secondary">Ghi chú: {detail.note}</Typography.Text>
              </>
            )}
          </>
        )}
      </Modal>

      <Modal
        title="Tạo đơn nhập hàng"
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => setModalOpen(false)}
        okText="Tạo đơn nhập"
        confirmLoading={submitting}
        width={720}
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Space style={{ display: 'flex' }} size={12}>
            <Form.Item
              name="supplierId"
              label="Nhà cung cấp"
              rules={[{ required: true, message: 'Chọn nhà cung cấp' }]}
              style={{ flex: 3 }}
            >
              <Select
                showSearch
                optionFilterProp="label"
                placeholder="Chọn nhà cung cấp"
                options={supplierOptions}
              />
            </Form.Item>
            <Form.Item name="note" label="Ghi chú" style={{ flex: 2 }}>
              <Input placeholder="Ghi chú đơn nhập (nếu có)" />
            </Form.Item>
          </Space>

          <Form.Item label="Danh sách sản phẩm" required>
            <Form.List
              name="items"
              rules={[
                {
                  validator: async (_, values) => {
                    if (!values || values.length < 1) {
                      return Promise.reject(new Error('Cần ít nhất 1 sản phẩm'))
                    }
                  },
                },
              ]}
            >
              {(fields, { add, remove }) => (
                <>
                  <Table
                    size="small"
                    pagination={false}
                    dataSource={fields}
                    rowKey="key"
                    columns={[
                      {
                        title: 'Sản phẩm',
                        key: 'product',
                        width: 280,
                        render: (_, field) => (
                          <Form.Item
                            name={[field.name, 'productId']}
                            rules={[{ required: true, message: 'Chọn sản phẩm' }]}
                            style={{ margin: 0 }}
                          >
                            <Select
                              showSearch
                              optionFilterProp="label"
                              placeholder="Chọn sản phẩm"
                              options={productOptions}
                            />
                          </Form.Item>
                        ),
                      },
                      {
                        title: 'Số lượng',
                        key: 'quantity',
                        width: 120,
                        render: (_, field) => (
                          <Form.Item
                            name={[field.name, 'quantity']}
                            rules={[{ required: true, message: 'SL' }]}
                            style={{ margin: 0 }}
                          >
                            <InputNumber min={1} style={{ width: '100%' }} placeholder="SL" />
                          </Form.Item>
                        ),
                      },
                      {
                        title: 'Giá nhập (đ)',
                        key: 'unitPrice',
                        width: 150,
                        render: (_, field) => (
                          <Form.Item
                            name={[field.name, 'unitPrice']}
                            rules={[{ required: true, message: 'Giá' }]}
                            style={{ margin: 0 }}
                          >
                            <InputNumber
                              min={0}
                              style={{ width: '100%' }}
                              formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            />
                          </Form.Item>
                        ),
                      },
                      {
                        title: '',
                        key: 'remove',
                        width: 50,
                        render: (_, field) => (
                          <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            disabled={fields.length <= 1}
                            onClick={() => remove(field.name)}
                          />
                        ),
                      },
                    ]}
                  />
                  <Button block type="dashed" onClick={() => add({ quantity: 1, unitPrice: 0 })} style={{ marginTop: 8 }}>
                    + Thêm sản phẩm
                  </Button>
                </>
              )}
            </Form.List>
          </Form.Item>

          <div style={{ textAlign: 'right' }}>
            <Typography.Text strong>Tổng tiền: {formatCurrency(totalAmount)}</Typography.Text>
          </div>
        </Form>
      </Modal>
    </div>
  )
}