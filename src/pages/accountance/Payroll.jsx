import React, { useMemo, useState, useEffect, useRef } from 'react'
import { Table, Input, Button, Tag, message, Modal, Checkbox } from 'antd'
import { SearchOutlined, FilterOutlined, EyeOutlined, CalendarOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import AccountanceLayout from '../../layouts/AccountanceLayout'
import { goldTableHeader } from '../../utils/tableComponents'
import { payrollAPI } from '../../services/api'
import { getUserIdFromToken } from '../../utils/helpers'
import dayjs from 'dayjs'
import '../../styles/pages/accountance/payroll.css'

const STATUS_CONFIG = {
  pending: { color: '#0ea5e9', bg: '#e0f2fe', text: 'Đang làm lương' },
  pending_manager_approval: { color: '#b45309', bg: '#fff4e6', text: 'Chờ quản lý duyệt' },
  approved: { color: '#5b8def', bg: '#eef4ff', text: 'Duyệt' },
  paid: { color: '#22c55e', bg: '#f0fdf4', text: 'Đã thanh toán' }
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

export function AccountancePayrollContent() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [selectedMonth, setSelectedMonth] = useState(dayjs().format('YYYY-MM'))
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [payrollData, setPayrollData] = useState([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const monthInputRef = useRef(null)
  const [filterModalVisible, setFilterModalVisible] = useState(false)
  const [filterStatuses, setFilterStatuses] = useState([])
  const [filterForm, setFilterForm] = useState({
    statuses: [],
    month: dayjs().format('YYYY-MM')
  })

  useEffect(() => {
    fetchPayrollData()
  }, [selectedMonth, page, pageSize])

  // Helper function to transform payroll data
  const transformPayrollData = (items) => {
    return items.map((item) => {
      // Map status từ API (enum hoặc text tiếng Việt) sang key trong STATUS_CONFIG
      const rawStatus = String(item.status || '').trim()
      
      // Object mapping rõ ràng: status từ API -> key trong STATUS_CONFIG
      const statusMap = {
        'Đang làm lương': 'pending',
        'PENDING': 'pending',
        'Chờ quản lý duyệt': 'pending_manager_approval',
        'PENDING_MANAGER_APPROVAL': 'pending_manager_approval',
        'Đã duyệt': 'approved',
        'Duyệt': 'approved',
        'APPROVED': 'approved',
        'Đã thanh toán': 'paid',
        'Đã chi trả': 'paid',
        'PAID': 'paid'
      }
      
      // Tìm status key: ưu tiên exact match
      let statusKey = statusMap[rawStatus]
      
      // Nếu không tìm thấy exact match, thử case-insensitive
      if (!statusKey) {
        const foundKey = Object.keys(statusMap).find(key => 
          key.toLowerCase() === rawStatus.toLowerCase()
        )
        statusKey = foundKey ? statusMap[foundKey] : 'pending_manager_approval'
      }
      
      return {
        id: item.employeeId,
        name: item.employeeName || 'Không rõ',
        phone: item.phone || '',
        baseSalary: item.baseSalary || 0,
        allowance: item.allowance || 0,
        deduction: item.deduction || 0,
        netSalary: item.netSalary || 0,
        status: statusKey,
        employeeId: item.employeeId,
        workingDays: item.workingDays || 0,
        advanceSalary: item.advanceSalary || 0
      }
    })
  }

  const fetchPayrollData = async () => {
    if (!selectedMonth) return
    
    setLoading(true)
    try {
      const monthYear = selectedMonth.split('-')
      const month = parseInt(monthYear[1], 10)
      const year = parseInt(monthYear[0], 10)

      console.log('=== Checking Payroll Exists ===')
      console.log('Month:', month)
      console.log('Year:', year)
      console.log('===============================')

      // Bước 1: Kiểm tra payroll có tồn tại không
      const { data: checkData, error: checkError } = await payrollAPI.checkExists(month, year)

      if (checkError) {
        console.error('=== Check Exists API Error ===')
        console.error('Error:', checkError)
        message.error(checkError?.message || checkError || 'Không thể kiểm tra payroll')
        setLoading(false)
        return
      }

      const isExists = checkData?.result?.isExists === true
      console.log('Payroll exists:', isExists)

      let payrollResponse

      if (isExists) {
        // Nếu tồn tại, gọi API getList
        console.log('=== Fetching Payroll List (exists) ===')
        const { data, error } = await payrollAPI.getList(month, year)

        if (error) {
          console.error('=== Payroll List API Error ===')
          console.error('Error:', error)
          message.error(error?.message || error || 'Không thể tải danh sách lương')
          setLoading(false)
          return
        }

        payrollResponse = data
      } else {
        // Nếu không tồn tại, gọi API getPreview
        console.log('=== Fetching Payroll Preview (not exists) ===')
        const { data, error } = await payrollAPI.getPreview(month, year)

        if (error) {
          console.error('=== Payroll Preview API Error ===')
          console.error('Error:', error)
          message.error(error?.message || error || 'Không thể tải danh sách lương')
          setLoading(false)
          return
        }

        payrollResponse = data
      }

      console.log('API Response:', payrollResponse)

      // Xử lý response từ cả 2 API
      let items = []
      
      if (isExists) {
        // API getList trả về result là array trực tiếp
        if (payrollResponse && payrollResponse.result && Array.isArray(payrollResponse.result)) {
          items = payrollResponse.result
        }
      } else {
        // API getPreview trả về result.items hoặc result.content
        const result = payrollResponse?.result || {}
        items = result.items || result.content || (Array.isArray(result) ? result : [])
      }

      if (items.length > 0) {
        const transformedData = transformPayrollData(items)
        console.log('Transformed data:', transformedData.length, 'employees')
        setPayrollData(transformedData)
        setTotal(items.length || 0)
      } else {
        console.warn('No items in API response')
        setPayrollData([])
        setTotal(0)
      }
    } catch (err) {
      console.error('Failed to fetch payroll:', err)
      message.error('Đã xảy ra lỗi khi tải dữ liệu')
      setPayrollData([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitPayroll = async () => {
    if (!selectedMonth) {
      message.warning('Vui lòng chọn tháng')
      return
    }

    const accountantId = getUserIdFromToken()
    if (!accountantId) {
      message.error('Không thể lấy thông tin kế toán')
      return
    }

    const monthYear = selectedMonth.split('-')
    const month = parseInt(monthYear[1], 10)
    const year = parseInt(monthYear[0], 10)

    setSubmitting(true)
    try {
      const { data: response, error } = await payrollAPI.submit(
        month,
        year,
        parseInt(accountantId, 10)
      )

      if (error) {
        message.error(error || 'Không thể nộp bảng lương')
        return
      }

      message.success('Nộp bảng lương thành công!')
      // Refresh dữ liệu sau khi nộp
      fetchPayrollData()
    } catch (err) {
      console.error('Failed to submit payroll:', err)
      message.error('Đã xảy ra lỗi khi nộp bảng lương')
    } finally {
      setSubmitting(false)
    }
  }

  const filtered = useMemo(() => {
    return payrollData
      .filter((item) => {
        const matchesQuery =
          !query ||
          item.name.toLowerCase().includes(query.toLowerCase()) ||
          item.phone?.includes(query)
        const matchesStatus =
          filterStatuses.length === 0 || filterStatuses.includes(item.status)
        return matchesQuery && matchesStatus
      })
      .map((item, index) => ({ ...item, key: item.id, index }))
  }, [payrollData, query, filterStatuses])

  const handleFilterApply = () => {
    setFilterStatuses(filterForm.statuses || [])
    if (filterForm.month) {
      setSelectedMonth(filterForm.month)
    }
    setFilterModalVisible(false)
  }

  const handleFilterReset = () => {
    const defaultMonth = dayjs().format('YYYY-MM')
    setFilterForm({
      statuses: [],
      month: defaultMonth
    })
    setFilterStatuses([])
    setSelectedMonth(defaultMonth)
  }

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
      title: 'Lương cơ bản (vnd)',
      dataIndex: 'baseSalary',
      key: 'baseSalary',
      width: 150,
      render: (value) => value.toLocaleString('vi-VN')
    },
    {
      title: 'Phụ cấp (vnd)',
      dataIndex: 'allowance',
      key: 'allowance',
      width: 120,
      render: (value) => value.toLocaleString('vi-VN')
    },
    {
      title: 'Khấu trừ (vnd)',
      dataIndex: 'deduction',
      key: 'deduction',
      width: 120,
      render: (value) => value.toLocaleString('vi-VN')
    },
    {
      title: 'Lương ròng (vnd)',
      dataIndex: 'netSalary',
      key: 'netSalary',
      width: 150,
      render: (value) => {
        const rounded = Math.round(value || 0)
        return (
          <span style={{ fontWeight: 600 }}>
            {rounded.toLocaleString('vi-VN')}
          </span>
        )
      }
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (value) => {
        const config = STATUS_CONFIG[value] || STATUS_CONFIG.pending_manager_approval
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
      render: (_, record) => {
        const monthYear = selectedMonth.split('-')
        const month = parseInt(monthYear[1], 10)
        const year = parseInt(monthYear[0], 10)
        
        return (
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => {
              navigate(`/accountance/hr/payroll/${record.employeeId}/${month}/${year}`)
            }}
            style={{ padding: 0 }}
          />
        )
      }
    }
  ]

  return (
      <div className="payroll-page">
        <div className="payroll-header">
          <h1>Lương nhân viên</h1>
        </div>

        <div
          className="payroll-filters"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap'
          }}
        >
          <div style={{ minWidth: 260, flex: 1 }}>
            <Input
              prefix={<SearchOutlined />}
              placeholder="Tìm kiếm"
              allowClear
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="payroll-search"
            />
          </div>

          <div
            className="payroll-actions"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12
            }}
          >
            <Button
              icon={<FilterOutlined />}
              className="sort-btn"
              onClick={() => {
                setFilterForm((prev) => ({
                  ...prev,
                  month: selectedMonth
                }))
                setFilterModalVisible(true)
              }}
            >
              Bộ lọc
            </Button>
          </div>
        </div>

        <div className="payroll-table-card">
          <Table
            className="payroll-table"
            columns={columns}
            dataSource={filtered}
            loading={loading}
            pagination={{
              current: page,
              pageSize,
              total: total,
              showSizeChanger: true,
              showTotal: (total) => `Tổng ${total} nhân viên`,
              pageSizeOptions: ['10', '20', '50', '100'],
              onChange: (current, size) => {
                setPage(current)
                setPageSize(size)
              }
            }}
            components={goldTableHeader}
          />
        </div>

        <div className="payroll-footer">
          <div className="payroll-total">
            <span className="payroll-total-label">Tổng:</span>
            <span className="payroll-total-amount">
              {filtered
                .reduce((sum, item) => sum + Math.round(item.netSalary || 0), 0)
                .toLocaleString('vi-VN')}{' '}
              vnđ
            </span>
          </div>
          <Button
            type="primary"
            size="large"
            className="payroll-submit-btn"
            onClick={handleSubmitPayroll}
            loading={submitting}
          >
            Nộp
          </Button>
        </div>

        <Modal
          title="Bộ lọc"
          open={filterModalVisible}
          onCancel={() => setFilterModalVisible(false)}
          footer={null}
          width={480}
        >
          <div style={{ padding: '8px 0' }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>Trạng thái</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { key: 'pending', label: 'Đang làm lương' },
                  { key: 'pending_manager_approval', label: 'Chờ quản lý duyệt' },
                  { key: 'approved', label: 'Duyệt' },
                  { key: 'paid', label: 'Đã thanh toán' }
                ].map((opt) => (
                  <Checkbox
                    key={opt.key}
                    checked={filterForm.statuses.includes(opt.key)}
                    onChange={(e) => {
                      setFilterForm((prev) => ({
                        ...prev,
                        statuses: e.target.checked
                          ? [...prev.statuses, opt.key]
                          : prev.statuses.filter((s) => s !== opt.key)
                      }))
                    }}
                  >
                    {opt.label}
                  </Checkbox>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>Tháng</div>
              <div className="payroll-month-picker-wrapper" style={{ width: '100%' }}>
                <select
                  ref={monthInputRef}
                  value={filterForm.month}
                  onChange={(e) => {
                    e.stopPropagation()
                    const val = e.target.value
                    setFilterForm((prev) => ({ ...prev, month: val }))
                  }}
                  className="payroll-month-select"
                  style={{ width: '100%' }}
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
                <CalendarOutlined className="payroll-month-icon" />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingTop: 12 }}>
              <Button onClick={handleFilterReset} style={{ height: 40, borderRadius: 6, minWidth: 90 }}>
                Đặt lại
              </Button>
              <Button
                type="primary"
                onClick={handleFilterApply}
                style={{ height: 40, borderRadius: 6, minWidth: 110 }}
              >
                Áp dụng
              </Button>
            </div>
          </div>
        </Modal>
      </div>
  )
}

export default function AccountancePayroll({ Layout = AccountanceLayout }) {
  const Wrapper = Layout || (({ children }) => <>{children}</>)
  return (
    <Wrapper>
      <AccountancePayrollContent />
    </Wrapper>
  )
}

