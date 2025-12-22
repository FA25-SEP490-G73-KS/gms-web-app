import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Table, Input, Button, message, Dropdown, Modal, DatePicker } from 'antd'
import { SearchOutlined, ArrowLeftOutlined, MoreOutlined } from '@ant-design/icons'
import AccountanceLayout from '../../layouts/AccountanceLayout'
import { goldTableHeader } from '../../utils/tableComponents'
import { debtsAPI } from '../../services/api'
import '../../styles/pages/accountance/debts.css'
import dayjs from 'dayjs'

// Mock data for single customer debt details
const MOCK_CUSTOMER_DEBTS = [
  {
    id: 1,
    code: 'Ticket-2025-000001',
    createdAt: '2024-11-15T10:00:00',
    total: 10000000,
    remain: 7000000,
    dueDate: '2024-11-30T00:00:00',
    status: 'warning'
  },
  {
    id: 2,
    code: 'Ticket-2025-000001',
    createdAt: '2024-11-20T14:30:00',
    total: 10000000,
    remain: 7000000,
    dueDate: '2024-11-29T00:00:00',
    status: 'warning'
  },
  {
    id: 3,
    code: 'Ticket-2025-000001',
    createdAt: '2024-11-25T09:15:00',
    total: 10000000,
    remain: 7000000,
    dueDate: '2024-12-01T00:00:00',
    status: 'warning'
  },
  {
    id: 4,
    code: 'Ticket-2025-000001',
    createdAt: '2024-10-10T11:20:00',
    total: 10000000,
    remain: 0,
    dueDate: '2024-11-15T00:00:00',
    status: 'done'
  }
]

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

