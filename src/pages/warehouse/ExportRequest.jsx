<<<<<<< Updated upstream
import React, { useState } from 'react'
import { Table, Input, Card, Badge, Button } from 'antd'
import WarehouseLayout from '../../layouts/WarehouseLayout'
import ComponentDetailsModal from './modals/ComponentDetailsModal'

const { Search } = Input

export default function ExportRequest() {
  const [selectedComponent, setSelectedComponent] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')

  const exportRequests = [
    {
      id: 1,
      code: 'STK-2025-000001',
      vehicleModel: 'Mazda-v3',
      creator: 'DT Huyền - 190',
      createDate: '30/10/2025',
      status: 'Chờ xác nhận'
    },
    {
      id: 2,
      code: 'STK-2025-000001',
      vehicleModel: 'Mazda-v3',
      creator: 'DT Huyền - 190',
      createDate: '30/10/2025',
      status: 'Chờ xác nhận'
    },
    {
      id: 3,
      code: 'STK-2025-000001',
      vehicleModel: 'Mazda-v3',
      creator: 'DT Huyền - 190',
      createDate: '30/10/2025',
      status: 'Xác nhận'
    },
    {
      id: 4,
      code: 'STK-2025-000001',
      vehicleModel: 'Mazda-v3',
      creator: 'DT Huyền - 190',
      createDate: '30/10/2025',
      status: 'Xác nhận'
    }
  ]

  const getStatusConfig = (status) => {
    if (status === 'Xác nhận') {
      return { color: 'success', text: status }
    }
    if (status === 'Chờ xác nhận') {
      return { color: 'processing', text: status }
    }
    return { color: 'default', text: status }
  }

  const handleViewDetails = () => {
    setSelectedComponent({
      name: 'Dầu máy 5W-30',
      quantity: 5,
      origin: 'VN',
      importPrice: '120.000',
      brand: 'Castrol',
      sellingPrice: '130.000',
      vehicleModel: 'Tất cả',
      status: 'Còn hàng',
      technician: 'Đặng Thị Huyền - 0123456789'
    })
  }

=======
import React, { useState, useEffect } from 'react'
import { Table, Input, Card, Badge, Button, Space, message, Modal, Form, InputNumber, Switch } from 'antd'
import { CheckCircleOutlined, DownOutlined, UpOutlined } from '@ant-design/icons'
import WarehouseLayout from '../../layouts/WarehouseLayout'
import { warehouseAPI } from '../../services/api'

const { Search } = Input
const { TextArea } = Input

const STATUS_MAP = {
  'DRAFT': 'Bản nháp',
  'PENDING': 'Chờ xác nhận',
  'APPROVED': 'Đã duyệt',
  'REJECTED': 'Từ chối',
  'EXPORTING': 'Đang xuất hàng',
  'COMPLETED': 'Hoàn thành'
}

const ITEM_STATUS_MAP = {
  'PENDING': 'Chờ',
  'APPROVED': 'Đã xác nhận',
  'REJECTED': 'Từ chối'
}

const getStatusConfig = (status) => {
  const statusText = STATUS_MAP[status] || status
  if (status === 'PENDING' || status === 'EXPORTING') {
    return { status: 'processing', text: statusText }
  }
  if (status === 'APPROVED' || status === 'COMPLETED') {
    return { status: 'success', text: statusText }
  }
  if (status === 'REJECTED') {
    return { status: 'error', text: statusText }
  }
  return { status: 'default', text: statusText }
}

const getItemStatusConfig = (status) => {
  const statusText = ITEM_STATUS_MAP[status] || status
  if (status === 'APPROVED') {
    return { status: 'success', text: statusText }
  }
  if (status === 'REJECTED') {
    return { status: 'error', text: statusText }
  }
  return { status: 'processing', text: statusText }
}

export default function ExportRequest() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedRowKeys, setExpandedRowKeys] = useState([])
  const [reviewModalVisible, setReviewModalVisible] = useState(false)
  const [reviewingItem, setReviewingItem] = useState(null)
  const [reviewingQuotationId, setReviewingQuotationId] = useState(null)
  const [form] = Form.useForm()
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  })

  useEffect(() => {
    fetchPendingQuotations()
  }, [pagination.current, pagination.pageSize])

  const fetchPendingQuotations = async () => {
    setLoading(true)
    try {
      const { data: response, error } = await warehouseAPI.getPendingQuotations({
        page: pagination.current - 1,
        size: pagination.pageSize
      })

      if (error) {
        message.error('Không thể tải dữ liệu yêu cầu xuất hàng')
        return
      }

      if (response && response.result) {
        const result = response.result
        let content = []
        let totalElements = 0

        if (result.content && Array.isArray(result.content)) {
          content = result.content
          totalElements = result.totalElements || 0
        } else if (Array.isArray(result)) {
          content = result
          totalElements = result.length
        }

        setData(content)
        setPagination(prev => ({
          ...prev,
          total: totalElements
        }))
      }
    } catch (error) {
      message.error('Lỗi khi tải dữ liệu')
    } finally {
      setLoading(false)
    }
  }

  const handleReviewItem = (quotationId, item) => {
    setReviewingQuotationId(quotationId)
    setReviewingItem(item)
    form.setFieldsValue({
      confirmed: item.warehouseReviewStatus === 'APPROVED',
      purchasePrice: item.purchasePrice || item.unitPrice || 0,
      sellingPrice: item.sellingPrice || item.unitPrice || 0,
      warehouseNote: item.warehouseNote || ''
    })
    setReviewModalVisible(true)
  }

  const handleSubmitReview = async (values) => {
    try {
      const { error } = await warehouseAPI.reviewQuotationItem(reviewingQuotationId, {
        itemId: reviewingItem.priceQuotationItemId,
        confirmed: values.confirmed,
        purchasePrice: values.purchasePrice || 0,
        sellingPrice: values.sellingPrice || 0,
        warehouseNote: values.warehouseNote || ''
      })

      if (error) {
        message.error('Không thể cập nhật đánh giá')
        return
      }

      message.success('Cập nhật đánh giá thành công')
      setReviewModalVisible(false)
      setReviewingItem(null)
      setReviewingQuotationId(null)
      form.resetFields()
      fetchPendingQuotations()
    } catch (error) {
      message.error('Lỗi khi cập nhật đánh giá')
    }
  }

  const filteredData = searchTerm
    ? data.filter(item =>
        item.serviceTicketCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.licensePlate?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : data

>>>>>>> Stashed changes
  const columns = [
    {
      title: 'STT',
      dataIndex: 'index',
      key: 'index',
      width: 80,
<<<<<<< Updated upstream
      render: (_, __, index) => String(index + 1).padStart(2, '0')
    },
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
=======
      render: (_, __, index) => {
        const current = (pagination.current - 1) * pagination.pageSize + index + 1
        return String(current).padStart(2, '0')
      }
    },
    {
      title: 'Code',
      dataIndex: 'serviceTicketCode',
      key: 'serviceTicketCode',
>>>>>>> Stashed changes
      width: 180
    },
    {
      title: 'Dòng xe',
      dataIndex: 'vehicleModel',
      key: 'vehicleModel',
<<<<<<< Updated upstream
      width: 150
=======
      width: 150,
      render: (vehicleModel, record) => {
        if (record.items && record.items.length > 0) {
          const firstItem = record.items[0]
          return firstItem.vehicleModel || 'Mazda-v3'
        }
        return vehicleModel || 'Mazda-v3'
      }
>>>>>>> Stashed changes
    },
    {
      title: 'Người tạo',
      dataIndex: 'creator',
      key: 'creator',
<<<<<<< Updated upstream
      width: 180
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createDate',
      key: 'createDate',
      width: 150
=======
      width: 180,
      render: () => 'DT Huyền - 190'
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (date) => date ? new Date(date).toLocaleDateString('vi-VN') : '-'
>>>>>>> Stashed changes
    },
    {
      title: 'Trạng Thái',
      dataIndex: 'status',
      key: 'status',
<<<<<<< Updated upstream
      width: 180,
      render: (status) => <Badge {...getStatusConfig(status)} />
=======
      width: 200,
      render: (status, record) => (
        <Space>
          <Badge {...getStatusConfig(status)} />
          {record.items && record.items.length > 0 && (
            <span style={{ color: '#1677ff', fontSize: '12px' }}>
              {expandedRowKeys.includes(record.priceQuotationId || record.key) ? <UpOutlined /> : <DownOutlined />}
            </span>
          )}
        </Space>
      )
    }
  ]

  const partsColumns = [
    {
      title: 'STT',
      dataIndex: 'index',
      key: 'index',
      width: 60,
      render: (_, __, index) => String(index + 1).padStart(2, '0')
    },
    {
      title: 'Linh kiện',
      dataIndex: 'partName',
      key: 'partName',
      width: 250
    },
    {
      title: 'Số lượng',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      render: (qty) => String(qty || 0).padStart(2, '0')
    },
    {
      title: 'Dòng xe',
      dataIndex: 'vehicleModel',
      key: 'vehicleModel',
      width: 150,
      render: (vehicleModel, record) => {
        if (record.itemType === 'PART' && record.partId) {
          return vehicleModel || 'Universal'
        }
        return vehicleModel || 'Universal'
      }
    },
    {
      title: 'Xuất xứ',
      dataIndex: 'origin',
      key: 'origin',
      width: 150,
      render: (origin) => origin || 'VN'
    },
    {
      title: 'Trạng thái',
      dataIndex: 'warehouseReviewStatus',
      key: 'warehouseReviewStatus',
      width: 150,
      render: (status, record, index) => {
        const statusText = ITEM_STATUS_MAP[status] || 'Chờ'
        if (status === 'APPROVED') {
          return (
            <Space>
              <Badge status="success" text={statusText} />
              <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '18px' }} />
            </Space>
          )
        }
        return <Badge {...getItemStatusConfig(status)} />
      }
