import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Table, Input, Button, Space, Tag, message } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import AccountanceLayout from '../../layouts/AccountanceLayout'
import { goldTableHeader } from '../../utils/tableComponents'
import { debtsAPI } from '../../services/api'
import '../../styles/pages/accountance/debts.css'

const STATUS_FILTERS = [
  { key: 'CON_NO', label: 'Chưa hoàn tất' },
  { key: 'DA_TAT_TOAN', label: 'Đã thanh toán' },
  { key: 'ALL', label: 'Tất cả' }
]

const STATUS_COLORS = {
  pending: { color: '#c2410c', bg: '#fff7ed', text: 'Chưa hoàn tất' },
  paid: { color: '#15803d', bg: '#dcfce7', text: 'Đã thanh toán' }
}

// Mock data for testing when API fails or returns no data
const MOCK_DEBTS = [
  {
    id: 1,
    customerName: 'Nguyễn Văn An',
    customerPhone: '0901234567',
    totalDebt: 15000000,
    status: 'CON_NO',
    debtCount: 2,
    details: [
      {
        id: 101,
        code: 'TK001',
        createdAt: '2024-11-15T10:00:00',
        total: 8000000,
        remain: 5000000,
        dueDate: '2024-12-15T00:00:00',
        status: 'warning',
        licensePlate: '30A-12345'
      },
      {
        id: 102,
        code: 'TK002',
        createdAt: '2024-11-20T14:30:00',
        total: 7000000,
        remain: 7000000,
        dueDate: '2024-12-20T00:00:00',
        status: 'warning',
        licensePlate: '30A-12345'
      }
    ]
  },
  {
    id: 2,
    customerName: 'Trần Thị Bình',
    customerPhone: '0912345678',
    totalDebt: 20000000,
    status: 'CON_NO',
    debtCount: 1,
    details: [
      {
        id: 201,
        code: 'TK003',
        createdAt: '2024-11-25T09:15:00',
        total: 20000000,
        remain: 18000000,
        dueDate: '2024-12-25T00:00:00',
        status: 'warning',
        licensePlate: '29B-67890'
      }
    ]
  },
  {
    id: 3,
    customerName: 'Lê Hoàng Cường',
    customerPhone: '0923456789',
    totalDebt: 12500000,
    status: 'DA_TAT_TOAN',
    debtCount: 1,
    details: [
      {
        id: 301,
        code: 'TK004',
        createdAt: '2024-10-10T11:20:00',
        total: 12500000,
        remain: 0,
        dueDate: '2024-11-10T00:00:00',
        status: 'done',
        licensePlate: '51C-11111'
      }
    ]
  },
  {
    id: 4,
    customerName: 'Phạm Minh Đức',
    customerPhone: '0934567890',
    totalDebt: 9800000,
    status: 'CON_NO',
    debtCount: 3,
    details: [
      {
        id: 401,
        code: 'TK005',
        createdAt: '2024-11-05T08:00:00',
        total: 3500000,
        remain: 1500000,
        dueDate: '2024-12-05T00:00:00',
        status: 'warning',
        licensePlate: '43D-22222'
      },
      {
        id: 402,
        code: 'TK006',
        createdAt: '2024-11-10T15:45:00',
        total: 4000000,
        remain: 4000000,
        dueDate: '2024-12-10T00:00:00',
        status: 'warning',
        licensePlate: '43D-22222'
      },
      {
        id: 403,
        code: 'TK007',
        createdAt: '2024-11-18T13:30:00',
        total: 2300000,
        remain: 2300000,
        dueDate: '2024-12-18T00:00:00',
        status: 'warning',
        licensePlate: '43D-22222'
      }
    ]
  },
  {
    id: 5,
    customerName: 'Võ Thị Hà',
    customerPhone: '0945678901',
    totalDebt: 18000000,
    status: 'DA_TAT_TOAN',
    debtCount: 2,
    details: [
      {
        id: 501,
        code: 'TK008',
        createdAt: '2024-10-20T10:10:00',
        total: 10000000,
        remain: 0,
        dueDate: '2024-11-20T00:00:00',
        status: 'done',
        licensePlate: '92E-33333'
      },
      {
        id: 502,
        code: 'TK009',
        createdAt: '2024-10-25T16:20:00',
        total: 8000000,
        remain: 0,
        dueDate: '2024-11-25T00:00:00',
        status: 'done',
        licensePlate: '92E-33333'
      }
    ]
  }
]

