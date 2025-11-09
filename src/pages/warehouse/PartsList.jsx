import React, { useState } from 'react'
import Table from 'antd/es/table'
import Input from 'antd/es/input'
import Card from 'antd/es/card'
import Badge from 'antd/es/badge'
import Space from 'antd/es/space'
import Button from 'antd/es/button'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import WarehouseLayout from '../../layouts/WarehouseLayout'

const { Search } = Input

export default function PartsList() {
  const [searchTerm, setSearchTerm] = useState('')

  const parts = [
    {
      id: 1,
      name: 'Dầu máy 5W-30',
      quantity: 50,
      origin: 'VN',
      importPrice: '120.000',
      brand: 'Castrol',
      sellingPrice: '130.000',
      vehicleModel: 'Tất cả',
      status: 'Còn hàng'
    },
    {
      id: 2,
      name: 'Lọc nhiên liệu',
      quantity: 30,
      origin: 'Nhật',
      importPrice: '150.000',
      brand: 'Toyota',
      sellingPrice: '170.000',
      vehicleModel: 'Toyota Vios',
      status: 'Còn hàng'
    },
    {
      id: 3,
      name: 'Chụp bụi, gioăng cao su',
      quantity: 25,
      origin: 'Trung Quốc',
      importPrice: '80.000',
      brand: 'Universal',
      sellingPrice: '95.000',
      vehicleModel: 'Universal',
      status: 'Sắp hết'
    }
  ]

  const getStatusConfig = (status) => {
    if (status === 'Còn hàng') {
      return { color: 'success', text: status }
    }
    if (status === 'Sắp hết') {
      return { color: 'warning', text: status }
    }
    if (status === 'Hết hàng') {
      return { color: 'error', text: status }
    }
    return { color: 'default', text: status }
  }

  const columns = [
    {
      title: 'STT',
      dataIndex: 'index',
      key: 'index',
      width: 80,
      render: (_, __, index) => String(index + 1).padStart(2, '0')
    },
    {
      title: 'Tên linh kiện',
      dataIndex: 'name',
      key: 'name',
      width: 250
    },
    {
      title: 'Số lượng',
      dataIndex: 'quantity',
      key: 'quantity',
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
      width: 150
    },
    {
      title: 'Giá nhập',
      dataIndex: 'importPrice',
      key: 'importPrice',
      width: 150,
      render: (price) => `${price} VND`
    },
    {
      title: 'Giá bán',
      dataIndex: 'sellingPrice',
      key: 'sellingPrice',
      width: 150,
      render: (price) => `${price} VND`
    },
    {
      title: 'Dòng xe',
      dataIndex: 'vehicleModel',
      key: 'vehicleModel',
      width: 150
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => <Badge {...getStatusConfig(status)} />
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 150,
      render: () => (
        <Space>
          <Button type="link" icon={<EditOutlined />} size="small" />
          <Button type="link" danger icon={<DeleteOutlined />} size="small" />
        </Space>
      )
    }
  ]

  const filteredData = parts.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.vehicleModel.toLowerCase().includes(searchTerm.toLowerCase())
  ).map((item, index) => ({ ...item, key: item.id, index: index + 1 }))

  return (
    <WarehouseLayout>
      <Card
        title={<span style={{ fontSize: '20px', fontWeight: 600 }}>Danh sách linh kiện</span>}
        extra={
          <Space>
            <Search
              placeholder="Tìm kiếm"
              allowClear
              style={{ width: 300 }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onSearch={setSearchTerm}
            />
            <Button type="primary" icon={<PlusOutlined />}>
              Thêm linh kiện
            </Button>
          </Space>
        }
        style={{ marginBottom: 24 }}
      >
        <Table
          columns={columns}
          dataSource={filteredData}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} bản ghi`,
            showQuickJumper: true
          }}
          size="middle"
        />
      </Card>
    </WarehouseLayout>
  )
}
