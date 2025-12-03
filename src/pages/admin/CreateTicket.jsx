import React, { useState, useEffect, forwardRef, useMemo } from 'react'
import { Form, Input, Button, Card, Row, Col, Space, message, Modal } from 'antd'
import { useLocation, useNavigate } from 'react-router-dom'
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
    placeholder="dd/mm/yyyy"
    value={value}
    onClick={onClick}
    readOnly
    style={{ height: 40 }}
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

  // react-select selected states
  const [selectedServices, setSelectedServices] = useState([])
  const [selectedTechs, setSelectedTechs] = useState([])

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

  const resetCustomerSelection = () => {
    setCustomerId(null)
    setCustomerExists(false)
    setCustomerDiscountPolicyId(0)
    form.setFieldsValue({ customerType: 'DOANH_NGHIEP' })
  }

  useEffect(() => {
    if (appointmentPrefill?.fromAppointment) {
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

      if (appointmentPrefill.customer?.customerId) {
        setCustomerId(appointmentPrefill.customer.customerId)
        setCustomerExists(true)
        setCustomerDiscountPolicyId(appointmentPrefill.customer?.discountPolicyId || 0)
      }

      if (appointmentVehicle.brandId) {
        setSelectedBrandId(appointmentVehicle.brandId)
        handleBrandChange(appointmentVehicle.brandId)
      }

      if (appointmentVehicle.modelId) setSelectedModelId(appointmentVehicle.modelId)

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
    form.setFieldsValue({ customerType: 'DOANH_NGHIEP', year: 2020 })
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
        plate: (Array.isArray(customer.licensePlates) && customer.licensePlates.length > 0) ? customer.licensePlates[0] : (customer.licensePlate || form.getFieldValue('plate'))
      })
    } catch (err) {
      console.error('Lookup customer by phone failed:', err)
      resetCustomerSelection()
    } finally {
      setCustomerLookupLoading(false)
    }
  }

  // Fetch technicians
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
      setTechOptions(technicians.map(t => ({ value: t.employeeId, label: `${t.fullName} - ${t.phone || ''}` })))
      setTechLoading(false)
    }
    fetchTechnicians()
  }, [])

  // Fetch brands
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
      setBrands(brandList.map(b => ({ id: b.brandId || b.id, name: b.brandName || b.name })))
      setBrandsLoading(false)
    }
    fetchBrands()
  }, [])

  // Fetch service types
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
      setServiceOptions(list.map(item => ({ value: item.serviceTypeId || item.id || item.value, label: item.serviceTypeName || item.name || item.label })))
      setServiceLoading(false)
    }
    fetchServiceTypes()
  }, [])

  const handleBrandChange = async (brandId) => {
    setSelectedBrandId(brandId)
    setSelectedModelId(null)
    form.setFieldsValue({ model: undefined })
    if (!brandId) { setModels([]); return }
    setModelsLoading(true)
    const { data, error } = await vehiclesAPI.getModelsByBrand(brandId)
    if (error) {
      message.error('Không thể tải danh sách mẫu xe')
      setModels([])
      setModelsLoading(false)
      return
    }
    const modelList = data?.result || data || []
    setModels(modelList.map(m => ({ id: m.vehicleModelId || m.id, name: m.vehicleModelName || m.name })))
    setModelsLoading(false)
  }

  // Handlers for react-select
  const handleServiceChange = (selected) => {
    const arr = selected || []
    setSelectedServices(arr)
    form.setFieldsValue({ service: arr.map(s => s.value) })
  }

  const handleTechChange = (selected) => {
    const arr = selected || []
    setSelectedTechs(arr)
    form.setFieldsValue({ techs: arr.map(s => s.value) })
  }

  // Sync react-select values from form (useful on prefill or edit)
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

  const handleCreate = async (values) => {
    // same logic as original file, but uses form values which we've synced from react-select
    let expectedDeliveryAt = null
    if (values.receiveDate) {
      if (values.receiveDate instanceof Date) expectedDeliveryAt = dayjs(values.receiveDate).format('YYYY-MM-DD')
      else if (typeof values.receiveDate === 'string') expectedDeliveryAt = values.receiveDate
      else if (values.receiveDate.format) expectedDeliveryAt = values.receiveDate.format('YYYY-MM-DD')
    } else if (appointmentPrefill.expectedDeliveryAt) expectedDeliveryAt = appointmentPrefill.expectedDeliveryAt

    const finalBrandId = selectedBrandId || values.brand || appointmentPrefill.vehicle?.brandId || null
    const finalModelId = selectedModelId || values.model || appointmentPrefill.vehicle?.modelId || null
    const selectedBrand = brands.find(b => b.id === Number(finalBrandId))
    const selectedModel = models.find(m => m.id === Number(finalModelId))

    const appointmentVehicleId = appointmentPrefill.vehicle?.vehicleId
    const finalVehicleId = (appointmentVehicleId !== null && appointmentVehicleId !== undefined && appointmentVehicleId !== '') ? Number(appointmentVehicleId) : ''

    const vehiclePayload = {
      brandId: finalBrandId ? Number(finalBrandId) : null,
      brandName: selectedBrand?.name || (finalBrandId ? 'string' : ''),
      licensePlate: values.plate ? String(values.plate).toUpperCase() : '',
      modelId: finalModelId ? Number(finalModelId) : null,
      modelName: selectedModel?.name || (finalModelId ? 'string' : ''),
      vehicleId: finalVehicleId,
      vin: values.vin ? String(values.vin).trim() : null,
      year: values.year ? Number(values.year) : (values.year === 0 ? 0 : (values.year === '' || values.year === undefined ? null : 2020))
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

    // plate check (same as original)
    const plate = values.plate || form.getFieldValue('plate')
    if (plate) {
      try {
        const { data: checkRes, error: checkError } = await vehiclesAPI.checkPlate(plate, customerId)
        if (!checkError) {
          const status = checkRes?.result?.status || checkRes?.message
          const owner = checkRes?.result?.owner || checkRes?.result?.customer
          if (status === 'OWNED_BY_OTHER' && owner?.customerId && owner.customerId !== customerId) {
            message.error(`Biển số này đã thuộc khách hàng khác: ${owner.fullName || ''} – ${owner.phone || ''}. Vui lòng kiểm tra lại.`)
            return
          }
        }
      } catch (err) {
        console.warn('Check plate exception:', err)
      }
    }

    setLoading(true)
    const { data, error } = await serviceTicketAPI.create(createPayload)
    setLoading(false)

    if (error) {
      const errorString = typeof error === 'string' ? error : JSON.stringify(error)
      if (errorString.includes('Duplicate entry') && errorString.includes('appointment_id')) {
        message.error('Lịch hẹn này đã được tạo phiếu dịch vụ rồi. Vui lòng kiểm tra lại danh sách phiếu dịch vụ.')
      } else if (errorString.includes('Duplicate entry')) {
        message.error('Dữ liệu đã tồn tại. Vui lòng kiểm tra lại.')
      } else {
        message.error(error?.message || 'Tạo phiếu dịch vụ không thành công')
      }
      return
    }

    const ticketId = data?.result?.serviceTicketId
    if (ticketId) {
      message.success('Tạo phiếu dịch vụ thành công')
      navigate(`/service-advisor/orders/${ticketId}`)
    } else {
      message.warning('Tạo phiếu thành công nhưng không có ID')
    }
  }

  const cardTitle = (
    <div>
      <span className="h4" style={{ fontWeight: 600, display: 'block' }}>
        Tạo phiếu dịch vụ
      </span>
      <span className="caption" style={{ color: '#6b7280', display: 'block', marginTop: '4px' }}>
        Sử dụng khi khách hàng đã tồn tại trong hệ thống. Vui lòng kiểm tra và chọn đúng thông tin khách.
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
                <div style={{ background: '#ffffff', borderRadius: 12, padding: '16px 16px 8px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)', display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <h3 style={{ marginBottom: '12px', fontWeight: 600 }}>Thông tin khách hàng</h3>

                  <Form.Item label="Số điện thoại" name="phone" rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }]} style={formItemStyle}> 
                    <Input
                      style={inputStyle}
                      placeholder={customerLookupLoading ? 'Đang kiểm tra...' : 'VD: 0123456789'}
                      onBlur={(e) => {
                        const raw = e.target.value.trim()
                        if (!raw) { resetCustomerSelection(); setPhoneLocked(false); return }
                        setCurrentPhone(raw)
                        fetchCustomerByPhone(raw)
                      }}
                      onChange={(e) => {
                        const newPhone = e.target.value.trim()
                        if (newPhone !== currentPhone) resetCustomerSelection()
                        if (!newPhone) { setPhoneLocked(false); resetCustomerSelection() }
                      }}
                      addonAfter={(!customerExists && !phoneLocked) ? (
                        <Button type="link" style={{ padding: 0 }} onClick={() => {
                          const phoneValue = form.getFieldValue('phone') || currentPhone
                          if (!phoneValue) { message.warning('Vui lòng nhập số điện thoại trước'); return }
                          setNewCustomer({ phone: phoneValue, fullName: form.getFieldValue('name') || '', address: form.getFieldValue('address') || '' })
                          setShowCreateCustomerModal(true)
                        }}>Tạo mới</Button>
                      ) : null}
                    />
                  </Form.Item>

                  <Form.Item label="Họ và tên" name="name" rules={[{ required: true, message: 'Vui lòng nhập họ và tên' }]} style={formItemStyle}>
                    <Input style={inputStyle} placeholder="VD: Đặng Thị Huyền" />
                  </Form.Item>

                  <Form.Item label="Địa chỉ" name="address" rules={[{ required: true, message: 'Vui lòng nhập địa chỉ' }]} style={formItemStyle}>
                    <Input style={inputStyle} placeholder="VD: Hòa Lạc - Hà Nội" />
                  </Form.Item>
                </div>
              </Col>

              <Col span={12}>
                <div style={{ background: '#ffffff', borderRadius: 12, padding: '16px 16px 8px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)', display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <h3 style={{ marginBottom: '12px', fontWeight: 600 }}>Chi tiết dịch vụ</h3>

                  <Form.Item label="Loại dịch vụ" name="service" rules={[{ required: true, message: 'Vui lòng chọn ít nhất 1 loại dịch vụ' }]} style={formItemStyle}> 
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
                      <div style={{ marginTop: 4, fontSize: 12, color: '#6b7280' }}>{ (form.getFieldValue('service') || []).length ? `Đã chọn ${ (form.getFieldValue('service') || []).length }` : 'Chưa chọn dịch vụ' }</div>
                    </div>
                  </Form.Item>

                  <Form.Item label="Kỹ thuật viên sửa chữa" name="techs" style={formItemStyle}>
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
                      <div style={{ marginTop: 4, fontSize: 12, color: '#6b7280' }}>{ (form.getFieldValue('techs') || []).length ? `Đã chọn ${ (form.getFieldValue('techs') || []).length }` : 'Chưa chọn kỹ thuật viên' }</div>
                    </div>
                  </Form.Item>

                  <Form.Item label="Ngày dự đoán nhận xe" name="receiveDate" rules={[{ required: true, message: 'Vui lòng chọn ngày dự đoán nhận xe' }]} style={formItemStyle}>
                    <DatePicker selected={selectedDate} onChange={(date) => { setSelectedDate(date); form.setFieldsValue({ receiveDate: date }) }} dateFormat="dd/MM/yyyy" minDate={new Date()} placeholderText="dd/mm/yyyy" customInput={<DateInput />} popperPlacement="bottom-start" popperModifiers={[{ name: 'offset', options: { offset: [0, 8] } }]} shouldCloseOnSelect withPortal portalId="create-ticket-date-portal" />
                  </Form.Item>
                </div>
              </Col>
            </Row>

            {/* Thông tin xe + Ghi chú */}
            <Row gutter={24} style={{ marginTop: 16 }}>
              <Col span={24}>
                <div style={{ background: '#ffffff', borderRadius: 12, padding: '16px 16px 8px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)' }}>
                  <Row gutter={24}>
                    <Col span={12}>
                      <h3 style={{ marginBottom: '12px', fontWeight: 600 }}>Thông tin xe</h3>

                      <Form.Item label="Biển số xe" name="plate" rules={[{ required: true, message: 'Vui lòng nhập biển số xe' }]} style={formItemStyle}>
                        <Input style={inputStyle} placeholder="VD: 30A-12345" />
                      </Form.Item>

                      <Form.Item label="Hãng xe" name="brand" rules={[{ required: true, message: 'Vui lòng chọn hãng xe' }]} style={formItemStyle}>
                        <select className="form-control" disabled={brandsLoading} onChange={(e) => { const value = e.target.value ? Number(e.target.value) : undefined; form.setFieldsValue({ brand: value, model: undefined }); setSelectedBrandId(value); setSelectedModelId(null); handleBrandChange(value) }} value={selectedBrandId || ''} style={selectStyle} onFocus={(e) => { e.target.style.borderColor = '#1890ff'; e.target.style.boxShadow = '0 0 0 2px rgba(24, 144, 255, 0.1)'}} onBlur={(e) => { e.target.style.borderColor = '#d9d9d9'; e.target.style.boxShadow = 'none' }}>
                          <option value="" style={{ color: '#bfbfbf' }}>{brandsLoading ? 'Đang tải hãng xe...' : 'Chọn hãng xe'}</option>
                          {brandOptions.map((option) => (<option key={option.value} value={option.value}>{option.label}</option>))}
                        </select>
                      </Form.Item>

                      <Form.Item label="Loại xe" name="model" rules={[{ required: true, message: 'Vui lòng chọn mẫu xe' }]} style={formItemStyle}>
                        <select className="form-control" disabled={models.length === 0 || modelsLoading} onChange={(e) => { const value = e.target.value ? Number(e.target.value) : undefined; form.setFieldsValue({ model: value }); setSelectedModelId(value) }} value={selectedModelId || ''} style={{ ...selectStyle, backgroundColor: models.length === 0 || modelsLoading ? '#f5f5f5' : '#fff', cursor: models.length === 0 || modelsLoading ? 'not-allowed' : 'pointer', opacity: models.length === 0 || modelsLoading ? 0.6 : 1 }} onFocus={(e) => { if (!(models.length === 0 || modelsLoading)) { e.target.style.borderColor = '#1890ff'; e.target.style.boxShadow = '0 0 0 2px rgba(24, 144, 255, 0.1)' } }} onBlur={(e) => { e.target.style.borderColor = '#d9d9d9'; e.target.style.boxShadow = 'none' }}>
                          <option value="" style={{ color: '#bfbfbf' }}>{modelsLoading ? 'Đang tải loại xe...' : models.length === 0 ? 'Chọn hãng xe trước' : 'Chọn loại xe'}</option>
                          {modelOptions.map((option) => (<option key={option.value} value={option.value}>{option.label}</option>))}
                        </select>
                      </Form.Item>

                      <Form.Item label="Số khung" name="vin" style={formItemStyle}><Input style={inputStyle} placeholder="VD: RL4XW430089206813" /></Form.Item>
                    </Col>

                    <Col span={12}><Form.Item label="Ghi chú" name="note"><TextArea rows={8} style={{ minHeight: 320 }} placeholder="Nhập ghi chú..." /></Form.Item></Col>
                  </Row>
                </div>
              </Col>
            </Row>

            {/* Action buttons */}
            <Row justify="end" style={{ marginTop: 24 }}>
              <Space>
                <Button size="large" onClick={() => navigate('/service-advisor/orders')} style={{ paddingInline: 32 }}>Hủy</Button>
                <Button type="primary" size="large" htmlType="submit" loading={loading} style={{ background: '#22c55e', borderColor: '#22c55e', paddingInline: 32 }}>Tạo phiếu</Button>
              </Space>
            </Row>
          </Form>

          {/* Modal tạo khách */}
          <Modal title="Tạo khách hàng mới" open={showCreateCustomerModal} onCancel={() => setShowCreateCustomerModal(false)} onOk={async () => {
            if (!newCustomer.phone || !newCustomer.fullName) { message.warning('Vui lòng nhập đầy đủ Số điện thoại và Họ tên'); return }
            try {
              const payload = { address: newCustomer.address || '', customerType: form.getFieldValue('customerType') || 'CA_NHAN', discountPolicyId: customerDiscountPolicyId ?? 0, fullName: newCustomer.fullName, phone: normalizePhoneTo84(newCustomer.phone) }
              const { data, error } = await customersAPI.create(payload)
              if (error) { message.error(error || 'Tạo khách hàng không thành công'); return }
              const created = data?.result || data || payload
              const newCustomerId = created.customerId || created.id || null
              setCustomerId(newCustomerId)
              setCustomerDiscountPolicyId(created.discountPolicyId ?? 0)
              form.setFieldsValue({ phone: displayPhoneFrom84(created.phone || newCustomer.phone), name: created.fullName || newCustomer.fullName, address: created.address || newCustomer.address, customerType: created.customerType || payload.customerType || 'CA_NHAN' })
              setCustomerExists(true)
              message.success('Tạo khách hàng mới thành công')
              setShowCreateCustomerModal(false)
            } catch (err) { message.error(err.message || 'Đã xảy ra lỗi khi tạo khách hàng') }
          }} okText="Tạo khách" cancelText="Hủy">
            <Form layout="vertical">
              <Form.Item label="Số điện thoại"><Input value={newCustomer.phone} onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })} /></Form.Item>
              <Form.Item label="Họ tên"><Input value={newCustomer.fullName} onChange={(e) => setNewCustomer({ ...newCustomer, fullName: e.target.value })} /></Form.Item>
              <Form.Item label="Địa chỉ"><Input.TextArea rows={3} value={newCustomer.address} onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })} /></Form.Item>
            </Form>
          </Modal>
        </Card>
      </div>
    </AdminLayout>
  )
}
