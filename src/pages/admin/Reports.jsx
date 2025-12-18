import React, { useState, useEffect, useMemo } from 'react'
import { Card, Row, Col, Statistic, Spin, message } from 'antd'
import { CalendarOutlined } from '@ant-design/icons'
import AdminLayout from '../../layouts/AdminLayout'
import { dashboardAPI } from '../../services/api'
import '../../styles/pages/admin/reports.css'

export default function Reports() {
  const [loading, setLoading] = useState(false)
  const [overview, setOverview] = useState(null)

  // Dữ liệu mẫu dùng tạm khi backend chưa có dữ liệu
  const sampleSummary = {
    totalTickets: 40,
    pendingQuotations: 20,
    vehiclesInService: 20,
    appointmentsToday: 2
  }

  const sampleTicketsByMonth = [
    { monthName: '2019', total: 20 },
    { monthName: '2020', total: 40 },
    { monthName: '2021', total: 60 },
    { monthName: '2022', total: 40 },
    { monthName: '2023', total: 80 }
  ]

  const sampleServiceTypeDistribution = [
    { name: 'Sửa chữa', percentage: 0.6, total: 60 },
    { name: 'Bảo dưỡng', percentage: 0.2, total: 20 },
    { name: 'Sơn', percentage: 0.1, total: 10 },
    { name: 'Bảo hành', percentage: 0.1, total: 10 }
  ]

  const sampleRating = {
    star5: 60,
    star4: 30,
    star3: 5,
    star2: 3,
    star1: 2,
    total: 100
  }

  const samplePotentialCustomers = [
    { name: 'Hoàng Thị Khánh Ly', phone: '0912 345 678' },
    { name: 'Đặng Thị Huyền', phone: '0912 345 678' },
    { name: 'Phùng Hữu Thành Nam', phone: '0984 567 899' },
    { name: 'Phạm Đức Đạt', phone: '0984 427 465' },
    { name: 'Trịnh Phương Nam', phone: '0923 847 462' }
  ]

  const summary = overview?.summary && Object.keys(overview.summary).length
    ? overview.summary
    : sampleSummary

  const ticketsByMonthRaw = overview?.ticketsByMonth || []
  const serviceTypeDistributionRaw = overview?.serviceTypeDistribution || []
  const ratingRaw = overview?.rating || {}
  const potentialCustomersRaw = overview?.potentialCustomers || []

  const ticketsByMonth = ticketsByMonthRaw.length ? ticketsByMonthRaw : sampleTicketsByMonth
  const serviceTypeDistribution = serviceTypeDistributionRaw.length
    ? serviceTypeDistributionRaw
    : sampleServiceTypeDistribution
  const rating = Object.keys(ratingRaw).length ? ratingRaw : sampleRating
  const potentialCustomers = potentialCustomersRaw.length
    ? potentialCustomersRaw
    : samplePotentialCustomers

  const totalTicketsInYear = useMemo(
    () => ticketsByMonth.reduce((sum, item) => sum + (item.total || item.count || 0), 0),
    [ticketsByMonth]
  )

  // Dữ liệu cho biểu đồ dạng area-line "Phiếu dịch vụ theo tháng"
  const ticketChart = useMemo(() => {
    if (!ticketsByMonth || ticketsByMonth.length === 0) {
      return null
    }

    // Chỉ lấy tối đa 9 mốc gần nhất để hiển thị theo figma
    const lastItems =
      ticketsByMonth.length > 9
        ? ticketsByMonth.slice(ticketsByMonth.length - 9)
        : ticketsByMonth

    const values = lastItems.map((i) => i.total || i.count || 0)
    const maxValue = Math.max(...values, 0)
    if (!maxValue) return null

    const width = 640
    const height = 200
    const paddingX = 40
    const paddingY = 24
    const innerWidth = width - paddingX * 2
    const innerHeight = height - paddingY * 2

    const coords = lastItems.map((item, index) => {
      const value = item.total || item.count || 0
      const x =
        lastItems.length === 1
          ? paddingX + innerWidth / 2
          : paddingX + (index / (lastItems.length - 1)) * innerWidth
      const y = paddingY + innerHeight * (1 - value / maxValue)
      return { x, y, value }
    })

    const linePoints = coords.map((p) => `${p.x},${p.y}`).join(' ')

    const baselineY = paddingY + innerHeight
    const areaPath =
      `M ${coords[0].x},${baselineY} ` +
      coords.map((p) => `L ${p.x},${p.y}`).join(' ') +
      ` L ${coords[coords.length - 1].x},${baselineY} Z`

    const labels = lastItems.map(
      (item, index) => item.monthName || item.month || `Tháng ${index + 1}`
    )

    // Tạo một vài vạch chia trục Y (0, 25, 50, 75, 100% của max)
    const yTicks = [0, 0.25, 0.5, 0.75, 1].map((ratio) => {
      const value = Math.round(maxValue * ratio)
      const y = paddingY + innerHeight * (1 - ratio)
      return { value, y }
    })

    return {
      width,
      height,
      paddingX,
      paddingY,
      coords,
      linePoints,
      areaPath,
      labels,
      yTicks,
      maxValue
    }
  }, [ticketsByMonth])

  // Dữ liệu cho biểu đồ tròn "Tỷ lệ loại dịch vụ"
  const serviceTypeDonut = useMemo(() => {
    if (!serviceTypeDistribution || serviceTypeDistribution.length === 0) {
      return null
    }

    const items = serviceTypeDistribution.map((item) => {
      const baseTotal = item.total ?? item.count ?? 0
      const basePct =
        item.percentage != null ? item.percentage : 0 // 0–1 nếu theo swagger
      return {
        raw: item,
        total: baseTotal,
        percentage:
          basePct > 0 && basePct <= 1 && baseTotal === 0
            ? basePct
            : undefined
      }
    })

    let grandTotal = items.reduce((sum, it) => sum + (it.total || 0), 0)

    // Nếu tổng bằng 0 nhưng swagger có field percentage, dùng percentage để tính
    if (!grandTotal) {
      const pctSum = items.reduce(
        (sum, it) => sum + (it.percentage != null ? it.percentage : 0),
        0
      )
      if (pctSum > 0) {
        grandTotal = pctSum
      }
      }

    if (!grandTotal) return null

    const radius = 55
    const circumference = 2 * Math.PI * radius

    let acc = 0
    const colors = ['#CBB081', '#D8BC88', '#E4C793', '#F0D3A0', '#F9E1B6']

    const segments = items.map((it, index) => {
      const value =
        it.total || (it.percentage != null ? it.percentage * grandTotal : 0)
      const pct = value / grandTotal
      const dash = pct * circumference
      const startRatio = acc
      const endRatio = acc + pct
      const startAngle = startRatio * 2 * Math.PI - Math.PI / 2
      const endAngle = endRatio * 2 * Math.PI - Math.PI / 2
      const midAngle = (startAngle + endAngle) / 2

      const segment = {
        name: it.raw.name || it.raw.serviceType || `Loại ${index + 1}`,
        count: it.raw.total ?? it.raw.count ?? value,
        percentage: pct * 100,
        color: colors[index % colors.length],
        dasharray: `${dash} ${circumference}`,
        offset: -acc * circumference,
        startAngle,
        endAngle,
        midAngle
      }
      acc += pct
      return segment
    })

    return {
      radius,
      circumference,
      segments
    }
  }, [serviceTypeDistribution])

  useEffect(() => {
    const fetchOverview = async () => {
      setLoading(true)
    try {
        const { data, error } = await dashboardAPI.getServiceAdvisorOverview()
      
      if (error) {
          console.error('Error fetching service advisor overview:', error)
          message.error('Không thể tải dữ liệu báo cáo')
          setOverview(null)
        return
      }

        if (data && data.result) {
          setOverview(data.result)
      } else {
          setOverview(data || null)
      }
    } catch (err) {
        console.error('Error fetching service advisor overview:', err)
        message.error('Không thể tải dữ liệu báo cáo')
        setOverview(null)
      } finally {
        setLoading(false)
    }
  }

    fetchOverview()
  }, [])

  const renderRatingRows = () => {
    const starKeys = ['star5', 'star4', 'star3', 'star2', 'star1']
    const labels = {
      star5: '5 sao',
      star4: '4 sao',
      star3: '3 sao',
      star2: '2 sao',
      star1: '1 sao'
    }

    const total = rating.total || starKeys.reduce((sum, key) => sum + (rating[key] || 0), 0)

    return starKeys.map((key) => {
      const count = rating[key] || 0
      const percentage = total > 0 ? (count / total) * 100 : 0

      return (
        <div key={key} className="bar-item">
          <div className="bar-label">{labels[key]}</div>
          <div className="bar-wrapper">
            <div
              className="bar-fill"
              style={{
                // Chiều dài cố định, chỉ dùng số ở bên phải để thể hiện chênh lệch
                width: '72%',
                height: 10,
                background: '#CBB081',
                borderRadius: 999
              }}
            />
            <span className="bar-value">{count}</span>
          </div>
        </div>
      )
    })
  }

  return (
    <AdminLayout>
      <div style={{ padding: '24px', minHeight: '100vh' }}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, marginBottom: 8 }}>Báo cáo</h1>
          <p style={{ margin: 0, color: '#6b7280' }}>
            Tổng quan hoạt động dịch vụ hôm nay và thống kê theo tháng.
          </p>
        </div>

        <Spin spinning={loading}>
          {/* Hàng card tổng quan */}
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} md={6}>
              <Card
                style={{ borderRadius: 12, boxShadow: '0 8px 24px rgba(15,23,42,0.06)' }}
                bodyStyle={{ padding: 16 }}
              >
                <Statistic
                  title="Phiếu dịch vụ"
                  value={summary.totalTickets || 0}
                  suffix="phiếu"
                  valueStyle={{ fontWeight: 700, fontSize: 24 }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card
                style={{ borderRadius: 12, boxShadow: '0 8px 24px rgba(15,23,42,0.06)' }}
                bodyStyle={{ padding: 16 }}
              >
                <Statistic
                  title="Báo giá chờ duyệt"
                  value={summary.pendingQuotations || 0}
                  suffix="báo giá"
                  valueStyle={{ fontWeight: 700, fontSize: 24 }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card
                style={{ borderRadius: 12, boxShadow: '0 8px 24px rgba(15,23,42,0.06)' }}
                bodyStyle={{ padding: 16 }}
              >
                <Statistic
                  title="Xe đang sửa"
                  value={summary.vehiclesInService || 0}
                  suffix="xe"
                  valueStyle={{ fontWeight: 700, fontSize: 24 }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card
                style={{ borderRadius: 12, boxShadow: '0 8px 24px rgba(15,23,42,0.06)' }}
                bodyStyle={{ padding: 16 }}
              >
                <Statistic
                  title="Lịch hẹn hôm nay"
                  value={summary.appointmentsToday || 0}
                  prefix={<CalendarOutlined style={{ color: '#CBB081' }} />}
                  valueStyle={{ fontWeight: 700, fontSize: 24 }}
                />
              </Card>
            </Col>
          </Row>

          {/* Hàng biểu đồ */}
          <Row gutter={16} style={{ marginBottom: 24 }} align="stretch">
            <Col xs={24} md={14}>
              <Card
                title="Phiếu dịch vụ theo tháng"
                extra="Tháng"
                style={{ borderRadius: 12, height: '100%' }}
                bodyStyle={{ display: 'flex', flexDirection: 'column', padding: 16 }}
              >
                {ticketChart ? (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12
                    }}
                  >
                    <svg
                      viewBox={`0 0 ${ticketChart.width} ${ticketChart.height}`}
                      preserveAspectRatio="none"
                      style={{ width: '100%', height: 200 }}
                    >
                      <defs>
                        <linearGradient id="ticketAreaGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#F4C974" stopOpacity="0.9" />
                          <stop offset="100%" stopColor="#F4C974" stopOpacity="0" />
                        </linearGradient>
                      </defs>

                      {/* Nền và lưới ngang + nhãn số lượng bên trái */}
                      {ticketChart.yTicks.map((tick, idx) => (
                        <g key={idx}>
                          <line
                            x1={ticketChart.paddingX}
                            x2={ticketChart.width - ticketChart.paddingX}
                            y1={tick.y}
                            y2={tick.y}
                            stroke="#e5e7eb"
                            strokeWidth={0.5}
                          />
                          <text
                            x={ticketChart.paddingX - 8}
                            y={tick.y + 4}
                            textAnchor="end"
                            fontSize="10"
                            fill="#9ca3af"
                          >
                            {tick.value}
                          </text>
                        </g>
                      ))}

                      {/* Vùng area màu vàng */}
                      <path
                        d={ticketChart.areaPath}
                        fill="url(#ticketAreaGradient)"
                        stroke="none"
                      />

                      {/* Đường nét đứt màu vàng */}
                      <polyline
                        points={ticketChart.linePoints}
                        fill="none"
                        stroke="#E0A94F"
                        strokeWidth={2}
                        strokeDasharray="4 2"
                      />

                      {/* Các điểm tròn */}
                      {ticketChart.coords.map((p, idx) => (
                        <circle
                          key={idx}
                          cx={p.x}
                          cy={p.y}
                          r={4}
                          fill="#E0A94F"
                          stroke="#ffffff"
                          strokeWidth={1.5}
                        />
                      ))}
                    </svg>

                    {/* Trục X: năm / tháng */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: 12,
                        color: '#6b7280',
                        padding: '4px 6px 0'
                      }}
                    >
                      {ticketChart.labels.map((label, idx) => (
                        <span key={idx}>{label}</span>
                      ))}
                            </div>
                    </div>
                  ) : (
                  <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>
                      Không có dữ liệu
                    </div>
                  )}
              </Card>
            </Col>

             <Col xs={24} md={10}>
              <Card
                title="Tỷ lệ loại dịch vụ"
                 style={{ borderRadius: 12, height: '100%' }}
                 bodyStyle={{ display: 'flex', flexDirection: 'column' }}
              >
                 {serviceTypeDonut ? (
                   <div
                     style={{
                       flex: 1,
                       display: 'flex',
                       flexDirection: 'column',
                       alignItems: 'center',
                       justifyContent: 'center',
                       gap: 12
                     }}
                   >
                     <div
                       style={{
                         position: 'relative',
                         width: 210,
                         height: 210
                       }}
                     >
                       <svg
                         width={210}
                         height={210}
                         viewBox="0 0 200 200"
                         style={{ display: 'block' }}
                       >
                         <g transform="translate(100, 100)">
                           {serviceTypeDonut.segments.map((seg, index) => (
                             <circle
                               key={index}
                               r={serviceTypeDonut.radius}
                               fill="transparent"
                               stroke={seg.color}
                               strokeWidth={22}
                               strokeDasharray={seg.dasharray}
                               strokeDashoffset={seg.offset}
                               strokeLinecap="butt"
                             />
                           ))}

                           {/* Lỗ tròn giữa (donut) */}
                           <circle r={26} fill="#ffffff" />
                         </g>
                       </svg>

                       {/* Badge phần trăm quanh vòng tròn giống figma */}
                       {serviceTypeDonut.segments.map((seg, index) => {
                         const badgeRadius = 78
                         const cx = 100 + Math.cos(seg.midAngle) * badgeRadius
                         const cy = 100 + Math.sin(seg.midAngle) * badgeRadius
                        return (
                           <div
                             key={`badge-${index}`}
                             style={{
                               position: 'absolute',
                               left: `${(cx / 200) * 100}%`,
                               top: `${(cy / 200) * 100}%`,
                               transform: 'translate(-50%, -50%)',
                               background: '#ffffff',
                               borderRadius: 999,
                               padding: '3px 8px',
                               fontSize: 10,
                               fontWeight: 600,
                               boxShadow: '0 2px 6px rgba(15,23,42,0.15)',
                               color: '#111827',
                               minWidth: 38,
                               textAlign: 'center'
                             }}
                           >
                             {`${seg.percentage.toFixed(0)}%`}
                          </div>
                        )
                      })}
                     </div>

                     {/* Legend bên dưới giống figma */}
                     <div
                       className="pie-chart"
                       style={{ width: '100%', marginTop: 4, gap: 6 }}
                     >
                       {serviceTypeDonut.segments.map((seg, index) => (
                         <div
                           key={index}
                           className="pie-item"
                           style={{
                             display: 'flex',
                             justifyContent: 'space-between',
                             alignItems: 'center'
                           }}
                         >
                           <div
                             style={{
                               display: 'flex',
                               alignItems: 'center',
                             gap: 6
                             }}
                           >
                             <div
                               className="pie-color"
                               style={{ background: seg.color }}
                             />
                             <div className="pie-label">{seg.name}</div>
                           </div>
                           <div
                             style={{
                               fontSize: 12,
                               fontWeight: 500,
                               color: '#111827'
                             }}
                           >
                             {`${seg.percentage.toFixed(0)}%`}
                           </div>
                         </div>
                       ))}
                     </div>
                    </div>
                  ) : (
                   <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>
                      Không có dữ liệu
                    </div>
                  )}
              </Card>
            </Col>
          </Row>

          {/* Hàng đánh giá & khách hàng tiềm năng */}
           <Row gutter={16} align="stretch">
             <Col xs={24} md={14}>
              <Card
                title="Mức độ hài lòng"
                extra={rating.total ? `Tổng: ${rating.total}` : ''}
                 style={{ borderRadius: 12, height: '100%' }}
                 bodyStyle={{ display: 'flex', flexDirection: 'column' }}
              >
                 <div className="chart-container" style={{ flex: 1 }}>
                  {renderRatingRows()}
                </div>
              </Card>
            </Col>

             <Col xs={24} md={10}>
              <Card
                title="Khách hàng tiềm năng"
                 style={{ borderRadius: 12, height: '100%' }}
                 bodyStyle={{ display: 'flex', flexDirection: 'column' }}
              >
                 <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
                    {potentialCustomers.map((customer, index) => (
                      <div
                        key={index}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          padding: '8px 0',
                          borderBottom:
                            index === potentialCustomers.length - 1
                              ? 'none'
                              : '1px dashed #e5e7eb'
                        }}
                      >
                        <div style={{ fontWeight: 500, color: '#111827' }}>
                          {customer.name || customer.fullName || 'Khách hàng'}
                        </div>
                        <div style={{ color: '#6b7280', fontSize: 13 }}>
                          {customer.phone || customer.mobile || ''}
                        </div>
                      </div>
                    ))}
                </div>
              </Card>
            </Col>
          </Row>
        </Spin>
      </div>
    </AdminLayout>
  )
}

