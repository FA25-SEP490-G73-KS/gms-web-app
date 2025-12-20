import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { otpAPI } from '../../services/api'
import '../../styles/pages/auth/enter-otp.css'

export default function EnterOTP() {
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const inputRefs = [useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null)]
  
  const { phone, purpose } = location.state || {}

  useEffect(() => {
    if (!phone || !purpose) {
      navigate('/auth/forgot-password')
    }
  }, [phone, purpose, navigate])

  const handleOtpChange = (index, value) => {
    // Chỉ cho phép số
    if (value && !/^\d$/.test(value)) return
    
    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)
    setError('')
    
    // Tự động focus sang ô tiếp theo khi nhập
    if (value && index < 5) {
      inputRefs[index + 1].current?.focus()
    }
  }

  const handleKeyDown = (index, e) => {
    // Xử lý backspace: xóa số hiện tại và quay lại ô trước
    if (e.key === 'Backspace') {
      if (otp[index]) {
        // Nếu ô hiện tại có số, xóa số đó
        const newOtp = [...otp]
        newOtp[index] = ''
        setOtp(newOtp)
      } else if (index > 0) {
        // Nếu ô hiện tại trống, quay lại ô trước và xóa số ở đó
        const newOtp = [...otp]
        newOtp[index - 1] = ''
        setOtp(newOtp)
        inputRefs[index - 1].current?.focus()
      }
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').trim()
    
    // Chỉ lấy 6 số đầu tiên
    const numbers = pastedData.replace(/\D/g, '').slice(0, 6)
    
    if (numbers.length === 6) {
      const newOtp = numbers.split('')
      setOtp(newOtp)
      setError('')
      // Focus vào ô cuối cùng
      inputRefs[5].current?.focus()
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    // Ghép các số thành chuỗi OTP
    const otpString = otp.join('')
    
    if (!otpString) {
      setError('Vui lòng nhập mã OTP')
      return
    }

    if (otpString.length !== 6) {
      setError('Mã OTP phải có 6 chữ số')
      return
    }

    setLoading(true)
    try {
      const { data, error: apiError } = await otpAPI.verify(phone, otpString, purpose, { skipAuth: true })
      
      if (apiError) {
        setError(apiError || 'Mã OTP không đúng hoặc đã hết hạn.')
        setLoading(false)
        return
      }

      // Check if OTP is valid (result should be true)
      if (data?.result === true || data?.result === 'true') {
        // Navigate to reset password page
        navigate('/auth/reset-password', { state: { phone, otp: otpString } })
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
      <div className="enter-otp__card" />

      <div className="enter-otp__form-container">
        <p className="enter-otp__form-title">
          Nhập mã OTP
        </p>

        <form onSubmit={handleSubmit} className="enter-otp__form" onPaste={handlePaste}>
          <div className="enter-otp__input-group">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={inputRefs[index]}
                type="text"
                inputMode="numeric"
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="enter-otp__input-digit"
                maxLength={1}
                autoComplete="off"
              />
            ))}
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

        <button
          type="button"
          onClick={() => navigate('/login')}
          className="enter-otp__back-btn"
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

        <div className="enter-otp__instruction">
          <p>Mã OTP sẽ được gửi đến số điện thoại.</p>
          <p>Vui lòng nhập OTP ở bước tiếp theo.</p>
        </div>
      </div>
    </div>
  )
}

