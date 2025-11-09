import React, { useState } from 'react'
import Table from 'antd/es/table'
import Input from 'antd/es/input'
import Card from 'antd/es/card'
import Badge from 'antd/es/badge'
import Space from 'antd/es/space'
import Button from 'antd/es/button'
import Checkbox from 'antd/es/checkbox'
import { RightOutlined, MoreOutlined } from '@ant-design/icons'
import WarehouseLayout from '../../layouts/WarehouseLayout'
import ComponentDetailsModal from './modals/ComponentDetailsModal'

const { Search } = Input

export default function ExportList() {
  const [selectedComponent, setSelectedComponent] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRowKeys, setSelectedRowKeys] = useState([])

  const exportList = [
    {
      id: 1,
      code: 'STK-2025-000001',
      vehicleModel: 'Mazda-v3',
      creator: 'DT Huyền - 190',
      createDate: '30/10/2025',
      status: 'Đang xuất hàng'
    },
    {
      id: 2,
      code: 'STK-2025-000001',
      vehicleModel: 'Mazda-v3',
      creator: 'DT Huyền - 190',
      createDate: '30/10/2025',
      status: 'Đang xuất hàng'
    },
    {
      id: 3,
      code: 'STK-2025-000001',
      vehicleModel: 'Mazda-v3',
      creator: 'DT Huyền - 190',
      createDate: '30/10/2025',
      status: 'Đang xuất hàng'
    },
    {
      id: 4,
      code: 'STK-2025-000001',
      vehicleModel: 'Mazda-v3',
      creator: 'DT Huyền - 190',
      createDate: '30/10/2025',
      status: 'Đang xuất hàng'
    },
    {
      id: 5,
      code: 'STK-2025-000001',
      vehicleModel: 'Mazda-v3',
      creator: 'DT Huyền - 190',
      createDate: '30/10/2025',
      status: 'Hoàn thành'
    },
    {
      id: 6,
      code: 'STK-2025-000001',
      vehicleModel: 'Mazda-v3',
      creator: 'DT Huyền - 190',
      createDate: '30/10/2025',
      status: 'Hoàn thành'
    }
  ]

  const getStatusConfig = (status) => {
    if (status === 'Hoàn thành') {
      return { color: 'success', text: status }
    }
    if (status === 'Đang xuất hàng') {
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
        <Space>
          <Checkbox />
          <Button
            type="text"
            icon={<RightOutlined />}
            onClick={handleViewDetails}
            style={{ padding: '4px 8px' }}
          />
        </Space>
      )
    }
  ]

  const filteredData = exportList.filter(item =>
    item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.vehicleModel.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.creator.toLowerCase().includes(searchTerm.toLowerCase())
  ).map((item, index) => ({ ...item, key: item.id, index: index + 1 }))

  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
  }

  return (
    <WarehouseLayout>
      <Card
        title={<span style={{ fontSize: '20px', fontWeight: 600 }}>Danh sách xuất kho</span>}
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
            <Button icon={<MoreOutlined />} />
          </Space>
        }
        style={{ marginBottom: 24 }}
      >
        <Table
          columns={columns}
          dataSource={filteredData}
          rowSelection={rowSelection}
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
