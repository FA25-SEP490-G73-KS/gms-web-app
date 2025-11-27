import React, { useEffect, useState } from 'react'
import { Modal, Form, Input, DatePicker, Button, Row, Col, message } from 'antd'
import { serviceTicketAPI } from '../../../services/api'
import { normalizePhoneTo84, displayPhoneFrom84 } from '../../../utils/helpers'
import dayjs from 'dayjs'

const { TextArea } = Input


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
    
    if (error || !response || !response.result) {
      console.error('Error fetching ticket data:', error)
      message.error('Không thể tải thông tin phiếu dịch vụ. Vui lòng thử lại.')
      onClose()
      return
    }
    
    if (response && response.result) {
      setTicketData(response.result)
      const data = response.result
      
      const vehicle = data.vehicle || {}
      const vehicleModel = vehicle.vehicleModel || {}
      
      const brandName = vehicleModel.brandName || vehicle.brand || vehicleModel.brand || ''
      const modelName = vehicleModel.modelName || vehicle.model || vehicleModel.model || ''
      
      const technicians = Array.isArray(data.technicians) ? data.technicians.join(', ') : (data.technicians || '')
      const serviceTypes = Array.isArray(data.serviceType) ? data.serviceType.join(', ') : (data.serviceType || '')
      
      const quoteStaffName = data.createdBy || ''
      
      form.setFieldsValue({
        customerName: data.customer?.fullName || '',
        phone: displayPhoneFrom84(data.customer?.phone || ''),
        brand: brandName,
        vehicleType: modelName,
        licensePlate: vehicle.licensePlate || '',
        chassisNumber: vehicle.vin || '',
        quoteStaff: quoteStaffName,
        receiveDate: data.createdAt ? dayjs(data.createdAt) : (data.deliveryAt ? dayjs(data.deliveryAt) : null),
        technician: technicians,
        serviceType: serviceTypes,
      })
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setLoading(true)
      
      const payload = {
        customer: {
          fullName: values.customerName,
          phone: normalizePhoneTo84(values.phone),
        },
        vehicle: {
          licensePlate: values.licensePlate,
          vin: values.chassisNumber || '',
        },
        receiveCondition: '',
      }
      
      if (values.receiveDate) {
        payload.expectedDeliveryAt = values.receiveDate.format('YYYY-MM-DD')
      }
      
      const { error } = await serviceTicketAPI.update(ticketId, payload)
      setLoading(false)
      
      if (error) {
        message.error(error || 'Cập nhật phiếu không thành công')
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
      closable={false}
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
            >
              <Input readOnly style={{ background: '#fafafa' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Loại xe"
              name="vehicleType"
            >
              <Input readOnly style={{ background: '#fafafa' }} />
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
              <Input readOnly style={{ background: '#fafafa' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Loại dịch vụ"
              name="serviceType"
            >
              <Input readOnly style={{ background: '#fafafa' }} />
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

