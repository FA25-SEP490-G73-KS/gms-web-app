import React, { useState, useEffect, useMemo } from 'react'
import { Table, Input, Button, Tag, Dropdown, message, Modal, Checkbox, DatePicker, InputNumber, Space, Tabs } from 'antd'
import { SearchOutlined, FilterOutlined, MoreOutlined, ShoppingCartOutlined, InfoCircleOutlined, CalendarOutlined, ShoppingOutlined, CheckCircleOutlined, FileTextOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import WarehouseLayout from '../../layouts/WarehouseLayout'
import { goldTableHeader } from '../../utils/tableComponents'
import { purchaseRequestAPI } from '../../services/api'
import dayjs from 'dayjs'
import { getEmployeeIdFromToken } from '../../utils/helpers'

const { Search } = Input
const { RangePicker } = DatePicker
const { TextArea } = Input

export default function WarehousePurchaseRequest() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  
  // Filter modal states
  const [filterModalVisible, setFilterModalVisible] = useState(false)
  const [filterForm, setFilterForm] = useState({
    statuses: [],
    dateRange: null
  })

  // Create purchase request modal states
  const [purchaseModalVisible, setPurchaseModalVisible] = useState(false)
  const [purchaseItems, setPurchaseItems] = useState([])
  const [purchaseLoading, setPurchaseLoading] = useState(false)
  const [purchaseError, setPurchaseError] = useState(null)
  const [selectedPurchaseKeys, setSelectedPurchaseKeys] = useState([])
  const [purchaseQuantities, setPurchaseQuantities] = useState({})
  const [purchaseReason, setPurchaseReason] = useState('')
  const [purchaseNote, setPurchaseNote] = useState('')
  const [createPurchaseLoading, setCreatePurchaseLoading] = useState(false)
  
  // Tab state
  const [activeTab, setActiveTab] = useState('manual') // 'manual' | 'quotation'
  
  // Quotation tab states
  const [quotations, setQuotations] = useState([])
  const [quotationLoading, setQuotationLoading] = useState(false)
  const [selectedQuotationIds, setSelectedQuotationIds] = useState([])
  const [quotationItems, setQuotationItems] = useState([])
  const [selectedQuotationItemIds, setSelectedQuotationItemIds] = useState([])
  const [quotationItemQuantities, setQuotationItemQuantities] = useState({})
  const [quotationFilters, setQuotationFilters] = useState({
    searchTerm: '',
    fromDate: null,
    toDate: null,
    customerId: null
  })

  useEffect(() => {
    fetchData()
  }, [page, pageSize])

  const fetchData = async (filters = {}) => {
    setLoading(true)
    try {
      // Build query params
      const params = new URLSearchParams()
      params.append('page', (page - 1).toString())
      params.append('size', pageSize.toString())
      
      if (searchTerm) {
        params.append('keyword', searchTerm)
      }
      
      if (filters.statuses && filters.statuses.length > 0) {
        // Use the first selected status (API accepts one status)
        params.append('status', filters.statuses[0])
      }
      
      if (filters.dateRange && filters.dateRange.length === 2) {
        const [fromDate, toDate] = filters.dateRange
        params.append('fromDate', fromDate.format('DDMMYYYY'))
        params.append('toDate', toDate.format('DDMMYYYY'))
      }
      
      const queryString = params.toString()
      const { data: response, error } = await purchaseRequestAPI.getAll(page - 1, pageSize, queryString)
      
      if (error) {
        console.error('API error:', error)
        message.error(error || 'Không thể tải danh sách yêu cầu mua hàng')
        setData([])
        setTotal(0)
        return
      }

      const result = response?.result || {}
      const content = result.content || []
      
      // Map API response to UI structure
      const mappedData = content.map(item => ({
        id: item.id || 0,
        code: item.code || 'N/A',
        reason: item.reason || 'N/A',
        totalAmount: item.totalEstimatedAmount || 0,
        createdAt: item.createdAt || new Date().toISOString(),
        status: item.reviewStatus || 'Chờ duyệt'
      }))
      
      setData(mappedData)
      setTotal(result.totalElements || content.length)
    } catch (err) {
      console.error('Failed to fetch purchase requests:', err)
      message.error('Không thể tải danh sách yêu cầu mua hàng')
      setData([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }

  const getStatusConfig = (status) => {
    const configs = {
      'Đã duyệt': { color: '#22c55e', bg: '#dcfce7', text: 'Đã duyệt' },
      'Chờ duyệt': { color: '#faad14', bg: '#fffbe6', text: 'Chờ duyệt' },
      'Chờ nhập': { color: '#faad14', bg: '#fffbe6', text: 'Chờ duyệt' },
      'Từ chối': { color: '#ef4444', bg: '#fee2e2', text: 'Từ chối' }
    }
    return configs[status] || { color: '#666', bg: '#f3f4f6', text: status }
  }

  const getMenuItems = (record) => [
    {
      key: 'detail',
      label: 'Xem chi tiết',
      onClick: () => {
        navigate(`/warehouse/purchase-requests/${record.id}`)
      }
    }
  ]

  const handleFilterApply = () => {
    fetchData(filterForm)
    setFilterModalVisible(false)
  }

  const handleFilterReset = () => {
    const resetForm = {
      statuses: [],
      dateRange: null
    }
    setFilterForm(resetForm)
    setPage(1)
    fetchData(resetForm)
  }

  const handleStatusChange = (status, checked) => {
    setFilterForm(prev => ({
      ...prev,
      statuses: checked 
        ? [...prev.statuses, status]
        : prev.statuses.filter(s => s !== status)
    }))
  }

  // ===== Create purchase request helpers =====
  const fetchSuggestedItems = async () => {
    setPurchaseLoading(true)
    setPurchaseError(null)
    try {
      const { data, error } = await purchaseRequestAPI.getSuggestedItems()
      if (error) {
        throw new Error(error)
      }
      const result = data?.result || data || []
      const list = Array.isArray(result) ? result : []
      const mapped = list.map((item) => {
        const quantityInStock = item.quantityInStock ?? 0
        const reservedQuantity = item.reservedQuantity ?? 0
        const available =
          item.available != null
            ? item.available
            : quantityInStock - reservedQuantity

        const reorderLevel = item.reorderLevel ?? 0
        const shortage =
          reorderLevel > 0
            ? Math.max(0, reorderLevel - (available ?? 0))
            : 0

        return {
          key: item.partId,
          partId: item.partId,
          sku: item.sku || 'N/A',
          partName: item.partName || 'N/A',
          quantityInStock,
          reservedQuantity,
          available,
          reorderLevel,
          shortage,
          suggestedQuantity: item.suggestedQuantity ?? 0,
        }
      })

      const initialQuantities = {}
      mapped.forEach((it) => {
        initialQuantities[it.partId] = it.suggestedQuantity || 0
      })

      setPurchaseItems(mapped)
      setPurchaseQuantities(initialQuantities)
    } catch (err) {
      console.error('Failed to fetch suggested items:', err)
      setPurchaseError(
        err?.message || 'Không thể tải danh sách linh kiện đề xuất. Vui lòng thử lại.'
      )
    } finally {
      setPurchaseLoading(false)
    }
  }

  const purchaseColumns = [
    {
      title: 'Mã SKU',
      key: 'nameSku',
      width: 300,
      ellipsis: true,
      render: (record) => (
        <span title={`${record.partName} (${record.sku})`}>
          {record.partName}{' '}
          <span style={{ color: '#6b7280' }}>({record.sku})</span>
        </span>
      ),
    },
    {
      title: 'Tồn',
      dataIndex: 'quantityInStock',
      key: 'quantityInStock',
      width: 100,
      align: 'right',
      render: (value) => (value != null ? value : 0),
    },
    {
      title: 'SL giữ',
      dataIndex: 'reservedQuantity',
      key: 'reservedQuantity',
      width: 100,
      align: 'right',
      render: (value) => (value != null ? value : 0),
    },
    {
      title: 'SL tối thiểu',
      dataIndex: 'reorderLevel',
      key: 'reorderLevel',
      width: 120,
      align: 'right',
      render: (value) => (value != null ? value : 0),
    },
    {
      title: 'SL cần mua',
      key: 'purchaseQuantity',
      width: 130,
      align: 'right',
      render: (_, record) => {
        const value =
          purchaseQuantities[record.partId] ??
          record.suggestedQuantity ??
          0
        return (
          <InputNumber
            min={0}
            value={value}
            onChange={(val) => {
              const num = typeof val === 'number' ? val : 0
              setPurchaseQuantities((prev) => ({
                ...prev,
                [record.partId]: num,
              }))
            }}
            style={{ width: '100%' }}
          />
        )
      },
    },
  ]

  const validPurchaseItems = useMemo(() => {
    if (!purchaseItems || purchaseItems.length === 0) return []
    return purchaseItems.filter((item) => {
      if (!selectedPurchaseKeys.includes(item.partId)) return false
      const qty =
        typeof purchaseQuantities[item.partId] === 'number'
          ? purchaseQuantities[item.partId]
          : item.suggestedQuantity || 0
      return qty > 0
    })
  }, [purchaseItems, selectedPurchaseKeys, purchaseQuantities])

  // ===== Quotation tab functions =====
  const fetchAvailableQuotations = async () => {
    setQuotationLoading(true)
    try {
      const params = {
        page: 0,
        size: 100
      }
      
      if (quotationFilters.fromDate) {
        params.fromDate = quotationFilters.fromDate.format('DDMMYYYY')
      }
      if (quotationFilters.toDate) {
        params.toDate = quotationFilters.toDate.format('DDMMYYYY')
      }
      if (quotationFilters.customerId) {
        params.customerId = quotationFilters.customerId
      }
      
      const { data, error } = await purchaseRequestAPI.getAvailableQuotations(params)
      if (error) {
        throw new Error(error)
      }
      
      const result = data?.result || data || {}
      const content = Array.isArray(result) ? result : (result.content || [])
      
      const mapped = content.map((q) => ({
        id: q.priceQuotationId || q.id,
        code: q.code || 'N/A',
        customerName: q.customerName || q.customer?.fullName || 'N/A',
        createdAt: q.createdAt || new Date().toISOString(),
        status: q.status || 'DRAFT',
        totalAmount: q.estimateAmount || 0
      }))
      
      setQuotations(mapped)
    } catch (err) {
      console.error('Failed to fetch quotations:', err)
      message.error(err?.message || 'Không thể tải danh sách báo giá')
      setQuotations([])
    } finally {
      setQuotationLoading(false)
    }
  }

  const handleSelectQuotations = async (quotationIds) => {
    setSelectedQuotationIds(quotationIds)
    
    if (quotationIds.length === 0) {
      setQuotationItems([])
      setSelectedQuotationItemIds([])
      setQuotationItemQuantities({})
      return
    }
    
    // Load items từ các quotations đã chọn
    try {
      const allItems = []
      for (const quotationId of quotationIds) {
        const { data, error } = await purchaseRequestAPI.getQuotationItems(quotationId)
        if (!error && data?.result) {
          const items = Array.isArray(data.result) ? data.result : (data.result.items || [])
          items.forEach(item => {
            if (item.itemType === 'PART') { // Chỉ lấy part items
              // Lấy SKU từ part object trong response
              const sku = item.part?.sku || item.sku || item.partSku || 'N/A'
              const partId = item.part?.partId || item.partId
              const partName = item.itemName || item.part?.name || item.partName || 'N/A'
              
              allItems.push({
                key: item.priceQuotationItemId || item.id,
                priceQuotationItemId: item.priceQuotationItemId || item.id,
                quotationId: quotationId,
                quotationCode: quotations.find(q => q.id === quotationId)?.code || 'N/A',
                partId: partId,
                sku: sku,
                partName: partName,
                quantity: item.quantity || 0,
                unitPrice: item.unitPrice || 0,
                totalPrice: item.totalPrice || 0,
                unit: item.unit || 'Cái',
                quantityInStock: item.part?.quantity ?? null,
                reservedQuantity: item.part?.reservedQuantity ?? 0,
                reorderLevel: item.part?.reorderLevel ?? 0
              })
            }
          })
        }
      }
      
      setQuotationItems(allItems)
      
      // Set initial quantities
      const initialQuantities = {}
      allItems.forEach(item => {
        initialQuantities[item.priceQuotationItemId] = item.quantity
      })
      setQuotationItemQuantities(initialQuantities)
      
      // Auto select all items
      setSelectedQuotationItemIds(allItems.map(item => item.priceQuotationItemId))
    } catch (err) {
      console.error('Failed to load quotation items:', err)
      message.error('Không thể tải chi tiết báo giá')
    }
  }

  const validQuotationItems = useMemo(() => {
    return quotationItems.filter(item => {
      if (!selectedQuotationItemIds.includes(item.priceQuotationItemId)) return false
      const qty = quotationItemQuantities[item.priceQuotationItemId] || item.quantity || 0
      return qty > 0
    })
  }, [quotationItems, selectedQuotationItemIds, quotationItemQuantities])

  const handleCreatePurchaseRequest = async () => {
    const employeeId = getEmployeeIdFromToken()
    if (!employeeId) {
      message.error('Không tìm thấy thông tin nhân viên. Vui lòng đăng nhập lại.')
      return
    }

    setCreatePurchaseLoading(true)
    try {
      let payload
      
      if (activeTab === 'quotation') {
        // Tạo từ quotation items
        if (validQuotationItems.length === 0) {
          message.error('Vui lòng chọn ít nhất một linh kiện từ báo giá')
          return
        }
        
        // Lấy tất cả unique quotationIds từ các items đã chọn
        const uniqueQuotationIds = [...new Set(validQuotationItems.map(item => item.quotationId).filter(id => id != null))]
        
        if (uniqueQuotationIds.length === 0) {
          message.error('Không tìm thấy thông tin báo giá')
          return
        }
        
        // Payload theo DTO CreatePurchaseRequestFromQuotationDto
        payload = {
          quotationIds: uniqueQuotationIds,
          quotationItemIds: validQuotationItems.map(item => item.priceQuotationItemId),
          reason: purchaseReason?.trim() || null,
          note: purchaseNote?.trim() || null
        }
        
        const { data, error } = await purchaseRequestAPI.createFromQuotation(payload)
        if (error || !data || (data.statusCode && data.statusCode !== 200 && data.statusCode !== 201)) {
          const msg = error || data?.message || 'Không thể tạo yêu cầu mua hàng. Vui lòng thử lại.'
          message.error(msg)
          return
        }
        
        const result = data.result || data
        const codeText = result?.code ? ` (Mã phiếu: ${result.code})` : ''
        message.success(`Tạo yêu cầu mua hàng từ báo giá thành công${codeText}`)
      } else {
        // Tạo manual (logic cũ)
        if (validPurchaseItems.length === 0) {
          message.error('Vui lòng chọn ít nhất một linh kiện')
          return
        }

        const items = validPurchaseItems.map((item) => {
          const qty =
            typeof purchaseQuantities[item.partId] === 'number'
              ? purchaseQuantities[item.partId]
              : item.suggestedQuantity || 0
          return {
            partId: item.partId,
            quantity: qty,
          }
        })

        payload = {
          createdById: employeeId,
          reason: purchaseReason?.trim() || null,
          note: purchaseNote?.trim() || null,
          items,
        }

        const { data, error } = await purchaseRequestAPI.createManual(payload)
        if (error || !data || (data.statusCode && data.statusCode !== 200 && data.statusCode !== 201)) {
          const msg =
            error ||
            data?.message ||
            'Không thể tạo yêu cầu mua hàng. Vui lòng thử lại.'
          message.error(msg)
          return
        }

        const result = data.result || data
        const codeText = result?.code ? ` (Mã phiếu: ${result.code})` : ''
        message.success(`Tạo yêu cầu mua hàng thành công${codeText}`)
      }

      // Reset form
      setPurchaseModalVisible(false)
      setActiveTab('manual')
      setPurchaseItems([])
      setPurchaseError(null)
      setSelectedPurchaseKeys([])
      setPurchaseQuantities({})
      setQuotations([])
      setSelectedQuotationIds([])
      setQuotationItems([])
      setSelectedQuotationItemIds([])
      setQuotationItemQuantities({})
      setPurchaseReason('')
      setPurchaseNote('')
      
      // Refresh list
      fetchData(filterForm)
    } catch (err) {
      console.error('Error creating purchase request:', err)
      message.error('Đã xảy ra lỗi khi tạo yêu cầu mua hàng. Vui lòng thử lại.')
    } finally {
      setCreatePurchaseLoading(false)
    }
  }

  const filteredData = data.filter((item) => {
    const matchesSearch = !searchTerm || 
      item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.reason && item.reason.toLowerCase().includes(searchTerm.toLowerCase()))
    
    return matchesSearch
  })

  const columns = [
    {
      title: <div style={{ textAlign: 'center' }}>Mã phiếu</div>,
      dataIndex: 'code',
      key: 'code',
      width: 150,
      render: (text) => <span style={{ fontWeight: 600 }}>{text}</span>
    },
    {
      title: <div style={{ textAlign: 'center' }}>Lý do</div>,
      dataIndex: 'reason',
      key: 'reason',
      width: 200,
      align: 'center',
      ellipsis: true
    },
    {
      title: <div style={{ textAlign: 'center' }}>Tổng</div>,
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 150,
      align: 'right',
      render: (value) => `${value.toLocaleString('vi-VN')}đ`
    },
    {
      title: <div style={{ textAlign: 'center' }}>Ngày tạo</div>,
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      align: 'center',
      render: (date) => {
        if (typeof date === 'string' && date.includes('/')) {
          return date
        }
        return dayjs(date).format('DD/MM/YYYY HH:mm')
      }
    },
    {
      title: <div style={{ textAlign: 'center' }}>Trạng thái</div>,
      dataIndex: 'status',
      key: 'status',
      width: 150,
      align: 'center',
      render: (status) => {
        const config = getStatusConfig(status)
        return (
          <Tag
            style={{
              background: config.bg,
              color: config.color,
              borderColor: config.color,
              borderRadius: 999,
              padding: '4px 12px',
              fontWeight: 600,
              border: '1px solid'
            }}
          >
            {config.text}
          </Tag>
        )
      }
    },
    {
      title: '',
      key: 'action',
      width: 60,
      align: 'center',
      render: (_, record) => (
        <Dropdown
          menu={{ items: getMenuItems(record) }}
          trigger={['click']}
          placement="bottomRight"
        >
          <Button
            type="text"
            icon={<MoreOutlined style={{ fontSize: '20px' }} />}
            style={{ padding: 0 }}
          />
        </Dropdown>
      )
    }
  ]

  return (
    <WarehouseLayout>
      <div style={{ padding: '24px', background: '#ffffff', minHeight: '100vh' }}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ margin: 0, marginBottom: '20px', fontSize: '24px', fontWeight: 600 }}>Yêu cầu mua hàng</h1>

          <div style={{ 
            display: 'flex', 
            gap: '12px', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            marginBottom: '20px' 
          }}>
            {/* Left side - Search */}
            <Search
              placeholder="Tìm kiếm"
              allowClear
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onSearch={() => fetchData(filterForm)}
              style={{ width: 300 }}
              prefix={<SearchOutlined />}
            />
            
            {/* Right side - Create & Filter */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <Button
                type="primary"
                onClick={() => {
                  setPurchaseModalVisible(true)
                  setActiveTab('manual')
                  setPurchaseItems([])
                  setPurchaseError(null)
                  setSelectedPurchaseKeys([])
                  setPurchaseQuantities({})
                  setPurchaseReason('')
                  setPurchaseNote('')
                  setQuotations([])
                  setSelectedQuotationIds([])
                  setQuotationItems([])
                  setSelectedQuotationItemIds([])
                  setQuotationItemQuantities({})
                  fetchSuggestedItems()
                }}
                style={{ borderRadius: 6 }}
              >
                Tạo yêu cầu mua hàng
              </Button>
              <Button
                icon={<FilterOutlined />}
                onClick={() => setFilterModalVisible(true)}
                style={{ 
                  borderRadius: 6,
                  borderColor: '#d9d9d9',
                  fontWeight: 500
                }}
              >
                Bộ lọc
              </Button>
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
            columns={columns}
            dataSource={filteredData}
            loading={loading}
            rowKey="id"
            pagination={{
              current: page,
              pageSize: pageSize,
              total: total,
              showTotal: (total) => `Tổng ${total} phiếu mua hàng`,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50', '100'],
              onChange: (newPage, newPageSize) => {
                setPage(newPage)
                setPageSize(newPageSize)
              }
            }}
            components={goldTableHeader}
            rowClassName={(_, index) => (index % 2 === 0 ? 'table-row-even' : 'table-row-odd')}
          />
        </div>

        {/* Filter Modal */}
        <Modal
          title="Bộ lọc"
          open={filterModalVisible}
          onCancel={() => setFilterModalVisible(false)}
          footer={null}
          width={450}
        >
          <div style={{ padding: '8px 0' }}>
            {/* Status Filter */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>Trạng thái phiếu</div>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Checkbox
                  checked={filterForm.statuses.includes('Chờ duyệt')}
                  onChange={(e) => handleStatusChange('Chờ duyệt', e.target.checked)}
                >
                  Chờ duyệt
                </Checkbox>
                <Checkbox
                  checked={filterForm.statuses.includes('Đã duyệt')}
                  onChange={(e) => handleStatusChange('Đã duyệt', e.target.checked)}
                >
                  Đã duyệt
                </Checkbox>
                <Checkbox
                  checked={filterForm.statuses.includes('Từ chối')}
                  onChange={(e) => handleStatusChange('Từ chối', e.target.checked)}
                >
                  Từ chối
                </Checkbox>
              </Space>
            </div>

            {/* Date Range Filter */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>Khoảng ngày tạo</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 13, marginBottom: 4 }}>Từ ngày</div>
                  <DatePicker
                    placeholder="dd/mm/yyyy"
                    style={{ width: '100%', borderRadius: 6 }}
                    format="DD/MM/YYYY"
                    value={filterForm.dateRange?.[0]}
                    onChange={(date) => setFilterForm(prev => ({
                      ...prev,
                      dateRange: [date, prev.dateRange?.[1] || null]
                    }))}
                    suffixIcon={<CalendarOutlined />}
                  />
                </div>
                <div>
                  <div style={{ fontSize: 13, marginBottom: 4 }}>Đến ngày</div>
                  <DatePicker
                    placeholder="dd/mm/yyyy"
                    style={{ width: '100%', borderRadius: 6 }}
                    format="DD/MM/YYYY"
                    value={filterForm.dateRange?.[1]}
                    onChange={(date) => setFilterForm(prev => ({
                      ...prev,
                      dateRange: [prev.dateRange?.[0] || null, date]
                    }))}
                    suffixIcon={<CalendarOutlined />}
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 12,
                marginTop: 24
              }}
            >
              <Button
                onClick={handleFilterReset}
              >
                Đặt lại
              </Button>
              <Button
                type="primary"
                onClick={handleFilterApply}
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

        {/* Create Purchase Request Modal */}
        <Modal
          title={
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px',
              fontSize: '18px',
              fontWeight: 600,
              color: '#111827'
            }}>
              <ShoppingCartOutlined style={{ 
                color: '#3b82f6', 
                fontSize: '20px' 
              }} />
              <span>Tạo yêu cầu mua hàng</span>
            </div>
          }
          open={purchaseModalVisible}
          onCancel={() => setPurchaseModalVisible(false)}
          footer={[
            <Button 
              key="cancel" 
              onClick={() => setPurchaseModalVisible(false)}
              size="large"
              style={{
                height: '40px',
                paddingLeft: '20px',
                paddingRight: '20px',
                borderRadius: '6px',
                fontWeight: 500,
                borderColor: '#d1d5db',
                color: '#6b7280'
              }}
            >
              Hủy
            </Button>,
            <Button
              key="submit"
              type="primary"
              onClick={handleCreatePurchaseRequest}
              disabled={
                (activeTab === 'manual' && validPurchaseItems.length === 0) ||
                (activeTab === 'quotation' && validQuotationItems.length === 0) ||
                createPurchaseLoading
              }
              loading={createPurchaseLoading}
              size="large"
              style={{
                height: '40px',
                paddingLeft: '24px',
                paddingRight: '24px',
                borderRadius: '6px',
                fontWeight: 500,
                background: '#3b82f6',
                borderColor: '#3b82f6'
              }}
            >
              Tạo phiếu yêu cầu
            </Button>,
          ]}
          width={1350}
          style={{ top: 40 }}
          styles={{
            content: {
              borderRadius: '8px',
              padding: '20px',
              maxHeight: '92vh',
              overflowY: 'auto'
            },
            header: {
              borderBottom: '1px solid #e5e7eb',
              paddingBottom: '12px',
              marginBottom: '16px',
              paddingTop: '4px'
            },
            footer: {
              borderTop: '1px solid #e5e7eb',
              paddingTop: '12px',
              marginTop: '20px',
              paddingBottom: '0'
            }
          }}
        >
          <Tabs
            activeKey={activeTab}
            onChange={(key) => {
              setActiveTab(key)
              if (key === 'quotation' && quotations.length === 0) {
                fetchAvailableQuotations()
              }
            }}
            style={{ marginBottom: '16px' }}
            items={[
              {
                key: 'manual',
                label: (
                  <span>
                    <ShoppingOutlined /> Danh sách linh kiện đề xuất
                  </span>
                ),
                children: (
                  <>
                    {/* Instruction Box */}
                    <div style={{ 
                      marginBottom: '16px',
                      padding: '12px 14px',
                      background: '#eff6ff',
                      borderRadius: '6px',
                      border: '1px solid #bfdbfe',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px'
                    }}>
                      <InfoCircleOutlined style={{ 
                        color: '#3b82f6', 
                        fontSize: '16px',
                        marginTop: '1px',
                        flexShrink: 0
                      }} />
                      <p style={{ 
                        margin: 0,
                        fontSize: '13px',
                        color: '#1e40af',
                        lineHeight: '1.5'
                      }}>
                        Chọn linh kiện cần mua, chỉnh sửa số lượng nếu cần rồi tạo phiếu yêu cầu mua hàng gửi quản lý duyệt.
                      </p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '16px', marginBottom: '16px' }}>
            {/* Left side - Items Table */}
            <div style={{ minWidth: 0 }}>
              <div style={{ 
                marginBottom: '10px', 
                fontWeight: 600,
                fontSize: '14px',
                color: '#1f2937',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span>Danh sách linh kiện đề xuất</span>
                {selectedPurchaseKeys.length > 0 && (
                  <Tag color="blue" style={{ margin: 0, borderRadius: '12px', fontSize: '12px', padding: '2px 10px' }}>
                    {selectedPurchaseKeys.length}
                  </Tag>
                )}
              </div>
              {purchaseError ? (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '40px 24px',
                  background: '#fff1f0',
                  borderRadius: '8px',
                  border: '1px solid #ffccc7'
                }}>
                  <p style={{ color: '#cf1322', marginBottom: '16px' }}>{purchaseError}</p>
                  <Button 
                    onClick={fetchSuggestedItems}
                    type="primary"
                    style={{ borderRadius: '6px' }}
                  >
                    Thử lại
                  </Button>
                </div>
              ) : (
                <div style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  width: '100%'
                }}>
                  <Table
                    rowSelection={{
                      selectedRowKeys: selectedPurchaseKeys,
                      onChange: (keys) => setSelectedPurchaseKeys(keys),
                    }}
                    columns={purchaseColumns}
                    dataSource={purchaseItems}
                    loading={purchaseLoading}
                    pagination={false}
                    size="small"
                    scroll={{ y: 320, x: 'max-content' }}
                    components={goldTableHeader}
                    rowClassName={(_, index) => (index % 2 === 0 ? 'table-row-even' : 'table-row-odd')}
                    locale={{
                      emptyText: purchaseLoading ? 'Đang tải...' : 'Không có dữ liệu đề xuất',
                    }}
                  />
                </div>
              )}
            </div>

            {/* Right side - Form Fields */}
            <div style={{
              padding: '16px',
              background: '#f9fafb',
              borderRadius: '8px',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ 
                  fontWeight: 600, 
                  marginBottom: '8px',
                  fontSize: '13px',
                  color: '#374151',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <span>Lý do</span>
                  <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 400 }}>(tuỳ chọn)</span>
                </div>
                <Input
                  placeholder="Nhập lý do..."
                  value={purchaseReason}
                  onChange={(e) => setPurchaseReason(e.target.value)}
                  style={{
                    borderRadius: '6px',
                    borderColor: '#d1d5db',
                    fontSize: '13px'
                  }}
                />
              </div>
              <div>
                <div style={{ 
                  fontWeight: 600, 
                  marginBottom: '8px',
                  fontSize: '13px',
                  color: '#374151',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <span>Ghi chú</span>
                  <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 400 }}>(tuỳ chọn)</span>
                </div>
                <TextArea
                  rows={4}
                  placeholder="Nhập ghi chú thêm..."
                  value={purchaseNote}
                  onChange={(e) => setPurchaseNote(e.target.value)}
                  style={{
                    borderRadius: '6px',
                    borderColor: '#d1d5db',
                    resize: 'none',
                    fontSize: '13px'
                  }}
                  maxLength={500}
                  showCount
                />
              </div>
              
                      {/* Summary */}
                      {validPurchaseItems.length > 0 && (
                        <div style={{
                          marginTop: '16px',
                          padding: '10px 12px',
                          background: '#eff6ff',
                          borderRadius: '6px',
                          border: '1px solid #bfdbfe'
                        }}>
                          <div style={{ 
                            fontSize: '12px',
                            color: '#1e40af',
                            fontWeight: 500,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}>
                            <CheckCircleOutlined style={{ fontSize: '14px' }} />
                            <span>
                              Đã chọn <strong>{validPurchaseItems.length}</strong> linh kiện
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  </>
                )
              },
              {
                key: 'quotation',
                label: (
                  <span>
                    <FileTextOutlined /> Chọn từ Báo giá
                  </span>
                ),
                children: (
                  <>
                    {/* Instruction Box */}
                    <div style={{ 
                      marginBottom: '16px',
                      padding: '12px 14px',
                      background: '#eff6ff',
                      borderRadius: '6px',
                      border: '1px solid #bfdbfe',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px'
                    }}>
                      <InfoCircleOutlined style={{ 
                        color: '#3b82f6', 
                        fontSize: '16px',
                        marginTop: '1px',
                        flexShrink: 0
                      }} />
                      <p style={{ 
                        margin: 0,
                        fontSize: '13px',
                        color: '#1e40af',
                        lineHeight: '1.5'
                      }}>
                        Chọn báo giá đã được duyệt, sau đó chọn linh kiện từ báo giá để tạo yêu cầu mua hàng.
                      </p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '16px', marginBottom: '16px' }}>
                      {/* Left side - Quotations Table */}
                      <div style={{ minWidth: 0 }}>
                        <div style={{ 
                          marginBottom: '10px', 
                          fontWeight: 600,
                          fontSize: '14px',
                          color: '#1f2937',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}>
                          <span>Danh sách báo giá</span>
                          {selectedQuotationIds.length > 0 && (
                            <Tag color="blue" style={{ margin: 0, borderRadius: '12px', fontSize: '12px', padding: '2px 10px' }}>
                              {selectedQuotationIds.length}
                            </Tag>
                          )}
                        </div>
                        <div style={{
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          width: '100%'
                        }}>
                          <Table
                            rowSelection={{
                              selectedRowKeys: selectedQuotationIds,
                              onChange: handleSelectQuotations,
                              type: 'checkbox'
                            }}
                            columns={[
                              {
                                title: 'Mã báo giá',
                                dataIndex: 'code',
                                key: 'code',
                                width: 180,
                                render: (text) => <span style={{ fontWeight: 600 }}>{text}</span>
                              },
                              {
                                title: 'Khách hàng',
                                dataIndex: 'customerName',
                                key: 'customerName',
                                ellipsis: true,
                                width: 200
                              },
                              {
                                title: 'Ngày tạo',
                                dataIndex: 'createdAt',
                                key: 'createdAt',
                                width: 130,
                                render: (date) => dayjs(date).format('DD/MM/YYYY')
                              }
                            ]}
                            dataSource={quotations}
                            loading={quotationLoading}
                            pagination={false}
                            size="small"
                            scroll={{ y: 240 }}
                            rowKey="id"
                            locale={{
                              emptyText: quotationLoading ? 'Đang tải...' : 'Không có báo giá nào',
                            }}
                          />
                        </div>
                      </div>

                      {/* Right side - Selected Items */}
                      <div style={{ minWidth: 0 }}>
                        <div style={{ 
                          marginBottom: '10px', 
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}>
                          <div style={{ 
                            fontWeight: 600,
                            fontSize: '14px',
                            color: '#1f2937',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}>
                            <ShoppingOutlined style={{ color: '#3b82f6', fontSize: '16px' }} />
                            <span>Linh kiện đã chọn</span>
                          </div>
                          {validQuotationItems.length > 0 && (
                            <Tag color="blue" style={{ margin: 0, borderRadius: '12px', fontSize: '12px', padding: '2px 10px' }}>
                              {validQuotationItems.length}
                            </Tag>
                          )}
                        </div>
                        <div style={{
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          background: '#fff'
                        }}>
                          <Table
                            rowSelection={{
                              selectedRowKeys: selectedQuotationItemIds,
                              onChange: setSelectedQuotationItemIds,
                              type: 'checkbox'
                            }}
                            columns={[
                              {
                                title: 'Mã SKU',
                                key: 'nameSku',
                                width: 280,
                                ellipsis: true,
                                render: (_, record) => (
                                  <span style={{ fontWeight: 500, color: '#111', fontSize: '12px' }} title={`${record.partName} (${record.sku})`}>
                                    {record.partName}{' '}
                                    <span style={{ color: '#6b7280' }}>({record.sku})</span>
                                  </span>
                                )
                              },
                              {
                                title: 'Tồn',
                                dataIndex: 'quantityInStock',
                                key: 'quantityInStock',
                                width: 100,
                                align: 'right',
                                render: (value) => (
                                  <span style={{ color: '#374151', fontSize: '12px' }}>
                                    {value != null ? value : 0}
                                  </span>
                                )
                              },
                              {
                                title: 'SL giữ',
                                dataIndex: 'reservedQuantity',
                                key: 'reservedQuantity',
                                width: 100,
                                align: 'right',
                                render: (value) => (
                                  <span style={{ color: '#374151', fontSize: '12px' }}>
                                    {value != null ? value : 0}
                                  </span>
                                )
                              },
                              {
                                title: 'SL tối thiểu',
                                dataIndex: 'reorderLevel',
                                key: 'reorderLevel',
                                width: 120,
                                align: 'right',
                                render: (value) => (
                                  <span style={{ color: '#374151', fontSize: '12px' }}>
                                    {value != null ? value : 0}
                                  </span>
                                )
                              },
                              {
                                title: 'SL cần mua',
                                key: 'quantity',
                                width: 130,
                                align: 'right',
                                render: (_, record) => (
                                  <InputNumber
                                    min={0}
                                    value={quotationItemQuantities[record.priceQuotationItemId] ?? record.quantity}
                                    onChange={(val) => {
                                      const num = typeof val === 'number' ? val : 0
                                      setQuotationItemQuantities(prev => ({
                                        ...prev,
                                        [record.priceQuotationItemId]: num
                                      }))
                                    }}
                                    style={{ 
                                      width: '100%',
                                      borderRadius: '4px'
                                    }}
                                    size="small"
                                    controls={false}
                                  />
                                )
                              }
                            ]}
                            dataSource={quotationItems}
                            pagination={false}
                            size="small"
                            scroll={{ y: 280 }}
                            rowKey="priceQuotationItemId"
                            rowClassName={(record, index) => 
                              index % 2 === 0 ? 'table-row-even' : 'table-row-odd'
                            }
                            locale={{
                              emptyText: (
                                <div style={{ 
                                  padding: '32px 16px',
                                  textAlign: 'center',
                                  color: '#9ca3af',
                                  fontSize: '13px'
                                }}>
                                  Chưa chọn báo giá nào
                                </div>
                              ),
                            }}
                          />
                        </div>
                        
                        {/* Summary */}
                        {validQuotationItems.length > 0 && (
                          <div style={{
                            marginTop: '10px',
                            padding: '10px 12px',
                            background: '#eff6ff',
                            borderRadius: '6px',
                            border: '1px solid #bfdbfe'
                          }}>
                            <div style={{ 
                              fontSize: '12px',
                              color: '#1e40af',
                              fontWeight: 500,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}>
                              <CheckCircleOutlined style={{ fontSize: '14px' }} />
                              <span>
                                Đã chọn <strong>{validQuotationItems.length}</strong> linh kiện
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Form Fields */}
                    <div style={{
                      padding: '16px',
                      background: '#f9fafb',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                      marginTop: '16px'
                    }}>
                      <div style={{ marginBottom: '16px' }}>
                        <div style={{ 
                          fontWeight: 600, 
                          marginBottom: '8px',
                          fontSize: '13px',
                          color: '#374151',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <span>Lý do</span>
                          <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 400 }}>(tuỳ chọn)</span>
                        </div>
                        <Input
                          placeholder="Nhập lý do..."
                          value={purchaseReason}
                          onChange={(e) => setPurchaseReason(e.target.value)}
                          style={{
                            borderRadius: '6px',
                            borderColor: '#d1d5db',
                            fontSize: '13px'
                          }}
                        />
                      </div>
                      <div>
                        <div style={{ 
                          fontWeight: 600, 
                          marginBottom: '8px',
                          fontSize: '13px',
                          color: '#374151',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <span>Ghi chú</span>
                          <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 400 }}>(tuỳ chọn)</span>
                        </div>
                        <TextArea
                          rows={4}
                          placeholder="Nhập ghi chú thêm..."
                          value={purchaseNote}
                          onChange={(e) => setPurchaseNote(e.target.value)}
                          style={{
                            borderRadius: '6px',
                            borderColor: '#d1d5db',
                            resize: 'none',
                            fontSize: '13px'
                          }}
                          maxLength={500}
                          showCount
                        />
                      </div>
                    </div>
                  </>
                )
              }
            ]}
          />
        </Modal>
      </div>
    </WarehouseLayout>
  )
}