>>>>>>> Stashed changes
    },
    {
      title: 'Hành động',
      key: 'action',
<<<<<<< Updated upstream
      width: 150,
      render: (_, record) => (
        <Button
          type="primary"
          onClick={handleViewDetails}
          style={{
            background: record.status === 'Chờ xác nhận' ? '#52c41a' : '#1677ff',
            borderColor: record.status === 'Chờ xác nhận' ? '#52c41a' : '#1677ff'
          }}
        >
          {record.status === 'Chờ xác nhận' ? 'Xác nhận' : 'Xem'}
=======
      width: 120,
      render: (_, record) => (
        <Button
          type="link"
          onClick={() => handleReviewItem(record.quotationId || record.parentId, record)}
        >
          {record.warehouseReviewStatus === 'APPROVED' ? 'Xem' : 'Xác nhận'}
>>>>>>> Stashed changes
        </Button>
      )
    }
  ]

<<<<<<< Updated upstream
  const filteredData = exportRequests.filter(item =>
    item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.vehicleModel.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.creator.toLowerCase().includes(searchTerm.toLowerCase())
  ).map((item, index) => ({ ...item, key: item.id, index: index + 1 }))
=======
  const expandedRowRender = (record) => {
    if (!record.items || record.items.length === 0) return null

    return (
      <div style={{ padding: '16px', background: '#fafafa' }}>
        <Table
          columns={partsColumns}
          dataSource={record.items.map((item, idx) => ({
            ...item,
            key: item.priceQuotationItemId || idx,
            index: idx,
            quotationId: record.priceQuotationId,
            parentId: record.priceQuotationId
          }))}
          pagination={false}
          size="small"
        />
      </div>
    )
  }
