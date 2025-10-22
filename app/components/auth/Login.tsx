import React, { useState } from "react";
import "bootstrap-icons/font/bootstrap-icons.css";
import "../../styles/login.css";
import { Link } from "react-router";

export const Login: React.FC = () => {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Integrate with real auth API
    // For now, just log the values
    console.log({ phone, password, remember });
    // You can navigate or show validation here
  };

  return (
    <div className="login-page">
        <div className="logo" aria-label="Garage Hoàng Tuấn">
            {/* If you add a logo file to public, update the src to e.g. /images/logo.png */}
            {/* <img src="/images/logo.png" alt="Logo Garage" /> */}
            <img src="image/ChatGPT Image 07_51_47 19 thg 10, 2025.png" alt="Logo Garage"/>
        </div>

        <div className="login-container">
            <h3>Đăng nhập</h3>

            <form onSubmit={onSubmit}>
          <div className="input-group">
            <input
              type="tel"
              placeholder="Số điện thoại"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              aria-label="Số điện thoại"
              inputMode="tel"
            />
          </div>

          <div className="input-group">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Mật khẩu"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              aria-label="Mật khẩu"
            />
            <button
              type="button"
              className="toggle-password"
              aria-label={showPassword ? "Ẩn mật khẩu" : "Hiển thị mật khẩu"}
              onClick={() => setShowPassword((s) => !s)}
            >
              <i className={showPassword ? "bi bi-eye" : "bi bi-eye-slash"} />
            </button>
          </div>

          <div className="options">
            <label className="remember">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              Ghi nhớ
            </label>
            <Link to="/forgot-password">Quên mật khẩu?</Link>
          </div>

          <button type="submit" className="login-btn">Đăng nhập</button>
        </form>
      </div>
    </div>
  );
};

export default Login;
