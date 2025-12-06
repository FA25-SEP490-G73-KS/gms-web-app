import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Table, Input, Button, Space, Tag, message } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
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
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('CON_NO')
  const [expandedRowKeys, setExpandedRowKeys] = useState([])
  const [loading, setLoading] = useState(false)
  const [debts, setDebts] = useState([])
  const [pagination, setPagination] = useState({
    page: 0,
    size: 10,
    total: 0
  })

  const normalizedDebts = useMemo(() => {
    return debts.map((item, index) => {
      const customerName =
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
      const totalAmount = safeNumber(item.totalDebt ?? firstDetail.total ?? item.total ?? item.amount)
      const remainingAmount = safeNumber(firstDetail.remain ?? item.remainingAmount ?? 0)
      const paidAmount = Math.max(totalAmount - remainingAmount, 0)
      return {
        key: item.id || `debt-${index}`,
        id: item.id || index,
        customer: customerName,
        phone,
        licensePlate: firstDetail.licensePlate || firstDetail.vehiclePlate || item.licensePlate || '—',
        totalAmount,
        paidAmount,
        remainingAmount,
        dueDate: formatDate(firstDetail.dueDate || item.dueDate),
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
        setExpandedRowKeys([])
      } catch (err) {
        message.error(err.message || 'Không thể tải dữ liệu công nợ')
        setDebts([])
        setPagination((prev) => ({ ...prev, total: 0, page: 0 }))
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
      title: 'Khách hàng',
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
      title: 'Biển số xe',
      dataIndex: 'licensePlate',
      key: 'licensePlate',
      width: 140
    },
    {
      title: 'Tổng cộng',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      align: 'right',
      width: 140,
          render: (value) => value.toLocaleString('vi-VN')
    },
    {
      title: 'Đã thanh toán',
      dataIndex: 'paidAmount',
      key: 'paidAmount',
      align: 'right',
      width: 150,
      render: (value) => value.toLocaleString('vi-VN')
    },
    {
      title: 'Còn nợ',
      dataIndex: 'remainingAmount',
      key: 'remainingAmount',
      align: 'right',
      width: 140,
      render: (value) => (
        <span style={{ color: value > 0 ? '#d92d20' : '#15803d', fontWeight: 600 }}>
          {value.toLocaleString('vi-VN')}
        </span>
      )
    },
    {
      title: 'Ngày hẹn trả',
      dataIndex: 'dueDate',
      key: 'dueDate',
      width: 140
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 140,
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
            const key = record.key
            setExpandedRowKeys((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]))
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
        align: 'right',
        render: (value) => value.toLocaleString('vi-VN')
      },
      {
        title: 'Còn nợ',
        dataIndex: 'remain',
        key: 'remain',
        width: 140,
        align: 'right',
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

        <div className="debts-filters">
          <Input
            prefix={<SearchOutlined />}
            placeholder="Tìm kiếm"
            allowClear
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="debts-search"
            style={{ maxWidth: 320 }}
          />
        <Space wrap>
            {STATUS_FILTERS.map((filter) => (
              <Button
                key={filter.key}
                type={status === filter.key ? 'primary' : 'default'}
                onClick={() => setStatus(filter.key)}
                className={status === filter.key ? 'status-btn active' : 'status-btn'}
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

