import React, { useMemo, useState, useEffect } from 'react'
import { Table, Input, Card, Badge, Space, message, Button, DatePicker, Row, Col } from 'antd'
import { EyeOutlined, SearchOutlined, CalendarOutlined } from '@ant-design/icons'
import AdminLayout from '../../layouts/AdminLayout'
import TicketDetail from './modals/TicketDetail'
import UpdateTicketModal from './modals/UpdateTicketModal'
import { serviceTicketAPI } from '../../services/api'
import { useNavigate, useLocation } from 'react-router-dom'
import { goldTableHeader } from '../../utils/tableComponents'
import '../../styles/pages/admin/ticketservice.css'

const { Search } = Input

const STATUS_FILTERS = [
  { key: 'CREATED', label: 'Đã tạo' },
  { key: 'WAITING_QUOTE', label: 'Chờ báo giá' },
  { key: 'WAITING_HANDOVER', label: 'Chờ bàn giao xe' },
  { key: 'CANCELLED', label: 'Hủy' },
]

const getStatusConfig = (status) => {
  switch (status) {
    case 'Hủy':
    case 'CANCELLED':
      return { color: '#ef4444', text: 'Hủy' }
    case 'Chờ báo giá':
    case 'WAITING_QUOTE':
      return { color: '#ffd65a', text: 'Chờ báo giá' }
    case 'Chờ bàn giao xe':
    case 'WAITING_HANDOVER':
      return { color: '#ffd65a', text: 'Chờ bàn giao xe' }
    case 'Đã tạo':
    case 'CREATED':
      return { color: '#666', text: 'Đã tạo' }
    default:
      return { color: '#666', text: status }
  }
}

