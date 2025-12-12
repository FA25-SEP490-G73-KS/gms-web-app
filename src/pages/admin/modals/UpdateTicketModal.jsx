import React, { useEffect, useState, useMemo } from 'react'
import { Modal, Form, Input, DatePicker, Button, Row, Col, message } from 'antd'
import { serviceTicketAPI, vehiclesAPI, serviceTypeAPI, employeesAPI } from '../../../services/api'
import { normalizePhoneTo84, displayPhoneFrom84 } from '../../../utils/helpers'
import dayjs from 'dayjs'
import ReactSelect from 'react-select'

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
  const [pendingModelId, setPendingModelId] = useState(null)
  const [currentUserName, setCurrentUserName] = useState('')
  const [selectedBrandId, setSelectedBrandId] = useState(null)
  const [selectedModelId, setSelectedModelId] = useState(null)
  const [selectedTechs, setSelectedTechs] = useState([])
  const [selectedServices, setSelectedServices] = useState([])

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

  const techOptionsStable = useMemo(() => technicianOptions, [technicianOptions])
  const serviceOptionsStable = useMemo(() => serviceOptions, [serviceOptions])

  const handleTechChange = (selected) => {
    const arr = selected || []
    setSelectedTechs(arr)
    form.setFieldsValue({ assignedTechnicianIds: arr.map(s => s.value) })
  }

  const handleServiceChange = (selected) => {
    const arr = selected || []
    setSelectedServices(arr)
    form.setFieldsValue({ serviceTypes: arr.map(s => s.value) })
  }

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
    const mapped = list.map((model) => ({
      id: model.vehicleModelId || model.id,
      name: model.vehicleModelName || model.name
    }))
    setModels(mapped)
    
    // Nếu có currentModelId trong form, thử match sau khi models được load
    const currentModelId = form.getFieldValue('modelId')
    if (currentModelId && mapped.length > 0) {
      const matchedModel = mapped.find((model) => String(model.id) === String(currentModelId))
      if (matchedModel) {
        setSelectedModelId(matchedModel.id)
        form.setFieldsValue({ modelId: matchedModel.id })
      }
    }
    
    return mapped
  }

  useEffect(() => {
    if (open && ticketId) {
      // Reset states trước khi fetch
      setSelectedTechs([])
      setSelectedServices([])
      setSelectedBrandId(null)
      setSelectedModelId(null)
      fetchTicketData()
    } else {
      form.resetFields()
      setTicketData(null)
      setVehicleInfo({ vehicleId: 0, brandName: '', modelName: '', vin: '' })
      setPendingServiceNames([])
      setPendingTechnicianNames([])
      setPendingBrandName('')
      setPendingModelName('')
      setPendingModelId(null)
      setSelectedBrandId(null)
      setSelectedModelId(null)
      setSelectedTechs([])
      setSelectedServices([])
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
      const mapped = list.map((brand) => ({
        id: brand.brandId || brand.id,
        name: brand.brandName || brand.name
      }))
      setBrands(mapped)
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
        const lower = name.toLowerCase().trim()
        return serviceOptions.find((option) => {
          const optionLabel = option.label?.toLowerCase().trim()
          return optionLabel === lower || optionLabel?.includes(lower) || lower.includes(optionLabel)
        })?.value
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
        const lower = name.toLowerCase().trim()
        return technicianOptions.find((option) => {
          const optionLabel = option.label?.toLowerCase()
          
          return optionLabel?.includes(lower) || optionLabel?.startsWith(lower)
        })?.value
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
      (brand) => brand.name?.toLowerCase().trim() === pendingBrandName.toLowerCase().trim()
    )
    if (matchedBrand) {
      setPendingBrandName('')
      setPendingModelName('')
      ;(async () => {
        setSelectedBrandId(matchedBrand.id)
        const list = await handleBrandSelect(matchedBrand.id)
        form.setFieldsValue({ brandId: matchedBrand.id })
        if (modelNameToMatch) {
        
          setTimeout(() => {
            const source = list && list.length ? list : models
            const matchedModel = source.find(
              (model) => model.name?.toLowerCase().trim() === modelNameToMatch.toLowerCase().trim()
            )
            if (matchedModel) {
              setSelectedModelId(matchedModel.id)
              form.setFieldsValue({ modelId: matchedModel.id })
            }
          }, 200)
        }
      })()
    } else {
      setPendingBrandName('')
      setPendingModelName('')
    }
  }, [pendingBrandName, pendingModelName, brands, models, form])
  

  useEffect(() => {
    if ((!pendingModelName && !pendingModelId) || !selectedBrandId || !models.length) return
    let matchedModel = null
    if (pendingModelId) {
      matchedModel = models.find((model) => String(model.id) === String(pendingModelId))
    }
    if (!matchedModel && pendingModelName) {
      matchedModel = models.find(
        (model) => model.name?.toLowerCase().trim() === pendingModelName.toLowerCase().trim()
      )
    }
    if (matchedModel) {
      setSelectedModelId(matchedModel.id)
      form.setFieldsValue({ modelId: matchedModel.id })
      setPendingModelName('')
      setPendingModelId(null)
    }
  }, [pendingModelName, pendingModelId, selectedBrandId, models, form])

  // Sync modelId khi models được load
  useEffect(() => {
    const modelIdFromForm = form.getFieldValue('modelId')
    if (modelIdFromForm && models.length > 0) {
      const modelIdNum = Number(modelIdFromForm)
      const modelExists = models.find(m => {
        const mId = m.id || m.vehicleModelId
        return mId === modelIdNum || Number(mId) === modelIdNum
      })
      if (modelExists && selectedModelId !== modelIdNum) {
        setSelectedModelId(modelIdNum)
      }
    } else if (!modelIdFromForm && selectedModelId) {
      setSelectedModelId(null)
    }
  }, [models, form, selectedModelId])

  // Sync brandId khi brands được load
  useEffect(() => {
    const brandIdFromForm = form.getFieldValue('brandId')
    if (brandIdFromForm && brands.length > 0) {
      const brandIdNum = Number(brandIdFromForm)
      const brandExists = brands.find(b => {
        const bId = b.id || b.brandId
        return bId === brandIdNum || Number(bId) === brandIdNum
      })
      if (brandExists && selectedBrandId !== brandIdNum) {
        setSelectedBrandId(brandIdNum)
      }
    } else if (!brandIdFromForm && selectedBrandId) {
      setSelectedBrandId(null)
    }
  }, [brands, form, selectedBrandId])

  // Sync selectedTechs và selectedServices khi form values hoặc options thay đổi
  useEffect(() => {
    const techIds = form.getFieldValue('assignedTechnicianIds') || []
    if (Array.isArray(techIds) && techIds.length > 0) {
      if (technicianOptions.length > 0) {
        const matched = technicianOptions.filter(opt => techIds.map(String).includes(String(opt.value)))
        if (matched.length > 0) {
          const currentValues = selectedTechs.map(s => String(s.value)).sort().join(',')
          const newValues = matched.map(m => String(m.value)).sort().join(',')
          if (currentValues !== newValues) {
            console.log('Syncing selectedTechs:', matched, 'from IDs:', techIds)
            setSelectedTechs(matched)
          }
        } else {
          console.warn('No matched technicians found. IDs:', techIds, 'Available:', technicianOptions.map(o => o.value))
        }
      } else {
        // Nếu options chưa được load, đợi một chút rồi thử lại
        const timer = setTimeout(() => {
          const currentTechIds = form.getFieldValue('assignedTechnicianIds') || []
          if (Array.isArray(currentTechIds) && currentTechIds.length > 0 && technicianOptions.length > 0) {
            const matched = technicianOptions.filter(opt => currentTechIds.map(String).includes(String(opt.value)))
            if (matched.length > 0) {
              setSelectedTechs(matched)
            }
          }
        }, 500)
        return () => clearTimeout(timer)
      }
    } else if (techIds.length === 0 && selectedTechs.length > 0) {
      setSelectedTechs([])
    }
  }, [form, technicianOptions, selectedTechs])

  useEffect(() => {
    const serviceIds = form.getFieldValue('serviceTypes') || []
    if (Array.isArray(serviceIds) && serviceIds.length > 0) {
      if (serviceOptions.length > 0) {
        const matched = serviceOptions.filter(opt => serviceIds.map(String).includes(String(opt.value)))
        if (matched.length > 0) {
          const currentValues = selectedServices.map(s => String(s.value)).sort().join(',')
          const newValues = matched.map(m => String(m.value)).sort().join(',')
          if (currentValues !== newValues) {
            console.log('Syncing selectedServices:', matched, 'from IDs:', serviceIds)
            setSelectedServices(matched)
          }
        } else {
          console.warn('No matched services found. IDs:', serviceIds, 'Available:', serviceOptions.map(o => o.value))
        }
      } else {
        // Nếu options chưa được load, đợi một chút rồi thử lại
        const timer = setTimeout(() => {
          const currentServiceIds = form.getFieldValue('serviceTypes') || []
          if (Array.isArray(currentServiceIds) && currentServiceIds.length > 0 && serviceOptions.length > 0) {
            const matched = serviceOptions.filter(opt => currentServiceIds.map(String).includes(String(opt.value)))
            if (matched.length > 0) {
              setSelectedServices(matched)
            }
          }
        }, 500)
        return () => clearTimeout(timer)
      }
    } else if (serviceIds.length === 0 && selectedServices.length > 0) {
      setSelectedServices([])
    }
  }, [form, serviceOptions, selectedServices])

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

  
    let serviceTypeIds = Array.isArray(data.serviceTypeIds)
      ? data.serviceTypeIds
      : (Array.isArray(data.serviceTypes)
          ? data.serviceTypes.map((item) => Number(item.serviceTypeId || item.id)).filter(Boolean)
          : [])

    if (!serviceTypeIds.length && Array.isArray(data.serviceType)) {
      const serviceNames = data.serviceType
        .map((item) => (typeof item === 'string' ? item : item?.name || item?.serviceTypeName || ''))
        .filter(Boolean)
      if (serviceNames.length > 0) {
        setPendingServiceNames(serviceNames)
      }
    }


    let assignedTechnicianIds = Array.isArray(data.assignedTechnicianIds)
      ? data.assignedTechnicianIds
      : []

  
    if (!assignedTechnicianIds.length && Array.isArray(data.technicians)) {
      const technicianNames = data.technicians
        .map((item) => (typeof item === 'string' ? item : item?.fullName || item?.name || ''))
        .filter(Boolean)
      if (technicianNames.length > 0) {
        setPendingTechnicianNames(technicianNames)
      }
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
      form.setFieldsValue({ brandId })
      const list = await handleBrandSelect(brandId)
      
      // Set modelId ngay sau khi models được load từ handleBrandSelect
      if (modelId && list && list.length > 0) {
        const matchedModel = list.find((model) => String(model.id) === String(modelId))
        if (matchedModel) {
          setSelectedModelId(matchedModel.id)
          form.setFieldsValue({ modelId: matchedModel.id })
        } else {
          // Nếu không tìm thấy, vẫn set để giữ giá trị
          setPendingModelId(modelId)
          setSelectedModelId(modelId)
          form.setFieldsValue({ modelId })
        }
      } else if (modelName && list && list.length > 0) {
        const matchedModel = list.find((model) => 
          model.name?.toLowerCase().trim() === modelName.toLowerCase().trim()
        )
        if (matchedModel) {
          setSelectedModelId(matchedModel.id)
          form.setFieldsValue({ modelId: matchedModel.id })
        } else {
          setPendingModelName(modelName)
        }
      } else if (modelId) {
        // Nếu có modelId nhưng chưa có models, set vào form để useEffect sync sau
        setPendingModelId(modelId)
        setSelectedModelId(modelId)
        form.setFieldsValue({ modelId })
      } else if (modelName) {
        setPendingModelName(modelName)
      }
    } else if (brandName) {
      setPendingBrandName(brandName)
      setPendingModelName(modelName)
    } else if (modelName && brands.length > 0) {
      setPendingModelName(modelName)
    }

    const quoteStaffName = data.createdBy || currentUserName || ''
    
    
    const receiveDate = data.createdAt 
      ? dayjs(data.createdAt) 
      : (data.deliveryAt ? dayjs(data.deliveryAt) : null)
    
  
    const finalModelId = form.getFieldValue('modelId') || (modelId || null)
      
    form.setFieldsValue({
      customerName: data.customer?.fullName || '',
      phone: displayPhoneFrom84(data.customer?.phone || ''),
      brandId: brandId || null,
      modelId: finalModelId,
      licensePlate: (vehicle.licensePlate || '').toUpperCase(),
      chassisNumber: vin || '',
      year: year || 2020,
      quoteStaff: quoteStaffName,
      receiveDate: receiveDate,
      serviceTypes: serviceTypeIds.length > 0 ? serviceTypeIds : undefined,
      assignedTechnicianIds: assignedTechnicianIds.length > 0 ? assignedTechnicianIds : undefined
    })

    // Sync selectedTechs và selectedServices sẽ được xử lý bởi useEffect khi options được load
    // Không cần setTimeout ở đây vì useEffect sẽ tự động sync
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
              <div>
                <ReactSelect
                  isMulti
                  options={techOptionsStable}
                  value={selectedTechs}
                  onChange={handleTechChange}
                  styles={multiSelectStyles}
                  placeholder={technicianLoading ? 'Đang tải...' : 'Chọn kỹ thuật viên'}
                  isDisabled={technicianLoading || techOptionsStable.length === 0}
                  menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                  classNamePrefix="react-select"
                />
                <div style={{ marginTop: 4, fontSize: 12, color: '#6b7280' }}>
                  {selectedTechs.length ? `Đã chọn ${selectedTechs.length}` : 'Chưa chọn kỹ thuật viên'}
                </div>
              </div>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Loại dịch vụ"
              name="serviceTypes"
              rules={[{ required: true, message: 'Vui lòng chọn loại dịch vụ' }]}
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
                <div style={{ marginTop: 4, fontSize: 12, color: '#6b7280' }}>
                  {selectedServices.length ? `Đã chọn ${selectedServices.length}` : 'Chưa chọn loại dịch vụ'}
                </div>
              </div>
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

