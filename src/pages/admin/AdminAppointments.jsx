import React, { useMemo, useState, useEffect } from 'react'
import { Table, Input, Card, Badge, Modal, Space, Button, DatePicker, Row, Col, message } from 'antd'
import { EyeOutlined, SearchOutlined, CalendarOutlined } from '@ant-design/icons'
import AdminLayout from '../../layouts/AdminLayout'
import { appointmentAPI, serviceTicketAPI } from '../../services/api'
import { useNavigate } from 'react-router-dom'
import { goldTableHeader } from '../../utils/tableComponents'
import '../../styles/pages/admin/admin-appointments.css'
import { displayPhoneFrom84, normalizePhoneTo84 } from '../../utils/helpers'
import dayjs from 'dayjs'

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

const formatLicensePlate = (value) => {
  if (!value) return ''
  return String(value).toUpperCase()
}

const mapServiceEntryToName = (entry) => {
  if (!entry) return ''
  if (typeof entry === 'string') return entry.trim()
  if (typeof entry === 'object') {
    return entry.name || entry.serviceName || entry.label || entry.title || ''
  }
  return ''
}

const formatServiceDisplay = (value) => {
  if (!value) return ''

  if (Array.isArray(value)) {
    return value.map(mapServiceEntryToName).filter(Boolean).join(', ')
  }

  if (typeof value === 'string') {
    return value
      .replace(/[\n\r]+/g, ',')
      .split(/[,;|]/)
      .map(part => part.trim())
      .filter(Boolean)
      .join(', ')
  }

  if (typeof value === 'object') {
    if (Array.isArray(value.items)) {
      return value.items.map(mapServiceEntryToName).filter(Boolean).join(', ')
    }
    if (Array.isArray(value.list)) {
      return value.list.map(mapServiceEntryToName).filter(Boolean).join(', ')
    }
    const single = mapServiceEntryToName(value)
    return single
  }

  return ''
}

