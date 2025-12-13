import React, { useState, useEffect } from 'react'
import { Table, Input, Button, Tag, message, Modal, Select, Checkbox, DatePicker, InputNumber } from 'antd'
import { SearchOutlined, CloseOutlined, CalendarOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import WarehouseLayout from '../../layouts/WarehouseLayout'
import { goldTableHeader } from '../../utils/tableComponents'
import { priceQuotationAPI, partCategoriesAPI, marketsAPI, vehiclesAPI, suppliersAPI } from '../../services/api'

const { Search } = Input
const { Option } = Select

export default function ExportRequest() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('Tất cả') // Đổi từ 'Chờ xác nhận' sang 'Tất cả'
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [quotations, setQuotations] = useState([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [expandedRowKeys, setExpandedRowKeys] = useState([])
  const [dateRange, setDateRange] = useState([null, null])
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedPart, setSelectedPart] = useState(null)
  const [selectedItemId, setSelectedItemId] = useState(null) // Store priceQuotationItemId
  const [modalLoading, setModalLoading] = useState(false)
  const [hasExistingPart, setHasExistingPart] = useState(false) // Track nếu part đã tồn tại
  const [partCategories, setPartCategories] = useState([]) // Danh sách loại linh kiện
  const [markets, setMarkets] = useState([]) // Danh sách xuất xứ
  const [brands, setBrands] = useState([]) // Danh sách hãng xe
  const [carModels, setCarModels] = useState([]) // Danh sách dòng xe theo hãng đã chọn
  const [suppliers, setSuppliers] = useState([]) // Danh sách nhà cung cấp
  const [errors, setErrors] = useState({}) // Lưu lỗi validation cho từng field
  
  // Form state
  const [formData, setFormData] = useState({
    partName: '',
    partType: 'Dầu – Hóa chất',
    origin: 'Motul',
    usedForAllCars: false,
    manufacturer: 'Petrolimex Lubricants',
    brand: 'Vinfast',
    carModel: 'VF3',
    priceImport: '',
    priceSell: '',
    unit: 'lít',
    note: '',
    quantity: 0,
    specialPart: false
  })

  useEffect(() => {
    fetchQuotations()
  }, [page, pageSize])

  const fetchQuotations = async () => {
    setLoading(true)
    
    try {
      const { data, error } = await priceQuotationAPI.getPending(page - 1, pageSize)
      
      console.log('API Response:', { data, error })
      
      if (error) {
        message.error('Không thể tải danh sách báo giá')
        setLoading(false)
        return
      }

      const result = data?.result || {}
      const content = result.content || []
      
      console.log('Content from API:', content)
      
      if (content.length === 0) {
        console.warn('No data returned from API')
      }
      
      const transformedData = content.map((item) => ({
        key: item.priceQuotationId,
        id: item.priceQuotationId,
        code: item.code,
        serviceTicketCode: item.serviceTicketCode,
        licensePlate: item.licensePlate,
        customerName: item.customerName,
        customerPhone: item.customerPhone,
        createdBy: item.createdBy,
        createdAt: item.createdAt || '',
        rawStatus: item.status,
        status: item.status, // Giữ nguyên status, getStatusConfig sẽ xử lý
        estimateAmount: item.estimateAmount,
        discount: item.discount,
        // Map items từ API
        parts: (item.items || []).map(partItem => ({
          id: partItem.priceQuotationItemId,
          sku: partItem.part?.sku || null,
          name: partItem.itemName,
          quantity: partItem.quantity,
          unit: partItem.unit,
          unitPrice: partItem.unitPrice,
          totalPrice: partItem.totalPrice,
          itemType: partItem.itemType,
          inventoryStatus: partItem.inventoryStatus,
          warehouseReviewStatus: partItem.warehouseReviewStatus,
          warehouseNote: partItem.warehouseNote,
          part: partItem.part // null hoặc có object
        }))
      }))

      console.log('Transformed data:', transformedData)
      
      setQuotations(transformedData)
      setTotal(result.totalElements || 0)
      setLoading(false)
    } catch (err) {
      console.error('Failed to fetch quotations:', err)
      message.error('Đã xảy ra lỗi khi tải dữ liệu')
      setLoading(false)
    }

    // Mock data (commented)
    /*
    setTimeout(() => {
      const mockData = [
        {
          priceQuotationId: 1,
          code: 'BG-2025-000001',
          customerName: 'Nguyễn Văn A',
          customerPhone: '0123456789',
          createdBy: 'DT Huyền - 190',
          createdAt: '2025-10-30T00:00:00',
          status: 'PENDING'
        },
        {
          priceQuotationId: 2,
          code: 'BG-2025-000001',
          customerName: 'Nguyễn Văn A',
          customerPhone: '0123456789',
          createdBy: 'DT Huyền - 190',
          createdAt: '2025-10-30T00:00:00',
          status: 'PENDING'
        },
        {
          priceQuotationId: 3,
          code: 'BG-2025-000001',
          customerName: 'Nguyễn Văn A',
          customerPhone: '0123456789',
          createdBy: 'DT Huyền - 190',
          createdAt: '2025-10-30T00:00:00',
          status: 'PENDING'
        },
        {
          priceQuotationId: 4,
          code: 'BG-2025-000001',
          customerName: 'Nguyễn Văn A',
          customerPhone: '0123456789',
          createdBy: 'DT Huyền - 190',
          createdAt: '2025-10-30T00:00:00',
          status: 'PENDING'
        },
        {
          priceQuotationId: 5,
          code: 'BG-2025-000001',
          customerName: 'Nguyễn Văn A',
          customerPhone: '0123456789',
          createdBy: 'DT Huyền - 190',
          createdAt: '2025-10-30T00:00:00',
          status: 'CONFIRMED'
        },
        {
          priceQuotationId: 6,
          code: 'BG-2025-000001',
          customerName: 'Nguyễn Văn A',
          customerPhone: '0123456789',
          createdBy: 'DT Huyền - 190',
          createdAt: '2025-10-30T00:00:00',
          status: 'CONFIRMED'
        },
        {
          priceQuotationId: 7,
          code: 'BG-2025-000001',
          customerName: 'Nguyễn Văn A',
          customerPhone: '0123456789',
          createdBy: 'DT Huyền - 190',
          createdAt: '2025-10-30T00:00:00',
          status: 'CONFIRMED'
        },
        {
          priceQuotationId: 8,
          code: 'BG-2025-000001',
          customerName: 'Nguyễn Văn A',
          customerPhone: '0123456789',
          createdBy: 'DT Huyền - 190',
          createdAt: '2025-10-30T00:00:00',
          status: 'CONFIRMED'
        }
      ]

      const transformedData = mockData.map((item) => ({
        key: item.priceQuotationId,
        id: item.priceQuotationId,
        code: item.code,
        customerName: item.customerName,
        customerPhone: item.customerPhone,
        createdBy: item.createdBy,
        createdAt: item.createdAt ? new Date(item.createdAt).toLocaleDateString('vi-VN') : '',
        rawStatus: item.status,
        status: item.status === 'PENDING' || item.status === 'DRAFT' ? 'Chờ xác nhận' : 'Xác nhận',
        // Mock parts data
        parts: [
          {
            id: 1,
            sku: 'LỌC-GIÓ-TOYOTA-CAMRY-2019',
            name: 'Lọc gió Camry',
            quantity: 1,
            status: 'Xác nhận',
            part: null // part null = chưa có phiếu mua hàng
          },
          {
            id: 2,
            sku: '---',
            name: 'Cảm biến ABS',
            quantity: 1,
            status: 'Xác nhận',
            part: { id: 123 } // part có data = đã có phiếu mua hàng
          },
          {
            id: 3,
            sku: '---',
            name: 'Vô lăng Camry',
            quantity: 1,
            status: 'Xác nhận',
            part: null
          }
        ]
      }))

      setQuotations(transformedData)
      setTotal(100)
      setLoading(false)
    }, 500)
    */
  }

  const getFilteredData = () => {
    let filtered = quotations

    console.log('Filter data - quotations:', quotations)
    console.log('Filter data - statusFilter:', statusFilter)

    // Lọc theo trạng thái
    if (statusFilter !== 'Tất cả') {
      filtered = filtered.filter(item => {
        const displayStatus = getStatusConfig(item.status).text
        console.log('Comparing:', displayStatus, 'with', statusFilter)
        return displayStatus === statusFilter
      })
    }

    console.log('Filtered result:', filtered)

    // Tìm kiếm
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(item =>
        item.code?.toLowerCase().includes(term) ||
        item.customerName?.toLowerCase().includes(term) ||
        item.customerPhone?.toLowerCase().includes(term) ||
        item.createdBy?.toLowerCase().includes(term)
      )
    }

    return filtered
  }

  const getStatusConfig = (status) => {
    // WAITING_WAREHOUSE_CONFIRM, DRAFT, PENDING -> Chờ xác nhận
    // CONFIRMED, APPROVED -> Xác nhận
    if (status === 'CONFIRMED' || status === 'APPROVED' || status === 'Xác nhận') {
      return { 
        color: '#22c55e', 
        bgColor: '#f6ffed',
        borderColor: '#b7eb8f',
        text: 'Xác nhận'
      }
    }
    if (status === 'WAITING_WAREHOUSE_CONFIRM' || status === 'DRAFT' || status === 'PENDING' || status === 'Chờ xác nhận') {
      return { 
        color: '#1677ff', 
        bgColor: '#e6f4ff',
        borderColor: '#91caff',
        text: 'Chờ xác nhận'
      }
    }
    return { 
      color: '#666', 
      bgColor: '#fafafa',
      borderColor: '#d9d9d9',
      text: status || 'Không rõ'
    }
  }

  const fetchPartCategories = async () => {
    try {
      const { data, error } = await partCategoriesAPI.getAll()
      if (error) {
        console.error('Failed to fetch part categories:', error)
        return
      }
      const result = data?.result || []
      setPartCategories(result)
    } catch (err) {
      console.error('Error fetching part categories:', err)
    }
  }

  const fetchMarkets = async () => {
    try {
      const { data, error } = await marketsAPI.getAll()
      if (error) {
        console.error('Failed to fetch markets:', error)
        return
      }
      const result = data?.result || []
      setMarkets(result)
    } catch (err) {
      console.error('Error fetching markets:', err)
    }
  }

  const fetchBrands = async () => {
    try {
      const { data, error } = await vehiclesAPI.getBrands()
      if (error) {
        console.error('Failed to fetch brands:', error)
        return
      }
      // API trả về array trực tiếp, không có result wrapper
      const brandsList = Array.isArray(data) ? data : (data?.result || [])
      setBrands(brandsList)
    } catch (err) {
      console.error('Error fetching brands:', err)
    }
  }

  const fetchCarModels = async (brandId) => {
    if (!brandId) {
      setCarModels([])
      return
    }
    try {
      console.log('Fetching car models for brandId:', brandId)
      const { data, error } = await vehiclesAPI.getModelsByBrand(brandId)
      if (error) {
        console.error('Failed to fetch car models:', error)
        setCarModels([])
        return
      }
      // API trả về array trực tiếp, không có result wrapper
      const modelsList = Array.isArray(data) ? data : (data?.result || [])
      console.log('Car models fetched:', modelsList)
      setCarModels(modelsList)
    } catch (err) {
      console.error('Error fetching car models:', err)
      setCarModels([])
    }
  }

  const fetchSuppliers = async () => {
    try {
      // Gọi API với size lớn để lấy tất cả suppliers
      const { data, error } = await suppliersAPI.getAll(0, 1000)
      if (error) {
        console.error('Failed to fetch suppliers:', error)
        return
      }
      // API có thể trả về array trực tiếp hoặc có result wrapper
      const suppliersList = Array.isArray(data) ? data : (data?.result || data?.content || [])
      setSuppliers(suppliersList)
    } catch (err) {
      console.error('Error fetching suppliers:', err)
    }
  }

  const handleOpenModal = async (partRecord) => {
    console.log('handleOpenModal called with partRecord:', partRecord)
    setSelectedPart(partRecord)
    setIsModalOpen(true)
    setModalLoading(true)
    
    // Fetch part categories, markets, brands, and suppliers when opening modal
    await Promise.all([fetchPartCategories(), fetchMarkets(), fetchBrands(), fetchSuppliers()])
    
    // Lưu priceQuotationItemId ngay từ đầu
    const itemId = partRecord.id // partRecord.id chính là priceQuotationItemId
    setSelectedItemId(itemId)
    console.log('Selected item ID from partRecord:', itemId)
    
    // Check xem đã xác nhận/từ chối chưa để disable form
    const isReviewed = partRecord.warehouseReviewStatus === 'Xác nhận' || 
                       partRecord.warehouseReviewStatus === 'Đã xác nhận' ||
                       partRecord.warehouseReviewStatus === 'Từ chối'
    
    try {
      // Gọi API lấy chi tiết item bằng priceQuotationItemId
      console.log('Loading item details for ID:', itemId)
      const { data, error } = await priceQuotationAPI.getItemById(itemId)
      
      if (error) {
        message.error('Không thể tải chi tiết item')
        setModalLoading(false)
        return
      }

      const itemDetail = data?.result || {}
      console.log('Item detail response:', itemDetail)
      
      if (itemDetail?.part) {
        // Có part - fill form từ part object
        const partData = itemDetail.part
        console.log('Part data:', partData)
        
        setHasExistingPart(true) // Đánh dấu là có part tồn tại
        
        const newFormData = {
          partName: partData.name || '',
          partType: partData.categoryName || '',
          origin: partData.marketName || '',
          usedForAllCars: partData.universal === true,
          manufacturer: partData.supplierName || '',
          brand: partData.modelName || '',
          carModel: partData.modelName || '',
          priceImport: partData.purchasePrice || 0,
          priceSell: partData.sellingPrice || 0,
          unit: partData.unitName || '',
          note: itemDetail.warehouseNote || partData.note || '',
          quantity: itemDetail.quantity || partRecord.quantity || 0,
          specialPart: partData.specialPart || false,
          isReviewed: isReviewed // Thêm flag để biết đã review chưa
        }
        console.log('Setting form data:', newFormData)
        setFormData(newFormData)
        
        // Nếu có brand, gọi API lấy danh sách dòng xe
        if (newFormData.brand && !newFormData.usedForAllCars) {
          const selectedBrand = brands.find(b => b.name === newFormData.brand)
          console.log('Loading existing part - brand:', newFormData.brand, 'selectedBrand:', selectedBrand)
          if (selectedBrand && selectedBrand.id) {
            console.log('Calling fetchCarModels with brandId:', selectedBrand.id)
            await fetchCarModels(selectedBrand.id)
          } else {
            console.warn('Brand not found when loading existing part:', newFormData.brand)
          }
        }
      } else {
        // Không có part - form rỗng
        console.log('No part found, empty form')
        setHasExistingPart(false) // Đánh dấu là không có part
        
        setFormData({
          partName: itemDetail.itemName || partRecord.name || '',
          partType: '',
          origin: '',
          usedForAllCars: false,
          manufacturer: '',
          brand: '',
          carModel: '',
          priceImport: 0,
          priceSell: 0,
          unit: itemDetail.unit || partRecord.unit || '',
          note: itemDetail.warehouseNote || '',
          quantity: itemDetail.quantity || partRecord.quantity || 0,
          specialPart: false,
          isReviewed: isReviewed // Thêm flag để biết đã review chưa
        })
      }
    } catch (error) {
      console.error('Error loading item details:', error)
      message.error('Không thể tải thông tin chi tiết')
    } finally {
      setModalLoading(false)
    }
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedPart(null)
    setCarModels([]) // Reset danh sách dòng xe khi đóng modal
    setErrors({}) // Reset errors khi đóng modal
  }

  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    // Clear error khi user thay đổi giá trị
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handleConfirm = async () => {
    if (!selectedItemId) {
      message.error('Không tìm thấy ID của item')
      return
    }

    // Reset errors
    const newErrors = {}

    // Validate các trường bắt buộc (có dấu *) - chỉ validate khi tạo mới hoặc cập nhật part đặc biệt
    if (!hasExistingPart || formData.specialPart) {
      // Case 1: Tạo mới part hoặc Case 3: Cập nhật part đặc biệt - cần tất cả các trường
      if (!formData.partName || formData.partName.trim() === '') {
        newErrors.partName = 'Vui lòng nhập tên linh kiện'
      }

      if (!formData.priceImport || parseFloat(formData.priceImport) <= 0) {
        newErrors.priceImport = 'Vui lòng nhập giá nhập hợp lệ'
      }

      if (!formData.partType || formData.partType.trim() === '') {
        newErrors.partType = 'Vui lòng chọn loại linh kiện'
      }

      if (!formData.priceSell || parseFloat(formData.priceSell) <= 0) {
        newErrors.priceSell = 'Vui lòng nhập giá bán hợp lệ'
      }

      if (!formData.origin || formData.origin.trim() === '') {
        newErrors.origin = 'Vui lòng chọn xuất xứ'
      }

      if (!formData.unit || formData.unit.trim() === '') {
        newErrors.unit = 'Vui lòng nhập đơn vị'
      }

      if (!formData.manufacturer || formData.manufacturer.trim() === '') {
        newErrors.manufacturer = 'Vui lòng chọn nhà phân phối'
      }

      // Validate Hãng và Dòng xe nếu không dùng chung
      if (!formData.usedForAllCars) {
        if (!formData.brand || formData.brand.trim() === '') {
          newErrors.brand = 'Vui lòng chọn hãng'
        }
        if (!formData.carModel || formData.carModel.trim() === '') {
          newErrors.carModel = 'Vui lòng chọn dòng xe'
        }
      }
    }

    // Validate ghi chú cho tất cả các case
    if (!formData.note || formData.note.trim() === '') {
      newErrors.note = 'Vui lòng nhập ghi chú/lý do'
    }

    // Nếu có lỗi, set errors và return
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    // Clear errors nếu không có lỗi
    setErrors({})
    
    setModalLoading(true)
    
    try {
      if (!hasExistingPart) {
        // Case 1: part === null - Tạo mới part
        // POST /api/quotation-items/{itemId}/confirm/create
        const payload = {
          name: formData.partName,
          categoryId: 0, // TODO: Map from categoryName to ID
          marketId: 0, // TODO: Map from marketName to ID
          note: formData.note || '',
          purchasePrice: parseFloat(formData.priceImport) || 0,
          sellingPrice: parseFloat(formData.priceSell) || 0,
          reorderLevel: 0.1,
          specialPart: formData.specialPart || false,
          supplierId: 0, // TODO: Map from supplierName to ID
          unitId: 0, // TODO: Map from unitName to ID
          universal: formData.usedForAllCars || false,
          vehicleModelId: formData.usedForAllCars ? 0 : null // TODO: Map from modelName to ID
        }
        
        console.log('Creating new part:', selectedItemId, payload)
        const { data, error } = await priceQuotationAPI.confirmCreateItem(selectedItemId, payload)
        
        if (error) {
          message.error('Không thể tạo phiếu mua hàng')
          setModalLoading(false)
          return
        }
        
        message.success('Tạo phiếu mua hàng thành công')
      } else if (!formData.specialPart) {
        // Case 2: part !== null && specialPart === false - Xác nhận đơn giản
        // PATCH /api/quotation-items/{itemId}/confirm with note string
        const note = formData.note || ''
        console.log('Confirming quotation item (simple):', selectedItemId, 'Note:', note)
        const { data, error } = await priceQuotationAPI.confirmItem(selectedItemId, note)
        
        if (error) {
          message.error('Không thể xác nhận phiếu mua hàng')
          setModalLoading(false)
          return
        }
        
        message.success('Xác nhận phiếu mua hàng thành công')
      } else {
        // Case 3: part !== null && specialPart === true - Cập nhật part đặc biệt
        // PATCH /api/quotation-items/{itemId}/confirm/update
        const payload = {
          name: formData.partName,
          categoryId: 0, // TODO: Map from categoryName to ID
          marketId: 0, // TODO: Map from marketName to ID
          note: formData.note || '',
          purchasePrice: parseFloat(formData.priceImport) || 0,
          sellingPrice: parseFloat(formData.priceSell) || 0,
          reorderLevel: 0.1,
          specialPart: true,
          supplierId: 0, // TODO: Map from supplierName to ID
          unitId: 0, // TODO: Map from unitName to ID
          universal: formData.usedForAllCars || false,
          vehicleModelId: formData.usedForAllCars ? 0 : null // TODO: Map from modelName to ID
        }
        
        console.log('Updating special part:', selectedItemId, payload)
        const { data, error } = await priceQuotationAPI.confirmItemUpdate(selectedItemId, payload)
        
        if (error) {
          message.error('Không thể cập nhật phiếu mua hàng')
          setModalLoading(false)
          return
        }
        
        message.success('Cập nhật phiếu mua hàng thành công')
      }
      
      handleCloseModal()
      fetchQuotations() // Refresh data
    } catch (error) {
      console.error('Error confirming quotation item:', error)
      message.error('Có lỗi xảy ra, vui lòng thử lại')
    } finally {
      setModalLoading(false)
    }
  }

  const handleReject = async () => {
    if (!formData.note || formData.note.trim() === '') {
      message.warning('Vui lòng nhập ghi chú/lý do từ chối')
      return
    }
    
    if (!selectedItemId) {
      message.error('Không tìm thấy ID của item')
      return
    }
    
    setModalLoading(true)
    
    try {
      const reason = formData.note.trim()
      
      // PATCH /api/quotation-items/{itemId}/reject
      console.log('Rejecting quotation item:', selectedItemId, 'Reason:', reason)
      const { data, error } = await priceQuotationAPI.rejectItem(selectedItemId, reason)
      
      if (error) {
        message.error('Không thể từ chối phiếu mua hàng')
        setModalLoading(false)
        return
      }
      
      message.success('Đã từ chối phiếu mua hàng')
      
      handleCloseModal()
      fetchQuotations() // Refresh data
    } catch (error) {
      console.error('Error rejecting quotation item:', error)
      message.error('Có lỗi xảy ra, vui lòng thử lại')
    } finally {
      setModalLoading(false)
    }
  }

  const columns = [
    {
      title: 'STT',
      key: 'index',
      width: 60,
      align: 'center',
      render: (_, __, index) => (page - 1) * pageSize + index + 1
    },
    {
      title: 'Mã phiếu',
      dataIndex: 'code',
      key: 'code',
      width: 150
    },
    {
      title: 'Khách hàng',
      key: 'customer',
      render: (_, record) => (
        <div>
          <div>{record.customerName}</div>
          <div style={{ color: '#888', fontSize: '12px' }}>{record.customerPhone}</div>
        </div>
      )
    },
    {
      title: 'Người tạo',
      dataIndex: 'createdBy',
      key: 'createdBy',
      width: 150
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120
    },
    {
      title: 'Trạng Thái',
      dataIndex: 'status',
      key: 'status',
      width: 180,
      render: (status) => {
        const config = getStatusConfig(status)
        return (
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
        )
      }
    }
  ]

  const expandedRowRender = (record) => {
    // Columns cho expanded table với quotationId từ record
    const expandedColumnsWithActions = [
      {
        title: 'STT',
        key: 'index',
        width: 80,
        align: 'center',
        render: (_, __, index) => index + 1
      },
      {
        title: 'Mã SKU',
        dataIndex: 'sku',
        key: 'sku',
        width: 200,
        render: (sku) => sku || '---'
      },
      {
        title: 'Tên linh kiện',
        dataIndex: 'name',
        key: 'name'
      },
      {
        title: 'Số lượng',
        dataIndex: 'quantity',
        key: 'quantity',
        width: 100,
        align: 'center'
      },
      {
        title: 'Đơn vị',
        dataIndex: 'unit',
        key: 'unit',
        width: 80,
        align: 'center'
      },
      {
        title: 'Đơn giá',
        dataIndex: 'unitPrice',
        key: 'unitPrice',
        width: 120,
        align: 'right',
        render: (price) => price ? `${price.toLocaleString('vi-VN')} ₫` : '---'
      },
      {
        title: 'Trạng thái kho',
        dataIndex: 'inventoryStatus',
        key: 'inventoryStatus',
        width: 120,
        align: 'center'
      },
      {
        title: 'Hành động',
        key: 'action',
        width: 140,
        align: 'center',
        render: (_, partRecord) => {
          const reviewStatus = partRecord.warehouseReviewStatus
          
          // Nếu đã từ chối - hiển thị tag đỏ
          if (reviewStatus === 'Từ chối' || reviewStatus === 'REJECTED') {
            return (
              <Tag 
                color="red" 
                style={{ borderRadius: '6px', fontWeight: 500 }}
              >
                Từ chối
              </Tag>
            )
          }
          
          // Nếu đã duyệt - hiển thị tag xanh "Đã duyệt"
          if (reviewStatus === 'Đã duyệt' || reviewStatus === 'APPROVED' || reviewStatus === 'CONFIRMED') {
            return (
              <Tag 
                color="green" 
                style={{ borderRadius: '6px', fontWeight: 500 }}
              >
                Đã duyệt
              </Tag>
            )
          }
          
          // Chờ duyệt hoặc chưa xem xét - hiển thị nút "Xác nhận"
          return (
            <Button 
              size="small"
              style={{
                borderRadius: '6px',
                padding: '4px 16px'
              }}
              onClick={(e) => {
                e.stopPropagation()
                handleOpenModal(partRecord)
              }}
            >
              Xác nhận
            </Button>
        )
        }
      }
    ]

    return (
      <Table
        columns={expandedColumnsWithActions}
        dataSource={record.parts || []}
        pagination={false}
        size="small"
        rowKey="id"
        style={{ margin: '0 40px' }}
      />
    )
  }

  return (
    <WarehouseLayout>
      <div style={{ padding: '24px' }}>
        {/* Heading */}
        <h1 style={{ margin: 0, marginBottom: 24, fontSize: 24, fontWeight: 600 }}>
          Xác nhận báo giá
        </h1>
        
        {/* Bộ lọc và tìm kiếm */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '20px',
          gap: '16px'
        }}>
          {/* Search box bên trái */}
          <Input
            placeholder="Tìm kiếm"
            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ 
              width: '200px',
              borderRadius: '8px'
            }}
          />

          {/* Filter buttons và DatePicker */}
          <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto', alignItems: 'center' }}>
            <Button
              type={statusFilter === 'Đang xuất hàng' ? 'primary' : 'default'}
              onClick={() => setStatusFilter('Đang xuất hàng')}
              style={{
                borderRadius: '8px',
                fontWeight: 500,
                ...(statusFilter === 'Đang xuất hàng' && {
                  background: '#C9A961',
                  borderColor: '#C9A961',
                  color: '#000'
                })
              }}
            >
              Đang xuất hàng
            </Button>
            <Button
              type={statusFilter === 'Hoàn thành' ? 'primary' : 'default'}
              onClick={() => setStatusFilter('Hoàn thành')}
              style={{
                borderRadius: '8px',
                fontWeight: 500,
                ...(statusFilter === 'Hoàn thành' && {
                  background: '#C9A961',
                  borderColor: '#C9A961',
                  color: '#000'
                })
              }}
            >
              Hoàn thành
            </Button>
            <Button
              type={statusFilter === 'Tất cả' ? 'primary' : 'default'}
              onClick={() => setStatusFilter('Tất cả')}
              style={{
                borderRadius: '8px',
                fontWeight: 500,
                ...(statusFilter === 'Tất cả' && {
                  background: '#C9A961',
                  borderColor: '#C9A961',
                  color: '#000'
                })
              }}
            >
              Tất cả
            </Button>

            {/* Date picker bên phải filter */}
            <DatePicker
              placeholder="Ngày tạo"
              suffixIcon={<CalendarOutlined />}
              value={dateRange[0]}
              onChange={(date) => {
                setDateRange([date, dateRange[1]])
              }}
              style={{ 
                width: '150px',
                borderRadius: '8px'
              }}
              format="DD/MM/YYYY"
            />
          </div>
        </div>

        {/* Bảng dữ liệu */}
        <Table 
          columns={columns}
          dataSource={getFilteredData()} 
          loading={loading}
          expandable={{
            expandedRowRender,
            expandedRowKeys,
            onExpandedRowsChange: (keys) => setExpandedRowKeys(keys),
            expandRowByClick: true,
            expandIconColumnIndex: -1 // Di chuyển expand icon về cuối
          }}
          pagination={{ 
            current: page, 
            pageSize, 
            total,
            onChange: (newPage) => setPage(newPage),
            showSizeChanger: false,
            showTotal: (total) => `Tổng số ${total} báo giá`
          }}
          size="middle"
          components={goldTableHeader}
        />

        {/* Modal Phiếu mua hàng */}
        <Modal
          open={isModalOpen}
          onCancel={handleCloseModal}
          footer={null}
          width={700}
          closable={false}
          styles={{
            header: { display: 'none' },
            body: { padding: 0 },
            content: { padding: 0, borderRadius: 12, overflow: 'hidden' }
          }}
        >
          {/* Header */}
          <div style={{ 
            background: '#CBB081', 
            padding: '16px 24px', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            margin: 0
          }}>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#000' }}>
              PHIẾU MUA HÀNG
            </h2>
            <Button 
              type="text" 
              icon={<CloseOutlined />} 
              onClick={handleCloseModal}
              style={{ color: '#000', fontSize: 18, padding: 0, width: 24, height: 24 }}
            />
          </div>

          <div style={{ padding: '24px' }}>
            {/* Status và Quantity */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: 16, 
              marginBottom: 20,
              padding: '12px 16px',
              background: '#f5f5f5',
              borderRadius: 8
            }}>
              <div>
                <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Trạng thái</div>
                <div style={{ fontWeight: 600, color: '#000' }}>
                  {hasExistingPart ? 'Đã có' : 'Không rõ'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Số lượng</div>
                <div style={{ fontWeight: 600, color: '#000' }}>{formData.quantity || 0}</div>
              </div>
            </div>

            {/* Form Fields - Custom layout */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Hàng 1: Tên linh kiện - Giá nhập */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 14 }}>
                    Tên linh kiện <span style={{ color: 'red' }}>*</span>
                  </label>
                  <Input
                    value={formData.partName}
                    onChange={(e) => handleFormChange('partName', e.target.value)}
                    placeholder="Nhập tên linh kiện"
                    disabled={hasExistingPart || formData.isReviewed}
                    style={{ borderRadius: 8, height: 40, borderColor: errors.partName ? '#ff4d4f' : undefined }}
                  />
                  {errors.partName && (
                    <div style={{ color: '#ff4d4f', fontSize: 12, marginTop: 4 }}>
                      {errors.partName}
                    </div>
                  )}
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 14 }}>
                    Giá nhập <span style={{ color: 'red' }}>*</span>
                  </label>
                  <InputNumber
                    value={formData.priceImport ? Number(formData.priceImport.toString().replace(/\./g, '')) : undefined}
                    onChange={(value) => handleFormChange('priceImport', value ? value.toString() : '')}
                    placeholder="Nhập giá nhập"
                    disabled={hasExistingPart || formData.isReviewed}
                    style={{ width: '100%', borderRadius: 8, height: 40, borderColor: errors.priceImport ? '#ff4d4f' : undefined }}
                    formatter={(value) => {
                      if (!value) return ''
                      const onlyDigits = `${value}`.replace(/\D/g, '')
                      return onlyDigits.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
                    }}
                    parser={(value) => (value ? value.replace(/\./g, '') : '')}
                    controls={false}
                    onKeyPress={(e) => {
                      if (!/[0-9]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') {
                        e.preventDefault()
                      }
                    }}
                    min={0}
                  />
                  {errors.priceImport && (
                    <div style={{ color: '#ff4d4f', fontSize: 12, marginTop: 4 }}>
                      {errors.priceImport}
                    </div>
                  )}
                </div>
              </div>

              {/* Hàng 2: Loại linh kiện - Giá bán */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 14 }}>
                    Loại linh kiện <span style={{ color: 'red' }}>*</span>
                  </label>
                  <Select
                    value={formData.partType || undefined}
                    onChange={(value) => handleFormChange('partType', value)}
                    disabled={hasExistingPart || formData.isReviewed}
                    placeholder="Chọn loại linh kiện"
                    style={{ width: '100%', borderRadius: 8, height: 40 }}
                    allowClear
                    loading={modalLoading && partCategories.length === 0}
                    status={errors.partType ? 'error' : ''}
                  >
                    {partCategories.map((category) => (
                      <Option key={category.id} value={category.name}>
                        {category.name}
                      </Option>
                    ))}
                  </Select>
                  {errors.partType && (
                    <div style={{ color: '#ff4d4f', fontSize: 12, marginTop: 4 }}>
                      {errors.partType}
                    </div>
                  )}
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 14 }}>
                    Giá bán <span style={{ color: 'red' }}>*</span>
                  </label>
                  <InputNumber
                    value={formData.priceSell ? Number(formData.priceSell.toString().replace(/\./g, '')) : undefined}
                    onChange={(value) => handleFormChange('priceSell', value ? value.toString() : '')}
                    placeholder="Nhập giá bán"
                    disabled={hasExistingPart || formData.isReviewed}
                    style={{ width: '100%', borderRadius: 8, height: 40, borderColor: errors.priceSell ? '#ff4d4f' : undefined }}
                    formatter={(value) => {
                      if (!value) return ''
                      const onlyDigits = `${value}`.replace(/\D/g, '')
                      return onlyDigits.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
                    }}
                    parser={(value) => (value ? value.replace(/\./g, '') : '')}
                    controls={false}
                    onKeyPress={(e) => {
                      if (!/[0-9]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') {
                        e.preventDefault()
                      }
                    }}
                    min={0}
                  />
                  {errors.priceSell && (
                    <div style={{ color: '#ff4d4f', fontSize: 12, marginTop: 4 }}>
                      {errors.priceSell}
                    </div>
                  )}
                </div>
              </div>

              {/* Hàng 3: Xuất xứ - Đơn vị */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 14 }}>
                    Xuất xứ <span style={{ color: 'red' }}>*</span>
                  </label>
                  <Select
                    value={formData.origin || undefined}
                    onChange={(value) => handleFormChange('origin', value)}
                    disabled={hasExistingPart || formData.isReviewed}
                    placeholder="Chọn xuất xứ"
                    style={{ width: '100%', borderRadius: 8, height: 40 }}
                    allowClear
                    loading={modalLoading && markets.length === 0}
                    status={errors.origin ? 'error' : ''}
                  >
                    {markets.map((market) => (
                      <Option key={market.id} value={market.name}>
                        {market.name}
                      </Option>
                    ))}
                  </Select>
                  {errors.origin && (
                    <div style={{ color: '#ff4d4f', fontSize: 12, marginTop: 4 }}>
                      {errors.origin}
                    </div>
                  )}
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 14 }}>
                    Đơn vị <span style={{ color: 'red' }}>*</span>
                  </label>
                  <InputNumber
                    value={formData.unit ? Number(formData.unit.toString().replace(/\./g, '')) : undefined}
                    onChange={(value) => handleFormChange('unit', value ? value.toString() : '')}
                    placeholder="Nhập đơn vị"
                    disabled={hasExistingPart || formData.isReviewed}
                    style={{ width: '100%', borderRadius: 8, height: 40, borderColor: errors.unit ? '#ff4d4f' : undefined }}
                    formatter={(value) => {
                      if (!value) return ''
                      const onlyDigits = `${value}`.replace(/\D/g, '')
                      return onlyDigits.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
                    }}
                    parser={(value) => (value ? value.replace(/\./g, '') : '')}
                    controls={false}
                    onKeyPress={(e) => {
                      if (!/[0-9]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') {
                        e.preventDefault()
                      }
                    }}
                    min={0}
                  />
                  {errors.unit && (
                    <div style={{ color: '#ff4d4f', fontSize: 12, marginTop: 4 }}>
                      {errors.unit}
                    </div>
                  )}
                </div>
              </div>

              {/* Hàng 4: Checkbox "Dùng chung tất cả dòng xe" (full width) */}
              <div>
                <Checkbox
                  checked={formData.usedForAllCars}
                  onChange={(e) => handleFormChange('usedForAllCars', e.target.checked)}
                  disabled={hasExistingPart || formData.isReviewed}
                >
                  Dùng chung tất cả dòng xe
                </Checkbox>
              </div>

              {/* Hàng 5: Hãng - Dòng xe (chỉ hiển thị khi không check "dùng chung") */}
              {!formData.usedForAllCars && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 14 }}>
                      Hãng
                    </label>
                    <Select
                      value={formData.brand || undefined}
                      onChange={(value) => {
                        handleFormChange('brand', value)
                        // Reset carModel when brand changes
                        handleFormChange('carModel', '')
                        // Tìm brandId từ value (brand.name) và gọi API lấy danh sách dòng xe
                        if (value) {
                          const selectedBrand = brands.find(b => b.name === value)
                          console.log('Selected brand:', selectedBrand, 'from brands:', brands, 'value:', value)
                          if (selectedBrand && selectedBrand.id) {
                            console.log('Calling fetchCarModels with brandId:', selectedBrand.id)
                            fetchCarModels(selectedBrand.id)
                          } else {
                            console.warn('Brand not found or missing id:', value, selectedBrand)
                            setCarModels([])
                          }
                        } else {
                          setCarModels([])
                        }
                      }}
                      disabled={hasExistingPart || formData.isReviewed}
                      placeholder="Chọn hãng"
                      style={{ width: '100%', borderRadius: 8, height: 40 }}
                      allowClear
                      loading={modalLoading && brands.length === 0}
                      status={errors.brand ? 'error' : ''}
                    >
                      {brands.map((brand) => (
                        <Option key={brand.id} value={brand.name}>
                          {brand.name}
                        </Option>
                      ))}
                    </Select>
                    {errors.brand && (
                      <div style={{ color: '#ff4d4f', fontSize: 12, marginTop: 4 }}>
                        {errors.brand}
                      </div>
                    )}
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 14 }}>
                      Dòng xe
                    </label>
                    <Select
                      value={formData.carModel || undefined}
                      onChange={(value) => handleFormChange('carModel', value)}
                      disabled={hasExistingPart || formData.isReviewed || !formData.brand}
                      placeholder="Chọn dòng xe"
                      style={{ width: '100%', borderRadius: 8, height: 40 }}
                      allowClear
                      loading={carModels.length === 0 && formData.brand && !modalLoading}
                      status={errors.carModel ? 'error' : ''}
                    >
                      {carModels.map((model) => (
                        <Option key={model.id} value={model.name}>
                          {model.name}
                        </Option>
                      ))}
                    </Select>
                    {errors.carModel && (
                      <div style={{ color: '#ff4d4f', fontSize: 12, marginTop: 4 }}>
                        {errors.carModel}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Hàng 6: Nhà phân phối (full width) */}
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 14 }}>
                  Nhà phân phối <span style={{ color: 'red' }}>*</span>
                </label>
                <Select
                  value={formData.manufacturer || undefined}
                  onChange={(value) => handleFormChange('manufacturer', value)}
                  disabled={hasExistingPart || formData.isReviewed}
                  placeholder="Chọn nhà cung cấp"
                  style={{ width: '100%', borderRadius: 8, height: 40 }}
                  allowClear
                  loading={modalLoading && suppliers.length === 0}
                  status={errors.manufacturer ? 'error' : ''}
                >
                  {suppliers.map((supplier) => (
                    <Option key={supplier.id} value={supplier.name}>
                      {supplier.name}
                    </Option>
                  ))}
                </Select>
                {errors.manufacturer && (
                  <div style={{ color: '#ff4d4f', fontSize: 12, marginTop: 4 }}>
                    {errors.manufacturer}
                  </div>
                )}
              </div>
            </div>

            {/* Ghi chú - Full width */}
            <div style={{ marginTop: 16 }}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 14 }}>
                Ghi chú/Lý do <span style={{ color: 'red' }}>*</span>
              </label>
              <Input.TextArea
                value={formData.note}
                onChange={(e) => handleFormChange('note', e.target.value)}
                placeholder="Nhập nội dung"
                rows={3}
                disabled={(hasExistingPart && formData.specialPart === true) || formData.isReviewed}
                style={{ 
                  borderRadius: 8,
                  backgroundColor: ((hasExistingPart && formData.specialPart === true) || formData.isReviewed) ? '#f5f5f5' : 'white',
                  borderColor: errors.note ? '#ff4d4f' : undefined
                }}
              />
              {errors.note && (
                <div style={{ color: '#ff4d4f', fontSize: 12, marginTop: 4 }}>
                  {errors.note}
                </div>
              )}
              <div style={{ fontSize: 12, color: '#888', marginTop: 6 }}>
                Linh kiện đặc biệt kiểm tra thông tin
              </div>
            </div>

            {/* Buttons */}
            {!formData.isReviewed && (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'flex-end', 
                gap: 12, 
                marginTop: 24,
                paddingTop: 20,
                borderTop: '1px solid #f0f0f0'
              }}>
                <Button
                  danger
                  onClick={handleReject}
                  loading={modalLoading}
                  style={{ 
                    minWidth: 100,
                    height: 40,
                    borderRadius: 8,
                    fontWeight: 500
                  }}
                >
                  Từ chối
                </Button>
                <Button
                  type="primary"
                  onClick={handleConfirm}
                  loading={modalLoading}
                  style={{ 
                    minWidth: 100,
                    height: 40,
                    borderRadius: 8,
                    backgroundColor: '#22c55e',
                    borderColor: '#22c55e',
                    fontWeight: 500
                  }}
                >
                  Duyệt
                </Button>
              </div>
            )}
          </div>
        </Modal>
      </div>
    </WarehouseLayout>
  )
}
