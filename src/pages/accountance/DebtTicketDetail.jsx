
import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { Table, Button, message, Input, Space, Spin, Tabs } from 'antd'
import { ArrowLeftOutlined, CloseOutlined } from '@ant-design/icons'
import { usePayOS } from '@payos/payos-checkout'
import AccountanceLayout from '../../layouts/AccountanceLayout'
import { goldTableHeader } from '../../utils/tableComponents'
import { debtsAPI, invoiceAPI } from '../../services/api'
import '../../styles/pages/accountance/debts.css'

// Mock data for debt ticket detail


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

export function AccountanceDebtTicketDetailContent() {
  const location = useLocation()
  const navigate = useNavigate()
  const { ticketId } = useParams()
  const [loading, setLoading] = useState(false)
  const [debtDetail, setDebtDetail] = useState(null)
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState(null) // null, 'CASH' or 'QR'
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [paymentData, setPaymentData] = useState(null)
  const [qrLoading, setQrLoading] = useState(false)
  const [debtId, setDebtId] = useState(null) // Store debtId from API response
  const payOSOpenedRef = useRef(false) // Track if PayOS has been opened

  // PayOS config
  const [payOSConfig, setPayOSConfig] = useState({
    RETURN_URL: `${window.location.origin}/`,
    ELEMENT_ID: 'payos-checkout-container',
    CHECKOUT_URL: null,
    embedded: true,
    onSuccess: async (event) => {
      console.log('Payment successful:', event)
      message.success('Thanh toán thành công!')
      setPaymentData(null)
      setPaymentSuccess(true)
      await fetchDebtDetail()
    },
    onExit: (event) => {
      console.log('User exited payment:', event)
    },
    onCancel: (event) => {
      console.log('Payment canceled:', event)
      message.info('Đã hủy thanh toán')
    }
  })

  const { exit, open } = usePayOS(payOSConfig)

  useEffect(() => {
    if (payOSConfig.CHECKOUT_URL != null && !payOSOpenedRef.current) {
      open()
      payOSOpenedRef.current = true
    }
  }, [payOSConfig])

  // Get customer info from navigation state
  const customerInfo = location.state?.customer || {
    name: 'Nguyễn Văn A',
    licensePlate: 'STK-2025-000001',
    customerId: null
  }

  // Fetch debt ticket detail
  const fetchDebtDetail = useCallback(async () => {
    const serviceTicketId = ticketId || location.state?.ticketId

    if (!serviceTicketId) {
      console.warn('No ticket ID available')
      message.warning('Không tìm thấy mã phiếu')
      return
    }

    setLoading(true)
    try {
      console.log('🔍 Fetching debt detail for ticket ID:', serviceTicketId)
      const { data, error } = await debtsAPI.getDebtDetail(serviceTicketId)

      console.log('📦 API Response:', { data, error })

      if (error) {
        throw new Error(error)
      }

      const payload = data?.result ?? data?.data ?? data
      console.log('📊 Payload:', payload)

      // If API returns no data, use mock data
      if (!payload || Object.keys(payload).length === 0) {
        console.log('API returned empty data, using mock data')
        setDebtDetail(MOCK_DEBT_DETAIL)
      } else {
        // Cấu trúc mới: payload.invoice.serviceTicket
        const invoice = payload.invoice || {}
        const serviceTicket = invoice.serviceTicket || {}
        const priceQuotation = serviceTicket.priceQuotation || {}
        const transactions = payload.transactionResponseDto || payload.transactions || []
        const fetchedDebtId = payload.debtId || 1
        
        // Store debtId in state
        setDebtId(fetchedDebtId)
        
        // Calculate totals from quotation items
        const quotationItems = (priceQuotation.items || []).map((item) => ({
          id: item.priceQuotationItemId || item.id,
          itemName: item.itemName || item.name || '—',
          quantity: safeNumber(item.quantity),
          unit: item.unit || '—',
          unitPrice: safeNumber(item.unitPrice),
          totalPrice: safeNumber(item.totalPrice),
          itemType: item.itemType || '—'
        }))

        // Tổng tiền hàng = tổng totalPrice trong items
        const totalMerchandise = quotationItems.reduce((sum, item) => sum + safeNumber(item.totalPrice), 0)
        
        // Giảm giá = discount trong priceQuotation
        const discount = safeNumber(priceQuotation.discount)
        
        // Tổng cộng = estimateAmount
        const estimateAmount = safeNumber(priceQuotation.estimateAmount)
        
        // Lấy thông tin từ customerDebt
        const customerDebt = payload.customerDebt || {}
        const totalAmount = safeNumber(customerDebt.totalAmount || 0)
        const paidAmount = safeNumber(customerDebt.paidAmount || 0)
        
        // Đã thanh toán = paidAmount từ customerDebt
        const totalPaid = paidAmount
        
        // Còn lại = totalAmount - paidAmount từ customerDebt
        const remainingAmount = totalAmount - paidAmount

        // Normalize API response
        const normalized = {
          serviceTicket: {
            serviceTicketId: serviceTicket.serviceTicketId,
            serviceTicketCode: serviceTicket.serviceTicketCode,
            serviceType: serviceTicket.serviceType || [],
            createdAt: formatDate(serviceTicket.createdAt),
            deliveryAt: formatDate(serviceTicket.deliveryAt),
            status: serviceTicket.status,
            createdBy: serviceTicket.createdBy
          },
          customer: {
            customerId: serviceTicket.customer?.customerId,
            fullName: serviceTicket.customer?.fullName || '—',
            phone: serviceTicket.customer?.phone || '—',
            address: serviceTicket.customer?.address || '—'
          },
          vehicle: {
            licensePlate: serviceTicket.vehicle?.licensePlate || '—',
            vin: serviceTicket.vehicle?.vin || '—',
            year: serviceTicket.vehicle?.year || '',
            brandName: serviceTicket.vehicle?.brandName || '—',
            vehicleModelName: serviceTicket.vehicle?.vehicleModelName || '—'
          },
          quotation: {
            code: priceQuotation.code,
            estimateAmount,
            discount,
            totalAmount: estimateAmount
          },
          quotationItems,
          paymentSummary: {
            totalMerchandise, // Tổng tiền hàng
            discount, // Giảm giá
            estimateAmount, // Tổng cộng
            totalPaid, // Đã thanh toán = estimateAmount - finalAmount
            remainingAmount // Còn lại = finalAmount
          },
          paymentHistory: transactions.map((tx) => ({
            id: tx.transactionId || tx.id,
            date: formatDate(tx.createdAt || tx.date || tx.paymentDate),
            amount: safeNumber(tx.amount || tx.paidAmount),
            method: tx.method || tx.paymentMethod || '—',
            type: tx.type || tx.transactionType || '—'
          }))
        }
        
        console.log('✅ Normalized data:', normalized)
        setDebtDetail(normalized)
      }
    } catch (err) {
      console.warn('API failed, using mock data:', err.message)
      setDebtDetail(MOCK_DEBT_DETAIL)
    } finally {
      setLoading(false)
    }
  }, [ticketId, location.state?.ticketId])

  useEffect(() => {
    fetchDebtDetail()
  }, [fetchDebtDetail])

  // Handle CASH payment (when user switches to CASH tab and clicks "Hoàn tất")
  const handleCashPayment = async () => {
    if (!paymentAmount || Number(paymentAmount) <= 0) {
      message.warning('Vui lòng nhập số tiền thanh toán')
      return
    }

    if (!debtId) {
      message.error('Không tìm thấy thông tin công nợ')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        method: 'CASH',
        price: Number(paymentAmount)
      }

      console.log('=== CASH PAYMENT DEBUG ===')
      console.log('Debt ID:', debtId)
      console.log('Payload:', JSON.stringify(payload, null, 2))

      const { data: response, error } = await debtsAPI.pay(debtId, payload)

      console.log('Payment Response:', response)

      if (error) {
        console.error('Payment Error:', error)
        message.error(error || 'Thanh toán thất bại')
        setSubmitting(false)
        return
      }

      message.success('Thanh toán thành công')
      setPaymentSuccess(true)
      
      // Refresh debt detail
      await fetchDebtDetail()
    } catch (err) {
      console.error('Payment failed:', err)
      message.error(err.message || 'Thanh toán thất bại, vui lòng thử lại')
    } finally {
      setSubmitting(false)
    }
  }

  // Handle initial payment submission (BANK_TRANSFER for QR)
  const handleInitialPayment = async () => {
    if (!paymentAmount || Number(paymentAmount) <= 0) {
      message.warning('Vui lòng nhập số tiền thanh toán')
      return
    }

    if (!debtId) {
      message.error('Không tìm thấy thông tin công nợ')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        method: 'BANK_TRANSFER',
        price: Number(paymentAmount)
      }

      const { data: response, error } = await debtsAPI.pay(debtId, payload)

      if (error) {
        message.error(error || 'Tạo giao dịch thất bại')
        setSubmitting(false)
        return
      }

      const result = response?.result || null
      console.log('Payment response:', result)
      console.log('Payment URL:', result?.paymentUrl)
      
      setPaymentData(result)
      setPaymentMethod('QR')

      // Set PayOS config - giống InvoiceDetailPage
      setPayOSConfig((config) => ({
        ...config,
        CHECKOUT_URL: result?.paymentUrl
      }))
    } catch (err) {
      console.error('Error creating payment:', err)
      message.error('Đã xảy ra lỗi khi tạo giao dịch thanh toán')
    } finally {
      setSubmitting(false)
    }
  }

  if (!debtDetail && !loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <p>Không tìm thấy thông tin phiếu công nợ</p>
        <Button type="primary" onClick={() => navigate(-1)}>
          Quay lại
        </Button>
      </div>
    )
  }

  const quotationColumns = [
    {
      title: 'STT',
      key: 'index',
      width: 80,
      align: 'center',
      render: (_, __, index) => (
        <span style={{ fontWeight: 600 }}>{String(index + 1).padStart(2, '0')}</span>
      )
    },
    {
      title: 'Danh mục',
      dataIndex: 'itemName',
      key: 'itemName',
      width: 200
    },
    {
      title: 'Số lượng',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 120,
      align: 'center'
    },
    {
      title: 'Đơn giá',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      width: 150,
      align: 'center',
      render: (value) => value.toLocaleString('vi-VN')
    },
    {
      title: 'Thành tiền',
      dataIndex: 'totalPrice',
      key: 'totalPrice',
      width: 150,
      align: 'center',
      render: (value) => value.toLocaleString('vi-VN')
    }
  ]

  const paymentHistoryColumns = [
    {
      title: 'Ngày',
      dataIndex: 'date',
      key: 'date',
      width: 150,
      align: 'center'
    },
    {
      title: 'Số tiền',
      dataIndex: 'amount',
      key: 'amount',
      width: 150,
      align: 'center',
      render: (value) => value.toLocaleString('vi-VN')
    },
    {
      title: 'Phương thức',
      dataIndex: 'method',
      key: 'method',
      width: 150
    }
  ]

  return (
    <div className="debts-page">
      {/* Breadcrumb */}
      <div style={{ marginBottom: '24px' }}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(-1)}
          style={{ padding: 0, marginBottom: '16px' }}
        >
          Khách hàng
        </Button>
        <h1 style={{ margin: 0 }}>Phiếu công nợ chi tiết</h1>
      </div>

      {/* Main Content - Two Column Layout when payment form is visible */}
      <div style={{ display: 'flex', gap: '24px' }}>
        {/* Left Column - Quotation Details */}
        <div style={{ flex: showPaymentForm ? '1' : 'auto', width: showPaymentForm ? 'auto' : '100%' }}>
          {/* Quotation Items Section */}
          <div style={{ marginBottom: '24px' }}>
            <h3
              style={{
                fontSize: '16px',
                fontWeight: 600,
                marginBottom: '16px',
                color: '#CBB081'
              }}
            >
              BÁO GIÁ CHI TIẾT
            </h3>
            <div className="debts-table-card">
              <Table
                dataSource={debtDetail?.quotationItems || []}
                columns={quotationColumns}
                loading={loading}
                pagination={false}
                components={goldTableHeader}
                locale={{
                  emptyText: 'Không có dữ liệu'
                }}
              />
            </div>
          </div>

          {/* Payment Summary */}
          {debtDetail?.paymentSummary && (
            <div style={{ marginBottom: '24px' }}>
              <h3
                style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  marginBottom: '16px',
                  color: '#CBB081'
                }}
              >
                Thanh toán
              </h3>
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '20px 24px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ color: '#374151' }}>Tổng tiền hàng</span>
                  <span style={{ fontWeight: 600 }}>
                    {debtDetail.paymentSummary.totalMerchandise.toLocaleString('vi-VN')}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ color: '#374151' }}>Giảm giá</span>
                  <span style={{ fontWeight: 600, color: '#ef4444' }}>
                    -{debtDetail.paymentSummary.discount.toLocaleString('vi-VN')}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ color: '#374151' }}>Tổng cộng</span>
                  <span style={{ fontWeight: 600 }}>
                    {debtDetail.paymentSummary.estimateAmount.toLocaleString('vi-VN')}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <span style={{ color: '#374151' }}>Đã thanh toán</span>
                  <span style={{ fontWeight: 600, color: '#22c55e' }}>
                    {debtDetail.paymentSummary.totalPaid.toLocaleString('vi-VN')}
                  </span>
                </div>
                <div
                  style={{
                    borderTop: '1px solid #e5e7eb',
                    paddingTop: '12px',
                    display: 'flex',
                    justifyContent: 'space-between'
                  }}
                >
                  <span style={{ fontWeight: 600 }}>Còn lại</span>
                  <span style={{ fontWeight: 700, fontSize: '18px', color: '#111827' }}>
                    {debtDetail.paymentSummary.remainingAmount.toLocaleString('vi-VN')}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Payment History */}
          {debtDetail?.paymentHistory && debtDetail.paymentHistory.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <h3
                style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  marginBottom: '16px',
                  color: '#CBB081'
                }}
              >
                Lịch sử thanh toán
              </h3>
              <div className="debts-table-card">
                <Table
                  dataSource={debtDetail.paymentHistory}
                  columns={paymentHistoryColumns}
                  loading={loading}
                  pagination={false}
                  components={goldTableHeader}
                  locale={{
                    emptyText: 'Chưa có lịch sử thanh toán'
                  }}
                />
              </div>
            </div>
          )}

          {/* Action Button - Only show when payment form is hidden and remaining amount > 0 */}
          {!showPaymentForm && (debtDetail?.paymentSummary?.remainingAmount || 0) > 0 && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
              <Button
                type="primary"
                size="large"
                style={{
                  background: '#22c55e',
                  borderColor: '#22c55e',
                  borderRadius: '8px',
                  fontWeight: 600,
                  height: '48px',
                  padding: '0 32px'
                }}
                onClick={() => {
                  setPaymentAmount(debtDetail?.paymentSummary?.remainingAmount?.toString() || '')
                  setShowPaymentForm(true)
                  setPaymentSuccess(false)
                  setPaymentMethod(null) // Bắt đầu từ màn nhập số tiền
                }}
              >
                Thu tiền
              </Button>
            </div>
          )}
        </div>

        {/* Right Column - Payment Form */}
        {showPaymentForm && (
          <div
            style={{
              width: '400px',
              flexShrink: 0,
              background: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '24px',
              height: 'fit-content',
              position: 'sticky',
              top: '24px'
            }}
          >
            {/* Close Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
              <Button
                type="text"
                icon={<CloseOutlined />}
                onClick={() => {
                  setShowPaymentForm(false)
                  setPaymentSuccess(false)
                  setPaymentData(null)
                  payOSOpenedRef.current = false // Reset để lần sau có thể tạo QR mới
                }}
                style={{ color: '#666' }}
              />
            </div>

            {!paymentSuccess ? (
              <>
                {paymentMethod === null ? (
                  /* Initial Payment Screen - Before selecting method */
                  <>
                    {/* Customer Info */}
                    <div style={{ marginBottom: '24px' }}>
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#666', 
                        marginBottom: '8px',
                        fontWeight: 500
                      }}>
                        Khách hàng
                      </div>
                      <div style={{
                        padding: '12px',
                        background: '#f5f5f5',
                        borderRadius: '8px',
                        fontSize: '14px',
                        color: '#111827'
                      }}>
                        {debtDetail?.customer?.fullName || customerInfo.name}
                      </div>
                    </div>

                    {/* Service Ticket ID */}
                    <div style={{ marginBottom: '24px' }}>
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#666', 
                        marginBottom: '8px',
                        fontWeight: 500
                      }}>
                        Mã phiếu
                      </div>
                      <div style={{
                        padding: '12px',
                        background: '#f5f5f5',
                        borderRadius: '8px',
                        fontSize: '14px',
                        color: '#111827'
                      }}>
                        {debtDetail?.serviceTicket?.serviceTicketCode || ticketId || customerInfo.licensePlate}
                      </div>
                    </div>

                    {/* Total Amount */}
                    <div style={{ marginBottom: '24px' }}>
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#666', 
                        marginBottom: '8px',
                        fontWeight: 500
                      }}>
                        Tổng tiền cần thu
                      </div>
                      <div style={{
                        padding: '12px',
                        background: '#f5f5f5',
                        borderRadius: '8px',
                        fontSize: '14px',
                        color: '#111827'
                      }}>
                        {(debtDetail?.paymentSummary?.remainingAmount || 0).toLocaleString('vi-VN')}
                      </div>
                    </div>

                    {/* Payment Amount Input */}
                    <div style={{ marginBottom: '24px' }}>
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#666', 
                        marginBottom: '8px',
                        fontWeight: 500
                      }}>
                        Số tiền khách trả
                      </div>
                      <Input
                        value={paymentAmount}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9]/g, '')
                          setPaymentAmount(value)
                        }}
                        placeholder="Nhập số tiền"
                        style={{
                          height: '48px',
                          borderRadius: '8px',
                          fontSize: '14px'
                        }}
                      />
                    </div>

                    {/* Remaining Amount */}
                    <div style={{ marginBottom: '32px' }}>
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#666', 
                        marginBottom: '8px',
                        fontWeight: 500
                      }}>
                        Số tiền còn lại
                      </div>
                      <div style={{
                        padding: '12px',
                        background: '#f5f5f5',
                        borderRadius: '8px',
                        fontSize: '14px',
                        color: '#111827'
                      }}>
                        {Math.max(0, (debtDetail?.paymentSummary?.remainingAmount || 0) - Number(paymentAmount || 0)).toLocaleString('vi-VN')}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                      <Button
                        onClick={() => {
                          setShowPaymentForm(false)
                          setPaymentSuccess(false)
                          setPaymentData(null)
                          payOSOpenedRef.current = false
                        }}
                        style={{
                          borderRadius: '8px',
                          height: '40px',
                          padding: '0 24px'
                        }}
                      >
                        Hủy
                      </Button>
                      <Button
                        type="primary"
                        loading={submitting}
                        style={{
                          background: '#22c55e',
                          borderColor: '#22c55e',
                          borderRadius: '8px',
                          height: '40px',
                          padding: '0 24px'
                        }}
                        onClick={handleInitialPayment}
                      >
                        Thanh toán
                      </Button>
                    </Space>
                  </>
                ) : (
                  /* Payment Method Selected */
                  <>
                    <style>
                      {`
                        .custom-payment-tabs .ant-tabs-nav {
                          width: 100%;
                        }
                        .custom-payment-tabs .ant-tabs-nav-list {
                          width: 100%;
                          display: flex !important;
                        }
                        .custom-payment-tabs .ant-tabs-tab {
                          flex: 1;
                          margin: 0 4px !important;
                          padding: 0 !important;
                          justify-content: center;
                        }
                        .custom-payment-tabs .ant-tabs-tab:first-child {
                          margin-left: 0 !important;
                        }
                        .custom-payment-tabs .ant-tabs-tab:last-child {
                          margin-right: 0 !important;
                        }
                        .custom-payment-tabs .ant-tabs-tab-btn {
                          width: 100%;
                        }
                        .custom-payment-tabs .ant-tabs-ink-bar {
                          display: none !important;
                        }
                      `}
                    </style>
                    {/* Payment Method Tabs - Using Ant Design Tabs */}
                    <Tabs
                      activeKey={paymentMethod}
                      onChange={(key) => setPaymentMethod(key)}
                      tabBarStyle={{
                        marginBottom: '24px',
                        borderBottom: 'none',
                        display: 'flex',
                        justifyContent: 'space-between'
                      }}
                      tabBarGutter={8}
                      className="custom-payment-tabs"
                      items={[
                        {
                          key: 'QR',
                          label: (
                            <span
                              style={{
                                fontWeight: 600,
                                fontSize: '15px',
                                padding: '10px 0',
                                display: 'block',
                                width: '100%',
                                textAlign: 'center',
                                borderRadius: '8px',
                                background: paymentMethod === 'QR' ? '#CBB081' : '#f3f4f6',
                                color: paymentMethod === 'QR' ? '#fff' : '#6b7280',
                                transition: 'all 0.3s ease'
                              }}
                            >
                              QR
                            </span>
                          ),
                          children: (
                            <>
                              {/* QR Code Container */}
                              {paymentData?.paymentUrl ? (
                                <div
                                  style={{
                                    border: '2px solid #CBB081',
                                    borderRadius: '12px',
                                    padding: '24px',
                                    background: '#fafafa',
                                    minHeight: '400px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '0 2px 8px rgba(203, 176, 129, 0.15)',
                                    marginBottom: '24px'
                                  }}
                                >
                                  <div
                                    id="payos-checkout-container"
                                    style={{
                                      width: '100%',
                                      maxWidth: '350px',
                                      height: '350px'
                                    }}
                                  ></div>
                                </div>
                              ) : (
                                <div
                                  style={{
                                    textAlign: 'center',
                                    padding: '60px 0',
                                    background: '#fafafa',
                                    borderRadius: '12px',
                                    border: '2px dashed #CBB081',
                                    minHeight: '400px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: '24px'
                                  }}
                                >
                                  <Spin size="large" />
                                  <p style={{ marginTop: '16px', color: '#666', fontSize: '14px' }}>
                                    Đang tải mã QR...
                                  </p>
                                </div>
                              )}

                              {/* Bank Info */}
                              {paymentData && (
                                <>
                                  <div style={{ marginBottom: '24px' }}>
                                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px', fontWeight: 500 }}>
                                      Ngân hàng
                                    </div>
                                    <div style={{ padding: '12px', background: '#f5f5f5', borderRadius: '8px', fontSize: '14px', color: '#111827' }}>
                                      {paymentData.bankName || 'MBBank'}
                                    </div>
                                  </div>

                                  <div style={{ marginBottom: '24px' }}>
                                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px', fontWeight: 500 }}>
                                      Số tiền
                                    </div>
                                    <div style={{ padding: '12px', background: '#f5f5f5', borderRadius: '8px', fontSize: '14px', color: '#111827' }}>
                                      {(debtDetail?.paymentSummary?.remainingAmount || 0).toLocaleString('vi-VN')}
                                    </div>
                                  </div>


                                </>
                              )}
                            </>
                          )
                        },
                        {
                          key: 'CASH',
                          label: (
                            <span
                              style={{
                                fontWeight: 600,
                                fontSize: '15px',
                                padding: '10px 0',
                                display: 'block',
                                width: '100%',
                                textAlign: 'center',
                                borderRadius: '8px',
                                background: paymentMethod === 'CASH' ? '#CBB081' : '#f3f4f6',
                                color: paymentMethod === 'CASH' ? '#fff' : '#6b7280',
                                transition: 'all 0.3s ease'
                              }}
                            >
                              Tiền mặt
                            </span>
                          ),
                          children: (
                            <>
                              {/* Customer Info */}
                              <div style={{ marginBottom: '24px' }}>
                                <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px', fontWeight: 500 }}>
                                  Khách hàng
                                </div>
                                <div style={{ padding: '12px', background: '#f5f5f5', borderRadius: '8px', fontSize: '14px', color: '#111827' }}>
                                  {customerInfo.name}
                                </div>
                              </div>

                              {/* Service Ticket ID */}
                              <div style={{ marginBottom: '24px' }}>
                                <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px', fontWeight: 500 }}>
                                  Mã phiếu
                                </div>
                                <div style={{ padding: '12px', background: '#f5f5f5', borderRadius: '8px', fontSize: '14px', color: '#111827' }}>
                                  {ticketId || customerInfo.licensePlate}
                                </div>
                              </div>

                              {/* Total Amount */}
                              <div style={{ marginBottom: '24px' }}>
                                <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px', fontWeight: 500 }}>
                                  Số tiền khách trả
                                </div>
                                <div style={{ padding: '12px', background: '#f5f5f5', borderRadius: '8px', fontSize: '14px', color: '#111827' }}>
                                  {(debtDetail?.paymentSummary?.remainingAmount || 0).toLocaleString('vi-VN')}
                                </div>
                              </div>

                              {/* Payment Amount Input */}
                              <div style={{ marginBottom: '24px' }}>
                                <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px', fontWeight: 500 }}>
                                  Số tiền nhận của khách
                                </div>
                                <Input
                                  value={paymentAmount}
                                  onChange={(e) => {
                                    const value = e.target.value.replace(/[^0-9]/g, '')
                                    setPaymentAmount(value)
                                  }}
                                  placeholder="Nhập số tiền"
                                  style={{ height: '48px', borderRadius: '8px', fontSize: '14px' }}
                                />
                              </div>

                              {/* Change Amount */}
                              <div style={{ marginBottom: '32px' }}>
                                <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px', fontWeight: 500 }}>
                                  Số tiền trả khách
                                </div>
                                <div style={{ padding: '12px', background: '#f5f5f5', borderRadius: '8px', fontSize: '14px', color: '#111827' }}>
                                  {Math.max(0, Number(paymentAmount || 0) - (debtDetail?.paymentSummary?.remainingAmount || 0)).toLocaleString('vi-VN')}
                                </div>
                              </div>
                            </>
                          )
                        }
                      ]}
                    />

                    {/* Action Buttons */}
                    <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                      <Button
                        onClick={() => {
                          setShowPaymentForm(false)
                          setPaymentSuccess(false)
                          setPaymentMethod(null)
                          setPaymentData(null)
                          payOSOpenedRef.current = false
                        }}
                        style={{
                          borderRadius: '8px',
                          height: '40px',
                          padding: '0 24px'
                        }}
                      >
                        Hủy
                      </Button>
                      {paymentMethod === 'CASH' && (
                        <Button
                          type="primary"
                          loading={submitting}
                          disabled={submitting}
                          style={{
                            background: '#22c55e',
                            borderColor: '#22c55e',
                            borderRadius: '8px',
                            height: '40px',
                            padding: '0 24px'
                          }}
                          onClick={handleCashPayment}
                        >
                          Hoàn tất
                        </Button>
                      )}
                      {paymentMethod === 'QR' && (
                        <Button
                          type="primary"
                          style={{
                            background: '#22c55e',
                            borderColor: '#22c55e',
                            borderRadius: '8px',
                            height: '40px',
                            padding: '0 24px'
                          }}
                          onClick={() => {
                            message.success('Thanh toán QR thành công')
                            setPaymentSuccess(true)
                            fetchDebtDetail()
                          }}
                        >
                          Gửi
                        </Button>
                      )}
                    </Space>
                  </>
                )}
              </>
            ) : (
              /* Success State */
              <>
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <div style={{ 
                    width: '80px', 
                    height: '80px', 
                    borderRadius: '50%', 
                    background: '#22c55e',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 24px'
                  }}>
                    <i className="bi bi-check" style={{ fontSize: '48px', color: '#ffffff' }} />
                  </div>
                  <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '32px', color: '#111827' }}>
                    Thanh toán thành công
                  </h2>
                </div>

                {/* Transaction Info Grid */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr',
                  gap: '16px',
                  marginBottom: '32px',
                  padding: '16px',
                  background: '#f9fafb',
                  borderRadius: '8px'
                }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                      Mã giao dịch
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>
                      {new Date().getTime().toString().slice(-8)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                      Ngày
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>
                      {new Date().toLocaleDateString('vi-VN')}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                      Giờ
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>
                      {new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                      Phương thức thanh toán
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>
                      {paymentMethod === 'CASH' ? 'Tiền mặt' : 'QR Code'}
                    </div>
                  </div>
                </div>

                {/* Amount */}
                <div style={{ 
                  textAlign: 'center',
                  padding: '24px',
                  background: '#f9fafb',
                  borderRadius: '8px',
                  marginBottom: '32px'
                }}>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
                    Tổng tiền
                  </div>
                  <div style={{ fontSize: '32px', fontWeight: 700, color: '#22c55e' }}>
                    {Number(paymentAmount || 0).toLocaleString('vi-VN')}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function AccountanceDebtTicketDetail({ Layout = AccountanceLayout }) {
  const Wrapper = Layout || (({ children }) => <>{children}</>)
  return (
    <Wrapper>
      <AccountanceDebtTicketDetailContent />
    </Wrapper>
  )
}
