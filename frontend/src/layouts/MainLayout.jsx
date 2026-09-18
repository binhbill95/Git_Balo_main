import { useMemo, useState } from 'react'
import { Layout, Menu, Avatar, Dropdown, Space, Typography, theme, Modal, Form, Input, message } from 'antd'
import {
  DashboardOutlined,
  ShoppingCartOutlined,
  AppstoreOutlined,
  TeamOutlined,
  FileTextOutlined,
  BarChartOutlined,
  UserOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  ShoppingOutlined,
  ShopOutlined,
  KeyOutlined,
  TruckOutlined,
  SettingOutlined,
  ProfileOutlined,
  InboxOutlined,
} from '@ant-design/icons'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import authService from '../services/auth.service'
import SupportContact from '../components/SupportContact'

const { Header, Sider, Content } = Layout

const ROLE_LABEL = {
  ADMIN: 'Quản trị viên',
  SALES: 'Nhân viên bán hàng',
  WAREHOUSE: 'Nhân viên kho',
  MANAGER: 'Quản lý',
}

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [passwordOpen, setPasswordOpen] = useState(false)
  const [passwordSubmitting, setPasswordSubmitting] = useState(false)
  const [passwordForm] = Form.useForm()
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken()

  const menuItems = useMemo(() => {
    const role = user?.role
    const items = []

    if (role === 'ADMIN' || role === 'MANAGER' || role === 'SALES') {
      items.push({ key: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' })
    }
    if (role === 'ADMIN' || role === 'SALES') {
      items.push({ key: '/pos', icon: <ShopOutlined />, label: 'Bán hàng (POS)' })
    }
    if (role === 'ADMIN' || role === 'SALES' || role === 'WAREHOUSE') {
      items.push({ key: '/products', icon: <ShoppingCartOutlined />, label: 'Sản phẩm' })
    }
    if (role === 'ADMIN') {
      items.push({ key: '/categories', icon: <AppstoreOutlined />, label: 'Danh mục' })
    }
    if (role === 'ADMIN' || role === 'SALES') {
      items.push({ key: '/customers', icon: <TeamOutlined />, label: 'Khách hàng' })
    }
    if (role === 'ADMIN' || role === 'SALES' || role === 'WAREHOUSE') {
      items.push({ key: '/orders', icon: <FileTextOutlined />, label: 'Đơn hàng' })
    }
    if (role === 'ADMIN' || role === 'SALES' || role === 'WAREHOUSE' || role === 'MANAGER') {
      items.push({ key: '/shipments', icon: <TruckOutlined />, label: 'Vận đơn' })
    }
    if (role === 'ADMIN' || role === 'WAREHOUSE' || role === 'MANAGER') {
      items.push({ key: '/suppliers', icon: <ProfileOutlined />, label: 'Nhà cung cấp' })
      items.push({ key: '/purchase-orders', icon: <InboxOutlined />, label: 'Đơn nhập hàng' })
    }
    if (role === 'ADMIN' || role === 'MANAGER') {
      items.push({ key: '/reports', icon: <BarChartOutlined />, label: 'Báo cáo' })
    }
    if (role === 'ADMIN') {
      items.push({ key: '/accounts', icon: <UserOutlined />, label: 'Tài khoản' })
      items.push({ key: '/settings', icon: <SettingOutlined />, label: 'Cài đặt' })
    }
    return items
  }, [user?.role])

  const selectedKey = menuItems.find((item) => location.pathname.startsWith(item.key))?.key

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const handleChangePassword = async () => {
    try {
      const values = await passwordForm.validateFields()
      setPasswordSubmitting(true)
      await authService.changePassword({
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
      })
      message.success('Đổi mật khẩu thành công')
      setPasswordOpen(false)
      passwordForm.resetFields()
    } catch (error) {
      if (error.errorFields) return
      message.error(error.message || 'Đổi mật khẩu thất bại')
    } finally {
      setPasswordSubmitting(false)
    }
  }

  const userMenu = {
    items: [
      {
        key: 'role',
        label: (
          <div style={{ padding: '4px 0' }}>
            <Typography.Text strong>{user?.fullName}</Typography.Text>
            <br />
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {ROLE_LABEL[user?.role]} ({user?.role})
            </Typography.Text>
          </div>
        ),
        disabled: true,
      },
      { type: 'divider' },
      {
        key: 'change-password',
        icon: <KeyOutlined />,
        label: 'Đổi mật khẩu',
        onClick: () => {
          passwordForm.resetFields()
          setPasswordOpen(true)
        },
      },
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: 'Đăng xuất',
        onClick: handleLogout,
      },
    ],
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={230}
        style={{
          background: 'linear-gradient(180deg, #0f2b5b 0%, #1677ff 100%)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '16px',
            color: '#fff',
          }}
        >
          <ShoppingOutlined style={{ fontSize: 28 }} />
          {!collapsed && (
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, lineHeight: 1.2 }}>
                Balo - Túi xách
              </div>
              <div style={{ fontSize: 11, opacity: 0.8 }}>Quản lý bán hàng</div>
            </div>
          )}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ background: 'transparent', borderInlineEnd: 'none' }}
        />
      </Sider>

      <Layout>
        <Header
          style={{
            padding: '0 16px',
            background: colorBgContainer,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
            position: 'sticky',
            top: 0,
            zIndex: 100,
          }}
        >
          <Space>
            {collapsed ? (
              <MenuUnfoldOutlined
                style={{ fontSize: 18 }}
                onClick={() => setCollapsed(false)}
              />
            ) : (
              <MenuFoldOutlined
                style={{ fontSize: 18 }}
                onClick={() => setCollapsed(true)}
              />
            )}
          </Space>
          <Space size={8}>
            <SupportContact />
            <Dropdown menu={userMenu} placement="bottomRight" arrow>
              <Space style={{ cursor: 'pointer' }}>
                <Avatar style={{ backgroundColor: '#1677ff' }} icon={<UserOutlined />} />
                <Typography.Text strong>{user?.fullName}</Typography.Text>
              </Space>
            </Dropdown>
          </Space>
        </Header>

        <Content
          style={{
            margin: 16,
            padding: 24,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
            minHeight: 'calc(100vh - 96px)',
          }}
        >
          <Outlet />
        </Content>
      </Layout>

      <Modal
        title="Đổi mật khẩu"
        open={passwordOpen}
        onOk={handleChangePassword}
        onCancel={() => setPasswordOpen(false)}
        okText="Đổi mật khẩu"
        confirmLoading={passwordSubmitting}
        destroyOnHidden
      >
        <Form form={passwordForm} layout="vertical">
          <Form.Item
            name="oldPassword"
            label="Mật khẩu cũ"
            rules={[{ required: true, message: 'Nhập mật khẩu cũ' }]}
          >
            <Input.Password placeholder="Mật khẩu hiện tại" />
          </Form.Item>
          <Form.Item
            name="newPassword"
            label="Mật khẩu mới"
            rules={[
              { required: true, message: 'Nhập mật khẩu mới' },
              { min: 6, message: 'Mật khẩu mới tối thiểu 6 ký tự' },
            ]}
          >
            <Input.Password placeholder="Tối thiểu 6 ký tự" />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label="Xác nhận mật khẩu"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: 'Xác nhận mật khẩu' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve()
                  }
                  return Promise.reject(new Error('Mật khẩu xác nhận không khớp'))
                },
              }),
            ]}
          >
            <Input.Password placeholder="Nhập lại mật khẩu mới" />
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  )
}