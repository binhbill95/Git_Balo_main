import { useEffect, useState, useCallback, useMemo } from 'react'
import {
  Table,
  Button,
  Input,
  Card,
  Modal,
  Form,
  Space,
  Popconfirm,
  message,
  Typography,
  Tag,
  Switch,
} from 'antd'
import { PlusOutlined, SearchOutlined, EditOutlined } from '@ant-design/icons'
import supplierService from '../services/supplier.service'
import { useAuth } from '../hooks/useAuth'

export default function Suppliers() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form] = Form.useForm()
  const { hasRole } = useAuth()

  const canWrite = hasRole('ADMIN', 'WAREHOUSE')
  const canDelete = hasRole('ADMIN')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await supplierService.list({ limit: 100, search: search || undefined })
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
    form.setFieldsValue({
      code: record.code,
      name: record.name,
      phone: record.phone,
      email: record.email,
      address: record.address,
      taxCode: record.taxCode,
      note: record.note,
      isActive: record.isActive,
    })
    setModalOpen(true)
  }

  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      const payload = {
        code: values.code,
        name: values.name,
        phone: values.phone || undefined,
        email: values.email || undefined,
        address: values.address || undefined,
        taxCode: values.taxCode || undefined,
        note: values.note || undefined,
        isActive: values.isActive ?? true,
      }
      if (editing) {
        await supplierService.update(editing.id, payload)
        message.success('Cập nhật nhà cung cấp thành công')
      } else {
        await supplierService.create(payload)
        message.success('Tạo nhà cung cấp thành công')
      }
      setModalOpen(false)
      load()
    } catch (error) {
      message.error(error.message)
    }
  }

  const handleDelete = async (id) => {
    try {
      await supplierService.remove(id)
      message.success('Xóa nhà cung cấp thành công')
      load()
    } catch (error) {
      message.error(error.message)
    }
  }

  const handleToggleActive = async (record, checked) => {
    try {
      await supplierService.update(record.id, { isActive: checked })
      message.success(checked ? 'Nhà cung cấp đã kích hoạt' : 'Nhà cung cấp đã tắt hoạt động')
      load()
    } catch (error) {
      message.error(error.message)
    }
  }

  const columns = useMemo(
    () => [
      { title: 'Mã', dataIndex: 'code', key: 'code', width: 110, render: (v) => <Tag color="geekblue">{v}</Tag> },
      { title: 'Tên nhà cung cấp', dataIndex: 'name', key: 'name' },
      { title: 'SĐT', dataIndex: 'phone', key: 'phone', render: (v) => v || '—' },
      { title: 'Email', dataIndex: 'email', key: 'email', render: (v) => v || '—' },
      { title: 'Địa chỉ', dataIndex: 'address', key: 'address', render: (v) => v || '—' },
      {
        title: 'MST',
        dataIndex: 'taxCode',
        key: 'taxCode',
        width: 120,
        render: (v) => v || '—',
      },
      {
        title: 'Đơn nhập',
        dataIndex: ['_count', 'purchaseOrders'],
        key: 'purchaseOrders',
        width: 100,
        render: (v) => v ?? 0,
      },
      {
        title: 'Trạng thái',
        dataIndex: 'isActive',
        key: 'isActive',
        width: 120,
        render: (v, record) =>
          canWrite ? (
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
        width: 160,
        render: (_, record) =>
          canWrite ? (
            <Space>
              <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(record)}>
                Sửa
              </Button>
              {canDelete && (
                <Popconfirm
                  title="Xóa nhà cung cấp này?"
                  description="Không thể xóa nhà cung cấp đã có đơn nhập hàng. Nên tắt hoạt động thay vì xóa."
                  okText="Xóa"
                  okButtonProps={{ danger: true }}
                  cancelText="Không"
                  onConfirm={() => handleDelete(record.id)}
                >
                  <Button size="small" danger>
                    Xóa
                  </Button>
                </Popconfirm>
              )}
            </Space>
          ) : null,
      },
    ],
    [canWrite, canDelete]
  )

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>
          Quản lý nhà cung cấp
        </Typography.Title>
        {canWrite && (
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Thêm nhà cung cấp
          </Button>
        )}
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Input
            placeholder="Tìm theo mã / tên / SĐT / email..."
            prefix={<SearchOutlined />}
            style={{ width: 280 }}
            allowClear
            onChange={(e) => setSearch(e.target.value)}
          />
        </Space>
      </Card>

      <Table rowKey="id" columns={columns} dataSource={items} loading={loading} pagination={false} scroll={{ x: 1000 }} />

      <Modal
        title={editing ? 'Sửa nhà cung cấp' : 'Thêm nhà cung cấp'}
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => setModalOpen(false)}
        okText={editing ? 'Lưu' : 'Tạo'}
        destroyOnHidden
        width={560}
      >
        <Form form={form} layout="vertical" initialValues={{ isActive: true }}>
          <Space style={{ display: 'flex' }} size={12}>
            <Form.Item
              name="code"
              label="Mã nhà cung cấp"
              rules={[{ required: true, message: 'Nhập mã nhà cung cấp' }]}
              style={{ flex: 1 }}
            >
              <Input placeholder="VD: NCC001" />
            </Form.Item>
            <Form.Item
              name="name"
              label="Tên nhà cung cấp"
              rules={[{ required: true, message: 'Nhập tên nhà cung cấp' }]}
              style={{ flex: 2 }}
            >
              <Input />
            </Form.Item>
          </Space>
          <Space style={{ display: 'flex' }} size={12}>
            <Form.Item name="phone" label="Số điện thoại" style={{ flex: 1 }}>
              <Input />
            </Form.Item>
            <Form.Item name="email" label="Email" style={{ flex: 1 }}>
              <Input />
            </Form.Item>
          </Space>
          <Form.Item name="address" label="Địa chỉ">
            <Input />
          </Form.Item>
          <Space style={{ display: 'flex' }} size={12}>
            <Form.Item name="taxCode" label="Mã số thuế" style={{ flex: 1 }}>
              <Input />
            </Form.Item>
            <Form.Item name="note" label="Ghi chú" style={{ flex: 1 }}>
              <Input />
            </Form.Item>
          </Space>
          <Form.Item name="isActive" label="Trạng thái" valuePropName="checked">
            <Switch checkedChildren="Hoạt động" unCheckedChildren="Tắt" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}