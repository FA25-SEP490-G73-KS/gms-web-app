import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card, Col, Row, Tabs, Table, Tag, Spin, message, Button, Modal, Form, Input, Select } from 'antd'
import ManagerLayout from '../../layouts/ManagerLayout'
import { customersAPI } from '../../services/api'
import { goldTableHeader } from '../../utils/tableComponents'

const loyaltyConfig = {
  BRONZE: { color: '#a97155', label: 'Bronze' },
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
  { licensePlate: '30A-12345', brandName: 'Vinfast', modelName: 'VF3', lastServiceDate: '12/01/2025' },
  { licensePlate: '30A-1237', brandName: 'Honda', modelName: 'A', lastServiceDate: '05/02/2025' },
]

const fallbackSpending = [
  { month: '01/2025', amount: 3500000 },
  { month: '02/2025', amount: 1500000 },
  { month: '03/2025', amount: 4200000 },
]

export default function CustomerDetailForManager() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [customer, setCustomer] = useState(fallbackCustomer)
  const [vehicles, setVehicles] = useState(fallbackVehicles)
  const [serviceHistory, setServiceHistory] = useState(fallbackServices)
  const [spending, setSpending] = useState(fallbackSpending)
  const [editVisible, setEditVisible] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [form] = Form.useForm()

  const fetchServiceHistory = useCallback(async (phone) => {
    if (!phone) return
    try {
      const { data, error } = await customersAPI.getServiceHistory(phone)
      if (error) {
        throw new Error(error)
      }
      const payload = data?.result || data?.data || data
      const list = payload?.vehicles || []
      if (!list.length) {
        setServiceHistory([])
        return
      }
      setServiceHistory(
        list.map((item, index) => ({
          licensePlate: item.licensePlate || `Xe-${index}`,
          brandName: item.brandName || '—',
          modelName: item.modelName || '—',
          lastServiceDate: item.lastServiceDate || '—',
        }))
      )
    } catch (err) {
      message.error(err.message || 'Không thể tải lịch sử dịch vụ, hiển thị dữ liệu mẫu.')
      setServiceHistory(fallbackServices)
    }
  }, [])

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
              brand: vehicle.brand || '—',
              model: vehicle.model || '—',
              vin: vehicle.vin || '—',
              year: vehicle.year || '—',
            }))
          )
        }
        await fetchServiceHistory(phoneValue)
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
    { title: 'Biển số', dataIndex: 'plate', key: 'plate' },
    { title: 'Hãng', dataIndex: 'brand', key: 'brand' },
    { title: 'Model', dataIndex: 'model', key: 'model' },
    { title: 'Số khung', dataIndex: 'vin', key: 'vin' },
    { title: 'Năm sản xuất', dataIndex: 'year', key: 'year' },
  ]

  const serviceColumns = [
    { title: 'Biển số', dataIndex: 'licensePlate', key: 'licensePlate' },
    { title: 'Hãng', dataIndex: 'brandName', key: 'brandName' },
    { title: 'Model', dataIndex: 'modelName', key: 'modelName' },
    { title: 'Ngày sửa gần nhất', dataIndex: 'lastServiceDate', key: 'lastServiceDate' },
  ]

  const openEditModal = () => {
    form.setFieldsValue({
      fullName: customer.fullName,
      phone: customer.phone,
      address: customer.address,
      customerType: customer.customerType || 'CA_NHAN',
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
      const payload = {
        customerId: customer.id,
        fullName: values.fullName?.trim(),
        phone: values.phone?.trim(),
        address: values.address?.trim(),
        customerType: values.customerType,
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
        customerType: payload.customerType || prev.customerType,
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

  const spendingColumns = [
    { title: 'Tháng', dataIndex: 'month', key: 'month' },
    {
      title: 'Chi tiêu',
      dataIndex: 'amount',
      key: 'amount',
      align: 'right',
      render: (value) => value.toLocaleString('vi-VN'),
    },
  ]

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
                <div style={{ color: '#98A2B3' }}>Quản lý dữ liệu cá nhân & lịch sử dịch vụ</div>
              </Col>
              <Col>
                <Button type="primary" onClick={openEditModal}>
                  Chỉnh sửa
                </Button>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Card bordered={false} style={{ borderRadius: 12, background: '#fdfaf5' }}>
                  <h3 style={{ marginBottom: 4 }}>Tên khách hàng: {customer.fullName}</h3>
                  <div style={{ marginBottom: 8 }}>
                    {loyaltyTag}{' '}
                    {customer.customerType === 'DOANH_NGHIEP' && <Tag color="#cbb081">Doanh nghiệp</Tag>}
                  </div>
                  <div>Số điện thoại: {customer.phone}</div>
                  <div>Địa chỉ: {customer.address}</div>
                </Card>
              </Col>
              <Col xs={24} md={12}>
                <Card bordered={false} style={{ borderRadius: 12, background: '#f5f9ff' }}>
                  <div>Tổng chi tiêu: {customer.totalSpending.toLocaleString('vi-VN')} đ</div>
                  <div>Số xe: {customer.licensePlates?.length || 0}</div>
                  <div>Số lần sử dụng: {customer.latestService}</div>
                </Card>
              </Col>
            </Row>

            <Tabs
              defaultActiveKey="vehicles"
              style={{ marginTop: 24 }}
              items={[
                { key: 'vehicles', label: 'Danh sách xe' },
                { key: 'history', label: 'Lịch sử dịch vụ' },
                { key: 'spending', label: 'Chi tiêu' },
              ]}
            >
              <Tabs.TabPane tab="Danh sách xe" key="vehicles">
                <Table
                  columns={vehicleColumns}
                  dataSource={vehicles.map((item) => ({ ...item, key: item.plate }))}
                  pagination={false}
                  components={goldTableHeader}
                  style={{ marginTop: 16 }}
                />
              </Tabs.TabPane>
              <Tabs.TabPane tab="Lịch sử dịch vụ" key="history">
                <Table
                  columns={serviceColumns}
                  dataSource={serviceHistory.map((item) => ({ ...item, key: item.licensePlate }))}
                  pagination={false}
                  components={goldTableHeader}
                  style={{ marginTop: 16 }}
                />
              </Tabs.TabPane>
              <Tabs.TabPane tab="Chi tiêu" key="spending">
                <Table
                  columns={spendingColumns}
                  dataSource={spending.map((item) => ({ ...item, key: item.month }))}
                  pagination={false}
                  components={goldTableHeader}
                  style={{ marginTop: 16 }}
                />
              </Tabs.TabPane>
            </Tabs>
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
            label="Loại khách hàng"
            name="customerType"
            rules={[{ required: true, message: 'Vui lòng chọn loại khách hàng' }]}
          >
            <Select
              options={[
                { label: 'Cá nhân', value: 'CA_NHAN' },
                { label: 'Doanh nghiệp', value: 'DOANH_NGHIEP' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </ManagerLayout>
  )
}


