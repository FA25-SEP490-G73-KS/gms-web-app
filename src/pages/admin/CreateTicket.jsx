import React, { useState, useEffect, forwardRef, useMemo } from 'react'
import { Form, Input, Button, Card, Row, Col, Space, message, Modal } from 'antd'
import { useLocation, useNavigate } from 'react-router-dom'
import AdminLayout from '../../layouts/AdminLayout'
import { serviceTicketAPI, employeesAPI, vehiclesAPI, customersAPI, serviceTypeAPI, appointmentAPI } from '../../services/api'
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

  // Fetch appointment data từ API và fill form
  useEffect(() => {
    const fetchAndFillAppointmentData = async () => {
      console.log('fetchAndFillAppointmentData - checking conditions:', {
        fromAppointment: appointmentPrefill?.fromAppointment,
        appointmentId: appointmentPrefill?.appointmentId,
        hasAppointmentData: !!appointmentPrefill?.appointmentData,
        appointmentPrefill: appointmentPrefill
      })
      
      // Nếu có appointmentData sẵn từ navigation state, dùng luôn
      if (appointmentPrefill?.fromAppointment && appointmentPrefill?.appointmentData) {
        console.log('Using appointmentData from navigation state:', appointmentPrefill.appointmentData)
        const appointmentData = appointmentPrefill.appointmentData
        
        // Extract và fill form tương tự như khi fetch từ API
        const customer = appointmentData.customer || {}
        const phoneValue = displayPhoneFrom84(customer.phone || appointmentData.customerPhone || '')
        
        const vehicle = appointmentData.vehicle || {}
        const appointmentVehicle = {
          brandId: vehicle.brandId || appointmentData.brandId || null,
          brandName: vehicle.brandName || appointmentData.brandName || '',
          licensePlate: vehicle.licensePlate || appointmentData.licensePlate || '',
          modelId: vehicle.modelId || appointmentData.modelId || null,
          modelName: vehicle.modelName || appointmentData.modelName || '',
          vehicleId: vehicle.vehicleId || appointmentData.vehicleId || null,
          vin: vehicle.vin || appointmentData.vin || '',
          year: vehicle.year || appointmentData.year || 2020
        }

        let serviceTypeIds = appointmentData.serviceTypeIds || []
        let serviceTypes = appointmentData.serviceTypes || appointmentData.serviceTypeList || []
        
        // Nếu không có serviceTypeIds nhưng có serviceType (array of names), cần fetch để lấy IDs
        // Tạm thời để serviceTypeIds rỗng, sẽ được fetch trong useEffect fetchServiceTypes
        console.log('Service types info:', { 
          serviceTypeIds, 
          serviceTypes, 
          serviceType: appointmentData.serviceType,
          serviceTypeNames: appointmentData.serviceType 
        })

        form.setFieldsValue({
          phone: phoneValue,
          name: customer.fullName || customer.name || appointmentData.customerName || '',
          address: customer.address || appointmentData.address || '',
          customerType: customer.customerType || appointmentData.customerType || 'DOANH_NGHIEP',
          plate: appointmentVehicle.licensePlate || '',
          brand: appointmentVehicle.brandId || undefined,
          model: appointmentVehicle.modelId || undefined,
          vin: appointmentVehicle.vin || '',
          year: appointmentVehicle.year || 2020,
          note: appointmentData.note || appointmentData.receiveCondition || '',
          service: serviceTypeIds,
          techs: appointmentData.assignedTechnicianIds || [],
        })

        if (customer.customerId || appointmentData.customerId) {
          setCustomerId(customer.customerId || appointmentData.customerId)
          setCustomerExists(true)
          setCustomerDiscountPolicyId(customer.discountPolicyId || appointmentData.discountPolicyId || 0)
        }

        if (appointmentVehicle.brandId) {
          setSelectedBrandId(appointmentVehicle.brandId)
          await handleBrandChange(appointmentVehicle.brandId)
          setTimeout(() => {
            if (appointmentVehicle.modelId) {
              setSelectedModelId(appointmentVehicle.modelId)
            }
          }, 500)
        }

        if (appointmentData.appointmentDate || appointmentData.expectedDeliveryAt) {
          const dateStr = appointmentData.appointmentDate || appointmentData.expectedDeliveryAt
          const parsedDate = dayjs(dateStr, 'YYYY-MM-DD', true)
          if (!parsedDate.isValid()) {
            const parsedDate2 = dayjs(dateStr, 'DD/MM/YYYY', true)
            if (parsedDate2.isValid()) {
              setSelectedDate(parsedDate2.toDate())
              form.setFieldsValue({ receiveDate: parsedDate2.toDate() })
            }
          } else {
            setSelectedDate(parsedDate.toDate())
            form.setFieldsValue({ receiveDate: parsedDate.toDate() })
          }
        }

        if (phoneValue) {
          setCurrentPhone(phoneValue)
          setPhoneLocked(true)
          fetchCustomerByPhone(phoneValue)
        }

        console.log('Setting appointmentDataFromAPI from navigation state')
        // Đảm bảo set state và sau đó trigger các useEffect khác
        setAppointmentDataFromAPI(appointmentData)
        
        // Nếu có serviceTypes array đầy đủ với IDs, set ngay
        if (serviceTypes && Array.isArray(serviceTypes) && serviceTypes.length > 0 && serviceTypes[0].serviceTypeId) {
          const serviceOptions = serviceTypes.map(item => ({ 
            value: item.serviceTypeId || item.id || item.value, 
            label: item.serviceTypeName || item.name || item.label 
          }))
          setServiceOptions(serviceOptions)
          setTimeout(() => {
            if (serviceTypeIds.length > 0) {
              const matched = serviceOptions.filter(opt => serviceTypeIds.map(String).includes(String(opt.value)))
              console.log('Setting selectedServices from serviceTypes array:', matched)
              if (matched.length > 0) {
                setSelectedServices(matched)
              }
            }
          }, 100)
        }
        // Nếu không có serviceTypes array đầy đủ, useEffect fetchServiceTypes sẽ xử lý
        return
      }
      
      if (appointmentPrefill?.fromAppointment && appointmentPrefill?.appointmentId) {
        try {
          console.log('Fetching appointment data for ID:', appointmentPrefill.appointmentId)
          // Gọi API để lấy thông tin appointment đầy đủ
          const { data: appointmentResponse, error: appointmentError } = await appointmentAPI.getById(appointmentPrefill.appointmentId)
          
          console.log('Appointment API response:', { appointmentResponse, appointmentError })
          
          if (appointmentError || !appointmentResponse || !appointmentResponse.result) {
            console.error('Error fetching appointment:', appointmentError)
            message.error('Không thể lấy thông tin lịch hẹn')
            return
          }

          const appointmentData = appointmentResponse.result || appointmentPrefill.appointmentData
          console.log('Appointment data extracted:', appointmentData)
          
          // Extract customer info
          const customer = appointmentData.customer || {}
          const phoneValue = displayPhoneFrom84(customer.phone || appointmentData.customerPhone || '')
          
          // Extract vehicle info
          const vehicle = appointmentData.vehicle || {}
          const appointmentVehicle = {
            brandId: vehicle.brandId || appointmentData.brandId || null,
            brandName: vehicle.brandName || appointmentData.brandName || '',
            licensePlate: vehicle.licensePlate || appointmentData.licensePlate || '',
            modelId: vehicle.modelId || appointmentData.modelId || null,
            modelName: vehicle.modelName || appointmentData.modelName || '',
            vehicleId: vehicle.vehicleId || appointmentData.vehicleId || null,
            vin: vehicle.vin || appointmentData.vin || '',
            year: vehicle.year || appointmentData.year || 2020
          }

          // Extract service types
          const serviceTypeIds = appointmentData.serviceTypeIds || []
          const serviceTypes = appointmentData.serviceTypes || appointmentData.serviceTypeList || []

          // Fill form values
          form.setFieldsValue({
            phone: phoneValue,
            name: customer.fullName || customer.name || appointmentData.customerName || '',
            address: customer.address || appointmentData.address || '',
            customerType: customer.customerType || appointmentData.customerType || 'DOANH_NGHIEP',
            plate: appointmentVehicle.licensePlate || '',
            brand: appointmentVehicle.brandId || undefined,
            model: appointmentVehicle.modelId || undefined,
            vin: appointmentVehicle.vin || '',
            year: appointmentVehicle.year || 2020,
            note: appointmentData.note || appointmentData.receiveCondition || '',
            service: serviceTypeIds,
            techs: appointmentData.assignedTechnicianIds || [],
          })

          // Set customer state
          if (customer.customerId || appointmentData.customerId) {
            setCustomerId(customer.customerId || appointmentData.customerId)
            setCustomerExists(true)
            setCustomerDiscountPolicyId(customer.discountPolicyId || appointmentData.discountPolicyId || 0)
          }

          // Set vehicle state
          if (appointmentVehicle.brandId) {
            setSelectedBrandId(appointmentVehicle.brandId)
            await handleBrandChange(appointmentVehicle.brandId)
            // Sau khi load models xong, set modelId
            setTimeout(() => {
              if (appointmentVehicle.modelId) {
                setSelectedModelId(appointmentVehicle.modelId)
              }
            }, 500)
          } else if (appointmentVehicle.modelId) {
            setSelectedModelId(appointmentVehicle.modelId)
          }

          // Set date
          if (appointmentData.appointmentDate || appointmentData.expectedDeliveryAt) {
            const dateStr = appointmentData.appointmentDate || appointmentData.expectedDeliveryAt
            const parsedDate = dayjs(dateStr, 'YYYY-MM-DD', true)
            if (!parsedDate.isValid()) {
              const parsedDate2 = dayjs(dateStr, 'DD/MM/YYYY', true)
              if (parsedDate2.isValid()) {
                setSelectedDate(parsedDate2.toDate())
                form.setFieldsValue({ receiveDate: parsedDate2.toDate() })
              }
            } else {
              setSelectedDate(parsedDate.toDate())
              form.setFieldsValue({ receiveDate: parsedDate.toDate() })
            }
          }

          // Fetch customer by phone if phone exists
          if (phoneValue) {
            setCurrentPhone(phoneValue)
            setPhoneLocked(true)
            fetchCustomerByPhone(phoneValue)
          }

          // Lưu appointment data để các useEffect khác sử dụng
          console.log('Setting appointmentDataFromAPI:', appointmentData)
          setAppointmentDataFromAPI(appointmentData)
          
          // Nếu có serviceTypes array đầy đủ, set serviceOptions ngay lập tức và sync selectedServices
          if (serviceTypes && Array.isArray(serviceTypes) && serviceTypes.length > 0) {
            console.log('Found serviceTypes array:', serviceTypes)
            const serviceOptions = serviceTypes.map(item => ({ 
              value: item.serviceTypeId || item.id || item.value, 
              label: item.serviceTypeName || item.name || item.label 
            }))
            console.log('Mapped serviceOptions:', serviceOptions)
            setServiceOptions(serviceOptions)
            // Sync selectedServices ngay sau khi set serviceOptions - dùng setTimeout để đảm bảo state đã được update
            setTimeout(() => {
              if (serviceTypeIds.length > 0) {
                const matched = serviceOptions.filter(opt => serviceTypeIds.map(String).includes(String(opt.value)))
                console.log('Setting selectedServices from serviceTypes array:', { serviceTypeIds, matched, serviceOptions })
                if (matched.length > 0) {
                  setSelectedServices(matched)
                }
              }
            }, 100)
          } else if (serviceTypeIds && Array.isArray(serviceTypeIds) && serviceTypeIds.length > 0) {
            // Nếu chỉ có serviceTypeIds, đảm bảo form values được set để useEffect sync có thể dùng
            console.log('Appointment has serviceTypeIds but no serviceTypes array:', serviceTypeIds)
          } else {
            console.log('No serviceTypes or serviceTypeIds found in appointment data')
          }

        } catch (err) {
          console.error('Error fetching appointment data:', err)
          message.error('Đã xảy ra lỗi khi lấy thông tin lịch hẹn')
        }
      } else {
        console.log('Conditions not met for fetching appointment data')
      }
    }

    fetchAndFillAppointmentData()
  }, [appointmentPrefill])

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

  // State để lưu appointment data từ API
  const [appointmentDataFromAPI, setAppointmentDataFromAPI] = useState(null)

  // Fetch service types - luôn lấy tất cả từ API để hiển thị trong dropdown
  useEffect(() => {
    const fetchServiceTypes = async () => {
      setServiceLoading(true)
      
      // Luôn fetch tất cả service types từ API
      const { data, error } = await serviceTypeAPI.getAll()
      if (error) {
        message.error('Không thể tải danh sách loại dịch vụ')
        setServiceLoading(false)
        return
      }
      const list = data?.result || data || []
      const allServiceOptions = list.map(item => ({ 
        value: item.serviceTypeId || item.id || item.value, 
        label: item.serviceTypeName || item.name || item.label 
      }))
      
      // Set tất cả service types vào dropdown
      setServiceOptions(allServiceOptions)
      
      // Nếu có appointment, pre-select các service types từ appointment
      if (appointmentPrefill?.fromAppointment && appointmentDataFromAPI) {
        let serviceTypeIdsToSelect = []
        
        // Nếu có serviceTypeIds, dùng luôn
        if (appointmentDataFromAPI.serviceTypeIds && Array.isArray(appointmentDataFromAPI.serviceTypeIds) && appointmentDataFromAPI.serviceTypeIds.length > 0) {
          serviceTypeIdsToSelect = appointmentDataFromAPI.serviceTypeIds
        }
        // Nếu không có serviceTypeIds nhưng có serviceType (array of names), match theo tên
        else if (appointmentDataFromAPI.serviceType && Array.isArray(appointmentDataFromAPI.serviceType) && appointmentDataFromAPI.serviceType.length > 0) {
          const serviceTypeNames = appointmentDataFromAPI.serviceType.map(name => String(name).trim().toLowerCase())
          const matchedServices = allServiceOptions.filter(opt => {
            const optLabel = String(opt.label || '').trim().toLowerCase()
            return serviceTypeNames.includes(optLabel)
          })
          serviceTypeIdsToSelect = matchedServices.map(opt => opt.value)
          
          // Update form và appointmentDataFromAPI với serviceTypeIds
          if (serviceTypeIdsToSelect.length > 0) {
            form.setFieldsValue({ service: serviceTypeIdsToSelect })
            setAppointmentDataFromAPI({ ...appointmentDataFromAPI, serviceTypeIds: serviceTypeIdsToSelect })
          }
        }
        // Nếu có serviceTypes array đầy đủ từ API
        else if (appointmentDataFromAPI.serviceTypes && Array.isArray(appointmentDataFromAPI.serviceTypes) && appointmentDataFromAPI.serviceTypes.length > 0) {
          serviceTypeIdsToSelect = appointmentDataFromAPI.serviceTypes
            .map(item => item.serviceTypeId || item.id || item.value)
            .filter(Boolean)
        }
        
        // Sync selectedServices với các service types đã match
        if (serviceTypeIdsToSelect.length > 0) {
          setTimeout(() => {
            const matched = allServiceOptions.filter(opt => serviceTypeIdsToSelect.map(String).includes(String(opt.value)))
            console.log('Pre-selecting service types from appointment:', { serviceTypeIdsToSelect, matched })
            if (matched.length > 0) {
              setSelectedServices(matched)
            }
          }, 100)
        }
      }
      
      setServiceLoading(false)
    }
    fetchServiceTypes()
  }, [appointmentPrefill, appointmentDataFromAPI])

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
    // Lấy giá trị từ form hoặc từ appointmentDataFromAPI nếu có
    const sv = form.getFieldValue('service') || appointmentDataFromAPI?.serviceTypeIds || []
    console.log('Sync selectedServices useEffect:', { 
      sv, 
      serviceOptionsStableLength: serviceOptionsStable.length,
      appointmentDataFromAPI: appointmentDataFromAPI?.serviceTypeIds,
      selectedServicesLength: selectedServices.length
    })
    
    if (Array.isArray(sv) && sv.length > 0 && serviceOptionsStable.length > 0) {
      const matched = serviceOptionsStable.filter(opt => {
        const optValue = String(opt.value)
        const svStrings = sv.map(String)
        return svStrings.includes(optValue)
      })
      console.log('Matched services:', matched)
      if (matched.length > 0) {
        // Chỉ set nếu khác với giá trị hiện tại để tránh loop
        const currentValues = selectedServices.map(s => String(s.value)).sort().join(',')
        const newValues = matched.map(s => String(s.value)).sort().join(',')
        if (currentValues !== newValues) {
          console.log('Setting selectedServices:', matched)
          setSelectedServices(matched)
        }
      } else {
        console.warn('No matched services found. Service IDs:', sv, 'Available options:', serviceOptionsStable.map(o => o.value))
      }
    } else if (Array.isArray(sv) && sv.length === 0 && selectedServices.length > 0) {
      setSelectedServices([])
    }
  }, [serviceOptionsStable, appointmentDataFromAPI, form])

  useEffect(() => {
    const tv = form.getFieldValue('techs') || []
    if (Array.isArray(tv) && tv.length > 0 && techOptionsStable.length > 0) {
      const matched = techOptionsStable.filter(opt => tv.map(String).includes(String(opt.value)))
      if (matched.length > 0) {
        setSelectedTechs(matched)
      }
    } else if (Array.isArray(tv) && tv.length === 0) {
      setSelectedTechs([])
    }
  }, [techOptionsStable, appointmentPrefill, form])

  const handleCreate = async (values) => {
    // same logic as original file, but uses form values which we've synced from react-select
    let expectedDeliveryAt = null
    
    // Try to get date from multiple sources
    const receiveDateValue = values.receiveDate || form.getFieldValue('receiveDate') || selectedDate || appointmentPrefill.expectedDeliveryAt
    
    if (receiveDateValue) {
      if (receiveDateValue instanceof Date) {
        expectedDeliveryAt = dayjs(receiveDateValue).format('YYYY-MM-DD')
      } else if (typeof receiveDateValue === 'string') {
        // Try to parse if it's a string
        const parsed = dayjs(receiveDateValue)
        if (parsed.isValid()) {
          expectedDeliveryAt = parsed.format('YYYY-MM-DD')
        } else {
          expectedDeliveryAt = receiveDateValue
        }
      } else if (receiveDateValue.format) {
        expectedDeliveryAt = receiveDateValue.format('YYYY-MM-DD')
      }
    }

    // Get brand and model IDs from multiple sources
    const finalBrandId = selectedBrandId || values.brand || form.getFieldValue('brand') || appointmentPrefill.vehicle?.brandId || null
    const finalModelId = selectedModelId || values.model || form.getFieldValue('model') || appointmentPrefill.vehicle?.modelId || null
    const selectedBrand = brands.find(b => b.id === Number(finalBrandId))
    const selectedModel = models.find(m => m.id === Number(finalModelId))

    // Get vehicle ID from multiple sources
    const vehicleIdFromPrefill = appointmentPrefill.vehicle?.vehicleId
    const vehicleIdFromAPI = appointmentDataFromAPI?.vehicle?.vehicleId || appointmentDataFromAPI?.vehicleId
    const appointmentVehicleId = vehicleIdFromAPI || vehicleIdFromPrefill
    
    let finalVehicleId = null
    if (appointmentVehicleId !== null && appointmentVehicleId !== undefined && appointmentVehicleId !== '' && String(appointmentVehicleId).trim() !== '') {
      finalVehicleId = Number(appointmentVehicleId)
    }
    
    // Get plate from form (needed for vehicle lookup)
    const plateValue = values.plate || form.getFieldValue('plate') || ''
    const vinValue = values.vin || form.getFieldValue('vin') || ''

    // Get year from form or state
    const yearValue = values.year || form.getFieldValue('year')
    const finalYear = (yearValue !== null && yearValue !== undefined && yearValue !== '' && String(yearValue).trim() !== '')
      ? Number(yearValue)
      : null

    // plate check and try to get vehicleId if not found
    if (plateValue && !finalVehicleId) {
      try {
        // First check plate ownership
        const { data: checkRes, error: checkError } = await vehiclesAPI.checkPlate(plateValue, customerId)
        if (!checkError) {
          const status = checkRes?.result?.status || checkRes?.message
          const owner = checkRes?.result?.owner || checkRes?.result?.customer
          if (status === 'OWNED_BY_OTHER' && owner?.customerId && owner.customerId !== customerId) {
            message.error(`Biển số này đã thuộc khách hàng khác: ${owner.fullName || ''} – ${owner.phone || ''}. Vui lòng kiểm tra lại.`)
            return
          }
          
          // Try to get vehicleId from checkPlate response if available
          const vehicleFromCheck = checkRes?.result?.vehicle || checkRes?.result
          if (vehicleFromCheck?.vehicleId && !finalVehicleId) {
            finalVehicleId = Number(vehicleFromCheck.vehicleId)
          }
        }
        
        // If still no vehicleId, try to get by license plate
        if (!finalVehicleId) {
          try {
            const { data: vehicleRes, error: vehicleError } = await vehiclesAPI.getByLicensePlate(plateValue)
            if (!vehicleError && vehicleRes?.result) {
              const vehicle = Array.isArray(vehicleRes.result) ? vehicleRes.result[0] : vehicleRes.result
              if (vehicle?.vehicleId) {
                finalVehicleId = Number(vehicle.vehicleId)
              }
            }
          } catch (err) {
            console.warn('Get vehicle by plate exception:', err)
          }
        }
      } catch (err) {
        console.warn('Check plate exception:', err)
      }
    }

    const vehiclePayload = {
      brandId: finalBrandId ? Number(finalBrandId) : null,
      brandName: selectedBrand?.name || (finalBrandId ? 'string' : ''),
      licensePlate: plateValue ? String(plateValue).toUpperCase().trim() : '',
      modelId: finalModelId ? Number(finalModelId) : null,
      modelName: selectedModel?.name || (finalModelId ? 'string' : ''),
      vehicleId: finalVehicleId,
      vin: vinValue ? String(vinValue).trim() : null,
      year: finalYear
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
      // Nếu có appointmentId, cập nhật trạng thái appointment thành ARRIVED
      if (appointmentPrefill?.appointmentId) {
        try {
          const { error: statusError } = await appointmentAPI.updateStatus(appointmentPrefill.appointmentId, 'ARRIVED')
          if (statusError) {
            console.error('Update appointment status error:', statusError)
            // Không block việc navigate, chỉ log lỗi
          } else {
            console.log('✓ Appointment status updated to ARRIVED')
          }
        } catch (err) {
          console.error('Error updating appointment status:', err)
          // Không block việc navigate, chỉ log lỗi
        }
      }
      
      message.success('Tạo phiếu dịch vụ thành công')
      navigate(`/service-advisor/orders/${ticketId}`)
    } else {
      message.warning('Tạo phiếu thành công nhưng không có ID')
    }
  }

  const cardTitle = (
    <div style={{ textAlign: 'center' }}>
      <span className="h4" style={{ fontWeight: 600, display: 'block', fontSize: '32px', color: '#CBB081' }}>
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
        <Card title={cardTitle} style={{ borderRadius: '12px', border: 'none' }} bordered={false}>
          <Form form={form} layout="vertical" onFinish={handleCreate}>
            <Row gutter={24} align="stretch">
              <Col span={12}>
                <div style={{ background: '#ffffff', borderRadius: 12, padding: '16px 16px 8px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)', display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <h3 style={{ marginBottom: '12px', fontWeight: 600 }}>Thông tin khách hàng</h3>

                  <Form.Item 
                    label={<span>Số điện thoại <span style={{ color: '#ff4d4f' }}>*</span></span>} 
                    name="phone" 
                    rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }]} 
                    style={formItemStyle}
                    required={false}
                  > 
                    <Input
                      style={inputStyle}
                      placeholder={customerLookupLoading ? 'Đang kiểm tra...' : 'VD: 0123456789'}
                      readOnly
                      disabled
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

                  <Form.Item 
                    label={<span>Họ và tên <span style={{ color: '#ff4d4f' }}>*</span></span>} 
                    name="name" 
                    rules={[
                      {
                        required: true,
                        message: 'Vui lòng nhập họ và tên'
                      },
                      {
                        validator: (_, value) => {
                          // Không cần kiểm tra rỗng vì đã có rule required ở trên
                          if (!value) {
                            return Promise.resolve()
                          }

                          const trimmedValue = value.trim()

                          if (trimmedValue.length > 50) {
                            return Promise.reject(new Error('Họ tên không được vượt quá 50 ký tự'))
                          }

                          return Promise.resolve()
                        }
                      }
                    ]} 
                    style={formItemStyle}
                    required={false}
                  >
                    <Input style={inputStyle} placeholder="VD: Đặng Thị Huyền" maxLength={50} showCount allowClear />
                  </Form.Item>

                  <Form.Item 
                    label="Địa chỉ" 
                    name="address" 
                    rules={[
                      { max: 100, message: 'Địa chỉ không được vượt quá 100 ký tự' }
                    ]} 
                    style={formItemStyle}
                  >
                    <Input style={inputStyle} placeholder="VD: Hòa Lạc - Hà Nội" maxLength={100} showCount />
                  </Form.Item>
                </div>
              </Col>

              <Col span={12}>
                <div style={{ background: '#ffffff', borderRadius: 12, padding: '16px 16px 8px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)', display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <h3 style={{ marginBottom: '12px', fontWeight: 600 }}>Chi tiết dịch vụ</h3>

                  <Form.Item 
                    label={<span>Loại dịch vụ <span style={{ color: '#ff4d4f' }}>*</span></span>} 
                    name="service" 
                    rules={[{ required: true, message: 'Vui lòng chọn ít nhất 1 loại dịch vụ' }]} 
                    style={formItemStyle}
                    required={false}
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
                      {appointmentPrefill?.fromAppointment && selectedServices.length > 0 && (
                        <div style={{ marginTop: 4, fontSize: 12, color: '#6b7280', fontStyle: 'italic' }}>
                          Loại dịch vụ từ lịch hẹn (có thể chỉnh sửa)
                        </div>
                      )}
                      <div style={{ marginTop: 4, fontSize: 12, color: '#6b7280' }}>{ (form.getFieldValue('service') || []).length ? `Đã chọn ${ (form.getFieldValue('service') || []).length }` : 'Chưa chọn dịch vụ' }</div>
                    </div>
                  </Form.Item>

                  <Form.Item label="Thợ sửa chữa" name="techs" style={formItemStyle}>
                    <div>
                      <ReactSelect
                        isMulti
                        options={techOptionsStable}
                        value={selectedTechs}
                        onChange={handleTechChange}
                        styles={multiSelectStyles}
                        placeholder={techLoading ? 'Đang tải...' : 'Chọn thợ sửa chữa'}
                        isDisabled={techLoading || techOptionsStable.length === 0}
                        menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                        classNamePrefix="react-select"
                      />
                      <div style={{ marginTop: 4, fontSize: 12, color: '#6b7280' }}>{ (form.getFieldValue('techs') || []).length ? `Đã chọn ${ (form.getFieldValue('techs') || []).length }` : 'Chưa chọn thợ sửa chữa' }</div>
                    </div>
                  </Form.Item>
{/* 
                  <Form.Item label="Ngày dự đoán nhận xe" name="receiveDate" rules={[{ required: false, message: 'Vui lòng chọn ngày dự đoán nhận xe' }]} style={formItemStyle}>
                    <DatePicker selected={selectedDate} onChange={(date) => { setSelectedDate(date); form.setFieldsValue({ receiveDate: date }) }} dateFormat="dd/MM/yyyy" minDate={new Date()} placeholderText="dd/mm/yyyy" customInput={<DateInput />} popperPlacement="bottom-start" popperModifiers={[{ name: 'offset', options: { offset: [0, 8] } }]} shouldCloseOnSelect withPortal portalId="create-ticket-date-portal" />
                  </Form.Item> */}
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

                      <Form.Item 
                        label={<span>Biển số xe <span style={{ color: '#ff4d4f' }}>*</span></span>} 
                        name="plate" 
                        rules={[{ required: true, message: 'Vui lòng nhập biển số xe' }]} 
                        style={formItemStyle}
                        required={false}
                      >
                        <Input style={inputStyle} placeholder="VD: 30A-12345" readOnly disabled />
                      </Form.Item>

                      <Form.Item 
                        label={<span>Hãng xe <span style={{ color: '#ff4d4f' }}>*</span></span>} 
                        name="brand" 
                        rules={[{ required: true, message: 'Vui lòng chọn hãng xe' }]} 
                        style={formItemStyle}
                        required={false}
                      >
                        <select className="form-control" disabled={brandsLoading} onChange={(e) => { const value = e.target.value ? Number(e.target.value) : undefined; form.setFieldsValue({ brand: value, model: undefined }); setSelectedBrandId(value); setSelectedModelId(null); handleBrandChange(value) }} value={selectedBrandId || ''} style={selectStyle} onFocus={(e) => { e.target.style.borderColor = '#1890ff'; e.target.style.boxShadow = '0 0 0 2px rgba(24, 144, 255, 0.1)'}} onBlur={(e) => { e.target.style.borderColor = '#d9d9d9'; e.target.style.boxShadow = 'none' }}>
                          <option value="" style={{ color: '#bfbfbf' }}>{brandsLoading ? 'Đang tải hãng xe...' : 'Chọn hãng xe'}</option>
                          {brandOptions.map((option) => (<option key={option.value} value={option.value}>{option.label}</option>))}
                        </select>
                      </Form.Item>

                      <Form.Item 
                        label={<span>Loại xe <span style={{ color: '#ff4d4f' }}>*</span></span>} 
                        name="model" 
                        rules={[{ required: true, message: 'Vui lòng chọn mẫu xe' }]} 
                        style={formItemStyle}
                        required={false}
                      >
                        <select className="form-control" disabled={models.length === 0 || modelsLoading} onChange={(e) => { const value = e.target.value ? Number(e.target.value) : undefined; form.setFieldsValue({ model: value }); setSelectedModelId(value) }} value={selectedModelId || ''} style={{ ...selectStyle, backgroundColor: models.length === 0 || modelsLoading ? '#f5f5f5' : '#fff', cursor: models.length === 0 || modelsLoading ? 'not-allowed' : 'pointer', opacity: models.length === 0 || modelsLoading ? 0.6 : 1 }} onFocus={(e) => { if (!(models.length === 0 || modelsLoading)) { e.target.style.borderColor = '#1890ff'; e.target.style.boxShadow = '0 0 0 2px rgba(24, 144, 255, 0.1)' } }} onBlur={(e) => { e.target.style.borderColor = '#d9d9d9'; e.target.style.boxShadow = 'none' }}>
                          <option value="" style={{ color: '#bfbfbf' }}>{modelsLoading ? 'Đang tải loại xe...' : models.length === 0 ? 'Chọn hãng xe trước' : 'Chọn loại xe'}</option>
                          {modelOptions.map((option) => (<option key={option.value} value={option.value}>{option.label}</option>))}
                        </select>
                      </Form.Item>

                      <Form.Item 
                        label="Số khung" 
                        name="vin" 
                        rules={[
                          { 
                            max: 20, 
                            message: 'Số khung không được vượt quá 20 ký tự',
                            validator: (_, value) => {
                              if (!value) return Promise.resolve()
                              if (value.length > 20) {
                                return Promise.reject(new Error('Số khung không được vượt quá 20 ký tự'))
                              }
                              return Promise.resolve()
                            }
                          }
                        ]} 
                        style={formItemStyle}
                      >
                        <Input 
                          style={inputStyle} 
                          placeholder="VD: RL4XW430089206813" 
                          maxLength={20}
                          onInput={(e) => {
                            // Đảm bảo không cho nhập quá 20 ký tự
                            if (e.target.value.length > 20) {
                              e.target.value = e.target.value.slice(0, 20)
                            }
                          }}
                          showCount 
                        />
                      </Form.Item>
                    </Col>

                    <Col span={12}>
                      <Form.Item 
                        label="Ghi chú" 
                        name="note"
                        rules={[
                          { 
                            max: 200, 
                            message: 'Ghi chú không được vượt quá 200 ký tự',
                            validator: (_, value) => {
                              if (!value) return Promise.resolve()
                              if (value.length > 200) {
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
                          onInput={(e) => {
                            // Đảm bảo không cho nhập quá 200 ký tự
                            if (e.target.value.length > 200) {
                              e.target.value = e.target.value.slice(0, 200)
                            }
                          }}
                          showCount 
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

