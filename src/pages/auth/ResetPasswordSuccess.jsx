import { useNavigate } from 'react-router-dom'
import Lottie from 'lottie-react'
import successAnim from '../../assets/animations/Success.json'
import '../../styles/pages/auth/reset-password-success.css'


export default function ResetPasswordSuccess() {
  const navigate = useNavigate()

  const handleLogin = () => {
    navigate('/login')
  }

  return (
    <div className="reset-password-success">

      <div className="reset-password-success__card" />

      <div className="reset-password-success__content-container">
        <div className="reset-password-success__icon">
          <Lottie animationData={successAnim} loop={false} />
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

