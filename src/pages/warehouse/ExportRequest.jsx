import React, { useState, useEffect } from 'react'
import { Table, Input, Space, Button, DatePicker, Tag, message, Modal, Form, Select, Checkbox, Dropdown } from 'antd'
import { SearchOutlined, CalendarOutlined, DownOutlined, UpOutlined, InboxOutlined, CloseOutlined } from '@ant-design/icons'
import WarehouseLayout from '../../layouts/WarehouseLayout'
import { goldTableHeader } from '../../utils/tableComponents'
import { priceQuotationAPI } from '../../services/api'
import '../../styles/pages/warehouse/export-list.css'

const { Search } = Input
const { Option } = Select

// Custom styles for table header matching Figma
const customTableStyles = `
  .export-request-table .ant-table-thead > tr > th {
    background: #CBB081 !important;
    color: #111 !important;
    font-weight: 700 !important;
    font-size: 15px !important;
    border: none !important;
    padding: 14px 16px !important;
  }
  
  .export-request-table .ant-table-thead > tr > th::before {
    display: none !important;
  }
  
  .export-request-table .ant-table-tbody > tr > td {
    padding: 12px 16px !important;
    font-size: 14px !important;
  }
  
  .export-request-table .ant-table-row {
    border-bottom: 1px solid #f0f0f0;
  }
`

