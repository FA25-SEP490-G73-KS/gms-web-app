import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import '../styles/layout/manager-layout.css'

/**
 * ManagerLayout - Layout dành cho role MANAGER
 * Manager có quyền truy cập tất cả các module trong hệ thống:
 * - Dashboard & Báo cáo
 * - Service Advisor (Lịch hẹn, Phiếu dịch vụ)
 * - Warehouse (Nhập/Xuất kho, Linh kiện)
 * - Accountance (Kế toán, Nhân sự, Công nợ)
 * - Quản lý hệ thống
 */
export default function ManagerLayout({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { logout, user } = useAuthStore()
  
  // State for collapsible menu groups
  const [openService, setOpenService] = useState(location.pathname.startsWith('/manager/service-advisor'))
  const [openWarehouse, setOpenWarehouse] = useState(location.pathname.startsWith('/manager/warehouse'))
  const [openAccountance, setOpenAccountance] = useState(location.pathname.startsWith('/manager/accountance'))
  const [openSystem, setOpenSystem] = useState(location.pathname.startsWith('/manager/system'))
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const userMenuRef = useRef(null)
  
  // Update state when route changes
  useEffect(() => {
    if (location.pathname.startsWith('/manager/service-advisor')) {
      setOpenService(true)
    }
    if (location.pathname.startsWith('/manager/warehouse')) {
      setOpenWarehouse(true)
    }
    if (location.pathname.startsWith('/manager/accountance')) {
      setOpenAccountance(true)
    }
    if (location.pathname.startsWith('/manager/system')) {
      setOpenSystem(true)
    }
  }, [location.pathname])

  const isActive = (to) => location.pathname === to
  const isActiveParent = (path) => location.pathname.startsWith(path)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

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

  const getBreadcrumb = () => {
    const path = location.pathname
    // Service Advisor routes
    if (path.startsWith('/manager/service-advisor/orders/history')) {
      return { parent: 'Service Advisor > Phiếu dịch vụ', current: 'Lịch sử' }
    }
    if (path.startsWith('/manager/service-advisor/orders')) {
      return { parent: 'Service Advisor > Phiếu dịch vụ', current: 'Danh sách' }
    }
    if (path.startsWith('/manager/service-advisor/appointments')) {
      return { parent: 'Service Advisor', current: 'Lịch hẹn' }
    }
    if (path.startsWith('/manager/service-advisor')) {
      return { parent: 'Service Advisor', current: 'Dashboard' }
    }
    // Warehouse routes
    if (path.startsWith('/manager/warehouse/export')) {
      return { parent: 'Warehouse > Xuất kho', current: 'Danh sách' }
    }
    if (path.startsWith('/manager/warehouse/import')) {
      return { parent: 'Warehouse > Nhập kho', current: 'Danh sách' }
    }
    if (path.startsWith('/manager/warehouse/parts')) {
      return { parent: 'Warehouse', current: 'Linh kiện' }
    }
    if (path.startsWith('/manager/warehouse')) {
      return { parent: 'Warehouse', current: 'Dashboard' }
    }
    // Accountance routes
    if (path.startsWith('/manager/accountance/hr')) {
      return { parent: 'Accountance > Nhân sự', current: 'Quản lý' }
    }
    if (path.startsWith('/manager/accountance')) {
      return { parent: 'Accountance', current: 'Dashboard' }
    }
    // System routes
    if (path.startsWith('/manager/system/employees')) {
      return { parent: 'Hệ thống', current: 'Nhân viên' }
    }
    if (path.startsWith('/manager/system/settings')) {
      return { parent: 'Hệ thống', current: 'Cài đặt' }
    }
    if (path.startsWith('/manager/system')) {
      return { parent: 'Hệ thống', current: 'Tổng quan' }
    }
    return { parent: '', current: 'Dashboard' }
  }

  const breadcrumb = getBreadcrumb()

  return (
    <div className={`manager-layout ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Header - Full width, no margin/padding */}
      <header className="manager-header">
        <div className="manager-header-content">
          <div className="manager-header-left">
            <button
              className="manager-sidebar-toggle"
              onClick={() => setSidebarCollapsed((prev) => !prev)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                borderRadius: '6px',
                color: '#666',
                fontSize: '18px'
              }}
            >
              <i className={`bi ${sidebarCollapsed ? 'bi-chevron-right' : 'bi-chevron-left'}`}></i>
            </button>
            <div className="manager-header-logo">
              <img src="/image/mainlogo.png" alt="Logo" />
            </div>
            <div className="manager-header-title">
              <span className="garage-text">Garage</span>
              <span className="name-text">Hoàng Tuấn</span>
            </div>
            <div className="manager-header-greeting">Xin chào!</div>
          </div>
          <div className="manager-header-right">
            <button className="manager-header-zalo">Zalo</button>
            <button className="manager-header-notification">
              <i className="bi bi-bell"></i>
              <span className="notification-badge"></span>
            </button>
            <span className="manager-header-user">{user?.name || user?.phone || 'Tên'}</span>
          </div>
        </div>
      </header>

      {/* Sidebar - Overlay on header */}
      <aside className="manager-sidebar">
        <div className="manager-brand" onClick={() => navigate('/manager')}>
          <img src="/image/mainlogo.png" alt="Logo" />
          <div style={{ fontSize: '12px', color: '#CBB081', fontWeight: 600 }}>
            Manager
          </div>
        </div>
        
        <nav className="manager-nav">
          {/* Dashboard */}
          <button
            className={`manager-nav-item ${isActive('/manager') ? 'active' : ''}`}
            onClick={() => navigate('/manager')}
          >
            <i className="bi bi-grid" />
            <span>Dashboard</span>
          </button>

          {/* Service Advisor Section */}
          <div className={`manager-nav-group ${openService ? 'open' : ''}`}>
            <button
              className={`manager-nav-item ${isActiveParent('/manager/service-advisor') ? 'active' : ''}`}
              onClick={() => setOpenService((v) => !v)}
            >
              <i className="bi bi-tools" />
              <span>Service Advisor</span>
              <i className={`bi bi-caret-down-fill caret ${openService ? 'rot' : ''}`} />
            </button>
            {openService && (
              <div className="submenu">
                <div className="submenu-line" />
                <button
                  className={`submenu-item ${isActive('/manager/service-advisor') ? 'active' : ''}`}
                  onClick={() => navigate('/manager/service-advisor')}
                >
                  Dashboard
                </button>
                <button
                  className={`submenu-item ${isActive('/manager/service-advisor/appointments') ? 'active' : ''}`}
                  onClick={() => navigate('/manager/service-advisor/appointments')}
                >
                  Lịch hẹn
                </button>
                <button
                  className={`submenu-item ${isActive('/manager/service-advisor/orders') ? 'active' : ''}`}
                  onClick={() => navigate('/manager/service-advisor/orders')}
                >
                  Phiếu dịch vụ
                </button>
                <button
                  className={`submenu-item ${isActive('/manager/service-advisor/inventory') ? 'active' : ''}`}
                  onClick={() => navigate('/manager/service-advisor/inventory')}
                >
                  Kho hàng
                </button>
              </div>
            )}
          </div>

          {/* Warehouse Section */}
          <div className={`manager-nav-group ${openWarehouse ? 'open' : ''}`}>
            <button
              className={`manager-nav-item ${isActiveParent('/manager/warehouse') ? 'active' : ''}`}
              onClick={() => setOpenWarehouse((v) => !v)}
            >
              <i className="bi bi-box-seam" />
              <span>Warehouse</span>
              <i className={`bi bi-caret-down-fill caret ${openWarehouse ? 'rot' : ''}`} />
            </button>
            {openWarehouse && (
              <div className="submenu">
                <div className="submenu-line" />
                <button
                  className={`submenu-item ${isActive('/manager/warehouse') ? 'active' : ''}`}
                  onClick={() => navigate('/manager/warehouse')}
                >
                  Dashboard
                </button>
                <button
                  className={`submenu-item ${isActive('/manager/warehouse/parts') ? 'active' : ''}`}
                  onClick={() => navigate('/manager/warehouse/parts')}
                >
                  Linh kiện
                </button>
                <button
                  className={`submenu-item ${isActive('/manager/warehouse/import') ? 'active' : ''}`}
                  onClick={() => navigate('/manager/warehouse/import/list')}
                >
                  Nhập kho
                </button>
                <button
                  className={`submenu-item ${isActive('/manager/warehouse/export') ? 'active' : ''}`}
                  onClick={() => navigate('/manager/warehouse/export/list')}
                >
                  Xuất kho
                </button>
                <button
                  className={`submenu-item ${isActive('/manager/warehouse/report') ? 'active' : ''}`}
                  onClick={() => navigate('/manager/warehouse/report')}
                >
                  Báo cáo
                </button>
              </div>
            )}
          </div>

          {/* Accountance Section */}
          <div className={`manager-nav-group ${openAccountance ? 'open' : ''}`}>
            <button
              className={`manager-nav-item ${isActiveParent('/manager/accountance') ? 'active' : ''}`}
              onClick={() => setOpenAccountance((v) => !v)}
            >
              <i className="bi bi-calculator" />
              <span>Accountance</span>
              <i className={`bi bi-caret-down-fill caret ${openAccountance ? 'rot' : ''}`} />
            </button>
            {openAccountance && (
              <div className="submenu">
                <div className="submenu-line" />
                <button
                  className={`submenu-item ${isActive('/manager/accountance') ? 'active' : ''}`}
                  onClick={() => navigate('/manager/accountance')}
                >
                  Thống kê
                </button>
                <button
                  className={`submenu-item ${isActive('/manager/accountance/finance') ? 'active' : ''}`}
                  onClick={() => navigate('/manager/accountance/finance')}
                >
                  Thu - Chi
                </button>
                <button
                  className={`submenu-item ${isActive('/manager/accountance/hr') ? 'active' : ''}`}
                  onClick={() => navigate('/manager/accountance/hr/list')}
                >
                  Nhân sự
                </button>
                <button
                  className={`submenu-item ${isActive('/manager/accountance/debts') ? 'active' : ''}`}
                  onClick={() => navigate('/manager/accountance/debts')}
                >
                  Công nợ
                </button>
                <button
                  className={`submenu-item ${isActive('/manager/accountance/payments') ? 'active' : ''}`}
                  onClick={() => navigate('/manager/accountance/payments')}
                >
                  Thanh toán
                </button>
              </div>
            )}
          </div>

          {/* System Management Section */}
          <div className={`manager-nav-group ${openSystem ? 'open' : ''}`}>
            <button
              className={`manager-nav-item ${isActiveParent('/manager/system') ? 'active' : ''}`}
              onClick={() => setOpenSystem((v) => !v)}
            >
              <i className="bi bi-gear" />
              <span>Hệ thống</span>
              <i className={`bi bi-caret-down-fill caret ${openSystem ? 'rot' : ''}`} />
            </button>
            {openSystem && (
              <div className="submenu">
                <div className="submenu-line" />
                <button
                  className={`submenu-item ${isActive('/manager/system/employees') ? 'active' : ''}`}
                  onClick={() => navigate('/manager/system/employees')}
                >
                  Quản lý nhân viên
                </button>
                <button
                  className={`submenu-item ${isActive('/manager/system/settings') ? 'active' : ''}`}
                  onClick={() => navigate('/manager/system/settings')}
                >
                  Cài đặt
                </button>
                <button
                  className={`submenu-item ${isActive('/manager/system/reports') ? 'active' : ''}`}
                  onClick={() => navigate('/manager/system/reports')}
                >
                  Báo cáo tổng hợp
                </button>
              </div>
            )}
          </div>
        </nav>
        
        <div className="manager-spacer" />
        
        {/* User Info with Dropdown */}
        <div className="manager-user-menu" ref={userMenuRef} style={{ position: 'relative' }}>
          <button 
            className="manager-user-info" 
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
            <div className="manager-user-dropdown" style={{
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
                className="manager-logout"
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
      <main className="manager-main">
        <div className="manager-content">
          {children}
        </div>
      </main>
    </div>
  )
}

