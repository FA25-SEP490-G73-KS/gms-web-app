import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import '../styles/layout/warehouse-layout.css'

export default function AccountanceLayout({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [openHR, setOpenHR] = useState(location.pathname.startsWith('/accountance/hr'))
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const userMenuRef = useRef(null)
  const { user, logout } = useAuthStore()

  useEffect(() => {
    if (location.pathname.startsWith('/accountance/hr')) {
      setOpenHR(true)
    }
  }, [location.pathname])

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

  const isActive = (to) => location.pathname === to
  const isActiveParent = (path) => location.pathname.startsWith(path)

  const getBreadcrumb = () => {
    const path = location.pathname
    if (path === '/accountance') {
      return { parent: '', current: 'Thống kê' }
    }
    if (path.startsWith('/accountance/finance')) {
      return { parent: '', current: 'Thu - Chi' }
    }
    if (path.startsWith('/accountance/hr/list')) {
      return { parent: 'Nhân sự', current: 'Danh sách nhân viên' }
    }
    if (path.startsWith('/accountance/hr/attendance')) {
      return { parent: 'Nhân sự', current: 'Ngày công' }
    }
    if (path.startsWith('/accountance/hr/payroll')) {
      return { parent: 'Nhân sự', current: 'Lương' }
    }
    if (path.startsWith('/accountance/payments')) {
      return { parent: '', current: 'Thanh toán' }
    }
    if (path.startsWith('/accountance/debts')) {
      return { parent: '', current: 'Công nợ' }
    }
    if (path.startsWith('/accountance/inventory')) {
      return { parent: '', current: 'Kho & Vật tư' }
    }
    if (path.startsWith('/accountance/forms')) {
      return { parent: '', current: 'Tạo phiếu' }
    }
    if (path.startsWith('/accountance/services')) {
      return { parent: '', current: 'Dịch vụ' }
    }
    return { parent: '', current: 'Kế toán' }
  }

  const breadcrumb = getBreadcrumb()

  return (
    <div className={`warehouse-layout ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Header - Full width, no margin/padding */}
      <header className="warehouse-header">
        <div className="warehouse-header-content">
          <div className="warehouse-topbar-left">
            <button
              className={`sidebar-toggle-btn ${sidebarCollapsed ? 'collapsed' : ''}`}
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
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
          <div className="warehouse-topbar-right">
            <button className="notification-btn">
              <i className="bi bi-bell"></i>
            </button>
          </div>
        </div>
      </header>

      {/* Sidebar - Overlay on header */}
      <aside className="warehouse-sidebar">
        <div className="warehouse-brand" onClick={() => navigate('/accountance')} style={{ marginTop: '57px' }}>
          <img src="/image/mainlogo.png" alt="Logo" />
        </div>
        <nav className="warehouse-nav">
          <button
            className={`warehouse-nav-item ${isActive('/accountance') ? 'active' : ''}`}
            onClick={() => navigate('/accountance')}
          >
            <i className="bi bi-bar-chart" />
            <span>Thống kê</span>
          </button>

          <button
            className={`warehouse-nav-item ${isActive('/accountance/finance') ? 'active' : ''}`}
            onClick={() => navigate('/accountance/finance')}
          >
            <i className="bi bi-cash-stack" />
            <span>Thu - Chi</span>
          </button>

          <div className={`warehouse-nav-group ${openHR ? 'open' : ''}`}>
            <button
              className={`warehouse-nav-item ${isActiveParent('/accountance/hr') ? 'active' : ''}`}
              onClick={() => setOpenHR((v) => !v)}
            >
              <i className="bi bi-people" />
              <span>Nhân sự</span>
              <i className={`bi bi-caret-down-fill caret ${openHR ? 'rot' : ''}`} />
            </button>
            {openHR && (
              <div className="submenu">
                <div className="submenu-line" />
                <button
                  className={`submenu-item ${isActive('/accountance/hr/list') ? 'active' : ''}`}
                  onClick={() => navigate('/accountance/hr/list')}
                >
                  Danh sách
                </button>
                <button
                  className={`submenu-item ${isActive('/accountance/hr/attendance') ? 'active' : ''}`}
                  onClick={() => navigate('/accountance/hr/attendance')}
                >
                  Ngày công
                </button>
                <button
                  className={`submenu-item ${isActive('/accountance/hr/payroll') ? 'active' : ''}`}
                  onClick={() => navigate('/accountance/hr/payroll')}
                >
                  Lương
                </button>
              </div>
            )}
          </div>

          <button
            className={`warehouse-nav-item ${isActive('/accountance/payments') ? 'active' : ''}`}
            onClick={() => navigate('/accountance/payments')}
          >
            <i className="bi bi-credit-card" />
            <span>Thanh toán</span>
          </button>

          <button
            className={`warehouse-nav-item ${isActive('/accountance/debts') ? 'active' : ''}`}
            onClick={() => navigate('/accountance/debts')}
          >
            <i className="bi bi-receipt" />
            <span>Công nợ</span>
          </button>

          <button
            className={`warehouse-nav-item ${isActive('/accountance/inventory') ? 'active' : ''}`}
            onClick={() => navigate('/accountance/inventory')}
          >
            <i className="bi bi-box-seam" />
            <span>Kho & Vật tư</span>
          </button>

          <button
            className={`warehouse-nav-item ${isActive('/accountance/forms') ? 'active' : ''}`}
            onClick={() => navigate('/accountance/forms')}
          >
            <i className="bi bi-file-earmark-text" />
            <span>Tạo phiếu</span>
          </button>

          <button
            className={`warehouse-nav-item ${isActive('/accountance/services') ? 'active' : ''}`}
            onClick={() => navigate('/accountance/services')}
          >
            <i className="bi bi-briefcase" />
            <span>Dịch vụ</span>
          </button>
        </nav>
        <div className="warehouse-spacer" />
        
        {/* User Info with Dropdown */}
        <div className="warehouse-user-menu" ref={userMenuRef} style={{ position: 'relative' }}>
          <button 
            className="warehouse-user-info" 
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
            <div className="warehouse-user-dropdown" style={{
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
                className="warehouse-logout"
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
      <main className="warehouse-main">
        <div className="warehouse-content">
          {children}
        </div>
      </main>
    </div>
  )
}

