import React, { useState, useEffect, useMemo, forwardRef } from 'react'
import { Form, Input, Button, Card, Row, Col, Space, message, Modal, Checkbox } from 'antd'
import { useNavigate } from 'react-router-dom'
import AdminLayout from '../../layouts/AdminLayout'
import { serviceTicketAPI, employeesAPI, vehiclesAPI, customersAPI, serviceTypeAPI } from '../../services/api'
import { normalizePhoneTo84, displayPhoneFrom84 } from '../../utils/helpers'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import dayjs from 'dayjs'
import { CalendarOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import ReactSelect from 'react-select'

const { TextArea } = Input

const DateInput = forwardRef(({ value, onClick }, ref) => (
  <Input
    placeholder="dd/mm/yyyy"
    value={value}
    onClick={onClick}
    readOnly
    style={{ height: 40 }}
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

  // Cảnh báo biển số đã thuộc khách khác
  const [plateConflict, setPlateConflict] = useState(null)

  const navigate = useNavigate()

  const customerTypeSelected = Form.useWatch('customerType', form) || 'CA_NHAN'

  // react-select selected states (objects)
  const [selectedServices, setSelectedServices] = useState([])
  const [selectedTechs, setSelectedTechs] = useState([])

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

  const inputHeight = 40

  const multiSelectStyles = {
    control: (base, state) => ({
      ...base,
      minHeight: inputHeight,
      borderRadius: 6,
      borderColor: state.isFocused ? '#3b82f6' : '#d1d5db',
      boxShadow: state.isFocused ? '0 0 0 2px rgba(59,130,246,0.15)' : 'none',
      transition: 'all 0.15s ease',
      '&:hover': { borderColor: '#3b82f6' }
    }),
    indicatorsContainer: (base) => ({ ...base, paddingRight: 8, gap: 0 }),
    valueContainer: (base) => ({ ...base, padding: '4px 8px', gap: 4, flexWrap: 'wrap', alignItems: 'center' }),
    placeholder: (base) => ({ ...base, color: '#9ca3af', fontWeight: 500 }),
    multiValue: (base) => ({ ...base, borderRadius: 12, backgroundColor: '#e0f2ff', border: '1px solid #bae6fd' }),
    multiValueLabel: (base) => ({ ...base, color: '#0f172a', fontWeight: 600, padding: '2px 8px', fontSize: 13 }),
    multiValueRemove: (base) => ({ ...base, color: '#0ea5e9', borderLeft: '1px solid #bae6fd', padding: '2px 6px', ':hover': { backgroundColor: '#bae6fd', color: '#0284c7' } }),
    menu: (base) => ({ ...base, zIndex: 9999, borderRadius: 12, overflow: 'hidden' }),
    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
    option: (base, state) => ({ ...base, backgroundColor: state.isSelected ? '#dbeafe' : state.isFocused ? '#f8fafc' : 'white', color: '#0f172a', fontWeight: state.isSelected ? 600 : 500 })
  }

  const formItemStyle = { marginBottom: 12 }
  const inputStyle = { height: inputHeight }
  const selectStyle = { width: '100%', height: inputHeight, padding: '0 12px', lineHeight: `${inputHeight}px`, color: '#262626', backgroundColor: '#fff', border: '1px solid #d9d9d9', borderRadius: '6px', transition: 'all 0.2s', cursor: 'pointer', outline: 'none' }

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
    const arr = selected || []
    setSelectedServices(arr)
    const ids = arr.map((s) => s.value)
    form.setFieldsValue({ service: ids })
  }

  const handleTechChange = (selected) => {
    const arr = selected || []
    setSelectedTechs(arr)
    const ids = arr.map((s) => s.value)
    form.setFieldsValue({ techs: ids })
  }

  const resetCustomerSelection = () => {
    setCustomerId(null)
    setCustomerExists(false)
    setCustomerDiscountPolicyId(0)
    form.setFieldsValue({ customerType: 'DOANH_NGHIEP' })
  }

  // Hàm format biển số xe tự động thêm dấu -
  const formatLicensePlate = (value) => {
    if (!value) return value
    
    let cleaned = value.replace(/[-\s]/g, '').toUpperCase()
    
    // Giới hạn độ dài tối đa
    if (cleaned.length > 10) {
      cleaned = cleaned.substring(0, 10)
    }
    
    // Format theo các pattern phổ biến
    if (cleaned.length >= 3) {

      if (/^[0-9]{2}[A-Z]/.test(cleaned)) {
        const part1 = cleaned.substring(0, 3) // 30A
        const part2 = cleaned.substring(3)    // 12345
        return part2 ? `${part1}-${part2}` : part1
      }
      // Pattern: QĐ-12345 (2 chữ + số)
      else if (/^[A-Z]{2}/.test(cleaned)) {
        const part1 = cleaned.substring(0, 2) // QĐ
        const part2 = cleaned.substring(2)    // 12345
        return part2 ? `${part1}-${part2}` : part1
      }
    }
    
    return cleaned
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

  const submitCreateTicket = async (payload) => {
    setLoading(true)
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

  const handleCreate = async (values) => {
    if (!Array.isArray(values.service) || values.service.length === 0) {
      message.warning('Vui lòng chọn ít nhất một loại dịch vụ')
      return
    }

    if (!values.receiveDate) {
      message.warning('Vui lòng chọn ngày dự đoán nhận xe')
      return
    }

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
        vehicleId: '',
        vin: values.vin ? String(values.vin).trim() : null,
        year: values.year ? Number(values.year) : 2020
      }
    }

    // 1) Gọi API check biển số TRƯỚC khi tạo phiếu (cho khách mới, customerId chưa chắc có)
    const plate = values.plate || form.getFieldValue('plate')
    if (plate) {
      try {
        const { data: checkRes, error: checkError } = await vehiclesAPI.checkPlate(
          plate,
          customerId || null
        )
        if (checkError) {
          console.warn('Check plate (new customer) error:', checkError)
        } else {
          console.log('Check plate (new customer) response:', checkRes)
          const status = checkRes?.result?.status || checkRes?.message
          const owner = checkRes?.result?.owner || checkRes?.result?.customer
          // Nếu biển số đã thuộc khách khác thì mở modal cảnh báo, KHÔNG tạo phiếu ngay
          if (status === 'OWNED_BY_OTHER' && owner?.customerId) {
            setPlateConflict({
              plate,
              owner,
              payload
            })
            return
          }
        }
      } catch (err) {
        console.warn('Check plate (new customer) exception:', err)
      }
    }

    // 2) Không conflict → tạo phiếu luôn
    await submitCreateTicket(payload)
  }

  // Sync selectedServices/Techs from form values when options arrive or on mount
  useEffect(() => {
    const sv = form.getFieldValue('service') || []
    if (Array.isArray(sv) && serviceOptionsStable.length > 0) {
      setSelectedServices(serviceOptionsStable.filter(opt => sv.map(String).includes(String(opt.value))))
    }
  }, [serviceOptionsStable])

  useEffect(() => {
    const tv = form.getFieldValue('techs') || []
    if (Array.isArray(tv) && techOptionsStable.length > 0) {
      setSelectedTechs(techOptionsStable.filter(opt => tv.map(String).includes(String(opt.value))))
    }
  }, [techOptionsStable])

  const cardTitle = (
    <div>
      <span className="h4" style={{ fontWeight: 600, display: 'block' }}>
        Tạo phiếu dịch vụ cho khách mới
      </span>
      <span className="caption" style={{ color: '#6b7280', display: 'block', marginTop: '4px' }}>
        Dành cho khách chưa có tài khoản trong hệ thống. Vui lòng nhập đầy đủ thông tin trước khi tạo phiếu.
      </span>
    </div>
  )

  return (
    <AdminLayout>
      <div style={{ padding: '24px', minHeight: '100vh' }}>
        <Card title={cardTitle} style={{ borderRadius: '12px' }}>
          <Form form={form} layout="vertical" onFinish={handleCreate}>
            <Row gutter={24} align="stretch">
              <Col span={12}>
                <div
                  style={{
                    background: '#ffffff',
                    borderRadius: 12,
                    padding: '16px 16px 8px',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%'
                  }}
                >
                <h3 style={{ marginBottom: '12px', fontWeight: 600 }}>Thông tin khách hàng</h3>

                <Form.Item
                  label="Số điện thoại"
                  name="phone"
                  rules={[
                    {
                      validator: (_, value) => {
                        if (!value || value.trim() === '') {
                          return Promise.reject(new Error('Vui lòng nhập số điện thoại'))
                        }
                        
                        const cleanValue = value.replace(/\s/g, '')
                        
                        // Kiểm tra chỉ chứa số
                        if (/[^0-9]/.test(cleanValue)) {
                          return Promise.reject(new Error('Số điện thoại chỉ được chứa số'))
                        }
                        
                        // Kiểm tra đầu số Việt Nam hợp lệ TRƯỚC
                        if (cleanValue.length >= 2 && !/^(03|05|07|08|09)/.test(cleanValue)) {
                          return Promise.reject(new Error('Số điện thoại phải bắt đầu bằng 0'))
                        }
                        
                        // Kiểm tra độ dài SAU
                        if (cleanValue.length !== 10) {
                          return Promise.reject(new Error('Số điện thoại phải có đúng 10 chữ số'))
                        }
                        
                        return Promise.resolve()
                      }
                    }
                  ]}
                  normalize={(value) => value?.replace(/\s/g, '')} // Loại bỏ khoảng trắng
                  style={formItemStyle}
                >
                  <Input
                    style={inputStyle}
                    placeholder={customerLookupLoading ? 'Đang kiểm tra...' : 'VD: 0123456789'}
                    maxLength={10}
                    onKeyPress={(e) => {
                      // Chỉ cho phép nhập số
                      if (!/[0-9]/.test(e.key)) {
                        e.preventDefault()
                      }
                    }}
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
                  rules={[
                    {
                      validator: (_, value) => {
                        if (!value || value.trim() === '') {
                          return Promise.reject(new Error('Vui lòng nhập họ và tên'))
                        }
                        
                        const trimmedValue = value.trim()
                        
                        // Kiểm tra độ dài
                        if (trimmedValue.length < 2) {
                          return Promise.reject(new Error('Họ tên phải có ít nhất 2 ký tự'))
                        }
                        
                        if (trimmedValue.length > 50) {
                          return Promise.reject(new Error('Họ tên không được vượt quá 50 ký tự'))
                        }
                        
                        // Kiểm tra không chứa số
                        if (/\d/.test(trimmedValue)) {
                          return Promise.reject(new Error('Họ tên không được chứa số'))
                        }
                        
                        // Kiểm tra không chứa ký tự đặc biệt
                        if (/[!@#$%^&*()_+=\[\]{};':"\\|,.<>?/-]/.test(trimmedValue)) {
                          return Promise.reject(new Error('Họ tên không được chứa ký tự đặc biệt'))
                        }
                        
                        // Kiểm tra chỉ chứa chữ cái và khoảng trắng
                        if (!/^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂưăạảấầẩẫậắằẳẵặẹẻẽềềểỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵýỷỹ\s]+$/.test(trimmedValue)) {
                          return Promise.reject(new Error('Họ tên chỉ được chứa chữ cái và khoảng trắng'))
                        }
                        
                        return Promise.resolve()
                      }
                    }
                  ]}
                  normalize={(value) => value?.replace(/\s+/g, ' ').trim()} // Loại bỏ nhiều khoảng trắng liên tiếp
                  style={formItemStyle}
                >
                  <Input style={inputStyle} placeholder="VD: Đặng Thị Huyền" />
                </Form.Item>

                <Form.Item
                  label="Địa chỉ"
                  name="address"
                  rules={[
                    {
                      validator: (_, value) => {
                        // Không bắt buộc
                        if (!value || value.trim() === '') {
                          return Promise.resolve()
                        }
                        
                        const trimmedValue = value.trim()
                        
                        // Kiểm tra độ dài tối đa
                        if (trimmedValue.length > 150) {
                          return Promise.reject(new Error('Địa chỉ không được vượt quá 150 ký tự'))
                        }
                        
                        // Kiểm tra chỉ chứa chữ, số, dấu phẩy, gạch ngang và khoảng trắng
                        if (!/^[a-zA-Z0-9ÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂưăạảấầẩẫậắằẳẵặẹẻẽềềểỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵýỷỹ\s,/-]*$/.test(trimmedValue)) {
                          return Promise.reject(new Error('Địa chỉ chỉ được chứa chữ, số, dấu phẩy, gạch ngang và khoảng trắng'))
                        }
                        
                        return Promise.resolve()
                      }
                    }
                  ]}
                  normalize={(value) => value?.trim()} // Trim khoảng trắng đầu cuối
                  style={formItemStyle}
                >
                  <Input style={inputStyle} placeholder="VD: Hòa Lạc - Hà Nội" />
                </Form.Item>
                </div>
              </Col>

              <Col span={12}>
                <div
                  style={{
                    background: '#ffffff',
                    borderRadius: 12,
                    padding: '16px 16px 8px',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%'
                  }}
                >
                <h3 style={{ marginBottom: '12px', fontWeight: 600 }}>Chi tiết dịch vụ</h3>

                <Form.Item
                  label="Loại dịch vụ"
                  name="service"
                  rules={[{ required: true, message: 'Vui lòng chọn ít nhất 1 loại dịch vụ' }]}
                  style={formItemStyle}
                >
                  <div>
                    <ReactSelect
                      isMulti
                      options={serviceOptionsStable}
                      value={selectedServices}
                      onChange={handleServiceChange}
                      styles={multiSelectStyles}
                      placeholder={serviceLoading ? 'Đang tải...' : 'Chọn loại dịch vụ'}
                      isDisabled={serviceLoading || serviceOptionsStable.length === 0}
                      menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                      classNamePrefix="react-select"
                    />
                  </div>
                </Form.Item>

                <Form.Item 
                  label="Kỹ thuật viên sửa chữa" 
                  name="techs" 
                  rules={[
                    { 
                      required: true, 
                      message: 'Vui lòng chọn ít nhất 1 kỹ thuật viên' 
                    }
                  ]}
                  style={formItemStyle}
                >
                  <div>
                    <ReactSelect
                      isMulti
                      options={techOptionsStable}
                      value={selectedTechs}
                      onChange={handleTechChange}
                      styles={multiSelectStyles}
                      placeholder={techLoading ? 'Đang tải...' : 'Chọn kỹ thuật viên'}
                      isDisabled={techLoading || techOptionsStable.length === 0}
                      menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                      classNamePrefix="react-select"
                    />
                  </div>
                </Form.Item>

          

                </div>
              </Col>
            </Row>

            {/* Card: Thông tin xe + Ghi chú */}
            <Row gutter={24} style={{ marginTop: 16 }}>
              <Col span={24}>
                <div
                  style={{
                    background: '#ffffff',
                    borderRadius: 12,
                    padding: '16px 16px 8px',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
                  }}
                >
                  <Row gutter={24}>
                    <Col span={12}>
                      <h3 style={{ marginBottom: '12px', fontWeight: 600 }}>Thông tin xe</h3>

                      <Form.Item
                        label="Biển số xe"
                        name="plate"
                        rules={[
                          { required: true, message: 'Vui lòng nhập biển số xe' },
                          {
                            validator: (_, value) => {
                              if (!value) return Promise.resolve()
                              
                              // Loại bỏ khoảng trắng và dấu gạch ngang để validate
                              const cleanValue = value.replace(/[\s-]/g, '').toUpperCase()
                              

            
                              const patterns = [
                                /^[0-9]{2}[A-Z]{1}[0-9]{4,5}$/,           
                                /^[0-9]{2}[A-Z]{1}NG[0-9]{4}$/,          
                                /^[A-Z]{2}[0-9]{4,5}$/,                 
                                /^[0-9]{2}NG[0-9]{3,4}$/,               
                                /^[0-9]{2}[A-Z]{1}[0-9]{3}\.[0-9]{2}$/ 
                              ]
                              
                              const isValid = patterns.some(pattern => pattern.test(cleanValue))
                              
                              if (!isValid) {
                                return Promise.reject(
                                  new Error('Biển số xe không đúng định dạng (VD: 30A-12345, 51H-98765)')
                                )
                              }
                              
                              return Promise.resolve()
                            }
                          }
                        ]}
                        normalize={(value) => formatLicensePlate(value)} // Tự động format và thêm dấu -
                        style={formItemStyle}
                      >
                        <Input 
                          style={inputStyle} 
                          placeholder="VD: 30A-12345"
                          onChange={(e) => {
                            const formatted = formatLicensePlate(e.target.value)
                            form.setFieldsValue({ plate: formatted })
                          }}
                        />
                      </Form.Item>

                      <Form.Item
                        label="Hãng xe"
                        name="brand"
                        rules={[{ required: true, message: 'Vui lòng chọn hãng xe' }]}
                        style={formItemStyle}
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
                          style={selectStyle}
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
                        style={formItemStyle}
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
                            ...selectStyle,
                            backgroundColor: models.length === 0 || modelsLoading ? '#f5f5f5' : '#fff',
                            cursor: models.length === 0 || modelsLoading ? 'not-allowed' : 'pointer',
                            opacity: models.length === 0 || modelsLoading ? 0.6 : 1
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
                        rules={[
                          {
                            validator: (_, value) => {
                              // Không bắt buộc
                              if (!value || value.trim() === '') {
                                return Promise.resolve()
                              }
                              
                              const cleanValue = value.replace(/\s/g, '').toUpperCase()
                              
                              // Kiểm tra độ dài
                              if (cleanValue.length !== 17) {
                                return Promise.reject(new Error('Số khung (VIN) phải có đúng 17 ký tự'))
                              }
                              
                              // Kiểm tra không chứa I, O, Q
                              if (/[IOQ]/.test(cleanValue)) {
                                return Promise.reject(new Error('Số khung không được chứa ký tự I, O, hoặc Q'))
                              }
                              
                              // Kiểm tra chỉ chứa chữ cái A-Z (trừ I, O, Q) và số
                              if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(cleanValue)) {
                                return Promise.reject(new Error('Số khung chỉ được chứa chữ cái A-Z (trừ I, O, Q) và số'))
                              }
                              
                              return Promise.resolve()
                            }
                          }
                        ]}
                        normalize={(value) => value?.toUpperCase().replace(/\s/g, '')} // Chuyển hoa và loại bỏ khoảng trắng
                        style={formItemStyle}
                      >
                        <Input style={inputStyle} placeholder="VD: RL4XW430089206813" />
                      </Form.Item>
                    </Col>

                    <Col span={12}>
                      <Form.Item label="Ghi chú" name="note">
                        <TextArea
                          rows={8}
                          style={{ minHeight: 320 }}
                          placeholder="Nhập ghi chú..."
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                </div>
              </Col>
            </Row>

            {/* Action buttons */}
            <Row justify="end" style={{ marginTop: 24 }}>
              <Space>
                <Button
                  size="large"
                  onClick={() => navigate('/service-advisor/orders')}
                  style={{ paddingInline: 32 }}
                >
                  Hủy
                </Button>
                <Button
                  type="primary"
                  size="large"
                  htmlType="submit"
                  loading={loading}
                  style={{ background: '#22c55e', borderColor: '#22c55e', paddingInline: 32 }}
                >
                  Tạo phiếu
                </Button>
              </Space>
            </Row>
          </Form>

          {/* Modal cảnh báo biển số đã thuộc khách khác */}
          <Modal
            open={!!plateConflict}
            onCancel={() => setPlateConflict(null)}
            footer={null}
            title={null}
          >
            {plateConflict && (
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 12
                  }}
                >
                  <ExclamationCircleOutlined style={{ color: '#f59e0b', fontSize: 20 }} />
                  <span style={{ fontWeight: 700, fontSize: 18 }}>Cảnh báo</span>
                </div>
                <div style={{ marginBottom: 12 }}>
                  Biển số <b>{plateConflict.plate}</b> thuộc khách hàng khác:
                </div>
                <div
                  style={{
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: '1px solid #e5e7eb',
                    marginBottom: 16,
                    background: '#f9fafb'
                  }}
                >
                  {plateConflict.owner?.fullName} — {plateConflict.owner?.phone}
                </div>
                <div style={{ marginBottom: 16 }}>Bạn muốn tiếp tục với khách hàng hiện tại?</div>
                <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                  <Button
                    onClick={() => {
                      form.setFieldsValue({ plate: '' })
                      setPlateConflict(null)
                    }}
                  >
                    Nhập lại biển số
                  </Button>
                  <Button
                    type="primary"
                    onClick={async () => {
                      const payload = {
                        ...plateConflict.payload,
                        forceAssignVehicle: true
                      }
                      setPlateConflict(null)
                      await submitCreateTicket(payload)
                    }}
                  >
                    Tiếp tục
                  </Button>
                </Space>
              </div>
            )}
          </Modal>

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
