import React, { useState, useEffect, useCallback, useRef, memo } from 'react'
import { Table, Input, Button, Tag, DatePicker, message, Modal, Tabs, Spin, Row, Col, Form, Input as AntInput, Card } from 'antd'
import { SearchOutlined, CloseOutlined } from '@ant-design/icons'
import ManagerLayout from '../../../layouts/ManagerLayout'
import { goldTableHeader } from '../../../utils/tableComponents'
import { payrollAPI } from '../../../services/api'
import { getUserIdFromToken } from '../../../utils/helpers'
import dayjs from 'dayjs'
import '../../../styles/pages/accountance/payroll.css'

const { TextArea } = AntInput

const statusFilters = [
  { key: 'all', label: 'Tất cả' },
  { key: 'paid', label: 'Đã chi trả' },
  { key: 'pending', label: 'Đang xử lý' }
]

const STATUS_CONFIG = {
  paid: { color: '#3b82f6', bg: '#eef4ff', text: 'Đã chi trả' },
  pending: { color: '#c2410c', bg: '#fff4e6', text: 'Chờ quản lý duyệt' },
  approved: { color: '#5b8def', bg: '#eef4ff', text: 'Đã duyệt' }
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
  const [summaryData, setSummaryData] = useState(null)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const prevDateRef = useRef(null)
  
  // Modal detail states
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [payrollDetail, setPayrollDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [approvingAll, setApprovingAll] = useState(false)

  // Helper function to transform payroll data
  const transformPayrollData = (items) => {
    return items.map((item) => {
      // Map status từ API (enum hoặc text tiếng Việt) sang key trong STATUS_CONFIG
      const rawStatus = String(item.status || '').trim()
      
      // Object mapping rõ ràng: status từ API -> key trong STATUS_CONFIG
      const statusMap = {
        'Chờ quản lý duyệt': 'pending',
        'PENDING_MANAGER_APPROVAL': 'pending',
        'Đã duyệt': 'approved',
        'Duyệt': 'approved',
        'APPROVED': 'approved',
        'Đã thanh toán': 'paid',
        'Đã chi trả': 'paid',
        'PAID': 'paid',
        'Đang làm lương': 'pending'
      }
      
      // Tìm status key: ưu tiên exact match
      let statusKey = statusMap[rawStatus]
      
      // Nếu không tìm thấy exact match, thử case-insensitive
      if (!statusKey) {
        const foundKey = Object.keys(statusMap).find(key => 
          key.toLowerCase() === rawStatus.toLowerCase()
        )
        statusKey = foundKey ? statusMap[foundKey] : 'pending'
      }

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
        status: statusKey
      }
    })
  }

  // Memoize fetchPayrollData to prevent re-creation on every render
  const fetchPayrollData = useCallback(async () => {
    try {
      setLoading(true)
      const month = selectedDate.month() + 1 // dayjs month is 0-based, API expects 1-based
      const year = selectedDate.year()

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
        setPayrollData([])
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
          setPayrollData([])
          return
        }

        payrollResponse = data
      } else {
        // Nếu không tồn tại, gọi API getPreview (API hiện tại)
        console.log('=== Fetching Payroll Preview (not exists) ===')
        const { data, error } = await payrollAPI.getPreview(month, year)

        if (error) {
          console.error('=== Payroll Preview API Error ===')
          console.error('Error:', error)
          
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
        // API getPreview trả về result.items
        if (payrollResponse && payrollResponse.result && payrollResponse.result.items) {
          items = payrollResponse.result.items
        }
      }

      if (items.length > 0) {
        const transformedData = transformPayrollData(items)
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
      
      const errorMessage = err?.message || err?.response?.data?.message || ''
      message.error(errorMessage || 'Đã xảy ra lỗi khi tải dữ liệu lương')
      setPayrollData([])
    } finally {
      setLoading(false)
    }
  }, [selectedDate])

  // Fetch payroll summary
  const fetchPayrollSummary = useCallback(async () => {
    try {
      setSummaryLoading(true)
      const month = selectedDate.month() + 1
      const year = selectedDate.year()

      const { data, error } = await payrollAPI.getSummary(month, year)

      if (error) {
        message.error('Không thể tải tổng quỹ lương')
        setSummaryData(null)
        return
      }

      setSummaryData(data?.result || null)
    } catch (err) {
      console.error('Failed to fetch payroll summary:', err)
      message.error('Đã xảy ra lỗi khi tải tổng quỹ lương')
      setSummaryData(null)
    } finally {
      setSummaryLoading(false)
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
      fetchPayrollSummary()
    }
  }, [selectedDate, fetchPayrollData, fetchPayrollSummary])

  // Memoize date change handler to prevent DatePicker re-render
  const handleDateChange = useCallback((date) => {
    setSelectedDate(date || dayjs())
  }, [])

  // Handle open detail modal
  const handleOpenDetail = async (record) => {
    setSelectedEmployee(record)
    setShowDetailModal(true)
    setActiveTab('overview')
    setDetailLoading(true)
    
    try {
      const month = selectedDate.month() + 1
      const year = selectedDate.year()
      
      const { data: response, error } = await payrollAPI.getDetail(
        record.employeeId || record.id,
        month,
        year
      )
      
      if (error) {
        message.error('Không thể tải chi tiết lương')
        setPayrollDetail(null)
        return
      }
      
      setPayrollDetail(response?.result || null)
    } catch (err) {
      console.error('Failed to fetch payroll detail:', err)
      message.error('Đã xảy ra lỗi khi tải dữ liệu')
      setPayrollDetail(null)
    } finally {
      setDetailLoading(false)
    }
  }

  // Handle approve payroll
  const handleApprove = async () => {
    if (!selectedEmployee) return

    const managerId = getUserIdFromToken()
    if (!managerId) {
      message.error('Không thể lấy thông tin quản lý')
      return
    }

    // Tạm dùng employeeId/id làm ID payroll theo backend
    const payrollId =
      selectedEmployee.payrollId || selectedEmployee.employeeId || selectedEmployee.id
    
    setProcessing(true)
    try {
      const { data: response, error } = await payrollAPI.approve(
        payrollId,
        parseInt(managerId, 10)
      )
      
      if (error) {
        message.error(error || 'Không thể duyệt lương')
        return
      }
      
      message.success('Duyệt lương thành công!')
      setShowDetailModal(false)
      setSelectedEmployee(null)
      setPayrollDetail(null)
      fetchPayrollData() // Refresh list
      fetchPayrollSummary() // Refresh summary
    } catch (err) {
      console.error('Failed to approve payroll:', err)
      message.error('Đã xảy ra lỗi khi duyệt lương')
    } finally {
      setProcessing(false)
    }
  }

  // Handle reject payroll
  const handleReject = async () => {
    if (!selectedEmployee || !rejectReason.trim()) {
      message.warning('Vui lòng nhập lý do từ chối')
      return
    }

    const managerId = getUserIdFromToken()
    if (!managerId) {
      message.error('Không thể lấy thông tin quản lý')
      return
    }

    // Tạm dùng employeeId/id làm ID payroll theo backend
    const payrollId =
      selectedEmployee.payrollId || selectedEmployee.employeeId || selectedEmployee.id
    
    setProcessing(true)
    try {
      const { data: response, error } = await payrollAPI.reject(
        payrollId,
        parseInt(managerId, 10),
        rejectReason.trim()
      )
      
      if (error) {
        message.error(error || 'Không thể từ chối lương')
        return
      }
      
      message.success('Từ chối lương thành công!')
      setShowDetailModal(false)
      setShowRejectModal(false)
      setSelectedEmployee(null)
      setPayrollDetail(null)
      setRejectReason('')
      fetchPayrollData() // Refresh list
      fetchPayrollSummary() // Refresh summary
    } catch (err) {
      console.error('Failed to reject payroll:', err)
      message.error('Đã xảy ra lỗi khi từ chối lương')
    } finally {
      setProcessing(false)
    }
  }

  // Handle approve all pending payrolls
  const handleApproveAll = async () => {
    const managerId = getUserIdFromToken()
    if (!managerId) {
      message.error('Không thể lấy thông tin quản lý')
      return
    }

    // Filter only pending payrolls
    const pendingPayrolls = payrollData.filter(item => item.status === 'pending')
    
    if (pendingPayrolls.length === 0) {
      message.warning('Không có phiếu lương nào cần duyệt')
      return
    }

    Modal.confirm({
      title: 'Xác nhận duyệt tất cả',
      content: `Bạn có chắc chắn muốn duyệt tất cả ${pendingPayrolls.length} phiếu lương đang chờ?`,
      okText: 'Duyệt tất cả',
      cancelText: 'Hủy',
      okButtonProps: {
        style: { background: '#22c55e', borderColor: '#22c55e' }
      },
      onOk: async () => {
        setApprovingAll(true)
        let successCount = 0
        let failCount = 0

        try {
          // Approve each pending payroll
          for (const payroll of pendingPayrolls) {
            try {
              const payrollId = payroll.payrollId || payroll.employeeId || payroll.id
              const { error } = await payrollAPI.approve(payrollId, parseInt(managerId, 10))
              
              if (error) {
                failCount++
                console.error(`Failed to approve payroll ${payrollId}:`, error)
              } else {
                successCount++
              }
            } catch (err) {
              failCount++
              console.error('Error approving payroll:', err)
            }
          }

          // Show result message
          if (successCount > 0 && failCount === 0) {
            message.success(`Đã duyệt thành công ${successCount} phiếu lương!`)
          } else if (successCount > 0 && failCount > 0) {
            message.warning(`Đã duyệt ${successCount} phiếu lương. ${failCount} phiếu lương thất bại.`)
          } else {
            message.error('Không thể duyệt các phiếu lương')
          }

          // Refresh data
          fetchPayrollData()
          fetchPayrollSummary()
        } catch (err) {
          console.error('Error in approve all:', err)
          message.error('Đã xảy ra lỗi khi duyệt lương')
        } finally {
          setApprovingAll(false)
        }
      }
    })
  }

  const formatCurrency = (amount) => {
    return (amount || 0).toLocaleString('vi-VN')
  }

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
        const config = STATUS_CONFIG[value] || STATUS_CONFIG.pending
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
      render: (_, record) => (
        <i 
          className="bi bi-eye payroll-view-icon" 
          style={{ cursor: 'pointer' }}
          onClick={() => handleOpenDetail(record)}
        />
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
          <div className="payroll-header" style={{ marginBottom: 24 }}>
            <h2>Lương nhân viên</h2>
            <p style={{ color: '#98a2b3', margin: 0 }}>Theo dõi các khoản lương và trạng thái chi trả</p>
          </div>

          <div className="payroll-filters" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <Input
              prefix={<SearchOutlined />}
              placeholder="Tìm kiếm"
              allowClear
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="payroll-search"
              style={{ width: 300 }}
            />
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
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
              <PayrollDatePicker
                value={selectedDate}
                onChange={handleDateChange}
              />
            </div>
          </div>

          {/* Payroll Summary Section */}
          <Spin spinning={summaryLoading}>
            <div style={{ 
              marginTop: 24, 
              padding: 24, 
              background: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: 12
            }}>
              {summaryData ? (
                <>
                  <div style={{ 
                    fontSize: 18, 
                    fontWeight: 700, 
                    color: '#3b82f6',
                    marginBottom: 16 
                  }}>
                    Tổng quỹ lương: {formatCurrency(summaryData.totalPayroll)}
                  </div>
                  <Row gutter={[24, 16]}>
                    <Col span={12}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 600, color: '#111827' }}>Đã duyệt:</span>
                        <span style={{ fontWeight: 600, color: '#111827' }}>
                          {formatCurrency(summaryData.totalApproved)}
                        </span>
                      </div>
                    </Col>
                    <Col span={12}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 600, color: '#111827' }}>Chờ duyệt:</span>
                        <span style={{ fontWeight: 600, color: '#111827' }}>
                          {formatCurrency(summaryData.totalPending)}
                        </span>
                      </div>
                    </Col>
                    <Col span={12}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 600, color: '#111827' }}>Tổng phụ cấp:</span>
                        <span style={{ fontWeight: 600, color: '#111827' }}>
                          {formatCurrency(summaryData.totalAllowance)}
                        </span>
                      </div>
                    </Col>
                    <Col span={12}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 600, color: '#111827' }}>Tổng khấu trừ:</span>
                        <span style={{ fontWeight: 600, color: '#111827' }}>
                          {formatCurrency(summaryData.totalDeduction)}
                        </span>
                      </div>
                    </Col>
                  </Row>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                  Không có dữ liệu tổng quỹ lương
                </div>
              )}
            </div>
          </Spin>

          {/* Employee Table */}
          <div className="payroll-table-card" style={{ borderRadius: 16, marginTop: 24 }}>
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

          {/* Approve All Button - Only show if current month and has pending payrolls */}
          {(() => {
            const now = dayjs()
            const isCurrentMonth = selectedDate.month() === now.month() && selectedDate.year() === now.year()
            const hasPendingPayrolls = payrollData.some(item => item.status === 'pending')
            
            if (isCurrentMonth && hasPendingPayrolls) {
              return (
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'flex-end', 
                  marginTop: 24 
                }}>
                  <Button
                    type="primary"
                    onClick={handleApproveAll}
                    loading={approvingAll}
                    style={{
                      background: '#22c55e',
                      borderColor: '#22c55e',
                      height: '44px',
                      padding: '0 40px',
                      fontSize: '16px',
                      fontWeight: 600,
                      borderRadius: '8px'
                    }}
                  >
                    Duyệt tất cả
                  </Button>
                </div>
              )
            }
            return null
          })()}
        </div>
      </div>

      {/* Detail Modal */}
      <Modal
        open={showDetailModal}
        onCancel={() => {
          setShowDetailModal(false)
          setSelectedEmployee(null)
          setPayrollDetail(null)
          setActiveTab('overview')
        }}
        footer={null}
        width={900}
        title={null}
        closable={false}
        styles={{
          header: { padding: 0, borderBottom: 'none' },
          body: { padding: 0 },
          content: { borderRadius: 0, padding: 0, overflow: 'hidden' }
        }}
      >
        {detailLoading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Spin size="large" />
          </div>
        ) : payrollDetail ? (
          <div>
            {/* Header giống modal Phiếu thanh toán */}
            <div
              style={{
                background: '#CBB081',
                padding: '16px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ flex: 1, textAlign: 'center', marginLeft: 32 }}>
                <span
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#111827',
                  }}
                >
                  Chi tiết Lương tháng {selectedDate.month() + 1}/{selectedDate.year()}
                </span>
              </div>
              <Button
                type="text"
                onClick={() => {
                  setShowDetailModal(false)
                  setSelectedEmployee(null)
                  setPayrollDetail(null)
                  setActiveTab('overview')
                }}
                icon={<CloseOutlined style={{ fontSize: 18, color: '#111827' }} />}
                style={{
                  border: 'none',
                  boxShadow: 'none',
                  background: 'transparent',
                }}
              />
            </div>

            {/* Body */}
            <div style={{ padding: '24px' }}>
              {/* Employee Info Card */}
              <Card style={{ marginBottom: '24px', borderRadius: '8px' }}>
              <Row gutter={16}>
                <Col span={12}>
                  <div style={{ marginBottom: '12px' }}>
                    <strong>Tên nhân viên:</strong> {payrollDetail.employee?.fullName || selectedEmployee?.name || 'N/A'}
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <strong>Số điện thoại:</strong> {payrollDetail.employee?.phone || selectedEmployee?.phone || 'N/A'}
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ marginBottom: '12px' }}>
                    <strong>Địa chỉ:</strong> {payrollDetail.employee?.address || 'N/A'}
                  </div>
                  <div>
                    <strong>Chức vụ:</strong> {payrollDetail.employee?.role || 'N/A'}
                  </div>
                </Col>
              </Row>
              </Card>

            {/* Tabs */}
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              items={[
                {
                  key: 'overview',
                  label: 'Tổng quan',
                  children: (
                    <Row gutter={16}>
                      <Col span={12}>
                        <Card style={{ borderRadius: '8px' }}>
                          <div style={{ marginBottom: '12px' }}>
                            <strong>Lương cơ bản:</strong> {formatCurrency(payrollDetail.overview?.baseSalary || 0)}
                          </div>
                          <div style={{ marginBottom: '12px' }}>
                            <strong>Tổng công:</strong> {payrollDetail.overview?.totalWorkingDays || payrollDetail.workingDays || 0}
                          </div>
                          <div>
                            <strong>Nghỉ phép:</strong> {payrollDetail.overview?.leaveDays || payrollDetail.leaveDays || 0}
                          </div>
                        </Card>
                      </Col>
                      <Col span={12}>
                        <Card style={{ borderRadius: '8px' }}>
                          <div style={{ marginBottom: '12px' }}>
                            <strong>Tổng khấu trừ:</strong> {formatCurrency(payrollDetail.overview?.totalDeduction || 0)}
                          </div>
                          <div style={{ marginBottom: '12px' }}>
                            <strong>Tổng phụ cấp:</strong> {formatCurrency(payrollDetail.overview?.totalAllowance || 0)}
                          </div>
                          <div>
                            <strong>Lương ròng:</strong> {formatCurrency(payrollDetail.overview?.netSalary || 0)}
                          </div>
                        </Card>
                      </Col>
                    </Row>
                  )
                },
                {
                  key: 'allowances',
                  label: 'Phụ cấp',
                  children: (
                    <div>
                      {payrollDetail.allowances && payrollDetail.allowances.length > 0 ? (
                        <Table
                          dataSource={payrollDetail.allowances.map((item, index) => ({ ...item, key: index }))}
                          columns={[
                            { title: 'Loại phụ cấp', dataIndex: 'type', key: 'type' },
                            { title: 'Số tiền', dataIndex: 'amount', key: 'amount', render: (v) => formatCurrency(v) },
                            { title: 'Ngày', dataIndex: 'createdAt', key: 'createdAt', render: (v) => v ? dayjs(v).format('DD/MM/YYYY') : 'N/A' }
                          ]}
                          pagination={false}
                        />
                      ) : (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                          Không có phụ cấp
                        </div>
                      )}
                    </div>
                  )
                },
                {
                  key: 'deductions',
                  label: 'Khấu trừ',
                  children: (
                    <div>
                      {payrollDetail.deductions && payrollDetail.deductions.length > 0 ? (
                        <Table
                          dataSource={payrollDetail.deductions.map((item, index) => ({ ...item, key: index }))}
                          columns={[
                            { title: 'Loại khấu trừ', dataIndex: 'type', key: 'type' },
                            { title: 'Số tiền', dataIndex: 'amount', key: 'amount', render: (v) => formatCurrency(v) },
                            { title: 'Ngày', dataIndex: 'createdAt', key: 'createdAt', render: (v) => v ? dayjs(v).format('DD/MM/YYYY') : 'N/A' }
                          ]}
                          pagination={false}
                        />
                      ) : (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                          Không có khấu trừ
                        </div>
                      )}
                    </div>
                  )
                }
              ]}
            />

            {/* Action Buttons */}
            {(() => {
              const status = payrollDetail?.status
              const isPending =
                status === 'PENDING_MANAGER_APPROVAL' ||
                status === 'Chờ quản lý duyệt' ||
                selectedEmployee?.status === 'pending'
              const disableActions = processing || !isPending

            return (
            <div style={{ 
              marginTop: '24px', 
              display: 'flex', 
              justifyContent: 'flex-end', 
              gap: '12px' 
            }}>
              <Button
                onClick={() => setShowRejectModal(true)}
                style={{
                  background: disableActions ? '#e5e7eb' : '#f97316',
                  borderColor: disableActions ? '#e5e7eb' : '#f97316',
                  color: disableActions ? '#9ca3af' : '#fff',
                  height: '40px',
                  padding: '0 32px',
                  fontWeight: 600,
                  cursor: disableActions ? 'not-allowed' : 'pointer'
                }}
                disabled={disableActions}
              >
                Từ chối
              </Button>
              <Button
                type="primary"
                onClick={handleApprove}
                loading={processing}
                style={{
                  background: disableActions ? '#e5e7eb' : '#22c55e',
                  borderColor: disableActions ? '#e5e7eb' : '#22c55e',
                  height: '40px',
                  padding: '0 32px',
                  fontWeight: 600,
                  color: disableActions ? '#9ca3af' : '#fff',
                  cursor: disableActions ? 'not-allowed' : 'pointer'
                }}
                disabled={disableActions}
              >
                Duyệt
              </Button>
            </div>
            )})()}
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
            Không có dữ liệu
          </div>
        )}
      </Modal>

      {/* Reject Reason Modal */}
      <Modal
        open={showRejectModal}
        onCancel={() => {
          setShowRejectModal(false)
          setRejectReason('')
        }}
        onOk={handleReject}
        okText="Xác nhận"
        cancelText="Hủy"
        title="Lý do từ chối"
        okButtonProps={{
          style: { background: '#f97316', borderColor: '#f97316' },
          loading: processing
        }}
      >
        <Form.Item label="Lý do từ chối" required>
          <TextArea
            rows={4}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Nhập lý do từ chối..."
          />
        </Form.Item>
      </Modal>
    </ManagerLayout>
  )
}

