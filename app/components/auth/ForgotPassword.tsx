import React, { useState } from "react";
import "../../styles/login.css";
import { useNavigate } from "react-router";

const ForgotPassword: React.FC = () => {
    const [value, setValue] = useState("");
    const navigate = useNavigate();

    const sendOtp = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = value.trim();
        if (!trimmed) {
            alert("Vui lòng nhập thông tin!");
            return;
        }
        // TODO: Integrate with backend to send OTP to email/phone
        alert("Mã OTP đã được gửi!");
        navigate("/otp", { replace: false });
    };

    return (
        <div className="login-page">
            <div className="logo" aria-label="Garage Hoàng Tuấn">
                {/* Replace with your logo in /public/images if available */}
                <img src="image/ChatGPT Image 07_51_47 19 thg 10, 2025.png" alt="Logo Garage"/>
            </div>

            <div className="login-container">
                <h3>Quên mật khẩu</h3>
                <p>Nhập số điện thoại hoặc email để nhận mã OTP</p>
                <form onSubmit={sendOtp}>
                    <div className="input-group">
                        <input
                            type="text"
                            id="emailOrPhone"
                            placeholder="Email hoặc số điện thoại"
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            aria-label="Email hoặc số điện thoại"
                        />
                    </div>
                    <button type="submit" className="login-btn">Gửi OTP</button>
                </form>
            </div>
        </div>
    );
};
export default ForgotPassword;