export default function TicketService() {
  const navigate = useNavigate()
  const location = useLocation()
  const isHistoryPage = location.pathname === '/service-advisor/orders/history'
  
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [selected, setSelected] = useState(null)
  const [updateModalOpen, setUpdateModalOpen] = useState(false)
  const [updateTicketId, setUpdateTicketId] = useState(null)
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState(isHistoryPage ? null : 'CREATED')
  const [dateFilter, setDateFilter] = useState(null)

  useEffect(() => {
    fetchServiceTickets()
  }, [])

  const fetchServiceTickets = async () => {
    setLoading(true)
    const { data: response, error } = await serviceTicketAPI.getAll()
    setLoading(false)
    
    // Fallback data for testing
    const fallbackData = [
      {
        id: 1,
        code: 'STK-2025-000001',
        customer: 'Phạm Văn A',
        license: '25A-123456',
        status: 'CREATED',
        statusKey: 'CREATED',
        createdAt: '13/10/2025',
        total: 0,
        rawData: {}
      },
      {
        id: 2,
        code: 'STK-2025-000001',
        customer: 'Phạm Văn A',
        license: '25A-123456',
        status: 'WAITING_QUOTE',
        statusKey: 'WAITING_QUOTE',
        createdAt: '13/10/2025',
        total: 0,
        rawData: {}
      },
      {
        id: 3,
        code: 'STK-2025-000001',
        customer: 'Phạm Văn A',
        license: '25A-123456',
        status: 'WAITING_HANDOVER',
        statusKey: 'WAITING_HANDOVER',
        createdAt: '13/10/2025',
        total: 0,
        rawData: {}
      },
      {
        id: 4,
        code: 'STK-2025-000001',
        customer: 'Phạm Văn A',
        license: '25A-123456',
        status: 'CANCELLED',
        statusKey: 'CANCELLED',
        createdAt: '13/10/2025',
        total: 0,
        rawData: {}
      },
    ]
    
    if (error || !response) {
      console.warn('API error, using fallback data:', error)
      setData(fallbackData)
      return
    }
    
    let resultArray = []
    
    if (response) {
      if (response.result && response.result.content && Array.isArray(response.result.content)) {
        resultArray = response.result.content
      }
      else if (Array.isArray(response.result)) {
        resultArray = response.result
      }
      else if (Array.isArray(response.data)) {
        resultArray = response.data
      }
      else if (Array.isArray(response)) {
        resultArray = response
      }
      else if (Array.isArray(response.content)) {
        resultArray = response.content
      }
      else if (response.result && typeof response.result === 'object') {
        if (response.result.items && Array.isArray(response.result.items)) {
          resultArray = response.result.items
        } else if (response.result.data && Array.isArray(response.result.data)) {
          resultArray = response.result.data
        }
      }
    }
    
    // Use fallback if no data
    if (resultArray.length === 0) {
      console.warn('No data from API, using fallback data')
      setData(fallbackData)
      return
    }
    
    const transformed = resultArray.map(item => ({
      id: item.serviceTicketId,
      code: item.code || `STK-2025-${String(item.serviceTicketId || 0).padStart(6, '0')}`,
      customer: item.customer?.fullName || 'N/A',
      license: item.vehicle?.licensePlate || 'N/A',
      status: item.status || 'CREATED',
      statusKey: item.status || 'CREATED',
      createdAt: item.createdAt ? new Date(item.createdAt).toLocaleDateString('vi-VN') : new Date().toLocaleDateString('vi-VN'),
      total: item.total || 0,
      rawData: item
    }))
    setData(transformed)
  }

  const filtered = useMemo(() => {
    let result = data
    
    // For history page, show completed/cancelled tickets only
    if (isHistoryPage) {
      result = result.filter((r) => {
        const statusKey = r.statusKey || r.status
        // Show completed (WAITING_HANDOVER) and cancelled tickets
        return statusKey === 'WAITING_HANDOVER' || 
               statusKey === 'Chờ bàn giao xe' ||
               statusKey === 'CANCELLED' ||
               statusKey === 'Hủy' ||
               statusKey === 'COMPLETED' ||
               statusKey === 'Hoàn thành'
      })
    }
    
    // Filter by search query
    if (query) {
      const q = query.toLowerCase()
      result = result.filter(
        (r) => r.license.toLowerCase().includes(q) || r.customer.toLowerCase().includes(q)
      )
    }
    
    // Filter by status (only for ticket list page, not history)
    if (!isHistoryPage && statusFilter) {
      result = result.filter((r) => {
        const statusKey = r.statusKey || r.status
        return statusKey === statusFilter || 
               (statusFilter === 'CREATED' && (statusKey === 'CREATED' || statusKey === 'Đã tạo')) ||
               (statusFilter === 'WAITING_QUOTE' && (statusKey === 'WAITING_QUOTE' || statusKey === 'Chờ báo giá')) ||
               (statusFilter === 'WAITING_HANDOVER' && (statusKey === 'WAITING_HANDOVER' || statusKey === 'Chờ bàn giao xe')) ||
               (statusFilter === 'CANCELLED' && (statusKey === 'CANCELLED' || statusKey === 'Hủy'))
      })
    }
    
    // Filter by date
    if (dateFilter) {
      const filterDate = dateFilter.format('DD/MM/YYYY')
      result = result.filter((r) => r.createdAt === filterDate)
    }
    
    return result
  }, [query, data, statusFilter, dateFilter, isHistoryPage])

  const handleUpdate = (record) => {
    setUpdateTicketId(record.id)
    setUpdateModalOpen(true)
  }

  const handleUpdateSuccess = () => {
    fetchServiceTickets()
  }

  const columns = [
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      width: 180
    },
    {
      title: 'Khách Hàng',
      dataIndex: 'customer',
      key: 'customer',
      width: 200
    },
    {
      title: 'Biển Số Xe',
      dataIndex: 'license',
      key: 'license',
      width: 150
    },
    {
      title: 'Trạng Thái',
      dataIndex: 'status',
      key: 'status',
      width: 180,
      render: (status, record) => {
        const config = getStatusConfig(record.statusKey || status)
        return <span style={{ color: config.color, fontWeight: 600 }}>{config.text}</span>
      }
    },
    {
      title: 'Ngày Tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 120,
      render: (_, record) => {
        const statusKey = record.statusKey || record.status
        const canUpdate = statusKey === 'CREATED' || statusKey === 'Đã tạo' || 
                         statusKey === 'WAITING_QUOTE' || statusKey === 'Chờ báo giá'
        return canUpdate ? (
          <Button 
            type="link" 
            onClick={() => handleUpdate(record)}
            style={{ padding: 0 }}
          >
            Cập nhật
          </Button>
        ) : (
          <EyeOutlined
            style={{ fontSize: '18px', cursor: 'pointer', color: '#111' }}
            onClick={() => setSelected(record)}
          />
        )
      }
    }
  ]

  return (
    <AdminLayout>
      <div style={{ padding: '24px', background: '#f5f7fb', minHeight: '100vh' }}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, marginBottom: '20px' }}>
            {isHistoryPage ? 'Lịch sử sửa chữa' : 'Danh sách phiếu'}
          </h1>
          
          <Row gutter={16} style={{ marginBottom: '20px' }}>
            <Col flex="auto">
              <Search
                placeholder="Tìm kiếm theo biển số xe"
                allowClear
                prefix={<SearchOutlined />}
                style={{ width: '100%', maxWidth: '400px' }}
                value={query}
                onChange={(e) => {
                  setPage(1)
                  setQuery(e.target.value)
                }}
                onSearch={setQuery}
              />
            </Col>
            <Col>
              <DatePicker
                placeholder="Ngày tạo"
                format="DD/MM/YYYY"
                suffixIcon={<CalendarOutlined />}
                value={dateFilter}
                onChange={setDateFilter}
                style={{ width: '150px' }}
              />
            </Col>
            {!isHistoryPage && (
              <Col>
                <Space>
                  {STATUS_FILTERS.map((item) => (
                    <Button
                      key={item.key}
                      type={statusFilter === item.key ? 'primary' : 'default'}
                      style={{
                        background: statusFilter === item.key ? '#ffd65a' : '#fff',
                        borderColor: statusFilter === item.key ? '#ffd65a' : '#e6e6e6',
                        color: statusFilter === item.key ? '#111' : '#666',
                        fontWeight: 600
                      }}
                      onClick={() => setStatusFilter(item.key)}
                    >
                      {item.label}
                    </Button>
                  ))}
                </Space>
              </Col>
            )}
          </Row>
        </div>

        <Card style={{ borderRadius: '12px' }} bodyStyle={{ padding: 0 }}>
          <Table
            columns={columns}
            dataSource={filtered.map((item, index) => ({ ...item, key: item.id, index }))}
            loading={loading}
            onRow={(record) => ({
              onClick: (e) => {
                // Don't navigate if clicking on action buttons
                if (e.target.closest('button') || e.target.closest('.anticon')) {
                  return
                }
                navigate(`/service-advisor/orders/${record.id}`, {
                  state: { fromHistory: isHistoryPage }
                })
              },
              style: { cursor: 'pointer' }
            })}
            pagination={{
              current: page,
              pageSize: pageSize,
              total: filtered.length,
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
            size="middle"
            style={{ borderRadius: '12px' }}
            components={goldTableHeader}
          />
        </Card>
      </div>
      <TicketDetail open={!!selected} onClose={() => setSelected(null)} data={selected} />
      <UpdateTicketModal
        open={updateModalOpen}
        onClose={() => {
          setUpdateModalOpen(false)
          setUpdateTicketId(null)
        }}
        ticketId={updateTicketId}
        onSuccess={handleUpdateSuccess}
      />
    </AdminLayout>
  )
}
