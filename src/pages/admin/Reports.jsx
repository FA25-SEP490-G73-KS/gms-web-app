import React, { useState, useEffect } from 'react'
import { Card, DatePicker, Row, Col, Statistic, message, Spin } from 'antd'
import { CalendarOutlined } from '@ant-design/icons'
import AdminLayout from '../../layouts/AdminLayout'
import { serviceTicketAPI } from '../../services/api'
import dayjs from 'dayjs'
import '../../styles/pages/admin/reports.css'

export default function Reports() {
  const [loading, setLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState(dayjs())
  const [selectedYear, setSelectedYear] = useState(dayjs().year())
  const [selectedMonth, setSelectedMonth] = useState(dayjs().month() + 1)
  
  const [completedPerMonth, setCompletedPerMonth] = useState([])
  const [todayCount, setTodayCount] = useState(0)
  const [countByType, setCountByType] = useState([])

  useEffect(() => {
    fetchCompletedPerMonth()
    fetchTodayCount()
    fetchCountByType()
  }, [selectedDate, selectedYear, selectedMonth])

  const fetchCompletedPerMonth = async () => {
    setLoading(true)
    try {
      const { data: response, error, statusCode } = await serviceTicketAPI.getCompletedPerMonth()
      
      if (error || statusCode === 404) {
        console.warn('API endpoint not found or error:', error, statusCode)
        setCompletedPerMonth([])
        setLoading(false)
        return
      }

      if (response && response.result && Array.isArray(response.result)) {
        setCompletedPerMonth(response.result)
      } else if (Array.isArray(response)) {
        setCompletedPerMonth(response)
      } else {
        setCompletedPerMonth([])
      }
    } catch (err) {
      console.warn('Error fetching completed per month:', err)
      setCompletedPerMonth([])
    } finally {
      setLoading(false)
    }
  }

  const fetchTodayCount = async () => {
    try {
      const dateStr = selectedDate.format('YYYY-MM-DD')
      const { data: response, error, statusCode } = await serviceTicketAPI.getCount(dateStr)
      
      if (error || statusCode === 404) {
        console.warn('API endpoint not found or error:', error, statusCode)
        setTodayCount(0)
        return
      }

      if (response && response.result !== undefined) {
        setTodayCount(response.result)
      } else if (typeof response === 'number') {
        setTodayCount(response)
      } else {
        setTodayCount(0)
      }
    } catch (err) {
      console.warn('Error fetching today count:', err)
      setTodayCount(0)
    }
  }

  const fetchCountByType = async () => {
    try {
      const { data: response, error } = await serviceTicketAPI.getCountByType(selectedYear, selectedMonth)
      
      if (error) {
        console.error('Error fetching count by type:', error)
        message.error('Không thể tải dữ liệu theo loại dịch vụ')
        setCountByType([])
        return
      }

      if (response && response.result && Array.isArray(response.result)) {
        setCountByType(response.result)
      } else {
        setCountByType([])
      }
    } catch (err) {
      console.error('Error:', err)
      setCountByType([])
    }
  }

  const handleDateChange = (date) => {
    if (date) {
      setSelectedDate(date)
      setSelectedYear(date.year())
      setSelectedMonth(date.month() + 1)
    }
  }

  return (
    <AdminLayout>
      <div style={{ padding: '24px', background: '#ffffff', minHeight: '100vh' }}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, marginBottom: '20px' }}>Báo cáo</h1>
          
          <Row gutter={16} style={{ marginBottom: '20px' }}>
            <Col>
              <DatePicker
                placeholder="Chọn ngày"
                format="DD/MM/YYYY"
                value={selectedDate}
                onChange={handleDateChange}
                suffixIcon={<CalendarOutlined />}
                style={{ width: '200px' }}
              />
            </Col>
          </Row>
        </div>

        <Spin spinning={loading}>
          <Row gutter={16} style={{ marginBottom: '24px' }}>
            <Col span={24}>
              <Card>
                <Statistic
                  title="Tổng số phiếu dịch vụ hôm nay"
                  value={todayCount}
                  valueStyle={{ color: '#3f8600' }}
                  prefix={<CalendarOutlined />}
                />
              </Card>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Card title="Số phiếu hoàn thành theo tháng" style={{ minHeight: '400px' }}>
                <div className="chart-container">
                  {completedPerMonth.length > 0 ? (
                    <div className="bar-chart">
                      {completedPerMonth.map((item, index) => {
                        const month = item.month || item.monthName || `Tháng ${index + 1}`
                        const count = item.count || item.total || 0
                        const maxCount = Math.max(...completedPerMonth.map(i => i.count || i.total || 0))
                        const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0
                        
                        return (
                          <div key={index} className="bar-item">
                            <div className="bar-label">{month}</div>
                            <div className="bar-wrapper">
                              <div 
                                className="bar-fill" 
                                style={{ width: `${percentage}%`, height: '30px', background: '#1890ff' }}
                              />
                              <span className="bar-value">{count}</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                      Không có dữ liệu
                    </div>
                  )}
                </div>
              </Card>
            </Col>

            <Col span={12}>
              <Card title={`Số phiếu theo loại dịch vụ (Tháng ${selectedMonth}/${selectedYear})`} style={{ minHeight: '400px' }}>
                <div className="chart-container">
                  {countByType.length > 0 ? (
                    <div className="pie-chart">
                      {countByType.map((item, index) => {
                        const type = item.serviceType || item.type || `Loại ${index + 1}`
                        const count = item.count || item.total || 0
                        const total = countByType.reduce((sum, i) => sum + (i.count || i.total || 0), 0)
                        const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : 0
                        
                        const colors = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#eb2f96']
                        const color = colors[index % colors.length]
                        
                        return (
                          <div key={index} className="pie-item">
                            <div className="pie-color" style={{ background: color }} />
                            <div className="pie-info">
                              <div className="pie-label">{type}</div>
                              <div className="pie-value">
                                {count} phiếu ({percentage}%)
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                      Không có dữ liệu
                    </div>
                  )}
                </div>
              </Card>
            </Col>
          </Row>
        </Spin>
      </div>
    </AdminLayout>
  )
}

