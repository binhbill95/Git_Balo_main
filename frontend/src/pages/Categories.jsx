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
import { PlusOutlined, SearchOutlined } from '@ant-design/icons'
import categoryService from '../services/category.service'
import { useAuth } from '../hooks/useAuth'

export default function Categories() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form] = Form.useForm()
  const { hasRole } = useAuth()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await categoryService.list({ limit: 100, search: search || undefined })
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
        name: values.name,
        description: values.description || undefined,
        isActive: values.isActive ?? true,
      }
      if (editing) {
        await categoryService.update(editing.id, payload)
        message.success('Cập nhật danh mục thành công')
      } else {
        await categoryService.create(payload)
        message.success('Tạo danh mục thành công')
      }
      setModalOpen(false)
      load()
    } catch (error) {
      message.error(error.message)
    }
  }

  const handleDelete = async (id) => {
    try {
      await categoryService.remove(id)
      message.success('Xóa danh mục thành công')
      load()
    } catch (error) {
      message.error(error.message)
    }
  }

  const handleToggleActive = async (record, checked) => {
    try {
      await categoryService.update(record.id, { isActive: checked })
      message.success(checked ? 'Danh mục đã kích hoạt' : 'Danh mục đã ẩn')
      load()
    } catch (error) {
      message.error(error.message)
    }
  }

  const isAdmin = hasRole('ADMIN')

  const columns = useMemo(
    () => [
      { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
      { title: 'Tên danh mục', dataIndex: 'name', key: 'name' },
      { title: 'Slug', dataIndex: 'slug', key: 'slug' },
      { title: 'Mô tả', dataIndex: 'description', key: 'description' },
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
              unCheckedChildren="Ẩn"
              onChange={(checked) => handleToggleActive(record, checked)}
            />
          ) : v ? (
            <Tag color="green">Hoạt động</Tag>
          ) : (
            <Tag>Ẩn</Tag>
          ),
      },
      {
        title: 'Thao tác',
        key: 'action',
        width: 160,
        render: (_, record) => (
          <Space>
            {isAdmin && (
              <>
                <Button size="small" onClick={() => openEdit(record)}>
                  Sửa
                </Button>
                <Popconfirm title="Xóa danh mục này?" onConfirm={() => handleDelete(record.id)}>
                  <Button size="small" danger>
                    Xóa
                  </Button>
                </Popconfirm>
              </>
            )}
          </Space>
        ),
      },
    ],
    [isAdmin]
  )

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>
          Quản lý danh mục
        </Typography.Title>
        {hasRole('ADMIN') && (
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Thêm danh mục
          </Button>
        )}
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Input
            placeholder="Tìm danh mục..."
            prefix={<SearchOutlined />}
            style={{ width: 250 }}
            allowClear
            onChange={(e) => setSearch(e.target.value)}
          />
        </Space>
      </Card>

      <Table rowKey="id" columns={columns} dataSource={items} loading={loading} pagination={false} scroll={{ x: 700 }} />

      <Modal
        title={editing ? 'Sửa danh mục' : 'Thêm danh mục'}
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => setModalOpen(false)}
        okText={editing ? 'Lưu' : 'Tạo'}
        destroyOnClose
      >
        <Form form={form} layout="vertical" initialValues={{ isActive: true }}>
          <Form.Item name="name" label="Tên danh mục" rules={[{ required: true, message: 'Nhập tên danh mục' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="isActive" label="Trạng thái" valuePropName="checked">
            <Switch checkedChildren="Hoạt động" unCheckedChildren="Ẩn" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}