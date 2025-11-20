import React, { useState } from 'react'
import { Form, Input, InputNumber, Select, DatePicker, Button, Card, Row, Col, Table, Space, message, Badge } from 'antd'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import WarehouseLayout from '../../layouts/WarehouseLayout'
import { goldTableHeader } from '../../utils/tableComponents'

const { TextArea } = Input

const STATUS_OPTIONS = [
  { value: 'Đang xuất hàng', label: 'Đang xuất hàng', color: 'processing' },
  { value: 'Hoàn thành', label: 'Hoàn thành', color: 'success' },
  { value: 'Chờ xác nhận', label: 'Chờ xác nhận', color: 'warning' },
]

const VEHICLE_MODELS = [
  { value: 'Mazda-v3', label: 'Mazda-v3' },
  { value: 'Toyota Vios', label: 'Toyota Vios' },
  { value: 'Honda City', label: 'Honda City' },
  { value: 'Universal', label: 'Universal' },
  { value: 'Tất cả', label: 'Tất cả' }
]

const ORIGINS = [
  { value: 'VN', label: 'Việt Nam' },
  { value: 'Nhật', label: 'Nhật Bản' },
  { value: 'Trung Quốc', label: 'Trung Quốc' },
  { value: 'Hàn Quốc', label: 'Hàn Quốc' }
]

const BRANDS = [
  { value: 'Castrol', label: 'Castrol' },
  { value: 'Toyota', label: 'Toyota' },
  { value: 'Honda', label: 'Honda' },
  { value: 'Mazda', label: 'Mazda' },
  { value: 'Universal', label: 'Universal' }
]

const RECEIVERS = [
  { value: 'Đặng Thị Huyền - 0123456789', label: 'Đặng Thị Huyền - 0123456789' },
  { value: 'HTK Ly - 0987654321', label: 'HTK Ly - 0987654321' },
  { value: 'Nguyễn Văn A - 0912345678', label: 'Nguyễn Văn A - 0912345678' }
]

