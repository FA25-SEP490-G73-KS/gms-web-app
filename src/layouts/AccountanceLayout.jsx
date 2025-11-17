import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import '../styles/layout/warehouse-layout.css'

export default function AccountanceLayout({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [openHR, setOpenHR] = useState(location.pathname.startsWith('/accountance/hr'))
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  useEffect(() => {
    if (location.pathname.startsWith('/accountance/hr')) {
      setOpenHR(true)
    }
  }, [location.pathname])

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
    return { parent: '', current: 'Kế toán' }
  }

  const breadcrumb = getBreadcrumb()

  return (
    <div className={`warehouse-layout ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <aside className="warehouse-sidebar">
        <div className="warehouse-brand" onClick={() => navigate('/accountance')}>
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
        </nav>
        <div className="warehouse-spacer" />
        <button className="warehouse-logout" onClick={() => navigate('/')}>
          <i className="bi bi-box-arrow-right" />
          <span>Đăng xuất</span>
        </button>
      </aside>

      <main className="warehouse-main">
        <div className="warehouse-topbar">
          <div className="warehouse-topbar-left">
            <button
              className={`sidebar-toggle-btn ${sidebarCollapsed ? 'collapsed' : ''}`}
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
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
          <div className="warehouse-topbar-right">
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

