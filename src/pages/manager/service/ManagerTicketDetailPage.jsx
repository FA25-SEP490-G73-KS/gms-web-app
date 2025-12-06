import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Row, Col, Card, Table, message, Spin } from 'antd'
import ManagerLayout from '../../../layouts/ManagerLayout'
import { serviceTicketAPI } from '../../../services/api'
import { goldTableHeader } from '../../../utils/tableComponents'
import dayjs from 'dayjs'

const QUOTATION_STATUS_CONFIG = {
  DRAFT: {
    label: 'Nháp',
    badgeBg: '#f3f4f6',
    badgeColor: '#6b7280',
  },
  WAITING_WAREHOUSE_CONFIRM: {
    label: 'Chờ kho duyệt',
    badgeBg: '#fef3c7',
    badgeColor: '#92400e',
  },
  WAREHOUSE_CONFIRMED: {
    label: 'Kho đã duyệt',
    badgeBg: '#dcfce7',
    badgeColor: '#15803d',
  },
  WAITING_CUSTOMER_CONFIRM: {
    label: 'Chờ khách xác nhận',
    badgeBg: '#e0e7ff',
    badgeColor: '#3730a3',
  },
  CUSTOMER_CONFIRMED: {
    label: 'Khách đã xác nhận',
    badgeBg: '#d1fae5',
    badgeColor: '#065f46',
  },
  CUSTOMER_REJECTED: {
    label: 'Khách từ chối',
    badgeBg: '#fee2e2',
    badgeColor: '#991b1b',
  },
  COMPLETED: {
    label: 'Hoàn thành',
    badgeBg: '#dbeafe',
    badgeColor: '#1e40af',
  }
}

const formatCurrency = (value) => {
  if (!value && value !== 0) return '0'
  return Number(value).toLocaleString('vi-VN')
}

const getDisplayValue = (value) => {
  if (value === null || value === undefined || value === '') return '—'
  if (Array.isArray(value)) return value.join(', ')
  return String(value)
}