export function AccountanceDebtDetailContent() {
  const location = useLocation()
  const navigate = useNavigate()
  const customerData = location.state?.customer
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [debtDetails, setDebtDetails] = useState([])
  const [customerInfo, setCustomerInfo] = useState(null)
  const [pagination, setPagination] = useState({
    page: 0,
    size: 50,
    total: 0
  })
  
  // State for update due date modal
  const [isUpdateDueDateModalVisible, setIsUpdateDueDateModalVisible] = useState(false)
  const [selectedDebt, setSelectedDebt] = useState(null)
  const [newDueDate, setNewDueDate] = useState(null)
  const [updatingDueDate, setUpdatingDueDate] = useState(false)

  // Fetch debt details by customer ID
  const fetchDebtDetails = useCallback(
    async (page = 0, size = 10) => {
      console.log('📋 Customer Data:', customerData)
      console.log('🔑 Customer ID:', customerData?.id)
      
      if (!customerData?.id) {
        console.warn('⚠️ No customer ID available, customerData:', customerData)
        // Fallback: use mock data if no ID
        const normalizedMockData = MOCK_CUSTOMER_DEBTS.map((item) => ({
          key: item.id,
          id: item.id,
          code: item.code,
          createdAt: formatDate(item.createdAt),
          total: safeNumber(item.total),
          remain: safeNumber(item.remain),
          dueDate: formatDate(item.dueDate),
          status: item.status
        }))
        setDebtDetails(normalizedMockData)
        setPagination({ page: 0, size, total: normalizedMockData.length })
        return
      }

      setLoading(true)
      try {
        console.log('🔍 Fetching debts for customer ID:', customerData.id)
        
        const { data, error } = await debtsAPI.getByCustomerId({
          customerId: customerData.id,
          page,
          size,
          sort: 'createdAt,desc'
        })

        console.log('📦 API Response:', { data, error })

        if (error) {
          console.error('❌ API Error:', error)
          throw new Error(error)
        }

        const payload = data?.result ?? data?.data ?? data
        console.log('📊 Payload:', payload)
        
        // Extract customer info from response
        if (payload) {
          setCustomerInfo({
            name: payload.customerName || customerData.customer || 'Khách hàng',
            phone: payload.phone || customerData.phone || '—',
            licensePlate: payload.licensePlate || customerData.licensePlate || '—',
            address: payload.address || 'Hà nội',
            totalRemainingAmount: safeNumber(payload.totalRemainingAmount || customerData.remainingAmount || 0)
          })
        }

        const list = payload?.debts || []

        // If API returns empty data, use mock data
        if (!list || list.length === 0) {
          console.log('API returned empty data, using mock data')
          const normalizedMockData = MOCK_CUSTOMER_DEBTS.map((item) => ({
            key: item.id,
            id: item.id,
            code: item.code,
            createdAt: formatDate(item.createdAt),
            total: safeNumber(item.total),
            remain: safeNumber(item.remain),
            dueDate: formatDate(item.dueDate),
            status: item.status
          }))

          setDebtDetails(normalizedMockData)
          setPagination({
            page: 0,
            size,
            total: normalizedMockData.length
          })
        } else {
          const normalizedList = list.map((item) => {
            const totalAmount = safeNumber(item.totalAmount || item.total || item.amount)
            const paidAmount = safeNumber(item.paidAmount || 0)
            const remainingAmount = totalAmount - paidAmount
            
            return {
              key: item.id || item.debtId,
              id: item.id || item.debtId,
              serviceTicketId: item.serviceTicketId, // Lưu serviceTicketId để dùng khi navigate
              code: item.serviceTicketCode || item.code || item.ticketCode || item.referenceCode || '—',
              createdAt: formatDate(item.createdAt || item.createdDate),
              total: totalAmount,
              paid: paidAmount,
              remain: remainingAmount,
              dueDate: formatDate(item.dueDate || item.paymentDueDate),
              status: item.status === 'OUTSTANDING' ? 'warning' : (remainingAmount > 0 ? 'warning' : 'done')
            }
          })

          setDebtDetails(normalizedList)
          setPagination({
            page,
            size,
            total: normalizedList.length
          })
        }
      } catch (err) {
        console.warn('API failed, using mock data:', err.message)
        
        const normalizedMockData = MOCK_CUSTOMER_DEBTS.map((item) => ({
          key: item.id,
          id: item.id,
          code: item.code,
          createdAt: formatDate(item.createdAt),
          total: safeNumber(item.total),
          remain: safeNumber(item.remain),
          dueDate: formatDate(item.dueDate),
          status: item.status
        }))

        setDebtDetails(normalizedMockData)
        setPagination({
          page: 0,
          size,
          total: normalizedMockData.length
        })
      } finally {
        setLoading(false)
      }
    },
    [customerData?.id, customerData?.customer, customerData?.phone, customerData?.licensePlate, customerData?.remainingAmount]
  )

  useEffect(() => {
    if (customerData?.id) {
      fetchDebtDetails(0, pagination.size)
    }
  }, [fetchDebtDetails, customerData?.id])

  // Handle update due date
  const handleUpdateDueDate = async () => {
    if (!selectedDebt || !newDueDate) {
      message.warning('Vui lòng chọn ngày hẹn trả')
      return
    }

    setUpdatingDueDate(true)
    try {
      const { error } = await debtsAPI.updateDueDate(
        selectedDebt.id,
        newDueDate.format('YYYY-MM-DD')
      )
      
      if (error) {
        throw new Error(error)
      }

      message.success('Cập nhật ngày hẹn trả thành công')
      setIsUpdateDueDateModalVisible(false)
      setSelectedDebt(null)
      setNewDueDate(null)
      
      // Refresh data
      await fetchDebtDetails(pagination.page, pagination.size)
    } catch (err) {
      console.error('Update due date failed:', err)
      message.error(err.message || 'Cập nhật ngày hẹn trả thất bại')
    } finally {
      setUpdatingDueDate(false)
    }
  }

  // Filter debt details based on search
  const filteredDetails = useMemo(() => {
    if (!searchQuery.trim()) return debtDetails

    const searchLower = searchQuery.toLowerCase()
    return debtDetails.filter(
      (item) =>
        item.code.toLowerCase().includes(searchLower) ||
        item.createdAt.toLowerCase().includes(searchLower) ||
        item.dueDate.toLowerCase().includes(searchLower)
    )
  }, [debtDetails, searchQuery])

  // Calculate total remaining amount from filtered details
  const totalRemaining = useMemo(() => {
    // Use totalRemainingAmount from API if available
    if (customerInfo?.totalRemainingAmount !== undefined) {
      return customerInfo.totalRemainingAmount
    }
    // Otherwise calculate from filtered details
    return filteredDetails.reduce((sum, item) => sum + item.remain, 0)
  }, [filteredDetails, customerInfo?.totalRemainingAmount])

  if (!customerData) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <p>Không tìm thấy thông tin khách hàng</p>
        <Button type="primary" onClick={() => navigate('/accountance/debts')}>
          Quay lại
        </Button>
      </div>
    )
  }

  // Use customerInfo from API if available, otherwise use passed customerData
  const displayInfo = customerInfo || {
    name: customerData.customer || 'Khách hàng',
    phone: customerData.phone || '—',
    licensePlate: customerData.licensePlate || '—',
    address: 'Hà nội'
  }

  const columns = [
    {
      title: 'Mã phiếu DV',
      dataIndex: 'code',
      key: 'code',
      width: 140
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      align: 'center'
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'total',
      key: 'total',
      width: 130,
      align: 'center',
      render: (value) => `${value.toLocaleString('vi-VN')} đ`
    },
    {
      title: 'Đã thanh toán',
      dataIndex: 'paid',
      key: 'paid',
      width: 140,
      align: 'center',
      render: (value) => `${value.toLocaleString('vi-VN')} đ`
    },
    {
      title: 'Còn lại',
      dataIndex: 'remain',
      key: 'remain',
      width: 140,
      align: 'center',
      render: (value) => (
        <span style={{ fontWeight: 600 }}>
          {value.toLocaleString('vi-VN')} đ
        </span>
      )
    },
    {
      title: 'Ngày hẹn trả',
      dataIndex: 'dueDate',
      key: 'dueDate',
      width: 130,
      align: 'center'
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      align: 'center',
      render: (value) => {
        const isDone = value === 'done'
        return (
          <span
            style={{
              background: isDone ? '#dcfce7' : '#fff7ed',
              color: isDone ? '#15803d' : '#c2410c',
              borderRadius: '999px',
              padding: '4px 12px',
              fontWeight: 600,
              display: 'inline-block'
            }}
          >
            {isDone ? 'Hoàn thành' : 'Chờ'}
          </span>
        )
      }
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 80,
      align: 'center',
      render: (_, record) => {
        const menuItems = [
          {
            key: 'view',
            label: 'Xem chi tiết',
            onClick: () => {
              const serviceTicketId = record.serviceTicketId || record.id
              navigate(`/accountance/debts/ticket/${serviceTicketId}`, {
                state: { 
                  ticketId: serviceTicketId,
                  customerId: customerData?.id,
                  customer: {
                    name: customerInfo?.name || customerData?.customer,
                    phone: customerInfo?.phone || customerData?.phone,
                    licensePlate: customerInfo?.licensePlate || customerData?.licensePlate,
                    customerId: customerData?.id
                  }
                }
              })
            }
          },
          {
            key: 'updateDueDate',
            label: 'Cập nhật ngày hẹn trả',
            onClick: () => {
              setSelectedDebt(record)
              setNewDueDate(record.dueDate && record.dueDate !== '—' ? dayjs(record.dueDate, 'DD/MM/YYYY') : null)
              setIsUpdateDueDateModalVisible(true)
            }
          }
        ]

        return (
          <Dropdown
            menu={{ items: menuItems }}
            trigger={['click']}
            placement="bottomRight"
          >
            <Button
              type="text"
              icon={<MoreOutlined style={{ fontSize: '18px' }} />}
            />
          </Dropdown>
        )
      }
    }
  ]

  return (
    <div className="debts-page">
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ margin: 0 }}>Khách hàng</h1>
      </div>

      {/* Customer Info Card */}
      <div
        style={{
          background: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '24px',
          marginBottom: '24px'
        }}
      >
        <div style={{ marginBottom: '12px' }}>
          <span style={{ fontWeight: 600, color: '#374151' }}>Tên khách hàng: </span>
          <span style={{ color: '#111827' }}>{displayInfo.name}</span>
        </div>
        <div style={{ marginBottom: '12px' }}>
          <span style={{ fontWeight: 600, color: '#374151' }}>Số điện thoại: </span>
          <span style={{ color: '#111827' }}>{displayInfo.phone}</span>
        </div>
        <div style={{ marginBottom: '12px' }}>
          <span style={{ fontWeight: 600, color: '#374151' }}>Biển số xe: </span>
          <span style={{ color: '#111827' }}>{displayInfo.licensePlate}</span>
        </div>
        <div>
          <span style={{ fontWeight: 600, color: '#374151' }}>Địa chỉ: </span>
          <span style={{ color: '#111827' }}>{displayInfo.address}</span>
        </div>
      </div>

      {/* Debt List Section */}
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>Danh sách công nợ</h3>
        <Input
          prefix={<SearchOutlined />}
          placeholder="Tìm kiếm"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ width: 300 }}
        />
      </div>

      {/* Debt Table */}
      <div className="debts-table-card">
        <Table
          dataSource={filteredDetails}
          columns={columns}
          loading={loading}
          pagination={{
            pageSize: pagination.size,
            current: pagination.page + 1,
            total: pagination.total,
            showTotal: (total) => `Tổng ${total} bản ghi`,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100'],
            onChange: (page, size) => {
              fetchDebtDetails(page - 1, size)
            }
          }}
          components={goldTableHeader}
          locale={{
            emptyText: 'Không có công nợ'
          }}
        />
      </div>

      {/* Total Summary */}
      <div
        style={{
          marginTop: '24px',
          padding: '20px 24px',
          background: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: '12px'
        }}
      >
        <span style={{ fontSize: '16px', fontWeight: 600, color: '#111827' }}>
          Tổng nợ còn lại:
        </span>
        <span style={{ fontSize: '24px', fontWeight: 700, color: '#111827' }}>
          {totalRemaining.toLocaleString('vi-VN')} đ
        </span>
      </div>

      {/* Update Due Date Modal */}
      <Modal
        title={
          <div style={{ 
            background: '#CBB081', 
            color: '#fff', 
            padding: '12px 24px',
            margin: '-20px -24px 20px',
            textAlign: 'center',
            fontSize: '16px',
            fontWeight: 600
          }}>
            Cập nhật phiếu công nợ
          </div>
        }
        open={isUpdateDueDateModalVisible}
        onCancel={() => {
          setIsUpdateDueDateModalVisible(false)
          setSelectedDebt(null)
          setNewDueDate(null)
        }}
        footer={null}
        width={400}
        closable={true}
        closeIcon={<i className="bi bi-x" style={{ fontSize: '24px', color: '#666' }} />}
      >
        <div style={{ padding: '0 8px' }}>
          {/* Customer Name */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px', fontWeight: 500 }}>
              Tên khách hàng: <span style={{ color: '#111', fontWeight: 600 }}>{displayInfo.name}</span>
            </div>
          </div>

          {/* Service Ticket Code */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px', fontWeight: 500 }}>
              Mã phiếu: <span style={{ color: '#111', fontWeight: 600 }}>{selectedDebt?.code || '—'}</span>
            </div>
          </div>

          {/* Phone */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px', fontWeight: 500 }}>
              Số điện thoại: <span style={{ color: '#111', fontWeight: 600 }}>{displayInfo.phone}</span>
            </div>
          </div>

          {/* Remaining Amount */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px', fontWeight: 500 }}>
              Còn lại:
            </div>
            <div style={{ 
              fontSize: '20px', 
              fontWeight: 700, 
              color: '#111',
              textAlign: 'right'
            }}>
              {selectedDebt?.remain?.toLocaleString('vi-VN') || '0'}
            </div>
          </div>

          {/* Due Date Picker */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px', fontWeight: 500 }}>
              Ngày hẹn trả <span style={{ color: 'red' }}>*</span>:
            </div>
            <DatePicker
              value={newDueDate}
              onChange={(date) => setNewDueDate(date)}
              format="DD/MM/YYYY"
              placeholder="Chọn ngày hẹn trả"
              style={{ width: '100%' }}
              disabledDate={(current) => {
                // Disable dates before today and today (not allowed to select past or current date)
                return current && current <= dayjs().startOf('day')
              }}
            />
          </div>

          {/* Submit Button */}
          <Button
            type="primary"
            block
            onClick={handleUpdateDueDate}
            loading={updatingDueDate}
            style={{
              background: '#22c55e',
              borderColor: '#22c55e',
              height: '40px',
              fontSize: '15px',
              fontWeight: 600,
              borderRadius: '6px'
            }}
          >
            Lưu
          </Button>
        </div>
      </Modal>
    </div>
  )
}

export default function AccountanceDebtDetail({ Layout = AccountanceLayout }) {
  const Wrapper = Layout || (({ children }) => <>{children}</>)
  return (
    <Wrapper>
      <AccountanceDebtDetailContent />
    </Wrapper>
  )
}
