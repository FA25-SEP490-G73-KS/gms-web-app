import React, { useMemo, useState, useEffect } from 'react'
import { Input, message } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import AdminLayout from '../../layouts/AdminLayout'
import { inventoryAPI } from '../../services/api'
import '../../styles/pages/admin/inventory.css'

const { Search } = Input

const PAGE_SIZE_OPTIONS = [6, 10, 20]

// Sample data structure - will be replaced with API data
const sampleInventoryData = [
  { id: 1, name: 'Dầu nhớt', quantity: 25, warningLevel: 10, status: 'Còn đủ', updatedAt: '12/10/2025', group: 'Dầu nhớt', price: 500000 },
  { id: 2, name: 'Lọc gió', quantity: 16, warningLevel: 8, status: 'Còn đủ', updatedAt: '12/10/2025', group: 'Lọc gió', price: 200000 },
  { id: 3, name: 'Bugi', quantity: 10, warningLevel: 10, status: 'Sắp hết', updatedAt: '12/10/2025', group: 'Bugi', price: 150000 },
  { id: 4, name: 'Lốp xe', quantity: 0, warningLevel: 5, status: 'Hết hàng', updatedAt: '12/10/2025', group: 'Lốp xe', price: 2000000 },
  { id: 5, name: 'Linh kiện điện tử', quantity: 1, warningLevel: 5, status: 'Sắp hết', updatedAt: '12/10/2025', group: 'Linh kiện điện tử', price: 500000 },
  { id: 6, name: 'Dầu nhớt cao cấp', quantity: 20, warningLevel: 10, status: 'Còn đủ', updatedAt: '11/10/2025', group: 'Dầu nhớt', price: 800000 },
]

const statusClass = (status) => {
  switch (status) {
    case 'Hết hàng':
      return 'inventory-badge danger'
    case 'Sắp hết':
      return 'inventory-badge warning'
    case 'Còn đủ':
      return 'inventory-badge success'
    default:
      return 'inventory-badge'
  }
}

