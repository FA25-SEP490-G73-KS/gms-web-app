import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { authAPI } from '../../services/api'
import '../../styles/pages/auth/reset-password.css'
import { displayPhoneFrom84 } from '../../utils/helpers'

export default function ResetPassword() {
  const [form, setForm] = useState({
    newPassword: '',
    confirmPassword: ''
  })
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  
  const { phone, otp } = location.state || {}

  useEffect(() => {
    if (!phone || !otp) {
      navigate('/auth/forgot-password')
    }
  }, [phone, otp, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    // Trim tất cả password input
    const trimmedNewPassword = form.newPassword?.trim() || ''
    const trimmedConfirmPassword = form.confirmPassword?.trim() || ''
    
    if (!trimmedNewPassword || !trimmedConfirmPassword) {
      setError('Vui lòng nhập đầy đủ thông tin')
      return
    }

    if (trimmedNewPassword.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự')
      return
    }

    if (trimmedNewPassword !== trimmedConfirmPassword) {
      setError('Mật khẩu xác nhận không khớp')
      return
    }

    setLoading(true)
    try {
      // Format số điện thoại từ 84986475989 về 0986475989 (bỏ 84, thêm 0)
      const formattedPhone = displayPhoneFrom84(phone)
      
      const { data, error: apiError } = await authAPI.resetPasswordWithConfirm(formattedPhone, trimmedNewPassword, trimmedConfirmPassword)
      
      if (apiError) {
        setError(apiError || 'Không thể cập nhật mật khẩu. Vui lòng thử lại.')
        setLoading(false)
        return
      }

      // Navigate to success page
      navigate('/auth/reset-password-success')
    } catch (err) {
      setError(err.message || 'Đã xảy ra lỗi. Vui lòng thử lại.')
      setLoading(false)
    }
  }

  return (
    <div className="reset-password">
      <div className="reset-password__card" />

      <div className="reset-password__form-container">
        <p className="reset-password__form-title">
          Nhập mật khẩu mới
        </p>

        <form onSubmit={handleSubmit} className="reset-password__form">
          <div className="reset-password__input-group">
            <div className="reset-password__input reset-password__input--password-wrapper">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={form.newPassword}
                onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                placeholder="Mật khẩu mới"
                className="reset-password__input-field"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="reset-password__password-toggle"
              >
                <i className={showNewPassword ? 'bi bi-eye' : 'bi bi-eye-slash'}></i>
              </button>
            </div>

            <div className="reset-password__input reset-password__input--confirm-wrapper">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                placeholder="Xác nhận lại mật khẩu mới"
                className="reset-password__input-field"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="reset-password__password-toggle"
              >
                <i className={showConfirmPassword ? 'bi bi-eye' : 'bi bi-eye-slash'}></i>
              </button>
            </div>
          </div>

          {error && (
            <div className="reset-password__error-message">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="reset-password__submit-btn"
          >
            <div className="reset-password__submit-text">
              {loading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu mới'}
            </div>
          </button>
        </form>

        <button
          type="button"
          onClick={() => navigate('/login')}
          className="reset-password__back-btn"
          style={{
            width: '100%',
            padding: '12px',
            background: 'transparent',
            border: '1px solid #CBB081',
            borderRadius: '8px',
            color: '#CBB081',
            fontSize: '16px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            marginTop: '12px',
            marginBottom: '20px'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = '#CBB081'
            e.target.style.color = '#fff'
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'transparent'
            e.target.style.color = '#CBB081'
          }}
        >
          Quay lại đăng nhập
        </button>
      </div>
    </div>
  )
}

