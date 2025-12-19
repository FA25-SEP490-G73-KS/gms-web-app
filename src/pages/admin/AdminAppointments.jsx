import React, { useState, useEffect, useRef } from 'react'
import { Table, Input, Card, Badge, Modal, Space, Button, Row, Col, message, Popconfirm } from 'antd'
import { EyeOutlined, SearchOutlined, CalendarOutlined } from '@ant-design/icons'
import AdminLayout from '../../layouts/AdminLayout'
import { appointmentAPI, serviceTicketAPI } from '../../services/api'
import { useNavigate } from 'react-router-dom'
import { goldTableHeader } from '../../utils/tableComponents'
import '../../styles/pages/admin/admin-appointments.css'
import { displayPhoneFrom84 } from '../../utils/helpers'
import dayjs from 'dayjs'

const { Search } = Input

const STATUS_ITEMS = [
  { key: 'ALL', label: 'Tất cả', color: '#6b7280' },
  { key: 'CANCELLED', label: 'Hủy', color: '#ef4444' },
  { key: 'ARRIVED', label: 'Đã đến', color: '#16a34a' },
  { key: 'CONFIRMED', label: 'Chờ', color: '#e89400' },
]

const statusMap = {
  'CONFIRMED': 'Chờ',
  'CANCELLED': 'Hủy',
  'ARRIVED': 'Đã đến',
  'OVERDUE': 'Quá hạn',
  'COMPLETED': 'Hoàn thành',
  'Đã xác nhận': 'Đã xác nhận',
  'Đã đến': 'Đã đến',
  'Hủy': 'Hủy',
  'Đã hủy': 'Hủy',
  'Chờ': 'Chờ'
}

// Map status tiếng Việt từ backend sang key tiếng Anh cho filter
const statusToKeyMap = {
  'Đã xác nhận': 'CONFIRMED',
  'Đã đến': 'ARRIVED',
  'Hủy': 'CANCELLED',
  'Đã hủy': 'CANCELLED',
  'Chờ': 'CONFIRMED',
  'CONFIRMED': 'CONFIRMED',
  'ARRIVED': 'ARRIVED',
  'CANCELLED': 'CANCELLED',
  'OVERDUE': 'OVERDUE',
  'COMPLETED': 'COMPLETED'
}

const getStatusConfig = (status) => {
  if (!status) return { color: '#111', text: 'Không rõ' }
  
  const statusStr = String(status).trim()
  
  // Xử lý tiếng Việt
  switch (statusStr) {
    case 'Hủy':
    case 'Đã hủy':
      return { color: '#ef4444', text: 'Hủy' }
    case 'Đã đến':
      return { color: '#16a34a', text: 'Đã đến' }
    case 'Đã xác nhận':
      return { color: '#e89400', text: 'Đã xác nhận' }
    case 'Chờ':
      return { color: '#e89400', text: 'Chờ' }
    case 'Quá hạn':
      return { color: '#666', text: 'Quá hạn' }
  }
  
  // Xử lý tiếng Anh (enum values)
  switch (statusStr.toUpperCase()) {
    case 'CANCELLED':
    case 'CANCELED':
      return { color: '#ef4444', text: 'Hủy' }
    case 'ARRIVED':
      return { color: '#16a34a', text: 'Đã đến' }
    case 'CONFIRMED':
      return { color: '#e89400', text: 'Đã xác nhận' }
    case 'OVERDUE':
      return { color: '#666', text: 'Quá hạn' }
    case 'COMPLETED':
      return { color: '#16a34a', text: 'Hoàn thành' }
  }
  
  // Fallback: trả về status gốc nếu không match
  return { color: '#111', text: statusStr }
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

/**
 * Helper normalize to ISO 'YYYY-MM-DD'
 */
const normalizeToISODate = (d) => {
  if (!d && d !== 0) return null
  if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)) return d
  if (typeof d === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(d)) {
    const parsed = dayjs(d, 'DD/MM/YYYY')
    return parsed.isValid() ? parsed.format('YYYY-MM-DD') : null
  }
  const parsed = dayjs(d)
  return parsed.isValid() ? parsed.format('YYYY-MM-DD') : null
}

