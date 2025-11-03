import AdminLayout from '../../layouts/AdminLayout'
import '/src/styles/pages/admin/admin-appointments.css'
import { useMemo, useState, useEffect } from 'react'
import { Modal, Descriptions, Tag, Dropdown, message } from 'antd'
import { appointmentAPI } from '../../services/api'

const PAGE_SIZE_OPTIONS = [6, 10, 20]

const STATUS_ITEMS = [
  { key: 'CONFIRMED', label: 'Chờ', color: '#FFB7B7' },
  { key: 'CANCELLED', label: 'Bị huỷ', color: '#FF1100' },
  { key: 'ARRIVED', label: 'Đã đến', color: '#486FE0' },
  { key: 'OVERDUE', label: 'Quá hạn', color: '#E89400' },
]

const statusMap = {
  'CONFIRMED': 'Chờ',
  'CANCELLED': 'Bị huỷ',
  'ARRIVED': 'Đã đến',
  'OVERDUE': 'Quá hạn',
}

export default function AdminAppointments() {
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0])
  const [selected, setSelected] = useState(null)
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedFull, setSelectedFull] = useState(null)

  useEffect(() => {
    fetchAppointments()
  }, [])

  const fetchAppointments = async () => {
    setLoading(true)
    const { data: response, error } = await appointmentAPI.getAll()
    setLoading(false)
    
    if (error) {
      message.error('Không thể tải dữ liệu lịch hẹn')
      return
    }
    
    let resultArray = []
    
    if (response) {
      if (response.result && response.result.content && Array.isArray(response.result.content)) {
        resultArray = response.result.content
      }
      else if (Array.isArray(response.result)) {
        resultArray = response.result
      }
      else if (Array.isArray(response.data)) {
        resultArray = response.data
      }
      else if (Array.isArray(response)) {
        resultArray = response
      }
      else if (Array.isArray(response.content)) {
        resultArray = response.content
      }
      else if (response.result && typeof response.result === 'object') {
        if (response.result.items && Array.isArray(response.result.items)) {
          resultArray = response.result.items
        } else if (response.result.data && Array.isArray(response.result.data)) {
          resultArray = response.result.data
        }
      }
    }
    
    const transformed = resultArray.map(item => ({
      id: item.appointmentId,
      customer: item.customerName,
      license: item.licensePlate,
      phone: item.customerPhone,
      status: statusMap[item.status] || item.status,
      statusKey: item.status,
      time: item.timeSlotLabel || '',
      date: new Date(item.appointmentDate).toLocaleDateString('vi-VN'),
      serviceType: item.serviceType,
      note: item.note,
    }))
    setData(transformed)
  }

  const fetchAppointmentDetail = async (id) => {
    const { data: response, error } = await appointmentAPI.getById(id)
    if (error) {
      message.error('Không thể tải chi tiết lịch hẹn')
      return
    }
    if (response && response.result) {
      setSelectedFull(response.result)
    }
  }

  const filtered = useMemo(() => {
    if (!query) return data
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

  const updateStatus = async (id, statusKey) => {
    const { error } = await appointmentAPI.updateStatus(id, statusKey)
    if (error) {
      message.error('Không thể cập nhật trạng thái')
      return
    }
    message.success('Cập nhật trạng thái thành công')
    const newStatus = statusMap[statusKey] || statusKey
    setData((prev) => prev.map((r) => (r.id === id ? { ...r, status: newStatus, statusKey } : r)))
  }

  const statusMenu = (row) => ({
    items: STATUS_ITEMS.map((s) => ({
      key: s.key,
      label: (
        <span style={{ color: s.color, fontWeight: 700 }}>{s.label}</span>
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
                    <i className="bi bi-eye action-eye" title="Xem" role="button" onClick={async () => { setSelected(r); await fetchAppointmentDetail(r.id) }} />
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
        onCancel={() => { setSelected(null); setSelectedFull(null) }}
        footer={null}
        width={720}
      >
        {(selectedFull || selected) && (
          <>
            <Descriptions bordered column={1} size="middle">
              <Descriptions.Item label="Tên khách hàng">{selectedFull?.customerName || selected?.customer}</Descriptions.Item>
              <Descriptions.Item label="Số điện thoại">{selectedFull?.customerPhone || selected?.phone}</Descriptions.Item>
              <Descriptions.Item label="Biển số xe">{selectedFull?.licensePlate || selected?.license}</Descriptions.Item>
              <Descriptions.Item label="Ngày hẹn">{selectedFull?.appointmentDate ? new Date(selectedFull.appointmentDate).toLocaleDateString('vi-VN') : selected?.date}</Descriptions.Item>
              <Descriptions.Item label="Khung giờ">{selectedFull?.timeSlotLabel || selected?.time}</Descriptions.Item>
              <Descriptions.Item label="Loại dịch vụ">{selectedFull?.serviceType || selected?.serviceType}</Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <Tag color={
                  selected.status === 'Bị huỷ' ? 'red' : selected.status === 'Đã đến' ? 'blue' : selected.status === 'Quá hạn' ? 'orange' : 'default'
                }>
                  {selected.status}
                </Tag>
              </Descriptions.Item>
            </Descriptions>
            {selectedFull?.note && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>Ghi chú:</div>
                <div>{selectedFull.note}</div>
              </div>
            )}
          </>
        )}
      </Modal>
    </AdminLayout>
  )
}



