import React, { useState } from "react";
import "../../styles/login.css";
import { useNavigate } from "react-router";

const ResetPassword: React.FC = () => {
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPass.length < 8) {
      alert("Mật khẩu phải ít nhất 8 ký tự!");
      return;
    }
    if (newPass !== confirmPass) {
      alert("Mật khẩu nhập lại không khớp!");
      return;
    }

    try {
      setSubmitting(true);
      // TODO: Call API to update password with token from OTP flow
      // await api.updatePassword({ password: newPass })

      alert("Cập nhật mật khẩu thành công!");
      navigate("/reset-success", { replace: true });
    } catch (err) {
      console.error(err);
      alert("Có lỗi xảy ra. Vui lòng thử lại!");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="logo" aria-label="Garage Hoàng Tuấn">
        <img
          src="image/ChatGPT Image 07_51_47 19 thg 10, 2025.png"
          alt="Logo Garage"
        />
      </div>

      <div className="login-container">
        <h3>Nhập mật khẩu mới</h3>
        <p>Vui lòng nhập mật khẩu mới, độ dài tối thiểu 8 ký tự</p>

        <form onSubmit={onSubmit}>
          <div className="input-group">
            <input
              type="password"
              id="newPass"
              placeholder="Mật khẩu mới"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              aria-label="Mật khẩu mới"
              required
              minLength={8}
            />
          </div>

          <div className="input-group">
            <input
              type="password"
              id="confirmPass"
              placeholder="Xác nhận lại mật khẩu"
              value={confirmPass}
              onChange={(e) => setConfirmPass(e.target.value)}
              aria-label="Xác nhận lại mật khẩu"
              required
              minLength={8}
            />
          </div>

          <button type="submit" className="login-btn" disabled={submitting}>
            {submitting ? "Đang cập nhật..." : "Cập nhật mật khẩu mới"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