export default function ManagerTicketDetailPage() {
  const { id } = useParams()
  const [loading, setLoading] = useState(false)
  const [ticketData, setTicketData] = useState(null)

  useEffect(() => {
    if (!id) return
    fetchTicketDetail()
  }, [id])

  const fetchTicketDetail = async () => {
    setLoading(true)
    try {
      const { data: response, error } = await serviceTicketAPI.getById(id)
      
      if (error || !response || !response.result) {
        console.error('Error fetching ticket detail:', error)
        message.error('Không thể tải thông tin phiếu dịch vụ. Vui lòng thử lại.')
        return
      }
      
      if (response && response.result) {
        setTicketData(response.result)
      }
    } catch (err) {
      console.error('Error fetching ticket detail:', err)
      message.error('Đã xảy ra lỗi khi tải thông tin phiếu dịch vụ.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <ManagerLayout>
        <div style={{ padding: '24px', textAlign: 'center' }}>
          <Spin size="large" />
        </div>
      </ManagerLayout>
    )
  }

  if (!ticketData) {
    return (
      <ManagerLayout>
        <div style={{ padding: '24px', textAlign: 'center' }}>
          <p>Không tìm thấy phiếu dịch vụ</p>
        </div>
      </ManagerLayout>
    )
  }

  const quotationStatusRaw = ticketData?.priceQuotation?.status
  const normalizedQuotationStatus = quotationStatusRaw
    ? String(quotationStatusRaw).toUpperCase()
    : 'DRAFT'
  const quotationStatusConfig = QUOTATION_STATUS_CONFIG[normalizedQuotationStatus] || QUOTATION_STATUS_CONFIG.DRAFT

  const technicianDisplay = getDisplayValue(
    ticketData?.technicians?.[0] || null
  )

  const serviceTypeValue = Array.isArray(ticketData?.serviceType)
    ? ticketData.serviceType
    : ticketData?.serviceType || null

  const quoteCreator = getDisplayValue(ticketData?.createdBy)
  const createdDate = ticketData?.createdAt
    ? new Date(ticketData.createdAt).toLocaleDateString('vi-VN')
    : null

  const deliveryDate = ticketData?.deliveryAt
    ? dayjs(ticketData.deliveryAt).format('DD/MM/YYYY')
    : '—'

  // Transform quotation items
  const replaceItems = []
  const serviceItems = []
  
  if (ticketData?.priceQuotation?.items) {
    ticketData.priceQuotation.items.forEach((item, index) => {
      if (item.itemType === 'PART') {
        replaceItems.push({
          id: item.priceQuotationItemId || `part-${index}`,
          category: item.itemName || item.partName || item.part?.name || '—',
          quantity: item.quantity ?? 1,
          unit: item.unit || '—',
          unitPrice: item.unitPrice || 0,
          total: item.totalPrice || 0
        })
      } else if (item.itemType === 'SERVICE') {
        serviceItems.push({
          id: item.priceQuotationItemId || `service-${index}`,
          task: item.itemName || item.serviceName || '—',
          quantity: item.quantity ?? 1,
          unit: item.unit || '—',
          unitPrice: item.unitPrice || 0,
          total: item.totalPrice || 0
        })
      }
    })
  }

  const totalReplacement = replaceItems.reduce((sum, item) => sum + (item.total || 0), 0)
  const totalService = serviceItems.reduce((sum, item) => sum + (item.total || 0), 0)
  const grandTotal = totalReplacement + totalService
  const discountPercent =
    ticketData?.priceQuotation?.discountPercent ??
    ticketData?.priceQuotation?.discountRate ??
    0
  const discountAmount = Math.round((grandTotal * discountPercent) / 100)
  const finalAmount = grandTotal - discountAmount

  const replaceColumns = [
    {
      title: 'STT',
      key: 'index',
      width: 60,
      render: (_, __, index) => String(index + 1).padStart(2, '0')
    },
    {
      title: 'Danh mục',
      key: 'category',
      width: 350,
      render: (_, record) => (
        <input
          type="text"
          value={record.category}
          disabled
          readOnly
          style={{
            width: '100%',
            border: 'none',
            background: 'transparent',
            padding: 0,
            color: '#111',
            cursor: 'default'
          }}
        />
      )
    },
    {
      title: 'Số lượng',
      key: 'quantity',
      width: 120,
      render: (_, record) => (
        <input
          type="number"
          value={record.quantity}
          disabled
          readOnly
          style={{
            width: '100%',
            border: 'none',
            background: 'transparent',
            padding: 0,
            color: '#111',
            cursor: 'default',
            textAlign: 'right'
          }}
        />
      )
    },
    {
      title: 'Đơn vị',
      key: 'unit',
      width: 120,
      render: (_, record) => (
        <input
          type="text"
          value={record.unit}
          disabled
          readOnly
          style={{
            width: '100%',
            border: 'none',
            background: 'transparent',
            padding: 0,
            color: '#111',
            cursor: 'default'
          }}
        />
      )
    },
    {
      title: 'Đơn giá (vnd)',
      key: 'unitPrice',
      width: 150,
      render: (_, record) => (
        <input
          type="text"
          value={formatCurrency(record.unitPrice)}
          disabled
          readOnly
          style={{
            width: '100%',
            border: 'none',
            background: 'transparent',
            padding: 0,
            color: '#111',
            cursor: 'default',
            textAlign: 'right'
          }}
        />
      )
    },
    {
      title: 'Thành tiền (vnd)',
      key: 'total',
      width: 150,
      render: (_, record) => (
        <input
          type="text"
          value={formatCurrency(record.total)}
          disabled
          readOnly
          style={{
            width: '100%',
            border: 'none',
            background: 'transparent',
            padding: 0,
            color: '#111',
            cursor: 'default',
            textAlign: 'right'
          }}
        />
      )
    }
  ]

  const serviceColumns = [
    {
      title: 'STT',
      key: 'index',
      width: 60,
      render: (_, __, index) => String(index + 1).padStart(2, '0')
    },
    {
      title: 'Công việc',
      key: 'task',
      width: 400,
      render: (_, record) => (
        <input
          type="text"
          value={record.task}
          disabled
          readOnly
          style={{
            width: '100%',
            border: 'none',
            background: 'transparent',
            padding: 0,
            color: '#111',
            cursor: 'default'
          }}
        />
      )
    },
    {
      title: 'Đơn giá (vnd)',
      key: 'unitPrice',
      width: 200,
      render: (_, record) => (
        <input
          type="text"
          value={formatCurrency(record.unitPrice)}
          disabled
          readOnly
          style={{
            width: '100%',
            border: 'none',
            background: 'transparent',
            padding: 0,
            color: '#111',
            cursor: 'default',
            textAlign: 'right'
          }}
        />
      )
    },
    {
      title: 'Thành tiền (vnd)',
      key: 'total',
      width: 200,
      render: (_, record) => (
        <input
          type="text"
          value={formatCurrency(record.total)}
          disabled
          readOnly
          style={{
            width: '100%',
            border: 'none',
            background: 'transparent',
            padding: 0,
            color: '#111',
            cursor: 'default',
            textAlign: 'right'
          }}
        />
      )
    }
  ]

  return (
    <ManagerLayout>
      <div style={{ padding: '24px', background: '#ffffff', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>
            {ticketData?.serviceTicketCode || `STK-2025-${String(id || 0).padStart(6, '0')}`}
          </h1>
        </div>

        <Row gutter={16} style={{ marginBottom: '24px' }}>
          <Col span={12} style={{ display: 'flex' }}>
            <Card style={{ borderRadius: '12px', background: '#fafafa', width: '100%', height: '100%' }}>
              <div style={{ marginBottom: '12px' }}>
                <strong>Tên khách hàng:</strong>{' '}
                <span>{getDisplayValue(ticketData?.customer?.fullName)}</span>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <strong>Số điện thoại:</strong>{' '}
                <span>{getDisplayValue(ticketData?.customer?.phone)}</span>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <strong>Loại xe:</strong>{' '}
                <span>
                  {getDisplayValue(
                    ticketData?.vehicle?.vehicleModelName ||
                    ticketData?.vehicle?.vehicleModel?.modelName ||
                    ticketData?.vehicle?.model ||
                    ticketData?.vehicle?.brandName ||
                    ticketData?.vehicle?.vehicleModel?.brandName
                  )}
                </span>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <strong>Biển số xe:</strong>{' '}
                <span>{getDisplayValue(ticketData?.vehicle?.licensePlate)}</span>
              </div>
              <div>
                <strong>Số khung:</strong>{' '}
                <span>{getDisplayValue(ticketData?.vehicle?.vin)}</span>
              </div>
            </Card>
          </Col>
          <Col span={12} style={{ display: 'flex' }}>
            <Card style={{ borderRadius: '12px', background: '#fafafa', width: '100%', height: '100%' }}>
              <div style={{ marginBottom: '12px' }}>
                <strong>Nhân viên lập báo giá:</strong>{' '}
                <span>{quoteCreator}</span>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <strong>Ngày tạo báo giá:</strong>{' '}
                <span>{getDisplayValue(createdDate)}</span>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <strong>Kỹ thuật viên sửa chữa:</strong>{' '}
                <span>{technicianDisplay}</span>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <strong>Loại dịch vụ:</strong>{' '}
                <span>{getDisplayValue(serviceTypeValue)}</span>
              </div>
              <div>
                <strong>Ngày dự đoán giao xe:</strong>{' '}
                <span>{deliveryDate}</span>
              </div>
            </Card>
          </Col>
        </Row>

        {ticketData?.priceQuotation ? (
          <Card style={{ borderRadius: '12px' }}>
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>BÁO GIÁ</h2>
                  {ticketData?.priceQuotation?.status && (
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: '999px',
                        fontSize: '12px',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        backgroundColor: quotationStatusConfig.badgeBg,
                        color: quotationStatusConfig.badgeColor
                      }}
                    >
                      {quotationStatusConfig.label}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {replaceItems.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <strong style={{ display: 'block', marginBottom: '12px' }}>Thay thế</strong>
                <Table
                  columns={replaceColumns}
                  dataSource={replaceItems.map((item, index) => ({ ...item, key: item.id, index }))}
                  pagination={false}
                  size="small"
                  components={goldTableHeader}
                />
              </div>
            )}

            {serviceItems.length > 0 && (
              <div>
                <strong style={{ display: 'block', marginBottom: '12px' }}>Dịch vụ</strong>
                <Table
                  columns={serviceColumns}
                  dataSource={serviceItems.map((item, index) => ({ ...item, key: item.id, index }))}
                  pagination={false}
                  size="small"
                  components={goldTableHeader}
                />
              </div>
            )}

            <div
              style={{
                marginTop: '32px',
                borderTop: '1px solid #edecec',
                paddingTop: '24px',
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                gap: '16px',
                alignItems: 'center'
              }}
            >
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '32px' }}>
                <div>
                  <div style={{ color: '#6b7280', fontSize: '12px', textTransform: 'uppercase' }}>Tổng cộng</div>
                  <div style={{ fontSize: '20px', fontWeight: 700 }}>{formatCurrency(grandTotal)} đ</div>
                </div>
                <div>
                  <div style={{ color: '#6b7280', fontSize: '12px', textTransform: 'uppercase' }}>Giảm giá</div>
                  <div style={{ fontSize: '16px', fontWeight: 600 }}>
                    {discountPercent ? `${discountPercent}%` : '0%'}{' '}
                    {discountAmount > 0 && (
                      <span style={{ color: '#6b7280', fontWeight: 400 }}>
                        ({formatCurrency(discountAmount)} đ)
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#6b7280', fontSize: '12px', textTransform: 'uppercase' }}>Thanh toán cuối cùng</div>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: '#ef4444' }}>
                    {formatCurrency(finalAmount)} đ
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ) : (
          <Card style={{ borderRadius: '12px', textAlign: 'center', padding: '40px' }}>
            <p style={{ color: '#6b7280', margin: 0 }}>Chưa có báo giá</p>
          </Card>
        )}
      </div>
    </ManagerLayout>
  )
}

