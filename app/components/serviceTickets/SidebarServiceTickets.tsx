import { useState } from "react";
import { Link } from "react-router";

export default function SidebarServiceTickets() {
  const [openMenu, setOpenMenu] = useState<string | null>("service");
  const toggleMenu = (menu: string) => setOpenMenu((prev) => (prev === menu ? null : menu));
  const isOpen = (menu: string) => openMenu === menu;

  return (
    <aside className="sidebar">
      <ul className="nav">
        <li>
          <Link to="/appointments"><i className="bi bi-calendar3"/> Lịch hẹn</Link>
        </li>

        <li>
          <button
            type="button"
            className={isOpen("service") ? "open active" : "active"}
            onClick={() => toggleMenu("service")}
            aria-expanded={isOpen("service")}
            aria-controls="submenu-service"
          >
            <i className="bi bi-tools"/> Phiếu dịch vụ <span className="chev">▾</span>
          </button>
          <div id="submenu-service" className={`submenu ${isOpen("service") ? "open" : ""}`}>
            <Link to="#"><i className="bi bi-plus-lg"/> Tạo phiếu</Link>
            <Link to="/service-tickets" className="active"><i className="bi bi-card-checklist"/> Danh sách phiếu</Link>
            <Link to="#"><i className="bi bi-clock-history"/> Lịch sử xử lý</Link>
          </div>
        </li>

        <li><Link to="#"><i className="bi bi-shield-shaded"/> Bảo hành</Link></li>
        <li><Link to="#"><i className="bi bi-box-arrow-right"/> Logout</Link></li>
      </ul>
    </aside>
  );
}
