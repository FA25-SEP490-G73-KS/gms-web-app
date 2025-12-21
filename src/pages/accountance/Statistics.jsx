import React, { useState, useEffect, useMemo } from 'react'
import { Card, Row, Col, Statistic, Spin, message } from 'antd'
import AccountanceLayout from '../../layouts/AccountanceLayout'
import { dashboardAPI } from '../../services/api'

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function Statistics() {
  const [loading, setLoading] = useState(false)
  const [financialData, setFinancialData] = useState(null)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i)

  const summary = financialData || {
    totalRevenue: 0,
    totalExpense: 0,
    profit: 0,
    totalDebt: 0
  }

  const series = financialData?.series || []

  const revenueChart = useMemo(() => {
    if (!series || series.length === 0) {
      return null
    }

    const values = series.map(item => item.revenue || 0)
    const maxValue = Math.max(...values, 0)
    if (!maxValue) return null

    const width = 640
    const height = 200
    const paddingX = 40
    const paddingY = 24
    const innerWidth = width - paddingX * 2
    const innerHeight = height - paddingY * 2

    const coords = series.map((item, index) => {
      const value = item.revenue || 0
      const x = series.length === 1
        ? paddingX + innerWidth / 2
        : paddingX + (index / (series.length - 1)) * innerWidth
      const y = paddingY + innerHeight * (1 - value / maxValue)
      const month = item.month || index + 1
      return { x, y, value, month }
    })

    const linePoints = coords.map(p => `${p.x},${p.y}`).join(' ')

    const baselineY = paddingY + innerHeight
    const areaPath =
      `M ${coords[0].x},${baselineY} ` +
      coords.map(p => `L ${p.x},${p.y}`).join(' ') +
      ` L ${coords[coords.length - 1].x},${baselineY} Z`

    const labels = coords.map(item => {
      const monthIndex = item.month >= 1 && item.month <= 12 ? item.month - 1 : item.month
      return monthNames[monthIndex] || `M${item.month}`
    })

    const yTicks = [0, 0.25, 0.5, 0.75, 1].map(ratio => {
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
  }, [series])

  useEffect(() => {
    const fetchFinancialOverview = async () => {
      setLoading(true)
      try {
        const { data, error } = await dashboardAPI.getFinancialOverview(selectedYear)

        if (error) {
          console.error('Error fetching financial overview:', error)
          message.error('Không thể tải dữ liệu thống kê')
          setFinancialData(null)
          setLoading(false)
          return
        }

        if (data && data.result) {
          setFinancialData(data.result)
        } else {
          setFinancialData(data || null)
        }
      } catch (err) {
        console.error('Error fetching financial overview:', err)
        message.error('Không thể tải dữ liệu thống kê')
        setFinancialData(null)
      } finally {
        setLoading(false)
      }
    }

    fetchFinancialOverview()
  }, [selectedYear])

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN').format(value || 0)
  }

  return (
    <AccountanceLayout>
      <div style={{ padding: '24px', minHeight: '100vh' }}>
        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, marginBottom: 8 }}>Thống kê</h1>
            <p style={{ margin: 0, color: '#6b7280' }}>
              Báo cáo bao gồm doanh thu, số tiền đã chi, lợi nhuận, công nợ
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#6b7280', fontSize: 14 }}>Filter tháng và năm</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                fontSize: '14px',
                color: '#111827',
                backgroundColor: '#fff',
                cursor: 'pointer',
                outline: 'none',
                minWidth: '120px'
              }}
            >
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
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
                  suffix="₫"
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
                  title="Số tiền đã chi"
                  value={formatCurrency(summary.totalExpense)}
                  suffix="₫"
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
                  title="Lợi nhuận"
                  value={formatCurrency(summary.profit)}
                  suffix="₫"
                  prefix={
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#CBB081" strokeWidth="2">
                      <line x1="12" y1="1" x2="12" y2="23"></line>
                      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                    </svg>
                  }
                  valueStyle={{ fontWeight: 700, fontSize: 20, color: summary.profit >= 0 ? '#22c55e' : '#ef4444' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card
                style={{ borderRadius: 12, boxShadow: '0 8px 24px rgba(15,23,42,0.06)' }}
                bodyStyle={{ padding: 16 }}
              >
                <Statistic
                  title="Tổng công nợ"
                  value={formatCurrency(summary.totalDebt)}
                  suffix="₫"
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
              >
                {revenueChart ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <svg
                      viewBox={`0 0 ${revenueChart.width} ${revenueChart.height}`}
                      preserveAspectRatio="none"
                      style={{ width: '100%', height: 200 }}
                    >
                      <defs>
                        <linearGradient id="revenueAreaGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#F4C974" stopOpacity="0.9" />
                          <stop offset="100%" stopColor="#F4C974" stopOpacity="0" />
                        </linearGradient>
                      </defs>

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

                      <path
                        d={revenueChart.areaPath}
                        fill="url(#revenueAreaGradient)"
                        stroke="none"
                      />

                      <polyline
                        points={revenueChart.linePoints}
                        fill="none"
                        stroke="#E0A94F"
                        strokeWidth={2}
                        strokeDasharray="4 2"
                      />

                      {revenueChart.coords.map((p, idx) => (
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
                bodyStyle={{ display: 'flex', flexDirection: 'column', padding: 16 }}
              >
                <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>
                  Chức năng đang được phát triển
                </div>
              </Card>
            </Col>
          </Row>
        </Spin>
      </div>
    </AccountanceLayout>
  )
}

