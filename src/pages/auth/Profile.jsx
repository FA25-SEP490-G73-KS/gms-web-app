import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Form, Input, Button, Card, message, Row, Col, Spin } from 'antd'
import { ArrowLeftOutlined, LockOutlined, EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons'
import useAuthStore from '../../store/authStore'
import { employeesAPI, authAPI } from '../../services/api'
import { displayPhoneFrom84, getEmployeeIdFromToken, getUserIdFromToken } from '../../utils/helpers'
import { USER_ROLES } from '../../utils/constants'
import AdminLayout from '../../layouts/AdminLayout'
import ManagerLayout from '../../layouts/ManagerLayout'
import AccountanceLayout from '../../layouts/AccountanceLayout'
import WarehouseLayout from '../../layouts/WarehouseLayout'
import dayjs from 'dayjs'

export default function Profile() {
  const [form] = Form.useForm()
  const [passwordForm] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [loadingEmployee, setLoadingEmployee] = useState(true)
  const [changingPassword, setChangingPassword] = useState(false)
  const [employeeData, setEmployeeData] = useState(null)
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)

  useEffect(() => {
    // Lấy employee ID từ token thay vì từ user store
    const employeeId = getEmployeeIdFromToken() || getUserIdFromToken()
    
    if (!employeeId) {
      message.warning('Vui lòng đăng nhập để xem thông tin')
      navigate('/login', { replace: true })
      return
    }

    fetchEmployeeData(employeeId)
  }, [navigate])

  const fetchEmployeeData = async (employeeId) => {
    if (!employeeId) {
      console.warn('No employee ID available')
      return
    }

    setLoadingEmployee(true)
    try {
      console.log('Fetching employee data for ID:', employeeId)
      const { data, error } = await employeesAPI.getById(employeeId)
      if (error) {
        console.error('Error from API:', error)
        message.error('Không thể tải thông tin nhân viên')
        return
      }

      const employee = data?.result || data
      console.log('Employee data from API:', employee)
      setEmployeeData(employee)
    } catch (err) {
      console.error('Error fetching employee data:', err)
      message.error('Không thể tải thông tin nhân viên')
    } finally {
      setLoadingEmployee(false)
    }
  }

  const handleChangePassword = async (values) => {
    setChangingPassword(true)
    try {
      const { currentPassword, newPassword, confirmPassword } = values

      if (newPassword !== confirmPassword) {
        message.error('Mật khẩu mới và xác nhận mật khẩu không khớp')
        setChangingPassword(false)
        return
      }

      const { error } = await authAPI.changePassword(currentPassword, newPassword, confirmPassword)
      if (error) {
        message.error(error || 'Đổi mật khẩu không thành công')
        return
      }

      message.success('Đổi mật khẩu thành công!')
      passwordForm.resetFields()
    } catch (err) {
      message.error(err.message || 'Đã xảy ra lỗi. Vui lòng thử lại.')
    } finally {
      setChangingPassword(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return '—'
    return dayjs(dateString).format('DD/MM/YYYY')
  }

  const getGenderText = (gender) => {
    const genderMap = {
      MALE: 'Nam',
      FEMALE: 'Nữ',
      OTHER: 'Khác'
    }
    return genderMap[gender] || '—'
  }

  const getRoleText = (role) => {
    const roleMap = {
      ADMIN: 'Quản trị viên',
      MANAGER: 'Quản lý',
      SERVICE_ADVISOR: 'Tư vấn dịch vụ',
      TECHNICIAN: 'Kỹ thuật viên',
      ACCOUNTANT: 'Kế Toán',
      WAREHOUSE_STAFF: 'Nhân viên kho'
    }
    return roleMap[role] || role || '—'
  }

  const getLayout = () => {
    const userRole = user?.role?.toUpperCase()
    // ADMIN và SERVICE_ADVISOR dùng AdminLayout
    if (userRole === 'ADMIN' || userRole === USER_ROLES.SERVICE_ADVISOR) {
      return AdminLayout
    } else if (userRole === USER_ROLES.MANAGER) {
      return ManagerLayout
    } else if (userRole === USER_ROLES.ACCOUNTANT) {
      return AccountanceLayout
    } else if (userRole === USER_ROLES.WAREHOUSE) {
      return WarehouseLayout
    }
    return AdminLayout // Default
  }

  const Layout = getLayout()

  const profileContent = (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(-1)}
          style={{ border: 'none', boxShadow: 'none' }}
        />
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 600 }}>Thông tin cá nhân</h1>
      </div>

      <Row gutter={24} style={{ alignItems: 'stretch' }}>
        {/* Left: Basic Information */}
        <Col xs={24} lg={12}>
          <Card
            title={<span style={{ color: '#CBB081', fontWeight: 600 }}>Thông tin cơ bản</span>}
            style={{ 
              marginBottom: '24px', 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column',
              borderRadius: '8px',
              border: '1px solid #e8e8e8'
            }}
            bodyStyle={{ 
              flex: 1, 
              display: 'flex', 
              flexDirection: 'column',
              padding: '20px'
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <div style={{ color: '#666', fontSize: '14px', marginBottom: '8px', fontWeight: 500 }}>Họ và tên</div>
                <Input
                  value={employeeData?.fullName || employeeData?.name || user?.fullName || '—'}
                  disabled
                  style={{ 
                    backgroundColor: '#f5f5f5',
                    borderRadius: '8px',
                    border: '1px solid #e8e8e8',
                    height: '40px'
                  }}
                />
              </div>
              <div>
                <div style={{ color: '#666', fontSize: '14px', marginBottom: '8px', fontWeight: 500 }}>Giới tính</div>
                <Input
                  value={getGenderText(employeeData?.gender || employeeData?.sex)}
                  disabled
                  style={{ 
                    backgroundColor: '#f5f5f5',
                    borderRadius: '8px',
                    border: '1px solid #e8e8e8',
                    height: '40px'
                  }}
                />
              </div>
              <div>
                <div style={{ color: '#666', fontSize: '14px', marginBottom: '8px', fontWeight: 500 }}>Ngày sinh</div>
                <Input
                  value={formatDate(employeeData?.dateOfBirth || employeeData?.birthDate || employeeData?.dob)}
                  disabled
                  style={{ 
                    backgroundColor: '#f5f5f5',
                    borderRadius: '8px',
                    border: '1px solid #e8e8e8',
                    height: '40px'
                  }}
                />
              </div>
              <div>
                <div style={{ color: '#666', fontSize: '14px', marginBottom: '8px', fontWeight: 500 }}>Địa chỉ</div>
                <Input
                  value={employeeData?.address || employeeData?.addressDetail || employeeData?.location || employeeData?.detailAddress || '—'}
                  disabled
                  style={{ 
                    backgroundColor: '#f5f5f5',
                    borderRadius: '8px',
                    border: '1px solid #e8e8e8',
                    height: '40px'
                  }}
                />
              </div>
              <div>
                <div style={{ color: '#666', fontSize: '14px', marginBottom: '8px', fontWeight: 500 }}>Vai trò</div>
                <Input
                  value={getRoleText(employeeData?.role || employeeData?.position || user?.role)}
                  disabled
                  style={{ 
                    backgroundColor: '#f5f5f5',
                    borderRadius: '8px',
                    border: '1px solid #e8e8e8',
                    height: '40px'
                  }}
                />
              </div>
              <div>
                <div style={{ color: '#666', fontSize: '14px', marginBottom: '8px', fontWeight: 500 }}>Ngày gia nhập</div>
                <Input
                  value={formatDate(employeeData?.joinDate || employeeData?.joinDate || employeeData?.createdAt || employeeData?.hireDate)}
                  disabled
                  style={{ 
                    backgroundColor: '#f5f5f5',
                    borderRadius: '8px',
                    border: '1px solid #e8e8e8',
                    height: '40px'
                  }}
                />
              </div>
            </div>
          </Card>
        </Col>

        {/* Right: Account Information & Change Password */}
        <Col xs={24} lg={12} style={{ display: 'flex', flexDirection: 'column' }}>
          {/* Account Information */}
          <Card
            title={<span style={{ color: '#CBB081', fontWeight: 600 }}>Thông tin tài khoản</span>}
            style={{ 
              marginBottom: '24px',
              borderRadius: '8px',
              border: '1px solid #e8e8e8'
            }}
            bodyStyle={{ padding: '20px' }}
          >
            <div style={{ marginBottom: '20px' }}>
              <div style={{ color: '#666', fontSize: '14px', marginBottom: '8px', fontWeight: 500 }}>Số điện thoại</div>
              <Input
                value={displayPhoneFrom84(employeeData?.phone || user?.phone || '')}
                disabled
                style={{ 
                  backgroundColor: '#f5f5f5',
                  borderRadius: '8px',
                  border: '1px solid #e8e8e8',
                  height: '40px'
                }}
              />
            </div>
            <div>
              <div style={{ color: '#666', fontSize: '14px', marginBottom: '8px', fontWeight: 500 }}>Trạng thái tài khoản</div>
              <div style={{ 
                color: '#1890ff', 
                fontWeight: 500,
                backgroundColor: '#f5f5f5',
                borderRadius: '8px',
                border: '1px solid #e8e8e8',
                padding: '8px 12px',
                height: '40px',
                display: 'flex',
                alignItems: 'center'
              }}>Hoạt động</div>
            </div>
          </Card>

          {/* Change Password */}
          <Card 
            title={<span style={{ color: '#CBB081', fontWeight: 600 }}>Cập nhật mật khẩu</span>} 
            style={{ 
              flex: 1,
              borderRadius: '8px',
              border: '1px solid #e8e8e8'
            }}
            bodyStyle={{ padding: '20px' }}
          >
            <Form
              form={passwordForm}
              layout="vertical"
              onFinish={handleChangePassword}
            >
              <Form.Item
                name="currentPassword"
                label="Mật khẩu hiện tại"
                rules={[{ required: true, message: 'Vui lòng nhập mật khẩu hiện tại' }]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                  placeholder="Nhập mật khẩu hiện tại"
                />
              </Form.Item>

              <Form.Item
                name="newPassword"
                label="Mật khẩu mới"
                rules={[
                  { required: true, message: 'Vui lòng nhập mật khẩu mới' },
                  { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự' }
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                  placeholder="Nhập mật khẩu mới"
                />
              </Form.Item>

              <Form.Item
                name="confirmPassword"
                label="Xác nhận mật khẩu mới"
                dependencies={['newPassword']}
                rules={[
                  { required: true, message: 'Vui lòng xác nhận mật khẩu mới' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('newPassword') === value) {
                        return Promise.resolve()
                      }
                      return Promise.reject(new Error('Mật khẩu xác nhận không khớp'))
                    }
                  })
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                  placeholder="Xác nhận mật khẩu mới"
                />
              </Form.Item>

              <Form.Item style={{ marginBottom: 0 }}>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
                  <Button
                    onClick={() => {
                      passwordForm.resetFields()
                      navigate(-1)
                    }}
                    style={{
                      height: '40px',
                      minWidth: '100px',
                      borderRadius: '8px'
                    }}
                  >
                    Hủy
                  </Button>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={changingPassword}
                    style={{
                      backgroundColor: '#CBB081',
                      borderColor: '#CBB081',
                      height: '40px',
                      minWidth: '100px',
                      fontWeight: 500,
                      borderRadius: '8px'
                    }}
                  >
                    Cập nhật
                  </Button>
                </div>
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  )

  if (loadingEmployee) {
    return (
      <Layout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <Spin size="large" />
        </div>
      </Layout>
    )
  }

  return <Layout>{profileContent}</Layout>
}

