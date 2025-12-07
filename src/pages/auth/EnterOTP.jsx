import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { otpAPI } from '../../services/api'
import '../../styles/pages/auth/enter-otp.css'

const imgImage15 = "http://localhost:3845/assets/e3f06dc74cc8cb44cf93eb05563cb8c82f9ac956.png"

export default function EnterOTP() {
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  
  const { phone, purpose } = location.state || {}

  useEffect(() => {
    if (!phone || !purpose) {
      navigate('/auth/forgot-password')
    }
  }, [phone, purpose, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    // Trim OTP trước khi xử lý
    const trimmedOtp = otp?.trim() || ''
    
    if (!trimmedOtp) {
      setError('Vui lòng nhập mã OTP')
      return
    }

    if (trimmedOtp.length !== 6) {
      setError('Mã OTP phải có 6 chữ số')
      return
    }

    setLoading(true)
    try {
      const { data, error: apiError } = await otpAPI.verify(phone, trimmedOtp, purpose, { skipAuth: true })
      
      if (apiError) {
        setError(apiError || 'Mã OTP không đúng hoặc đã hết hạn.')
        setLoading(false)
        return
      }

      // Check if OTP is valid (result should be true)
      if (data?.result === true || data?.result === 'true') {
        // Navigate to reset password page
        navigate('/auth/reset-password', { state: { phone, otp } })
      } else {
        setError('Mã OTP không đúng hoặc đã hết hạn.')
        setLoading(false)
      }
    } catch (err) {
      setError(err.message || 'Đã xảy ra lỗi. Vui lòng thử lại.')
      setLoading(false)
    }
  }

  return (
    <div className="enter-otp">
      <div className="enter-otp__logo-container">
        <img 
          alt="Logo" 
          src={imgImage15}
          className="enter-otp__logo-image"
        />
      </div>

      <p className="enter-otp__title-text">
        <span className="enter-otp__title-text--white">Garage</span>{' '}
        <span className="enter-otp__title-text--black">Hoàng Tuấn</span>
      </p>

      <div className="enter-otp__card" />

      <div className="enter-otp__form-container">
        <p className="enter-otp__form-title">
          Nhập mã OTP
        </p>

        <form onSubmit={handleSubmit} className="enter-otp__form">
          <div className="enter-otp__input-group">
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Mã OTP"
              className="enter-otp__input"
              maxLength={6}
            />
          </div>

          {error && (
            <div className="enter-otp__error-message">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="enter-otp__submit-btn"
          >
            <div className="enter-otp__submit-text">
              {loading ? 'Đang xác thực...' : 'GỬI'}
            </div>
          </button>
        </form>
      </div>
    </div>
  )
}

