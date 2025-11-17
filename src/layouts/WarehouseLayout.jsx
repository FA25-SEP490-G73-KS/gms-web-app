import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import '../styles/layout/warehouse-layout.css'

export default function WarehouseLayout({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [openImport, setOpenImport] = useState(location.pathname.startsWith('/warehouse/import'))
  const [openExport, setOpenExport] = useState(location.pathname.startsWith('/warehouse/export'))
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

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

  // Breadcrumb mapping based on route
  const getBreadcrumb = () => {
    const path = location.pathname
    if (path.startsWith('/warehouse/export/request')) {
      return { parent: 'Xuất kho', current: 'Yêu cầu xuất hàng' }
    } else if (path.startsWith('/warehouse/export/list')) {
      return { parent: 'Xuất kho', current: 'Danh sách xuất' }
    } else if (path.startsWith('/warehouse/export/create')) {
      return { parent: 'Xuất kho', current: 'Tạo phiếu' }
    } else if (path.startsWith('/warehouse/import/request')) {
      return { parent: 'Nhập kho', current: 'Yêu cầu nhập hàng' }
    } else if (path.startsWith('/warehouse/import/list')) {
      return { parent: 'Nhập kho', current: 'Danh sách nhập' }
    } else if (path.startsWith('/warehouse/import/create')) {
      return { parent: 'Nhập kho', current: 'Tạo phiếu' }
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
      <aside className="warehouse-sidebar">
        <div className="warehouse-brand" onClick={() => navigate('/warehouse')}>
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
                <button 
                  className={`submenu-item ${isActive('/warehouse/import/create') ? 'active' : ''}`}
                  onClick={() => navigate('/warehouse/import/create')}
                >
                  Tạo phiếu
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
                <button 
                  className={`submenu-item ${isActive('/warehouse/export/create') ? 'active' : ''}`}
                  onClick={() => navigate('/warehouse/export/create')}
                >
                  Tạo phiếu
                </button>
              </div>
            )}
          </div>
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
            {breadcrumb.parent && (
              <div className="breadcrumb">
                <span className="breadcrumb-item">{breadcrumb.parent}</span>
                <i className="bi bi-chevron-right breadcrumb-separator"></i>
                <span className="breadcrumb-item breadcrumb-current">{breadcrumb.current}</span>
              </div>
            )}
            {!breadcrumb.parent && (
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

