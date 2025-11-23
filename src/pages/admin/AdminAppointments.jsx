import React, { useMemo, useState, useEffect } from 'react'
import { Table, Input, Card, Badge, Modal, Descriptions, Tag, Space, message, Button, DatePicker, Row, Col, Timeline } from 'antd'
import { EyeOutlined, SearchOutlined, CalendarOutlined, CloseOutlined } from '@ant-design/icons'
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
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [selectedFull, setSelectedFull] = useState(null)
  const [statusFilter, setStatusFilter] = useState(null)
  const [selectedDate, setSelectedDate] = useState(null)

  useEffect(() => {
    fetchAppointments()
  }, [page, pageSize, statusFilter, selectedDate])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAppointments()
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  const fetchAppointments = async () => {
    setLoading(true)
    try {
      const { data: response, error } = await appointmentAPI.getAll(page - 1, pageSize)
      setLoading(false)
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
        date: '12/10/2025',
        serviceType: 'Thay thế phụ tùng',
        note: '',
      },
      {
        id: 4,
        customer: 'Nguyễn Văn B',
        license: '30A-789012',
        phone: '0987654321',
        status: 'Chờ',
        statusKey: 'CONFIRMED',
        time: '7:30 - 9:30',
        date: '12/10/2025',
        serviceType: 'Bảo dưỡng',
        note: '',
      },
      {
        id: 5,
        customer: 'Trần Văn C',
        license: '29A-345678',
        phone: '0912345678',
        status: 'Chờ',
        statusKey: 'CONFIRMED',
        time: '9:30 - 11:30',
        date: '12/10/2025',
        serviceType: 'Sơn',
        note: '',
      },
      {
        id: 6,
        customer: 'Lê Văn D',
        license: '51A-567890',
        phone: '0923456789',
        status: 'Chờ',
        statusKey: 'CONFIRMED',
        time: '15:30 - 17:30',
        date: '12/10/2025',
        serviceType: 'Thay thế phụ tùng',
        note: '',
      },
    ]
    
      if (error || !response) {
        console.warn('API error:', error)
        message.error('Không thể tải danh sách lịch hẹn. Vui lòng thử lại.')
        setData([])
        setTotal(0)
        return
      }
      
      let resultArray = []
      let totalCount = 0
      
      if (response) {
        if (response.result && response.result.content && Array.isArray(response.result.content)) {
          resultArray = response.result.content
          totalCount = response.result.totalElements || response.result.numberOfElements || 0
        }
        else if (Array.isArray(response.result)) {
          resultArray = response.result
          totalCount = response.result.length
        }
        else if (Array.isArray(response.data)) {
          resultArray = response.data
          totalCount = response.data.length
        }
        else if (Array.isArray(response)) {
          resultArray = response
          totalCount = response.length
        }
        else if (Array.isArray(response.content)) {
          resultArray = response.content
          totalCount = response.totalElements || response.content.length
        }
        else if (response.result && typeof response.result === 'object') {
          if (response.result.items && Array.isArray(response.result.items)) {
            resultArray = response.result.items
            totalCount = response.result.total || response.result.items.length
          } else if (response.result.data && Array.isArray(response.result.data)) {
            resultArray = response.result.data
            totalCount = response.result.total || response.result.data.length
          }
        }
      }
      
      let transformed = resultArray.map(item => ({
        id: item.appointmentId,
        customer: item.customerName || '',
        license: item.licensePlate || '',
        phone: item.customerPhone || '',
        status: statusMap[item.status] || item.status || 'Chờ',
        statusKey: item.status || 'CONFIRMED',
        time: item.timeSlotLabel || '',
        date: item.appointmentDate ? new Date(item.appointmentDate).toLocaleDateString('vi-VN') : '',
        dateRaw: item.appointmentDate,
        serviceType: Array.isArray(item.serviceType) ? item.serviceType.join(', ') : (item.serviceType || ''),
        note: item.note || '',
      }))
      
      if (statusFilter) {
        const statusKeyMap = {
          'Hủy': 'CANCELLED',
          'Đã đến': 'ARRIVED',
          'Chờ': 'CONFIRMED'
        }
        transformed = transformed.filter(item => item.statusKey === statusKeyMap[statusFilter])
      }
      
      if (selectedDate) {
        const filterDate = selectedDate.format('YYYY-MM-DD')
        transformed = transformed.filter(item => {
          if (!item.dateRaw) return false
          const itemDate = new Date(item.dateRaw).toISOString().split('T')[0]
          return itemDate === filterDate
        })
      }
      
      if (query) {
        transformed = transformed.filter(item => 
          item.license.toLowerCase().includes(query.toLowerCase())
        )
      }
      
      setData(transformed)
      setTotal(totalCount)
    } catch (err) {
      console.error('Error fetching appointments:', err)
      message.error('Đã xảy ra lỗi khi tải danh sách lịch hẹn.')
      setData([])
      setTotal(0)
      setLoading(false)
    }
  }

  const fetchAppointmentDetail = async (id) => {
    const { data: response, error } = await appointmentAPI.getById(id)
    
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
      setSelectedFull(response.result)
    } else {
      setSelectedFull(fallbackDetail)
    }
  }

  const filtered = useMemo(() => {
    return data
  }, [data])

  const timelineData = useMemo(() => {
    const targetDate = selectedDate ? selectedDate.format('DD/MM/YYYY') : '12/10/2025'
    const dayAppointments = data.filter((r) => r.date === targetDate)
    
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
    
    const hasAppointments = timeSlots.some(s => s.appointments.length > 0)
    if (!hasAppointments) {
      return [
        { time: '7:30 - 9:30', appointments: [{ id: 'demo-1' }, { id: 'demo-1b' }] },
        { time: '9:30 - 11:30', appointments: [{ id: 'demo-2' }] },
        { time: '13:30 - 15:30', appointments: [{ id: 'demo-3' }] },
        { time: '15:30 - 17:30', appointments: [{ id: 'demo-4' }] },
      ]
    }
    
    return timeSlots
  }, [data, selectedDate])

  const handleCreateTicket = async () => {
    if (!selectedFull && !selected) {
      message.error('Không tìm thấy thông tin lịch hẹn')
      return
    }

    const appointmentId = selectedFull?.appointmentId || selected?.id
    if (!appointmentId) {
      message.error('Không tìm thấy ID lịch hẹn')
      return
    }

    try {
      setLoading(true)
      const { data: response, error } = await appointmentAPI.updateStatus(appointmentId, 'ARRIVED')
      
      if (error) {
        message.error(error || 'Không thể cập nhật trạng thái lịch hẹn. Vui lòng thử lại.')
        setLoading(false)
        return
      }

      if (response && (response.statusCode === 200 || response.result)) {
        message.success('Đã cập nhật trạng thái lịch hẹn và tạo phiếu dịch vụ thành công!')
        
        navigate('/service-advisor/orders', { 
          state: { 
            appointmentId: appointmentId,
            customer: selectedFull?.customerName || selected?.customer,
            phone: selectedFull?.customerPhone || selected?.phone,
            licensePlate: selectedFull?.licensePlate || selected?.license
          } 
        })
        
        await fetchAppointments()
        
        setSelected(null)
        setSelectedFull(null)
      } else {
        message.error('Không thể cập nhật trạng thái lịch hẹn. Vui lòng thử lại.')
        setLoading(false)
      }
    } catch (err) {
      console.error('Error updating appointment status:', err)
      message.error('Đã xảy ra lỗi khi cập nhật trạng thái lịch hẹn.')
      setLoading(false)
    }
  }

  const handleViewDetail = async (record) => {
    setSelected(record)
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
      <div style={{ padding: '24px', background: '#ffffff', minHeight: '100vh' }}>
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
                      background: statusFilter === item.key ? '#CBB081' : '#fff',
                      borderColor: statusFilter === item.key ? '#CBB081' : '#e6e6e6',
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

        <Row gutter={16} className="appointments-layout">
          <Col span={24} className="table-col">
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
          
          <Col span={8} className="timeline-col">
            <div className="appointment-timeline-card">
              <div className="timeline-header">
                <span className="timeline-tag"># Timeline</span>
                <DatePicker
                  value={selectedDate}
                  onChange={setSelectedDate}
                  format="DD/MM/YYYY"
                  suffixIcon={<CalendarOutlined />}
                  className="timeline-date-picker"
                  placeholder="Chọn ngày"
                  allowClear={false}
                />
                </div>
              <Timeline
                className="appointment-timeline"
                items={timelineData.length > 0 ? timelineData.map((slot) => ({
                  color: '#CBB081',
                  children: (
                      <div className="timeline-content">
                      <div className="timeline-time">{slot.time}</div>
                      <div className="timeline-count">{slot.appointments.length} lịch hẹn</div>
                        </div>
                  )
                })) : []}
              />
              {timelineData.length === 0 && (
                  <div style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
                    Không có lịch hẹn
                  </div>
                )}
              </div>
          </Col>
        </Row>
      </div>

      <Modal
        title={null}
        open={!!selected}
        onCancel={() => { setSelected(null); setSelectedFull(null) }}
        footer={null}
        width={720}
        style={{ top: 20 }}
        closable={false}
        className="appointment-detail-modal"
      >
        {(selectedFull || selected) && (
          <div>
            <div style={{
              background: '#CBB081',
              padding: '16px 20px',
              margin: '-24px -24px 24px -24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTopLeftRadius: '8px',
              borderTopRightRadius: '8px'
            }}>
              <span style={{ fontWeight: 700, fontSize: '18px', color: '#111' }}>LỊCH HẸN CHI TIẾT</span>
              <CloseOutlined 
                onClick={() => { setSelected(null); setSelectedFull(null) }}
                style={{ fontSize: '18px', cursor: 'pointer', color: '#111', fontWeight: 700 }}
              />
            </div>

            <div style={{ padding: '0 4px' }}>
            <div style={{ marginBottom: '20px' }}>
                <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <strong style={{ fontSize: '14px', color: '#111', fontWeight: 600 }}>Tên khách hàng:</strong>
                  <span style={{ fontSize: '14px', color: '#111' }}>
                    {selectedFull?.customerName || selected?.customer}
                  </span>
                  <span style={{ marginLeft: '4px', display: 'flex', gap: '2px', alignItems: 'center' }}>
                    {[1, 2, 3].map((i) => (
                      <span key={i} style={{ color: '#ffd65a', fontSize: '14px' }}>★</span>
                    ))}
                  </span>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <strong style={{ fontSize: '14px', color: '#111', fontWeight: 600 }}>Số điện thoại:</strong>{' '}
                  <span style={{ fontSize: '14px', color: '#111' }}>
                    {selectedFull?.customerPhone || selected?.phone}
                </span>
              </div>
                <div style={{ marginBottom: '16px' }}>
                  <strong style={{ fontSize: '14px', color: '#111', fontWeight: 600 }}>Biển số xe:</strong>{' '}
                  <span style={{ fontSize: '14px', color: '#111' }}>
                    {selectedFull?.licensePlate || selected?.license}
                  </span>
              </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <div style={{ marginBottom: '16px' }}>
                  <strong style={{ fontSize: '14px', color: '#111', fontWeight: 600 }}>Ngày hẹn:</strong>{' '}
                  <span style={{ fontSize: '14px', color: '#111' }}>
                  {selectedFull?.appointmentDate 
                    ? new Date(selectedFull.appointmentDate).toLocaleDateString('vi-VN') 
                    : selected?.date}
                </span>
              </div>
                <div style={{ marginBottom: '16px' }}>
                  <strong style={{ fontSize: '14px', color: '#111', fontWeight: 600 }}>Khung giờ:</strong>{' '}
                  <span style={{ fontSize: '14px', color: '#111' }}>
                    {selectedFull?.timeSlotLabel || selected?.time}
                  </span>
              </div>
                <div style={{ marginBottom: '16px' }}>
                  <strong style={{ fontSize: '14px', color: '#111', fontWeight: 600 }}>Loại dịch vụ:</strong>{' '}
                  <span style={{ fontSize: '14px', color: '#111' }}>
                    {selectedFull?.serviceType || selected?.serviceType || 'Thay thế phụ tùng'}
                  </span>
              </div>
            </div>
            
            {selectedFull?.note && (
                <div style={{
                  marginBottom: '24px',
                  padding: '16px',
                  border: '2px dashed #e0e7ff',
                  borderRadius: '8px',
                  background: '#fff'
                }}>
                  <div style={{ fontWeight: 700, marginBottom: '12px', fontSize: '14px', color: '#111' }}>
                    Mô tả chi tiết tình trạng xe:
                  </div>
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                    <li style={{ fontSize: '14px', color: '#111', lineHeight: '1.6' }}>{selectedFull.note}</li>
                </ul>
              </div>
            )}
            
              <div style={{ textAlign: 'center', marginTop: '32px' }}>
              <Button
                type="primary"
                size="large"
                onClick={handleCreateTicket}
                style={{
                  background: '#22c55e',
                  borderColor: '#22c55e',
                    height: '48px',
                    padding: '0 48px',
                    fontWeight: 600,
                    fontSize: '16px',
                    borderRadius: '8px',
                    width: '100%',
                    maxWidth: '400px'
                }}
              >
                Tạo phiếu dịch vụ
              </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </AdminLayout>
  )
}
