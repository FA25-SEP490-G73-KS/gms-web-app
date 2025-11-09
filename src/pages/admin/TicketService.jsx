import React, { useMemo, useState, useEffect } from 'react'
import Table from 'antd/es/table'
import Input from 'antd/es/input'
import Card from 'antd/es/card'
import Badge from 'antd/es/badge'
import Space from 'antd/es/space'
import message from 'antd/es/message'
import { EyeOutlined } from '@ant-design/icons'
import AdminLayout from '../../layouts/AdminLayout'
import TicketDetail from './modals/TicketDetail'
import { serviceTicketAPI } from '../../services/api'

const { Search } = Input

const getStatusConfig = (status) => {
  switch (status) {
    case 'Huỷ':
      return { status: 'error', text: status }
    case 'Đang sửa chữa':
      return { status: 'processing', text: status }
    case 'Chờ báo giá':
      return { status: 'warning', text: status }
    case 'Không duyệt':
      return { status: 'default', text: status }
    default:
      return { status: 'success', text: status }
  }
}

export default function TicketService() {
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [selected, setSelected] = useState(null)
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchServiceTickets()
  }, [])

  const fetchServiceTickets = async () => {
    setLoading(true)
    const { data: response, error } = await serviceTicketAPI.getAll()
    setLoading(false)
    
    if (error) {
      message.error('Không thể tải dữ liệu phiếu dịch vụ')
      return
    }
    
    let resultArray = []
    
    if (response) {
      if (response.result && response.result.content && Array.isArray(response.result.content)) {
        resultArray = response.result.content
      }
      else if (Array.isArray(response.result)) {
        resultArray = response.result
      }
      else if (Array.isArray(response.data)) {
        resultArray = response.data
      }
      else if (Array.isArray(response)) {
        resultArray = response
      }
      else if (Array.isArray(response.content)) {
        resultArray = response.content
      }
      else if (response.result && typeof response.result === 'object') {
        if (response.result.items && Array.isArray(response.result.items)) {
          resultArray = response.result.items
        } else if (response.result.data && Array.isArray(response.result.data)) {
          resultArray = response.result.data
        }
      }
    }
    
    const transformed = resultArray.map(item => ({
      id: item.serviceTicketId,
      customer: item.customer?.fullName || 'N/A',
      license: item.vehicle?.licensePlate || 'N/A',
      status: item.status || 'Chờ thanh toán',
      createdAt: item.createdAt ? new Date(item.createdAt).toLocaleDateString('vi-VN') : new Date().toLocaleDateString('vi-VN'),
      total: item.total || 0,
    }))
    setData(transformed)
  }

  const filtered = useMemo(() => {
    if (!query) return data
    const q = query.toLowerCase()
    return data.filter(
      (r) => r.customer.toLowerCase().includes(q) || r.license.toLowerCase().includes(q)
    )
  }, [query, data])

  const columns = [
    {
      title: 'STT',
      dataIndex: 'index',
      key: 'index',
      width: 80,
      render: (_, __, index) => {
        const current = (page - 1) * pageSize + index + 1
        return current < 10 ? `0${current}` : current
      }
    },
    {
      title: 'Khách Hàng',
      dataIndex: 'customer',
      key: 'customer',
      width: 200
    },
    {
      title: 'Biển Số Xe',
      dataIndex: 'license',
      key: 'license',
      width: 150
    },
    {
      title: 'Trạng Thái',
      dataIndex: 'status',
      key: 'status',
      width: 150,
      render: (status) => <Badge {...getStatusConfig(status)} />
    },
    {
      title: 'Ngày Tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150
    },
    {
      title: 'Tổng Tiền',
      dataIndex: 'total',
      key: 'total',
      width: 150,
      render: (total) => `${(total || 0).toLocaleString('vi-VN')} VND`
    },
    {
      title: 'Chi tiết',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Space>
          <EyeOutlined
            style={{ fontSize: '18px', cursor: 'pointer', color: '#1890ff' }}
            onClick={() => setSelected(record)}
          />
        </Space>
      )
    }
  ]

  return (
    <AdminLayout>
      <Card
        title={<span style={{ fontSize: '20px', fontWeight: 600 }}>Phiếu dịch vụ gần đây</span>}
        extra={
          <Search
            placeholder="Tìm kiếm"
            allowClear
            style={{ width: 300 }}
            value={query}
            onChange={(e) => {
              setPage(1)
              setQuery(e.target.value)
            }}
            onSearch={setQuery}
          />
        }
        style={{ marginBottom: 24 }}
      >
        <Table
          columns={columns}
          dataSource={filtered.map((item, index) => ({ ...item, key: item.id, index }))}
          loading={loading}
          pagination={{
            current: page,
            pageSize: pageSize,
            total: filtered.length,
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} bản ghi`,
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
        />
      </Card>
      <TicketDetail open={!!selected} onClose={() => setSelected(null)} data={selected} />
    </AdminLayout>
  )
}
