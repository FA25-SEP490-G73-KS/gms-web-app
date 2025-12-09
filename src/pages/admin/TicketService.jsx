import React, { useMemo, useState, useEffect } from 'react'
import { Table, Input, Card, Badge, Space, message, Button, Row, Col, Form, Select, Modal } from 'antd'
import { SearchOutlined, CalendarOutlined, CloseOutlined } from '@ant-design/icons'
import AdminLayout from '../../layouts/AdminLayout'
import TicketDetail from './modals/TicketDetail'
import UpdateTicketModal from './modals/UpdateTicketModal'
import { serviceTicketAPI, employeeAPI } from '../../services/api'
import { useNavigate, useLocation } from 'react-router-dom'
import { goldTableHeader } from '../../utils/tableComponents'
import { normalizePhoneTo84, displayPhoneFrom84 } from '../../utils/helpers'
import '../../styles/pages/admin/ticketservice.css'

const { Search } = Input
const { TextArea } = Input
const SERVICES = [
  { label: 'Thay thế phụ tùng', value: 1 },
  { label: 'Sơn', value: 2 },
  { label: 'Bảo dưỡng', value: 3 }
]


const STATUS_MAP = {
  'CREATED': 'Đã tạo',
  'WAITING_FOR_QUOTATION': 'Chờ báo giá',
  'WAITING_FOR_DELIVERY': 'Chờ bàn giao xe',
  'COMPLETED': 'Hoàn thành',
  'CANCELED': 'Hủy'
}

const STATUS_FILTERS = [
  { key: 'CREATED', label: 'Đã tạo' },
  { key: 'WAITING_FOR_QUOTATION', label: 'Chờ báo giá' },
  { key: 'WAITING_FOR_DELIVERY', label: 'Chờ bàn giao xe' },
  { key: 'COMPLETED', label: 'Hoàn thành' },
  { key: 'CANCELED', label: 'Hủy' },
]

const getStatusConfig = (status) => {
  switch (status) {
    case 'Hủy':
    case 'CANCELED':
    case 'CANCELLED':
      return { color: '#ef4444', text: 'Hủy' }
    case 'Chờ báo giá':
    case 'WAITING_FOR_QUOTATION':
    case 'WAITING_QUOTE':
      return { color: '#ffd65a', text: 'Chờ báo giá' }
    case 'Chờ bàn giao xe':
    case 'WAITING_FOR_DELIVERY':
    case 'WAITING_HANDOVER':
      return { color: '#3b82f6', text: 'Chờ bàn giao xe' }
    case 'Hoàn thành':
    case 'COMPLETED':
      return { color: '#22c55e', text: 'Hoàn thành' }
    case 'Đã tạo':
    case 'CREATED':
      return { color: '#666', text: 'Đã tạo' }
    default:
      return { color: '#666', text: status }
  }
}

