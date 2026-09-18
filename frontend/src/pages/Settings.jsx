import { useEffect, useState } from 'react'
import { Button, Card, Form, Input, message, Space, Typography } from 'antd'
import { SaveOutlined, PhoneOutlined, CommentOutlined, MailOutlined, ReloadOutlined } from '@ant-design/icons'
import settingsService from '../services/settings.service'

export default function Settings() {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await settingsService.getPublic()
      form.setFieldsValue({
        support_hotline: res.data.support_hotline || '',
        support_zalo: res.data.support_zalo || '',
        support_email: res.data.support_email || '',
      })
    } catch (error) {
      message.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      setSaving(true)
      await settingsService.update({
        support_hotline: values.support_hotline,
        support_zalo: values.support_zalo,
        support_email: values.support_email,
      })
      message.success('Đã lưu cài đặt liên hệ hỗ trợ')
    } catch (error) {
      if (error.errorFields) return
      message.error(error.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>
          Cài đặt hệ thống
        </Typography.Title>
        <Button icon={<ReloadOutlined />} onClick={load}>
          Làm mới
        </Button>
      </div>

      <Card title="Liên hệ hỗ trợ" style={{ maxWidth: 620 }} loading={loading}>
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Typography.Paragraph type="secondary" style={{ marginTop: 0 }}>
            Thông tin hiển thị trong nút "Hỗ trợ" ở góc phải trên cùng (mọi nhân viên nhìn thấy).
          </Typography.Paragraph>
          <Form.Item
            name="support_hotline"
            label="Hotline"
            rules={[{ required: true, message: 'Nhập số hotline' }]}
          >
            <Input prefix={<PhoneOutlined />} placeholder="VD: 1900 6868" />
          </Form.Item>
          <Form.Item
            name="support_zalo"
            label="Zalo"
            rules={[{ required: true, message: 'Nhập số điện thoại Zalo' }]}
            extra="Nhập số điện thoại đã đăng ký Zalo (VD: 0900000000) hoặc link Zalo OA (https://zalo.me/...)."
          >
            <Input prefix={<CommentOutlined />} placeholder="VD: 0900000000" />
          </Form.Item>
          <Form.Item
            name="support_email"
            label="Email hỗ trợ"
            rules={[{ type: 'email', message: 'Email không hợp lệ' }]}
          >
            <Input prefix={<MailOutlined />} placeholder="hotro@balotuixach.vn" />
          </Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving}>
              Lưu cài đặt
            </Button>
          </Space>
        </Form>
      </Card>
    </div>
  )
}