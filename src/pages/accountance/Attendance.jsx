import React, { useState, useEffect, useMemo, useRef } from 'react'
import { Table, Input, Button, Tag, message } from 'antd'
import { SearchOutlined, FilterOutlined, CalendarOutlined } from '@ant-design/icons'
import AccountanceLayout from '../../layouts/AccountanceLayout'
import { goldTableHeader } from '../../utils/tableComponents'
import { attendanceAPI } from '../../services/api'
import dayjs from 'dayjs'
import '../../styles/pages/accountance/attendance.css'

const DAYS_IN_MONTH = 31

const DAY_COLORS = {
  present: { bg: '#d0f5d6', label: 'Có mặt' },
  absent: { bg: '#ffd6d6', label: 'Vắng' },
  leave: { bg: '#ffe8a3', label: 'Làm nửa ngày' },
  remote: { bg: '#e2e8f0', label: 'Phép có đăng ký' },
  empty: { bg: '#f0f1f5', label: 'Không có dữ liệu' }
}

const dayColumns = Array.from({ length: DAYS_IN_MONTH }, (_, index) => ({
  title: String(index + 1).padStart(2, '0'),
  dataIndex: `day_${index}`,
  key: `day_${index}`,
  width: 60,
  align: 'center',
  render: (value) => {
    const status = value || 'empty'
    const color = DAY_COLORS[status] || DAY_COLORS.empty
    return (
      <div 
        style={{ 
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: color.bg,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '13px',
          fontWeight: 600,
          color: status !== 'empty' ? '#000' : 'transparent'
        }}
      >
        {status === 'present' ? 'P' : status === 'absent' ? 'A' : status === 'leave' ? 'HR' : ''}
      </div>
    )
  }
}))

export function AccountanceAttendanceContent() {
  const [query, setQuery] = useState('')
  const [selectedMonth, setSelectedMonth] = useState(dayjs().format('YYYY-MM'))
  const [attendanceData, setAttendanceData] = useState([])
  const [loading, setLoading] = useState(false)
  const monthInputRef = useRef(null)

  useEffect(() => {
    fetchAttendanceData()
  }, [selectedMonth])

  const fetchAttendanceData = async () => {
    if (!selectedMonth) return
    
    setLoading(true)
    try {
      // Convert "YYYY-MM" to start and end dates for API
      const [year, month] = selectedMonth.split('-')
      const startDate = dayjs(`${year}-${month}-01`)
      const endDate = startDate.endOf('month')
      const daysInMonth = endDate.date()
      
      const startDateStr = startDate.format('YYYY-MM-DD')
      const endDateStr = endDate.format('YYYY-MM-DD')
      
      const { data: response, error } = await attendanceAPI.getSummary(startDateStr, endDateStr)
      
      if (error) {
        message.error('Không thể tải dữ liệu điểm danh')
        setLoading(false)
        return
      }

      if (response && response.result) {
        // Transform API data to match table format
        const transformedData = response.result.map((emp) => {
          const statuses = {}
          
          // Initialize all days as empty
          for (let day = 1; day <= daysInMonth; day++) {
            statuses[day] = 'empty'
          }
          
          // Fill in attendance data from API
          if (emp.attendanceData && Array.isArray(emp.attendanceData)) {
            emp.attendanceData.forEach((record) => {
              if (record.date) {
                // Extract day from date "2025-11-28"
                const dayNum = parseInt(record.date.split('-')[2])
                if (dayNum >= 1 && dayNum <= daysInMonth) {
                  // Map API status to our status keys
                  if (record.isPresent) {
                    statuses[dayNum] = 'present'
                  } else {
                    statuses[dayNum] = 'absent'
                  }
                }
              }
            })
          }
          
          // Count total working days (present)
          const totalWorking = Object.values(statuses).filter(s => s === 'present').length
          
          return {
            id: emp.employeeId,
            name: emp.employeeName || 'Không rõ',
            phone: emp.phone || '',
            totalWorking,
            statuses
          }
        })
        
        setAttendanceData(transformedData)
      } else {
        setAttendanceData([])
      }
    } catch (err) {
      console.error('Failed to fetch attendance:', err)
      message.error('Đã xảy ra lỗi khi tải dữ liệu')
      setAttendanceData([])
    } finally {
      setLoading(false)
    }
  }

  const dataSource = useMemo(() => {
    return attendanceData
    .filter((item) => {
      return (
        !query ||
        item.name.toLowerCase().includes(query.toLowerCase()) ||
        item.phone.includes(query)
      )
    })
    .map((item) => {
        const dayMap = {}
        for (let day = 1; day <= DAYS_IN_MONTH; day++) {
          dayMap[`day_${day - 1}`] = item.statuses?.[day] || 'empty'
        }
      return { ...item, ...dayMap, key: item.id }
    })
  }, [attendanceData, query])

  const columns = [
    {
      title: 'Họ Tên',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      fixed: 'left',
      render: (_, record) => (
        <div className="attendance-name-cell">
          <div className="attendance-name">{record.name}</div>
          <div className="attendance-phone">{record.phone}</div>
        </div>
      )
    },
    {
      title: 'Ngày công',
      dataIndex: 'totalWorking',
      key: 'totalWorking',
      width: 100,
      align: 'center',
      render: (value) => <span style={{ fontWeight: 600 }}>{value}</span>
    },
    ...dayColumns
  ]

  return (
      <div className="attendance-page">
        <div className="attendance-header">
          <h1>Ngày công nhân viên</h1>
        </div>

        <div className="attendance-filters">
          <div className="attendance-month-picker-wrapper">
            <select
              ref={monthInputRef}
              value={selectedMonth}
              onChange={(e) => {
                e.stopPropagation()
                setSelectedMonth(e.target.value)
              }}
              className="attendance-month-select"
            >
              {(() => {
                const options = []
                const currentYear = dayjs().year()
                const years = [currentYear - 1, currentYear, currentYear + 1]
                
                years.forEach(year => {
                  for (let month = 1; month <= 12; month++) {
                    const monthStr = String(month).padStart(2, '0')
                    const value = `${year}-${monthStr}`
                    const monthName = dayjs(`${year}-${monthStr}-01`).format('MM/YYYY')
                    options.push(
                      <option key={value} value={value}>
                        {monthName}
                      </option>
                    )
                  }
                })
                
                return options
              })()}
            </select>
            <CalendarOutlined className="attendance-month-icon" />
          </div>
          <Input
            prefix={<SearchOutlined />}
            placeholder="Tìm kiếm"
            allowClear
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="attendance-search"
          />
          <Button icon={<FilterOutlined />} className="sort-btn">
            Sort
          </Button>
        </div>

        <div className="attendance-table-card">
          <Table
            className="attendance-table"
            columns={columns}
            dataSource={dataSource}
            pagination={false}
            scroll={{ x: 2200 }}
            components={goldTableHeader}
            loading={loading}
          />
        </div>

        <div className="attendance-legend">
          {Object.entries(DAY_COLORS).map(([key, config]) => (
              <div key={key} className="legend-item">
                <span className="legend-dot" style={{ background: config.bg }} />
                {config.label}
              </div>
          ))}
        </div>
      </div>
  )
}

export default function AccountanceAttendance({ Layout = AccountanceLayout }) {
  const Wrapper = Layout || (({ children }) => <>{children}</>)
  return (
    <Wrapper>
      <AccountanceAttendanceContent />
    </Wrapper>
  )
}

