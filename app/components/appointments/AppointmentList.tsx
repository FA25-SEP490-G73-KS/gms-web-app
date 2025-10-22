import React, { useEffect, useMemo, useState } from "react";
import "bootstrap-icons/font/bootstrap-icons.css";
import "../../styles/dashboard.css";


// Dữ liệu từ API
interface ApiAppointment {
    appointmentId: number;
    customerName: string;
    licensePlate: string;
    appointmentDate: string;
    timeSlotLabel: string;
    serviceType?: string;
    status?: string;// "CANCELLED" | "ARRIVED" | "OVERDUE" | "CONFIRMED";
    note?: string;
    customerPhone?: string;
    createdAt?: string;
}

// Model UI
interface Appointment {
    id: string;
    customerName: string;
    license: string;
    phone: string;
    status: "Huỷ" | "Đã đến" | "Xác nhận" | "Quá hẹn";
    time: string;
    date: string;
    serviceType?: string;
    note?: string;
    createdAt?: string;
}

function statusToVi(code?: string): Appointment["status"] {
    switch (code) {
        case "CANCELLED":
            return "Huỷ";
        case "ARRIVED":
            return "Đã đến";
        case "OVERDUE":
            return "Quá hẹn";
        case "CONFIRMED":
        default:
            return "Xác nhận";
    }
}


function statusViToCode(status: Appointment["status"]): "CANCELLED" | "ARRIVED" | "OVERDUE" | "CONFIRMED" {
    switch (status) {
        case "Huỷ":
            return "CANCELLED";
        case "Đã đến":
            return "ARRIVED";
        case "Quá hẹn":
            return "OVERDUE";
        case "Xác nhận":
        default:
            return "CONFIRMED";
    }
}

function statusStyles(val: Appointment["status"]): React.CSSProperties {
    switch (val) {
        case "Huỷ":
            return { background: "#fee2e2", color: "#b91c1c" };
        case "Đã đến":
            return { background: "#dbeafe", color: "#1e3a8a" };
        case "Quá hẹn":
            return { background: "#fef3c7", color: "#92400e" };
        case "Xác nhận":
            return { background: "#dcfce7", color: "#065f46" };
        default:
            return {};
    }
}

function formatDate(iso: string): string {
    const [y, m, d] = iso.split("-");
    if (!y || !m || !d) return iso;
    return `${d}/${m}/${y}`;
}

function mapApiToUi(item: ApiAppointment): Appointment {
    return {
        id: String(item.appointmentId),
        customerName: item.customerName || "",
        license: item.licensePlate || "",
        phone: item.customerPhone  || "",
        status: statusToVi(item.status),
        time: item.timeSlotLabel || "",
        date: formatDate(item.appointmentDate || ""),
        serviceType: item.serviceType || "",
        note: item.note || "",
        createdAt: item.createdAt || "",
    };
}


