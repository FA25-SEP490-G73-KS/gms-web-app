import { useEffect, useMemo, useState, useRef } from 'react'
import { Card, Input, Space, Table, Tag, message } from 'antd'
import { CalendarOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import ManagerLayout from '../../../layouts/ManagerLayout'
import { serviceTicketAPI } from '../../../services/api'
import { goldTableHeader } from '../../../utils/tableComponents'
import dayjs from 'dayjs'
import './ServiceOrders.css'

const STATUS_CONFIG = {
  CREATED: { color: '#475467', label: 'Đã tạo' },
  WAITING_FOR_QUOTATION: { color: '#F59E0B', label: 'Chờ báo giá' },
  WAITING_FOR_DELIVERY: { color: '#FACC15', label: 'Chờ bàn giao xe' },
  CANCELED: { color: '#EF4444', label: 'Hủy' },
  COMPLETED: { color: '#22C55E', label: 'Hoàn thành' },
}

const formatTicket = (ticket, index) => ({
  key: ticket.serviceTicketCode || `ticket-${index}`,
  rawId: ticket.serviceTicketId || index,
  code: ticket.serviceTicketCode || `STK-${ticket.serviceTicketId || index}`,
  customerName: ticket.customer?.fullName || ticket.customerName || '—',
  licensePlate: ticket.vehicle?.licensePlate || ticket.licensePlate || '—',
  status: ticket.status || 'CREATED',
  createdAt: ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString('vi-VN') : '—',
})

export default function ManagerServiceOrders() {
  const navigate = useNavigate()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = dayjs()
    return `${now.year()}-${String(now.month() + 1).padStart(2, '0')}`
  })
  const [statusFilter, setStatusFilter] = useState('ALL')
  const monthInputRef = useRef(null)

  const fetchTickets = async (pageIndex = 0, size = 10) => {
    setLoading(true)
    try {
      const { data, error } = await serviceTicketAPI.getAll(pageIndex, size)
      if (error) throw new Error(error)
      const payload = data?.result || data?.data || data
      const list = Array.isArray(payload)
        ? payload
        : payload?.content || payload?.items || payload?.records || []
      setTickets(list.map((item, idx) => formatTicket(item, idx)))
      setTotal(payload?.totalElements || payload?.total || payload?.totalItems || list.length)
      setPage(pageIndex + 1)
      setPageSize(size)
    } catch (err) {
      message.error(err.message || 'Không thể tải danh sách phiếu dịch vụ')
      setTickets([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTickets(page - 1, pageSize)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filteredTickets = useMemo(() => {
    return tickets
      .filter((item) => {
        if (statusFilter === 'ALL') {
          return true
        }
        return item.status === statusFilter
      })
      .filter((item) => {
        if (!search) return true
        const text = search.toLowerCase()
        return (
          item.code.toLowerCase().includes(text) ||
          item.customerName.toLowerCase().includes(text) ||
          item.licensePlate.toLowerCase().includes(text)
        )
      })
      .filter((item) => {
        if (!selectedMonth) return true
        const itemDate = item.createdAt ? new Date(item.createdAt) : null
        if (!itemDate) return false
        const itemMonth = `${itemDate.getFullYear()}-${String(itemDate.getMonth() + 1).padStart(2, '0')}`
        return itemMonth === selectedMonth
      })
  }, [tickets, search, statusFilter, selectedMonth])

  const statusCounts = useMemo(() => {
    return tickets.reduce(
      (acc, ticket) => {
        const status = ticket.status || 'CREATED'
        acc[status] = (acc[status] || 0) + 1
        acc.total += 1
        return acc
      },
      { total: 0 }
    )
  }, [tickets])

  const columns = [
    {
      title: 'Mã dịch vụ',
      dataIndex: 'code',
      key: 'code',
      width: 160,
      render: (value, record) => (
        <button
          type="button"
          onClick={() => navigate(`/manager/service/orders/${record.rawId}`)}
          style={{
            border: 'none',
            background: 'transparent',
            padding: 0,
            cursor: 'pointer',
            color: '#1677ff',
            fontWeight: 600,
          }}
        >
          {value}
        </button>
      ),
    },
    {
      title: 'Khách hàng',
      dataIndex: 'customerName',
      key: 'customerName',
      width: 200,
    },
    {
      title: 'Biển số xe',
      dataIndex: 'licensePlate',
      key: 'licensePlate',
      width: 140,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 160,
      render: (value) => {
        const config = STATUS_CONFIG[value] || { color: '#475467', label: value }
        return <Tag color={config.color}>{config.label}</Tag>
      },
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 140,
    },
  ]

  const headerTitle = 'Danh sách phiếu dịch vụ'

  const summaryCards = [
    { key: 'total', label: 'Đơn đã tạo', value: statusCounts.total || 0, theme: '#fdfaf5' },
    { key: 'WAITING_FOR_QUOTATION', label: 'Chờ báo giá', value: statusCounts.WAITING_FOR_QUOTATION || 0, theme: '#e6f0ff' },
    { key: 'WAITING_FOR_DELIVERY', label: 'Chờ bàn giao xe', value: statusCounts.WAITING_FOR_DELIVERY || 0, theme: '#fff9e6' },
    { key: 'CANCELED', label: 'Hủy', value: statusCounts.CANCELED || 0, theme: '#ffecec' },
    { key: 'COMPLETED', label: 'Hoàn thành', value: statusCounts.COMPLETED || 0, theme: '#eefaf0' },
  ]

  return (
    <ManagerLayout>
      <div style={{ padding: 24, minHeight: '100vh' }}>
        <div
          style={{
            background: '#fff',
            borderRadius: 16,
            padding: 24,
            boxShadow: '0 20px 45px rgba(15,23,42,0.08)',
          }}
        >
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ marginBottom: 12 }}>{headerTitle}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16 }}>
              {summaryCards.map((card) => (
                <Card
                  key={card.key}
                  style={{ borderRadius: 16, background: '#fdfaf5', textAlign: 'center' }}
                  bodyStyle={{ padding: 16 }}
                >
                  <div style={{ fontSize: 14, color: '#857046' }}>{card.label}</div>
                  <div style={{ fontSize: 28, fontWeight: 700 }}>{card.value}</div>
                </Card>
              ))}
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 12,
              justifyContent: 'space-between',
              marginBottom: 16,
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <div className="service-orders-month-picker-wrapper">
                <select
                  ref={monthInputRef}
                  value={selectedMonth}
                  onChange={(e) => {
                    e.stopPropagation()
                    setSelectedMonth(e.target.value)
                  }}
                  className="service-orders-month-select"
                >
                  {(() => {
                    const options = []
                    const currentYear = dayjs().year()
                    const years = [currentYear - 1, currentYear, currentYear + 1]
                    
                    years.forEach(year => {
                      for (let month = 1; month <= 12; month++) {
                        const monthStr = String(month).padStart(2, '0')
                        const value = `${year}-${monthStr}`
                        const monthName = dayjs(`${year}-${monthStr}-01`).format('MM/YYYY')
                        options.push(
                          <option key={value} value={value}>
                            {monthName}
                          </option>
                        )
                      }
                    })
                    
                    return options
                  })()}
                </select>
                <CalendarOutlined className="service-orders-month-icon" />
              </div>
              <div className="service-orders-status-filters">
                <button
                  type="button"
                  className={`service-orders-status-btn ${statusFilter === 'ALL' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('ALL')}
                >
                  Tất cả
                </button>
                {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                  <button
                    key={key}
                    type="button"
                    className={`service-orders-status-btn ${statusFilter === key ? 'active' : ''}`}
                    onClick={() => setStatusFilter(key)}
                  >
                    {config.label}
                  </button>
                ))}
              </div>
            </div>
            <Input
              allowClear
              placeholder="Tìm kiếm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ maxWidth: 260 }}
            />
          </div>

          <Table
            columns={columns}
            dataSource={filteredTickets}
            loading={loading}
            components={goldTableHeader}
            pagination={{
              current: page,
              pageSize,
              total,
              showSizeChanger: true,
              showTotal: (t) => `Tổng ${t} phiếu`,
              onChange: (p, size) => fetchTickets(p - 1, size),
            }}
          />
        </div>
      </div>
    </ManagerLayout>
  )
}


