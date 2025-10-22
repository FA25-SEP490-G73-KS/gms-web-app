import React from "react";
import "../../styles/reset-success.css";
import { useNavigate } from "react-router";

const ResetSuccess: React.FC = () => {
    const navigate = useNavigate();

    const goLogin = () => navigate("/login", { replace: true });

    return (
        <div className="success-page">
            {/* Logo */}
            <div className="logo" aria-label="Garage Hoàng Tuấn">
                <img
                    src="image/ChatGPT Image 07_51_47 19 thg 10, 2025.png"
                    alt="Logo Garage"
                />
            </div>

            {/* Card */}
            <div className="card">
                <img src="image/icons8-success (1).gif" alt="Success Icon" />
                <h2>Bạn đã thay đổi mật khẩu thành công!</h2>
                <button className="btn" onClick={goLogin}>
                    Đăng nhập lại
                </button>
            </div>
        </div>
    );
};

export default ResetSuccess;
