import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { 
  Row, Col, Card, Button, Table, Space, 
  DatePicker, Modal, message, Tabs, Calendar 
} from 'antd'
import { PlusOutlined, DeleteOutlined, EditOutlined, ArrowLeftOutlined, CalendarOutlined } from '@ant-design/icons'
import AdminLayout from '../../layouts/AdminLayout'
import { serviceTicketAPI, priceQuotationAPI, znsNotificationsAPI, partsAPI, unitsAPI } from '../../services/api'
import { goldTableHeader } from '../../utils/tableComponents'
import '../../styles/pages/admin/modals/ticketdetail.css'
import dayjs from 'dayjs'
import Select, { components as selectComponents } from 'react-select'
import CreatableSelect from 'react-select/creatable'

const DEFAULT_UNITS = [
  { value: 'Cái', label: 'Cái' },
  { value: 'Giờ', label: 'Giờ' },
  { value: 'Bộ', label: 'Bộ' },
]
const PARTS_PAGE_SIZE = 100

const QUOTATION_STATUS_CONFIG = {
  DRAFT: {
    label: 'Nháp',
    badgeBg: '#f3f4f6',
    badgeColor: '#6b7280',
    canEdit: true
  },
  WAITING_WAREHOUSE_CONFIRM: {
    label: 'Chờ kho duyệt',
    badgeBg: '#fef3c7',
    badgeColor: '#92400e',
    canEdit: false
  },
  WAREHOUSE_CONFIRMED: {
    label: 'Kho đã duyệt',
    badgeBg: '#dcfce7',
    badgeColor: '#15803d',
    canEdit: true
  },
  WAITING_CUSTOMER_CONFIRM: {
    label: 'Chờ khách xác nhận',
    badgeBg: '#e0e7ff',
    badgeColor: '#3730a3',
    canEdit: false
  },
  CUSTOMER_CONFIRMED: {
    label: 'Khách đã xác nhận',
    badgeBg: '#d1fae5',
    badgeColor: '#065f46',
    canEdit: true
  },
  CUSTOMER_REJECTED: {
    label: 'Khách từ chối',
    badgeBg: '#fee2e2',
    badgeColor: '#991b1b',
    canEdit: true
  },
  COMPLETED: {
    label: 'Hoàn thành',
    badgeBg: '#dbeafe',
    badgeColor: '#1e40af',
    canEdit: false
  }
}

