import React, { useState, useEffect } from 'react'
import { Form, Input, Button, Card, Row, Col, Space, message, Modal, Select } from 'antd'
import { useLocation, useNavigate } from 'react-router-dom'
import AdminLayout from '../../layouts/AdminLayout'
import { serviceTicketAPI, employeesAPI, vehiclesAPI, customersAPI } from '../../services/api'
import { normalizePhoneTo84, displayPhoneFrom84 } from '../../utils/helpers'

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
  const [customerId, setCustomerId] = useState(null)

  const [showCreateCustomerModal, setShowCreateCustomerModal] = useState(false)
  const [newCustomer, setNewCustomer] = useState({ phone: '', fullName: '', address: '' })

  const navigate = useNavigate()
  const location = useLocation()
  const appointmentPrefill = location.state || {}

  // Prefill từ lịch hẹn
  useEffect(() => {
    if (appointmentPrefill?.customer || appointmentPrefill?.phone) {
      const phoneValue = displayPhoneFrom84(appointmentPrefill.phone || '')

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
        setCustomerId(null)
        setCustomerLookupLoading(false)
        return
      }

      const customer = data.result
      setCustomerExists(true)
      setCustomerId(customer.customerId || customer.id || null)

      const phoneValue = displayPhoneFrom84(customer.phone || phone)
      
      setCurrentPhone(phoneValue || phone)

      form.setFieldsValue({
        phone: phoneValue || phone,
        name: customer.fullName || customer.name || form.getFieldValue('name'),
        address: customer.address || form.getFieldValue('address'),
      })
    } catch (err) {
      console.error('Lookup customer by phone failed:', err)
      setCustomerExists(false)
      setCustomerId(null)
    } finally {
      setCustomerLookupLoading(false)
    }
  }

  // Lấy danh sách kỹ thuật viên
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
          value: tech.employeeId,
          label: `${tech.fullName} - ${tech.phone || ''}`,
        }))
      )

      setTechLoading(false)
    }

    fetchTechnicians()
  }, [])

  // Lấy hãng xe
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

    // Kiểm tra nếu chưa có customerId thì cần tạo khách hàng trước
    if (!customerId) {
      message.warning('Vui lòng kiểm tra hoặc tạo khách hàng trước khi tạo phiếu')
      return
    }

    // Tìm brandName và modelName từ danh sách đã fetch
    const selectedBrand = brands.find(b => b.id === Number(values.brand))
    const selectedModel = models.find(m => m.id === Number(values.model))

    const payload = {
      appointmentId: appointmentPrefill.appointmentId || 0,
      serviceTypeIds: (values.service || []).map(id => Number(id)),
      customer: {
        customerId: customerId,
        fullName: values.name,
        phone: normalizePhoneTo84(values.phone),
        address: values.address || '',
        customerType: 'CA_NHAN',
        discountPolicyId: 0
      },
      vehicle: {
        brandId: values.brand ? Number(values.brand) : null,
        brandName: selectedBrand?.name || 'string',
        licensePlate: values.plate,
        modelId: values.model ? Number(values.model) : null,
        modelName: selectedModel?.name || 'string',
        vehicleId: null,
        vin: values.vin ? String(values.vin).trim() : '',
        year: 0
      },
      assignedTechnicianIds: (values.techs || []).map(id => Number(id)),
      receiveCondition: values.note || '',
      expectedDeliveryAt: expectedDeliveryAt || null,
    }

    console.log('Creating ticket with payload:', payload)
    console.log('VIN (Số khung):', payload.vehicle.vin)
    const { data, error } = await serviceTicketAPI.create(payload)
    setLoading(false)

    if (error) {
      console.error('Error creating ticket:', error)
      console.error('Response data:', data)
      message.error(error || 'Tạo phiếu không thành công')
      return
    }

    message.success('Tạo phiếu dịch vụ thành công')
    form.resetFields()
    setCustomerId(null)
    setCustomerExists(false)
    navigate('/service-advisor/orders')
  }

  return (
    <AdminLayout>
      <div style={{ padding: '24px', minHeight: '100vh' }}>
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
                      placeholder={customerLookupLoading ? 'Đang kiểm tra...' : 'VD: 0123456789'}
                      onBlur={(e) => {
                        const raw = e.target.value.trim()
                        if (!raw) {
                          setCustomerId(null)
                          setCustomerExists(false)
                          return
                        }
                        setCurrentPhone(raw)
                        fetchCustomerByPhone(raw)
                      }}
                      onChange={(e) => {
                        // Reset customerId khi người dùng thay đổi số điện thoại
                        const newPhone = e.target.value.trim()
                        if (newPhone !== currentPhone) {
                          setCustomerId(null)
                          setCustomerExists(false)
                        }
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
                    value={form.getFieldValue('brand') || ''}
                    onChange={(e) => {
                      const value = e.target.value ? Number(e.target.value) : undefined
                      form.setFieldsValue({ brand: value })
                      handleBrandChange(value)
                    }}
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
                    value={form.getFieldValue('model') || ''}
                    onChange={(e) => {
                      const value = e.target.value ? Number(e.target.value) : undefined
                      form.setFieldsValue({ model: value })
                    }}
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
                  label="Loại dịch vụ"
                  name="service"
                  rules={[{ required: true, message: 'Vui lòng chọn ít nhất 1 loại dịch vụ' }]}
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
                    value={form.getFieldValue('service') || []}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions).map((opt) =>
                        Number(opt.value)
                      )
                      form.setFieldsValue({ service: selected })
                    }}
                  >
                    {SERVICES.map((service) => (
                      <option key={service.value} value={service.value}>
                        {service.label}
                      </option>
                    ))}
                  </select>
                </Form.Item>

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
                    value={form.getFieldValue('receiveDate') || ''}
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
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={loading}
                      style={{ background: '#22c55e', borderColor: '#22c55e' }}
                    >
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
                const newCustomerId = created.customerId || created.id || null
                setCustomerId(newCustomerId)
                form.setFieldsValue({
                  phone: displayPhoneFrom84(created.phone || newCustomer.phone),
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
