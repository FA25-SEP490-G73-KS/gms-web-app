import React, { useState, useEffect, useCallback, useRef, memo } from 'react'
import { Table, Input, Button, Tag, DatePicker, message, Modal, Tabs, Spin, Row, Col, Form, Input as AntInput, Card } from 'antd'
import { SearchOutlined, FilterOutlined, CloseOutlined } from '@ant-design/icons'
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
            'PAID': 'paid'
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

          // Debug log để kiểm tra
          console.log('Mapping status (Manager):', { 
            rawStatus, 
            statusKey, 
            itemStatus: item.status 
          })

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
    } catch (err) {
      console.error('Failed to reject payroll:', err)
      message.error('Đã xảy ra lỗi khi từ chối lương')
    } finally {
      setProcessing(false)
    }
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