export default function Inventory() {
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0])
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchInventory()
  }, [])

  const fetchInventory = async () => {
    setLoading(true)
    try {
      const { data: response, error } = await inventoryAPI.getAll()
      if (error) {
        message.error('Không thể tải dữ liệu tồn kho')
        // Use sample data as fallback
        setData(sampleInventoryData)
        return
      }
      
      let resultArray = []
      if (response) {
        if (response.result && response.result.content && Array.isArray(response.result.content)) {
          resultArray = response.result.content
        } else if (Array.isArray(response.result)) {
          resultArray = response.result
        } else if (Array.isArray(response.data)) {
          resultArray = response.data
        } else if (Array.isArray(response)) {
          resultArray = response
        }
      }
      
      if (resultArray.length > 0) {
        const transformed = resultArray.map(item => ({
          id: item.id || item.inventoryId,
          name: item.name || item.partName || 'N/A',
          quantity: item.quantity || item.stockQuantity || 0,
          warningLevel: item.warningLevel || item.minStockLevel || 0,
          status: getStatus(item.quantity || item.stockQuantity || 0, item.warningLevel || item.minStockLevel || 0),
          updatedAt: item.updatedAt ? new Date(item.updatedAt).toLocaleDateString('vi-VN') : new Date().toLocaleDateString('vi-VN'),
          group: item.group || item.category || 'Khác',
          price: item.price || item.unitPrice || 0,
        }))
        setData(transformed)
      } else {
        // Use sample data if no data from API
        setData(sampleInventoryData)
      }
    } catch (err) {
      message.error('Lỗi khi tải dữ liệu')
      setData(sampleInventoryData)
    } finally {
      setLoading(false)
    }
  }

  const getStatus = (quantity, warningLevel) => {
    if (quantity === 0) return 'Hết hàng'
    if (quantity <= warningLevel) return 'Sắp hết'
    return 'Còn đủ'
  }

  const filtered = useMemo(() => {
    if (!query) return data
    const q = query.toLowerCase()
    return data.filter(
      (r) => r.name.toLowerCase().includes(q) || r.group.toLowerCase().includes(q)
    )
  }, [query, data])

  // Calculate summary statistics
  const summary = useMemo(() => {
    const totalItems = data.length
    const runningLow = data.filter(item => item.status === 'Sắp hết').length
    const outOfStock = data.filter(item => item.status === 'Hết hàng').length
    const totalValue = data.reduce((sum, item) => sum + (item.quantity * item.price), 0)
    
    return { totalItems, runningLow, outOfStock, totalValue }
  }, [data])

  // Group data for charts
  const chartData = useMemo(() => {
    const groups = {}
    data.forEach(item => {
      if (!groups[item.group]) {
        groups[item.group] = { name: item.group, quantity: 0, value: 0 }
      }
      groups[item.group].quantity += item.quantity
      groups[item.group].value += item.quantity * item.price
    })
    return Object.values(groups)
  }, [data])

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const start = (currentPage - 1) * pageSize
  const rows = filtered.slice(start, start + pageSize)
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
    const middle = [currentPage - 1, currentPage, currentPage + 1].filter((p) => p > 1 && p < pageCount)
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

  // Bar chart component
  const BarChart = ({ data }) => {
    const maxValue = Math.max(...data.map(d => d.quantity), 1)
    const chartHeight = 200
    const barWidth = 60
    const spacing = 40
    
    return (
      <div className="bar-chart">
        <div className="chart-y-axis">
          {[30, 20, 10, 0].map((val) => (
            <div key={val} className="y-tick">
              <span>{val}</span>
              <div className="y-line" />
            </div>
          ))}
        </div>
        <div className="chart-bars">
          {data.map((item, idx) => {
            const height = (item.quantity / maxValue) * chartHeight
            return (
              <div key={idx} className="bar-group">
                <div className="bar-container">
                  <div 
                    className="bar" 
                    style={{ height: `${height}px` }}
                    title={`${item.name}: ${item.quantity}`}
                  />
                </div>
                <div className="bar-label">{item.name}</div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // Donut chart component
  const DonutChart = ({ data }) => {
    const total = data.reduce((sum, item) => sum + item.quantity, 1)
    let currentAngle = 0
    const radius = 80
    const centerX = 120
    const centerY = 120
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#eab308', '#8b5cf6']
    
    const paths = data.map((item, idx) => {
      const percentage = item.quantity / total
      const angle = percentage * 360
      const startAngle = currentAngle
      const endAngle = currentAngle + angle
      currentAngle = endAngle
      
      const startAngleRad = (startAngle - 90) * (Math.PI / 180)
      const endAngleRad = (endAngle - 90) * (Math.PI / 180)
      
      const x1 = centerX + radius * Math.cos(startAngleRad)
      const y1 = centerY + radius * Math.sin(startAngleRad)
      const x2 = centerX + radius * Math.cos(endAngleRad)
      const y2 = centerY + radius * Math.sin(endAngleRad)
      
      const largeArcFlag = angle > 180 ? 1 : 0
      
      const pathData = [
        `M ${centerX} ${centerY}`,
        `L ${x1} ${y1}`,
        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
        'Z'
      ].join(' ')
      
      return { pathData, color: colors[idx % colors.length], name: item.name, percentage }
    })
    
    return (
      <div className="donut-chart">
        <svg width="240" height="240" viewBox="0 0 240 240">
          {paths.map((path, idx) => (
            <g key={idx}>
              <path
                d={path.pathData}
                fill={path.color}
                stroke="#fff"
                strokeWidth="2"
              />
            </g>
          ))}
          <circle cx={centerX} cy={centerY} r={60} fill="#fff" />
        </svg>
        <div className="donut-legend">
          {data.map((item, idx) => (
            <div key={idx} className="legend-item">
              <div className="legend-color" style={{ backgroundColor: colors[idx % colors.length] }} />
              <span>{item.name}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <AdminLayout>
      <div className="inventory-container">
        {/* Summary Cards */}
        <div className="inventory-summary">
          <div className="summary-card">
            <div className="summary-label">Tổng số mặt hàng</div>
            <div className="summary-value">{summary.totalItems}</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">
              Sắp hết hàng
              <i className="bi bi-info-circle" style={{ marginLeft: 6, fontSize: 14 }} />
            </div>
            <div className="summary-value warning">{summary.runningLow}</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">
              Hết hàng
              <i className="bi bi-x-circle" style={{ marginLeft: 6, fontSize: 14 }} />
            </div>
            <div className="summary-value danger">{summary.outOfStock}</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Tổng giá trị tồn kho</div>
            <div className="summary-value">{summary.totalValue.toLocaleString('vi-VN')}₫</div>
          </div>
        </div>

        {/* Charts */}
        <div className="inventory-charts">
          <div className="chart-card">
            <h3>Số lượng tồn theo nhóm vật tư</h3>
            <BarChart data={chartData} />
          </div>
          <div className="chart-card">
            <h3>Tỷ lệ nhóm vật tư trong kho</h3>
            <DonutChart data={chartData} />
          </div>
        </div>

        {/* Inventory Table */}
        <div className="admin-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <h2 style={{ margin: 0 }}>Chi tiết hàng tồn kho</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Search
                placeholder="Tìm kiếm"
                allowClear
                prefix={<SearchOutlined />}
                style={{ width: '100%', maxWidth: '400px' }}
                value={query}
                onChange={(e) => {
                  setPage(1)
                  setQuery(e.target.value)
                }}
                onSearch={setQuery}
              />
              <button className="menu-dots">
                <i className="bi bi-three-dots-vertical" />
              </button>
            </div>
          </div>

          <div className="admin-table-wrap" style={{ marginTop: 14 }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Tên phụ tùng</th>
                  <th>Số lượng</th>
                  <th>Mức cảnh báo</th>
                  <th>Trạng Thái</th>
                  <th>Ngày cập nhật</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, idx) => (
                  <tr key={r.id}>
                    <td>{start + idx + 1 < 10 ? `0${start + idx + 1}` : start + idx + 1}</td>
                    <td>{r.name}</td>
                    <td>{r.quantity}</td>
                    <td>{r.warningLevel}</td>
                    <td><span className={statusClass(r.status)}>{r.status}</span></td>
                    <td>{r.updatedAt}</td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: 24, color: '#888' }}>
                      {loading ? 'Đang tải...' : 'Không có dữ liệu'}
                    </td>
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
            <div className="pagination">{renderPagination()}</div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

