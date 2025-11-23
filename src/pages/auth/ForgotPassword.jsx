import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { otpAPI } from '../../services/api'
import '../../styles/pages/auth/forgot-password.css'

const imgImage15 = "http://localhost:3845/assets/e3f06dc74cc8cb44cf93eb05563cb8c82f9ac956.png"

export default function ForgotPassword() {
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const validatePhone = (phoneNumber) => {
    const cleaned = phoneNumber.replace(/\s+/g, '').replace(/[^\d]/g, '')
    if (cleaned.length < 11 || cleaned.length > 12) {
      return false
    }
    if (!cleaned.startsWith('84')) {
      return false
    }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    if (!phone) {
      setError('Vui lòng nhập số điện thoại')
      return
    }

    if (!validatePhone(phone)) {
      setError('Số điện thoại không hợp lệ. Vui lòng nhập theo định dạng 84xxxxxxxxx')
      return
    }

    setLoading(true)
    try {
      // Clean phone number before sending
      const cleanedPhone = phone.replace(/\s+/g, '').replace(/[^\d]/g, '')
      
      const { data, error: apiError } = await otpAPI.send(cleanedPhone, 'RESET_PASSWORD', { skipAuth: true })
      
      if (apiError) {
        setError(apiError || 'Không thể gửi mã OTP. Vui lòng thử lại.')
        setLoading(false)
        return
      }

      // Check if API call was successful
      if (data && (data.statusCode === 200 || data.result)) {
        // Navigate to OTP page with phone number
        navigate('/auth/enter-otp', { state: { phone: cleanedPhone, purpose: 'RESET_PASSWORD' } })
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
      <div className="forgot-password__logo-container">
        <img 
          alt="Logo" 
          src={imgImage15}
          className="forgot-password__logo-image"
        />
      </div>

      <p className="forgot-password__title-text">
        <span className="forgot-password__title-text--white">Garage</span>{' '}
        <span className="forgot-password__title-text--black">Hoàng Tuấn</span>
      </p>

      <div className="forgot-password__card" />

      <div className="forgot-password__form-container">
        <p className="forgot-password__form-title">
          Nhập số điện thoại
        </p>

        <form onSubmit={handleSubmit} className="forgot-password__form">
          <div className="forgot-password__input-group">
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Ví dụ: 84909123456"
              className="forgot-password__input"
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
              {loading ? 'Đang gửi...' : 'GỬI'}
            </div>
          </button>

          <div className="forgot-password__instruction">
            <p>Mã OTP sẽ được gửi đến số điện thoại.</p>
            <p>Vui lòng nhập OTP ở bước tiếp theo.</p>
          </div>
        </form>
      </div>
    </div>
  )
}

