import React, { useState } from 'react'
import { Table, Input, Space, Button, DatePicker, Tag } from 'antd'
import { SearchOutlined, CalendarOutlined, DownOutlined, UpOutlined, InboxOutlined } from '@ant-design/icons'
import WarehouseLayout from '../../layouts/WarehouseLayout'
import { goldTableHeader } from '../../utils/tableComponents'
import '../../styles/pages/warehouse/export-list.css'
import '../../styles/pages/warehouse/import-list.css'

const { Search } = Input

export default function ImportList() {
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState(null)
  const [statusFilter, setStatusFilter] = useState('Chờ')
  const [expandedRowKeys, setExpandedRowKeys] = useState(['1'])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const importList = [
    {
      id: 1,
      code: 'PR-2025-000001',
      licensePlate: '30A-12345',
      createDate: '2025-11-10',
      totalValue: '1.900.000',
      status: 'Chờ',
      parts: [
        {
          id: 1,
          name: 'Lọc nhiên liệu',
          quantity: 1,
          amount: '1.000.000',
          note: '---',
          status: 'Nhập kho'
        },
        {
          id: 2,
          name: 'Chụp bụi, gioăng cao su',
          quantity: 1,
          amount: '900.000',
          note: '---',
          status: 'Nhập kho'
        }
      ]
    },
    {
      id: 2,
      code: 'PR-2025-000002',
      licensePlate: '30A-12345',
      createDate: '2025-11-11',
      totalValue: '2.000.000',
      status: 'Chờ',
      parts: [
        {
          id: 1,
          name: 'Dầu máy 5W-30',
          quantity: 2,
          amount: '2.000.000',
          note: '---',
          status: 'Chờ nhập'
        }
      ]
    },
    {
      id: 3,
      code: 'PR-2025-000003',
      licensePlate: '30A-67890',
      createDate: '2025-11-11',
      totalValue: '2.000.000',
      status: 'Đã nhập',
      parts: []
    }
  ]

  const getStatusConfig = (status) => {
    if (status === 'Đã nhập') {
      return {
        color: '#22c55e',
        bgColor: '#f6ffed',
        borderColor: '#b7eb8f',
        text: 'Đã nhập'
      }
    }
    if (status === 'Chờ') {
      return {
        color: '#d97706',
        bgColor: '#fff7eb',
        borderColor: '#ffd8a8',
        text: 'Chờ'
      }
    }
    return {
      color: '#666',
      bgColor: '#fafafa',
      borderColor: '#d9d9d9',
      text: status
    }
  }

  const filteredData = importList
    .filter(item => {
      const matchesSearch =
        !searchTerm ||
        item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.licensePlate.toLowerCase().includes(searchTerm.toLowerCase())

      let matchesDate = true
      if (dateFilter) {
        const filterDate = dateFilter.format('YYYY-MM-DD')
        matchesDate = item.createDate === filterDate
      }

      const matchesStatus = statusFilter === 'Tất cả' || item.status === statusFilter

      return matchesSearch && matchesDate && matchesStatus
    })
    .map((item, index) => ({ ...item, key: item.id, index: index + 1 }))

  const columns = [
    {
      title: 'STT',
      dataIndex: 'index',
      key: 'index',
      width: 80,
      render: (_, __, index) => (
        <span style={{ fontWeight: 600, color: '#111' }}>
          {String(index + 1).padStart(2, '0')}
        </span>
      )
    },
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      width: 180,
      render: (text) => (
        <span style={{ fontWeight: 600, color: '#CBB081' }}>{text}</span>
      )
    },
    {
      title: 'Biển số xe',
      dataIndex: 'licensePlate',
      key: 'licensePlate',
      width: 150,
      render: (text) => (
        <span style={{ fontWeight: 500, color: '#111' }}>{text}</span>
      )
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createDate',
      key: 'createDate',
      width: 150
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'totalValue',
      key: 'totalValue',
      width: 150,
      render: (text) => (
        <span style={{ fontWeight: 600, color: '#111' }}>
          {text}
        </span>
      )
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status) => {
        const config = getStatusConfig(status)
        return (
          <Tag
            style={{
              color: config.color,
              backgroundColor: config.bgColor,
              borderColor: config.borderColor,
              border: '1px solid',
              borderRadius: '6px',
              padding: '4px 12px',
              fontWeight: 500,
              fontSize: '14px',
              margin: 0
            }}
          >
            {config.text}
          </Tag>
        )
      }
    }
  ]

  const expandedRowRender = (record) => {
    const partsColumns = [
      {
        title: 'STT',
        key: 'index',
        width: 80,
        render: (_, __, index) => (
          <span style={{ fontWeight: 600, color: '#666' }}>
            {String(index + 1).padStart(2, '0')}
          </span>
        )
      },
      {
        title: 'Linh kiện',
        dataIndex: 'name',
        key: 'name',
        width: 300,
        render: (text) => (
          <span style={{ fontWeight: 500, color: '#111' }}>{text}</span>
        )
      },
      {
        title: 'Số lượng',
        dataIndex: 'quantity',
        key: 'quantity',
        width: 120,
        align: 'center',
        render: (value) => (
          <span style={{ fontWeight: 600, color: '#666' }}>
            {String(value).padStart(2, '0')}
          </span>
        )
      },
      {
        title: 'Tổng tiền',
        dataIndex: 'amount',
        key: 'amount',
        width: 150,
        render: (text) => (
          <span style={{ fontWeight: 600, color: '#111' }}>{text}</span>
        )
      },
      {
        title: 'Chú thích',
        dataIndex: 'note',
        key: 'note',
        width: 200,
        render: (text) => (
          <span style={{ color: '#666' }}>{text}</span>
        )
      },
      {
        title: 'Trạng thái',
        dataIndex: 'status',
        key: 'status',
        width: 140,
        render: (status) => (
          <Button
            size="small"
            style={{
              background: status === 'Nhập kho' ? '#CBB081' : '#fff',
              borderColor: '#CBB081',
              color: status === 'Nhập kho' ? '#111' : '#CBB081',
              fontWeight: 600,
              borderRadius: '6px',
              height: '32px'
            }}
          >
            {status}
          </Button>
        )
      }
    ]

    return (
      <div style={{
        background: 'linear-gradient(to bottom, #fafafa 0%, #fff 100%)',
        padding: '20px 24px',
        margin: '12px 0',
        borderRadius: '10px',
        border: '1px solid #e5e7eb',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '16px',
          paddingBottom: '12px',
          borderBottom: '2px solid #f0f0f0'
        }}>
          <InboxOutlined style={{ color: '#CBB081', fontSize: '16px' }} />
          <span style={{
            fontWeight: 600,
            fontSize: '15px',
            color: '#111'
          }}>
            Danh sách linh kiện ({record.parts?.length || 0})
          </span>
        </div>
        <Table
          columns={partsColumns}
          dataSource={record.parts || []}
          pagination={false}
          size="middle"
          components={goldTableHeader}
          rowKey="id"
          style={{ background: '#fff' }}
          rowClassName={(part, index) =>
            index % 2 === 0 ? 'parts-row-even' : 'parts-row-odd'
          }
        />
      </div>
    )
  }

  return (
    <WarehouseLayout>
      <div style={{ padding: '24px', background: '#ffffff', minHeight: '100vh' }}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, marginBottom: '20px' }}>
            Yêu cầu nhập hàng
          </h1>

          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
            <Search
              placeholder="Tìm kiếm"
              allowClear
              prefix={<SearchOutlined />}
              style={{ width: 250 }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onSearch={setSearchTerm}
            />

            <DatePicker
              placeholder="Ngày tạo"
              format="YYYY-MM-DD"
              suffixIcon={<CalendarOutlined />}
              value={dateFilter}
              onChange={setDateFilter}
              style={{ width: 150 }}
            />

            <Space>
              <Button
                type={statusFilter === 'Chờ' ? 'primary' : 'default'}
                onClick={() => setStatusFilter('Chờ')}
                style={{
                  background: statusFilter === 'Chờ' ? '#CBB081' : '#fff',
                  borderColor: statusFilter === 'Chờ' ? '#CBB081' : '#e6e6e6',
                  color: statusFilter === 'Chờ' ? '#111' : '#666',
                  fontWeight: 600
                }}
              >
                Chờ
              </Button>
              <Button
                type={statusFilter === 'Đã nhập' ? 'primary' : 'default'}
                onClick={() => setStatusFilter('Đã nhập')}
                style={{
                  background: statusFilter === 'Đã nhập' ? '#CBB081' : '#fff',
                  borderColor: statusFilter === 'Đã nhập' ? '#CBB081' : '#e6e6e6',
                  color: statusFilter === 'Đã nhập' ? '#111' : '#666',
                  fontWeight: 600
                }}
              >
                Đã nhập
              </Button>
              <Button
                type={statusFilter === 'Tất cả' ? 'primary' : 'default'}
                onClick={() => setStatusFilter('Tất cả')}
                style={{
                  background: statusFilter === 'Tất cả' ? '#CBB081' : '#fff',
                  borderColor: statusFilter === 'Tất cả' ? '#CBB081' : '#e6e6e6',
                  color: statusFilter === 'Tất cả' ? '#111' : '#666',
                  fontWeight: 600
                }}
              >
                Tất cả
              </Button>
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
            columns={columns}
            dataSource={filteredData}
            rowClassName={(record, index) => {
              const isExpanded = expandedRowKeys.includes(record.key?.toString())
              const baseClass = index % 2 === 0 ? 'table-row-even' : 'table-row-odd'
              return isExpanded ? `${baseClass} table-row-expanded` : baseClass
            }}
            expandable={{
              expandedRowRender,
              expandedRowKeys,
              onExpandedRowsChange: setExpandedRowKeys,
              expandIcon: ({ expanded, onExpand, record }) => (
                <Button
                  type='text'
                  icon={expanded ? <UpOutlined /> : <DownOutlined />}
                  onClick={(e) => onExpand(record, e)}
                  style={{
                    padding: '4px 8px',
                    width: 'auto',
                    height: 'auto',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: expanded ? '#CBB081' : '#666',
                    fontSize: '16px',
                    fontWeight: 600
                  }}
                />
              ),
              indentSize: 0,
              expandRowByClick: false
            }}
            pagination={{
              current: page,
              pageSize,
              total: filteredData.length,
              showSizeChanger: true,
              showTotal: (total) => `0 of ${total} row(s) selected.`,
              pageSizeOptions: ['10', '20', '50', '100'],
              onChange: (current, size) => {
                setPage(current)
                setPageSize(size)
              },
              onShowSizeChange: (current, size) => {
                setPage(1)
                setPageSize(size)
              }
            }}
            size="middle"
            components={goldTableHeader}
          />
        </div>
      </div>
    </WarehouseLayout>
  )
}
