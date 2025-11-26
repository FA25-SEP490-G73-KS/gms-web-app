import React, { useState, useEffect } from 'react'
import { Form, Input, DatePicker, Button, Card, Row, Col, Space, message, Modal } from 'antd'
import { useLocation, useNavigate } from 'react-router-dom'
import AdminLayout from '../../layouts/AdminLayout'
import { serviceTicketAPI, employeesAPI, vehiclesAPI, customersAPI } from '../../services/api'

const { TextArea } = Input

const SERVICES = [
  { label: 'Thay thế phụ tùng', value: 1 },
  { label: 'Sơn', value: 2 },
  { label: 'Bảo dưỡng', value: 3 }
]

export default function CreateTicket() {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [techOptions, setTechOptions] = useState([])
  const [techLoading, setTechLoading] = useState(false)
  const [brands, setBrands] = useState([])
  const [models, setModels] = useState([])
  const [modelsLoading, setModelsLoading] = useState(false)
  const [brandsLoading, setBrandsLoading] = useState(false)
  const [customerLookupLoading, setCustomerLookupLoading] = useState(false)
  const [customerExists, setCustomerExists] = useState(false)
  const [currentPhone, setCurrentPhone] = useState('')
  const [showCreateCustomerModal, setShowCreateCustomerModal] = useState(false)
  const [newCustomer, setNewCustomer] = useState({ phone: '', fullName: '', address: '' })
  const navigate = useNavigate()
  const location = useLocation()
  const appointmentPrefill = location.state || {}

  useEffect(() => {
    if (appointmentPrefill?.customer || appointmentPrefill?.phone) {
      let phoneValue = appointmentPrefill.phone || ''
      if (phoneValue && phoneValue.startsWith('84')) {
        phoneValue = '0' + phoneValue.slice(2)
      }

      form.setFieldsValue({
        phone: phoneValue,
        name: appointmentPrefill.customer || '',
        plate: appointmentPrefill.licensePlate || '',
        note: appointmentPrefill.note || '',
      })

      if (phoneValue) {
        setCurrentPhone(phoneValue)
        fetchCustomerByPhone(phoneValue)
      }
    }
  }, [appointmentPrefill, form])

  const fetchCustomerByPhone = async (phone) => {
    setCustomerLookupLoading(true)
    try {
      const { data, error } = await customersAPI.getByPhone(phone)

      if (error || !data || !data.result) {
        setCustomerExists(false)
        setCustomerLookupLoading(false)
        return
      }

      const customer = data.result
      setCustomerExists(true)

      form.setFieldsValue({
        name: customer.fullName || customer.name || form.getFieldValue('name'),
        address: customer.address || form.getFieldValue('address'),
      })
    } catch (err) {
      console.error('Lookup customer by phone failed:', err)
      setCustomerExists(false)
    } finally {
      setCustomerLookupLoading(false)
    }
  }

  const normalizePhoneTo84 = (phone) => {
    const cleaned = String(phone || '').replace(/\D/g, '')
    if (cleaned.startsWith('0')) {
      return '84' + cleaned.slice(1)
    }
    if (cleaned.startsWith('84')) return cleaned
    return cleaned
  }

  useEffect(() => {
    const fetchTechnicians = async () => {
      setTechLoading(true)
      const { data, error } = await employeesAPI.getTechnicians()
      if (error) {
        message.error('Không thể tải danh sách kỹ thuật viên')
        setTechLoading(false)
        return
      }

      const technicians = data?.result || data || []
      setTechOptions(
        technicians.map((tech) => ({
          value: tech.employeeId || tech.id,
          label: tech.fullName || tech.name || tech.employeeName,
        }))
      )
      setTechLoading(false)
    }

    fetchTechnicians()
  }, [])

  useEffect(() => {
    const fetchBrands = async () => {
      setBrandsLoading(true)
      const { data, error } = await vehiclesAPI.getBrands()
      if (error) {
        message.error('Không thể tải danh sách hãng xe')
        setBrandsLoading(false)
        return
      }
      const brandList = data?.result || data || []
      console.log('Vehicle brands from API:', brandList)
      setBrands(brandList)
      setBrandsLoading(false)
    }
    fetchBrands()
  }, [])

  const handleBrandChange = async (brandId) => {
    form.setFieldsValue({ model: undefined })
    if (!brandId) {
      setModels([])
      return
    }

    setModelsLoading(true)
    const { data, error } = await vehiclesAPI.getModelsByBrand(brandId)
    if (error) {
      message.error('Không thể tải danh sách mẫu xe')
      setModels([])
      setModelsLoading(false)
      return
    }
    const modelList = data?.result || data || []
    setModels(modelList)
    setModelsLoading(false)
  }

  const handleCreate = async (values) => {
    setLoading(true)

    let expectedDeliveryAt = ''
    if (values.receiveDate) {
      if (typeof values.receiveDate === 'string') {
        expectedDeliveryAt = values.receiveDate
      } else if (values.receiveDate.format) {
        expectedDeliveryAt = values.receiveDate.format('YYYY-MM-DD')
      }
    }

    const payload = {
      appointmentId: appointmentPrefill.appointmentId || 0,
      serviceTypeIds: values.service || [],
      customer: {
        customerId: 0,
        fullName: values.name,
        phone: values.phone,
        address: values.address,
        customerType: 'CA_NHAN',
        loyaltyLevel: 'NORMAL'
      },
      vehicle: {
        vehicleId: 0,
        licensePlate: values.plate,
        brandId: 0,
        modelId: 0,
        year: 0,
        vin: values.vin || ''
      },
      advisorId: 1,
      assignedTechnicianIds: values.techs || [],
      receiveCondition: '',
      note: values.note || '',
      expectedDeliveryAt,
    }

    const { data, error } = await serviceTicketAPI.create(payload)
    setLoading(false)

    if (error) {
      message.error('Tạo phiếu không thành công')
      return
    }

    message.success('Tạo phiếu dịch vụ thành công')
    form.resetFields()
    navigate('/service-advisor/orders')
  }

  return (
    <AdminLayout>
      <div style={{ padding: '24px', background: '#f5f7fb', minHeight: '100vh' }}>
        <Card
          title={<span style={{ fontSize: '20px', fontWeight: 600 }}>Tạo phiếu dịch vụ</span>}
          style={{ borderRadius: '12px' }}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleCreate}
          >
            <Row gutter={24}>
              <Col span={12}>
                <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: 600 }}>Thông tin khách hàng</h3>
                <Form.Item
                  label="Số điện thoại"
                  name="phone"
                  rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }]}
                >
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Input
                      placeholder="VD: 0123456789"
                      onBlur={(e) => {
                        const raw = e.target.value.trim()
                        if (!raw) return
                        setCurrentPhone(raw)
                        fetchCustomerByPhone(raw)
                      }}
                      style={{ flex: 1 }}
                    />
                    {!customerExists && (
                      <Button
                        onClick={() => {
                          const phoneValue = form.getFieldValue('phone') || currentPhone
                          if (!phoneValue) {
                            message.warning('Vui lòng nhập số điện thoại trước')
                            return
                          }
                          setNewCustomer({
                            phone: phoneValue,
                            fullName: form.getFieldValue('name') || '',
                            address: form.getFieldValue('address') || '',
                          })
                          setShowCreateCustomerModal(true)
                        }}
                      >
                        Tạo mới
                      </Button>
                    )}
                  </div>
                </Form.Item>

                <Form.Item
                  label="Họ và tên"
                  name="name"
                  rules={[{ required: true, message: 'Vui lòng nhập họ và tên' }]}
                >
                  <Input placeholder="VD: Đặng Thị Huyền" />
                </Form.Item>

                <Form.Item
                  label="Địa chỉ"
                  name="address"
                  rules={[{ required: true, message: 'Vui lòng nhập địa chỉ' }]}
                >
                  <Input placeholder="VD: Hòa Lạc - Hà Nội" />
                </Form.Item>

                <h3 style={{ marginTop: '24px', marginBottom: '16px', fontSize: '16px', fontWeight: 600 }}>Thông tin xe</h3>
                <Form.Item
                  label="Biển số xe"
                  name="plate"
                  rules={[{ required: true, message: 'Vui lòng nhập biển số xe' }]}
                >
                  <Input placeholder="VD: 30A-12345" />
                </Form.Item>

                <Form.Item
                  label="Hãng xe"
                  name="brand"
                  rules={[{ required: true, message: 'Vui lòng chọn hãng xe' }]}
                >
                  <select
                    style={{ width: '100%', height: 32, borderRadius: 4, border: '1px solid #d9d9d9', padding: '0 8px' }}
                    onChange={(e) => handleBrandChange(e.target.value)}
                    defaultValue=""
                  >
                    <option value="" disabled>
                      {brandsLoading ? 'Đang tải hãng xe...' : 'Chọn hãng xe'}
                    </option>
                    {brands.map((brand) => (
                      <option key={brand.id} value={brand.id}>
                        {brand.name}
                      </option>
                    ))}
                  </select>
                </Form.Item>

                <Form.Item
                  label="Loại xe"
                  name="model"
                  rules={[{ required: true, message: 'Vui lòng chọn mẫu xe' }]}
                >
                  <select
                    style={{ width: '100%', height: 32, borderRadius: 4, border: '1px solid #d9d9d9', padding: '0 8px' }}
                    disabled={modelsLoading || models.length === 0}
                    defaultValue=""
                    onChange={(e) => form.setFieldsValue({ model: e.target.value })}
                  >
                    <option value="" disabled>
                      {modelsLoading ? 'Đang tải mẫu xe...' : 'Chọn mẫu xe'}
                    </option>
                    {models.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name}
                      </option>
                    ))}
                  </select>
                </Form.Item>

                <Form.Item
                  label="Số khung"
                  name="vin"
                >
                  <Input placeholder="VD: RL4XW430089206813" />
                </Form.Item>
              </Col>

              <Col span={12}>
                <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: 600 }}>Chi tiết dịch vụ</h3>
                <Form.Item
                  label="Kỹ thuật viên sửa chữa"
                  name="techs"
                >
                  <select
                    multiple
                    style={{
                      width: '100%',
                      minHeight: 80,
                      borderRadius: 4,
                      border: '1px solid #d9d9d9',
                      padding: '4px 8px',
                    }}
                    value={form.getFieldValue('techs') || []}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions).map((opt) =>
                        Number(opt.value)
                      )
                      form.setFieldsValue({ techs: selected })
                    }}
                    disabled={techLoading || techOptions.length === 0}
                  >
                    {techLoading && <option>Đang tải kỹ thuật viên...</option>}
                    {!techLoading && techOptions.length === 0 && (
                      <option>Không có kỹ thuật viên khả dụng</option>
                    )}
                    {!techLoading &&
                      techOptions.map((tech) => (
                        <option key={tech.value} value={tech.value}>
                          {tech.label}
                        </option>
                      ))}
                  </select>
                </Form.Item>

                <Form.Item
                  label="Ngày nhận xe"
                  name="receiveDate"
                >
                  <input
                    type="date"
                    style={{ width: '100%', height: 32, borderRadius: 4, border: '1px solid #d9d9d9', padding: '0 8px' }}
                    onChange={(e) => form.setFieldsValue({ receiveDate: e.target.value })}
                  />
                </Form.Item>

                <Form.Item
                  label="Ghi chú"
                  name="note"
                >
                  <TextArea rows={6} placeholder="Nhập ghi chú..." />
                </Form.Item>

                <Row justify="end" style={{ marginTop: '32px' }}>
                  <Space>
                    <Button onClick={() => navigate('/service-advisor/orders')}>Hủy</Button>
                    <Button type="primary" htmlType="submit" loading={loading} style={{ background: '#22c55e', borderColor: '#22c55e' }}>
                      Tạo phiếu
                    </Button>
                  </Space>
                </Row>
              </Col>
            </Row>
          </Form>

          <Modal
            title="Tạo khách hàng mới"
            open={showCreateCustomerModal}
            onCancel={() => setShowCreateCustomerModal(false)}
            onOk={async () => {
              if (!newCustomer.phone || !newCustomer.fullName) {
                message.warning('Vui lòng nhập đầy đủ Số điện thoại và Họ tên')
                return
              }
              try {
                const payload = {
                  address: newCustomer.address || '',
                  customerId: 0,
                  customerType: 'CA_NHAN',
                  discountPolicyId: 0,
                  fullName: newCustomer.fullName,
                  phone: normalizePhoneTo84(newCustomer.phone),
                }
                const { data, error } = await customersAPI.create(payload)
                if (error) {
                  message.error(error || 'Tạo khách hàng không thành công')
                  return
                }
                const created = data?.result || data || payload
                form.setFieldsValue({
                  phone: newCustomer.phone,
                  name: created.fullName || newCustomer.fullName,
                  address: created.address || newCustomer.address,
                })
                setCustomerExists(true)
                message.success('Tạo khách hàng mới thành công')
                setShowCreateCustomerModal(false)
              } catch (err) {
                message.error(err.message || 'Đã xảy ra lỗi khi tạo khách hàng')
              }
            }}
            okText="Tạo khách"
            cancelText="Hủy"
          >
            <Form layout="vertical">
              <Form.Item label="Số điện thoại">
                <Input
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                />
              </Form.Item>
              <Form.Item label="Họ tên">
                <Input
                  value={newCustomer.fullName}
                  onChange={(e) => setNewCustomer({ ...newCustomer, fullName: e.target.value })}
                />
              </Form.Item>
              <Form.Item label="Địa chỉ">
                <Input.TextArea
                  rows={3}
                  value={newCustomer.address}
                  onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                />
              </Form.Item>
            </Form>
          </Modal>
        </Card>
      </div>
    </AdminLayout>
  )
}
