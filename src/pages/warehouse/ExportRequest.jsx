import React, { useState, useEffect } from 'react'
import { Table, Input, Space, Button, Tag, message, Modal, Form, Select, Checkbox, Dropdown, Spin } from 'antd'
import { SearchOutlined, CalendarOutlined, DownOutlined, UpOutlined, InboxOutlined, CloseOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import WarehouseLayout from '../../layouts/WarehouseLayout'
import { goldTableHeader } from '../../utils/tableComponents'
import { priceQuotationAPI, partCategoriesAPI, marketsAPI, suppliersAPI, unitsAPI, vehiclesAPI, partsAPI } from '../../services/api'
import '../../styles/pages/warehouse/export-list.css'

const { Search } = Input
const { Option } = Select

// Custom styles for table header matching Figma
const customTableStyles = `
  .export-request-table .ant-table-thead > tr > th {
    background: #CBB081 !important;
    color: #111 !important;
    font-weight: 700 !important;
    font-size: 15px !important;
    border: none !important;
    padding: 14px 16px !important;
  }
  
  .export-request-table .ant-table-thead > tr > th::before {
    display: none !important;
  }
  
  .export-request-table .ant-table-tbody > tr > td {
    padding: 12px 16px !important;
    font-size: 14px !important;
  }
  
  .export-request-table .ant-table-row {
    border-bottom: 1px solid #f0f0f0;
  }
`

export default function ExportRequest() {
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState(null)
  const [statusFilter, setStatusFilter] = useState('Tất cả')
  const [expandedRowKeys, setExpandedRowKeys] = useState([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [exportRequests, setExportRequests] = useState([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [confirmModalOpen, setConfirmModalOpen] = useState(false)
  const [selectedPart, setSelectedPart] = useState(null)
  const [confirmForm] = Form.useForm()
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [selectedQuotationId, setSelectedQuotationId] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [categories, setCategories] = useState([])
  const [markets, setMarkets] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [units, setUnits] = useState([])
  const [brands, setBrands] = useState([])
  const [models, setModels] = useState([])
  const [selectedBrandId, setSelectedBrandId] = useState(null)
  const [loadingOptions, setLoadingOptions] = useState(false)
  const [partDetailLoading, setPartDetailLoading] = useState(false)
  // specialPart: đúng theo field backend. Rule hiện tại:
  // - part == null  => được sửa hết (create)
  // - part != null & specialPart == false => KHÓA hết trường trừ ghi chú (update bằng dữ liệu cũ)
  // - part != null & specialPart == true  => được sửa hết (update linh kiện đặc biệt)
  const [partModalConfig, setPartModalConfig] = useState({ hasPart: false, specialPart: false })

  // Có part & specialPart == false  => !hasPart(false) || !specialPart(true) = false  => khóa fields
  // Có part & specialPart == true   => !hasPart(false) || !specialPart(false) = true => mở fields
  // Không có part                   => !hasPart(true)  || ... = true                 => mở fields
  const canEditPartFields = !partModalConfig.hasPart || partModalConfig.specialPart

  // Fetch data from API
  useEffect(() => {
    fetchPendingQuotations()
    fetchOptions()
  }, [page, pageSize])

  const fetchOptions = async () => {
    setLoadingOptions(true)
    try {
      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await partCategoriesAPI.getAll()
      if (!categoriesError && categoriesData?.result) {
        setCategories(Array.isArray(categoriesData.result) ? categoriesData.result : [])
      } else if (!categoriesError && Array.isArray(categoriesData)) {
        setCategories(categoriesData)
      }

      // Fetch markets
      const { data: marketsData, error: marketsError } = await marketsAPI.getAll()
      if (!marketsError && marketsData?.result) {
        setMarkets(Array.isArray(marketsData.result) ? marketsData.result : [])
      } else if (!marketsError && Array.isArray(marketsData)) {
        setMarkets(marketsData)
      }

      // Fetch suppliers (fetch all pages)
      const allSuppliers = []
      let currentPage = 0
      let hasMore = true
      while (hasMore) {
        const { data: suppliersData, error: suppliersError } = await suppliersAPI.getAll(currentPage, 20)
        if (suppliersError) break
        
        // Handle different response structures
        let suppliersList = []
        if (suppliersData?.result?.content) {
          suppliersList = suppliersData.result.content
        } else if (suppliersData?.content) {
          suppliersList = suppliersData.content
        } else if (suppliersData?.result && Array.isArray(suppliersData.result)) {
          suppliersList = suppliersData.result
        } else if (Array.isArray(suppliersData)) {
          suppliersList = suppliersData
        }
        
        allSuppliers.push(...suppliersList)
        
        // Check if last page
        const isLast = suppliersData?.result?.last ?? suppliersData?.last ?? suppliersList.length < 20
        if (isLast) {
          hasMore = false
        } else {
          currentPage += 1
        }
      }
      setSuppliers(allSuppliers)

      // Fetch units
      const { data: unitsData, error: unitsError } = await unitsAPI.getAll({ page: 0, size: 100 })
      if (!unitsError && unitsData?.result?.content) {
        setUnits(unitsData.result.content)
      } else if (!unitsError && unitsData?.result && Array.isArray(unitsData.result)) {
        setUnits(unitsData.result)
      } else if (!unitsError && Array.isArray(unitsData)) {
        setUnits(unitsData)
      }

      // Fetch brands
      const { data: brandsData, error: brandsError } = await vehiclesAPI.getBrands()
      if (!brandsError && brandsData?.result) {
        setBrands(Array.isArray(brandsData.result) ? brandsData.result : [])
      } else if (!brandsError && Array.isArray(brandsData)) {
        setBrands(brandsData)
      }
    } catch (err) {
      console.error('Error fetching options:', err)
    } finally {
      setLoadingOptions(false)
    }
  }

  const fetchModelsByBrand = async (brandId) => {
    if (!brandId) {
      setModels([])
      return []
    }
    try {
      const { data: modelsData, error: modelsError } = await vehiclesAPI.getModelsByBrand(brandId)
      let list = []
      if (!modelsError && modelsData?.result) {
        list = Array.isArray(modelsData.result) ? modelsData.result : []
      } else if (!modelsError && Array.isArray(modelsData)) {
        list = modelsData
      } else {
        list = []
      }
      setModels(list)
      return list
    } catch (err) {
      console.error('Error fetching models:', err)
      setModels([])
      return []
    }
  }

  const fetchPendingQuotations = async () => {
    setLoading(true)
    try {
      const { data, error } = await priceQuotationAPI.getPending(page - 1, pageSize)
      
      if (error) {
        message.error('Không thể tải danh sách báo giá')
        setLoading(false)
        return
      }

      const result = data?.result || {}
      const content = result.content || []
      
      // Transform API data to match UI structure
      const transformedData = content.map((item) => ({
        id: item.priceQuotationId || item.id,
        code: item.code || item.serviceTicketCode || 'N/A',
        customer: item.customerName || 'N/A',
        licensePlate: item.licensePlate || 'N/A',
        createDate: item.createdAt || 'N/A',
        status: mapQuotationStatus(item.status),
        statusKey: item.status, // Lưu status gốc từ API
        parts: (item.items || []).map((partItem) => ({
          id: partItem.priceQuotationItemId || partItem.partId || partItem.part?.partId,
          name: partItem.partName || partItem.itemName || partItem.part?.name || 'N/A',
          sku: partItem.sku
            || partItem.partSku
            || partItem.skuCode
            || partItem.partCode
            || partItem.part?.sku
            || '',
          quantity: partItem.quantity || 0,
          itemType: partItem.itemType || 'PART',
          inventoryStatus: partItem.inventoryStatus || 'AVAILABLE',
          warehouseReviewStatus: partItem.warehouseReviewStatus || 'PENDING',
          warehouseNote: partItem.warehouseNote || ''
        }))
      }))

      setExportRequests(transformedData)
      setTotal(result.totalElements || 0)
    } catch (err) {
      console.error('Failed to fetch pending quotations:', err)
      message.error('Đã xảy ra lỗi khi tải dữ liệu')
    } finally {
      setLoading(false)
    }
  }

  const mapQuotationStatus = (status) => {
    const statusMap = {
      'DRAFT': 'Chờ xác nhận',
      'WAITING_WAREHOUSE_CONFIRM': 'Chờ xác nhận',
      'WAREHOUSE_CONFIRMED': 'Xác nhận',
      'WAITING_CUSTOMER_CONFIRM': 'Chờ khách xác nhận',
      'CUSTOMER_CONFIRMED': 'Hoàn thành',
      'CUSTOMER_REJECTED': 'Từ chối',
      'COMPLETED': 'Hoàn thành'
    }
    return statusMap[status] || 'Chờ xác nhận'
  }

  // Sample data removed, using API data instead

  const getStatusConfig = (status) => {
    if (status === 'Xác nhận' || status === 'Hoàn thành') {
      return { 
        color: '#16a34a', 
        bgColor: '#dcfce7',
        borderColor: '#86efac',
        text: status 
      }
    }
    if (status === 'Chờ xác nhận') {
      return { 
        color: '#2563eb', 
        bgColor: '#dbeafe',
        borderColor: '#93c5fd',
        text: status 
      }
    }
    if (status === 'Chờ khách xác nhận') {
      return { 
        color: '#7c3aed', 
        bgColor: '#ede9fe',
        borderColor: '#c4b5fd',
        text: status 
      }
    }
    return { 
      color: '#666', 
      bgColor: '#f3f4f6',
      borderColor: '#d1d5db',
      text: status 
    }
  }

  const getInventoryStatusText = (status) => {
    const statusMap = {
      'AVAILABLE': 'Có hàng',
      'OUT_OF_STOCK': 'Hết hàng',
      'LOW_STOCK': 'Sắp hết',
      'UNKNOWN': 'Không rõ'
    }
    return statusMap[status] || 'Không rõ'
  }

  const handleOpenConfirmModal = async (part) => {
    if (!part?.id) {
      message.error('Không tìm thấy thông tin mục báo giá')
      return
    }

    setConfirmModalOpen(true)
    setPartDetailLoading(true)
    setSelectedBrandId(null)
    setModels([])

    try {
      const { data, error } = await priceQuotationAPI.getItemById(part.id)

      if (error) {
        message.error(error || 'Không thể tải thông tin linh kiện')
        handleCloseConfirmModal()
        return
      }

      const detail = data?.result || data || {}
      const partInfo = detail.part || {}

      let extendedPart = partInfo
      if (partInfo?.partId) {
        try {
          const { data: partDetail, error: partError } = await partsAPI.getById(partInfo.partId)
          if (!partError && partDetail) {
            extendedPart = partDetail?.result || partDetail || partInfo
          }
        } catch (err) {
          console.warn('Không thể lấy chi tiết linh kiện:', err)
        }
      }

      const hasExistingPart = !!extendedPart && Object.keys(extendedPart).length > 0
      const specialPart = hasExistingPart ? Boolean(extendedPart.specialPart) : false
      setPartModalConfig({
        hasPart: hasExistingPart,
        specialPart
      })

      const inventoryStatusText = getInventoryStatusText(detail.inventoryStatus || part.inventoryStatus)
      const useForAllModelsValue = hasExistingPart
        ? (typeof extendedPart.universal === 'boolean'
            ? extendedPart.universal
            : typeof partInfo.universal === 'boolean'
              ? partInfo.universal
              : true)
        : true

      let brandValue = ''
      let modelValue = ''
      let modelsList = []

      const resolveBrandIdFromName = (brandName) => {
        if (!brandName) return ''
        const matched = brands.find(
          (b) => (b.name || '').toLowerCase() === brandName.toLowerCase()
        )
        return matched ? String(matched.id) : ''
      }

      if (hasExistingPart && !useForAllModelsValue) {
        const brandIdFromPart = extendedPart.brandId || extendedPart.vehicleBrandId || partInfo.brandId
        const brandNameFromPart = extendedPart.brandName || partInfo.brandName
        const modelIdFromPart = extendedPart.modelId || extendedPart.vehicleModelId || partInfo.modelId
        const modelNameFromPart = extendedPart.modelName || partInfo.modelName

        brandValue = brandIdFromPart ? String(brandIdFromPart) : resolveBrandIdFromName(brandNameFromPart)

        if (brandValue) {
          setSelectedBrandId(Number(brandValue))
          modelsList = await fetchModelsByBrand(brandValue)
        } else {
          setSelectedBrandId(null)
          setModels([])
        }

        if (modelIdFromPart) {
          modelValue = String(modelIdFromPart)
        } else if (modelNameFromPart && Array.isArray(modelsList)) {
          const matchedModel = modelsList.find(
            (m) => (m.name || m.modelName || '').toLowerCase() === modelNameFromPart.toLowerCase()
          )
          if (matchedModel) {
            modelValue = String(matchedModel.id)
          }
        }
      } else {
        setSelectedBrandId(null)
        setModels([])
      }

      const normalizedPart = {
        ...part,
        ...detail,
        id: detail.priceQuotationItemId || part.id,
        inventoryStatus: detail.inventoryStatus || part.inventoryStatus
      }

      setSelectedPart(normalizedPart)

      confirmForm.setFieldsValue({
        partName: detail.itemName || extendedPart.name || part.name || '',
        category: extendedPart.categoryName || '',
        origin: extendedPart.marketName || '',
        supplier: extendedPart.supplierName || '',
        sellPrice: extendedPart.purchasePrice ?? '',
        buyPrice: extendedPart.sellingPrice ?? '',
        unit: extendedPart.unitName || detail.unit || '',
        useForAllModels: useForAllModelsValue,
        inventoryStatus: inventoryStatusText,
        quantity: detail.quantity || part.quantity || '',
        note: detail.warehouseNote || '',
        brand: brandValue || '',
        model: modelValue || ''
      })
    } catch (err) {
      console.error('Error fetching quotation item detail:', err)
      message.error('Đã xảy ra lỗi khi lấy thông tin linh kiện')
      handleCloseConfirmModal()
    } finally {
      setPartDetailLoading(false)
    }
  }

  const handleConfirmSubmit = async (values) => {
    if (!selectedPart?.id) {
      message.error('Không tìm thấy thông tin linh kiện')
      return
    }

    try {
      // Map category name to ID
      const categoryId = values.category 
        ? (categories.find(cat => cat.name === values.category || cat.id === Number(values.category))?.id || 0)
        : 0

      // Map market/origin name to ID
      const marketId = values.origin
        ? (markets.find(m => m.name === values.origin || m.id === Number(values.origin))?.id || 0)
        : 0

      // Map supplier name to ID
      const supplierId = values.supplier
        ? (suppliers.find(s => s.name === values.supplier || s.id === Number(values.supplier))?.id || 0)
        : 0

      // Map unit name to ID
      const unitId = values.unit
        ? (units.find(u => u.name === values.unit || u.id === Number(values.unit))?.id || 0)
        : 0

      // Map brand to ID
      const brandId = values.brand
        ? (Number(values.brand) || brands.find(b => b.id === Number(values.brand))?.id || 0)
        : 0

      // Map model to ID
      const vehicleModelId = values.model
        ? (Number(values.model) || models.find(m => m.id === Number(values.model))?.id || 0)
        : 0

      const payload = {
        brandId,
        categoryId,
        marketId,
        name: values.partName || '',
        note: values.note || '',
        purchasePrice: Number(values.sellPrice) || 0,
        sellingPrice: Number(values.buyPrice) || 0,
        specialPart: partModalConfig.specialPart || false,
        supplierId,
        unitId,
        universal: values.useForAllModels || false,
        vehicleModelId,
        warehouseNote: values.note || ''
      }

      let response
      // part == null  => create mới Part
      if (!partModalConfig.hasPart) {
        response = await priceQuotationAPI.confirmCreateItem(selectedPart.id, payload)
      }
      // part != null & specialPart == true  => cập nhật Part theo payload
      else if (partModalConfig.specialPart) {
        response = await priceQuotationAPI.confirmItemUpdate(selectedPart.id, payload)
      }
      // part != null & specialPart == false => chỉ confirm, merge dữ liệu Part sẵn có, gửi note
      else {
        const note = values.note || ''
        response = await priceQuotationAPI.confirmItem(selectedPart.id, note)
      }

      const { error } = response || {}

      if (error) {
        message.error(error || 'Không thể xác nhận linh kiện')
        return
      }

      message.success('Duyệt linh kiện thành công')
      setConfirmModalOpen(false)
      confirmForm.resetFields()
      setSelectedPart(null)
      setSelectedBrandId(null)
      setModels([])
      setPartModalConfig({ hasPart: false, isSpecialPart: false })
      fetchPendingQuotations()
    } catch (err) {
      console.error('Error confirming part:', err)
      message.error('Đã xảy ra lỗi khi duyệt linh kiện')
    }
  }

  const handleRejectPart = async () => {
    if (!selectedPart?.id) {
      message.error('Không tìm thấy thông tin linh kiện')
      return
    }

    const note = confirmForm.getFieldValue('note')
    if (!note || note.trim() === '') {
      message.error('Vui lòng nhập ghi chú/lý do từ chối')
      return
    }

    try {
      console.log('=== Reject Part ===')
      console.log('Item ID:', selectedPart.id)
      console.log('Reason:', note)
      console.log('===================')

      const { data, error } = await priceQuotationAPI.rejectItem(selectedPart.id, note)

      if (error) {
        message.error(error || 'Không thể từ chối linh kiện')
        return
      }

      message.success('Từ chối linh kiện thành công')
      setConfirmModalOpen(false)
      confirmForm.resetFields()
      setSelectedPart(null)
      setPartModalConfig({ hasPart: false, specialPart: false })
      fetchPendingQuotations()
    } catch (err) {
      console.error('Error rejecting part:', err)
      message.error('Đã xảy ra lỗi khi từ chối linh kiện')
    }
  }

  const handleCloseConfirmModal = () => {
    setConfirmModalOpen(false)
    setSelectedPart(null)
    setSelectedBrandId(null)
    setModels([])
    setPartModalConfig({ hasPart: false, specialPart: false })
    confirmForm.resetFields()
  }

  const handleConfirmQuotation = async (quotationId) => {
    try {
      console.log('=== Confirm Quotation ===')
      console.log('Quotation ID:', quotationId)
      console.log('=======================')
      
      const { data, error } = await priceQuotationAPI.confirmQuotation(quotationId)
      
      if (error) {
        message.error(error || 'Không thể xác nhận báo giá')
        return
      }
      
      message.success('Đã xác nhận khách hàng đã xác nhận báo giá')
      fetchPendingQuotations()
    } catch (err) {
      console.error('Error confirming quotation:', err)
      message.error('Đã xảy ra lỗi khi xác nhận')
    }
  }

  const handleOpenRejectModal = (quotationId) => {
    setSelectedQuotationId(quotationId)
    setRejectReason('')
    setRejectModalOpen(true)
  }

  const handleRejectQuotation = async () => {
    if (!selectedQuotationId) {
      message.error('Không tìm thấy ID báo giá')
      return
    }

    if (!rejectReason || rejectReason.trim() === '') {
      message.error('Vui lòng nhập lý do từ chối')
      return
    }

    try {
      console.log('=== Reject Quotation ===')
      console.log('Quotation ID:', selectedQuotationId)
      console.log('Reason:', rejectReason)
      console.log('========================')
      
      const { data, error } = await priceQuotationAPI.rejectQuotation(selectedQuotationId, rejectReason)
      
      if (error) {
        message.error(error || 'Không thể từ chối báo giá')
        return
      }
      
      message.success('Đã xác nhận khách hàng từ chối báo giá')
      setRejectModalOpen(false)
      setSelectedQuotationId(null)
      setRejectReason('')
      fetchPendingQuotations()
    } catch (err) {
      console.error('Error rejecting quotation:', err)
      message.error('Đã xảy ra lỗi khi từ chối')
    }
  }

  const handleCloseRejectModal = () => {
    setRejectModalOpen(false)
    setSelectedQuotationId(null)
    setRejectReason('')
  }

  // Filter data
  const filteredData = exportRequests
    .filter(item => {
      const matchesSearch = !searchTerm || 
        item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.licensePlate.toLowerCase().includes(searchTerm.toLowerCase())
      
      let matchesDate = true
      if (dateFilter) {
        const filterDate = dateFilter.format('DD/MM/YYYY')
        matchesDate = item.createDate === filterDate
      }
      
      const matchesStatus = statusFilter === 'Tất cả' || item.status === statusFilter
      
      return matchesSearch && matchesDate && matchesStatus
    })
    .map((item, index) => ({ ...item, key: item.id, index: index + 1 }))

  // Main table columns
  const columns = [
    {
      title: 'STT',
      dataIndex: 'index',
      key: 'index',
      width: 80,
      align: 'center',
      render: (_, __, index) => (
        <span style={{ fontWeight: 600, color: '#111' }}>
          {String(index + 1).padStart(2, '0')}
        </span>
      )
    },
    {
      title: 'Mã báo giá',
      dataIndex: 'code',
      key: 'code',
      width: 200,
      render: (text) => (
        <span style={{ fontWeight: 600, color: '#111' }}>{text}</span>
      )
    },
    {
      title: 'Khách hàng',
      dataIndex: 'customer',
      key: 'customer',
      width: 200,
      render: (text) => (
        <span style={{ fontWeight: 500, color: '#111' }}>{text}</span>
      )
    },
    {
      title: 'Biển số xe',
      dataIndex: 'licensePlate',
      key: 'licensePlate',
      width: 150,
      render: (text) => (
        <span style={{ fontWeight: 600, color: '#111', fontFamily: 'monospace' }}>
          {text}
        </span>
      )
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createDate',
      key: 'createDate',
      width: 150,
      render: (text) => (
        <span style={{ fontWeight: 500, color: '#111' }}>{text}</span>
      )
    },
    {
      title: 'Trạng Thái',
      dataIndex: 'status',
      key: 'status',
      width: 280,
      render: (status, record) => {
        const config = getStatusConfig(status)
        const isWaitingCustomerConfirm = record.statusKey === 'WAITING_CUSTOMER_CONFIRM'
        
        const dropdownMenu = {
          items: [
            {
              key: 'confirm',
              label: (
                <span style={{ color: '#16a34a', fontWeight: 500 }}>
                  Khách đã xác nhận
                </span>
              ),
              onClick: () => handleConfirmQuotation(record.id)
            },
            {
              key: 'reject',
              label: (
                <span style={{ color: '#dc2626', fontWeight: 500 }}>
                  Khách từ chối
                </span>
              ),
              onClick: () => handleOpenRejectModal(record.id)
            }
          ]
        }
        
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Tag
            style={{
              color: config.color,
              backgroundColor: config.bgColor,
              borderColor: config.borderColor,
              border: '1px solid',
              borderRadius: '6px',
              padding: '4px 12px',
              fontWeight: 500,
              fontSize: '14px',
              margin: 0
            }}
          >
            {config.text}
          </Tag>
            {isWaitingCustomerConfirm && (
              <Dropdown menu={dropdownMenu} trigger={['click']}>
                <Button
                  type="text"
                  icon={<DownOutlined />}
                  style={{
                    padding: '0 8px',
                    height: 'auto',
                    fontSize: '14px',
                    color: '#666'
                  }}
                />
              </Dropdown>
            )}
          </div>
        )
      }
    }
  ]

  // Nested table columns for parts
  const expandedRowRender = (record) => {
    const partsColumns = [
      {
        title: 'STT',
        key: 'index',
        width: 90,
        align: 'center',
        render: (_, __, index) => (
          <span style={{ fontWeight: 600, color: '#666' }}>
            {String(index + 1).padStart(2, '0')}
          </span>
        )
      },
      {
        title: 'Mã SKU',
        dataIndex: 'sku',
        key: 'sku',
        width: 220,
        render: (text) => (
          <span style={{ fontWeight: 500, color: '#666' }}>{text || '—'}</span>
        )
      },
      {
        title: 'Linh kiện',
        dataIndex: 'name',
        key: 'name',
        width: 260,
        render: (text) => (
          <span style={{ fontWeight: 500, color: '#111' }}>{text}</span>
        )
      },
      {
        title: 'Số lượng',
        dataIndex: 'quantity',
        key: 'quantity',
        width: 160,
        align: 'center',
        render: (value) => (
          <span style={{ fontWeight: 600, color: '#666' }}>
            {value}
          </span>
        )
      },
      {
        title: 'Hành động',
        key: 'action',
        width: 170,
        align: 'center',
        render: (_, part) => {
          // Chỉ hiện nút khi status là PENDING
          if (part.warehouseReviewStatus === 'PENDING') {
            return (
            <Button
              type="primary"
              size="small"
                onClick={() => handleOpenConfirmModal(part)}
              style={{
                background: '#22c55e',
                borderColor: '#22c55e',
                fontWeight: 500,
                borderRadius: '6px',
                height: '32px'
              }}
            >
              Xác nhận
            </Button>
        )
          }
          return <span style={{ color: '#999' }}>—</span>
        }
      }
    ]

    return (
      <div style={{ 
        background: 'linear-gradient(to bottom, #fafafa 0%, #fff 100%)',
        padding: '20px 24px',
        margin: '12px 0',
        borderRadius: '10px',
        border: '1px solid #e5e7eb',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px',
          marginBottom: '16px',
          paddingBottom: '12px',
          borderBottom: '2px solid #f0f0f0'
        }}>
          <InboxOutlined style={{ color: '#1677ff', fontSize: '16px' }} />
          <span style={{ 
            fontWeight: 600, 
            fontSize: '15px', 
            color: '#111' 
          }}>
            Danh sách linh kiện ({record.parts?.length || 0})
          </span>
        </div>
        <Table
          className="nested-parts-table"
          columns={partsColumns}
          dataSource={record.parts || []}
          pagination={false}
          size="middle"
          components={goldTableHeader}
          rowKey="id"
          style={{ background: '#fff' }}
          rowClassName={(record, index) => 
            index % 2 === 0 ? 'parts-row-even' : 'parts-row-odd'
          }
        />
      </div>
    )
  }

  return (
    <WarehouseLayout>
      <style>{customTableStyles}</style>
      
      {/* Modal Chi tiết linh kiện */}
      <Modal
        open={confirmModalOpen}
        onCancel={handleCloseConfirmModal}
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
        {/* Header */}
        <div style={{ 
          background: '#CBB081', 
          padding: '14px 20px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center'
        }}>
          <span style={{ fontWeight: 700, fontSize: '15px', color: '#000', letterSpacing: '0.5px' }}>
            CHI TIẾT LINH KIỆN
          </span>
          <CloseOutlined 
            style={{ cursor: 'pointer', color: '#000', fontSize: '16px', fontWeight: 700 }} 
            onClick={handleCloseConfirmModal} 
          />
        </div>
        
        <div style={{ padding: '20px 24px', background: '#fff' }}>
          <Spin spinning={partDetailLoading}>
          <Form form={confirmForm} layout="vertical" onFinish={handleConfirmSubmit}>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '14px' }}>
              <Form.Item 
                label={<span style={{ fontWeight: 600, fontSize: '13px', color: '#000' }}>Trạng thái</span>} 
                name="inventoryStatus"
                style={{ flex: 1, marginBottom: 0 }}
              >
                <Input 
                  disabled 
                  style={{ 
                    background: '#F5F5F5', 
                    height: '38px',
                    fontSize: '13px',
                    border: '1px solid #D9D9D9',
                    color: '#000'
                  }} 
                />
              </Form.Item>

              <Form.Item 
                label={<span style={{ fontWeight: 600, fontSize: '13px', color: '#000' }}>Số lượng {canEditPartFields && <span style={{ color: 'red' }}>*</span>}</span>} 
                name="quantity"
                rules={canEditPartFields ? [{ required: true, message: 'Vui lòng nhập số lượng' }] : []}
                style={{ width: '150px', marginBottom: 0 }}
              >
                <Input 
                  type="number"
                  placeholder="0"
                  disabled={!canEditPartFields}
                  style={{ 
                    height: '38px',
                    fontSize: '13px',
                    border: '1px solid #D9D9D9',
                    background: canEditPartFields ? '#fff' : '#f5f5f5'
                  }} 
                />
              </Form.Item>
            </div>

            <>
              <Form.Item 
                label={<span style={{ fontWeight: 600, fontSize: '13px', color: '#000' }}>Tên linh kiện {canEditPartFields && <span style={{ color: 'red' }}>*</span>}</span>} 
                name="partName"
                rules={canEditPartFields ? [{ required: true, message: 'Vui lòng nhập tên linh kiện' }] : []}
                style={{ marginBottom: '14px' }}
              >
                <Input 
                  disabled={!canEditPartFields}
                  style={{ 
                    background: canEditPartFields ? '#fff' : '#F5F5F5', 
                    height: '38px',
                    fontSize: '13px',
                    border: '1px solid #D9D9D9'
                  }} 
                />
              </Form.Item>

              <Form.Item 
                label={<span style={{ fontWeight: 600, fontSize: '13px', color: '#000' }}>Loại linh kiện {canEditPartFields && <span style={{ color: 'red' }}>*</span>}</span>} 
                name="category"
                rules={canEditPartFields ? [{ required: true, message: 'Vui lòng chọn loại linh kiện' }] : []}
                style={{ marginBottom: '14px' }}
              >
                <select
                  disabled={!canEditPartFields}
                  style={{
                    width: '100%',
                    height: '32px',
                    padding: '4px 12px',
                    fontSize: '13px',
                    border: '1px solid #d9d9d9',
                    borderRadius: '6px',
                    backgroundColor: !canEditPartFields ? '#f5f5f5' : '#fff',
                    cursor: !canEditPartFields ? 'not-allowed' : 'pointer',
                    outline: 'none',
                    color: '#262626'
                  }}
                >
                  <option value="">Chọn loại linh kiện</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </Form.Item>

              <Form.Item 
                label={<span style={{ fontWeight: 600, fontSize: '13px', color: '#000' }}>Xuất xứ {canEditPartFields && <span style={{ color: 'red' }}>*</span>}</span>} 
                name="origin"
                rules={canEditPartFields ? [{ required: true, message: 'Vui lòng chọn xuất xứ' }] : []}
                style={{ marginBottom: '14px' }}
              >
                <select
                  disabled={!canEditPartFields}
                  style={{
                    width: '100%',
                    height: '32px',
                    padding: '4px 12px',
                    fontSize: '13px',
                    border: '1px solid #d9d9d9',
                    borderRadius: '6px',
                    backgroundColor: !canEditPartFields ? '#f5f5f5' : '#fff',
                    cursor: !canEditPartFields ? 'not-allowed' : 'pointer',
                    outline: 'none',
                    color: '#262626'
                  }}
                >
                  <option value="">Chọn xuất xứ</option>
                  {markets.map((market) => (
                    <option key={market.id} value={market.name}>
                      {market.name}
                    </option>
                  ))}
                </select>
              </Form.Item>

              <Form.Item name="useForAllModels" valuePropName="checked" style={{ marginBottom: '14px' }}>
                <Checkbox disabled={!canEditPartFields} style={{ fontSize: '13px', color: '#000' }}>
                  <span style={{ fontWeight: 400 }}>Dùng chung tất cả dòng xe</span>
                </Checkbox>
              </Form.Item>
            </>

            {/* Conditional fields based on useForAllModels and status */}
            <Form.Item noStyle shouldUpdate>
              {({ getFieldValue }) => {
                const useForAllModels = getFieldValue('useForAllModels')
                const inventoryStatus = getFieldValue('inventoryStatus')
                const isUnknownStatus = canEditPartFields
                
                if (!useForAllModels) {
                  return (
                    <>
                      <Form.Item 
                        label={<span style={{ fontWeight: 600, fontSize: '13px', color: '#000' }}>Hãng {isUnknownStatus && <span style={{ color: 'red' }}>*</span>}</span>} 
                        name="brand"
                        rules={isUnknownStatus ? [{ required: true, message: 'Vui lòng chọn hãng' }] : []}
                        style={{ marginBottom: '14px' }}
                      >
                        <select
                          disabled={!isUnknownStatus}
                          style={{
                            width: '100%',
                            height: '32px',
                            padding: '4px 12px',
                            fontSize: '13px',
                            border: '1px solid #d9d9d9',
                            borderRadius: '6px',
                            backgroundColor: !isUnknownStatus ? '#f5f5f5' : '#fff',
                            cursor: !isUnknownStatus ? 'not-allowed' : 'pointer',
                            outline: 'none',
                            color: '#262626'
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = '#3b82f6'
                            e.target.style.boxShadow = '0 0 0 2px rgba(59,130,246,0.15)'
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = '#d9d9d9'
                            e.target.style.boxShadow = 'none'
                          }}
                          onChange={(e) => {
                            const brandId = e.target.value ? Number(e.target.value) : null
                            setSelectedBrandId(brandId)
                            confirmForm.setFieldsValue({ model: '' })
                            if (brandId) {
                              fetchModelsByBrand(brandId)
                            } else {
                              setModels([])
                            }
                          }}
                        >
                          <option value="">Chọn hãng</option>
                          {brands.map((brand) => (
                            <option key={brand.id} value={brand.id}>
                              {brand.name}
                            </option>
                          ))}
                        </select>
                      </Form.Item>
                      
                      <Form.Item 
                        label={<span style={{ fontWeight: 600, fontSize: '13px', color: '#000' }}>Dòng xe {isUnknownStatus && <span style={{ color: 'red' }}>*</span>}</span>} 
                        name="model"
                        rules={isUnknownStatus ? [{ required: true, message: 'Vui lòng chọn dòng xe' }] : []}
                        style={{ marginBottom: '14px' }}
                      >
                        <select
                          disabled={!isUnknownStatus || !selectedBrandId || models.length === 0}
                          style={{
                            width: '100%',
                            height: '32px',
                            padding: '4px 12px',
                            fontSize: '13px',
                            border: '1px solid #d9d9d9',
                            borderRadius: '6px',
                            backgroundColor: !isUnknownStatus || !selectedBrandId || models.length === 0 ? '#f5f5f5' : '#fff',
                            cursor: !isUnknownStatus || !selectedBrandId || models.length === 0 ? 'not-allowed' : 'pointer',
                            outline: 'none',
                            color: '#262626'
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = '#3b82f6'
                            e.target.style.boxShadow = '0 0 0 2px rgba(59,130,246,0.15)'
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = '#d9d9d9'
                            e.target.style.boxShadow = 'none'
                          }}
                        >
                          <option value="">
                            {!selectedBrandId ? 'Chọn hãng trước' : models.length === 0 ? 'Đang tải...' : 'Chọn dòng xe'}
                          </option>
                          {models.map((model) => (
                            <option key={model.id} value={model.id}>
                              {model.name}
                            </option>
                          ))}
                        </select>
                      </Form.Item>
                    </>
                  )
                }
                return null
              }}
            </Form.Item>

            <Form.Item noStyle shouldUpdate>
              {({ getFieldValue }) => {
                const inventoryStatus = getFieldValue('inventoryStatus')
                const isUnknownStatus = canEditPartFields
                
                return (
                  <Form.Item 
                    label={<span style={{ fontWeight: 600, fontSize: '13px', color: '#000' }}>Nhà phân phối {isUnknownStatus && <span style={{ color: 'red' }}>*</span>}</span>} 
                    name="supplier"
                    rules={isUnknownStatus ? [{ required: true, message: 'Vui lòng chọn nhà phân phối' }] : []}
                    style={{ marginBottom: '14px' }}
                  >
                    <select
                      disabled={!isUnknownStatus}
                      style={{
                        width: '100%',
                        height: '32px',
                        padding: '4px 12px',
                        fontSize: '13px',
                        border: '1px solid #d9d9d9',
                        borderRadius: '6px',
                        backgroundColor: !isUnknownStatus ? '#f5f5f5' : '#fff',
                        cursor: !isUnknownStatus ? 'not-allowed' : 'pointer',
                        outline: 'none',
                        color: '#262626'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#3b82f6'
                        e.target.style.boxShadow = '0 0 0 2px rgba(59,130,246,0.15)'
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#d9d9d9'
                        e.target.style.boxShadow = 'none'
                      }}
                    >
                      <option value="">Chọn nhà phân phối</option>
                      {suppliers.map((supplier) => (
                        <option key={supplier.id} value={supplier.name}>
                          {supplier.name}
                        </option>
                      ))}
                    </select>
                  </Form.Item>
                )
              }}
            </Form.Item>

            <div style={{ display: 'flex', gap: '12px', marginBottom: '14px' }}>
              <Form.Item 
                label={<span style={{ fontWeight: 600, fontSize: '13px', color: '#000' }}>Giá nhập <span style={{ color: 'red' }}>*</span></span>} 
                name="sellPrice" 
                rules={[{ required: true, message: 'Vui lòng nhập giá nhập' }]}
                style={{ flex: 1, marginBottom: 0 }}
              >
                <Input 
                  type="number"
                  suffix={<span style={{ fontSize: '12px', color: '#999' }}>/ vnd</span>} 
                  style={{ 
                    height: '38px',
                    fontSize: '13px',
                    border: '1px solid #D9D9D9'
                  }} 
                />
              </Form.Item>
              
              <Form.Item 
                label={<span style={{ fontWeight: 600, fontSize: '13px', color: '#000' }}>Giá bán <span style={{ color: 'red' }}>*</span></span>} 
                name="buyPrice" 
                rules={[{ required: true, message: 'Vui lòng nhập giá bán' }]}
                style={{ flex: 1, marginBottom: 0 }}
              >
                <Input 
                  type="number"
                  suffix={<span style={{ fontSize: '12px', color: '#999' }}>/ vnd</span>} 
                  style={{ 
                    height: '38px',
                    fontSize: '13px',
                    border: '1px solid #D9D9D9'
                  }} 
                />
              </Form.Item>
            </div>

            <Form.Item noStyle shouldUpdate>
              {({ getFieldValue }) => {
                const inventoryStatus = getFieldValue('inventoryStatus')
                const isUnknownStatus = canEditPartFields
                
                return (
                  <Form.Item 
                    label={<span style={{ fontWeight: 600, fontSize: '13px', color: '#000' }}>Đơn vị {isUnknownStatus && <span style={{ color: 'red' }}>*</span>}</span>} 
                    name="unit"
                    rules={isUnknownStatus ? [{ required: true, message: 'Vui lòng chọn đơn vị' }] : []}
                    style={{ marginBottom: '14px' }}
                  >
                    <select
                      disabled={!isUnknownStatus}
                      style={{
                        width: '100px',
                        height: '32px',
                        padding: '4px 12px',
                        fontSize: '13px',
                        border: '1px solid #d9d9d9',
                        borderRadius: '6px',
                        backgroundColor: !isUnknownStatus ? '#f5f5f5' : '#fff',
                        cursor: !isUnknownStatus ? 'not-allowed' : 'pointer',
                        outline: 'none',
                        color: '#262626'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#3b82f6'
                        e.target.style.boxShadow = '0 0 0 2px rgba(59,130,246,0.15)'
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#d9d9d9'
                        e.target.style.boxShadow = 'none'
                      }}
                    >
                      <option value="">Chọn đơn vị</option>
                      {units.map((unit) => (
                        <option key={unit.id} value={unit.name}>
                          {unit.name}
                        </option>
                      ))}
                    </select>
                  </Form.Item>
                )
              }}
            </Form.Item>

            <Form.Item 
              label={
                <span style={{ fontWeight: 600, fontSize: '13px', color: '#000' }}>
                  Ghi chú/Lý do <span style={{ color: 'red' }}>*</span>
                </span>
              } 
              name="note"
              rules={[{ required: true, message: 'Vui lòng nhập ghi chú' }]}
              style={{ marginBottom: '18px' }}
            >
              <Input.TextArea 
                rows={3} 
                placeholder="khả năng nhập" 
                style={{ 
                  fontSize: '13px',
                  border: '1px solid #D9D9D9'
                }} 
              />
            </Form.Item>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <Button 
                onClick={handleRejectPart}
                style={{
                  background: '#DC2626',
                  borderColor: '#DC2626',
                  color: '#fff',
                  fontWeight: 600,
                  height: '38px',
                  minWidth: '100px',
                  fontSize: '13px',
                  boxShadow: 'none'
                }}
              >
                Từ chối
              </Button>
              <Button 
                type="primary"
                htmlType="submit"
                style={{
                  background: '#16A34A',
                  borderColor: '#16A34A',
                  fontWeight: 600,
                  height: '38px',
                  minWidth: '100px',
                  fontSize: '13px',
                  boxShadow: 'none'
                }}
              >
                Duyệt
              </Button>
            </div>
          </Form>
          </Spin>
        </div>
      </Modal>

      {/* Modal Từ chối báo giá */}
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

      <div style={{ padding: '24px', minHeight: '100vh' }}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, marginBottom: '20px' }}>
            Xác nhận báo giá
          </h1>

          <div
            style={{
              display: 'flex',
              gap: '16px',
              marginBottom: '20px',
              flexWrap: 'wrap',
              alignItems: 'center'
            }}
          >
            <Space wrap>
              <Button
                type={statusFilter === 'Đang xuất hàng' ? 'primary' : 'default'}
                onClick={() => setStatusFilter('Đang xuất hàng')}
                style={{
                  background: statusFilter === 'Đang xuất hàng' ? '#CBB081' : '#fff',
                  borderColor: statusFilter === 'Đang xuất hàng' ? '#CBB081' : '#e6e6e6',
                  color: statusFilter === 'Đang xuất hàng' ? '#111' : '#666',
                  fontWeight: 600
                }}
              >
                Đang xuất hàng
              </Button>
              <Button
                type={statusFilter === 'Hoàn thành' ? 'primary' : 'default'}
                onClick={() => setStatusFilter('Hoàn thành')}
                style={{
                  background: statusFilter === 'Hoàn thành' ? '#CBB081' : '#fff',
                  borderColor: statusFilter === 'Hoàn thành' ? '#CBB081' : '#e6e6e6',
                  color: statusFilter === 'Hoàn thành' ? '#111' : '#666',
                  fontWeight: 600
                }}
              >
                Hoàn thành
              </Button>
              <Button
                type={statusFilter === 'Tất cả' ? 'primary' : 'default'}
                onClick={() => setStatusFilter('Tất cả')}
                style={{
                  background: statusFilter === 'Tất cả' ? '#CBB081' : '#fff',
                  borderColor: statusFilter === 'Tất cả' ? '#CBB081' : '#e6e6e6',
                  color: statusFilter === 'Tất cả' ? '#111' : '#666',
                  fontWeight: 600
                }}
              >
                Tất cả
              </Button>
            </Space>
            <div
              style={{
                marginLeft: 'auto',
                display: 'flex',
                gap: '12px',
                alignItems: 'center',
                flexWrap: 'wrap'
              }}
            >
              <div style={{ position: 'relative', width: 150 }}>
                <input
                  type="date"
                  value={dateFilter ? dayjs(dateFilter).format('YYYY-MM-DD') : ''}
                  onChange={(e) => {
                    const dateValue = e.target.value
                    if (dateValue) {
                      setDateFilter(dayjs(dateValue))
                    } else {
                      setDateFilter(null)
                    }
                  }}
                  style={{
                    width: '100%',
                    height: '32px',
                    padding: '4px 12px',
                    fontSize: '13px',
                    border: '1px solid #d9d9d9',
                    borderRadius: '6px',
                    outline: 'none',
                    color: '#262626'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3b82f6'
                    e.target.style.boxShadow = '0 0 0 2px rgba(59,130,246,0.15)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d9d9d9'
                    e.target.style.boxShadow = 'none'
                  }}
                />
                <CalendarOutlined 
                  style={{ 
                    position: 'absolute', 
                    right: '12px', 
                    top: '50%', 
                    transform: 'translateY(-50%)',
                    color: '#9ca3af',
                    pointerEvents: 'none'
                  }} 
                />
              </div>
              <Search
                placeholder="Tìm kiếm"
                allowClear
                prefix={<SearchOutlined />}
                style={{ width: 250 }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onSearch={setSearchTerm}
              />
            </div>
          </div>
        </div>

        <div style={{ 
          background: '#fff', 
          borderRadius: '12px', 
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <Table
            className="export-request-table"
            columns={columns}
            dataSource={filteredData}
            rowClassName={(record, index) => {
              const isExpanded = expandedRowKeys.includes(record.key?.toString())
              const baseClass = index % 2 === 0 ? 'table-row-even' : 'table-row-odd'
              return isExpanded ? `${baseClass} table-row-expanded` : baseClass
            }}
            expandable={{
              expandedRowRender,
              expandedRowKeys,
              onExpandedRowsChange: setExpandedRowKeys,
              expandIcon: ({ expanded, onExpand, record }) => (
                <Button
                  type="text"
                  icon={expanded ? <UpOutlined /> : <DownOutlined />}
                  onClick={(e) => onExpand(record, e)}
                  style={{ 
                    padding: '4px 8px',
                    width: 'auto',
                    height: 'auto',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: expanded ? '#1677ff' : '#666',
                    fontSize: '16px',
                    fontWeight: 600
                  }}
                />
              ),
              indentSize: 0,
              expandRowByClick: false
            }}
            pagination={{
              current: page,
              pageSize: pageSize,
              total: total,
              showSizeChanger: true,
              showTotal: (total) => `0 of ${total} row(s) selected.`,
              pageSizeOptions: ['10', '20', '50', '100'],
              onChange: (page, pageSize) => {
                setPage(page)
                setPageSize(pageSize)
              },
              onShowSizeChange: (current, size) => {
                setPage(1)
                setPageSize(size)
              }
            }}
            loading={loading}
            size="middle"
            components={goldTableHeader}
          />
        </div>
      </div>
    </WarehouseLayout>
  )
}
