import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { authAPI } from '../../services/api'
import '../../styles/pages/auth/reset-password.css'

const imgImage15 = "http://localhost:3845/assets/e3f06dc74cc8cb44cf93eb05563cb8c82f9ac956.png"
const imgEyeOff = "http://localhost:3845/assets/42da4380efeca78b000e3917abb285b4d143b77b.svg"

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
      const { data, error: apiError } = await authAPI.updatePassword(phone, otp, trimmedNewPassword)
      
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
      <div className="reset-password__logo-container">
        <img 
          alt="Logo" 
          src={imgImage15}
          className="reset-password__logo-image"
        />
      </div>

      <p className="reset-password__title-text">
        <span className="reset-password__title-text--white">Garage</span>{' '}
        <span className="reset-password__title-text--black">Hoàng Tuấn</span>
      </p>

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
                <img 
                  alt="Toggle password visibility" 
                  src={imgEyeOff}
                  className="reset-password__password-toggle-icon"
                />
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
                <img 
                  alt="Toggle password visibility" 
                  src={imgEyeOff}
                  className="reset-password__password-toggle-icon"
                />
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
      </div>
    </div>
  )
}

