import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import '../../styles/pages/auth/login.css'

const imgImage15 = "http://localhost:3845/assets/e3f06dc74cc8cb44cf93eb05563cb8c82f9ac956.png"
const imgEyeOff = "http://localhost:3845/assets/42da4380efeca78b000e3917abb285b4d143b77b.svg"
const imgCheck = "http://localhost:3845/assets/3eb0b3b98f576e4a7c0b701a5a928b2ae47a95a2.svg"

export default function Login() {
  const [form, setForm] = useState({
    phone: '',
    password: '',
    rememberMe: false
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { login } = useAuthStore()

  const update = (key) => (e) => {
    if (key === 'rememberMe') {
      setForm({ ...form, [key]: e.target.checked })
    } else {
      setForm({ ...form, [key]: e.target.value })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    if (!form.phone || !form.password) {
      setError('Vui lòng nhập đầy đủ thông tin')
      return
    }

    setLoading(true)
    try {
      await login(form.phone, form.password)
      
      const currentUser = useAuthStore.getState().user
      const userRole = currentUser?.role

      if (userRole === 'MANAGER' || userRole === 'ADMIN') {
        navigate('/manager')
      } else if (userRole === 'SERVICE_ADVISOR') {
        navigate('/service-advisor')
      } else if (userRole === 'WAREHOUSE') {
        navigate('/warehouse')
      } else if (userRole === 'ACCOUNTANT') {
        navigate('/accountance')
      } else {
        navigate('/')
      }
    } catch (err) {
      setError(err.message || 'Đăng nhập thất bại. Vui lòng thử lại.')
      setLoading(false)
    }
  }

  return (
    <div className="login">
      <div className="login__logo-container">
        <img 
          alt="Logo" 
          src={imgImage15}
          className="login__logo-image"
        />
      </div>

      <p className="login__title-text">
        <span className="login__title-text--white">Garage</span>{' '}
        <span className="login__title-text--black">Hoàng Tuấn</span>
      </p>

      <div className="login__card" />

      <div className="login__form-container">
        <p className="login__form-title">
          Đăng nhập
        </p>

        <form onSubmit={handleSubmit} className="login__form">
          <div className="login__input-group">
            <input
              type="tel"
              value={form.phone}
              onChange={update('phone')}
              placeholder="Số điện thoại"
              className="login__input login__input--phone"
            />

            <div className="login__input login__input--password-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={update('password')}
                placeholder="Mật khẩu"
                className="login__input--password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="login__password-toggle"
              >
                <img 
                  alt="Toggle password visibility" 
                  src={imgEyeOff}
                  className="login__password-toggle-icon"
                />
              </button>
            </div>

            <div className="login__options">
              <label className="login__remember-me">
                <input
                  type="checkbox"
                  checked={form.rememberMe}
                  onChange={update('rememberMe')}
                  className="login__remember-me-checkbox"
                />
                <div className="login__custom-checkbox">
                  {form.rememberMe && (
                    <img 
                      alt="Checked" 
                      src={imgCheck}
                      className="login__custom-checkbox-icon"
                    />
                  )}
                  {!form.rememberMe && (
                    <div className="login__custom-checkbox-border" />
                  )}
                </div>
                <div className="login__remember-me-text">
                  Ghi nhớ
                </div>
              </label>
              <button
                type="button"
                onClick={() => navigate('/auth/forgot-password')}
                className="login__forgot-password-btn"
              >
                Quên mật khẩu?
              </button>
            </div>
          </div>

          {error && (
            <div className="login__error-message">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="login__submit-btn"
          >
            <div className="login__submit-text">
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </div>
          </button>
        </form>
      </div>
    </div>
  )
}