>>>>>>> Stashed changes

  return (
    <WarehouseLayout>
      <Card
        title={<span style={{ fontSize: '20px', fontWeight: 600 }}>Phiếu yêu cầu xuất kho</span>}
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
<<<<<<< Updated upstream
          dataSource={filteredData}
          pagination={{
            current: 2,
            total: 20,
            pageSize: 10,
            showSizeChanger: false,
            showTotal: (total) => `Tổng ${total} bản ghi`,
            showQuickJumper: true
=======
          dataSource={filteredData.map((item, index) => ({ ...item, key: item.priceQuotationId || index, index }))}
          loading={loading}
          expandable={{
            expandedRowKeys,
            onExpandedRowsChange: (keys) => {
              setExpandedRowKeys(keys)
            },
            expandedRowRender,
            rowExpandable: (record) => record.items && record.items.length > 0
          }}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: searchTerm ? filteredData.length : pagination.total,
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} bản ghi`,
            onChange: (page, pageSize) => {
              setPagination(prev => ({
                ...prev,
                current: page,
                pageSize: pageSize
              }))
            },
            onShowSizeChange: (current, size) => {
              setPagination(prev => ({
                ...prev,
                current: 1,
                pageSize: size
              }))
            },
            hideOnSinglePage: false
>>>>>>> Stashed changes
          }}
          size="middle"
        />
      </Card>

<<<<<<< Updated upstream
      {selectedComponent && (
        <ComponentDetailsModal
          component={selectedComponent}
          onClose={() => setSelectedComponent(null)}
          onConfirm={() => {
            console.log('Confirmed')
            setSelectedComponent(null)
          }}
        />
      )}
=======
      <Modal
        title="ĐÁNH GIÁ LINH KIỆN"
        open={reviewModalVisible}
        onCancel={() => {
          setReviewModalVisible(false)
          setReviewingItem(null)
          setReviewingQuotationId(null)
          form.resetFields()
        }}
        footer={null}
        width={600}
      >
        {reviewingItem && (
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmitReview}
          >
            <Form.Item label="Tên linh kiện">
              <Input value={reviewingItem.partName} readOnly style={{ background: '#fafafa' }} />
            </Form.Item>

            <Form.Item label="Số lượng">
              <InputNumber value={reviewingItem.quantity} readOnly style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              label="Xác nhận"
              name="confirmed"
              valuePropName="checked"
            >
              <Switch checkedChildren="Đã xác nhận" unCheckedChildren="Chờ" />
            </Form.Item>

            <Form.Item
              label="Giá nhập"
              name="purchasePrice"
            >
              <InputNumber
                min={0}
                style={{ width: '100%' }}
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
              />
            </Form.Item>

            <Form.Item
              label="Giá bán"
              name="sellingPrice"
            >
              <InputNumber
                min={0}
                style={{ width: '100%' }}
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
              />
            </Form.Item>

            <Form.Item
              label="Ghi chú"
              name="warehouseNote"
            >
              <TextArea rows={4} placeholder="Nhập ghi chú (nếu có)" />
            </Form.Item>

            <Form.Item>
              <Space>
                <Button onClick={() => {
                  setReviewModalVisible(false)
                  form.resetFields()
                }}>
                  Hủy
                </Button>
                <Button type="primary" htmlType="submit">
                  Xác nhận
                </Button>
              </Space>
            </Form.Item>
          </Form>
        )}
      </Modal>
>>>>>>> Stashed changes
    </WarehouseLayout>
  )
}
