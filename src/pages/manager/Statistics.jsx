import React, { useState, useEffect, useMemo } from 'react'
import { Card, Row, Col, Statistic, Spin, message } from 'antd'
import ManagerLayout from '../../layouts/ManagerLayout'
import { dashboardAPI } from '../../services/api'

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function ManagerStatistics() {
  const [loading, setLoading] = useState(false)
  const [statisticsData, setStatisticsData] = useState(null)
  const [fromYear, setFromYear] = useState(new Date().getFullYear() - 1)
  const [toYear, setToYear] = useState(new Date().getFullYear())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)

  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i)
  const months = Array.from({ length: 12 }, (_, i) => i + 1)

  const summary = statisticsData || {
    totalRevenue: 0,
    profit: 0,
    lowStockPartsCount: 0,
    totalDebt: 0
  }

  const revenueByYear = statisticsData?.revenueByYear || []
  const serviceTypeDistribution = statisticsData?.serviceTypeExpenseDistribution || []

  const revenueChart = useMemo(() => {
    if (!revenueByYear || revenueByYear.length === 0) {
      return null
    }

    const allMonths = Array.from({ length: 12 }, (_, i) => i + 1)
    const years = revenueByYear.map(item => item.year)
    const maxRevenue = Math.max(
      ...revenueByYear.flatMap(item => 
        item.monthlyRevenue?.map(m => m.revenue || 0) || []
      ),
      0
    )

    if (!maxRevenue) return null

    const width = 640
    const height = 200
    const paddingX = 60
    const paddingY = 24
    const innerWidth = width - paddingX * 2
    const innerHeight = height - paddingY * 2
    const barWidth = innerWidth / (allMonths.length * (years.length + 0.5))

    const bars = []
    years.forEach((year, yearIdx) => {
      const yearData = revenueByYear.find(item => item.year === year)
      const monthlyData = yearData?.monthlyRevenue || []
      
      allMonths.forEach((month, monthIdx) => {
        const monthData = monthlyData.find(m => m.month === month)
        const revenue = monthData?.revenue || 0
        const height = (revenue / maxRevenue) * innerHeight
        
        const x = paddingX + (monthIdx * (barWidth * (years.length + 0.5))) + (yearIdx * barWidth)
        const y = paddingY + innerHeight - height
        
        bars.push({
          x,
          y,
          width: barWidth * 0.9,
          height,
          revenue,
          month,
          year,
          color: yearIdx === 0 ? '#93c5fd' : '#86efac'
        })
      })
    })

    const labels = allMonths.map(month => monthNames[month - 1] || `M${month}`)

    const yTicks = [0, 0.25, 0.5, 0.75, 1].map(ratio => {
      const value = Math.round(maxRevenue * ratio)
      const y = paddingY + innerHeight * (1 - ratio)
      return { value, y }
    })

    return {
      width,
      height,
      paddingX,
      paddingY,
      bars,
      labels,
      yTicks,
      maxRevenue,
      years
    }
  }, [revenueByYear])

  const serviceTypeDonut = useMemo(() => {
    if (!serviceTypeDistribution || serviceTypeDistribution.length === 0) {
      return null
    }

    const items = serviceTypeDistribution.map((item) => ({
      raw: item,
      amount: item.amount || 0,
      percentage: item.percentage || 0
    }))

    const grandTotal = items.reduce((sum, it) => sum + it.amount, 0)
    if (!grandTotal) {
      const pctSum = items.reduce((sum, it) => sum + (it.percentage || 0), 0)
      if (pctSum > 0) {
        items.forEach(it => {
          it.amount = (it.percentage || 0) * 100
        })
      }
    }

    const total = items.reduce((sum, it) => sum + it.amount, 0)
    if (!total) return null

    const radius = 55
    const circumference = 2 * Math.PI * radius

    let acc = 0
    const colors = ['#CBB081', '#D8BC88', '#E4C793', '#F0D3A0', '#F9E1B6']

    const segments = items.map((it, index) => {
      const pct = it.amount / total
      const dash = pct * circumference
      const startRatio = acc
      const endRatio = acc + pct
      const startAngle = startRatio * 2 * Math.PI - Math.PI / 2
      const endAngle = endRatio * 2 * Math.PI - Math.PI / 2
      const midAngle = (startAngle + endAngle) / 2

      const segment = {
        name: it.raw.serviceTypeName || `Loại ${index + 1}`,
        amount: it.amount,
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
    const fetchStatistics = async () => {
      setLoading(true)
      try {
        const { data, error } = await dashboardAPI.getStatistics(fromYear, toYear, selectedYear, selectedMonth)

        if (error) {
          console.error('Error fetching statistics:', error)
          message.error('Không thể tải dữ liệu thống kê')
          setStatisticsData(null)
          return
        }

        if (data && data.result) {
          setStatisticsData(data.result)
        } else {
          setStatisticsData(data || null)
        }
      } catch (err) {
        console.error('Error fetching statistics:', err)
        message.error('Không thể tải dữ liệu thống kê')
        setStatisticsData(null)
      } finally {
        setLoading(false)
      }
    }

    fetchStatistics()
  }, [fromYear, toYear, selectedYear, selectedMonth])

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN').format(value || 0)
  }

  const getMonthName = (month) => {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    return monthNames[month - 1] || `Month ${month}`
  }

  return (
    <ManagerLayout>
      <div style={{ padding: '24px', minHeight: '100vh' }}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, marginBottom: 8 }}>Thống kê</h1>
          <p style={{ margin: 0, color: '#6b7280' }}>
            Báo cáo bao gồm doanh thu, dịch vụ, phụ tùng, công nợ
          </p>
        </div>

        <Spin spinning={loading}>
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} md={6}>
              <Card
                style={{ borderRadius: 12, boxShadow: '0 8px 24px rgba(15,23,42,0.06)' }}
                bodyStyle={{ padding: 16 }}
              >
                <Statistic
                  title="Doanh thu"
                  value={formatCurrency(summary.totalRevenue)}
                  suffix="vnd"
                  prefix={
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#CBB081" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                  }
                  valueStyle={{ fontWeight: 700, fontSize: 20, color: '#111827' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card
                style={{ borderRadius: 12, boxShadow: '0 8px 24px rgba(15,23,42,0.06)' }}
                bodyStyle={{ padding: 16 }}
              >
                <Statistic
                  title="Lịch hẹn"
                  value={0}
                  prefix={
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#CBB081" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                  }
                  valueStyle={{ fontWeight: 700, fontSize: 20, color: '#111827' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card
                style={{ borderRadius: 12, boxShadow: '0 8px 24px rgba(15,23,42,0.06)' }}
                bodyStyle={{ padding: 16 }}
              >
                <Statistic
                  title="Phụ tùng sắp hết"
                  value={summary.lowStockPartsCount || 0}
                  prefix={
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#CBB081" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                  }
                  valueStyle={{ fontWeight: 700, fontSize: 20, color: '#111827' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card
                style={{ borderRadius: 12, boxShadow: '0 8px 24px rgba(15,23,42,0.06)' }}
                bodyStyle={{ padding: 16 }}
              >
                <Statistic
                  title="Công nợ"
                  value={formatCurrency(summary.totalDebt)}
                  suffix="vnd"
                  prefix={
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#CBB081" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                  }
                  valueStyle={{ fontWeight: 700, fontSize: 20, color: '#111827' }}
                />
              </Card>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={14}>
              <Card
                title="Doanh thu"
                style={{ borderRadius: 12, height: '100%' }}
                bodyStyle={{ display: 'flex', flexDirection: 'column', padding: 16 }}
                extra={
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: '#6b7280' }}>Từ năm</span>
                    <select
                      value={fromYear}
                      onChange={(e) => setFromYear(Number(e.target.value))}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        border: '1px solid #d1d5db',
                        fontSize: '12px',
                        width: '80px'
                      }}
                    >
                      {years.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                    <span style={{ fontSize: 12, color: '#6b7280' }}>Đến năm</span>
                    <select
                      value={toYear}
                      onChange={(e) => setToYear(Number(e.target.value))}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        border: '1px solid #d1d5db',
                        fontSize: '12px',
                        width: '80px'
                      }}
                    >
                      {years.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                }
              >
                {revenueChart ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <svg
                      viewBox={`0 0 ${revenueChart.width} ${revenueChart.height}`}
                      preserveAspectRatio="none"
                      style={{ width: '100%', height: 200 }}
                    >
                      {revenueChart.yTicks.map((tick, idx) => (
                        <g key={idx}>
                          <line
                            x1={revenueChart.paddingX}
                            x2={revenueChart.width - revenueChart.paddingX}
                            y1={tick.y}
                            y2={tick.y}
                            stroke="#e5e7eb"
                            strokeWidth={0.5}
                          />
                          <text
                            x={revenueChart.paddingX - 8}
                            y={tick.y + 4}
                            textAnchor="end"
                            fontSize="10"
                            fill="#9ca3af"
                          >
                            {tick.value >= 1000 ? `${(tick.value / 1000).toFixed(0)}K` : tick.value}
                          </text>
                        </g>
                      ))}

                      {revenueChart.bars.map((bar, idx) => (
                        <rect
                          key={idx}
                          x={bar.x}
                          y={bar.y}
                          width={bar.width}
                          height={bar.height}
                          fill={bar.color}
                          opacity={0.8}
                        />
                      ))}
                    </svg>

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: 12,
                        color: '#6b7280',
                        padding: '4px 6px 0'
                      }}
                    >
                      {revenueChart.labels.map((label, idx) => (
                        <span key={idx}>{label}</span>
                      ))}
                    </div>

                    <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 8 }}>
                      {revenueChart.years.map((year, idx) => (
                        <div key={year} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <div
                            style={{
                              width: 12,
                              height: 12,
                              backgroundColor: idx === 0 ? '#93c5fd' : '#86efac',
                              borderRadius: 2
                            }}
                          />
                          <span style={{ fontSize: 12, color: '#6b7280' }}>{year}</span>
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

            <Col xs={24} md={10}>
              <Card
                title={
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>{getMonthName(selectedMonth)} {selectedYear}</span>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <button
                        onClick={() => {
                          if (selectedMonth > 1) {
                            setSelectedMonth(selectedMonth - 1)
                          } else {
                            setSelectedMonth(12)
                            setSelectedYear(selectedYear - 1)
                          }
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '16px',
                          color: '#6b7280',
                          padding: '4px 8px'
                        }}
                      >
                        &lt;
                      </button>
                      <button
                        onClick={() => {
                          if (selectedMonth < 12) {
                            setSelectedMonth(selectedMonth + 1)
                          } else {
                            setSelectedMonth(1)
                            setSelectedYear(selectedYear + 1)
                          }
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '16px',
                          color: '#6b7280',
                          padding: '4px 8px'
                        }}
                      >
                        &gt;
                      </button>
                    </div>
                  </div>
                }
                style={{ borderRadius: 12, height: '100%' }}
                bodyStyle={{ display: 'flex', flexDirection: 'column', padding: 16 }}
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
                          <circle r={26} fill="#ffffff" />
                        </g>
                      </svg>

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

                    <div
                      style={{ width: '100%', marginTop: 4, gap: 6 }}
                    >
                      {serviceTypeDonut.segments.map((seg, index) => (
                        <div
                          key={index}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 8
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
                              style={{
                                width: 12,
                                height: 12,
                                backgroundColor: seg.color,
                                borderRadius: 2
                              }}
                            />
                            <div style={{ fontSize: 12, color: '#111827' }}>{seg.name}</div>
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
        </Spin>
      </div>
    </ManagerLayout>
  )
}

