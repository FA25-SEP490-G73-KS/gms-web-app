import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import { getUserNameFromToken } from '../utils/helpers'
import '../styles/layout/warehouse-layout.css'

export default function WarehouseLayout({ children, breadcrumbItems }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [openImport, setOpenImport] = useState(location.pathname.startsWith('/warehouse/import'))
  const [openExport, setOpenExport] = useState(location.pathname.startsWith('/warehouse/export'))
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const userMenuRef = useRef(null)
  const { user, logout } = useAuthStore()

  const isActive = (to) => location.pathname === to
  const isActiveParent = (path) => location.pathname.startsWith(path)

  useEffect(() => {
    if (location.pathname.startsWith('/warehouse/import')) {
      setOpenImport(true)
    }
    if (location.pathname.startsWith('/warehouse/export')) {
      setOpenExport(true)
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

  // Breadcrumb mapping based on route
  const getBreadcrumb = () => {
    const path = location.pathname
    if (path.startsWith('/warehouse/create-ticket')) {
      return { parent: '', current: 'Tạo phiếu' }
    } else if (path.startsWith('/warehouse/export/request')) {
      return { parent: 'Xuất kho', current: 'Xác nhận báo giá' }
    } else if (path.startsWith('/warehouse/export/list')) {
      return { parent: 'Xuất kho', current: 'Danh sách xuất' }
    } else if (path.startsWith('/warehouse/import/request')) {
      return { parent: 'Nhập kho', current: 'Yêu cầu nhập hàng' }
    } else if (path.startsWith('/warehouse/import/list')) {
      return { parent: 'Nhập kho', current: 'Danh sách nhập' }
    } else if (path.startsWith('/warehouse/parts')) {
      return { parent: '', current: 'Danh sách linh kiện' }
    } else if (path.startsWith('/warehouse/report')) {
      return { parent: '', current: 'Báo cáo' }
    }
    return { parent: '', current: 'Trang chủ' }
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
            {breadcrumbItems ? (
              <div className="breadcrumb">
                {breadcrumbItems.map((item, index) => (
                  <React.Fragment key={index}>
                    {index > 0 && <span className="breadcrumb-separator">&gt;</span>}
                    {item.path ? (
                      <span 
                        className="breadcrumb-item breadcrumb-link"
                        onClick={() => navigate(item.path)}
                        style={{ cursor: 'pointer' }}
                      >
                        {item.label}
                      </span>
                    ) : (
                      <span className="breadcrumb-current">{item.label}</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            ) : breadcrumb.parent ? (
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
        <div className="warehouse-brand" onClick={() => navigate('/warehouse')} style={{ marginTop: '10px' }}>
          <img src="/image/mainlogo.png" alt="Logo" />
        </div>
        <nav className="warehouse-nav">
          <button
            className={`warehouse-nav-item ${isActive('/warehouse/report') ? 'active' : ''}`}
            onClick={() => navigate('/warehouse/report')}
          >
            <i className="bi bi-bar-chart" />
            <span>Báo cáo</span>
          </button>

          <button
            className={`warehouse-nav-item ${isActive('/warehouse/parts') ? 'active' : ''}`}
            onClick={() => navigate('/warehouse/parts')}
          >
            <i className="bi bi-calendar-check" />
            <span>Danh sách linh kiện</span>
          </button>

          <div className={`warehouse-nav-group ${openImport ? 'open' : ''}`}>
            <button
              className={`warehouse-nav-item ${isActiveParent('/warehouse/import') ? 'active' : ''}`}
              onClick={() => setOpenImport((v) => !v)}
            >
              <i className="bi bi-box-arrow-in-down" />
              <span>Nhập kho</span>
              <i className={`bi bi-caret-down-fill caret ${openImport ? 'rot' : ''}`} />
            </button>
            {openImport && (
              <div className="submenu">
                <div className="submenu-line" />
                <button 
                  className={`submenu-item ${isActive('/warehouse/import/list') ? 'active' : ''}`}
                  onClick={() => navigate('/warehouse/import/list')}
                >
                  Danh sách nhập
                </button>
              </div>
            )}
          </div>

          <div className={`warehouse-nav-group ${openExport ? 'open' : ''}`}>
            <button
              className={`warehouse-nav-item ${isActiveParent('/warehouse/export') ? 'active' : ''}`}
              onClick={() => setOpenExport((v) => !v)}
            >
              <i className="bi bi-box-arrow-up" />
              <span>Xuất kho</span>
              <i className={`bi bi-caret-down-fill caret ${openExport ? 'rot' : ''}`} />
            </button>
            {openExport && (
              <div className="submenu">
                <div className="submenu-line" />
                <button 
                  className={`submenu-item ${isActive('/warehouse/export/list') ? 'active' : ''}`}
                  onClick={() => navigate('/warehouse/export/list')}
                >
                  Danh sách xuất
                </button>
                <button 
                  className={`submenu-item ${isActive('/warehouse/export/request') ? 'active' : ''}`}
                  onClick={() => navigate('/warehouse/export/request')}
                >
                  Xác nhận báo giá
                </button>
              </div>
            )}
          </div>

          {/* Tạo phiếu */}
          <button 
            className={`warehouse-nav-item ${isActive('/warehouse/create-ticket') ? 'active' : ''}`}
            onClick={() => navigate('/warehouse/create-ticket')}
          >
            <i className="bi bi-receipt" />
            <span>Tạo phiếu</span>
          </button>
        </nav>
        <div className="warehouse-spacer" />
        
        {/* User Info with Dropdown */}
        <div className="warehouse-user-menu" ref={userMenuRef} style={{ position: 'relative' }}>
          <button 
            className="warehouse-user-info" 
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <div className="warehouse-user-avatar">
              <i className="bi bi-person-fill" />
            </div>
            <div className="warehouse-user-text">
              <div className="warehouse-user-name">
                {getUserNameFromToken() || user?.name || user?.fullName || 'Nguyễn Văn A'}
              </div>
              <div className="warehouse-user-role">
              {getUserNameFromToken() || user?.name || user?.fullName || 'Nguyễn Văn A'}
              </div>
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

