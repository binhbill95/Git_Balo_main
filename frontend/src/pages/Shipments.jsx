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
  Tabs,
  Switch,
  Popconfirm,
  DatePicker,
  Divider,
} from 'antd'
import {
  PlusOutlined,
  SearchOutlined,
  EyeOutlined,
  EditOutlined,
} from '@ant-design/icons'
import shipmentService from '../services/shipment.service'
import orderService from '../services/order.service'
import deliveryPartnerService from '../services/deliveryPartner.service'
import { useAuth } from '../hooks/useAuth'
import { formatCurrency, formatDateTime } from '../utils/format'

const SHIPMENT_STATUS = {
  PENDING_PICKUP: { color: 'gold', label: 'Chờ lấy hàng' },
  IN_TRANSIT: { color: 'blue', label: 'Đang giao' },
  DELIVERED: { color: 'green', label: 'Đã giao' },
  FAILED: { color: 'red', label: 'Giao thất bại' },
}

const STATUS_OPTIONS = Object.keys(SHIPMENT_STATUS).map((s) => ({
  value: s,
  label: SHIPMENT_STATUS[s].label,
}))

function ShipmentTab() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 })
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState(undefined)
  const [partnerFilter, setPartnerFilter] = useState(undefined)
  const [dateRange, setDateRange] = useState({ from: undefined, to: undefined })
  const [partnerOptions, setPartnerOptions] = useState([])
  const [orderOptions, setOrderOptions] = useState([])
  const [detail, setDetail] = useState(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form] = Form.useForm()
  const { hasRole } = useAuth()

  const canManage = hasRole('ADMIN', 'WAREHOUSE')
  const canCreate = hasRole('ADMIN', 'SALES')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await shipmentService.list({
        page: pagination.page,
        limit: pagination.limit,
        search: search || undefined,
        status: status || undefined,
        partnerId: partnerFilter || undefined,
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
  }, [pagination.page, pagination.limit, search, status, partnerFilter, dateRange.from, dateRange.to])

  useEffect(() => {
    load()
  }, [load])

  const loadPartnerOptions = useCallback(async () => {
    try {
      const data = await deliveryPartnerService.listAll({ isActive: true })
      setPartnerOptions(data.data.map((p) => ({ label: `${p.name} (${p.code})`, value: p.id })))
    } catch (error) {
      message.error(error.message)
    }
  }, [])

  useEffect(() => {
    loadPartnerOptions()
  }, [loadPartnerOptions])

  const loadOrderOptions = useCallback(async () => {
    try {
      const [orders, shipments] = await Promise.all([
        orderService.list({ limit: 100 }),
        shipmentService.list({ limit: 100 }),
      ])
      const busyOrderIds = new Set(
        shipments.data
          .filter((s) => !['DELIVERED', 'FAILED'].includes(s.status))
          .map((s) => s.orderId)
      )
      const options = orders.data
        .filter(
          (o) => !['CANCELLED', 'COMPLETED'].includes(o.status) && !busyOrderIds.has(o.id)
        )
        .map((o) => ({
          value: o.id,
          label: `${o.orderCode} — ${o.customer?.fullName} (${formatCurrency(o.totalAmount)})`,
        }))
      setOrderOptions(options)
    } catch (error) {
      message.error(error.message)
    }
  }, [])

  const openCreate = () => {
    setEditing(null)
    form.resetFields()
    form.setFieldsValue({ shippingFee: 0 })
    loadOrderOptions()
    loadPartnerOptions()
    setModalOpen(true)
  }

  const openEdit = (record) => {
    setEditing(record)
    form.setFieldsValue({
      partnerId: record.partnerId,
      trackingCode: record.trackingCode,
      recipientName: record.recipientName,
      recipientPhone: record.recipientPhone,
      recipientAddress: record.recipientAddress,
      shippingFee: Number(record.shippingFee),
      note: record.note,
    })
    loadPartnerOptions()
    setModalOpen(true)
  }

  const showDetail = async (record) => {
    try {
      const data = await shipmentService.getById(record.id)
      setDetail(data.data)
      setDetailOpen(true)
    } catch (error) {
      message.error(error.message)
    }
  }

  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      const payload = {
        partnerId: values.partnerId,
        trackingCode: values.trackingCode || undefined,
        recipientName: values.recipientName || undefined,
        recipientPhone: values.recipientPhone || undefined,
        recipientAddress: values.recipientAddress || undefined,
        shippingFee: values.shippingFee ?? 0,
        note: values.note || undefined,
      }
      if (editing) {
        await shipmentService.update(editing.id, payload)
        message.success('Cập nhật vận đơn thành công')
      } else {
        await shipmentService.create({ ...payload, orderId: values.orderId })
        message.success('Tạo vận đơn thành công')
      }
      setModalOpen(false)
      load()
    } catch (error) {
      message.error(error.message)
    }
  }

  const changeStatus = (record, newStatus) => {
    const doUpdate = async () => {
      try {
        await shipmentService.updateStatus(record.id, newStatus)
        message.success('Cập nhật trạng thái vận đơn thành công')
        load()
      } catch (error) {
        message.error(error.message)
        load()
      }
    }
    if (newStatus === 'DELIVERED' || newStatus === 'FAILED') {
      Modal.confirm({
        title:
          newStatus === 'DELIVERED'
            ? 'Xác nhận giao hàng thành công?'
            : 'Xác nhận giao hàng thất bại?',
        content: 'Trạng thái này sẽ được đồng bộ sang đơn hàng và không thể hoàn tác.',
        okText: 'Xác nhận',
        cancelText: 'Không',
        okButtonProps: { danger: newStatus === 'FAILED' },
        onOk: doUpdate,
      })
    } else {
      doUpdate()
    }
  }

  const columns = useMemo(
    () => [
      {
        title: 'Mã vận đơn',
        dataIndex: 'shipmentCode',
        key: 'shipmentCode',
        width: 130,
        render: (v) => <Tag color="blue">{v}</Tag>,
      },
      {
        title: 'Đơn hàng',
        key: 'order',
        width: 120,
        render: (_, r) => <Tag>{r.order?.orderCode || '—'}</Tag>,
      },
      {
        title: 'Khách nhận',
        key: 'recipient',
        render: (_, r) => (
          <span>
            {r.recipientName}
            <br />
            <small style={{ color: '#999' }}>{r.recipientPhone}</small>
          </span>
        ),
      },
      {
        title: 'Đối tác',
        key: 'partner',
        render: (_, r) => r.partner?.name || '—',
      },
      {
        title: 'Tracking',
        dataIndex: 'trackingCode',
        key: 'trackingCode',
        width: 120,
        render: (v) => v || '—',
      },
      {
        title: 'Phí ship',
        dataIndex: 'shippingFee',
        key: 'shippingFee',
        width: 110,
        render: (v) => formatCurrency(v),
      },
      {
        title: 'Trạng thái',
        dataIndex: 'status',
        key: 'status',
        width: 150,
        render: (s, r) =>
          canManage ? (
            <Select
              size="small"
              value={s}
              style={{ width: 135 }}
              options={STATUS_OPTIONS}
              onChange={(v) => changeStatus(r, v)}
              labelRender={(o) => (
                <Tag color={SHIPMENT_STATUS[o.value]?.color} style={{ margin: 0 }}>
                  {SHIPMENT_STATUS[o.value]?.label}
                </Tag>
              )}
            />
          ) : (
            <Tag color={SHIPMENT_STATUS[s]?.color}>{SHIPMENT_STATUS[s]?.label || s}</Tag>
          ),
      },
      { title: 'Ngày tạo', dataIndex: 'createdAt', key: 'createdAt', width: 150, render: formatDateTime },
      {
        title: 'Thao tác',
        key: 'action',
        width: 160,
        render: (_, r) => (
          <Space>
            <Button size="small" icon={<EyeOutlined />} onClick={() => showDetail(r)}>
              Chi tiết
            </Button>
            {canManage && !['DELIVERED', 'FAILED'].includes(r.status) && (
              <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)}>
                Sửa
              </Button>
            )}
          </Space>
        ),
      },
    ],
    [canManage]
  )

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>
          Quản lý vận đơn
        </Typography.Title>
        {canCreate && (
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Tạo vận đơn
          </Button>
        )}
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Input
            placeholder="Tìm mã vận đơn / tracking / SĐT..."
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
          <Select
            placeholder="Đối tác giao hàng"
            style={{ width: 200 }}
            allowClear
            showSearch
            optionFilterProp="label"
            value={partnerFilter}
            onChange={setPartnerFilter}
            options={partnerOptions}
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
          showTotal: (t) => `Tổng ${t} vận đơn`,
        }}
        scroll={{ x: 1100 }}
      />

      <Modal
        title={`Chi tiết vận đơn ${detail?.shipmentCode || ''}`}
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={null}
        width={720}
      >
        {detail && (
          <>
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="Mã vận đơn">
                <Tag color="blue">{detail.shipmentCode}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Đơn hàng">{detail.order?.orderCode}</Descriptions.Item>
              <Descriptions.Item label="Đối tác giao hàng">{detail.partner?.name}</Descriptions.Item>
              <Descriptions.Item label="Mã tracking">{detail.trackingCode || '—'}</Descriptions.Item>
              <Descriptions.Item label="Người nhận">{detail.recipientName}</Descriptions.Item>
              <Descriptions.Item label="SĐT">{detail.recipientPhone}</Descriptions.Item>
              <Descriptions.Item label="Địa chỉ" span={2}>
                {detail.recipientAddress}
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <Tag color={SHIPMENT_STATUS[detail.status]?.color}>
                  {SHIPMENT_STATUS[detail.status]?.label || detail.status}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Phí vận chuyển">
                <b>{formatCurrency(detail.shippingFee)}</b>
              </Descriptions.Item>
              <Descriptions.Item label="Ngày tạo">{formatDateTime(detail.createdAt)}</Descriptions.Item>
              <Descriptions.Item label="Ngày giao">
                {detail.deliveredAt ? formatDateTime(detail.deliveredAt) : '—'}
              </Descriptions.Item>
            </Descriptions>
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
        title={editing ? 'Sửa vận đơn' : 'Tạo vận đơn'}
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => setModalOpen(false)}
        okText={editing ? 'Lưu' : 'Tạo vận đơn'}
        width={600}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          {!editing && (
            <Form.Item
              name="orderId"
              label="Đơn hàng"
              rules={[{ required: true, message: 'Chọn đơn hàng' }]}
            >
              <Select
                showSearch
                optionFilterProp="label"
                placeholder="Chọn đơn hàng chưa có vận đơn"
                options={orderOptions}
              />
            </Form.Item>
          )}
          <Form.Item
            name="partnerId"
            label="Đối tác giao hàng"
            rules={[{ required: true, message: 'Chọn đối tác giao hàng' }]}
          >
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="Chọn đơn vị giao hàng"
              options={partnerOptions}
            />
          </Form.Item>
          <Form.Item name="trackingCode" label="Mã tracking">
            <Input placeholder="Mã vận đơn của đối tác (nếu có)" />
          </Form.Item>
          <Space style={{ display: 'flex' }} size={12}>
            <Form.Item
              name="recipientName"
              label="Người nhận"
              rules={[{ required: true, message: 'Nhập người nhận' }]}
              style={{ flex: 1 }}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="recipientPhone"
              label="SĐT người nhận"
              rules={[{ required: true, message: 'Nhập SĐT người nhận' }]}
              style={{ flex: 1 }}
            >
              <Input />
            </Form.Item>
          </Space>
          <Form.Item name="recipientAddress" label="Địa chỉ giao">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Space style={{ display: 'flex' }} size={12}>
            <Form.Item name="shippingFee" label="Phí vận chuyển (đ)" style={{ flex: 1 }}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="note" label="Ghi chú" style={{ flex: 2 }}>
              <Input placeholder="Ghi chú giao hàng (nếu có)" />
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </div>
  )
}

