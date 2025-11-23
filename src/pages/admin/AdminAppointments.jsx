import React, { useMemo, useState, useEffect } from 'react'
import { Table, Input, Card, Badge, Modal, Descriptions, Tag, Space, message, Button, DatePicker, Row, Col } from 'antd'
import { EyeOutlined, SearchOutlined, CalendarOutlined } from '@ant-design/icons'
import AdminLayout from '../../layouts/AdminLayout'
import { appointmentAPI } from '../../services/api'
import { useNavigate } from 'react-router-dom'
import { goldTableHeader } from '../../utils/tableComponents'
import '../../styles/pages/admin/admin-appointments.css'

const { Search } = Input

const STATUS_ITEMS = [
  { key: 'CANCELLED', label: 'Hủy', color: '#ef4444' },
  { key: 'ARRIVED', label: 'Đã đến', color: '#16a34a' },
  { key: 'CONFIRMED', label: 'Chờ', color: '#e89400' },
]

const statusMap = {
  'CONFIRMED': 'Chờ',
  'CANCELLED': 'Hủy',
  'ARRIVED': 'Đã đến',
  'OVERDUE': 'Quá hạn',
}

const getStatusConfig = (status) => {
  switch (status) {
    case 'Hủy':
      return { color: '#ef4444', text: status }
    case 'Đã đến':
      return { color: '#16a34a', text: status }
    case 'Chờ':
      return { color: '#e89400', text: status }
    default:
      return { color: '#666', text: status }
  }
}