export default function AdminAppointments() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(6)
  const [selected, setSelected] = useState(null)
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedFull, setSelectedFull] = useState(null)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'))
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [updatingStatusId, setUpdatingStatusId] = useState(null)
  const [timeSlots, setTimeSlots] = useState([])
  const [timeSlotsLoading, setTimeSlotsLoading] = useState(false)
  const [hoveredAppointmentTime, setHoveredAppointmentTime] = useState(null)

 
  const dateInputRef = useRef(null)

  useEffect(() => {
    fetchAppointments()
  }, [])

  useEffect(() => {
    if (selectedDate) {
      fetchTimeSlots()
    } else {
      setTimeSlots([])
    }
  }, [selectedDate])

  const fetchTimeSlots = async () => {
    if (!selectedDate) {
      setTimeSlots([])
      return
    }

    setTimeSlotsLoading(true)
    try {
      const dateStr = typeof selectedDate === 'string' 
        ? selectedDate 
        : dayjs(selectedDate).format('YYYY-MM-DD')
      
      console.log('Fetching time slots for date:', dateStr)
      const { data: response, error } = await appointmentAPI.getTimeSlots(dateStr)
      
      if (error) {
        console.error('Error fetching time slots:', error)
        
        const defaultSlots = [
          { timeSlotId: 1, label: '7:30 - 9:30', startTime: '7:30', endTime: '9:30', maxCapacity: 5, booked: 0 },
          { timeSlotId: 2, label: '9:30 - 11:30', startTime: '9:30', endTime: '11:30', maxCapacity: 5, booked: 0 },
          { timeSlotId: 3, label: '13:30 - 15:30', startTime: '13:30', endTime: '15:30', maxCapacity: 5, booked: 0 },
          { timeSlotId: 4, label: '15:30 - 17:30', startTime: '15:30', endTime: '17:30', maxCapacity: 5, booked: 0 }
        ]
        setTimeSlots(defaultSlots)
        setTimeSlotsLoading(false)
        return
      }

      console.log('Time slots response:', response)
      if (response && response.result && Array.isArray(response.result)) {
        setTimeSlots(response.result)
      } else if (Array.isArray(response)) {
        setTimeSlots(response)
      } else {
     
        const defaultSlots = [
          { timeSlotId: 1, label: '7:30 - 9:30', startTime: '7:30', endTime: '9:30', maxCapacity: 5, booked: 0 },
          { timeSlotId: 2, label: '9:30 - 11:30', startTime: '9:30', endTime: '11:30', maxCapacity: 5, booked: 0 },
          { timeSlotId: 3, label: '13:30 - 15:30', startTime: '13:30', endTime: '15:30', maxCapacity: 5, booked: 0 },
          { timeSlotId: 4, label: '15:30 - 17:30', startTime: '15:30', endTime: '17:30', maxCapacity: 5, booked: 0 }
        ]
        setTimeSlots(defaultSlots)
      }
    } catch (err) {
      console.error('Error fetching time slots:', err)
    
      const defaultSlots = [
        { timeSlotId: 1, label: '7:30 - 9:30', startTime: '7:30', endTime: '9:30', maxCapacity: 5, booked: 0 },
        { timeSlotId: 2, label: '9:30 - 11:30', startTime: '9:30', endTime: '11:30', maxCapacity: 5, booked: 0 },
        { timeSlotId: 3, label: '13:30 - 15:30', startTime: '13:30', endTime: '15:30', maxCapacity: 5, booked: 0 },
        { timeSlotId: 4, label: '15:30 - 17:30', startTime: '15:30', endTime: '17:30', maxCapacity: 5, booked: 0 }
      ]
      setTimeSlots(defaultSlots)
    } finally {
      setTimeSlotsLoading(false)
    }
  }

  const fetchAppointments = async () => {
    setLoading(true)
    try {
      const { data: response, error } = await appointmentAPI.getAll()

      if (error) {
        console.error('Error fetching appointments:', error)
        processData([])
        setLoading(false)
        return
      }

      let resultArray = []

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

      processData(resultArray)

    } catch (err) {
      console.error('Error fetching appointments:', err)
      processData([])
    } finally {
      setLoading(false)
    }
  }

 
  const processData = (rawData) => {
    const transformed = rawData.map(item => {
      const serviceLabel = extractServiceLabel(item)
      const rawDateCandidate = item.appointmentDate || item.date || item.appointment_date || null
      const dateRawISO = normalizeToISODate(rawDateCandidate)
      const dateDisplay = dateRawISO ? dayjs(dateRawISO).format('DD/MM/YYYY') : (item.appointmentDate ? String(item.appointmentDate) : '')
      const rawStatus = item.status || 'CONFIRMED'
      const normalizedStatus = statusMap[rawStatus] || rawStatus || 'Chờ'
      const normalizedStatusKey = statusToKeyMap[rawStatus] || statusToKeyMap[normalizedStatus] || 'CONFIRMED'
      
      return {
      id: item.appointmentId || item.id,
      customer: item.customerName || item.customer?.fullName || item.customer?.name || '',
      license: formatLicensePlate(item.licensePlate || item.license || ''),
      phone: displayPhoneFrom84(item.customerPhone || item.customer?.phone || ''),
        status: normalizedStatus,
        statusKey: normalizedStatusKey,
      time: item.timeSlotLabel || item.time || '',
        date: dateDisplay,
        dateRaw: dateRawISO,
      serviceType: serviceLabel || '',
      note: item.note || '',
      originalItem: item
      }
    })
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
             serviceType: selected.serviceType || extractServiceLabel(selected.originalItem),
             status: selected.status,
             statusKey: selected.statusKey
         })
      }
      return
    }

    if (response && response.result) {
      const result = response.result
      const rawStatus = result.status || 'CONFIRMED'
      const normalizedStatusKey = statusToKeyMap[rawStatus] || statusToKeyMap[statusMap[rawStatus]] || 'CONFIRMED'
      setSelectedFull({
        ...result,
        customerName: result.customerName || result.customer?.fullName || '',
        customerPhone: displayPhoneFrom84(result.customerPhone || result.customer?.phone || ''),
        licensePlate: formatLicensePlate(result.licensePlate || result.vehicle?.licensePlate || ''),
        serviceType: extractServiceLabel(result),
        statusKey: normalizedStatusKey
      })
    }
  }

  let filtered = data

    // Filter by search query
    if (query) {
      const q = query.toLowerCase()
    filtered = filtered.filter(
        (r) =>
          (r.license && r.license.toLowerCase().includes(q)) ||
          (r.customer && r.customer.toLowerCase().includes(q)) ||
          (r.phone && r.phone.toLowerCase().includes(q))
      )
    }

    // Filter by status
  if (statusFilter && statusFilter !== 'ALL') {
    filtered = filtered.filter((r) => r.statusKey === statusFilter)
    }

    // Filter by date (using ISO comparison)
    if (selectedDate) {
      filtered = filtered.filter((r) => {
        if (r.dateRaw) return r.dateRaw === selectedDate
        const isoFromDisplay = normalizeToISODate(r.date)
        return isoFromDisplay === selectedDate
      })
    }


  const normalizeTimeString = (timeStr) => {
    if (!timeStr) return ''
 
    return timeStr
      .replace(/\s+/g, '')
      .replace(/[:\-]/g, '')
      .toLowerCase()
  }

  // Helper function to match appointment time with slot
  const matchesTimeSlot = (apt, slot) => {
    // First try to match by timeSlotId if available
    if (apt.originalItem?.timeSlotId && slot.timeSlotId) {
      return apt.originalItem.timeSlotId === slot.timeSlotId
    }
    
    const aptTime = apt.time || apt.timeSlotLabel || apt.originalItem?.timeSlotLabel || ''
    if (!aptTime) return false
    
    const slotLabel = slot.label || `${slot.startTime} - ${slot.endTime}`
    const normalizedAptTime = normalizeTimeString(aptTime)
    const normalizedSlotLabel = normalizeTimeString(slotLabel)
    
    // Exact match after normalization
    if (normalizedAptTime === normalizedSlotLabel) return true
    
    // Check if appointment time contains slot start/end times
    if (slot.startTime && slot.endTime) {
      const normalizedStart = normalizeTimeString(slot.startTime)
      const normalizedEnd = normalizeTimeString(slot.endTime)
      // Check if appointment time contains both start and end times
      if (normalizedAptTime.includes(normalizedStart) && normalizedAptTime.includes(normalizedEnd)) {
        return true
      }
    }
    
    // Fallback: check if either contains the other
    if (normalizedAptTime.includes(normalizedSlotLabel) || normalizedSlotLabel.includes(normalizedAptTime)) {
      return true
    }
    
    return false
  }

  
  const displayDate = selectedDate 
    ? (typeof selectedDate === 'string' ? dayjs(selectedDate).format('DD/MM/YYYY') : dayjs(selectedDate).format('DD/MM/YYYY'))
    : null
  
  let timelineData = []
  if (displayDate && timeSlots.length > 0) {
   
    const dayAppointments = selectedDate ? filtered : filtered.filter((r) => {
      return r.date === displayDate || r.dateRaw === normalizeToISODate(displayDate)
    })

    const slotsWithAppointments = timeSlots.map((slot) => {
      const slotLabel = slot.label || `${slot.startTime} - ${slot.endTime}`
      const appointments = dayAppointments.filter((apt) => {
        return matchesTimeSlot(apt, slot)
      })
      return {
        ...slot,
        time: slotLabel,
        appointments: appointments
      }
    })

    timelineData = slotsWithAppointments
  }

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

      // Gọi API để lấy thông tin appointment đầy đủ
      console.log('Fetching appointment details from API...')
      const { data: appointmentResponse, error: appointmentError } = await appointmentAPI.getById(appointmentId)
      
      if (appointmentError || !appointmentResponse || !appointmentResponse.result) {
        console.error('Error fetching appointment:', appointmentError)
        message.error('Không thể lấy thông tin lịch hẹn')
        setUpdatingStatus(false)
        return
      }
      
      const fullAppointmentData = appointmentResponse.result
      console.log('✓ Appointment data fetched:', fullAppointmentData)

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

      // Chuẩn bị data để pass sang CreateTicket
      const navigationState = {
        fromAppointment: true,
        appointmentId: appointmentId,
        appointmentData: fullAppointmentData // Truyền toàn bộ dữ liệu từ API
      }

      console.log('=== [AdminAppointments] Navigation State ===')
      console.log('State to pass:', JSON.stringify(navigationState, null, 2))
      console.log('============================================')
      
      message.success('Đang chuyển sang trang tạo phiếu dịch vụ...')
      
      // Clean up first
      setSelected(null)
      setSelectedFull(null)
      setUpdatingStatus(false)
      
      // Navigate to CreateTicket page - sẽ gọi API để fill dữ liệu
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

  const handleCancelAppointment = async () => {
    const appointmentId = selectedFull?.appointmentId || selectedFull?.id || selected?.id
    if (!appointmentId) {
      message.error('Không tìm thấy ID lịch hẹn')
      return
    }

    setUpdatingStatus(true)
    try {
      const { error } = await appointmentAPI.updateStatus(appointmentId, 'CANCELLED')
      
      if (error) {
        message.error(error || 'Hủy lịch hẹn thất bại')
        setUpdatingStatus(false)
        return
      }

      message.success('Hủy lịch hẹn thành công')
      
      // Refresh danh sách lịch hẹn
      await fetchAppointments()
      
      // Refresh time slots
      await fetchTimeSlots()
      
      // Đóng modal và reset state
      setSelected(null)
      setSelectedFull(null)
      setUpdatingStatus(false)
    } catch (err) {
      console.error('Error canceling appointment:', err)
      message.error('Đã xảy ra lỗi khi hủy lịch hẹn')
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
        serviceType: record.serviceType || extractServiceLabel(record.originalItem),
        status: record.status,
        statusKey: record.statusKey
      })
    }
    await fetchAppointmentDetail(record.id)
  }

  // Helper function to normalize and compare time strings
  const normalizeTimeForComparison = (timeStr) => {
    if (!timeStr) return ''
    // Remove all spaces, convert to lowercase, normalize time format
    return timeStr.replace(/\s+/g, '').replace(/:/g, '').toLowerCase()
  }

  const isTimeMatch = (appointmentTime, slotLabel, slotStartTime, slotEndTime) => {
    if (!appointmentTime) return false
    
    const normalizedAppt = normalizeTimeForComparison(appointmentTime)
    const normalizedSlot = normalizeTimeForComparison(slotLabel)
    
    // Priority 1: Direct exact match with slot label
    if (normalizedAppt === normalizedSlot) return true
    
    // Priority 2: Check if both start and end times match (appointment must contain both)
    const normalizedStart = normalizeTimeForComparison(slotStartTime)
    const normalizedEnd = normalizeTimeForComparison(slotEndTime)
    
    // Only match if appointment contains BOTH start and end time (not just one)
    if (normalizedStart && normalizedEnd) {
      const hasStart = normalizedAppt.includes(normalizedStart)
      const hasEnd = normalizedAppt.includes(normalizedEnd)
      // Both must be present to match
      if (hasStart && hasEnd) return true
    }
    
    // Priority 3: Check if slot label contains the full appointment time
    if (normalizedSlot && normalizedAppt && normalizedSlot.includes(normalizedAppt)) return true
    
    return false
  }

  const handleStatusChange = async (appointmentId, newStatus) => {
    if (!appointmentId || !newStatus) return
    
    setUpdatingStatusId(appointmentId)
    try {
      const { error } = await appointmentAPI.updateStatus(appointmentId, newStatus)
      if (error) {
        message.error('Cập nhật trạng thái thất bại')
        return
      }
      message.success('Cập nhật trạng thái thành công')
      await fetchAppointments()
    } catch (err) {
      console.error('Error updating status:', err)
      message.error('Đã xảy ra lỗi khi cập nhật trạng thái')
    } finally {
      setUpdatingStatusId(null)
    }
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
      width: 150,
      render: (status, record) => {
        const config = getStatusConfig(status)
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: 80,
              padding: '4px 10px',
              borderRadius: 999,
              fontSize: 13,
              fontWeight: 600,
              color: '#fff',
              backgroundColor: config.color
            }}
          >
              {config.text}
          </span>
        )
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
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 4px 0', color: '#111' }}>Quản lý Lịch hẹn</h1>
          <p style={{ margin: '0 0 20px 0', fontSize: 14, color: '#6b7280' }}>
            Theo dõi và quản lý lịch hẹn sửa chữa của khách hàng theo ngày, trạng thái và khung giờ.
          </p>
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
                    onClick={() => setStatusFilter(item.key)}
                  >
                    {item.label}
                  </Button>
                ))}
              </Space>
            </Col>
            <Col>
              {/* --- CUSTOM DATE PICKER --- */}
              <div
                className="appointment-date-picker"
                style={{
                  position: 'relative',
                  display: 'inline-flex',
                  alignItems: 'center',
                  background: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: 8,
                  padding: '6px 10px',
                  minWidth: 180
                }}
              >
                {!selectedDate && <span style={{ color: '#9ca3af', marginRight: 8, fontSize: 14 }}>dd/mm/yyyy</span>}
                <input
                  ref={dateInputRef}
                  type="date"
                  className={`appointment-date-input${selectedDate ? ' has-value' : ''}`}
                  value={selectedDate || ''}
                  onChange={(e) => {
                    const value = e.target.value
                    setSelectedDate(value || null)
                  }}
                  style={{
                    border: 'none',
                    outline: 'none',
                    fontSize: 14,
                    background: 'transparent',
                    padding: '6px 8px',
                    paddingRight: 36,
                    width: selectedDate ? '140px' : '0px',
                    opacity: selectedDate ? 1 : 0,
                    position: selectedDate ? 'relative' : 'absolute'
                  }}
                />
                {/* clear button */}
                {selectedDate && (
                  <button
                    type="button"
                    onClick={() => setSelectedDate(null)}
                    style={{
                      position: 'absolute',
                      right: 36,
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 16,
                      lineHeight: 1,
                      color: '#6b7280'
                    }}
                    aria-label="clear date"
                  >
                    ×
                  </button>
                )}
                {/* calendar icon: focus/showPicker on input when clicked */}
                <div
                  onClick={() => {
                    const el = dateInputRef.current
                    if (!el) return
                    if (typeof el.showPicker === 'function') {
                      try { el.showPicker(); return } catch (e) { /* ignore */ }
                    }
                    el.focus()
                  }}
                  style={{
                    position: 'absolute',
                    right: 8,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 24,
                    height: 24,
                    color: '#6b7280'
                  }}
                >
                  <CalendarOutlined />
                </div>
              </div>
            </Col>
          </Row>
        </div>

        <Row gutter={24}>
          <Col span={19}>
            <Card 
              style={{ 
                borderRadius: '16px', 
                boxShadow: '0 12px 30px rgba(15, 23, 42, 0.08)',
                background: '#fff',
                padding: '16px'
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
                  showSizeChanger: false,
                  showTotal: (total) => `Tổng ${total} lịch hẹn`,
                  onChange: (p) => setPage(p)
                }}
                size="middle"
                components={goldTableHeader}
                style={{ padding: 0 }}
                onRow={(record) => ({
                  onMouseEnter: () => {
                    setHoveredAppointmentTime(record.time)
                  },
                  onMouseLeave: () => {
                    setHoveredAppointmentTime(null)
                  }
                })}
              />
            </Card>
          </Col>
          
          <Col span={5}>
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
                    {displayDate || 'Tất cả lịch hẹn'}
                  </div>
                </div>
              </div>

              {timeSlotsLoading ? (
                <div style={{ textAlign: 'center', color: '#9ca3af', padding: '40px 0' }}>
                  <div>Đang tải...</div>
                </div>
              ) : (timeSlots.length > 0 || selectedDate) ? (
                <div style={{ position: 'relative', paddingLeft: '36px', minHeight: '320px' }}>
                  <div
                    style={{
                      position: 'absolute',
                      left: '46px',
                      top: '0',
                      bottom: '0',
                      width: '4px',
                      background: '#CBB081',
                      borderRadius: '2px',
                      zIndex: 0,
                      transform: 'translateX(-50%)'
                    }}
                  />
                  {timeSlots.map((slot, index) => {
                    const slotLabel = slot.label || `${slot.startTime} - ${slot.endTime}`
                    const totalCapacity = slot.maxCapacity || 1
                    const booked = slot.booked !== undefined && slot.booked !== null ? slot.booked : 0
                    const progressPercent = totalCapacity > 0 ? (booked / totalCapacity) * 100 : 0
                    const isLast = index === timeSlots.length - 1
                    const progressColor = progressPercent >= 100 ? '#ef4444' : progressPercent >= 80 ? '#f59e0b' : '#16a34a'
                    
                    const isHovered = hoveredAppointmentTime && isTimeMatch(
                      hoveredAppointmentTime, 
                      slotLabel, 
                      slot.startTime, 
                      slot.endTime
                    )
                    
                    return (
                      <div key={slot.timeSlotId || index} style={{ display: 'flex', gap: '16px', marginBottom: isLast ? 0 : '48px', position: 'relative', zIndex: 1 }}>
                        <div style={{ position: 'relative', width: '20px', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', flexShrink: 0 }}>
                          <div
                            style={{
                              width: isHovered ? '20px' : '16px',
                              height: isHovered ? '20px' : '16px',
                              borderRadius: '50%',
                              background: isHovered ? '#16a34a' : progressColor,
                              border: '3px solid #fff',
                              boxShadow: isHovered 
                                ? '0 0 0 3px #16a34a, 0 0 12px rgba(22, 163, 74, 0.5)' 
                                : '0 0 0 2px #e5e7eb',
                              position: 'relative',
                              zIndex: 2,
                              marginLeft: '0',
                              marginTop: '0',
                              transition: 'all 0.3s ease'
                            }}
                          />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '16px', fontWeight: 600, color: '#04091e', marginBottom: '4px' }}>
                            {slotLabel}
                             </div>
                          <div style={{ fontSize: '14px', color: '#6b7280' }}>
                            {booked} lịch hẹn
                         </div>
                      </div>
                    </div>
                    )
                  })}
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
                        {(() => {
                          // Ưu tiên status từ response (selectedFull?.status), fallback về statusKey hoặc selected?.status
                          const statusToDisplay = selectedFull?.status || selectedFull?.statusKey || selected?.status || ''
                          const statusConfig = getStatusConfig(statusToDisplay)
                          return (
                            <Badge 
                              color={statusConfig.color} 
                              text={statusConfig.text}
                              style={{ fontSize: '16px', fontWeight: 600 }}
                            />
                          )
                        })()}
                    </div>
                </div>
            </div>
            
            <div style={{ marginTop: '16px', background: '#f9f9f9', padding: '16px', borderRadius: '8px' }}>
                <div style={{ fontWeight: 700, marginBottom: '8px' }}>Ghi chú / Tình trạng xe:</div>
                <div style={{ whiteSpace: 'pre-wrap' }}>{selectedFull?.note || selected?.note || 'Không có ghi chú'}</div>
            </div>
            
            <div style={{ textAlign: 'center', marginTop: '32px', display: 'flex', gap: '12px', justifyContent: 'center' }}>
              {(() => {
                const currentStatus = selectedFull?.status || selected?.status || ''
                const currentStatusKey = selectedFull?.statusKey || selected?.statusKey || ''
                const isCancelled = currentStatusKey === 'CANCELLED' || 
                                   currentStatus === 'CANCELLED' || 
                                   currentStatus === 'Hủy' || 
                                   currentStatus === 'Đã hủy'
                return (
                  <>
                    {!isCancelled && (
                      <Popconfirm
                        title="Hủy lịch hẹn"
                        description="Bạn có chắc chắn muốn hủy lịch hẹn này?"
                        onConfirm={handleCancelAppointment}
                        okText="Xác nhận"
                        cancelText="Hủy"
                        okButtonProps={{ danger: true }}
                      >
                        <Button
                          type="default"
                          size="large"
                          loading={updatingStatus}
                          disabled={updatingStatus}
                          style={{
                            height: '45px',
                            padding: '0 40px',
                            fontWeight: 600,
                            fontSize: '16px',
                            borderColor: '#ef4444',
                            color: '#ef4444'
                          }}
                        >
                          Hủy lịch hẹn
                        </Button>
                      </Popconfirm>
                    )}
                    <Button
                      type="primary"
                      size="large"
                      onClick={handleCreateTicket}
                      loading={updatingStatus}
                      disabled={updatingStatus || isCancelled}
                      style={{
                        background: isCancelled ? '#9ca3af' : '#22c55e',
                        borderColor: isCancelled ? '#9ca3af' : '#22c55e',
                        height: '45px',
                        padding: '0 40px',
                        fontWeight: 600,
                        fontSize: '16px',
                        cursor: isCancelled ? 'not-allowed' : 'pointer',
                        opacity: isCancelled ? 0.6 : 1
                      }}
                    >
                      Tạo Phiếu Dịch Vụ
                    </Button>
                  </>
                )
              })()}
            </div>
            
          </div>
        )}
      </Modal>
    </AdminLayout>
  )
}