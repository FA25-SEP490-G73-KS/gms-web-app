import React, { useState } from 'react'
import { Modal, Row, Col, Divider, Select, InputNumber, Button, Tag, Input, Table, Space, Form } from 'antd'
import { PlusOutlined, DeleteOutlined, CloseOutlined } from '@ant-design/icons'
import { goldTableHeader } from '../../../utils/tableComponents'

const STATUS_OPTIONS = [
  { label: 'Còn hàng', value: 'Còn hàng', color: 'success' },
  { label: 'Cần hàng', value: 'Cần hàng', color: 'processing' },
  { label: 'Hết hàng', value: 'Hết hàng', color: 'warning' },
  { label: 'Không rõ', value: 'Không rõ', color: 'default' },
]

const TECHS = [
  'Hoàng Thị Khánh Ly - 0123456789',
  'Phạm Đức Đạt - 0741852963',
  'Đặng Thị Huyền - 0987654321',
  'Nguyễn Văn B - 0909123456',
]

export default function TicketDetail({ open, onClose, data }) {
  const [replaceItems, setReplaceItems] = useState([{ id: 1, name: 'Linh kiện A', qty: 1, status: 'Còn hàng', price: 1000000, total: 1000000 }])
  const [paintItems, setPaintItems] = useState([{ id: 1, name: 'Linh kiện A', qty: 1, status: 'Còn hàng', price: 1000000, total: 1000000 }])
  const [form] = Form.useForm()

  if (!data) return null

  const getStatusTag = (status) => {
    const option = STATUS_OPTIONS.find(opt => opt.value === status)
    return option ? { color: option.color, text: status } : { color: 'default', text: status }
  }

  const tagColor = data.status === 'Huỷ' ? 'red' : 
                   data.status === 'Đang sửa chữa' ? 'blue' : 
                   data.status === 'Chờ báo giá' ? 'orange' : 
                   data.status === 'Không duyệt' ? 'default' : 'green'

  const addReplace = () => {
    setReplaceItems([...replaceItems, { 
      id: Date.now(), 
      name: `Linh kiện ${replaceItems.length + 1}`, 
      qty: 1, 
      status: 'Còn hàng',
      price: 0,
      total: 0
    }])
  }

  const addPaint = () => {
    setPaintItems([...paintItems, { 
      id: Date.now(), 
      name: `Linh kiện ${paintItems.length + 1}`, 
      qty: 1, 
      status: 'Còn hàng',
      price: 0,
      total: 0
    }])
  }

  const deleteReplace = (id) => {
    setReplaceItems(replaceItems.filter(item => item.id !== id))
  }

  const deletePaint = (id) => {
    setPaintItems(paintItems.filter(item => item.id !== id))
  }

  const updateReplaceItem = (id, field, value) => {
    setReplaceItems(replaceItems.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value }
        if (field === 'qty' || field === 'price') {
          updated.total = updated.qty * updated.price
        }
        return updated
      }
      return item
    }))
  }

  const updatePaintItem = (id, field, value) => {
    setPaintItems(paintItems.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value }
        if (field === 'qty' || field === 'price') {
          updated.total = updated.qty * updated.price
        }
        return updated
      }
      return item
    }))
  }

  const replaceColumns = [
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
      render: (_, record) => (
        <Input
          value={record.name}
          onChange={(e) => updateReplaceItem(record.id, 'name', e.target.value)}
          placeholder="Tên linh kiện"
        />
      )
    },
    {
      title: 'Số lượng',
      dataIndex: 'qty',
      key: 'qty',
      width: 100,
      render: (_, record) => (
        <InputNumber
          min={1}
          value={record.qty}
          onChange={(value) => updateReplaceItem(record.id, 'qty', value)}
        />
      )
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 150,
      render: (_, record) => (
        <Select
          value={record.status}
          onChange={(value) => updateReplaceItem(record.id, 'status', value)}
          options={STATUS_OPTIONS.map(opt => ({
            value: opt.value,
            label: <Tag color={opt.color}>{opt.label}</Tag>
          }))}
          style={{ width: '100%' }}
        />
      )
    },
    {
      title: 'Đơn giá',
      dataIndex: 'price',
      key: 'price',
      width: 150,
      render: (_, record) => (
        <InputNumber
          min={0}
          value={record.price}
          onChange={(value) => updateReplaceItem(record.id, 'price', value)}
          formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
          parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
          style={{ width: '100%' }}
        />
      )
    },
    {
      title: 'Thành tiền',
      dataIndex: 'total',
      key: 'total',
      width: 150,
      render: (total) => `${(total || 0).toLocaleString('vi-VN')} VND`
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 80,
      render: (_, record) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => deleteReplace(record.id)}
        />
      )
    }
  ]

  const paintColumns = [
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
      render: (_, record) => (
        <Input
          value={record.name}
          onChange={(e) => updatePaintItem(record.id, 'name', e.target.value)}
          placeholder="Tên linh kiện"
        />
      )
    },
    {
      title: 'Số lượng',
      dataIndex: 'qty',
      key: 'qty',
      width: 100,
      render: (_, record) => (
        <InputNumber
          min={1}
          value={record.qty}
          onChange={(value) => updatePaintItem(record.id, 'qty', value)}
        />
      )
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 150,
      render: (_, record) => (
        <Select
          value={record.status}
          onChange={(value) => updatePaintItem(record.id, 'status', value)}
          options={STATUS_OPTIONS.map(opt => ({
            value: opt.value,
            label: <Tag color={opt.color}>{opt.label}</Tag>
          }))}
          style={{ width: '100%' }}
        />
      )
    },
    {
      title: 'Đơn giá',
      dataIndex: 'price',
      key: 'price',
      width: 150,
      render: (_, record) => (
        <InputNumber
          min={0}
          value={record.price}
          onChange={(value) => updatePaintItem(record.id, 'price', value)}
          formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
          parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
          style={{ width: '100%' }}
        />
      )
    },
    {
      title: 'Thành tiền',
      dataIndex: 'total',
      key: 'total',
      width: 150,
      render: (total) => `${(total || 0).toLocaleString('vi-VN')} VND`
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 80,
      render: (_, record) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => deletePaint(record.id)}
        />
      )
    }
  ]

  return (
    <Modal
      title="PHIẾU DỊCH VỤ CHI TIẾT"
      open={open}
      onCancel={onClose}
      footer={null}
      width={1200}
      closable={true}
      closeIcon={<CloseOutlined />}
    >
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <div style={{ background: '#fafafa', padding: '16px', borderRadius: '8px' }}>
            <div style={{ marginBottom: '12px' }}>
              <strong>Tên khách hàng:</strong> Nguyễn Văn A
            </div>
            <div style={{ marginBottom: '12px' }}>
              <strong>Số điện thoại:</strong> 0123456789
            </div>
            <div style={{ marginBottom: '12px' }}>
              <strong>Loại xe:</strong> Mazda-v3
            </div>
            <div style={{ marginBottom: '12px' }}>
              <strong>Biển số xe:</strong> {data?.license}
            </div>
            <div>
              <strong>Số khung:</strong> 1HGCM82633A123456
            </div>
          </div>
        </Col>
        <Col span={12}>
          <div style={{ background: '#fafafa', padding: '16px', borderRadius: '8px' }}>
            <div style={{ marginBottom: '12px' }}>
              <strong>Nhân viên lập báo giá:</strong> Hoàng Văn B
            </div>
            <div style={{ marginBottom: '12px' }}>
              <strong>Ngày tạo báo giá:</strong> {data?.createdAt}
            </div>
            <div style={{ marginBottom: '12px' }}>
              <strong>Kỹ thuật viên sửa chữa:</strong>
              <Select
                mode="multiple"
                showSearch
                placeholder="Tìm kiếm"
                allowClear
                options={TECHS.map((t) => ({ value: t, label: t }))}
                style={{ width: '100%', marginTop: '8px' }}
              />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <strong>Loại dịch vụ:</strong> Thay thế phụ tùng
            </div>
            <div>
              <strong>Trạng thái:</strong> <Tag color={tagColor}>{data?.status}</Tag>
            </div>
          </div>
        </Col>
      </Row>

      <Divider orientation="left">BÁO GIÁ CHI TIẾT</Divider>

      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <strong>Thay thế:</strong>
          <Button type="primary" icon={<PlusOutlined />} onClick={addReplace} size="small">
            Thêm
          </Button>
        </div>
        <Table
          columns={replaceColumns}
          dataSource={replaceItems.map((item, index) => ({ ...item, key: item.id, index }))}
          pagination={false}
          size="small"
          components={goldTableHeader}
        />
      </div>

      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <strong>Sơn:</strong>
          <Button type="primary" icon={<PlusOutlined />} onClick={addPaint} size="small">
            Thêm
          </Button>
        </div>
        <Table
          columns={paintColumns}
          dataSource={paintItems.map((item, index) => ({ ...item, key: item.id, index }))}
          pagination={false}
          size="small"
          components={goldTableHeader}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <Button danger type="primary">Gửi</Button>
        <Button>Lưu</Button>
        <Button type="primary" style={{ background: '#22c55e', borderColor: '#22c55e' }}>
          Thanh toán
        </Button>
      </div>
    </Modal>
  )
}
