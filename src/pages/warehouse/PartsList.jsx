import React, { useMemo, useState, useEffect } from 'react'
import { Table, Input, Space, Button, DatePicker, Modal, Form, InputNumber, Select, message, Checkbox } from 'antd'
import { SearchOutlined, CalendarOutlined, EditOutlined, PlusOutlined, CloseOutlined } from '@ant-design/icons'
import WarehouseLayout from '../../layouts/WarehouseLayout'
import { goldTableHeader } from '../../utils/tableComponents'
import { partsAPI } from '../../services/api'
import '../../styles/pages/warehouse/export-list.css'
import '../../styles/pages/warehouse/import-list.css'
import '../../styles/pages/warehouse/parts-list.css'

const { Search } = Input
const statusOptions = ['Chờ nhập', 'Đã nhập', 'Tất cả']

export default function PartsList() {
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState(null)
  const [statusFilter, setStatusFilter] = useState('Tất cả')
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedPart, setSelectedPart] = useState(null)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [createForm] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [parts, setParts] = useState([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [editForm] = Form.useForm()

  useEffect(() => {
    fetchParts()
  }, [page, pageSize])

  const fetchParts = async () => {
    setLoading(true)
    try {
      const { data: response, error } = await partsAPI.getAll(page - 1, pageSize)
      
      if (error) {
        message.error('Không thể tải danh sách linh kiện. Vui lòng thử lại.')
        setParts([])
        setTotal(0)
        setLoading(false)
        return
      }

      let resultArray = []
      let totalCount = 0

      if (response) {
        if (response.result && response.result.content && Array.isArray(response.result.content)) {
          resultArray = response.result.content
          totalCount = response.result.totalElements || response.result.numberOfElements || 0
        } else if (Array.isArray(response.result)) {
          resultArray = response.result
          totalCount = response.result.length
        } else if (Array.isArray(response.data)) {
          resultArray = response.data
          totalCount = response.data.length
        } else if (Array.isArray(response)) {
          resultArray = response
          totalCount = response.length
        } else if (Array.isArray(response.content)) {
          resultArray = response.content
          totalCount = response.totalElements || response.content.length
        }
      }

      // Map API response to component format
      const mappedParts = resultArray.map(item => ({
        id: item.partId,
        name: item.name || '',
        origin: item.market || 'VN',
        brand: item.categoryName || '',
        vehicleModel: item.universal ? 'All' : (item.compatibleVehicleIds?.length > 0 ? 'Specific' : 'All'),
        quantityOnHand: item.quantityInStock || 0,
        reservedQuantity: item.reservedQuantity || 0,
        alertThreshold: item.reorderLevel || 0,
        importPrice: item.purchasePrice || 0,
        sellingPrice: item.sellingPrice || 0,
        unit: item.unit || '',
        categoryId: item.categoryId,
        categoryName: item.categoryName,
        compatibleVehicleModelIds: item.compatibleVehicleIds || item.compatibleVehicleModelIds || [],
        discountRate: item.discountRate || 0,
        specialPart: item.specialPart || false,
        universal: item.universal || false,
        market: item.market || 'VN',
        createdAt: item.createdAt || new Date().toISOString().split('T')[0],
        status: item.quantityInStock > 0 ? 'Đã nhập' : 'Chờ nhập',
        // Keep original item for updates
        originalItem: item
      }))

      setParts(mappedParts)
      setTotal(totalCount)
    } catch (err) {
      console.error('Error fetching parts:', err)
      message.error('Đã xảy ra lỗi khi tải danh sách linh kiện.')
      setParts([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }

  const filteredData = useMemo(() => {
    return parts
      .filter((item) => {
        const matchesSearch =
          !searchTerm ||
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (item.brand && item.brand.toLowerCase().includes(searchTerm.toLowerCase()))

        let matchesDate = true
        if (dateFilter) {
          matchesDate = item.createdAt === dateFilter.format('YYYY-MM-DD')
        }

        const matchesStatus = statusFilter === 'Tất cả' || item.status === statusFilter
        return matchesSearch && matchesDate && matchesStatus
      })
      .map((item, index) => ({ ...item, key: item.id, index: index + 1 }))
  }, [parts, searchTerm, dateFilter, statusFilter])

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

  const handleOpenDetail = async (part) => {
    setSelectedPart(part)
    setModalOpen(true)
    
    // Fetch full details if needed
    if (part.id && !part.originalItem) {
      try {
        const { data: response, error } = await partsAPI.getById(part.id)
        if (!error && response && response.result) {
          const fullPart = {
            ...part,
            ...response.result,
            originalItem: response.result
          }
          setSelectedPart(fullPart)
          editForm.setFieldsValue({
            name: response.result.name,
            origin: response.result.market,
            brand: response.result.categoryName,
            vehicleModel: response.result.universal ? 'All' : 'Specific',
            quantityOnHand: response.result.quantityInStock,
            reservedQuantity: response.result.reservedQuantity,
            alertThreshold: response.result.reorderLevel,
            sellingPrice: response.result.sellingPrice,
            importPrice: response.result.purchasePrice,
            unit: response.result.unit,
            useForAllModels: response.result.universal,
            status: response.result.quantityInStock > 0 ? 'Đã nhập' : 'Chờ nhập'
          })
        } else {
          editForm.setFieldsValue(part)
        }
      } catch (err) {
        console.error('Error fetching part details:', err)
        editForm.setFieldsValue(part)
      }
    } else {
      editForm.setFieldsValue({
        name: part.name,
        origin: part.origin,
        brand: part.brand,
        vehicleModel: part.vehicleModel,
        quantityOnHand: part.quantityOnHand,
        reservedQuantity: part.reservedQuantity,
        alertThreshold: part.alertThreshold,
        sellingPrice: part.sellingPrice,
        importPrice: part.importPrice,
        unit: part.unit,
        useForAllModels: part.universal,
        status: part.status
      })
    }
  }

  const handleCreatePart = async (values) => {
    try {
      const payload = {
        name: values.name,
        market: values.origin || 'VN',
        categoryId: 0, // TODO: Get from category selection if available
        purchasePrice: values.importPrice || 0,
        sellingPrice: values.sellingPrice || 0,
        reorderLevel: values.alertThreshold || 0,
        unit: values.unit || '',
        universal: values.useForAllModels || false,
        specialPart: false,
        compatibleVehicleModelIds: values.useForAllModels ? [] : (values.vehicleModelIds || []),
        discountRate: 0
      }

      const { data: response, error } = await partsAPI.create(payload)

      if (error) {
        message.error(error || 'Tạo linh kiện không thành công. Vui lòng thử lại.')
        return
      }

      if (response && (response.statusCode === 200 || response.statusCode === 201 || response.result)) {
        message.success('Thêm linh kiện thành công')
        createForm.resetFields()
        setCreateModalOpen(false)
        fetchParts() // Refresh list
      } else {
        message.error('Tạo linh kiện không thành công. Vui lòng thử lại.')
      }
    } catch (err) {
      console.error('Error creating part:', err)
      message.error('Đã xảy ra lỗi khi tạo linh kiện. Vui lòng thử lại.')
    }
  }

  const handleUpdatePart = async (values) => {
    if (!selectedPart || !selectedPart.id) {
      message.error('Không tìm thấy thông tin linh kiện')
      return
    }

    try {
      const payload = {
        name: values.name,
        market: values.origin || 'VN',
        categoryId: selectedPart.categoryId || 0,
        purchasePrice: values.importPrice || 0,
        sellingPrice: values.sellingPrice || 0,
        reorderLevel: values.alertThreshold || 0,
        unit: values.unit || '',
        universal: values.useForAllModels || false,
        specialPart: selectedPart.specialPart || false,
        compatibleVehicleModelIds: values.useForAllModels ? [] : (selectedPart.compatibleVehicleModelIds || []),
        discountRate: selectedPart.discountRate || 0
      }

      const { data: response, error } = await partsAPI.update(selectedPart.id, payload)

      if (error) {
        message.error(error || 'Cập nhật linh kiện không thành công. Vui lòng thử lại.')
        return
      }

      if (response && (response.statusCode === 200 || response.statusCode === 201 || response.result)) {
        message.success('Cập nhật linh kiện thành công')
        setModalOpen(false)
        fetchParts() // Refresh list
      } else {
        message.error('Cập nhật linh kiện không thành công. Vui lòng thử lại.')
      }
    } catch (err) {
      console.error('Error updating part:', err)
      message.error('Đã xảy ra lỗi khi cập nhật linh kiện. Vui lòng thử lại.')
    }
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
            loading={loading}
            pagination={{
              current: page,
              pageSize: pageSize,
              total: filteredData.length,
              showSizeChanger: true,
              showTotal: (total) => `0 of ${total} row(s) selected.`,
              pageSizeOptions: ['10', '20', '50', '100'],
              onChange: (page, pageSize) => {
                setPage(page)
                setPageSize(pageSize)
              },
              onShowSizeChange: (current, size) => {
                setPage(1)
                setPageSize(size)
              }
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
              <Form layout="vertical" form={editForm} onFinish={handleUpdatePart}>
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
                      Cập nhật
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