const extractServiceLabel = (item = {}) => {
  const sources = [
    item.serviceType,
    item.serviceTypes,
    item.serviceNames,
    item.serviceNameList,
    item.services,
    item.serviceRequests
  ]

  for (const source of sources) {
    const formatted = formatServiceDisplay(source)
    if (formatted) return formatted
  }

  return ''
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
  const [updatingStatus, setUpdatingStatus] = useState(false)

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
    const transformed = rawData.map(item => {
      const serviceLabel = extractServiceLabel(item)
      return {
      id: item.appointmentId || item.id,
      customer: item.customerName || item.customer?.fullName || item.customer?.name || '',
      license: formatLicensePlate(item.licensePlate || item.license || ''),
      phone: displayPhoneFrom84(item.customerPhone || item.customer?.phone || ''),
      status: statusMap[item.status] || item.status || 'Chờ',
      statusKey: item.status || 'CONFIRMED',
      time: item.timeSlotLabel || item.time || '',
      date: item.appointmentDate ? new Date(item.appointmentDate).toLocaleDateString('vi-VN') : '',
      dateRaw: item.appointmentDate,
      serviceType: serviceLabel || '',
      note: item.note || '',
      originalItem: item
    }})
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
             licensePlate: formatLicensePlate(selected.license),
             serviceType: selected.serviceType || extractServiceLabel(selected.originalItem)
         })
      }
      return
    }

    if (response && response.result) {
      const result = response.result
      setSelectedFull({
        ...result,
        customerName: result.customerName || result.customer?.fullName || '',
        customerPhone: displayPhoneFrom84(result.customerPhone || result.customer?.phone || ''),
        licensePlate: formatLicensePlate(result.licensePlate || result.vehicle?.licensePlate || ''),
        serviceType: extractServiceLabel(result)
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

  const handleCreateTicket = async () => {
    console.log('=== [AdminAppointments] Navigate to CreateTicket - START ===')
    console.log('selectedFull:', selectedFull)
    console.log('selected:', selected)
    
    if (!selectedFull && !selected) {
      message.error('Không tìm thấy thông tin lịch hẹn')
      return
    }

    const appointmentData = selectedFull || selected
    const appointmentId = appointmentData?.appointmentId || appointmentData?.id
    
    if (!appointmentId) {
      message.error('Không tìm thấy ID lịch hẹn')
      return
    }

    console.log('Appointment ID:', appointmentId)
    console.log('Appointment Data:', appointmentData)
    
    setUpdatingStatus(true)

    try {
      // Check if service ticket already exists for this appointment
      console.log('=== Checking for existing ticket ===')
      console.log('Appointment ID:', appointmentId)
      
      let existingTicket = null
      let page = 0
      const pageSize = 100
      let hasMore = true
      
      // Loop through pages to find existing ticket
      while (hasMore && !existingTicket) {
        const { data: ticketsData, error: ticketsError } = await serviceTicketAPI.getAll(page, pageSize)
        
        console.log(`Page ${page} response:`, ticketsData)
        
        if (ticketsError) {
          console.warn('Error fetching tickets:', ticketsError)
          break
        }
        
        if (ticketsData?.result?.content && Array.isArray(ticketsData.result.content)) {
          existingTicket = ticketsData.result.content.find(
            (ticket) => {
              const ticketAppointmentId = ticket.appointmentId || ticket.appointment?.appointmentId || ticket.appointment?.id
              const matches = ticketAppointmentId && Number(ticketAppointmentId) === Number(appointmentId)
              if (matches) {
                console.log('Found existing ticket:', {
                  ticketId: ticket.serviceTicketId || ticket.id,
                  appointmentId: ticketAppointmentId,
                  ticket: ticket
                })
              }
              return matches
            }
          )
          
          // Check if there are more pages
          hasMore = !ticketsData.result.last && ticketsData.result.content.length === pageSize
          page++
        } else {
          hasMore = false
        }
      }
      
      if (existingTicket) {
        const ticketId = existingTicket.serviceTicketId || existingTicket.id
        console.log('=== Existing ticket found ===')
        console.log('Ticket ID:', ticketId)
        console.log('============================')
        
        message.warning('Lịch hẹn này đã có phiếu dịch vụ. Đang chuyển đến danh sách phiếu...')
        
        // Clean up
        setSelected(null)
        setSelectedFull(null)
        setUpdatingStatus(false)
        
        // Navigate to service tickets list
        setTimeout(() => {
          navigate('/service-advisor/orders')
        }, 500)
        return
      }
      
      console.log('✓ No existing ticket found, proceeding to create')

      // Update trạng thái lịch hẹn thành ARRIVED
      console.log('Updating appointment status to ARRIVED...')
      const { error: statusError } = await appointmentAPI.updateStatus(appointmentId, 'ARRIVED')
      if (statusError) {
        console.error('Update status error:', statusError)
        message.error('Cập nhật trạng thái lịch hẹn thất bại')
        setUpdatingStatus(false)
        return
      }
      console.log('✓ Appointment status updated to ARRIVED')

      // Parse expectedDeliveryAt
      let expectedDeliveryAt = null
      if (appointmentData.appointmentDate) {
        const dateStr = appointmentData.appointmentDate
        console.log('Parsing appointmentDate:', dateStr)
        
        let parsedDate = dayjs(dateStr, 'DD/MM/YYYY', true)
        if (!parsedDate.isValid()) {
          parsedDate = dayjs(dateStr, 'YYYY-MM-DD', true)
        }
        if (!parsedDate.isValid()) {
          parsedDate = dayjs(dateStr)
        }
        
        if (parsedDate.isValid()) {
          expectedDeliveryAt = parsedDate.format('YYYY-MM-DD')
          console.log('Parsed expectedDeliveryAt:', expectedDeliveryAt)
        } else {
          console.warn('Could not parse date:', dateStr)
          expectedDeliveryAt = null
        }
      }

      // Chuẩn bị data để pass sang CreateTicket (sẽ dùng để build payload ở đó)
      const navigationState = {
        fromAppointment: true,
        appointmentId: appointmentId,
        assignedTechnicianIds: appointmentData.assignedTechnicianIds || [],
        customer: {
          customerId: appointmentData.customerId || null,
          fullName: appointmentData.customerName || '',
          phone: appointmentData.customerPhone || '',
          address: appointmentData.address || '',
          customerType: appointmentData.customerType || 'DOANH_NGHIEP',
          discountPolicyId: appointmentData.discountPolicyId || 0
        },
        expectedDeliveryAt: expectedDeliveryAt,
        receiveCondition: appointmentData.note || '',
        serviceTypeIds: appointmentData.serviceTypeIds || [],
        vehicle: {
          brandId: appointmentData.brandId || null,
          brandName: appointmentData.brandName || '',
          licensePlate: (appointmentData.licensePlate || '').toUpperCase(),
          modelId: appointmentData.modelId || null,
          modelName: appointmentData.modelName || '',
          vehicleId: appointmentData.vehicleId || null,
          vin: appointmentData.vin || null,
          year: appointmentData.year || 2020
        }
      }

      console.log('=== [AdminAppointments] Navigation State ===')
      console.log('State to pass:', JSON.stringify(navigationState, null, 2))
      console.log('============================================')
      
      message.success('Đang chuyển sang trang tạo phiếu dịch vụ...')
      
      // Clean up first
      setSelected(null)
      setSelectedFull(null)
      setUpdatingStatus(false)
      
      // Navigate to CreateTicket page - API POST sẽ gọi ở đó
      setTimeout(() => {
        console.log('Navigating to /service-advisor/orders/create')
        navigate('/service-advisor/orders/create', { state: navigationState })
      }, 300)
      
      await fetchAppointments()

    } catch (err) {
      console.error('Error in handleCreateTicket:', err)
      message.error('Đã xảy ra lỗi')
      setUpdatingStatus(false)
    }
  }

  const handleViewDetail = async (record) => {
    setSelected(record)
    // Hiển thị ngay dữ liệu từ bảng trong khi chờ API detail
    if (record.originalItem) {
      setSelectedFull({
        ...record.originalItem,
        customerName: record.customer,
        customerPhone: record.phone,
        licensePlate: formatLicensePlate(record.license),
        serviceType: record.serviceType || extractServiceLabel(record.originalItem)
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
      <div style={{ padding: '24px', minHeight: '100vh' }}>
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
                    className={statusFilter === item.key ? 'status-btn active' : 'status-btn'}
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
            <Card 
              style={{ 
                borderRadius: '16px', 
                boxShadow: '0 12px 30px rgba(15, 23, 42, 0.08)',
                background: '#fff',
                padding: '24px'
              }} 
              bodyStyle={{ padding: 0 }}
            >
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
              style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', height: '100%' }}
              bodyStyle={{ padding: '24px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
                <div>
                  <div style={{ fontSize: '12px', textTransform: 'uppercase', color: '#9ca3af', letterSpacing: '0.08em', marginBottom: '6px' }}>
                    Lịch trình
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#04091e' }}>
                    {selectedDate ? selectedDate.format('DD/MM/YYYY') : 'Tất cả lịch hẹn'}
                  </div>
                </div>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    border: '1px solid #e5e7eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#04091e'
                  }}
                >
                  <CalendarOutlined />
                </div>
              </div>

              {timelineData.length > 0 ? (
                <div style={{ position: 'relative', paddingLeft: '36px', minHeight: '320px' }}>
                  <div
                    style={{
                      position: 'absolute',
                      left: '16px',
                      top: '8px',
                      bottom: '8px',
                      width: '2px',
                      background: '#e5d9c8'
                    }}
                  />
                  {timelineData.map((slot, index) => (
                    <div key={index} style={{ display: 'flex', gap: '16px', marginBottom: index === timelineData.length - 1 ? 0 : '32px' }}>
                      <div style={{ position: 'relative' }}>
                        <div
                          style={{
                            width: '16px',
                            height: '16px',
                            borderRadius: '50%',
                            background: '#bea685',
                            border: '2px solid #fff',
                            boxShadow: '0 0 0 3px #f5efe7',
                            position: 'relative',
                            zIndex: 1
                          }}
                        />
                      </div>
                      <div>
                        <div style={{ fontSize: '16px', fontWeight: 600, color: '#04091e' }}>{slot.time}</div>
                        <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
                          {slot.appointments.length} lịch hẹn
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: '#9ca3af', padding: '40px 0' }}>
                  <CalendarOutlined style={{ fontSize: '32px', marginBottom: '8px', display: 'block' }} />
                  {selectedDate ? 'Không có lịch hẹn ngày này' : 'Vui lòng chọn ngày để xem lịch trình'}
                </div>
              )}
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
                loading={updatingStatus}
                disabled={updatingStatus}
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