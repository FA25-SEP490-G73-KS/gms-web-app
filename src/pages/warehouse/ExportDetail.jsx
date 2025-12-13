import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Table, Button, Tag, message, Dropdown, Spin, Modal, Input, InputNumber } from 'antd'
import WarehouseLayout from '../../layouts/WarehouseLayout'
import { goldTableHeader } from '../../utils/tableComponents'
import { stockExportAPI, employeeAPI } from '../../services/api'

export default function ExportDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [exportDetail, setExportDetail] = useState(null)
  const [statusFilter, setStatusFilter] = useState('Tất cả')
  const [historyModal, setHistoryModal] = useState({ visible: false, data: null, loading: false, itemId: null })
  const [exportModal, setExportModal] = useState({ 
    visible: false, 
    data: null, 
    loading: false,
    quantity: '',
    technician: ''
  })
  const [employees, setEmployees] = useState([])
  const [loadingEmployees, setLoadingEmployees] = useState(false)

  const breadcrumbItems = [
    { label: 'Xuất kho', path: '/warehouse' },
    { label: 'Danh sách xuất', path: '/warehouse/export/list' },
    { label: 'Thông tin chi tiết', path: null }
  ]

  useEffect(() => {
    fetchExportDetail()
    fetchEmployees()
  }, [id])

  const fetchEmployees = async () => {
    setLoadingEmployees(true)
    try {
      const { data: response, error } = await employeeAPI.getAll({ page: 0, size: 100 })
      
      if (error) {
        console.error('Failed to fetch employees:', error)
        return
      }

      const content = response?.result?.content || response?.content || []
      setEmployees(content)
    } catch (err) {
      console.error('Failed to fetch employees:', err)
    } finally {
      setLoadingEmployees(false)
    }
  }

  const fetchExportDetail = async () => {
    setLoading(true)
    try {
      const { data, error } = await stockExportAPI.getById(id)
      
      if (error) {
        message.error('Không thể tải chi tiết phiếu xuất kho')
        return
      }

      const detail = data?.result || data
      // Map items to ensure correct field names
      if (detail?.items) {
        detail.items = detail.items.map(item => ({
          ...item,
          quantity: item.quantityRequired || item.quantity || 0,
          exportedQuantity: item.quantityExported || item.exportedQuantity || 0
        }))
      }
      setExportDetail(detail)
    } catch (err) {
      console.error('Error fetching export detail:', err)
      message.error('Đã xảy ra lỗi khi tải chi tiết')
    } finally {
      setLoading(false)
    }
  }

  const fetchItemHistory = async (itemId) => {
    setHistoryModal({ visible: true, data: null, loading: true, itemId })
    
    try {
      const { data, error } = await stockExportAPI.getItemHistory(itemId)
      
      if (error) {
        message.error('Không thể tải lịch sử xuất kho')
        setHistoryModal({ visible: false, data: null, loading: false, itemId: null })
        return
      }

      const result = data?.result || data
      
      // Map API response to modal data format
      const historyData = {
        sku: result.sku || result.partCode || 'N/A',
        name: result.name || result.partName || 'N/A',
        requiredQuantity: result.required || result.requiredQuantity || result.quantityRequired || 0,
        exportedQuantity: result.exported || result.exportedQuantity || result.quantityExported || 0,
        history: (result.history || []).map(item => ({
          id: item.id,
          quantity: item.quantity || 0,
          date: item.date || item.exportedAt || item.createdAt || '',
          receiver: item.receiver || item.receivedBy || item.exportedByName || 'N/A'
        }))
      }
      
      setHistoryModal({ visible: true, data: historyData, loading: false, itemId })
    } catch (err) {
      console.error('Error fetching item history:', err)
      message.error('Đã xảy ra lỗi khi tải lịch sử')
      setHistoryModal({ visible: false, data: null, loading: false, itemId: null })
    }
  }

  const fetchExportItemDetail = async (itemId) => {
    setExportModal({ visible: true, data: null, loading: true, quantity: '', technician: '' })
    
    // Mock data for testing
    const mockExportData = {
      id: itemId,
      sku: 'LOC-GIO-TOYOTA-CAMRY-2019',
      name: 'Lọc gió động cơ 30W',
      required: 20,
      exported: 10,
      remaining: 10,
      status: 'EXPORTING',
      history: [
        { 
          id: 1, 
          quantity: 1, 
          exportedAt: '2025-10-20T10:30:00',
          exportedById: 1,
          exportedByName: 'Nguyễn Văn A' 
        },
        { 
          id: 2, 
          quantity: 2, 
          exportedAt: '2025-10-25T14:20:00',
          exportedById: 2,
          exportedByName: 'Phạm Văn B' 
        }
      ]
    }

    // Simulate API delay
    setTimeout(() => {
      setExportModal({ 
        visible: true, 
        data: mockExportData, 
        loading: false,
        quantity: '',
        technician: ''
      })
    }, 500)

    /* Real API call - uncomment when API is ready
    try {
      const { data, error } = await stockExportAPI.getExportItemDetail(itemId)
      
      if (error) {
        message.error('Không thể tải thông tin xuất kho')
        setExportModal({ visible: false, data: null, loading: false, quantity: '', technician: '' })
        return
      }

      const itemData = data?.result || data
      setExportModal({ 
        visible: true, 
        data: itemData, 
        loading: false,
        quantity: '',
        technician: ''
      })
    } catch (err) {
      console.error('Error fetching export item detail:', err)
      message.error('Đã xảy ra lỗi khi tải thông tin')
      setExportModal({ visible: false, data: null, loading: false, quantity: '', technician: '' })
    }
    */
  }

  const handleExportSubmit = async () => {
    if (!exportModal.quantity || !exportModal.technician) {
      message.warning('Vui lòng nhập đầy đủ thông tin')
      return
    }

    const itemId = exportModal.data?.id
    if (!itemId) {
      message.error('Không tìm thấy thông tin item')
      return
    }

    try {
      setExportModal({ ...exportModal, loading: true })

      const payload = {
        quantity: parseFloat(exportModal.quantity),
        receiverId: parseInt(exportModal.technician), // Assuming technician input is receiverId
        note: '' // Add note field if needed
      }

      const { data, error } = await stockExportAPI.exportItem(itemId, payload)

      if (error) {
        message.error('Không thể xuất kho')
        setExportModal({ ...exportModal, loading: false })
        return
      }

      message.success('Xuất kho thành công!')
      setExportModal({ visible: false, data: null, loading: false, quantity: '', technician: '' })
      fetchExportDetail() // Refresh data
    } catch (err) {
      console.error('Error exporting item:', err)
      message.error('Đã xảy ra lỗi khi xuất kho')
      setExportModal({ ...exportModal, loading: false })
    }
  }

  const mapExportStatus = (status) => {
    const statusMap = {
      'WAITING_PURCHASE': 'Chờ xử lý',
      'COMPLETED': 'Hoàn thành',
      'EXPORTING': 'Đang xuất hàng',
      'PENDING': 'Chờ xử lý',
      'APPROVED': 'Chờ duyệt',
      'REJECTED': 'Từ chối'
    }
    return statusMap[status] || 'Chờ xử lý'
  }

  const getStatusConfig = (status) => {
    if (status === 'Hoàn thành') {
      return { 
        color: '#22c55e', 
        bgColor: '#f6ffed',
        borderColor: '#b7eb8f'
      }
    }
    if (status === 'Đang xuất hàng') {
      return { 
        color: '#1677ff', 
        bgColor: '#e6f4ff',
        borderColor: '#91caff'
      }
    }
    if (status === 'Chờ xuất') {
      return { 
        color: '#666', 
        bgColor: '#fafafa',
        borderColor: '#d9d9d9'
      }
    }
    if (status === 'Chờ nhập kho') {
      return { 
        color: '#666', 
        bgColor: '#fafafa',
        borderColor: '#d9d9d9'
      }
    }
    if (status === 'Chờ xử lý') {
      return { 
        color: '#f59e0b', 
        bgColor: '#fef3c7',
        borderColor: '#fcd34d'
      }
    }
    return { 
      color: '#666', 
      bgColor: '#fafafa',
      borderColor: '#d9d9d9'
    }
  }

  const getItemStatusText = (status) => {
    const statusMap = {
      'WAITING_TO_RECEIPT': 'Chờ nhập kho',
      'EXPORTING': 'Đang xuất hàng',
      'FINISHED': 'Hoàn thành',
      // // Legacy mappings for backward compatibility
      // 'COMPLETED': 'Hoàn thành',
      // 'PENDING': 'Chờ nhập kho',
      // 'WAITING_PURCHASE': 'Chờ nhập kho',
      // 'APPROVED': 'Đang xuất hàng'
    }
    return statusMap[status] || 'Chờ nhập kho'
  }

  // Use items from API response
  const sourceItems = exportDetail?.items || []

  const filteredItems = sourceItems.filter(item => {
    if (statusFilter === 'Tất cả') return true
    const itemStatus = getItemStatusText(item.status)
    console.log('Filtering item:', { rawStatus: item.status, mappedStatus: itemStatus, filter: statusFilter })
    return itemStatus === statusFilter
  })

  const columns = [
    {
      title: 'STT',
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
      title: 'Mã SKU',
      dataIndex: 'sku',
      key: 'sku',
      width: 220,
      render: (text) => (
        <span style={{ fontWeight: 500, color: '#111' }}>
          {text || 'N/A'}
        </span>
      )
    },
    {
      title: 'Tên SP',
      dataIndex: 'name',
      key: 'name',
      width: 250,
      render: (text) => (
        <span style={{ fontWeight: 500, color: '#111' }}>
          {text || 'N/A'}
        </span>
      )
    },
    {
      title: 'SL yêu cầu',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 120,
      align: 'center',
      render: (value) => (
        <span style={{ fontWeight: 600, color: '#111' }}>
          {value ?? 0}
        </span>
      )
    },
    {
      title: 'SL đã xuất',
      dataIndex: 'exportedQuantity',
      key: 'exportedQuantity',
      width: 120,
      align: 'center',
      render: (value) => (
        <span style={{ fontWeight: 600, color: '#111' }}>
          {value ?? 0}
        </span>
      )
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 150,
      render: (status) => {
        const statusText = getItemStatusText(status)
        const config = getStatusConfig(statusText)
        return (
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
            {statusText}
          </Tag>
        )
      }
    },
    {
      title: '',
      key: 'action',
      width: 80,
      align: 'center',
      render: (_, record) => {
        const menuItems = [
          {
            key: 'detail',
            label: (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="bi bi-eye" />
                Xem chi tiết
              </span>
            ),
            onClick: () => fetchItemHistory(record.id)
          },
          {
            key: 'export',
            label: (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="bi bi-box-arrow-up" />
                Xuất kho
              </span>
            ),
            onClick: () => fetchExportItemDetail(record.id)
          }
        ]

        return (
          <Dropdown
            menu={{ items: menuItems }}
            trigger={['click']}
            placement="bottomRight"
          >
            <Button
              type="text"
              icon={<i className="bi bi-three-dots-vertical" style={{ fontSize: '16px' }} />}
              style={{
                padding: '0 8px',
                height: 'auto',
                color: '#666'
              }}
            />
          </Dropdown>
        )
      }
    }
  ]

  if (loading) {
    return (
      <WarehouseLayout breadcrumbItems={breadcrumbItems}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '60vh' 
        }}>
          <Spin size="large" />
        </div>
      </WarehouseLayout>
    )
  }

  if (!exportDetail) {
    return (
      <WarehouseLayout breadcrumbItems={breadcrumbItems}>
        <div style={{ padding: '24px' }}>
          <p>Không tìm thấy thông tin phiếu xuất kho</p>
        </div>
      </WarehouseLayout>
    )
  }

  const displayStatus = mapExportStatus(exportDetail.status)
  const statusConfig = getStatusConfig(displayStatus)

  return (
    <WarehouseLayout breadcrumbItems={breadcrumbItems}>
      <div style={{ padding: '24px', minHeight: '100vh' }}>
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>
            Thông tin chi tiết
          </h1>
        </div>

        {/* Info Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
          {/* Left Column */}
          <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '13px', color: '#666', marginBottom: '6px' }}>
                Mã phiếu xuất
              </div>
              <div style={{ fontSize: '16px', fontWeight: 600, color: '#111' }}>
                {exportDetail.code || 'XK-000001'}
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '13px', color: '#666', marginBottom: '6px' }}>
                Loại xuất
              </div>
              <div style={{ fontSize: '15px', fontWeight: 500, color: '#111' }}>
                {exportDetail.reason || 'Theo báo giá'}
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '13px', color: '#666', marginBottom: '6px' }}>
                Mã báo giá
              </div>
              <div style={{ fontSize: '16px', fontWeight: 600, color: '#111' }}>
                {exportDetail.quotationCode || 'QT-2025-000001'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '13px', color: '#666', marginBottom: '6px' }}>
                Người yêu cầu
              </div>
              <div style={{ fontSize: '15px', fontWeight: 500, color: '#111' }}>
                {exportDetail.createdBy || 'Nguyễn Văn B'}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '13px', color: '#666', marginBottom: '6px' }}>
                Trạng thái
              </div>
              <Tag
                style={{
                  color: statusConfig.color,
                  backgroundColor: statusConfig.bgColor,
                  borderColor: statusConfig.borderColor,
                  border: '1px solid',
                  borderRadius: '6px',
                  padding: '6px 14px',
                  fontWeight: 500,
                  fontSize: '14px',
                  margin: 0
                }}
              >
                {displayStatus}
              </Tag>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '13px', color: '#666', marginBottom: '6px' }}>
                Ngày tạo
              </div>
              <div style={{ fontSize: '15px', fontWeight: 500, color: '#111' }}>
                {exportDetail.createdAt 
                  ? new Date(exportDetail.createdAt).toLocaleDateString('vi-VN')
                  : '11/11/25'}
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '13px', color: '#666', marginBottom: '6px' }}>
                Ngày duyệt
              </div>
              <div style={{ fontSize: '15px', fontWeight: 500, color: '#111' }}>
                {exportDetail.approvedAt 
                  ? new Date(exportDetail.approvedAt).toLocaleDateString('vi-VN')
                  : '12/11/25'}
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '13px', color: '#666', marginBottom: '6px' }}>
                Ngày xuất
              </div>
              <div style={{ fontSize: '15px', fontWeight: 500, color: '#111' }}>
                {exportDetail.exportedAt 
                  ? new Date(exportDetail.exportedAt).toLocaleDateString('vi-VN')
                  : '--'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '13px', color: '#666', marginBottom: '6px' }}>
                Người duyệt
              </div>
              <div style={{ fontSize: '15px', fontWeight: 500, color: '#111' }}>
                {exportDetail.approvedBy || 'Trần Văn C'}
              </div>
            </div>
          </div>
        </div>

        {/* Filter Buttons */}
        <div style={{ marginBottom: '20px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <Button
            type={statusFilter === 'Tất cả' ? 'primary' : 'default'}
            onClick={() => setStatusFilter('Tất cả')}
            style={{
              background: statusFilter === 'Tất cả' ? '#CBB081' : '#fff',
              borderColor: statusFilter === 'Tất cả' ? '#CBB081' : '#e6e6e6',
              color: statusFilter === 'Tất cả' ? '#111' : '#666',
              fontWeight: 600,
              height: '36px',
              minWidth: '100px'
            }}
          >
            Tất cả
          </Button>
          <Button
            type={statusFilter === 'Chờ nhập kho' ? 'primary' : 'default'}
            onClick={() => setStatusFilter('Chờ nhập kho')}
            style={{
              background: statusFilter === 'Chờ nhập kho' ? '#CBB081' : '#fff',
              borderColor: statusFilter === 'Chờ nhập kho' ? '#CBB081' : '#e6e6e6',
              color: statusFilter === 'Chờ nhập kho' ? '#111' : '#666',
              fontWeight: 600,
              height: '36px',
              minWidth: '140px'
            }}
          >
            Chờ nhập kho
          </Button>
          <Button
            type={statusFilter === 'Đang xuất hàng' ? 'primary' : 'default'}
            onClick={() => setStatusFilter('Đang xuất hàng')}
            style={{
              background: statusFilter === 'Đang xuất hàng' ? '#CBB081' : '#fff',
              borderColor: statusFilter === 'Đang xuất hàng' ? '#CBB081' : '#e6e6e6',
              color: statusFilter === 'Đang xuất hàng' ? '#111' : '#666',
              fontWeight: 600,
              height: '36px',
              minWidth: '140px'
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
              fontWeight: 600,
              height: '36px',
              minWidth: '120px'
            }}
          >
            Hoàn thành
          </Button>
        </div>

        {/* Table */}
        <div style={{ 
          background: '#fff', 
          borderRadius: '12px', 
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <Table
            columns={columns}
            dataSource={filteredItems}
            rowKey="id"
            pagination={false}
            components={goldTableHeader}
            rowClassName={(record, index) => 
              index % 2 === 0 ? 'table-row-even' : 'table-row-odd'
            }
          />
        </div>
      </div>

      {/* History Modal */}
      <Modal
        title={
          <div style={{ 
            background: '#CBB081', 
            margin: '-20px -24px 20px',
            padding: '16px 24px',
            color: '#111',
            fontWeight: 700,
            fontSize: '18px',
            textAlign: 'center'
          }}>
            LỊCH SỬ XUẤT KHO
          </div>
        }
        open={historyModal.visible}
        onCancel={() => setHistoryModal({ visible: false, data: null, loading: false })}
        footer={(() => {
          // Kiểm tra status của item để quyết định có hiển thị nút "Xuất kho" không
          const currentItem = exportDetail?.items?.find(item => item.id === historyModal.itemId)
          const itemStatus = currentItem?.status
          const isFinished = itemStatus === 'FINISHED' || itemStatus === 'COMPLETED'
          
          if (isFinished) {
            return null // Không hiển thị nút khi đã hoàn thành
          }
          
          return [
            <Button
              key="export"
              type="primary"
              style={{
                background: '#22c55e',
                borderColor: '#22c55e',
                fontWeight: 600,
                height: '40px',
                minWidth: '120px'
              }}
              onClick={() => {
                const itemId = historyModal.itemId
                setHistoryModal({ visible: false, data: null, loading: false, itemId: null })
                if (itemId) {
                  fetchExportItemDetail(itemId)
                }
              }}
            >
              Xuất kho
            </Button>
          ]
        })()}
        width={700}
        bodyStyle={{ padding: '24px' }}
        closeIcon={<i className="bi bi-x" style={{ fontSize: '24px' }} />}
      >
        <Spin spinning={historyModal.loading}>
          {historyModal.data && (
            <>
              {/* Thông tin linh kiện */}
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px' }}>
                  Thông tin linh kiện
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '8px' }}>
                  <div style={{ color: '#666', fontSize: '14px' }}>Mã Sku</div>
                  <div style={{ fontWeight: 500, fontSize: '14px' }}>
                    : {historyModal.data.sku || 'N/A'}
                  </div>
                  
                  <div style={{ color: '#666', fontSize: '14px' }}>Tên linh kiện</div>
                  <div style={{ fontWeight: 500, fontSize: '14px' }}>
                    : {historyModal.data.name || 'N/A'}
                  </div>
                </div>
              </div>

              {/* Thông tin xuất linh kiện */}
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px' }}>
                  Thông tin xuất linh kiện
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '8px' }}>
                  <div style={{ color: '#666', fontSize: '14px' }}>Số lượng cần xuất</div>
                  <div style={{ fontWeight: 500, fontSize: '14px' }}>
                    : {historyModal.data.requiredQuantity ?? 0}
                  </div>
                  
                  <div style={{ color: '#666', fontSize: '14px' }}>Số lượng đã xuất</div>
                  <div style={{ fontWeight: 500, fontSize: '14px' }}>
                    : {historyModal.data.exportedQuantity ?? 0}
                  </div>
                </div>
              </div>

              {/* Lịch sử xuất hàng */}
              <div>
                <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px' }}>
                  Lịch sử xuất hàng
                </h4>
                <Table
                  columns={[
                    {
                      title: 'STT',
                      key: 'index',
                      width: 70,
                      align: 'center',
                      render: (_, __, index) => (
                        <span style={{ fontWeight: 500 }}>{String(index + 1).padStart(2, '0')}</span>
                      )
                    },
                    {
                      title: 'Số lượng',
                      dataIndex: 'quantity',
                      key: 'quantity',
                      align: 'center',
                      render: (value) => (
                        <span style={{ fontWeight: 500 }}>{value ?? 0}</span>
                      )
                    },
                    {
                      title: 'Ngày',
                      dataIndex: 'date',
                      key: 'date',
                      render: (value) => (
                        <span style={{ fontWeight: 500 }}>
                          {value ? new Date(value).toLocaleDateString('vi-VN') : 'N/A'}
                        </span>
                      )
                    },
                    {
                      title: 'Người nhận',
                      dataIndex: 'receiver',
                      key: 'receiver',
                      render: (value) => (
                        <span style={{ fontWeight: 500 }}>{value || 'N/A'}</span>
                      )
                    }
                  ]}
                  dataSource={historyModal.data.history || []}
                  rowKey="id"
                  pagination={false}
                  components={goldTableHeader}
                  size="small"
                />
              </div>
            </>
          )}
        </Spin>
      </Modal>

      {/* Export Modal */}
      <Modal
        title={
          <div style={{ 
            background: '#CBB081', 
            margin: '-20px -24px 20px',
            padding: '16px 24px',
            color: '#111',
            fontWeight: 700,
            fontSize: '18px',
            textAlign: 'center'
          }}>
            XUẤT KHO
          </div>
        }
        open={exportModal.visible}
        onCancel={() => setExportModal({ visible: false, data: null, loading: false, quantity: '', technician: '' })}
        footer={[
          <Button
            key="submit"
            type="primary"
            style={{
              background: '#22c55e',
              borderColor: '#22c55e',
              fontWeight: 600,
              height: '40px',
              minWidth: '120px'
            }}
            onClick={handleExportSubmit}
          >
            Xác nhận
          </Button>
        ]}
        width={700}
        bodyStyle={{ padding: '24px' }}
        closeIcon={<i className="bi bi-x" style={{ fontSize: '24px' }} />}
      >
        <Spin spinning={exportModal.loading}>
          {exportModal.data && (
            <>
              {/* Thông tin linh kiện */}
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px' }}>
                  Thông tin linh kiện
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '8px' }}>
                  <div style={{ color: '#666', fontSize: '14px' }}>Mã Sku</div>
                  <div style={{ fontWeight: 500, fontSize: '14px' }}>
                    : {exportModal.data.sku || 'LOC-GIO-TOYOTA-CAMRY-2019'}
                  </div>
                  
                  <div style={{ color: '#666', fontSize: '14px' }}>Tên linh kiện</div>
                  <div style={{ fontWeight: 500, fontSize: '14px' }}>
                    : {exportModal.data.name || 'Lọc gió động cơ 30W'}
                  </div>
                </div>
              </div>

              {/* Thông tin xuất linh kiện */}
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px' }}>
                  Thông tin xuất linh kiện
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '8px' }}>
                  <div style={{ color: '#666', fontSize: '14px' }}>Số lượng cần xuất</div>
                  <div style={{ fontWeight: 500, fontSize: '14px' }}>
                    : {exportModal.data.required || '20'}
                  </div>
                  
                  <div style={{ color: '#666', fontSize: '14px' }}>Số lượng đã xuất</div>
                  <div style={{ fontWeight: 500, fontSize: '14px' }}>
                    : {exportModal.data.exported || '10'}
                  </div>
                </div>
              </div>

              {/* Form nhập liệu */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '14px' }}>
                    Số lượng muốn xuất
                  </label>
                  <InputNumber
                    placeholder="Nhập số lượng muốn xuất"
                    value={exportModal.quantity}
                    onChange={(value) => setExportModal({ ...exportModal, quantity: value })}
                    min={1}
                    max={exportModal.data?.requestedQty || 999999}
                    style={{ width: '100%', height: '40px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '14px' }}>
                    Kỹ thuật viên nhận hàng
                  </label>
                  <select
                    value={exportModal.technician}
                    onChange={(e) => setExportModal({ ...exportModal, technician: e.target.value })}
                    style={{
                      width: '100%',
                      height: '40px',
                      padding: '0 11px',
                      border: '1px solid #d9d9d9',
                      borderRadius: '6px',
                      fontSize: '14px',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="">Chọn kỹ thuật viên</option>
                    {loadingEmployees ? (
                      <option disabled>Đang tải...</option>
                    ) : (
                      employees.map((employee) => (
                        <option key={employee.employeeId} value={employee.employeeId}>
                          {employee.fullName}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>
            </>
          )}
        </Spin>
      </Modal>
    </WarehouseLayout>
  )
}
