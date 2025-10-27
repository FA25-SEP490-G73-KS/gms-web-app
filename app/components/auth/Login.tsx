import React, { useState } from "react";
import axios from "axios";
import "bootstrap-icons/font/bootstrap-icons.css";
import "../../styles/login.css";
import { Link, useNavigate } from "react-router";

export const Login: React.FC = () => {
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [remember, setRemember] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        try {
            const response = await axios.post(
                "http://localhost:8080/api/auth/login",
                { phone, password },
                {
                    headers: { "Content-Type": "application/json" },
                }
            );

            const token = response.data.token;
            console.log("JWT Token:", token);

            // ✅ Lưu token vào localStorage
            localStorage.setItem("token", token);
            if (remember) localStorage.setItem("rememberMe", "true");

            // ✅ Chuyển hướng sang trang appointments sau khi đăng nhập thành công
            navigate("/appointments");

        } catch (err: any) {
            console.error("Login error:", err);
            setError("Số điện thoại hoặc mật khẩu không đúng!");
        }
    };

    return (
        <div className="login-page">
            <div className="logo" aria-label="Garage Hoàng Tuấn">
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
                        />
                    </div>

                    <div className="input-group">
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Mật khẩu"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <button
                            type="button"
                            className="toggle-password"
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

                    {error && <p className="error-text">{error}</p>}

                    <button type="submit" className="login-btn">Đăng nhập</button>
                </form>
            </div>
        </div>
    );
};

export default Login;