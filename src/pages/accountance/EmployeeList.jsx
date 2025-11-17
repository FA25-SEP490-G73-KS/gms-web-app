import React, { useMemo, useState } from 'react'
import { Table, Input, Button, Space, Tag, Avatar } from 'antd'
import { SearchOutlined, PlusOutlined, FilterOutlined } from '@ant-design/icons'
import AccountanceLayout from '../../layouts/AccountanceLayout'
import { goldTableHeader } from '../../utils/tableComponents'
import '../../styles/pages/accountance/employee-list.css'

const STATUS_CONFIG = {
  active: { color: '#1f8f4d', bg: '#eafff5', text: 'Đang làm việc' },
  leave: { color: '#b45309', bg: '#fff7ed', text: 'Nghỉ phép' },
  inactive: { color: '#ef4444', bg: '#fef2f2', text: 'Nghỉ việc' }
}

const statusFilters = [
  { key: 'all', label: 'Tất cả' },
  { key: 'active', label: 'Đang hoạt động' },
  { key: 'leave', label: 'Nghỉ làm' },
  { key: 'inactive', label: 'Nghỉ phép' }
]

const employees = [
  {
    id: 1,
    name: 'Hoàng Thị Khánh Ly',
    phone: '0919866874',
    salary: 20000000,
    department: 'Kế toán',
    position: 'Kế toán',
    joinDate: '23/02/2025',
    status: 'active',
    avatar: '/image/avatar-1.png'
  },
  {
    id: 2,
    name: 'Nguyễn Văn A',
    phone: '0913336432',
    salary: 20000000,
    department: 'Sơn',
    position: 'Kỹ thuật viên',
    joinDate: '23/02/2025',
    status: 'active',
    avatar: '/image/avatar-2.png'
  },
  {
    id: 3,
    name: 'Phạm Văn B',
    phone: '0123456789',
    salary: 20000000,
    department: 'Kho',
    position: 'Nhân viên kho',
    joinDate: '23/02/2025',
    status: 'active'
  },
  {
    id: 4,
    name: 'Lê Thị C',
    phone: '0987623455',
    salary: 20000000,
    department: 'Kế toán',
    position: 'Kế toán',
    joinDate: '23/02/2025',
    status: 'leave'
  },
  {
    id: 5,
    name: 'Hoàng Văn D',
    phone: '0456787345',
    salary: 20000000,
    department: 'Sơn',
    position: 'Kỹ thuật viên',
    joinDate: '23/02/2025',
    status: 'active'
  },
  {
    id: 6,
    name: 'Đặng Thị Huyền',
    phone: '0456787345',
    salary: 20000000,
    department: 'Máy',
    position: 'Kỹ thuật viên',
    joinDate: '23/02/2025',
    status: 'active'
  },
  {
    id: 7,
    name: 'Nguyễn Văn A',
    phone: '0456787347',
    salary: 20000000,
    department: 'Máy',
    position: 'Kỹ thuật viên',
    joinDate: '23/02/2025',
    status: 'leave'
  },
  {
    id: 8,
    name: 'Nguyễn Văn A',
    phone: '0456787347',
    salary: 20000000,
    department: 'Máy',
    position: 'Kỹ thuật viên',
    joinDate: '23/02/2025',
    status: 'inactive'
  }
]

export default function EmployeeList() {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const filtered = useMemo(() => {
    return employees
      .filter((emp) => {
        const matchesQuery =
          !query ||
          emp.name.toLowerCase().includes(query.toLowerCase()) ||
          emp.phone.includes(query)
        const matchesStatus = status === 'all' || emp.status === status
        return matchesQuery && matchesStatus
      })
      .map((emp, index) => ({ ...emp, key: emp.id, index: index + 1 }))
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
      title: 'Họ Tên',
      dataIndex: 'name',
      key: 'name',
      width: 220,
      render: (_, record) => (
        <div className="employee-name-cell">
          <Avatar size={40} src={record.avatar}>
            {record.name
              .split(' ')
              .slice(-1)
              .join('')
              .charAt(0)}
          </Avatar>
          <div>
            <div className="emp-name">{record.name}</div>
            <div className="emp-phone">{record.phone}</div>
          </div>
        </div>
      )
    },
    {
      title: 'Lương cơ bản',
      dataIndex: 'salary',
      key: 'salary',
      width: 160,
      render: (value) => (
        <span style={{ fontWeight: 600 }}>{value.toLocaleString('vi-VN')} đ</span>
      )
    },
    {
      title: 'Phòng ban',
      dataIndex: 'department',
      key: 'department',
      width: 140,
      render: (text) => (
        <Tag className="department-tag">{text}</Tag>
      )
    },
    {
      title: 'Chức vụ',
      dataIndex: 'position',
      key: 'position',
      width: 160
    },
    {
      title: 'Ngày tham gia',
      dataIndex: 'joinDate',
      key: 'joinDate',
      width: 140
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 150,
      render: (value) => {
        const config = STATUS_CONFIG[value] || STATUS_CONFIG.active
        return (
          <Tag
            style={{
              color: config.color,
              background: config.bg,
              borderColor: config.color,
              borderRadius: 999,
              fontWeight: 600,
              padding: '4px 12px'
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
      width: 100,
      render: () => (
        <Space>
          <Button type="text" size="small" icon={<i className="bi bi-pencil" />} />
          <Button type="text" size="small" danger icon={<i className="bi bi-trash3" />} />
        </Space>
      )
    }
  ]

  return (
    <AccountanceLayout>
      <div className="employee-page">
        <div className="employee-header">
          <h1>Danh sách nhân viên</h1>
        </div>

        <div className="employee-filters">
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
          <div className="employee-actions">
            <Input
              prefix={<SearchOutlined />}
              placeholder="Tìm kiếm"
              allowClear
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="employee-search"
            />
            <Button type="primary" icon={<PlusOutlined />} className="add-btn">
              Thêm nhân viên
            </Button>
            <Button icon={<FilterOutlined />} className="sort-btn">
              Sort
            </Button>
          </div>
        </div>

        <div className="employee-table-card">
          <div className="table-title">Table List</div>
          <Table
            className="employee-table"
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

