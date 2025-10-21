import React, { useEffect, useMemo, useState } from "react";
import "bootstrap-icons/font/bootstrap-icons.css";
import "../../styles/dashboard.css";

// UI model for a Service Ticket row
interface TicketRow {
    id: string;
    customerName: string;
    license: string;
    status:
        | "Huỷ"
        | "Hoàn thành"
        | "Duyệt"
        | "Đang sửa chữa"
        | "Chờ báo giá"
        | "Không duyệt"
        | "Chờ thanh toán"
        | "Chờ công nợ";
    createdDate: string; // DD/MM/YYYY
    total: number | null; // VND (may be null if API doesn't provide)
}

function formatCurrency(n: number) {
    try {
        return n.toLocaleString("vi-VN");
    } catch {
        return String(n);
    }
}

function statusStyle(status: TicketRow["status"]): React.CSSProperties {
    switch (status) {
        case "Huỷ":
            return { background: "#f56565", color: "#821414" };
        case "Hoàn thành":
            return { background: "#d1fae5", color: "#065f46" };
        case "Duyệt":
            return { background: "#dbeafe", color: "#1d4ed8" };
        case "Đang sửa chữa":
            return { background: "#fef3c7", color: "#92400e" };
        case "Chờ báo giá":
            return { background: "#e9d5ff", color: "#6b21a8" };
        case "Không duyệt":
            return { background: "#ffe4e6", color: "#9f1239" };
        case "Chờ thanh toán":
            return { background: "#f0fdf4", color: "#166534" };
        case "Chờ công nợ":
            return { background: "#f1f5f9", color: "#334155" };
        default:
            return {};
    }
}

function optionStyle(status: TicketRow["status"]): React.CSSProperties {
    // Colors for dropdown options (light background + dark text)
    switch (status) {
        case "Huỷ":
            return { backgroundColor: "#fee2e2", color: "#991b1b" };
        case "Hoàn thành":
            return { backgroundColor: "#d1fae5", color: "#065f46" };
        case "Duyệt":
            return { backgroundColor: "#dbeafe", color: "#1d4ed8" };
        case "Đang sửa chữa":
            return { backgroundColor: "#fef3c7", color: "#d97706" };
        case "Chờ báo giá":
            return { backgroundColor: "#e9d5ff", color: "#6b21a8" };
        case "Không duyệt":
            return { backgroundColor: "#ffe4e6", color: "#9f1239" };
        case "Chờ thanh toán":
            return { backgroundColor: "#f0fdf4", color: "#166534" };
        case "Chờ công nợ":
            return { backgroundColor: "#f1f5f9", color: "#334155" };
        default:
            return {};
    }
}

// API models
interface ApiServiceTicket {
    serviceTicketId: number;
    appointmentId?: number | null;
    customerId?: number | null;
    vehicleId?: number | null;
    status?: string;
    notes?: string | null;
    createdAt?: string | null;
    deliveryAt?: string | null;
    fullName?: string | null;
    phone?: string | null;
    zaloId?: string | null;
    address?: string | null;
    customerType?: string | null;
    loyaltyLevel?: string | null;
    licensePlate?: string | null;
    brand?: string | null;
    model?: string | null;
    year?: number | null;
    vin?: string | null;
}

interface ApiServiceTicketResponse {
    content: ApiServiceTicket[];
    totalElements?: number;
}

function statusCodeToVi(code?: string): TicketRow["status"] {
    switch ((code || "DUYET").toUpperCase()) {
        case "HUY":
        case "CANCELLED":
            return "Huỷ";
        case "HOAN_THANH":
        case "COMPLETED":
            return "Hoàn thành";
        case "DANG_SUA_CHUA":
            return "Đang sửa chữa";
        case "CHO_BAO_GIA":
            return "Chờ báo giá";
        case "KHONG_DUYET":
            return "Không duyệt";
        case "CHO_THANH_TOAN":
            return "Chờ thanh toán";
        case "CHO_CONG_NO":
            return "Chờ công nợ";
        case "DUYET":
        default:
            return "Duyệt";
    }
}

function viToCode(label: TicketRow["status"]): string {
    switch (label) {
        case "Huỷ":
            return "HUY";
        case "Hoàn thành":
            return "HOAN_THANH";
        case "Đang sửa chữa":
            return "DANG_SUA_CHUA";
        case "Chờ báo giá":
            return "CHO_BAO_GIA";
        case "Không duyệt":
            return "KHONG_DUYET";
        case "Chờ thanh toán":
            return "CHO_THANH_TOAN";
        case "Chờ công nợ":
            return "CHO_CONG_NO";
        case "Duyệt":
        default:
            return "DUYET";
    }
}

