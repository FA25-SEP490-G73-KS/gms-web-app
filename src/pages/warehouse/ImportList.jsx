import React, { useState, useEffect, useMemo } from 'react'
import {
  Table,
  Button,
  Tag,
  Input,
  Dropdown,
  message,
  Modal,
  DatePicker,
  Checkbox,
  Space
} from 'antd'
import { SearchOutlined, FilterOutlined, MoreOutlined, CalendarOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import WarehouseLayout from '../../layouts/WarehouseLayout'
import { goldTableHeader } from '../../utils/tableComponents'
import { stockReceiptAPI, purchaseRequestAPI } from '../../services/api'
import dayjs from 'dayjs'


export default function ImportList() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [importList, setImportList] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [statusFilter, setStatusFilter] = useState('Tất cả')
  const [dateRange, setDateRange] = useState([null, null])
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)
  const [tempStatuses, setTempStatuses] = useState([])
  const [tempDateRange, setTempDateRange] = useState([null, null])


  useEffect(() => {
    fetchImportList()
  }, [page, pageSize, searchTerm, statusFilter, dateRange])

  const getStatusParam = (filter) => {
    const statusMap = {
      'Chờ nhập': 'PENDING',
      'Nhập một phần': 'PARTIAL_RECEIVED',
      'Đã nhập': 'RECEIVED',
      'Tất cả': null
    }
    return statusMap[filter]
  }

  const fetchImportList = async () => {
    setLoading(true)
    try {
      const status = getStatusParam(statusFilter)
      const fromDate = dateRange[0] ? dateRange[0].format('YYYY-MM-DD') : null
      const toDate = dateRange[1] ? dateRange[1].format('YYYY-MM-DD') : null

      const { data, error } = await stockReceiptAPI.getAll(
        page - 1, 
        pageSize, 
        searchTerm || null, 
        status, 
        fromDate, 
        toDate
      )
      
      if (error) {
        throw new Error(error)
      }

      const result = data?.result || {}
      const content = result.content || []
      
      // Transform API data to match UI structure
      const transformedData = content.map((item) => {
        // Xử lý createdAt: nếu đã là chuỗi format sẵn (DD/MM/YYYY HH:mm) thì dùng trực tiếp
        // Nếu là ISO string hoặc timestamp thì parse bằng dayjs
        let formattedDate = 'N/A'
        if (item.createdAt) {
          // Kiểm tra xem có phải là format DD/MM/YYYY HH:mm không (đã được format sẵn từ backend)
          const datePattern = /^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/
          if (datePattern.test(item.createdAt)) {
            // Đã format sẵn, dùng trực tiếp
            formattedDate = item.createdAt
          } else {
            // Parse bằng dayjs (cho ISO string hoặc timestamp)
            const parsed = dayjs(item.createdAt)
            formattedDate = parsed.isValid() ? parsed.format('DD/MM/YYYY HH:mm') : item.createdAt
          }
        }

        return {
          key: item.id,
          id: item.id,
          code: item.code || 'N/A',
          supplierName: item.supplierName || '--',
          purchaseRequestCode: item.purchaseRequestCode || '--',
          receivedQty: item.receivedQty || 0,
          totalQty: item.totalQty || 0,
          lineCount: item.lineCount || 0,
          createdAt: formattedDate,
          status: mapStatus(item.status)
        }
      })

      setImportList(transformedData)
      setTotal(result.totalElements || 0)
    } catch (err) {
      console.error('Failed to fetch import list:', err)
      message.error('Đã xảy ra lỗi khi tải dữ liệu')
      setImportList([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }

  const mapStatus = (status) => {
    const statusMap = {
      'RECEIVED': 'Đã nhập',
      'PENDING': 'Chờ nhập',
      'PARTIAL_RECEIVED': 'Chờ nhập kho',
      'PARTIALLY_RECEIVED': 'Chờ nhập kho',
      'CANCELLED': 'Đã hủy'
    }
    return statusMap[status] || status || 'N/A'
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN').format(value)
  }


  const handleViewDetail = (id) => {
    navigate(`/warehouse/import-list/${id}`)
  }

  const handleImportWarehouse = (id) => {
    message.info(`Nhập kho cho phiếu ID: ${id}`)
  }

  const getMenuItems = (record) => [
    {
      key: 'view',
      label: (
        <span onClick={() => handleViewDetail(record.id)}>
          Xem chi tiết
        </span>
      )
    }
  ]

  const getStatusConfig = (status) => {
    const statusMap = {
      'Đã nhập': { color: '#22c55e', bgColor: '#f6ffed', borderColor: '#b7eb8f', text: 'Đã nhập' },
      'Chờ nhập': { color: '#faad14', bgColor: '#fffbe6', borderColor: '#ffe58f', text: 'Chờ nhập' },
      'Chờ nhập kho': { color: '#faad14', bgColor: '#fffbe6', borderColor: '#ffe58f', text: 'Chờ nhập kho' },
      'Nhập một phần': { color: '#1677ff', bgColor: '#e6f4ff', borderColor: '#91caff', text: 'Nhập một phần' },
      'Đã hủy': { color: '#ff4d4f', bgColor: '#fff1f0', borderColor: '#ffccc7', text: 'Đã hủy' }
    }
    return statusMap[status] || { color: '#666', bgColor: '#fafafa', borderColor: '#d9d9d9', text: status || 'Không rõ' }
  }


  const columns = [
    {
      title: 'Mã phiếu',
      dataIndex: 'code',
      key: 'code',
      width: 150
    },
    {
      title: 'Nhà cung cấp',
      dataIndex: 'supplierName',
      key: 'supplierName',
      width: 200
    },
    {
      title: 'Yêu cầu mua',
      dataIndex: 'purchaseRequestCode',
      key: 'purchaseRequestCode',
      width: 150
    },
    {
      title: 'Đã nhập',
      key: 'received',
      width: 120,
      align: 'center',
      render: (_, record) => `${record.receivedQty}/${record.totalQty}`
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 150,
      align: 'center',
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
      render: (_, record) => (
        <Dropdown
          menu={{ items: getMenuItems(record) }}
          trigger={['click']}
          placement="bottomRight"
        >
          <Button
            type="text"
            icon={<MoreOutlined style={{ fontSize: '20px' }} />}
            style={{ padding: 0 }}
          />
        </Dropdown>
      )
    }
  ]


  return (
    <WarehouseLayout>
      <div style={{ padding: 24 }}>
        {/* Heading */}
        <h1 style={{ margin: 0, marginBottom: 24, fontSize: 24, fontWeight: 600 }}>
          Danh sách nhập kho
        </h1>

        {/* Search / Filter / Create Purchase Request */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
            gap: 12,
          }}
        >
          {/* Search on the left */}
          <Input
            placeholder="Tìm kiếm"
            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: 280,
              borderRadius: '8px',
            }}
          />

          {/* Buttons on the right */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Button
            icon={<FilterOutlined />}
            onClick={() => {
              setTempStatuses(
                statusFilter && statusFilter !== 'Tất cả' ? [statusFilter] : []
              )
              setTempDateRange(dateRange)
              setIsFilterModalOpen(true)
            }}
            style={{
              borderRadius: '8px',
            }}
          >
            Bộ lọc
          </Button>
          </div>
        </div>

        <Table
          columns={columns}
          dataSource={importList}
          loading={loading}
          pagination={{
            current: page,
            pageSize: pageSize,
            total: total,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} bản ghi`,
            showQuickJumper: true,
            onChange: (newPage, newPageSize) => {
              setPage(newPage)
              setPageSize(newPageSize)
            }
          }}
          size="middle"
          components={goldTableHeader}
        />
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
                checked={tempStatuses.includes('Chờ nhập')}
                onChange={() => {
                  setTempStatuses((prev) =>
                    prev.includes('Chờ nhập') ? [] : ['Chờ nhập']
                  )
                }}
              >
                Chờ nhập
              </Checkbox>
              <Checkbox
                checked={tempStatuses.includes('Nhập một phần')}
                onChange={() => {
                  setTempStatuses((prev) =>
                    prev.includes('Nhập một phần') ? [] : ['Nhập một phần']
                  )
                }}
              >
                Nhập một phần
              </Checkbox>
              <Checkbox
                checked={tempStatuses.includes('Đã nhập')}
                onChange={() => {
                  setTempStatuses((prev) =>
                    prev.includes('Đã nhập') ? [] : ['Đã nhập']
                  )
                }}
              >
                Đã nhập
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
                  suffixIcon={<CalendarOutlined />}
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
                  suffixIcon={<CalendarOutlined />}
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
