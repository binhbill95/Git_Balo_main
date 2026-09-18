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
  InputNumber,
} from 'antd'
import { PlusOutlined, SearchOutlined } from '@ant-design/icons'
import userService from '../services/user.service'
import { useAuth } from '../hooks/useAuth'
import { formatDate } from '../utils/format'

const ROLE_COLORS = {
  ADMIN: 'red',
  SALES: 'green',
  WAREHOUSE: 'orange',
  MANAGER: 'purple',
}

export default function Accounts() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 })
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form] = Form.useForm()
  const { user } = useAuth()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await userService.list({ page: pagination.page, limit: pagination.limit, search: search || undefined })
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
    form.setFieldsValue({
      fullName: record.fullName,
      email: record.email,
      role: record.role,
    })
    setModalOpen(true)
  }

  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      if (editing) {
        await userService.update(editing.id, values)
        message.success('Cập nhật tài khoản thành công')
      } else {
        await userService.create(values)
        message.success('Tạo tài khoản thành công')
      }
      setModalOpen(false)
      load()
    } catch (error) {
      message.error(error.message)
    }
  }

  const handleDeactivate = async (id) => {
    try {
      await userService.remove(id)
      message.success('Vô hiệu hóa tài khoản thành công')
      load()
    } catch (error) {
      message.error(error.message)
    }
  }

  const columns = useMemo(
    () => [
      { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
      { title: 'Tên đăng nhập', dataIndex: 'username', key: 'username', render: (v) => <b>{v}</b> },
      { title: 'Họ tên', dataIndex: 'fullName', key: 'fullName' },
      { title: 'Email', dataIndex: 'email', key: 'email' },
      {
        title: 'Vai trò',
        dataIndex: 'role',
        key: 'role',
        width: 130,
        render: (v) => <Tag color={ROLE_COLORS[v]}>{v}</Tag>,
      },
      {
        title: 'Trạng thái',
        dataIndex: 'isActive',
        key: 'isActive',
        width: 110,
        render: (v) => (v ? <Tag color="green">Hoạt động</Tag> : <Tag color="default">Khóa</Tag>),
      },
      { title: 'Ngày tạo', dataIndex: 'createdAt', key: 'createdAt', render: formatDate },
      {
        title: 'Thao tác',
        key: 'action',
        width: 160,
        render: (_, r) => (
          <Space>
            <Button size="small" onClick={() => openEdit(r)}>
              Sửa
            </Button>
            {r.username !== 'admin' && r.id !== user?.id && (
              <Popconfirm title="Vô hiệu hóa tài khoản này?" onConfirm={() => handleDeactivate(r.id)}>
                <Button size="small" danger>
                  Khóa
                </Button>
              </Popconfirm>
            )}
          </Space>
        ),
      },
    ],
    [user]
  )

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>
          Quản lý tài khoản
        </Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Thêm tài khoản
        </Button>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Input
          placeholder="Tìm theo tên / email..."
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
        }}
        scroll={{ x: 900 }}
      />

      <Modal
        title={editing ? 'Sửa tài khoản' : 'Thêm tài khoản'}
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => setModalOpen(false)}
        okText={editing ? 'Lưu' : 'Tạo'}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          {!editing && (
            <>
              <Form.Item name="username" label="Tên đăng nhập" rules={[{ required: true, message: 'Nhập tên đăng nhập' }]}>
                <Input />
              </Form.Item>
              <Form.Item name="password" label="Mật khẩu" rules={[{ required: true, min: 6, message: 'Tối thiểu 6 ký tự' }]}>
                <Input.Password />
              </Form.Item>
            </>
          )}
          <Form.Item name="fullName" label="Họ tên" rules={[{ required: true, message: 'Nhập họ tên' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email', message: 'Email không hợp lệ' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="role" label="Vai trò" rules={[{ required: true, message: 'Chọn vai trò' }]}>
            <Select
              options={[
                { label: 'Quản trị viên (ADMIN)', value: 'ADMIN' },
                { label: 'Nhân viên bán hàng (SALES)', value: 'SALES' },
                { label: 'Nhân viên kho (WAREHOUSE)', value: 'WAREHOUSE' },
                { label: 'Quản lý (MANAGER)', value: 'MANAGER' },
              ]}
            />
          </Form.Item>
          {editing && (
            <Form.Item name="password" label="Mật khẩu mới (bỏ trống nếu giữ nguyên)">
              <Input.Password placeholder="Để trống nếu không đổi" />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  )
}