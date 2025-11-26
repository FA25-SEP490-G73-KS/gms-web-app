import { useState, useMemo, useCallback, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Form, Input, Button, Card, message } from 'antd'
import { LockOutlined, EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons'
import useAuthStore from '../../store/authStore'
import { authAPI } from '../../services/api'
import '../../styles/pages/auth/change-password.css'

export default function ChangePassword() {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuthStore((state) => state.user)

  useEffect(() => {
    if (!user) {
      message.warning('Vui lòng đăng nhập để đổi mật khẩu')
      navigate('/login', { replace: true, state: { from: location } })
    }
  }, [user, navigate, location])

  const iconRender = useMemo(
    () => (visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />),
    []
  )

  const handleSubmit = useCallback(
    async (values) => {
      setLoading(true)
      try {
        const { currentPassword, newPassword } = values
        const { error } = await authAPI.changePassword(currentPassword, newPassword)
        if (error) {
          message.error(error || 'Đổi mật khẩu không thành công.')
          setLoading(false)
          return
        }
        message.success('Đổi mật khẩu thành công!')
        form.resetFields()
        navigate(-1)
      } catch (err) {
        message.error(err.message || 'Đã xảy ra lỗi. Vui lòng thử lại.')
      } finally {
        setLoading(false)
      }
    },
    [form, navigate]
  )

  return (
    <div className="change-password">
      <div className="change-password__wrapper">
        <Card className="change-password__card">
          <div className="change-password__header">
            <h1>Đổi mật khẩu</h1>
            <p>Vui lòng nhập mật khẩu hiện tại và mật khẩu mới</p>
          </div>

          <Form
            layout="vertical"
            form={form}
            requiredMark={false}
            className="change-password__form"
            onFinish={handleSubmit}
          >
            <Form.Item
              label="Mật khẩu hiện tại"
              name="currentPassword"
              rules={[{ required: true, message: 'Vui lòng nhập mật khẩu hiện tại' }]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Nhập mật khẩu hiện tại"
                iconRender={iconRender}
              />
            </Form.Item>

            <Form.Item
              label="Mật khẩu mới"
              name="newPassword"
              rules={[
                { required: true, message: 'Vui lòng nhập mật khẩu mới' },
                { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự' },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Nhập mật khẩu mới"
                iconRender={iconRender}
              />
            </Form.Item>

            <Form.Item
              label="Xác nhận mật khẩu mới"
              name="confirmPassword"
              dependencies={['newPassword']}
              rules={[
                { required: true, message: 'Vui lòng xác nhận mật khẩu mới' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('newPassword') === value) {
                      return Promise.resolve()
                    }
                    return Promise.reject(new Error('Mật khẩu xác nhận không khớp'))
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Nhập lại mật khẩu mới"
                iconRender={iconRender}
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                className="change-password__submit"
              >
                Lưu thay đổi
              </Button>
            </Form.Item>

            <Button type="link" block onClick={() => navigate(-1)}>
              Quay lại
            </Button>
          </Form>
        </Card>
      </div>
    </div>
  )
}

