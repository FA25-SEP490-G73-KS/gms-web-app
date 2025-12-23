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
    const [originalPhone, setOriginalPhone] = useState('') // Số điện thoại ban đầu khi chọn từ dropdown
    const [originalPlate, setOriginalPlate] = useState('') // Biển số xe ban đầu khi chọn từ dropdown
    const [phoneOptionsSource, setPhoneOptionsSource] = useState([])
    const [phoneOptions, setPhoneOptions] = useState([])
    const [phoneSelectValue, setPhoneSelectValue] = useState(null)
    const [phoneInputValue, setPhoneInputValue] = useState('')
    const [filledFields, setFilledFields] = useState({
        name: false,
        address: false,
        phone: false
    })

    const [showCreateCustomerModal, setShowCreateCustomerModal] = useState(false)
    const [newCustomer, setNewCustomer] = useState({ phone: '', fullName: '', address: '' })


    const [plateConflict, setPlateConflict] = useState(null)


    const [customerVehicles, setCustomerVehicles] = useState([])
    const [vehicleOptions, setVehicleOptions] = useState([])
    const [plateOptionsSource, setPlateOptionsSource] = useState([])
    const [plateOptions, setPlateOptions] = useState([])
    const [plateSelectValue, setPlateSelectValue] = useState(null)
    const [plateInputValue, setPlateInputValue] = useState('')
    const [plateOption, setPlateOption] = useState(null)
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


    const watchedPlate = Form.useWatch('plate', form)

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


    const resetVehicleInfo = () => {
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
    }

    const resetCustomerSelection = () => {
        setCustomerId(null)
        setCustomerExists(false)
        setCustomerDiscountPolicyId(0)
        setCustomerVehicles([])
        setVehicleOptions([])
        setPlateOptionsSource([])
        setPlateOptions([])
        setSelectedVehicle(null)
        setOriginalPhone('')
        setOriginalPlate('')

        setFilledFields({
            name: false,
            address: false,
            phone: false
        })
        setIsNewVehicle(true)
        setPlateSelectValue(null)
        setPlateInputValue('')
        setPlateOption(null)

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
        setPhoneSelectValue(null)
        setPhoneInputValue('')
        setCurrentPhone('')
    }


    useEffect(() => {

        if (!watchedPlate || typeof watchedPlate !== 'string' || !watchedPlate.trim()) {
            if (plateSelectValue !== null) {
                setPlateSelectValue(null)
                setPlateInputValue('')
                setPlateOption(null)
            }
            return
        }

        const formatted = formatLicensePlate(watchedPlate.trim())


        const existing = plateOptionsSource.find((opt) => {
            const optValue = opt.value || opt.label || ''
            return formatLicensePlate(optValue) === formatted
        })

        const syncedOption = existing
            ? {
                label: existing.label || existing.value,
                value: existing.value || existing.label
            }
            : { label: formatted, value: formatted }


        if (
            !plateSelectValue ||
            plateSelectValue.value !== syncedOption.value ||
            plateSelectValue.label !== syncedOption.label
        ) {
            setPlateSelectValue(syncedOption)
            // Reset inputValue để react-select hiển thị singleValue thay vì input
            setPlateInputValue('')
            setPlateOption(existing || syncedOption)
        }
    }, [watchedPlate, plateOptionsSource])


    const fetchCustomerVehicles = async (customerId) => {
        if (!customerId) {
            setCustomerVehicles([])
            setVehicleOptions([])
            return
        }

        try {

            const { data, error } = await customersAPI.getById(customerId)
            if (error || !data || !data.result) {
                console.warn('Error fetching customer vehicles:', error)
                return
            }

            const customer = data.result

            const vehicles = customer.vehicles || []
            const licensePlates = customer.licensePlates || []


            const vehicleOptionsList = []

            if (Array.isArray(vehicles) && vehicles.length > 0) {

                vehicles.forEach(vehicle => {
                    const plate = vehicle.licensePlate || vehicle.plate || ''
                    if (plate) {

                        const formattedPlate = formatLicensePlate(plate)
                        vehicleOptionsList.push({
                            value: formattedPlate,
                            label: formattedPlate,
                            vehicle: vehicle
                        })
                    }
                })
            } else if (Array.isArray(licensePlates) && licensePlates.length > 0) {

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
            setPlateOptionsSource(vehicleOptionsList)
            setPlateOptions(vehicleOptionsList)
            setCustomerVehicles(vehicles.length > 0 ? vehicles : licensePlates)
        } catch (err) {
            console.error('Error fetching customer vehicles:', err)
            setVehicleOptions([])
            setCustomerVehicles([])
        }
    }


    const handlePlateSelect = async (plateValue, vehiclesList = []) => {
        if (!plateValue) {
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
            setModels([])
            return
        }

        const formattedPlate = formatLicensePlate(plateValue)
        let existingVehicle = null

        // 1️⃣ tìm trong danh sách xe của khách
        if (Array.isArray(vehiclesList) && vehiclesList.length > 0) {
            existingVehicle = vehiclesList.find(v => {
                const vPlate = v.licensePlate || v.plate || ''
                return formatLicensePlate(vPlate) === formattedPlate
            })
        }

        // 2️⃣ nếu không có thì gọi API
        if (!existingVehicle) {
            try {
                const { data } = await vehiclesAPI.getByLicensePlate(formattedPlate)
                if (data?.result) {
                    existingVehicle = Array.isArray(data.result)
                        ? data.result[0]
                        : data.result
                }
            } catch (err) {
                console.warn('Error fetching vehicle by license plate:', err)
            }
        }

        // 3️⃣ nếu tìm thấy xe
        if (existingVehicle) {
            setIsNewVehicle(false)
            setSelectedVehicle(existingVehicle)

            const vehicle = existingVehicle.vehicle || existingVehicle

            const brandIdRaw =
                vehicle.brandId ||
                vehicle.brand?.id ||
                vehicle.brand?.brandId

            const modelIdRaw =
                vehicle.modelId ||
                vehicle.model?.id ||
                vehicle.model?.vehicleModelId

            const brandId = brandIdRaw ? Number(brandIdRaw) : undefined
            const modelId = modelIdRaw ? Number(modelIdRaw) : undefined

            const vin =
                vehicle.vin ||
                vehicle.chassisNumber ||
                vehicle.frameNumber ||
                ''

            const year = vehicle.year || 2020

            // set VIN + year trước
            form.setFieldsValue({ vin, year })

            // 4️⃣ SET BRAND → LOAD MODELS → SET MODEL
            if (brandId && !isNaN(brandId)) {
                setSelectedBrandId(brandId)
                form.setFieldsValue({ brand: brandId })

                // 🔥 QUAN TRỌNG: chờ models load xong
                await handleBrandChange(brandId)

                // 🔥 SAU KHI models đã có → mới set model
                if (modelId && !isNaN(modelId)) {
                    setSelectedModelId(modelId)
                    form.setFieldsValue({ model: modelId })
                }
            } else {
                // không có brand → reset
                setSelectedBrandId(null)
                setSelectedModelId(null)
                setModels([])

                form.setFieldsValue({
                    brand: undefined,
                    model: undefined
                })
            }

            return
        }

        // 5️⃣ không tìm thấy xe → xe mới
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
        setModels([])
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
            const finalPhoneValue = phoneValue || phone
            setCurrentPhone(finalPhoneValue)

            // Tìm option đầy đủ từ phoneOptionsSource để đảm bảo có đầy đủ thông tin
            const fullOption = phoneOptionsSource.find((opt) => opt.value === finalPhoneValue)
            const phoneOption = fullOption ? {
                label: fullOption.label || finalPhoneValue,
                value: fullOption.value || finalPhoneValue,
                fullName: fullOption.fullName,
                phone: fullOption.phone || finalPhoneValue
            } : {
                label: finalPhoneValue,
                value: finalPhoneValue
            }
            setPhoneSelectValue(phoneOption)
            // Reset inputValue để react-select hiển thị singleValue thay vì input
            setPhoneInputValue('')
            // Reset về toàn bộ danh sách để đảm bảo option đã chọn luôn có trong phoneOptions
            setPhoneOptions(phoneOptionsSource)

            // Lưu số điện thoại ban đầu khi chọn từ dropdown
            setOriginalPhone(finalPhoneValue)

            let vehiclesList = []
            if (fetchedCustomerId) {
                await fetchCustomerVehicles(fetchedCustomerId)
                vehiclesList = customer.vehicles || []
            }

            const customerName = customer.fullName || customer.name
            const customerAddress = customer.address

            setFilledFields({
                name: !!customerName,
                address: !!customerAddress,
                phone: true
            })

            form.setFieldsValue({
                phone: phoneValue || phone,
                name: customerName || form.getFieldValue('name'),
                address: customerAddress || form.getFieldValue('address'),
                customerType: customer.customerType || 'DOANH_NGHIEP'
            })

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
                return {
                    label: phoneLocal,
                    value: phoneLocal,
                    fullName: fullName,
                    phone: phoneLocal
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
            setPhoneInputValue('')
            return
        }
        const normalized = displayPhoneFrom84(value) || value
        // Chỉ tìm trong phoneOptionsSource, không thêm mới
        let opt = phoneOptionsSource.find((o) => o.value === normalized)
        if (!opt) {
            // Nếu không tìm thấy, chỉ tạo option tạm để hiển thị, không thêm vào source
            opt = { label: normalized, value: normalized }
        }
        const phoneOption = {
            label: opt.label || opt.value,
            value: opt.value || opt.label
        }
        setPhoneSelectValue(phoneOption)
        setPhoneInputValue(phoneOption.value)
    }

    useEffect(() => {
        fetchAllCustomers()
    }, [])

    useEffect(() => {
        const brandIdFromForm = form.getFieldValue('brand')
        if (brandIdFromForm && brands.length > 0) {
            const brandIdNum = Number(brandIdFromForm)
            const brandExists = brands.find(b => {
                const bId = b.id || b.brandId
                return bId === brandIdNum || bId === brandIdFromForm || Number(bId) === brandIdNum
            })
            if (brandExists) {
                if (selectedBrandId !== brandIdNum) {
                    console.log('Syncing brandId from form:', brandIdNum, 'Available brands:', brands, 'Found:', brandExists)
                    setSelectedBrandId(brandIdNum)
                }
            } else {
                console.warn('Brand not found in list:', brandIdNum, 'Available brands:', brands)
            }
        } else if (!brandIdFromForm && selectedBrandId) {
            console.log('Clearing selectedBrandId because form has no brandId')
            setSelectedBrandId(null)
        }
    }, [brands, form, selectedBrandId])

    useEffect(() => {
        const modelIdFromForm = form.getFieldValue('model')
        if (modelIdFromForm && models.length > 0) {
            const modelIdNum = Number(modelIdFromForm)
            const modelExists = models.find(m => {
                const mId = m.id || m.vehicleModelId
                return mId === modelIdNum || mId === modelIdFromForm || Number(mId) === modelIdNum
            })
            if (modelExists) {
                if (selectedModelId !== modelIdNum) {
                    console.log('Syncing modelId from form:', modelIdNum, 'Available models:', models, 'Found:', modelExists)
                    setSelectedModelId(modelIdNum)
                }
            } else {
                console.warn('Model not found in list:', modelIdNum, 'Available models:', models)
            }
        } else if (!modelIdFromForm && selectedModelId) {
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
        const currentModelId = form.getFieldValue('model')

        if (!brandId) {
            setModels([])
            setSelectedModelId(null)
            if (!currentModelId) {
                form.setFieldsValue({ model: undefined })
            }
            return
        }

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
        console.log('[CreateTicketNewCustomer] selectedBrandId:', selectedBrandId)
        console.log('[CreateTicketNewCustomer] selectedModelId:', selectedModelId)
        console.log('[CreateTicketNewCustomer] values.brand:', values.brand)
        console.log('[CreateTicketNewCustomer] values.model:', values.model)
        if (!Array.isArray(values.service) || values.service.length === 0) {
            message.warning('Vui lòng chọn ít nhất một loại dịch vụ')
            return
        }

        const normalizedPhone = normalizePhoneTo84(values.phone)
        const phoneValue = displayPhoneFrom84(normalizedPhone) || values.phone

        const plateValueRaw = values.plate
        const plateValue =
            typeof plateValueRaw === 'string'
                ? plateValueRaw
                : plateValueRaw?.value || plateValueRaw?.label || ''
        const plateUpper = plateValue ? plateValue.toString().toUpperCase().trim() : ''
        const formattedPlate = plateUpper ? formatLicensePlate(plateUpper) : plateUpper

        // Kiểm tra nếu số điện thoại hoặc biển số xe khác với ban đầu → tạo mới hoàn toàn
        const phoneChanged = originalPhone && phoneValue !== originalPhone
        const plateChanged = originalPlate && formattedPlate !== originalPlate

        // Nếu số điện thoại hoặc biển số xe thay đổi → reset customerId để tạo mới
        let finalCustomerId = customerId
        if (phoneChanged || plateChanged) {
            finalCustomerId = null
        }

        // Ưu tiên lấy từ form values trước, sau đó mới fallback sang state
        const finalBrandId = (values.brand !== undefined && values.brand !== null && values.brand !== '') 
            ? Number(values.brand) 
            : (selectedBrandId !== null && selectedBrandId !== undefined) 
                ? Number(selectedBrandId) 
                : null
        const finalModelId = (values.model !== undefined && values.model !== null && values.model !== '') 
            ? Number(values.model) 
            : (selectedModelId !== null && selectedModelId !== undefined) 
                ? Number(selectedModelId) 
                : null

        console.log('[CreateTicketNewCustomer] finalBrandId:', finalBrandId)
        console.log('[CreateTicketNewCustomer] finalModelId:', finalModelId)

        const selectedBrand = brands.find(b => b.id === Number(finalBrandId))
        const selectedModel = models.find(m => m.id === Number(finalModelId))
        const vehicleId = selectedVehicle?.vehicleId || selectedVehicle?.id || null

        const payload = {
            appointmentId: null,
            assignedTechnicianIds: (values.techs || []).map((id) => Number(id)),
            customer: {
                customerId: finalCustomerId || null,
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
                licensePlate: formattedPlate || plateUpper,
                modelId: finalModelId ? Number(finalModelId) : null,
                modelName: selectedModel?.name || '',
                vehicleId: vehicleId ? Number(vehicleId) : null,
                vin: values.vin ? String(values.vin).trim() : null,
                year: values.year ? Number(values.year) : 2020
            }
        }

        const plate = formattedPlate || plateUpper || form.getFieldValue('plate')
        if (plate) {
            try {
                const { data: checkRes, error: checkError } = await vehiclesAPI.checkPlate(
                    typeof plate === 'string' ? plate : plate?.value || plate?.label || formattedPlate || plateUpper,
                    finalCustomerId || null
                )
                if (checkError) {
                    console.warn('Check plate (new customer) error:', checkError)
                } else {
                    console.log('Check plate (new customer) response:', checkRes)
                    const status = checkRes?.result?.status || checkRes?.message
                    const owner = checkRes?.result?.owner || checkRes?.result?.customer

                    if (status === 'OWNED_BY_OTHER' && owner?.customerId && owner.customerId !== finalCustomerId) {
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

        if (isNewVehicle && finalCustomerId && plate && finalBrandId && finalModelId) {
            try {
                console.log('Creating new vehicle for customer:', {
                    customerId: finalCustomerId,
                    licensePlate: plate,
                    brandId: finalBrandId,
                    modelId: finalModelId,
                    vin: values.vin,
                    year: values.year
                })
            } catch (err) {
                console.warn('Error creating vehicle:', err)
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
                <Card title={cardTitle} style={{ borderRadius: '12px', border: 'none' }} bordered={false}>
                    <Form
                        form={form}
                        layout="vertical"
                        requiredMark={false}
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
                                        label={<span>Số điện thoại <span style={{ color: '#ff4d4f' }}>*</span></span>}
                                        required
                                        validateStatus={form.getFieldError('phone').length ? 'error' : ''}
                                        help={form.getFieldError('phone')[0]}
                                    >
                                        <CreatableSelect
                                            isClearable
                                            placeholder="VD: 0123456789"
                                            options={phoneOptions}
                                            value={phoneSelectValue}
                                            styles={singleSelectStyles}
                                            components={{ DropdownIndicator: null }}
                                            inputValue={phoneSelectValue && !phoneInputValue ? undefined : phoneInputValue}
                                            onInputChange={(inputValue = '', action) => {
                                                // Chỉ xử lý khi người dùng nhập
                                                if (action.action !== 'input-change') {
                                                    return
                                                }

                                                // Nếu input rỗng → reset tất cả các trường
                                                if (!inputValue || inputValue.trim() === '') {
                                                    setPhoneInputValue('')
                                                    // Nếu đã có giá trị được chọn trước đó, reset tất cả
                                                    if (phoneSelectValue) {
                                                        setPhoneSelectValue(null)
                                                        setOriginalPhone('')
                                                        setCurrentPhone('')
                                                        setCustomerId(null)
                                                        setCustomerExists(false)
                                                        setCustomerDiscountPolicyId(0)
                                                        setCustomerVehicles([])
                                                        setVehicleOptions([])
                                                        setPlateOptionsSource([])
                                                        setPlateOptions([])
                                                        setPlateSelectValue(null)
                                                        setPlateInputValue('')
                                                        setOriginalPlate('')
                                                        setSelectedVehicle(null)
                                                        setIsNewVehicle(true)
                                                        setFilledFields({
                                                            name: false,
                                                            address: false,
                                                            phone: false
                                                        })
                                                        form.setFieldsValue({
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
                                                        setModels([])
                                                    }
                                                    setPhoneOptions(phoneOptionsSource)
                                                    return
                                                }

                                                // Loại bỏ tất cả ký tự không phải số
                                                const numbersOnly = inputValue.replace(/\D/g, '')

                                                // Giới hạn tối đa 10 ký tự
                                                const limitedValue = numbersOnly.slice(0, 10)

                                                // Chỉ cho phép bắt đầu bằng số 0
                                                const finalValue = limitedValue.length > 0 && !limitedValue.startsWith('0')
                                                    ? '0' + limitedValue.slice(1)
                                                    : limitedValue

                                                setPhoneInputValue(finalValue)

                                                // Filter options
                                                const trimmed = finalValue.trim()
                                                const lower = trimmed.toLowerCase()
                                                const filtered = phoneOptionsSource.filter((opt) =>
                                                    (opt.value || '').toLowerCase().includes(lower) ||
                                                    (opt.fullName || '').toLowerCase().includes(lower)
                                                )
                                                setPhoneOptions(filtered)
                                            }}
                                            onMenuClose={() => {
                                                // Reset inputValue khi menu đóng để hiển thị giá trị đã chọn
                                                setPhoneInputValue('')
                                            }}
                                            onBlur={() => {
                                                // Reset inputValue khi blur để hiển thị giá trị đã chọn
                                                if (phoneSelectValue) {
                                                    setPhoneInputValue('')
                                                }
                                            }}

                                            formatOptionLabel={(option, { context }) => {
                                                if (context === 'menu') {
                                                    return (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                            <div style={{ fontSize: 14, fontWeight: 600 }}>
                                                                {option.fullName || option.value}
                                                            </div>
                                                            <div style={{ fontSize: 12, color: '#6b7280' }}>
                                                                {option.phone || option.value}
                                                            </div>
                                                        </div>
                                                    )
                                                }
                                                return <span>{option.value}</span>
                                            }}

                                            onChange={(option) => {
                                                if (!option) {
                                                    // Reset tất cả state liên quan đến customer
                                                    setPhoneSelectValue(null)
                                                    setPhoneInputValue('')
                                                    setOriginalPhone('')
                                                    setCurrentPhone('')
                                                    setCustomerId(null)
                                                    setCustomerExists(false)
                                                    setCustomerDiscountPolicyId(0)
                                                    setCustomerVehicles([])
                                                    setVehicleOptions([])
                                                    setPlateOptionsSource([])
                                                    setPlateOptions([])
                                                    setPlateSelectValue(null)
                                                    setPlateInputValue('')
                                                    setOriginalPlate('')
                                                    setSelectedVehicle(null)
                                                    setIsNewVehicle(true)
                                                    setFilledFields({
                                                        name: false,
                                                        address: false,
                                                        phone: false
                                                    })

                                                    // Reset tất cả các trường form
                                                    form.setFieldsValue({
                                                        phone: '',
                                                        name: '',
                                                        address: '',
                                                        plate: '',
                                                        brand: undefined,
                                                        model: undefined,
                                                        vin: '',
                                                        year: 2020,
                                                        customerType: 'DOANH_NGHIEP'
                                                    })

                                                    // Reset các state liên quan đến xe
                                                    setSelectedBrandId(null)
                                                    setSelectedModelId(null)
                                                    setModels([])

                                                    // Reset về toàn bộ danh sách khi clear
                                                    setPhoneOptions(phoneOptionsSource)
                                                    return
                                                }

                                                const phone = option.value

                                                // Kiểm tra nếu số điện thoại khác với số ban đầu → reset customerId để tạo mới
                                                if (originalPhone && phone !== originalPhone) {
                                                    setCustomerId(null)
                                                    setCustomerExists(false)
                                                    setOriginalPhone('')
                                                }

                                                // Reset về toàn bộ danh sách trước để đảm bảo option đã chọn luôn có trong phoneOptions
                                                setPhoneOptions(phoneOptionsSource)

                                                // Reset inputValue để react-select hiển thị singleValue thay vì input
                                                setPhoneInputValue('')

                                                // Set phoneSelectValue sau cùng để đảm bảo option đã có trong phoneOptions
                                                setPhoneSelectValue(option)

                                                // set phone cho form
                                                form.setFieldsValue({ phone })

                                                // fill dữ liệu có sẵn
                                                if (option.fullName) {
                                                    form.setFieldsValue({
                                                        name: option.fullName,
                                                        address: option.address || ''
                                                    })
                                                }

                                                // Kiểm tra xem số điện thoại có trong danh sách không
                                                const isKnown = phoneOptionsSource.some((opt) => opt.value === phone)
                                                if (isKnown) {
                                                    // Nếu có trong danh sách → gọi API để lấy thông tin customer
                                                    fetchCustomerByPhone(phone)
                                                } else {
                                                    // Nếu không có trong danh sách → reset để tạo mới
                                                    setCustomerId(null)
                                                    setCustomerExists(false)
                                                    setOriginalPhone('')
                                                }
                                            }}
                                            onCreateOption={(inputValue) => {
                                                // Loại bỏ tất cả ký tự không phải số
                                                const numbersOnly = inputValue.replace(/\D/g, '')

                                                // Giới hạn tối đa 10 ký tự
                                                const limitedValue = numbersOnly.slice(0, 10)

                                                // Chỉ cho phép bắt đầu bằng số 0
                                                const finalValue = limitedValue.length > 0 && !limitedValue.startsWith('0')
                                                    ? '0' + limitedValue.slice(1)
                                                    : limitedValue

                                                if (!finalValue || finalValue.length === 0) return

                                                const tempOption = {
                                                    label: finalValue,
                                                    value: finalValue
                                                }

                                                // Reset customerId và originalPhone để tạo customer mới
                                                setCustomerId(null)
                                                setCustomerExists(false)
                                                setOriginalPhone('')

                                                setPhoneSelectValue(tempOption)
                                                setPhoneInputValue('')
                                                form.setFieldsValue({ phone: finalValue })
                                                setCurrentPhone(finalValue)

                                                // Không gọi API khi tự nhập số điện thoại mới → sẽ tạo customer mới
                                            }}
                                        />

                                    </Form.Item>

                                    <Form.Item
                                        name="phone"
                                        hidden
                                        rules={[
                                            { required: true, message: 'Vui lòng nhập số điện thoại' },
                                            {
                                                validator: (_, value) => {
                                                    if (!value || value.toString().trim() === '') {
                                                        return Promise.reject(new Error('Vui lòng nhập số điện thoại'))
                                                    }

                                                    // Loại bỏ tất cả ký tự không phải số
                                                    const cleanValue = value.toString().replace(/\D/g, '')

                                                    // Kiểm tra độ dài
                                                    if (cleanValue.length !== 10) {
                                                        return Promise.reject(
                                                            new Error('Số điện thoại phải có đúng 10 ký tự')
                                                        )
                                                    }

                                                    // Kiểm tra bắt đầu bằng số 0
                                                    if (!cleanValue.startsWith('0')) {
                                                        return Promise.reject(
                                                            new Error('Số điện thoại phải bắt đầu bằng số 0')
                                                        )
                                                    }

                                                    return Promise.resolve()
                                                }
                                            }
                                        ]}
                                    />


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
                                    >
                                        <Input
                                            style={inputStyle}
                                            placeholder="VD: Đặng Thị Huyền"
                                            maxLength={50}
                                            showCount
                                            allowClear
                                        />
                                    </Form.Item>

                                    <Form.Item
                                        label="Địa chỉ"
                                        name="address"
                                        rules={[
                                            {
                                                validator: (_, value) => {
                                                    if (!value || value.trim() === '') {
                                                        return Promise.resolve()
                                                    }

                                                    const trimmedValue = value.trim()

                                                    if (trimmedValue.length > 100) {
                                                        return Promise.reject(new Error('Địa chỉ không được vượt quá 100 ký tự'))
                                                    }

                                                    if (!/^[a-zA-Z0-9ÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂưăạảấầẩẫậắằẳẵặẹẻẽềềểỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵýỷỹ\s,/-]*$/.test(trimmedValue)) {
                                                        return Promise.reject(new Error('Địa chỉ chỉ được chứa chữ, số, dấu phẩy, gạch ngang và khoảng trắng'))
                                                    }

                                                    return Promise.resolve()
                                                }
                                            }
                                        ]}
                                        normalize={(value) => value}
                                        style={formItemStyle}
                                    >
                                        <Input
                                            style={inputStyle}
                                            placeholder="VD: Hòa Lạc - Hà Nội"
                                            maxLength={100}
                                            showCount
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
                                        label={<span>Loại dịch vụ <span style={{ color: '#ff4d4f' }}>*</span></span>}
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
                                        label={<span>Thợ sửa chữa <span style={{ color: '#ff4d4f' }}>*</span></span>}
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
                                                label={<span>Biển số xe <span style={{ color: '#ff4d4f' }}>*</span></span>}
                                                name="plate"
                                                rules={[
                                                    { required: true, message: 'Vui lòng nhập biển số xe' },
                                                    {
                                                        validator: (_, value) => {
                                                            if (!value) return Promise.resolve()

                                                            const plateValue = typeof value === 'string'
                                                                ? value
                                                                : (value?.value || value?.label || String(value))

                                                            if (!plateValue || typeof plateValue !== 'string') {
                                                                return Promise.resolve()
                                                            }

                                                            // Loại bỏ dấu gạch ngang, khoảng trắng, dấu chấm và chuyển thành chữ hoa
                                                            const cleanValue = plateValue.replace(/[\s\-\.]/g, '').toUpperCase()

                                                            // Kiểm tra độ dài tối thiểu và tối đa
                                                            if (cleanValue.length < 5 || cleanValue.length > 10) {
                                                                return Promise.reject(
                                                                    new Error('Biển số xe phải có từ 5 đến 10 ký tự (VD: 30A-12345, 51H-98765)')
                                                                )
                                                            }

                                                            // Các pattern cho biển số xe Việt Nam
                                                            const patterns = [
                                                                // Biển số thường: 2 số + 1 chữ + 4-5 số (VD: 30A12345, 30A1234, 30A123.45)
                                                                /^[0-9]{2}[A-Z]{1}[0-9]{4,5}$/,
                                                                
                                                                // Biển số tạm thời: 2 số + 1 chữ + 3 số (VD: 30A123)
                                                                /^[0-9]{2}[A-Z]{1}[0-9]{3}$/,
                                                                
                                                                // Biển số nước ngoài: 2 chữ + 4-5 số (VD: AB12345, AB1234)
                                                                /^[A-Z]{2}[0-9]{4,5}$/,
                                                                
                                                                // Biển số quân đội: 2 số + NG + 3-4 số (VD: 30NG123, 30NG1234)
                                                                /^[0-9]{2}NG[0-9]{3,4}$/,
                                                                
                                                                // Biển số đặc biệt: 2 số + 1 chữ + NG + 4 số (VD: 30ANG1234)
                                                                /^[0-9]{2}[A-Z]{1}NG[0-9]{4}$/,
                                                                
                                                                // Biển số xe điện: 2 số + E + 4-5 số (VD: 30E12345)
                                                                /^[0-9]{2}E[0-9]{4,5}$/
                                                            ]

                                                            const isValid = patterns.some(pattern => pattern.test(cleanValue))

                                                            if (!isValid) {
                                                                return Promise.reject(
                                                                    new Error('Biển số xe không đúng định dạng. Ví dụ: 30A-12345, 51H-98765, 30A-123.45, AB-12345, 30NG-1234')
                                                                )
                                                            }

                                                            return Promise.resolve()
                                                        }
                                                    }
                                                ]}
                                                style={formItemStyle}
                                            >
                                                <div style={{ width: '100%' }}>
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
                                                            return option.label || option.value || ''
                                                        }}
                                                        formatOptionLabel={(option, { context }) => {
                                                            if (context === 'menu') {
                                                                return (
                                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                                        <div style={{ fontSize: 14, fontWeight: 600 }}>
                                                                            {option.label || option.value}
                                                                        </div>
                                                                    </div>
                                                                )
                                                            }
                                                            return <span>{option.value || option.label}</span>
                                                        }}
                                                        inputValue={plateSelectValue && !plateInputValue ? undefined : plateInputValue}
                                                        onInputChange={(inputValue = '', action) => {
                                                            // Chỉ xử lý khi người dùng nhập
                                                            if (action.action !== 'input-change') {
                                                                return
                                                            }

                                                            setPlateInputValue(inputValue)
                                                            const trimmed = inputValue.trim()
                                                            const lower = trimmed.toLowerCase()
                                                            // Chỉ filter từ danh sách biển số xe có sẵn từ API, không thêm option mới
                                                            const filtered = plateOptionsSource.filter((opt) =>
                                                                (opt.value || '').toLowerCase().includes(lower) ||
                                                                (opt.label || '').toLowerCase().includes(lower)
                                                            )
                                                            setPlateOptions(filtered)
                                                        }}
                                                        onMenuClose={() => {
                                                            // Reset inputValue khi menu đóng để hiển thị giá trị đã chọn
                                                            setPlateInputValue('')
                                                        }}
                                                        onBlur={() => {
                                                            // Reset inputValue khi blur để hiển thị giá trị đã chọn
                                                            if (plateSelectValue) {
                                                                setPlateInputValue('')
                                                            }
                                                        }}
                                                        onChange={(option) => {
                                                            if (!option) {
                                                                setPlateSelectValue(null)
                                                                setPlateInputValue('')
                                                                setOriginalPlate('')
                                                                form.setFieldsValue({ plate: '' })
                                                                resetVehicleInfo()
                                                                // Reset về toàn bộ danh sách khi clear
                                                                setPlateOptions(plateOptionsSource)
                                                                return
                                                            }

                                                            const selectedValue = option.value || option.label
                                                            const formattedPlate = selectedValue ? formatLicensePlate(selectedValue) : selectedValue

                                                            // Kiểm tra nếu biển số xe khác với biển số ban đầu → reset customerId để tạo mới
                                                            if (originalPlate && formattedPlate !== originalPlate) {
                                                                setCustomerId(null)
                                                                setCustomerExists(false)
                                                                setOriginalPlate('')
                                                            }

                                                            // Tìm option đầy đủ từ plateOptionsSource để đảm bảo có đầy đủ thông tin
                                                            const fullOption = plateOptionsSource.find((opt) => {
                                                                const optValue = opt.value || opt.label || ''
                                                                const formattedOpt = formatLicensePlate(optValue)
                                                                return formattedOpt === formattedPlate
                                                            }) || option

                                                            // Reset về toàn bộ danh sách trước để đảm bảo option đã chọn luôn có trong plateOptions
                                                            setPlateOptions(plateOptionsSource)

                                                            // Sử dụng option đầy đủ để set vào plateSelectValue
                                                            const displayOption = {
                                                                label: fullOption.label || fullOption.value || formattedPlate,
                                                                value: fullOption.value || formattedPlate
                                                            }

                                                            // Reset inputValue trước để react-select hiển thị singleValue thay vì input
                                                            setPlateInputValue('')
                                                            // Set plateSelectValue sau cùng để đảm bảo option đã có trong plateOptions
                                                            setPlateSelectValue(displayOption)
                                                            form.setFieldsValue({ plate: formattedPlate })

                                                            const isKnown = plateOptionsSource.some((opt) => {
                                                                const optValue = opt.value || opt.label || ''
                                                                const formattedOpt = formatLicensePlate(optValue)
                                                                return formattedOpt === formattedPlate
                                                            })

                                                            if (isKnown) {
                                                                // Khi chọn từ dropdown, luôn gọi API để lấy thông tin mới nhất
                                                                handlePlateSelect(formattedPlate, [])
                                                                // Lưu biển số xe ban đầu khi chọn từ dropdown
                                                                setOriginalPlate(formattedPlate)
                                                            } else {
                                                                // Nếu không có trong danh sách → reset để tạo mới
                                                                setOriginalPlate('')
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
                                                            }
                                                        }}
                                                        onCreateOption={(inputValue) => {
                                                            const trimmed = inputValue.trim()
                                                            const formatted = formatLicensePlate(trimmed)

                                                            // Reset originalPlate và customerId để tạo mới
                                                            setOriginalPlate('')
                                                            setCustomerId(null)
                                                            setCustomerExists(false)

                                                            // Không thêm vào plateOptionsSource, chỉ set giá trị vào form
                                                            // plateOptionsSource chỉ chứa biển số xe từ API
                                                            const tempOption = {
                                                                label: formatted,
                                                                value: formatted
                                                            }

                                                            setPlateSelectValue(tempOption)
                                                            setPlateInputValue('')
                                                            form.setFieldsValue({ plate: formatted })

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
                                                        }}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                e.preventDefault()
                                                                const trimmed = plateInputValue.trim()
                                                                if (trimmed) {
                                                                    const formatted = formatLicensePlate(trimmed)
                                                                    // Kiểm tra xem biển số có trong danh sách từ API không
                                                                    const existingOption = plateOptionsSource.find((opt) => {
                                                                        const optValue = opt.value || opt.label || ''
                                                                        return formatLicensePlate(optValue) === formatted
                                                                    })
                                                                    if (existingOption) {
                                                                        // Nếu có trong danh sách, chọn option đó và load thông tin xe
                                                                        const plateOnlyOption = {
                                                                            label: existingOption.label || existingOption.value,
                                                                            value: existingOption.value || existingOption.label
                                                                        }
                                                                        setPlateSelectValue(plateOnlyOption)
                                                                        setPlateInputValue(formatted)
                                                                        form.setFieldsValue({ plate: formatted })

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
                                                                    } else {
                                                                        // Nếu không có trong danh sách, chỉ set giá trị, không thêm vào options
                                                                        const tempOption = { label: formatted, value: formatted }
                                                                        setPlateSelectValue(tempOption)
                                                                        setPlateInputValue(formatted)
                                                                        form.setFieldsValue({ plate: formatted })

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
                                                                    }
                                                                }
                                                            }
                                                        }}
                                                    />
                                                </div>

                                            </Form.Item>

                                            <Form.Item
                                                label={<span>Hãng xe <span style={{ color: '#ff4d4f' }}>*</span></span>}
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
                                                label={<span>Loại xe <span style={{ color: '#ff4d4f' }}>*</span></span>}
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
                                                            if (!value || value.toString().trim() === '') {
                                                                return Promise.resolve()
                                                            }

                                                            const cleanValue = value.toString().replace(/\s/g, '')

                                                            if (cleanValue.length > 20) {
                                                                return Promise.reject(new Error('Số khung không được vượt quá 20 ký tự'))
                                                            }

                                                            return Promise.resolve()
                                                        }
                                                    }
                                                ]}
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
                                                            if (!value || value.toString().trim() === '') {
                                                                return Promise.resolve()
                                                            }

                                                            const trimmedValue = value.toString().trim()

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
                                setPhoneOptionsSource((prev) => {
                                    const exists = prev.some((opt) => opt.value === phoneDisplay)
                                    return exists ? prev : [...prev, phoneOption]
                                })
                                setPhoneOptions((prev) => {
                                    const exists = prev.some((opt) => opt.value === phoneDisplay)
                                    return exists ? prev : [...prev, phoneOption]
                                })
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
