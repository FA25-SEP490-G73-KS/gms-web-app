import React from 'react';
import Header from '../components/common/Header';
import CustomerNav from '../components/common/customerNav';
import '../styles/layout/customer-layout.css';

export default function CustomerLayout({ children }) {
  return (
    <div className="customer-layout">
      <Header />
      <CustomerNav />

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
          <p>&copy; 2025 Gara Hoàng Tuấn. All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  );
}

