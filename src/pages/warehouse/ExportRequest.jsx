import React, { useState } from 'react'
import { Table, Input, Space, Button, DatePicker, Tag } from 'antd'
import { SearchOutlined, CalendarOutlined, DownOutlined, UpOutlined, InboxOutlined } from '@ant-design/icons'
import WarehouseLayout from '../../layouts/WarehouseLayout'
import { goldTableHeader } from '../../utils/tableComponents'
import '../../styles/pages/warehouse/export-list.css'

const { Search } = Input

export default function ExportRequest() {
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState(null)
  const [statusFilter, setStatusFilter] = useState('Đang xuất hàng')
  const [expandedRowKeys, setExpandedRowKeys] = useState(['1'])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  // Sample data with nested parts
  const exportRequests = [
    {
      id: 1,
      code: 'STK-2025-000001',
      customer: 'Nguyễn Văn',
      licensePlate: '30A-12345',
      createDate: '30/10/2025',
      status: 'Chờ xác nhận',
      parts: [
        {
          id: 1,
          name: 'Dầu máy 5W-30',
          quantity: 1
        },
        {
          id: 2,
          name: 'Lọc nhiên liệu',
          quantity: 1
        },
        {
          id: 3,
          name: 'Chụp bụi, gioăng cao su',
          quantity: 1
        }
      ]
    },
    {
      id: 2,
      code: 'STK-2025-000002',
      customer: 'Mazda-v3',
      licensePlate: 'DT Huyền - 190',
      createDate: '30/10/2025',
      status: 'Chờ xác nhận',
      parts: [
        {
          id: 1,
          name: 'Dầu máy 5W-30',
          quantity: 1
        }
      ]
    },
    {
      id: 3,
      code: 'STK-2025-000003',
      customer: 'Trần Văn B',
      licensePlate: '29A-67890',
      createDate: '29/10/2025',
      status: 'Xác nhận',
      parts: []
    },
    {
      id: 4,
      code: 'STK-2025-000004',
      customer: 'Lê Văn C',
      licensePlate: '51A-11111',
      createDate: '29/10/2025',
      status: 'Xác nhận',
      parts: []
    },
    {
      id: 5,
      code: 'STK-2025-000005',
      customer: 'Phạm Văn D',
      licensePlate: '43A-22222',
      createDate: '28/10/2025',
      status: 'Chờ xác nhận',
      parts: []
    },
    {
      id: 6,
      code: 'STK-2025-000006',
      customer: 'Hoàng Văn E',
      licensePlate: '92A-33333',
      createDate: '28/10/2025',
      status: 'Chờ xác nhận',
      parts: []
    }
  ]

  const getStatusConfig = (status) => {
    if (status === 'Xác nhận') {
      return { 
        color: '#22c55e', 
        bgColor: '#f6ffed',
        borderColor: '#b7eb8f',
        text: status 
      }
    }
    if (status === 'Chờ xác nhận') {
      return { 
        color: '#1677ff', 
        bgColor: '#e6f4ff',
        borderColor: '#91caff',
        text: status 
      }
    }
    return { 
      color: '#666', 
      bgColor: '#fafafa',
      borderColor: '#d9d9d9',
      text: status 
    }
  }

  const handleReject = (recordId, partId) => {
    console.log('Reject:', recordId, partId)
    // Handle reject logic here
  }

  const handleConfirm = (recordId, partId) => {
    console.log('Confirm:', recordId, partId)
    // Handle confirm logic here
  }

  // Filter data
  const filteredData = exportRequests
    .filter(item => {
      const matchesSearch = !searchTerm || 
        item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.licensePlate.toLowerCase().includes(searchTerm.toLowerCase())
      
      let matchesDate = true
      if (dateFilter) {
        const filterDate = dateFilter.format('DD/MM/YYYY')
        matchesDate = item.createDate === filterDate
      }
      
      const matchesStatus = statusFilter === 'Tất cả' || item.status === statusFilter
      
      return matchesSearch && matchesDate && matchesStatus
    })
    .map((item, index) => ({ ...item, key: item.id, index: index + 1 }))

  // Main table columns
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
        <span style={{ fontWeight: 600, color: '#1677ff' }}>{text}</span>
      )
    },
    {
      title: 'Khách hàng',
      dataIndex: 'customer',
      key: 'customer',
      width: 200,
      render: (text) => (
        <span style={{ fontWeight: 500, color: '#111' }}>{text}</span>
      )
    },
    {
      title: 'Biển số xe',
      dataIndex: 'licensePlate',
      key: 'licensePlate',
      width: 150,
      render: (text) => (
        <span style={{ fontWeight: 500, color: '#333', fontFamily: 'monospace' }}>
          {text}
        </span>
      )
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createDate',
      key: 'createDate',
      width: 150
    },
    {
      title: 'Trạng Thái',
      dataIndex: 'status',
      key: 'status',
      width: 180,
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

  // Nested table columns for parts
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
        title: 'Hành động',
        key: 'action',
        width: 250,
        render: (_, part) => (
          <Space>
            <Button
              size="small"
              onClick={() => handleReject(record.id, part.id)}
              style={{
                background: '#fff',
                borderColor: '#ef4444',
                color: '#ef4444',
                fontWeight: 500,
                borderRadius: '6px',
                height: '32px'
              }}
            >
              Từ chối
            </Button>
            <Button
              type="primary"
              size="small"
              onClick={() => handleConfirm(record.id, part.id)}
              style={{
                background: '#22c55e',
                borderColor: '#22c55e',
                fontWeight: 500,
                borderRadius: '6px',
                height: '32px'
              }}
            >
              Xác nhận
            </Button>
          </Space>
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
          <InboxOutlined style={{ color: '#1677ff', fontSize: '16px' }} />
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
          rowClassName={(record, index) => 
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
            Xác nhận báo giá
          </h1>

          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
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
              format="DD/MM/YYYY"
              suffixIcon={<CalendarOutlined />}
              value={dateFilter}
              onChange={setDateFilter}
              style={{ width: 150 }}
            />

            <Space>
              <Button
                type={statusFilter === 'Đang xuất hàng' ? 'primary' : 'default'}
                onClick={() => setStatusFilter('Đang xuất hàng')}
                style={{
                  background: statusFilter === 'Đang xuất hàng' ? '#CBB081' : '#fff',
                  borderColor: statusFilter === 'Đang xuất hàng' ? '#CBB081' : '#e6e6e6',
                  color: statusFilter === 'Đang xuất hàng' ? '#111' : '#666',
                  fontWeight: 600
                }}
              >
                Đang xuất hàng
              </Button>
              <Button
                type={statusFilter === 'Hoàn thành' ? 'primary' : 'default'}
                onClick={() => setStatusFilter('Hoàn thành')}
                style={{
                  background: statusFilter === 'Hoàn thành' ? '#CBB081' : '#fff',
                  borderColor: statusFilter === 'Hoàn thành' ? '#CBB081' : '#e6e6e6',
                  color: statusFilter === 'Hoàn thành' ? '#111' : '#666',
                  fontWeight: 600
                }}
              >
                Hoàn thành
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
                  type="text"
                  icon={expanded ? <UpOutlined /> : <DownOutlined />}
                  onClick={(e) => onExpand(record, e)}
                  style={{ 
                    padding: '4px 8px',
                    width: 'auto',
                    height: 'auto',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: expanded ? '#1677ff' : '#666',
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
              pageSize: pageSize,
              total: 100,
              showSizeChanger: true,
              showTotal: (total) => `0 of ${total} row(s) selected.`,
              pageSizeOptions: ['10', '20', '50', '100'],
              onChange: (page, pageSize) => {
                setPage(page)
                setPageSize(pageSize)
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
