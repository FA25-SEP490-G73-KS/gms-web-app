import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import { getUserNameFromToken, getUserPhoneFromToken } from '../utils/helpers'
import NotificationBell from '../components/common/NotificationBell'
import '../styles/layout/manager-layout.css'

/**
 * ManagerLayout - Layout dành cho role MANAGER
 * Manager có quyền truy cập các module trong hệ thống:
 * - Dashboard & Báo cáo
 * - Thu - chi (Finance, Payments)
 * - Công nợ (Debts)
 * - Nhân sự (HR: List, Attendance, Payroll)
 * - Quản lý khách hàng
 * - Quản lý nhà cung cấp
 * - Khuyến mãi
 */
export default function ManagerLayout({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { logout, user } = useAuthStore()
  
  // State for collapsible menu groups (persisted, không auto đóng/mở theo route)
  const [openFinance, setOpenFinance] = useState(() => {
    if (typeof window === 'undefined') return false
    const v = window.localStorage.getItem('manager_open_finance')
    return v ? v === 'true' : false
  })
  const [openCustomers, setOpenCustomers] = useState(() => {
    if (typeof window === 'undefined') return false
    const v = window.localStorage.getItem('manager_open_customers')
    return v ? v === 'true' : false
  })
  const [openHR, setOpenHR] = useState(() => {
    if (typeof window === 'undefined') return false
    const v = window.localStorage.getItem('manager_open_hr')
    return v ? v === 'true' : false
  })
  const [openService, setOpenService] = useState(() => {
    if (typeof window === 'undefined') return false
    const v = window.localStorage.getItem('manager_open_service')
    return v ? v === 'true' : false
  })
  const [openWarehouse, setOpenWarehouse] = useState(() => {
    if (typeof window === 'undefined') return false
    const v = window.localStorage.getItem('manager_open_warehouse')
    return v ? v === 'true' : false
  })
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const userMenuRef = useRef(null)

  // Lưu lại trạng thái mở/đóng group vào localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem('manager_open_finance', String(openFinance))
  }, [openFinance])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem('manager_open_customers', String(openCustomers))
  }, [openCustomers])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem('manager_open_hr', String(openHR))
  }, [openHR])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem('manager_open_service', String(openService))
  }, [openService])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem('manager_open_warehouse', String(openWarehouse))
  }, [openWarehouse])

  // Tự mở đúng nhóm menu theo route hiện tại, đóng các nhóm không liên quan
  useEffect(() => {
    const path = location.pathname || ''
    const next = {
      finance: path.startsWith('/manager/accountance'),
      hr: path.startsWith('/manager/accountance/hr'),
      customers: path.startsWith('/manager/customers'),
      service: path.startsWith('/manager/service'),
      warehouse: path.startsWith('/manager/warehouse')
    }
    setOpenFinance(next.finance)
    setOpenHR(next.hr)
    setOpenCustomers(next.customers)
    setOpenService(next.service)
    setOpenWarehouse(next.warehouse)
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
    if (path.startsWith('/manager/accountance/payments')) {
      return { parent: 'Thu - chi', parentPath: null, current: 'Thống kê' }
    }
    if (path.startsWith('/manager/accountance/finance')) {
      return { parent: 'Thu - chi', parentPath: null, current: 'Danh sách phiếu' }
    }
    if (path.startsWith('/manager/accountance/debts')) {
      return { parent: '', parentPath: null, current: 'Công nợ' }
    }
    if (path.startsWith('/manager/accountance/hr/payroll')) {
      return { parent: 'Nhân sự', parentPath: null, current: 'Lương' }
    }
    if (path.startsWith('/manager/accountance/hr/attendance')) {
      return { parent: 'Nhân sự', parentPath: null, current: 'Chấm công' }
    }
    if (path.startsWith('/manager/accountance/hr/list')) {
      return { parent: 'Nhân sự', parentPath: null, current: 'Danh sách nhân sự' }
    }
    if (path.startsWith('/manager/customers/') && !path.includes('/stats')) {
      return { grandParent: 'Khách hàng', parent: 'Danh sách khách hàng', parentPath: '/manager/customers', current: 'Thông tin khách hàng' }
    }
    if (path.startsWith('/manager/customers/stats')) {
      return { parent: 'Khách hàng', parentPath: null, current: 'Thống kê' }
    }
    if (path.startsWith('/manager/customers')) {
      return { parent: 'Khách hàng', parentPath: null, current: 'Danh sách khách hàng' }
    }
    if (path.startsWith('/manager/suppliers')) {
      return { parent: '', parentPath: null, current: 'Nhà cung cấp' }
    }
    if (path.startsWith('/manager/service/orders')) {
      return { parent: 'Dịch vụ', parentPath: null, current: 'Phiếu dịch vụ' }
    }
    if (path.startsWith('/manager/service/types')) {
      return { parent: 'Dịch vụ', parentPath: null, current: 'Loại dịch vụ' }
    }
    if (path.startsWith('/manager/warehouse/import-request')) {
      // Check if it's detail page (has ID in path)
      const isDetail = /\/manager\/warehouse\/import-request\/\d+/.test(path)
      if (isDetail) {
        return {
          grandParent: 'Kho',
          parent: 'Yêu cầu mua hàng',
          parentPath: '/manager/warehouse/import-request',
          current: 'Chi tiết'
        }
      }
      return { parent: 'Kho', parentPath: null, current: 'Yêu cầu mua hàng' }
    }
    return { parent: '', parentPath: null, current: 'Thống kê' }
  }

  const breadcrumb = getBreadcrumb()

  return (
    <div className={`manager-layout ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <header className="manager-header">
        <div className="manager-header-content">
          <div className="manager-topbar-left">
            <button
              className="manager-sidebar-toggle"
              onClick={() => setSidebarCollapsed((prev) => !prev)}
            >
              <i className={`bi ${sidebarCollapsed ? 'bi-chevron-right' : 'bi-chevron-left'}`}></i>
            </button>
            <div className="manager-breadcrumb-divider"></div>
            {breadcrumb.parent ? (
              <div className="manager-breadcrumb">
                {breadcrumb.grandParent && (
                  <>
                    <span className="manager-breadcrumb-item">{breadcrumb.grandParent}</span>
                    <span className="manager-breadcrumb-separator">&gt;</span>
                  </>
                )}
                {breadcrumb.parentPath ? (
                  <span 
                    className="manager-breadcrumb-item manager-breadcrumb-link"
                    onClick={() => navigate(breadcrumb.parentPath)}
                    style={{ cursor: 'pointer', color: '#666' }}
                  >
                    {breadcrumb.parent}
                  </span>
                ) : (
                  <span className="manager-breadcrumb-item">{breadcrumb.parent}</span>
                )}
                <span className="manager-breadcrumb-separator">&gt;</span>
                <span className="manager-breadcrumb-current">{breadcrumb.current}</span>
              </div>
            ) : (
              <span className="manager-breadcrumb-current">{breadcrumb.current}</span>
            )}
          </div>
          <div className="manager-topbar-right">
            <NotificationBell />
          </div>
        </div>
      </header>

      {/* Sidebar - Overlay on header */}
      <aside className="manager-sidebar">
        <div className="manager-brand" onClick={() => navigate('/manager')}>
          <img src="/image/mainlogo.png" alt="Logo" />
        </div>
        
        <nav className="manager-nav">
          <button
            className={`manager-nav-item ${isActive('/manager') ? 'active' : ''}`}
            onClick={() => navigate('/manager')}
          >
            <i className="bi bi-bar-chart" />
            <span>Thống kê</span>
          </button>

          <div className={`manager-nav-group ${openFinance ? 'open' : ''}`}>
            <button
              className={`manager-nav-item ${
                isActiveParent('/manager/accountance/finance') || isActiveParent('/manager/accountance/payments')
                  ? 'active'
                  : ''
              }`}
              onClick={() => setOpenFinance((v) => !v)}
            >
              <i className="bi bi-cash-stack" />
              <span>Thu - chi</span>
              <i className={`bi bi-caret-down-fill caret ${openFinance ? 'rot' : ''}`} />
            </button>
            {openFinance && (
              <div className="submenu">
                <div className="submenu-line" />
                <button
                  className={`submenu-item ${isActive('/manager/accountance/payments') ? 'active' : ''}`}
                  onClick={() => navigate('/manager/accountance/payments')}
                >
                  Thống kê
                </button>
                <button
                  className={`submenu-item ${isActive('/manager/accountance/finance') ? 'active' : ''}`}
                  onClick={() => navigate('/manager/accountance/finance')}
                >
                  Danh sách phiếu
                </button>
              </div>
            )}
          </div>
          
          <div className={`manager-nav-group ${openCustomers ? 'open' : ''}`}>
            <button
              className={`manager-nav-item ${isActiveParent('/manager/customers') ? 'active' : ''}`}
              onClick={() => setOpenCustomers((v) => !v)}
            >
              <i className="bi bi-people" />
              <span>Khách hàng</span>
              <i className={`bi bi-caret-down-fill caret ${openCustomers ? 'rot' : ''}`} />
            </button>
            {openCustomers && (
              <div className="submenu">
                <div className="submenu-line" />
                <button
                  className={`submenu-item ${isActive('/manager/customers/stats') ? 'active' : ''}`}
                  onClick={() => navigate('/manager/customers/stats')}
                >
                  Thống kê
                </button>
                <button
                  className={`submenu-item ${isActive('/manager/customers') ? 'active' : ''}`}
                  onClick={() => navigate('/manager/customers')}
                >
                  Danh sách khách hàng
                </button>
              </div>
            )}
          </div>

          <button
            className={`manager-nav-item ${isActive('/manager/accountance/debts') ? 'active' : ''}`}
            onClick={() => navigate('/manager/accountance/debts')}
          >
            <i className="bi bi-wallet2" />
            <span>Công nợ</span>
          </button>

          <div className={`manager-nav-group ${openHR ? 'open' : ''}`}>
            <button
              className={`manager-nav-item ${isActiveParent('/manager/accountance/hr') ? 'active' : ''}`}
              onClick={() => setOpenHR((v) => !v)}
            >
              <i className="bi bi-person-badge" />
              <span>Nhân sự</span>
              <i className={`bi bi-caret-down-fill caret ${openHR ? 'rot' : ''}`} />
            </button>
            {openHR && (
              <div className="submenu">
                <div className="submenu-line" />
                <button
                  className={`submenu-item ${isActive('/manager/accountance/hr/list') ? 'active' : ''}`}
                  onClick={() => navigate('/manager/accountance/hr/list')}
                >
                  Danh sách nhân sự
                </button>
                <button
                  className={`submenu-item ${isActive('/manager/accountance/hr/attendance') ? 'active' : ''}`}
                  onClick={() => navigate('/manager/accountance/hr/attendance')}
                >
                  Chấm công
                </button>
                <button
                  className={`submenu-item ${isActive('/manager/accountance/hr/payroll') ? 'active' : ''}`}
                  onClick={() => navigate('/manager/accountance/hr/payroll')}
                >
                  Lương
                </button>
              </div>
            )}
          </div>

          <div className={`manager-nav-group ${openService ? 'open' : ''}`}>
            <button
              className={`manager-nav-item ${isActiveParent('/manager/service') ? 'active' : ''}`}
              onClick={() => setOpenService((v) => !v)}
            >
              <i className="bi bi-wrench" />
              <span>Dịch vụ</span>
              <i className={`bi bi-caret-down-fill caret ${openService ? 'rot' : ''}`} />
            </button>
            {openService && (
              <div className="submenu">
                <div className="submenu-line" />
                <button
                  className={`submenu-item ${isActive('/manager/service/orders') ? 'active' : ''}`}
                  onClick={() => navigate('/manager/service/orders')}
                >
                  Phiếu dịch vụ
                </button>
                <button
                  className={`submenu-item ${isActive('/manager/service/types') ? 'active' : ''}`}
                  onClick={() => navigate('/manager/service/types')}
                >
                  Loại dịch vụ
                </button>
              </div>
            )}
          </div>

          <button
            className={`manager-nav-item ${isActive('/manager/suppliers') ? 'active' : ''}`}
            onClick={() => navigate('/manager/suppliers')}
          >
            <i className="bi bi-truck" />
            <span>Nhà cung cấp</span>
          </button>

          <div className={`manager-nav-group ${openWarehouse ? 'open' : ''}`}>
            <button
              className={`manager-nav-item ${isActiveParent('/manager/warehouse') ? 'active' : ''}`}
              onClick={() => setOpenWarehouse((v) => !v)}
            >
              <i className="bi bi-box-seam" />
              <span>Kho</span>
              <i className={`bi bi-caret-down-fill caret ${openWarehouse ? 'rot' : ''}`} />
            </button>
            {openWarehouse && (
              <div className="submenu">
                <div className="submenu-line" />
                <button
                  className={`submenu-item ${isActiveParent('/manager/warehouse/import-request') ? 'active' : ''}`}
                  onClick={() => navigate('/manager/warehouse/import-request')}
                >
                  Yêu cầu mua hàng
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
          >
            <div className="manager-user-avatar">
              <i className="bi bi-person-fill" />
            </div>
            <div className="manager-user-text">
              <div className="manager-user-name">
                {getUserNameFromToken() || user?.name || user?.fullName || 'Nguyễn Văn A'}
              </div>
              <div className="manager-user-role">
                {getUserPhoneFromToken() || user?.phone || ''}
              </div>
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

