import React, { useState, useEffect } from 'react'
import { Table, Button, Tag, Modal, Dropdown, Input, InputNumber, Upload, message } from 'antd'
import { useParams, useNavigate } from 'react-router-dom'
import { MoreOutlined, UploadOutlined, InboxOutlined } from '@ant-design/icons'
import WarehouseLayout from '../../layouts/WarehouseLayout'
import { goldTableHeader } from '../../utils/tableComponents'
import { stockReceiptAPI } from '../../services/api'
import { getUserNameFromToken } from '../../utils/helpers'
import dayjs from 'dayjs'

const { Dragger } = Upload

export default function ImportDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [detailData, setDetailData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState('Tất cả')
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [historyData, setHistoryData] = useState(null)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [importFormLoading, setImportFormLoading] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const [importFormData, setImportFormData] = useState({
    quantity: 0,
    receivedBy: '',
    note: '',
    unitPrice: 0,
    attachmentUrl: '',
    fileList: []
  })

  useEffect(() => {
    fetchDetail()
  }, [id])

  const fetchDetail = async () => {
    setLoading(true)
    try {
      const { data, error } = await stockReceiptAPI.getById(id)
      
      if (error) {
        // Use mock data if API fails
        const mockData = {
          code: 'NK-000123',
          supplierName: 'Hoàng Tuấn Auto',
          createdAt: '2025-10-12T10:30:00',
          createdBy: 'Nguyễn Văn A',
          receivedAt: '2025-10-15T14:20:00',
          receivedBy: 'Trần Văn B',
          purchaseRequestCode: 'PR-000456',
          status: 'Chờ nhập',
          note: 'Nhập hàng đợt 1 tháng 10',
          totalAmount: 15000000,
          items: [
            {
              id: 1,
              sku: 'LOC-GIO-TOYOTA-CAMRY-2019',
              partName: 'Lọc gió động cơ 30W',
              requestedQty: 5,
              receivedQty: 2,
              unitPrice: 500000,
              totalPrice: 1000000,
              status: 'Đang xuất hàng'
            },
            {
              id: 2,
              sku: 'DAU-NHOT-5W30-TOYOTA',
              partName: 'Dầu nhớt 5W30 Toyota',
              requestedQty: 10,
              receivedQty: 10,
              unitPrice: 350000,
              totalPrice: 3500000,
              status: 'Hoàn thành'
            },
            {
              id: 3,
              sku: 'LOC-DAN-TOYOTA-CAMRY',
              partName: 'Lọc dầu Toyota Camry',
              requestedQty: 8,
              receivedQty: 5,
              unitPrice: 280000,
              totalPrice: 1400000,
              status: 'Đang xuất hàng'
            }
          ]
        }
        setDetailData(mockData)
        setLoading(false)
        return
      }

      // Map API response to UI data structure
      const result = data?.result
      if (result) {
        const mapStatus = (status) => {
          const statusMap = {
            'PENDING': 'Chờ nhập kho',
            'PARTIALLY_RECEIVED': 'Nhập một phần',
            'RECEIVED': 'Đã nhập kho',
            'CANCELLED': 'Đã hủy'
          }
          return statusMap[status] || status || 'Chờ nhập kho'
        }

        const mappedData = {
          code: result.code || 'N/A',
          supplierName: result.supplierName || 'N/A',
          createdAt: result.createdAt || null,
          createdBy: result.createdBy || 'N/A',
          receivedAt: result.receivedAt || null,
          receivedBy: result.receivedBy || 'N/A',
          purchaseRequestCode: result.purchaseRequestCode || 'N/A',
          status: mapStatus(result.status),
          note: result.note || '',
          totalAmount: result.totalAmount || 0,
          items: (result.items || []).map(item => ({
            id: item.id,
            sku: item.partCode || 'N/A',
            partName: item.partName || 'N/A',
            requestedQty: item.requestedQty || 0,
            receivedQty: item.receivedQty || 0,
            unitPrice: item.unitPrice || 0,
            totalPrice: item.totalPrice || 0,
            status: mapStatus(item.status)
          }))
        }
        setDetailData(mappedData)
      }
    } catch (err) {
      console.error('Failed to fetch detail:', err)
      message.error('Đã xảy ra lỗi khi tải chi tiết')
    } finally {
      setLoading(false)
    }
  }

  const fetchItemHistory = async (itemId) => {
    setHistoryLoading(true)
    try {
      const { data, error } = await stockReceiptAPI.getItemHistory(itemId)
      
      if (error) {
        throw new Error(error)
      }

      const result = data?.result
      if (result) {
        const mappedData = {
          partInfo: {
            sku: result.partCode || 'N/A',
            partName: result.partName || 'N/A'
          },
          importInfo: {
            requestedQty: result.requestedQty || 0,
            receivedQty: result.receivedQty || 0
          },
          history: (result.history || []).map(item => ({
            id: item.id,
            quantity: item.quantity || 0,
            receivedAt: item.receivedAt,
            receivedBy: item.receivedBy || 'N/A',
            attachmentUrl: item.attachmentUrl || ''
          }))
        }
        setHistoryData(mappedData)
      }
    } catch (err) {
      console.error('Failed to fetch history:', err)
      message.error('Đã xảy ra lỗi khi tải lịch sử')
      setHistoryData(null)
    } finally {
      setHistoryLoading(false)
    }
  }

  const extractFileName = (url) => {
    if (!url) return ''
    try {
      // Extract filename from URL
      const urlParts = url.split('/')
      const fileName = urlParts[urlParts.length - 1]
      // Remove extension and any numbers in parentheses, keep only the base name
      // Example: "quotation-1 (28).pdf" -> "quotation-1"
      const baseName = fileName.replace(/\s*\([^)]*\)\s*/, '').replace(/\.[^.]*$/, '')
      return baseName
    } catch (err) {
      return url
    }
  }

  const handleNumberKeyDown = (e) => {
    const allowedKeys = ['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete', 'Home', 'End', 'Enter']
    if (allowedKeys.includes(e.key)) {
      return
    }
    // Allow numbers only
    if (!/^[0-9]$/.test(e.key)) {
      e.preventDefault()
    }
  }

  const fetchItemForImport = async (itemId) => {
    setImportFormLoading(true)
    try {
      const { data, error } = await stockReceiptAPI.getItemById(itemId)
      
      if (error) {
        throw new Error(error)
      }

      const result = data?.result
      if (result) {
        const mappedItem = {
          id: result.id,
          sku: result.partCode || result.sku || 'N/A',
          partName: result.partName || 'N/A',
          requestedQty: result.requestedQty || 0,
          receivedQty: result.receivedQty || 0,
          unitPrice: result.unitPrice || 0
        }
        setSelectedItem(mappedItem)
      }
    } catch (err) {
      console.error('Failed to fetch item:', err)
      message.error('Đã xảy ra lỗi khi tải thông tin linh kiện')
      setSelectedItem(null)
    } finally {
      setImportFormLoading(false)
    }
  }

  const handleOpenImportModal = (item) => {
    setIsImportModalOpen(true)
    fetchItemForImport(item.id)
    // Reset form data
    const username = getUserNameFromToken() || ''
    setImportFormData({
      quantity: 0,
      receivedBy: username,
      note: '',
      unitPrice: item.unitPrice || 0,
      attachmentUrl: '',
      fileList: []
    })
  }

  const uploadFile = async (file) => {
    try {
      // TODO: Implement file upload API if needed
      // For now, return a placeholder URL
      return 'https://example.com/uploads/' + file.name
    } catch (err) {
      console.error('File upload error:', err)
      throw err
    }
  }

  const handleImportGoods = async () => {
    if (!importFormData.quantity || importFormData.quantity <= 0) {
      message.error('Vui lòng nhập số lượng thực nhận')
      return
    }
    
    if (!importFormData.receivedBy) {
      message.error('Vui lòng nhập người nhận')
      return
    }

    if (!selectedItem?.id) {
      message.error('Không tìm thấy thông tin linh kiện')
      return
    }

    try {
      setImportFormLoading(true)
      
      // Upload file if exists
      let attachmentUrl = ''
      if (importFormData.fileList.length > 0) {
        attachmentUrl = await uploadFile(importFormData.fileList[0].originFileObj || importFormData.fileList[0])
      }

      const payload = {
        quantity: importFormData.quantity,
        receivedBy: importFormData.receivedBy,
        note: importFormData.note || '',
        unitPrice: importFormData.unitPrice || 0,
        attachmentUrl: attachmentUrl
      }

      const { data, error } = await stockReceiptAPI.receiveItem(selectedItem.id, payload)
      
      if (error) {
        throw new Error(error)
      }

      message.success('Nhập hàng thành công')
      setIsImportModalOpen(false)
      setImportFormData({
        quantity: 0,
        receivedBy: '',
        note: '',
        unitPrice: 0,
        attachmentUrl: '',
        fileList: []
      })
      // Refresh detail data
      fetchDetail()
    } catch (err) {
      console.error('Import goods error:', err)
      message.error(err.message || 'Đã xảy ra lỗi khi nhập hàng')
    } finally {
      setImportFormLoading(false)
    }
  }

  const handleViewItemDetail = (item) => {
    setSelectedItem(item)
    setIsHistoryModalOpen(true)
    fetchItemHistory(item.id)
  }

  const getMenuItems = (record) => [
    {
      key: 'view',
      label: (
        <span onClick={() => handleViewItemDetail(record)}>
          👁️ Xem chi tiết
        </span>
      )
    }
  ]

  const getStatusTagConfig = (status) => {
    const configs = {
      'Đã nhập kho': { color: '#22c55e', bgColor: '#f6ffed', borderColor: '#b7eb8f', text: 'Đã nhập kho' },
      'Chờ nhập kho': { color: '#faad14', bgColor: '#fffbe6', borderColor: '#ffe58f', text: 'Chờ nhập kho' },
      'Nhập một phần': { color: '#1677ff', bgColor: '#e6f4ff', borderColor: '#91caff', text: 'Nhập một phần' },
      'Đang xuất hàng': { color: '#1677ff', bgColor: '#e6f4ff', borderColor: '#91caff', text: 'Đang xuất hàng' },
      'Hoàn thành': { color: '#22c55e', bgColor: '#f6ffed', borderColor: '#b7eb8f', text: 'Hoàn thành' },
      'Đã hủy': { color: '#ff4d4f', bgColor: '#fff1f0', borderColor: '#ffccc7', text: 'Đã hủy' }
    }
    const config = configs[status] || { color: '#666', bgColor: '#fafafa', borderColor: '#d9d9d9', text: status }
    return config
  }

  const getFilteredItems = () => {
    if (!detailData?.items) return []
    
    if (statusFilter === 'Tất cả') return detailData.items
    
    return detailData.items.filter(item => item.status === statusFilter)
  }

  const columns = [
    {
      title: 'STT',
      key: 'index',
      width: 80,
      align: 'center',
      render: (_, __, index) => String(index + 1).padStart(2, '0')
    },
    {
      title: 'Mã SKU',
      dataIndex: 'sku',
      key: 'sku',
      width: 200
    },
    {
      title: 'Tên SP',
      dataIndex: 'partName',
      key: 'partName',
      width: 200
    },
    {
      title: 'Y/C nhập',
      dataIndex: 'requestedQty',
      key: 'requestedQty',
      width: 100,
      align: 'center'
    },
    {
      title: 'SL đã nhập',
      dataIndex: 'receivedQty',
      key: 'receivedQty',
      width: 120,
      align: 'center'
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 150,
      align: 'center',
      render: (status) => {
        const config = getStatusTagConfig(status)
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
              fontSize: '14px'
            }}
          >
            {config.text}
          </Tag>
        )
      }
    },
    {
      title: '',
      key: 'action',
      width: 60,
      align: 'center',
      render: (_, record) => (
        <Dropdown
          menu={{ items: getMenuItems(record) }}
          trigger={['click']}
          placement="bottomRight"
        >
          <Button
            type="text"
            icon={<MoreOutlined style={{ fontSize: '20px' }} />}
            style={{ padding: 0 }}
          />
        </Dropdown>
      )
    }
  ]

  if (loading) {
    return (
      <WarehouseLayout>
        <div style={{ textAlign: 'center', padding: '100px' }}>Đang tải...</div>
      </WarehouseLayout>
    )
  }

  if (!detailData) {
    return (
      <WarehouseLayout>
        <div style={{ textAlign: 'center', padding: '100px' }}>Không tìm thấy dữ liệu</div>
      </WarehouseLayout>
    )
  }

  return (
    <WarehouseLayout>
      <div style={{ padding: '24px', background: '#fff', borderRadius: '8px' }}>
        {/* Header */}
        <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: 24 }}>
          PHIẾU NHẬP KHO {detailData.code}
        </h2>

        {/* Info Section */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', marginBottom: 12 }}>
            <span style={{ width: 150, fontWeight: 500 }}>Nhà cung cấp</span>
            <span>: {detailData.supplierName || 'N/A'}</span>
          </div>
          <div style={{ display: 'flex', marginBottom: 12 }}>
            <span style={{ width: 150, fontWeight: 500 }}>Ngày tạo</span>
            <span>: {detailData.createdAt ? dayjs(detailData.createdAt).format('DD/MM/YYYY HH:mm') : 'N/A'}</span>
          </div>
          <div style={{ display: 'flex', marginBottom: 12 }}>
            <span style={{ width: 150, fontWeight: 500 }}>Yêu cầu mua</span>
            <span>: {detailData.purchaseRequestCode || 'N/A'}</span>
          </div>
          <div style={{ display: 'flex', marginBottom: 12 }}>
            <span style={{ width: 150, fontWeight: 500 }}>Yêu cầu mua</span>
            <span>: {detailData.purchaseRequestCode || 'N/A'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ width: 150, fontWeight: 500 }}>Trạng thái</span>
            <span>: </span>
            {(() => {
              const status = detailData.status || 'Chờ nhập kho'
              const config = getStatusTagConfig(status)
              return (
                <Tag
                  style={{
                    marginLeft: 8,
                    color: config.color,
                    backgroundColor: config.bgColor,
                    borderColor: config.borderColor,
                    border: '1px solid',
                    borderRadius: '6px',
                    padding: '4px 12px',
                    fontWeight: 500
                  }}
                >
                  {config.text}
                </Tag>
              )
            })()}
          </div>

          {/* Filter buttons for item status */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 16 }}>
            {['Tất cả', 'Chờ nhập kho', 'Đã nhập kho'].map((filter) => (
              <Button
                key={filter}
                type={statusFilter === filter ? 'primary' : 'default'}
                onClick={() => setStatusFilter(filter)}
                style={{
                  borderRadius: '6px',
                  fontWeight: 500,
                  ...(statusFilter === filter && {
                    background: '#CBB081',
                    borderColor: '#CBB081',
                    color: '#fff'
                  })
                }}
              >
                {filter}
              </Button>
            ))}
          </div>
        </div>

        {/* Items Table */}
        <Table
          columns={columns}
          dataSource={getFilteredItems()}
          pagination={false}
          size="middle"
          components={goldTableHeader}
          rowKey={(record) => record.id}
        />
      </div>

      {/* Modal Chi tiết lịch sử nhập */}
      <Modal
        title={
          <div style={{ background: '#C9A961', margin: '-20px -24px 0', padding: '16px 24px', borderRadius: '8px 8px 0 0' }}>
            <span style={{ fontSize: '18px', fontWeight: 600, color: '#000' }}>NHẬP KHO</span>
          </div>
        }
        open={isHistoryModalOpen}
        onCancel={() => setIsHistoryModalOpen(false)}
        width={750}
        footer={null}
        closeIcon={<span style={{ fontSize: '20px' }}>✕</span>}
      >
        {historyLoading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>Đang tải...</div>
        ) : historyData ? (
          <div style={{ padding: '20px 0' }}>
            {/* Thông tin linh kiện */}
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: 16 }}>Thông tin linh kiện</h3>
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', marginBottom: 12 }}>
                <span style={{ width: 150, fontWeight: 500 }}>Mã SKU:</span>
                <span>{historyData.partInfo?.sku || selectedItem?.sku || 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', marginBottom: 12 }}>
                <span style={{ width: 150, fontWeight: 500 }}>Tên linh kiện:</span>
                <span>{historyData.partInfo?.partName || selectedItem?.partName || 'N/A'}</span>
              </div>
            </div>

            {/* Thông tin nhập linh kiện */}
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: 16 }}>Thông tin nhập linh kiện</h3>
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', gap: 100 }}>
                <div>
                  <span style={{ fontWeight: 500 }}>Số lượng yêu cầu: </span>
                  <span>{historyData.importInfo?.requestedQty || selectedItem?.requestedQty || 0}</span>
                </div>
                <div>
                  <span style={{ fontWeight: 500 }}>Số lượng đã nhập: </span>
                  <span>{historyData.importInfo?.receivedQty || selectedItem?.receivedQty || 0}</span>
                </div>
              </div>
            </div>

            {/* Lịch sử nhập kho */}
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: 16 }}>Lịch sử nhập kho</h3>
            <Table
              columns={[
                {
                  title: 'STT',
                  key: 'index',
                  width: 80,
                  align: 'center',
                  render: (_, __, index) => String(index + 1).padStart(2, '0')
                },
                {
                  title: 'Số lượng',
                  dataIndex: 'quantity',
                  key: 'quantity',
                  width: 100,
                  align: 'center'
                },
                {
                  title: 'Ngày',
                  dataIndex: 'receivedAt',
                  key: 'receivedAt',
                  width: 150,
                  render: (date) => date ? dayjs(date).format('DD/MM/YYYY') : 'N/A'
                },
                {
                  title: 'Người nhập',
                  dataIndex: 'receivedBy',
                  key: 'receivedBy',
                  width: 150
                },
                {
                  title: 'Hóa đơn',
                  dataIndex: 'attachmentUrl',
                  key: 'attachmentUrl',
                  width: 120,
                  render: (url) => {
                    if (!url) return 'N/A'
                    const fileName = extractFileName(url)
                    return (
                      <a 
                        href={url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ color: '#1677ff', textDecoration: 'underline' }}
                      >
                        {fileName}
                      </a>
                    )
                  }
                }
              ]}
              dataSource={historyData.history || []}
              pagination={false}
              size="small"
              components={goldTableHeader}
              rowKey={(record) => record.id}
            />

            {/* Button Nhập hàng - chỉ hiển thị khi chưa nhập đủ */}
            {selectedItem?.status !== 'Đã nhập kho' && selectedItem?.status !== 'RECEIVED' && 
             (!historyData?.importInfo || historyData.importInfo.receivedQty < historyData.importInfo.requestedQty) && (
              <div style={{ marginTop: 24, textAlign: 'right' }}>
                <Button
                  type="primary"
                  style={{
                    background: '#22c55e',
                    borderColor: '#22c55e',
                    borderRadius: '6px',
                    padding: '8px 32px',
                    height: 'auto',
                    fontSize: '16px',
                    fontWeight: 500
                  }}
                  onClick={() => {
                    setIsHistoryModalOpen(false)
                    handleOpenImportModal(selectedItem)
                  }}
                >
                  Nhập hàng
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px' }}>Không có dữ liệu</div>
        )}
      </Modal>

      {/* Modal Form Nhập hàng */}
      <Modal
        title={
          <div style={{ background: '#C9A961', margin: '-20px -24px 0', padding: '16px 24px', borderRadius: '8px 8px 0 0' }}>
            <span style={{ fontSize: '18px', fontWeight: 600, color: '#000' }}>NHẬP KHO</span>
          </div>
        }
        open={isImportModalOpen}
        onCancel={() => {
          setIsImportModalOpen(false)
          setImportFormData({ receiver: '', fileList: [] })
        }}
        width={650}
        footer={null}
        closeIcon={<span style={{ fontSize: '20px' }}>✕</span>}
      >
        {importFormLoading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>Đang tải...</div>
        ) : selectedItem ? (
          <div style={{ padding: '20px 0' }}>
            {/* Thông tin linh kiện */}
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: 16 }}>Thông tin linh kiện</h3>
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', marginBottom: 12 }}>
                <span style={{ width: 150, fontWeight: 600 }}>Mã SKU:</span>
                <span>{selectedItem.sku || 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', marginBottom: 12 }}>
                <span style={{ width: 150, fontWeight: 600 }}>Tên linh kiện:</span>
                <span>{selectedItem.partName || 'N/A'}</span>
              </div>
            </div>

            {/* Thông tin nhập linh kiện */}
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: 16 }}>Thông tin nhập linh kiện</h3>
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', gap: 100, marginBottom: 16 }}>
                <div>
                  <span style={{ fontWeight: 600 }}>Số lượng yêu cầu: </span>
                  <span>{selectedItem.requestedQty || 0}</span>
                </div>
                <div>
                  <span style={{ fontWeight: 600 }}>Số lượng đã nhập: </span>
                  <span>{selectedItem.receivedQty || 0}</span>
                </div>
              </div>

              {/* Số lượng thực nhận */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}>
                  Số lượng thực nhận <span style={{ color: 'red' }}>*</span>
                </label>
                <InputNumber
                  min={0}
                  placeholder="Nhập số lượng"
                  value={importFormData.quantity}
                  onChange={(value) => setImportFormData({ ...importFormData, quantity: value || 0 })}
                  onKeyDown={handleNumberKeyDown}
                  style={{ width: '100%', borderRadius: '6px' }}
                />
              </div>

              {/* Người nhận */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}>
                  Người nhận <span style={{ color: 'red' }}>*</span>
                </label>
                <Input
                  placeholder="Nhập tên người nhận"
                  value={importFormData.receivedBy}
                  onChange={(e) => setImportFormData({ ...importFormData, receivedBy: e.target.value })}
                  disabled
                  style={{ 
                    borderRadius: '6px',
                    backgroundColor: '#f5f5f5',
                    cursor: 'not-allowed'
                  }}
                />
              </div>

              {/* Đơn giá */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}>
                  Đơn giá
                </label>
                <InputNumber
                  min={0}
                  placeholder="Nhập đơn giá"
                  value={importFormData.unitPrice}
                  onChange={(value) => setImportFormData({ ...importFormData, unitPrice: value || 0 })}
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/\$\s?|(,*)/g, '')}
                  onKeyDown={handleNumberKeyDown}
                  style={{ width: '100%', borderRadius: '6px' }}
                />
              </div>

              {/* Ghi chú */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}>
                  Ghi chú
                </label>
                <Input.TextArea
                  placeholder="Nhập ghi chú"
                  value={importFormData.note}
                  onChange={(e) => setImportFormData({ ...importFormData, note: e.target.value })}
                  rows={3}
                  style={{ borderRadius: '6px' }}
                />
              </div>

              {/* File đính kèm */}
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}>
                  File Đính kèm <span style={{ color: 'red' }}>*</span>
                </label>
                <Dragger
                  fileList={importFormData.fileList}
                  onChange={({ fileList }) => setImportFormData({ ...importFormData, fileList })}
                  beforeUpload={() => false}
                  accept=".jpg,.jpeg,.png,.pdf"
                  style={{ borderRadius: '6px' }}
                >
                  <p className="ant-upload-drag-icon">
                    <InboxOutlined style={{ fontSize: '32px', color: '#bfbfbf' }} />
                  </p>
                  <p style={{ fontSize: '14px', color: '#666' }}>
                    Drag & Drop or <span style={{ color: '#1677ff' }}>Choose file</span> to upload
                  </p>
                  <p style={{ fontSize: '12px', color: '#999' }}>
                    fig, gif, pdf, png, jpeg
                  </p>
                </Dragger>
              </div>
            </div>

            {/* Button Nhập hàng */}
            <div style={{ textAlign: 'right' }}>
              <Button
                type="primary"
                style={{
                  background: '#22c55e',
                  borderColor: '#22c55e',
                  borderRadius: '6px',
                  padding: '8px 32px',
                  height: 'auto',
                  fontSize: '16px',
                  fontWeight: 500
                }}
                onClick={handleImportGoods}
              >
                Nhập hàng
              </Button>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px' }}>Không có dữ liệu</div>
        )}
      </Modal>
    </WarehouseLayout>
  )
}
