import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react'
import { Table, Input, Button, Space, Tag, message, Modal, Tabs, Spin, Checkbox, DatePicker } from 'antd'
import { SearchOutlined, FilterOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { useNavigate } from 'react-router-dom'
import { usePayOS } from '@payos/payos-checkout'
import AccountanceLayout from '../../layouts/AccountanceLayout'
import { goldTableHeader } from '../../utils/tableComponents'
import { debtsAPI, invoiceAPI } from '../../services/api'
import '../../styles/pages/accountance/debts.css'

const STATUS_COLORS = {
  OUTSTANDING: { color: '#c2410c', bg: '#fff7ed', text: 'Chờ công nợ' },
  PAID_IN_FULL: { color: '#15803d', bg: '#dcfce7', text: 'Hoàn thành' }
}

const detailStatusConfig = {
  done: { label: 'Thanh toán', color: '#22c55e', bg: '#dcfce7' },
  warning: { label: 'Sắp', color: '#f97316', bg: '#ffedd5' }
}

const normalizeStatus = (rawStatus) => {
  if (rawStatus === 'PAID_IN_FULL') return 'PAID_IN_FULL'
  return 'OUTSTANDING'
}

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

export function AccountanceDebtsContent() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [expandedRowKeys, setExpandedRowKeys] = useState([])
  const [loading, setLoading] = useState(false)
  const [debts, setDebts] = useState([])
  const [pagination, setPagination] = useState({
    page: 0,
    size: 10,
    total: 0
  })
  const [filterVisible, setFilterVisible] = useState(false)
  const [selectedStatuses, setSelectedStatuses] = useState([])
  const [createdDateRange, setCreatedDateRange] = useState([null, null])

  // Payment modal states
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedDebt, setSelectedDebt] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('QR')
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentData, setPaymentData] = useState(null)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [cashReceived, setCashReceived] = useState('')

  // PayOS config
  const [payOSConfig, setPayOSConfig] = useState({
    RETURN_URL: `${window.location.origin}/accountance/debts`,
    ELEMENT_ID: 'payos-checkout-container-debt',
    CHECKOUT_URL: null,
    embedded: true,
    onSuccess: async (event) => {
      console.log('Payment successful:', event)
      message.success('Thanh toán thành công!')
      setPaymentData(null)
      setShowPaymentModal(false)
      fetchDebts(pagination.page, pagination.size)
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
    if (payOSConfig.CHECKOUT_URL != null) {
      open()
    }
  }, [payOSConfig])

  const normalizedDebts = useMemo(() => {
    const [fromDate, toDate] = createdDateRange
    
    return debts
      .filter((item) => {
        // Filter theo date range nếu có
        if (fromDate && toDate) {
          const createdAt = item.createdAt ? new Date(item.createdAt) : null
          if (createdAt) {
            const from = dayjs(fromDate).startOf('day').toDate()
            const to = dayjs(toDate).endOf('day').toDate()
            if (createdAt < from || createdAt > to) {
              return false
            }
          }
        }
        return true
      })
      .map((item, index) => {
      const customerName =
        item.customerFullName ||
        item.customerName ||
        item.customer?.fullName ||
        item.customer?.name ||
        item.customer ||
        'Khách hàng'
      const phone =
        item.customerPhone ||
        item.customer?.phone ||
        item.customer?.phoneNumber ||
        item.phone ||
        '—'
      const details =
        item.details ||
        item.debtDetails ||
        item.items ||
        []
      const firstDetail = details[0] || {}
      const totalAmount = safeNumber(item.totalAmount ?? item.totalDebt ?? firstDetail.total ?? item.total ?? item.amount)
      const remainingAmount = safeNumber(item.totalRemaining ?? item.remainingAmount ?? firstDetail.remain ?? 0)
      const paidAmount = safeNumber(item.totalPaidAmount ?? Math.max(totalAmount - remainingAmount, 0))
      return {
        key: item.customerId || item.id || `debt-${index}`,
        id: item.customerId || item.id || index,
        customerId: item.customerId || item.id,
        customer: customerName,
        phone,
        licensePlate: firstDetail.licensePlate || firstDetail.vehiclePlate || item.licensePlate || '—',
        totalAmount,
        paidAmount,
        remainingAmount,
        dueDate: formatDate(item.dueDate || firstDetail.dueDate),
        status: normalizeStatus(item.status),
        debtCount: item.debtCount ?? details.length ?? 0,
        details: details.map((detail, detailIndex) => ({
          key: detail.id || `detail-${detailIndex}`,
          id: detail.id || detailIndex,
          code: detail.code || detail.ticketCode || detail.referenceCode || '—',
          createdAt: formatDate(detail.createdAt || detail.createdDate || detail.createdOn),
          total: safeNumber(detail.total ?? detail.amount ?? detail.totalAmount),
          remain: safeNumber(detail.remain ?? detail.outstandingAmount ?? detail.debtAmount),
          dueDate: formatDate(detail.dueDate || detail.paymentDueDate),
          status: detail.status || 'warning'
        }))
      }
    })
  }, [debts, createdDateRange])

  const fetchDebts = useCallback(
    async (page = 0, size = 10) => {
      setLoading(true)
      try {
        // Nếu có nhiều status được chọn, chỉ lấy status đầu tiên (hoặc có thể gửi array nếu API hỗ trợ)
        const apiStatus = selectedStatuses.length > 0 ? selectedStatuses[0] : undefined
        
        const { data, error } = await debtsAPI.list({
          status: apiStatus,
          keyword: query || undefined,
          page,
          size,
          sort: undefined // Bỏ sort vì API /debts/summary không hỗ trợ
        })

        if (error) {
          throw new Error(error)
        }

        const payload = data?.result ?? data?.data ?? data
        const list =
          Array.isArray(payload)
            ? payload
            : payload?.content ||
              payload?.items ||
              payload?.records ||
              []

        if (!list || list.length === 0) {
          setDebts([])
          setPagination((prev) => ({
            ...prev,
            page: 0,
            size,
            total: 0
          }))
        } else {
          setDebts(list)
          setPagination((prev) => ({
            ...prev,
            page,
            size,
            total:
              payload?.totalElements ??
              payload?.total ??
              payload?.totalItems ??
              list.length
          }))
        }
        setExpandedRowKeys([])
      } catch (err) {
        console.error('Failed to fetch debts:', err)
        message.error('Không thể tải danh sách công nợ')
        setDebts([])
        setPagination((prev) => ({
          ...prev,
          page: 0,
          size,
          total: 0
        }))
        setExpandedRowKeys([])
      } finally {
        setLoading(false)
      }
    },
    [query, selectedStatuses]
  )

  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 0 }))
  }, [query, selectedStatuses])

  useEffect(() => {
    fetchDebts(0, pagination.size)
  }, [fetchDebts, pagination.size])

  const handlePayment = async (type = 'QR') => {
    if (!paymentAmount || Number(paymentAmount) <= 0) {
      message.warning('Vui lòng nhập số tiền thanh toán')
      return
    }

    if (Number(paymentAmount) > selectedDebt?.remain) {
      message.error('Số tiền thanh toán không được vượt quá số tiền còn nợ')
      return
    }

    setPaymentLoading(true)
    try {
      // Gọi API thanh toán - cần có invoiceId
      const invoiceId = selectedDebt?.invoiceId || selectedDebt?.id
      
      const payload = {
        method: type === 'QR' ? 'BANK_TRANSFER' : 'CASH',
        price: Number(paymentAmount),
        type: 'DEPOSIT'
      }

      const { data: response, error } = await invoiceAPI.pay(invoiceId, payload)

      if (error) {
        message.error(error || 'Tạo giao dịch thanh toán thất bại')
        setPaymentLoading(false)
        return
      }

      const result = response?.result || null
      console.log('Payment response:', result)
      setPaymentData(result)
      setPaymentMethod(type)

      if (type === 'QR') {
        setPayOSConfig((config) => ({
          ...config,
          CHECKOUT_URL: result?.paymentUrl
        }))
      } else {
        // Cash payment success
        message.success('Thanh toán tiền mặt thành công')
        setShowPaymentModal(false)
        setPaymentData(null)
        setPaymentAmount('')
        fetchDebts(pagination.page, pagination.size)
      }
    } catch (err) {
      console.error('Error creating payment:', err)
      message.error('Đã xảy ra lỗi khi tạo giao dịch thanh toán')
    } finally {
      setPaymentLoading(false)
    }
  }

  useEffect(() => {
    fetchDebts(pagination.page, pagination.size)
  }, [pagination.page, pagination.size, fetchDebts])

  const columns = [
    {
      title: <div style={{ textAlign: 'center' }}>Khách hàng</div>,
      dataIndex: 'customer',
      key: 'customer',
      width: 220,
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
      title: <div style={{ textAlign: 'center' }}>Ngày hẹn trả</div>,
      dataIndex: 'dueDate',
      key: 'dueDate',
      width: 140,
      align: 'center'
    },
    {
      title: <div style={{ textAlign: 'center' }}>Tổng cộng</div>,
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      align: 'center',
      width: 140,
      render: (value) => value.toLocaleString('vi-VN')
    },
    {
      title: <div style={{ textAlign: 'center' }}>Đã thanh toán</div>,
      dataIndex: 'paidAmount',
      key: 'paidAmount',
      align: 'center',
      width: 150,
      render: (value) => value.toLocaleString('vi-VN')
    },
    {
      title: <div style={{ textAlign: 'center' }}>Còn nợ</div>,
      dataIndex: 'remainingAmount',
      key: 'remainingAmount',
      align: 'center',
      width: 140,
      render: (value) => (
        <span style={{ fontWeight: 600 }}>
          {value.toLocaleString('vi-VN')}
        </span>
      )
    },
    {
      title: <div style={{ textAlign: 'center' }}>Trạng thái</div>,
      dataIndex: 'status',
      key: 'status',
      width: 140,
      align: 'center',
      render: (value) => {
        const config = STATUS_COLORS[value] || STATUS_COLORS.OUTSTANDING
        return (
          <Tag
            style={{
              borderRadius: 999,
              padding: '4px 12px',
              fontWeight: 600,
              color: config.color,
              background: config.bg,
              borderColor: 'transparent'
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
      width: 70,
      render: (_, record) => (
        <Button
          type="text"
          icon={<i className="bi bi-eye" />}
          onClick={() => {
            navigate('/accountance/debts/detail', { state: { customer: record } })
          }}
        />
      ),
    }
  ]

  const expandedRowRender = (record) => {
    const detailColumns = [
      { 
        title: 'STT', 
        key: 'index', 
        width: 70,
        align: 'center',
        render: (_, __, index) => (
          <span style={{ fontWeight: 600 }}>{String(index + 1).padStart(2, '0')}</span>
        )
      },
      { title: 'Code', dataIndex: 'code', key: 'code', width: 160 },
      { title: 'Ngày lập', dataIndex: 'createdAt', key: 'createdAt', width: 140 },
      {
        title: 'Tổng tiền',
        dataIndex: 'total',
        key: 'total',
        width: 140,
        align: 'center',
        render: (value) => value.toLocaleString('vi-VN')
      },
      {
        title: 'Còn nợ',
        dataIndex: 'remain',
        key: 'remain',
        width: 140,
        align: 'center',
        render: (value) => value.toLocaleString('vi-VN')
      },
      { title: 'Hẹn trả', dataIndex: 'dueDate', key: 'dueDate', width: 140 },
      {
        title: 'Hành động',
        key: 'action',
        width: 200,
        render: (_, detailRecord) => {
          // Hiển thị 2 nút nếu còn nợ (remain > 0)
          if (detailRecord.remain > 0) {
            return (
              <Space>
                <Button
                  type="primary"
                  style={{
                    background: '#22c55e',
                    borderColor: '#22c55e',
                    borderRadius: '6px',
                    fontWeight: 600
                  }}
                  onClick={() => {
                    console.log('Thanh toán:', detailRecord)
                    setSelectedDebt(detailRecord)
                    setShowPaymentModal(true)
                    setPaymentAmount(String(detailRecord.remain))
                    setPaymentMethod('QR')
                    setPaymentData(null)
                  }}
                >
                  Thanh toán
                </Button>
                <Button
                  style={{
                    background: '#f97316',
                    borderColor: '#f97316',
                    color: '#fff',
                    borderRadius: '6px',
                    fontWeight: 600
                  }}
                  onClick={() => {
                    console.log('Gửi:', detailRecord)
                  }}
                >
                  Gửi
                </Button>
              </Space>
            )
          }
          // Nếu đã thanh toán hết, hiển thị tag
          const config = detailStatusConfig[detailRecord.status] || detailStatusConfig.warning
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
          dataSource={record.details.map((item, index) => ({ ...item, key: item.id, index }))}
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
      <div className="debts-page">
        <div className="debts-header">
          <h1>Công nợ</h1>
        </div>

        <div className="debts-filters" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', gap: '12px', flexWrap: 'wrap' }}>
          <Input
            prefix={<SearchOutlined />}
            placeholder="Tìm kiếm"
            allowClear
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="debts-search"
            style={{ width: 260 }}
          />
          <Button
            onClick={() => setFilterVisible(true)}
            icon={<FilterOutlined />}
            style={{
              borderColor: '#d9d9d9',
              fontWeight: 700,
              borderRadius: 10,
              height: 40,
              padding: '0 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 1px 2px rgba(0,0,0,0.06)'
            }}
          >
            Bộ lọc
          </Button>
        </div>

        <Table
          className="debts-table"
          columns={columns}
          dataSource={normalizedDebts.map((item, index) => ({
            ...item,
            index
          }))}
          loading={loading}
          expandable={{
            expandedRowRender,
            expandedRowKeys,
            onExpandedRowsChange: (keys) => setExpandedRowKeys(keys),
            expandIconColumnIndex: -1,
          }}
          pagination={{
            pageSize: pagination.size,
            current: pagination.page + 1,
            total: pagination.total,
            showTotal: (total) => `Tổng ${total} bản ghi`,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100'],
            onChange: (page, size) => {
              fetchDebts(page - 1, size)
            }
          }}
          components={goldTableHeader}
        />

        {/* Payment Modal */}
        <Modal
          open={showPaymentModal}
          onCancel={() => {
            setShowPaymentModal(false)
            setSelectedDebt(null)
            setPaymentData(null)
            setPaymentAmount('')
            setCashReceived('')
          }}
          footer={null}
          width={600}
          title={null}
          closable={false}
        >
          <div>
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

            <div
              style={{
                background: '#CBB081',
                padding: '16px',
                borderRadius: '8px',
                marginBottom: '20px',
                textAlign: 'center'
              }}
            >
              <span style={{ fontWeight: 700, fontSize: '18px', color: '#fff' }}>
                THANH TOÁN CÔNG NỢ
              </span>
            </div>

            <Tabs
              activeKey={paymentMethod}
              onChange={(key) => setPaymentMethod(key)}
              className="custom-payment-tabs"
              tabBarStyle={{
                marginBottom: '24px',
                borderBottom: 'none'
              }}
              tabBarGutter={8}
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
                  children: paymentData?.paymentUrl ? (
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
                        boxShadow: '0 2px 8px rgba(203, 176, 129, 0.15)'
                      }}
                    >
                      <div
                        id="payos-checkout-container-debt"
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
                        justifyContent: 'center'
                      }}
                    >
                      <Spin size="large" />
                      <p style={{ marginTop: '16px', color: '#666', fontSize: '14px' }}>
                        Đang tải mã QR...
                      </p>
                    </div>
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
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '14px', color: '#374151' }}>
                          Mã phiếu
                        </label>
                        <Input value={selectedDebt?.code || '—'} disabled style={{ height: '40px', borderRadius: '8px', backgroundColor: '#f9fafb', borderColor: '#d1d5db' }} />
                      </div>

                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '14px', color: '#374151' }}>
                          Số tiền còn nợ
                        </label>
                        <Input value={(selectedDebt?.remain || 0).toLocaleString('vi-VN') + ' đ'} disabled style={{ height: '40px', borderRadius: '8px', backgroundColor: '#f9fafb', borderColor: '#d1d5db' }} />
                      </div>

                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '14px', color: '#374151' }}>
                          Số tiền thanh toán
                        </label>
                        <Input
                          value={paymentAmount ? Number(paymentAmount).toLocaleString('vi-VN') : ''}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^\d]/g, '')
                            setPaymentAmount(value)
                          }}
                          placeholder="Nhập số tiền"
                          style={{ height: '40px', borderRadius: '8px', fontSize: '14px' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '14px', color: '#374151' }}>
                          Số tiền khách trả
                        </label>
                        <Input
                          value={cashReceived ? Number(cashReceived).toLocaleString('vi-VN') : ''}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^\d]/g, '')
                            setCashReceived(value)
                          }}
                          placeholder="Nhập số tiền khách trả"
                          style={{ height: '40px', borderRadius: '8px', fontSize: '14px' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '14px', color: '#374151' }}>
                          Số tiền trả khách
                        </label>
                        <Input
                          value={(Math.max(0, Number(cashReceived || 0) - Number(paymentAmount || 0))).toLocaleString('vi-VN') + ' đ'}
                          disabled
                          style={{ height: '40px', borderRadius: '8px', backgroundColor: '#f9fafb', borderColor: '#d1d5db' }}
                        />
                      </div>

                      <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                        <Button
                          onClick={() => {
                            setShowPaymentModal(false)
                            setPaymentData(null)
                            setPaymentAmount('')
                            setCashReceived('')
                          }}
                          style={{ flex: 1, height: '45px', borderRadius: '8px', fontWeight: 600, fontSize: '14px' }}
                        >
                          Hủy
                        </Button>
                        <Button
                          type="primary"
                          onClick={() => handlePayment('CASH')}
                          loading={paymentLoading}
                          disabled={!paymentAmount || Number(paymentAmount) <= 0}
                          style={{ flex: 1, background: '#22c55e', borderColor: '#22c55e', height: '45px', fontWeight: 600, fontSize: '14px', borderRadius: '8px' }}
                        >
                          Hoàn tất
                        </Button>
                      </div>
                    </div>
                  )
                }
              ]}
            />

            {!paymentData && paymentMethod === 'QR' && (
              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <Button
                  onClick={() => {
                    setShowPaymentModal(false)
                    setPaymentData(null)
                    setPaymentAmount('')
                  }}
                  style={{ flex: 1, height: '45px', borderRadius: '8px', fontWeight: 600, fontSize: '14px' }}
                >
                  Hủy
                </Button>
                <Button
                  type="primary"
                  onClick={() => handlePayment('QR')}
                  loading={paymentLoading}
                  disabled={!paymentAmount || Number(paymentAmount) <= 0}
                  style={{ flex: 1, background: '#22c55e', borderColor: '#22c55e', height: '45px', fontWeight: 600, fontSize: '14px', borderRadius: '8px' }}
                >
                  Thanh toán
                </Button>
              </div>
            )}
          </div>
        </Modal>

        {/* Filter Modal */}
        <Modal
          open={filterVisible}
          onCancel={() => setFilterVisible(false)}
          footer={null}
          title="Bộ lọc"
          width={420}
        >
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Trạng thái</div>
            <Space direction="vertical">
              {[
                { key: 'OUTSTANDING', label: 'Chờ công nợ' },
                { key: 'PAID_IN_FULL', label: 'Hoàn thành' }
              ].map((opt) => (
                <Checkbox
                  key={opt.key}
                  checked={selectedStatuses.includes(opt.key)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedStatuses((prev) => [...prev, opt.key])
                    } else {
                      setSelectedStatuses((prev) => prev.filter((v) => v !== opt.key))
                    }
                  }}
                >
                  {opt.label}
                </Checkbox>
              ))}
            </Space>
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Khoảng ngày tạo</div>
            <Space direction="vertical" style={{ width: '100%', gap: 12 }}>
              <div>
                <div style={{ fontSize: 14, color: '#444', marginBottom: 6 }}>Từ ngày</div>
                <DatePicker
                  style={{ width: '100%', height: 40, borderRadius: 8 }}
                  placeholder="dd/mm/yyyy"
                  value={createdDateRange[0]}
                  format="DD/MM/YYYY"
                  allowClear
                  onChange={(val) => setCreatedDateRange([val, createdDateRange[1]])}
                />
              </div>
              <div>
                <div style={{ fontSize: 14, color: '#444', marginBottom: 6 }}>Đến ngày</div>
                <DatePicker
                  style={{ width: '100%', height: 40, borderRadius: 8 }}
                  placeholder="dd/mm/yyyy"
                  value={createdDateRange[1]}
                  format="DD/MM/YYYY"
                  allowClear
                  onChange={(val) => setCreatedDateRange([createdDateRange[0], val])}
                />
              </div>
            </Space>
          </div>

          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button
              onClick={() => {
                setSelectedStatuses([])
                setCreatedDateRange([null, null])
              }}
            >
              Đặt lại
            </Button>
            <Button
              type="primary"
              onClick={() => setFilterVisible(false)}
              style={{ background: '#CBB081', borderColor: '#CBB081' }}
            >
              Áp dụng
            </Button>
          </Space>
        </Modal>
      </div>
  )
}

export default function AccountanceDebts({ Layout = AccountanceLayout }) {
  const Wrapper = Layout || (({ children }) => <>{children}</>)
  return (
    <Wrapper>
      <AccountanceDebtsContent />
    </Wrapper>
  )
}

