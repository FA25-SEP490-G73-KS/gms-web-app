import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { otpAPI } from '../../services/api'
import '../../styles/pages/auth/forgot-password.css'
import { normalizePhoneTo84 } from '../../utils/helpers'

export default function ForgotPassword() {
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const validatePhone = (phoneNumber) => {
    if (!phoneNumber) {
      return {
        isValid: false,
        errorMessage: 'Vui lòng nhập số điện thoại hợp lệ (10 chữ số)'
      }
    }

    // Loại bỏ khoảng trắng và ký tự đặc biệt, chỉ giữ lại số
    const cleaned = phoneNumber.replace(/\s+/g, '').replace(/[^\d]/g, '')
    
    if (cleaned.length === 0) {
      return {
        isValid: false,
        errorMessage: 'Vui lòng nhập số điện thoại hợp lệ (10 chữ số)'
      }
    }

    // Regex: ^(0[0-9]{9})$ - 10 chữ số, bắt đầu bằng 0
    const regex = /^(0[0-9]{9})$/
    
    if (!regex.test(cleaned)) {
      return {
        isValid: false,
        errorMessage: 'Vui lòng nhập số điện thoại hợp lệ (10 chữ số)'
      }
    }

    return {
      isValid: true,
      errorMessage: '',
      cleanedPhone: cleaned
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    // Trim phone trước khi validate
    const trimmedPhone = phone?.trim() || ''
    const validation = validatePhone(trimmedPhone)
    if (!validation.isValid) {
      setError(validation.errorMessage)
      return
    }

    setLoading(true)
    try {
      // Sử dụng số điện thoại đã được validate và cleaned
      const cleanedPhone = normalizePhoneTo84(validation.cleanedPhone)
      
      const { data, error: apiError } = await otpAPI.send(cleanedPhone, 'RESET_PASSWORD', { skipAuth: true })
      
      if (apiError) {
        setError(apiError || 'Không thể gửi mã OTP. Vui lòng thử lại.')
        setLoading(false)
        return
      }

      // Check if API call was successful
      if (data && (data.statusCode === 200 || data.result)) {
        // Navigate to confirm phone page with phone number
        navigate('/auth/confirm-phone', { state: { phone: cleanedPhone, purpose: 'RESET_PASSWORD' } })
      } else {
        setError('Không thể gửi mã OTP. Vui lòng thử lại.')
        setLoading(false)
      }
    } catch (err) {
      setError(err.message || 'Đã xảy ra lỗi. Vui lòng thử lại.')
      setLoading(false)
    }
  }

  return (
    <div className="forgot-password">
      <div className="forgot-password__card">
        <div className="forgot-password__logo-container">
          <img 
            alt="Logo Garage Hoàng Tuấn" 
            src="/image/mainlogo.png"
            className="forgot-password__logo-image"
          />
        </div>

        <p className="forgot-password__form-title">
          Quên mật khẩu
        </p>
        <p className="forgot-password__subtitle">
          Nhập số điện thoại để nhận mã OTP
        </p>

        <div className="forgot-password__form-container">
          <form onSubmit={handleSubmit} className="forgot-password__form">
            <div className="forgot-password__input-group">
            <input
              type="tel"
              value={phone}
              onChange={(e) => {
                // Chỉ cho phép nhập số, tự động loại bỏ ký tự không phải số
                let value = e.target.value.replace(/\D/g, '')
                // Giới hạn tối đa 10 chữ số
                value = value.slice(0, 10)
                setPhone(value)
                // Xóa lỗi khi bắt đầu nhập lại
                if (error) setError('')
              }}
              placeholder="Số điện thoại"
              className="forgot-password__input"
              maxLength={10}
            />
          </div>

          {error && (
            <div className="forgot-password__error-message">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="forgot-password__submit-btn"
          >
            <div className="forgot-password__submit-text">
              {loading ? 'Đang gửi...' : 'Gửi'}
            </div>
          </button>

          <div className="forgot-password__instruction">
            <p>Mã OTP sẽ được gửi đến số điện thoại.</p>
            <p>Vui lòng nhập OTP ở bước tiếp theo.</p>
          </div>
        </form>
        </div>
      </div>
    </div>
  )
}

