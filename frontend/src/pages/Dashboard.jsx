import { useEffect, useState } from 'react'
import { Card, Col, Row, Statistic, Table, Tag, Typography, Empty, Spin, message } from 'antd'
import {
  ShoppingCartOutlined,
  TeamOutlined,
  FileTextOutlined,
  DollarOutlined,
} from '@ant-design/icons'
import { Column } from '@ant-design/plots'
import reportService from '../services/report.service'
import orderService from '../services/order.service'

const STATUS_COLORS = {
  PENDING: 'gold',
  CONFIRMED: 'blue',
  SHIPPING: 'cyan',
  COMPLETED: 'green',
  CANCELLED: 'red',
}

export default function Dashboard() {
  const [summary, setSummary] = useState(null)
  const [revenue, setRevenue] = useState([])
  const [recentOrders, setRecentOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [s, r, o] = await Promise.all([
          reportService.dashboard(),
          reportService.monthlyRevenue(new Date().getFullYear()),
          orderService.list({ page: 1, limit: 5 }),
        ])
        setSummary(s.data)
        setRevenue(r.data)
        setRecentOrders(o.data)
      } catch (error) {
        message.error(error.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 60 }}>
        <Spin size="large" />
      </div>
    )
  }

  const chartData = revenue.map((m) => ({
    month: `T${m.month}`,
    value: Number(m.revenue),
  }))

  const columns = [
    { title: 'Mã đơn', dataIndex: 'orderCode', key: 'orderCode' },
    { title: 'Khách hàng', dataIndex: ['customer', 'fullName'], key: 'customer' },
    {
      title: 'Tổng tiền',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (v) => Number(v).toLocaleString('vi-VN') + ' ₫',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (s) => <Tag color={STATUS_COLORS[s]}>{s}</Tag>,
    },
  ]

  return (
    <div>
      <Typography.Title level={4}>Dashboard</Typography.Title>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tổng sản phẩm"
              value={summary.totalProducts}
              prefix={<ShoppingCartOutlined style={{ marginRight: 8, color: '#1677ff' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tổng khách hàng"
              value={summary.totalCustomers}
              prefix={<TeamOutlined style={{ marginRight: 8, color: '#52c41a' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tổng đơn hàng"
              value={summary.totalOrders}
              prefix={<FileTextOutlined style={{ marginRight: 8, color: '#faad14' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Doanh thu"
              value={Number(summary.revenue)}
              precision={0}
              prefix={<DollarOutlined style={{ marginRight: 8, color: '#f5222d' }} />}
              suffix="₫"
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={16}>
          <Card title="Doanh thu theo tháng (năm nay)">
            {chartData.some((d) => d.value > 0) ? (
              <Column
                data={chartData}
                xField="month"
                yField="value"
                height={320}
                label={{ position: 'top', formatter: (d) => `${(Number(d.value) / 1000000).toFixed(1)}tr` }}
                color="#1677ff"
              />
            ) : (
              <Empty description="Chưa có dữ liệu doanh thu" />
            )}
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Đơn hàng gần đây">
            <Table
              rowKey="id"
              columns={columns}
              dataSource={recentOrders}
              pagination={false}
              size="small"
              scroll={{ x: 320 }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}