import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import '../styles/layout/admin-layout.css'

export default function AdminLayout({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  // Keep dropdown open if we're on any orders route
  const isOnOrdersRoute = location.pathname.startsWith('/service-advisor/orders')
  const [openService, setOpenService] = useState(isOnOrdersRoute)
  
  // Update state when route changes
  useEffect(() => {
    if (isOnOrdersRoute) {
      setOpenService(true)
    }
  }, [isOnOrdersRoute])

  const items = [
    { key: 'dashboard', label: 'Doanh thu', to: '/service-advisor', icon: 'bi-grid' },
    { key: 'appointments', label: 'Lịch hẹn', to: '/service-advisor/appointments', icon: 'bi-calendar3' },
  ]

  const isActive = (to) => location.pathname === to

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">

        <div className="admin-brand" onClick={() => navigate('/service-advisor')}>
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
              className={`admin-nav-item ${location.pathname.startsWith('/service-advisor/orders') ? 'active' : ''}`}
              onClick={() => {
                // Don't allow closing if we're on an orders route
                if (isOnOrdersRoute) {
                  return
                }
                setOpenService((v) => !v)
              }}
            >
              <i className="bi bi-journal-text" />
              <span>Phiếu dịch vụ</span>
              <i className={`bi bi-caret-down-fill caret ${openService ? 'rot' : ''}`} />
            </button>
            {openService && (
              <div className="submenu">
                <div className="submenu-line" />
                <button 
                  className={`submenu-item ${
                    location.pathname === '/service-advisor/orders' || 
                    (location.pathname.startsWith('/service-advisor/orders/') && 
                     !location.pathname.includes('/create') && 
                     !location.pathname.includes('/history') &&
                     location.pathname.match(/\/orders\/\d+/)) ? 'active' : ''
                  }`}
                  onClick={() => navigate('/service-advisor/orders')}
                >
                  Danh sách phiếu
                </button>
                <button 
                  className={`submenu-item ${location.pathname === '/service-advisor/orders/create' ? 'active' : ''}`}
                  onClick={() => navigate('/service-advisor/orders/create')}
                >
                  Tạo phiếu
                </button>
                <button 
                  className={`submenu-item ${location.pathname === '/service-advisor/orders/history' ? 'active' : ''}`}
                  onClick={() => navigate('/service-advisor/orders/history')}
                >
                  Lịch sử sửa chữa
                </button>
              </div>
            )}
          </div>

          <button className={`admin-nav-item ${isActive('/service-advisor/warranty') ? 'active' : ''}`} onClick={() => navigate('/service-advisor/warranty')}>
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
            <i className="bi bi-bell" style={{ fontSize: 18 }}></i>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <span className="user-name" style={{ fontWeight: 600, color: '#111', marginBottom: '2px' }}>Nguyễn Văn A</span>
              <span style={{ fontSize: '12px', color: '#666' }}>0123456789</span>
            </div>
          </div>
        </div>
        {children}
      </main>
    </div>
  )
}


