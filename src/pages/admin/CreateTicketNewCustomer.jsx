import React, { useState, useEffect, useMemo, forwardRef } from 'react'
import { Form, Input, Button, Card, Row, Col, Space, message, Modal, Select, Checkbox } from 'antd'
import { useNavigate } from 'react-router-dom'
import AdminLayout from '../../layouts/AdminLayout'
import { serviceTicketAPI, employeesAPI, vehiclesAPI, customersAPI, serviceTypeAPI } from '../../services/api'
import { normalizePhoneTo84, displayPhoneFrom84 } from '../../utils/helpers'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import dayjs from 'dayjs'
import { CalendarOutlined } from '@ant-design/icons'
import ReactSelect from 'react-select'

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

export default function CreateTicketNewCustomer() {
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

  const [customerLookupLoading, setCustomerLookupLoading] = useState(false)
  const [customerExists, setCustomerExists] = useState(false)
  const [currentPhone, setCurrentPhone] = useState('')
  const [customerId, setCustomerId] = useState(null)
  const [customerDiscountPolicyId, setCustomerDiscountPolicyId] = useState(0)

  const [showCreateCustomerModal, setShowCreateCustomerModal] = useState(false)
  const [newCustomer, setNewCustomer] = useState({ phone: '', fullName: '', address: '' })

  const navigate = useNavigate()

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

  const OLD_singleSelectStyles = {
    control: (base, state) => ({
      ...base,
      minHeight: 40,
      borderRadius: 6,
      borderColor: state.isFocused ? '#1890ff' : '#d9d9d9',
      boxShadow: state.isFocused ? '0 0 0 2px rgba(24,144,255,0.2)' : 'none',
      transition: 'all 0.2s',
      '&:hover': {
        borderColor: '#40a9ff'
      }
    }),
    valueContainer: (base) => ({
      ...base,
      padding: '4px 11px'
    }),
    placeholder: (base) => ({
      ...base,
      color: '#bfbfbf'
    }),
    singleValue: (base) => ({
      ...base,
      color: '#000000d9'
    }),
    menu: (base) => ({
      ...base,
      zIndex: 9999,
      borderRadius: 6
    }),
    menuPortal: (base) => ({
      ...base,
      zIndex: 9999
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected
        ? '#e6f7ff'
        : state.isFocused
          ? '#f5f5f5'
          : 'white',
      color: state.isSelected ? '#1890ff' : '#000000d9',
      ':active': {
        backgroundColor: '#bae7ff'
      }
    })
  }

  const multiSelectStyles = {
      control: (base, state) => ({
        ...base,
        minHeight: 48,
        borderRadius: 10,
        borderColor: state.isFocused ? '#3b82f6' : '#d1d5db',
        boxShadow: state.isFocused ? '0 0 0 2px rgba(59,130,246,0.15)' : 'none',
        transition: 'all 0.15s ease',
        '&:hover': {
          borderColor: '#3b82f6'
        }
      }),
      indicatorsContainer: (base) => ({
        ...base,
        paddingRight: 8,
        gap: 0
      }),
      valueContainer: (base) => ({
        ...base,
        padding: '6px 8px',
        gap: 6,
        flexWrap: 'wrap',
        alignItems: 'flex-start'
      }),
      placeholder: (base) => ({
        ...base,
        color: '#9ca3af',
        fontWeight: 500
      }),
      multiValue: (base) => ({
        ...base,
        borderRadius: 12,
        backgroundColor: '#e0f2ff',
        border: '1px solid #bae6fd'
      }),
      multiValueLabel: (base) => ({
        ...base,
        color: '#0f172a',
        fontWeight: 600,
        padding: '2px 8px',
        fontSize: 13
      }),
      multiValueRemove: (base) => ({
        ...base,
        color: '#0ea5e9',
        borderLeft: '1px solid #bae6fd',
        padding: '2px 6px',
        ':hover': {
          backgroundColor: '#bae6fd',
          color: '#0284c7'
        }
      }),
      menu: (base) => ({
        ...base,
        zIndex: 9999,
        borderRadius: 12,
        overflow: 'hidden'
      }),
      menuPortal: (base) => ({
        ...base,
        zIndex: 9999
      }),
      option: (base, state) => ({
        ...base,
        backgroundColor: state.isSelected
          ? '#dbeafe'
          : state.isFocused
            ? '#f8fafc'
            : 'white',
        color: '#0f172a',
        fontWeight: state.isSelected ? 600 : 500
      })
  }

  const getServiceSelectValue = () => {
    if (!Array.isArray(serviceValue)) return []
    return serviceValue
      .map((val) => serviceOptions.find((opt) => String(opt.value) === String(val)))
      .filter(Boolean)
  }

  const getTechSelectValue = () => {
    if (!Array.isArray(techValue)) return []
    return techValue
      .map((val) => techOptions.find((opt) => String(opt.value) === String(val)))
      .filter(Boolean)
  }

  const getBrandOptions = () => {
    return brands.map((brand) => ({
      label: brand.name,
      value: brand.id
    }))
  }

  const getModelOptions = () => {
    return models.map((model) => ({
      label: model.name,
      value: model.id
    }))
  }

  const [selectedBrandId, setSelectedBrandId] = useState(null)
  const [selectedModelId, setSelectedModelId] = useState(null)
  const [selectedDate, setSelectedDate] = useState(null)

  const getBrandSelectValue = () => {
    if (!selectedBrandId) return null
    const options = getBrandOptions()
    return options.find((opt) => opt.value === selectedBrandId) || null
  }

  const getModelSelectValue = () => {
    if (!selectedModelId) return null
    const options = getModelOptions()
    return options.find((opt) => opt.value === selectedModelId) || null
  }

  const handleServiceChange = (selected) => {
    setSelectedServices(selected || [])
    const values = (selected || []).map((option) => option.value)
    form.setFieldsValue({ service: values })
  }

  const handleTechChange = (selected) => {
    setSelectedTechs(selected || [])
    const values = (selected || []).map((option) => option.value)
    form.setFieldsValue({ techs: values })
  }

  const resetCustomerSelection = () => {
    setCustomerId(null)
    setCustomerExists(false)
    setCustomerDiscountPolicyId(0)
    form.setFieldsValue({ customerType: 'DOANH_NGHIEP' })
  }

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
        resetCustomerSelection()
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
          : (customer.licensePlate || form.getFieldValue('plate'))
      })
    } catch (err) {
      console.error('Lookup customer by phone failed:', err)
      resetCustomerSelection()
    } finally {
      setCustomerLookupLoading(false)
    }
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
          value: tech.employeeId,
          label: `${tech.fullName} - ${tech.phone || ''}`
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
      setBrands(
        brandList.map((brand) => ({
          id: brand.brandId || brand.id,
          name: brand.brandName || brand.name
        }))
      )
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
    setSelectedModelId(null)
    form.setFieldsValue({ model: undefined })
    
    if (!brandId) {
      setModels([])
      return
    }

    setModelsLoading(true)
    try {
      const { data, error } = await vehiclesAPI.getModelsByBrand(brandId)
      if (error) {
        message.error('Không thể tải danh sách dòng xe')
        setModelsLoading(false)
        return
      }

      const modelList = data?.result || data || []
      setModels(
        modelList.map((model) => ({
          id: model.vehicleModelId || model.id,
          name: model.vehicleModelName || model.name
        }))
      )
      setModelsLoading(false)
    } catch (err) {
      console.error('Failed to fetch models:', err)
      setModelsLoading(false)
    }
  }

  const handleCreate = async (values) => {
    if (!Array.isArray(values.service) || values.service.length === 0) {
      message.warning('Vui lòng chọn ít nhất một loại dịch vụ')
      return
    }

    if (!values.receiveDate) {
      message.warning('Vui lòng chọn ngày nhận xe')
      return
    }

    setLoading(true)

    const expectedDeliveryAt = values.receiveDate
      ? dayjs(values.receiveDate).format('YYYY-MM-DD')
      : null

    const normalizedPhone = normalizePhoneTo84(values.phone)
    
    // Lấy brandId và modelId từ state hoặc form values
    const finalBrandId = selectedBrandId || values.brand || null
    const finalModelId = selectedModelId || values.model || null
    
    // Tìm brandName và modelName từ danh sách đã fetch
    const selectedBrand = brands.find(b => b.id === Number(finalBrandId))
    const selectedModel = models.find(m => m.id === Number(finalModelId))

    const payload = {
      appointmentId: null,
      assignedTechnicianIds: (values.techs || []).map((id) => Number(id)),
      customer: {
        customerId: customerId || null,
        fullName: values.name,
        address: values.address,
        phone: normalizedPhone || '',
        customerType: customerTypeSelected || 'DOANH_NGHIEP',
        discountPolicyId: customerDiscountPolicyId ?? 0
      },
      expectedDeliveryAt: expectedDeliveryAt || null,
      receiveCondition: values.note || '',
      serviceTypeIds: (values.service || []).map((id) => Number(id)),
      vehicle: {
        brandId: finalBrandId ? Number(finalBrandId) : null,
        brandName: selectedBrand?.name || '',
        licensePlate: values.plate?.toUpperCase() || '',
        modelId: finalModelId ? Number(finalModelId) : null,
        modelName: selectedModel?.name || '',
        vehicleId: null,
        vin: values.vin ? String(values.vin).trim() : null,
        year: values.year ? Number(values.year) : 2020
      }
    }

    const { data, error } = await serviceTicketAPI.create(payload)
    setLoading(false)

    if (error) {
      message.error(error || 'Tạo phiếu không thành công')
      return
    }

    const ticketId = data?.result?.serviceTicketId
    message.success('Tạo phiếu dịch vụ thành công')
    
    // Navigate đến trang chi tiết để cập nhật thông tin
    if (ticketId) {
      navigate(`/service-advisor/orders/${ticketId}`)
    } else {
      form.resetFields()
      setCustomerId(null)
      setCustomerExists(false)
      navigate('/service-advisor/orders')
    }
  }

  const cardTitle = (
    <div>
      <span style={{ fontSize: '20px', fontWeight: 600, display: 'block' }}>
        Tạo phiếu dịch vụ cho khách mới
      </span>
      <span style={{ fontSize: '13px', color: '#6b7280', display: 'block', marginTop: '4px' }}>
        Dành cho khách chưa có tài khoản trong hệ thống. Vui lòng nhập đầy đủ thông tin trước khi tạo phiếu.
      </span>
    </div>
  )

  return (
    <AdminLayout>
      <div style={{ padding: '24px', minHeight: '100vh' }}>
        <Card title={cardTitle} style={{ borderRadius: '12px' }}>
          <Form form={form} layout="vertical" onFinish={handleCreate}>
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
                        resetCustomerSelection()
                      }
                    }}
                    addonAfter={
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
                            address: form.getFieldValue('address') || ''
                          })
                          setShowCreateCustomerModal(true)
                        }}
                      >
                        Tạo mới
                      </Button>
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

                <Form.Item label="Số khung" name="vin">
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

                <Form.Item label="Kỹ thuật viên sửa chữa" name="techs">
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
                          offset: [0, 8]
                        }
                      }
                    ]}
                    shouldCloseOnSelect
                    withPortal
                    portalId="create-ticket-new-customer-date-portal"
                  />
                </Form.Item>

                <Form.Item label="Ghi chú" name="note">
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
                  phone: normalizePhoneTo84(newCustomer.phone)
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

