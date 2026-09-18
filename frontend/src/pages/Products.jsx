import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
  Table,
  Button,
  Input,
  Select,
  Card,
  Modal,
  Form,
  InputNumber,
  Space,
  Tag,
  Popconfirm,
  message,
  Typography,
  Upload,
  Image,
  Switch,
  Alert,
} from 'antd'
import {
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  UploadOutlined,
  HistoryOutlined,
  FileExcelOutlined,
  ImportOutlined,
  DownloadOutlined,
  BarcodeOutlined,
  PrinterOutlined,
} from '@ant-design/icons'
import * as XLSX from 'xlsx'
import productService from '../services/product.service'
import categoryService from '../services/category.service'
import { useAuth } from '../hooks/useAuth'
import { formatCurrency, formatDateTime } from '../utils/format'
import { renderBarcode, generateEan13, ean13FromId } from '../utils/barcode'

const BarcodeCell = ({ value }) => {
  const ref = useRef(null)
  useEffect(() => {
    if (value) renderBarcode(ref.current, value, { width: 1.1, height: 28, fontSize: 8, textMargin: 0 })
  }, [value])
  return value ? (
    <div style={{ display: 'inline-block' }}>
      <div ref={ref} style={{ maxWidth: 110 }} />
      <span style={{ display: 'block', textAlign: 'center', fontSize: 10, color: '#8c8c8c' }}>{value}</span>
    </div>
  ) : (
    <Typography.Text type="secondary">—</Typography.Text>
  )
}

