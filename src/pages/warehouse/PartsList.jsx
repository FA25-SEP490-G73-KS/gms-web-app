import React, { useMemo, useState } from 'react'
import { Table, Input, Space, Button, DatePicker, Modal, Form, InputNumber, Select, message, Checkbox } from 'antd'
import { SearchOutlined, CalendarOutlined, EditOutlined, PlusOutlined, CloseOutlined } from '@ant-design/icons'
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
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [createForm] = Form.useForm()

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

  const handleCreatePart = async (values) => {
    // TODO: Call API to create part
    console.log('Creating part:', values)
    message.success('Thêm linh kiện thành công')
    createForm.resetFields()
    setCreateModalOpen(false)
    // Refresh list if needed
  }

  const handleCreateModalClose = () => {
    setCreateModalOpen(false)
    createForm.resetFields()
  }

  return (
    <WarehouseLayout>
      <div style={{ padding: 24, background: '#ffffff', minHeight: '100vh' }}>
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

            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setCreateModalOpen(true)}
              style={{ background: '#22c55e', borderColor: '#22c55e', marginLeft: 'auto' }}
            >
              Thêm linh kiện
            </Button>
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
          width={571}
          bodyStyle={{ background: '#ffffff', padding: 0 }}
          styles={{
            content: { borderRadius: 0, overflow: 'hidden' }
          }}
        >
          {selectedPart && (
            <>
              {/* Header với background gold */}
              <div style={{
                background: '#CBB081',
                padding: '16px 20px',
                margin: '-24px -24px 24px -24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                height: '63px',
                position: 'relative'
              }}>
                <span style={{ 
                  fontWeight: 700, 
                  fontSize: '20px', 
                  color: '#111',
                  position: 'absolute',
                  left: '50%',
                  transform: 'translateX(-50%)'
                }}>
                  CHI TIẾT LINH KIỆN
                </span>
                <CloseOutlined 
                  onClick={() => setModalOpen(false)}
                  style={{ fontSize: '18px', cursor: 'pointer', color: '#111', fontWeight: 700, marginLeft: 'auto' }}
                />
              </div>

              <div style={{ padding: '24px' }}>
                <Form layout="vertical" initialValues={selectedPart}>
                  {/* Trạng thái và Số lượng ở trên cùng */}
                  <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
                    <Form.Item label="Trạng thái" name="status" style={{ flex: 1 }}>
                      <Select 
                        placeholder="Không rõ"
                        options={[
                          { value: 'Chờ nhập', label: 'Chờ nhập' }, 
                          { value: 'Đã nhập', label: 'Đã nhập' }
                        ]} 
                      />
                    </Form.Item>
                    <Form.Item label="Số lượng" name="quantityOnHand" style={{ flex: 1 }}>
                      <InputNumber min={0} style={{ width: '100%' }} placeholder="0" />
                    </Form.Item>
                  </div>

                  <Form.Item label="Tên linh kiện" name="name">
                    <Input placeholder="Dầu máy 5W-30" />
                  </Form.Item>

                  <Form.Item label="Xuất xứ" name="origin">
                    <Select
                      placeholder="Chọn xuất xứ"
                      options={[
                        { value: 'VN', label: 'VN' },
                        { value: 'USA', label: 'USA' },
                        { value: 'China', label: 'China' },
                        { value: 'UK', label: 'UK' },
                        { value: 'Motul', label: 'Motul' }
                      ]}
                    />
                  </Form.Item>

                  <Form.Item name="useForAllModels" valuePropName="checked">
                    <Checkbox>Dùng chung tất cả dòng xe</Checkbox>
                  </Form.Item>

                  <Form.Item label="Hãng" name="brand">
                    <Select
                      placeholder="Chọn hãng"
                      options={[
                        { value: 'Vinfast', label: 'Vinfast' },
                        { value: 'Honda', label: 'Honda' },
                        { value: 'Castrol', label: 'Castrol' }
                      ]}
                    />
                  </Form.Item>

                  <Form.Item label="Dòng xe" name="vehicleModel">
                    <Select
                      placeholder="Chọn dòng xe"
                      options={[
                        { value: 'VF3', label: 'VF3' },
                        { value: 'VF5', label: 'VF5' },
                        { value: 'VF8', label: 'VF8' },
                        { value: 'Universal', label: 'Universal' }
                      ]}
                    />
                  </Form.Item>

                  <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
                    <Form.Item label="Giá bán" name="sellingPrice" style={{ flex: 1 }}>
                      <InputNumber 
                        min={0} 
                        style={{ width: '100%' }} 
                        placeholder="130.000"
                        addonAfter="/ vnd"
                      />
                    </Form.Item>
                    <Form.Item label="Giá nhập" name="importPrice" style={{ flex: 1 }}>
                      <InputNumber 
                        min={0} 
                        style={{ width: '100%' }} 
                        placeholder="120.000"
                        addonAfter="/ vnd"
                      />
                    </Form.Item>
                  </div>

                  <Form.Item label="Đơn vị" name="unit">
                    <Input placeholder="lít, bộ, cái....." />
                  </Form.Item>

                  <Form.Item label="Ghi chú" name="note">
                    <Input.TextArea rows={4} placeholder="Khả năng nhập" />
                  </Form.Item>

                  <div style={{ textAlign: 'center', marginTop: '24px' }}>
                    <Button
                      type="primary"
                      htmlType="submit"
                      style={{ 
                        background: '#22c55e', 
                        borderColor: '#22c55e', 
                        minWidth: 140,
                        height: '40px',
                        fontSize: '16px',
                        fontWeight: 600
                      }}
                    >
                      Xác nhận
                    </Button>
                  </div>
                </Form>
              </div>
            </>
          )}
        </Modal>

        {/* Modal thêm linh kiện */}
        <Modal
          title={null}
          open={createModalOpen}
          onCancel={handleCreateModalClose}
          closable={false}
          footer={null}
          width={571}
          bodyStyle={{ background: '#ffffff', padding: 0 }}
          styles={{
            content: { borderRadius: 0, overflow: 'hidden' }
          }}
        >
          {/* Header với background gold */}
          <div style={{
            background: '#CBB081',
            padding: '16px 20px',
            margin: '-24px -24px 24px -24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            height: '63px',
            position: 'relative'
          }}>
            <span style={{ 
              fontWeight: 700, 
              fontSize: '20px', 
              color: '#111',
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)'
            }}>
              THÊM LINH KIỆN
            </span>
            <CloseOutlined 
              onClick={handleCreateModalClose}
              style={{ fontSize: '18px', cursor: 'pointer', color: '#111', fontWeight: 700, marginLeft: 'auto' }}
            />
          </div>

          <div style={{ padding: '24px' }}>
            <Form 
              layout="vertical" 
              form={createForm}
              onFinish={handleCreatePart}
            >
              {/* Trạng thái và Số lượng ở trên cùng */}
              <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
                <Form.Item 
                  label="Trạng thái" 
                  name="status" 
                  style={{ flex: 1 }}
                  rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
                >
                  <Select 
                    placeholder="Không rõ"
                    options={[
                      { value: 'Chờ nhập', label: 'Chờ nhập' }, 
                      { value: 'Đã nhập', label: 'Đã nhập' }
                    ]} 
                  />
                </Form.Item>
                <Form.Item 
                  label="Số lượng" 
                  name="quantityOnHand" 
                  style={{ flex: 1 }}
                  rules={[{ required: true, message: 'Vui lòng nhập số lượng' }]}
                >
                  <InputNumber min={0} style={{ width: '100%' }} placeholder="0" />
                </Form.Item>
              </div>

              <Form.Item 
                label="Tên linh kiện" 
                name="name"
                rules={[{ required: true, message: 'Vui lòng nhập tên linh kiện' }]}
              >
                <Input placeholder="Dầu máy 5W-30" />
              </Form.Item>

              <Form.Item 
                label="Xuất xứ" 
                name="origin"
                rules={[{ required: true, message: 'Vui lòng chọn xuất xứ' }]}
              >
                <Select
                  placeholder="Chọn xuất xứ"
                  options={[
                    { value: 'VN', label: 'VN' },
                    { value: 'USA', label: 'USA' },
                    { value: 'China', label: 'China' },
                    { value: 'UK', label: 'UK' },
                    { value: 'Motul', label: 'Motul' }
                  ]}
                />
              </Form.Item>

              <Form.Item name="useForAllModels" valuePropName="checked">
                <Checkbox>Dùng chung tất cả dòng xe</Checkbox>
              </Form.Item>

              <Form.Item label="Hãng" name="brand">
                <Select
                  placeholder="Chọn hãng"
                  options={[
                    { value: 'Vinfast', label: 'Vinfast' },
                    { value: 'Honda', label: 'Honda' },
                    { value: 'Castrol', label: 'Castrol' }
                  ]}
                />
              </Form.Item>

              <Form.Item label="Dòng xe" name="vehicleModel">
                <Select
                  placeholder="Chọn dòng xe"
                  options={[
                    { value: 'VF3', label: 'VF3' },
                    { value: 'VF5', label: 'VF5' },
                    { value: 'VF8', label: 'VF8' },
                    { value: 'Universal', label: 'Universal' }
                  ]}
                />
              </Form.Item>

              <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
                <Form.Item 
                  label="Giá bán" 
                  name="sellingPrice" 
                  style={{ flex: 1 }}
                  rules={[{ required: true, message: 'Vui lòng nhập giá bán' }]}
                >
                  <InputNumber 
                    min={0} 
                    style={{ width: '100%' }} 
                    placeholder="130.000"
                    addonAfter="/ vnd"
                  />
                </Form.Item>
                <Form.Item 
                  label="Giá nhập" 
                  name="importPrice" 
                  style={{ flex: 1 }}
                  rules={[{ required: true, message: 'Vui lòng nhập giá nhập' }]}
                >
                  <InputNumber 
                    min={0} 
                    style={{ width: '100%' }} 
                    placeholder="120.000"
                    addonAfter="/ vnd"
                  />
                </Form.Item>
              </div>

              <Form.Item label="Đơn vị" name="unit">
                <Input placeholder="lít, bộ, cái....." />
              </Form.Item>

              <Form.Item label="Ghi chú" name="note">
                <Input.TextArea rows={4} placeholder="Khả năng nhập" />
              </Form.Item>

              <div style={{ textAlign: 'center', marginTop: '24px' }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  style={{ 
                    background: '#22c55e', 
                    borderColor: '#22c55e', 
                    minWidth: 140,
                    height: '40px',
                    fontSize: '16px',
                    fontWeight: 600
                  }}
                >
                  Xác nhận
                </Button>
              </div>
            </Form>
          </div>
        </Modal>
      </div>
    </WarehouseLayout>
  )
}
