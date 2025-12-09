import React, { useMemo, useState, useEffect } from 'react'
import { Table, Input, Button, Tag, Space, message, Modal, Upload } from 'antd'
import { SearchOutlined, CloseOutlined } from '@ant-design/icons'
import AccountanceLayout from '../../layouts/AccountanceLayout'
import { goldTableHeader } from '../../utils/tableComponents'
import '../../styles/pages/accountance/materials.css'
import { stockReceiptAPI } from '../../services/api'

const statusButtons = [
  { key: 'processing', label: 'Chờ xử lý' },
  { key: 'paid', label: 'Đã thanh toán' },
  { key: 'all', label: 'Tất cả' }
]

export default function Materials() {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('processing')
  const [loading, setLoading] = useState(false)
  const [materialsData, setMaterialsData] = useState([])
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  })
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentDetail, setPaymentDetail] = useState(null)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [fileList, setFileList] = useState([])
  const [selectedRecord, setSelectedRecord] = useState(null)

  const fetchPaymentDetail = async (id) => {
    setPaymentLoading(true)
    try {
      const { data, error } = await stockReceiptAPI.getPaymentDetail(id)
      
      if (error) {
        // Nếu lỗi, dùng mock data
        const mockDetail = {
          type: 'Chi',
          supplier: 'Toyota',
          amount: 600000,
          attachments: []
        }
        setPaymentDetail(mockDetail)
        return
      }

      if (data?.result) {
        setPaymentDetail(data.result)
      } else {
        // Nếu không có data, dùng mock
        const mockDetail = {
          type: 'Chi',
          supplier: 'Toyota',
          amount: 600000,
          attachments: []
        }
        setPaymentDetail(mockDetail)
      }
    } catch (error) {
      console.error('Error fetching payment detail:', error)
      // Dùng mock data khi lỗi
      const mockDetail = {
        type: 'Chi',
        supplier: 'Toyota',
        amount: 600000,
        attachments: []
      }
      setPaymentDetail(mockDetail)
    } finally {
      setPaymentLoading(false)
    }
  }

  const handleRowClick = (record) => {
    setSelectedRecord(record)
    setShowPaymentModal(true)
    fetchPaymentDetail(record.id)
  }

  const handlePayment = async () => {
    if (!selectedRecord) return

    if (fileList.length === 0) {
      message.warning('Vui lòng tải lên file đính kèm')
      return
    }

    setPaymentLoading(true)
    try {
      const formData = new FormData()
      
      // Thêm data JSON
      const paymentData = {
        amount: paymentDetail?.amount || 0,
        description: 'Thanh toán phiếu nhập kho',
        relatedEmployeeId: 0,
        relatedSupplierId: 0,
        type: 'Thanh toán phiếu nhập kho'
      }
      formData.append('data', JSON.stringify(paymentData))
      
      // Thêm file
      if (fileList.length > 0 && fileList[0].originFileObj) {
        formData.append('file', fileList[0].originFileObj)
      }

      const response = await stockReceiptAPI.createReceiptPayment(selectedRecord.id, formData)
      
      if (response.data?.error) {
        message.error(response.data.error || 'Thanh toán thất bại')
        return
      }

      message.success('Thanh toán thành công')
      setShowPaymentModal(false)
      setPaymentDetail(null)
      setFileList([])
      setSelectedRecord(null)
      
      // Reload data
      await fetchMaterials(pagination.current - 1, pagination.pageSize)
    } catch (error) {
      console.error('Error creating payment:', error)
      message.error('Đã xảy ra lỗi khi thanh toán')
    } finally {
      setPaymentLoading(false)
    }
  }

  const fetchMaterials = async (page = 0, size = 10) => {
    setLoading(true)
    try {
      const { data, error } = await stockReceiptAPI.getReceiptHistory(page, size)
      
      if (error) {
        message.error(error || 'Không thể tải dữ liệu vật tư')
        return
      }

      if (data?.result) {
        const { content, totalElements } = data.result
        
        // Nếu không có dữ liệu, dùng mock data
        const mockData = [
          {
            id: 1,
            receiptCode: 'NK-2025-000001',
            partSKU: 'LOC-GIO-TOYOTA-CAMRY-2019',
            receivedQuantity: 10,
            unitPrice: 3,
            totalPrice: 10000000,
            createdAt: '2025-11-11T00:00:00',
            status: 'PENDING'
          },
          {
            id: 2,
            receiptCode: 'NK-2025-000001',
            partSKU: 'LOC-GIO-TOYOTA-CAMRY-2019',
            receivedQuantity: 1,
            unitPrice: 4,
            totalPrice: 10000000,
            createdAt: '2025-11-11T00:00:00',
            status: 'PENDING'
          },
          {
            id: 3,
            receiptCode: 'NK-2025-000001',
            partSKU: 'LOC-GIO-TOYOTA-CAMRY-2019',
            receivedQuantity: 2,
            unitPrice: 6,
            totalPrice: 10000000,
            createdAt: '2025-11-11T00:00:00',
            status: 'PENDING'
          },
          {
            id: 4,
            receiptCode: 'NK-2025-000001',
            partSKU: 'LOC-GIO-TOYOTA-CAMRY-2019',
            receivedQuantity: 2,
            unitPrice: 1,
            totalPrice: 10000000,
            createdAt: '2025-11-11T00:00:00',
            status: 'PENDING'
          },
          {
            id: 5,
            receiptCode: 'NK-2025-000001',
            partSKU: 'LOC-GIO-TOYOTA-CAMRY-2019',
            receivedQuantity: 1,
            unitPrice: 5,
            totalPrice: 10000000,
            createdAt: '2025-11-11T00:00:00',
            status: 'COMPLETED'
          },
          {
            id: 6,
            receiptCode: 'NK-2025-000001',
            partSKU: 'LOC-GIO-TOYOTA-CAMRY-2019',
            receivedQuantity: 1,
            unitPrice: 8,
            totalPrice: 10000000,
            createdAt: '2025-11-11T00:00:00',
            status: 'COMPLETED'
          },
          {
            id: 7,
            receiptCode: 'NK-2025-000001',
            partSKU: 'LOC-GIO-TOYOTA-CAMRY-2019',
            receivedQuantity: 1,
            unitPrice: 2,
            totalPrice: 10000000,
            createdAt: '2025-11-11T00:00:00',
            status: 'COMPLETED'
          },
          {
            id: 8,
            receiptCode: 'NK-2025-000001',
            partSKU: 'LOC-GIO-TOYOTA-CAMRY-2019',
            receivedQuantity: 1,
            unitPrice: 1,
            totalPrice: 10000000,
            createdAt: '2025-11-11T00:00:00',
            status: 'COMPLETED'
          },
          {
            id: 9,
            receiptCode: 'NK-2025-000001',
            partSKU: 'LOC-GIO-TOYOTA-CAMRY-2019',
            receivedQuantity: 1,
            unitPrice: 1,
            totalPrice: 10000000,
            createdAt: '2025-11-11T00:00:00',
            status: 'COMPLETED'
          }
        ]
        
        const finalData = content && content.length > 0 ? content : mockData
        
        setMaterialsData(finalData)
        setPagination(prev => ({
          ...prev,
          total: totalElements || finalData.length,
          current: page + 1
        }))
      }
    } catch (error) {
      console.error('Error fetching materials:', error)
      message.error('Không thể tải dữ liệu vật tư')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMaterials(0, pagination.pageSize)
  }, [])

  const filtered = useMemo(() => {
    return materialsData
      .filter((item) => {
        const matchesQuery =
          !query ||
          item.receiptCode?.toLowerCase().includes(query.toLowerCase()) ||
          item.partSKU?.toLowerCase().includes(query.toLowerCase())
        const matchesStatus =
          status === 'all' ||
          (status === 'processing' && item.status !== 'COMPLETED') ||
          (status === 'paid' && item.status === 'COMPLETED')
        return matchesQuery && matchesStatus
      })
      .map((item, index) => ({ ...item, key: item.id, index }))
  }, [query, status, materialsData])

  const mainColumns = [
    {
      title: 'Mã phiếu',
      dataIndex: 'receiptCode',
      key: 'receiptCode',
      width: 180,
      render: (text) => <span style={{ fontWeight: 600 }}>{text || 'N/A'}</span>
    },
    {
      title: 'Mã SKU',
      dataIndex: 'partSKU',
      key: 'partSKU',
      width: 250
    },
    {
      title: 'SL nhận',
      dataIndex: 'receivedQuantity',
      key: 'receivedQuantity',
      width: 120,
      align: 'center',
      render: (value) => value || 0
    },
    {
      title: 'Đơn giá',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      width: 150,
      align: 'center',
      render: (value) => value || 0
    },
    {
      title: 'Thành tiền',
      dataIndex: 'totalPrice',
      key: 'totalPrice',
      width: 150,
      align: 'right',
      render: (value) => (value || 0).toLocaleString('vi-VN')
    },
    {
      title: 'Ngày nhập',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      align: 'center',
      render: (date) => date ? new Date(date).toLocaleDateString('vi-VN') : 'N/A'
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 160,
      align: 'center',
      render: (text) => {
        const statusMap = {
          'PENDING': { label: 'Chờ xử lý', color: '#3b82f6' },
          'COMPLETED': { label: 'Đã thanh toán', color: '#1f8f4d' },
          'CANCELLED': { label: 'Đã hủy', color: '#ef4444' }
        }
        const statusInfo = statusMap[text] || { label: text, color: '#b45309' }
        return (
          <Tag
            style={{
              color: statusInfo.color,
              background: 'transparent',
              border: 'none',
              fontWeight: 600
            }}
          >
            {statusInfo.label}
          </Tag>
        )
      }
    },
  ]

  const handleTableChange = (newPagination) => {
    fetchMaterials(newPagination.current - 1, newPagination.pageSize)
  }

  return (
    <AccountanceLayout>
      <div style={{ padding: '24px', background: '#ffffff', minHeight: '100vh' }}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, marginBottom: '20px' }}>Tiền vật tư</h1>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '20px' }}>
            <Input
              prefix={<SearchOutlined />}
              placeholder="Tìm kiếm"
              allowClear
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ width: 260 }}
            />
            <Space>
              {statusButtons.map((btn) => (
                <Button
                  key={btn.key}
                  type={status === btn.key ? 'primary' : 'default'}
                  onClick={() => setStatus(btn.key)}
                  style={{
                    background: status === btn.key ? '#CBB081' : '#fff',
                    borderColor: status === btn.key ? '#CBB081' : '#e6e6e6',
                    color: status === btn.key ? '#111' : '#666',
                    fontWeight: 600
                  }}
                >
                  {btn.label}
                </Button>
              ))}
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
            className="materials-table"
            columns={mainColumns}
            dataSource={filtered}
            loading={loading}
            pagination={{
              ...pagination,
              showTotal: (total, range) => `${range[0]} of ${total} row(s) selected.`,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50', '100']
            }}
            onChange={handleTableChange}
            components={goldTableHeader}
            rowKey="id"
            rowClassName={(_, index) => (index % 2 === 0 ? 'table-row-even' : 'table-row-odd')}
            onRow={(record) => ({
              onClick: () => handleRowClick(record),
              style: { cursor: 'pointer' }
            })}
          />
        </div>

        {/* Modal Phiếu thanh toán */}
        <Modal
          open={showPaymentModal}
          onCancel={() => {
            setShowPaymentModal(false)
            setPaymentDetail(null)
            setFileList([])
          }}
          footer={null}
          width={500}
          closeIcon={<CloseOutlined />}
          title={
            <div
              style={{
                background: '#CBB081',
                margin: '-20px -24px 20px',
                padding: '16px 24px',
                color: '#000',
                fontWeight: 700,
                fontSize: '16px',
                textAlign: 'center'
              }}
            >
              Phiếu thanh toán
            </div>
          }
        >
          {paymentLoading ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div>Đang tải...</div>
            </div>
          ) : paymentDetail ? (
            <div style={{ padding: '0 0 20px' }}>
              {/* Loại phiếu - nằm ngang */}
              <div style={{ 
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <span style={{ fontWeight: 600, fontSize: '14px' }}>
                  Loại phiếu:
                </span>
                <span style={{ fontSize: '14px', color: '#666' }}>
                  {paymentDetail.type || 'Chi'}
                </span>
              </div>

              {/* Nhà phân phối - nằm ngang */}
              <div style={{ 
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <span style={{ fontWeight: 600, fontSize: '14px' }}>
                  Nhà phân phối <span style={{ color: 'red' }}>*</span>:
                </span>
                <span style={{ fontSize: '14px', color: '#666' }}>
                  {paymentDetail.supplier || 'Toyota'}
                </span>
              </div>

              {/* Số tiền - nằm ngang */}
              <div style={{ 
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <span style={{ fontWeight: 600, fontSize: '14px' }}>
                  Số tiền <span style={{ color: 'red' }}>*</span>:
                </span>
                <span style={{ fontSize: '14px', color: '#666' }}>
                  {(paymentDetail.amount || 600000).toLocaleString('vi-VN')}
                </span>
              </div>

              {/* File đính kèm */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ marginBottom: '8px', fontWeight: 600, fontSize: '14px' }}>
                  File Đính kèm <span style={{ color: 'red' }}>*</span>
                </div>
                <Upload.Dragger
                  fileList={fileList}
                  onChange={({ fileList }) => setFileList(fileList)}
                  beforeUpload={() => false}
                  accept=".jpg,.jpeg,.png,.pdf"
                  style={{
                    background: '#fafafa',
                    border: '2px dashed #d9d9d9',
                    borderRadius: '8px'
                  }}
                >
                  <p style={{ fontSize: '14px', color: '#999', margin: '12px 0' }}>
                    Drag & Drop or <span style={{ color: '#1890ff' }}>Choose file</span> to upload
                  </p>
                  <p style={{ fontSize: '12px', color: '#bbb', margin: 0 }}>
                    .fig, .zip, .pdf, .png, .jpeg
                  </p>
                </Upload.Dragger>
              </div>

              {/* Button */}
              <Button
                type="primary"
                block
                loading={paymentLoading}
                style={{
                  background: '#22c55e',
                  borderColor: '#22c55e',
                  height: '45px',
                  fontWeight: 600,
                  fontSize: '16px',
                  borderRadius: '8px',
                  marginTop: '20px'
                }}
                onClick={handlePayment}
              >
                Thanh toán
              </Button>
            </div>
          ) : null}
        </Modal>
      </div>
    </AccountanceLayout>
  )
}

