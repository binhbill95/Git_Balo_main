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
  Select,
} from 'antd'
import { PlusOutlined, SearchOutlined } from '@ant-design/icons'
import customerService from '../services/customer.service'
import { useAuth } from '../hooks/useAuth'
import { formatDate } from '../utils/format'

export default function Customers() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 })
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form] = Form.useForm()
  const { hasRole } = useAuth()

  const canManage = hasRole('ADMIN', 'SALES')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await customerService.list({
        page: pagination.page,
        limit: pagination.limit,
        search: search || undefined,
      })
      setItems(data.data)
      setPagination((p) => ({ ...p, total: data.meta.total }))
    } catch (error) {
      message.error(error.message)
    } finally {
      setLoading(false)
    }
  }, [pagination.page, pagination.limit, search])

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
    form.setFieldsValue({ ...record, gender: record.gender || undefined })
    setModalOpen(true)
  }

  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      const payload = {
        ...values,
        email: values.email || undefined,
        address: values.address || undefined,
        gender: values.gender || undefined,
      }
      if (editing) {
        await customerService.update(editing.id, payload)
        message.success('Cập nhật khách hàng thành công')
      } else {
        await customerService.create(payload)
        message.success('Tạo khách hàng thành công')
      }
      setModalOpen(false)
      load()
    } catch (error) {
      message.error(error.message)
    }
  }

  const handleDelete = async (id) => {
    try {
      await customerService.remove(id)
      message.success('Xóa khách hàng thành công')
      load()
    } catch (error) {
      message.error(error.message)
    }
  }

  const columns = useMemo(
    () => [
      { title: 'Họ tên', dataIndex: 'fullName', key: 'fullName' },
      { title: 'SĐT', dataIndex: 'phone', key: 'phone' },
      { title: 'Email', dataIndex: 'email', key: 'email', render: (v) => v || '—' },
      { title: 'Địa chỉ', dataIndex: 'address', key: 'address', render: (v) => v || '—' },
      {
        title: 'Giới tính',
        dataIndex: 'gender',
        key: 'gender',
        render: (v) => (v ? <Tag>{v}</Tag> : '—'),
      },
      { title: 'Ngày tạo', dataIndex: 'createdAt', key: 'createdAt', render: formatDate },
      {
        title: 'Thao tác',
        key: 'action',
        width: 160,
        render: (_, record) =>
          canManage ? (
            <Space>
              <Button size="small" onClick={() => openEdit(record)}>
                Sửa
              </Button>
              {hasRole('ADMIN') && (
                <Popconfirm title="Xóa khách hàng này?" onConfirm={() => handleDelete(record.id)}>
                  <Button size="small" danger>
                    Xóa
                  </Button>
                </Popconfirm>
              )}
            </Space>
          ) : null,
      },
    ],
    [canManage, hasRole]
  )

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>
          Quản lý khách hàng
        </Typography.Title>
        {canManage && (
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Thêm khách hàng
          </Button>
        )}
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Input
          placeholder="Tìm theo tên / SĐT / email..."
          prefix={<SearchOutlined />}
          style={{ width: 300 }}
          allowClear
          onChange={(e) => setSearch(e.target.value)}
        />
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
          showTotal: (t) => `Tổng ${t} khách hàng`,
        }}
        scroll={{ x: 800 }}
      />

      <Modal
        title={editing ? 'Sửa khách hàng' : 'Thêm khách hàng'}
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => setModalOpen(false)}
        okText={editing ? 'Lưu' : 'Tạo'}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="fullName" label="Họ tên" rules={[{ required: true, message: 'Nhập họ tên' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="Số điện thoại" rules={[{ required: true, message: 'Nhập SĐT' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email">
            <Input />
          </Form.Item>
          <Form.Item name="gender" label="Giới tính">
            <Select
              allowClear
              options={[
                { label: 'Nam', value: 'Male' },
                { label: 'Nữ', value: 'Female' },
                { label: 'Khác', value: 'Other' },
              ]}
            />
          </Form.Item>
          <Form.Item name="address" label="Địa chỉ">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}