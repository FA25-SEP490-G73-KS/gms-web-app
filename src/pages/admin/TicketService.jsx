import React, { useMemo, useState, useEffect } from 'react'
import { Table, Input, Card, Badge, Space, message, Button, DatePicker, Row, Col, Modal, Form, Select } from 'antd'
import { EyeOutlined, SearchOutlined, CalendarOutlined, PlusOutlined, CloseOutlined } from '@ant-design/icons'
import AdminLayout from '../../layouts/AdminLayout'
import TicketDetail from './modals/TicketDetail'
import UpdateTicketModal from './modals/UpdateTicketModal'
import { serviceTicketAPI } from '../../services/api'
import { useNavigate, useLocation } from 'react-router-dom'
import { goldTableHeader } from '../../utils/tableComponents'
import '../../styles/pages/admin/ticketservice.css'
import '../../styles/pages/admin/createticket.css'

const { Search } = Input
const { TextArea } = Input

const TECHS = [
  { id: 1, name: 'HTK Ly' },
  { id: 2, name: 'DT Huyền' },
  { id: 3, name: 'Nguyễn Văn B' },
  { id: 4, name: 'Phạm Đức Đạt' }
]

const SERVICES = [
  { label: 'Thay thế phụ tùng', value: 1 },
  { label: 'Sơn', value: 2 },
  { label: 'Bảo dưỡng', value: 3 }
]

const STATUS_FILTERS = [
  { key: 'CREATED', label: 'Đã tạo' },
  { key: 'WAITING_QUOTE', label: 'Chờ báo giá' },
  { key: 'WAITING_HANDOVER', label: 'Chờ bàn giao xe' },
  { key: 'CANCELLED', label: 'Hủy' },
]

