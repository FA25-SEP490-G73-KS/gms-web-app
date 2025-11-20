import React, { useMemo, useState } from 'react'
import { Table, Input, Button, Tag, Space } from 'antd'
import { SearchOutlined, RightOutlined, DownOutlined } from '@ant-design/icons'
import AccountanceLayout from '../../layouts/AccountanceLayout'
import { goldTableHeader } from '../../utils/tableComponents'
import '../../styles/pages/accountance/materials.css'

const STATUS_STEPS = ['Chờ xử lý', 'Chờ xác nhận', 'Đã thanh toán']

const materialsData = [
  {
    id: 1,
    code: 'STK-2025-000001',
    model: 'Mazda-v3',
    importer: 'DT Huyền - 190',
    total: 1_200_000,
    status: 'Chờ xử lý',
    details: [
      { id: 1, name: 'Lọc nhiên liệu', supplier: 'Denso', price: 700_000, quantity: 1, total: 700_000, status: 'Chờ xác nhận' },
      { id: 2, name: 'Chụp bụi, gioăng cao su', supplier: 'Denso', price: 500_000, quantity: 1, total: 500_000, status: 'Chờ xác nhận' }
    ]
  },
  {
    id: 2,
    code: 'STK-2025-000002',
    model: 'Mazda-v3',
    importer: 'DT Huyền - 190',
    total: 1_200_000,
    status: 'Chờ xử lý',
    details: []
  },
  {
    id: 3,
    code: 'STK-2025-000003',
    model: 'Mazda-v3',
    importer: 'DT Huyền - 190',
    total: 1_200_000,
    status: 'Đã thanh toán',
    details: []
  },
  {
    id: 4,
    code: 'STK-2025-000004',
    model: 'Mazda-v3',
    importer: 'DT Huyền - 190',
    total: 1_200_000,
    status: 'Chờ xử lý',
    details: []
  },
  {
    id: 5,
    code: 'STK-2025-000005',
    model: 'Mazda-v3',
    importer: 'DT Huyền - 190',
    total: 1_200_000,
    status: 'Chờ xử lý',
    details: []
  },
  {
    id: 6,
    code: 'STK-2025-000006',
    model: 'Mazda-v3',
    importer: 'DT Huyền - 190',
    total: 1_200_000,
    status: 'Đã thanh toán',
    details: []
  }
]

const statusButtons = [
  { key: 'processing', label: 'Chờ xử lý' },
  { key: 'paid', label: 'Đã thanh toán' },
  { key: 'all', label: 'Tất cả' }
]

