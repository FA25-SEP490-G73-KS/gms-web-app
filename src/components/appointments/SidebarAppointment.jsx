import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

export default function SidebarAppointment() {
    const location = useLocation();
    const [openMenu, setOpenMenu] = useState(null);

    // Mở submenu tự động khi ở route /service-tickets hoặc subroute của nó
    useEffect(() => {
        if (location.pathname.startsWith('/service-tickets')) {
            setOpenMenu('service');
        } else {
            setOpenMenu(null);
        }
    }, [location.pathname]);

    const toggleMenu = (menu) => {
        setOpenMenu(prev => (prev === menu ? null : menu));
    };

    const isOpen = (menu) => openMenu === menu;

    // Kiểm tra nút Phiếu dịch vụ active
    const isServiceActive = location.pathname.startsWith('/service-tickets');

    return (
        <aside className="sidebar">
            <ul className="nav">
                <li>
                    <NavLink
                        to="/appointments"
                        className={({ isActive }) => (isActive ? 'active' : undefined)}
                    >
                        <i className="bi bi-calendar3"></i> Lịch hẹn
                    </NavLink>
                </li>

                <li>
                    {/* Button Phiếu dịch vụ */}
                    <button
                        type="button"
                        className={isServiceActive ? 'active' : undefined} // highlight khi active
                        onClick={() => toggleMenu('service')}
                        aria-expanded={isOpen('service')}
                        aria-controls="submenu-service"
                    >
                        <i className="bi bi-tools"></i> Phiếu dịch vụ <span className="chev">▾</span>
                    </button>

                    {/* Submenu */}
                    <div
                        id="submenu-service"
                        className={`submenu ${isOpen('service') ? 'open' : ''}`}
                    >
                        <NavLink
                            to="/service-tickets-new"
                            className={({ isActive }) => (isActive ? 'active' : undefined)}
                        >
                            <i className="bi bi-plus-lg"></i> Tạo phiếu
                        </NavLink>
                        <NavLink
                            to="/service-tickets"
                            className={({ isActive }) => (isActive ? 'active' : undefined)}
                        >
                            <i className="bi bi-card-checklist"></i> Danh sách phiếu
                        </NavLink>
                        <NavLink
                            to="/service-tickets/history"
                            className={({ isActive }) => (isActive ? 'active' : undefined)}
                        >
                            <i className="bi bi-clock-history"></i> Lịch sử xử lý
                        </NavLink>
                    </div>
                </li>

                <li>
                    <NavLink
                        to="/warranty"
                        className={({ isActive }) => (isActive ? 'active' : undefined)}
                    >
                        <i className="bi bi-shield-shaded"></i> Bảo hành
                    </NavLink>
                </li>
                <li>
                    <NavLink
                        to="/logout"
                        className={({ isActive }) => (isActive ? 'active' : undefined)}
                    >
                        <i className="bi bi-box-arrow-right"></i> Logout
                    </NavLink>
                </li>
            </ul>
        </aside>
    );
}

