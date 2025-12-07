import { useMemo, useCallback, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Form, Input, Button, Card, Checkbox, message } from 'antd'
import { UserOutlined, LockOutlined, EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons'
import useAuthStore from '../../store/authStore'
import '../../styles/pages/auth/login.css'
import { normalizePhoneTo0 } from '../../utils/helpers'

export default function Login() {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [logoLoaded, setLogoLoaded] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const login = useAuthStore((state) => state.login)

  const handleLogoLoad = useCallback(() => {
    setLogoLoaded(true)
  }, [])

  const iconRender = useMemo(
    () => (visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />),
    []
  )

  const redirectAfterLogin = useCallback(() => {
    const userRole = useAuthStore.getState().user?.role
    const from = location.state?.from?.pathname

    if (from) {
      navigate(from, { replace: true })
      return
    }

    switch (userRole) {
      case 'ADMIN':
        navigate('/admin/dashboard', { replace: true })
        break
      case 'MANAGER':
        navigate('/manager/dashboard', { replace: true })
        break
      case 'SERVICE_ADVISOR':
        navigate('/service-advisor/appointments', { replace: true })
        break
      default:
        navigate('/', { replace: true })
        break
    }
  }, [location.state, navigate])

  const onFinish = useCallback(
    async (values) => {
      const { phone, password, remember } = values
      setLoading(true)
      try {
        await login(normalizePhoneTo0(phone), password)
        message.success('Đăng nhập thành công!')

        if (remember) {
          localStorage.setItem('rememberedPhone', phone)
        } else {
          localStorage.removeItem('rememberedPhone')
        }

        redirectAfterLogin()
      } catch (error) {
        const errorMessage = error?.message || 'Đăng nhập thất bại. Vui lòng thử lại!'
        message.error(errorMessage)
      } finally {
        setLoading(false)
      }
    },
    [login, redirectAfterLogin]
  )

  const onFinishFailed = useCallback((errorInfo) => {
    console.error('Form validation failed:', errorInfo)
  }, [])

  return (
    <div className="login-container">
      <div className="login-wrapper">
        <Card className="login-card">
          <div className="login-header">
            <div className="login-logo">
              {!logoLoaded && <div className="login-logo-placeholder" />}
              <img
                src="/image/mainlogo.png"
                alt="Logo Garage Hoàng Tuấn"
                loading="eager"
                onLoad={handleLogoLoad}
                style={{ opacity: logoLoaded ? 1 : 0, transition: 'opacity 0.3s ease' }}
                width="120"
                height="auto"
              />
            </div>
            <h1 className="login-title">Đăng Nhập</h1>
            <p className="login-subtitle">Chào mừng bạn trở lại Garage Hoàng Tuấn</p>
          </div>

          <Form
            form={form}
            name="login"
            onFinish={onFinish}
            onFinishFailed={onFinishFailed}
            autoComplete="off"
            layout="vertical"
            size="large"
            className="login-form"
            initialValues={{
              phone: localStorage.getItem('rememberedPhone') || '',
              remember: !!localStorage.getItem('rememberedPhone'),
            }}
          >
            <Form.Item
              label="Số điện thoại"
              name="phone"
              rules={[
                { required: true, message: 'Vui lòng nhập số điện thoại hợp lệ (10 chữ số)' },
                { 
                  pattern: /^(0[0-9]{9})$/,
                  message: 'Vui lòng nhập số điện thoại hợp lệ (10 chữ số)'
                },
              ]}
            >
              <Input
                prefix={<UserOutlined className="input-icon" />}
                placeholder="Nhập số điện thoại"
                autoComplete="username"
                maxLength={10}
                onChange={(e) => {
                  // Chỉ cho phép nhập số, tự động loại bỏ ký tự không phải số
                  let value = e.target.value.replace(/\D/g, '')
                  // Giới hạn tối đa 10 chữ số
                  value = value.slice(0, 10)
                  // Cập nhật giá trị trong form
                  form.setFieldsValue({ phone: value })
                }}
              />
            </Form.Item>

            <Form.Item
              label="Mật khẩu"
              name="password"
              rules={[
                { required: true, message: 'Vui lòng nhập mật khẩu!' },
                { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined className="input-icon" />}
                placeholder="Nhập mật khẩu"
                iconRender={iconRender}
                autoComplete="current-password"
              />
            </Form.Item>

            <Form.Item>
              <div className="login-options">
                <Form.Item name="remember" valuePropName="checked" noStyle>
                  <Checkbox>Ghi nhớ đăng nhập</Checkbox>
                </Form.Item>
                <button
                  type="button"
                  className="login-forgot"
                  onClick={() => navigate('/auth/forgot-password')}
                  style={{ background: 'none', border: 'none', padding: 0, color: 'inherit', cursor: 'pointer' }}
                >
                  Quên mật khẩu?
                </button>
              </div>
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                className="login-button"
              >
                Đăng Nhập
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </div>
  )
}