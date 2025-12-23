import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import { getUserNameFromToken, getUserPhoneFromToken, getShortName } from '../utils/helpers'
import NotificationBell from '../components/common/NotificationBell'
import '../styles/layout/admin-layout.css'

export default function AdminLayout({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  // Giữ trạng thái mở/đóng của nhóm "Phiếu dịch vụ" giữa các màn service-advisor
  const [openService, setOpenService] = useState(() => {
    if (typeof window === 'undefined') return true
    const stored = window.localStorage.getItem('admin_open_service')
    return stored ? stored === 'true' : true
  })
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const userMenuRef = useRef(null)
  const { user, logout } = useAuthStore()

  // Persist trạng thái dropdown "Phiếu dịch vụ"
  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem('admin_open_service', String(openService))
  }, [openService])

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
    if (path.startsWith('/service-advisor/orders')) {
      const isDetailPage = /^\/service-advisor\/orders\/\d+/.test(path)
      const isCreatePage = path === '/service-advisor/orders/create' || path === '/service-advisor/orders/new-customer'
      return {
        parent: 'Phiếu dịch vụ',
        current: isDetailPage ? 'Tạo phiếu dịch vụ' : isCreatePage ? 'Tạo phiếu dịch vụ' : 'Danh sách phiếu',
        child: isDetailPage ? 'Chi tiết phiếu' : null
      }
    }
    if (path.startsWith('/service-advisor/appointments')) {
      return { parent: '', current: 'Lịch hẹn', child: null }
    }
    if (path.startsWith('/service-advisor/customers')) {
      return { parent: '', current: 'Khách hàng', child: null }
    }
    return { parent: '', current: 'Trang chủ', child: null }
  }

  const breadcrumb = getBreadcrumb()

  const handleBreadcrumbClick = () => {
    const path = location.pathname
    if (path.startsWith('/service-advisor/orders')) {
      navigate('/service-advisor/orders')
      return
    }
  }

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
                <button
                  type="button"
                  className="breadcrumb-current breadcrumb-button"
                  onClick={handleBreadcrumbClick}
                  disabled={
                    !location.pathname.startsWith('/service-advisor/orders')
                  }
                >
                  {breadcrumb.current}
                </button>
                {breadcrumb.child ? (
                  <>
                    <span className="breadcrumb-separator">&gt;</span>
                    <span className="breadcrumb-current">{breadcrumb.child}</span>
                  </>
                ) : null}
              </div>
            ) : (
              <span className="breadcrumb-current">{breadcrumb.current}</span>
            )}
          </div>
          <div className="admin-topbar-right">
            <NotificationBell />
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
                  className={`submenu-item ${
                    location.pathname === '/service-advisor/orders/create' || 
                    location.pathname === '/service-advisor/orders/new-customer' ? 'active' : ''
                  }`}
                  onClick={() => navigate('/service-advisor/orders/new-customer')}
                >
                  Tạo phiếu dịch vụ
                </button>
              </div>
            )}
          </div>

          <button 
            className={`admin-nav-item ${isActive('/service-advisor/customers') ? 'active' : ''}`}
            onClick={() => navigate('/service-advisor/customers')}
          >
            <i className="bi bi-people" />
            <span>Khách hàng</span>
          </button>

        </nav>
        <div className="admin-spacer" />
        
        {/* User Info with Dropdown */}
        <div className="admin-user-menu" ref={userMenuRef} style={{ position: 'relative' }}>
          <button
            className="admin-user-info"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <div className="admin-user-avatar">
              <i className="bi bi-person-fill" />
            </div>
            <div className="admin-user-text">
              <div className="admin-user-name">
                {getShortName(getUserNameFromToken() || user?.name || user?.fullName || 'Nguyễn Văn A')}
              </div>
              <div className="admin-user-role">
                {getUserPhoneFromToken() || user?.phone || ''}
              </div>
            </div>
          </button>
          
          {showUserMenu && (
            <div className="admin-user-dropdown" style={{
              position: 'absolute',
              bottom: '100%',
              left: 0,
              marginBottom: '8px',
              background: '#fff',
              border: '1px solid #e6e8eb',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              zIndex: 1000,
              overflow: 'hidden',
              minWidth: '200px',
              textAlign: 'left'
            }}>
              <button
                className="admin-menu-item"
                onClick={() => {
                  setShowUserMenu(false)
                  navigate('/auth/profile')
                }}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontWeight: 500,
                  color: '#333',
                  fontSize: '14px',
                  borderBottom: '1px solid #e6e8eb',
                  textAlign: 'left',
                  justifyContent: 'flex-start'
                }}
                onMouseEnter={(e) => e.target.style.background = '#f5f5f5'}
                onMouseLeave={(e) => e.target.style.background = 'transparent'}
              >
                <i className="bi bi-person" />
                <span>Thông tin cá nhân</span>
              </button>
              <button
                className="admin-logout"
                onClick={() => {
                  setShowUserMenu(false)
                  handleLogout()
                }}
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
                  fontSize: '14px',
                  textAlign: 'left',
                  justifyContent: 'flex-start'
                }}
                onMouseEnter={(e) => e.target.style.background = '#f5f5f5'}
                onMouseLeave={(e) => e.target.style.background = 'transparent'}
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


