import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Table, Input, Button, Space, Tag, Avatar, message, Modal, Form, Select, DatePicker, Checkbox, Drawer, InputNumber } from 'antd'
import { SearchOutlined, PlusOutlined, FilterOutlined, EditOutlined } from '@ant-design/icons'
import ManagerLayout from '../../../layouts/ManagerLayout'
import { goldTableHeader } from '../../../utils/tableComponents'
import { employeesAPI } from '../../../services/api'
import '../../../styles/pages/accountance/employee-list.css'
import dayjs from 'dayjs'

const STATUS_CONFIG = {
  'Đang hoạt động': { color: '#1f8f4d', bg: '#eafff5', text: 'Đang hoạt động' },
  'Nghỉ phép': { color: '#b45309', bg: '#fff7ed', text: 'Nghỉ phép' },
  'Nghỉ làm': { color: '#ef4444', bg: '#fef2f2', text: 'Nghỉ làm' }
}

const statusFilters = [
  { key: 'all', label: 'Tất cả' },
  { key: 'Đang hoạt động', label: 'Đang hoạt động' },
  { key: 'Nghỉ làm', label: 'Nghỉ làm' },
  { key: 'Nghỉ phép', label: 'Nghỉ phép' }
]

const fallbackEmployees = [
  {
    id: 1,
    name: 'Hoàng Thị Khánh Ly',
    phone: '0919866874',
    salary: 200000,
    department: '—',
    position: 'Kế toán',
    joinDate: '23/2/2025',
    status: 'Đang hoạt động',
    avatar: '/image/avatar-1.png'
  },
  {
    id: 2,
    name: 'Nguyễn Văn Minh',
    phone: '0913336432',
    salary: 200000,
    department: '—',
    position: 'Kỹ thuật viên',
    joinDate: '23/2/2025',
    status: 'Đang hoạt động',
    avatar: '/image/avatar-2.png'
  },
  {
    id: 3,
    name: 'Phạm Văn B',
    phone: '0123456789',
    salary: 200000,
    department: '—',
    position: 'Nhân viên kho',
    joinDate: '23/2/2025',
    status: 'Đang hoạt động'
  },
  {
    id: 4,
    name: 'Lê Thị C',
    phone: '0987623455',
    salary: 200000,
    department: '—',
    position: 'Kế toán',
    joinDate: '23/2/2025',
    status: 'Nghỉ phép'
  }
]

const formatEmployee = (employee, index) => {
  const safeNumber = (value) => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
      return 0
    }
    return Number(value)
  }
  
  // Format date from API (hireDate)
  const rawDate = employee.hireDate || employee.joinDate || employee.startDate || employee.createdAt
  const joinDate = (() => {
    if (!rawDate) return '—'
    const date = new Date(rawDate)
    if (Number.isNaN(date.getTime())) return rawDate
    return date.toLocaleDateString('vi-VN')
  })()

  // Map status: true -> "Đang hoạt động", false -> "Nghỉ làm"
  const getStatusLabel = () => {
    if (employee.active !== undefined) {
      return employee.active ? 'Đang hoạt động' : 'Nghỉ làm'
    }
    if (employee.status !== undefined) {
      // Handle boolean status
      if (typeof employee.status === 'boolean') {
        return employee.status ? 'Đang hoạt động' : 'Nghỉ làm'
      }
      // Handle string status (fallback)
      return employee.status === 'Đang hoạt động' || employee.status === 'Đang làm việc' ? 'Đang hoạt động' : 'Nghỉ làm'
    }
    return 'Đang hoạt động' // Default
  }

  return {
    id: employee.employeeId || employee.id || `emp-${index}`,
    name: employee.fullName || employee.name || 'Không rõ',
    phone: employee.phone || employee.phoneNumber || employee.contactNumber || '—',
    salary: safeNumber(employee.dailySalary || employee.salary || employee.baseSalary || 0),
    department: employee.department || employee.departmentName || '—',
    position: employee.role || employee.position || employee.jobTitle || '—',
    joinDate,
    status: getStatusLabel(),
    avatar: employee.avatarUrl || employee.avatar || undefined
  }
}

