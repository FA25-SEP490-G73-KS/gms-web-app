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
import { SearchOutlined, PlusOutlined, CloseOutlined, UploadOutlined, FilterOutlined } from '@ant-design/icons'
import AccountanceLayout from '../../layouts/AccountanceLayout'
import { goldTableHeader } from '../../utils/tableComponents'
import { ledgerVoucherAPI, suppliersAPI, employeeAPI } from '../../services/api'
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
  const [suppliers, setSuppliers] = useState([])
  const [employees, setEmployees] = useState([])
  const [loadingSuppliers, setLoadingSuppliers] = useState(false)
  const [loadingEmployees, setLoadingEmployees] = useState(false)

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
    
    // Load data based on ticket type
    if (ticketType === 'phí linh kiện') {
      fetchSuppliers()
    } else if (ticketType === 'tiền lương') {
      fetchEmployees()
    }
  }, [ticketType, form])

  // Fetch suppliers from API
  const fetchSuppliers = async () => {
    setLoadingSuppliers(true)
    try {
      const { data: response, error } = await suppliersAPI.getAll(0, 100)
      
      if (error) {
        message.error('Không thể tải danh sách nhà cung cấp')
        setLoadingSuppliers(false)
        return
      }

      console.log('Suppliers API response:', response)
      // Suppliers API returns { content: [...] } directly
      const content = response?.content || response?.result?.content || []
      console.log('Suppliers content:', content)
      setSuppliers(content)
    } catch (err) {
      console.error('Failed to fetch suppliers:', err)
      message.error('Không thể tải danh sách nhà cung cấp')
    } finally {
      setLoadingSuppliers(false)
    }
  }

  // Fetch employees from API
  const fetchEmployees = async () => {
    setLoadingEmployees(true)
    try {
      const { data: response, error } = await employeeAPI.getAll({ page: 0, size: 100 })
      
      if (error) {
        message.error('Không thể tải danh sách nhân viên')
        setLoadingEmployees(false)
        return
      }

      // Handle response structure - could be response.result.content or directly response.content
      const content = response?.result?.content || response?.content || []
      setEmployees(content)
    } catch (err) {
      console.error('Failed to fetch employees:', err)
      message.error('Không thể tải danh sách nhân viên')
    } finally {
      setLoadingEmployees(false)
    }
  }

  useEffect(() => {
    fetchVouchers()
  }, [page, pageSize])

  const fetchVouchers = async () => {
    setLoading(true)
    try {
      const { data: response, error } = await ledgerVoucherAPI.getAll(page - 1, pageSize)
      
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
      title: <div style={{ textAlign: 'center' }}>Mã phiếu</div>,
      dataIndex: 'code',
      key: 'code',
      width: 150,
      render: (text) => <span style={{ fontWeight: 600 }}>{text}</span>
    },
    {
      title: <div style={{ textAlign: 'center' }}>Loại Phiếu</div>,
      dataIndex: 'type',
      key: 'type',
      width: 150,
      align: 'center',
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
      title: <div style={{ textAlign: 'center' }}>Đối tượng</div>,
      dataIndex: 'subject',
      key: 'subject',
      width: 200
    },
    {
      title: <div style={{ textAlign: 'center' }}>Số tiền</div>,
      dataIndex: 'amount',
      key: 'amount',
      width: 150,
      align: 'right',
      render: (value) => value.toLocaleString('vi-VN')
    },
    {
      title: <div style={{ textAlign: 'center' }}>Ngày tạo</div>,
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 140,
      align: 'center'
    },
    {
      title: <div style={{ textAlign: 'center' }}>Trạng thái</div>,
      dataIndex: 'status',
      key: 'status',
      width: 150,
      align: 'center',
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
    }
  ]

  return (
    <>
    <div style={{ padding: '24px', background: '#ffffff', minHeight: '100vh' }}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ margin: 0, marginBottom: '20px' }}>Danh sách phiếu Thu-Chi</h1>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            {/* Left side - Search */}
            <Input
              prefix={<SearchOutlined />}
              placeholder="Tìm kiếm"
              allowClear
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ width: 300 }}
            />
            
            {/* Right side - Filter buttons, Sort, and Create */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <Space>
                {STATUS_FILTERS.map((filter) => (
                  <Button
                    key={filter.key}
                    type={status === filter.key ? 'primary' : 'default'}
                    onClick={() => setStatus(filter.key)}
                    style={{
                      background: status === filter.key ? '#CBB081' : '#fff',
                      borderColor: status === filter.key ? '#CBB081' : '#d9d9d9',
                      color: status === filter.key ? '#fff' : '#666',
                      fontWeight: 500,
                      borderRadius: 6
                    }}
                  >
                    {filter.label}
                  </Button>
                ))}
              </Space>
              
              <Button
                icon={<FilterOutlined />}
                style={{ 
                  borderRadius: 6,
                  borderColor: '#d9d9d9'
                }}
              >
                Sort
              </Button>
              
              <Button
                type="primary"
                icon={<PlusOutlined />}
                style={{ 
                  background: '#22c55e', 
                  borderColor: '#22c55e', 
                  fontWeight: 600,
                  borderRadius: 6
                }}
                onClick={() => {
                  setSelectedTicketType('')
                  form.setFieldsValue({
                    type: 'phiếu thu',
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
        title={<span style={{ color: '#CBB081', fontSize: '18px', fontWeight: 600 }}>Phiếu thu chi</span>}
        open={createModalVisible}
        styles={{
          header: { marginBottom: '24px', borderBottom: '1px solid #f0f0f0', paddingBottom: '16px' }
        }}
        onCancel={() => {
          form.resetFields()
          setUploadFile(null)
          setFileList([])
          setSelectedTicketType('')
          setCreateModalVisible(false)
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              form.resetFields()
              setUploadFile(null)
              setFileList([])
              setSelectedTicketType('')
              setCreateModalVisible(false)
            }}
            style={{
              height: '40px',
              borderRadius: '8px',
              marginRight: '12px',
              background: '#ef4444',
              borderColor: '#ef4444',
              color: '#fff',
              fontWeight: 500
            }}
          >
            Hủy
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={creating}
            onClick={async () => {
              try {
                const values = await form.validateFields()
                setCreating(true)
                
                // Map loại phiếu to API enum (Vietnamese values)
                const typeMapping = {
                  'phí linh kiện': 'Thanh toán phiếu nhập kho',
                  'tiền lương': 'Tiền lương',
                  'phí dịch vụ': 'Phí dịch vụ',
                  'khác': 'Khác'
                }
                
                const payload = {
                  type: typeMapping[values.type] || 'Khác',
                  amount: Number(values.amount),
                  description: values.description || ''
                }

                // Add relatedEmployeeId or relatedSupplierId based on ticket type
                if (selectedTicketType === 'phí linh kiện') {
                  payload.relatedSupplierId = Number(values.category)
                } else if (selectedTicketType === 'tiền lương') {
                  payload.relatedEmployeeId = Number(values.category)
                } else {
                  // For text input, store as targetName (if API supports it) or in description
                  payload.targetName = values.category
                }
                
                console.log('Create voucher payload:', payload)
                const { data: response, error } = await ledgerVoucherAPI.create(payload)
                if (error) {
                  throw new Error(error)
                }
                message.success('Tạo phiếu thành công')
                form.resetFields()
                setUploadFile(null)
                setFileList([])
                setSelectedTicketType('')
                setCreateModalVisible(false)
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
            style={{
              height: '40px',
              borderRadius: '8px',
              background: '#22c55e',
              borderColor: '#22c55e',
              fontWeight: 500
            }}
          >
            Tạo phiếu
          </Button>
        ]}
        width={550}
        destroyOnClose
      >
        <Form 
          layout="vertical" 
          form={form}
        >
          <Form.Item
            name="type"
            label={<span style={{ fontWeight: 500 }}>Loại Phiếu <span style={{ color: 'red' }}>*</span></span>}
            rules={[{ required: true, message: 'Vui lòng chọn loại phiếu' }]}
          >
            <select
              className="subtext"
              style={{
                width: '100%',
                height: '40px',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                outline: 'none',
                color: '#262626',
                cursor: 'pointer',
                backgroundColor: '#fff',
                fontSize: '14px'
              }}
              onChange={(e) => {
                setSelectedTicketType(e.target.value)
                form.setFieldsValue({ category: '' })
              }}
            >
              <option value="">Chọn loại phiếu</option>
              <option value="phí linh kiện">Phí linh kiện</option>
              <option value="tiền lương">Tiền lương</option>
              <option value="phí dịch vụ">Phí dịch vụ</option>
              <option value="khác">Khác</option>
            </select>
          </Form.Item>

          <Form.Item
            name="category"
            label={<span style={{ fontWeight: 500 }}>Đối tượng <span style={{ color: 'red' }}>*</span></span>}
            rules={[{ required: true, message: 'Vui lòng nhập đối tượng' }]}
          >
            {selectedTicketType === 'phí linh kiện' ? (
              <select
                className="subtext"
                value={form.getFieldValue('category') || ''}
                onChange={(e) => form.setFieldsValue({ category: e.target.value })}
                style={{
                  width: '100%',
                  height: '40px',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  outline: 'none',
                  color: '#262626',
                  cursor: 'pointer',
                  backgroundColor: '#fff',
                  fontSize: '14px'
                }}
              >
                <option value="">Chọn nhà cung cấp</option>
                {loadingSuppliers ? (
                  <option disabled>Đang tải...</option>
                ) : (
                  suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))
                )}
              </select>
            ) : selectedTicketType === 'tiền lương' ? (
              <select
                className="subtext"
                value={form.getFieldValue('category') || ''}
                onChange={(e) => form.setFieldsValue({ category: e.target.value })}
                style={{
                  width: '100%',
                  height: '40px',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  outline: 'none',
                  color: '#262626',
                  cursor: 'pointer',
                  backgroundColor: '#fff',
                  fontSize: '14px'
                }}
              >
                <option value="">Chọn nhân viên</option>
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
            ) : (
              <Input
                disabled={!selectedTicketType}
                placeholder={selectedTicketType ? "Nhập tên đối tượng" : "Vui lòng chọn loại phiếu trước"}
                style={{
                  height: '40px',
                  borderRadius: '8px',
                  backgroundColor: selectedTicketType ? '#fff' : '#f9fafb',
                  cursor: selectedTicketType ? 'text' : 'not-allowed',
                  color: selectedTicketType ? '#262626' : '#9ca3af'
                }}
              />
            )}
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="creator"
                label={<span style={{ fontWeight: 500 }}>Người tạo <span style={{ color: 'red' }}>*</span></span>}
              >
                <Input 
                  disabled
                  style={{ 
                    background: '#f5f5f5',
                    cursor: 'not-allowed',
                    height: '40px',
                    borderRadius: '8px'
                  }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="amount"
                label={<span style={{ fontWeight: 500 }}>Số tiền <span style={{ color: 'red' }}>*</span></span>}
                rules={[
                  { required: true, message: 'Vui lòng nhập số tiền' },
                  { type: 'number', min: 1, message: 'Số tiền phải lớn hơn 0' }
                ]}
              >
                <InputNumber
                  style={{ width: '100%', height: '40px', borderRadius: '8px' }}
                  placeholder="VD: 2.000.000"
                  formatter={(value) =>
                    `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
                  }
                  parser={(value) => value?.replace(/\./g, '')}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label={<span style={{ fontWeight: 500 }}>Nội dung <span style={{ color: 'red' }}>*</span></span>}
            rules={[{ required: true, message: 'Vui lòng nhập nội dung' }]}
          >
            <Input.TextArea 
              rows={4} 
              placeholder="VD: Xe bị xì lốp"
              style={{ 
                resize: 'none',
                borderRadius: '8px'
              }}
            />
          </Form.Item>

          <Form.Item
            label={<span style={{ fontWeight: 500 }}>File đính kèm:</span>}
          >
            <Upload
              beforeUpload={(file) => {
                setUploadFile(file)
                setFileList([file])
                return false
              }}
              onRemove={() => {
                setUploadFile(null)
                setFileList([])
              }}
              fileList={fileList}
              maxCount={1}
            >
              <div style={{
                border: '2px dashed #d1d5db',
                borderRadius: '8px',
                padding: '40px 20px',
                textAlign: 'center',
                background: '#f9fafb',
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#CBB081'
                e.currentTarget.style.background = '#fefce8'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#d1d5db'
                e.currentTarget.style.background = '#f9fafb'
              }}
              >
                {fileList.length > 0 ? (
                  <div>
                    <i className="bi bi-file-earmark-pdf" style={{ fontSize: '32px', color: '#ef4444' }}></i>
                    <div style={{ marginTop: '8px', fontSize: '14px', color: '#374151' }}>
                      {fileList[0].name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
                      {(fileList[0].size / 1024).toFixed(2)} KB · {dayjs(fileList[0].lastModifiedDate).format('DD MMM YYYY')}
                    </div>
                  </div>
                ) : (
                  <div>
                    <UploadOutlined style={{ fontSize: '32px', color: '#9ca3af' }} />
                    <div style={{ marginTop: '8px', fontSize: '14px', color: '#6b7280' }}>
                      Nhấn để tải lên file
                    </div>
                  </div>
                )}
              </div>
            </Upload>
          </Form.Item>
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