const detailStatusConfig = {
  done: { label: 'Thanh toán', color: '#22c55e', bg: '#dcfce7' },
  warning: { label: 'Sắp', color: '#f97316', bg: '#ffedd5' }
}

const normalizeStatus = (rawStatus) => {
  if (rawStatus === 'DA_TAT_TOAN') return 'paid'
  return 'pending'
}

const safeNumber = (value) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return 0
  }
  return Number(value)
}

const formatDate = (value) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('vi-VN')
}

export function AccountanceDebtsContent() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('CON_NO')
  const [expandedRowKeys, setExpandedRowKeys] = useState([])
  const [loading, setLoading] = useState(false)
  const [debts, setDebts] = useState([])
  const [pagination, setPagination] = useState({
    page: 0,
    size: 50,
    total: 0
  })

  const normalizedDebts = useMemo(() => {
    return debts.map((item, index) => {
      const customerName =
        item.customerFullName ||
        item.customerName ||
        item.customer?.fullName ||
        item.customer?.name ||
        item.customer ||
        'Khách hàng'
      const phone =
        item.customerPhone ||
        item.customer?.phone ||
        item.customer?.phoneNumber ||
        item.phone ||
        '—'
      const details =
        item.details ||
        item.debtDetails ||
        item.items ||
        []
      const firstDetail = details[0] || {}
      const totalAmount = safeNumber(item.totalAmount ?? item.totalDebt ?? firstDetail.total ?? item.total ?? item.amount)
      const remainingAmount = safeNumber(item.totalRemaining ?? item.remainingAmount ?? firstDetail.remain ?? 0)
      const paidAmount = safeNumber(item.totalPaidAmount ?? Math.max(totalAmount - remainingAmount, 0))
      return {
        key: item.customerId || item.id || `debt-${index}`,
        id: item.customerId || item.id || index,
        customerId: item.customerId || item.id,
        customer: customerName,
        phone,
        licensePlate: firstDetail.licensePlate || firstDetail.vehiclePlate || item.licensePlate || '—',
        totalAmount,
        paidAmount,
        remainingAmount,
        dueDate: formatDate(item.dueDate || firstDetail.dueDate),
        status: normalizeStatus(item.status),
        debtCount: item.debtCount ?? details.length ?? 0,
        details: details.map((detail, detailIndex) => ({
          key: detail.id || `detail-${detailIndex}`,
          id: detail.id || detailIndex,
          code: detail.code || detail.ticketCode || detail.referenceCode || '—',
          createdAt: formatDate(detail.createdAt || detail.createdDate || detail.createdOn),
          total: safeNumber(detail.total ?? detail.amount ?? detail.totalAmount),
          remain: safeNumber(detail.remain ?? detail.outstandingAmount ?? detail.debtAmount),
          dueDate: formatDate(detail.dueDate || detail.paymentDueDate),
          status: detail.status || 'warning'
        }))
      }
    })
  }, [debts])

  const fetchDebts = useCallback(
    async (page = 0, size = 10) => {
      setLoading(true)
      try {
        const { data, error } = await debtsAPI.list({
          status: status === 'ALL' ? undefined : status,
          keyword: query || undefined,
          page,
          size,
          sort: 'createdAt,desc'
        })

        if (error) {
          throw new Error(error)
        }

        const payload = data?.result ?? data?.data ?? data
        const list =
          Array.isArray(payload)
            ? payload
            : payload?.content ||
              payload?.items ||
              payload?.records ||
              []

        // If API returns empty data, use mock data
        if (!list || list.length === 0) {

          // Filter mock data based on status
          let filteredMockData = MOCK_DEBTS
          if (status !== 'ALL') {
            filteredMockData = MOCK_DEBTS.filter(debt => debt.status === status)
          }
          
          // Filter by search query
          if (query && query.trim()) {
            const searchLower = query.toLowerCase()
            filteredMockData = filteredMockData.filter(debt => 
              debt.customerName.toLowerCase().includes(searchLower) ||
              debt.customerPhone.includes(searchLower) ||
              debt.details.some(d => d.licensePlate.toLowerCase().includes(searchLower))
            )
          }
          
          setDebts(filteredMockData)
          setPagination((prev) => ({
            ...prev,
            page: 0,
            size,
            total: filteredMockData.length
          }))
        } else {
          setDebts(list)
          setPagination((prev) => ({
            ...prev,
            page,
            size,
            total:
              payload?.totalElements ??
              payload?.total ??
              payload?.totalItems ??
              list.length
          }))
        }
        setExpandedRowKeys([])
      } catch (err) {
        console.warn('API failed, using mock data:', err.message)

        
        // Filter mock data based on status
        let filteredMockData = MOCK_DEBTS
        if (status !== 'ALL') {
          filteredMockData = MOCK_DEBTS.filter(debt => debt.status === status)
        }
        
        // Filter by search query
        if (query && query.trim()) {
          const searchLower = query.toLowerCase()
          filteredMockData = filteredMockData.filter(debt => 
            debt.customerName.toLowerCase().includes(searchLower) ||
            debt.customerPhone.includes(searchLower) ||
            debt.details.some(d => d.licensePlate.toLowerCase().includes(searchLower))
          )
        }
        
        setDebts(filteredMockData)
        setPagination((prev) => ({
          ...prev,
          page: 0,
          size,
          total: filteredMockData.length
        }))
        setExpandedRowKeys([])
      } finally {
        setLoading(false)
      }
    },
    [query, status]
  )

  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 0 }))
  }, [query, status])

  useEffect(() => {
    fetchDebts(0, pagination.size)
  }, [fetchDebts, pagination.size])

  useEffect(() => {
    fetchDebts(pagination.page, pagination.size)
  }, [pagination.page, pagination.size, fetchDebts])

  const columns = [
    {
      title: <div style={{ textAlign: 'center' }}>Khách hàng</div>,
      dataIndex: 'customer',
      key: 'customer',
      width: 220,
      render: (text, record) => (
        <div className="debt-name-cell">
          <div className="avatar-circle">{text.charAt(0)}</div>
          <div>
            <div className="debt-name">{text}</div>
            <div className="debt-phone">{record.phone}</div>
          </div>
        </div>
      )
    },
    {
      title: <div style={{ textAlign: 'center' }}>Ngày hẹn trả</div>,
      dataIndex: 'dueDate',
      key: 'dueDate',
      width: 140,
      align: 'center'
    },
    {
      title: <div style={{ textAlign: 'center' }}>Tổng cộng</div>,
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      align: 'center',
      width: 140,
      render: (value) => value.toLocaleString('vi-VN')
    },
    {
      title: <div style={{ textAlign: 'center' }}>Đã thanh toán</div>,
      dataIndex: 'paidAmount',
      key: 'paidAmount',
      align: 'center',
      width: 150,
      render: (value) => value.toLocaleString('vi-VN')
    },
    {
      title: <div style={{ textAlign: 'center' }}>Còn nợ</div>,
      dataIndex: 'remainingAmount',
      key: 'remainingAmount',
      align: 'center',
      width: 140,
      render: (value) => (
        <span style={{ fontWeight: 600 }}>
          {value.toLocaleString('vi-VN')}
        </span>
      )
    },
    {
      title: <div style={{ textAlign: 'center' }}>Trạng thái</div>,
      dataIndex: 'status',
      key: 'status',
      width: 140,
      align: 'center',
      render: (value) => {
        const config = STATUS_COLORS[value] || STATUS_COLORS.pending
        return (
          <Tag
            style={{
              borderRadius: 999,
              padding: '4px 12px',
              fontWeight: 600,
              color: config.color,
              background: config.bg,
              borderColor: 'transparent'
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
      width: 70,
      render: (_, record) => (
        <Button
          type="text"
          icon={<i className="bi bi-eye" />}
          onClick={() => {
            navigate('/accountance/debts/detail', { state: { customer: record } })
          }}
        />
      ),
    }
  ]

  const expandedRowRender = (record) => {
    const detailColumns = [
      { 
        title: 'STT', 
        key: 'index', 
        width: 70,
        align: 'center',
        render: (_, __, index) => (
          <span style={{ fontWeight: 600 }}>{String(index + 1).padStart(2, '0')}</span>
        )
      },
      { title: 'Code', dataIndex: 'code', key: 'code', width: 160 },
      { title: 'Ngày lập', dataIndex: 'createdAt', key: 'createdAt', width: 140 },
      {
        title: 'Tổng tiền',
        dataIndex: 'total',
        key: 'total',
        width: 140,
        align: 'center',
        render: (value) => value.toLocaleString('vi-VN')
      },
      {
        title: 'Còn nợ',
        dataIndex: 'remain',
        key: 'remain',
        width: 140,
        align: 'center',
        render: (value) => value.toLocaleString('vi-VN')
      },
      { title: 'Hẹn trả', dataIndex: 'dueDate', key: 'dueDate', width: 140 },
      {
        title: 'Hành động',
        key: 'action',
        width: 200,
        render: (_, detailRecord) => {
          // Hiển thị 2 nút nếu còn nợ (remain > 0)
          if (detailRecord.remain > 0) {
            return (
              <Space>
                <Button
                  type="primary"
                  style={{
                    background: '#22c55e',
                    borderColor: '#22c55e',
                    borderRadius: '6px',
                    fontWeight: 600
                  }}
                  onClick={() => {
                    console.log('Thanh toán:', detailRecord)
                  }}
                >
                  Thanh toán
                </Button>
                <Button
                  style={{
                    background: '#f97316',
                    borderColor: '#f97316',
                    color: '#fff',
                    borderRadius: '6px',
                    fontWeight: 600
                  }}
                  onClick={() => {
                    console.log('Gửi:', detailRecord)
                  }}
                >
                  Gửi
                </Button>
              </Space>
            )
          }
          // Nếu đã thanh toán hết, hiển thị tag
          const config = detailStatusConfig[detailRecord.status] || detailStatusConfig.warning
          return (
            <Tag
              style={{
                background: config.bg,
                color: config.color,
                borderColor: config.color,
                borderRadius: 999,
                padding: '4px 12px',
                fontWeight: 600
              }}
            >
              {config.label}
            </Tag>
          )
        }
      }
    ]

    return (
      <div className="debts-nested">
        <Table
          columns={detailColumns}
          dataSource={record.details.map((item, index) => ({ ...item, key: item.id, index }))}
          pagination={false}
          components={goldTableHeader}
          locale={{
            emptyText: 'Không có phiếu nợ'
          }}
        />
      </div>
    )
  }

  return (
      <div className="debts-page">
        <div className="debts-header">
          <h1>Công nợ • Khách hàng</h1>
        </div>

        <div className="debts-filters" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          {/* Left side - Search */}
          <Input
            prefix={<SearchOutlined />}
            placeholder="Tìm kiếm"
            allowClear
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="debts-search"
            style={{ width: 320 }}
          />
          
          {/* Right side - Filter buttons */}
          <Space wrap>
            {STATUS_FILTERS.map((filter) => (
              <Button
                key={filter.key}
                type={status === filter.key ? 'primary' : 'default'}
                onClick={() => setStatus(filter.key)}
                style={{
                  background: status === filter.key ? '#CBB081' : '#fff',
                  borderColor: status === filter.key ? '#CBB081' : '#d9d9d9',
                  color: status === filter.key ? '#fff' : '#666',
                  fontWeight: 500,
                  borderRadius: 6
                }}
              >
                {filter.label}
              </Button>
            ))}
          </Space>
        </div>

        <div className="debts-table-card">
          <Table
            className="debts-table"
            columns={columns}
            dataSource={normalizedDebts.map((item, index) => ({
              ...item,
              index
            }))}
            loading={loading}
            expandable={{
              expandedRowRender,
              expandedRowKeys,
              onExpandedRowsChange: (keys) => setExpandedRowKeys(keys),
              expandIconColumnIndex: -1,
            }}
            pagination={{
              pageSize: pagination.size,
              current: pagination.page + 1,
              total: pagination.total,
              showTotal: (total) => `Tổng ${total} bản ghi`,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50', '100'],
              onChange: (page, size) => {
                fetchDebts(page - 1, size)
              }
            }}
            components={goldTableHeader}
          />
        </div>
      </div>
  )
}

export default function AccountanceDebts({ Layout = AccountanceLayout }) {
  const Wrapper = Layout || (({ children }) => <>{children}</>)
  return (
    <Wrapper>
      <AccountanceDebtsContent />
    </Wrapper>
  )
}

