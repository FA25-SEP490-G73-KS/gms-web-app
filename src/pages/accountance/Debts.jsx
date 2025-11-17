import React, { useMemo, useState } from 'react'
import { Table, Input, Button, Space, Tag } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import AccountanceLayout from '../../layouts/AccountanceLayout'
import { goldTableHeader } from '../../utils/tableComponents'
import '../../styles/pages/accountance/debts.css'

const STATUS_FILTERS = [
  { key: 'pending', label: 'Chưa hoàn tất' },
  { key: 'paid', label: 'Đã thanh toán' },
  { key: 'all', label: 'Tất cả' }
]

const STATUS_COLORS = {
  pending: { color: '#b45309', text: 'Chưa hoàn tất' },
  paid: { color: '#1f8f4d', text: 'Đã thanh toán' }
}

const detailStatusConfig = {
  done: { label: 'Thanh toán', color: '#22c55e', bg: '#dcfce7' },
  warning: { label: 'Sắp', color: '#f97316', bg: '#ffedd5' }
}

const debtData = [
  {
    id: 1,
    customer: 'Nguyễn Văn A',
    phone: '0123456789',
    totalDebt: 20000000,
    debtCount: 2,
    status: 'pending',
    details: [
      {
        id: 1,
        code: 'STK-2025-000001',
        createdAt: '12/11/2025',
        total: 12000000,
        remain: 5000000,
        dueDate: '30/11/2025',
        status: 'done'
      },
      {
        id: 2,
        code: 'STK-2025-000002',
        createdAt: '12/11/2025',
        total: 3000000,
        remain: 15000000,
        dueDate: '30/11/2025',
        status: 'warning'
      }
    ]
  },
  {
    id: 2,
    customer: 'Nguyễn Văn A',
    phone: '0123456789',
    totalDebt: 20000000,
    debtCount: 1,
    status: 'pending',
    details: []
  },
  {
    id: 3,
    customer: 'Nguyễn Văn A',
    phone: '0123456789',
    totalDebt: 20000000,
    debtCount: 1,
    status: 'paid',
    details: []
  }
]

export default function Debts() {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('pending')
  const [expandedRowKeys, setExpandedRowKeys] = useState(['1'])

  const filtered = useMemo(() => {
    return debtData
      .filter((item) => {
        const matchesQuery =
          !query ||
          item.customer.toLowerCase().includes(query.toLowerCase()) ||
          item.phone.includes(query)
        const matchesStatus =
          status === 'all' ||
          (status === 'pending' && item.status !== 'paid') ||
          (status === 'paid' && item.status === 'paid')
        return matchesQuery && matchesStatus
      })
      .map((item, index) => ({ ...item, key: item.id, index }))
  }, [query, status])

  const columns = [
    {
      title: 'STT',
      dataIndex: 'index',
      key: 'index',
      width: 70,
      render: (_, __, index) => (
        <span style={{ fontWeight: 600 }}>{String(index + 1).padStart(2, '0')}</span>
      )
    },
    {
      title: 'Khách hàng',
      dataIndex: 'customer',
      key: 'customer',
      width: 200,
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
      title: 'Số điện thoại',
      dataIndex: 'phone',
      key: 'phone',
      width: 150
    },
    {
      title: 'Tổng nợ',
      dataIndex: 'totalDebt',
      key: 'totalDebt',
      width: 150,
      render: (value) => value.toLocaleString('vi-VN')
    },
    {
      title: 'Số phiếu nợ',
      dataIndex: 'debtCount',
      key: 'debtCount',
      width: 140
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 160,
      render: (value) => {
        const config = STATUS_COLORS[value]
        return (
          <Tag
            style={{
              borderRadius: 999,
              padding: '4px 12px',
              fontWeight: 600,
              color: config.color,
              background: 'transparent',
              borderColor: config.color
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
      render: (_, record) => (
        <Button type="text" onClick={() => setExpandedRowKeys([record.key.toString()])}>
          <i className="bi bi-chevron-down" />
        </Button>
      )
    }
  ]

  const expandedRowRender = (record) => {
    const detailColumns = [
      { title: 'STT', dataIndex: 'id', key: 'id', width: 70 },
      { title: 'Code', dataIndex: 'code', key: 'code', width: 160 },
      { title: 'Ngày lập', dataIndex: 'createdAt', key: 'createdAt', width: 140 },
      {
        title: 'Tổng tiền',
        dataIndex: 'total',
        key: 'total',
        width: 140,
        render: (value) => value.toLocaleString('vi-VN')
      },
      {
        title: 'Còn nợ',
        dataIndex: 'remain',
        key: 'remain',
        width: 140,
        render: (value) => value.toLocaleString('vi-VN')
      },
      { title: 'Hẹn trả', dataIndex: 'dueDate', key: 'dueDate', width: 140 },
      {
        title: 'Xác nhận thanh toán',
        dataIndex: 'status',
        key: 'status',
        width: 200,
        render: (value) => {
          const config = detailStatusConfig[value] || detailStatusConfig.warning
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
          dataSource={record.details.map((item) => ({ ...item, key: item.id }))}
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
    <AccountanceLayout>
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
          />
          <Space>
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
            dataSource={filtered}
            expandable={{
              expandedRowRender,
              expandedRowKeys,
              onExpandedRowsChange: (keys) => setExpandedRowKeys(keys)
            }}
            pagination={{
              pageSize: 10,
              current: 1,
              total: filtered.length,
              showTotal: (total) => `0 of ${total} row(s) selected.`
            }}
            components={goldTableHeader}
          />
        </div>
      </div>
    </AccountanceLayout>
  )
}

