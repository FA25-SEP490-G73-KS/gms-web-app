import React, { useState, useEffect } from 'react'
import { Table, Input, Space, Button, DatePicker, Tag, Card, Divider, message } from 'antd'
import { SearchOutlined, CalendarOutlined, DownOutlined, UpOutlined, InboxOutlined } from '@ant-design/icons'
import WarehouseLayout from '../../layouts/WarehouseLayout'
import { goldTableHeader } from '../../utils/tableComponents'
import { stockExportAPI } from '../../services/api'
import '../../styles/pages/warehouse/export-list.css'

const { Search } = Input

export default function ExportList() {
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState(null)
  // Mặc định hiển thị tất cả trạng thái
  const [statusFilter, setStatusFilter] = useState('Tất cả')
  const [expandedRowKeys, setExpandedRowKeys] = useState([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [exportList, setExportList] = useState([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)

  // Fetch data from API
  useEffect(() => {
    fetchExportList()
  }, [page, pageSize])

  const fetchExportList = async () => {
    setLoading(true)
    try {
      const { data, error } = await stockExportAPI.getAll(page - 1, pageSize)
      
      if (error) {
        message.error('Không thể tải danh sách xuất kho')
        setLoading(false)
        return
      }

      const result = data?.result || {}
      const content = result.content || []
      
      // Transform API data to match UI structure
      const transformedData = content.map((item) => ({
        id: item.priceQuotationId || item.id,
        // Hiển thị mã báo giá từ API thay vì N/A
        code: item.priceQuotationCode || item.code || 'N/A',
        customer: item.customerName || 'N/A',
        licensePlate: item.licensePlate || 'N/A',
        createDate: item.createdAt ? new Date(item.createdAt).toLocaleDateString('vi-VN') : 'N/A',
        status: mapExportStatus(item.exportStatus),
        parts: [] // Will be loaded on expand if needed
      }))

      setExportList(transformedData)
      setTotal(result.totalElements || 0)
    } catch (err) {
      console.error('Failed to fetch export list:', err)
      message.error('Đã xảy ra lỗi khi tải dữ liệu')
    } finally {
      setLoading(false)
    }
  }

  const mapExportStatus = (status) => {
    const statusMap = {
      'WAITING_PURCHASE': 'Chờ mua hàng',
      'COMPLETED': 'Hoàn thành',
      'EXPORTING': 'Đang xuất hàng'
    }
    return statusMap[status] || status
  }

  const getStatusConfig = (status) => {
    if (status === 'Hoàn thành') {
      return { 
        color: '#22c55e', 
        bgColor: '#f6ffed',
        borderColor: '#b7eb8f',
        text: status 
      }
    }
    if (status === 'Đang xuất hàng') {
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

  const handleExportItem = (recordId, partId) => {
    console.log('Export item:', recordId, partId)
    // Handle export logic here
  }

  const toggleExpandRow = (record) => {
    const key = record.key ?? record.id
    setExpandedRowKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
  }

  // Filter data
  const filteredData = exportList
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
    },
    {
      title: '',
      key: 'expand',
      width: 60,
      align: 'right',
      render: (_, record) => {
        const key = record.key ?? record.id
        const isExpanded = expandedRowKeys.includes(key)
        return (
          <Button
            type="text"
            icon={isExpanded ? <UpOutlined /> : <DownOutlined />}
            onClick={() => toggleExpandRow(record)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          />
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
        width: 250,
        render: (text) => (
          <span style={{ fontWeight: 500, color: '#111' }}>{text}</span>
        )
      },
      {
        title: 'Cần',
        dataIndex: 'needed',
        key: 'needed',
        width: 100,
        align: 'center',
        render: (value) => (
          <span style={{ fontWeight: 600, color: '#1677ff' }}>{value}</span>
        )
      },
      {
        title: 'Tồn kho',
        dataIndex: 'inStock',
        key: 'inStock',
        width: 100,
        align: 'center',
        render: (value) => (
          <span style={{ 
            fontWeight: 600, 
            color: value > 0 ? '#22c55e' : '#ef4444' 
          }}>
            {value}
          </span>
        )
      },
      {
        title: 'Đã xuất',
        dataIndex: 'exported',
        key: 'exported',
        width: 100,
        align: 'center',
        render: (value) => (
          <span style={{ fontWeight: 600, color: '#666' }}>{value}</span>
        )
      },
      {
        title: 'Hành động',
        key: 'action',
        width: 150,
        render: (_, part) => (
          <Button
            type="primary"
            size="small"
            icon={<InboxOutlined />}
            onClick={() => handleExportItem(record.id, part.id)}
            style={{ 
              background: '#3b82f6', 
              borderColor: '#3b82f6',
              fontWeight: 500,
              borderRadius: '6px',
              height: '32px'
            }}
          >
            Xuất hàng
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
          <InboxOutlined style={{ color: '#1677ff', fontSize: '16px' }} />
          <span style={{ 
            fontWeight: 600, 
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
      <div style={{ padding: '24px', minHeight: '100vh' }}>
        <div style={{ marginBottom: '24px' }}>
          <h1 className="h4" style={{ fontWeight: 700, margin: 0, marginBottom: '20px' }}>
            Danh sách xuất
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
              const isExpanded = expandedRowKeys.includes(record.key)
              const baseClass = index % 2 === 0 ? 'table-row-even' : 'table-row-odd'
              return isExpanded ? `${baseClass} table-row-expanded` : baseClass
            }}
            expandable={{
              expandedRowRender,
              expandedRowKeys,
              onExpandedRowsChange: setExpandedRowKeys,
              expandIcon: () => null,
              indentSize: 0,
              expandRowByClick: false
            }}
            pagination={{
              current: page,
              pageSize: pageSize,
              total: total,
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
            loading={loading}
            size="middle"
            components={goldTableHeader}
          />
        </div>
      </div>
    </WarehouseLayout>
  )
}
