import { useNavigate } from 'react-router-dom'
import '../../styles/pages/auth/reset-password-success.css'

const imgImage15 = "http://localhost:3845/assets/e3f06dc74cc8cb44cf93eb05563cb8c82f9ac956.png"

export default function ResetPasswordSuccess() {
  const navigate = useNavigate()

  const handleLogin = () => {
    navigate('/login')
  }

  return (
    <div className="reset-password-success">
      <div className="reset-password-success__logo-container">
        <img 
          alt="Logo" 
          src={imgImage15}
          className="reset-password-success__logo-image"
        />
      </div>

      <p className="reset-password-success__title-text">
        <span className="reset-password-success__title-text--white">Garage</span>{' '}
        <span className="reset-password-success__title-text--black">Hoàng Tuấn</span>
      </p>

      <div className="reset-password-success__card" />

      <div className="reset-password-success__content-container">
        <div className="reset-password-success__icon">
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="40" cy="40" r="40" fill="#22c55e"/>
            <path d="M25 40L35 50L55 30" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        <p className="reset-password-success__message">
          Bạn đã thay đổi mật khẩu thành công!
        </p>

        <button
          onClick={handleLogin}
          className="reset-password-success__submit-btn"
        >
          <div className="reset-password-success__submit-text">
            Đăng nhập lại
          </div>
        </button>
      </div>
    </div>
  )
}

