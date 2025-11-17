import React, { useMemo, useState } from 'react'
import { Table, Input, Space, Button, DatePicker, Modal, Form, InputNumber, Select } from 'antd'
import { SearchOutlined, CalendarOutlined, EditOutlined } from '@ant-design/icons'
import WarehouseLayout from '../../layouts/WarehouseLayout'
import { goldTableHeader } from '../../utils/tableComponents'
import '../../styles/pages/warehouse/export-list.css'
import '../../styles/pages/warehouse/import-list.css'
import '../../styles/pages/warehouse/parts-list.css'

const { Search } = Input
const statusOptions = ['Chờ nhập', 'Đã nhập', 'Tất cả']

export default function PartsList() {
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState(null)
  const [statusFilter, setStatusFilter] = useState('Chờ nhập')
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedPart, setSelectedPart] = useState(null)

  const parts = [
    {
      id: 1,
      name: 'Dầu nhớt',
      origin: 'VN',
      brand: 'Castrol',
      vehicleModel: 'All',
      quantityOnHand: 25,
      reservedQuantity: 5,
      alertThreshold: 5,
      importPrice: 120000,
      sellingPrice: 150000,
      createdAt: '2025-11-10',
      status: 'Chờ nhập'
    },
    {
      id: 2,
      name: 'Lọc gió',
      origin: 'VN',
      brand: 'Honda',
      vehicleModel: 'Fortuner',
      quantityOnHand: 15,
      reservedQuantity: 5,
      alertThreshold: 5,
      importPrice: 120000,
      sellingPrice: 150000,
      createdAt: '2025-11-10',
      status: 'Đã nhập'
    },
    {
      id: 3,
      name: 'Bugì',
      origin: 'China',
      brand: 'Honda',
      vehicleModel: 'Fortuner',
      quantityOnHand: 12,
      reservedQuantity: 5,
      alertThreshold: 5,
      importPrice: 120000,
      sellingPrice: 150000,
      createdAt: '2025-11-10',
      status: 'Chờ nhập'
    },
    {
      id: 4,
      name: 'Lốp xe',
      origin: 'VN',
      brand: 'Honda',
      vehicleModel: 'Fortuner',
      quantityOnHand: 8,
      reservedQuantity: 5,
      alertThreshold: 5,
      importPrice: 120000,
      sellingPrice: 150000,
      createdAt: '2025-11-10',
      status: 'Đã nhập'
    },
    {
      id: 5,
      name: 'Ống thủy lực động dầu',
      origin: 'USA',
      brand: 'Honda',
      vehicleModel: 'Fortuner',
      quantityOnHand: 3,
      reservedQuantity: 5,
      alertThreshold: 5,
      importPrice: 120000,
      sellingPrice: 150000,
      createdAt: '2025-11-10',
      status: 'Chờ nhập'
    }
  ]

  const filteredData = useMemo(() => {
    return parts
      .filter((item) => {
        const matchesSearch =
          !searchTerm ||
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.brand.toLowerCase().includes(searchTerm.toLowerCase())

        let matchesDate = true
        if (dateFilter) {
          matchesDate = item.createdAt === dateFilter.format('YYYY-MM-DD')
        }

        const matchesStatus = statusFilter === 'Tất cả' || item.status === statusFilter
        return matchesSearch && matchesDate && matchesStatus
      })
      .map((item, index) => ({ ...item, key: item.id, index: index + 1 }))
  }, [searchTerm, dateFilter, statusFilter])

  const columns = [
    {
      title: 'STT',
      dataIndex: 'index',
      key: 'index',
      width: 70,
      render: (_, __, index) => (
        <span style={{ fontWeight: 600, color: '#111' }}>{String(index + 1).padStart(2, '0')}</span>
      )
    },
    {
      title: 'Tên linh kiện',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (text) => <span style={{ fontWeight: 600 }}>{text}</span>
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
      width: 140,
      render: (text) => <span style={{ fontWeight: 600 }}>{text}</span>
    },
    {
      title: 'Dòng xe',
      dataIndex: 'vehicleModel',
      key: 'vehicleModel',
      width: 140,
      render: (text) => <span style={{ fontWeight: 600 }}>{text}</span>
    },
    {
      title: 'Số lượng tồn',
      dataIndex: 'quantityOnHand',
      key: 'quantityOnHand',
      width: 130,
      render: (value) => <span style={{ fontWeight: 600 }}>{value}</span>
    },
    {
      title: 'Số lượng giữ',
      dataIndex: 'reservedQuantity',
      key: 'reservedQuantity',
      width: 130,
      render: (value) => <span style={{ fontWeight: 600 }}>{value}</span>
    },
    {
      title: 'Giá nhập (VND)',
      dataIndex: 'importPrice',
      key: 'importPrice',
      width: 150,
      render: (value) => (
        <span style={{ fontWeight: 600 }}>{value.toLocaleString('vi-VN')}</span>
      )
    },
    {
      title: 'Giá bán (VND)',
      dataIndex: 'sellingPrice',
      key: 'sellingPrice',
      width: 150,
      render: (value) => (
        <span style={{ fontWeight: 600 }}>{value.toLocaleString('vi-VN')}</span>
      )
    },
    {
      title: '',
      key: 'action',
      width: 60,
      render: (_, record) => (
        <Button
          type="text"
          icon={<EditOutlined />}
          onClick={(e) => {
            e.stopPropagation()
            handleOpenDetail(record)
          }}
        />
      )
    }
  ]

  const handleOpenDetail = (part) => {
    setSelectedPart(part)
    setModalOpen(true)
  }

  return (
    <WarehouseLayout>
      <div style={{ padding: 24, background: '#f5f7fb', minHeight: '100vh' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 20 }}>Danh sách linh kiện</h1>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 20 }}>
            <Search
              placeholder="Tìm kiếm"
              allowClear
              prefix={<SearchOutlined />}
              style={{ width: 250 }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onSearch={setSearchTerm}
            />

            <DatePicker
              placeholder="Ngày tạo"
              format="YYYY-MM-DD"
              suffixIcon={<CalendarOutlined />}
              value={dateFilter}
              onChange={setDateFilter}
              style={{ width: 150 }}
            />

            <Space>
              {statusOptions.map((status) => (
                <Button
                  key={status}
                  type={statusFilter === status ? 'primary' : 'default'}
                  onClick={() => setStatusFilter(status)}
                  style={{
                    background: statusFilter === status ? '#CBB081' : '#fff',
                    borderColor: statusFilter === status ? '#CBB081' : '#e6e6e6',
                    color: statusFilter === status ? '#111' : '#666',
                    fontWeight: 600
                  }}
                >
                  {status}
                </Button>
              ))}
            </Space>
          </div>
        </div>

        <div
          style={{
            background: '#fff',
            borderRadius: 12,
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}
        >
          <Table
            className="parts-table"
            columns={columns}
            dataSource={filteredData}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              total: filteredData.length,
              showTotal: (total) => `0 of ${total} row(s) selected.`,
              pageSizeOptions: ['10', '20', '50', '100']
            }}
            rowClassName={(_, index) => (index % 2 === 0 ? 'table-row-even' : 'table-row-odd')}
            size="middle"
            components={goldTableHeader}
            onRow={(record) => ({
              onClick: () => handleOpenDetail(record)
            })}
          />
        </div>

        <Modal
          title={null}
          open={modalOpen}
          onCancel={() => setModalOpen(false)}
          closable={false}
          footer={null}
          width={520}
          bodyStyle={{ background: '#fefaf1', padding: 24 }}
          styles={{
            content: { borderRadius: 16, overflow: 'hidden' }
          }}
        >
          {selectedPart && (
            <>
              <div className="parts-modal-header">
                <span>CHI TIẾT LINH KIỆN</span>
                <button className="parts-modal-close" onClick={() => setModalOpen(false)}>
                  ×
                </button>
              </div>
              <Form layout="vertical" initialValues={selectedPart}>
              <Form.Item label="Tên linh kiện" name="name">
                <Input />
              </Form.Item>
              <Space size="middle" style={{ width: '100%' }}>
                <Form.Item label="Xuất xứ" name="origin" style={{ flex: 1 }}>
                  <Select
                    options={[
                      { value: 'VN', label: 'VN' },
                      { value: 'USA', label: 'USA' },
                      { value: 'China', label: 'China' },
                      { value: 'UK', label: 'UK' }
                    ]}
                  />
                </Form.Item>
                <Form.Item label="Hãng" name="brand" style={{ flex: 1 }}>
                  <Input />
                </Form.Item>
              </Space>
              <Form.Item label="Dòng xe" name="vehicleModel">
                <Input />
              </Form.Item>
              <Space size="middle" style={{ width: '100%' }}>
                <Form.Item label="Số lượng tồn" name="quantityOnHand" style={{ flex: 1 }}>
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item label="Số lượng giữ" name="reservedQuantity" style={{ flex: 1 }}>
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>
              </Space>
              <Form.Item label="Mức cảnh báo" name="alertThreshold">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
              <Space size="middle" style={{ width: '100%' }}>
                <Form.Item label="Giá nhập" name="importPrice" style={{ flex: 1 }}>
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item label="Giá bán" name="sellingPrice" style={{ flex: 1 }}>
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>
              </Space>
              <Form.Item label="Trạng thái" name="status">
                <Select options={[{ value: 'Chờ nhập' }, { value: 'Đã nhập' }]} />
              </Form.Item>
              <Space style={{ width: '100%', justifyContent: 'space-between', marginTop: 16 }}>
                <Button
                  type="primary"
                  style={{ background: '#d97706', borderColor: '#d97706', minWidth: 140 }}
                >
                  Nhập hàng
                </Button>
                <Button
                  type="primary"
                  style={{ background: '#22c55e', borderColor: '#22c55e', minWidth: 140 }}
                >
                  Lưu
                </Button>
              </Space>
              </Form>
            </>
          )}
        </Modal>
      </div>
    </WarehouseLayout>
  )
}