export default function TicketDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const isHistoryPage = location.state?.fromHistory || false
  const [loading, setLoading] = useState(false)
  const [ticketData, setTicketData] = useState(null)
  const [activeTab, setActiveTab] = useState('quote')
  const [replaceItems, setReplaceItems] = useState([])
  const [serviceItems, setServiceItems] = useState([])
  const [showDateModal, setShowDateModal] = useState(false)
  const [expectedDate, setExpectedDate] = useState(null)
  const [errors, setErrors] = useState({})
  const [technicians, setTechnicians] = useState([])
  const [selectedTechnician, setSelectedTechnician] = useState(null)
  const [parts, setParts] = useState([])
  const [partsLoading, setPartsLoading] = useState(false)
  const [unitOptions, setUnitOptions] = useState(DEFAULT_UNITS)
  const [partsCache, setPartsCache] = useState({})
  const [isQuoteExpanded, setIsQuoteExpanded] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [createQuoteLoading, setCreateQuoteLoading] = useState(false)
  const [deliveryPickerVisible, setDeliveryPickerVisible] = useState(false)
  const [deliveryPickerValue, setDeliveryPickerValue] = useState(null)
  const [sendToCustomerLoading, setSendToCustomerLoading] = useState(false)

  const quotationStatusRaw = ticketData?.priceQuotation?.status
  const normalizedQuotationStatus = quotationStatusRaw
    ? String(quotationStatusRaw).toUpperCase()
    : 'CREATED'
  const quotationStatusConfig = (() => {
    if (!quotationStatusRaw) {
      return {
        label: '',
        badgeBg: '#e5e7eb',
        badgeColor: '#4b5563',
        canEdit: true
      }
    }
    return (
      QUOTATION_STATUS_CONFIG[normalizedQuotationStatus] || {
        label: quotationStatusRaw,
        badgeBg: '#e5e7eb',
        badgeColor: '#4b5563',
        canEdit: false
      }
    )
  })()

  const inputsDisabled = isHistoryPage || actionLoading || !quotationStatusConfig.canEdit
  const actionButtonLabel =
    quotationStatusConfig.label === 'Kho đã duyệt' ? 'Cập nhật' : 'Lưu'
  const canSendToCustomer = quotationStatusConfig.label === 'Kho đã duyệt'

  const disabledDeliveryDate = (current) => {
    if (!current) return false
    return current < dayjs().startOf('day')
  }

  const menuPortalTarget = typeof document !== 'undefined' ? document.body : null
  const openDeliveryPicker = () => {
    if (inputsDisabled) return
    setDeliveryPickerValue(expectedDate || dayjs())
    setDeliveryPickerVisible(true)
  }

  const closeDeliveryPicker = () => {
    setDeliveryPickerVisible(false)
  }

  const confirmDeliveryPicker = async () => {
    if (!deliveryPickerValue) {
      message.warning('Vui lòng chọn ngày dự đoán giao xe')
      return
    }
    const success = await handleUpdateDeliveryDate(deliveryPickerValue)
    if (success) {
      setDeliveryPickerVisible(false)
    }
  }

  const baseInputStyle = useMemo(() => ({
    width: '100%',
    border: '1px solid #d0d7de',
    borderRadius: '12px',
    padding: '8px 12px',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s',
    height: '40px',
    background: '#fff'
  }), [])

  const selectStyles = useMemo(() => ({
    control: (provided, state) => ({
      ...provided,
      minHeight: '42px',
      borderRadius: '12px',
      borderColor: state.isFocused ? '#3b82f6' : '#d0d7de',
      boxShadow: state.isFocused ? '0 0 0 2px rgba(59,130,246,0.15)' : 'none',
      ':hover': {
        borderColor: '#3b82f6'
      }
    }),
    valueContainer: (provided) => ({
      ...provided,
      padding: '0 12px'
    }),
    menu: (provided) => ({
      ...provided,
      borderRadius: '12px',
      overflow: 'hidden',
      zIndex: 5
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isFocused ? '#f5f5f5' : '#fff',
      color: state.isSelected ? '#111' : '#111',
      fontWeight: state.isSelected ? 600 : 400
    })
  }), [])

  const selectComponentsOverrides = useMemo(() => ({
    IndicatorSeparator: () => null,
    DropdownIndicator: (props) => (
      <selectComponents.DropdownIndicator {...props}>
        <span style={{ fontSize: '12px', color: '#64748b' }}>▾</span>
      </selectComponents.DropdownIndicator>
    )
  }), [])

  const cachePartOption = (value, label) => {
    if (value === undefined || value === null || value === '') return
    setPartsCache(prev => {
      if (prev[value]) return prev
      console.log('[cachePartOption] add cache', value, label)
      return {
        ...prev,
        [value]: {
          value,
          label: label || (typeof value === 'string' ? value : String(value)),
          isFallback: true
        }
      }
    })
  }

  const addCustomPartOption = useCallback((value, label) => {
    if (!value) return
    const normalizedLabel = label || (typeof value === 'string' ? value : String(value))
    setParts(prev => {
      if (prev.some(option => String(option.value) === String(value))) return prev
      return [...prev, { value, label: normalizedLabel, isCustom: true }]
    })
    cachePartOption(value, normalizedLabel)
  }, [cachePartOption])

  const getPartOption = (value) => {
    if (value === undefined || value === null || value === '') return null
    return (
      parts.find(option => String(option.value) === String(value)) ||
      partsCache[value] ||
      null
    )
  }

  const transformQuotationItems = (items = []) => {
    const replacementItems = []
    const serviceItemsResult = []

    items.forEach((item, index) => {
      if (item.itemType === 'PART') {
        replacementItems.push({
          id: item.priceQuotationItemId || `part-${index}-${Date.now()}`,
          priceQuotationItemId: item.priceQuotationItemId || null,
          // Ưu tiên itemName, sau đó tới partName/partCode
          category: item.partId || item.partCode || item.itemName || item.partName || '',
          categoryLabel: item.itemName || item.partName || item.partCode || '',
          quantity: item.quantity ?? 1,
          unit: item.unit || '',
          unitPrice: item.unitPrice || 0,
          total: item.totalPrice || 0
        })
      } else if (item.itemType === 'SERVICE') {
        serviceItemsResult.push({
          id: item.priceQuotationItemId || `service-${index}-${Date.now()}`,
          priceQuotationItemId: item.priceQuotationItemId || null,
          // Backend hiện trả partName cho SERVICE, map sang task qua itemName/partName
          task: item.itemName || item.serviceName || item.partName || item.description || '',
          quantity: item.quantity ?? 1,
          unit: item.unit || '',
          unitPrice: item.unitPrice || 0,
          total: item.totalPrice || 0
        })
      }
    })

    replacementItems.forEach(item => {
      if (item.category) {
        cachePartOption(item.category, item.categoryLabel || item.category)
      }
    })

    return { replacementItems, serviceItemsResult }
  }

  const CustomSelect = (props) => (
    <Select
      classNamePrefix="custom-select"
      menuPortalTarget={menuPortalTarget}
      styles={selectStyles}
      components={selectComponentsOverrides}
      {...props}
    />
  )

  const CustomCreatableSelect = (props) => (
    <CreatableSelect
      classNamePrefix="custom-select"
      menuPortalTarget={menuPortalTarget}
      styles={selectStyles}
      components={selectComponentsOverrides}
      {...props}
    />
  )

  const parseNumericId = (value) => {
    if (typeof value === 'number' && Number.isFinite(value)) return value
    if (typeof value === 'string') {
      const parsed = Number(value)
      if (!Number.isNaN(parsed)) return parsed
    }
    return null
  }

  const normalizePriceQuotation = (quote) => {
    if (!quote) return null
    const numericId = parseNumericId(
      quote.priceQuotationId ??
      quote.id ??
      quote.quotationId
    )

    return {
      ...quote,
      priceQuotationId: numericId
    }
  }

  const getQuotationId = () => {
    return parseNumericId(
      ticketData?.priceQuotation?.priceQuotationId ??
      ticketData?.priceQuotation?.id ??
      ticketData?.priceQuotation?.quotationId
    )
  }

  const buildQuotationItemsPayload = () => {
    const partItems = replaceItems.map(item => ({
      itemName: item.categoryLabel || item.category || '',
      partId: item.category || null,
      priceQuotationItemId: item.priceQuotationItemId || (typeof item.id === 'number' ? null : item.id),
      quantity: Number(item.quantity) || 0,
      totalPrice: Number(item.total) || 0,
      type: 'PART',
      unit: item.unit || '',
      unitPrice: Number(item.unitPrice) || 0
    }))

    const servicePayload = serviceItems.map(item => {
      const unitPrice = Number(item.unitPrice) || 0
      const quantity = 1 
      const totalPrice = unitPrice * quantity

      return {
        itemName: item.task || '',
        partId: null,
        priceQuotationItemId: item.priceQuotationItemId || (typeof item.id === 'number' ? null : item.id),
        quantity,
        totalPrice,
        type: 'SERVICE',
        unit: null,
        unitPrice
      }
    })

    return [...partItems, ...servicePayload]
  }

  const handleInputFocus = (e) => {
    e.target.style.borderColor = '#3b82f6'
    e.target.style.boxShadow = '0 0 0 2px rgba(59,130,246,0.15)'
  }

  const handleInputBlur = (e) => {
    e.target.style.borderColor = '#d0d7de'
    e.target.style.boxShadow = 'none'
  }

  const getDisplayValue = (value) => {
    if (Array.isArray(value)) {
      const normalized = value
        .filter(item => item !== null && item !== undefined)
        .map(item => (typeof item === 'string' ? item.trim() : item))
        .filter(item => item !== '' && item !== undefined && item !== null)
      const joined = normalized.join(', ')
      return joined || 'đang cập nhật'
    }

    if (value === null || value === undefined) {
      return 'đang cập nhật'
    }

    if (typeof value === 'string') {
      return value.trim() === '' ? 'đang cập nhật' : value
    }

    return value
  }

  const formatCurrency = (value) => {
    const amount = Number(value) || 0
    return amount.toLocaleString('vi-VN')
  }

  const normalizeUnitsResponse = (response = {}) => {
    if (Array.isArray(response?.result?.content)) return response.result.content
    if (Array.isArray(response?.result)) return response.result
    if (Array.isArray(response?.content)) return response.content
    if (Array.isArray(response?.data)) return response.data
    if (Array.isArray(response)) return response
    return []
  }

  const fetchUnits = async () => {
    try {
      const { data: response, error } = await unitsAPI.getAll({ page: 0, size: 50 })
      if (error) throw new Error(error)

      const unitList = normalizeUnitsResponse(response)
      const mappedUnits = unitList
        .filter(unit => unit)
        .map(unit => {
          const value = unit.id ?? unit.code ?? unit.name ?? ''
          const label = unit.name ?? unit.label ?? unit.code ?? ''
          return value && label
            ? {
                value: String(value),
                label,
                code: unit.code ? String(unit.code).toLowerCase() : undefined,
                raw: unit
              }
            : null
        })
        .filter(Boolean)

      if (mappedUnits.length > 0) {
        setUnitOptions(mappedUnits)
        return mappedUnits
      }
    } catch (err) {
      console.warn('Unable to fetch units:', err)
    }

    setUnitOptions(DEFAULT_UNITS)
    return DEFAULT_UNITS
  }

  useEffect(() => {
    if (id) {
      fetchTicketDetail()
    }
    fetchAllParts()
    fetchUnits()
  }, [id])


  const normalizePartsResponse = (response = {}) => {
    if (Array.isArray(response?.result?.content)) return response.result.content
    if (Array.isArray(response?.result)) return response.result
    if (Array.isArray(response?.content)) return response.content
    if (Array.isArray(response?.data)) return response.data
    if (Array.isArray(response)) return response
    return []
  }

  const fetchAllParts = async ({ keyword = '' } = {}) => {
    setPartsLoading(true)
    try {
      const aggregatedOptions = []
      let currentPage = 0
      let hasMore = true

      while (hasMore) {
        const { data: response, error } = await partsAPI.getAll({
          page: currentPage,
          size: PARTS_PAGE_SIZE,
          keyword: keyword || undefined
        })
      
      if (error) {
          console.error('[fetchParts] API error:', error)
          throw new Error(error)
        }

        const fetchedParts = normalizePartsResponse(response)
        console.log('[fetchParts] keyword:', keyword, 'page:', currentPage, 'items:', fetchedParts?.length || 0)
      
        const options = fetchedParts
        .filter(part => part && (part.partId || part.id) && (part.name || part.partName))
        .map(part => ({
          value: part.partId || part.id,
          label: part.name || part.partName || '',
            part
        }))
      
        aggregatedOptions.push(...options)

        const isLast =
          response?.result?.last ??
          response?.last ??
          fetchedParts.length < PARTS_PAGE_SIZE

        if (isLast) {
          hasMore = false
        } else {
          currentPage += 1
        }
      }

      setParts(aggregatedOptions)
      const nextCache = {}
      aggregatedOptions.forEach(option => {
        nextCache[option.value] = option
      })
      setPartsCache(nextCache)
      console.log('[fetchParts] total options count:', aggregatedOptions.length)
    } catch (err) {
      console.error('Error fetching parts:', err)
      setParts([])
      setPartsCache({})
    } finally {
      setPartsLoading(false)
    }
  }

  const fetchTicketDetail = async () => {
    setLoading(true)
    const { data: response, error } = await serviceTicketAPI.getById(id)
    setLoading(false)
    
    if (error || !response || !response.result) {
      console.error('Error fetching ticket detail:', error)
      message.error('Không thể tải thông tin phiếu dịch vụ. Vui lòng thử lại.')
      return
    }
    
    if (response && response.result) {
      const data = response.result
      const normalizedData = {
        ...data,
        priceQuotation: normalizePriceQuotation(data.priceQuotation)
      }
      setTicketData(normalizedData)
      
      const deliveryDate = normalizedData.deliveryAt ? dayjs(normalizedData.deliveryAt) : null
      setExpectedDate(deliveryDate)
      
      const vehicle = normalizedData.vehicle || {}
      const vehicleModel = vehicle.vehicleModel || {}
      const brandName = vehicleModel.brandName || vehicle.brand || ''
      const modelName = vehicleModel.modelName || vehicle.model || ''
      
      const techniciansList = Array.isArray(data.technicians) ? data.technicians : []
      const techniciansOptions = techniciansList.map(tech => ({
        value: tech,
        label: tech
      }))
      setTechnicians(techniciansOptions)
      setSelectedTechnician(techniciansList[0] || null)
      
      const serviceTypes = Array.isArray(normalizedData.serviceType) ? normalizedData.serviceType.join(', ') : (normalizedData.serviceType || '')
      
      const quoteStaffName = data.createdBy || ''
      const brandNameFromVehicle = vehicle.brandName || ''
      const modelNameFromVehicle = vehicle.vehicleModelName || modelName
      
      // Load quote items from priceQuotation if available
      if (normalizedData.priceQuotation) {
        if (Array.isArray(normalizedData.priceQuotation.items)) {
          const { replacementItems, serviceItemsResult } = transformQuotationItems(normalizedData.priceQuotation.items)
          setReplaceItems(replacementItems)
          setServiceItems(serviceItemsResult)
      } else {
        setReplaceItems([])
        setServiceItems([])
        }
        setIsQuoteExpanded(true)
      } else {
        setReplaceItems([])
        setServiceItems([])
        setIsQuoteExpanded(false)
      }
    }
  }

  const addReplaceItem = () => {
    setReplaceItems([...replaceItems, { 
      id: Date.now(), 
      priceQuotationItemId: null,
      category: '',
      categoryLabel: '',
      quantity: 1, 
      unit: '',
      unitPrice: 0,
      total: 0
    }])
  }

  const addServiceItem = () => {
    setServiceItems([...serviceItems, { 
      id: Date.now(), 
      priceQuotationItemId: null,
      task: '',
      quantity: 1, 
      unit: '',
      unitPrice: 0,
      total: 0
    }])
  }

  const deleteReplaceItem = (id) => {
    setReplaceItems(replaceItems.filter(item => item.id !== id))
  }

  const deleteServiceItem = (id) => {
    setServiceItems(serviceItems.filter(item => item.id !== id))
  }

  const handleCreateQuote = async () => {
    if (createQuoteLoading || inputsDisabled) return

    const hide = message.loading('Đang tạo báo giá...', 0)
    setCreateQuoteLoading(true)

    try {
      const { data: response, error } = await priceQuotationAPI.create(id)

      if (error) {
        throw new Error(error || 'Tạo báo giá không thành công. Vui lòng thử lại.')
      }

      if (!response || (response.statusCode !== 200 && !response.result)) {
        throw new Error('Tạo báo giá không thành công. Vui lòng thử lại.')
      }

      const quotationResult = response.result || {}
      const { replacementItems, serviceItemsResult } = transformQuotationItems(quotationResult.items || [])

      setReplaceItems(replacementItems)
      setServiceItems(serviceItemsResult)
      setIsQuoteExpanded(true)
      setActiveTab('quote')

      const normalizedQuote = normalizePriceQuotation(quotationResult)
      if (normalizedQuote?.priceQuotationId) {
        setTicketData(prev => (prev ? { ...prev, priceQuotation: normalizedQuote } : prev))
      } else {
        await fetchTicketDetail()
      }

      message.success('Đã tạo báo giá mới')
    } catch (err) {
      console.error('Error creating price quotation:', err)
      message.error(err?.message || 'Đã xảy ra lỗi khi tạo báo giá.')
    } finally {
      hide?.()
      setCreateQuoteLoading(false)
    }
  }

  const handleUpdateDeliveryDate = async (date) => {
    if (!date) {
      message.warning('Vui lòng chọn ngày dự đoán giao xe')
    return false
    }

    try {
      const dateStr = date.format('YYYY-MM-DD')
      const { data: response, error } = await serviceTicketAPI.updateDeliveryAt(id, dateStr)
      
      if (error) {
        message.error(error || 'Cập nhật ngày giao xe không thành công')
      return false
      }

      if (response && (response.statusCode === 200 || response.result)) {
        message.success('Cập nhật ngày giao xe thành công')
        setExpectedDate(date)
        if (ticketData) {
          setTicketData({ ...ticketData, deliveryAt: dateStr })
        }
      return true
      } else {
        message.error('Cập nhật ngày giao xe không thành công')
      return false
      }
    } catch (err) {
      console.error('Error updating delivery date:', err)
      message.error('Đã xảy ra lỗi khi cập nhật ngày giao xe')
    return false
    }
  }

  const updateReplaceItem = (id, updates = {}) => {
    setReplaceItems(prev =>
      prev.map(item => {
        if (item.id !== id) return item
        const updated = { ...item, ...updates }
        if ('quantity' in updates || 'unitPrice' in updates) {
          updated.total = (updated.quantity || 0) * (updated.unitPrice || 0)
        }
        return updated
      })
    )
    Object.keys(updates).forEach(field => {
    if (errors[`replace_${id}_${field}`]) {
        setErrors(prev => ({ ...prev, [`replace_${id}_${field}`]: null }))
    }
    })
  }

  const updateServiceItem = (id, field, value) => {
    setServiceItems(serviceItems.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value }
        if (field === 'quantity' || field === 'unitPrice') {
          updated.total = (updated.quantity || 0) * (updated.unitPrice || 0)
        }
        return updated
      }
      return item
    }))
    // Clear error for this field
    if (errors[`service_${id}_${field}`]) {
      setErrors({ ...errors, [`service_${id}_${field}`]: null })
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    replaceItems.forEach((item, index) => {
      if (!item.category) {
        newErrors[`replace_${item.id}_category`] = 'Trường không được bỏ trống'
      }
      if (!item.unitPrice || item.unitPrice === 0) {
        newErrors[`replace_${item.id}_unitPrice`] = 'Trường không được bỏ trống'
      }
    })
    
    serviceItems.forEach((item) => {
      if (!item.task) {
        newErrors[`service_${item.id}_task`] = 'Trường không được bỏ trống'
      }
      if (!item.unitPrice || item.unitPrice === 0) {
        newErrors[`service_${item.id}_unitPrice`] = 'Trường không được bỏ trống'
      }
    })
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSendQuote = () => {
    if (inputsDisabled) {
      message.warning('Báo giá chưa thể chỉnh sửa ở trạng thái hiện tại.')
      return
    }
    if (actionLoading) return
    if (!validateForm()) {
      message.error('Vui lòng điền đầy đủ thông tin')
      return
    }
    
    if (!expectedDate) {
      setShowDateModal(true)
    } else {
      confirmSendQuote()
    }
  }

  const handleSendToCustomer = async () => {
    if (!ticketData?.priceQuotation?.priceQuotationId) {
      message.error('Không tìm thấy ID báo giá.')
      return
    }
    try {
      setSendToCustomerLoading(true)
      const quotationId = ticketData.priceQuotation.priceQuotationId
      const { error: sendError } = await priceQuotationAPI.sendToCustomer(quotationId)
      if (sendError) {
        throw new Error(sendError)
      }
      const { error: znsError } = await znsNotificationsAPI.sendQuotation(quotationId)
      if (znsError) {
        throw new Error(znsError)
      }
      message.success('Đã gửi báo giá cho khách hàng')
      await fetchTicketDetail()
    } catch (error) {
      console.error('Error sending quotation to customer:', error)
      message.error(error?.message || 'Gửi báo giá thất bại. Vui lòng thử lại.')
    } finally {
      setSendToCustomerLoading(false)
    }
  }

  const confirmSendQuote = async () => {
    if (!expectedDate) {
      message.error('Vui lòng chọn ngày dự đoán giao xe')
      return
    }
    
    if (actionLoading) {
      return
    }
    
    const quotationId = getQuotationId()
    if (!quotationId) {
      message.error('Vui lòng tạo báo giá trước khi lưu')
      return
    }

    const payload = {
      discount: ticketData?.priceQuotation?.discountPercent ?? ticketData?.priceQuotation?.discount ?? 0,
      estimateAmount: grandTotal,
      items: buildQuotationItemsPayload()
    }

    const hide = message.loading('Đang gửi báo giá...', 0)
    setActionLoading(true)
    try {
      const { data: response, error } = await priceQuotationAPI.update(quotationId, payload)
      
      if (error) {
        throw new Error(error || 'Lưu báo giá không thành công. Vui lòng thử lại.')
      }

      if (!response || (response.statusCode !== 200 && !response.result)) {
        throw new Error('Lưu báo giá không thành công. Vui lòng thử lại.')
      }

      message.success('Đã lưu báo giá thành công')
        setShowDateModal(false)
        await fetchTicketDetail()
    } catch (err) {
      console.error('Error sending price quotation:', err)
      message.error(err?.message || 'Đã xảy ra lỗi khi gửi báo giá.')
    } finally {
      hide?.()
      setActionLoading(false)
    }
  }

  const replaceColumns = [
    {
      title: 'STT',
      key: 'index',
      width: 60,
      render: (_, __, index) => String(index + 1).padStart(2, '0')
    },
    {
      title: 'Danh mục',
      key: 'category',
      width: 350,
      render: (_, record) => (
        <div>
          <CustomCreatableSelect
            placeholder="Chọn linh kiện"
            value={
              getPartOption(record.category) ||
              (record.category
                ? {
                    value: record.category,
                    label:
                      record.categoryLabel ||
                      getPartOption(record.category)?.label ||
                      String(record.category)
              }
                : null)
            }
            options={parts}
            isSearchable
            isClearable
            isDisabled={inputsDisabled}
            isLoading={partsLoading}
            noOptionsMessage={() => partsLoading ? 'Đang tải...' : 'Không có linh kiện'}
            onCreateOption={(inputValue) => {
              const trimmed = inputValue?.trim()
              if (!trimmed) return
              addCustomPartOption(trimmed, trimmed)
              updateReplaceItem(record.id, {
                category: trimmed,
                categoryLabel: trimmed,
                unit: '',
                unitPrice: 0
              })
            }}
            onChange={(option) => {
              const value = option?.value || ''
              const selectedPart =
                parts.find(p => String(p.value) === String(value)) ||
                partsCache[value] ||
                null

              if (value) {
                cachePartOption(
                  value,
                  option?.label ||
                    selectedPart?.label ||
                    selectedPart?.part?.name ||
                    ''
                )
              }

              console.log('[SelectPart] option:', option, 'resolved:', selectedPart)

              const updates = {
                category: value,
                categoryLabel:
                  option?.label ||
                  selectedPart?.label ||
                  selectedPart?.part?.name ||
                  '',
              }

              if (selectedPart?.part) {
                const partUnitCode =
                  selectedPart.part.unitCode ||
                  selectedPart.part.unit ||
                  selectedPart.part.unitId
                let matchedUnit = null
                if (partUnitCode) {
                  matchedUnit = unitOptions.find(unit =>
                    String(unit.value).toLowerCase() ===
                      String(partUnitCode).toLowerCase() ||
                    unit.label?.toLowerCase() ===
                      String(partUnitCode).toLowerCase() ||
                    unit.code === String(partUnitCode).toLowerCase()
                  )
                }
                updates.unit = matchedUnit?.value || selectedPart.part.unit || ''
                updates.unitPrice = selectedPart.part.sellingPrice || 0
              } else {
                updates.unit = ''
                updates.unitPrice = 0
              }

              updateReplaceItem(record.id, updates)
            }}
          />
          {errors[`replace_${record.id}_category`] && (
            <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
              {errors[`replace_${record.id}_category`]}
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Số lượng',
      key: 'quantity',
      width: 120,
      render: (_, record) => (
        <input
          type="number"
          min={1}
          value={record.quantity ?? 1}
          onChange={(e) =>
            updateReplaceItem(record.id, {
              quantity: Number(e.target.value) || 1
            })
          }
          style={baseInputStyle}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          disabled={inputsDisabled}
        />
      )
    },
    {
      title: 'Đơn vị',
      key: 'unit',
      width: 120,
      render: (_, record) => (
        <CustomSelect
          placeholder="Đơn vị"
          value={unitOptions.find(option => String(option.value) === String(record.unit)) || null}
          options={unitOptions}
          isClearable
          isDisabled={inputsDisabled}
          onChange={(option) =>
            updateReplaceItem(record.id, { unit: option?.value || '' })
          }
        />
      )
    },
    {
      title: 'Đơn giá (vnd)',
      key: 'unitPrice',
      width: 150,
      render: (_, record) => (
        <div>
          <input
            type="text"
            inputMode="numeric"
            placeholder="Số tiền..."
            value={record.unitPrice ? record.unitPrice.toLocaleString('vi-VN') : ''}
            onChange={(e) => {
              const sanitized = e.target.value.replace(/[^\d]/g, '')
              updateReplaceItem(record.id, {
                unitPrice: sanitized ? parseInt(sanitized, 10) : 0
              })
            }}
            style={{
              ...baseInputStyle,
              borderColor: errors[`replace_${record.id}_unitPrice`] ? '#ef4444' : baseInputStyle.borderColor
            }}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            disabled={inputsDisabled}
          />
          {errors[`replace_${record.id}_unitPrice`] && (
            <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
              {errors[`replace_${record.id}_unitPrice`]}
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Thành tiền (vnd)',
      key: 'total',
      width: 150,
      render: (_, record) => (
        <span>{record.total ? record.total.toLocaleString('vi-VN') : '--'}</span>
      )
    },
    {
      title: '',
      key: 'action',
      width: 80,
      render: (_, record) => (
        <Space>
          {!inputsDisabled && (
            <DeleteOutlined
              style={{ fontSize: '16px', cursor: 'pointer', color: '#ef4444' }}
              onClick={() => deleteReplaceItem(record.id)}
            />
          )}
        </Space>
      )
    }
  ]

  const serviceColumns = [
    {
      title: 'STT',
      key: 'index',
      width: 60,
      render: (_, __, index) => String(index + 1).padStart(2, '0')
    },
    {
      title: 'Công việc',
      key: 'task',
      render: (_, record) => (
        <div>
          <input
            type="text"
            placeholder="Tên công việc..."
            value={record.task}
            onChange={(e) => updateServiceItem(record.id, 'task', e.target.value)}
            style={{
              ...baseInputStyle,
              borderColor: errors[`service_${record.id}_task`] ? '#ef4444' : baseInputStyle.borderColor
            }}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            disabled={inputsDisabled}
          />
          {errors[`service_${record.id}_task`] && (
            <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
              {errors[`service_${record.id}_task`]}
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Đơn giá (vnd)',
      key: 'unitPrice',
      width: 180,
      render: (_, record) => (
        <div>
          <input
            type="text"
            inputMode="numeric"
            placeholder="Số tiền..."
            value={record.unitPrice ? record.unitPrice.toLocaleString('vi-VN') : ''}
            onChange={(e) => {
              const sanitized = e.target.value.replace(/[^\d]/g, '')
              updateServiceItem(record.id, 'unitPrice', sanitized ? parseInt(sanitized, 10) : 0)
            }}
            style={{
              ...baseInputStyle,
              borderColor: errors[`service_${record.id}_unitPrice`] ? '#ef4444' : baseInputStyle.borderColor
            }}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            disabled={inputsDisabled}
          />
          {errors[`service_${record.id}_unitPrice`] && (
            <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
              {errors[`service_${record.id}_unitPrice`]}
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Thành tiền (vnd)',
      key: 'total',
      width: 150,
      render: (_, record) => (
        <span>{record.total ? record.total.toLocaleString('vi-VN') : '--'}</span>
      )
    },
    {
      title: '',
      key: 'action',
      width: 80,
      render: (_, record) => (
        <Space>
          {!inputsDisabled && (
            <DeleteOutlined
              style={{ fontSize: '16px', cursor: 'pointer', color: '#ef4444' }}
              onClick={() => deleteServiceItem(record.id)}
            />
          )}
        </Space>
      )
    }
  ]

  if (!ticketData && !loading) {
    return (
      <AdminLayout>
        <div style={{ padding: '24px', textAlign: 'center' }}>
          <p>Không tìm thấy phiếu dịch vụ</p>
          <Button onClick={() => navigate(isHistoryPage ? '/service-advisor/orders/history' : '/service-advisor/orders')}>Quay lại</Button>
        </div>
      </AdminLayout>
    )
  }

  const technicianDisplay = getDisplayValue(
    selectedTechnician ||
    ticketData?.technicians?.[0] ||
    null
  )

  const serviceTypeValue = Array.isArray(ticketData?.serviceType)
    ? ticketData.serviceType
    : ticketData?.serviceType || null

  const quoteCreator = getDisplayValue(ticketData?.createdBy)
  const createdDate = ticketData?.createdAt
    ? new Date(ticketData.createdAt).toLocaleDateString('vi-VN')
    : null

  const totalReplacement = replaceItems.reduce((sum, item) => sum + (item.total || 0), 0)
  const totalService = serviceItems.reduce((sum, item) => sum + (item.total || 0), 0)
  const grandTotal = totalReplacement + totalService
  const discountPercent =
    ticketData?.priceQuotation?.discountPercent ??
    ticketData?.priceQuotation?.discountRate ??
    0
  const discountAmount = Math.round((grandTotal * discountPercent) / 100)
  const finalAmount = grandTotal - discountAmount

  return (
    <AdminLayout>
      <div style={{ padding: '24px', background: '#ffffff', minHeight: '100vh' }}>
        <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Button 
            type="text" 
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(isHistoryPage ? '/service-advisor/orders/history' : '/service-advisor/orders')}
          />
        </div>

        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>
            {ticketData?.code || `STK-2025-${String(id || 0).padStart(6, '0')}`}
          </h1>
        </div>

        <Row gutter={16} style={{ marginBottom: '24px' }}>
          <Col span={12} style={{ display: 'flex' }}>
            <Card style={{ borderRadius: '12px', background: '#fafafa', width: '100%', height: '100%' }}>
              <div style={{ marginBottom: '12px' }}>
                <strong>Tên khách hàng:</strong>{' '}
                <span>{getDisplayValue(ticketData?.customer?.fullName)}</span>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <strong>Số điện thoại:</strong>{' '}
                <span>{getDisplayValue(ticketData?.customer?.phone)}</span>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <strong>Loại xe:</strong>{' '}
                <span>
                  {getDisplayValue(
                    ticketData?.vehicle?.vehicleModelName ||
                    ticketData?.vehicle?.vehicleModel?.modelName ||
                    ticketData?.vehicle?.model ||
                    ticketData?.vehicle?.brandName ||
                    ticketData?.vehicle?.vehicleModel?.brandName
                  )}
                </span>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <strong>Biển số xe:</strong>{' '}
                <span>{getDisplayValue(ticketData?.vehicle?.licensePlate)}</span>
              </div>
              <div>
                <strong>Số khung:</strong>{' '}
                <span>{getDisplayValue(ticketData?.vehicle?.vin)}</span>
              </div>
            </Card>
          </Col>
          <Col span={12} style={{ display: 'flex' }}>
            <Card style={{ borderRadius: '12px', background: '#fafafa', width: '100%', height: '100%' }}>
              <div style={{ marginBottom: '12px' }}>
                <strong>Nhân viên lập báo giá:</strong>{' '}
                <span>{quoteCreator}</span>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <strong>Ngày tạo báo giá:</strong>{' '}
                <span>{getDisplayValue(createdDate)}</span>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <strong>Kỹ thuật viên sửa chữa:</strong>{' '}
                <span>{technicianDisplay}</span>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <strong>Loại dịch vụ:</strong>{' '}
                <span>{getDisplayValue(serviceTypeValue)}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <strong>Ngày dự đoán giao xe:</strong>
                <div
                  onClick={openDeliveryPicker}
                  style={{
                    border: '1px solid #d0d7de',
                    borderRadius: '10px',
                    padding: '6px 12px',
                    minWidth: '160px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                    cursor: inputsDisabled ? 'not-allowed' : 'pointer',
                    background: '#fff',
                    opacity: inputsDisabled ? 0.6 : 1
                  }}
                >
                  <span style={{ color: expectedDate ? '#111' : '#9ca3af', fontWeight: 500 }}>
                    {expectedDate ? expectedDate.format('DD/MM/YYYY') : 'Chọn ngày'}
                  </span>
                  <CalendarOutlined style={{ color: '#6b7280' }} />
                </div>
              </div>
            </Card>
          </Col>
        </Row>

        <Card style={{ borderRadius: '12px' }}>
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>BÁO GIÁ</h2>
                {ticketData?.priceQuotation?.status && (
                  <span
                    style={{
                      padding: '4px 10px',
                      borderRadius: '999px',
                      fontSize: '12px',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      backgroundColor: quotationStatusConfig.badgeBg,
                      color: quotationStatusConfig.badgeColor
                    }}
                  >
                    {quotationStatusConfig.label}
                  </span>
                )}
            </div>
          </div>
          </div>
          {!isQuoteExpanded ? (
            <div style={{ padding: '24px 0', textAlign: 'left' }}>
              <Button
                type="primary"
                ghost
                icon={<PlusOutlined />}
                onClick={handleCreateQuote}
                loading={createQuoteLoading}
                disabled={inputsDisabled}
                style={{ borderColor: '#111', color: '#111', fontWeight: 600 }}
              >
                Tạo báo giá
              </Button>
            </div>
          ) : (
                  <>
                    <div style={{ marginBottom: '24px' }}>
              <strong style={{ display: 'block', marginBottom: '12px' }}>Thay thế</strong>
              <Table
                columns={replaceColumns}
                dataSource={replaceItems.map((item, index) => ({ ...item, key: item.id, index }))}
                pagination={false}
                size="small"
                components={goldTableHeader}
                footer={() =>
                  !isHistoryPage && !inputsDisabled && (
                    <div style={{ display: 'flex', alignItems: 'center', paddingLeft: '8px' }}>
                          <Button 
                            type="text" 
                            icon={<PlusOutlined />}
                            onClick={addReplaceItem}
                            style={{ 
                              width: '32px', 
                              height: '32px', 
                              borderRadius: '50%', 
                              border: '1px solid #222',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                        disabled={inputsDisabled}
                          />
                      </div>
                  )
                }
                       />
                    </div>

                    <div>
              <strong style={{ display: 'block', marginBottom: '12px' }}>Dịch vụ</strong>
              <Table
                columns={serviceColumns}
                dataSource={serviceItems.map((item, index) => ({ ...item, key: item.id, index }))}
                pagination={false}
                size="small"
                components={goldTableHeader}
                footer={() =>
                  !isHistoryPage && !inputsDisabled && (
                    <div style={{ display: 'flex', alignItems: 'center', paddingLeft: '8px' }}>
                          <Button 
                            type="text" 
                            icon={<PlusOutlined />}
                            onClick={addServiceItem}
                            style={{ 
                              width: '32px', 
                              height: '32px', 
                              borderRadius: '50%', 
                              border: '1px solid #222',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                        disabled={inputsDisabled}
                          />
                      </div>
                  )
                }
                       />
                    </div>

            <div
              style={{
                marginTop: '32px',
                borderTop: '1px solid #edecec',
                paddingTop: '24px',
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                gap: '16px',
                alignItems: 'center'
              }}
            >
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '32px' }}>
                <div>
                  <div style={{ color: '#6b7280', fontSize: '12px', textTransform: 'uppercase' }}>Tổng cộng</div>
                  <div style={{ fontSize: '20px', fontWeight: 700 }}>{formatCurrency(grandTotal)} đ</div>
                        </div>
                <div>
                  <div style={{ color: '#6b7280', fontSize: '12px', textTransform: 'uppercase' }}>Giảm giá</div>
                  <div style={{ fontSize: '16px', fontWeight: 600 }}>
                    {discountPercent ? `${discountPercent}%` : '0%'}{' '}
                    {discountAmount > 0 && (
                      <span style={{ color: '#6b7280', fontWeight: 400 }}>
                        ({formatCurrency(discountAmount)} đ)
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#6b7280', fontSize: '12px', textTransform: 'uppercase' }}>Thanh toán cuối cùng</div>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: '#ef4444' }}>
                    {formatCurrency(finalAmount)} đ
                  </div>
                </div>
              </div>
              {!isHistoryPage ? (
                <Space size="middle">
                          <Button 
                            onClick={handleSendQuote}
                    disabled={
                      actionLoading ||
                      inputsDisabled ||
                      (replaceItems.length === 0 && serviceItems.length === 0)
                    }
                    loading={actionLoading}
                    style={{
                      background: '#22c55e',
                      borderColor: '#22c55e',
                      color: '#fff',
                      fontWeight: 600,
                      padding: '0 24px',
                      height: '40px'
                    }}
                          >
                    {actionButtonLabel}
                          </Button>
                  {canSendToCustomer && (
                    <Button
                      onClick={handleSendToCustomer}
                      loading={sendToCustomerLoading}
                      disabled={sendToCustomerLoading}
                      style={{
                        background: '#2563eb',
                        borderColor: '#2563eb',
                        color: '#fff',
                        fontWeight: 600,
                        padding: '0 24px',
                        height: '40px'
                      }}
                    >
                      Gửi báo giá
                    </Button>
                  )}
                        </Space>
              ) : (
                <div style={{ color: '#6b7280', fontSize: '12px' }}>
                  {ticketData?.priceQuotation
                    ? 'Trong quá trình chờ kho và khách duyệt không thể cập nhật báo giá'
                    : 'Báo giá đang ở chế độ chỉ xem'}
                      </div>
                    )}
            </div>
                  </>
          )}
        </Card>
                  </div>

      <Modal
        title="Chọn ngày dự đoán giao xe"
        open={deliveryPickerVisible}
        onCancel={closeDeliveryPicker}
        footer={[
          <Button key="cancel" onClick={closeDeliveryPicker}>Hủy</Button>,
          <Button key="ok" type="primary" onClick={confirmDeliveryPicker}>
            Cập nhật
          </Button>
        ]}
        destroyOnClose
      >
        <Calendar
          fullscreen={false}
          value={deliveryPickerValue || expectedDate || dayjs()}
          onSelect={(date) => setDeliveryPickerValue(date)}
          disabledDate={disabledDeliveryDate}
          />
      </Modal>

      <Modal
        title="Ngày dự đoán nhận xe"
        open={showDateModal}
        onCancel={() => setShowDateModal(false)}
        footer={null}
        width={400}
      >
        <div style={{ marginBottom: '16px' }}>
          <DatePicker
            placeholder="Ngày"
            format="DD/MM/YYYY"
            suffixIcon={<CalendarOutlined />}
            value={expectedDate}
            onChange={setExpectedDate}
            style={{ width: '100%' }}
            disabledDate={disabledDeliveryDate}
            allowClear={false}
          />
        </div>
        <Button
          type="primary"
          block
          onClick={confirmSendQuote}
          style={{ background: '#22c55e', borderColor: '#22c55e', height: '40px' }}
        >
          Gửi báo giá
        </Button>
        <div style={{ marginTop: '12px', fontSize: '12px', color: '#666', textAlign: 'center' }}>
          Báo giá sẽ được gửi cho khách hàng qua Zalo
        </div>
      </Modal>
    </AdminLayout>
  )
}

