import React, { useMemo, useState, useEffect } from 'react'
import Table from 'antd/es/table'
import Input from 'antd/es/input'
import Card from 'antd/es/card'
import Badge from 'antd/es/badge'
import Dropdown from 'antd/es/dropdown'
import Modal from 'antd/es/modal'
import Descriptions from 'antd/es/descriptions'
import Tag from 'antd/es/tag'
import Space from 'antd/es/space'
import message from 'antd/es/message'
import { EyeOutlined, SearchOutlined } from '@ant-design/icons'
import AdminLayout from '../../layouts/AdminLayout'
import { appointmentAPI } from '../../services/api'

const { Search } = Input

const STATUS_ITEMS = [
  { key: 'CONFIRMED', label: 'Chờ', color: '#FFB7B7' },
  { key: 'CANCELLED', label: 'Bị huỷ', color: '#FF1100' },
  { key: 'ARRIVED', label: 'Đã đến', color: '#486FE0' },
  { key: 'OVERDUE', label: 'Quá hạn', color: '#E89400' },
]

const statusMap = {
  'CONFIRMED': 'Chờ',
  'CANCELLED': 'Bị huỷ',
  'ARRIVED': 'Đã đến',
  'OVERDUE': 'Quá hạn',
}

const getStatusConfig = (status) => {
  switch (status) {
    case 'Bị huỷ':
      return { status: 'error', text: status }
    case 'Đã đến':
      return { status: 'success', text: status }
    case 'Quá hạn':
      return { status: 'warning', text: status }
    default:
      return { status: 'processing', text: status }
  }
}

export default function AdminAppointments() {
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [selected, setSelected] = useState(null)
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedFull, setSelectedFull] = useState(null)

  useEffect(() => {
    fetchAppointments()
  }, [])

  const fetchAppointments = async () => {
    setLoading(true)
    const { data: response, error } = await appointmentAPI.getAll()
    setLoading(false)
    
    if (error) {
      message.error('Không thể tải dữ liệu lịch hẹn')
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
      id: item.appointmentId,
      customer: item.customerName,
      license: item.licensePlate,
      phone: item.customerPhone,
      status: statusMap[item.status] || item.status,
      statusKey: item.status,
      time: item.timeSlotLabel || '',
      date: new Date(item.appointmentDate).toLocaleDateString('vi-VN'),
      serviceType: item.serviceType,
      note: item.note,
    }))
    setData(transformed)
  }

  const fetchAppointmentDetail = async (id) => {
    const { data: response, error } = await appointmentAPI.getById(id)
    if (error) {
      message.error('Không thể tải chi tiết lịch hẹn')
      return
    }
    if (response && response.result) {
      setSelectedFull(response.result)
    }
  }

  const filtered = useMemo(() => {
    if (!query) return data
    const q = query.toLowerCase()
    return data.filter(
      (r) =>
        r.customer.toLowerCase().includes(q) ||
        r.license.toLowerCase().includes(q) ||
        r.phone.toLowerCase().includes(q)
    )
  }, [query, data])

  const updateStatus = async (id, statusKey) => {
    const { error } = await appointmentAPI.updateStatus(id, statusKey)
    if (error) {
      message.error('Không thể cập nhật trạng thái')
      return
    }
    message.success('Cập nhật trạng thái thành công')
    const newStatus = statusMap[statusKey] || statusKey
    setData((prev) => prev.map((r) => (r.id === id ? { ...r, status: newStatus, statusKey } : r)))
  }

  const statusMenu = (row) => ({
    items: STATUS_ITEMS.map((s) => ({
      key: s.key,
      label: (
        <span style={{ color: s.color, fontWeight: 700 }}>{s.label}</span>
      ),
      onClick: () => updateStatus(row.id, s.key),
    })),
  })

  const handleViewDetail = async (record) => {
    setSelected(record)
    await fetchAppointmentDetail(record.id)
  }

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
      title: 'Số điện thoại',
      dataIndex: 'phone',
      key: 'phone',
      width: 150
    },
    {
      title: 'Trạng Thái',
      dataIndex: 'status',
      key: 'status',
      width: 150,
      render: (status, record) => (
        <Dropdown menu={statusMenu(record)} trigger={['click']}>
          <Badge {...getStatusConfig(status)} style={{ cursor: 'pointer' }} />
        </Dropdown>
      )
    },
    {
      title: 'Lịch hẹn',
      key: 'appointment',
      width: 200,
      render: (_, record) => (
        <div>
          <div>{record.time}</div>
          <div style={{ color: '#9aa0a6', fontSize: '12px' }}>{record.date}</div>
        </div>
      )
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Space>
          <EyeOutlined
            style={{ fontSize: '18px', cursor: 'pointer', color: '#1890ff' }}
            onClick={() => handleViewDetail(record)}
          />
        </Space>
      )
    }
  ]

  return (
    <AdminLayout>
      <Card
        title={<span style={{ fontSize: '20px', fontWeight: 600 }}>Lịch hẹn</span>}
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

      <Modal
        title="LỊCH HẸN CHI TIẾT"
        open={!!selected}
        onCancel={() => { setSelected(null); setSelectedFull(null) }}
        footer={null}
        width={720}
      >
        {(selectedFull || selected) && (
          <>
            <Descriptions bordered column={1} size="middle">
              <Descriptions.Item label="Tên khách hàng">
                {selectedFull?.customerName || selected?.customer}
              </Descriptions.Item>
              <Descriptions.Item label="Số điện thoại">
                {selectedFull?.customerPhone || selected?.phone}
              </Descriptions.Item>
              <Descriptions.Item label="Biển số xe">
                {selectedFull?.licensePlate || selected?.license}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày hẹn">
                {selectedFull?.appointmentDate 
                  ? new Date(selectedFull.appointmentDate).toLocaleDateString('vi-VN') 
                  : selected?.date}
              </Descriptions.Item>
              <Descriptions.Item label="Khung giờ">
                {selectedFull?.timeSlotLabel || selected?.time}
              </Descriptions.Item>
              <Descriptions.Item label="Loại dịch vụ">
                {selectedFull?.serviceType || selected?.serviceType}
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <Tag color={
                  selected.status === 'Bị huỷ' ? 'red' : 
                  selected.status === 'Đã đến' ? 'blue' : 
                  selected.status === 'Quá hạn' ? 'orange' : 
                  'default'
                }>
                  {selected.status}
                </Tag>
              </Descriptions.Item>
            </Descriptions>
            {selectedFull?.note && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>Ghi chú:</div>
                <div>{selectedFull.note}</div>
              </div>
            )}
          </>
        )}
      </Modal>
    </AdminLayout>
  )
}
