import AdminLayout from '../../layouts/AdminLayout'
import '/src/styles/pages/admin/admin-appointments.css'
import { useMemo, useState } from 'react'
import { Modal, Descriptions, Tag, Dropdown } from 'antd'

const PAGE_SIZE_OPTIONS = [6, 10, 20]

const MOCK_DATA = Array.from({ length: 26 }).map((_, i) => ({
  id: i + 1,
  customer: 'Phạm Văn A',
  license: '25A-123456',
  phone: '0123456789',
  status: ['Bị huỷ', 'Đã đến', 'Quá hạn', 'Chờ'][i % 4],
  time: ['7:30 - 9:30', '9:30 - 11:30', '13:30 - 15:30'][i % 3],
  date: ['12/10/2025', '11/10/2025'][i % 2]
}))

const STATUS_ITEMS = [
  { key: 'Chờ', color: '#FFB7B7' },
  { key: 'Bị huỷ', color: '#FF1100' },
  { key: 'Đã đến', color: '#486FE0' },
  { key: 'Quá hạn', color: '#E89400' },
]

export default function AdminAppointments() {
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0])
  const [selected, setSelected] = useState(null)
  const [data, setData] = useState(MOCK_DATA)

  const filtered = useMemo(() => {
    if (!query) return MOCK_DATA
    const q = query.toLowerCase()
    return data.filter(
      (r) =>
        r.customer.toLowerCase().includes(q) ||
        r.license.toLowerCase().includes(q) ||
        r.phone.toLowerCase().includes(q)
    )
  }, [query, data])

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const start = (currentPage - 1) * pageSize
  const rows = filtered.slice(start, start + pageSize)

  const badgeClass = (status) => {
    switch (status) {
      case 'Bị huỷ':
        return 'status-badge status-danger'
      case 'Đã đến':
        return 'status-badge status-success'
      case 'Quá hạn':
        return 'status-badge status-warning'
      default:
        return 'status-badge status-secondary'
    }
  }

  const updateStatus = (id, status) => {
    setData((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)))
  }

  const statusMenu = (row) => ({
    items: STATUS_ITEMS.map((s) => ({
      key: s.key,
      label: (
        <span style={{ color: s.color, fontWeight: 700 }}>{s.key}</span>
      ),
      onClick: () => updateStatus(row.id, s.key),
    })),
  })

  const go = (p) => () => setPage(Math.max(1, Math.min(pageCount, p)))

  const renderPagination = () => {
    const items = []
   
    items.push(
      <button key="prev" className="page icon" onClick={go(currentPage - 1)} disabled={currentPage === 1}>‹</button>
    )
   
    items.push(
      <button key={1} className={`page ${currentPage === 1 ? 'active' : ''}`} onClick={go(1)}>1</button>
    )
   
    if (currentPage > 3) {
      items.push(<span key="ldots" className="dots">…</span>)
    }
   
    const middle = [currentPage - 1, currentPage, currentPage + 1]
      .filter((p) => p > 1 && p < pageCount)
    middle.forEach((p) => {
      items.push(
        <button key={p} className={`page ${currentPage === p ? 'active' : ''}`} onClick={go(p)}>{p}</button>
      )
    })
    
    if (currentPage < pageCount - 2) {
      items.push(<span key="rdots" className="dots">…</span>)
    }
  
    if (pageCount > 1) {
      items.push(
        <button key={pageCount} className={`page ${currentPage === pageCount ? 'active' : ''}`} onClick={go(pageCount)}>{pageCount}</button>
      )
    }
   
    items.push(
      <button key="next" className="page icon" onClick={go(currentPage + 1)} disabled={currentPage === pageCount}>›</button>
    )
    return items
  }

  return (
    <AdminLayout>
      <div className="admin-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <h2 style={{ margin: 0 }}>Lịch hẹn</h2>
          <div className="search-box">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15z" stroke="#888" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <input value={query} onChange={(e) => { setPage(1); setQuery(e.target.value) }} placeholder="Tìm kiếm" />
          </div>
        </div>

        <div className="admin-table-wrap" style={{ marginTop: 14 }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>STT</th>
                <th>Khách Hàng</th>
                <th>Biển Số Xe</th>
                <th>Số điện thoại</th>
                <th>Trạng Thái</th>
                <th>Lịch hẹn</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, idx) => (
                <tr key={r.id}>
                  <td>{start + idx + 1 < 10 ? `0${start + idx + 1}` : start + idx + 1}</td>
                  <td>{r.customer}</td>
                  <td>{r.license}</td>
                  <td>{r.phone}</td>
                  <td>
                    <Dropdown menu={statusMenu(r)} trigger={['click']}>
                      <span className={badgeClass(r.status)} style={{ cursor: 'pointer' }}>{r.status}</span>
                    </Dropdown>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
                      <span>{r.time}</span>
                      <small style={{ color: '#9aa0a6' }}>{r.date}</small>
                    </div>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <i className="bi bi-eye action-eye" title="Xem" role="button" onClick={() => setSelected(r)} />
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: 24, color: '#888' }}>Không có dữ liệu</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#666' }}>Hiển thị kết quả:</span>
            <select value={pageSize} onChange={(e) => { setPage(1); setPageSize(Number(e.target.value)) }}>
              {PAGE_SIZE_OPTIONS.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
          <div className="pagination">
            {renderPagination()}
          </div>
        </div>
      </div>
      <Modal
        title="LỊCH HẸN CHI TIẾT"
        open={!!selected}
        onCancel={() => setSelected(null)}
        footer={null}
        width={720}
      >
        {selected && (
          <>
            <Descriptions bordered column={1} size="middle">
              <Descriptions.Item label="Tên khách hàng">{selected.customer}</Descriptions.Item>
              <Descriptions.Item label="Số điện thoại">{selected.phone}</Descriptions.Item>
              <Descriptions.Item label="Biển số xe">{selected.license}</Descriptions.Item>
              <Descriptions.Item label="Ngày hẹn">{selected.date}</Descriptions.Item>
              <Descriptions.Item label="Khung giờ">{selected.time}</Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <Tag color={
                  selected.status === 'Bị huỷ' ? 'red' : selected.status === 'Đã đến' ? 'blue' : selected.status === 'Quá hạn' ? 'orange' : 'default'
                }>
                  {selected.status}
                </Tag>
              </Descriptions.Item>
            </Descriptions>
            <div style={{ marginTop: 16 }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>Mô tả chi tiết tình trạng xe:</div>
              <ul style={{ margin: 0 }}>
                <li>Bóng đèn sáng yếu.</li>
                <li>Xe ngập nước, chết máy.</li>
                <li>v.v</li>
              </ul>
            </div>
          </>
        )}
      </Modal>
    </AdminLayout>
  )
}



