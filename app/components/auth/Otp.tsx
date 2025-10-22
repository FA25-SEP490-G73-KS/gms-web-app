import React, { useState } from "react";
import "../../styles/login.css";

const Otp: React.FC = () => {
  const [otp, setOtp] = useState("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.trim();
    if (!code) {
      alert("Vui lòng nhập mã OTP!");
      return;
    }
    // TODO: Verify OTP with backend
    alert("Đã gửi mã OTP! (demo)");
  };

  return (
    <div className="login-page">
      <div className="logo" aria-label="Garage Hoàng Tuấn">
        {/* Replace with your logo in /public/images if available */}
        <img
          src="image/ChatGPT Image 07_51_47 19 thg 10, 2025.png"
          alt="Logo Garage"
        />
      </div>

      <div className="login-container">
        <h3>Nhập mã OTP</h3>
        <form onSubmit={onSubmit}>
          <div className="input-group">
            <input
              type="text"
              placeholder="Mã OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              aria-label="Mã OTP"
              inputMode="numeric"
              autoComplete="one-time-code"
            />
          </div>
          <button type="submit" className="login-btn">
            Gửi
          </button>
        </form>
      </div>
    </div>
  );
};

export default Otp;