export default function ExportRequest() {
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState(null)
  const [statusFilter, setStatusFilter] = useState('Đang xuất hàng')
  const [expandedRowKeys, setExpandedRowKeys] = useState([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [exportRequests, setExportRequests] = useState([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [confirmModalOpen, setConfirmModalOpen] = useState(false)
  const [selectedPart, setSelectedPart] = useState(null)
  const [confirmForm] = Form.useForm()
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [selectedQuotationId, setSelectedQuotationId] = useState(null)
  const [rejectReason, setRejectReason] = useState('')

  // Fetch data from API
  useEffect(() => {
    fetchPendingQuotations()
  }, [page, pageSize])

  const fetchPendingQuotations = async () => {
    setLoading(true)
    try {
      const { data, error } = await priceQuotationAPI.getPending(page - 1, pageSize)
      
      if (error) {
        message.error('Không thể tải danh sách báo giá')
        setLoading(false)
        return
      }

      const result = data?.result || {}
      const content = result.content || []
      
      // Transform API data to match UI structure
      const transformedData = content.map((item) => ({
        id: item.priceQuotationId || item.id,
        code: item.code || item.serviceTicketCode || 'N/A',
        customer: 'N/A', // API doesn't return customer name in list
        licensePlate: item.licensePlate || 'N/A',
        createDate: item.createdAt || 'N/A',
        status: mapQuotationStatus(item.status),
        statusKey: item.status, // Lưu status gốc từ API
        parts: (item.items || []).map((partItem) => ({
          id: partItem.priceQuotationItemId || partItem.partId,
          name: partItem.partName || partItem.itemName || 'N/A',
          quantity: partItem.quantity || 0,
          itemType: partItem.itemType || 'PART',
          inventoryStatus: partItem.inventoryStatus || 'AVAILABLE',
          warehouseReviewStatus: partItem.warehouseReviewStatus || 'PENDING',
          warehouseNote: partItem.warehouseNote || ''
        }))
      }))

      setExportRequests(transformedData)
      setTotal(result.totalElements || 0)
    } catch (err) {
      console.error('Failed to fetch pending quotations:', err)
      message.error('Đã xảy ra lỗi khi tải dữ liệu')
    } finally {
      setLoading(false)
    }
  }

  const mapQuotationStatus = (status) => {
    const statusMap = {
      'DRAFT': 'Chờ xác nhận',
      'WAITING_WAREHOUSE_CONFIRM': 'Chờ xác nhận',
      'WAREHOUSE_CONFIRMED': 'Xác nhận',
      'WAITING_CUSTOMER_CONFIRM': 'Chờ khách xác nhận',
      'CUSTOMER_CONFIRMED': 'Hoàn thành',
      'CUSTOMER_REJECTED': 'Từ chối',
      'COMPLETED': 'Hoàn thành'
    }
    return statusMap[status] || 'Chờ xác nhận'
  }

  // Sample data removed, using API data instead

  const getStatusConfig = (status) => {
    if (status === 'Xác nhận' || status === 'Hoàn thành') {
      return { 
        color: '#16a34a', 
        bgColor: '#dcfce7',
        borderColor: '#86efac',
        text: status 
      }
    }
    if (status === 'Chờ xác nhận') {
      return { 
        color: '#2563eb', 
        bgColor: '#dbeafe',
        borderColor: '#93c5fd',
        text: status 
      }
    }
    if (status === 'Chờ khách xác nhận') {
      return { 
        color: '#7c3aed', 
        bgColor: '#ede9fe',
        borderColor: '#c4b5fd',
        text: status 
      }
    }
    return { 
      color: '#666', 
      bgColor: '#f3f4f6',
      borderColor: '#d1d5db',
      text: status 
    }
  }

  const getInventoryStatusText = (status) => {
    const statusMap = {
      'AVAILABLE': 'Có hàng',
      'OUT_OF_STOCK': 'Hết hàng',
      'LOW_STOCK': 'Sắp hết',
      'UNKNOWN': 'Không rõ'
    }
    return statusMap[status] || 'Không rõ'
  }

  const handleOpenConfirmModal = (part) => {
    setSelectedPart(part)
    setConfirmModalOpen(true)
    
    const isUnknownStatus = part.inventoryStatus === 'UNKNOWN' || !part.inventoryStatus
    
    // Pre-fill form with part data, default to useForAllModels = true
    confirmForm.setFieldsValue({
      partName: part.name,
      category: isUnknownStatus ? '' : 'Dầu – Hóa chất',
      origin: isUnknownStatus ? '' : 'MohI',
      supplier: isUnknownStatus ? '' : 'Petrolimex Lubricants',
      sellPrice: isUnknownStatus ? '' : 130000,
      buyPrice: isUnknownStatus ? '' : 120000,
      unit: isUnknownStatus ? '' : 'lít',
      useForAllModels: true, // Mặc định là dùng chung tất cả dòng xe
      inventoryStatus: getInventoryStatusText(part.inventoryStatus),
      quantity: part.quantity || ''
    })
  }

  const handleConfirmSubmit = async (values) => {
    if (!selectedPart?.id) {
      message.error('Không tìm thấy thông tin linh kiện')
      return
    }

    try {
      const inventoryStatus = values.inventoryStatus
      const isUnknownStatus = inventoryStatus === 'Không rõ'

      // Build payload theo format API
      const payload = {
        categoryId: 0, // TODO: Map from category name to ID
        marketId: 0, // TODO: Map from origin to ID
        name: values.partName,
        note: values.note || '',
        purchasePrice: Number(values.sellPrice) || 0,
        quantity: isUnknownStatus ? Number(values.quantity) || 0 : 0,
        reorderLevel: 0,
        sellingPrice: Number(values.buyPrice) || 0,
        specialPart: false,
        supplierId: 0, // TODO: Map from supplier name to ID
        unitId: 0, // TODO: Map from unit to ID
        universal: values.useForAllModels || false,
        vehicleModelId: 0, // TODO: Map from model to ID
        warehouseNote: values.note || ''
      }

      console.log('=== Confirm Part Payload ===')
      console.log('Item ID:', selectedPart.id)
      console.log('Payload:', JSON.stringify(payload, null, 2))
      console.log('============================')

      const { data, error } = await priceQuotationAPI.confirmItem(selectedPart.id, payload)

      if (error) {
        message.error(error || 'Không thể xác nhận linh kiện')
        return
      }

      message.success('Duyệt linh kiện thành công')
      setConfirmModalOpen(false)
      confirmForm.resetFields()
      setSelectedPart(null)
      fetchPendingQuotations()
    } catch (err) {
      console.error('Error confirming part:', err)
      message.error('Đã xảy ra lỗi khi duyệt linh kiện')
    }
  }

  const handleRejectPart = async () => {
    if (!selectedPart?.id) {
      message.error('Không tìm thấy thông tin linh kiện')
      return
    }

    const note = confirmForm.getFieldValue('note')
    if (!note || note.trim() === '') {
      message.error('Vui lòng nhập ghi chú/lý do từ chối')
      return
    }

    try {
      console.log('=== Reject Part ===')
      console.log('Item ID:', selectedPart.id)
      console.log('Reason:', note)
      console.log('===================')

      const { data, error } = await priceQuotationAPI.rejectItem(selectedPart.id, note)

      if (error) {
        message.error(error || 'Không thể từ chối linh kiện')
        return
      }

      message.success('Từ chối linh kiện thành công')
      setConfirmModalOpen(false)
      confirmForm.resetFields()
      setSelectedPart(null)
      fetchPendingQuotations()
    } catch (err) {
      console.error('Error rejecting part:', err)
      message.error('Đã xảy ra lỗi khi từ chối linh kiện')
    }
  }

  const handleCloseConfirmModal = () => {
    setConfirmModalOpen(false)
    setSelectedPart(null)
    confirmForm.resetFields()
  }

  const handleConfirmQuotation = async (quotationId) => {
    try {
      console.log('=== Confirm Quotation ===')
      console.log('Quotation ID:', quotationId)
      console.log('=======================')
      
      const { data, error } = await priceQuotationAPI.confirmQuotation(quotationId)
      
      if (error) {
        message.error(error || 'Không thể xác nhận báo giá')
        return
      }
      
      message.success('Đã xác nhận khách hàng đã xác nhận báo giá')
      fetchPendingQuotations()
    } catch (err) {
      console.error('Error confirming quotation:', err)
      message.error('Đã xảy ra lỗi khi xác nhận')
    }
  }

  const handleOpenRejectModal = (quotationId) => {
    setSelectedQuotationId(quotationId)
    setRejectReason('')
    setRejectModalOpen(true)
  }

  const handleRejectQuotation = async () => {
    if (!selectedQuotationId) {
      message.error('Không tìm thấy ID báo giá')
      return
    }

    if (!rejectReason || rejectReason.trim() === '') {
      message.error('Vui lòng nhập lý do từ chối')
      return
    }

    try {
      console.log('=== Reject Quotation ===')
      console.log('Quotation ID:', selectedQuotationId)
      console.log('Reason:', rejectReason)
      console.log('========================')
      
      const { data, error } = await priceQuotationAPI.rejectQuotation(selectedQuotationId, rejectReason)
      
      if (error) {
        message.error(error || 'Không thể từ chối báo giá')
        return
      }
      
      message.success('Đã xác nhận khách hàng từ chối báo giá')
      setRejectModalOpen(false)
      setSelectedQuotationId(null)
      setRejectReason('')
      fetchPendingQuotations()
    } catch (err) {
      console.error('Error rejecting quotation:', err)
      message.error('Đã xảy ra lỗi khi từ chối')
    }
  }

  const handleCloseRejectModal = () => {
    setRejectModalOpen(false)
    setSelectedQuotationId(null)
    setRejectReason('')
  }

  // Filter data
  const filteredData = exportRequests
    .filter(item => {
      const matchesSearch = !searchTerm || 
        item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.licensePlate.toLowerCase().includes(searchTerm.toLowerCase())
      
      let matchesDate = true
      if (dateFilter) {
        const filterDate = dateFilter.format('DD/MM/YYYY')
        matchesDate = item.createDate === filterDate
      }
      
      const matchesStatus = statusFilter === 'Tất cả' || item.status === statusFilter
      
      return matchesSearch && matchesDate && matchesStatus
    })
    .map((item, index) => ({ ...item, key: item.id, index: index + 1 }))

  // Main table columns
  const columns = [
    {
      title: 'STT',
      dataIndex: 'index',
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
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      width: 200,
      render: (text) => (
        <span style={{ fontWeight: 600, color: '#111' }}>{text}</span>
      )
    },
    {
      title: 'Khách hàng',
      dataIndex: 'customer',
      key: 'customer',
      width: 200,
      render: (text) => (
        <span style={{ fontWeight: 500, color: '#111' }}>{text}</span>
      )
    },
    {
      title: 'Biển số xe',
      dataIndex: 'licensePlate',
      key: 'licensePlate',
      width: 150,
      render: (text) => (
        <span style={{ fontWeight: 600, color: '#111', fontFamily: 'monospace' }}>
          {text}
        </span>
      )
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createDate',
      key: 'createDate',
      width: 150,
      render: (text) => (
        <span style={{ fontWeight: 500, color: '#111' }}>{text}</span>
      )
    },
    {
      title: 'Trạng Thái',
      dataIndex: 'status',
      key: 'status',
      width: 280,
      render: (status, record) => {
        const config = getStatusConfig(status)
        const isWaitingCustomerConfirm = record.statusKey === 'WAITING_CUSTOMER_CONFIRM'
        
        const dropdownMenu = {
          items: [
            {
              key: 'confirm',
              label: (
                <span style={{ color: '#16a34a', fontWeight: 500 }}>
                  Khách đã xác nhận
                </span>
              ),
              onClick: () => handleConfirmQuotation(record.id)
            },
            {
              key: 'reject',
              label: (
                <span style={{ color: '#dc2626', fontWeight: 500 }}>
                  Khách từ chối
                </span>
              ),
              onClick: () => handleOpenRejectModal(record.id)
            }
          ]
        }
        
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Tag
              style={{
                color: config.color,
                backgroundColor: config.bgColor,
                borderColor: config.borderColor,
                border: '1px solid',
                borderRadius: '6px',
                padding: '4px 12px',
                fontWeight: 500,
                fontSize: '14px',
                margin: 0
              }}
            >
              {config.text}
            </Tag>
            {isWaitingCustomerConfirm && (
              <Dropdown menu={dropdownMenu} trigger={['click']}>
                <Button
                  type="text"
                  icon={<DownOutlined />}
                  style={{
                    padding: '0 8px',
                    height: 'auto',
                    fontSize: '14px',
                    color: '#666'
                  }}
                />
              </Dropdown>
            )}
          </div>
        )
      }
    }
  ]

  // Nested table columns for parts
  const expandedRowRender = (record) => {
    const partsColumns = [
      {
        title: 'STT',
        key: 'index',
        width: 80,
        align: 'center',
        render: (_, __, index) => (
          <span style={{ fontWeight: 600, color: '#666' }}>
            {String(index + 1).padStart(2, '0')}
          </span>
        )
      },
      {
        title: 'Linh kiện',
        dataIndex: 'name',
        key: 'name',
        render: (text) => (
          <span style={{ fontWeight: 500, color: '#111' }}>{text}</span>
        )
      },
      {
        title: 'Số lượng',
        dataIndex: 'quantity',
        key: 'quantity',
        width: 150,
        align: 'center',
        render: (value) => (
          <span style={{ fontWeight: 600, color: '#666' }}>
            {value}
          </span>
        )
      },
      {
        title: 'Hành động',
        key: 'action',
        width: 150,
        align: 'center',
        render: (_, part) => {
          // Chỉ hiện nút khi status là PENDING
          if (part.warehouseReviewStatus === 'PENDING') {
            return (
            <Button
              type="primary"
              size="small"
                onClick={() => handleOpenConfirmModal(part)}
              style={{
                background: '#22c55e',
                borderColor: '#22c55e',
                fontWeight: 500,
                borderRadius: '6px',
                height: '32px'
              }}
            >
              Xác nhận
            </Button>
        )
          }
          return <span style={{ color: '#999' }}>—</span>
        }
      }
    ]

    return (
      <div style={{ 
        background: 'linear-gradient(to bottom, #fafafa 0%, #fff 100%)',
        padding: '20px 24px',
        margin: '12px 0',
        borderRadius: '10px',
        border: '1px solid #e5e7eb',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px',
          marginBottom: '16px',
          paddingBottom: '12px',
          borderBottom: '2px solid #f0f0f0'
        }}>
          <InboxOutlined style={{ color: '#1677ff', fontSize: '16px' }} />
          <span style={{ 
            fontWeight: 600, 
            fontSize: '15px', 
            color: '#111' 
          }}>
            Danh sách linh kiện ({record.parts?.length || 0})
          </span>
        </div>
        <Table
          columns={partsColumns}
          dataSource={record.parts || []}
          pagination={false}
          size="middle"
          components={goldTableHeader}
          rowKey="id"
          style={{ background: '#fff' }}
          rowClassName={(record, index) => 
            index % 2 === 0 ? 'parts-row-even' : 'parts-row-odd'
          }
        />
      </div>
    )
  }

  return (
    <WarehouseLayout>
      <style>{customTableStyles}</style>
      
      {/* Modal Chi tiết linh kiện */}
      <Modal
        open={confirmModalOpen}
        onCancel={handleCloseConfirmModal}
        footer={null}
        closable={false}
        width={450}
        styles={{ 
          body: { padding: 0 },
          content: { borderRadius: 0, padding: 0 },
          header: { padding: 0 }
        }}
        style={{ top: 100 }}
      >
        {/* Header */}
        <div style={{ 
          background: '#CBB081', 
          padding: '14px 20px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center'
        }}>
          <span style={{ fontWeight: 700, fontSize: '15px', color: '#000', letterSpacing: '0.5px' }}>
            CHI TIẾT LINH KIỆN
          </span>
          <CloseOutlined 
            style={{ cursor: 'pointer', color: '#000', fontSize: '16px', fontWeight: 700 }} 
            onClick={handleCloseConfirmModal} 
          />
        </div>
        
        <div style={{ padding: '20px 24px', background: '#fff' }}>
          <Form form={confirmForm} layout="vertical" onFinish={handleConfirmSubmit}>
            {/* Status and Quantity bar */}
            <Form.Item noStyle shouldUpdate>
              {({ getFieldValue }) => {
                const inventoryStatus = getFieldValue('inventoryStatus')
                const isUnknownStatus = inventoryStatus === 'Không rõ'
                
                return (
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '14px' }}>
                    <Form.Item 
                      label={<span style={{ fontWeight: 600, fontSize: '13px', color: '#000' }}>Trạng thái</span>} 
                      name="inventoryStatus"
                      style={{ flex: 1, marginBottom: 0 }}
                    >
                      <Input 
                        disabled 
                        style={{ 
                          background: '#F5F5F5', 
                          height: '38px',
                          fontSize: '13px',
                          border: '1px solid #D9D9D9',
                          color: '#000'
                        }} 
                      />
                    </Form.Item>
                    
                    {isUnknownStatus && (
                      <Form.Item 
                        label={<span style={{ fontWeight: 600, fontSize: '13px', color: '#000' }}>Số lượng <span style={{ color: 'red' }}>*</span></span>} 
                        name="quantity"
                        rules={[{ required: true, message: 'Vui lòng nhập số lượng' }]}
                        style={{ width: '150px', marginBottom: 0 }}
                      >
                        <Input 
                          type="number"
                          placeholder="0"
                          style={{ 
                            height: '38px',
                            fontSize: '13px',
                            border: '1px solid #D9D9D9'
                          }} 
                        />
                      </Form.Item>
                    )}
                  </div>
                )
              }}
            </Form.Item>

            {/* Form fields - conditional enable based on status */}
            <Form.Item noStyle shouldUpdate>
              {({ getFieldValue }) => {
                const inventoryStatus = getFieldValue('inventoryStatus')
                const isUnknownStatus = inventoryStatus === 'Không rõ'
                
                return (
                  <>
                    <Form.Item 
                      label={<span style={{ fontWeight: 600, fontSize: '13px', color: '#000' }}>Tên linh kiện {isUnknownStatus && <span style={{ color: 'red' }}>*</span>}</span>} 
                      name="partName"
                      rules={isUnknownStatus ? [{ required: true, message: 'Vui lòng nhập tên linh kiện' }] : []}
                      style={{ marginBottom: '14px' }}
                    >
                      <Input 
                        disabled={!isUnknownStatus}
                        style={{ 
                          background: isUnknownStatus ? '#fff' : '#F5F5F5', 
                          height: '38px',
                          fontSize: '13px',
                          border: '1px solid #D9D9D9'
                        }} 
                      />
                    </Form.Item>

                    <Form.Item 
                      label={<span style={{ fontWeight: 600, fontSize: '13px', color: '#000' }}>Loại linh kiện {isUnknownStatus && <span style={{ color: 'red' }}>*</span>}</span>} 
                      name="category"
                      rules={isUnknownStatus ? [{ required: true, message: 'Vui lòng chọn loại linh kiện' }] : []}
                      style={{ marginBottom: '14px' }}
                    >
                      <Select 
                        disabled={!isUnknownStatus}
                        style={{ fontSize: '13px' }}
                        suffixIcon={<DownOutlined style={{ fontSize: '12px' }} />}
                      >
                        <Option value="Dầu – Hóa chất">Dầu – Hóa chất</Option>
                        <Option value="Động cơ">Động cơ</Option>
                        <Option value="Hệ thống phanh">Hệ thống phanh</Option>
                      </Select>
                    </Form.Item>

                    <Form.Item 
                      label={<span style={{ fontWeight: 600, fontSize: '13px', color: '#000' }}>Xuất xứ {isUnknownStatus && <span style={{ color: 'red' }}>*</span>}</span>} 
                      name="origin"
                      rules={isUnknownStatus ? [{ required: true, message: 'Vui lòng chọn xuất xứ' }] : []}
                      style={{ marginBottom: '14px' }}
                    >
                      <Select 
                        disabled={!isUnknownStatus}
                        style={{ fontSize: '13px' }}
                        suffixIcon={<DownOutlined style={{ fontSize: '12px' }} />}
                      >
                        <Option value="MohI">MohI</Option>
                        <Option value="VN">Việt Nam</Option>
                        <Option value="JP">Nhật Bản</Option>
                      </Select>
                    </Form.Item>

                    <Form.Item name="useForAllModels" valuePropName="checked" style={{ marginBottom: '14px' }}>
                      <Checkbox disabled={!isUnknownStatus} style={{ fontSize: '13px', color: '#000' }}>
                        <span style={{ fontWeight: 400 }}>Dùng chung tất cả dòng xe</span>
                      </Checkbox>
                    </Form.Item>
                  </>
                )
              }}
            </Form.Item>

            {/* Conditional fields based on useForAllModels and status */}
            <Form.Item noStyle shouldUpdate>
              {({ getFieldValue }) => {
                const useForAllModels = getFieldValue('useForAllModels')
                const inventoryStatus = getFieldValue('inventoryStatus')
                const isUnknownStatus = inventoryStatus === 'Không rõ'
                
                if (!useForAllModels) {
                  return (
                    <>
                      <Form.Item 
                        label={<span style={{ fontWeight: 600, fontSize: '13px', color: '#000' }}>Hãng {isUnknownStatus && <span style={{ color: 'red' }}>*</span>}</span>} 
                        name="brand"
                        rules={isUnknownStatus ? [{ required: true, message: 'Vui lòng chọn hãng' }] : []}
                        style={{ marginBottom: '14px' }}
                      >
                        <Select 
                          disabled={!isUnknownStatus}
                          placeholder="Vinfast" 
                          style={{ fontSize: '13px' }}
                          suffixIcon={<DownOutlined style={{ fontSize: '12px' }} />}
                        >
                          <Option value="Vinfast">Vinfast</Option>
                          <Option value="Toyota">Toyota</Option>
                          <Option value="Honda">Honda</Option>
                        </Select>
                      </Form.Item>
                      
                      <Form.Item 
                        label={<span style={{ fontWeight: 600, fontSize: '13px', color: '#000' }}>Dòng xe {isUnknownStatus && <span style={{ color: 'red' }}>*</span>}</span>} 
                        name="model"
                        rules={isUnknownStatus ? [{ required: true, message: 'Vui lòng chọn dòng xe' }] : []}
                        style={{ marginBottom: '14px' }}
                      >
                        <Select 
                          disabled={!isUnknownStatus}
                          style={{ fontSize: '13px' }}
                          suffixIcon={<DownOutlined style={{ fontSize: '12px' }} />}
                        >
                          <Option value="model1">Model 1</Option>
                          <Option value="model2">Model 2</Option>
                        </Select>
                      </Form.Item>
                    </>
                  )
                }
                return null
              }}
            </Form.Item>

            <Form.Item noStyle shouldUpdate>
              {({ getFieldValue }) => {
                const inventoryStatus = getFieldValue('inventoryStatus')
                const isUnknownStatus = inventoryStatus === 'Không rõ'
                
                return (
                  <Form.Item 
                    label={<span style={{ fontWeight: 600, fontSize: '13px', color: '#000' }}>Nhà phân phối {isUnknownStatus && <span style={{ color: 'red' }}>*</span>}</span>} 
                    name="supplier"
                    rules={isUnknownStatus ? [{ required: true, message: 'Vui lòng chọn nhà phân phối' }] : []}
                    style={{ marginBottom: '14px' }}
                  >
                    <Select 
                      disabled={!isUnknownStatus}
                      style={{ fontSize: '13px' }}
                      suffixIcon={<DownOutlined style={{ fontSize: '12px' }} />}
                    >
                      <Option value="Petrolimex Lubricants">Petrolimex Lubricants</Option>
                      <Option value="Supplier 2">Supplier 2</Option>
                    </Select>
                  </Form.Item>
                )
              }}
            </Form.Item>

            <div style={{ display: 'flex', gap: '12px', marginBottom: '14px' }}>
              <Form.Item 
                label={<span style={{ fontWeight: 600, fontSize: '13px', color: '#000' }}>Giá nhập <span style={{ color: 'red' }}>*</span></span>} 
                name="sellPrice" 
                rules={[{ required: true, message: 'Vui lòng nhập giá nhập' }]}
                style={{ flex: 1, marginBottom: 0 }}
              >
                <Input 
                  type="number"
                  suffix={<span style={{ fontSize: '12px', color: '#999' }}>/ vnd</span>} 
                  style={{ 
                    height: '38px',
                    fontSize: '13px',
                    border: '1px solid #D9D9D9'
                  }} 
                />
              </Form.Item>
              
              <Form.Item 
                label={<span style={{ fontWeight: 600, fontSize: '13px', color: '#000' }}>Giá bán <span style={{ color: 'red' }}>*</span></span>} 
                name="buyPrice" 
                rules={[{ required: true, message: 'Vui lòng nhập giá bán' }]}
                style={{ flex: 1, marginBottom: 0 }}
              >
                <Input 
                  type="number"
                  suffix={<span style={{ fontSize: '12px', color: '#999' }}>/ vnd</span>} 
                  style={{ 
                    height: '38px',
                    fontSize: '13px',
                    border: '1px solid #D9D9D9'
                  }} 
                />
              </Form.Item>
            </div>

            <Form.Item noStyle shouldUpdate>
              {({ getFieldValue }) => {
                const inventoryStatus = getFieldValue('inventoryStatus')
                const isUnknownStatus = inventoryStatus === 'Không rõ'
                
                return (
                  <Form.Item 
                    label={<span style={{ fontWeight: 600, fontSize: '13px', color: '#000' }}>Đơn vị {isUnknownStatus && <span style={{ color: 'red' }}>*</span>}</span>} 
                    name="unit"
                    rules={isUnknownStatus ? [{ required: true, message: 'Vui lòng chọn đơn vị' }] : []}
                    style={{ marginBottom: '14px' }}
                  >
                    <Select 
                      disabled={!isUnknownStatus}
                      style={{ width: '100px', fontSize: '13px' }} 
                      suffixIcon={<DownOutlined style={{ fontSize: '12px' }} />}
                    >
                      <Option value="lít">lít</Option>
                      <Option value="cái">cái</Option>
                      <Option value="bộ">bộ</Option>
                    </Select>
                  </Form.Item>
                )
              }}
            </Form.Item>

            <Form.Item 
              label={<span style={{ fontWeight: 600, fontSize: '13px', color: '#000' }}>Ghi chú/Lý do <span style={{ color: 'red' }}>*</span></span>} 
              name="note"
              rules={[{ required: true, message: 'Vui lòng nhập ghi chú' }]}
              style={{ marginBottom: '18px' }}
            >
              <Input.TextArea 
                rows={3} 
                placeholder="khả năng nhập" 
                style={{ 
                  fontSize: '13px',
                  border: '1px solid #D9D9D9'
                }} 
              />
            </Form.Item>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <Button 
                onClick={handleRejectPart}
                style={{
                  background: '#DC2626',
                  borderColor: '#DC2626',
                  color: '#fff',
                  fontWeight: 600,
                  height: '38px',
                  minWidth: '100px',
                  fontSize: '13px',
                  boxShadow: 'none'
                }}
              >
                Từ chối
              </Button>
              <Button 
                type="primary"
                htmlType="submit"
                style={{
                  background: '#16A34A',
                  borderColor: '#16A34A',
                  fontWeight: 600,
                  height: '38px',
                  minWidth: '100px',
                  fontSize: '13px',
                  boxShadow: 'none'
                }}
              >
                Duyệt
              </Button>
            </div>
          </Form>
        </div>
      </Modal>

      {/* Modal Từ chối báo giá */}
      <Modal
        open={rejectModalOpen}
        onCancel={handleCloseRejectModal}
        footer={null}
        closable={false}
        width={450}
        styles={{ 
          body: { padding: 0 },
          content: { borderRadius: 0, padding: 0 },
          header: { padding: 0 }
        }}
        style={{ top: 100 }}
      >
        <div style={{ 
          background: '#CBB081', 
          padding: '14px 20px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center'
        }}>
          <span style={{ fontWeight: 700, fontSize: '15px', color: '#000', letterSpacing: '0.5px' }}>
            TỪ CHỐI BÁO GIÁ
          </span>
          <CloseOutlined 
            style={{ cursor: 'pointer', color: '#000', fontSize: '16px', fontWeight: 700 }} 
            onClick={handleCloseRejectModal} 
          />
        </div>
        
        <div style={{ padding: '20px 24px', background: '#fff' }}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '13px', color: '#000', marginBottom: '8px' }}>
              Lý do từ chối <span style={{ color: 'red' }}>*</span>
            </label>
            <Input.TextArea 
              rows={4}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Nhập lý do từ chối..."
              style={{ 
                fontSize: '13px',
                border: '1px solid #D9D9D9'
              }} 
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <Button 
              onClick={handleCloseRejectModal}
              style={{
                background: '#fff',
                borderColor: '#D9D9D9',
                color: '#111',
                fontWeight: 600,
                height: '38px',
                minWidth: '100px',
                fontSize: '13px'
              }}
            >
              Hủy
            </Button>
            <Button 
              type="primary"
              onClick={handleRejectQuotation}
              style={{
                background: '#DC2626',
                borderColor: '#DC2626',
                fontWeight: 600,
                height: '38px',
                minWidth: '100px',
                fontSize: '13px',
                boxShadow: 'none'
              }}
            >
              Xác nhận
            </Button>
          </div>
        </div>
      </Modal>

      <div style={{ padding: '24px', minHeight: '100vh' }}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, marginBottom: '20px' }}>
            Xác nhận báo giá
          </h1>

          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
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
              format="DD/MM/YYYY"
              suffixIcon={<CalendarOutlined />}
              value={dateFilter}
              onChange={setDateFilter}
              style={{ width: 150 }}
            />

            <Space>
              <Button
                type={statusFilter === 'Đang xuất hàng' ? 'primary' : 'default'}
                onClick={() => setStatusFilter('Đang xuất hàng')}
                style={{
                  background: statusFilter === 'Đang xuất hàng' ? '#CBB081' : '#fff',
                  borderColor: statusFilter === 'Đang xuất hàng' ? '#CBB081' : '#e6e6e6',
                  color: statusFilter === 'Đang xuất hàng' ? '#111' : '#666',
                  fontWeight: 600
                }}
              >
                Đang xuất hàng
              </Button>
              <Button
                type={statusFilter === 'Hoàn thành' ? 'primary' : 'default'}
                onClick={() => setStatusFilter('Hoàn thành')}
                style={{
                  background: statusFilter === 'Hoàn thành' ? '#CBB081' : '#fff',
                  borderColor: statusFilter === 'Hoàn thành' ? '#CBB081' : '#e6e6e6',
                  color: statusFilter === 'Hoàn thành' ? '#111' : '#666',
                  fontWeight: 600
                }}
              >
                Hoàn thành
              </Button>
              <Button
                type={statusFilter === 'Tất cả' ? 'primary' : 'default'}
                onClick={() => setStatusFilter('Tất cả')}
                style={{
                  background: statusFilter === 'Tất cả' ? '#CBB081' : '#fff',
                  borderColor: statusFilter === 'Tất cả' ? '#CBB081' : '#e6e6e6',
                  color: statusFilter === 'Tất cả' ? '#111' : '#666',
                  fontWeight: 600
                }}
              >
                Tất cả
              </Button>
            </Space>
          </div>
        </div>

        <div style={{ 
          background: '#fff', 
          borderRadius: '12px', 
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <Table
            className="export-request-table"
            columns={columns}
            dataSource={filteredData}
            rowClassName={(record, index) => {
              const isExpanded = expandedRowKeys.includes(record.key?.toString())
              const baseClass = index % 2 === 0 ? 'table-row-even' : 'table-row-odd'
              return isExpanded ? `${baseClass} table-row-expanded` : baseClass
            }}
            expandable={{
              expandedRowRender,
              expandedRowKeys,
              onExpandedRowsChange: setExpandedRowKeys,
              expandIcon: ({ expanded, onExpand, record }) => (
                <Button
                  type="text"
                  icon={expanded ? <UpOutlined /> : <DownOutlined />}
                  onClick={(e) => onExpand(record, e)}
                  style={{ 
                    padding: '4px 8px',
                    width: 'auto',
                    height: 'auto',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: expanded ? '#1677ff' : '#666',
                    fontSize: '16px',
                    fontWeight: 600
                  }}
                />
              ),
              indentSize: 0,
              expandRowByClick: false
            }}
            pagination={{
              current: page,
              pageSize: pageSize,
              total: total,
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
            loading={loading}
            size="middle"
            components={goldTableHeader}
          />
        </div>
      </div>
    </WarehouseLayout>
  )
}
