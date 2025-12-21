import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { 
  Row, Col, Card, Button, Table, Space, 
  DatePicker, Modal, message, Tabs, Calendar, Input, Popconfirm
} from 'antd'
import { PlusOutlined, DeleteOutlined, EditOutlined, CalendarOutlined, CloseOutlined, FilePdfOutlined, FileTextOutlined } from '@ant-design/icons'
import AdminLayout from '../../layouts/AdminLayout'
import { serviceTicketAPI, priceQuotationAPI, znsNotificationsAPI, partsAPI, unitsAPI, invoiceAPI, employeesAPI, serviceTypeAPI } from '../../services/api'
import { goldTableHeader } from '../../utils/tableComponents'
import '../../styles/pages/admin/modals/ticketdetail.css'
import dayjs from 'dayjs'
import Select, { components as selectComponents } from 'react-select'
import CreatableSelect from 'react-select/creatable'
import ReactSelect from 'react-select'

const DEFAULT_UNITS = [
  { value: 'Cái', label: 'Cái' },
  { value: 'Giờ', label: 'Giờ' },
  { value: 'Bộ', label: 'Bộ' },
]
const PARTS_PAGE_SIZE = 100

export const STATUS_COLORS = {
  // Service Ticket
  CREATED: '#9CA3AF',
  QUOTING: '#3B82F6',
  QUOTE_CONFIRMED: '#22C55E',
  UNDER_REPAIR: '#F97316',
  WAITING_FOR_DELIVERY: '#1677ff',
  COMPLETED: '#16A34A',
  CANCELED: '#EF4444',
  // Quotation
  DRAFT: '#9CA3AF',
  WAITING_WAREHOUSE_CONFIRM: '#FACC15',
  WAREHOUSE_CONFIRMED: '#06B6D4',
  WAITING_CUSTOMER_CONFIRM: '#FB923C',
  CUSTOMER_CONFIRMED: '#22C55E',
  CUSTOMER_REJECTED: '#EF4444'
}

const getInventoryStatusConfig = (status) => {
  const normalized = (status || '').toString().trim().toLowerCase()
  if (!normalized) {
    return { color: '#9ca3af', text: 'Không rõ' }
  }
  if (normalized.includes('có sẵn') || normalized.includes('available')) {
    return { color: '#16a34a', text: 'Có sẵn' }
  }
  if (normalized.includes('hết') || normalized.includes('out')) {
    return { color: '#ef4444', text: 'Hết hàng' }
  }
  return { color: '#9ca3af', text: status }
}

const QUOTATION_STATUS_CONFIG = {
  DRAFT: {
    label: 'Nháp',
    badgeBg: STATUS_COLORS.DRAFT,
    badgeColor: '#ffffff',
    canEdit: true
  },
  WAITING_WAREHOUSE_CONFIRM: {
    label: 'Chờ kho xác nhận',
    badgeBg: STATUS_COLORS.WAITING_WAREHOUSE_CONFIRM,
    badgeColor: '#ffffff',
    canEdit: false
  },
  WAREHOUSE_CONFIRMED: {
    label: 'Kho đã xác nhận',
    badgeBg: STATUS_COLORS.WAREHOUSE_CONFIRMED,
    badgeColor: '#ffffff',
    canEdit: true
  },
  WAITING_CUSTOMER_CONFIRM: {
    label: 'Chờ khách hàng xác nhận',
    badgeBg: STATUS_COLORS.WAITING_CUSTOMER_CONFIRM,
    badgeColor: '#ffffff',
    canEdit: false
  },
  CUSTOMER_CONFIRMED: {
    label: 'Khách hàng đã xác nhận',
    badgeBg: STATUS_COLORS.CUSTOMER_CONFIRMED,
    badgeColor: '#ffffff',
    canEdit: true
  },
  CUSTOMER_REJECTED: {
    label: 'Khách hàng từ chối',
    badgeBg: STATUS_COLORS.CUSTOMER_REJECTED,
    badgeColor: '#ffffff',
    canEdit: true
  },
  COMPLETED: {
    label: 'Hoàn thành',
    badgeBg: STATUS_COLORS.COMPLETED,
    badgeColor: '#ffffff',
    canEdit: false
  }
}

const getTicketStatusConfig = (rawStatus) => {
  if (!rawStatus) {
    return {
      key: null,
      label: '',
      bg: '#e5e7eb',
      color: '#4b5563'
    }
  }

  const SERVICE_TICKET_LABELS = {
    CREATED: 'Đã tạo',
    QUOTING: 'Đang báo giá',
    QUOTE_CONFIRMED: 'Khách đã xác nhận báo giá',
    UNDER_REPAIR: 'Đang sửa chữa',
    WAITING_FOR_DELIVERY: 'Chờ bàn giao xe',
    COMPLETED: 'Hoàn thành',
    CANCELED: 'Hủy'
  }

  const normalizeKey = (status) => {
    const upper = String(status).trim().toUpperCase()
    if (STATUS_COLORS[upper]) return upper

    switch (upper) {
      case 'ĐÃ TẠO':
        return 'CREATED'
      case 'ĐANG BÁO GIÁ':
        return 'QUOTING'
      case 'KHÁCH ĐÃ XÁC NHẬN BÁO GIÁ':
        return 'QUOTE_CONFIRMED'
      case 'ĐANG SỬA CHỮA':
        return 'UNDER_REPAIR'
      case 'CHỜ BÀN GIAO XE':
        return 'WAITING_FOR_DELIVERY'
      case 'HOÀN THÀNH':
        return 'COMPLETED'
      case 'HỦY':
        return 'CANCELED'
      default:
        return upper
    }
  }

  const key = normalizeKey(rawStatus)
  const bg = STATUS_COLORS[key] || '#e5e7eb'
  const label = SERVICE_TICKET_LABELS[key] || rawStatus

  return {
    key,
    label,
    bg,
    color: '#fff'
  }
}

