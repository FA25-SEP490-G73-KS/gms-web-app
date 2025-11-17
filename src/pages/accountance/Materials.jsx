import React, { useMemo, useState } from 'react'
import { Table, Input, Button, Tag, Space } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import AccountanceLayout from '../../layouts/AccountanceLayout'
import { goldTableHeader } from '../../utils/tableComponents'
import '../../styles/pages/accountance/materials.css'

const STATUS_STEPS = ['Chờ xử lý', 'Chờ xác nhận', 'Đã thanh toán']

const materialsData = [
  {
    id: 1,
    code: 'STK-2025-000001',
    model: 'Mazda-v3',
    importer: 'DT Huỳnh - 190',
    total: 1_200_000,
    status: 'Chờ xử lý',
    details: [
      { id: 1, name: 'Lọc nhiên liệu', supplier: '01', price: 700_000, quantity: 1, total: 700_000, status: 'Chờ xác nhận' },
      { id: 2, name: 'Chụp bụi, gioăng cao su', supplier: '01', price: 500_000, quantity: 1, total: 500_000, status: 'Chờ xác nhận' }
    ]
  },
  {
    id: 2,
    code: 'STK-2025-000002',
    model: 'Mazda-v3',
    importer: 'DT Huỳnh - 190',
    total: 1_200_000,
    status: 'Chờ xử lý',
    details: []
  },
  {
    id: 3,
    code: 'STK-2025-000003',
    model: 'Mazda-v3',
    importer: 'DT Huỳnh - 190',
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
    {
      title: '',
      key: 'action',
      width: 60,
      render: (_, record) => (
        <Button type="text" onClick={() => setExpandedRowKeys([record.key.toString()])}>
          <i className="bi bi-eye" />
        </Button>
      )
    }
  ]

  const expandedRowRender = (record) => {
    const columns = [
      { title: 'STT', dataIndex: 'id', key: 'id', width: 70 },
      { title: 'Linh kiện', dataIndex: 'name', key: 'name', width: 200 },
      { title: 'NCC', dataIndex: 'supplier', key: 'supplier', width: 120 },
      { title: 'Đơn giá', dataIndex: 'price', key: 'price', width: 120, render: (value) => value.toLocaleString('vi-VN') },
      { title: 'Số lượng', dataIndex: 'quantity', key: 'quantity', width: 120 },
      { title: 'Thành tiền', dataIndex: 'total', key: 'total', width: 140, render: (value) => value.toLocaleString('vi-VN') },
      {
        title: 'Xác nhận thanh toán',
        dataIndex: 'status',
        key: 'payment',
        width: 200,
        render: (value) => (
          <Space>
            <input type="checkbox" />
            <span>{value}</span>
          </Space>
        )
      }
    ]

    return (
      <div className="materials-nested">
        <Table
          columns={columns}
          dataSource={record.details.map((item) => ({ ...item, key: item.id }))}
          pagination={false}
          components={goldTableHeader}
        />
      </div>
    )
  }

  return (
    <AccountanceLayout>
      <div className="materials-page">
        <div className="materials-header">
          <h1>Tiền vật tư</h1>
        </div>

        <div className="materials-filters">
          <Input
            prefix={<SearchOutlined />}
            placeholder="Tìm kiếm"
            allowClear
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="materials-search"
          />
          <Space>
            {statusButtons.map((btn) => (
              <Button
                key={btn.key}
                type={status === btn.key ? 'primary' : 'default'}
                onClick={() => setStatus(btn.key)}
                className={status === btn.key ? 'status-btn active' : 'status-btn'}
              >
                {btn.label}
              </Button>
            ))}
          </Space>
        </div>

        <div className="materials-table-card">
          <Table
            className="materials-table"
            columns={mainColumns}
            dataSource={filtered}
            expandable={{
              expandedRowRender,
              expandedRowKeys,
              onExpandedRowsChange: (keys) => setExpandedRowKeys(keys)
            }}
            pagination={{
              pageSize: 10,
              current: 1,
              total: filtered.length,
              showTotal: (total) => `0 of ${total} row(s) selected.`
            }}
            components={goldTableHeader}
          />
        </div>
      </div>
    </AccountanceLayout>
  )
}

