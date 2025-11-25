import React, { useMemo, useState, useEffect } from 'react'
import { Table, Input, Card, Badge, Modal, Space, Button, DatePicker, Row, Col, message } from 'antd'
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
  'COMPLETED': 'Hoàn thành'
}

const getStatusConfig = (status) => {
  switch (status) {
    case 'Hủy':
      return { color: '#ef4444', text: status }
    case 'Đã đến':
      return { color: '#16a34a', text: status }
    case 'Chờ':
      return { color: '#e89400', text: status }
    case 'Quá hạn':
      return { color: '#666', text: status }
    default:
      return { color: '#111', text: status }
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
    try {
      const { data: response, error } = await appointmentAPI.getAll()
      
      // Fallback data for testing/demo if API fails
      const fallbackData = [
        {
          appointmentId: 1,
          customerName: 'Phạm Văn A',
          licensePlate: '25A-123456',
          customerPhone: '0123456789',
          status: 'CANCELLED',
          timeSlotLabel: '9:30 - 11:30',
          appointmentDate: '2025-10-12',
          serviceType: 'Thay thế phụ tùng',
          note: 'Bóng đèn sáng yếu.',
        },
        {
          appointmentId: 2,
          customerName: 'Nguyễn Văn B',
          licensePlate: '30E-99999',
          customerPhone: '0987654321',
          status: 'ARRIVED',
          timeSlotLabel: '13:30 - 15:30',
          appointmentDate: '2025-10-12',
          serviceType: 'Bảo dưỡng',
          note: '',
        }
      ]

      if (error) {
        console.warn('API error, using fallback data:', error)
        processData(fallbackData) // Use helper function
        setLoading(false)
        return
      }

      let resultArray = []

      // Xử lý cấu trúc response đa dạng
      if (response) {
        if (response.result && response.result.content && Array.isArray(response.result.content)) {
          resultArray = response.result.content
        } else if (Array.isArray(response.result)) {
          resultArray = response.result
        } else if (Array.isArray(response.data)) {
          resultArray = response.data
        } else if (Array.isArray(response)) {
          resultArray = response
        } else if (response.content && Array.isArray(response.content)) {
          resultArray = response.content
        }
      }

      if (resultArray.length === 0 && !response) {
         processData(fallbackData)
      } else {
         processData(resultArray)
      }

    } catch (err) {
      console.error('Error fetching appointments:', err)
      setLoading(false)
    } finally {
      setLoading(false)
    }
  }

  // Hàm phụ trợ để map dữ liệu thống nhất
  const processData = (rawData) => {
    const transformed = rawData.map(item => ({
      id: item.appointmentId || item.id,
      customer: item.customerName || item.customer?.fullName || item.customer?.name || '',
      license: item.licensePlate || item.license || '',
      phone: item.customerPhone || item.customer?.phone || '',
      status: statusMap[item.status] || item.status || 'Chờ',
      statusKey: item.status || 'CONFIRMED',
      time: item.timeSlotLabel || item.time || '',
      date: item.appointmentDate ? new Date(item.appointmentDate).toLocaleDateString('vi-VN') : '',
      dateRaw: item.appointmentDate,
      serviceType: Array.isArray(item.serviceType) ? item.serviceType.join(', ') : (item.serviceType || ''),
      note: item.note || '',
      originalItem: item
    }))
    setData(transformed)
  }

  const fetchAppointmentDetail = async (id) => {
    const { data: response, error } = await appointmentAPI.getById(id)
    
    if (error || !response || !response.result) {
      // Nếu API lỗi, dùng dữ liệu hiện có trong bảng (selected)
      if (selected && selected.originalItem) {
         setSelectedFull({
             ...selected.originalItem,
             customerName: selected.customer,
             customerPhone: selected.phone,
             licensePlate: selected.license
         })
      }
      return
    }

    if (response && response.result) {
      const result = response.result
      setSelectedFull({
        ...result,
        customerName: result.customerName || result.customer?.fullName || '',
        customerPhone: result.customerPhone || result.customer?.phone || '',
        licensePlate: result.licensePlate || result.vehicle?.licensePlate || ''
      })
    }
  }

  const filtered = useMemo(() => {
    let result = data

    // Filter by search query
    if (query) {
      const q = query.toLowerCase()
      result = result.filter(
        (r) =>
          (r.license && r.license.toLowerCase().includes(q)) ||
          (r.customer && r.customer.toLowerCase().includes(q)) ||
          (r.phone && r.phone.toLowerCase().includes(q))
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
    // Nếu chưa chọn ngày, mặc định lấy ngày hôm nay hoặc hiển thị tất cả (tùy logic business)
    // Ở đây tôi để mặc định hiển thị theo ngày được chọn, nếu không chọn thì hiển thị trống hoặc hiển thị của data đầu tiên
    const displayDate = selectedDate ? selectedDate.format('DD/MM/YYYY') : (data.length > 0 ? data[0].date : '')
    
    if (!displayDate) return []

    const dayAppointments = data.filter((r) => r.date === displayDate)

    const timeSlots = [
      { time: '7:30 - 9:30', appointments: [] },
      { time: '9:30 - 11:30', appointments: [] },
      { time: '13:30 - 15:30', appointments: [] },
      { time: '15:30 - 17:30', appointments: [] },
    ]

    dayAppointments.forEach((apt) => {
      // Tìm slot gần đúng hoặc chính xác
      const slot = timeSlots.find((s) => apt.time.includes(s.time) || s.time.includes(apt.time))
      if (slot) {
        slot.appointments.push(apt)
      } else {
        // Nếu không khớp cứng, có thể thêm logic flexible hoặc đưa vào slot "Khác"
        // Ở đây đơn giản hóa là bỏ qua nếu không khớp format
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

    // Điều hướng tạo phiếu, truyền state
    navigate('/service-advisor/orders/create', { 
      state: { 
        appointmentId: appointmentId,
        customer: selectedFull?.customerName || selected?.customer,
        phone: selectedFull?.customerPhone || selected?.phone,
        licensePlate: selectedFull?.licensePlate || selected?.license
      } 
    })
    
    setSelected(null)
    setSelectedFull(null)
  }

  const handleViewDetail = async (record) => {
    setSelected(record)
    // Hiển thị ngay dữ liệu từ bảng trong khi chờ API detail
    if (record.originalItem) {
      setSelectedFull({
        ...record.originalItem,
        customerName: record.customer,
        customerPhone: record.phone,
        licensePlate: record.license
      })
    }
    await fetchAppointmentDetail(record.id)
  }

  const columns = [
    {
      title: 'STT',
      key: 'index',
      width: 60,
      render: (_, __, index) => (page - 1) * pageSize + index + 1
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
      width: 120,
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
          <div style={{ fontWeight: 500 }}>{record.time}</div>
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
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 20px 0', color: '#111' }}>Quản lý Lịch hẹn</h1>
          
          <Row gutter={16} align="middle">
            <Col flex="auto">
              <Search
                placeholder="Tìm kiếm theo biển số xe, tên KH, SĐT..."
                allowClear
                prefix={<SearchOutlined />}
                size="large"
                style={{ width: '100%', maxWidth: '400px' }}
                value={query}
                onChange={(e) => {
                  setPage(1)
                  setQuery(e.target.value)
                }}
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
                      borderColor: statusFilter === item.key ? '#ffd65a' : '#d9d9d9',
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
                size="large"
                suffixIcon={<CalendarOutlined />}
                value={selectedDate}
                onChange={setSelectedDate}
                style={{ width: '160px' }}
              />
            </Col>
          </Row>
        </div>

        <Row gutter={24}>
          <Col span={16}>
            <Card style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }} bodyStyle={{ padding: 0 }}>
              <Table
                columns={columns}
                dataSource={filtered.map((item, index) => ({ ...item, key: item.id }))}
                loading={loading}
                pagination={{
                  current: page,
                  pageSize: pageSize,
                  total: filtered.length,
                  showSizeChanger: true,
                  showTotal: (total) => `Tổng ${total} lịch hẹn`,
                  pageSizeOptions: ['10', '20', '50'],
                  onChange: (p, ps) => {
                    setPage(p)
                    setPageSize(ps)
                  }
                }}
                size="middle"
                components={goldTableHeader}
              />
            </Card>
          </Col>
          
          <Col span={8}>
            <Card 
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px' }}>
                  <CalendarOutlined style={{ color: '#CBB081' }} />
                  <span>Lịch trình: {selectedDate ? selectedDate.format('DD/MM/YYYY') : 'Tất cả'}</span>
                </div>
              }
              style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
            >
              <div className="appointment-timeline" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                {timelineData.length > 0 ? (
                  timelineData.map((slot, index) => (
                    <div key={index} className="timeline-item" style={{ display: 'flex', marginBottom: '20px', position: 'relative' }}>
                      <div style={{ width: '100px', fontWeight: 700, color: '#555' }}>{slot.time}</div>
                      <div style={{ flex: 1, borderLeft: '2px solid #CBB081', paddingLeft: '16px', marginLeft: '10px' }}>
                         {slot.appointments.map(apt => (
                             <div key={apt.id} style={{ background: '#f9f9f9', padding: '8px', borderRadius: '6px', marginBottom: '8px' }}>
                                 <div style={{ fontWeight: 600 }}>{apt.customer}</div>
                                 <div style={{ fontSize: '12px', color: '#666' }}>{apt.license} - {apt.serviceType}</div>
                                 <Badge status={apt.statusKey === 'ARRIVED' ? 'success' : (apt.statusKey === 'CANCELLED' ? 'error' : 'warning')} text={apt.status} />
                             </div>
                         ))}
                         <div style={{ color: '#999', fontSize: '12px', marginTop: '4px' }}>
                           Tổng: {slot.appointments.length} khách
                         </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', color: '#999', padding: '40px 0' }}>
                    <CalendarOutlined style={{ fontSize: '32px', marginBottom: '8px', display: 'block' }} />
                    {selectedDate ? 'Không có lịch hẹn ngày này' : 'Vui lòng chọn ngày để xem lịch trình'}
                  </div>
                )}
              </div>
            </Card>
          </Col>
        </Row>
      </div>

      <Modal
        title={null}
        open={!!selected}
        onCancel={() => { setSelected(null); setSelectedFull(null) }}
        footer={null}
        width={700}
        style={{ top: 20 }}
        closable={false}
        styles={{ content: { padding: 0, borderRadius: '8px', overflow: 'hidden' }}}
      >
        <div style={{ 
            background: '#CBB081', 
            padding: '16px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
        }}>
            <span style={{ fontWeight: 700, fontSize: '18px', color: '#111' }}>CHI TIẾT LỊCH HẸN</span>
            <span 
                onClick={() => { setSelected(null); setSelectedFull(null) }}
                style={{ fontSize: '24px', fontWeight: 700, cursor: 'pointer', lineHeight: '1' }}
            >
                ×
            </span>
        </div>
        
        {(selectedFull || selected) && (
          <div style={{ padding: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div>
                    <div style={{ marginBottom: '16px' }}>
                        <div style={{ fontSize: '13px', color: '#888' }}>Khách hàng</div>
                        <div style={{ fontSize: '16px', fontWeight: 600 }}>{selectedFull?.customerName || selected?.customer}</div>
                    </div>
                    <div style={{ marginBottom: '16px' }}>
                        <div style={{ fontSize: '13px', color: '#888' }}>Số điện thoại</div>
                        <div style={{ fontSize: '16px', fontWeight: 600 }}>{selectedFull?.customerPhone || selected?.phone}</div>
                    </div>
                    <div style={{ marginBottom: '16px' }}>
                        <div style={{ fontSize: '13px', color: '#888' }}>Biển số xe</div>
                        <div style={{ fontSize: '16px', fontWeight: 600, padding: '4px 8px', background: '#f0f0f0', borderRadius: '4px', display: 'inline-block' }}>
                            {selectedFull?.licensePlate || selected?.license}
                        </div>
                    </div>
                </div>
                <div>
                    <div style={{ marginBottom: '16px' }}>
                        <div style={{ fontSize: '13px', color: '#888' }}>Thời gian hẹn</div>
                        <div style={{ fontSize: '16px', fontWeight: 600 }}>
                            {selectedFull?.timeSlotLabel || selected?.time} <br/>
                            <span style={{ fontSize: '14px', fontWeight: 400 }}>
                                {selectedFull?.appointmentDate 
                                    ? new Date(selectedFull.appointmentDate).toLocaleDateString('vi-VN') 
                                    : selected?.date}
                            </span>
                        </div>
                    </div>
                    <div style={{ marginBottom: '16px' }}>
                        <div style={{ fontSize: '13px', color: '#888' }}>Dịch vụ yêu cầu</div>
                        <div style={{ fontSize: '16px', fontWeight: 600 }}>{selectedFull?.serviceType || selected?.serviceType}</div>
                    </div>
                    <div style={{ marginBottom: '16px' }}>
                        <div style={{ fontSize: '13px', color: '#888' }}>Trạng thái</div>
                        <Badge {...getStatusConfig(selectedFull?.statusKey || selected?.status)} />
                    </div>
                </div>
            </div>
            
            <div style={{ marginTop: '16px', background: '#f9f9f9', padding: '16px', borderRadius: '8px' }}>
                <div style={{ fontWeight: 700, marginBottom: '8px' }}>Ghi chú / Tình trạng xe:</div>
                <div style={{ whiteSpace: 'pre-wrap' }}>{selectedFull?.note || selected?.note || 'Không có ghi chú'}</div>
            </div>
            
            <div style={{ textAlign: 'center', marginTop: '32px' }}>
              <Button
                type="primary"
                size="large"
                onClick={handleCreateTicket}
                style={{
                  background: '#22c55e',
                  borderColor: '#22c55e',
                  height: '45px',
                  padding: '0 40px',
                  fontWeight: 600,
                  fontSize: '16px'
                }}
              >
                Tạo Phiếu Dịch Vụ
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </AdminLayout>
  )
}