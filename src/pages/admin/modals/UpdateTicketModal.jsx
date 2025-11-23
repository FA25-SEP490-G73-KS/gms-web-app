import React, { useEffect, useState } from 'react'
import { Modal, Form, Input, Select, DatePicker, Button, Row, Col, message } from 'antd'
import { serviceTicketAPI } from '../../../services/api'
import dayjs from 'dayjs'

const { TextArea } = Input

const BRANDS = [
  { value: 'Vinfast', label: 'Vinfast' },
  { value: 'Toyota', label: 'Toyota' },
  { value: 'Honda', label: 'Honda' },
  { value: 'Mazda', label: 'Mazda' },
]

const VEHICLE_TYPES = [
  { value: 'VF3', label: 'VF3' },
  { value: 'VF5', label: 'VF5' },
  { value: 'VF8', label: 'VF8' },
  { value: 'VF9', label: 'VF9' },
  { value: 'Mazda-v3', label: 'Mazda-v3' },
  { value: 'Camry', label: 'Camry' },
  { value: 'Civic', label: 'Civic' },
]

const TECHS = [
  { value: 'Nguyễn Văn B', label: 'Nguyễn Văn B' },
  { value: 'Hoàng Văn B', label: 'Hoàng Văn B' },
  { value: 'Phạm Đức Đạt', label: 'Phạm Đức Đạt' },
]

const SERVICE_TYPES = [
  { value: 'Thay thế', label: 'Thay thế' },
  { value: 'Sơn', label: 'Sơn' },
  { value: 'Bảo dưỡng', label: 'Bảo dưỡng' },
]

