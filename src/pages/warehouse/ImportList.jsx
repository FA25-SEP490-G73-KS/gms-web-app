import React, { useState } from 'react'
import { Table, Input, Card, Badge } from 'antd'
import WarehouseLayout from '../../layouts/WarehouseLayout'

const { Search } = Input

export default function ImportList() {
  const [searchTerm, setSearchTerm] = useState('')

  const importList = [
    {
      id: 1,
      code: 'STK-2025-000001',
      vehicleModel: 'Mazda-v3',
      creator: 'DT Huyền - 190',
      createDate: '30/10/2025',
      status: 'Đã nhập',
      totalParts: 15,
      totalValue: '2.500.000'
    },
    {
      id: 2,
      code: 'STK-2025-000002',
      vehicleModel: 'Toyota Vios',
      creator: 'HTK Ly - 180',
      createDate: '29/10/2025',
      status: 'Đã nhập',
      totalParts: 20,
      totalValue: '3.200.000'
    }
  ]

  const getStatusConfig = (status) => {
    if (status === 'Đã nhập') {
      return { color: 'success', text: status }
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
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      width: 180
    },
    {
      title: 'Dòng xe',
      dataIndex: 'vehicleModel',
      key: 'vehicleModel',
      width: 150
    },
    {
      title: 'Người tạo',
      dataIndex: 'creator',
      key: 'creator',
      width: 180
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createDate',
      key: 'createDate',
      width: 150
    },
    {
      title: 'Tổng linh kiện',
      dataIndex: 'totalParts',
      key: 'totalParts',
      width: 150
    },
    {
      title: 'Tổng giá trị',
      dataIndex: 'totalValue',
      key: 'totalValue',
      width: 150,
      render: (value) => `${value} VND`
    },
    {
      title: 'Trạng Thái',
      dataIndex: 'status',
      key: 'status',
      width: 150,
      render: (status) => <Badge {...getStatusConfig(status)} />
    }
  ]

  const filteredData = importList.filter(item =>
    item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.vehicleModel.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.creator.toLowerCase().includes(searchTerm.toLowerCase())
  ).map((item, index) => ({ ...item, key: item.id, index: index + 1 }))

  return (
    <WarehouseLayout>
      <Card
        title={<span style={{ fontSize: '20px', fontWeight: 600 }}>Danh sách nhập</span>}
        extra={
          <Search
            placeholder="Tìm kiếm"
            allowClear
            style={{ width: 300 }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onSearch={setSearchTerm}
          />
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
