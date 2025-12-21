import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Table,
  Input,
  Space,
  Button,
  Modal,
  Form,
  InputNumber,
  Select,
  message,
  Checkbox,
  Card,
  Row,
  Col
} from 'antd'
import {
  SearchOutlined,
  EditOutlined,
  CloseOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined,
  FilterOutlined
} from '@ant-design/icons'
import WarehouseLayout from '../../layouts/WarehouseLayout'
import { goldTableHeader } from '../../utils/tableComponents'
import { partsAPI, partCategoriesAPI, unitsAPI, marketsAPI, suppliersAPI, vehiclesAPI } from '../../services/api'
import '../../styles/pages/warehouse/export-list.css'
import '../../styles/pages/warehouse/import-list.css'
import '../../styles/pages/warehouse/parts-list.css'

const { Search } = Input
const { Option } = Select

export default function PartsList() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [sortOrder, setSortOrder] = useState('asc')
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedPart, setSelectedPart] = useState(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [createForm] = Form.useForm()
  const [editForm] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [parts, setParts] = useState([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [filterModalOpen, setFilterModalOpen] = useState(false)
  const [categories, setCategories] = useState([])
  const [units, setUnits] = useState([])
  const [markets, setMarkets] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [brands, setBrands] = useState([])
  const [models, setModels] = useState([])
  const [newPartModalOpen, setNewPartModalOpen] = useState(false)
  const [newPartForm] = Form.useForm()
  const [tempFilters, setTempFilters] = useState({
    status: [],
    categoryIds: [],
    origin: [],
    vehicleModel: []
  })
  const [appliedFilters, setAppliedFilters] = useState({
    status: [],
    categoryIds: [],
    origin: [],
    vehicleModel: []
  })

  const handleNumberKeyDown = (e) => {
    const allowedKeys = ['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete', 'Home', 'End']
    if (allowedKeys.includes(e.key)) return
    if (!/^[0-9]$/.test(e.key)) {
      e.preventDefault()
    }
  }

  useEffect(() => {
    fetchParts(page - 1, pageSize)
  }, [page, pageSize, appliedFilters])

  useEffect(() => {
    fetchCategories()
    fetchUnits()
    fetchMarkets()
    fetchSuppliers()
    fetchBrands()
  }, [])

  // Reset models khi mở modal "Thêm linh kiện"
  useEffect(() => {
    if (newPartModalOpen) {
      setModels([])
      newPartForm.setFieldsValue({ vehicleBrand: undefined, vehicleModel: undefined })
    }
  }, [newPartModalOpen])

  const fetchCategories = async () => {
    try {
      const { data, error } = await partCategoriesAPI.getAll()
      if (error) {
        console.error('Error fetching categories:', error)
        return
      }
      
      console.log('Categories response:', data)
      const result = data?.result || data || []
      console.log('Mapped categories:', result)
      setCategories(Array.isArray(result) ? result : [])
    } catch (err) {
      console.error('Failed to fetch categories:', err)
      setCategories([])
    }
  }

  const fetchUnits = async () => {
    try {
      const { data, error } = await unitsAPI.getAll({ page: 0, size: 20 })
      if (error) {
        console.error('Error fetching units:', error)
        return
      }
      
      const result = data?.result?.content || data?.content || []
      setUnits(Array.isArray(result) ? result : [])
    } catch (err) {
      console.error('Failed to fetch units:', err)
      setUnits([])
    }
  }

  const fetchMarkets = async () => {
    try {
      const { data, error } = await marketsAPI.getAll()
      if (error) {
        console.error('Error fetching markets:', error)
        return
      }
      
      const result = data?.result || data || []
      setMarkets(Array.isArray(result) ? result : [])
    } catch (err) {
      console.error('Failed to fetch markets:', err)
      setMarkets([])
    }
  }

  const fetchSuppliers = async () => {
    try {
      const { data, error } = await suppliersAPI.getAll(0, 100)
      if (error) {
        console.error('Error fetching suppliers:', error)
        return
      }
      
      const result = data?.result?.content || data?.result || data?.content || data || []
      setSuppliers(Array.isArray(result) ? result : [])
    } catch (err) {
      console.error('Failed to fetch suppliers:', err)
      setSuppliers([])
    }
  }

  const fetchBrands = async () => {
    try {
      const { data, error } = await vehiclesAPI.getBrands()
      if (error) {
        console.error('Error fetching brands:', error)
        return
      }
      
      const result = data?.result || data || []
      setBrands(Array.isArray(result) ? result : [])
    } catch (err) {
      console.error('Failed to fetch brands:', err)
      setBrands([])
    }
  }

  const fetchModelsByBrand = async (brandId) => {
    if (!brandId) {
      setModels([])
      return
    }
    
    try {
      const { data, error } = await vehiclesAPI.getModelsByBrand(brandId)
      if (error) {
        console.error('Error fetching models:', error)
        setModels([])
        return
      }
      
      const result = data?.result || data || []
      setModels(Array.isArray(result) ? result : [])
    } catch (err) {
      console.error('Failed to fetch models:', err)
      setModels([])
    }
  }

  const fetchParts = async (pageIndex = 0, size = 10) => {
    setLoading(true)
    try {
      // Build filter params
      const params = { 
        page: pageIndex, 
        size 
      }
      
      // Add categoryId if filter is applied
      if (appliedFilters.categoryIds.length > 0) {
        params.categoryId = appliedFilters.categoryIds[0] // API accepts single categoryId
      }
      
      // Add status if filter is applied - map to backend enum
      if (appliedFilters.status.length > 0) {
        const statusMap = {
          'Đủ hàng': 'IN_STOCK',
          'Sắp hết': 'LOW_STOCK',
          'Hết hàng': 'OUT_OF_STOCK'
        }
        const mappedStatus = statusMap[appliedFilters.status[0]]
        if (mappedStatus) {
          params.status = mappedStatus
        }
      }
      
      const { data: response, error } = await partsAPI.getAll(params)
      if (error) {
        throw new Error(error)
      }

      let payload = []
      let totalElements = 0

      if (response?.result) {
        if (Array.isArray(response.result.content)) {
          payload = response.result.content
          totalElements = response.result.totalElements || response.result.numberOfElements || payload.length
        } else if (Array.isArray(response.result)) {
          payload = response.result
          totalElements = payload.length
        }
      } else if (Array.isArray(response?.data)) {
        payload = response.data
        totalElements = payload.length
      } else if (Array.isArray(response)) {
        payload = response
        totalElements = payload.length
      } else if (Array.isArray(response?.content)) {
        payload = response.content
        totalElements = response.totalElements || payload.length
      }

      const mapped = payload.map((item, index) => ({
        id: item.partId || item.id || `part-${index}`,
        name: item.name || '—',
        sku: item.sku || '—',
        categoryName: item.categoryName || '—',
        modelName: item.modelName || '',
        marketName: item.marketName || 'VN',
        unit: item.unitName || item.unit || '—',
        quantityOnHand: item.quantity ?? 0,
        reservedQuantity: item.reservedQuantity ?? 0,
        status: item.status || 'Đủ hàng',
        // Keep original fields for compatibility
        origin: item.marketName || item.market || 'VN',
        brand: item.categoryName || '—',
        vehicleModel: item.universal ? 'Tất cả' : (item.modelName || 'Chỉ định'),
        alertThreshold: item.reorderLevel ?? 0,
        importPrice: item.purchasePrice ?? 0,
        sellingPrice: item.sellingPrice ?? 0,
        categoryId: item.categoryId,
        compatibleVehicleModelIds: item.compatibleVehicleIds || item.compatibleVehicleModelIds || [],
        discountRate: item.discountRate || 0,
        specialPart: item.specialPart || false,
        universal: item.universal || false,
        supplierName: item.supplierName || '',
        note: item.note || '',
        createdAt: item.createdAt || new Date().toISOString().split('T')[0],
        originalItem: item
      }))

      setParts(mapped)
      setTotal(totalElements)
    } catch (err) {
      console.error(err)
      message.error(err.message || 'Không thể tải danh sách linh kiện')
      setParts([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }

  const filteredData = useMemo(() => {
    return parts
      .filter((item) => {
        const matchesSearch =
          !searchTerm ||
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (item.categoryName && item.categoryName.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (item.sku && item.sku.toLowerCase().includes(searchTerm.toLowerCase()))

        const matchesCategory = 
          categoryFilter === 'all' || 
          (item.categoryName && item.categoryName === categoryFilter)

        // Filter by status from modal
        const matchesStatus = 
          appliedFilters.status.length === 0 || 
          appliedFilters.status.includes(item.status)

        return matchesSearch && matchesCategory && matchesStatus
      })
      .sort((a, b) => {
        const nameA = (a.name || '').toLowerCase()
        const nameB = (b.name || '').toLowerCase()
        if (sortOrder === 'asc') {
          return nameA.localeCompare(nameB, 'vi')
        } else {
          return nameB.localeCompare(nameA, 'vi')
        }
      })
      .map((item, index) => ({ ...item, key: item.id, index: index + 1 }))
  }, [parts, searchTerm, sortOrder, categoryFilter, appliedFilters])

  const columns = [
    {
      title: <div style={{ textAlign: 'center' }}>Mã SKU</div>,
      dataIndex: 'sku',
      key: 'sku',
      width: 200,
      align: 'left',
      render: (sku) => (
        <span style={{ fontWeight: 600 }}>{sku || '—'}</span>
      )
    },
    {
      title: 'Danh mục',
      dataIndex: 'categoryName',
      key: 'categoryName',
      width: 150,
      align: 'center',
      render: (category) => category || '—'
    },
    {
      title: 'Đơn vị',
      dataIndex: 'unit',
      key: 'unit',
      width: 100,
      align: 'center',
      render: (unit) => unit || '—'
    },
    {
      title: 'Tồn kho',
      dataIndex: 'quantityOnHand',
      key: 'quantityOnHand',
      width: 100,
      align: 'center'
    },
    {
      title: 'Đang giữ',
      dataIndex: 'reservedQuantity',
      key: 'reservedQuantity',
      width: 100,
      align: 'center'
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      align: 'center',
      render: (status) => {
        let color = '#52c41a' // Xanh - Đủ hàng (IN_STOCK)
        let backgroundColor = '#f6ffed'
        let borderColor = '#b7eb8f'
        
        if (status === 'Hết hàng' || status === 'OUT_OF_STOCK') {
          color = '#ff4d4f' // Đỏ
          backgroundColor = '#fff1f0'
          borderColor = '#ffa39e'
        } else if (status === 'Sắp hết' || status === 'LOW_STOCK') {
          color = '#faad14' // Vàng
          backgroundColor = '#fffbe6'
          borderColor = '#ffe58f'
        }
        
        return (
          <span style={{
            color: color,
            backgroundColor: backgroundColor,
            border: `1px solid ${borderColor}`,
            borderRadius: '4px',
            padding: '2px 8px',
            fontSize: '12px',
            fontWeight: 500
          }}>
            {status || 'Đủ hàng'}
          </span>
        )
      }
    },
    {
      key: 'actions',
      width: 60,
      align: 'center',
      render: (_, record) => (
          <Button type="link" style={{ padding: 0 }}>
            -
          </Button>
      )
    }
  ]

  const handleOpenDetail = async (part) => {
    setSelectedPart(part)
    setIsEditMode(false) // Mở modal ở chế độ xem
    setModalOpen(true)

    // Gọi API để lấy chi tiết linh kiện
    try {
      const { data: response, error } = await partsAPI.getById(part.id)
      if (!error && response?.result) {
        const detail = response.result
        console.log('=== Part Detail from API ===')
        console.log('Detail:', detail)
        console.log('===========================')
        
        // Lưu full detail để dùng id khi build payload update
        setSelectedPart((prev) => ({ ...prev, originalItem: detail }))

        // Đổ dữ liệu vào form để hiển thị (map đúng theo mô tả)
        editForm.setFieldsValue({
          name: detail.name,                              // Tên linh kiện
          category: detail.categoryId,                    // Danh mục: id, hiển thị label categoryName
          origin: detail.marketId,                        // Xuất xứ: id, hiển thị label marketName
          supplier: detail.supplierId,                    // Nhà cung cấp: id, hiển thị label supplierName
          alertThreshold: detail.reorderLevel ?? 0,       // Lượng tối thiểu
          unit: detail.unitId,                            // Đơn vị: id, hiển thị label unitName
          useForAllModels: detail.universal,              // Dùng chung
          vehicleBrand: detail.brandName || undefined,    // Hãng xe
          vehicleModel: detail.modelName || undefined,    // Dòng xe
          importPrice: detail.purchasePrice,              // Giá nhập
          sellingPrice: detail.sellingPrice,              // Giá bán
          note: detail.note || ''
        })
        return
      }
    } catch (err) {
      console.error('Error loading part detail:', err)
    }

    // Fallback nếu không load được từ API
    editForm.setFieldsValue({
      name: part.name,
      origin: part.origin,
      brand: part.brand,
      vehicleModel: part.vehicleModel,
      quantityOnHand: part.quantityOnHand,
      reservedQuantity: part.reservedQuantity,
      alertThreshold: part.alertThreshold,
      sellingPrice: part.sellingPrice,
      importPrice: part.importPrice,
      unit: part.unit,
      useForAllModels: part.universal,
      status: part.status,
      note: part.note
    })
  }

  const handleCreatePart = async (values) => {
    try {
      // Helper function để convert value thành number hoặc null nếu không hợp lệ
      const toNumberOrNull = (value) => {
        if (value === null || value === undefined || value === '') return null
        const num = Number(value)
        return isNaN(num) ? null : num
      }

      // Đảm bảo tất cả ID fields đều là số hợp lệ (không null)
      const marketId = toNumberOrNull(values.origin)
      const categoryId = toNumberOrNull(values.categoryId)
      const unitId = toNumberOrNull(values.unit)
      const supplierId = toNumberOrNull(values.supplier)
      
      // Validate các field bắt buộc trước khi build payload
      if (!values.name) {
        message.error('Vui lòng nhập tên linh kiện')
        return
      }
      if (marketId === null || marketId === undefined) {
        message.error('Vui lòng chọn xuất xứ')
        return
      }
      if (categoryId === null || categoryId === undefined || categoryId === 0) {
        message.error('Vui lòng chọn danh mục')
        return
      }
      if (unitId === null || unitId === undefined) {
        message.error('Vui lòng chọn đơn vị')
        return
      }
      if (supplierId === null || supplierId === undefined) {
        message.error('Vui lòng chọn nhà cung cấp')
        return
      }

      // Validate giá nhập và giá bán phải > 0 (theo DTO validation)
      const purchasePrice = values.importPrice ?? 0
      const sellingPrice = values.sellingPrice ?? 0
      if (purchasePrice <= 0) {
        message.error('Giá nhập phải lớn hơn 0')
        return
      }
      if (sellingPrice <= 0) {
        message.error('Giá bán phải lớn hơn 0')
        return
      }

      // Build payload theo DTO PartUpdateReqDto
      const payload = {
        name: values.name,
        marketId: marketId,
        categoryId: categoryId,
        purchasePrice: purchasePrice,
        sellingPrice: sellingPrice,
        reorderLevel: values.alertThreshold ?? null,
        unitId: unitId,
        supplierId: supplierId,
        universal: values.useForAllModels || false,
        specialPart: false,
        note: values.note || null
      }

      // Chỉ thêm vehicleModelId nếu không phải universal và có chọn model
      if (!payload.universal) {
        if (!values.vehicleModel) {
          message.error('Vui lòng chọn dòng xe hoặc chọn "Dùng chung"')
          return
        }
        const vehicleModelId = toNumberOrNull(values.vehicleModel)
        if (vehicleModelId === null) {
          message.error('Vui lòng chọn dòng xe hợp lệ')
          return
        }
        payload.vehicleModelId = vehicleModelId
      } else {
        payload.vehicleModelId = null
      }

      console.log('=== Create Part Payload ===')
      console.log('Payload:', JSON.stringify(payload, null, 2))
      console.log('===========================')

      const { data: response, error } = await partsAPI.create(payload)
      if (error || !response) {
        throw new Error(error || 'Tạo linh kiện không thành công.')
      }

      message.success('Thêm linh kiện thành công')
      newPartForm.resetFields()
      setNewPartModalOpen(false)
      fetchParts(page - 1, pageSize)
    } catch (err) {
      console.error(err)
      message.error(err.message || 'Không thể tạo linh kiện')
    }
  }

  const handleUpdatePart = async (values) => {
    if (!selectedPart?.id) {
      message.error('Không tìm thấy thông tin linh kiện')
      return
    }

    const detail = selectedPart.originalItem || selectedPart

    try {
      console.log('=== Update Part Payload ===')
      console.log('Selected Part:', selectedPart)
      console.log('Detail:', detail)
      console.log('Form Values:', values)
      
      const payload = {
        // cho phép sửa các trường (trừ SKU) qua form; id lấy từ form nếu có, fallback từ detail
        name: values.name || detail.name,
        note: values.note ?? detail.note ?? '',

        categoryId: values.category || detail.categoryId,           // Danh mục (id từ form)
        marketId: values.origin || detail.marketId,                // Xuất xứ (id)
        supplierId: values.supplier || detail.supplierId,          // Nhà cung cấp (id)
        unitId: values.unit || detail.unitId,                      // Đơn vị (id)
        vehicleModelId: detail.modelId ?? detail.vehicleModelId ?? 0,

        purchasePrice: values.importPrice ?? detail.purchasePrice ?? 0,
        sellingPrice: values.sellingPrice ?? detail.sellingPrice ?? 0,
        reorderLevel: values.alertThreshold ?? detail.reorderLevel ?? 0,

        universal: values.useForAllModels ?? detail.universal ?? false,
        specialPart: detail.specialPart ?? false,
        discountRate: detail.discountRate ?? 0
      }

      console.log('Final Payload:', JSON.stringify(payload, null, 2))
      console.log('===========================')

      const { data: response, error } = await partsAPI.update(selectedPart.id, payload)
      if (error || !response) {
        throw new Error(error || 'Cập nhật linh kiện không thành công.')
      }

      message.success('Cập nhật thành công')
      setIsEditMode(false) // Quay về chế độ xem sau khi lưu
      setModalOpen(false)
      fetchParts(page - 1, pageSize)
    } catch (err) {
      console.error(err)
      message.error(err.message || 'Không thể cập nhật linh kiện')
    }
  }

  // Gọi khi ấn nút "Lưu" – chủ động lấy values từ form, tránh submit form tự động
  const handleSavePart = () => {
    const values = editForm.getFieldsValue()
    handleUpdatePart(values)
  }

  const handleCreateModalClose = () => {
    setCreateModalOpen(false)
    createForm.resetFields()
  }

  const handleFilterChange = (filterType, value) => {
    setTempFilters(prev => {
      const current = prev[filterType] || []
      if (current.includes(value)) {
        return { ...prev, [filterType]: current.filter(v => v !== value) }
      } else {
        return { ...prev, [filterType]: [...current, value] }
      }
    })
  }

  const handleApplyFilter = () => {
    // Apply filters - useEffect will trigger fetchParts automatically
    setAppliedFilters(tempFilters)
    setFilterModalOpen(false)
  }

  const handleResetFilter = () => {
    const resetFilters = {
      status: [],
      categoryIds: [],
      origin: [],
      vehicleModel: []
    }
    setTempFilters(resetFilters)
    setAppliedFilters(resetFilters)
  }

  return (
    <WarehouseLayout>
      <div style={{ padding: 24, minHeight: '100vh' }}>
        <Card
          title={<span style={{ fontSize: 24, fontWeight: 600 }}>Danh sách linh kiện</span>}
          styles={{ body: { padding: '16px 24px' } }}
        >
          {/* Search and Filter Row */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: 16 
          }}>
            <Search
              placeholder="Tìm kiếm"
              allowClear
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: 260 }}
              prefix={<SearchOutlined />}
            />
            
            <div style={{ display: 'flex', gap: 12 }}>
              <Button
                type="primary"
                onClick={() => setNewPartModalOpen(true)}
                style={{
                  borderRadius: '6px',
                  backgroundColor: '#52c41a',
                  borderColor: '#52c41a'
                }}
              >
                Thêm linh kiện
              </Button>
              <Button
                icon={<FilterOutlined />}
                onClick={() => setFilterModalOpen(true)}
                style={{
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                Bộ lọc
              </Button>
            </div>
          </div>

          <Table
            columns={columns}
            dataSource={filteredData}
            loading={loading}
            pagination={{
              current: page,
              pageSize,
              total,
              showSizeChanger: true,
              showTotal: (t) => `Tổng ${t} linh kiện`,
              pageSizeOptions: ['10', '20', '50', '100'],
              onChange: (current, size) => {
                setPage(current)
                setPageSize(size)
              }
            }}
            components={goldTableHeader}
            onRow={(record) => ({
              onClick: () => handleOpenDetail(record)
            })}
          />
        </Card>
      </div>

      <Modal
        title={null}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        closable={false}
        footer={null}
        width={600}
        styles={{ body: { background: '#fff', padding: 0 } }}
      >
        {selectedPart && (
          <>
            <div
              style={{
                background: '#CBB081',
                padding: '16px 20px',
                margin: '-24px -24px 0 -24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <span style={{ fontWeight: 700, fontSize: 18, color: '#000' }}>CHI TIẾT LINH KIỆN</span>
              <CloseOutlined 
                style={{ cursor: 'pointer', fontSize: 16, color: '#000' }} 
                onClick={() => {
                setModalOpen(false)
                setIsEditMode(false) // Reset về chế độ xem khi đóng modal
              }} 
              />
            </div>

            <div style={{ padding: '24px 32px' }}>
            <Form layout="vertical" form={editForm}>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item label="Mã SKU" style={{ marginBottom: 16 }}>
                      <Input 
                        value={selectedPart.sku}
                        disabled
                        style={{ backgroundColor: '#f5f5f5' }}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="Số lượng tồn" style={{ marginBottom: 16 }}>
                      <Input 
                        value={selectedPart.quantityOnHand || selectedPart.quantity || 0}
                        disabled
                        style={{ backgroundColor: '#f5f5f5' }}
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item 
                  label="Tên linh kiện" 
                  name="name" 
                  rules={[{ required: true, message: 'Vui lòng nhập tên' }]}
                  style={{ marginBottom: 16 }}
                >
                  <Input disabled={!isEditMode} />
                </Form.Item>

                {/* Danh mục - Select dropdown, cho phép sửa khi ấn Cập nhật */}
                <Form.Item
                  label="Danh mục" 
                  name="category" 
                  rules={[{ required: true, message: 'Chọn danh mục' }]}
                  style={{ marginBottom: 16 }}
                >
                  <Select
                    placeholder="Chọn danh mục"
                    showSearch
                    allowClear
                    disabled={!isEditMode}
                    filterOption={(input, option) =>
                      (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                    options={categories.map(cat => ({
                      value: cat.id || cat.partCategoryId,
                      label: cat.name
                    }))}
                  />
                </Form.Item>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      label="Xuất xứ"
                      name="origin"
                      style={{ marginBottom: 16 }}
                      rules={[{ required: true, message: 'Chọn xuất xứ' }]}
                    >
                      <Select
                        placeholder="Chọn xuất xứ"
                        showSearch
                        allowClear
                        disabled={!isEditMode}
                        filterOption={(input, option) =>
                          (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                        }
                        options={markets.map(market => ({
                          value: market.id || market.marketId,
                          label: market.name || market.marketName || ''
                        }))}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item 
                      label="Nhà cung cấp" 
                      name="supplier"
                      rules={[{ required: true, message: 'Chọn nhà cung cấp' }]}
                      style={{ marginBottom: 16 }}
                    >
                      <Select
                        placeholder="Chọn nhà cung cấp"
                        showSearch
                        allowClear
                        disabled={!isEditMode}
                        filterOption={(input, option) =>
                          (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                        }
                        options={suppliers.map(supplier => ({
                          value: supplier.id || supplier.supplierId,
                          label: supplier.name || supplier.supplierName || supplier.companyName || ''
                        }))}
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      label="Lượng tối thiểu"
                      name="alertThreshold"
                      style={{ marginBottom: 16 }}
                      rules={[{ required: true, message: 'Nhập lượng tối thiểu' }]}
                    >
                      <InputNumber
                        min={0}
                        disabled={!isEditMode}
                        style={{ width: '100%' }}
                        formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                        onKeyDown={handleNumberKeyDown}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label="Đơn vị"
                      name="unit"
                      style={{ marginBottom: 16 }}
                      rules={[{ required: true, message: 'Chọn đơn vị' }]}
                    >
                      <Select
                        placeholder="Chọn đơn vị"
                        showSearch
                        allowClear
                        disabled={!isEditMode}
                        filterOption={(input, option) =>
                          (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                        }
                        options={units.map(unit => ({
                          value: unit.id,
                          label: unit.name
                        }))}
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item name="useForAllModels" valuePropName="checked" style={{ marginBottom: 16 }}>
                  <Checkbox disabled={!isEditMode}>Dùng chung</Checkbox>
                </Form.Item>

                {/* Nếu không dùng chung thì hiển thị hãng xe / dòng xe */}
                <Form.Item
                  noStyle
                  shouldUpdate={(prev, curr) => prev.useForAllModels !== curr.useForAllModels}
                >
                  {({ getFieldValue }) =>
                    !getFieldValue('useForAllModels') ? (
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            label="Hãng xe"
                            name="vehicleBrand"
                            style={{ marginBottom: 16 }}
                          >
                            <Input disabled={!isEditMode} />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            label="Dòng xe"
                            name="vehicleModel"
                            style={{ marginBottom: 16 }}
                          >
                            <Input disabled={!isEditMode} />
                          </Form.Item>
                        </Col>
                      </Row>
                    ) : null
                  }
                </Form.Item>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      label="Giá nhập"
                      name="importPrice"
                      style={{ marginBottom: 16 }}
                      rules={[{ required: true, message: 'Nhập giá nhập' }]}
                    >
                      <InputNumber 
                        min={0}
                        disabled={!isEditMode}
                        style={{ width: '100%' }}
                        formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={value => value.replace(/\$\s?|(,*)/g, '')}
                        onKeyDown={handleNumberKeyDown}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label="Giá bán"
                      name="sellingPrice"
                      style={{ marginBottom: 16 }}
                      rules={[{ required: true, message: 'Nhập giá bán' }]}
                    >
                      <InputNumber 
                        min={0}
                        disabled={!isEditMode}
                        style={{ width: '100%' }}
                        formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={value => value.replace(/\$\s?|(,*)/g, '')}
                        onKeyDown={handleNumberKeyDown}
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <div style={{ display: 'flex', gap: 16, marginTop: 24, justifyContent: 'flex-end' }}>
                  {(() => {
                    const status =
                      selectedPart?.originalItem?.status ||
                      selectedPart?.status ||
                      ''
                    const isInStock =
                      status === 'Đủ hàng' ||
                      status === 'IN_STOCK'

                    return !isInStock ? (
                      <Button 
                        style={{
                          backgroundColor: '#C9A961',
                          color: '#fff',
                          border: 'none',
                          padding: '8px 40px',
                          height: 'auto',
                          fontSize: '14px',
                          fontWeight: 500
                        }}
                        onClick={() => {
                          setModalOpen(false)
                          // Navigate to create ticket with part data
                          navigate('/warehouse/create-ticket', {
                            state: {
                              part: selectedPart,
                              ticketType: 'import'
                            }
                          })
                        }}
                      >
                        Nhập hàng
                      </Button>
                    ) : null
                  })()}
                  {isEditMode ? (
                    <Button 
                      type="primary"
                      onClick={handleSavePart}
                      style={{
                        backgroundColor: '#52c41a',
                        border: 'none',
                        padding: '8px 40px',
                        height: 'auto',
                        fontSize: '14px',
                        fontWeight: 500
                      }}
                    >
                      Lưu
                    </Button>
                  ) : (
                    <Button 
                      type="primary"
                      onClick={() => setIsEditMode(true)}
                      style={{
                        backgroundColor: '#52c41a',
                        border: 'none',
                        padding: '8px 40px',
                        height: 'auto',
                        fontSize: '14px',
                        fontWeight: 500
                      }}
                    >
                      Cập nhật
                    </Button>
                  )}
                </div>
              </Form>
            </div>
          </>
        )}
      </Modal>

      <Modal
        title={null}
        open={createModalOpen}
        onCancel={handleCreateModalClose}
        closable={false}
        footer={null}
        width={580}
        styles={{ body: { background: '#fff', padding: 0 } }}
      >
        <div
          style={{
            background: '#CBB081',
            padding: '16px 20px',
            margin: '-24px -24px 24px -24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <span style={{ fontWeight: 700, fontSize: 20 }}>THÊM LINH KIỆN</span>
          <CloseOutlined style={{ cursor: 'pointer' }} onClick={handleCreateModalClose} />
        </div>

        <div style={{ padding: 24 }}>
          <Form layout="vertical" form={createForm} onFinish={handleCreatePart}>
            <div style={{ display: 'flex', gap: 16 }}>
              <Form.Item
                label="Trạng thái"
                name="status"
                style={{ flex: 1 }}
                rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
              >
                <Select
                  options={[
                    { value: 'Chờ nhập', label: 'Chờ nhập' },
                    { value: 'Đã nhập', label: 'Đã nhập' }
                  ]}
                />
              </Form.Item>
              <Form.Item
                label="Số lượng"
                name="quantityOnHand"
                style={{ flex: 1 }}
                rules={[{ required: true, message: 'Nhập số lượng' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </div>

            <Form.Item
              label="Tên linh kiện"
              name="name"
              rules={[{ required: true, message: 'Vui lòng nhập tên linh kiện' }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              label="Xuất xứ"
              name="origin"
              rules={[{ required: true, message: 'Vui lòng chọn xuất xứ' }]}
            >
              <Select
                placeholder="Chọn xuất xứ"
                showSearch
                allowClear
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
                options={markets.map(market => ({
                  value: market.id || market.marketId,
                  label: market.name || market.marketName || ''
                }))}
              />
            </Form.Item>

            <Form.Item name="useForAllModels" valuePropName="checked">
              <Checkbox>Dùng chung tất cả dòng xe</Checkbox>
            </Form.Item>

            <div style={{ display: 'flex', gap: 16 }}>
              <Form.Item
                label="Giá bán"
                name="sellingPrice"
                style={{ flex: 1 }}
                rules={[{ required: true, message: 'Nhập giá bán' }]}
              >
                <InputNumber
                  min={0}
                  style={{ width: '100%' }}
                  addonAfter="/ đ"
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => (value || '').replace(/[^\d]/g, '')}
                  onKeyDown={handleNumberKeyDown}
                />
              </Form.Item>
              <Form.Item
                label="Giá nhập"
                name="importPrice"
                style={{ flex: 1 }}
                rules={[{ required: true, message: 'Nhập giá nhập' }]}
              >
                <InputNumber
                  min={0}
                  style={{ width: '100%' }}
                  addonAfter="/ đ"
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => (value || '').replace(/[^\d]/g, '')}
                  onKeyDown={handleNumberKeyDown}
                />
              </Form.Item>
            </div>

              <Form.Item
                label="Đơn vị"
                name="unit"
                rules={[{ required: true, message: 'Vui lòng chọn đơn vị' }]}
              >
                <Input placeholder="lít, bộ, cái..." />
              </Form.Item>

            <Form.Item label="Ghi chú" name="note">
              <Input.TextArea rows={3} />
            </Form.Item>

            <div style={{ textAlign: 'center', marginTop: 8 }}>
              <Button type="primary" htmlType="submit">
                Xác nhận
              </Button>
            </div>
          </Form>
        </div>
      </Modal>

      {/* Filter Modal */}
      <Modal
        title="Bộ lọc sản phẩm"
        open={filterModalOpen}
        onCancel={() => setFilterModalOpen(false)}
        footer={null}
        width={450}
      >
        <div style={{ padding: '8px 0' }}>
          {/* Trạng thái linh kiện */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Trạng thái linh kiện</div>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Checkbox
                checked={tempFilters.status.includes('Đủ hàng')}
                onChange={() => handleFilterChange('status', 'Đủ hàng')}
              >
                Đủ hàng
              </Checkbox>
              <Checkbox
                checked={tempFilters.status.includes('Sắp hết')}
                onChange={() => handleFilterChange('status', 'Sắp hết')}
              >
                Sắp hết
              </Checkbox>
              <Checkbox
                checked={tempFilters.status.includes('Hết hàng')}
                onChange={() => handleFilterChange('status', 'Hết hàng')}
              >
                Hết hàng
              </Checkbox>
            </Space>
          </div>

          {/* Loại linh kiện */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Loại linh kiện</div>
            <Select
              mode="multiple"
              allowClear
              showSearch
              placeholder="Chọn loại linh kiện"
              style={{ width: '100%', fontFamily: 'Arial, sans-serif' }}
              value={tempFilters.categoryIds}
              onChange={(values) => {
                console.log('Selected categories:', values)
                const selectedValues = values || []
                setTempFilters(prev => {
                  console.log('Previous filters:', prev)
                  const newFilters = { ...prev, categoryIds: selectedValues }
                  console.log('New filters:', newFilters)
                  return newFilters
                })
              }}
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              notFoundContent={categories.length === 0 ? "Đang tải..." : "Không có dữ liệu"}
              maxTagCount="responsive"
              maxTagTextLength={50}
              tagRender={(props) => {
                const { label, closable, onClose } = props
                return (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      backgroundColor: '#fafafa',
                      border: '1px solid #d9d9d9',
                      borderRadius: '4px',
                      padding: '0 7px',
                      marginRight: '4px',
                      fontSize: '14px',
                      lineHeight: '22px',
                      fontFamily: 'Arial, sans-serif',
                      height: '24px'
                    }}
                  >
                    <span style={{ marginRight: closable ? '4px' : '0' }}>{label}</span>
                    {closable && (
                      <span
                        onClick={onClose}
                        style={{
                          cursor: 'pointer',
                          fontSize: '12px',
                          color: '#00000073'
                        }}
                      >
                        ×
                      </span>
                    )}
                  </span>
                )
              }}
              options={categories.map(cat => ({
                value: cat.id || cat.partCategoryId,
                label: cat.name
              }))}
            />
          </div>

          {/* Buttons */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'flex-end', 
            gap: 12,
            marginTop: 24 
          }}>
            <Button onClick={handleResetFilter}>
              Đặt lại
            </Button>
            <Button 
              type="primary" 
              onClick={handleApplyFilter}
              style={{
                backgroundColor: '#1890ff',
                borderColor: '#1890ff'
              }}
            >
              Tìm kiếm
            </Button>
          </div>
        </div>
      </Modal>

      {/* New Part Modal */}
      <Modal
        title={null}
        open={newPartModalOpen}
        onCancel={() => {
          setNewPartModalOpen(false)
          newPartForm.resetFields()
          setModels([]) // Reset models khi đóng modal
        }}
        closable={false}
        footer={null}
        width={580}
        styles={{ body: { background: '#fff', padding: 0 } }}
      >
        <div
          style={{
            background: '#CBB081',
            padding: '16px 20px',
            margin: '-24px -24px 24px -24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <span style={{ fontWeight: 700, fontSize: 20 }}>THÊM LINH KIỆN</span>
          <CloseOutlined style={{ cursor: 'pointer' }} onClick={() => {
            setNewPartModalOpen(false)
            newPartForm.resetFields()
          }} />
        </div>

        <div style={{ padding: 24 }}>
          <Form layout="vertical" form={newPartForm} onFinish={handleCreatePart}>
            <Form.Item 
              label={<span><span style={{ color: '#ef4444' }}>*</span> Tên linh kiện</span>}
              name="name" 
              required={false}
              rules={[{ required: true, message: 'Vui lòng nhập tên linh kiện' }]}
              style={{ marginBottom: 16 }}
            >
              <Input placeholder="Nhập tên linh kiện" />
            </Form.Item>

            <Form.Item
              label={<span><span style={{ color: '#ef4444' }}>*</span> Danh mục</span>}
              name="categoryId"
              required={false}
              style={{ marginBottom: 16 }}
              rules={[{ required: true, message: 'Chọn loại linh kiện' }]}
            >
              <Select
                placeholder="Chọn loại linh kiện"
                showSearch
                allowClear
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
                options={categories.map(cat => ({
                  value: cat.id || cat.partCategoryId,
                  label: cat.name
                }))}
              />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label={<span><span style={{ color: '#ef4444' }}>*</span> Xuất xứ</span>}
                  name="origin"
                  required={false}
                  style={{ marginBottom: 16 }}
                  rules={[{ required: true, message: 'Chọn xuất xứ' }]}
                >
                  <Select
                    placeholder="Chọn xuất xứ"
                    showSearch
                    allowClear
                    filterOption={(input, option) =>
                      (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                    options={markets.map(market => ({
                      value: market.id || market.marketId,
                      label: market.name || market.marketName || ''
                    }))}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label={<span><span style={{ color: '#ef4444' }}>*</span> Đơn vị</span>}
                  name="unit"
                  required={false}
                  style={{ marginBottom: 16 }}
                  rules={[{ required: true, message: 'Chọn đơn vị' }]}
                >
                  <Select
                    placeholder="Chọn đơn vị"
                    showSearch
                    allowClear
                    filterOption={(input, option) =>
                      (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                    options={units.map(unit => ({
                      value: unit.id,
                      label: unit.name
                    }))}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label={<span><span style={{ color: '#ef4444' }}>*</span> Lượng tối thiểu</span>}
                  name="alertThreshold"
                  required={false}
                  style={{ marginBottom: 16 }}
                  rules={[{ required: true, message: 'Nhập lượng tối thiểu' }]}
                >
                  <InputNumber
                    min={0}
                    style={{ width: '100%' }}
                    placeholder="Nhập lượng tối thiểu"
                    formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                    onKeyDown={handleNumberKeyDown}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label={<span><span style={{ color: '#ef4444' }}>*</span> Nhà cung cấp</span>}
                  name="supplier"
                  required={false}
                  style={{ marginBottom: 16 }}
                  rules={[{ required: true, message: 'Chọn nhà cung cấp' }]}
                >
                  <Select
                    placeholder="Chọn nhà cung cấp"
                    showSearch
                    allowClear
                    filterOption={(input, option) =>
                      (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                    options={suppliers.map(supplier => ({
                      value: supplier.id || supplier.supplierId,
                      label: supplier.name || supplier.supplierName || supplier.companyName || ''
                    }))}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item name="useForAllModels" valuePropName="checked" style={{ marginBottom: 16 }}>
              <Checkbox>Dùng chung</Checkbox>
            </Form.Item>

            <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => prevValues.useForAllModels !== currentValues.useForAllModels}>
              {({ getFieldValue }) =>
                !getFieldValue('useForAllModels') ? (
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item label="Hãng xe" name="vehicleBrand" style={{ marginBottom: 16 }}>
                        <Select
                          placeholder="Chọn hãng xe"
                          showSearch
                          allowClear
                          filterOption={(input, option) =>
                            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                          }
                          onChange={(brandId) => {
                            // Reset dòng xe khi đổi hãng xe
                            newPartForm.setFieldsValue({ vehicleModel: undefined })
                            fetchModelsByBrand(brandId)
                          }}
                          options={brands.map(brand => ({
                            value: brand.id || brand.brandId,
                            label: brand.name || brand.brandName || ''
                          }))}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label="Dòng xe" name="vehicleModel" style={{ marginBottom: 16 }}>
                        <Select
                          placeholder="Chọn dòng xe"
                          showSearch
                          allowClear
                          disabled={!newPartForm.getFieldValue('vehicleBrand')}
                          filterOption={(input, option) =>
                            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                          }
                          options={models.map(model => ({
                            value: model.id || model.modelId,
                            label: model.name || model.modelName || ''
                          }))}
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                ) : null
              }
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label={<span><span style={{ color: '#ef4444' }}>*</span> Giá nhập</span>}
                  name="importPrice"
                  required={false}
                  style={{ marginBottom: 16 }}
                  rules={[
                    { required: true, message: 'Nhập giá nhập' },
                    { type: 'number', min: 0.01, message: 'Giá nhập phải lớn hơn 0' }
                  ]}
                >
                  <InputNumber 
                    min={0.01} 
                    style={{ width: '100%' }}
                    placeholder="Nhập giá nhập"
                    formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={value => value.replace(/\$\s?|(,*)/g, '')}
                    onKeyDown={handleNumberKeyDown}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label={<span><span style={{ color: '#ef4444' }}>*</span> Giá bán</span>}
                  name="sellingPrice"
                  required={false}
                  style={{ marginBottom: 16 }}
                  rules={[
                    { required: true, message: 'Nhập giá bán' },
                    { type: 'number', min: 0.01, message: 'Giá bán phải lớn hơn 0' }
                  ]}
                >
                  <InputNumber 
                    min={0.01} 
                    style={{ width: '100%' }}
                    placeholder="Nhập giá bán"
                    formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={value => value.replace(/\$\s?|(,*)/g, '')}
                    onKeyDown={handleNumberKeyDown}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item label="Ghi chú" name="note" style={{ marginBottom: 16 }}>
              <Input.TextArea rows={3} placeholder="Nhập ghi chú (nếu có)" />
            </Form.Item>

            <div style={{ display: 'flex', gap: 16, marginTop: 24, justifyContent: 'flex-end' }}>
              <Button 
                type="primary"
                htmlType="submit"
                style={{
                  backgroundColor: '#52c41a',
                  border: 'none',
                  padding: '8px 40px',
                  height: 'auto',
                  fontSize: '14px',
                  fontWeight: 500
                }}
              >
                Lưu
              </Button>
            </div>
          </Form>
        </div>
      </Modal>
    </WarehouseLayout>
  )
}

