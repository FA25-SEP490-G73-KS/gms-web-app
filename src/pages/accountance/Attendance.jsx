import React, { useState } from 'react'
import { Table, Input, Button, DatePicker, Tag } from 'antd'
import { SearchOutlined, FilterOutlined } from '@ant-design/icons'
import AccountanceLayout from '../../layouts/AccountanceLayout'
import { goldTableHeader } from '../../utils/tableComponents'
import '../../styles/pages/accountance/attendance.css'

const DAYS_IN_MONTH = 31

// Generate sample data for 31 days
const generateDaysData = (pattern) => {
  const days = []
  for (let i = 0; i < DAYS_IN_MONTH; i++) {
    const mod = (i + pattern) % 7
    if (mod === 0) days.push('A')
    else if (mod === 1) days.push('HR')
    else if (mod === 2) days.push('P')
    else days.push('')
  }
  return days
}

const attendanceData = [
  {
    id: 1,
    name: 'Hoàng Thị Khánh Ly',
    phone: '0919866874',
    totalWorking: 10,
    days: generateDaysData(0)
  },
  {
    id: 2,
    name: 'Nguyễn Văn A',
    phone: '0913336432',
    totalWorking: 10,
    days: generateDaysData(1)
  },
  {
    id: 3,
    name: 'Phạm Văn B',
    phone: '0123456789',
    totalWorking: 9,
    days: generateDaysData(2)
  },
  {
    id: 4,
    name: 'Lê Thị C',
    phone: '0987623455',
    totalWorking: 8,
    days: generateDaysData(3)
  }
]

const DAY_COLORS = {
  P: { bg: '#d0f5d6', label: 'Có mặt' },
  A: { bg: '#ffd6d6', label: 'Vắng' },
  HR: { bg: '#ffe8a3', label: 'Làm nửa ngày' },
  '': { bg: '#f0f1f5', label: 'Không có dữ liệu' }
}

const dayColumns = Array.from({ length: DAYS_IN_MONTH }, (_, index) => ({
  title: String(index + 1).padStart(2, '0'),
  dataIndex: `day_${index}`,
  key: `day_${index}`,
  width: 60,
  align: 'center',
  render: (value) => {
    const color = DAY_COLORS[value || ''] || DAY_COLORS['']
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
          color: value ? '#000' : 'transparent'
        }}
      >
        {value}
      </div>
    )
  }
}))

export function AccountanceAttendanceContent() {
  const [query, setQuery] = useState('')
  const [month, setMonth] = useState(null)

  const dataSource = attendanceData
    .filter((item) => {
      return (
        !query ||
        item.name.toLowerCase().includes(query.toLowerCase()) ||
        item.phone.includes(query)
      )
    })
    .map((item) => {
      const dayMap = item.days.reduce((acc, value, idx) => {
        acc[`day_${idx}`] = value
        return acc
      }, {})
      return { ...item, ...dayMap, key: item.id }
    })

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
          <DatePicker
            picker="month"
            placeholder="Tháng"
            value={month}
            onChange={setMonth}
            className="attendance-month-picker"
          />
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
          />
        </div>

        <div className="attendance-legend">
          {Object.entries(DAY_COLORS).map(([key, config]) => (
            key !== '' && (
              <div key={key} className="legend-item">
                <span className="legend-dot" style={{ background: config.bg }} />
                {config.label}
              </div>
            )
          ))}
          <div className="legend-item">
            <span className="legend-dot" style={{ background: DAY_COLORS[''].bg }} />
            {DAY_COLORS[''].label}
          </div>
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

