import React, { useMemo, useState } from 'react'
import { Table, Input, Button, Tag, DatePicker } from 'antd'
import { SearchOutlined, FilterOutlined } from '@ant-design/icons'
import AccountanceLayout from '../../layouts/AccountanceLayout'
import { goldTableHeader } from '../../utils/tableComponents'
import '../../styles/pages/accountance/payroll.css'

const statusFilters = [
  { key: 'all', label: 'Tất cả' },
  { key: 'paid', label: 'Đã chi trả' },
  { key: 'pending', label: 'Đang xử lý' }
]

const STATUS_CONFIG = {
  paid: { color: '#5b8def', bg: '#eef4ff', text: 'Đã chi trả' },
  pending: { color: '#b45309', bg: '#fff4e6', text: 'Đang xử lý' }
}

const payrollData = [
  {
    id: 1,
    name: 'Hoàng Thị Khánh Ly',
    phone: '0919866874',
    baseSalary: 20000000,
    allowance: 2000000,
    deduction: 500000,
    netSalary: 21500000,
    status: 'paid'
  },
  {
    id: 2,
    name: 'Nguyễn Văn A',
    phone: '0913336432',
    baseSalary: 20000000,
    allowance: 2000000,
    deduction: 0,
    netSalary: 22000000,
    status: 'paid'
  },
  {
    id: 3,
    name: 'Phạm Văn B',
    phone: '0123456789',
    baseSalary: 20000000,
    allowance: 2000000,
    deduction: 0,
    netSalary: 22000000,
    status: 'paid'
  },
  {
    id: 4,
    name: 'Lê Thị C',
    phone: '0987623455',
    baseSalary: 20000000,
    allowance: 2000000,
    deduction: 0,
    netSalary: 22000000,
    status: 'pending'
  }
]

export default function Payroll() {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [month, setMonth] = useState(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const filtered = useMemo(() => {
    return payrollData
      .filter((item) => {
        const matchesQuery =
          !query ||
          item.name.toLowerCase().includes(query.toLowerCase()) ||
          item.phone.includes(query)
        const matchesStatus = status === 'all' || item.status === status
        return matchesQuery && matchesStatus
      })
      .map((item, index) => ({ ...item, key: item.id, index }))
  }, [query, status])

  const columns = [
    {
      title: 'Họ Tên',
      dataIndex: 'name',
      key: 'name',
      width: 220,
      render: (_, record) => (
        <div className="payroll-name-cell">
          <div className="avatar-circle">{record.name.charAt(0)}</div>
          <div>
            <div className="payroll-name">{record.name}</div>
            <div className="payroll-phone">{record.phone}</div>
          </div>
        </div>
      )
    },
    {
      title: 'Lương cơ bản',
      dataIndex: 'baseSalary',
      key: 'baseSalary',
      width: 150,
      render: (value) => value.toLocaleString('vi-VN')
    },
    {
      title: 'Phụ cấp',
      dataIndex: 'allowance',
      key: 'allowance',
      width: 120,
      render: (value) => value.toLocaleString('vi-VN')
    },
    {
      title: 'Khấu trừ',
      dataIndex: 'deduction',
      key: 'deduction',
      width: 120,
      render: (value) => value.toLocaleString('vi-VN')
    },
    {
      title: 'Lương ròng',
      dataIndex: 'netSalary',
      key: 'netSalary',
      width: 150,
      render: (value) => (
        <span style={{ fontWeight: 600 }}>{value.toLocaleString('vi-VN')}</span>
      )
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (value) => {
        const config = STATUS_CONFIG[value]
        return (
          <Tag
            style={{
              color: config.color,
              background: config.bg,
              borderColor: config.color,
              borderRadius: 999,
              padding: '4px 12px',
              fontWeight: 600
            }}
          >
            {config.text}
          </Tag>
        )
      }
    },
    {
      title: '',
      key: 'actions',
      width: 80,
      render: () => <i className="bi bi-eye payroll-view-icon" />
    }
  ]

  return (
    <AccountanceLayout>
      <div className="payroll-page">
        <div className="payroll-header">
          <h1>Lương nhân viên</h1>
        </div>

        <div className="payroll-filters">
          <DatePicker
            picker="month"
            placeholder="Tháng"
            value={month}
            onChange={setMonth}
            className="payroll-month-picker"
          />
          <div className="status-filters">
            {statusFilters.map((item) => (
              <Button
                key={item.key}
                type={status === item.key ? 'primary' : 'default'}
                onClick={() => setStatus(item.key)}
                className={status === item.key ? 'status-btn active' : 'status-btn'}
              >
                {item.label}
              </Button>
            ))}
          </div>
          <div className="payroll-actions">
            <Input
              prefix={<SearchOutlined />}
              placeholder="Tìm kiếm"
              allowClear
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="payroll-search"
            />
            <Button icon={<FilterOutlined />} className="sort-btn">
              Sort
            </Button>
          </div>
        </div>

        <div className="payroll-table-card">
          <Table
            className="payroll-table"
            columns={columns}
            dataSource={filtered}
            pagination={{
              current: page,
              pageSize,
              total: filtered.length,
              showSizeChanger: true,
              showTotal: (total) => `0 of ${total} row(s) selected.`,
              pageSizeOptions: ['10', '20', '50', '100'],
              onChange: (current, size) => {
                setPage(current)
                setPageSize(size)
              }
            }}
            components={goldTableHeader}
          />
        </div>
      </div>
    </AccountanceLayout>
  )
}

