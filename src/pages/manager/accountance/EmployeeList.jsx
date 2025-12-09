import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Table, Input, Button, Space, Tag, Avatar, message, Modal, Form, Select, DatePicker, Checkbox, Drawer } from 'antd'
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

  return {
    id: employee.employeeId || employee.id || `emp-${index}`,
    name: employee.fullName || employee.name || 'Không rõ',
    phone: employee.phone || employee.phoneNumber || employee.contactNumber || '—',
    salary: safeNumber(employee.dailySalary || employee.salary || employee.baseSalary || 0),
    department: employee.department || employee.departmentName || '—',
    position: employee.role || employee.position || employee.jobTitle || '—',
    joinDate,
    status: employee.status || 'Đang hoạt động',
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
      form.setFieldsValue({
        fullName: employee.fullName,
        phone: employee.phone,
        position: employee.position,
        dailySalary: employee.dailySalary,
        hireDate: employee.hireDate ? dayjs(employee.hireDate) : null,
        terminationDate: employee.terminationDate ? dayjs(employee.terminationDate) : null,
        status: employee.status,
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
      
      // Prepare payload for API
      const payload = {
        fullName: values.fullName,
        phone: values.phone,
        position: values.position,
        dailySalary: Number(values.dailySalary),
        hireDate: values.hireDate ? values.hireDate.toISOString() : null,
        terminationDate: values.terminationDate ? values.terminationDate.toISOString() : null,
        status: values.status,
        province: values.province || '',
        ward: values.ward || '',
        addressDetail: values.addressDetail || ''
      }

      const { error } = await employeesAPI.update(selectedEmployee.employeeId, payload)
      
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
          <Button type="text" size="small" danger icon={<i className="bi bi-trash3" />} />
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

          <div className="employee-filters" style={{ gap: 16 }}>
            <div className="status-filters">
              {statusFilters.map((item) => (
                <Button
                  key={item.key}
                  type={status === item.key ? 'primary' : 'default'}
                  onClick={() => setStatus(item.key)}
                  className={status === item.key ? 'status-btn active' : 'status-btn'}
                >
                  {item.label}
                </Button>
              ))}
            </div>
            <div className="employee-actions">
              <Input
                prefix={<SearchOutlined />}
                placeholder="Tìm kiếm"
                allowClear
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="employee-search"
              />
              <Button type="primary" icon={<PlusOutlined />} className="add-btn" onClick={handleAddEmployee}>
                Thêm nhân viên
              </Button>
              <Button icon={<FilterOutlined />} className="sort-btn" onClick={handleOpenFilterDrawer}>
                Sort
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
                showTotal: (t) => `0 of ${t} row(s) selected.`,
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
        width={900}
        footer={null}
        closeIcon={<span style={{ fontSize: 24 }}>×</span>}
        styles={{
          header: {
            background: '#CBB081',
            padding: '20px 24px',
            marginBottom: 0
          },
          body: {
            padding: '32px 24px'
          }
        }}
      >
        <div style={{ 
          background: '#CBB081', 
          padding: '20px 24px', 
          margin: '-20px -24px 24px -24px',
          textAlign: 'center'
        }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: '#000' }}>
            Thông tin nhân viên
          </h2>
        </div>

        <Form
          form={form}
          layout="vertical"
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <Form.Item
              label={<span>Tên nhân viên <span style={{ color: 'red' }}>*</span></span>}
              name="fullName"
              rules={[{ required: true, message: 'Vui lòng nhập tên nhân viên' }]}
            >
              <Input 
                placeholder="Nguyễn Văn A" 
                disabled={!isEditing}
                style={{ 
                  background: isEditing ? '#fff' : '#f5f5f5',
                  borderRadius: 8
                }}
              />
            </Form.Item>

            <Form.Item
              label={<span>Tỉnh thành <span style={{ color: 'red' }}>*</span></span>}
              name="province"
              rules={[{ required: true, message: 'Vui lòng nhập tỉnh thành' }]}
            >
              <Input 
                disabled={!isEditing}
                style={{ 
                  background: isEditing ? '#fff' : '#f5f5f5',
                  borderRadius: 8
                }}
              />
            </Form.Item>

            <Form.Item
              label="Phường xã"
              name="ward"
            >
              <Input 
                disabled={!isEditing}
                style={{ 
                  background: isEditing ? '#fff' : '#f5f5f5',
                  borderRadius: 8
                }}
              />
            </Form.Item>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
            <Form.Item
              label={<span>Số điện thoại <span style={{ color: 'red' }}>*</span></span>}
              name="phone"
              rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }]}
            >
              <Input 
                placeholder="0987654321" 
                disabled={!isEditing}
                style={{ 
                  background: isEditing ? '#fff' : '#f5f5f5',
                  borderRadius: 8
                }}
              />
            </Form.Item>

            <Form.Item
              label="Địa chỉ chi tiết"
              name="addressDetail"
            >
              <Input 
                placeholder="Trung tâm thạch thất" 
                disabled={!isEditing}
                style={{ 
                  background: isEditing ? '#fff' : '#f5f5f5',
                  borderRadius: 8
                }}
              />
            </Form.Item>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <Form.Item
              label={<span>Chức vụ <span style={{ color: 'red' }}>*</span></span>}
              name="position"
              rules={[{ required: true, message: 'Vui lòng nhập chức vụ' }]}
            >
              <Input 
                placeholder="Kỹ thuật viên" 
                disabled={!isEditing}
                style={{ 
                  background: isEditing ? '#fff' : '#f5f5f5',
                  borderRadius: 8
                }}
              />
            </Form.Item>

            <Form.Item
              label="Ngày bắt đầu"
              name="hireDate"
            >
              <DatePicker 
                style={{ 
                  width: '100%',
                  background: isEditing ? '#fff' : '#f5f5f5',
                  borderRadius: 8
                }} 
                format="DD/MM/YYYY"
                placeholder="11/10/2025"
                disabled={!isEditing}
              />
            </Form.Item>

            <Form.Item
              label="Ngày kết thúc"
              name="terminationDate"
            >
              <DatePicker 
                style={{ 
                  width: '100%',
                  background: isEditing ? '#fff' : '#f5f5f5',
                  borderRadius: 8
                }} 
                format="DD/MM/YYYY"
                placeholder="11/10/2025"
                disabled={!isEditing}
              />
            </Form.Item>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Form.Item
              label={<span>Lương cơ bản <span style={{ color: 'red' }}>*</span></span>}
              name="dailySalary"
              rules={[{ required: true, message: 'Vui lòng nhập lương' }]}
            >
              <Input 
                placeholder="10.000.000" 
                disabled={!isEditing}
                style={{ 
                  background: isEditing ? '#fff' : '#f5f5f5',
                  borderRadius: 8
                }}
              />
            </Form.Item>

            <Form.Item
              label={<span>Trạng thái <span style={{ color: 'red' }}>*</span></span>}
              name="status"
              rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
            >
              <Select 
                placeholder="Đang làm việc" 
                disabled={!isEditing}
                style={{ 
                  borderRadius: 8
                }}
              >
                <Select.Option value="Đang hoạt động">Đang làm việc</Select.Option>
                <Select.Option value="Nghỉ phép">Nghỉ phép</Select.Option>
                <Select.Option value="Nghỉ làm">Nghỉ làm</Select.Option>
              </Select>
            </Form.Item>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
            {!isEditing ? (
              <Button 
                type="primary"
                onClick={() => setIsEditing(true)}
                style={{
                  background: '#CBB081',
                  borderColor: '#CBB081',
                  borderRadius: 8,
                  padding: '8px 32px',
                  height: 'auto',
                  fontSize: 16,
                  fontWeight: 500
                }}
              >
                Chỉnh sửa
              </Button>
            ) : (
              <Button 
                type="primary"
                onClick={handleSave}
                style={{
                  background: '#CBB081',
                  borderColor: '#CBB081',
                  borderRadius: 8,
                  padding: '8px 32px',
                  height: 'auto',
                  fontSize: 16,
                  fontWeight: 500
                }}
              >
                Lưu
              </Button>
            )}
          </div>
        </Form>
      </Modal>

      {/* Add Employee Modal */}
      <Modal
        open={addModalVisible}
        onCancel={handleCloseAddModal}
        width={900}
        footer={null}
        closeIcon={<span style={{ fontSize: 24 }}>×</span>}
      >
        <div style={{ 
          background: '#CBB081', 
          padding: '20px 24px', 
          margin: '-20px -24px 24px -24px',
          textAlign: 'center'
        }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: '#000' }}>
            Thêm thông tin nhân viên
          </h2>
        </div>

        <Form
          form={addForm}
          layout="vertical"
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <Form.Item
              label={<span>Tên nhân viên <span style={{ color: 'red' }}>*</span></span>}
              name="fullName"
              rules={[{ required: true, message: 'Vui lòng nhập tên nhân viên' }]}
            >
              <Input 
                placeholder="VD: Nguyễn Văn A" 
                style={{ borderRadius: 8 }}
              />
            </Form.Item>

            <Form.Item
              label={<span>Tỉnh thành <span style={{ color: 'red' }}>*</span></span>}
              name="city"
              rules={[{ required: true, message: 'Vui lòng nhập tỉnh thành' }]}
            >
              <Input 
                placeholder="VD: Hà Nội" 
                style={{ borderRadius: 8 }}
              />
            </Form.Item>

            <Form.Item
              label="Phường xã"
              name="ward"
            >
              <Input 
                placeholder="VD: Thạch Thất" 
                style={{ borderRadius: 8 }}
              />
            </Form.Item>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
            <Form.Item
              label={<span>Số điện thoại <span style={{ color: 'red' }}>*</span></span>}
              name="phone"
              rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }]}
            >
              <Input 
                placeholder="VD: 0987654321" 
                style={{ borderRadius: 8 }}
              />
            </Form.Item>

            <Form.Item
              label="Địa chỉ chi tiết"
              name="detailAddress"
            >
              <Input 
                placeholder="VD: Trung tâm thạch thất" 
                style={{ borderRadius: 8 }}
              />
            </Form.Item>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <Form.Item
              label={<span>Chức vụ <span style={{ color: 'red' }}>*</span></span>}
              name="role"
              rules={[{ required: true, message: 'Vui lòng chọn chức vụ' }]}
            >
              <Select 
                placeholder="Chọn chức vụ" 
                style={{ borderRadius: 8 }}
              >
                <Select.Option value="Kỹ thuật viên">Kỹ thuật viên</Select.Option>
                <Select.Option value="Kế toán">Kế toán</Select.Option>
                <Select.Option value="Quản lý">Quản lý</Select.Option>
                <Select.Option value="Cố vấn dịch vụ">Cố vấn dịch vụ</Select.Option>
                <Select.Option value="Nhân viên kho">Nhân viên kho</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              label="Ngày bắt đầu"
              name="startDate"
            >
              <DatePicker 
                style={{ width: '100%', borderRadius: 8 }} 
                format="DD/MM/YYYY"
                placeholder="11/10/2025"
              />
            </Form.Item>

            <Form.Item
              label="Ngày kết thúc"
              name="endDate"
            >
              <DatePicker 
                style={{ width: '100%', borderRadius: 8 }} 
                format="DD/MM/YYYY"
                placeholder="11/10/2025"
              />
            </Form.Item>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Form.Item
              label={<span>Lương cơ bản <span style={{ color: 'red' }}>*</span></span>}
              name="dailySalary"
              rules={[{ required: true, message: 'Vui lòng nhập lương' }]}
            >
              <Input 
                placeholder="VD: 10.000.000" 
                style={{ borderRadius: 8 }}
              />
            </Form.Item>

            <Form.Item
              label="Ngày sinh"
              name="dateOfBirth"
            >
              <DatePicker 
                style={{ width: '100%', borderRadius: 8 }} 
                format="DD/MM/YYYY"
                placeholder="01/01/1990"
              />
            </Form.Item>
          </div>

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end', marginTop: 24 }}>
            <Button 
              onClick={handleCloseAddModal}
              style={{
                background: '#d93006ff',
                borderColor: '#d90d06ff',
                color: '#fff',
                borderRadius: 8,
                padding: '8px 32px',
                height: 'auto',
                fontSize: 16,
                fontWeight: 500
              }}
            >
              Hủy
            </Button>
            <Button 
              type="primary"
              onClick={handleCreateEmployee}
              style={{
                background: '#16a34a',
                borderColor: '#16a34a',
                borderRadius: 8,
                padding: '8px 32px',
                height: 'auto',
                fontSize: 16,
                fontWeight: 500
              }}
            >
              Tạo
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Filter Modal */}
      <Modal
        title="Bộ lọc"
        open={filterDrawerVisible}
        onCancel={handleCloseFilterDrawer}
        width={420}
        footer={
          <Button 
            onClick={handleApplyFilter}
            type="primary"
            block
            style={{
              background: '#3b82f6',
              borderColor: '#3b82f6',
              height: 40
            }}
          >
            Tìm kiếm
          </Button>
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
            <Checkbox value="Nghỉ phép">Nghỉ phép</Checkbox>
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
          <div style={{ marginBottom: 8, fontSize: 14, fontWeight: 500 }}>Khoảng ngày tao</div>
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

