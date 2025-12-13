import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { otpAPI } from '../../services/api'
import '../../styles/pages/auth/confirm-phone.css'

export default function ConfirmPhone() {
  const [countdown, setCountdown] = useState(5)
  const [canResend, setCanResend] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  
  const phone = location.state?.phone || ''
  const purpose = location.state?.purpose || 'RESET_PASSWORD'

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else {
      setCanResend(true)
    }
  }, [countdown])

  // Auto redirect to OTP page after countdown
  useEffect(() => {
    if (countdown === 0 && !canResend) {
      // Wait a bit before redirect
      const timer = setTimeout(() => {
        navigate('/auth/enter-otp', { 
          state: { phone, purpose },
          replace: true 
        })
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [countdown, canResend, navigate, phone, purpose])

  const handleResendOTP = async () => {
    if (!canResend || loading) return

    setLoading(true)
    try {
      const { data, error } = await otpAPI.send(phone, purpose, { skipAuth: true })
      
      if (error) {
        // Even if error, still navigate to OTP page
        navigate('/auth/enter-otp', { 
          state: { phone, purpose } 
        })
        return
      }

      if (data && (data.statusCode === 200 || data.result)) {
        // Reset countdown
        setCountdown(5)
        setCanResend(false)
      }
    } catch (err) {
      // Navigate to OTP page even on error
      navigate('/auth/enter-otp', { 
        state: { phone, purpose } 
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSkipToOTP = () => {
    navigate('/auth/enter-otp', { 
      state: { phone, purpose } 
    })
  }

  // Format phone number for display (hide middle digits)
  const formatPhoneDisplay = (phoneNumber) => {
    if (!phoneNumber) return ''
    // Remove +84 prefix if exists
    const cleaned = phoneNumber.replace('+84', '0')
    // Show format: 0xxx xxx xxx
    if (cleaned.length === 10) {
      return `${cleaned.slice(0, 4)} *** ${cleaned.slice(-3)}`
    }
    return phoneNumber
  }

  return (
    <div className="confirm-phone">
      <div className="confirm-phone__logo-container">
        <img 
          alt="Logo Garage Hoàng Tuấn" 
          src="/image/mainlogo.png"
          className="confirm-phone__logo-image"
        />
      </div>

      <p className="confirm-phone__title-text">
        <span className="confirm-phone__title-text--white">Garage</span>{' '}
        <span className="confirm-phone__title-text--black">Hoàng Tuấn</span>
      </p>

      <div className="confirm-phone__card" />

      <div className="confirm-phone__content">
        <div className="confirm-phone__icon">
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="32" cy="32" r="32" fill="#CBB081" fillOpacity="0.1"/>
            <path d="M44 20H20C18.9 20 18.01 20.9 18.01 22L18 42C18 43.1 18.9 44 20 44H44C45.1 44 46 43.1 46 42V22C46 20.9 45.1 20 44 20ZM44 24L32 31L20 24V22L32 29L44 22V24Z" fill="#CBB081"/>
          </svg>
        </div>

        <h2 className="confirm-phone__title">Xác nhận số điện thoại</h2>
        
        <p className="confirm-phone__description">
          Mã OTP đã được gửi đến số điện thoại
        </p>
        
        <div className="confirm-phone__phone-display">
          {formatPhoneDisplay(phone)}
        </div>

        <p className="confirm-phone__instruction">
          Vui lòng kiểm tra tin nhắn và nhập mã OTP để tiếp tục.
        </p>

        {countdown > 0 ? (
          <div className="confirm-phone__countdown">
            <p>Tự động chuyển trang sau</p>
            <div className="confirm-phone__countdown-number">{countdown}s</div>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleSkipToOTP}
            className="confirm-phone__continue-btn"
          >
            Tiếp tục
          </button>
        )}

        <div className="confirm-phone__resend">
          <p>Không nhận được mã?</p>
          <button
            type="button"
            onClick={handleResendOTP}
            disabled={!canResend || loading}
            className={`confirm-phone__resend-btn ${!canResend ? 'confirm-phone__resend-btn--disabled' : ''}`}
          >
            {loading ? 'Đang gửi...' : 'Gửi lại mã'}
          </button>
        </div>
      </div>
    </div>
  )
}
