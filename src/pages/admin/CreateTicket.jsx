import React, { useState } from 'react'
import Form from 'antd/es/form'
import Input from 'antd/es/input'
import DatePicker from 'antd/es/date-picker'
import Select from 'antd/es/select'
import Button from 'antd/es/button'
import Card from 'antd/es/card'
import Row from 'antd/es/row'
import Col from 'antd/es/col'
import Space from 'antd/es/space'
import message from 'antd/es/message'
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
    navigate('/service-advisor/orders')
  }

  return (
    <AdminLayout>
      <div style={{ padding: '24px', background: '#f5f7fb', minHeight: '100vh' }}>
        <Card
          title={<span style={{ fontSize: '20px', fontWeight: 600 }}>Tạo phiếu dịch vụ</span>}
          style={{ borderRadius: '12px' }}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleCreate}
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
                    <Button onClick={() => navigate('/service-advisor/orders')}>Hủy</Button>
                    <Button type="primary" htmlType="submit" loading={loading} style={{ background: '#22c55e', borderColor: '#22c55e' }}>
                      Tạo phiếu
                    </Button>
                  </Space>
                </Row>
              </Col>
            </Row>
          </Form>
        </Card>
      </div>
    </AdminLayout>
  )
}
