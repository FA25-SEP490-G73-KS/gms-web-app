import React, { useMemo, useState, useEffect } from 'react'
import { Table, Input, Button, message } from 'antd'
import { SearchOutlined, EyeOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import AccountanceLayout from '../../layouts/AccountanceLayout'
import { goldTableHeader } from '../../utils/tableComponents'
import { invoiceAPI } from '../../services/api'
import dayjs from 'dayjs'
import '../../styles/pages/accountance/payments.css'

export function AccountancePaymentsContent() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    fetchInvoices()
  }, [page, pageSize])

  const fetchInvoices = async () => {
    setLoading(true)
    try {
      const { data: response, error } = await invoiceAPI.getAll(page - 1, pageSize, 'createdAt,desc')
      
      if (error) {
        message.error('Không thể tải danh sách phiếu thanh toán')
        setLoading(false)
        return
      }

      const result = response?.result || {}
      const content = result.content || []
      
      const mapServiceStatus = (status) => {
        const statusMap = {
          'CREATED': 'Đã tạo',
          'WAITING_FOR_QUOTATION': 'Chờ báo giá',
          'WAITING_FOR_DELIVERY': 'Chờ giao xe',
          'COMPLETED': 'Hoàn thành',
          'CANCELED': 'Hủy'
        }
        return statusMap[status] || status || ''
      }

      const transformedData = content.map((item) => ({
        id: item.id || item.invoiceId,
        paymentCode: item.code || item.invoiceCode || 'N/A',
        ticketCode: item.serviceTicketCode || 'N/A',
        customer: item.customerName || 'N/A',
        createdDate: item.createdAt || '',
        totalAmount: item.finalAmount || item.totalAmount || 0,
        serviceStatus: mapServiceStatus(item.serviceTicketStatus)
      }))

      setData(transformedData)
      setTotal(result.totalElements || 0)
    } catch (err) {
      console.error('Failed to fetch invoices:', err)
      message.error('Đã xảy ra lỗi khi tải dữ liệu')
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    return data
      .filter((item) => {
        const matchesQuery =
          !query ||
          item.paymentCode.toLowerCase().includes(query.toLowerCase()) ||
          item.ticketCode.toLowerCase().includes(query.toLowerCase()) ||
          item.customer.toLowerCase().includes(query.toLowerCase())
        return matchesQuery
      })
      .map((item, index) => ({ ...item, key: item.id, index }))
  }, [query, data])

  const columns = [
    {
      title: 'Mã hóa đơn',
      dataIndex: 'paymentCode',
      key: 'paymentCode',
      width: 180,
      render: (text, record) => (
        <span 
          style={{ color: '#2563eb', textDecoration: 'underline', cursor: 'pointer', fontWeight: 600 }}
          onClick={() => navigate(`/accountance/payments/${record.id}`)}
        >
          {text}
        </span>
      )
    },
    {
      title: 'Mã dịch vụ',
      dataIndex: 'ticketCode',
      key: 'ticketCode',
      width: 180
    },
    {
      title: 'Khách Hàng',
      dataIndex: 'customer',
      key: 'customer',
      width: 200,
      render: (text) => <span style={{ color: '#6b7280' }}>{text}</span>
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdDate',
      key: 'createdDate',
      width: 150,
      render: (date) => {
        if (!date) return 'N/A'
        return dayjs(date).format('D/M/YYYY')
      }
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 150,
      align: 'right',
      render: (value) => value ? value.toLocaleString('vi-VN') : '0'
    },
    {
      title: 'Trạng thái DV',
      dataIndex: 'serviceStatus',
      key: 'serviceStatus',
      width: 150,
      render: (status) => {
        if (!status) return ''
        const getStatusColor = (statusText) => {
          switch (statusText) {
            case 'Chờ báo giá':
              return '#16a34a'
            case 'Đã tạo':
              return '#6b7280'
            case 'Chờ giao xe':
              return '#f59e0b'
            case 'Hoàn thành':
              return '#22c55e'
            case 'Hủy':
              return '#ef4444'
            default:
              return '#666'
          }
        }
        return <span style={{ color: getStatusColor(status) }}>{status}</span>
      }
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 100,
      align: 'center',
      render: (_, record) => {
        if (!record.serviceStatus) return null
        return (
          <Button
            type="text"
            icon={<EyeOutlined />}
            style={{ padding: 0, width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => navigate(`/accountance/payments/${record.id}`)}
          />
        )
      }
    }
  ]

  return (
    <div style={{ padding: '24px', background: '#ffffff', minHeight: '100vh' }}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, marginBottom: '20px' }}>Thanh toán</h1>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '20px' }}>
            <Input
              prefix={<SearchOutlined />}
              placeholder="Tìm kiếm"
              allowClear
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ width: 300 }}
            />
          </div>
        </div>

        <div style={{
          background: '#fff',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <Table
            className="payments-table"
            columns={columns}
            dataSource={filtered}
            loading={loading}
            pagination={{
              current: page,
              pageSize: pageSize,
              total: total,
              showTotal: (total) => `0 of ${total} row(s) selected.`,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50', '100'],
              onChange: (p, ps) => {
                setPage(p)
                setPageSize(ps)
              }
            }}
            components={goldTableHeader}
            rowClassName={(_, index) => (index % 2 === 0 ? 'table-row-even' : 'table-row-odd')}
          />
        </div>
      </div>
  )
}

export default function AccountancePayments({ Layout = AccountanceLayout }) {
  const Wrapper = Layout || (({ children }) => <>{children}</>)
  return (
    <Wrapper>
      <AccountancePaymentsContent />
    </Wrapper>
  )
}

