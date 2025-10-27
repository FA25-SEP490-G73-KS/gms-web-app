import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/customer-layout.css';

export default function CustomerLayout({ children }) {
  return (
    <div className="customer-layout">
      <header className="customer-header">
        <div className="customer-header-content">
          <Link to="/" className="customer-logo">
            <img src="/image/ChatGPT Image 01_32_27 17 thg 10, 2025.png" alt="Logo Garage"/>
            <span>Gara Hoàng Tuấn</span>
          </Link>
          
          <nav className="customer-nav">
            <Link to="/" className="nav-link">Trang chủ</Link>
            <Link to="/services" className="nav-link">Dịch vụ</Link>
            <Link to="/about" className="nav-link">Giới thiệu</Link>
            <Link to="/contact" className="nav-link">Liên hệ</Link>
          </nav>

          <div className="customer-actions">
            <Link to="/my-appointments" className="btn-outline">
              <i className="bi bi-calendar-check"></i>
              Lịch hẹn của tôi
            </Link>
            <Link to="/book-now" className="btn-primary">
              Đặt lịch ngay
            </Link>
          </div>
        </div>
      </header>

      <main className="customer-main">
        {children}
      </main>

      <footer className="customer-footer">
        <div className="customer-footer-content">
          <div className="footer-section">
            <h3>Gara Hoàng Tuấn</h3>
            <p>Chất lượng vàng - Dịch vụ tận tâm</p>
          </div>
          
          <div className="footer-section">
            <h4>Liên hệ</h4>
            <p><i className="bi bi-geo-alt"></i> 110 đường Hoàng Nghiêu, Thanh Hóa</p>
            <p><i className="bi bi-telephone"></i> 0912603603</p>
            <p><i className="bi bi-envelope"></i> contact@garageht.vn</p>
          </div>
          
          <div className="footer-section">
            <h4>Giờ làm việc</h4>
            <p>Thứ 2 - Thứ 7: 8:00 - 18:00</p>
            <p>Chủ nhật: 8:00 - 12:00</p>
          </div>
          
          <div className="footer-section">
            <h4>Theo dõi chúng tôi</h4>
            <div className="social-links">
              <a href="#" aria-label="Facebook"><i className="bi bi-facebook"></i></a>
              <a href="#" aria-label="Instagram"><i className="bi bi-instagram"></i></a>
              <a href="#" aria-label="YouTube"><i className="bi bi-youtube"></i></a>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; 2025 Gara Hoàng Tuấn. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