export default function TicketService() {
  const navigate = useNavigate()
  const location = useLocation()
  const isHistoryPage = location.pathname === '/service-advisor/orders/history'
  
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [selected, setSelected] = useState(null)
  const [updateModalOpen, setUpdateModalOpen] = useState(false)
  const [updateTicketId, setUpdateTicketId] = useState(null)
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [updatingStatusId, setUpdatingStatusId] = useState(null)
  
  const [statusFilter, setStatusFilter] = useState(null)
  const [dateFilter, setDateFilter] = useState(null)

  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [createForm] = Form.useForm()
  const [createLoading, setCreateLoading] = useState(false)
  const [selectedServices, setSelectedServices] = useState([])
  const [selectKey, setSelectKey] = useState(0)
  const [currentAppointmentId, setCurrentAppointmentId] = useState(null)
  const [technicians, setTechnicians] = useState([])
  const [techniciansLoading, setTechniciansLoading] = useState(false)

  useEffect(() => {
    fetchServiceTickets()
  }, [page, pageSize, statusFilter, dateFilter])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchServiceTickets()
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    if (location.state?.appointmentId) {
      const appointmentId = location.state.appointmentId
      setCurrentAppointmentId(appointmentId)
      setCreateModalOpen(true)
      
      if (location.state.customer || location.state.phone || location.state.licensePlate) {
        createForm.setFieldsValue({
          name: location.state.customer || '',
          phone: displayPhoneFrom84(location.state.phone || ''),
          plate: location.state.licensePlate || ''
        })
      }
      
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [location.state])


  useEffect(() => {
    fetchServiceTickets()
  }, [])

  useEffect(() => {
    if (createModalOpen) {
      fetchTechnicians()
    }
  }, [createModalOpen])

  const fetchTechnicians = async () => {
    setTechniciansLoading(true)
    try {
      const { data: response, error } = await employeeAPI.getTechnicians()
      
      if (error) {
        console.error('Error fetching technicians:', error)
        message.error('Không thể tải danh sách kỹ thuật viên. Vui lòng thử lại.')
        setTechnicians([])
        setTechniciansLoading(false)
        return
      }

      if (response && Array.isArray(response.result)) {
        const techList = response.result.map(tech => ({
          value: tech.employeeId,
          label: tech.fullName
        }))
        setTechnicians(techList)
      } else if (Array.isArray(response)) {
        const techList = response.map(tech => ({
          value: tech.employeeId,
          label: tech.fullName
        }))
        setTechnicians(techList)
      } else {
        setTechnicians([])
      }
    } catch (err) {
      console.error('Error fetching technicians:', err)
      message.error('Đã xảy ra lỗi khi tải danh sách kỹ thuật viên.')
      setTechnicians([])
    } finally {
      setTechniciansLoading(false)
    }
  }

  const fetchServiceTickets = async () => {
    setLoading(true)
    const { data: response, error } = await serviceTicketAPI.getAll()
    setLoading(false)
    
    
    const fallbackData = [
      {
        id: 1,
        code: 'STK-2025-000001',
        customer: 'Phạm Văn A',
        license: '25A-123456',
        status: 'CREATED',
        statusKey: 'CREATED',
        createdAt: '13/10/2025',
        total: 0,
        rawData: {}
      },
      {
        id: 2,
        code: 'STK-2025-000001',
        customer: 'Phạm Văn A',
        license: '25A-123456',
        status: 'WAITING_QUOTE',
        statusKey: 'WAITING_QUOTE',
        createdAt: '13/10/2025',
        total: 0,
        rawData: {}
      },
      {
        id: 3,
        code: 'STK-2025-000001',
        customer: 'Phạm Văn A',
        license: '25A-123456',
        status: 'WAITING_HANDOVER',
        statusKey: 'WAITING_HANDOVER',
        createdAt: '13/10/2025',
        total: 0,
        rawData: {}
      },
      {
        id: 4,
        code: 'STK-2025-000001',
        customer: 'Phạm Văn A',
        license: '25A-123456',
        status: 'CANCELLED',
        statusKey: 'CANCELLED',
        createdAt: '13/10/2025',
        total: 0,
        rawData: {}
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
    
  
    if (resultArray.length === 0) {
      console.warn('No data from API, using fallback data')
      setData(fallbackData)
      return
    }
    
    const transformed = resultArray.map(item => ({
      id: item.serviceTicketId,
      code: item.code || `STK-2025-${String(item.serviceTicketId || 0).padStart(6, '0')}`,
      customer: item.customer?.fullName || 'N/A',
      license: item.vehicle?.licensePlate || 'N/A',
      status: item.status || 'CREATED',
      statusKey: item.status || 'CREATED',
      createdAt: item.createdAt ? new Date(item.createdAt).toLocaleDateString('vi-VN') : new Date().toLocaleDateString('vi-VN'),
      total: item.total || 0,
      rawData: item
    }))
    setData(transformed)
  }

  const filtered = useMemo(() => {
    let result = data
    
   
    if (isHistoryPage) {
      result = result.filter((r) => {
        const statusKey = r.statusKey || r.status
      
        return statusKey === 'WAITING_HANDOVER' || 
               statusKey === 'Chờ bàn giao xe' ||
               statusKey === 'CANCELLED' ||
               statusKey === 'Hủy' ||
               statusKey === 'COMPLETED' ||
               statusKey === 'Hoàn thành'
      })
    }
    
    
    if (query) {
      const q = query.toLowerCase()
      result = result.filter(
        (r) => r.license.toLowerCase().includes(q) || r.customer.toLowerCase().includes(q)
      )
    }
    
  
    if (!isHistoryPage && statusFilter) {
      result = result.filter((r) => {
        const statusKey = r.statusKey || r.status
        return statusKey === statusFilter || 
               (statusFilter === 'CREATED' && (statusKey === 'CREATED' || statusKey === 'Đã tạo')) ||
               (statusFilter === 'WAITING_QUOTE' && (statusKey === 'WAITING_QUOTE' || statusKey === 'Chờ báo giá')) ||
               (statusFilter === 'WAITING_HANDOVER' && (statusKey === 'WAITING_HANDOVER' || statusKey === 'Chờ bàn giao xe')) ||
               (statusFilter === 'CANCELLED' && (statusKey === 'CANCELLED' || statusKey === 'Hủy'))
      })
    }
    
    
    if (dateFilter) {
      const filterDate = dateFilter.format('DD/MM/YYYY')
      result = result.filter((r) => r.createdAt === filterDate)
    }
    
    return result
  }, [query, data, statusFilter, dateFilter, isHistoryPage])

  const handleUpdate = (record) => {
    setUpdateTicketId(record.id)
    setUpdateModalOpen(true)
  }

  const handleUpdateSuccess = () => {
    fetchServiceTickets()
  }

  const handleStatusChange = async (ticketId, newStatus, currentStatus) => {
    if (!ticketId || !newStatus || newStatus === currentStatus) return
    
    setUpdatingStatusId(ticketId)
    try {
      const { data, error } = await serviceTicketAPI.updateStatus(ticketId, newStatus)
      
      if (error) {
        message.error('Không thể cập nhật trạng thái')
        return
      }
      
      message.success('Cập nhật trạng thái thành công')
      await fetchServiceTickets()
    } catch (err) {
      console.error('Error updating ticket status:', err)
      message.error('Đã xảy ra lỗi khi cập nhật trạng thái')
    } finally {
      setUpdatingStatusId(null)
    }
  }


  const handleServiceSelect = (value) => {
    if (!value) return
    
    const service = SERVICES.find(s => s.value === value)
    if (service) {
      const isAlreadySelected = selectedServices.some(s => s.value === value)
      if (!isAlreadySelected) {
        setSelectedServices([...selectedServices, { ...service, id: `${service.value}-${Date.now()}` }])
        setSelectKey(prev => prev + 1)
      }
    }
  }

  const handleRemoveService = (id) => {
    setSelectedServices(selectedServices.filter(s => s.id !== id))
  }

  const handleCreateTicket = async (values) => {
    if (!selectedServices || selectedServices.length === 0) {
      message.error('Vui lòng chọn ít nhất một loại dịch vụ')
      return
    }

    setCreateLoading(true)
    
    try {
      const appointmentId = currentAppointmentId ? parseInt(currentAppointmentId) : null
      
      const payload = {
        appointmentId: appointmentId && appointmentId > 0 ? appointmentId : 0,
        serviceTypeIds: selectedServices.map(s => s.value),
        customer: {
          customerId: 0,
          fullName: values.name || '',
          phone: normalizePhoneTo84(values.phone || ''),
          address: values.address || '',
          customerType: 'CA_NHAN',
          loyaltyLevel: 'BRONZE'
        },
        vehicle: {
          vehicleId: 0,
          licensePlate: values.plate || '',
          brandId: values.brandId || 0,
          modelId: values.modelId || 0,
          modelName: values.model || '',
          vin: values.vin || '',
          year: values.year ? parseInt(values.year) : 0
        },
        assignedTechnicianIds: values.techs && Array.isArray(values.techs) && values.techs.length > 0 ? values.techs : [0],
        receiveCondition: values.note || ''
      }

      if (values.receiveDate) {
        payload.expectedDeliveryAt = values.receiveDate.format('YYYY-MM-DD')
      }

      console.log('Creating service ticket with payload:', payload)

      const { data, error } = await serviceTicketAPI.create(payload)
      
      if (error) {
        console.error('Error creating service ticket:', error)
        message.error(error || 'Tạo phiếu không thành công. Vui lòng thử lại.')
        setCreateLoading(false)
        return
      }

      if (data && (data.statusCode === 200 || data.statusCode === 201 || data.result)) {
        message.success('Tạo phiếu dịch vụ thành công')
        createForm.resetFields()
        setSelectedServices([])
        setCurrentAppointmentId(null)
        setCreateModalOpen(false)
        await fetchServiceTickets()
      } else {
        message.error('Tạo phiếu không thành công. Vui lòng thử lại.')
        setCreateLoading(false)
      }
    } catch (err) {
      console.error('Error creating service ticket:', err)
      message.error('Đã xảy ra lỗi khi tạo phiếu dịch vụ.')
      setCreateLoading(false)
    }
  }

  const handleCreateModalClose = () => {
    setCreateModalOpen(false)
    createForm.resetFields()
    setSelectedServices([])
    setCurrentAppointmentId(null)
  }

  const historyColumns = [
    {
      title: 'STT',
      key: 'index',
      width: 80,
      render: (_, __, index) => (
        <span style={{ fontWeight: 600 }}>{String(index + 1).padStart(2, '0')}</span>
      )
    },
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      width: 180,
      render: (text) => <span style={{ fontWeight: 600 }}>{text}</span>
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
      render: () => (
        <span style={{ color: '#22c55e', fontWeight: 600 }}>Hoàn thành</span>
      )
    },
    {
      title: 'Ngày Giao Xe',
      dataIndex: 'deliveryDate',
      key: 'deliveryDate',
      width: 150
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 150,
      render: (_, record) => {
        const isDone = record.warrantyStatus === 'done'
        return (
          <Button
            size="small"
            className={`warranty-btn ${isDone ? 'done' : ''}`}
            type="default"
          >
            {isDone ? 'Đã bảo hành' : 'Bảo hành'}
          </Button>
        )
      }
    }
  ]

  const columns = [
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      width: 180
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
      width: 200,
      render: (status, record) => {
        const currentStatus = record.statusKey || status
        const config = getStatusConfig(currentStatus)
        const isUpdating = updatingStatusId === record.id
        const isCancelled = currentStatus === 'CANCELED' || currentStatus === 'CANCELLED' || currentStatus === 'Hủy'
        const isCompleted = currentStatus === 'COMPLETED' || currentStatus === 'Hoàn thành'
        const isDisabled = isUpdating || isCancelled || isCompleted
        
        if (isHistoryPage) {
        return <span style={{ color: config.color, fontWeight: 600 }}>{config.text}</span>
        }
        
          return (
            <select
              value={currentStatus}
              onChange={(e) => {
                e.stopPropagation()
                handleStatusChange(record.id, e.target.value, currentStatus)
              }}
              onClick={(e) => e.stopPropagation()}
              disabled={isDisabled}
              style={{
                border: '1px solid #d0d7de',
                borderRadius: '6px',
                padding: '6px 10px',
                fontSize: '13px',
                outline: 'none',
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                background: isDisabled ? '#f5f5f5' : '#fff',
                minWidth: '160px',
                color: config.color,
                fontWeight: 600,
                opacity: isDisabled ? 0.6 : 1
              }}
            >
              {currentStatus === 'CREATED' || currentStatus === 'Đã tạo' ? (
                <>
                  <option value="CREATED" style={{ color: '#3b82f6' }}>Đã tạo</option>
                  <option value="CANCELED" style={{ color: '#ef4444' }}>Hủy</option>
                </>
              ) : currentStatus === 'WAITING_FOR_QUOTATION' || currentStatus === 'WAITING_QUOTE' || currentStatus === 'Chờ báo giá' ? (
                <>
                  <option value="WAITING_FOR_QUOTATION" style={{ color: '#ffd65a' }}>Chờ báo giá</option>
                  <option value="WAITING_FOR_DELIVERY" style={{ color: '#3b82f6' }}>Chờ bàn giao xe</option>
                  <option value="CANCELED" style={{ color: '#ef4444' }}>Hủy</option>
                </>
              ) : currentStatus === 'WAITING_FOR_DELIVERY' || currentStatus === 'WAITING_HANDOVER' || currentStatus === 'Chờ bàn giao xe' ? (
                <>
                  <option value="WAITING_FOR_DELIVERY" style={{ color: '#3b82f6' }}>Chờ bàn giao xe</option>
                  <option value="COMPLETED" style={{ color: '#22c55e' }}>Hoàn thành</option>
                  <option value="CANCELED" style={{ color: '#ef4444' }}>Hủy</option>
                </>
              ) : (
                Object.keys(STATUS_MAP).map((key) => {
                  const optConfig = getStatusConfig(key)
                  return (
                    <option key={key} value={key} style={{ color: optConfig.color }}>
                      {STATUS_MAP[key]}
                    </option>
                  )
                })
              )}
            </select>
          )
      }
    },
    {
      title: 'Ngày Tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 120,
      render: (_, record) => {
        const statusKey = record.statusKey || record.status
        const isCompleted = statusKey === 'COMPLETED' || statusKey === 'Hoàn thành'
        const isCancelled = statusKey === 'CANCELED' || statusKey === 'CANCELLED' || statusKey === 'Hủy'
        const isDisabled = isCompleted || isCancelled
        
        return (
          <Button 
            type="link" 
            onClick={() => handleUpdate(record)}
            disabled={isDisabled}
            style={{ 
              padding: 0,
              color: isDisabled ? '#9ca3af' : '#1890ff',
              cursor: isDisabled ? 'not-allowed' : 'pointer'
            }}
          >
            Cập nhật
          </Button>
        )
      }
    }
  ]

  return (
        <AdminLayout>
      <div style={{ padding: '24px', minHeight: '100vh' }}>
        <div style={{ marginBottom: '24px' }}>
          <h1 className="h4" style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 4px 0', color: '#111' }}>
            {isHistoryPage ? 'Lịch sử sửa chữa' : 'Danh sách phiếu'}
          </h1>
          <p className="subtext" style={{ margin: '0 0 20px 0', color: '#6b7280' }}>
            {isHistoryPage
              ? 'Tra cứu lại các phiếu dịch vụ đã hoàn tất hoặc đã hủy theo biển số xe và ngày tạo.'
              : 'Quản lý danh sách phiếu dịch vụ hiện tại theo trạng thái, ngày tạo và biển số xe.'}
          </p>
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
              <input
                type="date"
                placeholder="Ngày tạo"
                value={dateFilter ? dateFilter.format('YYYY-MM-DD') : ''}
                onChange={(e) => {
                  const value = e.target.value
                  if (!value) {
                    setDateFilter(null)
                    return
                  }
                  // Lưu lại dưới dạng dayjs để logic filter bên dưới không phải sửa nhiều
                  const dayjs = require('dayjs')
                  setDateFilter(dayjs(value, 'YYYY-MM-DD'))
                }}
                style={{
                  width: 150,
                  height: 32,
                  borderRadius: 8,
                  border: '1px solid #d9d9d9',
                  padding: '4px 8px',
                  fontSize: 14
                }}
              />
            </Col>
            {!isHistoryPage && (
              <Col>
                <Space>
                  {STATUS_FILTERS.map((item) => (
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
            )}
          </Row>
        </div>

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
            dataSource={filtered.map((item, index) => ({ ...item, key: item.id, index }))}
            loading={loading}
            onRow={(record) => ({
              onClick: (e) => {
                // Don't navigate if clicking on action buttons
                if (e.target.closest('button') || e.target.closest('.anticon')) {
                  return
                }
                navigate(`/service-advisor/orders/${record.id}`, {
                  state: { fromHistory: isHistoryPage }
                })
              },
              style: { cursor: 'pointer' }
            })}
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
      </div>
      <TicketDetail open={!!selected} onClose={() => setSelected(null)} data={selected} />
      <UpdateTicketModal
        open={updateModalOpen}
        onClose={() => {
          setUpdateModalOpen(false)
          setUpdateTicketId(null)
        }}
        ticketId={updateTicketId}
        onSuccess={handleUpdateSuccess}
      />

      <Modal
        title={<span style={{ fontSize: '20px', fontWeight: 600 }}>Tạo phiếu dịch vụ</span>}
        open={createModalOpen}
        onCancel={handleCreateModalClose}
        footer={null}
        width={1000}
        style={{ top: 20 }}
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={handleCreateTicket}
          className="create-ticket-form"
        >
          <Row gutter={24}>
            <Col span={12}>
              <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: 600 }}>Thông tin khách hàng</h3>
              <Form.Item
                label="Số điện thoại"
                name="phone"
                rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }]}
              >
                <Input placeholder="VD: 0123456789" />
              </Form.Item>

              <Form.Item
                label="Họ và tên"
                name="name"
                rules={[{ required: true, message: 'Vui lòng nhập họ và tên' }]}
              >
                <Input placeholder="VD: Đặng Thị Huyền" />
              </Form.Item>

              <Form.Item
                label="Địa chỉ"
                name="address"
                rules={[{ required: true, message: 'Vui lòng nhập địa chỉ' }]}
              >
                <Input placeholder="VD: Hòa Lạc - Hà Nội" />
              </Form.Item>

              <h3 style={{ marginTop: '24px', marginBottom: '16px', fontSize: '16px', fontWeight: 600 }}>Thông tin xe</h3>
              <Form.Item
                label="Biển số xe"
                name="plate"
                rules={[{ required: true, message: 'Vui lòng nhập biển số xe' }]}
              >
                <Input placeholder="VD: 30A-12345" />
              </Form.Item>

              <Form.Item
                label="Hãng xe"
                name="brand"
                rules={[{ required: true, message: 'Vui lòng nhập hãng xe' }]}
              >
                <Input placeholder="VD: Mazda" />
              </Form.Item>

              <Form.Item
                label="Loại xe"
                name="model"
                rules={[{ required: true, message: 'Vui lòng nhập loại xe' }]}
              >
                <Input placeholder="VD: Mazda 3" />
              </Form.Item>

              <Form.Item
                label="Số khung"
                name="vin"
              >
                <Input placeholder="VD: RL4XW430089206813" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: 600 }}>Chi tiết dịch vụ</h3>
              <Form.Item
                label="Loại dịch vụ"
                name="service"
              >
                <div style={{ position: 'relative' }}>
                  <div
                    style={{
                      minHeight: '40px',
                      padding: '8px 12px',
                      background: '#f5f5f5',
                      borderRadius: '8px',
                      border: '1px solid #d9d9d9',
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    {selectedServices.map((service) => (
                      <div
                        key={service.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: '#e8e8e8',
                          borderRadius: '6px',
                          padding: '4px 8px',
                          height: '28px'
                        }}
                      >
                        <span style={{ fontSize: '14px', color: '#333', whiteSpace: 'nowrap' }}>
                          {service.label}
                        </span>
                        <CloseOutlined
                          style={{
                            fontSize: '12px',
                            color: '#666',
                            cursor: 'pointer',
                            marginLeft: '2px'
                          }}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRemoveService(service.id)
                          }}
                        />
                      </div>
                    ))}
                    <div style={{ flex: 1, minWidth: '150px' }}>
                      <Select
                        key={selectKey}
                        placeholder={selectedServices.length === 0 ? "Chọn loại dịch vụ" : ""}
                        style={{ 
                          width: '100%'
                        }}
                        className="service-type-select"
                        value={null}
                        onChange={handleServiceSelect}
                        options={SERVICES.filter(s => !selectedServices.some(ss => ss.value === s.value))}
                        showSearch
                        filterOption={(input, option) =>
                          (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                        }
                        bordered={false}
                        dropdownStyle={{ zIndex: 1050 }}
                        allowClear={false}
                      />
                      <style>{`
                        .service-type-select .ant-select-selector {
                          border: none !important;
                          background: transparent !important;
                          box-shadow: none !important;
                          padding: 0 !important;
                          height: auto !important;
                        }
                        .service-type-select .ant-select-selection-placeholder {
                          color: #999;
                        }
                        .service-type-select:hover .ant-select-selector {
                          border: none !important;
                        }
                        .service-type-select.ant-select-focused .ant-select-selector {
                          border: none !important;
                          box-shadow: none !important;
                        }
                      `}</style>
                    </div>
                  </div>
                </div>
              </Form.Item>

              <Form.Item
                label="Kỹ thuật viên sửa chữa"
                name="techs"
              >
                <Select
                  mode="multiple"
                  options={technicians}
                  placeholder={techniciansLoading ? 'Đang tải...' : 'Chọn kỹ thuật viên'}
                  loading={techniciansLoading}
                  disabled={techniciansLoading}
                />
              </Form.Item>

              <Form.Item
                label="Ngày dự đoán nhận xe"
                name="receiveDate"
              >
                <input
                  type="date"
                  style={{
                    width: '100%',
                    height: 32,
                    borderRadius: 8,
                    border: '1px solid #d9d9d9',
                    padding: '4px 8px',
                    fontSize: 14
                  }}
                  value={createForm.getFieldValue('receiveDate') || ''}
                  onChange={(e) => {
                    const value = e.target.value
                    createForm.setFieldsValue({ receiveDate: value })
                  }}
                />
              </Form.Item>

              <Form.Item
                label="Ghi chú"
                name="note"
              >
                <TextArea rows={6} placeholder="Nhập ghi chú..." />
              </Form.Item>

              <Row justify="end" style={{ marginTop: '32px' }}>
                <Space>
                  <Button onClick={handleCreateModalClose}>Hủy</Button>
                  <Button type="primary" htmlType="submit" loading={createLoading} style={{ background: '#22c55e', borderColor: '#22c55e' }}>
                    Tạo phiếu
                  </Button>
                </Space>
              </Row>
            </Col>
          </Row>
        </Form>
      </Modal>
    </AdminLayout>
  )
}
