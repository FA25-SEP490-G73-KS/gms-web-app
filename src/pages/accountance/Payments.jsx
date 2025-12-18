import React, { useMemo, useState, useEffect } from 'react'
import { Table, Input, Button, message, DatePicker, Space } from 'antd'
import { SearchOutlined, EyeOutlined, CalendarOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import AccountanceLayout from '../../layouts/AccountanceLayout'
import { goldTableHeader } from '../../utils/tableComponents'
import { invoiceAPI } from '../../services/api'
import dayjs from 'dayjs'
import { STATUS_COLORS } from '../admin/TicketService'
import '../../styles/pages/accountance/payments.css'

const STATUS_LABELS = {
  CREATED: 'Đã tạo',
  QUOTING: 'Đang báo giá',
  QUOTE_CONFIRMED: 'Khách đã xác nhận báo giá',
  UNDER_REPAIR: 'Đang sửa chữa',
  WAITING_FOR_DELIVERY: 'Chờ bàn giao xe',
  COMPLETED: 'Hoàn thành',
  CANCELED: 'Hủy'
}

const normalizeStatusKey = (status) => {
  const key = (status || '').toString().trim().toUpperCase()
  const map = {
    'HỦY': 'CANCELED',
    'CANCELLED': 'CANCELED',
    'CANCELED': 'CANCELED',
    'WAITING_FOR_QUOTATION': 'QUOTING',
    'WAITING_QUOTE': 'QUOTING',
    'ĐANG BÁO GIÁ': 'QUOTING',
    'CHỜ BÁO GIÁ': 'QUOTING',
    'WAITING_FOR_DELIVERY': 'WAITING_FOR_DELIVERY',
    'WAITING_HANDOVER': 'WAITING_FOR_DELIVERY',
    'CHỜ BÀN GIAO XE': 'WAITING_FOR_DELIVERY',
    'CHỜ GIAO XE': 'WAITING_FOR_DELIVERY',
    'HOÀN THÀNH': 'COMPLETED',
    'COMPLETED': 'COMPLETED',
    'ĐÃ TẠO': 'CREATED',
    'CREATED': 'CREATED',
    'QUOTE_CONFIRMED': 'QUOTE_CONFIRMED',
    'KHÁCH ĐÃ XÁC NHẬN BÁO GIÁ': 'QUOTE_CONFIRMED',
    'UNDER_REPAIR': 'UNDER_REPAIR',
    'ĐANG SỬA CHỮA': 'UNDER_REPAIR'
  }
  return map[key] || key || 'CREATED'
}

const getStatusConfig = (status) => {
  const normalizedKey = normalizeStatusKey(status)
  const color = STATUS_COLORS[normalizedKey] || '#666'
  const text = STATUS_LABELS[normalizedKey] || status || 'Đã tạo'
  return { color, text }
}

const STATUS_FILTERS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'WAITING_FOR_QUOTATION', label: 'Chờ báo giá' },
  { key: 'WAITING_FOR_DELIVERY', label: 'Chờ bàn giao' },
  { key: 'COMPLETED', label: 'Hoàn thành' }
]

