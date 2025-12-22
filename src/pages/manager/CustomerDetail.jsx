import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card, Col, Row, Tabs, Table, Tag, Spin, message, Button, Modal, Form, Input, Select, InputNumber } from 'antd'
import { EyeOutlined, CloseOutlined } from '@ant-design/icons'
import ManagerLayout from '../../layouts/ManagerLayout'
import { customersAPI, serviceTicketAPI } from '../../services/api'
import { goldTableHeader } from '../../utils/tableComponents'
import { normalizePhoneTo84, displayPhoneFrom84 } from '../../utils/helpers'

const loyaltyConfig = {
  BRONZE: { color: '#a97155', label: 'Bronze' },
  // Backend enum đang dùng 'SLIVER' (typo), vẫn giữ 'SILVER' để tương thích cũ
  SLIVER: { color: '#c0c0c0', label: 'Silver' },
  SILVER: { color: '#c0c0c0', label: 'Silver' },
  GOLD: { color: '#d4af37', label: 'Gold' },
  PLATINUM: { color: '#4f8cff', label: 'Platinum' },
}

const fallbackCustomer = {
  id: null,
  fullName: 'Nguyễn Văn A',
  phone: '0123456789',
  address: '123 Nguyễn Trãi, Hà Nội',
  totalSpending: 12000000,
  loyaltyLevel: 'GOLD',
  latestService: 'Mazda - v3',
  licensePlates: ['30A-12345', '30A-1237'],
  customerType: 'CA_NHAN',
}

const fallbackVehicles = [
  { plate: '30A-12345', brand: 'Vinfast', model: 'VF3', vin: '1', year: 2018 },
  { plate: '30A-1237', brand: 'Honda', model: 'A', vin: '2', year: 2020 },
]

const fallbackServices = [
  { 
    code: 'STK-2025-000001',
    licensePlate: '30A-12345', 
    createdDate: '11/11/2025',
    completedDate: '--',
    totalAmount: 3000000,
    status: 'Chờ',
    customerName: 'Nguyễn Văn A',
    phone: '0123456789',
    vehicleType: 'Vinfast',
    vehiclePlate: '30A-12345',
    vin: '1HGCM82633A123456',
    creator: 'Hoàng Văn B',
    createDate: '11/11/2025',
    technician: 'Nguyễn Văn B',
    serviceType: 'Thay thế phụ tùng'
  },
  { 
    code: 'STK-2024-000002',
    licensePlate: '30A-1237', 
    createdDate: '11/11/2024',
    completedDate: '15/11/2024',
    totalAmount: 4000000,
    status: 'Hoàn thành',
    customerName: 'Nguyễn Văn A',
    phone: '0123456789',
    vehicleType: 'Honda',
    vehiclePlate: '30A-1237',
    vin: '2HGCM82633A123457',
    creator: 'Hoàng Văn B',
    createDate: '11/11/2024',
    technician: 'Nguyễn Văn C',
    serviceType: 'Bảo dưỡng định kỳ'
  },
]