const BarcodeLabel = ({ product }) => {
  const ref = useRef(null)
  useEffect(() => {
    if (product.barcode) renderBarcode(ref.current, product.barcode, { width: 1.8, height: 36, fontSize: 10 })
  }, [product.barcode])
  return (
    <div className="el-label">
      <div style={{ fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {product.name}
      </div>
      <div style={{ fontSize: 10, color: '#666' }}>
        {product.sku} · {formatCurrency(product.price)}
      </div>
      <div ref={ref} />
    </div>
  )
}

export default function Products() {
  const [items, setItems] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 })
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState(undefined)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [form] = Form.useForm()
  const { hasRole } = useAuth()
  const [logsOpen, setLogsOpen] = useState(false)
  const [logs, setLogs] = useState([])
  const [logsProduct, setLogsProduct] = useState(null)
  const [logsLoading, setLogsLoading] = useState(false)
  const [importResult, setImportResult] = useState(null)
  const [importOpen, setImportOpen] = useState(false)
  const [printOpen, setPrintOpen] = useState(false)
  const [printItems, setPrintItems] = useState([])
  const [barcodePreviewRef, setBarcodePreviewRef] = useState(null)
  const barcodeValue = Form.useWatch('barcode', form)

  useEffect(() => {
    if (!barcodePreviewRef) return
    if (!barcodeValue) {
      barcodePreviewRef.innerHTML = ''
      return
    }
    renderBarcode(barcodePreviewRef, barcodeValue, { width: 1.6, height: 42, fontSize: 11 })
  }, [barcodeValue, barcodePreviewRef])

  const canEdit = hasRole('ADMIN')
  const canStock = hasRole('ADMIN', 'WAREHOUSE')

  const EXPORT_HEADERS = [
    'Tên sản phẩm',
    'SKU',
    'Mã vạch',
    'Danh mục',
    'Giá bán',
    'Giá vốn',
    'Tồn kho',
    'Màu sắc',
    'Mô tả',
    'Trạng thái',
  ]

  const handleDownloadTemplate = () => {
    const categoryName = categories[0]?.name || 'Balo'
    const ws = XLSX.utils.aoa_to_sheet([
      EXPORT_HEADERS,
      ['Balo học sinh ABC', 'SP001', '', categoryName, 350000, 200000, 10, 'Xanh dương', 'Balo 3 ngăn chống nước', 'Hoạt động'],
      ['Túi xách nữ XYZ', 'SP002', '8935201000011', categoryName, 450000, 250000, 5, 'Đen', '', 'Hoạt động'],
    ])
    ws['!cols'] = [{ wch: 22 }, { wch: 12 }, { wch: 18 }, { wch: 16 }, { wch: 14 }, { wch: 14 }, { wch: 10 }, { wch: 14 }, { wch: 30 }, { wch: 12 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Mẫu import')
    XLSX.writeFile(wb, 'mau-import-san-pham.xlsx')
    message.success('Đã tải file mẫu (nhớ dùng đúng tên danh mục đang có)')
  }

  const handleExport = async () => {
    try {
      const hide = message.loading('Đang xuất file...', 0)
      let page = 1
      const all = []
      let ok = false
      while (!ok) {
        const res = await productService.list({ page, limit: 100 })
        all.push(...res.data)
        ok = page >= (res.meta.totalPages || 1)
        page += 1
      }
      const rows = all.map((p) => [
        p.name,
        p.sku,
        p.barcode || '',
        p.category?.name || '',
        p.price,
        p.costPrice ?? '',
        p.stock,
        p.color || '',
        p.description || '',
        p.isActive ? 'Hoạt động' : 'Ẩn',
      ])
      const ws = XLSX.utils.aoa_to_sheet([EXPORT_HEADERS, ...rows])
      ws['!cols'] = [{ wch: 22 }, { wch: 12 }, { wch: 18 }, { wch: 16 }, { wch: 14 }, { wch: 14 }, { wch: 10 }, { wch: 14 }, { wch: 30 }, { wch: 12 }]
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Sản phẩm')
      XLSX.writeFile(wb, `san-pham_${new Date().toISOString().slice(0, 10)}.xlsx`)
      hide()
      message.success(`Xuất thành công ${all.length} sản phẩm`)
    } catch (error) {
      message.error(error.message)
    }
  }

  const handleImport = async (file) => {
    try {
      const buffer = await file.arrayBuffer()
      const wb = XLSX.read(buffer)
      const sheet = wb.Sheets[wb.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json(sheet)
      if (!rows.length) {
        message.warning('File không có dữ liệu')
        return
      }
      const items = rows.map((r) => ({
        name: r['Tên sản phẩm'],
        sku: r['SKU'],
        barcode: r['Mã vạch'] === undefined ? '' : String(r['Mã vạch']).trim(),
        category: r['Danh mục'],
        price: r['Giá bán'],
        costPrice: r['Giá vốn'] === undefined ? null : r['Giá vốn'],
        stock: r['Tồn kho'],
        color: r['Màu sắc'],
        description: r['Mô tả'],
        isActive: r['Trạng thái'],
      }))
      const hide = message.loading('Đang import...', 0)
      const res = await productService.importMany(items)
      hide()
      setImportResult(res.data)
      load()
      if (res.data.errors.length > 0) {
        setImportOpen(true)
      } else {
        message.success(`Import thành công ${res.data.imported} sản phẩm`)
      }
    } catch (error) {
      message.error(error.message)
    }
  }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await productService.list({
        page: pagination.page,
        limit: pagination.limit,
        search: search || undefined,
        categoryId: categoryId,
      })
      setItems(data.data)
      setPagination((p) => ({ ...p, total: data.meta.total }))
    } catch (error) {
      message.error(error.message)
    } finally {
      setLoading(false)
    }
  }, [pagination.page, pagination.limit, search, categoryId])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    categoryService.all().then((d) => setCategories(d.data)).catch(() => {})
  }, [])

  const openCreate = () => {
    setEditing(null)
    setImageFile(null)
    setImagePreview('')
    form.resetFields()
    setModalOpen(true)
  }

  const openEdit = (record) => {
    setEditing(record)
    setImageFile(null)
    setImagePreview(record.imageUrl || '')
    form.setFieldsValue({
      ...record,
      price: Number(record.price),
      costPrice: record.costPrice ? Number(record.costPrice) : undefined,
    })
    setModalOpen(true)
  }

  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      let payload = { ...values }
      if (imageFile) {
        const uploaded = await productService.uploadImage(imageFile)
        payload.imageUrl = uploaded.data.url
      } else if (editing) {
        payload.imageUrl = editing.imageUrl || null
      }
      if (editing) {
        await productService.update(editing.id, payload)
        message.success('Cập nhật sản phẩm thành công')
      } else {
        await productService.create(payload)
        message.success('Tạo sản phẩm thành công')
      }
      setModalOpen(false)
      load()
    } catch (error) {
      message.error(error.message)
    }
  }

  const handleDelete = async (id) => {
    try {
      await productService.remove(id)
      message.success('Xóa sản phẩm thành công')
      load()
    } catch (error) {
      message.error(error.message)
    }
  }

  const handleAdjustStock = (record) => {
    let current = Number(record.stock)
    Modal.confirm({
      title: `Điều chỉnh tồn kho: ${record.name}`,
      content: (
        <Form
          initialValues={{ newStock: current }}
          onValuesChange={(_, all) => {
            current = Number(all.newStock)
          }}
        >
          <Form.Item name="newStock" rules={[{ required: true, message: 'Nhập số lượng mới' }]}>
            <InputNumber min={0} style={{ width: '100%' }} placeholder="Số lượng mới" />
          </Form.Item>
        </Form>
      ),
      onOk: async () => {
        await productService.adjustStock(record.id, { newStock: current })
        message.success('Cập nhật tồn kho thành công')
        load()
      },
    })
  }

  const handleToggleActive = async (record, checked) => {
    try {
      await productService.update(record.id, { isActive: checked })
      message.success(checked ? 'Sản phẩm đã kích hoạt' : 'Sản phẩm đã ẩn')
      load()
    } catch (error) {
      message.error(error.message)
    }
  }

  const openPrint = (records) => {
    setPrintItems(records)
    setPrintOpen(true)
  }

  const guideGenerate = () => {
    form.setFieldsValue({ barcode: editing ? ean13FromId(editing.id) : generateEan13() })
  }

  const openStockLogs = async (record) => {
    setLogsProduct(record)
    setLogsOpen(true)
    setLogsLoading(true)
    try {
      const data = await productService.stockLogs({ productId: record.id, limit: 50 })
      setLogs(data.data)
    } catch (error) {
      message.error(error.message)
    } finally {
      setLogsLoading(false)
    }
  }

  const LOG_TYPE_COLOR = {
    IMPORT: 'green',
    EXPORT: 'blue',
    CANCEL: 'orange',
    ADJUST: 'purple',
  }

  const columns = useMemo(
    () => [
      {
        title: 'Ảnh',
        dataIndex: 'imageUrl',
        key: 'image',
        width: 72,
        render: (v) =>
          v ? (
            <Image
              src={v}
              width={48}
              height={48}
              style={{ objectFit: 'cover', borderRadius: 6 }}
            />
          ) : (
            <div
              style={{
                width: 48,
                height: 48,
                background: '#f0f2f5',
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#bfbfbf',
                fontSize: 12,
              }}
            >
              —
            </div>
          ),
      },
      { title: 'SKU', dataIndex: 'sku', key: 'sku', width: 110, render: (v) => <Tag>{v}</Tag> },
      {
        title: 'Mã vạch',
        dataIndex: 'barcode',
        key: 'barcode',
        width: 150,
        render: (v) => <BarcodeCell value={v} />,
      },
      { title: 'Tên sản phẩm', dataIndex: 'name', key: 'name' },
      {
        title: 'Danh mục',
        dataIndex: ['category', 'name'],
        key: 'category',
        width: 160,
        render: (v) => <Tag color="blue">{v}</Tag>,
      },
      {
        title: 'Giá bán',
        dataIndex: 'price',
        key: 'price',
        width: 140,
        render: (v) => <span style={{ fontWeight: 600 }}>{formatCurrency(v)}</span>,
      },
      {
        title: 'Tồn kho',
        dataIndex: 'stock',
        key: 'stock',
        width: 100,
        sorter: (a, b) => a.stock - b.stock,
        render: (v) => (
          <Tag color={v === 0 ? 'red' : v < 10 ? 'orange' : 'green'}>{v}</Tag>
        ),
      },
      {
        title: 'Trạng thái',
        dataIndex: 'isActive',
        key: 'isActive',
        width: 110,
        render: (v, record) =>
          canEdit ? (
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
            <Tag color="default">Ẩn</Tag>
          ),
      },
      {
        title: 'Thao tác',
        key: 'action',
        width: 290,
        render: (_, record) => (
          <Space wrap>
            <Button size="small" icon={<BarcodeOutlined />} onClick={() => openPrint([record])}>
              Nhãn
            </Button>
            {canStock && (
              <Button size="small" icon={<HistoryOutlined />} onClick={() => openStockLogs(record)}>
                Lịch sử
              </Button>
            )}
            {canEdit && (
              <>
                <Button size="small" onClick={() => openEdit(record)}>
                  Sửa
                </Button>
                <Popconfirm title="Xóa sản phẩm này?" onConfirm={() => handleDelete(record.id)}>
                  <Button size="small" danger>
                    Xóa
                  </Button>
                </Popconfirm>
              </>
            )}
            {canStock && (
              <Button size="small" type="primary" ghost onClick={() => handleAdjustStock(record)}>
                Tồn kho
              </Button>
            )}
          </Space>
        ),
      },
    ],
    [canEdit, canStock]
  )

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>
          Quản lý sản phẩm
        </Typography.Title>
        {canEdit && (
          <Space wrap>
            <Button icon={<FileExcelOutlined />} onClick={handleDownloadTemplate}>
              Tải file mẫu
            </Button>
            <Upload accept=".xlsx,.xls" showUploadList={false} beforeUpload={(file) => { handleImport(file); return false }}>
              <Button icon={<ImportOutlined />}>Import Excel</Button>
            </Upload>
            <Button icon={<DownloadOutlined />} onClick={handleExport}>
              Xuất Excel
            </Button>
            <Button icon={<PrinterOutlined />} onClick={() => openPrint(items)}>
              In nhãn
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              Thêm sản phẩm
            </Button>
          </Space>
        )}
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Input
            placeholder="Tìm theo tên / SKU / mã vạch..."
            prefix={<SearchOutlined />}
            style={{ width: 250 }}
            allowClear
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select
            placeholder="Lọc theo danh mục"
            style={{ width: 200 }}
            allowClear
            value={categoryId}
            onChange={setCategoryId}
            options={categories.map((c) => ({ label: c.name, value: c.id }))}
          />
          <Button icon={<ReloadOutlined />} onClick={load}>
            Làm mới
          </Button>
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
          showSizeChanger: true,
          showTotal: (t) => `Tổng ${t} sản phẩm`,
          onChange: (page, limit) => setPagination((p) => ({ ...p, page, limit })),
        }}
        scroll={{ x: 900 }}
      />

      <Modal
        title={editing ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => setModalOpen(false)}
        okText={editing ? 'Lưu' : 'Tạo'}
        width={600}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" initialValues={{ stock: 0, isActive: true }}>
          <Form.Item label="Hình ảnh sản phẩm">
            <Space align="start" size="large">
              <Upload
                accept="image/*"
                showUploadList={false}
                beforeUpload={(file) => {
                  setImageFile(file)
                  setImagePreview(URL.createObjectURL(file))
                  return false
                }}
              >
                <Button icon={<UploadOutlined />}>Chọn ảnh</Button>
              </Upload>
              {imagePreview && (
                <Space direction="vertical" size={4}>
                  <Image
                    src={imagePreview}
                    width={80}
                    height={80}
                    style={{ objectFit: 'cover', borderRadius: 6 }}
                  />
                  <Button
                    size="small"
                    type="text"
                    danger
                    onClick={() => {
                      setImageFile(null)
                      setImagePreview('')
                    }}
                  >
                    Xóa ảnh
                  </Button>
                </Space>
              )}
            </Space>
          </Form.Item>
          <Form.Item name="name" label="Tên sản phẩm" rules={[{ required: true, message: 'Nhập tên sản phẩm' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="sku" label="SKU" rules={[{ required: true, message: 'Nhập SKU' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="barcode" label="Mã vạch (barcode)">
            <Space direction="vertical" style={{ width: '100%' }} size={8}>
              <Space.Compact style={{ width: '100%' }}>
                <Input
                  placeholder="Nhập mã vạch nếu có"
                  allowClear
                  onChange={(e) => form.setFieldsValue({ barcode: e.target.value.trim() })}
                />
                <Button icon={<BarcodeOutlined />} onClick={guideGenerate}>
                  Tự sinh
                </Button>
              </Space.Compact>
              <div
                ref={setBarcodePreviewRef}
                style={{
                  minHeight: 46,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#fafafa',
                  borderRadius: 6,
                }}
              />
            </Space>
          </Form.Item>
          <Form.Item
            name="categoryId"
            label="Danh mục"
            rules={[{ required: true, message: 'Chọn danh mục' }]}
          >
            <Select
              options={categories.map((c) => ({ label: c.name, value: c.id }))}
              placeholder="Chọn danh mục"
            />
          </Form.Item>
          <Space size="large">
            <Form.Item name="price" label="Giá bán (₫)" rules={[{ required: true, message: 'Nhập giá' }]}>
              <InputNumber min={0} style={{ width: 200 }} formatter={(v) => Number(v).toLocaleString('vi-VN')} />
            </Form.Item>
            <Form.Item name="costPrice" label="Giá vốn (₫)">
              <InputNumber min={0} style={{ width: 200 }} />
            </Form.Item>
          </Space>
          <Space size="large">
            <Form.Item name="stock" label="Tồn kho ban đầu">
              <InputNumber min={0} style={{ width: 200 }} />
            </Form.Item>
            <Form.Item name="color" label="Màu sắc">
              <Input style={{ width: 200 }} />
            </Form.Item>
          </Space>
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="isActive" label="Trạng thái" valuePropName="checked">
            <Switch checkedChildren="Hoạt động" unCheckedChildren="Ẩn" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal lịch sử tồn kho */}
      <Modal
        title={`Lịch sử tồn kho: ${logsProduct?.name || ''}`}
        open={logsOpen}
        onCancel={() => setLogsOpen(false)}
        footer={null}
        width={760}
      >
        <Table
          rowKey="id"
          size="small"
          loading={logsLoading}
          dataSource={logs}
          pagination={false}
          scroll={{ x: 700 }}
          columns={[
            { title: 'Thời gian', dataIndex: 'createdAt', key: 'createdAt', width: 160, render: formatDateTime },
            { title: 'Loại', dataIndex: 'type', key: 'type', width: 100, render: (v) => <Tag color={LOG_TYPE_COLOR[v]}>{v}</Tag> },
            {
              title: 'Biến động',
              key: 'change',
              width: 120,
              render: (_, r) =>
                r.before === r.after ? (
                  <Tag color="default">Không đổi</Tag>
                ) : (
                  <Tag color={r.after > r.before ? 'green' : 'red'}>
                    {r.before} → {r.after}
                  </Tag>
                ),
            },
            { title: 'Số lượng', dataIndex: 'quantity', key: 'quantity', width: 90, render: (v) => <b>{v}</b> },
            {
              title: 'Người thao tác',
              key: 'user',
              render: (_, r) => r.user?.fullName || `#${r.userId}`,
            },
            { title: 'Ghi chú', dataIndex: 'note', key: 'note' },
          ]}
        />
      </Modal>

      {/* Modal kết quả import */}
      <Modal
        title="Kết quả import sản phẩm"
        open={importOpen}
        onCancel={() => setImportOpen(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setImportOpen(false)}>
            Đóng
          </Button>,
        ]}
        width={560}
      >
        {importResult && (
          <>
            <Alert
              type={importResult.failed > 0 ? 'warning' : 'success'}
              showIcon
              message={`Import thành công ${importResult.imported} sản phẩm, thất bại ${importResult.failed} dòng`}
            />
            {importResult.errors.length > 0 && (
              <Table
                rowKey="row"
                size="small"
                style={{ marginTop: 12 }}
                pagination={false}
                dataSource={importResult.errors}
                columns={[
                  { title: 'Dòng', dataIndex: 'row', width: 80 },
                  { title: 'Lỗi', dataIndex: 'message' },
                ]}
              />
            )}
          </>
        )}
      </Modal>

      {/* Modal in nhãn mã vạch */}
      <Modal
        title={`In nhãn mã vạch (${printItems.length} sản phẩm)`}
        open={printOpen}
        onCancel={() => setPrintOpen(false)}
        footer={[
          <Button key="close" onClick={() => setPrintOpen(false)}>
            Đóng
          </Button>,
          <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={() => window.print()}>
            In nhãn
          </Button>,
        ]}
        width={620}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {printItems.map((p) => (
            <BarcodeLabel key={p.id} product={p} />
          ))}
        </div>
      </Modal>

      {/* Vùng in nhãn nằm ngoài #root để @media print không bị che */}
      {printItems.length > 0 &&
        createPortal(
          <div className="print-area">
            {printItems.map((p) => (
              <BarcodeLabel key={p.id} product={p} />
            ))}
          </div>,
          document.body
        )}
    </div>
  )
}