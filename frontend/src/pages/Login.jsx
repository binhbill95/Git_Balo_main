import { useState } from 'react'
import { Form, Input, Button, Card, Typography, message, Tag, Row, Col, Divider } from 'antd'
import { UserOutlined, LockOutlined, ShoppingOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const DEMO_ACCOUNTS = [
  { role: 'ADMIN', username: 'admin', password: 'admin123', color: 'blue' },
  { role: 'SALES', username: 'sales', password: 'sales123', color: 'green' },
  { role: 'WAREHOUSE', username: 'warehouse', password: 'warehouse123', color: 'orange' },
  { role: 'MANAGER', username: 'manager', password: 'manager123', color: 'purple' },
]

export default function Login() {
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form] = Form.useForm()

  const HOME_BY_ROLE = {
    ADMIN: '/dashboard',
    MANAGER: '/dashboard',
    SALES: '/dashboard',
    WAREHOUSE: '/products',
  }

  const onFinish = async (values) => {
    setLoading(true)
    try {
      const user = await login(values.username, values.password)
      message.success('Đăng nhập thành công!')
      navigate(HOME_BY_ROLE[user?.role] || '/dashboard')
    } catch (error) {
      message.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f2b5b 0%, #1677ff 100%)',
        padding: 16,
      }}
    >
      <Card style={{ width: 420, boxShadow: '0 8px 30px rgba(0,0,0,0.25)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <ShoppingOutlined style={{ fontSize: 48, color: '#1677ff' }} />
          <Typography.Title level={3} style={{ marginTop: 8, marginBottom: 0 }}>
            Balo - Túi xách Store
          </Typography.Title>
          <Typography.Text type="secondary">Hệ thống quản lý & bán hàng</Typography.Text>
        </div>

        <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ username: 'admin', password: 'admin123' }}>
          <Form.Item name="username" label="Tên đăng nhập" rules={[{ required: true, message: 'Nhập tên đăng nhập' }]}>
            <Input prefix={<UserOutlined />} placeholder="username" size="large" />
          </Form.Item>
          <Form.Item name="password" label="Mật khẩu" rules={[{ required: true, message: 'Nhập mật khẩu' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="password" size="large" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block size="large" loading={loading}>
            Đăng nhập
          </Button>
        </Form>

        <Divider plain style={{ fontSize: 12, color: '#999' }}>
          TÀI KHOẢN DEMO
        </Divider>
        <Row gutter={[4, 4]}>
          {DEMO_ACCOUNTS.map((acc) => (
            <Col span={12} key={acc.role}>
              <Tag
                color={acc.color}
                style={{ width: '100%', textAlign: 'center', cursor: 'pointer', padding: '4px 0' }}
                onClick={() => {
                  form.setFieldsValue({ username: acc.username, password: acc.password })
                }}
              >
                {acc.role}: {acc.username}/{acc.password}
              </Tag>
            </Col>
          ))}
        </Row>
        <Typography.Text type="secondary" style={{ fontSize: 11, display: 'block', textAlign: 'center', marginTop: 12 }}>
          Click vào tài khoản để điền nhanh
        </Typography.Text>
      </Card>
    </div>
  )
}