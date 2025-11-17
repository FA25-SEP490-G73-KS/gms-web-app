import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import '../styles/layout/admin-layout.css'

export default function AdminLayout({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  // Keep dropdown open if we're on any orders route
  const isOnOrdersRoute = location.pathname.startsWith('/service-advisor/orders')
  const [openService, setOpenService] = useState(isOnOrdersRoute)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  
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

  const getBreadcrumb = () => {
    const path = location.pathname
    if (path.startsWith('/service-advisor/orders/create')) {
      return { parent: 'Phiếu dịch vụ', current: 'Tạo phiếu' }
    }
    if (path.startsWith('/service-advisor/orders/history')) {
      return { parent: 'Phiếu dịch vụ', current: 'Lịch sử sửa chữa' }
    }
    if (path.startsWith('/service-advisor/orders')) {
      return { parent: 'Phiếu dịch vụ', current: 'Danh sách phiếu' }
    }
    if (path.startsWith('/service-advisor/appointments')) {
      return { parent: '', current: 'Lịch hẹn' }
    }
    if (path.startsWith('/service-advisor/warranty')) {
      return { parent: '', current: 'Bảo hành' }
    }
    return { parent: '', current: 'Trang chủ' }
  }

  const breadcrumb = getBreadcrumb()

  return (
    <div className={`admin-layout ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
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
            <button
              className={`sidebar-toggle-btn ${sidebarCollapsed ? 'collapsed' : ''}`}
              onClick={() => setSidebarCollapsed((prev) => !prev)}
            >
              <i className={`bi ${sidebarCollapsed ? 'bi-chevron-right' : 'bi-chevron-left'}`}></i>
            </button>
            {breadcrumb.parent ? (
              <div className="breadcrumb">
                <span className="breadcrumb-item">{breadcrumb.parent}</span>
                <i className="bi bi-chevron-right breadcrumb-separator"></i>
                <span className="breadcrumb-item breadcrumb-current">{breadcrumb.current}</span>
              </div>
            ) : (
              <span className="breadcrumb-current">{breadcrumb.current}</span>
            )}
          </div>
          <div className="admin-topbar-right">
            <button className="notification-btn">
              <i className="bi bi-bell"></i>
            </button>
          </div>
        </div>
        {children}
      </main>
    </div>
  )
}


