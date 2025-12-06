import React, { useEffect, useState, useMemo } from 'react'
import { Modal, Form, Input, DatePicker, Button, Row, Col, message, Checkbox } from 'antd'
import { serviceTicketAPI, vehiclesAPI, serviceTypeAPI, employeesAPI } from '../../../services/api'
import { normalizePhoneTo84, displayPhoneFrom84 } from '../../../utils/helpers'
import dayjs from 'dayjs'

export default function UpdateTicketModal({ open, onClose, ticketId, onSuccess }) {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [ticketData, setTicketData] = useState(null)
  const [brands, setBrands] = useState([])
  const [models, setModels] = useState([])
  const [brandsLoading, setBrandsLoading] = useState(false)
  const [modelsLoading, setModelsLoading] = useState(false)
  const [serviceOptions, setServiceOptions] = useState([])
  const [serviceLoading, setServiceLoading] = useState(false)
  const [technicianOptions, setTechnicianOptions] = useState([])
  const [technicianLoading, setTechnicianLoading] = useState(false)
  const [vehicleInfo, setVehicleInfo] = useState({ vehicleId: 0, brandName: '', modelName: '', vin: '' })
  const [pendingServiceNames, setPendingServiceNames] = useState([])
  const [pendingTechnicianNames, setPendingTechnicianNames] = useState([])
  const [pendingBrandName, setPendingBrandName] = useState('')
  const [pendingModelName, setPendingModelName] = useState('')
  const [currentUserName, setCurrentUserName] = useState('')
  const [selectedBrandId, setSelectedBrandId] = useState(null)
  const [selectedModelId, setSelectedModelId] = useState(null)

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user')
      if (storedUser) {
        const parsed = JSON.parse(storedUser)
        if (parsed?.fullName) {
          setCurrentUserName(parsed.fullName)
          form.setFieldsValue({ quoteStaff: parsed.fullName })
        }
      }
    } catch (err) {
      console.warn('Cannot read user from localStorage', err)
    }
  }, [form])

  const handleBrandChange = async (e) => {
    const brandId = e.target.value ? Number(e.target.value) : null
    setSelectedBrandId(brandId)
    setSelectedModelId(null)
    form.setFieldsValue({ brandId, modelId: undefined })
    await handleBrandSelect(brandId)
  }

  const handleModelChange = (e) => {
    const modelId = e.target.value ? Number(e.target.value) : null
    setSelectedModelId(modelId)
    form.setFieldsValue({ modelId })
  }

  const handleBrandSelect = async (brandId) => {
    setPendingBrandName('')
    setPendingModelName('')
    setSelectedBrandId(brandId)
    setSelectedModelId(null)
    form.setFieldsValue({ brandId, modelId: undefined })
    if (!brandId) {
      setModels([])
      return []
    }
    setModelsLoading(true)
    const { data, error } = await vehiclesAPI.getModelsByBrand(brandId)
    setModelsLoading(false)
    if (error) {
      message.error('Không thể tải danh sách loại xe')
      setModels([])
      return []
    }
    const list = data?.result || data || []
    setModels(list)
    return list
  }

  useEffect(() => {
    if (open && ticketId) {
      fetchTicketData()
    } else {
      form.resetFields()
      setTicketData(null)
      setVehicleInfo({ vehicleId: 0, brandName: '', modelName: '', vin: '' })
      setPendingServiceNames([])
      setPendingTechnicianNames([])
      setPendingBrandName('')
      setPendingModelName('')
      setSelectedBrandId(null)
      setSelectedModelId(null)
    }
  }, [open, ticketId])

  useEffect(() => {
    const loadBrands = async () => {
      setBrandsLoading(true)
      const { data, error } = await vehiclesAPI.getBrands()
      setBrandsLoading(false)
      if (error) {
        message.error('Không thể tải danh sách hãng xe')
        return
      }
      const list = data?.result || data || []
      setBrands(list)
    }
    loadBrands()
  }, [])

  useEffect(() => {
    const loadServiceTypes = async () => {
      setServiceLoading(true)
      const { data, error } = await serviceTypeAPI.getAll()
      setServiceLoading(false)
      if (error) {
        message.error('Không thể tải danh sách loại dịch vụ')
        return
      }
      const list = data?.result || data || []
      const mapped = list
        .filter(item => item)
        .map(item => ({
          value: item.serviceTypeId || item.id || item.value,
          label: item.serviceTypeName || item.name || item.label
        }))
        .filter(option => option.value && option.label)
      setServiceOptions(mapped)
    }
    loadServiceTypes()
  }, [])

  useEffect(() => {
    const loadTechnicians = async () => {
      setTechnicianLoading(true)
      const { data, error } = await employeesAPI.getTechnicians()
      setTechnicianLoading(false)
      if (error) {
        message.error('Không thể tải danh sách kỹ thuật viên')
        return
      }
      const list = data?.result || data || []
      setTechnicianOptions(
        list.map((tech) => ({
          value: tech.employeeId || tech.id,
          label: `${tech.fullName || tech.name || 'Không tên'}${tech.phone ? ` - ${tech.phone}` : ''}`
        }))
      )
    }
    loadTechnicians()
  }, [])

  useEffect(() => {
    if (!pendingServiceNames.length || !serviceOptions.length) return
    const mapped = pendingServiceNames
      .map((name) => {
        const lower = name.toLowerCase()
        return serviceOptions.find((option) => option.label?.toLowerCase() === lower)?.value
      })
      .filter(Boolean)
    if (mapped.length) {
      form.setFieldsValue({ serviceTypes: mapped })
    }
    setPendingServiceNames([])
  }, [pendingServiceNames, serviceOptions, form])

  useEffect(() => {
    if (!pendingTechnicianNames.length || !technicianOptions.length) return
    const mapped = pendingTechnicianNames
      .map((name) => {
        const lower = name.toLowerCase()
        return technicianOptions.find((option) => option.label?.toLowerCase().includes(lower))?.value
      })
      .filter(Boolean)
    if (mapped.length) {
      form.setFieldsValue({ assignedTechnicianIds: mapped })
    }
    setPendingTechnicianNames([])
  }, [pendingTechnicianNames, technicianOptions, form])

  useEffect(() => {
    if (!pendingBrandName || !brands.length) return
    const modelNameToMatch = pendingModelName
    const matchedBrand = brands.find(
      (brand) => brand.name?.toLowerCase() === pendingBrandName.toLowerCase()
    )
    if (matchedBrand) {
      setPendingBrandName('')
      setPendingModelName('')
      ;(async () => {
        const list = await handleBrandSelect(matchedBrand.id)
        form.setFieldsValue({ brandId: matchedBrand.id })
        if (modelNameToMatch) {
          const source = list && list.length ? list : models
          const matchedModel = source.find(
            (model) => model.name?.toLowerCase() === modelNameToMatch.toLowerCase()
          )
          if (matchedModel) {
            setSelectedModelId(matchedModel.id)
            form.setFieldsValue({ modelId: matchedModel.id })
          }
        }
      })()
    } else {
      setPendingBrandName('')
      setPendingModelName('')
    }
  }, [pendingBrandName, pendingModelName, brands, models])

  const fetchTicketData = async () => {
    setLoading(true)
    const { data: response, error } = await serviceTicketAPI.getById(ticketId)
    setLoading(false)
    
    if (error || !response || !response.result) {
      console.error('Error fetching ticket data:', error)
      message.error('Không thể tải thông tin phiếu dịch vụ. Vui lòng thử lại.')
      onClose()
      return
    }
    
      const data = response.result
    setTicketData(data)
      
      const vehicle = data.vehicle || {}
      const vehicleModel = vehicle.vehicleModel || {}
    const brandId = vehicle.brandId ?? vehicleModel.brandId ?? null
    const modelId = vehicle.modelId ?? vehicleModel.modelId ?? null
    const brandName = vehicle.brandName || vehicleModel.brandName || ''
    const modelName = vehicle.modelName || vehicleModel.modelName || ''
    const vehicleId = vehicle.vehicleId || data.vehicleId || 0
    const vin = vehicle.vin || ''
    const year = vehicle.year || 0

    const serviceTypeIds = Array.isArray(data.serviceTypeIds)
      ? data.serviceTypeIds
      : (Array.isArray(data.serviceTypes)
          ? data.serviceTypes.map((item) => Number(item.serviceTypeId || item.id)).filter(Boolean)
          : [])

    if (!serviceTypeIds.length && Array.isArray(data.serviceType)) {
      setPendingServiceNames(
        data.serviceType
          .map((item) => (typeof item === 'string' ? item : item?.name || item?.serviceTypeName || ''))
          .filter(Boolean)
      )
    }

    const assignedTechnicianIds = Array.isArray(data.assignedTechnicianIds)
      ? data.assignedTechnicianIds
      : []

    if (!assignedTechnicianIds.length && Array.isArray(data.technicians)) {
      setPendingTechnicianNames(
        data.technicians
          .map((item) => (typeof item === 'string' ? item : item?.fullName || item?.name || ''))
          .filter(Boolean)
      )
    }

    setVehicleInfo({
      vehicleId: vehicleId || 0,
      brandName,
      modelName,
      vin,
      year: year || 0
    })

    if (brandId) {
      setSelectedBrandId(brandId)
      const list = await handleBrandSelect(brandId)
      if (modelId) {
        setSelectedModelId(modelId)
        const source = list && list.length ? list : models
        const matchedModel = source.find((model) => String(model.id) === String(modelId))
        if (matchedModel) {
          form.setFieldsValue({ modelId: matchedModel.id })
        } else {
          form.setFieldsValue({ modelId })
        }
      }
    } else if (brandName) {
      setPendingBrandName(brandName)
      setPendingModelName(modelName)
    }

    const quoteStaffName = data.createdBy || currentUserName || ''
      
      form.setFieldsValue({
        customerName: data.customer?.fullName || '',
      phone: displayPhoneFrom84(data.customer?.phone || ''),
      brandId: brandId || null,
      modelId: modelId || null,
      licensePlate: (vehicle.licensePlate || '').toUpperCase(),
      chassisNumber: vin,
      year: year || 2020,
        quoteStaff: quoteStaffName,
        receiveDate: data.createdAt ? dayjs(data.createdAt) : (data.deliveryAt ? dayjs(data.deliveryAt) : null),
      serviceTypes: serviceTypeIds,
      assignedTechnicianIds: assignedTechnicianIds
      })
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setLoading(true)

      const brandOption = brands.find((brand) => String(brand.id) === String(values.brandId))
      const modelOption = models.find((model) => String(model.id) === String(values.modelId))
      
      const finalBrandId = values.brandId ? Number(values.brandId) : null
      const finalModelId = values.modelId ? Number(values.modelId) : null
      const finalBrandName = brandOption?.name || (finalBrandId ? 'string' : '')
      const finalModelName = modelOption?.name || (finalModelId ? 'string' : '')
      
      const payload = {
        assignedTechnicianId: (values.assignedTechnicianIds || []).length
          ? values.assignedTechnicianIds.map((id) => Number(id))
          : [0],
        brandId: finalBrandId || 0,
        brandName: finalBrandName,
        customerName: values.customerName || '',
        customerPhone: normalizePhoneTo84(values.phone),
        licensePlate: (values.licensePlate || '').toUpperCase(),
        modelId: finalModelId || 0,
        modelName: finalModelName,
        serviceTypeIds: (values.serviceTypes || []).map((id) => Number(id)),
        vehicleId: '',
        vin: values.chassisNumber ? String(values.chassisNumber).trim() : (vehicleInfo.vin || ''),
        year: values.year ? Number(values.year) : (vehicleInfo.year || 2020)
      }

      console.log('=== [UpdateTicketModal] DEBUG PAYLOAD ===')
      console.log('Ticket ID:', ticketId)
      console.log('Full Payload:', JSON.stringify(payload, null, 2))
      console.log('Customer Phone:', payload.customerPhone)
      console.log('Vehicle Year:', payload.year)
      console.log('Vehicle VIN:', payload.vin)
      console.log('Vehicle Model ID:', payload.modelId)
      console.log('Vehicle Model Name:', payload.modelName)
      console.log('Vehicle Brand ID:', payload.brandId)
      console.log('Vehicle Brand Name:', payload.brandName)
      console.log('Service Type IDs:', payload.serviceTypeIds)
      console.log('Assigned Technician IDs:', payload.assignedTechnicianId)
      console.log('====================================')
      
      const { data, error } = await serviceTicketAPI.update(ticketId, payload)
      setLoading(false)
      
      if (error) {
        console.error('=== [UpdateTicketModal] ERROR ===')
        console.error('Error:', error)
        console.error('====================================')
        message.error(error || 'Cập nhật phiếu không thành công')
        return
      }
      
      console.log('=== [UpdateTicketModal] SUCCESS ===')
      console.log('Response:', JSON.stringify(data, null, 2))
      console.log('Cập nhật phiếu thành công')
      console.log('====================================')
      message.success('Cập nhật phiếu thành công')
      onSuccess?.()
      onClose()
    } catch (error) {
      console.error('=== [UpdateTicketModal] VALIDATION FAILED ===')
      console.error('Validation error:', error)
      console.error('====================================')
    }
  }

  return (
    <Modal
      title={
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          padding: '0 4px'
        }}>
          <span style={{ fontSize: '18px', fontWeight: 700 }}>Thông Tin Phiếu Dịch Vụ</span>
          <Button 
            type="text" 
            onClick={onClose}
            style={{ fontSize: '18px', fontWeight: 700, padding: 0, width: '24px', height: '24px' }}
          >
            ×
          </Button>
        </div>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={600}
      style={{ top: 20 }}
      closable={false}
    >
      <Form
        form={form}
        layout="vertical"
        style={{ marginTop: '20px' }}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Tên khách hàng"
              name="customerName"
              rules={[{ required: true, message: 'Vui lòng nhập tên khách hàng' }]}
            >
              <Input placeholder="Nhập tên khách hàng" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Số điện thoại"
              name="phone"
              rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }]}
            >
              <Input placeholder="Nhập số điện thoại" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Hãng xe"
              name="brandId"
              rules={[{ required: true, message: 'Vui lòng chọn hãng xe' }]}
            >
              <select
                style={{
                  width: '100%',
                  height: 40,
                  borderRadius: 8,
                  border: '1px solid #d9d9d9',
                  padding: '0 12px',
                  fontSize: 14,
                  background: '#fff',
                  cursor: 'pointer'
                }}
                value={selectedBrandId || form.getFieldValue('brandId') || ''}
                onChange={handleBrandChange}
                disabled={brandsLoading}
              >
                <option value="">{brandsLoading ? 'Đang tải...' : 'Chọn hãng xe'}</option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Loại xe"
              name="modelId"
              rules={[{ required: true, message: 'Vui lòng chọn loại xe' }]}
            >
              <select
                style={{
                  width: '100%',
                  height: 40,
                  borderRadius: 8,
                  border: '1px solid #d9d9d9',
                  padding: '0 12px',
                  fontSize: 14,
                  background: models.length === 0 ? '#f5f5f5' : '#fff',
                  cursor: models.length === 0 ? 'not-allowed' : 'pointer'
                }}
                value={selectedModelId || form.getFieldValue('modelId') || ''}
                onChange={handleModelChange}
                disabled={modelsLoading || models.length === 0}
              >
                <option value="">
                  {modelsLoading
                    ? 'Đang tải...'
                    : models.length
                      ? 'Chọn loại xe'
                      : 'Chọn hãng xe trước'}
                </option>
                {models.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Biển số xe"
              name="licensePlate"
              rules={[{ required: true, message: 'Vui lòng nhập biển số xe' }]}
            >
              <Input
                placeholder="Nhập biển số xe"
                onBlur={(e) => {
                  const upper = e.target.value.toUpperCase()
                  form.setFieldsValue({ licensePlate: upper })
                }}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Số khung"
              name="chassisNumber"
            >
              <Input placeholder="Nhập số khung" />
            </Form.Item>
          </Col>
        </Row>

        <div style={{ 
          height: '1px', 
          background: '#f0f0f0', 
          margin: '20px 0' 
        }} />

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Nhân viên lập báo giá"
              name="quoteStaff"
            >
              <Input placeholder="Nhập tên nhân viên" readOnly style={{ background: '#fafafa' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Ngày tiếp nhận xe"
              name="receiveDate"
            >
              <DatePicker 
                style={{ width: '100%' }} 
                format="DD/MM/YYYY"
                placeholder="Chọn ngày"
                disabled
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Kỹ thuật viên"
              name="assignedTechnicianIds"
              rules={[{ required: true, message: 'Vui lòng chọn kỹ thuật viên' }]}
            >
              <Checkbox.Group
                style={{ width: '100%' }}
                value={form.getFieldValue('assignedTechnicianIds') || []}
                onChange={(checkedValues) => {
                  form.setFieldsValue({ assignedTechnicianIds: checkedValues })
                }}
              >
                <Row gutter={[8, 8]}>
                  {technicianLoading ? (
                    <Col span={24}>
                      <div style={{ padding: '8px 0', color: '#999' }}>Đang tải...</div>
                    </Col>
                  ) : technicianOptions.length === 0 ? (
                    <Col span={24}>
                      <div style={{ padding: '8px 0', color: '#999' }}>Không có dữ liệu</div>
                    </Col>
                  ) : (
                    technicianOptions.map((tech) => (
                      <Col span={12} key={tech.value}>
                        <Checkbox
                          value={tech.value}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid #d9d9d9',
                            borderRadius: 6,
                            margin: 0,
                            transition: 'all 0.2s'
                          }}
                        >
                          {tech.label}
                        </Checkbox>
                      </Col>
                    ))
                  )}
                </Row>
              </Checkbox.Group>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Loại dịch vụ"
              name="serviceTypes"
              rules={[{ required: true, message: 'Vui lòng chọn loại dịch vụ' }]}
            >
              <Checkbox.Group
                style={{ width: '100%' }}
                value={form.getFieldValue('serviceTypes') || []}
                onChange={(checkedValues) => {
                  form.setFieldsValue({ serviceTypes: checkedValues })
                }}
              >
                <Row gutter={[8, 8]}>
                  {serviceLoading ? (
                    <Col span={24}>
                      <div style={{ padding: '8px 0', color: '#999' }}>Đang tải...</div>
                    </Col>
                  ) : serviceOptions.length === 0 ? (
                    <Col span={24}>
                      <div style={{ padding: '8px 0', color: '#999' }}>Không có dữ liệu</div>
                    </Col>
                  ) : (
                    serviceOptions.map((service) => (
                      <Col span={12} key={service.value}>
                        <Checkbox
                          value={service.value}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid #d9d9d9',
                            borderRadius: 6,
                            margin: 0,
                            transition: 'all 0.2s'
                          }}
                        >
                          {service.label}
                        </Checkbox>
                      </Col>
                    ))
                  )}
                </Row>
              </Checkbox.Group>
            </Form.Item>
          </Col>
        </Row>

        <div style={{ 
          display: 'flex', 
          justifyContent: 'flex-end', 
          marginTop: '24px',
          paddingTop: '16px',
          borderTop: '1px solid #f0f0f0'
        }}>
          <Button
            type="primary"
            onClick={handleSubmit}
            loading={loading}
            style={{
              background: '#22c55e',
              borderColor: '#22c55e',
              height: '40px',
              padding: '0 32px',
              fontWeight: 600,
              borderRadius: '8px'
            }}
          >
            Lưu
          </Button>
        </div>
      </Form>
    </Modal>
  )
}