function formatDate(iso?: string | null): string {
    if (!iso) return "";
    try {
        const d = new Date(iso);
        const dd = String(d.getDate()).padStart(2, "0");
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const yyyy = d.getFullYear();
        return `${dd}/${mm}/${yyyy}`;
    } catch {
        return String(iso);
    }
}

export default function ServiceTicketList() {
    const [rows, setRows] = useState<TicketRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [query, setQuery] = useState("");
    const [page, setPage] = useState(1);
    const pageSize = 6;

    // popup state
    const [popupOpen, setPopupOpen] = useState(false);
    const [detail, setDetail] = useState<ApiServiceTicket | null>(null);
        const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        let cancelled = false;
        async function load() {
            try {
                setLoading(true);
                setError(null);
                const res = await fetch("http://localhost:8080/api/service-tickets");
                if (!res.ok) throw new Error(res.statusText);
                const data = await res.json();
                const list: ApiServiceTicket[] = Array.isArray(data)
                    ? data
                    : data?.content || [];
                const mapped: TicketRow[] = list.map((it) => ({
                    id: String(it.serviceTicketId),
                    customerName: it.fullName || "",
                    license: it.licensePlate || "",
                    status: statusCodeToVi(it.status),
                    createdDate: formatDate(it.createdAt),
                    total: null,
                }));
                if (!cancelled) setRows(mapped);
            } catch (e) {
                console.error("Không thể tải danh sách phiếu dịch vụ", e);
                if (!cancelled) setError("Không thể tải danh sách phiếu dịch vụ");
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        load();
        return () => {
            cancelled = true;
        };
    }, []);

    const filtered = useMemo(() => {
        const key = query.toLowerCase().trim();
        if (!key) return rows;
        return rows.filter((r) =>
            [r.id, r.customerName, r.license, r.status, r.createdDate, r.total ?? ""]
                .join(" ")
                .toLowerCase()
                .includes(key)
        );
    }, [rows, query]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const pageData = filtered.slice((page - 1) * pageSize, page * pageSize);

    const handleChangeStatus = async (id: string, next: TicketRow["status"]) => {
        const prevStatus = rows.find((r) => r.id === id)?.status;
        if (!prevStatus || prevStatus === next) return;

        // Optimistic update
        setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status: next } : r)));
        setUpdatingIds((prev) => {
            const ns = new Set(prev);
            ns.add(id);
            return ns;
        });

        try {
            const code = viToCode(next);
            const res = await fetch(`http://localhost:8080/api/service-tickets/update-service-ticket/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: code }),
            });
            if (!res.ok) {
                const text = await res.text().catch(() => "");
                throw new Error(text || res.statusText);
            }
            alert("Cập nhật trạng thái thành công!");
        } catch (err: any) {
            // Rollback
            setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status: prevStatus } : r)));
            console.error("Update ticket status failed:", err);
            alert(`Cập nhật trạng thái thất bại. Vui lòng thử lại.\n${err?.message || ""}`);
        } finally {
            setUpdatingIds((prev) => {
                const ns = new Set(prev);
                ns.delete(id);
                return ns;
            });
        }
    };

    const openDetail = async (id: string) => {
        try {
            const res = await fetch(`http://localhost:8080/api/service-tickets/${id}`);
            if (!res.ok) throw new Error(res.statusText);
            const data = await res.json();
            setDetail(data);
            setPopupOpen(true);
        } catch (err) {
            alert("Không thể tải chi tiết phiếu dịch vụ.");
        }
    };

    const closePopup = () => {
        setPopupOpen(false);
        setDetail(null);
    };

    return (
        <div className="content-wrapper">
            <div className="table-wrap">
                <div className="table-top">
                    <h3>Phiếu dịch vụ gần đây:</h3>
                    <div className="search">
                        <i className="bi bi-search" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm"
                            value={query}
                            onChange={(e) => {
                                setPage(1);
                                setQuery(e.target.value);
                            }}
                        />
                    </div>
                </div>

                {loading && (
                    <div style={{ padding: 12, color: "#6b7280" }}>
                        Đang tải dữ liệu...
                    </div>
                )}
                {error && (
                    <div style={{ padding: 12, color: "#b91c1c" }}>{error}</div>
                )}

                <table>
                    <thead>
                    <tr>
                        <th>No</th>
                        <th>Khách Hàng</th>
                        <th>Biển Số Xe</th>
                        <th>Trạng Thái</th>
                        <th>Ngày Tạo</th>
                        <th>Tổng Tiền</th>
                        <th></th>
                    </tr>
                    </thead>
                    <tbody>
                    {pageData.map((r) => (
                        <tr key={r.id} onClick={() => openDetail(r.id)} style={{ cursor: "pointer" }}>
                            <td>{r.id}</td>
                            <td>{r.customerName}</td>
                            <td>{r.license}</td>
                            <td>
                                <select
                                    className="status-select"
                                    value={r.status}
                                    onChange={(e) =>
                                        handleChangeStatus(
                                            r.id,
                                            e.target.value as TicketRow["status"]
                                        )
                                    }
                                    onClick={(e) => e.stopPropagation()}
                                    style={statusStyle(r.status)}
                                    aria-label="Trạng thái phiếu"
                                    disabled={updatingIds.has(r.id)}
                                >
                                    <option value="Huỷ" style={optionStyle("Huỷ")}>Huỷ</option>
                                    <option value="Hoàn thành" style={optionStyle("Hoàn thành")}>Hoàn thành</option>
                                    <option value="Duyệt" style={optionStyle("Duyệt")}>Duyệt</option>
                                    <option value="Đang sửa chữa" style={optionStyle("Đang sửa chữa")}>Đang sửa chữa</option>
                                    <option value="Chờ báo giá" style={optionStyle("Chờ báo giá")}>Chờ báo giá</option>
                                    <option value="Không duyệt" style={optionStyle("Không duyệt")}>Không duyệt</option>
                                    <option value="Chờ thanh toán" style={optionStyle("Chờ thanh toán")}>Chờ thanh toán</option>
                                    <option value="Chờ công nợ" style={optionStyle("Chờ công nợ")}>Chờ công nợ</option>
                                </select>
                            </td>
                            <td>{r.createdDate}</td>
                            <td>{r.total != null ? formatCurrency(r.total) : "—"}</td>
                            <td></td>
                        </tr>
                    ))}
                    </tbody>
                </table>

                <div className="table-footer">
                    <div className="pagination">
                        <button
                            className="pg-btn"
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            aria-label="Trang trước"
                        >
                            ‹
                        </button>
                        {Array.from({ length: totalPages }).map((_, i) => {
                            const p = i + 1;
                            return (
                                <button
                                    key={p}
                                    className={"pg-btn" + (p === page ? " active" : "")}
                                    onClick={() => setPage(p)}
                                >
                                    {p}
                                </button>
                            );
                        })}
                        <button
                            className="pg-btn"
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            aria-label="Trang sau"
                        >
                            ›
                        </button>
                    </div>
                </div>
            </div>

            {/* Popup Detail */}
            {popupOpen && detail && (
                <div
                    className="popup active"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) closePopup();
                    }}
                >
                    <div className="popup-content" role="dialog" aria-modal="true">
                        <h3>Chi tiết phiếu dịch vụ</h3>
                        <div className="detail-grid">

                            <label><b>Service Ticket ID:</b>
                                <input type="text" value={detail.serviceTicketId ?? ""} readOnly />
                            </label>

                            <label><b>Appointment ID:</b>
                                <input type="text" value={detail.appointmentId ?? ""} readOnly />
                            </label>

                            <label><b>Tên khách hàng:</b>
                                <input type="text" value={detail.fullName ?? ""} readOnly />
                            </label>

                            <label><b>Biển số xe:</b>
                                <input type="text" value={detail.licensePlate ?? ""} readOnly />
                            </label>

                            <label><b>Trạng thái :</b>
                                <input type="text" value={statusCodeToVi(detail.status)} readOnly />
                            </label>

                            <label><b>Ghi chú:</b>
                                <input type="text" value={detail.notes ?? ""} readOnly />
                            </label>

                            <label><b>Ngày tạo:</b>
                                <input type="text" value={formatDate(detail.createdAt)} readOnly />
                            </label>

                            <label><b>Ngày giao / deliveryAt:</b>
                                <input type="text" value={formatDate(detail.deliveryAt)} readOnly />
                            </label>

                            <label><b>Số điện thoại:</b>
                                <input type="text" value={detail.phone ?? ""} readOnly />
                            </label>

                            <label><b>Zalo ID:</b>
                                <input type="text" value={detail.zaloId ?? ""} readOnly />
                            </label>

                            <label><b>Địa chỉ:</b>
                                <input type="text" value={detail.address ?? ""} readOnly />
                            </label>

                            <label><b>Loại khách:</b>
                                <input type="text" value={detail.customerType ?? ""} readOnly />
                            </label>

                            <label><b>Hạng khách:</b>
                                <input type="text" value={detail.loyaltyLevel ?? ""} readOnly />
                            </label>

                            <label><b>Hãng:</b>
                                <input type="text" value={detail.brand ?? ""} readOnly />
                            </label>

                            <label><b>Dòng / Model:</b>
                                <input type="text" value={detail.model ?? ""} readOnly />
                            </label>

                            <label><b>Năm:</b>
                                <input type="text" value={detail.year ?? ""} readOnly />
                            </label>

                            <label><b>VIN:</b>
                                <input type="text" value={detail.vin ?? ""} readOnly />
                            </label>

                        </div>

                        <button className="btn btn-close" onClick={closePopup}>
                            Đóng
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
}
