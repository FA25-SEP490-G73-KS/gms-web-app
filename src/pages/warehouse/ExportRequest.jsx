import React, { useState } from 'react'
import { Table, Input, Card, Badge, Button } from 'antd'
import WarehouseLayout from '../../layouts/WarehouseLayout'
import ComponentDetailsModal from './modals/ComponentDetailsModal'

const { Search } = Input

export default function ExportRequest() {
  const [selectedComponent, setSelectedComponent] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')

  const exportRequests = [
    {
      id: 1,
      code: 'STK-2025-000001',
      vehicleModel: 'Mazda-v3',
      creator: 'DT Huyền - 190',
      createDate: '30/10/2025',
      status: 'Chờ xác nhận'
    },
    {
      id: 2,
      code: 'STK-2025-000001',
      vehicleModel: 'Mazda-v3',
      creator: 'DT Huyền - 190',
      createDate: '30/10/2025',
      status: 'Chờ xác nhận'
    },
    {
      id: 3,
      code: 'STK-2025-000001',
      vehicleModel: 'Mazda-v3',
      creator: 'DT Huyền - 190',
      createDate: '30/10/2025',
      status: 'Xác nhận'
    },
    {
      id: 4,
      code: 'STK-2025-000001',
      vehicleModel: 'Mazda-v3',
      creator: 'DT Huyền - 190',
      createDate: '30/10/2025',
      status: 'Xác nhận'
    }
  ]

  const getStatusConfig = (status) => {
    if (status === 'Xác nhận') {
      return { color: 'success', text: status }
    }
    if (status === 'Chờ xác nhận') {
      return { color: 'processing', text: status }
    }
    return { color: 'default', text: status }
  }

  const handleViewDetails = () => {
    setSelectedComponent({
      name: 'Dầu máy 5W-30',
      quantity: 5,
      origin: 'VN',
      importPrice: '120.000',
      brand: 'Castrol',
      sellingPrice: '130.000',
      vehicleModel: 'Tất cả',
      status: 'Còn hàng',
      technician: 'Đặng Thị Huyền - 0123456789'
    })
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
      title: 'Trạng Thái',
      dataIndex: 'status',
      key: 'status',
      width: 180,
      render: (status) => <Badge {...getStatusConfig(status)} />
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Button
          type="primary"
          onClick={handleViewDetails}
          style={{
            background: record.status === 'Chờ xác nhận' ? '#52c41a' : '#1677ff',
            borderColor: record.status === 'Chờ xác nhận' ? '#52c41a' : '#1677ff'
          }}
        >
          {record.status === 'Chờ xác nhận' ? 'Xác nhận' : 'Xem'}
        </Button>
      )
    }
  ]

  const filteredData = exportRequests.filter(item =>
    item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.vehicleModel.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.creator.toLowerCase().includes(searchTerm.toLowerCase())
  ).map((item, index) => ({ ...item, key: item.id, index: index + 1 }))

  return (
    <WarehouseLayout>
      <Card
        title={<span style={{ fontSize: '20px', fontWeight: 600 }}>Phiếu yêu cầu xuất kho</span>}
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
            current: 2,
            total: 20,
            pageSize: 10,
            showSizeChanger: false,
            showTotal: (total) => `Tổng ${total} bản ghi`,
            showQuickJumper: true
          }}
          size="middle"
        />
      </Card>

      {selectedComponent && (
        <ComponentDetailsModal
          component={selectedComponent}
          onClose={() => setSelectedComponent(null)}
          onConfirm={() => {
            console.log('Confirmed')
            setSelectedComponent(null)
          }}
        />
      )}
    </WarehouseLayout>
  )
}