export function AccountancePaymentsContent() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedMonth, setSelectedMonth] = useState(null)
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    fetchInvoices()
  }, [page, pageSize])

  const fetchInvoices = async () => {
    setLoading(true)
    try {
      const { data: response, error } = await invoiceAPI.getAll(page - 1, pageSize, 'createdAt,desc')
      
      if (error) {
        message.error('Không thể tải danh sách phiếu thanh toán')
        setLoading(false)
        return
      }

      const result = response?.result || {}
      const content = result.content || []
      
      const mapServiceStatus = (status) => {
        const statusMap = {
          'CREATED': 'Đã tạo',
          'WAITING_FOR_QUOTATION': 'Chờ báo giá',
          'WAITING_FOR_DELIVERY': 'Chờ giao xe',
          'COMPLETED': 'Hoàn thành',
          'CANCELED': 'Hủy'
        }
        return statusMap[status] || status || ''
      }

      const transformedData = content.map((item) => ({
        id: item.id || item.invoiceId,
        paymentCode: item.code || item.invoiceCode || 'N/A',
        ticketCode: item.serviceTicketCode || 'N/A',
        customer: item.customerName || 'N/A',
        createdDate: item.createdAt || '',
        totalAmount: item.finalAmount || item.totalAmount || 0,
        rawStatus: item.serviceTicketStatus, // Store raw status for filtering
        serviceStatus: mapServiceStatus(item.serviceTicketStatus)
      }))

      setData(transformedData)
      setTotal(result.totalElements || 0)
    } catch (err) {
      console.error('Failed to fetch invoices:', err)
      message.error('Đã xảy ra lỗi khi tải dữ liệu')
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    return data
      .filter((item) => {
        const matchesQuery =
          !query ||
          item.paymentCode.toLowerCase().includes(query.toLowerCase()) ||
          item.ticketCode.toLowerCase().includes(query.toLowerCase()) ||
          item.customer.toLowerCase().includes(query.toLowerCase())
        
        const matchesStatus =
          statusFilter === 'all' ||
          item.rawStatus === statusFilter
        
        return matchesQuery && matchesStatus
      })
      .map((item, index) => ({ ...item, key: item.id, index }))
  }, [query, data, statusFilter])

  const columns = [
    {
      title: <div style={{ textAlign: 'center' }}>Mã hóa đơn</div>,
      dataIndex: 'paymentCode',
      key: 'paymentCode',
      width: 180,
      render: (text, record) => (
        <span 
          style={{ color: '#2563eb', textDecoration: 'underline', cursor: 'pointer', fontWeight: 600 }}
          onClick={() => navigate(`/accountance/payments/${record.id}`)}
        >
          {text}
        </span>
      )
    },
    {
      title: <div style={{ textAlign: 'center' }}>Mã dịch vụ</div>,
      dataIndex: 'ticketCode',
      key: 'ticketCode',
      width: 180
    },
    {
      title: <div style={{ textAlign: 'center' }}>Khách Hàng</div>,
      dataIndex: 'customer',
      key: 'customer',
      width: 200,
      render: (text) => <span style={{ color: '#6b7280' }}>{text}</span>
    },
    {
      title: <div style={{ textAlign: 'center' }}>Ngày tạo</div>,
      dataIndex: 'createdDate',
      key: 'createdDate',
      width: 150,
      align: 'center',
      render: (date) => {
        if (!date) return 'N/A'
        return dayjs(date).format('D/M/YYYY')
      }
    },
    {
      title: <div style={{ textAlign: 'center' }}>Tổng tiền</div>,
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 150,
      align: 'right',
      render: (value) => value ? value.toLocaleString('vi-VN') : '0'
    },
    {
      title: <div style={{ textAlign: 'center' }}>Trạng thái DV</div>,
      dataIndex: 'serviceStatus',
      key: 'serviceStatus',
      width: 200,
      align: 'center',
      render: (status, record) => {
        const currentStatus = record.rawStatus || status
        const config = getStatusConfig(currentStatus)
        return (
          <span style={{ color: config.color, fontWeight: 600 }}>
            {config.text}
          </span>
        )
      }
    },
    {
      title: <div style={{ textAlign: 'center' }}>Thao tác</div>,
      key: 'action',
      width: 100,
      align: 'center',
      render: (_, record) => {
        if (!record.serviceStatus) return null
        return (
        <Button
          type="text"
            icon={<EyeOutlined />}
          style={{ padding: 0, width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => navigate(`/accountance/payments/${record.id}`)}
        />
      )
      }
    }
  ]

  return (
    <div style={{ padding: '24px', background: '#ffffff', minHeight: '100vh' }}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, marginBottom: '20px' }}>Thanh toán</h1>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            {/* Left side - Search */}
            <Input
              prefix={<SearchOutlined />}
              placeholder="Tìm kiếm"
              allowClear
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ width: 300 }}
            />
            
            {/* Right side - Filter buttons and Date picker */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <Space>
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
              </Space>
              
              <DatePicker
                picker="month"
                placeholder="Tháng"
                value={selectedMonth}
                onChange={(date) => setSelectedMonth(date)}
                suffixIcon={<CalendarOutlined />}
                style={{ width: 150, borderRadius: 6 }}
                format="MM/YYYY"
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
            className="payments-table"
            columns={columns}
            dataSource={filtered}
            loading={loading}
            pagination={{
              current: page,
              pageSize: pageSize,
              total: total,
              showTotal: (total) => `0 of ${total} row(s) selected.`,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50', '100'],
              onChange: (p, ps) => {
                setPage(p)
                setPageSize(ps)
              }
            }}
            components={goldTableHeader}
            rowClassName={(_, index) => (index % 2 === 0 ? 'table-row-even' : 'table-row-odd')}
          />
        </div>
      </div>
  )
}

export default function AccountancePayments({ Layout = AccountanceLayout }) {
  const Wrapper = Layout || (({ children }) => <>{children}</>)
  return (
    <Wrapper>
      <AccountancePaymentsContent />
    </Wrapper>
  )
}

