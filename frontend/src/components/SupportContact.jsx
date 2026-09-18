import { useEffect, useState } from 'react'
import { Button, Divider, Popover, Space, Typography } from 'antd'
import { CustomerServiceOutlined, PhoneOutlined, MailOutlined, CommentOutlined } from '@ant-design/icons'
import settingsService from '../services/settings.service'

// Giá trị mặc định dùng khi chưa có cài đặt trong DB (chỉnh trên trang Cài đặt - ADMIN)
const FALLBACK = {
  hotline: '1900 0000',
  zalo: '0900000000',
  email: 'hotro@balotuixach.vn',
}

const ZALO_BLUE = '#0068ff'

const resolveConfig = (cfg) => {
  const hotline = cfg?.support_hotline || FALLBACK.hotline
  const zalo = cfg?.support_zalo || FALLBACK.zalo
  const email = cfg?.support_email || FALLBACK.email
  return {
    hotline,
    hotlineTel: /^tel:/i.test(hotline) ? hotline : `tel:${hotline.replace(/\D/g, '')}`,
    zaloUrl: /^https?:\/\//i.test(zalo) ? zalo : `https://zalo.me/${zalo}`,
    email,
  }
}

export default function SupportContact() {
  const [config, setConfig] = useState(FALLBACK)

  const fetchConfig = () => {
    settingsService
      .getPublic()
      .then((res) => setConfig(resolveConfig(res.data)))
      .catch(() => setConfig(FALLBACK))
  }

  useEffect(() => {
    fetchConfig()
  }, [])

  const content = (
    <div style={{ width: 270 }}>
      <Typography.Title level={5} style={{ margin: 0 }}>
        Liên hệ hỗ trợ
      </Typography.Title>
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        Chúng tôi hỗ trợ bạn tất cả các ngày trong tuần.
      </Typography.Text>
      <Divider style={{ margin: '10px 0' }} />
      <Space direction="vertical" style={{ width: '100%' }} size={8}>
        <Button block size="large" icon={<PhoneOutlined />} href={config.hotlineTel}>
          Hotline: {config.hotline}
        </Button>
        <Button
          block
          size="large"
          type="primary"
          style={{ background: ZALO_BLUE, borderColor: ZALO_BLUE }}
          icon={<CommentOutlined />}
          href={config.zaloUrl}
          target="_blank"
          rel="noreferrer"
        >
          Chat qua Zalo
        </Button>
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          <MailOutlined /> {config.email}
        </Typography.Text>
      </Space>
    </div>
  )

  return (
    <Popover
      content={content}
      placement="bottomRight"
      trigger="click"
      arrow
      onOpenChange={(open) => {
        if (open) fetchConfig()
      }}
    >
      <Button type="text" icon={<CustomerServiceOutlined />}>
        Hỗ trợ
      </Button>
    </Popover>
  )
}