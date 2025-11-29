import React, { useState, useEffect, useCallback, useRef, memo } from 'react'
import { Table, Input, Button, Tag, DatePicker, message } from 'antd'
import { SearchOutlined, FilterOutlined } from '@ant-design/icons'
import ManagerLayout from '../../../layouts/ManagerLayout'
import { goldTableHeader } from '../../../utils/tableComponents'
import { payrollAPI } from '../../../services/api'
import dayjs from 'dayjs'
import '../../../styles/pages/accountance/payroll.css'

const statusFilters = [
  { key: 'all', label: 'Tất cả' },
  { key: 'paid', label: 'Đã chi trả' },
  { key: 'pending', label: 'Đang xử lý' }
]

const STATUS_CONFIG = {
  paid: { color: '#3b82f6', bg: '#eef4ff', text: 'Đã chi trả' },
  pending: { color: '#c2410c', bg: '#fff4e6', text: 'Đang xử lý' }
}

// Memoized DatePicker component to prevent re-render
const PayrollDatePicker = memo(({ value, onChange }) => {
  return (
    <DatePicker
      picker="month"
      placeholder="Tháng"
      value={value}
      onChange={onChange}
      format="MM/YYYY"
      className="payroll-month-picker"
    />
  )
}, (prevProps, nextProps) => {
  // Custom comparison: only re-render if value actually changed
  return prevProps.value?.format('MM/YYYY') === nextProps.value?.format('MM/YYYY') &&
         prevProps.onChange === nextProps.onChange
})

PayrollDatePicker.displayName = 'PayrollDatePicker'

export default function PayrollForManager() {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [selectedDate, setSelectedDate] = useState(dayjs()) // Default to current month
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [payrollData, setPayrollData] = useState([])
  const [loading, setLoading] = useState(false)
  const prevDateRef = useRef(null)

  // Memoize fetchPayrollData to prevent re-creation on every render
  const fetchPayrollData = useCallback(async () => {
    try {
      setLoading(true)
      const month = selectedDate.month() + 1 // dayjs month is 0-based, API expects 1-based
      const year = selectedDate.year()

      console.log('=== Fetching Payroll Preview ===')
      console.log('Month:', month)
      console.log('Year:', year)
      console.log('===============================')

      const { data, error } = await payrollAPI.getPreview(month, year)

      if (error) {
        console.error('=== Payroll API Error ===')
        console.error('Error:', error)
        console.error('Error message:', error?.message || error)
        console.error('========================')
        
        // Check for specific backend errors
        const errorMessage = error?.message || error || ''
        const errorString = typeof error === 'string' ? error : JSON.stringify(error)
        
        if (errorString.includes('getDailySalary') || errorString.includes('null')) {
          message.error('Một số nhân viên chưa có thông tin lương cơ bản. Vui lòng kiểm tra lại dữ liệu nhân viên.')
        } else {
          message.error(errorMessage || 'Không thể tải dữ liệu lương')
        }
        
        setPayrollData([])
        return
      }

      console.log('API Response:', data)

      if (data && data.result && data.result.items) {
        // Transform API response to match table format
        const transformedData = data.result.items.map((item) => {
          // Map status: PENDING_MANAGER_APPROVAL -> 'pending', others -> 'paid'
          const status = item.status === 'PENDING_MANAGER_APPROVAL' ? 'pending' : 'paid'

          return {
            id: item.employeeId,
            name: item.employeeName || 'Không rõ',
            phone: item.phone || '',
            baseSalary: item.baseSalary || 0,
            allowance: item.allowance || 0,
            deduction: item.deduction || 0,
            advanceSalary: item.advanceSalary || 0,
            netSalary: item.netSalary || 0,
            workingDays: item.workingDays || 0,
            status
          }
        })

        console.log('Transformed data:', transformedData.length, 'employees')
        setPayrollData(transformedData)
      } else {
        console.warn('No items in API response')
        setPayrollData([])
      }
    } catch (err) {
      console.error('=== Exception fetching payroll ===')
      console.error('Error:', err)
      console.error('Error message:', err?.message || err)
      console.error('==================================')
      
      // Check for specific backend errors
      const errorMessage = err?.message || err?.response?.data?.message || ''
      const errorString = typeof err === 'string' ? err : JSON.stringify(err)
      
      if (errorString.includes('getDailySalary') || errorString.includes('null') || errorMessage.includes('getDailySalary')) {
        message.error('Một số nhân viên chưa có thông tin lương cơ bản. Vui lòng kiểm tra lại dữ liệu nhân viên.')
      } else if (err?.response?.status === 500) {
        message.error('Lỗi server khi tính toán lương. Vui lòng thử lại sau.')
      } else {
        message.error(errorMessage || 'Đã xảy ra lỗi khi tải dữ liệu lương')
      }
      
      setPayrollData([])
    } finally {
      setLoading(false)
    }
  }, [selectedDate])

  // Fetch payroll data on mount and when date actually changes
  useEffect(() => {
    if (!selectedDate) return
    
    // Check if date actually changed (compare month and year)
    const currentMonthYear = `${selectedDate.month()}-${selectedDate.year()}`
    const prevMonthYear = prevDateRef.current ? `${prevDateRef.current.month()}-${prevDateRef.current.year()}` : null
    
    // Call API on mount (prevMonthYear is null) or when month/year actually changes
    if (prevMonthYear === null || currentMonthYear !== prevMonthYear) {
      prevDateRef.current = selectedDate
      fetchPayrollData()
    }
  }, [selectedDate, fetchPayrollData])

  // Memoize date change handler to prevent DatePicker re-render
  const handleDateChange = useCallback((date) => {
    setSelectedDate(date || dayjs())
  }, [])

  // Calculate filtered data directly (no useMemo)
  const filtered = payrollData
    .filter((item) => {
      const matchesQuery =
        !query ||
        item.name.toLowerCase().includes(query.toLowerCase()) ||
        item.phone.includes(query)
      const matchesStatus = status === 'all' || item.status === status
      return matchesQuery && matchesStatus
    })
    .map((item, index) => ({ ...item, key: item.id || index }))

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
      render: (value) => <span style={{ fontWeight: 600 }}>{value.toLocaleString('vi-VN')}</span>
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
          <div className="payroll-header" style={{ marginBottom: 24 }}>
            <h2>Lương nhân viên</h2>
            <p style={{ color: '#98a2b3', margin: 0 }}>Theo dõi các khoản lương và trạng thái chi trả</p>
          </div>

          <div className="payroll-filters" style={{ gap: 16 }}>
            <PayrollDatePicker
              value={selectedDate}
              onChange={handleDateChange}
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

          <div className="payroll-table-card" style={{ borderRadius: 16 }}>
            <Table
              className="payroll-table"
              columns={columns}
              dataSource={filtered}
              loading={loading}
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
      </div>
    </ManagerLayout>
  )
}

