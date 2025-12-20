import React, { useState, useEffect, useMemo } from 'react'
import { Table, Input, Button, Tag, Dropdown, message, Modal, Checkbox, DatePicker, InputNumber, Space } from 'antd'
import { SearchOutlined, FilterOutlined, MoreOutlined, ShoppingCartOutlined, InfoCircleOutlined, CalendarOutlined } from '@ant-design/icons'
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
      width: 260,
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
      width: 80,
      align: 'right',
      render: (value) => (value != null ? value : 0),
    },
    {
      title: 'SL giữ',
      dataIndex: 'reservedQuantity',
      key: 'reservedQuantity',
      width: 90,
      align: 'right',
      render: (value) => (value != null ? value : 0),
    },
    {
      title: 'SL tối thiểu',
      dataIndex: 'reorderLevel',
      key: 'reorderLevel',
      width: 100,
      align: 'right',
      render: (value) => (value != null ? value : 0),
    },
    {
      title: 'SL cần mua',
      key: 'purchaseQuantity',
      width: 110,
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

  const handleCreatePurchaseRequest = async () => {
    if (validPurchaseItems.length === 0) return

    const employeeId = getEmployeeIdFromToken()
    if (!employeeId) {
      message.error('Không tìm thấy thông tin nhân viên. Vui lòng đăng nhập lại.')
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

    setCreatePurchaseLoading(true)
    try {
      const payload = {
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
      setPurchaseModalVisible(false)
      // Reset form
      setPurchaseItems([])
      setPurchaseError(null)
      setSelectedPurchaseKeys([])
      setPurchaseQuantities({})
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
          <h1 style={{ margin: 0, marginBottom: '20px' }}>Yêu cầu mua hàng</h1>

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
                  setPurchaseItems([])
                  setPurchaseError(null)
                  setSelectedPurchaseKeys([])
                  setPurchaseQuantities({})
                  setPurchaseReason('')
                  setPurchaseNote('')
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
              gap: '12px',
              fontSize: '20px',
              fontWeight: 600,
              color: '#1f2937'
            }}>
              <ShoppingCartOutlined style={{ 
                color: '#1890ff', 
                fontSize: '24px' 
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
                height: '44px',
                paddingLeft: '24px',
                paddingRight: '24px',
                borderRadius: '8px',
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
              disabled={validPurchaseItems.length === 0 || createPurchaseLoading}
              loading={createPurchaseLoading}
              size="large"
              style={{
                height: '44px',
                paddingLeft: '24px',
                paddingRight: '24px',
                borderRadius: '8px',
                fontWeight: 500,
                background: '#1890ff',
                borderColor: '#1890ff',
                boxShadow: '0 2px 4px rgba(24, 144, 255, 0.2)'
              }}
            >
              Tạo phiếu yêu cầu
            </Button>,
          ]}
          width={1000}
          style={{ top: 60 }}
          styles={{
            content: {
              borderRadius: '12px',
              padding: '24px'
            },
            header: {
              borderBottom: '1px solid #f0f0f0',
              paddingBottom: '16px',
              marginBottom: '20px'
            },
            footer: {
              borderTop: '1px solid #f0f0f0',
              paddingTop: '16px',
              marginTop: '24px'
            }
          }}
        >
          {/* Instruction Box */}
          <div style={{ 
            marginBottom: '20px',
            padding: '14px 16px',
            background: '#e6f4ff',
            borderRadius: '8px',
            border: '1px solid #bae0ff',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px'
          }}>
            <InfoCircleOutlined style={{ 
              color: '#1890ff', 
              fontSize: '18px',
              marginTop: '2px'
            }} />
            <p style={{ 
              margin: 0,
              fontSize: '14px',
              color: '#0958d9',
              lineHeight: '1.6'
            }}>
              Chọn linh kiện cần mua, chỉnh sửa số lượng nếu cần rồi tạo phiếu yêu cầu mua hàng gửi quản lý duyệt.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '20px', marginBottom: '16px' }}>
            {/* Left side - Items Table */}
            <div>
              <div style={{ 
                marginBottom: '12px', 
                fontWeight: 600,
                fontSize: '15px',
                color: '#374151',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>Danh sách linh kiện đề xuất</span>
                {selectedPurchaseKeys.length > 0 && (
                  <span style={{
                    fontSize: '12px',
                    fontWeight: 500,
                    color: '#1890ff',
                    background: '#e6f4ff',
                    padding: '2px 8px',
                    borderRadius: '12px'
                  }}>
                    Đã chọn: {selectedPurchaseKeys.length}
                  </span>
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
                  overflow: 'hidden'
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
                    scroll={{ y: 320 }}
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
              padding: '20px',
              background: '#f9fafb',
              borderRadius: '8px',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ marginBottom: '20px' }}>
                <div style={{ 
                  fontWeight: 600, 
                  marginBottom: '10px',
                  fontSize: '14px',
                  color: '#374151',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <span>Lý do</span>
                  <span style={{ fontSize: '12px', color: '#9ca3af', fontWeight: 400 }}>(tuỳ chọn)</span>
                </div>
                <Input
                  placeholder="Nhập lý do tạo yêu cầu mua hàng..."
                  value={purchaseReason}
                  onChange={(e) => setPurchaseReason(e.target.value)}
                  style={{
                    borderRadius: '6px',
                    borderColor: '#d1d5db'
                  }}
                />
              </div>
              <div>
                <div style={{ 
                  fontWeight: 600, 
                  marginBottom: '10px',
                  fontSize: '14px',
                  color: '#374151',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <span>Ghi chú</span>
                  <span style={{ fontSize: '12px', color: '#9ca3af', fontWeight: 400 }}>(tuỳ chọn)</span>
                </div>
                <TextArea
                  rows={5}
                  placeholder="Nhập ghi chú thêm (nếu có)..."
                  value={purchaseNote}
                  onChange={(e) => setPurchaseNote(e.target.value)}
                  style={{
                    borderRadius: '6px',
                    borderColor: '#d1d5db',
                    resize: 'none'
                  }}
                  maxLength={500}
                  showCount
                />
              </div>
              
              {/* Summary */}
              {validPurchaseItems.length > 0 && (
                <div style={{
                  marginTop: '20px',
                  padding: '12px',
                  background: '#f0f9ff',
                  borderRadius: '6px',
                  border: '1px solid #bae0ff'
                }}>
                  <div style={{ 
                    fontSize: '13px',
                    color: '#0958d9',
                    fontWeight: 500
                  }}>
                    Đã chọn <strong>{validPurchaseItems.length}</strong> linh kiện để tạo yêu cầu
                  </div>
                </div>
              )}
            </div>
          </div>
        </Modal>
      </div>
    </WarehouseLayout>
  )
}