export default function Materials() {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('processing')
  const [expandedRowKeys, setExpandedRowKeys] = useState(['1'])

  const filtered = useMemo(() => {
    return materialsData
      .filter((item) => {
        const matchesQuery =
          !query ||
          item.code.toLowerCase().includes(query.toLowerCase()) ||
          item.model.toLowerCase().includes(query.toLowerCase())
        const matchesStatus =
          status === 'all' ||
          (status === 'processing' && item.status !== 'Đã thanh toán') ||
          (status === 'paid' && item.status === 'Đã thanh toán')
        return matchesQuery && matchesStatus
      })
      .map((item, index) => ({ ...item, key: item.id, index }))
  }, [query, status])

  const mainColumns = [
    {
      title: 'STT',
      dataIndex: 'index',
      key: 'index',
      width: 70,
      render: (_, record, index) => (
        <span style={{ fontWeight: 600 }}>{String(index + 1).padStart(2, '0')}</span>
      )
    },
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      width: 180,
      render: (text) => <span style={{ fontWeight: 600 }}>{text}</span>
    },
    {
      title: 'Dòng xe',
      dataIndex: 'model',
      key: 'model',
      width: 180
    },
    {
      title: 'Người nhập hàng',
      dataIndex: 'importer',
      key: 'importer',
      width: 200
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'total',
      key: 'total',
      width: 150,
      render: (value) => value.toLocaleString('vi-VN')
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 160,
      render: (text) => {
        let color = '#b45309'
        if (text === 'Đã thanh toán') color = '#1f8f4d'
        else if (text === 'Chờ xử lý') color = '#3b82f6'
        return (
          <Tag
            style={{
              color,
              background: 'transparent',
              border: 'none',
              fontWeight: 600
            }}
          >
            {text}
          </Tag>
        )
      }
    },
  ]

  const expandedRowRender = (record) => {
    const columns = [
      { 
        title: 'STT', 
        key: 'index', 
        width: 70,
        align: 'center',
        render: (_, __, index) => (
          <span style={{ fontWeight: 600 }}>{String(index + 1).padStart(2, '0')}</span>
        )
      },
      { title: 'Linh kiện', dataIndex: 'name', key: 'name', width: 200 },
      { title: 'Số lượng', dataIndex: 'quantity', key: 'quantity', width: 120, align: 'center' },
      { title: 'NCC', dataIndex: 'supplier', key: 'supplier', width: 120 },
      { title: 'Đơn giá', dataIndex: 'price', key: 'price', width: 120, align: 'right', render: (value) => value.toLocaleString('vi-VN') },
      { title: 'Thành tiền', dataIndex: 'total', key: 'total', width: 140, align: 'right', render: (value) => value.toLocaleString('vi-VN') },
      {
        title: 'Xác nhận thanh toán',
        key: 'payment',
        width: 200,
        render: (_, record) => {
          // Nếu status là "Chờ xác nhận", hiển thị nút "Xác nhận"
          if (record.status === 'Chờ xác nhận') {
            return (
              <Button
                type="primary"
                style={{
                  background: '#22c55e',
                  borderColor: '#22c55e',
                  borderRadius: '6px',
                  fontWeight: 600
                }}
                onClick={() => {
                  console.log('Xác nhận thanh toán:', record)
                }}
              >
                Xác nhận
              </Button>
            )
          }
          // Nếu đã xác nhận, hiển thị tag
          return (
            <Tag
              style={{
                background: '#dcfce7',
                color: '#22c55e',
                borderColor: '#22c55e',
                borderRadius: 999,
                padding: '4px 12px',
                fontWeight: 600
              }}
            >
              Đã xác nhận
            </Tag>
          )
        }
      }
    ]

    return (
      <div className="materials-nested">
        <Table
          columns={columns}
          dataSource={record.details.map((item, index) => ({ ...item, key: item.id, index }))}
          pagination={false}
          components={goldTableHeader}
          rowKey="id"
        />
      </div>
    )
  }

  return (
    <AccountanceLayout>
      <div style={{ padding: '24px', background: '#ffffff', minHeight: '100vh' }}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, marginBottom: '20px' }}>Tiền vật tư</h1>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '20px' }}>
            <Input
              prefix={<SearchOutlined />}
              placeholder="Tìm kiếm"
              allowClear
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ width: 260 }}
            />
            <Space>
              {statusButtons.map((btn) => (
                <Button
                  key={btn.key}
                  type={status === btn.key ? 'primary' : 'default'}
                  onClick={() => setStatus(btn.key)}
                  style={{
                    background: status === btn.key ? '#CBB081' : '#fff',
                    borderColor: status === btn.key ? '#CBB081' : '#e6e6e6',
                    color: status === btn.key ? '#111' : '#666',
                    fontWeight: 600
                  }}
                >
                  {btn.label}
                </Button>
              ))}
            </Space>
          </div>
        </div>

        <div style={{
          background: '#fff',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <Table
            className="materials-table"
            columns={mainColumns}
            dataSource={filtered}
            expandable={{
              expandedRowRender,
              expandedRowKeys,
              onExpandedRowsChange: (keys) => setExpandedRowKeys(keys),
              expandIcon: ({ expanded, onExpand, record }) => (
                <Button
                  type="text"
                  onClick={(e) => onExpand(record, e)}
                  style={{ padding: 0, width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  {expanded ? <DownOutlined /> : <RightOutlined />}
                </Button>
              )
            }}
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
    </AccountanceLayout>
  )
}

