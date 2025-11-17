import React, { useState } from 'react'
import { Form, Input, InputNumber, Select, Button, Card, Row, Col, Table, Space, message } from 'antd'
import { PlusOutlined, CloseOutlined } from '@ant-design/icons'
import WarehouseLayout from '../../layouts/WarehouseLayout'
import { goldTableHeader } from '../../utils/tableComponents'
import '../../styles/pages/warehouse/create-export-form.css'

const { TextArea } = Input
const { Option } = Select

// Sample data for parts/categories
const PARTS_CATEGORIES = [
  { id: 1, name: 'Má phanh - Nhật', quantity: 50, unit: 'Cái', unitPrice: 250000 },
  { id: 2, name: 'Mâm xe - Hàn', quantity: 50, unit: 'Cái', unitPrice: 1200000 },
  { id: 3, name: 'Moay-ơ - USA', quantity: 50, unit: 'Cái', unitPrice: 800000 },
  { id: 4, name: 'Dầu máy 5W-30', quantity: 30, unit: 'Lít', unitPrice: 120000 },
  { id: 5, name: 'Lọc nhiên liệu', quantity: 25, unit: 'Cái', unitPrice: 150000 },
  { id: 6, name: 'Chụp bụi, gioăng cao su', quantity: 20, unit: 'Bộ', unitPrice: 80000 }
]

const TICKET_TYPES = [
  { value: 'nhap_kho', label: 'Nhập kho' },
  { value: 'xuat_kho', label: 'Xuất kho' },
  { value: 'kiem_ke', label: 'Kiểm kê' }
]

const REASONS = [
  { value: 'xuat_ban', label: 'Xuất bán' },
  { value: 'tra_hang', label: 'Trả hàng' },
  { value: 'dieu_chuyen', label: 'Điều chuyển' },
  { value: 'khac', label: 'Khác' }
]

const USERS = [
  { value: 'dang_thi_huyen', label: 'Đặng Thị Huyền' },
  { value: 'nguyen_van_a', label: 'Nguyễn Văn A' },
  { value: 'htk_ly', label: 'HTK Ly' }
]