export default function CustomerDetailForManager() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [customer, setCustomer] = useState(fallbackCustomer)
  const [vehicles, setVehicles] = useState(fallbackVehicles)
  const [serviceHistory, setServiceHistory] = useState(fallbackServices)
  const [editVisible, setEditVisible] = useState(false)
  const [serviceDetailVisible, setServiceDetailVisible] = useState(false)
  const [selectedService, setSelectedService] = useState(null)
  const [loadingServiceDetail, setLoadingServiceDetail] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [form] = Form.useForm()

  const fetchServiceDetail = async (serviceTicketId) => {
    setLoadingServiceDetail(true)
    try {
      const { data, error } = await serviceTicketAPI.getById(serviceTicketId)
      if (error) {
        throw new Error(error)
      }
      const result = data?.result || {}
      const priceQuotation = result?.priceQuotation || {}
      
      // Separate items by type
      const partItems = priceQuotation.items?.filter(item => item.itemType === 'PART') || []
      const serviceItems = priceQuotation.items?.filter(item => item.itemType === 'SERVICE') || []
      
      setSelectedService({
        // Basic info
        code: result.serviceTicketCode || '—',
        status: result.status || '—',
        customerName: result.customer?.fullName || '—',
        phone: result.customer?.phone || '—',
        vehicleType: result.vehicle?.brandName || '—',
        vehiclePlate: result.vehicle?.licensePlate || '—',
        vin: result.vehicle?.vin || '—',
        creator: result.createdBy || '—',
        createDate: priceQuotation.createdAt || '—',
        technician: result.technicians?.join(', ') || '—',
        serviceType: result.serviceType?.join(', ') || '—',
        // Price quotation items
        partItems: partItems.map(item => ({
          name: item.itemName || '—',
          quantity: item.quantity || 0,
          unit: item.unit || 'Cái',
          unitPrice: item.unitPrice || 0,
          totalPrice: item.totalPrice || 0
        })),
        serviceItems: serviceItems.map(item => ({
          name: item.itemName || '—',
          quantity: item.quantity || 0,
          unit: item.unit || 'Cái',
          unitPrice: item.unitPrice || 0,
          totalPrice: item.totalPrice || 0
        })),
        estimateAmount: priceQuotation.estimateAmount || 0,
        discount: priceQuotation.discount || 0,
        finalAmount: (priceQuotation.estimateAmount || 0) - (priceQuotation.discount || 0)
      })
      setServiceDetailVisible(true)
    } catch (err) {
      console.error('Failed to fetch service detail:', err)
      message.error('Không thể tải chi tiết phiếu dịch vụ')
    } finally {
      setLoadingServiceDetail(false)
    }
  }

  const fetchServiceHistory = useCallback(async (customerId) => {
    if (!customerId) return
    try {
      const { data, error } = await customersAPI.getServiceHistoryById(customerId)
      if (error) {
        throw new Error(error)
      }
      const payload = data?.result || data?.data || data
      const historyList = payload?.history || []
      if (!historyList.length) {
        setServiceHistory([])
        return
      }
      setServiceHistory(
        historyList.map((item, index) => ({
          code: item.serviceTicketCode || `STK-${index}`,
          licensePlate: item.licensePlate || '—',
          createdDate: item.createdDate || '—',
          completedDate: item.deliveryDate || '--',
          totalAmount: item.totalAmount || 0,
          status: item.status || 'Chờ',
          serviceTicketId: item.serviceTicketId || 0,
          // Mock data for detail modal (will be replaced with actual API later)
          customerName: customer.fullName || 'Nguyễn Văn A',
          phone: customer.phone || '0123456789',
          vehicleType: 'Vinfast',
          vehiclePlate: item.licensePlate || '—',
          vin: '1HGCM82633A123456',
          creator: 'Hoàng Văn B',
          createDate: item.createdDate || '—',
          technician: 'Nguyễn Văn B',
          serviceType: 'Thay thế phụ tùng'
        }))
      )
    } catch (err) {
      console.error('Failed to fetch service history:', err)
      message.error(err.message || 'Không thể tải lịch sử dịch vụ, hiển thị dữ liệu mẫu.')
      setServiceHistory(fallbackServices)
    }
  }, [customer.fullName, customer.phone])

  useEffect(() => {
    if (!id) {
      navigate('/manager/customers')
      return
    }
    const numericId = Number(id)
    if (Number.isNaN(numericId)) {
      message.warning('ID khách hàng không hợp lệ, hiển thị dữ liệu mẫu.')
      setCustomer(fallbackCustomer)
      setVehicles(fallbackVehicles)
      setServiceHistory(fallbackServices)
      setLoading(false)
      return
    }
    const fetchDetail = async () => {
      setLoading(true)
      try {
        const { data, error } = await customersAPI.getById(numericId)
        if (error) {
          throw new Error(error)
        }
        const payload = data?.result || data?.data || data
        const phoneValue = payload?.phone || fallbackCustomer.phone
        setCustomer({
          id: payload?.customerId || numericId,
          fullName: payload?.fullName || payload?.name || fallbackCustomer.fullName,
          phone: phoneValue,
          address: payload?.address || fallbackCustomer.address,
          totalSpending: payload?.totalSpending ?? fallbackCustomer.totalSpending,
          loyaltyLevel: (payload?.loyaltyLevel || 'BRONZE').toUpperCase(),
          latestService: payload?.lastServiceUsed || fallbackCustomer.latestService,
          licensePlates: payload?.licensePlates?.length ? payload.licensePlates : fallbackCustomer.licensePlates,
          customerType: payload?.customerType || fallbackCustomer.customerType,
        })
        if (payload?.vehicles) {
          setVehicles(
            payload.vehicles.map((vehicle, index) => ({
              plate: vehicle.licensePlate || `Xe-${index}`,
              // Hãng xe lấy từ brandName (fallback các field khác nếu cần)
              brand:
                vehicle.brandName ||
                vehicle.brand ||
                vehicle.brand?.name ||
                '—',
              // Dòng xe lấy từ vehicleModelName (fallback các field khác nếu cần)
              model:
                vehicle.vehicleModelName ||
                vehicle.modelName ||
                vehicle.model?.name ||
                vehicle.model ||
                '—',
              vin: vehicle.vin || '—',
              year: vehicle.year || '—',
            }))
          )
        }
        // Fetch service history separately
        await fetchServiceHistory(numericId)
      } catch (err) {
        message.error(err.message || 'Không thể tải thông tin khách hàng, hiển thị dữ liệu mẫu.')
        setCustomer(fallbackCustomer)
        setVehicles(fallbackVehicles)
        setServiceHistory(fallbackServices)
      } finally {
        setLoading(false)
      }
    }
    fetchDetail()
  }, [fetchServiceHistory, id, navigate])

  const loyaltyTag = useMemo(() => {
    const config = loyaltyConfig[customer.loyaltyLevel] || loyaltyConfig.BRONZE
    return (
      <Tag color={config.color} style={{ borderRadius: 999, fontWeight: 600 }}>
        {config.label}
      </Tag>
    )
  }, [customer.loyaltyLevel])

  const vehicleColumns = [
    { 
      title: 'STT', 
      key: 'index',
      width: 70,
      render: (_, __, index) => <span style={{ fontWeight: 600 }}>{index + 1}</span>
    },
    { title: 'Biển số', dataIndex: 'plate', key: 'plate' },
    { title: 'Hãng', dataIndex: 'brand', key: 'brand' },
    { title: 'Dòng xe', dataIndex: 'model', key: 'model' },
    { title: 'Số khung', dataIndex: 'vin', key: 'vin' },
    { title: 'Năm sản xuất', dataIndex: 'year', key: 'year' },
  ]

  const serviceColumns = [
    { 
      title: 'Phiếu', 
      dataIndex: 'code', 
      key: 'code',
      width: 150
    },
    { 
      title: 'Biển số xe', 
      dataIndex: 'licensePlate', 
      key: 'licensePlate',
      width: 120
    },
    { 
      title: 'Ngày tạo', 
      dataIndex: 'createdDate', 
      key: 'createdDate',
      width: 120
    },
    { 
      title: 'Ngày giao', 
      dataIndex: 'completedDate', 
      key: 'completedDate',
      width: 120
    },
    { 
      title: 'Tổng tiền', 
      dataIndex: 'totalAmount', 
      key: 'totalAmount',
      width: 120,
      render: (value) => value?.toLocaleString('vi-VN')
    },
    { 
      title: 'Trạng thái', 
      dataIndex: 'status', 
      key: 'status',
      width: 120,
      align: 'center',
      render: (status) => {
        const color = status === 'Hoàn thành' ? '#10b981' : '#3b82f6'
        return <span style={{ color, fontWeight: 600 }}>{status}</span>
      }
    },
    { 
      title: '', 
      key: 'action',
      width: 60,
      align: 'center',
      render: (_, record) => (
        <Button
          type="text"
          icon={<EyeOutlined style={{ fontSize: 18 }} />}
          loading={loadingServiceDetail}
          onClick={() => fetchServiceDetail(record.serviceTicketId)}
        />
      )
    }
  ]

  const openEditModal = () => {
    form.setFieldsValue({
      fullName: customer.fullName,
      phone: displayPhoneFrom84(customer.phone),
      address: customer.address,
      // Mức độ thân thiết (loyalty level) mặc định BRONZE nếu không có
      customerLoyaltyLevel: (customer.loyaltyLevel || 'BRONZE').toUpperCase(),
    })
    setEditVisible(true)
  }

  const handleUpdateCustomer = async () => {
    try {
      const values = await form.validateFields()
      if (!customer.id) {
        message.error('Không xác định được ID khách hàng để cập nhật')
        return
      }
      setUpdating(true)

      const selectedLoyalty =
        (values.customerLoyaltyLevel || customer.loyaltyLevel || 'BRONZE').toUpperCase()

      const payload = {
        customerId: customer.id,
        fullName: values.fullName?.trim(),
        phone: normalizePhoneTo84(values.phone?.trim()),
        address: values.address?.trim(),
        // Gửi đúng theo CustomerRequestDto ở backend
        // (BRONZE / SILVER / GOLD)
        customerLoyaltyLevel: selectedLoyalty,
      }
      const { error } = await customersAPI.update(customer.id, payload)
      if (error) {
        throw new Error(error)
      }
      setCustomer((prev) => ({
        ...prev,
        fullName: payload.fullName || prev.fullName,
        phone: payload.phone || prev.phone,
        address: payload.address || prev.address,
        loyaltyLevel: selectedLoyalty,
      }))
      message.success('Cập nhật khách hàng thành công')
      setEditVisible(false)
    } catch (err) {
      if (!err?.errorFields) {
        message.error(err.message || 'Cập nhật khách hàng thất bại')
      }
    } finally {
      setUpdating(false)
    }
  }

  return (
    <ManagerLayout>
      <Spin spinning={loading}>
        <div style={{ padding: 24, minHeight: '100vh' }}>
          <div
            style={{
              background: '#fff',
              borderRadius: 16,
              padding: 24,
              boxShadow: '0 12px 30px rgba(15, 23, 42, 0.08)',
            }}
          >
            <Row gutter={16} align="middle" style={{ marginBottom: 12 }}>
              <Col flex="auto">
                <h2 style={{ marginBottom: 0 }}>Thông tin khách hàng</h2>
                <div style={{ color: '#98A2B3', marginTop: 8 }}>Quản lý dữ liệu cá nhân & lịch sử dịch vụ</div>
              </Col>
              <Col>
                <Button type="primary" onClick={openEditModal}>
                  Chỉnh sửa
                </Button>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Card 
                  bordered={false} 
                  style={{ 
                    borderRadius: 12, 
                    background: '#fff',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
                  }}
                >
                  <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 600, fontSize: 15 }}>Tên khách hàng:</span>
                    <span style={{ fontSize: 15 }}>{customer.fullName}</span>
                    {loyaltyTag}
                  </div>
                  <div style={{ marginBottom: 12, fontSize: 14 }}>
                    <span style={{ fontWeight: 600 }}>Số điện thoại:</span> {displayPhoneFrom84(customer.phone)}
                  </div>
                  <div style={{ fontSize: 14 }}>
                    <span style={{ fontWeight: 600 }}>Địa chỉ:</span> {customer.address}
                  </div>
                </Card>
              </Col>
              <Col xs={24} md={12}>
                <Card 
                  bordered={false} 
                  style={{ 
                    borderRadius: 12, 
                    background: '#fff',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
                  }}
                >
                  <div style={{ marginBottom: 12, fontSize: 14 }}>
                    <span style={{ fontWeight: 600 }}>Tổng chi tiêu:</span> {customer.totalSpending.toLocaleString('vi-VN')}
                  </div>
                  <div style={{ marginBottom: 12, fontSize: 14 }}>
                    <span style={{ fontWeight: 600 }}>Số xe:</span> {customer.licensePlates?.length || 0}
                  </div>
                  <div style={{ fontSize: 14 }}>
                    <span style={{ fontWeight: 600 }}>Số lần sửa xe:</span> {serviceHistory.length || 0}
                  </div>
                </Card>
              </Col>
            </Row>

            <Tabs
              defaultActiveKey="vehicles"
              style={{ marginTop: 24 }}
              items={[
                { 
                  key: 'vehicles', 
                  label: <span style={{ fontWeight: 500 }}>Danh sách xe</span>,
                  children: (
                    <Table
                      columns={vehicleColumns}
                      dataSource={vehicles.map((item) => ({ ...item, key: item.plate }))}
                      pagination={false}
                      components={goldTableHeader}
                      style={{ marginTop: 16 }}
                    />
                  )
                },
                { 
                  key: 'history', 
                  label: <span style={{ fontWeight: 500 }}>Lịch sử dịch vụ</span>,
                  children: (
                    <Table
                      columns={serviceColumns}
                      dataSource={serviceHistory.map((item) => ({ ...item, key: item.licensePlate }))}
                      pagination={false}
                      components={goldTableHeader}
                      style={{ marginTop: 16 }}
                    />
                  )
                }
              ]}
            />
          </div>
        </div>
      </Spin>

      <Modal
        open={editVisible}
        title="Cập nhật thông tin khách hàng"
        onCancel={() => setEditVisible(false)}
        onOk={handleUpdateCustomer}
        confirmLoading={updating}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form layout="vertical" form={form}>
          <Form.Item
            label="Họ tên"
            name="fullName"
            rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
          >
            <Input placeholder="Nhập họ tên" />
          </Form.Item>
          <Form.Item
            label="Số điện thoại"
            name="phone"
            rules={[
              { required: true, message: 'Vui lòng nhập số điện thoại' },
              { pattern: /^\d{9,12}$/, message: 'Số điện thoại không hợp lệ' },
            ]}
          >
            <Input placeholder="0123456789" />
          </Form.Item>
          <Form.Item
            label="Địa chỉ"
            name="address"
            rules={[{ required: true, message: 'Vui lòng nhập địa chỉ' }]}
          >
            <Input placeholder="Địa chỉ khách hàng" />
          </Form.Item>
          <Form.Item
            label="Mức độ thân thiết"
            name="customerLoyaltyLevel"
            rules={[{ required: true, message: 'Vui lòng chọn mức độ thân thiết' }]}
          >
            <Select
              options={[
                { label: 'BRONZE', value: 'BRONZE' },
                { label: 'SLIVER', value: 'SLIVER' },
                { label: 'GOLD', value: 'GOLD' }
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Service Detail Modal */}
      <Modal
        open={serviceDetailVisible}
        onCancel={() => {
          setServiceDetailVisible(false)
          setSelectedService(null)
        }}
        footer={null}
        width={900}
        closeIcon={<CloseOutlined style={{ fontSize: 20 }} />}
        styles={{
          header: { 
            background: '#CBB081', 
            color: '#fff',
            padding: '16px 24px',
            borderRadius: '8px 8px 0 0'
          }
        }}
        title={
          <div style={{ textAlign: 'center', fontWeight: 600, fontSize: 18, color: '#000' }}>
            PHIẾU DỊCH VỤ CHI TIẾT
          </div>
        }
      >
        {loadingServiceDetail ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <Spin size="large" />
          </div>
        ) : selectedService && (
          <div style={{ padding: '16px 0' }}>
            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col span={12}>
                <Card bordered style={{ borderRadius: 8, borderColor: '#e5e7eb' }}>
                  <div style={{ marginBottom: 8 }}>
                    <strong>Tên khách hàng:</strong> {selectedService.customerName}
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <strong>Số điện thoại:</strong> {selectedService.phone}
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <strong>Loại xe:</strong> {selectedService.vehicleType}
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <strong>Biển số xe:</strong> {selectedService.vehiclePlate}
                  </div>
                  <div>
                    <strong>Số khung:</strong> {selectedService.vin}
                  </div>
                </Card>
              </Col>
              <Col span={12}>
                <Card bordered style={{ borderRadius: 8, borderColor: '#e5e7eb' }}>
                  <div style={{ marginBottom: 8 }}>
                    <strong>Nhân viên lập báo giá:</strong> {selectedService.creator}
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <strong>Ngày tạo báo giá:</strong> {selectedService.createDate}
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <strong>Kỹ thuật viên sửa chữa:</strong> {selectedService.technician}
                  </div>
                  <div>
                    <strong>Loại dịch vụ:</strong> {selectedService.serviceType}
                  </div>
                </Card>
              </Col>
            </Row>

            <div style={{ marginBottom: 16 }}>
              <h4 style={{ marginBottom: 8, fontWeight: 600 }}>BÁO GIÁ CHI TIẾT</h4>
              <Button type="link" style={{ padding: 0, marginBottom: 8 }}>Nhập</Button>
            </div>

            {/* Thay thế */}
            {selectedService.partItems && selectedService.partItems.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>Thay thế:</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
                  <thead>
                    <tr style={{ background: '#f3f4f6' }}>
                      <th style={{ padding: 8, border: '1px solid #e5e7eb', textAlign: 'left' }}>STT</th>
                      <th style={{ padding: 8, border: '1px solid #e5e7eb', textAlign: 'left' }}>Danh mục</th>
                      <th style={{ padding: 8, border: '1px solid #e5e7eb', textAlign: 'center' }}>Số lượng</th>
                      <th style={{ padding: 8, border: '1px solid #e5e7eb', textAlign: 'center' }}>Đơn vị</th>
                      <th style={{ padding: 8, border: '1px solid #e5e7eb', textAlign: 'right' }}>Đơn giá</th>
                      <th style={{ padding: 8, border: '1px solid #e5e7eb', textAlign: 'right' }}>Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedService.partItems.map((item, index) => (
                      <tr key={index}>
                        <td style={{ padding: 8, border: '1px solid #e5e7eb' }}>{String(index + 1).padStart(2, '0')}</td>
                        <td style={{ padding: 8, border: '1px solid #e5e7eb' }}>{item.name}</td>
                        <td style={{ padding: 8, border: '1px solid #e5e7eb', textAlign: 'center' }}>
                          <InputNumber 
                            min={1} 
                            value={item.quantity} 
                            size="small"
                            style={{ width: 80 }}
                            disabled
                          />
                        </td>
                        <td style={{ padding: 8, border: '1px solid #e5e7eb', textAlign: 'center' }}>{item.unit}</td>
                        <td style={{ padding: 8, border: '1px solid #e5e7eb', textAlign: 'right' }}>
                          {item.unitPrice.toLocaleString('vi-VN')}
                        </td>
                        <td style={{ padding: 8, border: '1px solid #e5e7eb', textAlign: 'right' }}>
                          {item.totalPrice.toLocaleString('vi-VN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Sửa chữa */}
            {selectedService.serviceItems && selectedService.serviceItems.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>Sửa chữa:</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
                  <thead>
                    <tr style={{ background: '#f3f4f6' }}>
                      <th style={{ padding: 8, border: '1px solid #e5e7eb', textAlign: 'left' }}>STT</th>
                      <th style={{ padding: 8, border: '1px solid #e5e7eb', textAlign: 'left' }}>Danh mục</th>
                      <th style={{ padding: 8, border: '1px solid #e5e7eb', textAlign: 'center' }}>Số lượng</th>
                      <th style={{ padding: 8, border: '1px solid #e5e7eb', textAlign: 'center' }}>Đơn vị</th>
                      <th style={{ padding: 8, border: '1px solid #e5e7eb', textAlign: 'right' }}>Đơn giá</th>
                      <th style={{ padding: 8, border: '1px solid #e5e7eb', textAlign: 'right' }}>Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedService.serviceItems.map((item, index) => (
                      <tr key={index}>
                        <td style={{ padding: 8, border: '1px solid #e5e7eb' }}>{String(index + 1).padStart(2, '0')}</td>
                        <td style={{ padding: 8, border: '1px solid #e5e7eb' }}>{item.name}</td>
                        <td style={{ padding: 8, border: '1px solid #e5e7eb', textAlign: 'center' }}>
                          <InputNumber 
                            min={1} 
                            value={item.quantity} 
                            size="small"
                            style={{ width: 80 }}
                            disabled
                          />
                        </td>
                        <td style={{ padding: 8, border: '1px solid #e5e7eb', textAlign: 'center' }}>{item.unit}</td>
                        <td style={{ padding: 8, border: '1px solid #e5e7eb', textAlign: 'right' }}>
                          {item.unitPrice.toLocaleString('vi-VN')}
                        </td>
                        <td style={{ padding: 8, border: '1px solid #e5e7eb', textAlign: 'right' }}>
                          {item.totalPrice.toLocaleString('vi-VN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Thanh toán */}
            <Card bordered style={{ borderRadius: 8, borderColor: '#e5e7eb', background: '#fafafa' }}>
              <div style={{ fontWeight: 600, marginBottom: 12 }}>Thanh toán</div>
              <Row gutter={[16, 8]}>
                <Col span={12}>
                  <div>Tổng tiền hàng</div>
                </Col>
                <Col span={12} style={{ textAlign: 'right' }}>
                  <div>{selectedService.estimateAmount?.toLocaleString('vi-VN') || '0'} đ</div>
                </Col>
                <Col span={12}>
                  <div>Chiết khấu</div>
                </Col>
                <Col span={12} style={{ textAlign: 'right' }}>
                  <div>{selectedService.discount || 0}%</div>
                </Col>
                <Col span={12}>
                  <div style={{ fontWeight: 600 }}>Thành tiền</div>
                </Col>
                <Col span={12} style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 600 }}>{selectedService.finalAmount?.toLocaleString('vi-VN') || '0'} đ</div>
                </Col>
              </Row>
            </Card>
          </div>
        )}
      </Modal>
    </ManagerLayout>
  )
}


