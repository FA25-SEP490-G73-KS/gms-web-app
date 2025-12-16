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
import CreatableSelect from 'react-select/creatable'

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
  const [phoneOptionsSource, setPhoneOptionsSource] = useState([])
  const [phoneOptions, setPhoneOptions] = useState([])
  const [phoneSelectValue, setPhoneSelectValue] = useState(null)
  // State để track các field đã được fill từ customer data
  const [filledFields, setFilledFields] = useState({
    name: false,
    address: false,
    phone: false
  })

  const [showCreateCustomerModal, setShowCreateCustomerModal] = useState(false)
  const [newCustomer, setNewCustomer] = useState({ phone: '', fullName: '', address: '' })

  
  const [plateConflict, setPlateConflict] = useState(null)
  
  // State cho danh sách xe của khách hàng
  const [customerVehicles, setCustomerVehicles] = useState([])
  const [vehicleOptions, setVehicleOptions] = useState([])
  const [plateOptionsSource, setPlateOptionsSource] = useState([]) // Danh sách đầy đủ các biển số
  const [plateOptions, setPlateOptions] = useState([]) // Danh sách đã filter để hiển thị
  const [plateSelectValue, setPlateSelectValue] = useState(null) // Giá trị đã chọn trong CreatableSelect
  const [plateOption, setPlateOption] = useState(null) // Option đang chọn cho CreatableSelect
  const [selectedVehicle, setSelectedVehicle] = useState(null)
  const [isNewVehicle, setIsNewVehicle] = useState(false)

  const navigate = useNavigate()

  const customerTypeSelected = Form.useWatch('customerType', form) || 'CA_NHAN'

  const [selectedServices, setSelectedServices] = useState([])
  const [selectedTechs, setSelectedTechs] = useState([])

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
  const singleSelectStyles = {
    ...multiSelectStyles,
    valueContainer: (base) => ({ ...base, padding: '4px 8px', gap: 4, alignItems: 'center' }),
    multiValue: undefined,
    multiValueLabel: undefined,
    multiValueRemove: undefined,
    // Đảm bảo input chỉ hiển thị label (số điện thoại)
    singleValue: (base) => ({ 
      ...base, 
      color: '#1a1a1a',
      fontSize: '14px',
      fontWeight: 400
    })
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
    const arr = selected || []
    setSelectedServices(arr)
    const ids = arr.map(s => s.value)
    form.setFieldsValue({ service: ids })
  }

  const handleTechChange = (selected) => {
    const arr = selected || []
    setSelectedTechs(arr)
    const ids = arr.map((s) => s.value)
    form.setFieldsValue({ techs: ids })
  }

  // Hàm để xóa chỉ thông tin xe (giữ lại thông tin khách hàng và biển số xe)
  const resetVehicleInfo = () => {
    setIsNewVehicle(true)
    setSelectedVehicle(null)
  
    form.setFieldsValue({
      brand: undefined,
      model: undefined,
      vin: '',
      year: 2020
      // NOTE: plate is NOT reset here - it's controlled by plateSelectValue
    })
  
    setSelectedBrandId(null)
    setSelectedModelId(null)
  }

  const resetCustomerSelection = () => {
    setCustomerId(null)
    setCustomerExists(false)
    setCustomerDiscountPolicyId(0)
    setCustomerVehicles([])
    setVehicleOptions([])
    setPlateOptionsSource([]) // Xóa dropdown biển số xe
    setPlateOptions([]) // Xóa dropdown biển số xe
    setSelectedVehicle(null)
    // Reset filled fields
    setFilledFields({
      name: false,
      address: false,
      phone: false
    })
    setIsNewVehicle(true)
    setPlateSelectValue(null)
    setPlateOption(null)
    // Xóa TẤT CẢ các trường thông tin khách hàng và xe
    form.setFieldsValue({ 
      customerType: 'DOANH_NGHIEP',
      phone: '',
      name: '',
      address: '',
      plate: '',
      brand: undefined,
      model: undefined,
      vin: '',
      year: 2020
    })
    setSelectedBrandId(null)
    setSelectedModelId(null)
    // KHÔNG xóa models array, chỉ xóa selectedModelId để dropdown vẫn hiện tất cả
    // setModels([]) - BỎ DÒNG NÀY
    setPhoneSelectValue(null)
    setCurrentPhone('')
  }
  
  // Fetch vehicles của khách hàng
  const fetchCustomerVehicles = async (customerId) => {
    if (!customerId) {
      setCustomerVehicles([])
      setVehicleOptions([])
      return
    }
    
    try {
      // Lấy thông tin customer đầy đủ để có danh sách vehicles
      const { data, error } = await customersAPI.getById(customerId)
      if (error || !data || !data.result) {
        console.warn('Error fetching customer vehicles:', error)
        return
      }
      
      const customer = data.result
      // Lấy danh sách vehicles từ customer
      const vehicles = customer.vehicles || []
      const licensePlates = customer.licensePlates || []
      
      // Tạo options từ vehicles hoặc licensePlates
      const vehicleOptionsList = []
      
      if (Array.isArray(vehicles) && vehicles.length > 0) {
        // Nếu có vehicles array với đầy đủ thông tin
        vehicles.forEach(vehicle => {
          const plate = vehicle.licensePlate || vehicle.plate || ''
          if (plate) {
            // Format plate để đảm bảo consistency
            const formattedPlate = formatLicensePlate(plate)
            vehicleOptionsList.push({
              value: formattedPlate,
              label: formattedPlate,
              vehicle: vehicle
            })
          }
        })
      } else if (Array.isArray(licensePlates) && licensePlates.length > 0) {
        // Nếu chỉ có licensePlates array (strings)
        licensePlates.forEach(plate => {
          if (plate) {
            vehicleOptionsList.push({
              value: plate,
              label: plate
            })
          }
        })
      }
      
      setVehicleOptions(vehicleOptionsList)
      setPlateOptionsSource(vehicleOptionsList) // Lưu danh sách đầy đủ
      setPlateOptions(vehicleOptionsList) // Khởi tạo với danh sách đầy đủ
      setCustomerVehicles(vehicles.length > 0 ? vehicles : licensePlates)
    } catch (err) {
      console.error('Error fetching customer vehicles:', err)
      setVehicleOptions([])
      setCustomerVehicles([])
    }
  }
  
  // Xử lý khi chọn biển số xe
  // NOTE: This function should NOT set plateSelectValue or form.plate
  // Those are controlled by onChange (single source of truth)
  const handlePlateSelect = async (plateValue, vehiclesList = []) => {
    if (!plateValue) {
      setIsNewVehicle(false)
      setSelectedVehicle(null)
      form.setFieldsValue({
        brand: undefined,
        model: undefined,
        vin: '',
        year: 2020
        // NOTE: plate is NOT set here - it's controlled by onChange
      })
      setSelectedBrandId(null)
      setSelectedModelId(null)
      return
    }
  
    const formattedPlate = formatLicensePlate(plateValue)
    // NOTE: Do NOT set form.plate here - onChange already handles it
  
    let existingVehicle = null
  
    if (Array.isArray(vehiclesList) && vehiclesList.length > 0) {
      existingVehicle = vehiclesList.find(v => {
        const vPlate = v.licensePlate || v.plate || ''
        return formatLicensePlate(vPlate) === formattedPlate
      })
    }
  
    if (!existingVehicle) {
      try {
        const { data } = await vehiclesAPI.getByLicensePlate(formattedPlate)
        if (data?.result) {
          const v = Array.isArray(data.result) ? data.result[0] : data.result
          if (
            v.customerId === customerId ||
            v.customer?.customerId === customerId
          ) {
            existingVehicle = v
          }
        }
      } catch {}
    }
  
    // ================= XE ĐÃ TỒN TẠI =================
    if (existingVehicle) {
      setIsNewVehicle(false)
      setSelectedVehicle(existingVehicle)

      const vehicle = existingVehicle.vehicle || existingVehicle

      console.log('handlePlateSelect - vehicle data:', vehicle)

      const brandIdRaw = vehicle.brandId ||
        vehicle.brand?.id ||
        vehicle.brand?.brandId ||
        (vehicle.brand && typeof vehicle.brand === 'number' ? vehicle.brand : undefined)
      const brandNameRaw =
        vehicle.brandName ||
        vehicle.brand?.name ||
        vehicle.brand?.brandName ||
        vehicle?.brand_name

      const modelIdRaw = vehicle.modelId ||
        vehicle.model?.id ||
        vehicle.model?.vehicleModelId ||
        (vehicle.model && typeof vehicle.model === 'number' ? vehicle.model : undefined)
      const modelNameRaw =
        vehicle.modelName ||
        vehicle.vehicleModelName ||
        vehicle.model?.name ||
        vehicle.model?.vehicleModelName ||
        vehicle?.model_name

      const brandId = brandIdRaw ? Number(brandIdRaw) : undefined
      const modelId = modelIdRaw ? Number(modelIdRaw) : undefined

      const vin =
        vehicle.vin ||
        vehicle.chassisNumber ||
        vehicle.frameNumber ||
        ''

      const year = vehicle.year || 2020

      console.log('handlePlateSelect - extracted data:', { brandId, modelId, vin, year })

      // ✅ set trước
      form.setFieldsValue({ vin, year })

      if (brandId && !isNaN(brandId)) {
        // ✅ Đảm bảo brands đã được load trước khi set selectedBrandId
        if (brands.length === 0) {
          try {
            const { data, error } = await vehiclesAPI.getBrands()
            if (!error && data) {
              const brandsList = Array.isArray(data.result) ? data.result : (data.result ? [data.result] : [])
              const mappedBrands = brandsList.map((brand) => ({
                id: brand.brandId || brand.id,
                name: brand.brandName || brand.name
              }))
              setBrands(mappedBrands)
              console.log('Loaded brands in handlePlateSelect:', mappedBrands)
            }
          } catch (err) {
            console.warn('Error fetching brands in handlePlateSelect:', err)
          }
        }

        // ✅ Set brandId vào form và state sau khi brands đã được load
        setSelectedBrandId(brandId)
        form.setFieldsValue({ brand: brandId })
        console.log('Set selectedBrandId:', brandId, 'Available brands:', brands)

        // ✅ Set modelId vào form TRƯỚC khi load models để handleBrandChange có thể đọc được
        if (modelId && !isNaN(modelId)) {
          form.setFieldsValue({ model: modelId })
          console.log('Set modelId in form BEFORE handleBrandChange:', modelId)
        }

        // load model theo hãng - handleBrandChange sẽ tự động set selectedModelId nếu có currentModelId
        await handleBrandChange(brandId)

        // ✅ Đảm bảo selectedModelId được set sau khi handleBrandChange xong
        // Đợi một chút để models state được cập nhật hoàn toàn
        if (modelId && !isNaN(modelId)) {
          // Sử dụng setTimeout để đảm bảo models state đã được cập nhật
          setTimeout(() => {
            setSelectedModelId(modelId)
            form.setFieldsValue({ model: modelId })
            console.log('Set selectedModelId after handleBrandChange (with timeout):', modelId, 'Available models:', models)
          }, 100)
        }
      } else if (modelId && !isNaN(modelId)) {
        // Nếu không có brandId nhưng có modelId, set luôn
        setSelectedModelId(modelId)
        form.setFieldsValue({ model: modelId })
        console.log('Set modelId without brandId:', modelId)
      } else if (brandNameRaw) {
        // Fallback: match brand theo tên nếu không có brandId
        const matchedBrand = brands.find((b) => {
          const bName = (b.name || '').toLowerCase().trim()
          return bName === (brandNameRaw || '').toLowerCase().trim()
        })
        if (matchedBrand) {
          const bId = matchedBrand.id || matchedBrand.brandId
          setSelectedBrandId(bId)
          form.setFieldsValue({ brand: bId })
          await handleBrandChange(bId)
          // Nếu có modelName và chưa có modelId, thử match theo tên
          if (modelNameRaw && models.length > 0) {
            const matchedModel = models.find((m) => {
              const mName = (m.name || m.vehicleModelName || '').toLowerCase().trim()
              return mName === modelNameRaw.toLowerCase().trim()
            })
            if (matchedModel) {
              setSelectedModelId(matchedModel.id || matchedModel.vehicleModelId)
              form.setFieldsValue({ model: matchedModel.id || matchedModel.vehicleModelId })
            }
          }
        } else if (modelNameRaw && models.length > 0) {
          // Nếu không match được brand nhưng có modelName, thử match model theo tên
          const matchedModel = models.find((m) => {
            const mName = (m.name || m.vehicleModelName || '').toLowerCase().trim()
            return mName === modelNameRaw.toLowerCase().trim()
          })
          if (matchedModel) {
            setSelectedModelId(matchedModel.id || matchedModel.vehicleModelId)
            form.setFieldsValue({ model: matchedModel.id || matchedModel.vehicleModelId })
          }
        }
      } else if (modelNameRaw && models.length > 0) {
        const matchedModel = models.find((m) => {
          const mName = (m.name || m.vehicleModelName || '').toLowerCase().trim()
          return mName === modelNameRaw.toLowerCase().trim()
        })
        if (matchedModel) {
          setSelectedModelId(matchedModel.id || matchedModel.vehicleModelId)
          form.setFieldsValue({ model: matchedModel.id || matchedModel.vehicleModelId })
        }
      }

      return
    }
  
    // ================= XE MỚI =================
    setIsNewVehicle(true)
    setSelectedVehicle(null)
    form.setFieldsValue({
      brand: undefined,
      model: undefined,
      vin: '',
      year: 2020
    })
    setSelectedBrandId(null)
    setSelectedModelId(null)
    // ❌ KHÔNG setModels([])
  }
  


  const formatLicensePlate = (value) => {
    if (!value) return value
    
    let cleaned = value.replace(/[-\s]/g, '').toUpperCase()
    
    
    if (cleaned.length > 10) {
      cleaned = cleaned.substring(0, 10)
    }
    
  
    if (cleaned.length >= 3) {

      if (/^[0-9]{2}[A-Z]/.test(cleaned)) {
        const part1 = cleaned.substring(0, 3) 
        const part2 = cleaned.substring(3)    
        return part2 ? `${part1}-${part2}` : part1
      }
      
      else if (/^[A-Z]{2}/.test(cleaned)) {
        const part1 = cleaned.substring(0, 2) 
        const part2 = cleaned.substring(2)   
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
      const fetchedCustomerId = customer.customerId || customer.id || null
      
      setCustomerExists(true)
      setCustomerId(fetchedCustomerId)
      setCustomerDiscountPolicyId(customer.discountPolicyId ?? 0)

      const phoneValue = displayPhoneFrom84(customer.phone || normalizedPhone)
      setCurrentPhone(phoneValue || phone)
      // Chỉ set số điện thoại, không có fullName
      setPhoneSelectValue({
        label: phoneValue || phone,
        value: phoneValue || phone
      })

      // Fetch danh sách xe của khách hàng
      let vehiclesList = []
      if (fetchedCustomerId) {
        await fetchCustomerVehicles(fetchedCustomerId)
        // Lấy vehicles từ customer response
        vehiclesList = customer.vehicles || []
      }

      // Track các field đã được fill từ customer data
      const customerName = customer.fullName || customer.name
      const customerAddress = customer.address
      
      setFilledFields({
        name: !!customerName,
        address: !!customerAddress,
        phone: true // Phone luôn được fill khi select
      })
      
      // Chỉ fill thông tin khách hàng, KHÔNG fill biển số xe và thông tin xe
      form.setFieldsValue({
        phone: phoneValue || phone,
        name: customerName || form.getFieldValue('name'),
        address: customerAddress || form.getFieldValue('address'),
        customerType: customer.customerType || 'DOANH_NGHIEP'
      })
      
      // Reset các trường thông tin xe - người dùng sẽ chọn biển số xe sau
      // NOTE: KHÔNG reset plateSelectValue khi fetch customer - giữ nguyên giá trị đã nhập
      setIsNewVehicle(true)
      setSelectedVehicle(null)
      form.setFieldsValue({
        brand: undefined,
        model: undefined,
        vin: '',
        year: 2020
        // NOTE: KHÔNG reset plate ở đây - giữ nguyên giá trị đã nhập
      })
      setSelectedBrandId(null)
      setSelectedModelId(null)
      setModels([])
    } catch (err) {
      console.error('Lookup customer by phone failed:', err)
      resetCustomerSelection()
    } finally {
      setCustomerLookupLoading(false)
    }
  }

  const fetchAllCustomers = async () => {
    try {
      const { data, error } = await customersAPI.getAll(0, 1000)
      if (error) return
      const result = data?.result || data || {}
      const content = Array.isArray(result?.content) ? result.content : Array.isArray(result) ? result : []
      const mapped = content.map((c) => {
        const phoneRaw = c.phone || c.customerPhone || ''
        const phoneLocal = displayPhoneFrom84(phoneRaw) || phoneRaw
        const fullName = c.fullName || c.name || ''
        // Lưu cả tên và số điện thoại để hiển thị trong dropdown
        return { 
          label: phoneLocal, // Label để hiển thị trong input (chỉ số điện thoại)
          value: phoneLocal, // Value để lưu vào form
          fullName: fullName, // Tên để hiển thị trong dropdown
          phone: phoneLocal // Số điện thoại để hiển thị trong dropdown
        }
      }).filter((opt) => opt.value)
      setPhoneOptionsSource(mapped)
      setPhoneOptions(mapped)
    } catch (err) {
      console.error('Fetch all customers failed:', err)
    }
  }

  const setPhoneSelectByValue = (value) => {
    if (!value) {
      setPhoneSelectValue(null)
      return
    }
    const normalized = displayPhoneFrom84(value) || value
    let opt = phoneOptionsSource.find((o) => o.value === normalized)
    if (!opt) {
      opt = { label: normalized, value: normalized, fullName: '', phone: normalized }
      setPhoneOptionsSource((prev) => [...prev, opt])
      setPhoneOptions((prev) => [...prev, opt])
    }
    // Chỉ lưu label và value (số điện thoại) để hiển thị trong input
    setPhoneSelectValue({
      label: opt.label || opt.value,
      value: opt.value || opt.label
    })
  }

  useEffect(() => {
    fetchAllCustomers()
  }, [])

  // Sync brandId khi brands được load
  useEffect(() => {
    const brandIdFromForm = form.getFieldValue('brand')
    if (brandIdFromForm && brands.length > 0) {
      const brandIdNum = Number(brandIdFromForm)
      const brandExists = brands.find(b => {
        const bId = b.id || b.brandId
        return bId === brandIdNum || bId === brandIdFromForm || Number(bId) === brandIdNum
      })
      if (brandExists) {
        // Luôn sync nếu brand tồn tại, không cần check selectedBrandId !== brandIdNum
        if (selectedBrandId !== brandIdNum) {
          console.log('Syncing brandId from form:', brandIdNum, 'Available brands:', brands, 'Found:', brandExists)
          setSelectedBrandId(brandIdNum)
        }
      } else {
        console.warn('Brand not found in list:', brandIdNum, 'Available brands:', brands)
      }
    } else if (!brandIdFromForm && selectedBrandId) {
      // Nếu form không có brandId nhưng selectedBrandId vẫn có, clear nó
      console.log('Clearing selectedBrandId because form has no brandId')
      setSelectedBrandId(null)
    }
  }, [brands, form, selectedBrandId])

  // Sync modelId khi models được load
  useEffect(() => {
    const modelIdFromForm = form.getFieldValue('model')
    if (modelIdFromForm && models.length > 0) {
      const modelIdNum = Number(modelIdFromForm)
      const modelExists = models.find(m => {
        const mId = m.id || m.vehicleModelId
        return mId === modelIdNum || mId === modelIdFromForm || Number(mId) === modelIdNum
      })
      if (modelExists) {
        // Luôn sync nếu model tồn tại, không cần check selectedModelId !== modelIdNum
        if (selectedModelId !== modelIdNum) {
          console.log('Syncing modelId from form:', modelIdNum, 'Available models:', models, 'Found:', modelExists)
          setSelectedModelId(modelIdNum)
        }
      } else {
        console.warn('Model not found in list:', modelIdNum, 'Available models:', models)
      }
    } else if (!modelIdFromForm && selectedModelId) {
      // Nếu form không có modelId nhưng selectedModelId vẫn có, clear nó
      console.log('Clearing selectedModelId because form has no modelId')
      setSelectedModelId(null)
    }
  }, [models, form, selectedModelId])

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
    // Không reset model nếu đang fill từ vehicle data
    const currentModelId = form.getFieldValue('model')
    
    if (!brandId) {
      setModels([])
      setSelectedModelId(null)
      if (!currentModelId) {
        form.setFieldsValue({ model: undefined })
      }
      return
    }

    // Chỉ reset model nếu không có currentModelId
    if (!currentModelId) {
      setSelectedModelId(null)
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
      const mappedModels = modelList.map((model) => ({
          id: model.vehicleModelId || model.id,
          name: model.vehicleModelName || model.name
        }))
      setModels(mappedModels)
      
      // Nếu có currentModelId và nó tồn tại trong danh sách mới, set selectedModelId ngay
      if (currentModelId) {
        const currentModelIdNum = Number(currentModelId)
        const foundModel = mappedModels.find(m => {
          const mId = m.id || m.vehicleModelId
          return mId === currentModelIdNum || mId === currentModelId || Number(mId) === currentModelIdNum
        })
        if (foundModel) {
          setSelectedModelId(currentModelIdNum)
          form.setFieldsValue({ model: currentModelIdNum })
          console.log('Found model in new list and set selectedModelId:', foundModel, 'for modelId:', currentModelIdNum)
        } else {
          console.warn('Model not found in new list:', currentModelIdNum, 'Available:', mappedModels)
          // Vẫn set để đảm bảo giá trị được lưu
          setSelectedModelId(currentModelIdNum)
          form.setFieldsValue({ model: currentModelIdNum })
        }
      } else {
        setSelectedModelId(null)
      }
      
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
    console.log('[CreateTicketNewCustomer] onFinish payload:', values)
    if (!Array.isArray(values.service) || values.service.length === 0) {
      message.warning('Vui lòng chọn ít nhất một loại dịch vụ')
      return
    }



    const normalizedPhone = normalizePhoneTo84(values.phone)
    const plateValueRaw = values.plate
    const plateValue =
      typeof plateValueRaw === 'string'
        ? plateValueRaw
        : plateValueRaw?.value || plateValueRaw?.label || ''
    const plateUpper = plateValue ? plateValue.toString().toUpperCase().trim() : ''
    
    const finalBrandId = selectedBrandId || values.brand || null
    const finalModelId = selectedModelId || values.model || null
    
 
    const selectedBrand = brands.find(b => b.id === Number(finalBrandId))
    const selectedModel = models.find(m => m.id === Number(finalModelId))

    // Lấy vehicleId từ selectedVehicle nếu có
    const vehicleId = selectedVehicle?.vehicleId || selectedVehicle?.id || null
    
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
      receiveCondition: values.note || '',
      serviceTypeIds: (values.service || []).map((id) => Number(id)),
      vehicle: {
        brandId: finalBrandId ? Number(finalBrandId) : null,
        brandName: selectedBrand?.name || '',
        licensePlate: plateUpper,
        modelId: finalModelId ? Number(finalModelId) : null,
        modelName: selectedModel?.name || '',
        vehicleId: vehicleId ? Number(vehicleId) : null, // Truyền vehicleId nếu có
        vin: values.vin ? String(values.vin).trim() : null,
        year: values.year ? Number(values.year) : 2020
      }
    }

   
    const plate = plateUpper || form.getFieldValue('plate')
    if (plate) {
      try {
        const { data: checkRes, error: checkError } = await vehiclesAPI.checkPlate(
          typeof plate === 'string' ? plate : plate?.value || plate?.label || plateUpper,
          customerId || null
        )
        if (checkError) {
          console.warn('Check plate (new customer) error:', checkError)
        } else {
          console.log('Check plate (new customer) response:', checkRes)
          const status = checkRes?.result?.status || checkRes?.message
          const owner = checkRes?.result?.owner || checkRes?.result?.customer
      
          if (status === 'OWNED_BY_OTHER' && owner?.customerId && owner.customerId !== customerId) {
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

    // Nếu là xe mới và có đầy đủ thông tin, tạo xe mới cho khách hàng
    if (isNewVehicle && customerId && plate && finalBrandId && finalModelId) {
      try {
        // Tạo vehicle mới cho khách hàng
        // Note: Nếu API có endpoint tạo vehicle, gọi ở đây
        // Hiện tại vehicle sẽ được tạo tự động khi tạo service ticket với forceAssignVehicle: true
        console.log('Creating new vehicle for customer:', {
          customerId,
          licensePlate: plate,
          brandId: finalBrandId,
          modelId: finalModelId,
          vin: values.vin,
          year: values.year
        })
      } catch (err) {
        console.warn('Error creating vehicle:', err)
        // Vẫn tiếp tục tạo ticket, vehicle sẽ được tạo tự động
      }
    }
    
    await submitCreateTicket(payload)
  }

  
  useEffect(() => {
    const sv = form.getFieldValue('service') || []
    if (Array.isArray(sv) && sv.length > 0 && serviceOptionsStable.length > 0) {
      const matched = serviceOptionsStable.filter(opt => {
        const svStr = sv.map(String)
        return svStr.includes(String(opt.value))
      })
      if (matched.length > 0) {
        setSelectedServices(matched)
      }
    } else if (Array.isArray(sv) && sv.length === 0 && selectedServices.length > 0) {
      setSelectedServices([])
    }
  }, [serviceOptionsStable, form])

  useEffect(() => {
    const tv = form.getFieldValue('techs') || []
    if (Array.isArray(tv) && techOptionsStable.length > 0) {
      setSelectedTechs(techOptionsStable.filter(opt => tv.map(String).includes(String(opt.value))))
    }
  }, [techOptionsStable])

  const cardTitle = (
    <div>
      <span className="h4" style={{ fontSize: '24px', fontWeight: 600, display: 'block' }}>
        Tạo phiếu dịch vụ
      </span>
      <span className="caption" style={{ color: '#6b7280', display: 'block', marginTop: '4px' }}>
        Dành cho khách vãng lai
      </span>
    </div>
  )

  return (
    <AdminLayout>
      <div style={{ padding: '24px', minHeight: '100vh' }}>
        <Card title={cardTitle} style={{ borderRadius: '12px' }}>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleCreate}
            onFinishFailed={(info) => {
              const firstError = info?.errorFields?.[0]?.errors?.[0]
              if (firstError) {
                message.error(firstError)
              } else {
                message.error('Vui lòng kiểm tra lại các trường bắt buộc')
              }
            }}
          >
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
                        if (!value || value.toString().trim() === '') {
                          return Promise.reject(new Error('Vui lòng nhập số điện thoại'))
                        }
                        const cleanValue = value.toString().replace(/\s/g, '').replace(/[^0-9]/g, '')
                        
                        // Validate: phải bắt đầu bằng 0 và có 10 số
                        if (!/^0\d{9}$/.test(cleanValue)) {
                          return Promise.reject(new Error('Số điện thoại phải có 10 số và bắt đầu bằng 0'))
                        }
                        
                        return Promise.resolve()
                      }
                    }
                  ]}
                  style={formItemStyle}
                >
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <CreatableSelect
                        isClearable
                        isMulti={false}
                        placeholder="VD: 0123456789"
                        options={phoneOptions}
                        value={phoneSelectValue}
                        styles={singleSelectStyles}
                        classNamePrefix="react-select"
                        menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                        isLoading={customerLookupLoading}
                        components={{ DropdownIndicator: null }}
                        formatOptionLabel={({ label, fullName, phone }) => {
                          // Hiển thị tên và số điện thoại trong dropdown (2 dòng)
                          if (fullName) {
                            return (
                              <div style={{ display: 'flex', flexDirection: 'column', padding: '4px 0' }}>
                                <div style={{ fontSize: '14px', color: '#1a1a1a', fontWeight: 500, lineHeight: '1.4' }}>
                                  {fullName}
                                </div>
                                <div style={{ fontSize: '12px', color: '#666', marginTop: '2px', lineHeight: '1.4' }}>
                                  {phone || label}
                                </div>
                              </div>
                            )
                          }
                          // Nếu không có tên, chỉ hiển thị số điện thoại
                          return <div style={{ fontSize: '14px', color: '#1a1a1a' }}>{label}</div>
                        }}
                        getOptionValue={(option) => option.value || option.label}
                        getOptionLabel={(option) => {
                          // Chỉ trả về số điện thoại (label) để hiển thị trong input
                          // Không dùng formatOptionLabel cho input value
                          return option.label || option.value || ''
                        }}
                        onInputChange={(inputValue, action) => {
                          // Cập nhật form value khi người dùng đang nhập để giữ giá trị
                          if (action.action === 'input-change') {
                            const lower = inputValue.toLowerCase()
                            const filtered = phoneOptionsSource.filter((opt) =>
                              (opt.value || '').toLowerCase().includes(lower) ||
                              (opt.fullName || '').toLowerCase().includes(lower)
                            )
                            setPhoneOptions(filtered.length ? filtered : [{ label: inputValue, value: inputValue }])
                          
                            if (inputValue && inputValue.trim()) {
                              // Cập nhật form value khi đang nhập
                              const trimmed = inputValue.trim()
                              form.setFieldsValue({ phone: trimmed })
                              setCurrentPhone(trimmed)
                              // Chỉ lưu label và value (số điện thoại) để hiển thị trong input
                              const phoneOnlyOption = {
                                label: trimmed,
                                value: trimmed
                              }
                              setPhoneSelectValue(phoneOnlyOption)
                            } else if (!inputValue) {
                              // Nếu xóa hết số điện thoại, xóa TẤT CẢ thông tin khách hàng và xe
                              form.setFieldsValue({ phone: '' })
                              setPhoneSelectValue(null)
                              resetCustomerSelection()
                            }
                          }
                        }}
                        onChange={(option) => {
                          if (!option) {
                            // Nếu xóa số điện thoại (click nút x), xóa TẤT CẢ thông tin khách hàng và xe
                            setPhoneSelectValue(null)
                            setCurrentPhone('')
                            // Xóa ngay lập tức các trường thông tin khách hàng
                            form.setFieldsValue({ 
                              phone: '',
                              name: '',
                              address: ''
                            })
                            resetCustomerSelection()
                            return
                          }
                          
                          // Chỉ lưu label và value (số điện thoại) để hiển thị trong input
                          const phoneOnlyOption = {
                            label: option.label || option.value,
                            value: option.value || option.label
                          }
                          setPhoneSelectValue(phoneOnlyOption)
                          const selectedValue = option.value
                          form.setFieldsValue({ phone: selectedValue })
                          setCurrentPhone(selectedValue)
                          const isKnown = phoneOptionsSource.some((opt) => opt.value === selectedValue)
                          if (isKnown) {
                            fetchCustomerByPhone(selectedValue)
                          } else {
                            // Số điện thoại mới, reset tất cả nhưng giữ số điện thoại
                            resetCustomerSelection()
                            form.setFieldsValue({ phone: selectedValue })
                            setPhoneSelectValue(phoneOnlyOption)
                            setCurrentPhone(selectedValue)
                          }
                        }}
                        onCreateOption={(inputValue) => {
                          const trimmed = inputValue.trim()
                          const newOption = { 
                            label: trimmed, 
                            value: trimmed,
                            fullName: '',
                            phone: trimmed
                          }
                          
                          setPhoneOptionsSource((prev) => [...prev, newOption])
                          setPhoneOptions((prev) => {
                            const existsInOptions = prev.some((opt) => opt.value === trimmed)
                            return existsInOptions ? prev : [...prev, newOption]
                          })
                          
                          // Chỉ lưu label và value (số điện thoại) để hiển thị trong input
                          setPhoneSelectValue({
                            label: trimmed,
                            value: trimmed
                          })
                          form.setFieldsValue({ phone: trimmed })
                          setCurrentPhone(trimmed)
                          
                          // Số điện thoại mới, reset tất cả nhưng giữ số điện thoại
                          resetCustomerSelection()
                          form.setFieldsValue({ phone: trimmed })
                        }}
                        onKeyDown={(e) => {
                          // Khi nhấn Enter, ngăn form submit và giữ giá trị
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            // Lấy giá trị hiện tại từ form
                            const currentPhone = form.getFieldValue('phone')
                            if (currentPhone && currentPhone.trim()) {
                              const trimmed = currentPhone.trim()
                              const exists = phoneOptionsSource.some((opt) => opt.value === trimmed)
                              if (!exists) {
                                // Tạo option mới nếu chưa tồn tại
                                const newOption = { 
                                  label: trimmed, 
                                  value: trimmed,
                                  fullName: '',
                                  phone: trimmed
                                }
                                setPhoneOptionsSource((prev) => [...prev, newOption])
                                setPhoneOptions((prev) => {
                                  const existsInOptions = prev.some((opt) => opt.value === trimmed)
                                  return existsInOptions ? prev : [...prev, newOption]
                                })
                                // Chỉ lưu label và value (số điện thoại) để hiển thị trong input
                                setPhoneSelectValue({
                                  label: trimmed,
                                  value: trimmed
                                })
                                form.setFieldsValue({ phone: trimmed })
                                setCurrentPhone(trimmed)
                                
                                // Số điện thoại mới, reset tất cả nhưng giữ số điện thoại
                                resetCustomerSelection()
                                form.setFieldsValue({ phone: trimmed })
                              } else {
                                // Nếu đã tồn tại, fetch customer data
                                fetchCustomerByPhone(trimmed)
                              }
                            }
                          }
                        }}
                      />
                    </div>
                    <Button
                      type="primary"
                      style={{ 
                        whiteSpace: 'nowrap',
                        height: '40px',
                        borderRadius: '12px',
                        fontWeight: 500,
                        padding: '0 16px',
                        background: '#2563eb',
                        borderColor: '#2563eb',
                        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                      }}
                      loading={customerLookupLoading}
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
                  </div>
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
                        
                        // Chỉ kiểm tra độ dài tối đa
                        if (trimmedValue.length > 50) {
                          return Promise.reject(new Error('Họ tên không được vượt quá 50 ký tự'))
                        }
                        
                        return Promise.resolve()
                      }
                    }
                  ]}
                  // Cho phép nhập khoảng trắng tự do, chỉ kiểm tra ở validator
                  normalize={(value) => value}
                  style={formItemStyle}
                >
                  <Input 
                    style={inputStyle} 
                    placeholder="VD: Đặng Thị Huyền"
                    maxLength={50}
                    showCount
                    disabled={filledFields.name}
                    readOnly={filledFields.name}
                    onInput={(e) => {
                      if (e.target.value.length > 50) {
                        e.target.value = e.target.value.slice(0, 50)
                      }
                    }}
                  />
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
                        if (trimmedValue.length > 100) {
                          return Promise.reject(new Error('Địa chỉ không được vượt quá 100 ký tự'))
                        }
                        
                        // Kiểm tra chỉ chứa chữ, số, dấu phẩy, gạch ngang và khoảng trắng
                        if (!/^[a-zA-Z0-9ÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂưăạảấầẩẫậắằẳẵặẹẻẽềềểỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵýỷỹ\s,/-]*$/.test(trimmedValue)) {
                          return Promise.reject(new Error('Địa chỉ chỉ được chứa chữ, số, dấu phẩy, gạch ngang và khoảng trắng'))
                        }
                        
                        return Promise.resolve()
                      }
                    }
                  ]}
                  // Cho phép khoảng trắng tự do, chỉ kiểm tra bằng validator
                  normalize={(value) => value}
                  style={formItemStyle}
                >
                  <Input 
                    style={inputStyle} 
                    placeholder="VD: Hòa Lạc - Hà Nội"
                    maxLength={100}
                    showCount
                    onInput={(e) => {
                      if (e.target.value.length > 100) {
                        e.target.value = e.target.value.slice(0, 100)
                      }
                    }}
                  />
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
                    {(form.getFieldValue('service') || []).length ? `Đã chọn ${(form.getFieldValue('service') || []).length}` : 'Chưa chọn dịch vụ'}
                  </div>
                </Form.Item>

                <Form.Item 
                  label="Thợ sửa chữa" 
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
                              
                              // Convert value to string (handles both string and object from CreatableSelect)
                              const plateValue = typeof value === 'string' 
                                ? value 
                                : (value?.value || value?.label || String(value))
                              
                              if (!plateValue || typeof plateValue !== 'string') {
                                return Promise.resolve()
                              }
                              
                              const cleanValue = plateValue.replace(/[\s-]/g, '').toUpperCase()
            
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
                        style={formItemStyle}
                      >
                      <CreatableSelect
                        isClearable
                        isMulti={false}
                        placeholder="VD: 30A-12345"
                        options={plateOptions}
                        value={plateSelectValue}
                        styles={singleSelectStyles}
                        classNamePrefix="react-select"
                        menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                        components={{ DropdownIndicator: null }}
                        getOptionValue={(option) => option.value || option.label}
                        getOptionLabel={(option) => {
                          // Chỉ trả về biển số (label) để hiển thị trong input
                          return option.label || option.value || ''
                        }}
                        onInputChange={(inputValue, action) => {
                          console.log('[PlateSelect] onInputChange called with inputValue:', inputValue, 'action:', action)
                          // CHỈ xử lý khi action là 'input-change' (người dùng đang nhập)
                          // Bỏ qua các action khác như 'set-value', 'menu-close' (khi chọn từ dropdown)
                          if (action.action === 'input-change') {
                            const lower = inputValue.toLowerCase()
                            const filtered = plateOptionsSource.filter((opt) =>
                              (opt.value || '').toLowerCase().includes(lower) ||
                              (opt.label || '').toLowerCase().includes(lower)
                            )
                            setPlateOptions(filtered.length ? filtered : [{ label: inputValue, value: inputValue }])
                          
                            if (inputValue && inputValue.trim()) {
                              // Cập nhật form value khi đang nhập
                              const trimmed = inputValue.trim()
                              form.setFieldsValue({ plate: trimmed })
                              // Chỉ lưu label và value (biển số) để hiển thị trong input
                              const plateOnlyOption = {
                                label: trimmed,
                                value: trimmed
                              }
                              console.log('[PlateSelect] onInputChange setting plateSelectValue (typing):', plateOnlyOption)
                              setPlateSelectValue(plateOnlyOption)
                              setPlateOption(plateOnlyOption)
                            } else if (!inputValue) {
                              // Nếu xóa hết biển số xe, chỉ xóa thông tin xe (giữ lại thông tin khách hàng nếu số điện thoại không null)
                              console.log('[PlateSelect] onInputChange - clearing plateSelectValue')
                              form.setFieldsValue({ plate: '' })
                              setPlateSelectValue(null)
                              setPlateOption(null)
                              const currentPhone = form.getFieldValue('phone')
                              if (currentPhone) {
                                resetVehicleInfo()
                              } else {
                                resetCustomerSelection()
                              }
                            }
                          } else {
                            // Bỏ qua các action khác (set-value, menu-close, etc.) - để onChange xử lý
                            console.log('[PlateSelect] onInputChange - Ignoring action:', action.action)
                          }
                        }}
                        onChange={(option) => {
                          console.log('[PlateSelect] onChange called with option:', option)
                          if (!option) {
                            // Nếu xóa biển số xe (click nút x), chỉ xóa thông tin xe (giữ lại thông tin khách hàng nếu số điện thoại không null)
                            setPlateSelectValue(null)
                            setPlateOption(null)
                            form.setFieldsValue({ plate: '' })
                            const currentPhone = form.getFieldValue('phone')
                            if (currentPhone) {
                              resetVehicleInfo()
                            } else {
                              resetCustomerSelection()
                            }
                            return
                          }
                          
                          // Chỉ lưu label và value (biển số) để hiển thị trong input - GIỐNG SỐ ĐIỆN THOẠI
                          const plateOnlyOption = {
                            label: option.label || option.value,
                            value: option.value || option.label
                          }
                          
                          // Set trực tiếp - KHÔNG so sánh, KHÔNG reset
                          setPlateSelectValue(plateOnlyOption)
                          setPlateOption(plateOnlyOption)
                          const selectedValue = option.value || option.label
                          const formattedPlate = selectedValue ? formatLicensePlate(selectedValue) : selectedValue
                          form.setFieldsValue({ plate: formattedPlate })
                          
                          // Kiểm tra xem biển số có trong danh sách không
                          const isKnown = plateOptionsSource.some((opt) => {
                            const optValue = opt.value || opt.label || ''
                            const formattedOpt = formatLicensePlate(optValue)
                            return formattedOpt === formattedPlate
                          })
                          
                          if (isKnown) {
                            // Biển số có trong danh sách, fill thông tin xe
                            const vehicleFromOption = option?.vehicle
                            const vehiclesPool =
                              (Array.isArray(customerVehicles) && customerVehicles.length > 0
                                ? customerVehicles
                                : plateOptionsSource.map((opt) => opt.vehicle).filter(Boolean)) || []
                            
                            if (vehicleFromOption) {
                              const vehicleToPass =
                                vehiclesPool.find((v) => {
                                  const vPlate = v.licensePlate || v.plate || ''
                                  return formatLicensePlate(vPlate) === formattedPlate
                                }) || vehicleFromOption
                              handlePlateSelect(formattedPlate, [vehicleToPass])
                            } else {
                              const vehicleFromPool = vehiclesPool.find((v) => {
                                const vPlate = v?.licensePlate || v?.plate || ''
                                return formatLicensePlate(vPlate) === formattedPlate
                              })
                              if (vehicleFromPool) {
                                handlePlateSelect(formattedPlate, [vehicleFromPool])
                              } else {
                                handlePlateSelect(formattedPlate, customerVehicles)
                              }
                            }
                          } else {
                            // Biển số mới, reset vehicle info nhưng giữ biển số
                            // KHÔNG gọi resetCustomerSelection() vì nó sẽ reset plateSelectValue
                            setIsNewVehicle(true)
                            setSelectedVehicle(null)
                            form.setFieldsValue({
                              brand: undefined,
                              model: undefined,
                              vin: '',
                              year: 2020,
                              plate: formattedPlate
                            })
                            setSelectedBrandId(null)
                            setSelectedModelId(null)
                            setModels([])
                            // Đảm bảo plateSelectValue vẫn được giữ
                            setPlateSelectValue(plateOnlyOption)
                            setPlateOption(plateOnlyOption)
                          }
                        }}
                        onCreateOption={(inputValue) => {
                          const trimmed = inputValue.trim()
                          const formatted = formatLicensePlate(trimmed)
                          const newOption = { 
                            label: formatted, 
                            value: formatted
                          }
                          
                          setPlateOptionsSource((prev) => [...prev, newOption])
                          setPlateOptions((prev) => {
                            const existsInOptions = prev.some((opt) => {
                              const optValue = formatLicensePlate(opt.value || opt.label || '')
                              return optValue === formatted
                            })
                            return existsInOptions ? prev : [...prev, newOption]
                          })
                          
                          // Chỉ lưu label và value (biển số) để hiển thị trong input
                          setPlateSelectValue(newOption)
                          setPlateOption(newOption)
                          form.setFieldsValue({ plate: formatted })
                          
                          // Biển số mới, reset vehicle info nhưng giữ biển số
                          // KHÔNG gọi resetCustomerSelection() vì nó sẽ reset plateSelectValue
                          setIsNewVehicle(true)
                          setSelectedVehicle(null)
                          form.setFieldsValue({
                            brand: undefined,
                            model: undefined,
                            vin: '',
                            year: 2020,
                            plate: formatted
                          })
                          setSelectedBrandId(null)
                          setSelectedModelId(null)
                          setModels([])
                          // Đảm bảo plateSelectValue vẫn được giữ
                          setPlateSelectValue(newOption)
                          setPlateOption(newOption)
                        }}
                        onKeyDown={(e) => {
                          // Khi nhấn Enter, ngăn form submit và giữ giá trị
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            // Lấy giá trị hiện tại từ form
                            const currentPlate = form.getFieldValue('plate')
                            if (currentPlate && currentPlate.trim()) {
                              const trimmed = currentPlate.trim()
                              const formatted = formatLicensePlate(trimmed)
                              const exists = plateOptionsSource.some((opt) => {
                                const optValue = formatLicensePlate(opt.value || opt.label || '')
                                return optValue === formatted
                              })
                              if (!exists) {
                                // Tạo option mới nếu chưa tồn tại
                                const newOption = { 
                                  label: formatted, 
                                  value: formatted
                                }
                                setPlateOptionsSource((prev) => [...prev, newOption])
                                setPlateOptions((prev) => {
                                  const existsInOptions = prev.some((opt) => {
                                    const optValue = formatLicensePlate(opt.value || opt.label || '')
                                    return optValue === formatted
                                  })
                                  return existsInOptions ? prev : [...prev, newOption]
                                })
                                // Chỉ lưu label và value (biển số) để hiển thị trong input
                                setPlateSelectValue(newOption)
                                setPlateOption(newOption)
                                form.setFieldsValue({ plate: formatted })
                                
                                // Biển số mới, reset vehicle info nhưng giữ biển số
                                // KHÔNG gọi resetCustomerSelection() vì nó sẽ reset plateSelectValue
                                setIsNewVehicle(true)
                                setSelectedVehicle(null)
                                form.setFieldsValue({
                                  brand: undefined,
                                  model: undefined,
                                  vin: '',
                                  year: 2020,
                                  plate: formatted
                                })
                                setSelectedBrandId(null)
                                setSelectedModelId(null)
                                setModels([])
                                // Đảm bảo plateSelectValue vẫn được giữ
                                setPlateSelectValue(newOption)
                                setPlateOption(newOption)
                              } else {
                                // Nếu đã tồn tại, tìm và set option đó
                                const existingOption = plateOptionsSource.find((opt) => {
                                  const optValue = formatLicensePlate(opt.value || opt.label || '')
                                  return optValue === formatted
                                })
                                if (existingOption) {
                                  const plateOnlyOption = {
                                    label: existingOption.label || existingOption.value,
                                    value: existingOption.value || existingOption.label
                                  }
                                  setPlateSelectValue(plateOnlyOption)
                                  setPlateOption(plateOnlyOption)
                                  form.setFieldsValue({ plate: formatted })
                                  
                                  // Fill vehicle info nếu có
                                  const vehiclesPool =
                                    (Array.isArray(customerVehicles) && customerVehicles.length > 0
                                      ? customerVehicles
                                      : plateOptionsSource.map((opt) => opt.vehicle).filter(Boolean)) || []
                                  const vehicleFromPool = vehiclesPool.find((v) => {
                                    const vPlate = v?.licensePlate || v?.plate || ''
                                    return formatLicensePlate(vPlate) === formatted
                                  })
                                  if (vehicleFromPool) {
                                    handlePlateSelect(formatted, [vehicleFromPool])
                                  } else {
                                    handlePlateSelect(formatted, customerVehicles)
                                  }
                                }
                              }
                            }
                          }
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
                              if (!value || value.toString().trim() === '') {
                                return Promise.resolve()
                              }
                              
                        const cleanValue = value.toString().replace(/\s/g, '')
                              
                              // Kiểm tra độ dài tối đa
                              if (cleanValue.length > 20) {
                                return Promise.reject(new Error('Số khung không được vượt quá 20 ký tự'))
                              }
                              
                              return Promise.resolve()
                            }
                          }
                        ]}
                        // Giữ khoảng trắng, chỉ chuyển hoa (validator kiểm tra độ dài)
                        normalize={(value) => value?.toUpperCase()}
                        style={formItemStyle}
                      >
                        <Input 
                          style={inputStyle} 
                          placeholder="VD: RL4XW430089206813"
                          maxLength={20}
                          showCount
                          onInput={(e) => {
                            if (e.target.value.length > 20) {
                              e.target.value = e.target.value.slice(0, 20)
                            }
                          }}
                        />
                      </Form.Item>
                    </Col>

                    <Col span={12}>
                      <Form.Item 
                        label="Ghi chú" 
                        name="note"
                        rules={[
                          {
                            validator: (_, value) => {
                              // Không bắt buộc
                              if (!value || value.toString().trim() === '') {
                                return Promise.resolve()
                              }
                              
                              const trimmedValue = value.toString().trim()
                              
                              // Kiểm tra độ dài tối đa
                              if (trimmedValue.length > 200) {
                                return Promise.reject(new Error('Ghi chú không được vượt quá 200 ký tự'))
                              }
                              
                              return Promise.resolve()
                            }
                          }
                        ]}
                      >
                        <TextArea
                          rows={8}
                          style={{ minHeight: 320 }}
                          placeholder="Nhập ghi chú..."
                          maxLength={200}
                          showCount
                          onInput={(e) => {
                            if (e.target.value.length > 200) {
                              e.target.value = e.target.value.slice(0, 200)
                            }
                          }}
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
                const phoneDisplay = displayPhoneFrom84(created.phone || newCustomer.phone)
                const phoneOption = { 
                  label: phoneDisplay, 
                  value: phoneDisplay,
                  fullName: created.fullName || newCustomer.fullName || '',
                  phone: phoneDisplay
                }
                // Thêm vào options source
                setPhoneOptionsSource((prev) => {
                  const exists = prev.some((opt) => opt.value === phoneDisplay)
                  return exists ? prev : [...prev, phoneOption]
                })
                setPhoneOptions((prev) => {
                  const exists = prev.some((opt) => opt.value === phoneDisplay)
                  return exists ? prev : [...prev, phoneOption]
                })
                // Chỉ lưu label và value (số điện thoại) để hiển thị trong input
                setPhoneSelectValue({
                  label: phoneDisplay,
                  value: phoneDisplay
                })
                setPhoneOptionsSource((prev) => {
                  const exists = prev.some((opt) => opt.value === phoneDisplay)
                  return exists ? prev : [...prev, phoneOption]
                })
                setPhoneOptions((prev) => {
                  const exists = prev.some((opt) => opt.value === phoneDisplay)
                  return exists ? prev : [...prev, phoneOption]
                })
                setCurrentPhone(phoneDisplay)
                form.setFieldsValue({
                  phone: phoneDisplay,
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