function PartnerTab() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form] = Form.useForm()
  const { hasRole } = useAuth()
  const isAdmin = hasRole('ADMIN')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await deliveryPartnerService.list({ limit: 100, search: search || undefined })
      setItems(data.data)
    } catch (error) {
      message.error(error.message)
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    load()
  }, [load])

  const openCreate = () => {
    setEditing(null)
    form.resetFields()
    setModalOpen(true)
  }

  const openEdit = (record) => {
    setEditing(record)
    form.setFieldsValue(record)
    setModalOpen(true)
  }

  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      const payload = {
        code: values.code,
        name: values.name,
        phone: values.phone || undefined,
        website: values.website || undefined,
        isActive: values.isActive ?? true,
      }
      if (editing) {
        await deliveryPartnerService.update(editing.id, payload)
        message.success('Cập nhật đối tác thành công')
      } else {
        await deliveryPartnerService.create(payload)
        message.success('Tạo đối tác thành công')
      }
      setModalOpen(false)
      load()
    } catch (error) {
      message.error(error.message)
    }
  }

  const handleDelete = async (id) => {
    try {
      await deliveryPartnerService.remove(id)
      message.success('Xóa đối tác thành công')
      load()
    } catch (error) {
      message.error(error.message)
    }
  }

  const handleToggleActive = async (record, checked) => {
    try {
      await deliveryPartnerService.update(record.id, { isActive: checked })
      message.success(checked ? 'Đối tác đã kích hoạt' : 'Đối tác đã tắt hoạt động')
      load()
    } catch (error) {
      message.error(error.message)
    }
  }

  const columns = useMemo(
    () => [
      { title: 'Mã', dataIndex: 'code', key: 'code', width: 110, render: (v) => <Tag color="geekblue">{v}</Tag> },
      { title: 'Tên đối tác', dataIndex: 'name', key: 'name' },
      { title: 'SĐT', dataIndex: 'phone', key: 'phone' },
      { title: 'Website', dataIndex: 'website', key: 'website', render: (v) => v || '—' },
      {
        title: 'Số vận đơn',
        dataIndex: ['_count', 'shipments'],
        key: 'shipments',
        width: 110,
        render: (v) => v ?? 0,
      },
      {
        title: 'Trạng thái',
        dataIndex: 'isActive',
        key: 'isActive',
        width: 120,
        render: (v, record) =>
          isAdmin ? (
            <Switch
              checked={v}
              size="small"
              checkedChildren="Bật"
              unCheckedChildren="Tắt"
              onChange={(checked) => handleToggleActive(record, checked)}
            />
          ) : v ? (
            <Tag color="green">Hoạt động</Tag>
          ) : (
            <Tag>Tắt</Tag>
          ),
      },
      {
        title: 'Thao tác',
        key: 'action',
        width: 150,
        render: (_, record) =>
          isAdmin ? (
            <Space>
              <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(record)}>
                Sửa
              </Button>
              <Popconfirm
                title="Xóa đối tác này?"
                description="Không thể xóa đối tác đang có vận đơn. Nên tắt hoạt động thay vì xóa."
                okText="Xóa"
                okButtonProps={{ danger: true }}
                cancelText="Không"
                onConfirm={() => handleDelete(record.id)}
              >
                <Button size="small" danger>
                  Xóa
                </Button>
              </Popconfirm>
            </Space>
          ) : null,
      },
    ],
    [isAdmin]
  )

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>
          Đối tác giao hàng
        </Typography.Title>
        {isAdmin && (
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Thêm đối tác
          </Button>
        )}
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Input
            placeholder="Tìm theo mã / tên / SĐT..."
            prefix={<SearchOutlined />}
            style={{ width: 250 }}
            allowClear
            onChange={(e) => setSearch(e.target.value)}
          />
        </Space>
      </Card>

      <Table rowKey="id" columns={columns} dataSource={items} loading={loading} pagination={false} scroll={{ x: 800 }} />

      <Modal
        title={editing ? 'Sửa đối tác giao hàng' : 'Thêm đối tác giao hàng'}
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => setModalOpen(false)}
        okText={editing ? 'Lưu' : 'Tạo'}
        destroyOnClose
      >
        <Form form={form} layout="vertical" initialValues={{ isActive: true }}>
          <Form.Item name="code" label="Mã đối tác" rules={[{ required: true, message: 'Nhập mã đối tác' }]}>
            <Input placeholder="VD: GHN, GHTK, VTP..." />
          </Form.Item>
          <Form.Item name="name" label="Tên đối tác" rules={[{ required: true, message: 'Nhập tên đối tác' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="Số điện thoại">
            <Input />
          </Form.Item>
          <Form.Item name="website" label="Website">
            <Input placeholder="https://..." />
          </Form.Item>
          <Form.Item name="isActive" label="Trạng thái" valuePropName="checked">
            <Switch checkedChildren="Hoạt động" unCheckedChildren="Tắt" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default function Shipments() {
  return (
    <div>
      <Tabs
        defaultActiveKey="shipments"
        items={[
          { key: 'shipments', label: 'Vận đơn', children: <ShipmentTab /> },
          { key: 'partners', label: 'Đối tác giao hàng', children: <PartnerTab /> },
        ]}
      />
    </div>
  )
}