export default function AdminAppointments() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [selected, setSelected] = useState(null)
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedFull, setSelectedFull] = useState(null)
  const [statusFilter, setStatusFilter] = useState(null)
  const [selectedDate, setSelectedDate] = useState(null)

  useEffect(() => {
    fetchAppointments()
  }, [])

  const fetchAppointments = async () => {
    setLoading(true)
    const { data: response, error } = await appointmentAPI.getAll()
    setLoading(false)
    
    // Fallback data for testing
    const fallbackData = [
      {
        id: 1,
        customer: 'Phạm Văn A',
        license: '25A-123456',
        phone: '0123456789',
        status: 'Hủy',
        statusKey: 'CANCELLED',
        time: '9:30 - 11:30',
        date: '12/10/2025',
        serviceType: 'Thay thế phụ tùng',
        note: 'Bóng đèn sáng yếu.',
      },
      {
        id: 2,
        customer: 'Phạm Văn A',
        license: '25A-123456',
        phone: '0123456789',
        status: 'Đã đến',
        statusKey: 'ARRIVED',
        time: '13:30 - 15:30',
        date: '12/10/2025',
        serviceType: 'Thay thế phụ tùng',
        note: '',
      },
      {
        id: 3,
        customer: 'Phạm Văn A',
        license: '25A-123456',
        phone: '0123456789',
        status: 'Chờ',
        statusKey: 'CONFIRMED',
        time: '7:30 - 9:30',
        date: '11/10/2025',
        serviceType: 'Thay thế phụ tùng',
        note: '',
      },
      {
        id: 4,
        customer: 'Phạm Văn A',
        license: '25A-123456',
        phone: '0123456789',
        status: 'Chờ',
        statusKey: 'CONFIRMED',
        time: '7:30 - 9:30',
        date: '11/10/2025',
        serviceType: 'Thay thế phụ tùng',
        note: '',
      },
    ]
    
    if (error || !response) {
      console.warn('API error, using fallback data:', error)
      setData(fallbackData)
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
      
      let transformed = resultArray.map(item => ({
        id: item.appointmentId,
        customer: item.customerName || item.customer?.fullName || item.customer?.name || item.customer?.customerName || '',
        license: item.licensePlate || '',
        phone: item.customerPhone || item.customer?.phone || '',
        status: statusMap[item.status] || item.status || 'Chờ',
        statusKey: item.status || 'CONFIRMED',
        time: item.timeSlotLabel || '',
        date: item.appointmentDate ? new Date(item.appointmentDate).toLocaleDateString('vi-VN') : '',
        dateRaw: item.appointmentDate,
        serviceType: Array.isArray(item.serviceType) ? item.serviceType.join(', ') : (item.serviceType || ''),
        note: item.note || '',
        // Keep original item for detail view
        originalItem: item
      }))
      
      if (statusFilter) {
        const statusKeyMap = {
          'Hủy': 'CANCELLED',
          'Đã đến': 'ARRIVED',
          'Chờ': 'CONFIRMED'
        }
        transformed = transformed.filter(item => item.statusKey === statusKeyMap[statusFilter])

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
    
    // Use fallback if no data
    if (resultArray.length === 0) {
      console.warn('No data from API, using fallback data')
      setData(fallbackData)
      return
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
    
    // Fallback data for testing
    const fallbackDetail = {
      appointmentId: id,
      customerName: 'Phạm Văn A',
      customerPhone: '0123456789',
      licensePlate: '25A-123456',
      appointmentDate: '2025-10-12',
      timeSlotLabel: '07:30 - 09:30',
      serviceType: 'Thay thế phụ tùng',
      note: 'Bóng đèn sáng yếu.',
      status: 'CONFIRMED',
    }
    
    if (error || !response || !response.result) {
      console.warn('API error, using fallback data:', error)
      setSelectedFull(fallbackDetail)
      return
    }
    
    if (response && response.result) {
      // Ensure customerName is populated from customer object if available
      const result = response.result
      setSelectedFull({
        ...result,
        customerName: result.customerName || result.customer?.fullName || result.customer?.name || result.customer?.customerName || '',
        customerPhone: result.customerPhone || result.customer?.phone || '',
        licensePlate: result.licensePlate || result.vehicle?.licensePlate || ''
      })
    } else {
      setSelectedFull(fallbackDetail)
    }
  }

  const filtered = useMemo(() => {
    let result = data
    
    // Filter by search query
    if (query) {
      const q = query.toLowerCase()
      result = result.filter(
        (r) =>
          r.license.toLowerCase().includes(q) ||
          r.customer.toLowerCase().includes(q) ||
          r.phone.toLowerCase().includes(q)
      )
    }
    
    // Filter by status
    if (statusFilter) {
      result = result.filter((r) => r.statusKey === statusFilter)
    }
    
    // Filter by date
    if (selectedDate) {
      const filterDate = selectedDate.format('DD/MM/YYYY')
      result = result.filter((r) => r.date === filterDate)
    }
    
    return result
  }, [query, data, statusFilter, selectedDate])

  // Group appointments by time slot for timeline
  const timelineData = useMemo(() => {
    if (!selectedDate) return []
    const filterDate = selectedDate.format('DD/MM/YYYY')
    const dayAppointments = data.filter((r) => r.date === filterDate)
    
    const timeSlots = [
      { time: '7:30 - 9:30', appointments: [] },
      { time: '9:30 - 11:30', appointments: [] },
      { time: '13:30 - 15:30', appointments: [] },
      { time: '15:30 - 17:30', appointments: [] },
    ]
    
    dayAppointments.forEach((apt) => {
      const slot = timeSlots.find((s) => s.time === apt.time)
      if (slot) {
        slot.appointments.push(apt)
      }
    })
    
    return timeSlots.filter((s) => s.appointments.length > 0)
  }, [data, selectedDate])

  const handleCreateTicket = () => {

    if (!selectedFull && !selected) {
      message.error('Không tìm thấy thông tin lịch hẹn')
      return
    }

    const appointmentId = selectedFull?.appointmentId || selected?.id
    if (!appointmentId) {
      message.error('Không tìm thấy ID lịch hẹn')
      return
    }

    navigate('/service-advisor/orders', { 
      state: { 
        appointmentId: appointmentId,
        customer: selectedFull?.customerName || selected?.customer,
        phone: selectedFull?.customerPhone || selected?.phone,
        licensePlate: selectedFull?.licensePlate || selected?.license
      } 
    })
    
    if (selectedFull) {
      navigate('/service-advisor/orders/create', { 
        state: { 
          appointmentId: selectedFull.appointmentId,
          customer: selectedFull.customerName,
          phone: selectedFull.customerPhone,
          licensePlate: selectedFull.licensePlate
        } 
      })
    }
    setSelected(null)
    setSelectedFull(null)
  }

  const handleViewDetail = async (record) => {
    setSelected(record)
    // If we have customer name in the record, use it immediately
    if (record.originalItem && (record.originalItem.customer?.fullName || record.originalItem.customer?.name)) {
      setSelectedFull({
        ...record.originalItem,
        customerName: record.originalItem.customerName || record.originalItem.customer?.fullName || record.originalItem.customer?.name || record.customer || '',
        customerPhone: record.originalItem.customerPhone || record.originalItem.customer?.phone || record.phone || '',
        licensePlate: record.originalItem.licensePlate || record.license || ''
      })
    }
    await fetchAppointmentDetail(record.id)
  }

  const columns = [
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      width: 120,
      render: () => 'APT'
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
      render: (status) => {
        const config = getStatusConfig(status)
        return <span style={{ color: config.color, fontWeight: 600 }}>{config.text}</span>
      }
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
      title: '',
      key: 'action',
      width: 80,
      render: (_, record) => (
        <EyeOutlined
          style={{ fontSize: '18px', cursor: 'pointer', color: '#111' }}
          onClick={() => handleViewDetail(record)}
        />
      )
    }
  ]

  return (
    <AdminLayout>
      <div style={{ padding: '24px', background: '#f5f7fb', minHeight: '100vh' }}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, marginBottom: '20px' }}>Lịch hẹn</h1>
          
          <Row gutter={16} style={{ marginBottom: '20px' }}>
            <Col flex="auto">
              <Search
                placeholder="Tìm kiếm theo biển số xe"
                allowClear
                prefix={<SearchOutlined />}
                style={{ width: '100%', maxWidth: '400px' }}
                value={query}
                onChange={(e) => {
                  setPage(1)
                  setQuery(e.target.value)
                }}
                onSearch={setQuery}
              />
            </Col>
            <Col>
              <Space>
                {STATUS_ITEMS.map((item) => (
                  <Button
                    key={item.key}
                    type={statusFilter === item.key ? 'primary' : 'default'}
                    style={{
                      background: statusFilter === item.key ? '#ffd65a' : '#fff',
                      borderColor: statusFilter === item.key ? '#ffd65a' : '#e6e6e6',
                      color: statusFilter === item.key ? '#111' : '#666',
                      fontWeight: 600
                    }}
                    onClick={() => setStatusFilter(statusFilter === item.key ? null : item.key)}
                  >
                    {item.label}
                  </Button>
                ))}
              </Space>
            </Col>
            <Col>
              <DatePicker
                placeholder="Chọn ngày"
                format="DD/MM/YYYY"
                suffixIcon={<CalendarOutlined />}
                value={selectedDate}
                onChange={setSelectedDate}
                style={{ width: '150px' }}
              />
            </Col>
          </Row>
        </div>

        <Row gutter={16}>
          <Col span={16}>
            <Card style={{ borderRadius: '12px' }} bodyStyle={{ padding: 0 }}>
              <Table
                columns={columns}
                dataSource={filtered.map((item, index) => ({ ...item, key: item.id, index }))}
                loading={loading}
                pagination={{
                  current: page,
                  pageSize: pageSize,
                  total: filtered.length,
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
                style={{ borderRadius: '12px' }}
                components={goldTableHeader}
              />
            </Card>
          </Col>
          
          <Col span={8}>
            <Card 
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CalendarOutlined />
                  <span>{selectedDate ? selectedDate.format('DD/MM/YYYY') : '12/10/2025'}</span>
                </div>
              }
              style={{ borderRadius: '12px' }}
            >
              <div className="appointment-timeline">
                {timelineData.length > 0 ? (
                  timelineData.map((slot, index) => (
                    <div key={index} className="timeline-item">
                      <div className="timeline-marker" />
                      <div className="timeline-content">
                        <div style={{ fontWeight: 600, marginBottom: '4px' }}>{slot.time}</div>
                        <div style={{ color: '#666', fontSize: '12px' }}>
                          {slot.appointments.length} lịch hẹn
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
                    Không có lịch hẹn
                  </div>
                )}
              </div>
            </Card>
          </Col>
        </Row>
      </div>

      <Modal
        title={
          <div style={{ 
            background: '#ffd65a', 
            margin: '-20px -24px 0 -24px', 
            padding: '16px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ fontWeight: 700, fontSize: '18px' }}>LỊCH HẸN CHI TIẾT</span>
            <Button 
              type="text" 
              onClick={() => { setSelected(null); setSelectedFull(null) }}
              style={{ fontSize: '18px', fontWeight: 700 }}
            >
              ×
            </Button>
          </div>
        }
        open={!!selected}
        onCancel={() => { setSelected(null); setSelectedFull(null) }}
        footer={null}
        width={720}
        style={{ top: 20 }}
      >
        {(selectedFull || selected) && (
          <div style={{ paddingTop: '20px' }}>
            <div style={{ marginBottom: '20px' }}>
              <div style={{ marginBottom: '12px' }}>
                <strong>Tên khách hàng:</strong>{' '}
                <span>{selectedFull?.customerName || selected?.customer}</span>
                <span style={{ marginLeft: '8px' }}>
                  <span style={{ color: '#ffd65a', fontSize: '16px' }}>★★★</span>
                </span>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <strong>Số điện thoại:</strong>{' '}
                <span>{selectedFull?.customerPhone || selected?.phone}</span>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <strong>Biển số xe:</strong>{' '}
                <span>{selectedFull?.licensePlate || selected?.license}</span>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <strong>Ngày hẹn:</strong>{' '}
                <span>
                  {selectedFull?.appointmentDate 
                    ? new Date(selectedFull.appointmentDate).toLocaleDateString('vi-VN') 
                    : selected?.date}
                </span>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <strong>Khung giờ:</strong>{' '}
                <span>{selectedFull?.timeSlotLabel || selected?.time}</span>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <strong>Loại dịch vụ:</strong>{' '}
                <span>{selectedFull?.serviceType || selected?.serviceType || 'Thay thế phụ tùng'}</span>
              </div>
            </div>
            
            {selectedFull?.note && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontWeight: 700, marginBottom: '8px' }}>Mô tả chi tiết tình trạng xe:</div>
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                  <li>{selectedFull.note}</li>
                </ul>
              </div>
            )}
            
            <div style={{ textAlign: 'center', marginTop: '24px' }}>
              <Button
                type="primary"
                size="large"
                onClick={handleCreateTicket}
                style={{
                  background: '#22c55e',
                  borderColor: '#22c55e',
                  height: '40px',
                  padding: '0 32px',
                  fontWeight: 600
                }}
              >
                Tạo phiếu dịch vụ
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </AdminLayout>
  )
}