export default function EmployeeListForManager() {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [employees, setEmployees] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [addModalVisible, setAddModalVisible] = useState(false)
  const [filterDrawerVisible, setFilterDrawerVisible] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const didInit = useRef(false)
  const [form] = Form.useForm()
  const [addForm] = Form.useForm()
  
  // Filter states
  const [filterStatus, setFilterStatus] = useState([])
  const [filterRole, setFilterRole] = useState([])
  const [filterDateFrom, setFilterDateFrom] = useState(null)
  const [filterDateTo, setFilterDateTo] = useState(null)

  const fetchEmployees = useCallback(
    async (pageIndex = 0, size = 10) => {
      setLoading(true)
      try {
        const { data, error } = await employeesAPI.getAll(pageIndex, size)
        if (error) throw new Error(error)
        const payload = data?.result || data?.data || data
        const list = Array.isArray(payload)
          ? payload
          : payload?.content || payload?.items || payload?.records || []
        setEmployees(list.map((item, idx) => formatEmployee(item, idx)))
        setTotal(payload?.totalElements || payload?.total || payload?.totalItems || list.length)
        setPage(pageIndex + 1)
        setPageSize(size)
      } catch (err) {
        message.error(err.message || 'Không thể tải danh sách nhân viên')
        setEmployees(fallbackEmployees)
        setTotal(fallbackEmployees.length)
        setPage(1)
        setPageSize(10)
      } finally {
        setLoading(false)
      }
    },
    []
  )

  useEffect(() => {
    if (!didInit.current) {
      fetchEmployees(0, pageSize)
      didInit.current = true
    }
  }, [fetchEmployees, pageSize])

  const fetchEmployeeDetail = async (employeeId) => {
    setLoadingDetail(true)
    try {
      const { data, error } = await employeesAPI.getById(employeeId)
      if (error) throw new Error(error)
      const employee = data?.result || data
      setSelectedEmployee(employee)
      // Map status: true -> "true", false -> "false" for dropdown
      let activeValue = true // Default
      if (employee.active !== undefined) {
        activeValue = employee.active
      } else if (employee.status !== undefined) {
        // Handle boolean status
        if (typeof employee.status === 'boolean') {
          activeValue = employee.status
        } else {
          // Handle string status (fallback)
          activeValue = employee.status === 'Đang hoạt động' || employee.status === 'Đang làm việc'
        }
      }
      
      form.setFieldsValue({
        fullName: employee.fullName,
        phone: employee.phone,
        position: employee.position,
        dailySalary: employee.dailySalary,
        hireDate: employee.hireDate ? dayjs(employee.hireDate) : null,
        terminationDate: employee.terminationDate ? dayjs(employee.terminationDate) : null,
        active: String(activeValue),
        province: employee.province,
        ward: employee.ward,
        addressDetail: employee.addressDetail
      })
      setEditModalVisible(true)
    } catch (err) {
      message.error(err.message || 'Không thể tải thông tin nhân viên')
    } finally {
      setLoadingDetail(false)
    }
  }

  const handleEdit = (record) => {
    fetchEmployeeDetail(record.id)
  }

  const handleCloseModal = () => {
    setEditModalVisible(false)
    setIsEditing(false)
    setSelectedEmployee(null)
    form.resetFields()
  }

  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      
      // Prepare payload for API according to the API structure
      const payload = {
        active: values.active === 'true' || values.active === true,
        addressDetail: values.addressDetail || '',
        dailySalary: Number(values.dailySalary) || 0,
        fullName: values.fullName,
        hireDate: values.hireDate ? values.hireDate.toISOString() : null,
        phone: values.phone,
        position: values.position,
        province: values.province || '',
        terminationDate: values.terminationDate ? values.terminationDate.toISOString() : null,
        ward: values.ward || ''
      }

      const employeeId = selectedEmployee.employeeId || selectedEmployee.id
      const { error } = await employeesAPI.update(employeeId, payload)
      
      if (error) {
        throw new Error(error)
      }

      message.success('Cập nhật nhân viên thành công')
      handleCloseModal()
      fetchEmployees(page - 1, pageSize)
    } catch (err) {
      if (!err?.errorFields) {
        message.error(err.message || 'Cập nhật nhân viên thất bại')
      }
    }
  }

  const handleAddEmployee = () => {
    addForm.resetFields()
    setAddModalVisible(true)
  }

  const handleCloseAddModal = () => {
    setAddModalVisible(false)
    addForm.resetFields()
  }

  const handleCreateEmployee = async () => {
    try {
      const values = await addForm.validateFields()
      
      // Prepare payload for API
      const payload = {
        fullName: values.fullName,
        phone: values.phone,
        role: values.role,
        dailySalary: Number(values.dailySalary),
        startDate: values.startDate ? values.startDate.toISOString() : null,
        endDate: values.endDate ? values.endDate.toISOString() : null,
        city: values.city || '',
        ward: values.ward || '',
        detailAddress: values.detailAddress || '',
        dateOfBirth: values.dateOfBirth ? values.dateOfBirth.format('YYYY-MM-DD') : null,
        gender: values.gender || ''
      }

      const { error } = await employeesAPI.create(payload)
      
      if (error) {
        throw new Error(error)
      }

      message.success('Thêm nhân viên thành công')
      handleCloseAddModal()
      fetchEmployees(page - 1, pageSize)
    } catch (err) {
      if (!err?.errorFields) {
        message.error(err.message || 'Thêm nhân viên thất bại')
      }
    }
  }

  const handleOpenFilterDrawer = () => {
    setFilterDrawerVisible(true)
  }

  const handleCloseFilterDrawer = () => {
    setFilterDrawerVisible(false)
  }

  const handleApplyFilter = () => {
    // Apply filters and close drawer
    setFilterDrawerVisible(false)
    fetchEmployees(0, pageSize)
  }

  const handleResetFilter = () => {
    setFilterStatus([])
    setFilterRole([])
    setFilterDateFrom(null)
    setFilterDateTo(null)
  }

  const filtered = useMemo(() => {
    return employees
      .filter((emp) => {
        const matchesQuery =
          !query ||
          emp.name.toLowerCase().includes(query.toLowerCase()) ||
          emp.phone.includes(query)
        const matchesStatus = status === 'all' || emp.status === status
        
        // Apply additional filters from drawer
        const matchesFilterStatus = filterStatus.length === 0 || filterStatus.includes(emp.status)
        const matchesFilterRole = filterRole.length === 0 || filterRole.includes(emp.position)
        
        let matchesDateRange = true
        if (filterDateFrom || filterDateTo) {
          const empDate = dayjs(emp.joinDate, 'DD/MM/YYYY')
          if (filterDateFrom && empDate.isBefore(filterDateFrom, 'day')) {
            matchesDateRange = false
          }
          if (filterDateTo && empDate.isAfter(filterDateTo, 'day')) {
            matchesDateRange = false
          }
        }
        
        return matchesQuery && matchesStatus && matchesFilterStatus && matchesFilterRole && matchesDateRange
      })
      .map((emp, index) => ({ ...emp, key: emp.id, index: index + 1 }))
  }, [employees, query, status, filterStatus, filterRole, filterDateFrom, filterDateTo])

  const columns = [
    {
      title: 'STT',
      dataIndex: 'index',
      key: 'index',
      width: 70,
      render: (_, __, index) => <span style={{ fontWeight: 600 }}>{String(index + 1).padStart(2, '0')}</span>
    },
    {
      title: 'Họ Tên',
      dataIndex: 'name',
      key: 'name',
      width: 220,
      render: (_, record) => (
        <div className="employee-name-cell">
          <Avatar size={40} src={record.avatar}>
            {record.name.split(' ').slice(-1).join('').charAt(0)}
          </Avatar>
          <div>
            <div className="emp-name">{record.name}</div>
            <div className="emp-phone">{record.phone}</div>
          </div>
        </div>
      )
    },
    {
      title: 'Lương cơ bản',
      dataIndex: 'salary',
      key: 'salary',
      width: 160,
      render: (value) => <span style={{ fontWeight: 600 }}>{value.toLocaleString('vi-VN')} đ</span>
    },
    {
      title: 'Phòng ban',
      dataIndex: 'department',
      key: 'department',
      width: 140,
      render: (text) => <Tag className="department-tag">{text}</Tag>
    },
    {
      title: 'Chức vụ',
      dataIndex: 'position',
      key: 'position',
      width: 160
    },
    {
      title: 'Ngày tham gia',
      dataIndex: 'joinDate',
      key: 'joinDate',
      width: 140
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 150,
      render: (value) => {
        const config = STATUS_CONFIG[value] || STATUS_CONFIG['Đang hoạt động']
        return (
          <Tag
            style={{
              color: config.color,
              background: config.bg,
              borderColor: config.color,
              borderRadius: 999,
              fontWeight: 600,
              padding: '4px 12px'
            }}
          >
            {config.text}
          </Tag>
        )
      }
    },
    {
      title: '',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <Space>
          <Button 
            type="text" 
            size="small" 
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            loading={loadingDetail}
          />
        </Space>
      )
    }
  ]

  return (
    <ManagerLayout>
      <div style={{ padding: 24, minHeight: '100vh' }}>
        <div
          style={{
            background: '#fff',
            borderRadius: 20,
            padding: 24,
            boxShadow: '0 20px 45px rgba(15,23,42,0.08)',
          }}
        >
          <div className="employee-header" style={{ marginBottom: 24 }}>
            <h2>Danh sách nhân sự</h2>
            <p style={{ color: '#98a2b3', margin: 0 }}>Theo dõi trạng thái và thông tin nhân viên</p>
          </div>

          <div className="employee-filters" style={{ gap: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Input
                prefix={<SearchOutlined />}
                placeholder="Tìm kiếm"
                allowClear
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="employee-search"
              style={{ width: 300 }}
              />
            <div className="employee-actions" style={{ display: 'flex', gap: 12 }}>
              <Button type="primary" icon={<PlusOutlined />} className="add-btn" onClick={handleAddEmployee}>
                Thêm nhân viên
              </Button>
              <Button icon={<FilterOutlined />} className="sort-btn" onClick={handleOpenFilterDrawer}>
                Bộ lọc
              </Button>
            </div>
          </div>

          <div className="employee-table-card" style={{ borderRadius: 16 }}>
            <div className="table-title">Danh sách</div>
            <Table
              className="employee-table"
              columns={columns}
              dataSource={filtered}
              loading={loading}
              pagination={{
                current: page,
                pageSize,
                total,
                showSizeChanger: true,
                showTotal: (t) => `0 trong số ${t} hàng đã chọn.`,
                pageSizeOptions: ['10', '20', '50', '100'],
                onChange: (current, size) => {
                  fetchEmployees(current - 1, size)
                }
              }}
              components={goldTableHeader}
            />
          </div>
        </div>
      </div>

      {/* Edit Employee Modal */}
      <Modal
        open={editModalVisible}
        onCancel={handleCloseModal}
        width={960}
        footer={null}
        closable={false}
        styles={{
          header: { display: 'none' },
          body: { padding: 0, background: '#fff' },
          content: { padding: 0, borderRadius: 12, overflow: 'hidden', background: '#fff' },
        }}
      >
        <div
          style={{
          background: '#CBB081', 
          padding: '20px 24px', 
            borderRadius: '12px 12px 0 0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h2 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: '#000' }}>Thông tin nhân viên</h2>
          <Button type="text" onClick={handleCloseModal} style={{ fontSize: 22, color: '#000' }} aria-label="Đóng">
            ×
          </Button>
          </div>

        <div style={{ padding: '32px 36px 28px 36px', background: '#fff' }}>
          <Form form={form} layout="vertical">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 28 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <Form.Item label="Tên nhân viên" name="fullName" rules={[{ required: true, message: 'Vui lòng nhập tên nhân viên' }]}>
                  <Input placeholder="Nguyễn Văn A" disabled={!isEditing} style={{ background: '#fff', borderRadius: 10, height: 48 }} />
                </Form.Item>
            <Form.Item
                  label="Số điện thoại"
              name="phone"
                  rules={[
                    { required: true, message: 'Vui lòng nhập số điện thoại' },
                    { pattern: /^0\d{9}$/, message: 'Số điện thoại phải bắt đầu bằng 0 và đủ 10 số' }
                  ]}
            >
                  <Input placeholder="0987654321" disabled={!isEditing} style={{ background: '#fff', borderRadius: 10, height: 48 }} />
            </Form.Item>
                <Form.Item label="Chức vụ" name="position" rules={[{ required: true, message: 'Vui lòng nhập chức vụ' }]}>
                  <Input placeholder="Kỹ thuật viên" disabled={!isEditing} style={{ background: '#fff', borderRadius: 10, height: 48 }} />
                </Form.Item>
                <Form.Item label="Lương cơ bản" name="dailySalary" rules={[{ required: true, message: 'Vui lòng nhập lương' }]}>
                  <InputNumber
                    placeholder="10.000.000"
                disabled={!isEditing}
                    style={{ background: '#fff', borderRadius: 10, height: 48, width: '100%' }}
                    formatter={(value) => {
                      if (!value) return ''
                      const onlyDigits = `${value}`.replace(/\D/g, '')
                      return onlyDigits.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
                    }}
                    parser={(value) => (value ? value.replace(/\./g, '') : '')}
                    controls={false}
                    onKeyPress={(e) => {
                      if (!/[0-9]/.test(e.key)) e.preventDefault()
                }}
                    min={0}
              />
            </Form.Item>
          </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <Form.Item label="Tỉnh thành" name="province" rules={[{ required: true, message: 'Vui lòng nhập tỉnh thành' }]}>
                  <Input disabled={!isEditing} style={{ background: '#fff', borderRadius: 10, height: 48 }} />
            </Form.Item>
                <Form.Item label="Phường xã" name="ward">
                  <Input disabled={!isEditing} style={{ background: '#fff', borderRadius: 10, height: 48 }} />
            </Form.Item>
                <Form.Item label="Địa chỉ chi tiết" name="addressDetail">
                  <Input placeholder="Trung tâm thạch thất" disabled={!isEditing} style={{ background: '#fff', borderRadius: 10, height: 48 }} />
                </Form.Item>
                <Form.Item label="Trạng thái" name="active" rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}>
                  <Select placeholder="Đang làm việc" disabled={!isEditing} style={{ borderRadius: 10, height: 48 }}>
                    <Select.Option value="true">Đang làm việc</Select.Option>
                    <Select.Option value="false">Nghỉ làm</Select.Option>
                  </Select>
            </Form.Item>
              </div>
          </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 20, marginTop: 18 }}>
              <Form.Item label="Ngày bắt đầu" name="hireDate">
                <DatePicker style={{ width: '100%', borderRadius: 10, height: 48 }} format="DD/MM/YYYY" placeholder="11/10/2025" disabled={!isEditing} />
            </Form.Item>
              <Form.Item label="Ngày kết thúc" name="terminationDate">
                <DatePicker style={{ width: '100%', borderRadius: 10, height: 48 }} format="DD/MM/YYYY" placeholder="11/10/2025" disabled={!isEditing} />
            </Form.Item>
          </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 28 }}>
              <Button 
                type="primary"
                onClick={() => {
                  if (!isEditing) {
                    setIsEditing(true)
                    return
                  }
                  handleSave()
                }}
                style={{
                  background: '#CBB081',
                  borderColor: '#CBB081',
                  borderRadius: 10,
                  padding: '10px 34px',
                  height: 'auto',
                  fontSize: 16,
                  fontWeight: 600,
                  color: '#000',
                }}
              >
                {isEditing ? 'Lưu' : 'Chỉnh sửa'}
              </Button>
          </div>
        </Form>
        </div>
      </Modal>

      {/* Add Employee Modal */}
      <Modal
        open={addModalVisible}
        onCancel={handleCloseAddModal}
        width={960}
        footer={null}
        closable={false}
        styles={{
          header: { display: 'none' },
          body: { padding: 0, background: '#fff' },
          content: { padding: 0, borderRadius: 12, overflow: 'hidden', background: '#fff' },
        }}
      >
        <div
          style={{
          background: '#CBB081', 
          padding: '20px 24px', 
            borderRadius: '12px 12px 0 0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h2 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: '#000' }}>Thêm thông tin nhân viên</h2>
          <Button type="text" onClick={handleCloseAddModal} style={{ fontSize: 22, color: '#000' }} aria-label="Đóng">
            ×
          </Button>
        </div>

        <div style={{ padding: '32px 36px 28px 36px', background: '#fff' }}>
        <Form
          form={addForm}
          layout="vertical"
        >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 28 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <Form.Item
                  label="Tên nhân viên"
              name="fullName"
              rules={[{ required: true, message: 'Vui lòng nhập tên nhân viên' }]}
            >
              <Input 
                    placeholder="Nguyễn Văn A" 
                    style={{ background: '#fff', borderRadius: 10, height: 48 }}
              />
            </Form.Item>

            <Form.Item
                  label="Số điện thoại"
                  name="phone"
                  rules={[
                    { required: true, message: 'Vui lòng nhập số điện thoại' },
                    { pattern: /^0\d{9}$/, message: 'Số điện thoại phải bắt đầu bằng 0 và đủ 10 số' }
                  ]}
            >
              <Input 
                    placeholder="0987654321" 
                    style={{ background: '#fff', borderRadius: 10, height: 48 }}
              />
            </Form.Item>

            <Form.Item
                  label="Chức vụ"
                  name="role"
                  rules={[{ required: true, message: 'Vui lòng chọn chức vụ' }]}
            >
                  <Select 
                    placeholder="Kỹ thuật viên" 
                    style={{ borderRadius: 10, height: 48 }}
                  >
                    <Select.Option value="TECHNICIAN">Kỹ thuật viên</Select.Option>
                    <Select.Option value="ACCOUNTANT">Kế toán</Select.Option>
                    <Select.Option value="MANAGER">Quản lý</Select.Option>
                    <Select.Option value="SERVICE_ADVISOR">Cố vấn dịch vụ</Select.Option>
                    <Select.Option value="WAREHOUSE">Nhân viên kho</Select.Option>
                  </Select>
            </Form.Item>

            <Form.Item
                  label="Lương cơ bản"
                  name="dailySalary"
                  rules={[{ required: true, message: 'Vui lòng nhập lương' }]}
            >
                  <InputNumber
                    placeholder="10.000.000"
                    style={{ background: '#fff', borderRadius: 10, height: 48, width: '100%' }}
                    formatter={(value) => {
                      if (!value) return ''
                      const onlyDigits = `${value}`.replace(/\D/g, '')
                      return onlyDigits.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
                    }}
                    parser={(value) => (value ? value.replace(/\./g, '') : '')}
                    controls={false}
                    onKeyPress={(e) => {
                      if (!/[0-9]/.test(e.key)) e.preventDefault()
                    }}
                    min={0}
              />
            </Form.Item>
          </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <Form.Item
                  label="Tỉnh thành"
                  name="city"
                  rules={[{ required: true, message: 'Vui lòng nhập tỉnh thành' }]}
            >
                  <Input 
                    placeholder="Hà Nội" 
                    style={{ background: '#fff', borderRadius: 10, height: 48 }}
              />
            </Form.Item>

            <Form.Item
                  label="Phường xã"
                  name="ward"
            >
                  <Input 
                    placeholder="Thạch Thất" 
                    style={{ background: '#fff', borderRadius: 10, height: 48 }}
              />
            </Form.Item>

            <Form.Item
                  label="Địa chỉ chi tiết"
                  name="detailAddress"
            >
              <Input 
                    placeholder="Trung tâm thạch thất" 
                    style={{ background: '#fff', borderRadius: 10, height: 48 }}
              />
            </Form.Item>

            <Form.Item
              label="Ngày sinh"
              name="dateOfBirth"
            >
              <DatePicker 
                    style={{ width: '100%', borderRadius: 10, height: 48 }} 
                format="DD/MM/YYYY"
                placeholder="01/01/1990"
              />
            </Form.Item>
              </div>
          </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 20, marginTop: 18 }}>
              <Form.Item label="Ngày bắt đầu" name="startDate">
                <DatePicker style={{ width: '100%', borderRadius: 10, height: 48 }} format="DD/MM/YYYY" placeholder="11/10/2025" />
              </Form.Item>
              <Form.Item label="Ngày kết thúc" name="endDate">
                <DatePicker style={{ width: '100%', borderRadius: 10, height: 48 }} format="DD/MM/YYYY" placeholder="11/10/2025" />
              </Form.Item>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 28 }}>
            <Button 
              type="primary"
              onClick={handleCreateEmployee}
              style={{
                  background: '#CBB081',
                  borderColor: '#CBB081',
                  borderRadius: 10,
                  padding: '10px 34px',
                height: 'auto',
                fontSize: 16,
                  fontWeight: 600,
                  color: '#000',
              }}
            >
              Tạo
            </Button>
          </div>
        </Form>
        </div>
      </Modal>

      {/* Filter Modal */}
      <Modal
        title="Bộ lọc"
        open={filterDrawerVisible}
        onCancel={handleCloseFilterDrawer}
        width={420}
        footer={
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <Button 
              onClick={handleResetFilter}
              style={{
                borderRadius: 8,
                height: 40,
                padding: '0 24px'
              }}
            >
              Đặt lại
            </Button>
          <Button 
            onClick={handleApplyFilter}
            type="primary"
            style={{
              background: '#3b82f6',
              borderColor: '#3b82f6',
                borderRadius: 8,
                height: 40,
                padding: '0 24px'
            }}
          >
            Tìm kiếm
          </Button>
          </div>
        }
      >
        <div style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 8, fontSize: 14, fontWeight: 500 }}>Trạng thái</div>
          <Checkbox.Group 
            value={filterStatus}
            onChange={setFilterStatus}
            style={{ display: 'flex', flexDirection: 'column', gap: 6 }}
          >
            <Checkbox value="Đang hoạt động">Đang hoạt động</Checkbox>
            <Checkbox value="Nghỉ làm">Nghỉ làm</Checkbox>
          </Checkbox.Group>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 8, fontSize: 14, fontWeight: 500 }}>Chức vụ</div>
          <Checkbox.Group 
            value={filterRole}
            onChange={setFilterRole}
            style={{ display: 'flex', flexDirection: 'column', gap: 6 }}
          >
            <Checkbox value="Kỹ thuật viên">Kỹ thuật viên</Checkbox>
            <Checkbox value="Cố vấn dịch vụ">Cố vấn dịch vụ</Checkbox>
            <Checkbox value="Kế toán">Kế toán</Checkbox>
            <Checkbox value="Nhân viên kho">Nhân viên kho</Checkbox>
          </Checkbox.Group>
        </div>

        <div>
          <div style={{ marginBottom: 8, fontSize: 14, fontWeight: 500 }}>Ngày tham gia</div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <div style={{ marginBottom: 4, fontSize: 13, color: '#666' }}>Từ ngày</div>
              <DatePicker 
                value={filterDateFrom}
                onChange={setFilterDateFrom}
                format="DD/MM/YYYY"
                placeholder="Chọn ngày"
                style={{ width: '100%' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ marginBottom: 4, fontSize: 13, color: '#666' }}>Đến ngày</div>
              <DatePicker 
                value={filterDateTo}
                onChange={setFilterDateTo}
                format="DD/MM/YYYY"
                placeholder="Chọn ngày"
                style={{ width: '100%' }}
              />
            </div>
          </div>
        </div>
      </Modal>
    </ManagerLayout>
  )
}