const getStatusConfig = (status) => {
  switch (status) {
    case 'Hủy':
    case 'CANCELLED':
      return { color: '#ef4444', text: 'Hủy' }
    case 'Chờ báo giá':
    case 'WAITING_QUOTE':
      return { color: '#ffd65a', text: 'Chờ báo giá' }
    case 'Chờ bàn giao xe':
    case 'WAITING_HANDOVER':
      return { color: '#ffd65a', text: 'Chờ bàn giao xe' }
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
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState(isHistoryPage ? null : 'CREATED')
  const [dateFilter, setDateFilter] = useState(null)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [createForm] = Form.useForm()
  const [createLoading, setCreateLoading] = useState(false)
  const [selectedServices, setSelectedServices] = useState([])
  const [selectKey, setSelectKey] = useState(0)

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
      setCreateModalOpen(true)
      
      if (location.state.customer || location.state.phone || location.state.licensePlate) {
        createForm.setFieldsValue({
          name: location.state.customer || '',
          phone: location.state.phone || '',
          plate: location.state.licensePlate || ''
        })
      }
      
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [location.state])

  const fetchServiceTickets = async () => {
    setLoading(true)
    try {
      const { data: response, error } = await serviceTicketAPI.getAll(page - 1, pageSize)
      
      if (error || !response) {
        console.warn('API error:', error)
        message.error('Không thể tải danh sách phiếu dịch vụ. Vui lòng thử lại.')
        setData([])
        setTotal(0)
        setLoading(false)
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
      
      const transformed = resultArray.map(item => ({
        id: item.serviceTicketId || item.id,
        code: item.code || `STK-2025-${String(item.serviceTicketId || item.id || 0).padStart(6, '0')}`,
        customer: item.customer?.fullName || item.customerName || 'N/A',
        license: item.vehicle?.licensePlate || item.licensePlate || item.customer?.licensePlates?.[0] || 'N/A',
        status: item.status || 'CREATED',
        statusKey: item.status || 'CREATED',
        createdAt: item.createdAt ? new Date(item.createdAt).toLocaleDateString('vi-VN') : new Date().toLocaleDateString('vi-VN'),
        createdAtRaw: item.createdAt,
        deliveryDate: item.deliveryAt ? new Date(item.deliveryAt).toLocaleDateString('vi-VN') : (item.deliveryDate ? new Date(item.deliveryDate).toLocaleDateString('vi-VN') : (item.createdAt ? new Date(item.createdAt).toLocaleDateString('vi-VN') : new Date().toLocaleDateString('vi-VN'))),
        warrantyStatus: item.warrantyStatus || 'pending',
        total: item.priceQuotation?.estimateAmount || item.total || 0,
        rawData: item
      }))
      
      let filtered = transformed
      
      if (statusFilter) {
        filtered = filtered.filter((r) => {
          const statusKey = r.statusKey || r.status
          return statusKey === statusFilter
        })
      }
      
      if (dateFilter) {
        const filterDate = dateFilter.format('YYYY-MM-DD')
        filtered = filtered.filter((r) => {
          if (!r.createdAtRaw) return false
          const itemDate = new Date(r.createdAtRaw).toISOString().split('T')[0]
          return itemDate === filterDate
        })
      }
      
      if (query) {
        filtered = filtered.filter((r) => 
          r.license.toLowerCase().includes(query.toLowerCase()) || 
          r.customer.toLowerCase().includes(query.toLowerCase())
        )
      }
      
      setData(filtered)
      setTotal(totalCount)
      setLoading(false)
    } catch (err) {
      console.error('Error fetching service tickets:', err)
      message.error('Đã xảy ra lỗi khi tải danh sách phiếu dịch vụ.')
      setData([])
      setTotal(0)
      setLoading(false)
    }
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
    
    return result
  }, [data, isHistoryPage])

  const handleUpdate = (record) => {
    setUpdateTicketId(record.id)
    setUpdateModalOpen(true)
  }

  const handleUpdateSuccess = () => {
    fetchServiceTickets()
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
      const appointmentId = location.state?.appointmentId || 0
      
      const payload = {
        appointmentId: appointmentId || 0,
        serviceTypeIds: selectedServices.map(s => s.value),
        customer: {
          customerId: 0,
          fullName: values.name,
          phone: values.phone,
          address: values.address || '',
          customerType: 'CA_NHAN',
          loyaltyLevel: 'BRONZE'
        },
        vehicle: {
          vehicleId: 0,
          licensePlate: values.plate,
          brandId: 0,
          modelId: 0,
          modelName: values.model || '',
          year: 0,
          vin: values.vin || ''
        },
        assignedTechnicianIds: values.techs || [],
        receiveCondition: values.note || '',
        expectedDeliveryAt: values.receiveDate ? values.receiveDate.format('YYYY-MM-DD') : ''
      }

      const { data, error } = await serviceTicketAPI.create(payload)
      
      if (error) {
        message.error(error || 'Tạo phiếu không thành công. Vui lòng thử lại.')
        setCreateLoading(false)
        return
      }

      if (data && (data.statusCode === 200 || data.statusCode === 201 || data.result)) {
        message.success('Tạo phiếu dịch vụ thành công')
        createForm.resetFields()
        setSelectedServices([])
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
      width: 180,
      render: (status, record) => {
        const config = getStatusConfig(record.statusKey || status)
        return <span style={{ color: config.color, fontWeight: 600 }}>{config.text}</span>
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
        const canUpdate = statusKey === 'CREATED' || statusKey === 'Đã tạo' || 
                         statusKey === 'WAITING_QUOTE' || statusKey === 'Chờ báo giá'
        return canUpdate ? (
          <Button 
            type="link" 
            onClick={() => handleUpdate(record)}
            style={{ padding: 0 }}
          >
            Cập nhật
          </Button>
        ) : (
          <EyeOutlined
            style={{ fontSize: '18px', cursor: 'pointer', color: '#111' }}
            onClick={() => setSelected(record)}
          />
        )
      }
    }
  ]

  return (
    <AdminLayout>
      <div style={{ padding: '24px', background: '#ffffff', minHeight: '100vh' }}>
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>
              {isHistoryPage ? 'Lịch sử sửa chữa' : 'Danh sách phiếu'}
            </h1>
            {!isHistoryPage && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setCreateModalOpen(true)}
                style={{ background: '#22c55e', borderColor: '#22c55e' }}
              >
                Tạo phiếu
              </Button>
            )}
          </div>
          
          <Row gutter={16} style={{ marginBottom: '20px' }}>
            <Col flex="auto">
              <Search
                placeholder={isHistoryPage ? 'Tìm kiếm' : 'Tìm kiếm theo biển số xe'}
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
              <DatePicker
                placeholder={isHistoryPage ? 'Ngày giao xe' : 'Ngày tạo'}
                format="DD/MM/YYYY"
                suffixIcon={<CalendarOutlined />}
                value={dateFilter}
                onChange={setDateFilter}
                style={{ width: '150px' }}
              />
            </Col>
            {!isHistoryPage && (
              <Col>
                <Space>
                  {STATUS_FILTERS.map((item) => (
                    <Button
                      key={item.key}
                      type={statusFilter === item.key ? 'primary' : 'default'}
                      style={{
                        background: statusFilter === item.key ? '#CBB081' : '#fff',
                        borderColor: statusFilter === item.key ? '#CBB081' : '#e6e6e6',
                        color: statusFilter === item.key ? '#111' : '#666',
                        fontWeight: 600
                      }}
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

        <Card style={{ borderRadius: '12px' }} bodyStyle={{ padding: 0 }}>
          <Table
            className={isHistoryPage ? 'history-table' : ''}
            columns={isHistoryPage ? historyColumns : columns}
            dataSource={filtered.map((item, index) => ({ ...item, key: item.id, index }))}
            loading={loading}
            onRow={(record) => ({
              onClick: (e) => {
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
              total: total,
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
                  options={TECHS.map(t => ({ value: t.id, label: t.name }))}
                  placeholder="Chọn kỹ thuật viên"
                />
              </Form.Item>

              <Form.Item
                label="Ngày nhận xe"
                name="receiveDate"
              >
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
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
