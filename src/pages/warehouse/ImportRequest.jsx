import React, { useState } from 'react'
import Table from 'antd/es/table'
import Input from 'antd/es/input'
import Card from 'antd/es/card'
import Badge from 'antd/es/badge'
import { CheckCircleOutlined } from '@ant-design/icons'
import WarehouseLayout from '../../layouts/WarehouseLayout'
import { goldTableHeader } from '../../utils/tableComponents'

const { Search } = Input

export default function ImportRequest() {
  const [expandedRowKeys, setExpandedRowKeys] = useState([])
  const [searchTerm, setSearchTerm] = useState('')

  const importRequests = [
    {
      id: 1,
      code: 'STK-2025-000001',
      vehicleModel: 'Mazda-v3',
      creator: 'DT Huyền - 190',
      createDate: '30/10/2025',
      status: 'Chờ nhập',
      parts: [
        {
          id: 1,
          name: 'Lọc nhiên liệu',
          quantity: 1,
          vehicleModel: 'Toyota Vios',
          origin: 'Nhật',
          status: 'confirmed'
        },
        {
          id: 2,
          name: 'Chụp bụi, gioăng cao su',
          quantity: 1,
          vehicleModel: 'Universal',
          origin: 'Trung Quốc',
          status: 'confirmed'
        }
      ]
    },
    {
      id: 2,
      code: 'STK-2025-000001',
      vehicleModel: 'Mazda-v3',
      creator: 'DT Huyền - 190',
      createDate: '30/10/2025',
      status: 'Chờ nhập',
      parts: []
    },
    {
      id: 3,
      code: 'STK-2025-000001',
      vehicleModel: 'Mazda-v3',
      creator: 'DT Huyền - 190',
      createDate: '30/10/2025',
      status: 'Chờ nhập',
      parts: []
    },
    {
      id: 4,
      code: 'STK-2025-000001',
      vehicleModel: 'Mazda-v3',
      creator: 'DT Huyền - 190',
      createDate: '30/10/2025',
      status: 'Chờ nhập',
      parts: []
    },
    {
      id: 5,
      code: 'STK-2025-000001',
      vehicleModel: 'Mazda-v3',
      creator: 'DT Huyền - 190',
      createDate: '30/10/2025',
      status: 'Đã nhập',
      parts: []
    },
    {
      id: 6,
      code: 'STK-2025-000001',
      vehicleModel: 'Mazda-v3',
      creator: 'DT Huyền - 190',
      createDate: '30/10/2025',
      status: 'Đã nhập',
      parts: []
    }
  ]

  const getStatusConfig = (status) => {
    if (status === 'Đã nhập') {
      return { color: 'blue', text: status }
    }
    if (status === 'Chờ nhập') {
      return { color: 'processing', text: status }
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
      title: 'Trạng Thái',
      dataIndex: 'status',
      key: 'status',
      width: 200,
      render: (status) => <Badge {...getStatusConfig(status)} />
    }
  ]

  const partsColumns = [
    {
      title: 'STT',
      dataIndex: 'index',
      key: 'index',
      width: 80,
      render: (_, __, index) => String(index + 1).padStart(2, '0')
    },
    {
      title: 'Linh kiện',
      dataIndex: 'name',
      key: 'name',
      width: 250
    },
    {
      title: 'Số lượng',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 120,
      render: (qty) => String(qty).padStart(2, '0')
    },
    {
      title: 'Dòng xe',
      dataIndex: 'vehicleModel',
      key: 'vehicleModel',
      width: 150
    },
    {
      title: 'Xuất xứ',
      dataIndex: 'origin',
      key: 'origin',
      width: 150
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 120,
      render: (_, record) => (
        record.status === 'confirmed' && (
          <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '20px' }} />
        )
      )
    }
  ]

  const expandedRowRender = (record) => {
    if (!record.parts || record.parts.length === 0) return null

    return (
      <Table
        columns={partsColumns}
        dataSource={record.parts.map((part, idx) => ({ ...part, index: idx + 1, key: part.id }))}
        pagination={false}
        size="small"
        style={{ background: '#fafafa' }}
        components={goldTableHeader}
      />
    )
  }

  const filteredData = importRequests.filter(item => 
    item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.vehicleModel.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.creator.toLowerCase().includes(searchTerm.toLowerCase())
  ).map((item, index) => ({ ...item, key: item.id, index: index + 1 }))

  return (
    <WarehouseLayout>
      <Card
        title={<span style={{ fontSize: '20px', fontWeight: 600 }}>Phiếu yêu cầu nhập kho</span>}
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
          expandable={{
            expandedRowKeys,
            onExpandedRowsChange: setExpandedRowKeys,
            expandedRowRender,
            rowExpandable: (record) => record.parts && record.parts.length > 0
          }}
          pagination={{
            current: 2,
            total: 200,
            pageSize: 10,
            showSizeChanger: false,
            showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} bản ghi`,
            showQuickJumper: true
          }}
          size="middle"
          components={goldTableHeader}
        />
      </Card>
    </WarehouseLayout>
  )
}