export default function CreateExportForm() {
  const [form] = Form.useForm()
  const [parts, setParts] = useState([])

  const generateCode = () => {
    const date = new Date()
    const year = date.getFullYear()
    const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0')
    return `STK-${year}-${random}`
  }

  const partsColumns = [
    {
      title: 'STT',
      dataIndex: 'index',
      key: 'index',
      width: 60,
      render: (_, __, index) => index + 1
    },
    {
      title: 'Tên linh kiện',
      dataIndex: 'name',
      key: 'name',
      width: 200
    },
    {
      title: 'Số lượng',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100
    },
    {
      title: 'Dòng xe',
      dataIndex: 'vehicleModel',
      key: 'vehicleModel',
      width: 120
    },
    {
      title: 'Xuất xứ',
      dataIndex: 'origin',
      key: 'origin',
      width: 120
    },
    {
      title: 'Hãng',
      dataIndex: 'brand',
      key: 'brand',
      width: 120
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => {
        const option = STATUS_OPTIONS.find(opt => opt.value === status)
        return option ? <Badge status={option.color} text={status} /> : status
      }
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 80,
      render: (_, record) => (
        <Button
          type="link"
          danger
          icon={<DeleteOutlined />}
          onClick={() => {
            setParts(parts.filter(item => item.id !== record.id))
          }}
        />
      )
    }
  ]

  const handleAddPart = () => {
    const values = form.getFieldsValue(['partName', 'partQuantity', 'partVehicleModel', 'partOrigin', 'partBrand', 'partStatus'])
    if (!values.partName || !values.partQuantity) {
      message.warning('Vui lòng điền đầy đủ thông tin linh kiện (tên và số lượng)')
      return
    }
    const newPart = {
      id: Date.now(),
      name: values.partName,
      quantity: values.partQuantity,
      vehicleModel: values.partVehicleModel || 'Tất cả',
      origin: values.partOrigin || 'VN',
      brand: values.partBrand || '',
      status: values.partStatus || 'Đang xuất hàng'
    }
    setParts([...parts, newPart])
    form.setFieldsValue({
      partName: '',
      partQuantity: undefined,
      partVehicleModel: undefined,
      partOrigin: undefined,
      partBrand: undefined,
      partStatus: undefined
    })
  }

  const handleSubmit = (values) => {
    if (parts.length === 0) {
      message.warning('Vui lòng thêm ít nhất một linh kiện')
      return
    }
    const code = values.code || generateCode()
    const formData = {
      code,
      vehicleModel: values.vehicleModel,
      exportDate: values.exportDate,
      receiver: values.receiver,
      note: values.note,
      parts
    }
    console.log('Form data:', formData)
    message.success('Tạo phiếu xuất kho thành công!')
    form.resetFields()
    setParts([])
  }

  return (
    <WarehouseLayout>
      <Card
        title={<span style={{ fontSize: '20px', fontWeight: 600 }}>Tạo phiếu xuất kho</span>}
        style={{ marginBottom: 24 }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            code: generateCode()
          }}
        >
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="Code"
                name="code"
                rules={[{ required: true, message: 'Vui lòng nhập code' }]}
              >
                <Input placeholder="Mã phiếu xuất" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Dòng xe"
                name="vehicleModel"
                rules={[{ required: true, message: 'Vui lòng chọn dòng xe' }]}
              >
                <Select options={VEHICLE_MODELS} placeholder="Chọn dòng xe" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Ngày xuất"
                name="exportDate"
                rules={[{ required: true, message: 'Vui lòng chọn ngày xuất' }]}
              >
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="Chọn ngày xuất" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Người nhận"
                name="receiver"
                rules={[{ required: true, message: 'Vui lòng chọn người nhận' }]}
              >
                <Select options={RECEIVERS} placeholder="Chọn người nhận" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Ghi chú" name="note">
                <TextArea rows={2} placeholder="Nhập ghi chú (nếu có)" />
              </Form.Item>
            </Col>
          </Row>

          <Card
            title="Danh sách linh kiện"
            extra={
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAddPart}>
                Thêm linh kiện
              </Button>
            }
            style={{ marginBottom: 24 }}
          >
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={5}>
                <Form.Item label="Tên linh kiện" name="partName">
                  <Input placeholder="Nhập tên linh kiện" />
                </Form.Item>
              </Col>
              <Col span={3}>
                <Form.Item label="Số lượng" name="partQuantity">
                  <InputNumber min={1} style={{ width: '100%' }} placeholder="SL" />
                </Form.Item>
              </Col>
              <Col span={4}>
                <Form.Item label="Dòng xe" name="partVehicleModel">
                  <Select options={VEHICLE_MODELS} placeholder="Chọn dòng xe" allowClear />
                </Form.Item>
              </Col>
              <Col span={4}>
                <Form.Item label="Xuất xứ" name="partOrigin">
                  <Select options={ORIGINS} placeholder="Chọn xuất xứ" allowClear />
                </Form.Item>
              </Col>
              <Col span={4}>
                <Form.Item label="Hãng" name="partBrand">
                  <Select options={BRANDS} placeholder="Chọn hãng" allowClear />
                </Form.Item>
              </Col>
              <Col span={4}>
                <Form.Item label="Trạng thái" name="partStatus">
                  <Select options={STATUS_OPTIONS} placeholder="Chọn trạng thái" allowClear />
                </Form.Item>
              </Col>
            </Row>

            <Table
              columns={partsColumns}
              dataSource={parts.map((part, index) => ({ ...part, index: index + 1 }))}
              pagination={false}
              size="small"
              components={goldTableHeader}
            />
          </Card>

          <Row justify="end">
            <Space>
              <Button onClick={() => {
                form.resetFields()
                setParts([])
              }}>
                Hủy
              </Button>
              <Button type="primary" htmlType="submit">
                Tạo phiếu
              </Button>
            </Space>
          </Row>
        </Form>
      </Card>
    </WarehouseLayout>
  )
}