const normalizeQuotationStatusKey = (raw) => {
  if (!raw) return null
  const upper = String(raw).trim().toUpperCase()
  if (STATUS_COLORS[upper]) return upper

  switch (upper) {
    case 'NHÁP':
      return 'DRAFT'
    case 'CHỜ KHO XÁC NHẬN':
      return 'WAITING_WAREHOUSE_CONFIRM'
    case 'KHO ĐÃ XÁC NHẬN':
      return 'WAREHOUSE_CONFIRMED'
    case 'CHỜ KHÁCH HÀNG XÁC NHẬN':
      return 'WAITING_CUSTOMER_CONFIRM'
    case 'KHÁCH HÀNG ĐÃ XÁC NHẬN':
      return 'CUSTOMER_CONFIRMED'
    case 'KHÁCH HÀNG TỪ CHỐI':
      return 'CUSTOMER_REJECTED'
    case 'HOÀN THÀNH':
      return 'COMPLETED'
    default:
      return upper
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
  const [startRepairLoading, setStartRepairLoading] = useState(false)
  const [noteModalOpen, setNoteModalOpen] = useState(false)
  const [noteModalContent, setNoteModalContent] = useState('')
  const [exportPDFLoading, setExportPDFLoading] = useState(false)
  const [handoverLoading, setHandoverLoading] = useState(false)
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [isEditMode, setIsEditMode] = useState(false)
  const [techOptions, setTechOptions] = useState([])
  const [techLoading, setTechLoading] = useState(false)
  const [serviceOptions, setServiceOptions] = useState([])
  const [serviceLoading, setServiceLoading] = useState(false)
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

  const techOptionsStable = useMemo(() => techOptions, [techOptions])
  const serviceOptionsStable = useMemo(() => serviceOptions, [serviceOptions])

  const handleServiceChange = (selected) => {
    const arr = selected || []
    setSelectedServices(arr)
  }

  const handleTechChange = (selected) => {
    const arr = selected || []
    setSelectedTechs(arr)
  }

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

  const ticketStatusNormalized = (ticketData?.status || '').toString().toUpperCase()
  const isTicketCancelled =
    ticketStatusNormalized === 'CANCELED' ||
    ticketStatusNormalized === 'CANCELLED' ||
    ticketStatusNormalized === 'HỦY' ||
    ticketStatusNormalized.includes('HỦY')

  const isWaitingWarehouse = normalizedQuotationStatus === 'WAITING_WAREHOUSE_CONFIRM'
  const isWaitingCustomerConfirm = normalizedQuotationStatus === 'WAITING_CUSTOMER_CONFIRM'
  const isWarehouseConfirmed = normalizedQuotationStatus === 'WAREHOUSE_CONFIRMED'
  const isCustomerConfirmed = normalizedQuotationStatus === 'CUSTOMER_CONFIRMED'
  const isCustomerRejected = normalizedQuotationStatus === 'CUSTOMER_REJECTED'
  
  // Kiểm tra xem có item nào bị từ chối không
  const hasRejectedItem = replaceItems.some(item => {
    const reviewStatus = (item.warehouseReviewStatus || '').toString()
    const normalizedStatus = reviewStatus.toUpperCase().trim()
    // Kiểm tra nhiều cách viết "Từ chối"
    return normalizedStatus === 'TỪ CHỐI' || 
           normalizedStatus === 'REJECTED' ||
           normalizedStatus.includes('TỪ CHỐI') ||
           normalizedStatus.includes('REJECTED')
  })
  
  // Debug log để kiểm tra
  if (isWaitingWarehouse) {
    console.log('isWaitingWarehouse:', isWaitingWarehouse)
    console.log('replaceItems:', replaceItems)
    console.log('hasRejectedItem:', hasRejectedItem)
    replaceItems.forEach((item, index) => {
      console.log(`Item ${index} warehouseReviewStatus:`, item.warehouseReviewStatus)
    })
  }
  
  const inputsDisabled = isHistoryPage || actionLoading || isTicketCancelled ||
    (isWaitingWarehouse
      ? true
      : (isWarehouseConfirmed || isCustomerConfirmed || isWaitingCustomerConfirm)
        ? !isEditMode
        : !quotationStatusConfig.canEdit)
  
  const ticketStatusKey = getTicketStatusConfig(ticketData?.status).key
  
  const actionButtonLabel = ticketStatusKey === 'WAITING_FOR_DELIVERY'
    ? 'Hoàn thành'
    : (isCustomerRejected && ticketStatusKey === 'QUOTING')
      ? 'Cập nhật'
      : (isWaitingWarehouse 
        ? 'Cập nhật' 
        : ((isWarehouseConfirmed || isCustomerConfirmed || isWaitingCustomerConfirm)
            ? (isEditMode ? 'Lưu' : 'Cập nhật')
            : 'Lưu'))
  const canExportPdf = isWarehouseConfirmed || isCustomerConfirmed
  const canSendToCustomer = isWarehouseConfirmed
  const canStartRepair =
    isCustomerConfirmed &&
    !isHistoryPage &&
    !isTicketCancelled &&
    ticketStatusKey !== 'UNDER_REPAIR' &&
    ticketStatusKey !== 'WAITING_FOR_DELIVERY' &&
    ticketStatusKey !== 'COMPLETED' &&
    ticketStatusKey !== 'CANCELED'
  const canHandover =
    !isHistoryPage &&
    !isTicketCancelled &&
    // Chỉ cho phép bàn giao khi báo giá là khách đã xác nhận
    normalizedQuotationStatus === 'CUSTOMER_CONFIRMED' &&
    // Chỉ cho phép bàn giao khi xe đang trong trạng thái sửa chữa
    ticketStatusKey === 'UNDER_REPAIR' &&
    ticketStatusKey !== 'WAITING_FOR_DELIVERY' &&
    ticketStatusKey !== 'COMPLETED' &&
    ticketStatusKey !== 'CANCELED'

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

  const openNoteModal = (note) => {
    const content = note && String(note).trim() !== '' ? note : 'Chưa có lưu ý'
    setNoteModalContent(content)
    setNoteModalOpen(true)
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
    boxShadow: 'none',
    transition: 'border-color 0.2s',
    height: '40px',
    background: inputsDisabled ? '#f5f5f5' : '#fff',
    color: inputsDisabled ? '#9ca3af' : '#262626',
    cursor: inputsDisabled ? 'not-allowed' : 'text'
  }), [inputsDisabled])

  const selectStyles = useMemo(() => ({
    control: (provided, state) => ({
      ...provided,
      minHeight: '42px',
      borderRadius: '12px',
      borderColor: state.isFocused ? '#3b82f6' : '#d0d7de',
      boxShadow: state.isFocused ? '0 0 0 2px rgba(255, 255, 255, 0.15)' : 'none',
      backgroundColor: inputsDisabled ? '#f5f5f5' : '#fff',
      color: inputsDisabled ? '#9ca3af' : '#262626',
      cursor: inputsDisabled ? 'not-allowed' : 'pointer',
      ':hover': {
        borderColor: inputsDisabled ? '#d0d7de' : '#3b82f6'
      }
    }),
    valueContainer: (provided) => ({
      ...provided,
      padding: '0 12px',
      color: inputsDisabled ? '#9ca3af' : '#262626'
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
    }),
    placeholder: (provided) => ({
      ...provided,
      color: inputsDisabled ? '#9ca3af' : '#9ca3af'
    }),
    singleValue: (provided) => ({
      ...provided,
      color: inputsDisabled ? '#9ca3af' : '#262626'
    })
  }), [inputsDisabled])

  const selectComponentsOverrides = useMemo(() => ({
    IndicatorSeparator: () => null,
    DropdownIndicator: (props) => (
      <selectComponents.DropdownIndicator {...props}>
        <span style={{ fontSize: '12px', color: '#64748b' }}>▾</span>
      </selectComponents.DropdownIndicator>
    ),
    Option: (props) => {
      // Chỉ render chi tiết xuất xứ/SL cho dropdown linh kiện (isPartSelect = true)
      const isPartSelect = props?.selectProps?.isPartSelect
      const part = props.data?.part
      if (!isPartSelect || !part) {
        return <selectComponents.Option {...props}>{props.label}</selectComponents.Option>
      }
      return (
        <selectComponents.Option {...props}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontWeight: 600, color: '#111' }}>
              {part.name || props.label || 'Linh kiện'}
            </div>
            <div style={{ fontSize: 12, color: '#475569' }}>
              SL: {part.quantity ?? 0}
            </div>
          </div>
          <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>
            {part.marketName ? `Xuất xứ: ${part.marketName}` : 'Xuất xứ: --'}
          </div>
        </selectComponents.Option>
      )
    }
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
        
          category: item.partId || item.partCode || item.itemName || item.partName || '',
          categoryLabel: item.itemName || item.partName || item.partCode || '',
          partId: item.partId || item.part?.partId || null,
          quantity: item.quantity ?? 1,
          unit: item.unit || '',
          unitPrice: item.unitPrice || 0,
          total: item.totalPrice || 0,
          availableQuantity: item.part?.quantity ?? null,
          inventoryStatus: item.inventoryStatus || '',
          warehouseReviewStatus: item.warehouseReviewStatus || '',
          warehouseNote: item.warehouseNote || null,
          exportedQuantity: item.exportedQuantity ?? 0,
          unitLocked: false,
          unitPriceLocked: false
        })
      } else if (item.itemType === 'SERVICE') {
        serviceItemsResult.push({
          id: item.priceQuotationItemId || `service-${index}-${Date.now()}`,
          priceQuotationItemId: item.priceQuotationItemId || null,
         
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
      styles={props.styles || selectStyles}
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
    const partItems = replaceItems.map(item => {
   
      const partOption = getPartOption(item.category)
      const isPartInList = partOption?.part !== undefined
      
      return {
        itemName: item.categoryLabel || item.category || '',
      
        partId:
          item.partId ??
          (isPartInList
            ? (partOption?.part?.partId ?? parseNumericId(item.category))
            : parseNumericId(item.category)),
        priceQuotationItemId: item.priceQuotationItemId || (typeof item.id === 'number' ? null : item.id),
        quantity: Number(item.quantity) || 0,
        totalPrice: Number(item.total) || 0,
        type: 'PART',
        unit: item.unit || '',
        unitPrice: Number(item.unitPrice) || 0
      }
    })

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

  // Sync selected techs và services khi options được load và ticket data có
  useEffect(() => {
    if (!ticketData || techOptions.length === 0 || serviceOptions.length === 0) return
    
    // Sync selected technicians
    if (Array.isArray(ticketData.assignedTechnicianIds) && ticketData.assignedTechnicianIds.length > 0) {
      const matched = techOptions.filter(opt => ticketData.assignedTechnicianIds.map(String).includes(String(opt.value)))
      if (matched.length > 0 && JSON.stringify(matched.map(m => m.value).sort()) !== JSON.stringify(selectedTechs.map(s => s.value).sort())) {
        setSelectedTechs(matched)
      }
    }
    
    // Sync selected services
    if (Array.isArray(ticketData.serviceTypeIds) && ticketData.serviceTypeIds.length > 0) {
      const matched = serviceOptions.filter(opt => ticketData.serviceTypeIds.map(String).includes(String(opt.value)))
      if (matched.length > 0 && JSON.stringify(matched.map(m => m.value).sort()) !== JSON.stringify(selectedServices.map(s => s.value).sort())) {
        setSelectedServices(matched)
      }
    } else if (Array.isArray(ticketData.serviceType) && ticketData.serviceType.length > 0) {
      // Nếu có serviceType (array of names), match theo tên
      const serviceTypeNames = ticketData.serviceType.map(name => String(name).trim().toLowerCase())
      const matched = serviceOptions.filter(opt => {
        const optLabel = String(opt.label || '').trim().toLowerCase()
        return serviceTypeNames.includes(optLabel)
      })
      if (matched.length > 0 && JSON.stringify(matched.map(m => m.value).sort()) !== JSON.stringify(selectedServices.map(s => s.value).sort())) {
        setSelectedServices(matched)
      }
    }
  }, [ticketData, techOptions, serviceOptions, selectedTechs, selectedServices])

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

  // Fetch technicians
  const fetchTechnicians = async () => {
    setTechLoading(true)
    try {
      const { data, error } = await employeesAPI.getTechnicians()
      if (error) {
        message.error('Không thể tải danh sách kỹ thuật viên')
        setTechLoading(false)
        return
      }
      const technicians = data?.result || data || []
      setTechOptions(technicians.map(t => ({ value: t.employeeId, label: `${t.fullName} - ${t.phone || ''}` })))
    } catch (err) {
      console.error('Error fetching technicians:', err)
    } finally {
      setTechLoading(false)
    }
  }

  // Fetch service types
  const fetchServiceTypes = async () => {
    setServiceLoading(true)
    try {
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
      setServiceOptions(allServiceOptions)
    } catch (err) {
      console.error('Error fetching service types:', err)
    } finally {
      setServiceLoading(false)
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
      setIsEditMode(false) // Reset edit mode khi fetch lại data
      
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
      
      // Fetch technicians và service types để hiển thị trong dropdown
      await fetchTechnicians()
      await fetchServiceTypes()
      
      // Set selected values từ ticket data sau khi fetch xong
      // Sử dụng setTimeout để đảm bảo state đã được cập nhật
      setTimeout(() => {
        // Set selected technicians
        if (Array.isArray(data.assignedTechnicianIds) && data.assignedTechnicianIds.length > 0) {
          const matched = techOptions.filter(opt => data.assignedTechnicianIds.map(String).includes(String(opt.value)))
          if (matched.length > 0) {
            setSelectedTechs(matched)
          }
        }
        
        // Set selected services
        if (Array.isArray(data.serviceTypeIds) && data.serviceTypeIds.length > 0) {
          const matched = serviceOptions.filter(opt => data.serviceTypeIds.map(String).includes(String(opt.value)))
          if (matched.length > 0) {
            setSelectedServices(matched)
          }
        } else if (Array.isArray(normalizedData.serviceType) && normalizedData.serviceType.length > 0) {
          // Nếu có serviceType (array of names), match theo tên
          const serviceTypeNames = normalizedData.serviceType.map(name => String(name).trim().toLowerCase())
          const matched = serviceOptions.filter(opt => {
            const optLabel = String(opt.label || '').trim().toLowerCase()
            return serviceTypeNames.includes(optLabel)
          })
          if (matched.length > 0) {
            setSelectedServices(matched)
          }
        }
      }, 300)
      
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
    const newReplace = { 
      id: Date.now(), 
      priceQuotationItemId: null,
      category: '',
      categoryLabel: '',
      partId: null,
      quantity: 1, 
      unit: '',
      unitPrice: 0,
      total: 0,
      unitLocked: false,
      unitPriceLocked: false
    }
    setReplaceItems([...replaceItems, newReplace])
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

  const deleteReplaceItem = async (id, priceQuotationItemId) => {
    // Nếu có priceQuotationItemId, gọi API để xóa
    if (priceQuotationItemId) {
      try {
        const { data, error } = await priceQuotationAPI.deleteItem(priceQuotationItemId)
        if (error) {
          message.error(error || 'Không thể xóa mục báo giá')
          return
        }
        message.success('Đã xóa mục báo giá thành công')
        // Refresh data sau khi xóa
        await fetchTicketDetail()
      } catch (err) {
        console.error('Error deleting quotation item:', err)
        message.error('Đã xảy ra lỗi khi xóa mục báo giá')
      }
    } else {
      // Nếu không có priceQuotationItemId, chỉ xóa khỏi state (item mới chưa lưu)
    setReplaceItems(replaceItems.filter(item => item.id !== id))
  }
  }

  const deleteServiceItem = async (id, priceQuotationItemId) => {
    // Nếu có priceQuotationItemId, gọi API để xóa
    if (priceQuotationItemId) {
      try {
        const { data, error } = await priceQuotationAPI.deleteItem(priceQuotationItemId)
        if (error) {
          message.error(error || 'Không thể xóa mục báo giá')
          return
        }
        message.success('Đã xóa mục báo giá thành công')
        // Refresh data sau khi xóa
        await fetchTicketDetail()
      } catch (err) {
        console.error('Error deleting quotation item:', err)
        message.error('Đã xảy ra lỗi khi xóa mục báo giá')
      }
    } else {
      // Nếu không có priceQuotationItemId, chỉ xóa khỏi state (item mới chưa lưu)
    setServiceItems(serviceItems.filter(item => item.id !== id))
    }
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
        newErrors[`replace_${item.id}_category`] = 'Trường bắt buộc'
      }
      if (!item.unit) {
        newErrors[`replace_${item.id}_unit`] = 'Trường bắt buộc'
      }
      if (!item.unitPrice || item.unitPrice === 0) {
        newErrors[`replace_${item.id}_unitPrice`] = 'Trường bắt buộc'
      }
    })
    
    serviceItems.forEach((item) => {
      if (!item.task) {
        newErrors[`service_${item.id}_task`] = 'Trường bắt buộc'
      }
      if (item.unitPrice === null || item.unitPrice === undefined || item.unitPrice === '' || Number.isNaN(item.unitPrice)) {
        newErrors[`service_${item.id}_unitPrice`] = 'Trường bắt buộc'
      }
    })
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const setQuotationDraft = async () => {
    const quotationId = getQuotationId()
    if (!quotationId) {
      throw new Error('Không tìm thấy ID báo giá')
    }
    try {
      const { data: response, error } = await priceQuotationAPI.setDraft(quotationId)
      if (error) throw new Error(error)

      setTicketData((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          priceQuotation: {
            ...(prev.priceQuotation || {}),
            status: 'DRAFT'
          }
        }
      })
      return response
    } catch (err) {
      console.error('Không thể chuyển báo giá về nháp:', err)
      throw err // Re-throw để caller có thể xử lý
    }
  }

  const handleSendQuote = async () => {
    if (actionLoading) return
    
    // Tính lại ticketStatusKey để đảm bảo có giá trị đúng
    const currentTicketStatusKey = getTicketStatusConfig(ticketData?.status).key
    console.log('handleSendQuote - currentTicketStatusKey:', currentTicketStatusKey)
    console.log('handleSendQuote - ticketData?.status:', ticketData?.status)
    
    // Nếu trạng thái là "Chờ bàn giao xe", cập nhật thành "Hoàn thành"
    if (currentTicketStatusKey === 'WAITING_FOR_DELIVERY') {
      console.log('Handling WAITING_FOR_DELIVERY status - updating to COMPLETED')
      if (!id && !ticketData?.serviceTicketId) {
        message.error('Không tìm thấy ID phiếu dịch vụ.')
        return
      }

      setActionLoading(true)
      try {
        const serviceTicketId = id || ticketData.serviceTicketId
        console.log('Calling updateStatus API - ticketId:', serviceTicketId, 'status: COMPLETED')
        const { data, error } = await serviceTicketAPI.updateStatus(serviceTicketId, 'COMPLETED')
        
        if (error) {
          console.error('API error:', error)
          message.error(error || 'Không thể cập nhật trạng thái hoàn thành')
          setActionLoading(false)
          return
        }
        
        console.log('API success:', data)
        message.success('Đã cập nhật trạng thái hoàn thành thành công')
        await fetchTicketDetail()
      } catch (err) {
        console.error('Error updating to completed status:', err)
        message.error('Đã xảy ra lỗi khi cập nhật trạng thái')
      } finally {
        setActionLoading(false)
      }
      return
    }
    
    console.log('Not WAITING_FOR_DELIVERY, continuing with normal flow')
    
    // Nếu quotation status là CUSTOMER_REJECTED và ticket status là QUOTING, chuyển báo giá về DRAFT
    if (isCustomerRejected && currentTicketStatusKey === 'QUOTING') {
      console.log('Calling setQuotationDraft API - CUSTOMER_REJECTED and QUOTING')
      setActionLoading(true)
      try {
        const result = await setQuotationDraft()
        console.log('setQuotationDraft result:', result)
        message.success('Đã chuyển báo giá về nháp')
        await fetchTicketDetail() // Refresh data để cập nhật UI
      } catch (err) {
        console.error('Error in setQuotationDraft:', err)
        message.error(err?.message || 'Không thể chuyển báo giá về nháp')
      } finally {
        setActionLoading(false)
      }
      return
    }
    
    if ((isWarehouseConfirmed || isCustomerConfirmed || isWaitingCustomerConfirm) && !isEditMode) {
      await setQuotationDraft()
      setIsEditMode(true)
      return
    }
    
    // Nếu đang chờ kho duyệt và có item bị từ chối, chuyển về nháp
    if (isWaitingWarehouse && hasRejectedItem) {
      console.log('Calling setQuotationDraft API - hasRejectedItem:', hasRejectedItem)
      setActionLoading(true)
      try {
        const result = await setQuotationDraft()
        console.log('setQuotationDraft result:', result)
        message.success('Đã chuyển báo giá về nháp')
        await fetchTicketDetail() // Refresh data để cập nhật UI
      } catch (err) {
        console.error('Error in setQuotationDraft:', err)
        message.error(err?.message || 'Không thể chuyển báo giá về nháp')
      } finally {
        setActionLoading(false)
      }
      return
    }
    
   
    if (isWaitingWarehouse) {
      message.warning('Báo giá đang chờ kho duyệt, không thể chỉnh sửa.')
      return
    }
    
    if (inputsDisabled) {
      message.warning('Báo giá chưa thể chỉnh sửa ở trạng thái hiện tại.')
      return
    }
    
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
      // Gửi qua ZNS
      const { error: znsError } = await znsNotificationsAPI.sendQuotation(quotationId)
      if (znsError) {
        throw new Error(znsError)
      }
      // Gửi thêm API send-to-customer
      const { error: sendApiError } = await priceQuotationAPI.sendToCustomer(quotationId)
      if (sendApiError) {
        throw new Error(sendApiError)
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

  const handleStartRepair = async () => {
    if (!id) return
    try {
      setStartRepairLoading(true)
      // Một số trạng thái không cho phép nhảy thẳng sang UNDER_REPAIR.
      // Nếu chưa ở trạng thái QUOTE_CONFIRMED thì đưa về QUOTE_CONFIRMED trước.
      if (
        ticketStatusKey !== 'QUOTE_CONFIRMED' &&
        ticketStatusKey !== 'UNDER_REPAIR' &&
        ticketStatusKey !== 'WAITING_FOR_DELIVERY' &&
        ticketStatusKey !== 'COMPLETED' &&
        ticketStatusKey !== 'CANCELED'
      ) {
        const { error: preError } = await serviceTicketAPI.updateStatus(id, 'QUOTE_CONFIRMED')
        if (preError) throw new Error(preError)
      }

      const { error } = await serviceTicketAPI.updateStatus(id, 'UNDER_REPAIR')
      if (error) throw new Error(error)
      message.success('Đã chuyển trạng thái sang Đang sửa chữa')
      await fetchTicketDetail()
    } catch (err) {
      console.error('Error starting repair:', err)
      message.error(err?.message || 'Không thể chuyển trạng thái sang Đang sửa chữa')
    } finally {
      setStartRepairLoading(false)
    }
  }

  const handleHandover = async () => {
    if (!id && !ticketData?.serviceTicketId) {
      message.error('Không tìm thấy ID phiếu dịch vụ.')
      return
    }

    setHandoverLoading(true)
    try {
      const serviceTicketId = id || ticketData.serviceTicketId
      
      // Cập nhật trạng thái
      const { data, error } = await serviceTicketAPI.updateStatus(serviceTicketId, 'WAITING_FOR_DELIVERY')
      
      if (error) {
        message.error(error || 'Không thể cập nhật trạng thái bàn giao xe')
        return
      }
      
      // Gửi thông báo nhận xe qua ZNS
      try {
        const { error: znsError } = await znsNotificationsAPI.sendVehicleReceipt(serviceTicketId)
        if (znsError) {
          console.error('Error sending vehicle receipt notification:', znsError)
          // Không hiển thị lỗi cho người dùng vì cập nhật trạng thái đã thành công
        }
      } catch (znsErr) {
        console.error('Error sending vehicle receipt notification:', znsErr)
        // Không hiển thị lỗi cho người dùng vì cập nhật trạng thái đã thành công
      }
      
      message.success('Đã cập nhật trạng thái bàn giao xe thành công')
      await fetchTicketDetail()
    } catch (err) {
      console.error('Error updating handover status:', err)
      message.error('Đã xảy ra lỗi khi cập nhật trạng thái')
    } finally {
      setHandoverLoading(false)
    }
  }

  const handleExportPDF = async () => {
    if (!ticketData?.priceQuotation?.priceQuotationId) {
      message.error('Không tìm thấy ID báo giá.')
      return
    }

    setExportPDFLoading(true)
    try {
      const quotationId = ticketData.priceQuotation.priceQuotationId
      const { data, error } = await priceQuotationAPI.exportPDF(quotationId)
      
      if (error) {
        message.error(error || 'Xuất PDF thất bại. Vui lòng thử lại.')
        return
      }
      
      if (!data) {
        message.error('Không nhận được dữ liệu PDF')
        return
      }
      
      if (data instanceof Blob) {
        if (data.type === 'application/json' || data.size < 100) {
          const text = await data.text()
          try {
            const errorJson = JSON.parse(text)
            const errorMsg = errorJson.message || errorJson.error || 'Lỗi tạo PDF'
            message.error(errorMsg)
            return
          } catch (e) {
            message.error('Lỗi tạo PDF. Vui lòng thử lại.')
            return
          }
        }
        
        const url = window.URL.createObjectURL(data)
        const link = document.createElement('a')
        link.href = url
        link.download = `BaoGia_${ticketData.serviceTicketCode || quotationId}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        
        message.success('Đã xuất PDF thành công')
      } else if (typeof data === 'string') {
        try {
          const errorJson = JSON.parse(data)
          const errorMsg = errorJson.message || errorJson.error || 'Lỗi tạo PDF'
          message.error(errorMsg)
        } catch (e) {
          const byteCharacters = atob(data)
          const byteNumbers = new Array(byteCharacters.length)
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i)
          }
          const byteArray = new Uint8Array(byteNumbers)
          const blob = new Blob([byteArray], { type: 'application/pdf' })
          
          const url = window.URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = `BaoGia_${ticketData.serviceTicketCode || quotationId}.pdf`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          window.URL.revokeObjectURL(url)
          
          message.success('Đã xuất PDF thành công')
        }
      } else {
        message.error('Định dạng dữ liệu không hợp lệ')
      }
    } catch (error) {
      console.error('Error exporting PDF:', error)
      const errorMsg = error?.message || 'Đã xảy ra lỗi khi xuất PDF'
      message.error(errorMsg)
    } finally {
      setExportPDFLoading(false)
    }
  }

  const handleConfirmQuotation = async () => {
    if (!ticketData?.priceQuotation?.priceQuotationId) {
      message.error('Không tìm thấy ID báo giá.')
      return
    }
    if (!id && !ticketData?.serviceTicketId) {
      message.error('Không tìm thấy ID phiếu dịch vụ.')
      return
    }
    try {
      const quotationId = ticketData.priceQuotation.priceQuotationId
      const serviceTicketId = id || ticketData.serviceTicketId
      
      const { data, error } = await priceQuotationAPI.confirmQuotation(quotationId)
      
      if (error) {
        message.error(error || 'Không thể xác nhận báo giá')
        return
      }
      
      const { error: invoiceError } = await invoiceAPI.create(serviceTicketId, quotationId)
      
      if (invoiceError) {
        console.error('Error creating invoice:', invoiceError)
        message.warning('Đã xác nhận báo giá nhưng không thể tạo phiếu thanh toán. Vui lòng thử lại.')
      } else {
        message.success('Đã xác nhận báo giá và tạo phiếu thanh toán thành công')
      }
      
      await fetchTicketDetail()
    } catch (err) {
      console.error('Error confirming quotation:', err)
      message.error('Đã xảy ra lỗi khi xác nhận')
    }
  }

  const handleOpenRejectModal = () => {
    setRejectReason('')
    setRejectModalOpen(true)
  }

  const handleRejectQuotation = async () => {
    if (!ticketData?.priceQuotation?.priceQuotationId) {
      message.error('Không tìm thấy ID báo giá.')
      return
    }

    if (!rejectReason || rejectReason.trim() === '') {
      message.error('Vui lòng nhập lý do từ chối')
      return
    }

    try {
      const quotationId = ticketData.priceQuotation.priceQuotationId
      const { data, error } = await priceQuotationAPI.rejectQuotation(quotationId, rejectReason)
      
      if (error) {
        message.error(error || 'Không thể từ chối báo giá')
        return
      }
      
      message.success('Đã xác nhận khách hàng từ chối báo giá')
      setRejectModalOpen(false)
      setRejectReason('')
      await fetchTicketDetail()
    } catch (err) {
      console.error('Error rejecting quotation:', err)
      message.error('Đã xảy ra lỗi khi từ chối')
    }
  }

  const handleCloseRejectModal = () => {
    setRejectModalOpen(false)
    setRejectReason('')
  }

  const handleQuotationActionChange = async (e) => {
    const value = e.target.value
    if (value === 'confirm') {
      handleConfirmQuotation()
    } else if (value === 'reject') {
      // Khi chọn "Khách từ chối", gọi API để cập nhật trạng thái service ticket thành CANCELED
      if (!id && !ticketData?.serviceTicketId) {
        message.error('Không tìm thấy ID phiếu dịch vụ.')
        e.target.value = ''
        return
      }
      
      try {
        const serviceTicketId = id || ticketData.serviceTicketId
        const { data, error } = await serviceTicketAPI.updateStatus(serviceTicketId, 'CANCELED')
        
        if (error) {
          message.error(error || 'Không thể hủy phiếu dịch vụ')
          e.target.value = ''
          return
        }
        
        message.success('Đã hủy phiếu dịch vụ thành công')
        await fetchTicketDetail()
      } catch (err) {
        console.error('Error canceling service ticket:', err)
        message.error('Đã xảy ra lỗi khi hủy phiếu dịch vụ')
      }
    }
    e.target.value = ''
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

    const hide = message.loading('Đang gửi báo giá...', 0)
    setActionLoading(true)
    try {
      // Bước 1: Cập nhật ngày dự kiến giao xe trước
      const dateStr = expectedDate.format('YYYY-MM-DD')
      const { error: deliveryError } = await serviceTicketAPI.updateDeliveryAt(id, dateStr)
      
      if (deliveryError) {
        throw new Error(deliveryError || 'Cập nhật ngày giao xe không thành công')
      }

      // Bước 2: Lưu báo giá (setQuotationDraft)
    await setQuotationDraft()

    const payload = {
   
      discount: ticketData?.priceQuotation?.discount ?? 0,
      estimateAmount: grandTotal,
      items: buildQuotationItemsPayload(),
      status: 'DRAFT'
    }

      // Bước 3: Cập nhật báo giá
      const { data: response, error } = await priceQuotationAPI.update(quotationId, payload)
      
      if (error) {
        throw new Error(error || 'Lưu báo giá không thành công. Vui lòng thử lại.')
      }

      if (!response || (response.statusCode !== 200 && !response.result)) {
        throw new Error('Lưu báo giá không thành công. Vui lòng thử lại.')
      }

      message.success('Đã lưu báo giá thành công')
      setShowDateModal(false)
      setIsEditMode(false) 
      setTicketData((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          priceQuotation: {
            ...prev.priceQuotation,
            status: 'DRAFT'
          }
        }
      })
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
      align: 'center',
      render: (_, __, index) => String(index + 1).padStart(2, '0')
    },
    {
      title: 'Danh mục',
      key: 'category',
      width: 350,
      align: 'center',
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
            isDisabled={inputsDisabled || (record.exportedQuantity > 0)}
            isLoading={partsLoading}
            styles={{
              ...selectStyles,
              control: (provided, state) => ({
                ...provided,
                minHeight: '42px',
                borderRadius: '12px',
                borderColor: state.isFocused ? '#3b82f6' : '#d0d7de',
                boxShadow: state.isFocused ? '0 0 0 2px rgba(255, 255, 255, 0.15)' : 'none',
                backgroundColor: (inputsDisabled || record.exportedQuantity > 0) ? '#f5f5f5' : '#fff',
                color: (inputsDisabled || record.exportedQuantity > 0) ? '#9ca3af' : '#262626',
                cursor: (inputsDisabled || record.exportedQuantity > 0) ? 'not-allowed' : 'pointer',
                ':hover': {
                  borderColor: (inputsDisabled || record.exportedQuantity > 0) ? '#d0d7de' : '#3b82f6'
                }
              }),
              valueContainer: (provided) => ({
                ...provided,
                padding: '0 12px',
                color: (inputsDisabled || record.exportedQuantity > 0) ? '#9ca3af' : '#262626'
              }),
              placeholder: (provided) => ({
                ...provided,
                color: (inputsDisabled || record.exportedQuantity > 0) ? '#9ca3af' : '#9ca3af'
              }),
              singleValue: (provided) => ({
                ...provided,
                color: (inputsDisabled || record.exportedQuantity > 0) ? '#9ca3af' : '#262626'
              })
            }}
            noOptionsMessage={() => partsLoading ? 'Đang tải...' : 'Không có linh kiện'}
            onCreateOption={(inputValue) => {
              const trimmed = inputValue?.trim()
              if (!trimmed) return
              addCustomPartOption(trimmed, trimmed)
              updateReplaceItem(record.id, {
                category: trimmed,
                categoryLabel: trimmed,
                partId: null,
                unit: '',
                unitPrice: 0,
                unitLocked: false,
                unitPriceLocked: false
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
                partId: null,
                availableQuantity: selectedPart?.part?.quantity ?? null,
                unitLocked: false,
                unitPriceLocked: false
              }

              if (selectedPart?.part) {
                const partUnitCode =
                  selectedPart.part.unitCode ||
                  selectedPart.part.unit ||
                  selectedPart.part.unitId
                const partUnitName = selectedPart.part.unitName
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
                let matchedUnitByName = null
                if (!matchedUnit && partUnitName) {
                  matchedUnitByName = unitOptions.find(unit =>
                    String(unit.label || unit.name || unit.value || '')
                      .toLowerCase() === String(partUnitName).toLowerCase()
                  )
                }
                updates.unit = matchedUnit?.value || matchedUnitByName?.value || selectedPart.part.unit || ''
                updates.unitPrice = selectedPart.part.sellingPrice || 0
                updates.unitLocked = true
                updates.unitPriceLocked = true
                updates.partId = selectedPart.part.partId || parseNumericId(value)
              } else {
                updates.unit = ''
                updates.unitPrice = 0
                updates.unitLocked = false
                updates.unitPriceLocked = false
                updates.partId = parseNumericId(value)
              }

              updateReplaceItem(record.id, updates)
            }}
            isPartSelect
          />
          {errors[`replace_${record.id}_category`] && (
          <div className="td-error-placeholder">
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
      align: 'center',
      render: (_, record) => {
        // Lấy quantity của part (availableQuantity)
        const partQuantity = record.availableQuantity != null ? Number(record.availableQuantity) : null
        // Lấy số lượng hiện tại
        const currentQuantity = Number(record.quantity) || 0
        // Kiểm tra nếu số lượng hiện tại lớn hơn quantity của part
        const isOutOfStock = partQuantity != null && 
                             Number.isFinite(partQuantity) && 
                             currentQuantity > partQuantity
        
        const isDisabled = inputsDisabled || (record.exportedQuantity > 0)
        return (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <input
            type="number"
            min={1}
            value={record.quantity ?? 1}
            onChange={(e) =>
              updateReplaceItem(record.id, {
                quantity: Number(e.target.value) || 1
              })
            }
              style={{
                ...baseInputStyle,
                background: isDisabled ? '#f5f5f5' : baseInputStyle.background,
                color: isDisabled ? '#9ca3af' : baseInputStyle.color,
                cursor: isDisabled ? 'not-allowed' : baseInputStyle.cursor
              }}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            disabled={isDisabled}
          />
        </div>
      )
      }
    },
    {
      title: 'Đơn vị',
      key: 'unit',
      width: 120,
      align: 'center',
      render: (_, record) => (
        <div>
        <CustomSelect
          placeholder="Đơn vị"
          value={unitOptions.find(option => String(option.value) === String(record.unit)) || null}
          options={unitOptions}
          isClearable
          isDisabled={inputsDisabled || record.unitLocked || (record.exportedQuantity > 0)}
          onChange={(option) =>
            updateReplaceItem(record.id, { unit: option?.value || '' })
          }
            styles={{
              control: (base, state) => ({
                ...base,
                minHeight: '40px',
                height: '40px',
                borderRadius: '12px',
                border: `1px solid ${errors[`replace_${record.id}_unit`] ? '#ef4444' : (state.isFocused ? '#4096ff' : '#d0d7de')}`,
                fontSize: '14px',
                background: (inputsDisabled || record.exportedQuantity > 0) ? '#f5f5f5' : '#fff',
                color: (inputsDisabled || record.exportedQuantity > 0) ? '#9ca3af' : '#262626',
                cursor: (inputsDisabled || record.exportedQuantity > 0) ? 'not-allowed' : 'pointer',
                padding: '0 4px',
                boxShadow: 'none',
                '&:hover': {
                  borderColor: (inputsDisabled || record.exportedQuantity > 0) ? '#d0d7de' : (state.isFocused ? '#4096ff' : '#d0d7de')
                }
              }),
              valueContainer: (base) => ({
                ...base,
                padding: '0 8px',
                height: '38px',
                color: (inputsDisabled || record.exportedQuantity > 0) ? '#9ca3af' : '#262626'
              }),
              singleValue: (base) => ({
                ...base,
                color: (inputsDisabled || record.exportedQuantity > 0) ? '#9ca3af' : '#262626'
              }),
              placeholder: (base) => ({
                ...base,
                color: inputsDisabled ? '#9ca3af' : '#9ca3af'
              }),
              input: (base) => ({
                ...base,
                margin: 0,
                padding: 0
              }),
              indicatorsContainer: (base) => ({
                ...base,
                height: '38px'
              })
            }}
          />
          {errors[`replace_${record.id}_unit`] && (
          <div className="td-error-placeholder">
              {errors[`replace_${record.id}_unit`]}
          </div>
          )}
        </div>
      )
    },
    {
      title: 'Đơn giá',
      key: 'unitPrice',
      width: 150,
      align: 'center',
      render: (_, record) => (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <input
            type="text"
            inputMode="numeric"
            placeholder="Số tiền..."
            value={
              record.unitPrice !== null && record.unitPrice !== undefined
                ? record.unitPrice.toLocaleString('vi-VN')
                : ''
            }
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
            disabled={inputsDisabled || record.unitPriceLocked}
          />
          {errors[`replace_${record.id}_unitPrice`] && (
          <div className="td-error-placeholder">
              {errors[`replace_${record.id}_unitPrice`]}
          </div>
          )}
        </div>
      )
    },
    {
      title: 'Thành tiền',
      key: 'total',
      width: 150,
      align: 'center',
      render: (_, record) => {
        const value = record.total ?? 0
        const text = value ? value.toLocaleString('vi-VN') + ' đ' : '--'
        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ minHeight: 40, display: 'inline-flex', alignItems: 'center' }}>
              {text}
            </span>
          </div>
        )
      }
    },
    {
      title: 'Kho',
      key: 'inventoryStatus',
      width: 140,
      align: 'center',
      render: (_, record) => {
        const { color, text } = getInventoryStatusConfig(record.inventoryStatus)
        return (
          <span style={{ color, fontWeight: 600 }}>
            {text}
          </span>
        )
      }
    },
    {
      title: '',
      key: 'warehouseNote',
      width: 140,
      align: 'center',
      render: (_, record) => (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', alignItems: 'center' }}>
            <span
              style={{
                fontSize: 13,
                color: '#374151',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer',
                justifyContent: 'center'
              }}
              onClick={() => openNoteModal(record.warehouseNote)}
              title="Xem ghi chú kho"
            >
              {(() => {
                const noteExists = record.warehouseNote && record.warehouseNote.trim() !== ''
                const reviewStatus = (record.warehouseReviewStatus || '').toString()
                const isRejected = reviewStatus.toLocaleUpperCase('vi') === 'TỪ CHỐI'
                const color = isRejected
                  ? '#ef4444'
                  : (noteExists ? '#111' : '#9ca3af')
                return <FileTextOutlined style={{ fontSize: 16, color }} />
              })()}
            </span>
            {!isHistoryPage && !inputsDisabled && record.exportedQuantity === 0 && (
              record.priceQuotationItemId ? (
                <Popconfirm
                  title="Xóa mục báo giá"
                  description="Bạn có chắc chắn muốn xóa mục này?"
                  onConfirm={() => deleteReplaceItem(record.id, record.priceQuotationItemId)}
                  okText="Xác nhận"
                  cancelText="Hủy"
                >
              <DeleteOutlined
                style={{ color: '#ef4444', cursor: 'pointer', fontSize: 16 }}
                title="Xóa dòng"
              />
                </Popconfirm>
              ) : (
                <DeleteOutlined
                  style={{ color: '#ef4444', cursor: 'pointer', fontSize: 16 }}
                  onClick={() => deleteReplaceItem(record.id, null)}
                  title="Xóa dòng"
                />
              )
            )}
          </div>
        </div>
      )
    }
  ]

  const serviceColumns = [
    {
      title: 'STT',
      key: 'index',
      width: 60,
      align: 'center',
      render: (_, __, index) => String(index + 1).padStart(2, '0')
    },
    {
      title: 'Công việc',
      key: 'task',
      width: 590,
      align: 'center',
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
          <div className="td-error-placeholder">
              {errors[`service_${record.id}_task`]}
          </div>
          )}
        </div>
      )
    },
    {
      title: 'Đơn giá',
      key: 'unitPrice',
      width: 150,
      align: 'center',
      render: (_, record) => (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <input
            type="text"
            inputMode="numeric"
            placeholder="Số tiền..."
            value={
              record.unitPrice !== null && record.unitPrice !== undefined
                ? record.unitPrice.toLocaleString('vi-VN')
                : ''
            }
            onChange={(e) => {
              const sanitized = e.target.value.replace(/[^\d]/g, '')
              const value = sanitized === '' ? 0 : parseInt(sanitized, 10)
              updateServiceItem(record.id, 'unitPrice', Number.isNaN(value) ? 0 : value)
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
          <div className="td-error-placeholder">
              {errors[`service_${record.id}_unitPrice`]}
          </div>
          )}
        </div>
      )
    },
    {
      title: 'Thành tiền',
      key: 'total',
      width: 150,
      align: 'center',
      render: (_, record) => {
        const value = record.total ?? 0
        const text = value ? value.toLocaleString('vi-VN') + ' đ' : '--'
        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ minHeight: 40, display: 'inline-flex', alignItems: 'center' }}>
              {text}
            </span>
          </div>
        )
      }
    },
    {
      title: '',
      key: 'action',
      width: 140,
      align: 'center',
      render: (_, record) => (
        <Space>
          {!inputsDisabled && (
            record.priceQuotationItemId ? (
              <Popconfirm
                title="Xóa mục báo giá"
                description="Bạn có chắc chắn muốn xóa mục này?"
                onConfirm={() => deleteServiceItem(record.id, record.priceQuotationItemId)}
                okText="Xác nhận"
                cancelText="Hủy"
              >
            <DeleteOutlined
              style={{ fontSize: '16px', cursor: 'pointer', color: '#ef4444' }}
                />
              </Popconfirm>
            ) : (
              <DeleteOutlined
                style={{ fontSize: '16px', cursor: 'pointer', color: '#ef4444' }}
                onClick={() => deleteServiceItem(record.id, null)}
            />
            )
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

  const technicianText = (() => {
    if (Array.isArray(ticketData?.technicians) && ticketData.technicians.length > 0) {
      return ticketData.technicians.join(', ')
    }
    if (selectedTechs.length > 0) {
      return selectedTechs.map((t) => t.label || t.value).join(', ')
    }
    return 'Chưa chọn thợ sửa chữa'
  })()

  const serviceTypeText = (() => {
    if (Array.isArray(ticketData?.serviceType) && ticketData.serviceType.length > 0) {
      return ticketData.serviceType.join(', ')
    }
    if (selectedServices.length > 0) {
      return selectedServices.map((s) => s.label || s.value).join(', ')
    }
    return 'Chưa chọn dịch vụ'
  })()
  const quoteCreatedDate = ticketData?.createdAt || ''

  const totalReplacement = replaceItems.reduce((sum, item) => sum + (item.total || 0), 0)
  const totalService = serviceItems.reduce((sum, item) => sum + (item.total || 0), 0)
  const grandTotal = totalReplacement + totalService


  const discountPercentRaw =
    ticketData?.priceQuotation?.discountPercent ??
    ticketData?.priceQuotation?.discountRate ??
    0
  const discountPercent = Number.isFinite(Number(discountPercentRaw)) ? Number(discountPercentRaw) : 0
  const discountAmount = Math.round((grandTotal * discountPercent) / 100)
  const finalAmount = Math.max(0, grandTotal - discountAmount)

  return (
    <AdminLayout>
      <style>{`
        .badge {
          padding: 4px 10px;
          border-radius: 999px;
          font-weight: 500;
          font-size: 12px;
          color: #fff;
        }
        .quotation-action-select {
          padding: 6px 32px 6px 12px;
          border-radius: 8px;
          border: 1px solid #d1d5db;
          background: #fff;
          font-size: 13px;
          font-weight: 500;
          color: #111;
          cursor: pointer;
          outline: none;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 14 14'%3E%3Cpath fill='%234b5563' d='M7 10L2 5h10z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 10px center;
          transition: all 0.2s ease;
          min-width: 160px;
        }
        .quotation-action-select:hover {
          border-color: #CBB081;
          background-color: #fafafa;
        }
        .quotation-action-select:focus {
          border-color: #CBB081;
          box-shadow: 0 0 0 3px rgba(203, 176, 129, 0.1);
        }
        .quotation-action-select option {
          padding: 8px 12px;
          font-size: 13px;
        }
        .quotation-action-select option[value="confirm"] {
          color: #16a34a;
        }
        .quotation-action-select option[value="reject"] {
          color: #dc2626;
        }
      `}</style>
      <div style={{ padding: '24px', background: '#ffffff', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
            <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>
              {ticketData?.serviceTicketCode || ticketData?.code || `STK-2025-${String(id || 0).padStart(6, '0')}`}
            </h1>
            {ticketData?.status && (() => {
              const cfg = getTicketStatusConfig(ticketData.status)
              if (!cfg.label) return null
              return (
                <span className="badge" style={{ backgroundColor: cfg.bg }}>
                  {cfg.label}
                </span>
              )
            })()}
          </div>
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
                <span>{quoteCreatedDate || '--'}</span>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <strong>Thợ sửa chữa:</strong>{' '}
                <span>{technicianText}</span>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <strong>Loại dịch vụ:</strong>{' '}
                <span>{serviceTypeText}</span>
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
                  <>
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
                    {normalizedQuotationStatus === 'WAITING_CUSTOMER_CONFIRM' && (
                      <select
                        onChange={handleQuotationActionChange}
                        className="quotation-action-select"
                        defaultValue=""
                      >
                        <option value="" disabled>Chọn hành động</option>
                        <option value="confirm">Xác nhận báo giá</option>
                        <option value="reject">Hủy phiếu dịch vụ</option>
                      </select>
                    )}
                  </>
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
                tableLayout="fixed"
                components={goldTableHeader}
                locale={{ emptyText: ' ' }}
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
                              border: 'none',
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
                tableLayout="fixed"
                components={goldTableHeader}
                locale={{ emptyText: ' ' }}
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
                              border: 'none',
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
                paddingTop: '24px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '48px', marginBottom: '24px' }}>
                <div>
                  <div style={{ color: '#6b7280', fontSize: '12px', textTransform: 'uppercase', marginBottom: '4px' }}>TỔNG CỘNG</div>
                  <div style={{ fontSize: '20px', fontWeight: 700 }}>{formatCurrency(grandTotal)} đ</div>
                </div>
                <div>
                  <div style={{ color: '#6b7280', fontSize: '12px', textTransform: 'uppercase', marginBottom: '4px' }}>GIẢM GIÁ</div>
                  <div style={{ fontSize: '20px', fontWeight: 700 }}>
                    {discountPercent ? `${discountPercent}%` : '0%'}{' '}
                    {discountAmount > 0 && (
                      <span style={{ color: '#4b5563', fontSize: 14 }}>
                        ({formatCurrency(discountAmount)} đ)
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#6b7280', fontSize: '12px', textTransform: 'uppercase', marginBottom: '4px' }}>THANH TOÁN CUỐI CÙNG</div>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: '#ef4444' }}>
                    {formatCurrency(finalAmount)} đ
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
              {!isHistoryPage ? (
                <Space size="middle">
                  {/* Ẩn nút nếu quotation status là CUSTOMER_REJECTED và ticket status là CANCELED */}
                  {!(isCustomerRejected && ticketStatusKey === 'CANCELED') && ticketStatusKey !== 'COMPLETED' && (
                  <Button 
                            onClick={handleSendQuote}
                    disabled={(() => {
                      // Nếu đang loading thì disable
                      if (actionLoading || isTicketCancelled) return true
                      
                      // Nếu trạng thái là "Chờ bàn giao xe", luôn enable nút "Hoàn thành"
                      if (ticketStatusKey === 'WAITING_FOR_DELIVERY') {
                        return false
                      }
                      
                      // Nếu quotation status là CUSTOMER_REJECTED và ticket status là QUOTING, enable nút "Cập nhật"
                      if (isCustomerRejected && ticketStatusKey === 'QUOTING') {
                        return false
                      }
                      
                      // Nếu đang chờ kho duyệt
                      if (isWaitingWarehouse) {
                        // Chỉ enable nếu có item bị từ chối
                        return !hasRejectedItem
                      }
                      
                      // Các trạng thái đã duyệt / chờ khách
                      if ((isWarehouseConfirmed || isCustomerConfirmed || isWaitingCustomerConfirm) && !isEditMode) {
                        return false
                      }
                      
                      if ((isWarehouseConfirmed || isCustomerConfirmed || isWaitingCustomerConfirm) && isEditMode) {
                        return replaceItems.length === 0 && serviceItems.length === 0
                      }
                      
                      // Disable nút "Lưu" khi chưa có item nào trong cả hai bảng
                      if (actionButtonLabel === 'Lưu' && replaceItems.length === 0 && serviceItems.length === 0) {
                        return true
                      }
                      
                      return inputsDisabled
                    })()}
                    loading={actionLoading}
                    style={{
                        background: isTicketCancelled
                          ? '#9ca3af'
                          : (isWaitingWarehouse && !hasRejectedItem)
                          ? '#9ca3af'
                          : (actionButtonLabel === 'Hoàn thành')
                            ? '#22c55e'
                            : (actionButtonLabel === 'Cập nhật')
                              ? '#CBB081'
                              : '#22c55e',
                        borderColor: isTicketCancelled
                          ? '#9ca3af'
                          : (isWaitingWarehouse && !hasRejectedItem)
                          ? '#9ca3af'
                          : (actionButtonLabel === 'Hoàn thành')
                            ? '#22c55e'
                            : (actionButtonLabel === 'Cập nhật')
                              ? '#CBB081'
                              : '#22c55e',
                      color: '#fff',
                      fontWeight: 600,
                      padding: '0 24px',
                        height: '40px',
                        cursor: (isTicketCancelled || (isWaitingWarehouse && !hasRejectedItem)) ? 'not-allowed' : 'pointer'
                    }}
                    >
                      {isTicketCancelled ? 'Phiếu đã hủy' : actionButtonLabel}
                    </Button>
                  )}
                  {canExportPdf && (
                    <Button
                      onClick={handleExportPDF}
                      loading={exportPDFLoading}
                      disabled={exportPDFLoading}
                      icon={<FilePdfOutlined />}
                      style={{
                        background: '#ef4444',
                        borderColor: '#ef4444',
                        color: '#fff',
                        fontWeight: 600,
                        padding: '0 24px',
                        height: '40px'
                      }}
                    >
                      Xuất PDF
                    </Button>
                  )}
                  {canHandover && (
                    <Button
                      type="primary"
                      onClick={handleHandover}
                      loading={handoverLoading}
                      disabled={handoverLoading}
                      style={{
                        fontWeight: 600,
                        padding: '0 24px',
                        height: '40px'
                      }}
                    >
                      Tiến hành bàn giao xe
                    </Button>
                  )}
                  {canStartRepair && (
                    <Button
                      onClick={handleStartRepair}
                      loading={startRepairLoading}
                      disabled={startRepairLoading}
                      style={{
                        background: '#F97316',
                        borderColor: '#F97316',
                        color: '#fff',
                        fontWeight: 600,
                        padding: '0 24px',
                        height: '40px'
                      }}
                    >
                      Tiến hành sửa chữa
                    </Button>
                  )}
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
        {/* Tạm thời tắt phần hiển thị thông báo Zalo */}
        {/* <div style={{ marginTop: '12px', fontSize: '12px', color: '#666', textAlign: 'center' }}>
          Báo giá sẽ được gửi cho khách hàng qua Zalo
        </div> */}
      </Modal>

   
      <Modal
        open={rejectModalOpen}
        onCancel={handleCloseRejectModal}
        footer={null}
        closable={false}
        width={450}
        styles={{ 
          body: { padding: 0 },
          content: { borderRadius: 0, padding: 0 },
          header: { padding: 0 }
        }}
        style={{ top: 100 }}
      >
        <div style={{ 
          background: '#CBB081', 
          padding: '14px 20px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center'
        }}>
          <span style={{ fontWeight: 700, fontSize: '15px', color: '#000', letterSpacing: '0.5px' }}>
            TỪ CHỐI BÁO GIÁ
          </span>
          <CloseOutlined 
            style={{ cursor: 'pointer', color: '#000', fontSize: '16px', fontWeight: 700 }} 
            onClick={handleCloseRejectModal} 
          />
        </div>
        
        <div style={{ padding: '20px 24px', background: '#fff' }}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '13px', color: '#000', marginBottom: '8px' }}>
              Lý do từ chối <span style={{ color: 'red' }}>*</span>
            </label>
            <Input.TextArea 
              rows={4}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Nhập lý do từ chối..."
              style={{ 
                fontSize: '13px',
                border: '1px solid #D9D9D9'
              }} 
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <Button 
              onClick={handleCloseRejectModal}
              style={{
                background: '#fff',
                borderColor: '#D9D9D9',
                color: '#111',
                fontWeight: 600,
                height: '38px',
                minWidth: '100px',
                fontSize: '13px'
              }}
            >
              Hủy
            </Button>
            <Button 
              type="primary"
              onClick={handleRejectQuotation}
              style={{
                background: '#DC2626',
                borderColor: '#DC2626',
                fontWeight: 600,
                height: '38px',
                minWidth: '100px',
                fontSize: '13px',
                boxShadow: 'none'
              }}
            >
              Xác nhận
            </Button>
          </div>
        </div>
      </Modal>

     
      <Modal
        open={noteModalOpen}
        onCancel={() => setNoteModalOpen(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setNoteModalOpen(false)}>
            Đóng
          </Button>
        ]}
        title="Ghi chú kho"
        destroyOnClose
        width={420}
      >
        <div style={{ fontSize: 14, lineHeight: 1.6, color: '#111' }}>
          {noteModalContent || 'Chưa có lưu ý'}
        </div>
      </Modal>
    </AdminLayout>
  )
}

