import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import '../styles/layout/admin-layout.css'

export default function AdminLayout({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  // Keep dropdown open if we're on any orders route
  const isOnOrdersRoute = location.pathname.startsWith('/service-advisor/orders')
  const [openService, setOpenService] = useState(isOnOrdersRoute)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const userMenuRef = useRef(null)
  const { user, logout } = useAuthStore()
  
  // Update state when route changes
  useEffect(() => {
    if (isOnOrdersRoute) {
      setOpenService(true)
    }
  }, [isOnOrdersRoute])

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const items = [
    { key: 'dashboard', label: 'Báo cáo', to: '/service-advisor/reports', icon: 'bi-grid' },
    { key: 'appointments', label: 'Lịch hẹn', to: '/service-advisor/appointments', icon: 'bi-calendar3' },
  ]

  const isActive = (to) => location.pathname === to

  const getBreadcrumb = () => {
    const path = location.pathname
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
      {/* Header - Full width, no margin/padding */}
      <header className="admin-header">
        <div className="admin-header-content">
          <div className="admin-topbar-left">
            <button
              className={`sidebar-toggle-btn ${sidebarCollapsed ? 'collapsed' : ''}`}
              onClick={() => setSidebarCollapsed((prev) => !prev)}
            >
              <i className={`bi ${sidebarCollapsed ? 'bi-chevron-right' : 'bi-chevron-left'}`}></i>
            </button>
            <div className="breadcrumb-divider"></div>
            {breadcrumb.parent ? (
              <div className="breadcrumb">
                <span className="breadcrumb-item">{breadcrumb.parent}</span>
                <span className="breadcrumb-separator">&gt;</span>
                <span className="breadcrumb-current">{breadcrumb.current}</span>
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
      </header>

      {/* Sidebar - Overlay on header */}
      <aside className="admin-sidebar">
        <div className="admin-brand" onClick={() => navigate('/service-advisor')} style={{ marginTop: '10px' }}>
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
                     !location.pathname.includes('/history') &&
                     location.pathname.match(/\/orders\/\d+/)) ? 'active' : ''
                  }`}
                  onClick={() => navigate('/service-advisor/orders')}
                >
                  Danh sách phiếu
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
        
        {/* User Info with Dropdown */}
        <div className="admin-user-menu" ref={userMenuRef} style={{ position: 'relative' }}>
          <button 
            className="admin-user-info" 
            onClick={() => setShowUserMenu(!showUserMenu)}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #eee',
              borderRadius: '10px',
              background: '#fafafa',
              cursor: 'pointer',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              alignItems: 'center'
            }}
          >
            <div style={{ fontWeight: 600, fontSize: '14px', color: '#222' }}>
              {user?.name || user?.phone || 'Nguyễn Văn A'}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {user?.phone || '0123456789'}
            </div>
          </button>
          
          {showUserMenu && (
            <div className="admin-user-dropdown" style={{
              position: 'absolute',
              bottom: '100%',
              left: 0,
              right: 0,
              marginBottom: '8px',
              background: '#fff',
              border: '1px solid #e6e8eb',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              zIndex: 1000,
              overflow: 'hidden'
            }}>
              <button
                className="admin-logout"
                onClick={handleLogout}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontWeight: 600,
                  color: '#d1293d',
                  fontSize: '14px'
                }}
              >
                <i className="bi bi-box-arrow-right" />
                <span>Đăng xuất</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        <div className="admin-content">
          {children}
        </div>
      </main>
    </div>
  )
}


