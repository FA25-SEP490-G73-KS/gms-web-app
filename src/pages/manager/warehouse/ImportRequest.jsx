import React, { useState, useEffect } from 'react'
import { Table, Input, Button, Tag, Dropdown, message, Modal, Checkbox, DatePicker } from 'antd'
import { SearchOutlined, FilterOutlined, MoreOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import ManagerLayout from '../../../layouts/ManagerLayout'
import { goldTableHeader } from '../../../utils/tableComponents'
import { purchaseRequestAPI } from '../../../services/api'
import dayjs from 'dayjs'

const { Search } = Input
const { RangePicker } = DatePicker

const STATUS_FILTERS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'pending', label: 'Chờ duyệt' },
  { key: 'approved', label: 'Đã duyệt' },
  { key: 'rejected', label: 'Từ chối' }
]

export default function ManagerImportRequest() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
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

  // Mock data
  const mockData = [
    {
      id: 1,
      code: 'MH-000001',
      type: 'Theo báo giá',
      customerName: 'Nguyễn Văn A',
      customerPhone: '0123456789',
      quoteCode: 'BG-10000',
      totalAmount: 100000,
      createdAt: '2025-11-10T10:50:00',
      status: 'Đã duyệt'
    },
    {
      id: 2,
      code: 'MH-000002',
      type: 'Theo báo giá',
      customerName: 'Nguyễn Văn A',
      customerPhone: '0123456789',
      quoteCode: 'BG-10000',
      totalAmount: 100000,
      createdAt: '2025-11-10T10:50:00',
      status: 'Đã duyệt'
    },
    {
      id: 3,
      code: 'MH-000003',
      type: 'Theo báo giá',
      customerName: 'Nguyễn Văn A',
      customerPhone: '0123456789',
      quoteCode: 'BG-10000',
      totalAmount: 100000,
      createdAt: '2025-11-10T10:50:00',
      status: 'Chờ nhập'
    },
    {
      id: 4,
      code: 'MH-000004',
      type: 'Theo báo giá',
      customerName: 'Nguyễn Văn A',
      customerPhone: '0123456789',
      quoteCode: 'BG-10000',
      totalAmount: 100000,
      createdAt: '2025-11-10T10:50:00',
      status: 'Từ chối'
    }
  ]

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
        // Use the first selected status (API seems to accept one status at a time)
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
        console.log('API error, using mock data:', error)
        // Use mock data if API fails
        setData(mockData)
        setTotal(mockData.length)
        return
      }

      const result = response?.result || {}
      const content = result.content || []
      
      if (content.length === 0) {
        console.log('No data from API, using mock data')
        // Use mock data if response is empty
        setData(mockData)
        setTotal(mockData.length)
      } else {
        // Map API response to UI structure
        const mappedData = content.map(item => ({
          id: item.id || 0,
          code: item.code || 'N/A',
          type: 'Từ báo giá', // Default type since API doesn't provide this
          customerName: 'N/A', // API doesn't provide customer info
          customerPhone: 'N/A', // API doesn't provide customer info
          quoteCode: item.quotationCode || 'N/A',
          totalAmount: item.totalEstimatedAmount || 0,
          createdAt: item.createdAt || new Date().toISOString(),
          status: item.reviewStatus || 'Chờ duyệt'
        }))
        
        setData(mappedData)
        setTotal(result.totalElements || content.length)
      }
    } catch (err) {
      console.error('Failed to fetch import requests:', err)
      // Use mock data on error
      setData(mockData)
      setTotal(mockData.length)
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
        navigate(`/manager/warehouse/import-request/${record.id}`)
      }
    }
  ]

  const handleFilterApply = () => {
    fetchData(filterForm)
    setFilterModalVisible(false)
  }

  const handleFilterReset = () => {
    setFilterForm({
      statuses: [],
      dateRange: null
    })
  }

  const handleStatusChange = (status, checked) => {
    setFilterForm(prev => ({
      ...prev,
      statuses: checked 
        ? [...prev.statuses, status]
        : prev.statuses.filter(s => s !== status)
    }))
  }

  const filteredData = data.filter((item) => {
    const matchesSearch = !searchTerm || 
      item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.customerPhone.includes(searchTerm) ||
      item.quoteCode.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'approved' && item.status === 'Đã duyệt') ||
      (statusFilter === 'pending' && (item.status === 'Chờ nhập' || item.status === 'Chờ duyệt')) ||
      (statusFilter === 'rejected' && item.status === 'Từ chối')
    
    return matchesSearch && matchesStatus
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
      title: <div style={{ textAlign: 'center' }}>Loại</div>,
      dataIndex: 'type',
      key: 'type',
      width: 150,
      align: 'center'
    },
    {
      title: <div style={{ textAlign: 'center' }}>Khách hàng</div>,
      dataIndex: 'customerName',
      key: 'customerName',
      width: 200,
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{text}</div>
          <div style={{ fontSize: '12px', color: '#999' }}>{record.customerPhone}</div>
        </div>
      )
    },
    {
      title: <div style={{ textAlign: 'center' }}>Mã báo giá</div>,
      dataIndex: 'quoteCode',
      key: 'quoteCode',
      width: 150,
      align: 'center'
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
        // Check if date is already formatted (DD/MM/YYYY HH:mm)
        if (typeof date === 'string' && date.includes('/')) {
          return date
        }
        // Otherwise format with dayjs
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
    <ManagerLayout>
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
            
            {/* Right side - Filter buttons */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              {STATUS_FILTERS.map((filter) => (
                <Button
                  key={filter.key}
                  type={statusFilter === filter.key ? 'primary' : 'default'}
                  onClick={() => setStatusFilter(filter.key)}
                  style={{
                    background: statusFilter === filter.key ? '#CBB081' : '#fff',
                    borderColor: statusFilter === filter.key ? '#CBB081' : '#d9d9d9',
                    color: statusFilter === filter.key ? '#fff' : '#666',
                    fontWeight: 500,
                    borderRadius: 6
                  }}
                >
                  {filter.label}
                </Button>
              ))}
              
              <Button
                icon={<FilterOutlined />}
                onClick={() => setFilterModalVisible(true)}
                style={{ 
                  borderRadius: 6,
                  borderColor: '#d9d9d9',
                  fontWeight: 500
                }}
              >
        
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
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
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
          width={600}
          styles={{
            header: {
              borderBottom: '1px solid #f0f0f0',
              marginBottom: '20px'
            }
          }}
        >
          <div style={{ padding: '20px 0' }}>
            {/* Status Filter */}
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ marginBottom: '12px', fontWeight: 600 }}>Trạng thái phiếu</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
              </div>
            </div>

            {/* Date Range Filter */}
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ marginBottom: '12px', fontWeight: 600 }}>Khoảng ngày tạo</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#666' }}>
                    Từ ngày
                  </label>
                  <DatePicker
                    value={filterForm.dateRange?.[0]}
                    onChange={(date) => setFilterForm(prev => ({
                      ...prev,
                      dateRange: [date, prev.dateRange?.[1] || null]
                    }))}
                    format="DD/MM/YYYY"
                    placeholder="Chọn ngày"
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#666' }}>
                    Đến ngày
                  </label>
                  <DatePicker
                    value={filterForm.dateRange?.[1]}
                    onChange={(date) => setFilterForm(prev => ({
                      ...prev,
                      dateRange: [prev.dateRange?.[0] || null, date]
                    }))}
                    format="DD/MM/YYYY"
                    placeholder="Chọn ngày"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'flex-end', 
              gap: '12px',
              paddingTop: '20px',
              borderTop: '1px solid #f0f0f0'
            }}>
              <Button
                onClick={handleFilterReset}
                style={{ minWidth: '100px' }}
              >
                Đặt lại
              </Button>
              <Button
                type="primary"
                onClick={handleFilterApply}
                style={{ 
                  minWidth: '100px',
                  background: '#1890ff'
                }}
              >
                Tìm kiếm
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </ManagerLayout>
  )
}
