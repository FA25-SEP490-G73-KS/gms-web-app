import React from 'react'
import Modal from 'antd/es/modal'
import Form from 'antd/es/form'
import Input from 'antd/es/input'
import InputNumber from 'antd/es/input-number'
import Select from 'antd/es/select'
import Badge from 'antd/es/badge'
import Row from 'antd/es/row'
import Col from 'antd/es/col'
import Space from 'antd/es/space'
import { CheckCircleOutlined } from '@ant-design/icons'

export default function ComponentDetailsModal({ component, onClose, onConfirm }) {
  const [form] = Form.useForm()

  if (!component) return null

  const getStatusConfig = (status) => {
    if (status === 'Còn hàng') {
      return { color: 'success', text: status }
    }
    return { color: 'default', text: status }
  }

  const technicians = [
    { value: component.technician, label: component.technician },
    { value: 'Nguyễn Văn A - 0987654321', label: 'Nguyễn Văn A - 0987654321' },
    { value: 'Trần Thị B - 0912345678', label: 'Trần Thị B - 0912345678' }
  ]

  const handleSubmit = () => {
    form.validateFields().then(values => {
      onConfirm(values)
    })
  }

  return (
    <Modal
      title={
        <span style={{ fontSize: '18px', fontWeight: 600 }}>
          CHI TIẾT LINH KIỆN
        </span>
      }
      open={!!component}
      onCancel={onClose}
      onOk={handleSubmit}
      okText="Xác nhận"
      cancelText="Hủy"
      okButtonProps={{
        style: {
          background: '#52c41a',
          borderColor: '#52c41a'
        }
      }}
      width={700}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          name: component.name,
          quantity: component.quantity,
          origin: component.origin,
          importPrice: component.importPrice,
          brand: component.brand,
          sellingPrice: component.sellingPrice,
          vehicleModel: component.vehicleModel,
          status: component.status,
          technician: component.technician
        }}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Tên linh kiện" name="name">
              <Input readOnly style={{ background: '#fafafa' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Số lượng" name="quantity">
              <InputNumber
                min={0}
                style={{ width: '100%' }}
                formatter={(value) => `${value}`}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Xuất xứ" name="origin">
              <Input readOnly style={{ background: '#fafafa' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Giá nhập" name="importPrice">
              <Input
                suffix="VND"
                readOnly
                style={{ background: '#fafafa' }}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Hãng" name="brand">
              <Input readOnly style={{ background: '#fafafa' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Giá bán" name="sellingPrice">
              <Input
                suffix="VND"
                readOnly
                style={{ background: '#fafafa' }}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Dòng xe" name="vehicleModel">
              <Input readOnly style={{ background: '#fafafa' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Trạng thái" name="status">
              <div style={{ paddingTop: '4px' }}>
                <Badge {...getStatusConfig(component.status)} />
              </div>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              label="Kỹ thuật viên nhận hàng"
              name="technician"
              rules={[{ required: true, message: 'Vui lòng chọn kỹ thuật viên' }]}
            >
              <Select
                placeholder="Chọn kỹ thuật viên"
                options={technicians}
                showSearch
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  )
}
