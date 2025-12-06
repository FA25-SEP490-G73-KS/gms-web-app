import React, { useState, useEffect } from 'react'
import { Table, Button, Tag, Modal, Dropdown, Input, Upload, message } from 'antd'
import { useParams, useNavigate } from 'react-router-dom'
import { MoreOutlined, UploadOutlined, InboxOutlined } from '@ant-design/icons'
import WarehouseLayout from '../../layouts/WarehouseLayout'
import { goldTableHeader } from '../../utils/tableComponents'
import { stockReceiptAPI } from '../../services/api'
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
    receiver: '',
    fileList: []
  })

  useEffect(() => {
    fetchDetail()
  }, [id])

  const fetchDetail = async () => {
    setLoading(true)
    try {
      // Mock detail data
      const mockDetail = {
        code: 'NK-000123',
        supplierName: 'Hoàng Tuấn Auto',
        createdAt: '2025-10-12T10:30:00',
        purchaseRequestCode: 'PR-000456',
        status: 'Chờ nhập',
        items: [
          {
            id: 1,
            sku: 'LOC-GIO-TOYOTA-CAMRY-2019',
            partName: 'Lọc gió động cơ 30W',
            requestedQty: 5,
            receivedQty: 2,
            status: 'Đang xuất hàng'
          },
          {
            id: 2,
            sku: 'LOC-GIO-TOYOTA-CAMRY-2019',
            partName: 'Lọc gió động cơ 30W',
            requestedQty: 5,
            receivedQty: 2,
            status: 'Đang xuất hàng'
          },
          {
            id: 3,
            sku: 'LOC-GIO-TOYOTA-CAMRY-2019',
            partName: 'Lọc gió động cơ 30W',
            requestedQty: 5,
            receivedQty: 2,
            status: 'Đang xuất hàng'
          },
          {
            id: 4,
            sku: 'LOC-GIO-TOYOTA-CAMRY-2019',
            partName: 'Lọc gió động cơ 30W',
            requestedQty: 5,
            receivedQty: 2,
            status: 'Đang xuất hàng'
          },
          {
            id: 5,
            sku: 'LOC-GIO-TOYOTA-CAMRY-2019',
            partName: 'Lọc gió động cơ 30W',
            requestedQty: 5,
            receivedQty: 2,
            status: 'Hoàn thành'
          }
        ]
      }

      let result = mockDetail

      try {
        const { data, error } = await stockReceiptAPI.getById(id)
        if (data?.result) {
          result = data.result
        }
      } catch (err) {
        console.log('Using mock data due to API error:', err)
      }

      setDetailData(result)
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
      // Mock history data
      const mockHistory = {
        partInfo: {
          sku: 'LOC-GIO-TOYOTA-CAMRY-2019',
          partName: 'Lọc gió động cơ Camry 2019'
        },
        importInfo: {
          requestedQty: 5,
          receivedQty: 1
        },
        history: [
          {
            id: 1,
            quantity: 1,
            importDate: '2025-10-20T14:30:00',
            importedBy: 'Nguyễn Văn A',
            document: 'File.pdf'
          },
          {
            id: 2,
            quantity: 1,
            importDate: '2025-10-20T14:30:00',
            importedBy: 'Nguyễn Văn A',
            document: 'File.pdf'
          }
        ]
      }

      let result = mockHistory

      try {
        const { data, error } = await stockReceiptAPI.getItemHistory(itemId)
        if (data?.result) {
          result = data.result
        }
      } catch (err) {
        console.log('Using mock history data due to API error:', err)
      }

      setHistoryData(result)
    } catch (err) {
      console.error('Failed to fetch history:', err)
      message.error('Đã xảy ra lỗi khi tải lịch sử')
    } finally {
      setHistoryLoading(false)
    }
  }

  const fetchItemForImport = async (itemId) => {
    setImportFormLoading(true)
    try {
      // Mock item data
      const mockItemData = {
        sku: 'LOC-GIO-TOYOTA-CAMRY-2019',
        partName: 'Lọc gió động cơ Camry 2019',
        requestedQty: 5,
        receivedQty: 1
      }

      let result = mockItemData

      try {
        const { data, error } = await stockReceiptAPI.getItemById(itemId)
        if (data?.result) {
          result = data.result
        }
      } catch (err) {
        console.log('Using mock item data due to API error:', err)
      }

      setSelectedItem(result)
    } catch (err) {
      console.error('Failed to fetch item:', err)
      message.error('Đã xảy ra lỗi khi tải thông tin linh kiện')
    } finally {
      setImportFormLoading(false)
    }
  }

  const handleOpenImportModal = (item) => {
    setIsImportModalOpen(true)
    fetchItemForImport(item.id)
  }

  const handleImportGoods = () => {
    if (!importFormData.receiver) {
      message.error('Vui lòng nhập số lượng thực nhận')
      return
    }
    
    if (importFormData.fileList.length === 0) {
      message.error('Vui lòng đính kèm file')
      return
    }

    // TODO: Call API to submit import
    message.success('Nhập hàng thành công')
    setIsImportModalOpen(false)
    setImportFormData({ receiver: '', fileList: [] })
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
      'Đang xuất hàng': { color: '#1677ff', text: 'Đang xuất hàng' },
      'Hoàn thành': { color: '#22c55e', text: 'Hoàn thành' }
    }
    return configs[status] || { color: '#666', text: status }
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
              backgroundColor: config.color + '15',
              borderColor: config.color,
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
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ width: 150, fontWeight: 500 }}>Trạng thái</span>
            <span>: </span>
            <Tag
              style={{
                marginLeft: 8,
                color: '#faad14',
                backgroundColor: '#fffbe6',
                borderColor: '#ffe58f',
                border: '1px solid',
                borderRadius: '6px',
                padding: '4px 12px',
                fontWeight: 500
              }}
            >
              {detailData.status || 'CHỜ NHẬP'}
            </Tag>

            {/* Filter buttons for item status */}
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              {['Tất cả', 'Chờ nhập', 'Hoàn thành'].map((filter) => (
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
                  dataIndex: 'importDate',
                  key: 'importDate',
                  width: 150,
                  render: (date) => date ? dayjs(date).format('DD/MM/YYYY') : 'N/A'
                },
                {
                  title: 'Người nhập',
                  dataIndex: 'importedBy',
                  key: 'importedBy',
                  width: 150
                },
                {
                  title: 'Hóa đơn',
                  dataIndex: 'document',
                  key: 'document',
                  width: 120,
                  render: (doc) => doc ? <a>{doc}</a> : 'N/A'
                }
              ]}
              dataSource={historyData.history || []}
              pagination={false}
              size="small"
              components={goldTableHeader}
              rowKey={(record) => record.id}
            />

            {/* Button Nhập hàng */}
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
                  Số lượng thực nhận
                </label>
                <Input
                  placeholder="Đặng Thị Huyền - 01234"
                  value={importFormData.receiver}
                  onChange={(e) => setImportFormData({ ...importFormData, receiver: e.target.value })}
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
