import React, { useState, useEffect } from 'react'
import { Table, Input, Card, Badge, message } from 'antd'
import WarehouseLayout from '../../layouts/WarehouseLayout'
import { goldTableHeader } from '../../utils/tableComponents'
import { stockReceiptAPI } from '../../services/api'
import dayjs from 'dayjs'

const { Search } = Input

export default function ImportList() {
  const [searchTerm, setSearchTerm] = useState('')
  const [importList, setImportList] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    fetchImportList()
  }, [page, pageSize, searchTerm])

  const fetchImportList = async () => {
    setLoading(true)
    try {
      const { data, error } = await stockReceiptAPI.getAll(page - 1, pageSize, searchTerm)
      
      if (error) {
        message.error('Không thể tải danh sách nhập')
        setLoading(false)
        return
      }

      const result = data?.result || {}
      const content = result.content || (Array.isArray(data?.result) ? data.result : [])
      
      // Transform API data to match UI structure
      const transformedData = content.map((item) => ({
        id: item.receiptId || item.id,
        code: item.code || 'N/A',
        vehicleModel: item.vehicleModelName || 'N/A',
        creator: item.createdByName || 'N/A',
        createDate: item.createdAt ? dayjs(item.createdAt).format('DD/MM/YYYY') : 'N/A',
        status: mapStatus(item.status),
        totalParts: 0, // API không trả về, có thể cần call API khác
        totalValue: item.totalAmount ? formatCurrency(item.totalAmount) : '0'
      }))

      setImportList(transformedData)
      setTotal(result.totalElements || content.length || 0)
    } catch (err) {
      console.error('Failed to fetch import list:', err)
      message.error('Đã xảy ra lỗi khi tải dữ liệu')
    } finally {
      setLoading(false)
    }
  }

  const mapStatus = (status) => {
    const statusMap = {
      'IMPORTED': 'Đã nhập',
      'PENDING': 'Chờ nhập',
      'CANCELLED': 'Đã hủy'
    }
    return statusMap[status] || status || 'N/A'
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN').format(value)
  }

  const getStatusConfig = (status) => {
    if (status === 'Đã nhập') {
      return { color: 'success', text: status }
    }
    if (status === 'Chờ nhập') {
      return { color: 'warning', text: status }
    }
    if (status === 'Đã hủy') {
      return { color: 'error', text: status }
    }
    return { color: 'default', text: status }
  }

  const columns = [
    {
      title: 'STT',
      dataIndex: 'index',
      key: 'index',
      width: 80,
      render: (_, __, index) => String(index + 1).padStart(2, '0')
    },
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      width: 180
    },
    {
      title: 'Dòng xe',
      dataIndex: 'vehicleModel',
      key: 'vehicleModel',
      width: 150
    },
    {
      title: 'Người tạo',
      dataIndex: 'creator',
      key: 'creator',
      width: 180
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createDate',
      key: 'createDate',
      width: 150
    },
    {
      title: 'Tổng linh kiện',
      dataIndex: 'totalParts',
      key: 'totalParts',
      width: 150
    },
    {
      title: 'Tổng giá trị',
      dataIndex: 'totalValue',
      key: 'totalValue',
      width: 150,
      render: (value) => `${value} VND`
    },
    {
      title: 'Trạng Thái',
      dataIndex: 'status',
      key: 'status',
      width: 150,
      render: (status) => <Badge {...getStatusConfig(status)} />
    }
  ]

  const dataSource = importList.map((item, index) => ({ ...item, key: item.id, index: index + 1 }))

  return (
    <WarehouseLayout>
      <Card
        title={<span style={{ fontSize: '20px', fontWeight: 600 }}>Danh sách nhập</span>}
        extra={
          <Search
            placeholder="Tìm kiếm"
            allowClear
            style={{ width: 300 }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onSearch={(value) => {
              setSearchTerm(value)
              setPage(1)
            }}
          />
        }
        style={{ marginBottom: 24 }}
      >
        <Table
          columns={columns}
          dataSource={dataSource}
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
      </Card>
    </WarehouseLayout>
  )
}
