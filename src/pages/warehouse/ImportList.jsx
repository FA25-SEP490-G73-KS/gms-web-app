import React, { useState, useEffect } from 'react'
import { Table, Button, Tag, Input, Dropdown, message, Modal, DatePicker } from 'antd'
import { SearchOutlined, FilterOutlined, MoreOutlined, CalendarOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import WarehouseLayout from '../../layouts/WarehouseLayout'
import { goldTableHeader } from '../../utils/tableComponents'
import { stockReceiptAPI } from '../../services/api'
import dayjs from 'dayjs'

export default function ImportList() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [importList, setImportList] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [statusFilter, setStatusFilter] = useState('Tất cả')
  const [dateRange, setDateRange] = useState([null, null])
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)

  useEffect(() => {
    fetchImportList()
  }, [page, pageSize, searchTerm, statusFilter, dateRange])

  const getStatusParam = (filter) => {
    const statusMap = {
      'Chờ nhập': 'PENDING',
      'Nhập một phần': 'PARTIALLY_RECEIVED',
      'Đã nhập': 'RECEIVED',
      'Tất cả': null
    }
    return statusMap[filter]
  }

  const fetchImportList = async () => {
    setLoading(true)
    try {
      const status = getStatusParam(statusFilter)
      const fromDate = dateRange[0] ? dateRange[0].format('YYYY-MM-DD') : null
      const toDate = dateRange[1] ? dateRange[1].format('YYYY-MM-DD') : null

      // Mock data để test
      const mockData = {
        content: [
          {
            id: 1,
            code: 'NK-000123',
            supplierName: 'Hoàng Tuấn Auto',
            purchaseRequestCode: 'PR-000456',
            receivedQty: 2,
            totalQty: 5,
            lineCount: 5,
            createdAt: '2025-10-12T10:30:00',
            status: 'PENDING'
          },
          {
            id: 2,
            code: 'NK-000124',
            supplierName: 'Công ty Phụ Tùng ABC',
            purchaseRequestCode: 'PR-000457',
            receivedQty: 5,
            totalQty: 10,
            lineCount: 8,
            createdAt: '2025-11-15T14:20:00',
            status: 'PARTIALLY_RECEIVED'
          },
          {
            id: 3,
            code: 'NK-000125',
            supplierName: 'Nhà cung cấp XYZ',
            purchaseRequestCode: 'PR-000458',
            receivedQty: 15,
            totalQty: 15,
            lineCount: 10,
            createdAt: '2025-12-01T09:15:00',
            status: 'RECEIVED'
          },
          {
            id: 4,
            code: 'NK-000126',
            supplierName: 'Auto Parts Vietnam',
            purchaseRequestCode: 'PR-000459',
            receivedQty: 0,
            totalQty: 8,
            lineCount: 6,
            createdAt: '2025-12-05T11:45:00',
            status: 'PENDING'
          }
        ],
        totalElements: 4
      }

      let result = mockData
      
      try {
        const { data, error } = await stockReceiptAPI.getAll(
          page - 1, 
          pageSize, 
          searchTerm || null, 
          status, 
          fromDate, 
          toDate
        )
        console.log('API response:', data)
        console.log('API error:', error)
        // Only use API data if it has content, otherwise keep mock data
        if (data?.result?.content && data.result.content.length > 0) {
          result = data.result
        } else {
          console.log('API returned empty, using mock data')
        }
      } catch (err) {
        console.log('Using mock data due to API error:', err)
      }

      console.log('Final result:', result)
      const content = result.content || []
      console.log('Content:', content)
      
      // Transform API data to match UI structure
      const transformedData = content.map((item) => ({
        key: item.id,
        id: item.id,
        code: item.code || 'N/A',
        supplierName: item.supplierName || 'N/A',
        purchaseRequestCode: item.purchaseRequestCode || 'N/A',
        receivedQty: item.receivedQty || 0,
        totalQty: item.totalQty || 0,
        lineCount: item.lineCount || 0,
        createdAt: item.createdAt ? dayjs(item.createdAt).format('DD/MM/YYYY HH:mm') : 'N/A',
        status: mapStatus(item.status)
      }))

      console.log('transformedData:', transformedData)
      setImportList(transformedData)
      setTotal(result.totalElements || 0)
    } catch (err) {
      console.error('Failed to fetch import list:', err)
      message.error('Đã xảy ra lỗi khi tải dữ liệu')
    } finally {
      setLoading(false)
    }
  }

  const mapStatus = (status) => {
    const statusMap = {
      'RECEIVED': 'Đã nhập',
      'PENDING': 'Chờ nhập',
      'PARTIALLY_RECEIVED': 'Nhập một phần',
      'CANCELLED': 'Đã hủy'
    }
    return statusMap[status] || status || 'N/A'
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN').format(value)
  }

  const handleViewDetail = (id) => {
    navigate(`/warehouse/import-list/${id}`)
  }

  const handleImportWarehouse = (id) => {
    message.info(`Nhập kho cho phiếu ID: ${id}`)
  }

  const getMenuItems = (record) => [
    {
      key: 'view',
      label: (
        <span onClick={() => handleViewDetail(record.id)}>
          👁️ Xem chi tiết
        </span>
      )
    },
    {
      key: 'import',
      label: (
        <span onClick={() => handleImportWarehouse(record.id)}>
          📦 Nhập kho
        </span>
      )
    }
  ]

  const getStatusConfig = (status) => {
    const statusMap = {
      'Đã nhập': { color: '#22c55e', bgColor: '#f6ffed', borderColor: '#b7eb8f', text: 'Đã nhập' },
      'Chờ nhập': { color: '#faad14', bgColor: '#fffbe6', borderColor: '#ffe58f', text: 'Chờ nhập' },
      'Nhập một phần': { color: '#1677ff', bgColor: '#e6f4ff', borderColor: '#91caff', text: 'Nhập một phần' },
      'Đã hủy': { color: '#ff4d4f', bgColor: '#fff1f0', borderColor: '#ffccc7', text: 'Đã hủy' }
    }
    return statusMap[status] || { color: '#666', bgColor: '#fafafa', borderColor: '#d9d9d9', text: status || 'Không rõ' }
  }

  const getFilteredData = () => {
    let filtered = importList

    // Filter by status (for mock data when API not working)
    if (statusFilter !== 'Tất cả') {
      filtered = filtered.filter(item => item.status === statusFilter)
    }

    // Search (for mock data when API not working)
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(item =>
        item.code?.toLowerCase().includes(term) ||
        item.supplierName?.toLowerCase().includes(term) ||
        item.purchaseRequestCode?.toLowerCase().includes(term)
      )
    }

    return filtered.map((item, index) => ({
      ...item,
      index: (page - 1) * pageSize + index + 1
    }))
  }

  const columns = [
    {
      title: 'Mã phiếu',
      dataIndex: 'code',
      key: 'code',
      width: 150
    },
    {
      title: 'Nhà cung cấp',
      dataIndex: 'supplierName',
      key: 'supplierName',
      width: 200
    },
    {
      title: 'Yêu cầu mua',
      dataIndex: 'purchaseRequestCode',
      key: 'purchaseRequestCode',
      width: 150
    },
    {
      title: 'Đã nhập',
      key: 'received',
      width: 120,
      align: 'center',
      render: (_, record) => `${record.receivedQty}/${record.totalQty}`
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 150,
      align: 'center',
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
      <div style={{ marginBottom: 24 }}>
        {/* Search and Filter Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          {/* Search Box */}
          <Input
            placeholder="Tìm kiếm"
            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ 
              width: 300,
              borderRadius: '8px'
            }}
          />

          {/* Filter Buttons */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {['Tất cả', 'Chờ nhập', 'Nhập một phần', 'Đã nhập'].map((filter) => (
              <Button
                key={filter}
                type={statusFilter === filter ? 'primary' : 'default'}
                onClick={() => {
                  setStatusFilter(filter)
                  setPage(1)
                }}
                style={{
                  borderRadius: '8px',
                  fontWeight: 500,
                  ...(statusFilter === filter && {
                    background: '#CBB081',
                    borderColor: '#CBB081',
                    color: '#fff'
                  })
                }}
              >
                {filter}
              </Button>
            ))}
            
            <Button
              icon={<FilterOutlined />}
              onClick={() => setIsFilterModalOpen(true)}
              style={{
                borderRadius: '8px',
                marginLeft: 4
              }}
            />
          </div>
        </div>

        <Table
          columns={columns}
          dataSource={getFilteredData()}
          loading={loading}
          pagination={{
            current: page,
            pageSize: pageSize,
            total: total,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} bản ghi`,
            showQuickJumper: true,
            onChange: (newPage, newPageSize) => {
              setPage(newPage)
              setPageSize(newPageSize)
            }
          }}
          size="middle"
          components={goldTableHeader}
        />
      </div>

      {/* Filter Modal */}
      <Modal
        title="Bộ lọc"
        open={isFilterModalOpen}
        onCancel={() => setIsFilterModalOpen(false)}
        footer={[
          <Button 
            key="reset" 
            onClick={() => {
              setDateRange([null, null])
              setIsFilterModalOpen(false)
            }}
          >
            Đặt lại
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={() => setIsFilterModalOpen(false)}
            style={{
              background: '#CBB081',
              borderColor: '#CBB081'
            }}
          >
            Tìm kiếm
          </Button>
        ]}
        width={400}
      >
        <div style={{ marginTop: 16 }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Từ ngày</label>
            <DatePicker
              placeholder="Chọn ngày bắt đầu"
              value={dateRange[0]}
              onChange={(date) => setDateRange([date, dateRange[1]])}
              format="DD/MM/YYYY"
              suffixIcon={<CalendarOutlined />}
              style={{ width: '100%', borderRadius: '8px' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Đến ngày</label>
            <DatePicker
              placeholder="Chọn ngày kết thúc"
              value={dateRange[1]}
              onChange={(date) => setDateRange([dateRange[0], date])}
              format="DD/MM/YYYY"
              suffixIcon={<CalendarOutlined />}
              style={{ width: '100%', borderRadius: '8px' }}
            />
          </div>
        </div>
      </Modal>
    </WarehouseLayout>
  )
}
