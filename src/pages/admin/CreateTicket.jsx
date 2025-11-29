import React, { useState, useEffect, forwardRef, useMemo } from 'react'
import { Form, Input, Button, Card, Row, Col, Space, message, Modal, Select, Checkbox } from 'antd'
import { useLocation, useNavigate } from 'react-router-dom'
import AdminLayout from '../../layouts/AdminLayout'
import { serviceTicketAPI, employeesAPI, vehiclesAPI, customersAPI, serviceTypeAPI } from '../../services/api'
import { normalizePhoneTo84, displayPhoneFrom84 } from '../../utils/helpers'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import dayjs from 'dayjs'
import { CalendarOutlined } from '@ant-design/icons'


const { TextArea } = Input

const DateInput = forwardRef(({ value, onClick }, ref) => (
  <Input
    size="large"
    placeholder="dd/mm/yyyy"
    value={value}
    onClick={onClick}
    readOnly
    suffix={<CalendarOutlined style={{ color: '#9ca3af' }} />}
    ref={ref}
  />
))

export default function CreateTicket() {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  const [techOptions, setTechOptions] = useState([])
  const [techLoading, setTechLoading] = useState(false)
  const [brands, setBrands] = useState([])
  const [models, setModels] = useState([])
  const [modelsLoading, setModelsLoading] = useState(false)
  const [brandsLoading, setBrandsLoading] = useState(false)
  const [serviceOptions, setServiceOptions] = useState([])
  const [serviceLoading, setServiceLoading] = useState(false)
  const [customerDiscountPolicyId, setCustomerDiscountPolicyId] = useState(0)

  const [customerLookupLoading, setCustomerLookupLoading] = useState(false)
  const [customerExists, setCustomerExists] = useState(false)
  const [currentPhone, setCurrentPhone] = useState('')
  const [customerId, setCustomerId] = useState(null)
  const [phoneLocked, setPhoneLocked] = useState(false)

  const [showCreateCustomerModal, setShowCreateCustomerModal] = useState(false)
  const [newCustomer, setNewCustomer] = useState({ phone: '', fullName: '', address: '' })

  // Track selected values
  const [selectedBrandId, setSelectedBrandId] = useState(null)
  const [selectedModelId, setSelectedModelId] = useState(null)
  const [selectedDate, setSelectedDate] = useState(null)

  const navigate = useNavigate()
  const location = useLocation()
  const appointmentPrefill = location.state || {}
  const appointmentVehicle = appointmentPrefill.vehicle || {}

  const customerTypeSelected = Form.useWatch('customerType', form) || 'CA_NHAN'

  // Options for selects - memoized to prevent re-render
  const brandOptions = useMemo(() => 
    brands.map((brand) => ({ label: brand.name, value: brand.id })),
    [brands]
  )
  
  const modelOptions = useMemo(() => 
    models.map((model) => ({ label: model.name, value: model.id })),
    [models]
  )
  
  const techOptionsStable = useMemo(() => techOptions, [techOptions])
  const serviceOptionsStable = useMemo(() => serviceOptions, [serviceOptions])


  const resetCustomerSelection = () => {
    setCustomerId(null)
    setCustomerExists(false)
    setCustomerDiscountPolicyId(0)
    form.setFieldsValue({ customerType: 'DOANH_NGHIEP' })
  }

  useEffect(() => {
    if (appointmentPrefill?.fromAppointment) {
      // Data from appointment modal
      const phoneValue = displayPhoneFrom84(appointmentPrefill.customer?.phone || '')
      const appointmentVehicle = appointmentPrefill.vehicle || {}

      form.setFieldsValue({
        phone: phoneValue,
        name: appointmentPrefill.customer?.fullName || '',
        address: appointmentPrefill.customer?.address || '',
        customerType: appointmentPrefill.customer?.customerType || 'DOANH_NGHIEP',
        plate: appointmentVehicle.licensePlate || '',
        brand: appointmentVehicle.brandId || undefined,
        model: appointmentVehicle.modelId || undefined,
        vin: appointmentVehicle.vin || '',
        year: appointmentVehicle.year || 2020,
        note: appointmentPrefill.receiveCondition || '',
        service: appointmentPrefill.serviceTypeIds || [],
        techs: appointmentPrefill.assignedTechnicianIds || [],
      })

      // Set customerId if exists
      if (appointmentPrefill.customer?.customerId) {
        setCustomerId(appointmentPrefill.customer.customerId)
        setCustomerExists(true)
        setCustomerDiscountPolicyId(appointmentPrefill.customer?.discountPolicyId || 0)
      }

      // Set selected brand/model for fetching models
      if (appointmentVehicle.brandId) {
        setSelectedBrandId(appointmentVehicle.brandId)
        handleBrandChange(appointmentVehicle.brandId)
      }

      if (appointmentVehicle.modelId) {
        setSelectedModelId(appointmentVehicle.modelId)
      }

      // Set expected delivery date
      if (appointmentPrefill.expectedDeliveryAt) {
        const parsedDate = dayjs(appointmentPrefill.expectedDeliveryAt, 'YYYY-MM-DD')
        if (parsedDate.isValid()) {
          setSelectedDate(parsedDate.toDate())
          form.setFieldsValue({ receiveDate: parsedDate.toDate() })
        }
      }

      if (phoneValue) {
        setCurrentPhone(phoneValue)
        setPhoneLocked(true)
        fetchCustomerByPhone(phoneValue)
      }
    }
  }, [appointmentPrefill, form])

  useEffect(() => {
    form.setFieldsValue({ 
      customerType: 'DOANH_NGHIEP',
      year: 2020
    })
  }, [form])

  const fetchCustomerByPhone = async (phone) => {
    setCustomerLookupLoading(true)
    try {
      const normalizedPhone = normalizePhoneTo84(phone)
      const requestPhone = normalizedPhone ? normalizedPhone : ''
      const { data, error } = await customersAPI.getByPhone(requestPhone)

      if (error || !data || !data.result) {
        setCustomerExists(false)
        setCustomerId(null)
        setCustomerDiscountPolicyId(0)
        form.setFieldsValue({ customerType: 'DOANH_NGHIEP' })
        setCustomerLookupLoading(false)
        return
      }

      const customer = data.result
      setCustomerExists(true)
      setCustomerId(customer.customerId || customer.id || null)
      setCustomerDiscountPolicyId(customer.discountPolicyId ?? 0)

      const phoneValue = displayPhoneFrom84(customer.phone || normalizedPhone)
      setCurrentPhone(phoneValue || phone)

      form.setFieldsValue({
        phone: phoneValue || phone,
        name: customer.fullName || customer.name || form.getFieldValue('name'),
        address: customer.address || form.getFieldValue('address'),
        customerType: customer.customerType || 'DOANH_NGHIEP',
        plate: (Array.isArray(customer.licensePlates) && customer.licensePlates.length > 0)
          ? customer.licensePlates[0]
          : (customer.licensePlate || form.getFieldValue('plate')),
      })
    } catch (err) {
      console.error('Lookup customer by phone failed:', err)
      setCustomerExists(false)
      setCustomerId(null)
      setCustomerDiscountPolicyId(0)
      form.setFieldsValue({ customerType: 'CA_NHAN' })
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

  useEffect(() => {
    const fetchServiceTypes = async () => {
      setServiceLoading(true)
      const { data, error } = await serviceTypeAPI.getAll()
      if (error) {
        message.error('Không thể tải danh sách loại dịch vụ')
        setServiceLoading(false)
        return
      }
      const list = data?.result || data || []
      setServiceOptions(
        list.map((item) => ({
          value: item.serviceTypeId || item.id || item.value,
          label: item.serviceTypeName || item.name || item.label
        }))
      )
      setServiceLoading(false)
    }

    fetchServiceTypes()
  }, [])

  const handleBrandChange = async (brandId) => {
    setSelectedBrandId(brandId)
    setSelectedModelId(null)
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

    console.log('=== [CreateTicket] Form Submit ===')
    console.log('appointmentPrefill:', appointmentPrefill)
    console.log('Form values:', values)

    let expectedDeliveryAt = null
    if (values.receiveDate) {
      if (values.receiveDate instanceof Date) {
        expectedDeliveryAt = dayjs(values.receiveDate).format('YYYY-MM-DD')
      } else if (typeof values.receiveDate === 'string') {
        expectedDeliveryAt = values.receiveDate
      } else if (values.receiveDate.format) {
        expectedDeliveryAt = values.receiveDate.format('YYYY-MM-DD')
      }
    } else if (appointmentPrefill.expectedDeliveryAt) {
      expectedDeliveryAt = appointmentPrefill.expectedDeliveryAt
    }

    // Kiểm tra nếu chưa có customerId thì cần tạo khách hàng trước
    if (!customerId) {
      message.warning('Vui lòng kiểm tra hoặc tạo khách hàng trước khi tạo phiếu')
      setLoading(false)
      return
    }

    // Lấy brandId và modelId từ state hoặc form values
    const finalBrandId = selectedBrandId || values.brand || appointmentPrefill.vehicle?.brandId || null
    const finalModelId = selectedModelId || values.model || appointmentPrefill.vehicle?.modelId || null

    // Tìm brandName và modelName từ danh sách đã fetch
    const selectedBrand = brands.find(b => b.id === Number(finalBrandId))
    const selectedModel = models.find(m => m.id === Number(finalModelId))

    console.log('=== [CreateTicket] Calling POST API ===')
    console.log('Form values breakdown:')
    console.log('  - appointmentId:', appointmentPrefill.appointmentId)
    console.log('  - customerId:', customerId)
    console.log('  - name:', values.name)
    console.log('  - phone:', values.phone, '→', normalizePhoneTo84(values.phone))
    console.log('  - address:', values.address)
    console.log('  - customerType:', values.customerType)
    console.log('  - plate:', values.plate)
    console.log('  - brand:', values.brand, '→ brandId:', finalBrandId, 'brandName:', selectedBrand?.name)
    console.log('  - model:', values.model, '→ modelId:', finalModelId, 'modelName:', selectedModel?.name)
    console.log('  - vin:', values.vin)
    console.log('  - year:', values.year)
    console.log('  - service:', values.service)
    console.log('  - techs:', values.techs)
    console.log('  - receiveCondition:', values.note)
    console.log('  - expectedDeliveryAt:', expectedDeliveryAt)
    
    
    const vehiclePayload = {
      brandId: finalBrandId ? Number(finalBrandId) : null,
      brandName: selectedBrand?.name || (finalBrandId ? 'string' : ''),
      licensePlate: values.plate ? String(values.plate).toUpperCase() : '',
      modelId: finalModelId ? Number(finalModelId) : null,
      modelName: selectedModel?.name || (finalModelId ? 'string' : ''),
      vehicleId: null, 
      vin: values.vin ? String(values.vin).trim() : null,
      year: values.year ? Number(values.year) : (values.year === 0 ? 0 : 2020)
    }

    const createPayload = {
      appointmentId: appointmentPrefill.appointmentId || 0,
      assignedTechnicianIds: (values.techs || []).map((id) => Number(id)),
      customer: {
        address: values.address || '',
        customerId: customerId,
        customerType: values.customerType || 'DOANH_NGHIEP',
        discountPolicyId: customerDiscountPolicyId || 0,
        fullName: values.name || '',
        phone: normalizePhoneTo84(values.phone)
      },
      expectedDeliveryAt: expectedDeliveryAt,
      forceAssignVehicle: true,
      receiveCondition: values.note || '',
      serviceTypeIds: (values.service || []).map((id) => Number(id)),
      vehicle: vehiclePayload
    }

    console.log('=== POST Payload ===')
    console.log(JSON.stringify(createPayload, null, 2))
    console.log('Vehicle ID in payload:', createPayload.vehicle.vehicleId, '(always null)')
    console.log('====================')

    const { data, error } = await serviceTicketAPI.create(createPayload)
    setLoading(false)

    if (error) {
      console.error('=== POST Error ===')
      console.error(error)
      console.error('==================')
      
      
      const errorMessage = error?.message || error || ''
      const errorString = typeof error === 'string' ? error : JSON.stringify(error)
      
      if (errorString.includes('Duplicate entry') && errorString.includes('appointment_id')) {
        message.error('Lịch hẹn này đã được tạo phiếu dịch vụ rồi. Vui lòng kiểm tra lại danh sách phiếu dịch vụ.')
      } else if (errorString.includes('Duplicate entry')) {
        message.error('Dữ liệu đã tồn tại. Vui lòng kiểm tra lại.')
      } else {
        message.error(errorMessage || 'Tạo phiếu dịch vụ không thành công')
      }
      return
    }

    console.log('=== POST Success ===')
    console.log('Response:', JSON.stringify(data, null, 2))
    console.log('====================')

    const ticketId = data?.result?.serviceTicketId
    
    if (ticketId) {
      
      const updatePayload = {
        assignedTechnicianId: (values.techs || []).map((id) => Number(id)),
        brandId: finalBrandId ? Number(finalBrandId) : 0,
        brandName: selectedBrand?.name || '',
        customerName: values.name || '',
        customerPhone: normalizePhoneTo84(values.phone),
        licensePlate: values.plate ? String(values.plate).toUpperCase() : '',
        modelId: finalModelId ? Number(finalModelId) : 0,
        modelName: selectedModel?.name || '',
        serviceTypeIds: (values.service || []).map((id) => Number(id)),
        vehicleId: appointmentPrefill.vehicle?.vehicleId || 0,
        vin: values.vin ? String(values.vin).trim() : '',
        year: values.year ? Number(values.year) : 2020
      }

      console.log('=== Updating Ticket After Create ===')
      console.log('Ticket ID:', ticketId)
      console.log('Update Payload:', JSON.stringify(updatePayload, null, 2))
      console.log('====================================')

      const { error: updateError } = await serviceTicketAPI.update(ticketId, updatePayload)
      
      if (updateError) {
        console.warn('Update after create failed:', updateError)
        // Không hiển thị error vì ticket đã tạo thành công
        // Chỉ log để debug
      } else {
        console.log('✓ Ticket updated successfully after create')
      }

      message.success('Tạo phiếu dịch vụ thành công')
      navigate(`/service-advisor/orders/${ticketId}`)
    } else {
      message.warning('Tạo phiếu thành công nhưng không có ID')
    }
  }

  const cardTitle = (
    <span style={{ fontSize: '20px', fontWeight: 600, display: 'block' }}>
      Tạo phiếu dịch vụ
    </span>
  )

  return (
    <AdminLayout>
      <div style={{ padding: '24px', minHeight: '100vh' }}>
        <Card
          title={cardTitle}
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
                    <Input
                      placeholder={customerLookupLoading ? 'Đang kiểm tra...' : 'VD: 0123456789'}
                      onBlur={(e) => {
                        const raw = e.target.value.trim()
                        if (!raw) {
                        resetCustomerSelection()
                        setPhoneLocked(false)
                          return
                        }
                        setCurrentPhone(raw)
                        fetchCustomerByPhone(raw)
                      }}
                      onChange={(e) => {
                        const newPhone = e.target.value.trim()
                        if (newPhone !== currentPhone) {
                        resetCustomerSelection()
                      }
                      if (!newPhone) {
                        setPhoneLocked(false)
                        resetCustomerSelection()
                        }
                      }}
                    addonAfter={
                      (!customerExists && !phoneLocked) ? (
                      <Button
                          type="link"
                          style={{ padding: 0 }}
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
                      ) : null
                    }
                  />
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
                    className="form-control"
                    disabled={brandsLoading}
                    onChange={(e) => {
                      const value = e.target.value ? Number(e.target.value) : undefined
                      form.setFieldsValue({ brand: value, model: undefined })
                      setSelectedBrandId(value)
                      setSelectedModelId(null)
                      handleBrandChange(value)
                    }}
                    value={selectedBrandId || ''}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      fontSize: '14px',
                      lineHeight: '1.5',
                      color: '#262626',
                      backgroundColor: '#fff',
                      border: '1px solid #d9d9d9',
                      borderRadius: '6px',
                      transition: 'all 0.2s',
                      cursor: 'pointer',
                      outline: 'none'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#1890ff'
                      e.target.style.boxShadow = '0 0 0 2px rgba(24, 144, 255, 0.1)'
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#d9d9d9'
                      e.target.style.boxShadow = 'none'
                    }}
                  >
                    <option value="" style={{ color: '#bfbfbf' }}>
                      {brandsLoading ? 'Đang tải hãng xe...' : 'Chọn hãng xe'}
                    </option>
                    {brandOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
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
                    className="form-control"
                    disabled={models.length === 0 || modelsLoading}
                    onChange={(e) => {
                      const value = e.target.value ? Number(e.target.value) : undefined
                      form.setFieldsValue({ model: value })
                      setSelectedModelId(value)
                    }}
                    value={selectedModelId || ''}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      fontSize: '14px',
                      lineHeight: '1.5',
                      color: '#262626',
                      backgroundColor: models.length === 0 || modelsLoading ? '#f5f5f5' : '#fff',
                      border: '1px solid #d9d9d9',
                      borderRadius: '6px',
                      transition: 'all 0.2s',
                      cursor: models.length === 0 || modelsLoading ? 'not-allowed' : 'pointer',
                      outline: 'none',
                      opacity: models.length === 0 || modelsLoading ? 0.6 : 1
                    }}
                    onFocus={(e) => {
                      if (!(models.length === 0 || modelsLoading)) {
                        e.target.style.borderColor = '#1890ff'
                        e.target.style.boxShadow = '0 0 0 2px rgba(24, 144, 255, 0.1)'
                      }
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#d9d9d9'
                      e.target.style.boxShadow = 'none'
                    }}
                  >
                    <option value="" style={{ color: '#bfbfbf' }}>
                      {modelsLoading
                        ? 'Đang tải loại xe...'
                        : models.length === 0
                          ? 'Chọn hãng xe trước'
                          : 'Chọn loại xe'}
                    </option>
                    {modelOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
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
                  <Checkbox.Group style={{ width: '100%' }}>
                    <Row gutter={[8, 8]}>
                      {serviceLoading ? (
                        <Col span={24}>
                          <div style={{ padding: '8px', color: '#999' }}>Đang tải dịch vụ...</div>
                        </Col>
                      ) : serviceOptionsStable.length === 0 ? (
                        <Col span={24}>
                          <div style={{ padding: '8px', color: '#999' }}>Không có dịch vụ</div>
                        </Col>
                      ) : (
                        serviceOptionsStable.map(option => (
                          <Col span={12} key={option.value}>
                            <Checkbox 
                              value={option.value}
                    style={{
                                padding: '8px 12px',
                                border: '1px solid #d9d9d9',
                                borderRadius: '6px',
                      width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                transition: 'all 0.2s'
                    }}
                  >
                              {option.label}
                            </Checkbox>
                          </Col>
                        ))
                      )}
                    </Row>
                  </Checkbox.Group>
                </Form.Item>

                <Form.Item
                  label="Kỹ thuật viên sửa chữa"
                  name="techs"
                >
                  <Checkbox.Group style={{ width: '100%' }}>
                    <Row gutter={[8, 8]}>
                      {techLoading ? (
                        <Col span={24}>
                          <div style={{ padding: '8px', color: '#999' }}>Đang tải kỹ thuật viên...</div>
                        </Col>
                      ) : techOptionsStable.length === 0 ? (
                        <Col span={24}>
                          <div style={{ padding: '8px', color: '#999' }}>Không có kỹ thuật viên</div>
                        </Col>
                      ) : (
                        techOptionsStable.map(option => (
                          <Col span={12} key={option.value}>
                            <Checkbox 
                              value={option.value}
                    style={{
                                padding: '8px 12px',
                                border: '1px solid #d9d9d9',
                                borderRadius: '6px',
                      width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                transition: 'all 0.2s'
                              }}
                            >
                              {option.label}
                            </Checkbox>
                          </Col>
                        ))
                      )}
                    </Row>
                  </Checkbox.Group>
                </Form.Item>

                <Form.Item
                  label="Ngày nhận xe"
                  name="receiveDate"
                  rules={[{ required: true, message: 'Vui lòng chọn ngày nhận xe' }]}
                >
                  <DatePicker
                    selected={selectedDate}
                    onChange={(date) => {
                      setSelectedDate(date)
                      form.setFieldsValue({ receiveDate: date })
                    }}
                    dateFormat="dd/MM/yyyy"
                    minDate={new Date()}
                    placeholderText="dd/mm/yyyy"
                    customInput={<DateInput />}
                    popperPlacement="bottom-start"
                    popperModifiers={[
                      {
                        name: 'offset',
                        options: {
                          offset: [0, 8],
                        },
                      },
                    ]}
                    shouldCloseOnSelect
                    withPortal
                    portalId="create-ticket-date-portal"
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
                  customerType: form.getFieldValue('customerType') || 'CA_NHAN',
                  discountPolicyId: customerDiscountPolicyId ?? 0,
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
                setCustomerDiscountPolicyId(created.discountPolicyId ?? 0)
                form.setFieldsValue({
                  phone: displayPhoneFrom84(created.phone || newCustomer.phone),
                  name: created.fullName || newCustomer.fullName,
                  address: created.address || newCustomer.address,
                  customerType: created.customerType || payload.customerType || 'CA_NHAN'
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
