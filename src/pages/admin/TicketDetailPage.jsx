import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { 
  Row, Col, Card, Select, InputNumber, Button, Input, Table, Space, 
  DatePicker, Modal, Form, message, Tabs 
} from 'antd'
import { PlusOutlined, DeleteOutlined, EditOutlined, ArrowLeftOutlined, CalendarOutlined } from '@ant-design/icons'
import AdminLayout from '../../layouts/AdminLayout'
import { serviceTicketAPI } from '../../services/api'
import { goldTableHeader } from '../../utils/tableComponents'
import '../../styles/pages/admin/modals/ticketdetail.css'

const { TextArea } = Input
const { TabPane } = Tabs

const TECHS = [
  { value: 'Hoàng Văn B', label: 'Hoàng Văn B' },
  { value: 'Nguyễn Văn B', label: 'Nguyễn Văn B' },
  { value: 'Phạm Đức Đạt', label: 'Phạm Đức Đạt' },
]

const UNITS = [
  { value: 'Cái', label: 'Cái' },
  { value: 'Giờ', label: 'Giờ' },
  { value: 'Bộ', label: 'Bộ' },
]

export default function TicketDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const isHistoryPage = location.state?.fromHistory || false
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [ticketData, setTicketData] = useState(null)
  const [activeTab, setActiveTab] = useState('quote')
  const [replaceItems, setReplaceItems] = useState([])
  const [serviceItems, setServiceItems] = useState([])
  const [showDateModal, setShowDateModal] = useState(false)
  const [expectedDate, setExpectedDate] = useState(null)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (id) {
      fetchTicketDetail()
    }
  }, [id])

  const fetchTicketDetail = async () => {
    setLoading(true)
    const { data: response, error } = await serviceTicketAPI.getById(id)
    setLoading(false)
    
    // Fallback data for testing
    const fallbackTicketData = {
      serviceTicketId: id,
      code: `STK-2025-${String(id || 0).padStart(6, '0')}`,
      customer: {
        fullName: 'Nguyễn Văn A',
        phone: '0123456789',
      },
      vehicle: {
        model: 'Mazda-v3',
        licensePlate: '25A-123456',
        vin: '1HGCM82633A123456',
      },
      createdAt: '2025-10-12',
      assignedTechnicians: [{ name: 'Nguyễn Văn B' }],
      quoteItems: [],
    }
    
    if (error || !response || !response.result) {
      console.warn('API error, using fallback data:', error)
      setTicketData(fallbackTicketData)
      form.setFieldsValue({
        customerName: 'Nguyễn Văn A',
        phone: '0123456789',
        vehicleType: 'Mazda-v3',
        licensePlate: '25A-123456',
        chassisNumber: '1HGCM82633A123456',
        quoteStaff: 'Hoàng Văn B',
        receiveDate: '12/10/2025',
        technician: 'Nguyễn Văn B',
        serviceType: 'Thay thế phụ tùng',
      })
      
      // Initialize with empty items to show "Tạo báo giá" button
      setReplaceItems([])
      setServiceItems([])
      return
    }
    
    if (response && response.result) {
      setTicketData(response.result)
      form.setFieldsValue({
        customerName: response.result.customer?.fullName || 'Nguyễn Văn A',
        phone: response.result.customer?.phone || '0123456789',
        vehicleType: response.result.vehicle?.model || 'Mazda-v3',
        licensePlate: response.result.vehicle?.licensePlate || '25A-123456',
        chassisNumber: response.result.vehicle?.vin || '1HGCM82633A123456',
        quoteStaff: 'Hoàng Văn B',
        receiveDate: response.result.createdAt ? new Date(response.result.createdAt).toLocaleDateString('vi-VN') : '12/10/2025',
        technician: response.result.assignedTechnicians?.[0]?.name || 'Nguyễn Văn B',
        serviceType: 'Thay thế phụ tùng',
      })
      
      // Load quote items if available
      if (response.result.quoteItems && response.result.quoteItems.length > 0) {
        setReplaceItems(response.result.quoteItems.filter(item => item.type === 'REPLACEMENT') || [])
        setServiceItems(response.result.quoteItems.filter(item => item.type === 'SERVICE') || [])
      } else {
        // Initialize with empty items
        setReplaceItems([{ 
          id: Date.now(), 
          category: '',
          quantity: 1, 
          unit: '',
          unitPrice: 0,
          total: 0
        }])
        setServiceItems([{ 
          id: Date.now() + 1, 
          task: '',
          quantity: 1, 
          unit: '',
          unitPrice: 0,
          total: 0
        }])
      }
    } else {
      // Use fallback if response structure is unexpected
      setTicketData(fallbackTicketData)
    }
  }

  const addReplaceItem = () => {
    setReplaceItems([...replaceItems, { 
      id: Date.now(), 
      category: '',
      quantity: 1, 
      unit: '',
      unitPrice: 0,
      total: 0
    }])
  }

  const addServiceItem = () => {
    setServiceItems([...serviceItems, { 
      id: Date.now(), 
      task: '',
      quantity: 1, 
      unit: '',
      unitPrice: 0,
      total: 0
    }])
  }

  const deleteReplaceItem = (id) => {
    setReplaceItems(replaceItems.filter(item => item.id !== id))
  }

  const deleteServiceItem = (id) => {
    setServiceItems(serviceItems.filter(item => item.id !== id))
  }

  const updateReplaceItem = (id, field, value) => {
    setReplaceItems(replaceItems.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value }
        if (field === 'quantity' || field === 'unitPrice') {
          updated.total = (updated.quantity || 0) * (updated.unitPrice || 0)
        }
        return updated
      }
      return item
    }))
    // Clear error for this field
    if (errors[`replace_${id}_${field}`]) {
      setErrors({ ...errors, [`replace_${id}_${field}`]: null })
    }
  }

  const updateServiceItem = (id, field, value) => {
    setServiceItems(serviceItems.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value }
        if (field === 'quantity' || field === 'unitPrice') {
          updated.total = (updated.quantity || 0) * (updated.unitPrice || 0)
        }
        return updated
      }
      return item
    }))
    // Clear error for this field
    if (errors[`service_${id}_${field}`]) {
      setErrors({ ...errors, [`service_${id}_${field}`]: null })
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    replaceItems.forEach((item, index) => {
      if (!item.category) {
        newErrors[`replace_${item.id}_category`] = 'Trường không được bỏ trống'
      }
      if (!item.unitPrice || item.unitPrice === 0) {
        newErrors[`replace_${item.id}_unitPrice`] = 'Trường không được bỏ trống'
      }
    })
    
    serviceItems.forEach((item, index) => {
      if (!item.task) {
        newErrors[`service_${item.id}_task`] = 'Trường không được bỏ trống'
      }
      if (!item.unitPrice || item.unitPrice === 0) {
        newErrors[`service_${item.id}_unitPrice`] = 'Trường không được bỏ trống'
      }
    })
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) {
      message.error('Vui lòng điền đầy đủ thông tin')
      return
    }
    
    setLoading(true)
    // Save logic here
    setLoading(false)
    message.success('Lưu thành công')
  }

  const handleSendQuote = () => {
    if (!validateForm()) {
      message.error('Vui lòng điền đầy đủ thông tin')
      return
    }
    setShowDateModal(true)
  }

  const confirmSendQuote = async () => {
    if (!expectedDate) {
      message.error('Vui lòng chọn ngày dự đoán nhận xe')
      return
    }
    
    setLoading(true)
    // Send quote logic here
    setLoading(false)
    setShowDateModal(false)
    message.success('Đã gửi báo giá cho khách hàng')
  }

  const replaceColumns = [
    {
      title: 'STT',
      key: 'index',
      width: 60,
      render: (_, __, index) => String(index + 1).padStart(2, '0')
    },
    {
      title: 'Danh mục',
      key: 'category',
      render: (_, record) => (
        <div>
          <Select
            placeholder="Chọn danh mục"
            value={record.category}
            onChange={(value) => updateReplaceItem(record.id, 'category', value)}
            style={{ width: '100%' }}
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            status={errors[`replace_${record.id}_category`] ? 'error' : ''}
            disabled={isHistoryPage}
          >
            <Select.Option value="Linh kiện A">Linh kiện A</Select.Option>
            <Select.Option value="Linh kiện B">Linh kiện B</Select.Option>
            <Select.Option value="Má phanh - Nhật">Má phanh - Nhật</Select.Option>
            <Select.Option value="Mâm xe - Hàn">Mâm xe - Hàn</Select.Option>
            <Select.Option value="Moay-ơ - USA">Moay-ơ - USA</Select.Option>
          </Select>
          {errors[`replace_${record.id}_category`] && (
            <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
              {errors[`replace_${record.id}_category`]}
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Số lượng',
      key: 'quantity',
      width: 120,
      render: (_, record) => (
        <InputNumber
          min={1}
          value={record.quantity}
          onChange={(value) => updateReplaceItem(record.id, 'quantity', value)}
          style={{ width: '100%' }}
          disabled={isHistoryPage}
        />
      )
    },
    {
      title: 'Đơn vị',
      key: 'unit',
      width: 120,
      render: (_, record) => (
        <Select
          placeholder="Đơn vị"
          value={record.unit}
          onChange={(value) => updateReplaceItem(record.id, 'unit', value)}
          options={UNITS}
          style={{ width: '100%' }}
          disabled={isHistoryPage}
        />
      )
    },
    {
      title: 'Đơn giá (vnd)',
      key: 'unitPrice',
      width: 150,
      render: (_, record) => (
        <div>
          <Input
            placeholder="Số tiền..."
            value={record.unitPrice ? record.unitPrice.toLocaleString('vi-VN') : ''}
            onChange={(e) => {
              const value = parseInt(e.target.value.replace(/,/g, '')) || 0
              updateReplaceItem(record.id, 'unitPrice', value)
            }}
            status={errors[`replace_${record.id}_unitPrice`] ? 'error' : ''}
            disabled={isHistoryPage}
          />
          {errors[`replace_${record.id}_unitPrice`] && (
            <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
              {errors[`replace_${record.id}_unitPrice`]}
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Thành tiền (vnd)',
      key: 'total',
      width: 150,
      render: (_, record) => (
        <span>{record.total ? record.total.toLocaleString('vi-VN') : '--'}</span>
      )
    },
    {
      title: '',
      key: 'action',
      width: 80,
      render: (_, record) => (
        <Space>
          {!isHistoryPage && (
            <DeleteOutlined
              style={{ fontSize: '16px', cursor: 'pointer', color: '#ef4444' }}
              onClick={() => deleteReplaceItem(record.id)}
            />
          )}
        </Space>
      )
    }
  ]

  const serviceColumns = [
    {
      title: 'STT',
      key: 'index',
      width: 60,
      render: (_, __, index) => String(index + 1).padStart(2, '0')
    },
    {
      title: 'Công việc',
      key: 'task',
      render: (_, record) => (
        <div>
          <Input
            placeholder="Tên công việc..."
            value={record.task}
            onChange={(e) => updateServiceItem(record.id, 'task', e.target.value)}
            status={errors[`service_${record.id}_task`] ? 'error' : ''}
            disabled={isHistoryPage}
          />
          {errors[`service_${record.id}_task`] && (
            <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
              {errors[`service_${record.id}_task`]}
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Số lượng',
      key: 'quantity',
      width: 120,
      render: (_, record) => (
        <InputNumber
          min={1}
          value={record.quantity}
          onChange={(value) => updateServiceItem(record.id, 'quantity', value)}
          style={{ width: '100%' }}
          disabled={isHistoryPage}
        />
      )
    },
    {
      title: 'Đơn vị',
      key: 'unit',
      width: 120,
      render: (_, record) => (
        <Select
          placeholder="Đơn vị"
          value={record.unit}
          onChange={(value) => updateServiceItem(record.id, 'unit', value)}
          options={UNITS}
          style={{ width: '100%' }}
          disabled={isHistoryPage}
        />
      )
    },
    {
      title: 'Đơn giá (vnd)',
      key: 'unitPrice',
      width: 150,
      render: (_, record) => (
        <div>
          <Input
            placeholder="Số tiền..."
            value={record.unitPrice ? record.unitPrice.toLocaleString('vi-VN') : ''}
            onChange={(e) => {
              const value = parseInt(e.target.value.replace(/,/g, '')) || 0
              updateServiceItem(record.id, 'unitPrice', value)
            }}
            status={errors[`service_${record.id}_unitPrice`] ? 'error' : ''}
            disabled={isHistoryPage}
          />
          {errors[`service_${record.id}_unitPrice`] && (
            <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
              {errors[`service_${record.id}_unitPrice`]}
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Thành tiền (vnd)',
      key: 'total',
      width: 150,
      render: (_, record) => (
        <span>{record.total ? record.total.toLocaleString('vi-VN') : '--'}</span>
      )
    },
    {
      title: '',
      key: 'action',
      width: 80,
      render: (_, record) => (
        <Space>
          {!isHistoryPage && (
            <DeleteOutlined
              style={{ fontSize: '16px', cursor: 'pointer', color: '#ef4444' }}
              onClick={() => deleteServiceItem(record.id)}
            />
          )}
        </Space>
      )
    }
  ]

  if (!ticketData && !loading) {
    return (
      <AdminLayout>
        <div style={{ padding: '24px', textAlign: 'center' }}>
          <p>Không tìm thấy phiếu dịch vụ</p>
          <Button onClick={() => navigate(isHistoryPage ? '/service-advisor/orders/history' : '/service-advisor/orders')}>Quay lại</Button>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div style={{ padding: '24px', background: '#ffffff', minHeight: '100vh' }}>
        <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Button 
            type="text" 
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(isHistoryPage ? '/service-advisor/orders/history' : '/service-advisor/orders')}
          />
          <span style={{ color: '#666' }}>Phiếu dịch vụ {'>'} Danh sách phiếu {'>'} Chi tiết phiếu dịch vụ</span>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>
            {ticketData?.code || `STK-2025-${String(id || 0).padStart(6, '0')}`}
          </h1>
        </div>

        <Row gutter={16} style={{ marginBottom: '24px' }}>
          <Col span={12}>
            <Card style={{ borderRadius: '12px', background: '#fafafa' }}>
              <div style={{ marginBottom: '12px' }}>
                <strong>Tên khách hàng:</strong>{' '}
                <span>{ticketData?.customer?.fullName || 'Nguyễn Văn A'}</span>
                <span style={{ marginLeft: '8px', color: '#ffd65a' }}>★★★</span>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <strong>Số điện thoại:</strong>{' '}
                <span>{ticketData?.customer?.phone || '0123456789'}</span>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <strong>Loại xe:</strong>{' '}
                <span>{ticketData?.vehicle?.model || 'Mazda-v3'}</span>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <strong>Biển số xe:</strong>{' '}
                <span>{ticketData?.vehicle?.licensePlate || '25A-123456'}</span>
              </div>
              <div>
                <strong>Số khung:</strong>{' '}
                <span>{ticketData?.vehicle?.vin || '1HGCM82633A123456'}</span>
              </div>
            </Card>
          </Col>
          <Col span={12}>
            <Card style={{ borderRadius: '12px', background: '#fafafa' }}>
              <div style={{ marginBottom: '12px' }}>
                <strong>Nhân viên lập báo giá:</strong>{' '}
                <span>Hoàng Văn B</span>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <strong>Ngày tạo báo giá:</strong>{' '}
                <span>{ticketData?.createdAt ? new Date(ticketData.createdAt).toLocaleDateString('vi-VN') : '12/10/2025'}</span>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <strong>Kỹ thuật viên sửa chữa:</strong>{' '}
                <Select
                  defaultValue="Nguyễn Văn B"
                  options={TECHS}
                  style={{ width: '100%', marginTop: '4px' }}
                  disabled={isHistoryPage}
                />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <strong>Loại dịch vụ:</strong>{' '}
                <span>Thay thế phụ tùng</span>
              </div>
              <div>
                <strong>Ngày dự đoán giao xe:</strong>{' '}
                <span>{expectedDate ? expectedDate.format('DD/MM/YYYY') : ''}</span>
              </div>
            </Card>
          </Col>
        </Row>

        <Card style={{ borderRadius: '12px' }}>
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>BÁO GIÁ</h2>
              {!isHistoryPage && replaceItems.length === 0 && serviceItems.length === 0 && (
                <Button
                  type="primary"
                  onClick={() => {
                    setReplaceItems([{ 
                      id: Date.now(), 
                      category: '',
                      quantity: 1, 
                      unit: '',
                      unitPrice: 0,
                      total: 0
                    }])
                    setServiceItems([{ 
                      id: Date.now() + 1, 
                      task: '',
                      quantity: 1, 
                      unit: '',
                      unitPrice: 0,
                      total: 0
                    }])
                  }}
                  style={{
                    background: '#3b82f6',
                    borderColor: '#3b82f6',
                    height: '36px',
                    fontWeight: 600
                  }}
                >
                  <PlusOutlined style={{ marginRight: '8px' }} />
                  Tạo báo giá
                </Button>
              )}
            </div>
          </div>
          
          <Tabs 
            activeKey={activeTab} 
            onChange={setActiveTab}
            style={{ marginBottom: '20px' }}
          >
            <TabPane tab={<span style={{ fontWeight: 700 }}>BÁO GIÁ</span>} key="quote">
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <strong>Thay thế</strong>
                  {!isHistoryPage && (
                    <Button 
                      type="text" 
                      icon={<PlusOutlined />}
                      onClick={addReplaceItem}
                      style={{ 
                        width: '32px', 
                        height: '32px', 
                        borderRadius: '50%', 
                        border: '1px solid #222',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    />
                  )}
                </div>
                 <Table
                   columns={replaceColumns}
                   dataSource={replaceItems.map((item, index) => ({ ...item, key: item.id, index }))}
                   pagination={false}
                   size="small"
                   components={goldTableHeader}
                 />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <strong>Dịch vụ</strong>
                  {!isHistoryPage && (
                    <Button 
                      type="text" 
                      icon={<PlusOutlined />}
                      onClick={addServiceItem}
                      style={{ 
                        width: '32px', 
                        height: '32px', 
                        borderRadius: '50%', 
                        border: '1px solid #222',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    />
                  )}
                </div>
                 <Table
                   columns={serviceColumns}
                   dataSource={serviceItems.map((item, index) => ({ ...item, key: item.id, index }))}
                   pagination={false}
                   size="small"
                   components={goldTableHeader}
                 />
              </div>

              {!isHistoryPage && (replaceItems.length > 0 || serviceItems.length > 0) && (
                <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ color: '#666', fontSize: '12px' }}>
                    Trong quá trình chờ kho và khách duyệt không thể cập nhật báo giá
                  </div>
                  <Space>
                    <Button onClick={() => navigate(isHistoryPage ? '/service-advisor/orders/history' : '/service-advisor/orders')}>Hủy</Button>
                    <Button 
                      type="primary" 
                      onClick={handleSendQuote}
                      style={{ background: '#3b82f6', borderColor: '#3b82f6' }}
                    >
                      Gửi báo giá cho khách hàng →
                    </Button>
                  </Space>
                </div>
              )}
            </TabPane>
            <TabPane tab="Nháp" key="draft">
              <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                Chưa có bản nháp
              </div>
            </TabPane>
            <TabPane tab="Kho đã duyệt" key="approved">
              <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                Chưa có dữ liệu
              </div>
            </TabPane>
          </Tabs>
        </Card>
      </div>

      <Modal
        title="Ngày dự đoán nhận xe"
        open={showDateModal}
        onCancel={() => setShowDateModal(false)}
        footer={null}
        width={400}
      >
        <div style={{ marginBottom: '16px' }}>
          <DatePicker
            placeholder="Ngày"
            format="DD/MM/YYYY"
            suffixIcon={<CalendarOutlined />}
            value={expectedDate}
            onChange={setExpectedDate}
            style={{ width: '100%' }}
          />
        </div>
        <Button
          type="primary"
          block
          onClick={confirmSendQuote}
          style={{ background: '#22c55e', borderColor: '#22c55e', height: '40px' }}
        >
          Gửi báo giá
        </Button>
        <div style={{ marginTop: '12px', fontSize: '12px', color: '#666', textAlign: 'center' }}>
          Báo giá sẽ được gửi cho khách hàng qua Zalo
        </div>
      </Modal>
    </AdminLayout>
  )
}

