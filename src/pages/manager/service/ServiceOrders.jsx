import { useEffect, useMemo, useState } from 'react'
import { Card, DatePicker, Input, Select, Space, Table, Tag, message } from 'antd'
import { useNavigate } from 'react-router-dom'
import ManagerLayout from '../../../layouts/ManagerLayout'
import { serviceTicketAPI } from '../../../services/api'
import { goldTableHeader } from '../../../utils/tableComponents'

const STATUS_CONFIG = {
  CREATED: { color: '#475467', label: 'Đã tạo' },
  WAITING_QUOTE: { color: '#F59E0B', label: 'Chờ báo giá' },
  WAITING_HANDOVER: { color: '#FACC15', label: 'Chờ bàn giao xe' },
  CANCELLED: { color: '#EF4444', label: 'Hủy' },
  COMPLETED: { color: '#22C55E', label: 'Hoàn thành' },
}

const formatTicket = (ticket, index) => ({
  key: ticket.code || `ticket-${index}`,
  rawId: ticket.id || index,
  code: ticket.code || `STK-${ticket.id || index}`,
  customerName: ticket.customer?.fullName || ticket.customerName || '—',
  licensePlate: ticket.customerVehicle?.licensePlate || ticket.licensePlate || '—',
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
  const [dateFilter, setDateFilter] = useState()
  const [statusFilter, setStatusFilter] = useState('ALL')

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
        if (statusFilter !== 'ALL') {
          return item.status === statusFilter
        }
        return true
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
  }, [tickets, search, statusFilter])

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
      title: 'Code',
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
    { key: 'WAITING_QUOTE', label: 'Chờ báo giá', value: statusCounts.WAITING_QUOTE || 0, theme: '#e6f0ff' },
    { key: 'WAITING_HANDOVER', label: 'Chờ bàn giao xe', value: statusCounts.WAITING_HANDOVER || 0, theme: '#fff9e6' },
    { key: 'CANCELLED', label: 'Hủy', value: statusCounts.CANCELLED || 0, theme: '#ffecec' },
    { key: 'COMPLETED', label: 'Hoàn thành', value: statusCounts.COMPLETED || 0, theme: '#eefaf0' },
  ]

  return (
    <ManagerLayout>
      <div style={{ padding: 24, minHeight: '100vh', background: '#f5f7fb' }}>
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
            }}
          >
            <Space wrap>
              <DatePicker
                format="DD/MM/YYYY"
                placeholder="Ngày/Tháng/Năm"
                value={dateFilter}
                onChange={setDateFilter}
              />
              <Select
                style={{ width: 200 }}
                value={statusFilter}
                onChange={setStatusFilter}
                options={[
                  { label: 'Tất cả trạng thái', value: 'ALL' },
                  ...Object.entries(STATUS_CONFIG).map(([key, value]) => ({
                    label: value.label,
                    value: key,
                  })),
                ]}
              />
            </Space>
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


