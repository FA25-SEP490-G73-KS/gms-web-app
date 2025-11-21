import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { 
  Row, Col, Card, Select, InputNumber, Button, Input, Table, Space, 
  DatePicker, Modal, Form, message, Tabs 
} from 'antd'
import { PlusOutlined, DeleteOutlined, EditOutlined, ArrowLeftOutlined, CalendarOutlined } from '@ant-design/icons'
import AdminLayout from '../../layouts/AdminLayout'
import { serviceTicketAPI, priceQuotationAPI, partsAPI } from '../../services/api'
import { goldTableHeader } from '../../utils/tableComponents'
import '../../styles/pages/admin/modals/ticketdetail.css'
import dayjs from 'dayjs'

const { TextArea } = Input

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
  const [technicians, setTechnicians] = useState([])
  const [selectedTechnician, setSelectedTechnician] = useState(null)
  const [parts, setParts] = useState([])
  const [partsLoading, setPartsLoading] = useState(false)

  useEffect(() => {
    if (id) {
      fetchTicketDetail()
    }
    fetchParts()
  }, [id])

  const fetchParts = async () => {
    setPartsLoading(true)
    try {
      const { data: response, error } = await partsAPI.getAll(0, 100)
      
      if (error) {
        console.warn('Error fetching parts:', error)
        setParts([])
        setPartsLoading(false)
        return
      }

      console.log('Parts API response:', response)

      let partsList = []
      if (response && response.result) {
        if (Array.isArray(response.result)) {
          partsList = response.result
        } else if (response.result.content && Array.isArray(response.result.content)) {
          partsList = response.result.content
        } else if (Array.isArray(response.result)) {
          partsList = response.result
        }
      } else if (Array.isArray(response)) {
        partsList = response
      }
      
      console.log('Parts list:', partsList)
      
      const partsOptions = partsList
        .filter(part => part && (part.partId || part.id) && (part.name || part.partName))
        .map(part => ({
          value: part.partId || part.id,
          label: part.name || part.partName || '',
          part: part
        }))
      
      console.log('Parts options:', partsOptions)
      setParts(partsOptions)
    } catch (err) {
      console.error('Error fetching parts:', err)
      setParts([])
    } finally {
      setPartsLoading(false)
    }
  }

  const fetchTicketDetail = async () => {
    setLoading(true)
    const { data: response, error } = await serviceTicketAPI.getById(id)
    setLoading(false)
    
    if (error || !response || !response.result) {
      console.error('Error fetching ticket detail:', error)
      message.error('Không thể tải thông tin phiếu dịch vụ. Vui lòng thử lại.')
      return
    }
    
    if (response && response.result) {
      const data = response.result
      setTicketData(data)
      
      const deliveryDate = data.deliveryAt ? dayjs(data.deliveryAt) : null
      setExpectedDate(deliveryDate)
      
      const vehicle = data.vehicle || {}
      const vehicleModel = vehicle.vehicleModel || {}
      const brandName = vehicleModel.brandName || vehicle.brand || ''
      const modelName = vehicleModel.modelName || vehicle.model || ''
      
      const techniciansList = Array.isArray(data.technicians) ? data.technicians : []
      const techniciansOptions = techniciansList.map(tech => ({
        value: tech,
        label: tech
      }))
      setTechnicians(techniciansOptions)
      setSelectedTechnician(techniciansList[0] || null)
      
      const serviceTypes = Array.isArray(data.serviceType) ? data.serviceType.join(', ') : (data.serviceType || '')
      
      const quoteStaffName = data.createdBy || ''
      const brandNameFromVehicle = vehicle.brandName || ''
      const modelNameFromVehicle = vehicle.vehicleModelName || modelName
      
      form.setFieldsValue({
        customerName: data.customer?.fullName || '',
        phone: data.customer?.phone || '',
        vehicleType: modelNameFromVehicle,
        licensePlate: vehicle.licensePlate || '',
        chassisNumber: vehicle.vin || '',
        quoteStaff: quoteStaffName,
        receiveDate: data.createdAt ? dayjs(data.createdAt) : null,
        technician: techniciansList[0] || '',
        serviceType: serviceTypes,
      })
      
      // Load quote items from priceQuotation if available
      if (data.priceQuotation && data.priceQuotation.items && Array.isArray(data.priceQuotation.items)) {
        const items = data.priceQuotation.items
        const replacementItems = items
          .filter(item => item.itemType === 'PART')
          .map((item, index) => ({
            id: item.priceQuotationItemId || Date.now() + index,
            category: item.partName || '',
            quantity: item.quantity || 1,
            unit: item.unit || '',
            unitPrice: item.unitPrice || 0,
            total: item.totalPrice || 0
          }))
        
        const serviceItems = items
          .filter(item => item.itemType === 'SERVICE')
          .map((item, index) => ({
            id: item.priceQuotationItemId || Date.now() + index + 1000,
            task: item.serviceName || '',
            quantity: item.quantity || 1,
            unit: item.unit || '',
            unitPrice: item.unitPrice || 0,
            total: item.totalPrice || 0
          }))
        
        setReplaceItems(replacementItems.length > 0 ? replacementItems : [])
        setServiceItems(serviceItems.length > 0 ? serviceItems : [])
      } else {
        setReplaceItems([])
        setServiceItems([])
      }
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

  const handleUpdateDeliveryDate = async (date) => {
    if (!date) {
      message.warning('Vui lòng chọn ngày dự đoán giao xe')
      return
    }

    try {
      const dateStr = date.format('YYYY-MM-DD')
      const { data: response, error } = await serviceTicketAPI.updateDeliveryAt(id, dateStr)
      
      if (error) {
        message.error(error || 'Cập nhật ngày giao xe không thành công')
        return
      }

      if (response && (response.statusCode === 200 || response.result)) {
        message.success('Cập nhật ngày giao xe thành công')
        setExpectedDate(date)
        if (ticketData) {
          setTicketData({ ...ticketData, deliveryAt: dateStr })
        }
      } else {
        message.error('Cập nhật ngày giao xe không thành công')
      }
    } catch (err) {
      console.error('Error updating delivery date:', err)
      message.error('Đã xảy ra lỗi khi cập nhật ngày giao xe')
    }
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
    
    if (!expectedDate) {
      setShowDateModal(true)
    } else {
      confirmSendQuote()
    }
  }

  const confirmSendQuote = async () => {
    if (!expectedDate) {
      message.error('Vui lòng chọn ngày dự đoán giao xe')
      return
    }
    
    setLoading(true)
    try {
      const { data: response, error } = await priceQuotationAPI.create(id)
      
      if (error) {
        message.error(error || 'Tạo báo giá không thành công. Vui lòng thử lại.')
        setLoading(false)
        return
      }

      if (response && (response.statusCode === 200 || response.result)) {
        message.success('Đã gửi báo giá cho khách hàng')
        setShowDateModal(false)
        await fetchTicketDetail()
      } else {
        message.error('Tạo báo giá không thành công. Vui lòng thử lại.')
      }
    } catch (err) {
      console.error('Error creating price quotation:', err)
      message.error('Đã xảy ra lỗi khi tạo báo giá.')
    } finally {
      setLoading(false)
    }
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
            value={record.category || undefined}
            onChange={(value, option) => {
              const selectedPart = parts.find(p => p.value === value || String(p.value) === String(value))
              updateReplaceItem(record.id, 'category', value)
              if (selectedPart?.part) {
                updateReplaceItem(record.id, 'unit', selectedPart.part.unit || '')
                updateReplaceItem(record.id, 'unitPrice', selectedPart.part.sellingPrice || 0)
              }
            }}
            options={parts}
            style={{ width: '100%' }}
            showSearch
            allowClear
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            status={errors[`replace_${record.id}_category`] ? 'error' : ''}
            disabled={isHistoryPage}
            loading={partsLoading}
            notFoundContent={parts.length === 0 ? 'Đang tải...' : 'Không tìm thấy'}
          />
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
                  value={selectedTechnician}
                  onChange={setSelectedTechnician}
                  options={technicians}
                  style={{ width: '100%', marginTop: '4px' }}
                  disabled={isHistoryPage}
                  placeholder="Chọn kỹ thuật viên"
                />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <strong>Loại dịch vụ:</strong>{' '}
                <span>Thay thế phụ tùng</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <strong>Ngày dự đoán giao xe:</strong>
                <DatePicker
                  value={expectedDate}
                  onChange={handleUpdateDeliveryDate}
                  format="DD/MM/YYYY"
                  placeholder="Chọn ngày"
                  style={{ width: '150px' }}
                  suffixIcon={<CalendarOutlined />}
                  disabled={isHistoryPage}
                />
              </div>
            </Card>
          </Col>
        </Row>

        <Card style={{ borderRadius: '12px' }}>
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>BÁO GIÁ</h2>
            </div>
          </div>
          
          <Tabs 
            activeKey={activeTab} 
            onChange={setActiveTab}
            style={{ marginBottom: '20px' }}
            items={[
              {
                key: 'quote',
                label: <span style={{ fontWeight: 700 }}>BÁO GIÁ</span>,
                children: (
                  <>
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

                    {!isHistoryPage && (
                      <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ color: '#666', fontSize: '12px' }}>
                          {ticketData?.priceQuotation 
                            ? 'Trong quá trình chờ kho và khách duyệt không thể cập nhật báo giá'
                            : 'Vui lòng thêm các mục vào báo giá trước khi gửi'
                          }
                        </div>
                        <Space>
                          <Button onClick={() => navigate(isHistoryPage ? '/service-advisor/orders/history' : '/service-advisor/orders')}>Hủy</Button>
                          <Button 
                            type="primary" 
                            onClick={handleSendQuote}
                            disabled={replaceItems.length === 0 && serviceItems.length === 0}
                            style={{ background: '#3b82f6', borderColor: '#3b82f6' }}
                          >
                            Gửi báo giá cho khách hàng →
                          </Button>
                        </Space>
                      </div>
                    )}
                  </>
                )
              },
              {
                key: 'draft',
                label: 'Nháp',
                children: (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                    Chưa có bản nháp
                  </div>
                )
              },
              {
                key: 'approved',
                label: 'Kho đã duyệt',
                children: (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                    Chưa có dữ liệu
                  </div>
                )
              }
            ]}
          />
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

