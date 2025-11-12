import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import '../styles/layout/admin-layout.css'

export default function AdminLayout({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [openService, setOpenService] = useState(false)

  const items = [
    { key: 'dashboard', label: 'Doanh thu', to: '/admin', icon: 'bi-grid' },
    { key: 'appointments', label: 'Lịch hẹn', to: '/admin/appointments', icon: 'bi-calendar3' },
    { key: 'account', label: 'Tài khoản', to: '/admin/account', icon: 'bi-wrench' },
    { key: 'inventory', label: 'Tồn kho', to: '/admin/inventory', icon: 'bi-box' },
  ]

  const isActive = (to) => location.pathname === to

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">

        <div className="admin-brand" onClick={() => navigate('/admin')}>
          <img src="/image/mainlogo.png" alt="Logo" />
        </div>
        <nav className="admin-nav">
          {items.map((it) => (
            <button
              key={it.key}
              className={`admin-nav-item ${isActive(it.to) ? 'active' : ''}`}
              onClick={() => navigate(it.to)}
            >
              <i className={`bi ${it.icon}`} />
              <span>{it.label}</span>
            </button>
          ))}

          <div className={`admin-nav-group ${openService ? 'open' : ''}`}>
            <button
              className={`admin-nav-item ${location.pathname.startsWith('/admin/orders') ? 'active' : ''}`}
              onClick={() => setOpenService((v) => !v)}
            >
              <i className="bi bi-journal-text" />
              <span>Phiếu dịch vụ</span>
              <i className={`bi bi-caret-down-fill caret ${openService ? 'rot' : ''}`} />
            </button>
            {openService && (
              <div className="submenu">
                <div className="submenu-line" />
                <button className="submenu-item" onClick={() => navigate('/admin/orders')}>Danh sách phiếu</button>
                <button className="submenu-item" onClick={() => navigate('/admin/orders/create')}>Tạo phiếu</button>
                <button className="submenu-item" onClick={() => navigate('/admin/orders/history')}>Lịch sử sửa chữa</button>
              </div>
            )}
          </div>

          <button className={`admin-nav-item ${isActive('/admin/warranty') ? 'active' : ''}`} onClick={() => navigate('/admin/warranty')}>
            <i className="bi bi-shield-check" />
            <span>Bảo hành</span>
          </button>
        </nav>
        <div className="admin-spacer" />
        <button className="admin-logout" onClick={() => navigate('/')}> 
          <i className="bi bi-box-arrow-right" />
          <span>Đăng xuất</span>
        </button>
      </aside>

      <main className="admin-main">
        <div className="admin-topbar">
          <div className="admin-topbar-left">
            <span className="brand-gold">Garage</span>
            <span className="brand-strong">Hoàng Tuấn</span>
            <span className="greeting">Xin chào!</span>
          </div>
          <div className="admin-topbar-right">
            <span className="zalo-badge">Zalo</span>
            <i className="bi bi-bell" style={{ fontSize: 18 }}></i>
            <span className="user-name">Tên</span>
          </div>
        </div>
        {children}
      </main>
    </div>
  )
}