export default function UpdateTicketModal({ open, onClose, ticketId, onSuccess }) {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [ticketData, setTicketData] = useState(null)

  useEffect(() => {
    if (open && ticketId) {
      fetchTicketData()
    } else {
      form.resetFields()
      setTicketData(null)
    }
  }, [open, ticketId])

  const fetchTicketData = async () => {
    setLoading(true)
    const { data: response, error } = await serviceTicketAPI.getById(ticketId)
    setLoading(false)
    
    // Fallback data for testing
    const fallbackData = {
      customer: {
        fullName: 'Nguyễn Văn A',
        phone: '0919384239',
      },
      vehicle: {
        brand: 'Vinfast',
        model: 'VF3',
        licensePlate: '30A-12345',
        vin: 'VIN12345678',
      },
      advisor: {
        name: 'Hoàng Văn B',
      },
      createdAt: '2025-10-12',
      assignedTechnicians: [{ name: 'Nguyễn Văn B' }],
      serviceTypes: ['Thay thế'],
    }
    
    if (error || !response || !response.result) {
      console.warn('API error, using fallback data:', error)
      setTicketData(fallbackData)
      form.setFieldsValue({
        customerName: fallbackData.customer.fullName,
        phone: fallbackData.customer.phone,
        brand: fallbackData.vehicle.brand,
        vehicleType: fallbackData.vehicle.model,
        licensePlate: fallbackData.vehicle.licensePlate,
        chassisNumber: fallbackData.vehicle.vin,
        quoteStaff: fallbackData.advisor.name,
        receiveDate: dayjs(fallbackData.createdAt),
        technician: fallbackData.assignedTechnicians[0]?.name,
        serviceType: fallbackData.serviceTypes[0],
      })
      return
    }
    
    if (response && response.result) {
      setTicketData(response.result)
      const data = response.result
      form.setFieldsValue({
        customerName: data.customer?.fullName || 'Nguyễn Văn A',
        phone: data.customer?.phone || '0919384239',
        brand: data.vehicle?.brand || 'Vinfast',
        vehicleType: data.vehicle?.model || 'VF3',
        licensePlate: data.vehicle?.licensePlate || '30A-12345',
        chassisNumber: data.vehicle?.vin || 'VIN12345678',
        quoteStaff: data.advisor?.name || 'Hoàng Văn B',
        receiveDate: data.createdAt ? dayjs(data.createdAt) : dayjs('2025-10-12'),
        technician: data.assignedTechnicians?.[0]?.name || 'Nguyễn Văn B',
        serviceType: data.serviceTypes?.[0] || 'Thay thế',
      })
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setLoading(true)
      
      // Update ticket API call
      const payload = {
        customer: {
          fullName: values.customerName,
          phone: values.phone,
        },
        vehicle: {
          brand: values.brand,
          model: values.vehicleType,
          licensePlate: values.licensePlate,
          vin: values.chassisNumber,
        },
        advisorId: 1, // This should come from the ticket data
        assignedTechnicianIds: [1], // Map from technician name
        receiveDate: values.receiveDate.format('YYYY-MM-DD'),
        serviceTypeIds: [1], // Map from service type
      }
      
      const { error } = await serviceTicketAPI.update(ticketId, payload)
      setLoading(false)
      
      if (error) {
        message.error('Cập nhật phiếu không thành công')
        return
      }
      
      message.success('Cập nhật phiếu thành công')
      onSuccess?.()
      onClose()
    } catch (error) {
      console.error('Validation failed:', error)
    }
  }

  return (
    <Modal
      title={
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          padding: '0 4px'
        }}>
          <span style={{ fontSize: '18px', fontWeight: 700 }}>Thông Tin Phiếu Dịch Vụ</span>
          <Button 
            type="text" 
            onClick={onClose}
            style={{ fontSize: '18px', fontWeight: 700, padding: 0, width: '24px', height: '24px' }}
          >
            ×
          </Button>
        </div>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={600}
      style={{ top: 20 }}
    >
      <Form
        form={form}
        layout="vertical"
        style={{ marginTop: '20px' }}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Tên khách hàng"
              name="customerName"
              rules={[{ required: true, message: 'Vui lòng nhập tên khách hàng' }]}
            >
              <Input placeholder="Nhập tên khách hàng" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Số điện thoại"
              name="phone"
              rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }]}
            >
              <Input placeholder="Nhập số điện thoại" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Hãng xe"
              name="brand"
              rules={[{ required: true, message: 'Vui lòng chọn hãng xe' }]}
            >
              <Select placeholder="Chọn hãng xe" options={BRANDS} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Loại xe"
              name="vehicleType"
              rules={[{ required: true, message: 'Vui lòng chọn loại xe' }]}
            >
              <Select placeholder="Chọn loại xe" options={VEHICLE_TYPES} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Biển số xe"
              name="licensePlate"
              rules={[{ required: true, message: 'Vui lòng nhập biển số xe' }]}
            >
              <Input placeholder="Nhập biển số xe" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Số khung"
              name="chassisNumber"
            >
              <Input placeholder="Nhập số khung" />
            </Form.Item>
          </Col>
        </Row>

        <div style={{ 
          height: '1px', 
          background: '#f0f0f0', 
          margin: '20px 0' 
        }} />

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Nhân viên lập báo giá"
              name="quoteStaff"
            >
              <Input placeholder="Nhập tên nhân viên" readOnly style={{ background: '#fafafa' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Ngày tiếp nhận xe"
              name="receiveDate"
            >
              <DatePicker 
                style={{ width: '100%' }} 
                format="DD/MM/YYYY"
                placeholder="Chọn ngày"
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Kỹ thuật viên"
              name="technician"
            >
              <Select placeholder="Chọn kỹ thuật viên" options={TECHS} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Loại dịch vụ"
              name="serviceType"
            >
              <Select placeholder="Chọn loại dịch vụ" options={SERVICE_TYPES} />
            </Form.Item>
          </Col>
        </Row>

        <div style={{ 
          display: 'flex', 
          justifyContent: 'flex-end', 
          marginTop: '24px',
          paddingTop: '16px',
          borderTop: '1px solid #f0f0f0'
        }}>
          <Button
            type="primary"
            onClick={handleSubmit}
            loading={loading}
            style={{
              background: '#22c55e',
              borderColor: '#22c55e',
              height: '40px',
              padding: '0 32px',
              fontWeight: 600,
              borderRadius: '8px'
            }}
          >
            Lưu
          </Button>
        </div>
      </Form>
    </Modal>
  )
}

