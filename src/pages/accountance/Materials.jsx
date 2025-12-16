import React, { useMemo, useState, useEffect } from 'react'
import { Table, Input, Button, Tag, Space, message, Modal, Upload, Checkbox, DatePicker } from 'antd'
import { SearchOutlined, CloseOutlined, FilterOutlined } from '@ant-design/icons'
import AccountanceLayout from '../../layouts/AccountanceLayout'
import { goldTableHeader } from '../../utils/tableComponents'
import '../../styles/pages/accountance/materials.css'
import { stockReceiptAPI } from '../../services/api'
import dayjs from 'dayjs'

export default function Materials() {
  const [query, setQuery] = useState('')
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
  const [filterVisible, setFilterVisible] = useState(false)
  const [selectedPaymentStatuses, setSelectedPaymentStatuses] = useState([])
  const [createdDateRange, setCreatedDateRange] = useState([null, null])

  const fetchPaymentDetail = async (id) => {
    setPaymentLoading(true)
    try {
      const { data, error } = await stockReceiptAPI.getPaymentDetail(id)
      
      if (error) {
        message.error(error || 'Không thể tải chi tiết thanh toán')
        return
      }

      if (data?.result) {
        setPaymentDetail(data.result)
      }
    } catch (error) {
      console.error('Error fetching payment detail:', error)
      message.error('Không thể tải chi tiết thanh toán')
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
        relatedSupplierId: paymentDetail?.supplierId || 0
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
        const { content = [], totalElements } = data.result
        
        // Transform API data to match UI structure
        const transformedData = content.map((item) => ({
          id: item.historyId,
          receiptCode: item.receiptCode || 'N/A',
          sku: item.sku || 'N/A',
          quantity: item.quantity || 0,
          unitPrice: item.quantity > 0 ? (item.totalPrice / item.quantity) : 0,
          totalPrice: item.totalPrice || 0,
          receivedAt: item.receivedAt || null,
          paymentStatus: item.paymentStatus || null
        }))
        
        setMaterialsData(transformedData)
        setPagination(prev => ({
          ...prev,
          total: totalElements ?? transformedData.length ?? 0,
          current: page + 1
        }))
      } else {
        setMaterialsData([])
        setPagination(prev => ({
          ...prev,
          total: 0,
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
    const [fromDate, toDate] = createdDateRange
    return materialsData
      .filter((item) => {
        const matchesQuery =
          !query ||
          item.receiptCode?.toLowerCase().includes(query.toLowerCase()) ||
          item.sku?.toLowerCase().includes(query.toLowerCase())
        const matchesPaymentStatus =
          selectedPaymentStatuses.length === 0 ||
          selectedPaymentStatuses.includes((item.paymentStatus || '').toUpperCase())
        // Xử lý receivedAt: có thể là format sẵn "DD/MM/YYYY HH:mm" hoặc ISO string
        let receivedAt = null
        if (item.receivedAt) {
          const datePattern = /^\d{2}\/\d{2}\/\d{4}(\s+\d{2}:\d{2})?$/
          if (datePattern.test(item.receivedAt)) {
            // Parse format DD/MM/YYYY HH:mm
            const [datePart] = item.receivedAt.split(' ')
            const [day, month, year] = datePart.split('/')
            receivedAt = dayjs(`${year}-${month}-${day}`)
          } else {
            // Parse ISO string hoặc timestamp
            receivedAt = dayjs(item.receivedAt)
          }
        }
        
        const matchesDate =
          !fromDate ||
          !toDate ||
          (receivedAt && receivedAt.isValid() &&
            receivedAt.isAfter(fromDate.startOf('day').subtract(1, 'day')) &&
            receivedAt.isBefore(toDate.endOf('day').add(1, 'day')))
        return matchesQuery
          && matchesPaymentStatus
          && matchesDate
      })
      .map((item, index) => ({ ...item, key: item.id, index }))
  }, [query, materialsData, selectedPaymentStatuses, createdDateRange])

  // Helper function để format tiền VN với dấu . làm ngăn cách
  const formatCurrency = (value) => {
    if (!value && value !== 0) return '0'
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  }

  // Helper function để format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    
    // Kiểm tra xem có phải là format DD/MM/YYYY HH:mm hoặc DD/MM/YYYY không (đã được format sẵn từ backend)
    const datePattern = /^\d{2}\/\d{2}\/\d{4}(\s+\d{2}:\d{2})?$/
    if (datePattern.test(dateString)) {
      // Đã format sẵn, chỉ lấy phần ngày (bỏ phần giờ nếu có)
      return dateString.split(' ')[0]
    }
    
    // Nếu là ISO string hoặc timestamp, parse bằng dayjs
    try {
      const parsed = dayjs(dateString)
      if (parsed.isValid()) {
        return parsed.format('DD/MM/YYYY')
      }
      return 'N/A'
    } catch (e) {
      return 'N/A'
    }
  }

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
      dataIndex: 'sku',
      key: 'sku',
      width: 250
    },
    {
      title: 'SL nhận',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 120,
      align: 'center',
      render: (value) => value || 0
    },
    {
      title: 'Đơn giá',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      width: 150,
      align: 'right',
      render: (value) => formatCurrency(value || 0)
    },
    {
      title: 'Thành tiền',
      dataIndex: 'totalPrice',
      key: 'totalPrice',
      width: 150,
      align: 'right',
      render: (value) => formatCurrency(value || 0)
    },
    {
      title: 'Ngày nhập',
      dataIndex: 'receivedAt',
      key: 'receivedAt',
      width: 150,
      align: 'center',
      render: (date) => formatDate(date)
    },
    {
      title: 'Trạng thái',
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
      width: 160,
      align: 'center',
      render: (status) => {
        const statusMap = {
          'PENDING': { label: 'Chờ xử lý', color: '#3b82f6' },
          'COMPLETED': { label: 'Đã thanh toán', color: '#1f8f4d' },
          'PAID': { label: 'Đã thanh toán', color: '#1f8f4d' },
          'UNPAID': { label: 'Chưa thanh toán', color: '#faad14' },
          'PARTIAL_PAID': { label: 'Thanh toán 1 phần', color: '#1677ff' },
          'CANCELLED': { label: 'Đã hủy', color: '#ef4444' }
        }
        const statusInfo = statusMap[status] || { label: status || 'N/A', color: '#b45309' }
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

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', gap: '12px', flexWrap: 'wrap' }}>
            <Input
              prefix={<SearchOutlined />}
              placeholder="Tìm kiếm"
              allowClear
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ width: 260 }}
            />
            <Button
              onClick={() => setFilterVisible(true)}
              icon={<FilterOutlined />}
              style={{
                borderColor: '#d9d9d9',
                fontWeight: 700,
                borderRadius: 10,
                height: 40,
                padding: '0 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 1px 2px rgba(0,0,0,0.06)'
              }}
            >
              Bộ lọc
            </Button>
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
              showTotal: (total, range) => `Hiển thị ${range[0]}-${range[1]} của ${total} bản ghi`,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50', '100'],
              locale: {
                items_per_page: ' / trang',
                jump_to: 'Đi đến',
                jump_to_confirm: 'Xác nhận',
                page: 'Trang',
                prev_page: 'Trang trước',
                next_page: 'Trang sau',
                prev_5: 'Trước 5 trang',
                next_5: 'Sau 5 trang',
                prev_3: 'Trước 3 trang',
                next_3: 'Sau 3 trang'
              }
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
                  Nhà phân phối:
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
                  Số tiền:
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

        <Modal
          open={filterVisible}
          onCancel={() => setFilterVisible(false)}
          footer={null}
          title="Bộ lọc"
          width={420}
        >
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Trạng thái</div>
            <Space direction="vertical">
              {[
                { key: 'UNPAID', label: 'Chưa thanh toán' },
                { key: 'PARTIAL_PAID', label: 'Thanh toán 1 phần' },
                { key: 'PAID', label: 'Đã thanh toán đủ' }
              ].map((opt) => (
                <Checkbox
                  key={opt.key}
                  checked={selectedPaymentStatuses.includes(opt.key)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedPaymentStatuses((prev) => [...prev, opt.key])
                    } else {
                      setSelectedPaymentStatuses((prev) => prev.filter((v) => v !== opt.key))
                    }
                  }}
                >
                  {opt.label}
                </Checkbox>
              ))}
            </Space>
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Khoảng ngày tạo</div>
            <Space direction="vertical" style={{ width: '100%', gap: 12 }}>
              <div>
                <div style={{ fontSize: 14, color: '#444', marginBottom: 6 }}>Từ ngày</div>
                <DatePicker
                  style={{ width: '100%', height: 40, borderRadius: 8 }}
                  placeholder="dd/mm/yyyy"
                  value={createdDateRange[0]}
                  format="DD/MM/YYYY"
                  allowClear
                  onChange={(val) => setCreatedDateRange([val, createdDateRange[1]])}
                />
              </div>
              <div>
                <div style={{ fontSize: 14, color: '#444', marginBottom: 6 }}>Đến ngày</div>
                <DatePicker
                  style={{ width: '100%', height: 40, borderRadius: 8 }}
                  placeholder="dd/mm/yyyy"
                  value={createdDateRange[1]}
                  format="DD/MM/YYYY"
                  allowClear
                  onChange={(val) => setCreatedDateRange([createdDateRange[0], val])}
                />
              </div>
            </Space>
          </div>

          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button
              onClick={() => {
                setSelectedPaymentStatuses([])
                setCreatedDateRange([null, null])
              }}
            >
              Đặt lại
            </Button>
            <Button
              type="primary"
              onClick={() => setFilterVisible(false)}
              style={{ background: '#CBB081', borderColor: '#CBB081' }}
            >
              Áp dụng
            </Button>
          </Space>
        </Modal>
      </div>
    </AccountanceLayout>
  )
}

