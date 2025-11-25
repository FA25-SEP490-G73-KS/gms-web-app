import React, { useMemo, useState } from 'react'
import { Table, Input, Button } from 'antd'
import { SearchOutlined, CloseOutlined } from '@ant-design/icons'
import AccountanceLayout from '../../layouts/AccountanceLayout'
import { goldTableHeader } from '../../utils/tableComponents'
import '../../styles/pages/accountance/payments.css'

const paymentsData = [
  {
    id: 1,
    paymentCode: 'PTT-2025-000001',
    ticketCode: 'PTT-2025-000001',
    customer: 'Phạm Văn A',
    licensePlate: '25A-123456',
    totalAmount: 2000000,
    totalDebt: 10000000
  },
  {
    id: 2,
    paymentCode: 'PTT-2025-000002',
    ticketCode: 'PTT-2025-000002',
    customer: 'Phạm Văn A',
    licensePlate: '25A-123456',
    totalAmount: 2000000,
    totalDebt: 10000000
  },
  {
    id: 3,
    paymentCode: 'PTT-2025-000003',
    ticketCode: 'PTT-2025-000003',
    customer: 'Phạm Văn A',
    licensePlate: '25A-123456',
    totalAmount: 2000000,
    totalDebt: 10000000
  },
  {
    id: 4,
    paymentCode: 'PTT-2025-000004',
    ticketCode: 'PTT-2025-000004',
    customer: 'Phạm Văn A',
    licensePlate: '25A-123456',
    totalAmount: 2000000,
    totalDebt: 10000000
  },
  {
    id: 5,
    paymentCode: 'PTT-2025-000005',
    ticketCode: 'PTT-2025-000005',
    customer: 'Nguyễn Văn B',
    licensePlate: '30A-789012',
    totalAmount: 5000000,
    totalDebt: 15000000
  }
]

export function AccountancePaymentsContent() {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    return paymentsData
      .filter((item) => {
        const matchesQuery =
          !query ||
          item.paymentCode.toLowerCase().includes(query.toLowerCase()) ||
          item.ticketCode.toLowerCase().includes(query.toLowerCase()) ||
          item.customer.toLowerCase().includes(query.toLowerCase()) ||
          item.licensePlate.toLowerCase().includes(query.toLowerCase())
        return matchesQuery
      })
      .map((item, index) => ({ ...item, key: item.id, index }))
  }, [query])

  const columns = [
    {
      title: 'Mã thanh toán',
      dataIndex: 'paymentCode',
      key: 'paymentCode',
      width: 180,
      render: (text) => <span style={{ fontWeight: 600 }}>{text}</span>
    },
    {
      title: 'Mã phiếu',
      dataIndex: 'ticketCode',
      key: 'ticketCode',
      width: 180,
      render: (text) => <span style={{ fontWeight: 600 }}>{text}</span>
    },
    {
      title: 'Khách Hàng',
      dataIndex: 'customer',
      key: 'customer',
      width: 200
    },
    {
      title: 'Biển Số Xe',
      dataIndex: 'licensePlate',
      key: 'licensePlate',
      width: 150
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 150,
      align: 'right',
      render: (value) => value.toLocaleString('vi-VN')
    },
    {
      title: 'Tổng nợ',
      dataIndex: 'totalDebt',
      key: 'totalDebt',
      width: 150,
      align: 'right',
      render: (value) => value.toLocaleString('vi-VN')
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 100,
      align: 'center',
      render: () => (
        <Button
          type="text"
          danger
          icon={<CloseOutlined />}
          style={{ padding: 0, width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        />
      )
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
            pagination={{
              pageSize: 10,
              current: 1,
              total: filtered.length,
              showTotal: (total) => `0 of ${total} row(s) selected.`,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50', '100']
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