export default function AppointmentList() {
    const [rows, setRows] = useState<Appointment[]>([]);
    const [allRows, setAllRows] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [query, setQuery] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const pageSize = 6;

    const [popupOpen, setPopupOpen] = useState(false);
    const [editing, setEditing] = useState(false);
    const [current, setCurrent] = useState<Appointment | null>(null);
    const [updating, setUpdating] = useState<Record<string, boolean>>({});

    async function handleChangeStatus(id: string, next: Appointment["status"]) {
        const prev = rows.find(r => r.id === id)?.status;
        if (!prev) return;
        // If already cancelled, do not allow further changes
        if (prev === "Huỷ") return;

        // Optimistic update
        setRows((prevRows) => prevRows.map((r) => (r.id === id ? { ...r, status: next } : r)));
        setUpdating((u) => ({ ...u, [id]: true }));
        try {
            const code = statusViToCode(next);
            const res = await fetch(`http://localhost:8080/api/appointments/${id}/status?status=${code}`, {
                method: "PATCH",
            headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: code }),
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
        } catch (err) {
            console.error("Cập nhật trạng thái thất bại", err);
            // Revert on failure
            setRows((prevRows) => prevRows.map((r) => (r.id === id ? { ...r, status: prev } : r)));
            alert("Cập nhật trạng thái thất bại. Vui lòng thử lại!");
        } finally {
            setUpdating((u) => {
                const { [id]: _, ...rest } = u;
                return rest;
            });
        }
    }

    useEffect(() => {
        let cancelled = false;
        async function load() {
            try {
                setLoading(true);
                setError(null);
                // Chuyển page UI (1-based) sang page server (0-based)
                const res = await fetch(`http://localhost:8080/api/appointments?page=${page - 1}&size=${pageSize}`);
                if (!res.ok) throw new Error(res.statusText);
                const data = await res.json();

                const content = Array.isArray(data) ? data : (data.content || []);
                const mapped = content.map(mapApiToUi);

                if (!cancelled) {
                    setRows(mapped);
                    setTotalPages(Array.isArray(data) ? 1 : (Number(data.totalPages) || 1));
                    // Lưu toàn bộ dữ liệu để search (nếu chưa có)
                    setAllRows(prev => [...prev, ...mapped.filter((m: { id: string; }) => !prev.some(p => p.id === m.id))]);

                }
            } catch (e) {
                if (!cancelled) setError("Không thể tải danh sách lịch hẹn");
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        load();
        return () => { cancelled = true; };
    }, [page]);

// Khi người dùng bắt đầu search, nếu chưa tải đủ dữ liệu thì tự tải tất cả các trang
    useEffect(() => {
        async function loadAllPages() {
            if (query.trim() && allRows.length < rows.length * totalPages) {
                try {
                    let all: Appointment[] = [];
                    for (let i = 0; i < totalPages; i++) {
                        const res = await fetch(`http://localhost:8080/api/appointments?page=${i}&size=${pageSize}`);
                        if (!res.ok) throw new Error(res.statusText);
                        const data = await res.json();
                        const content = Array.isArray(data) ? data : (data.content || []);
                        all.push(...content.map(mapApiToUi));
                    }
                    setAllRows(all);
                } catch (e) {
                    console.error("Không thể tải toàn bộ dữ liệu để tìm kiếm", e);
                }
            }
        }

        loadAllPages();
    }, [query]);

    const filtered = useMemo(() => {
        const key = query.toLowerCase().trim();

        // Nếu không có từ khóa => chỉ hiển thị trang hiện tại
        if (!key) return rows;

        // Nếu có từ khóa => lọc toàn bộ dữ liệu (tất cả các trang)
        return allRows.filter((r) =>
            [r.id, r.customerName, r.license, r.phone, r.status, r.time, r.date, r.serviceType || "", r.note || ""]
                .join(" ")
                .toLowerCase()
                .includes(key)
        );
    }, [rows, allRows, query]);


    const pageData = filtered;

    const openDetail = (row: Appointment) => {
        setCurrent(row);
        setEditing(false);
        setPopupOpen(true);
    };

    const closePopup = () => {
        setPopupOpen(false);
        setEditing(false);
    };

    const saveCurrent = () => {
        if (!current) return;
        setRows((prev) => prev.map((r) => (r.id === current.id ? current : r)));
        setEditing(false);
        setPopupOpen(false);
    };
  return (
    <div className="content-wrapper">
      {/* Stats */}
      <div className="stats">
        <div className="card">
          <div className="label">Lịch hẹn <span>Ngày</span></div>
          <div className="value">{rows.length} xe</div>
        </div>
        <div className="card">
          <div className="label">Sửa chữa <span>Ngày</span></div>
          <div className="value">10 xe</div>
        </div>
        <div className="card">
          <div className="label">Lượng khách <span>Tháng</span></div>
          <div className="value">150 người</div>
        </div>
      </div>

      {/* Table */}
      <div className="table-wrap">
        <div className="table-top">
          <h3>Lịch hẹn</h3>
          <div className="search">
            <i className="bi bi-search" />
            <input
              type="text"
              placeholder="Tìm kiếm"
              value={query}
              onChange={(e) => { setPage(1); setQuery(e.target.value); }}
            />
          </div>
        </div>

        {loading && <div style={{ padding: 12, color: "#6b7280" }}>Đang tải dữ liệu...</div>}
        {error && <div style={{ padding: 12, color: "#b91c1c" }}>{error}</div>}

        <table className="table" role="table">
          <thead>
            <tr>
              <th>No</th>
              <th>Khách Hàng</th>
              <th>Biển Số Xe</th>
              <th>Số điện thoại</th>
              <th>Trạng Thái</th>
              <th>Lịch hẹn</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {pageData.map((r) => (
              <tr key={r.id}>
                <td>{r.id}</td>
                <td>{r.customerName}</td>
                <td>{r.license}</td>
                <td>{r.phone}</td>
                <td>
                  <select
                    className="status-select"
                    value={r.status}
                    onChange={(e) => handleChangeStatus(r.id, e.target.value as Appointment["status"])}
                    style={statusStyles(r.status)}
                    aria-label="Trạng thái"
                    disabled={Boolean(updating[r.id]) || r.status === "Huỷ"}
                    title={r.status === "Huỷ" ? "Đã huỷ - không thể thay đổi" : (updating[r.id] ? "Đang cập nhật..." : undefined)}
                  >
                    <option value="Huỷ">Huỷ</option>
                    <option value="Đã đến">Đã đến</option>
                    <option value="Xác nhận">Xác nhận</option>
                      <option value="Quá hẹn">Quá hẹn</option>
                  </select>
                </td>
                <td>
                  {r.time}
                  <br />
                  <small>{r.date}</small>
                </td>
                <td>
                  <span className="icon-eye" role="button" aria-label="Xem chi tiết" onClick={() => openDetail(r)}>
                    <i className="bi bi-eye" />
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="table-footer">
          <div className="pagination">
            <button className="pg-btn" onClick={() => setPage((p) => Math.max(1, p - 1))} aria-label="Trang trước">‹</button>
            {Array.from({ length: totalPages }).map((_, i) => {
              const p = i + 1;
              return (
                <button key={p} className={"pg-btn" + (p === page ? " active" : "")} onClick={() => setPage(p)}>
                  {p}
                </button>
              );
            })}
            <button className="pg-btn" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} aria-label="Trang sau">›</button>
          </div>
        </div>
      </div>

      {/* Popup Detail */}
      <div className={"popup" + (popupOpen ? " active" : "")} onClick={(e) => { if (e.target === e.currentTarget) closePopup(); }}>
        <div className="popup-content" role="dialog" aria-modal="true" aria-labelledby="detailTitle">
          <h3 id="detailTitle">Chi tiết lịch hẹn</h3>

          <label>Tên khách hàng</label>
          <input
            readOnly={!editing}
            value={current?.customerName || ""}
            onChange={(e) => setCurrent((c) => (c ? { ...c, customerName: e.target.value } : c))}
          />

          <label>Số điện thoại</label>
          <input
            readOnly={!editing}
            value={current?.phone || ""}
            onChange={(e) => setCurrent((c) => (c ? { ...c, phone: e.target.value } : c))}
          />

          <label>Biển số xe</label>
          <input
            readOnly={!editing}
            value={current?.license || ""}
            onChange={(e) => setCurrent((c) => (c ? { ...c, license: e.target.value } : c))}
          />

          <label>Ngày đặt</label>
          <input readOnly={!editing} value={current?.date || ""} onChange={(e) => setCurrent((c) => (c ? { ...c, date: e.target.value } : c))} />

          <label>Giờ hẹn</label>
          <input readOnly={!editing} value={current?.time || ""} onChange={(e) => setCurrent((c) => (c ? { ...c, time: e.target.value } : c))} />

          <label>Loại dịch vụ</label>
          <input readOnly={!editing} value={current?.serviceType || ""} onChange={(e) => setCurrent((c) => (c ? { ...c, serviceType: e.target.value } : c))} />

          <label>Mô tả</label>
          <textarea readOnly={!editing} rows={3} value={current?.note || ""} onChange={(e) => setCurrent((c) => (c ? { ...c, note: e.target.value } : c))} />

          <div className="popup-buttons">
            <button className="btn btn-close" onClick={closePopup}>Đóng</button>
            {!editing && (
              <button className="btn btn-edit" onClick={() => setEditing(true)}>Chỉnh sửa</button>
            )}
            {editing && (
              <button className="btn btn-edit" onClick={saveCurrent}>Lưu</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
