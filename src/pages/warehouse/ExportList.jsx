import React, { useState, useEffect } from 'react'
import { Table, Input, Space, Button, Tag, message, Dropdown, Modal, DatePicker, Radio, Checkbox } from 'antd'
import { SearchOutlined, FilterOutlined, ReloadOutlined } from '@ant-design/icons'
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
  const [tempStatuses, setTempStatuses] = useState([])
  const [tempDateRange, setTempDateRange] = useState([null, null])

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
      title: 'STT',
      key: 'index',
      width: 80,
      align: 'center',
      render: (_, __, index) => (
        <span style={{ fontWeight: 600, color: '#111' }}>
          {String(index + 1).padStart(2, '0')}
        </span>
      )
    },
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
          {/* Heading */}
          <h1 style={{ margin: 0, marginBottom: 24, fontSize: 24, fontWeight: 600 }}>
            Danh sách xuất kho
          </h1>

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

              {/* Filter icon button */}
              <Button
                icon={<FilterOutlined />}
            onClick={() => {
              // Chuẩn bị giá trị tạm thời cho modal
              setTempStatuses(statusFilter && statusFilter !== 'Tất cả' ? [statusFilter] : [])
              setTempDateRange(dateRange)
              setIsFilterModalOpen(true)
            }}
                style={{
                  borderRadius: '8px',
              borderColor: '#e6e6e6',
              display: 'flex',
              alignItems: 'center',
              gap: 8
                }}
          >
            Bộ lọc
          </Button>
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
        footer={null}
        width={450}
      >
        <div style={{ padding: '8px 0' }}>
          {/* Trạng thái */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Trạng thái</div>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Checkbox
                checked={tempStatuses.includes('Đang xuất hàng')}
                onChange={() => {
                  setTempStatuses((prev) =>
                    prev.includes('Đang xuất hàng') ? [] : ['Đang xuất hàng']
                  )
                }}
              >
                Đang xuất hàng
              </Checkbox>
              <Checkbox
                checked={tempStatuses.includes('Chờ mua hàng')}
                onChange={() => {
                  setTempStatuses((prev) =>
                    prev.includes('Chờ mua hàng') ? [] : ['Chờ mua hàng']
                  )
                }}
              >
                Chờ mua hàng
              </Checkbox>
              <Checkbox
                checked={tempStatuses.includes('Hoàn thành')}
                onChange={() => {
                  setTempStatuses((prev) =>
                    prev.includes('Hoàn thành') ? [] : ['Hoàn thành']
                  )
              }}
            >
                Hoàn thành
              </Checkbox>
            </Space>
          </div>

          {/* Khoảng ngày tạo */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Khoảng ngày tạo</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <div style={{ fontSize: 13, marginBottom: 4 }}>Từ ngày</div>
              <DatePicker
                  placeholder="dd/mm/yyyy"
                  style={{ width: '100%', borderRadius: 6 }}
                  format="DD/MM/YYYY"
                  value={tempDateRange[0]}
                onChange={(date) => {
                    setTempDateRange([date, tempDateRange[1]])
                }}
              />
            </div>
              <div>
                <div style={{ fontSize: 13, marginBottom: 4 }}>Đến ngày</div>
              <DatePicker
                  placeholder="dd/mm/yyyy"
                  style={{ width: '100%', borderRadius: 6 }}
                  format="DD/MM/YYYY"
                  value={tempDateRange[1]}
                onChange={(date) => {
                    setTempDateRange([tempDateRange[0], date])
                }}
              />
            </div>
            </div>
          </div>

          {/* Buttons */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 12,
              marginTop: 24
            }}
          >
            <Button
              onClick={() => {
                setTempStatuses([])
                setTempDateRange([null, null])
              }}
            >
              Đặt lại
            </Button>
            <Button
              type="primary"
              onClick={() => {
                // Nếu không chọn trạng thái nào => Tất cả
                const appliedStatus = tempStatuses[0] || 'Tất cả'
                setStatusFilter(appliedStatus)
                setDateRange(tempDateRange)
                setPage(1)
                setIsFilterModalOpen(false)
              }}
              style={{
                backgroundColor: '#1890ff',
                borderColor: '#1890ff'
              }}
            >
              Tìm kiếm
            </Button>
          </div>
        </div>
      </Modal>
    </WarehouseLayout>
  )
}
