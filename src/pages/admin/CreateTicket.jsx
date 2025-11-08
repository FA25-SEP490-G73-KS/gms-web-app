import React, { useState } from 'react'
import { Form, Input, DatePicker, Select, Button, Card, Row, Col, Space, message } from 'antd'
import { useNavigate } from 'react-router-dom'
import AdminLayout from '../../layouts/AdminLayout'
import { serviceTicketAPI } from '../../services/api'

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

export default function CreateTicket() {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleCreate = async (values) => {
    setLoading(true)
    const payload = {
      appointmentId: 0,
      serviceTypeIds: values.service || [],
      customer: {
        customerId: 0,
        fullName: values.name,
        phone: values.phone,
        address: values.address,
        customerType: 'CA_NHAN',
        loyaltyLevel: 'NORMAL'
      },
      vehicle: {
        vehicleId: 0,
        licensePlate: values.plate,
        brandId: 0,
        modelId: 0,
        year: 0,
        vin: values.vin || ''
      },
      advisorId: 1,
      assignedTechnicianIds: values.techs || [],
      receiveCondition: '',
      note: values.note || '',
      expectedDeliveryAt: values.receiveDate ? values.receiveDate.format('YYYY-MM-DD') : ''
    }

    const { data, error } = await serviceTicketAPI.create(payload)
    setLoading(false)

    if (error) {
      message.error('Tạo phiếu không thành công')
      return
    }

    message.success('Tạo phiếu dịch vụ thành công')
    form.resetFields()
    navigate('/admin/orders')
  }

  return (
    <AdminLayout>
      <Card
        title={<span style={{ fontSize: '20px', fontWeight: 600, textAlign: 'center', display: 'block' }}>PHIẾU DỊCH VỤ</span>}
        style={{ marginBottom: 24 }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreate}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Số điện thoại"
                name="phone"
                rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }]}
              >
                <Input placeholder="VD: 0123456789" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Họ và tên"
                name="name"
                rules={[{ required: true, message: 'Vui lòng nhập họ và tên' }]}
              >
                <Input placeholder="VD: Đặng Thị Huyền" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Địa chỉ"
                name="address"
                rules={[{ required: true, message: 'Vui lòng nhập địa chỉ' }]}
              >
                <Input placeholder="VD: Hòa Lạc - Hà Nội" />
              </Form.Item>
            </Col>
            <Col span={12}>
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
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Ngày nhận xe"
                name="receiveDate"
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Loại dịch vụ"
                name="service"
              >
                <Select
                  mode="multiple"
                  options={SERVICES}
                  placeholder="Chọn loại dịch vụ"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={6}>
              <Form.Item
                label="Biển số xe"
                name="plate"
                rules={[{ required: true, message: 'Vui lòng nhập biển số xe' }]}
              >
                <Input placeholder="VD: 30A-12345" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label="Hãng xe"
                name="brand"
                rules={[{ required: true, message: 'Vui lòng nhập hãng xe' }]}
              >
                <Input placeholder="VD: Mazda" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label="Loại xe"
                name="model"
                rules={[{ required: true, message: 'Vui lòng nhập loại xe' }]}
              >
                <Input placeholder="VD: Mazda 3" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label="Số khung"
                name="vin"
              >
                <Input placeholder="VD: RL4XW4336B9205813" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                label="Ghi chú"
                name="note"
              >
                <TextArea rows={4} placeholder="VD: Xe bị xì lốp" />
              </Form.Item>
            </Col>
          </Row>

          <Row justify="end">
            <Space>
              <Button onClick={() => navigate('/admin/orders')}>Hủy</Button>
              <Button type="primary" htmlType="submit" loading={loading} style={{ background: '#22c55e', borderColor: '#22c55e' }}>
                Tạo phiếu
              </Button>
            </Space>
          </Row>
        </Form>
      </Card>
    </AdminLayout>
  )
}
