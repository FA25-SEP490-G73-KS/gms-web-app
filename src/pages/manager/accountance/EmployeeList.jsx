import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Table, Input, Button, Space, Tag, Avatar, message } from 'antd'
import { SearchOutlined, PlusOutlined, FilterOutlined } from '@ant-design/icons'
import ManagerLayout from '../../../layouts/ManagerLayout'
import { goldTableHeader } from '../../../utils/tableComponents'
import { employeesAPI } from '../../../services/api'
import '../../../styles/pages/accountance/employee-list.css'

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

const fallbackEmployees = [
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
    name: 'Nguyễn Văn Minh',
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
  }
]

const formatEmployee = (employee, index) => {
  const safeNumber = (value) => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
      return 0
    }
    return Number(value)
  }
  const rawDate = employee.joinDate || employee.startDate || employee.createdAt
  const joinDate = (() => {
    if (!rawDate) return '—'
    const date = new Date(rawDate)
    if (Number.isNaN(date.getTime())) return rawDate
    return date.toLocaleDateString('vi-VN')
  })()

  return {
    id: employee.id || employee.employeeId || `emp-${index}`,
    name: employee.fullName || employee.name || 'Không rõ',
    phone: employee.phone || employee.phoneNumber || employee.contactNumber || '—',
    salary: safeNumber(employee.salary || employee.baseSalary || employee.basicSalary || 0),
    department: employee.department || employee.departmentName || '—',
    position: employee.position || employee.jobTitle || '—',
    joinDate,
    status: (employee.status || 'active').toLowerCase(),
    avatar: employee.avatarUrl || employee.avatar || undefined
  }
}

export default function EmployeeListForManager() {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [employees, setEmployees] = useState(fallbackEmployees)
  const [total, setTotal] = useState(fallbackEmployees.length)
  const [loading, setLoading] = useState(false)
  const didInit = useRef(false)

  const fetchEmployees = useCallback(
    async (pageIndex = 0, size = 10) => {
      setLoading(true)
      try {
        const { data, error } = await employeesAPI.getAll(pageIndex, size)
        if (error) throw new Error(error)
        const payload = data?.result || data?.data || data
        const list = Array.isArray(payload)
          ? payload
          : payload?.content || payload?.items || payload?.records || []
        setEmployees(list.map((item, idx) => formatEmployee(item, idx)))
        setTotal(payload?.totalElements || payload?.total || payload?.totalItems || list.length)
        setPage(pageIndex + 1)
        setPageSize(size)
      } catch (err) {
        message.error(err.message || 'Không thể tải danh sách nhân viên')
        setEmployees(fallbackEmployees)
        setTotal(fallbackEmployees.length)
        setPage(1)
        setPageSize(10)
      } finally {
        setLoading(false)
      }
    },
    []
  )

  useEffect(() => {
    if (!didInit.current) {
      fetchEmployees(0, pageSize)
      didInit.current = true
    }
  }, [fetchEmployees, pageSize])

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
  }, [employees, query, status])

  const columns = [
    {
      title: 'STT',
      dataIndex: 'index',
      key: 'index',
      width: 70,
      render: (_, __, index) => <span style={{ fontWeight: 600 }}>{String(index + 1).padStart(2, '0')}</span>
    },
    {
      title: 'Họ Tên',
      dataIndex: 'name',
      key: 'name',
      width: 220,
      render: (_, record) => (
        <div className="employee-name-cell">
          <Avatar size={40} src={record.avatar}>
            {record.name.split(' ').slice(-1).join('').charAt(0)}
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
      render: (value) => <span style={{ fontWeight: 600 }}>{value.toLocaleString('vi-VN')} đ</span>
    },
    {
      title: 'Phòng ban',
      dataIndex: 'department',
      key: 'department',
      width: 140,
      render: (text) => <Tag className="department-tag">{text}</Tag>
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
    <ManagerLayout>
      <div style={{ padding: 24, minHeight: '100vh' }}>
        <div
          style={{
            background: '#fff',
            borderRadius: 20,
            padding: 24,
            boxShadow: '0 20px 45px rgba(15,23,42,0.08)',
          }}
        >
          <div className="employee-header" style={{ marginBottom: 24 }}>
            <h2>Danh sách nhân sự</h2>
            <p style={{ color: '#98a2b3', margin: 0 }}>Theo dõi trạng thái và thông tin nhân viên</p>
          </div>

          <div className="employee-filters" style={{ gap: 16 }}>
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

          <div className="employee-table-card" style={{ borderRadius: 16 }}>
            <div className="table-title">Danh sách</div>
            <Table
              className="employee-table"
              columns={columns}
              dataSource={filtered}
              loading={loading}
              pagination={{
                current: page,
                pageSize,
                total,
                showSizeChanger: true,
                showTotal: (t) => `0 of ${t} row(s) selected.`,
                pageSizeOptions: ['10', '20', '50', '100'],
                onChange: (current, size) => {
                  fetchEmployees(current - 1, size)
                }
              }}
              components={goldTableHeader}
            />
          </div>
        </div>
      </div>
    </ManagerLayout>
  )
}

