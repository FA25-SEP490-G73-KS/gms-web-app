import React, { useEffect, useMemo, useState } from 'react'
import {
  Table,
  Input,
  Space,
  Button,
  DatePicker,
  Modal,
  Form,
  InputNumber,
  Select,
  message,
  Checkbox,
  Badge,
  Card
} from 'antd'
import {
  SearchOutlined,
  CalendarOutlined,
  EditOutlined,
  PlusOutlined,
  CloseOutlined,
  DeleteOutlined
} from '@ant-design/icons'
import WarehouseLayout from '../../layouts/WarehouseLayout'
import { goldTableHeader } from '../../utils/tableComponents'
import { partsAPI } from '../../services/api'
import '../../styles/pages/warehouse/export-list.css'
import '../../styles/pages/warehouse/import-list.css'
import '../../styles/pages/warehouse/parts-list.css'

const { Search } = Input

const STATUS_OPTIONS = [
  { label: 'Tất cả', value: 'ALL' },
  { label: 'Đã nhập', value: 'Đã nhập' },
  { label: 'Chờ nhập', value: 'Chờ nhập' },
  { label: 'Còn hàng', value: 'Còn hàng' },
  { label: 'Sắp hết', value: 'Sắp hết' },
  { label: 'Hết hàng', value: 'Hết hàng' }
]

const STATUS_BADGES = {
  'Đã nhập': { status: 'success', text: 'Đã nhập' },
  'Chờ nhập': { status: 'default', text: 'Chờ nhập' },
  'Còn hàng': { status: 'success', text: 'Còn hàng' },
  'Sắp hết': { status: 'warning', text: 'Sắp hết' },
  'Hết hàng': { status: 'error', text: 'Hết hàng' }
}

