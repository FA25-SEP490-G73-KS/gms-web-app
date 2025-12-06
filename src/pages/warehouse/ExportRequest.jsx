import React, { useState, useEffect } from 'react'
import { Table, Input, Button, Tag, message, Modal, Select, Checkbox, DatePicker } from 'antd'
import { SearchOutlined, CloseOutlined, CalendarOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import WarehouseLayout from '../../layouts/WarehouseLayout'
import { goldTableHeader } from '../../utils/tableComponents'
import { priceQuotationAPI } from '../../services/api'

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
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedPart, setSelectedPart] = useState(null)
  const [selectedItemId, setSelectedItemId] = useState(null) // Store priceQuotationItemId
  const [modalLoading, setModalLoading] = useState(false)
  const [hasExistingPart, setHasExistingPart] = useState(false) // Track nếu part đã tồn tại
  
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

  const handleOpenModal = async (partRecord) => {
    console.log('handleOpenModal called with partRecord:', partRecord)
    setSelectedPart(partRecord)
    setIsModalOpen(true)
    setModalLoading(true)
    
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
  }

  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleConfirm = async () => {
    if (!selectedItemId) {
      message.error('Không tìm thấy ID của item')
      return
    }
    
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
      title: 'Code',
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
          
          // Nếu đã từ chối - hiển thị tag đỏ nhưng vẫn cho xem
          if (reviewStatus === 'Từ chối') {
            return (
              <Tag 
                color="red" 
                style={{ borderRadius: '6px', fontWeight: 500, cursor: 'pointer' }}
                onClick={(e) => {
                  e.stopPropagation()
                  handleOpenModal(partRecord)
                }}
              >
                Từ chối
              </Tag>
            )
          }
          
          // Nếu đã xác nhận - hiển thị tag xanh nhưng vẫn cho xem
          if (reviewStatus === 'Xác nhận' || reviewStatus === 'Đã xác nhận') {
            return (
              <Tag 
                color="green" 
                style={{ borderRadius: '6px', fontWeight: 500, cursor: 'pointer' }}
                onClick={(e) => {
                  e.stopPropagation()
                  handleOpenModal(partRecord)
                }}
              >
                Xác nhận
              </Tag>
            )
          }
          
          // Chưa xem xét - hiển thị nút "Xác nhận"
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

          {/* Date picker ở giữa */}
          <DatePicker
            placeholder="Ngày tạo"
            suffixIcon={<CalendarOutlined />}
            style={{ 
              width: '250px',
              borderRadius: '8px'
            }}
          />

          {/* Filter buttons bên phải */}
          <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
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
            expandRowByClick: true
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
          width={500}
          closeIcon={<CloseOutlined />}
          styles={{
            header: {
              backgroundColor: '#D4AF37',
              color: '#000',
              padding: '16px 24px',
              borderRadius: '8px 8px 0 0'
            }
          }}
        >
          <div style={{ backgroundColor: '#D4AF37', padding: '16px 24px', margin: '-20px -24px 20px', borderRadius: '8px 8px 0 0' }}>
            <h2 style={{ margin: 0, color: '#000', fontSize: '18px', fontWeight: 600, textAlign: 'center' }}>
              PHIẾU MUA HÀNG
            </h2>
          </div>

          <div style={{ padding: '0 10px' }}>
            <div style={{ marginBottom: '16px', fontSize: '14px', color: '#666' }}>
              Lập phiếu mua hàng nhập
            </div>

            {/* Trạng thái */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontWeight: 600 }}>Trạng thái</label>
                <div style={{ color: '#999' }}>
                  {hasExistingPart ? 'Đã có' : 'Không rõ'}
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontWeight: 600 }}>Số lượng: </label>
                <span>{formData.quantity || 0}</span>
              </div>
            </div>

            {/* Tên linh kiện */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontWeight: 600 }}>
                Tên linh kiện <span style={{ color: 'red' }}>*</span>
              </label>
              <Input
                value={formData.partName}
                onChange={(e) => handleFormChange('partName', e.target.value)}
                placeholder="Dầu máy 5W-30"
                disabled={hasExistingPart || formData.isReviewed}
                style={{ marginTop: '4px' }}
              />
            </div>

            {/* Loại linh kiện */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontWeight: 600 }}>
                Loại linh kiện <span style={{ color: 'red' }}>*</span>
              </label>
              <Select
                value={formData.partType}
                onChange={(value) => handleFormChange('partType', value)}
                disabled={hasExistingPart || formData.isReviewed}
                style={{ width: '100%', marginTop: '4px' }}
              >
                <Option value="Dầu – Hóa chất">Dầu – Hóa chất</Option>
                <Option value="Phụ tùng">Phụ tùng</Option>
                <Option value="Phụ kiện">Phụ kiện</Option>
              </Select>
            </div>

            {/* Xuất xứ */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontWeight: 600 }}>
                Xuất xứ <span style={{ color: 'red' }}>*</span>
              </label>
              <Input
                value={formData.origin}
                onChange={(e) => handleFormChange('origin', e.target.value)}
                disabled={hasExistingPart || formData.isReviewed}
                placeholder="VN, JP, US..."
                style={{ marginTop: '4px' }}
              />
            </div>

            {/* Checkbox */}
            <div style={{ marginBottom: '16px' }}>
              <Checkbox
                checked={formData.usedForAllCars}
                onChange={(e) => handleFormChange('usedForAllCars', e.target.checked)}
                disabled={hasExistingPart || formData.isReviewed}
              >
                Dùng chung tất cả dòng xe
              </Checkbox>
            </div>

            {/* Nhà phân phối */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontWeight: 600 }}>
                Nhà phân phối <span style={{ color: 'red' }}>*</span>
              </label>
              <Select
                value={formData.manufacturer}
                onChange={(value) => handleFormChange('manufacturer', value)}
                disabled={hasExistingPart || formData.isReviewed}
                style={{ width: '100%', marginTop: '4px' }}
              >
                {formData.manufacturer && (
                  <Option value={formData.manufacturer}>{formData.manufacturer}</Option>
                )}
                <Option value="Petrolimex Lubricants">Petrolimex Lubricants</Option>
                <Option value="Shell Vietnam">Shell Vietnam</Option>
                <Option value="Castrol Vietnam">Castrol Vietnam</Option>
                <Option value="Toyota Genuine Parts">Toyota Genuine Parts</Option>
              </Select>
            </div>

            {/* Hãng (nếu không check "dùng chung") */}
            {!formData.usedForAllCars && (
              <>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ fontWeight: 600 }}>Hãng</label>
                  <Select
                    value={formData.brand}
                    onChange={(value) => handleFormChange('brand', value)}
                    disabled={hasExistingPart || formData.isReviewed}
                    style={{ width: '100%', marginTop: '4px' }}
                  >
                    {formData.brand && (
                      <Option value={formData.brand}>{formData.brand}</Option>
                    )}
                    <Option value="Toyota">Toyota</Option>
                    <Option value="Honda">Honda</Option>
                    <Option value="Vinfast">Vinfast</Option>
                  </Select>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ fontWeight: 600 }}>Dòng xe</label>
                  <Select
                    value={formData.carModel}
                    onChange={(value) => handleFormChange('carModel', value)}
                    disabled={hasExistingPart || formData.isReviewed}
                    style={{ width: '100%', marginTop: '4px' }}
                  >
                    {formData.carModel && (
                      <Option value={formData.carModel}>{formData.carModel}</Option>
                    )}
                    <Option value="Vios">Vios</Option>
                    <Option value="Camry">Camry</Option>
                    <Option value="Civic">Civic</Option>
                    <Option value="VF3">VF3</Option>
                    <Option value="VF5">VF5</Option>
                    <Option value="VF8">VF8</Option>
                  </Select>
                </div>
              </>
            )}

            {/* Giá nhập */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontWeight: 600 }}>
                Giá nhập <span style={{ color: 'red' }}>*</span>
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <Input
                  type="number"
                  value={formData.priceImport}
                  onChange={(e) => handleFormChange('priceImport', e.target.value)}
                  placeholder="130,000"
                  disabled={hasExistingPart || formData.isReviewed}
                />
                <span>/ vnđ</span>
              </div>
            </div>

            {/* Giá bán */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontWeight: 600 }}>
                Giá bán <span style={{ color: 'red' }}>*</span>
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <Input
                  type="number"
                  value={formData.priceSell}
                  onChange={(e) => handleFormChange('priceSell', e.target.value)}
                  placeholder="120,000"
                  disabled={hasExistingPart || formData.isReviewed}
                />
                <span>/ vnđ</span>
              </div>
            </div>

            {/* Đơn vị */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontWeight: 600 }}>
                Đơn vị <span style={{ color: 'red' }}>*</span>
              </label>
              <Select
                value={formData.unit}
                onChange={(value) => handleFormChange('unit', value)}
                disabled={hasExistingPart || formData.isReviewed}
                style={{ width: '100%', marginTop: '4px' }}
              >
                <Option value="lít">lít</Option>
                <Option value="cái">cái</Option>
                <Option value="bộ">bộ</Option>
              </Select>
            </div>

            {/* Ghi chú */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ fontWeight: 600 }}>
                Ghi chú/Lý do <span style={{ color: 'red' }}>*</span>
              </label>
              <Input.TextArea
                value={formData.note}
                onChange={(e) => handleFormChange('note', e.target.value)}
                placeholder="Nhập nội dung"
                rows={3}
                disabled={(hasExistingPart && formData.specialPart === true) || formData.isReviewed}
                style={{ 
                  marginTop: '4px',
                  backgroundColor: ((hasExistingPart && formData.specialPart === true) || formData.isReviewed) ? '#f5f5f5' : 'white'
                }}
              />
            </div>

            <div style={{ fontSize: '12px', color: '#888', marginBottom: '16px' }}>
              Linh kiện đặc biệt kiểm tra thông tin
            </div>

            {/* Buttons - chỉ hiển thị khi chưa review */}
            {!formData.isReviewed && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <Button
                  danger
                  onClick={handleReject}
                  loading={modalLoading}
                  style={{ minWidth: '100px' }}
                >
                  Từ chối
                </Button>
                <Button
                  type="primary"
                  onClick={handleConfirm}
                  loading={modalLoading}
                  style={{ 
                    minWidth: '100px',
                    backgroundColor: '#52c41a',
                    borderColor: '#52c41a'
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
