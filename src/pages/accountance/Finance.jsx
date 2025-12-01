import React, { useMemo, useState, useEffect } from 'react'
import dayjs from 'dayjs'
import {
  Table,
  Input,
  Button,
  Tag,
  Space,
  Modal,
  Form,
  InputNumber,
  Upload,
  message,
  Row,
  Col
} from 'antd'
import { SearchOutlined, PlusOutlined, CloseOutlined, UploadOutlined } from '@ant-design/icons'
import AccountanceLayout from '../../layouts/AccountanceLayout'
import { goldTableHeader } from '../../utils/tableComponents'
import { manualVoucherAPI } from '../../services/api'
import { getUserNameFromToken } from '../../utils/helpers'
import '../../styles/pages/accountance/finance.css'


const STATUS_FILTERS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'pending', label: 'Chờ duyệt' },
  { key: 'completed', label: 'Hoàn tất' },
  { key: 'rejected', label: 'Từ chối' }
]


const initialFinanceData = [
  {
    id: 1,
    code: 'PT-2025-000001',
    type: 'thu',
    subject: 'Nguyễn Văn A',
    amount: 500000,
    createdAt: '15/11/2025',
    status: 'completed'
  },
  {
    id: 2,
    code: 'PC-2025-000001',
    type: 'chi',
    subject: 'NCC',
    amount: 500000,
    createdAt: '15/11/2025',
    status: 'pending'
  },
  {
    id: 3,
    code: 'UL-2025-010001',
    type: 'ung_luong',
    subject: 'Nguyễn Văn B',
    amount: 500000,
    createdAt: '15/11/2025',
    status: 'completed'
  },
  {
    id: 4,
    code: 'PC-2025-000002',
    type: 'chi',
    subject: 'Công ty Điện lực',
    amount: 500000,
    createdAt: '15/11/2025',
    status: 'approved'
  },
  {
    id: 5,
    code: 'PT-2025-000002',
    type: 'thu',
    subject: 'Nguyễn Văn C',
    amount: 1000000,
    createdAt: '16/11/2025',
    status: 'pending'
  },
  {
    id: 6,
    code: 'PC-2025-000003',
    type: 'chi',
    subject: 'Nhà cung cấp A',
    amount: 750000,
    createdAt: '16/11/2025',
    status: 'rejected'
  }
]

const getTypeConfig = (type) => {
  const configs = {
    thu: { label: 'Thu', color: '#CBB081' },
    chi: { label: 'Chi', color: '#f97316' },
    ung_luong: { label: 'Ứng lương', color: '#fb923c' }
  }
  return configs[type] || { label: type, color: '#666' }
}

const getStatusConfig = (status) => {
  const configs = {
    completed: { label: 'Hoàn tất', color: '#22c55e', bg: '#dcfce7' },
    pending: { label: 'Chờ duyệt', color: '#3b82f6', bg: '#dbeafe' },
    rejected: { label: 'Từ chối', color: '#ef4444', bg: '#fee2e2' },
    approved: { label: 'Đã duyệt', color: '#3b82f6', bg: '#dbeafe' }
  }
  return configs[status] || { label: status, color: '#666', bg: '#f3f4f6' }
}

