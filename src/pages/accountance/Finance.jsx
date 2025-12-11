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
  Col,
  Select,
  Checkbox,
  DatePicker
} from 'antd'
import { SearchOutlined, PlusOutlined, CloseOutlined, UploadOutlined, FilterOutlined } from '@ant-design/icons'
import AccountanceLayout from '../../layouts/AccountanceLayout'
import { goldTableHeader } from '../../utils/tableComponents'
import { ledgerVoucherAPI, suppliersAPI, employeeAPI, invoiceAPI } from '../../services/api'
import { getUserNameFromToken, getEmployeeIdFromToken } from '../../utils/helpers'
import '../../styles/pages/accountance/finance.css'

const { Option } = Select


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
    'Hoàn tất': { label: 'Hoàn tất', color: '#10b981', bg: '#d1fae5' },
    'Chờ duyệt': { label: 'Chờ duyệt', color: '#3b82f6', bg: '#dbeafe' },
    'Từ chối': { label: 'Từ chối', color: '#ef4444', bg: '#fee2e2' },
    'Đã duyệt': { label: 'Đã duyệt', color: '#10b981', bg: '#d1fae5' }
  }
  return configs[status] || { label: status, color: '#666', bg: '#f3f4f6' }
}

export function AccountanceFinanceContent({ isManager = false }) {
  const [query, setQuery] = useState('')
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
  
  // Filter modal states
  const [filterModalVisible, setFilterModalVisible] = useState(false)
  const [filterForm, setFilterForm] = useState({
    statuses: [],
    types: [],
    dateRange: null,
    supplierId: null,
    employeeId: null
  })
  
  // Detail modal states
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [detailData, setDetailData] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

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

  const fetchVouchers = async (filters = {}) => {
    setLoading(true)
    try {
      // Build query params
      const params = new URLSearchParams()
      params.append('page', (page - 1).toString())
      params.append('size', pageSize.toString())
      
      if (query) {
        params.append('keyword', query)
      }
      
      if (filters.types && filters.types.length > 0) {
        // Map Vietnamese labels to API enum values
        const typeMap = {
          'Phí linh kiện': 'STOCK_RECEIPT_PAYMENT',
          'Tiền lương': 'SALARY',
          'Phí dịch vụ': 'SERVICE_FEE',
          'Khác': 'OTHER'
        }
        const apiType = typeMap[filters.types[0]]
        if (apiType) {
          params.append('type', apiType)
        }
      }
      
      if (filters.statuses && filters.statuses.length > 0) {
        // Map Vietnamese status to API enum values
        const statusMap = {
          'Chờ duyệt': 'PENDING',
          'Đã duyệt': 'APPROVED',
          'Từ chối': 'REJECTED',
          'Hoàn tất': 'FINISHED'
        }
        const apiStatus = statusMap[filters.statuses[0]]
        if (apiStatus) {
          params.append('status', apiStatus)
        }
      }
      
      if (filters.dateRange && filters.dateRange.length === 2) {
        const [fromDate, toDate] = filters.dateRange
        if (fromDate) params.append('fromDate', fromDate.format('DDMMYYYY'))
        if (toDate) params.append('toDate', toDate.format('DDMMYYYY'))
      }
      
      if (filters.supplierId) {
        params.append('supplierId', filters.supplierId.toString())
      }
      
      if (filters.employeeId) {
        params.append('employeeId', filters.employeeId.toString())
      }
      
      const queryString = params.toString()
      const url = `/ledger-vouchers?${queryString}`
      
      const { data: response, error } = await ledgerVoucherAPI.getAll(page - 1, pageSize, queryString)
      
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
        status: (item.status || '')
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
        return matchesQuery
      })
      .map((item, index) => ({ ...item, key: item.id, index }))
  }, [data, query])

  const handleFilterApply = () => {
    fetchVouchers(filterForm)
    setFilterModalVisible(false)
  }

  const handleFilterReset = () => {
    setFilterForm({
      statuses: [],
      types: [],
      dateRange: null,
      supplierId: null,
      employeeId: null
    })
  }

  const handleStatusChange = (statusVal, checked) => {
    setFilterForm(prev => ({
      ...prev,
      statuses: checked 
        ? [...prev.statuses, statusVal]
        : prev.statuses.filter(s => s !== statusVal)
    }))
  }

  const handleTypeChange = (typeVal, checked) => {
    setFilterForm(prev => ({
      ...prev,
      types: checked 
        ? [...prev.types, typeVal]
        : prev.types.filter(t => t !== typeVal)
    }))
  }

  const fetchVoucherDetail = async (id) => {
    setLoadingDetail(true)
    try {
      const { data: response, error } = await ledgerVoucherAPI.getById(id)
      
      if (error) {
        message.error('Không thể tải chi tiết phiếu')
        setLoadingDetail(false)
        return
      }

      const result = response?.result
      if (result) {
        // Map Vietnamese labels for type and status
        const typeLabels = {
          'Thanh toán phiếu nhập kho': 'Chi',
          'Thanh toán lương': 'Chi',
          'Thu từ khách hàng': 'Thu',
          'Ứng lương': 'Chi'
        }
        
        const statusLabels = {
          'Chờ duyệt': 'Chờ duyệt',
          'Hoàn tất': 'Hoàn tất',
          'Từ chối': 'Từ chối',
          'Đã duyệt': 'Đã duyệt'
        }

        setDetailData({
          id: result.id,
          code: result.code || 'N/A',
          type: typeLabels[result.type] || result.type || 'N/A',
          amount: result.amount || 0,
          target: result.relatedSupplierId ? 'NCC' : (result.relatedEmployeeId ? 'Nhân viên' : 'N/A'),
          createdAt: result.createdAt ? dayjs(result.createdAt).format('DD/MM/YYYY') : 'N/A',
          creator: 'DT Huyền', // Default since API doesn't provide
          approver: result.approvedByEmployeeId ? 'HTK Ly' : 'HTK Ly', // Default
          status: statusLabels[result.status] || result.status || 'N/A',
          description: result.description || 'N/A',
          attachmentUrl: result.attachmentUrl || null
        })
        setDetailModalVisible(true)
      }
    } catch (err) {
      console.error('Failed to fetch voucher detail:', err)
      message.error('Đã xảy ra lỗi khi tải chi tiết')
    } finally {
      setLoadingDetail(false)
    }
  }

  const handleApproveVoucher = async () => {
    if (!detailData?.id) return
    
    try {
      setLoadingDetail(true)
      const employeeId = getEmployeeIdFromToken()
      
      if (!employeeId) {
        message.error('Không tìm thấy thông tin nhân viên')
        return
      }
      
      const { data: response, error } = await ledgerVoucherAPI.approve(detailData.id, employeeId)
      
      if (error) {
        message.error('Không thể duyệt phiếu')
        return
      }
      
      message.success('Duyệt phiếu thành công')
      setDetailModalVisible(false)
      fetchVouchers(filterForm) // Refresh list
    } catch (err) {
      console.error('Failed to approve voucher:', err)
      message.error('Đã xảy ra lỗi khi duyệt phiếu')
    } finally {
      setLoadingDetail(false)
    }
  }

  const handleRejectVoucher = async () => {
    if (!detailData?.id) return
    
    try {
      setLoadingDetail(true)
      const employeeId = getEmployeeIdFromToken()
      
      if (!employeeId) {
        message.error('Không tìm thấy thông tin nhân viên')
        return
      }
      
      const { data: response, error } = await ledgerVoucherAPI.reject(detailData.id, employeeId)
      
      if (error) {
        message.error('Không thể từ chối phiếu')
        return
      }
      
      message.success('Từ chối phiếu thành công')
      setDetailModalVisible(false)
      fetchVouchers(filterForm) // Refresh list
    } catch (err) {
      console.error('Failed to reject voucher:', err)
      message.error('Đã xảy ra lỗi khi từ chối phiếu')
    } finally {
      setLoadingDetail(false)
    }
  }

  const handlePayment = async () => {
    if (!detailData?.id) return
    
    try {
      setLoadingDetail(true)
      
      // Prepare payment payload
      const payload = {
        method: "Tiền mặt", // Default payment method
        price: detailData.amount,
        type: "Chi tiền" // Payment type
      }
      
      const { data: response, error } = await invoiceAPI.pay(detailData.id, payload)
      
      if (error) {
        message.error('Không thể chi tiền')
        return
      }
      
      message.success('Chi tiền thành công')
      setDetailModalVisible(false)
      fetchVouchers(filterForm) // Refresh list
    } catch (err) {
      console.error('Failed to make payment:', err)
      message.error('Đã xảy ra lỗi khi chi tiền')
    } finally {
      setLoadingDetail(false)
    }
  }

  const handleRowClick = (record) => {
    fetchVoucherDetail(record.id)
  }

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
      align: 'center',
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
              onPressEnter={() => fetchVouchers(filterForm)}
              style={{ width: 300 }}
            />
            
            {/* Right side - Filter buttons, Sort, and Create */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <Button
                icon={<FilterOutlined />}
                onClick={() => setFilterModalVisible(true)}
                style={{ 
                  borderRadius: 6,
                  borderColor: '#d9d9d9',
                  fontWeight: 500
                }}
              >
                Bộ lọc
              </Button>
              
              {!isManager && (
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
              )}
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
            onRow={(record) => ({
              onClick: () => handleRowClick(record),
              style: { cursor: 'pointer' }
            })}
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
                  'phí linh kiện': 'Phí linh kiện',
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
            label={<span style={{ fontWeight: 500 }}>Loại Phiếu</span>}
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
            label={<span style={{ fontWeight: 500 }}>Đối tượng</span>}
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
                label={<span style={{ fontWeight: 500 }}>Người tạo</span>}
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
                label={<span style={{ fontWeight: 500 }}>Số tiền</span>}
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
            label={<span style={{ fontWeight: 500 }}>Nội dung</span>}
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

      {/* Filter Modal */}
      <Modal
        title="Bộ lọc"
        open={filterModalVisible}
        onCancel={() => setFilterModalVisible(false)}
        footer={null}
        width={450}
        styles={{
          header: {
            borderBottom: '1px solid #f0f0f0',
            marginBottom: '20px'
          }
        }}
      >
        <div style={{ padding: '20px 0' }}>
          {/* Status Filter */}
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ marginBottom: '12px', fontWeight: 600 }}>Trạng thái phiếu</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Checkbox
                checked={filterForm.statuses.includes('Chờ duyệt')}
                onChange={(e) => handleStatusChange('Chờ duyệt', e.target.checked)}
              >
                Chờ duyệt
              </Checkbox>
              <Checkbox
                checked={filterForm.statuses.includes('Hoàn tất')}
                onChange={(e) => handleStatusChange('Hoàn tất', e.target.checked)}
              >
                Đã duyệt
              </Checkbox>
              <Checkbox
                checked={filterForm.statuses.includes('Từ chối')}
                onChange={(e) => handleStatusChange('Từ chối', e.target.checked)}
              >
                Từ chối
              </Checkbox>
            </div>
          </div>

          {/* Type Filter */}
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ marginBottom: '12px', fontWeight: 600 }}>Loại phiếu</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Checkbox
                checked={filterForm.types.includes('Phí linh kiện')}
                onChange={(e) => handleTypeChange('Phí linh kiện', e.target.checked)}
              >
                Phí linh kiện
              </Checkbox>
              <Checkbox
                checked={filterForm.types.includes('Tiền lương')}
                onChange={(e) => handleTypeChange('Tiền lương', e.target.checked)}
              >
                Tiền lương
              </Checkbox>
              <Checkbox
                checked={filterForm.types.includes('Phí dịch vụ')}
                onChange={(e) => handleTypeChange('Phí dịch vụ', e.target.checked)}
              >
                Phí dịch vụ
              </Checkbox>
              <Checkbox
                checked={filterForm.types.includes('Khác')}
                onChange={(e) => handleTypeChange('Khác', e.target.checked)}
              >
                Khác
              </Checkbox>
            </div>
          </div>

          {/* Date Range Filter */}
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ marginBottom: '12px', fontWeight: 600 }}>Khoảng ngày tạo</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#666' }}>
                  Từ ngày
                </label>
                <DatePicker
                  value={filterForm.dateRange?.[0]}
                  onChange={(date) => setFilterForm(prev => ({
                    ...prev,
                    dateRange: [date, prev.dateRange?.[1] || null]
                  }))}
                  format="DD/MM/YYYY"
                  placeholder="Chọn ngày"
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#666' }}>
                  Đến ngày
                </label>
                <DatePicker
                  value={filterForm.dateRange?.[1]}
                  onChange={(date) => setFilterForm(prev => ({
                    ...prev,
                    dateRange: [prev.dateRange?.[0] || null, date]
                  }))}
                  format="DD/MM/YYYY"
                  placeholder="Chọn ngày"
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'flex-end',
            gap: '12px',
            paddingTop: '20px',
            borderTop: '1px solid #f0f0f0'
          }}>
            <Button
              onClick={handleFilterReset}
              style={{
                minWidth: 100,
                height: 40,
                borderRadius: 6,
                fontWeight: 600
              }}
            >
              Đặt lại
            </Button>
            <Button
              type="primary"
              onClick={handleFilterApply}
              style={{ 
                minWidth: 120,
                background: '#1890ff',
                height: 40,
                borderRadius: 6,
                fontWeight: 600
              }}
            >
              Tìm kiếm
            </Button>
          </div>
        </div>
      </Modal>

      {/* Detail Modal */}
      <Modal
        title={
          <div style={{ 
            background: '#CBB081', 
            margin: '-20px -24px 0 -24px',
            padding: '16px 24px',
            borderRadius: '8px 8px 0 0',
            color: '#fff',
            fontSize: '16px',
            fontWeight: 600
          }}>
            Thông tin chi tiết
          </div>
        }
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={
          isManager 
            ? (detailData?.status === 'Chờ duyệt' ? [
                <Button
                  key="reject"
                  loading={loadingDetail}
                  onClick={handleRejectVoucher}
                  style={{
                    height: '40px',
                    borderRadius: '6px',
                    background: '#ef4444',
                    borderColor: '#ef4444',
                    color: '#fff',
                    fontWeight: 500,
                    minWidth: '120px'
                  }}
                >
                  Hủy
                </Button>,
                <Button
                  key="approve"
                  type="primary"
                  loading={loadingDetail}
                  style={{
                    height: '40px',
                    borderRadius: '6px',
                    background: '#22c55e',
                    borderColor: '#22c55e',
                    fontWeight: 500,
                    minWidth: '120px'
                  }}
                  onClick={handleApproveVoucher}
                >
                  Duyệt
                </Button>
              ] : null)
            : (detailData?.status === 'Hoàn tất' ? [
                <Button
                  key="payment"
                  type="primary"
                  loading={loadingDetail}
                  style={{
                    height: '40px',
                    borderRadius: '6px',
                    background: '#22c55e',
                    borderColor: '#22c55e',
                    fontWeight: 500,
                    minWidth: '120px'
                  }}
                  onClick={handlePayment}
                >
                  Chi tiền
                </Button>
              ] : null)
        }
        width={450}
        closeIcon={
          <span style={{ color: '#fff', fontSize: '20px' }}>×</span>
        }
        styles={{
          header: {
            padding: 0,
            border: 'none',
            marginBottom: 0
          },
          body: {
            padding: '24px',
            paddingTop: '20px'
          },
          footer: {
            marginTop: 0,
            paddingTop: '16px',
            borderTop: '1px solid #f0f0f0'
          }
        }}
      >
        {loadingDetail ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div>Đang tải...</div>
          </div>
        ) : detailData ? (
          <div>
            {/* Detail Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 500, color: '#1f2937', fontSize: '14px' }}>Mã phiếu:</span>
                <span style={{ 
                  color: '#4b5563', 
                  background: '#f3f4f6', 
                  padding: '6px 16px', 
                  borderRadius: '6px',
                  fontSize: '14px'
                }}>
                  {detailData.code}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 500, color: '#1f2937', fontSize: '14px' }}>Loại phiếu:</span>
                <span style={{ 
                  color: '#4b5563', 
                  background: '#f3f4f6', 
                  padding: '6px 16px', 
                  borderRadius: '6px',
                  fontSize: '14px'
                }}>
                  {detailData.type}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 500, color: '#1f2937', fontSize: '14px' }}>Số tiền:</span>
                <span style={{ 
                  color: '#4b5563', 
                  background: '#f3f4f6', 
                  padding: '6px 16px', 
                  borderRadius: '6px',
                  fontSize: '14px'
                }}>
                  {detailData.amount.toLocaleString('vi-VN')}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 500, color: '#1f2937', fontSize: '14px' }}>Đối tượng:</span>
                <span style={{ 
                  color: '#4b5563', 
                  background: '#f3f4f6', 
                  padding: '6px 16px', 
                  borderRadius: '6px',
                  fontSize: '14px'
                }}>
                  {detailData.target}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 500, color: '#1f2937', fontSize: '14px' }}>Ngày tạo:</span>
                <span style={{ 
                  color: '#4b5563', 
                  background: '#f3f4f6', 
                  padding: '6px 16px', 
                  borderRadius: '6px',
                  fontSize: '14px'
                }}>
                  {detailData.createdAt}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 500, color: '#1f2937', fontSize: '14px' }}>Người tạo:</span>
                <span style={{ 
                  color: '#4b5563', 
                  background: '#f3f4f6', 
                  padding: '6px 16px', 
                  borderRadius: '6px',
                  fontSize: '14px'
                }}>
                  {detailData.creator}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 500, color: '#1f2937', fontSize: '14px' }}>Người duyệt:</span>
                <span style={{ 
                  color: '#4b5563', 
                  background: '#f3f4f6', 
                  padding: '6px 16px', 
                  borderRadius: '6px',
                  fontSize: '14px'
                }}>
                  {detailData.approver}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 500, color: '#1f2937', fontSize: '14px' }}>Trạng thái:</span>
                <span style={{ 
                  color: '#4b5563', 
                  background: '#f3f4f6', 
                  padding: '6px 16px', 
                  borderRadius: '6px',
                  fontSize: '14px'
                }}>
                  {detailData.status}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontWeight: 500, color: '#1f2937', fontSize: '14px' }}>Nội dung:</span>
                <div style={{ 
                  color: '#4b5563', 
                  background: '#f3f4f6', 
                  padding: '12px 16px', 
                  borderRadius: '6px',
                  minHeight: '80px',
                  fontSize: '14px',
                  lineHeight: '1.6'
                }}>
                  {detailData.description}
                </div>
              </div>

              {detailData.attachmentUrl && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontWeight: 500, color: '#1f2937', fontSize: '14px' }}>File đính kèm:</span>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px',
                    background: '#fef2f2',
                    borderRadius: '6px',
                    border: '1px solid #fecaca'
                  }}>
                    <i className="bi bi-file-earmark-pdf" style={{ fontSize: '24px', color: '#ef4444' }}></i>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', color: '#374151', fontWeight: 500 }}>File Title.pdf</div>
                      <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                        51.1 kB · 31 Aug 2022
                      </div>
                    </div>
                    <Button
                      type="link"
                      icon={<i className="bi bi-download"></i>}
                      onClick={() => window.open(detailData.attachmentUrl, '_blank')}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : null}
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

