import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import '../styles/layout/warehouse-layout.css'

export default function WarehouseLayout({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [openImport, setOpenImport] = useState(location.pathname.startsWith('/warehouse/import'))
  const [openExport, setOpenExport] = useState(location.pathname.startsWith('/warehouse/export'))

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

  return (
    <div className="warehouse-layout">
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
                  className={`submenu-item ${isActive('/warehouse/import/request') ? 'active' : ''}`}
                  onClick={() => navigate('/warehouse/import/request')}
                >
                  Yêu cầu nhập hàng
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
                  Yêu cầu xuất hàng
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
            <img src="/image/mainlogo.png" alt="Logo" style={{ height: 40, width: 'auto' }} />
            <span className="brand-gold">Garage</span>
            <span className="brand-strong">Hoàng Tuấn</span>
            <span className="greeting">Xin chào!</span>
          </div>
          <div className="warehouse-topbar-right">
            <i className="bi bi-bell" style={{ fontSize: 18 }}></i>
            <span className="user-name">Tên</span>
          </div>
        </div>
        {children}
      </main>
    </div>
  )
}