export function AccountanceFinanceContent() {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [uploadFile, setUploadFile] = useState(null)
  const [fileList, setFileList] = useState([])
  const [creating, setCreating] = useState(false)
  const [form] = Form.useForm()
  const [creatorName, setCreatorName] = useState('')
  const [selectedTicketType, setSelectedTicketType] = useState('')

  useEffect(() => {
    const userName = getUserNameFromToken()
    setCreatorName(userName || '')
    // Set creator in form when userName is available
    if (userName) {
      form.setFieldsValue({ creator: userName })
    }
  }, [form])

  // Watch ticket type to update category options
  const ticketType = Form.useWatch('type', form)
  
  useEffect(() => {
    setSelectedTicketType(ticketType || '')
    // Reset category when ticket type changes
    if (ticketType) {
      form.setFieldsValue({ category: '' })
    }
  }, [ticketType, form])

  // Get category options based on ticket type
  const getCategoryOptions = () => {
    if (selectedTicketType === 'Phiếu thu') {
      return [{ value: 'other', label: 'Khác' }]
    } else if (selectedTicketType === 'Phiếu chi') {
      return [
        { value: 'Nhà cung cấp', label: 'Nhà cung cấp' },
        { value: 'Tiền điện', label: 'Tiền điện' },
        { value: 'Khác', label: 'Khác' }
      ]
    }
    return []
  }

  useEffect(() => {
    fetchVouchers()
  }, [page, pageSize])

  const fetchVouchers = async () => {
    setLoading(true)
    try {
      const { data: response, error } = await manualVoucherAPI.getAll(page - 1, pageSize)
      
      if (error) {
        message.error('Không thể tải danh sách phiếu thu-chi')
        setLoading(false)
        return
      }

      const result = response?.result || {}
      const content = result.content || (Array.isArray(response?.result) ? response.result : [])
      
      // Transform API data to match UI structure
      const transformedData = content.map((item) => ({
        id: item.id || 0,
        code: item.code || 'N/A',
        type: (item.type || '').toLowerCase(),
        subject: item.targetName || 'N/A',
        amount: item.amount || 0,
        createdAt: item.createdAt ? dayjs(item.createdAt).format('DD/MM/YYYY') : 'N/A',
        status: (item.status || '').toLowerCase()
      }))

      setData(transformedData)
      setTotal(result.totalElements || content.length || 0)
    } catch (err) {
      console.error('Failed to fetch vouchers:', err)
      message.error('Đã xảy ra lỗi khi tải dữ liệu')
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    return data
      .filter((item) => {
        const matchesQuery =
          !query ||
          item.code.toLowerCase().includes(query.toLowerCase()) ||
          item.subject.toLowerCase().includes(query.toLowerCase())
        const matchesStatus =
          status === 'all' ||
          item.status === status
        return matchesQuery && matchesStatus
      })
      .map((item, index) => ({ ...item, key: item.id, index }))
  }, [data, query, status])

  const columns = [
    {
      title: 'Mã phiếu',
      dataIndex: 'code',
      key: 'code',
      width: 180,
      render: (text) => <span style={{ fontWeight: 600 }}>{text}</span>
    },
    {
      title: 'Loại Phiếu',
      dataIndex: 'type',
      key: 'type',
      width: 180,
      render: (type) => {
        const config = getTypeConfig(type)
        return (
          <Space>
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: config.color,
                display: 'inline-block'
              }}
            />
            <span>{config.label}</span>
          </Space>
        )
      }
    },
    {
      title: 'Đối tượng',
      dataIndex: 'subject',
      key: 'subject',
      width: 200
    },
    {
      title: 'Số tiền',
      dataIndex: 'amount',
      key: 'amount',
      width: 150,
      align: 'right',
      render: (value) => value.toLocaleString('vi-VN')
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 140
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 160,
      render: (status) => {
        const config = getStatusConfig(status)
        return (
          <Tag
            style={{
              background: config.bg,
              color: config.color,
              borderColor: config.color,
              borderRadius: 999,
              padding: '4px 12px',
              fontWeight: 600
            }}
          >
            {config.label}
          </Tag>
        )
      }
    },
    {
      title: '',
      key: 'action',
      width: 60,
      align: 'center',
      render: () => (
        <Button
          type="text"
          danger
          icon={<CloseOutlined />}
          style={{ padding: 0, width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        />
      )
    }
  ]

  return (
    <>
    <div style={{ padding: '24px', background: '#ffffff', minHeight: '100vh' }}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, marginBottom: '20px' }}>Danh sách phiếu Thu-Chi</h1>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <Space>
              {STATUS_FILTERS.map((filter) => (
                <Button
                  key={filter.key}
                  type={status === filter.key ? 'primary' : 'default'}
                  onClick={() => setStatus(filter.key)}
                  style={{
                    background: status === filter.key ? '#CBB081' : '#fff',
                    borderColor: status === filter.key ? '#CBB081' : '#e6e6e6',
                    color: status === filter.key ? '#111' : '#666',
                    fontWeight: 600
                  }}
                >
                  {filter.label}
                </Button>
              ))}
            </Space>
            <Input
              prefix={<SearchOutlined />}
              placeholder="Tìm kiếm"
              allowClear
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ width: 260 }}
            />
            </div>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              style={{ background: '#22c55e', borderColor: '#22c55e', fontWeight: 600 }}
              onClick={() => {
                setSelectedTicketType('')
                form.setFieldsValue({
                  type: 'THU',
                  createdAt: dayjs().format('DD/MM/YYYY'),
                  creator: creatorName || ''
                })
                setCreateModalVisible(true)
              }}
            >
              Tạo phiếu
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
            className="finance-table"
            columns={columns}
            dataSource={filtered}
            loading={loading}
            pagination={{
              current: page,
              pageSize: pageSize,
              total: total,
              showTotal: (total) => `0 of ${total} row(s) selected.`,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50', '100'],
              onChange: (newPage, newPageSize) => {
                setPage(newPage)
                setPageSize(newPageSize)
              }
            }}
            components={goldTableHeader}
            rowClassName={(_, index) => (index % 2 === 0 ? 'table-row-even' : 'table-row-odd')}
          />
        </div>
      </div>

      <Modal
        title="Tạo phiếu Thu/Chi"
        open={createModalVisible}
        styles={{
          header: { marginBottom: '16px' }
        }}
        onCancel={() => {
          form.resetFields()
          setUploadFile(null)
          setFileList([])
          setSelectedTicketType('')
          form.setFieldsValue({
            type: 'THU',
            createdAt: dayjs().format('DD/MM/YYYY'),
            creator: creatorName || ''
          })
          setCreateModalVisible(false)
        }}
        okText="Tạo phiếu"
        confirmLoading={creating}
        onOk={async () => {
          try {
            const values = await form.validateFields()
            setCreating(true)
            const payload = {
              type: values.type,
              amount: Number(values.amount),
              target: values.target,
              description: values.description,
              category: values.category || undefined
            }
            const { data: response, error } = await manualVoucherAPI.create(payload, uploadFile)
            if (error) {
              throw new Error(error)
            }
            const result = response?.result || response?.data || response
            const newRecord = {
              id: result?.id || Date.now(),
              code: result?.code || result?.voucherCode || `TMP-${Date.now()}`,
              type: (result?.type || values.type || 'thu').toLowerCase(),
              subject: result?.target || values.target,
              amount: Number(result?.amount || values.amount),
              createdAt: result?.createdAt
                ? new Date(result.createdAt).toLocaleDateString('vi-VN')
                : new Date().toLocaleDateString('vi-VN'),
              status: (result?.status || 'pending').toLowerCase()
            }
            message.success('Tạo phiếu thành công')
            form.resetFields()
            setUploadFile(null)
            setFileList([])
            setSelectedTicketType('')
            setCreateModalVisible(false)
            // Reset form với giá trị mặc định
            form.setFieldsValue({
              type: 'THU',
              createdAt: dayjs().format('DD/MM/YYYY'),
              creator: creatorName || ''
            })
            // Refresh data after creating
            fetchVouchers()
          } catch (err) {
            if (err?.errorFields) {
              return
            }
            message.error(err.message || 'Tạo phiếu thất bại')
          } finally {
            setCreating(false)
          }
        }}
        destroyOnClose
      >
        <Form 
          layout="vertical" 
          form={form} 
          initialValues={{ 
            type: 'THU',
            createdAt: dayjs().format('DD/MM/YYYY'),
            creator: creatorName || ''
          }}
        >
          <Row gutter={24} style={{ display: 'flex', alignItems: 'stretch' }}>
            {/* Left Column */}
            <Col span={12} style={{ display: 'flex', flexDirection: 'column' }}>
              <Form.Item
                name="type"
                label={<span>Loại phiếu <span style={{ color: 'red' }}>*</span></span>}
                rules={[{ required: true, message: 'Vui lòng chọn loại phiếu' }]}
              >
                <select
                  style={{
                    width: '100%',
                    height: '40px',
                    padding: '8px 12px',
                    fontSize: '14px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    outline: 'none',
                    color: '#262626',
                    cursor: 'pointer',
                    backgroundColor: '#fff',
                    transition: 'all 0.2s'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3b82f6'
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db'
                    e.target.style.boxShadow = 'none'
                  }}
                  onChange={(e) => {
                    setSelectedTicketType(e.target.value)
                    form.setFieldsValue({ category: '' })
                  }}
                >
                  <option value="">Chọn loại phiếu</option>
                  <option value="Phiếu thu">Thu</option>
                  <option value="Phiếu chi">Chi</option>
                </select>
              </Form.Item>

              <Form.Item
                name="category"
                label={<span>Danh mục <span style={{ color: 'red' }}>*</span></span>}
                rules={[{ required: true, message: 'Vui lòng chọn danh mục' }]}
              >
                <select
                  disabled={!selectedTicketType}
                  style={{
                    width: '100%',
                    height: '40px',
                    padding: '8px 12px',
                    fontSize: '14px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    outline: 'none',
                    color: selectedTicketType ? '#262626' : '#9ca3af',
                    cursor: selectedTicketType ? 'pointer' : 'not-allowed',
                    backgroundColor: selectedTicketType ? '#fff' : '#f9fafb',
                    transition: 'all 0.2s'
                  }}
                  onFocus={(e) => {
                    if (selectedTicketType) {
                      e.target.style.borderColor = '#3b82f6'
                      e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'
                    }
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db'
                    e.target.style.boxShadow = 'none'
                  }}
                >
                  <option value="">
                    {selectedTicketType ? 'Chọn danh mục' : 'Vui lòng chọn loại phiếu trước'}
                  </option>
                  {getCategoryOptions().map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Form.Item>

              <Form.Item
                name="target"
                label={<span>Đối tượng <span style={{ color: 'red' }}>*</span></span>}
                rules={[{ required: true, message: 'Vui lòng nhập đối tượng' }]}
              >
                <Input placeholder="VD: Công ty Điện lực" />
              </Form.Item>

              <Form.Item
                name="amount"
                label={<span>Số tiền <span style={{ color: 'red' }}>*</span></span>}
                rules={[
                  { required: true, message: 'Vui lòng nhập số tiền' },
                  { type: 'number', min: 1, message: 'Số tiền phải lớn hơn 0' }
                ]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="VD: 2.000.000"
                  formatter={(value) =>
                    `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
                  }
                  parser={(value) => value?.replace(/\./g, '')}
                />
              </Form.Item>
            </Col>

            {/* Right Column */}
            <Col span={12} style={{ display: 'flex', flexDirection: 'column' }}>
              <Form.Item
                name="createdAt"
                label="Ngày tạo"
              >
                <Input 
                  value={dayjs().format('DD/MM/YYYY')}
                  disabled
                  style={{ 
                    background: '#f5f5f5',
                    cursor: 'not-allowed'
                  }}
                />
              </Form.Item>

              <Form.Item
                name="creator"
                label="Người tạo"
              >
                <Input 
                  disabled
                  style={{ 
                    background: '#f5f5f5',
                    cursor: 'not-allowed'
                  }}
                />
              </Form.Item>

              <Form.Item
                name="description"
                label={<span>Nội dung <span style={{ color: 'red' }}>*</span></span>}
                rules={[{ required: true, message: 'Vui lòng nhập nội dung' }]}
                style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
              >
                <Input.TextArea 
                  rows={4} 
                  placeholder="VD: Xe bị xì lốp"
                  style={{ 
                    resize: 'none',
                    minHeight: '100px',
                    flex: 1
                  }}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </>
  )
}

export default function AccountanceFinance({ Layout = AccountanceLayout }) {
  const Wrapper = Layout || (({ children }) => <>{children}</>)
  return (
    <Wrapper>
      <AccountanceFinanceContent />
    </Wrapper>
  )
}

