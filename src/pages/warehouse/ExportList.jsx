import React, { useState, useEffect } from 'react'
import { Table, Input, Space, Button, Tag, message, Dropdown, Modal, DatePicker } from 'antd'
import { SearchOutlined, FilterOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import WarehouseLayout from '../../layouts/WarehouseLayout'
import { goldTableHeader } from '../../utils/tableComponents'
import { stockExportAPI } from '../../services/api'
import '../../styles/pages/warehouse/export-list.css'

const { Search } = Input
const { RangePicker } = DatePicker

// Custom styles for table header
const customTableStyles = `
  .export-list-table .ant-table-thead > tr > th {
    background: #CBB081 !important;
    color: #111 !important;
    font-weight: 700 !important;
    font-size: 15px !important;
    border: none !important;
    padding: 14px 16px !important;
  }
  
  .export-list-table .ant-table-thead > tr > th::before {
    display: none !important;
  }
  
  .export-list-table .ant-table-tbody > tr > td {
    padding: 12px 16px !important;
    font-size: 14px !important;
  }
  
  .export-list-table .ant-table-row {
    border-bottom: 1px solid #f0f0f0;
  }
`


export default function ExportList() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('Tất cả')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [exportList, setExportList] = useState([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)
  const [dateRange, setDateRange] = useState([null, null])

  // Fetch data from API
  useEffect(() => {
    fetchExportList()
  }, [page, pageSize, searchTerm, statusFilter, dateRange])

  const getStatusParam = (filter) => {
    const statusMap = {
      'Đang xuất hàng': 'EXPORTING',
      'Chờ mua hàng': 'WAITING_PURCHASE',
      'Hoàn thành': 'COMPLETED',
      'Tất cả': null
    }
    return statusMap[filter]
  }

  const fetchExportList = async () => {
    setLoading(true)
    try {
      const status = getStatusParam(statusFilter)
      const fromDate = dateRange[0] ? dateRange[0].format('YYYY-MM-DD') : null
      const toDate = dateRange[1] ? dateRange[1].format('YYYY-MM-DD') : null
      
      const { data, error } = await stockExportAPI.getAll(
        page - 1, 
        pageSize,
        searchTerm || null,
        status,
        fromDate,
        toDate
      )
      
      if (error) {
        message.error('Không thể tải danh sách xuất kho')
        setLoading(false)
        return
      }

      const result = data?.result || {}
      const content = result.content || []
      
      // Transform API data to match UI structure
      const transformedData = content.map((item) => ({
        id: item.id,
        exportCode: item.code || 'XK-000001',
        exportType: item.reason || 'Theo báo giá',
        createDate: item.createdAt ? new Date(item.createdAt).toLocaleDateString('vi-VN') : 'N/A',
        quotationCode: item.quotationCode || 'BG-000001',
        requester: item.createdBy || 'Nguyễn Văn A',
        status: mapExportStatus(item.status),
        statusKey: item.status
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
      'EXPORTING': 'Đang xuất hàng',
      'PENDING': 'Chờ xử lý',
      'APPROVED': 'Đang xuất hàng',
      'REJECTED': 'Từ chối'
    }
    return statusMap[status] || 'Chờ xử lý'
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
        color: '#f59e0b', 
        bgColor: '#fef3c7',
        borderColor: '#fcd34d',
        text: status 
      }
    }
    if (status === 'Chờ mua hàng') {
      return { 
        color: '#f59e0b', 
        bgColor: '#fef3c7',
        borderColor: '#fcd34d',
        text: status 
      }
    }
    if (status === 'Chờ xử lý') {
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

  const handleViewDetail = (record) => {
    navigate(`/warehouse/export/list/${record.id}`)
  }

  // Map data for table display
  const tableData = exportList.map((item, index) => ({ 
    ...item, 
    key: item.id, 
    index: index + 1 
  }))

  // Main table columns
  const columns = [
    {
      title: 'Mã phiếu',
      dataIndex: 'exportCode',
      key: 'exportCode',
      width: 150,
      render: (text) => (
        <span style={{ fontWeight: 600, color: '#111' }}>{text}</span>
      )
    },
    {
      title: 'Loại xuất',
      dataIndex: 'exportType',
      key: 'exportType',
      width: 200,
      render: (text) => (
        <span style={{ fontWeight: 500, color: '#111' }}>{text}</span>
      )
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createDate',
      key: 'createDate',
      width: 150,
      render: (text) => (
        <span style={{ fontWeight: 500, color: '#111' }}>{text}</span>
      )
    },
    {
      title: 'Mã báo giá',
      dataIndex: 'quotationCode',
      key: 'quotationCode',
      width: 180,
      render: (text) => (
        <span style={{ fontWeight: 600, color: '#111' }}>{text}</span>
      )
    },
    {
      title: 'Người yêu cầu',
      dataIndex: 'requester',
      key: 'requester',
      width: 200,
      render: (text) => (
        <span style={{ fontWeight: 500, color: '#111' }}>{text}</span>
      )
    },
    {
      title: 'Trạng thái',
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
      key: 'action',
      width: 60,
      align: 'center',
      render: (_, record) => {
        const menuItems = [
          {
            key: 'detail',
            label: (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="bi bi-eye" />
                Xem chi tiết
              </span>
            ),
            onClick: () => handleViewDetail(record)
          }
        ]

        return (
          <Dropdown
            menu={{ items: menuItems }}
            trigger={['click']}
            placement="bottomRight"
          >
            <Button
              type="text"
              icon={<i className="bi bi-three-dots-vertical" style={{ fontSize: '16px' }} />}
              style={{
                padding: '0 8px',
                height: 'auto',
                color: '#666'
              }}
            />
          </Dropdown>
        )
      }
    }
  ]

  return (
    <WarehouseLayout>
      <style>{customTableStyles}</style>
      
      <div style={{ padding: '24px', minHeight: '100vh' }}>
        <div style={{ marginBottom: '24px' }}>

          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            gap: '16px'
          }}>
            {/* Search bên trái */}
            <Input
              placeholder="Tìm kiếm"
              prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
              style={{ width: 250, borderRadius: '8px' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            {/* Filter buttons bên phải */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <Button
                type={statusFilter === 'Đang xuất hàng' ? 'primary' : 'default'}
                onClick={() => setStatusFilter('Đang xuất hàng')}
                style={{
                  borderRadius: '8px',
                  fontWeight: 600,
                  background: statusFilter === 'Đang xuất hàng' ? '#CBB081' : '#fff',
                  borderColor: statusFilter === 'Đang xuất hàng' ? '#CBB081' : '#e6e6e6',
                  color: statusFilter === 'Đang xuất hàng' ? '#111' : '#666'
                }}
              >
                Đang xuất hàng
              </Button>
              <Button
                type={statusFilter === 'Chờ mua hàng' ? 'primary' : 'default'}
                onClick={() => setStatusFilter('Chờ mua hàng')}
                style={{
                  borderRadius: '8px',
                  fontWeight: 600,
                  background: statusFilter === 'Chờ mua hàng' ? '#CBB081' : '#fff',
                  borderColor: statusFilter === 'Chờ mua hàng' ? '#CBB081' : '#e6e6e6',
                  color: statusFilter === 'Chờ mua hàng' ? '#111' : '#666'
                }}
              >
                Chờ mua hàng
              </Button>
              <Button
                type={statusFilter === 'Hoàn thành' ? 'primary' : 'default'}
                onClick={() => setStatusFilter('Hoàn thành')}
                style={{
                  borderRadius: '8px',
                  fontWeight: 600,
                  background: statusFilter === 'Hoàn thành' ? '#CBB081' : '#fff',
                  borderColor: statusFilter === 'Hoàn thành' ? '#CBB081' : '#e6e6e6',
                  color: statusFilter === 'Hoàn thành' ? '#111' : '#666'
                }}
              >
                Hoàn thành
              </Button>
              <Button
                type={statusFilter === 'Tất cả' ? 'primary' : 'default'}
                onClick={() => setStatusFilter('Tất cả')}
                style={{
                  borderRadius: '8px',
                  fontWeight: 600,
                  background: statusFilter === 'Tất cả' ? '#CBB081' : '#fff',
                  borderColor: statusFilter === 'Tất cả' ? '#CBB081' : '#e6e6e6',
                  color: statusFilter === 'Tất cả' ? '#111' : '#666'
                }}
              >
                Tất cả
              </Button>

              {/* Filter icon button */}
              <Button
                icon={<FilterOutlined />}
                onClick={() => setIsFilterModalOpen(true)}
                style={{
                  borderRadius: '8px',
                  borderColor: '#e6e6e6'
                }}
              />
            </div>
          </div>
        </div>

        <div style={{ 
          background: '#fff', 
          borderRadius: '12px', 
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <Table
            className="export-list-table"
            columns={columns}
            dataSource={tableData}
            rowClassName={(record, index) => 
              index % 2 === 0 ? 'table-row-even' : 'table-row-odd'
            }
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

      {/* Filter Modal */}
      <Modal
        title="Bộ lọc"
        open={isFilterModalOpen}
        onCancel={() => setIsFilterModalOpen(false)}
        width={700}
        footer={
          <div style={{ textAlign: 'right' }}>
            <Button
              type="primary"
              onClick={() => {
                setIsFilterModalOpen(false)
                // Date range already set, will trigger useEffect to fetch data
              }}
              style={{
                background: '#1677ff',
                borderColor: '#1677ff',
                borderRadius: '6px',
                padding: '8px 24px',
                height: 'auto'
              }}
            >
              Tìm kiếm
            </Button>
          </div>
        }
      >
        <div style={{ padding: '20px 0' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: 16 }}>
            Khoảng ngày tạo
          </h3>
          
          <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: 8, fontSize: '14px' }}>
                Từ ngày
              </label>
              <DatePicker
                placeholder=""
                value={dateRange[0]}
                style={{ width: '100%', borderRadius: '6px' }}
                onChange={(date) => {
                  setDateRange([date, dateRange[1]])
                }}
              />
            </div>
            
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: 8, fontSize: '14px' }}>
                Đến ngày
              </label>
              <DatePicker
                placeholder=""
                value={dateRange[1]}
                style={{ width: '100%', borderRadius: '6px' }}
                onChange={(date) => {
                  setDateRange([dateRange[0], date])
                }}
              />
            </div>
          </div>
        </div>
      </Modal>
    </WarehouseLayout>
  )
}