export default function CreateExportForm() {
  const [form] = Form.useForm()
  const [components, setComponents] = useState([])

  const handleAddComponent = () => {
    const newComponent = {
      id: Date.now(),
      categoryId: null,
      categoryName: '',
      quantity: 1,
      unit: '---',
      unitPrice: '---'
    }
    setComponents([...components, newComponent])
  }

  const handleRemoveComponent = (id) => {
    setComponents(components.filter(item => item.id !== id))
  }

  const handleCategoryChange = (id, value) => {
    const selectedPart = PARTS_CATEGORIES.find(p => p.id === value)
    if (selectedPart) {
      setComponents(components.map(item => 
        item.id === id 
          ? { 
              ...item, 
              categoryId: selectedPart.id,
              categoryName: selectedPart.name,
              unit: selectedPart.unit,
              unitPrice: selectedPart.unitPrice
            }
          : item
      ))
    }
  }

  const handleQuantityChange = (id, value) => {
    setComponents(components.map(item => 
      item.id === id ? { ...item, quantity: value || 1 } : item
    ))
  }

  const handleSubmit = (values) => {
    if (components.length === 0) {
      message.warning('Vui lòng thêm ít nhất một linh kiện')
      return
    }
    
    const formData = {
      ticketType: values.ticketType,
      reason: values.reason,
      creator: values.creator,
      recipient: values.recipient,
      note: values.note,
      components
    }
    
    console.log('Form data:', formData)
    message.success('Tạo phiếu thành công!')
    form.resetFields()
    setComponents([])
  }

  const componentsColumns = [
    {
      title: 'STT',
      key: 'index',
      width: 80,
      align: 'center',
      render: (_, __, index) => (
        <span style={{ fontWeight: 600, color: '#111' }}>
          {String(index + 1).padStart(2, '0')}
        </span>
      )
    },
    {
      title: 'Danh mục',
      key: 'category',
      width: 300,
      render: (_, record) => (
        <Select
          showSearch
          placeholder="Chọn danh mục"
          style={{ width: '100%' }}
          value={record.categoryId}
          onChange={(value) => handleCategoryChange(record.id, value)}
          filterOption={(input, option) =>
            option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
          }
        >
          {PARTS_CATEGORIES.map(part => (
            <Option key={part.id} value={part.id}>
              {part.name} - Số lượng: {part.quantity}
            </Option>
          ))}
        </Select>
      )
    },
    {
      title: 'Số lượng',
      key: 'quantity',
      width: 150,
      align: 'center',
      render: (_, record) => (
        <InputNumber
          min={1}
          value={record.quantity}
          onChange={(value) => handleQuantityChange(record.id, value)}
          style={{ width: '100%' }}
        />
      )
    },
    {
      title: 'Đơn vị',
      dataIndex: 'unit',
      key: 'unit',
      width: 120,
      align: 'center',
      render: (text) => <span style={{ color: '#666' }}>{text}</span>
    },
    {
      title: 'Đơn giá (vnd)',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      width: 150,
      align: 'right',
      render: (text) => (
        <span style={{ color: '#666' }}>
          {text === '---' ? '---' : text?.toLocaleString('vi-VN')}
        </span>
      )
    },
    {
      title: '',
      key: 'action',
      width: 50,
      align: 'center',
      render: (_, record) => (
        <Button
          type="text"
          danger
          icon={<CloseOutlined />}
          onClick={() => handleRemoveComponent(record.id)}
          style={{ padding: 0, width: 32, height: 32 }}
        />
      )
    }
  ]

  return (
    <WarehouseLayout>
      <div style={{ padding: '24px', background: '#f5f7fb', minHeight: '100vh' }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="create-export-form"
        >
          {/* Thông tin chung */}
          <Card 
            title={<span style={{ fontSize: '18px', fontWeight: 600 }}>Thông tin chung</span>}
            style={{ marginBottom: 24 }}
            className="info-card"
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label={<span>Loại phiếu <span style={{ color: 'red' }}>*</span></span>}
                  name="ticketType"
                  rules={[{ required: true, message: 'Vui lòng chọn loại phiếu' }]}
                >
                  <Select placeholder="Chọn loại phiếu">
                    {TICKET_TYPES.map(type => (
                      <Option key={type.value} value={type.value}>
                        {type.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label={<span>Lý do <span style={{ color: 'red' }}>*</span></span>}
                  name="reason"
                  rules={[{ required: true, message: 'Vui lòng chọn lý do' }]}
                >
                  <Select placeholder="Chọn lý do">
                    {REASONS.map(reason => (
                      <Option key={reason.value} value={reason.value}>
                        {reason.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label={<span>Người tạo <span style={{ color: 'red' }}>*</span></span>}
                  name="creator"
                  rules={[{ required: true, message: 'Vui lòng chọn người tạo' }]}
                >
                  <Select placeholder="VD: Đặng Thị Huyền">
                    {USERS.map(user => (
                      <Option key={user.value} value={user.value}>
                        {user.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label={<span>Người nhận <span style={{ color: 'red' }}>*</span></span>}
                  name="recipient"
                  rules={[{ required: true, message: 'Vui lòng chọn người nhận' }]}
                >
                  <Select placeholder="VD: Đặng Thị Huyền">
                    {USERS.map(user => (
                      <Option key={user.value} value={user.value}>
                        {user.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={24}>
                <Form.Item
                  label="Ghi chú"
                  name="note"
                >
                  <TextArea 
                    rows={3} 
                    placeholder="Ghi chú"
                    style={{ resize: 'none' }}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          {/* Linh Kiện */}
          <Card 
            title={<span style={{ fontSize: '18px', fontWeight: 600 }}>Linh Kiện</span>}
            style={{ marginBottom: 24 }}
            className="components-card"
          >
            <Table
              columns={componentsColumns}
              dataSource={components}
              pagination={false}
              size="middle"
              components={goldTableHeader}
              rowKey="id"
              style={{ marginBottom: 16 }}
              locale={{ emptyText: 'Chưa có linh kiện nào' }}
            />
            
            <Button
              type="dashed"
              icon={<PlusOutlined />}
              onClick={handleAddComponent}
              style={{ width: '100%' }}
            >
              Thêm linh kiện
            </Button>
          </Card>

          {/* Action Button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              style={{
                background: '#22c55e',
                borderColor: '#22c55e',
                fontWeight: 600,
                borderRadius: '8px',
                padding: '8px 32px',
                height: 'auto'
              }}
            >
              Tạo phiếu
            </Button>
          </div>
        </Form>
      </div>
    </WarehouseLayout>
  )
}