export default function PartsList() {
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState(null)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedPart, setSelectedPart] = useState(null)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [createForm] = Form.useForm()
  const [editForm] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [parts, setParts] = useState([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    fetchParts(page - 1, pageSize)
  }, [page, pageSize])

  const fetchParts = async (pageIndex = 0, size = 10) => {
    setLoading(true)
    try {
      const { data: response, error } = await partsAPI.getAll(pageIndex, size)
      if (error) {
        throw new Error(error)
      }

      let payload = []
      let totalElements = 0

      if (response?.result) {
        if (Array.isArray(response.result.content)) {
          payload = response.result.content
          totalElements = response.result.totalElements || response.result.numberOfElements || payload.length
        } else if (Array.isArray(response.result)) {
          payload = response.result
          totalElements = payload.length
        }
      } else if (Array.isArray(response?.data)) {
        payload = response.data
        totalElements = payload.length
      } else if (Array.isArray(response)) {
        payload = response
        totalElements = payload.length
      } else if (Array.isArray(response?.content)) {
        payload = response.content
        totalElements = response.totalElements || payload.length
      }

      const mapped = payload.map((item, index) => ({
        id: item.partId || item.id || `part-${index}`,
        name: item.name || '—',
        origin: item.market || 'VN',
        brand: item.categoryName || '—',
        vehicleModel: item.universal ? 'Tất cả' : 'Chỉ định',
        quantityOnHand: item.quantityInStock ?? item.quantity ?? 0,
        reservedQuantity: item.reservedQuantity ?? 0,
        alertThreshold: item.reorderLevel ?? 0,
        importPrice: item.purchasePrice ?? 0,
        sellingPrice: item.sellingPrice ?? 0,
        unit: item.unit || '',
        categoryId: item.categoryId,
        categoryName: item.categoryName,
        compatibleVehicleModelIds: item.compatibleVehicleIds || item.compatibleVehicleModelIds || [],
        discountRate: item.discountRate || 0,
        specialPart: item.specialPart || false,
        universal: item.universal || false,
        createdAt: item.createdAt || new Date().toISOString().split('T')[0],
        status: item.quantityInStock > 0 ? 'Đã nhập' : 'Chờ nhập',
        originalItem: item
      }))

      setParts(mapped)
      setTotal(totalElements)
    } catch (err) {
      console.error(err)
      message.error(err.message || 'Không thể tải danh sách linh kiện')
      setParts([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }

  const filteredData = useMemo(() => {
    return parts
      .filter((item) => {
        const matchesSearch =
          !searchTerm ||
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (item.brand && item.brand.toLowerCase().includes(searchTerm.toLowerCase()))

        const matchesDate =
          !dateFilter || item.createdAt === dateFilter.format('YYYY-MM-DD')

        const matchesStatus =
          statusFilter === 'ALL' || item.status === statusFilter

        return matchesSearch && matchesDate && matchesStatus
      })
      .map((item, index) => ({ ...item, key: item.id, index: index + 1 }))
  }, [parts, searchTerm, dateFilter, statusFilter])

  const columns = [
    {
      title: 'STT',
      dataIndex: 'index',
      key: 'index',
      width: 70,
      render: (_, __, index) => String(index + 1).padStart(2, '0')
    },
    {
      title: 'Tên linh kiện',
      dataIndex: 'name',
      key: 'name',
      width: 240
    },
    {
      title: 'Số lượng tồn',
      dataIndex: 'quantityOnHand',
      key: 'quantityOnHand',
      width: 140
    },
    {
      title: 'Xuất xứ',
      dataIndex: 'origin',
      key: 'origin',
      width: 120
    },
    {
      title: 'Hãng',
      dataIndex: 'brand',
      key: 'brand',
      width: 160
    },
    {
      title: 'Giá nhập',
      dataIndex: 'importPrice',
      key: 'importPrice',
      width: 140,
      render: (value) => `${Number(value).toLocaleString('vi-VN')} đ`
    },
    {
      title: 'Giá bán',
      dataIndex: 'sellingPrice',
      key: 'sellingPrice',
      width: 140,
      render: (value) => `${Number(value).toLocaleString('vi-VN')} đ`
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status) => {
        const config = STATUS_BADGES[status] || { status: 'default', text: status || 'Không rõ' }
        return <Badge {...config} />
      }
    },
    {
      title: 'Hành động',
      key: 'actions',
      width: 140,
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleOpenDetail(record)}>
            Sửa
          </Button>
          <Button type="link" danger icon={<DeleteOutlined />} />
        </Space>
      )
    }
  ]

  const handleOpenDetail = async (part) => {
    setSelectedPart(part)
    setModalOpen(true)

    if (part.id && !part.originalItem) {
      try {
        const { data: response, error } = await partsAPI.getById(part.id)
        if (!error && response?.result) {
          const detail = response.result
          setSelectedPart((prev) => ({ ...prev, originalItem: detail }))
          editForm.setFieldsValue({
            name: detail.name,
            origin: detail.market,
            brand: detail.categoryName,
            vehicleModel: detail.universal ? 'Tất cả' : 'Chỉ định',
            quantityOnHand: detail.quantityInStock,
            reservedQuantity: detail.reservedQuantity,
            alertThreshold: detail.reorderLevel,
            sellingPrice: detail.sellingPrice,
            importPrice: detail.purchasePrice,
            unit: detail.unit,
            useForAllModels: detail.universal,
            status: detail.quantityInStock > 0 ? 'Đã nhập' : 'Chờ nhập',
            note: detail.note
          })
          return
        }
      } catch (err) {
        console.error(err)
      }
    }

    editForm.setFieldsValue({
      name: part.name,
      origin: part.origin,
      brand: part.brand,
      vehicleModel: part.vehicleModel,
      quantityOnHand: part.quantityOnHand,
      reservedQuantity: part.reservedQuantity,
      alertThreshold: part.alertThreshold,
      sellingPrice: part.sellingPrice,
      importPrice: part.importPrice,
      unit: part.unit,
      useForAllModels: part.universal,
      status: part.status,
      note: part.note
    })
  }

  const handleCreatePart = async (values) => {
    try {
      const payload = {
        name: values.name,
        market: values.origin || 'VN',
        categoryId: 0,
        purchasePrice: values.importPrice || 0,
        sellingPrice: values.sellingPrice || 0,
        reorderLevel: values.alertThreshold || 0,
        unit: values.unit || '',
        universal: values.useForAllModels || false,
        specialPart: false,
        compatibleVehicleModelIds: values.useForAllModels ? [] : (values.vehicleModelIds || []),
        discountRate: 0
      }

      const { data: response, error } = await partsAPI.create(payload)
      if (error || !response) {
        throw new Error(error || 'Tạo linh kiện không thành công.')
      }

      message.success('Thêm linh kiện thành công')
      createForm.resetFields()
      setCreateModalOpen(false)
      fetchParts(page - 1, pageSize)
    } catch (err) {
      console.error(err)
      message.error(err.message || 'Không thể tạo linh kiện')
    }
  }

  const handleUpdatePart = async (values) => {
    if (!selectedPart?.id) {
      message.error('Không tìm thấy thông tin linh kiện')
      return
    }

    try {
      const payload = {
        name: values.name,
        market: values.origin || 'VN',
        categoryId: selectedPart.categoryId || 0,
        purchasePrice: values.importPrice || 0,
        sellingPrice: values.sellingPrice || 0,
        reorderLevel: values.alertThreshold || 0,
        unit: values.unit || '',
        universal: values.useForAllModels || false,
        specialPart: selectedPart.specialPart || false,
        compatibleVehicleModelIds: values.useForAllModels ? [] : selectedPart.compatibleVehicleModelIds || [],
        discountRate: selectedPart.discountRate || 0
      }

      const { data: response, error } = await partsAPI.update(selectedPart.id, payload)
      if (error || !response) {
        throw new Error(error || 'Cập nhật linh kiện không thành công.')
      }

      message.success('Cập nhật thành công')
      setModalOpen(false)
      fetchParts(page - 1, pageSize)
    } catch (err) {
      console.error(err)
      message.error(err.message || 'Không thể cập nhật linh kiện')
    }
  }

  const handleCreateModalClose = () => {
    setCreateModalOpen(false)
    createForm.resetFields()
  }

  return (
    <WarehouseLayout>
      <div style={{ padding: 24, minHeight: '100vh' }}>
        <Card
          title={<span style={{ fontSize: 20, fontWeight: 600 }}>Danh sách linh kiện</span>}
          extra={
            <Space size={12}>
              <Search
                placeholder="Tìm kiếm theo tên, hãng"
                allowClear
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: 260 }}
              />
              <DatePicker
                placeholder="Ngày nhập"
                suffixIcon={<CalendarOutlined />}
                value={dateFilter}
                onChange={setDateFilter}
              />
              <Select
                value={statusFilter}
                options={STATUS_OPTIONS}
                onChange={setStatusFilter}
                style={{ width: 160 }}
              />
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalOpen(true)}>
                Thêm linh kiện
              </Button>
            </Space>
          }
        >
          <Table
            columns={columns}
            dataSource={filteredData}
            loading={loading}
            pagination={{
              current: page,
              pageSize,
              total,
              showSizeChanger: true,
              showTotal: (t) => `Tổng ${t} linh kiện`,
              pageSizeOptions: ['10', '20', '50', '100'],
              onChange: (current, size) => {
                setPage(current)
                setPageSize(size)
              }
            }}
            components={goldTableHeader}
            onRow={(record) => ({
              onClick: () => handleOpenDetail(record)
            })}
          />
        </Card>
      </div>

      <Modal
        title={null}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        closable={false}
        footer={null}
        width={580}
        bodyStyle={{ background: '#fff', padding: 0 }}
      >
        {selectedPart && (
          <>
            <div
              style={{
                background: '#CBB081',
                padding: '16px 20px',
                margin: '-24px -24px 24px -24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <span style={{ fontWeight: 700, fontSize: 20 }}>CHI TIẾT LINH KIỆN</span>
              <CloseOutlined style={{ cursor: 'pointer' }} onClick={() => setModalOpen(false)} />
            </div>

            <div style={{ padding: 24 }}>
              <Form layout="vertical" form={editForm} onFinish={handleUpdatePart}>
                <div style={{ display: 'flex', gap: 16 }}>
                  <Form.Item label="Trạng thái" name="status" style={{ flex: 1 }}>
                    <Select
                      options={[
                        { value: 'Chờ nhập', label: 'Chờ nhập' },
                        { value: 'Đã nhập', label: 'Đã nhập' }
                      ]}
                    />
                  </Form.Item>
                  <Form.Item label="Số lượng" name="quantityOnHand" style={{ flex: 1 }}>
                    <InputNumber min={0} style={{ width: '100%' }} />
                  </Form.Item>
                </div>

                <Form.Item label="Tên linh kiện" name="name" rules={[{ required: true, message: 'Vui lòng nhập tên' }]}>
                  <Input />
                </Form.Item>

                <Form.Item label="Xuất xứ" name="origin">
                  <Select
                    options={[
                      { value: 'VN', label: 'Việt Nam' },
                      { value: 'USA', label: 'USA' },
                      { value: 'China', label: 'Trung Quốc' },
                      { value: 'UK', label: 'UK' }
                    ]}
                  />
                </Form.Item>

                <Form.Item name="useForAllModels" valuePropName="checked">
                  <Checkbox>Dùng chung tất cả dòng xe</Checkbox>
                </Form.Item>

                <div style={{ display: 'flex', gap: 16 }}>
                  <Form.Item label="Giá bán" name="sellingPrice" style={{ flex: 1 }}>
                    <InputNumber min={0} style={{ width: '100%' }} addonAfter="/ đ" />
                  </Form.Item>
                  <Form.Item label="Giá nhập" name="importPrice" style={{ flex: 1 }}>
                    <InputNumber min={0} style={{ width: '100%' }} addonAfter="/ đ" />
                  </Form.Item>
                </div>

                <Form.Item label="Đơn vị" name="unit">
                  <Input placeholder="lít, bộ, cái..." />
                </Form.Item>

                <Form.Item label="Ghi chú" name="note">
                  <Input.TextArea rows={3} />
                </Form.Item>

                <div style={{ textAlign: 'center', marginTop: 8 }}>
                  <Button type="primary" htmlType="submit">
                    Cập nhật
                  </Button>
                </div>
              </Form>
            </div>
          </>
        )}
      </Modal>

      <Modal
        title={null}
        open={createModalOpen}
        onCancel={handleCreateModalClose}
        closable={false}
        footer={null}
        width={580}
        bodyStyle={{ background: '#fff', padding: 0 }}
      >
        <div
          style={{
            background: '#CBB081',
            padding: '16px 20px',
            margin: '-24px -24px 24px -24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <span style={{ fontWeight: 700, fontSize: 20 }}>THÊM LINH KIỆN</span>
          <CloseOutlined style={{ cursor: 'pointer' }} onClick={handleCreateModalClose} />
        </div>

        <div style={{ padding: 24 }}>
          <Form layout="vertical" form={createForm} onFinish={handleCreatePart}>
            <div style={{ display: 'flex', gap: 16 }}>
              <Form.Item
                label="Trạng thái"
                name="status"
                style={{ flex: 1 }}
                rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
              >
                <Select
                  options={[
                    { value: 'Chờ nhập', label: 'Chờ nhập' },
                    { value: 'Đã nhập', label: 'Đã nhập' }
                  ]}
                />
              </Form.Item>
              <Form.Item
                label="Số lượng"
                name="quantityOnHand"
                style={{ flex: 1 }}
                rules={[{ required: true, message: 'Nhập số lượng' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </div>

            <Form.Item
              label="Tên linh kiện"
              name="name"
              rules={[{ required: true, message: 'Vui lòng nhập tên linh kiện' }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              label="Xuất xứ"
              name="origin"
              rules={[{ required: true, message: 'Vui lòng chọn xuất xứ' }]}
            >
              <Select
                options={[
                  { value: 'VN', label: 'Việt Nam' },
                  { value: 'USA', label: 'USA' },
                  { value: 'China', label: 'Trung Quốc' },
                  { value: 'UK', label: 'UK' }
                ]}
              />
            </Form.Item>

            <Form.Item name="useForAllModels" valuePropName="checked">
              <Checkbox>Dùng chung tất cả dòng xe</Checkbox>
            </Form.Item>

            <div style={{ display: 'flex', gap: 16 }}>
              <Form.Item
                label="Giá bán"
                name="sellingPrice"
                style={{ flex: 1 }}
                rules={[{ required: true, message: 'Nhập giá bán' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} addonAfter="/ đ" />
              </Form.Item>
              <Form.Item
                label="Giá nhập"
                name="importPrice"
                style={{ flex: 1 }}
                rules={[{ required: true, message: 'Nhập giá nhập' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} addonAfter="/ đ" />
              </Form.Item>
            </div>

            <Form.Item label="Đơn vị" name="unit">
              <Input placeholder="lít, bộ, cái..." />
            </Form.Item>

            <Form.Item label="Ghi chú" name="note">
              <Input.TextArea rows={3} />
            </Form.Item>

            <div style={{ textAlign: 'center', marginTop: 8 }}>
              <Button type="primary" htmlType="submit">
                Xác nhận
              </Button>
            </div>
          </Form>
        </div>
      </Modal>
    </WarehouseLayout>
  )
}

