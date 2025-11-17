import React, { useState } from 'react'
import { Table, Input, Button, DatePicker, Tag } from 'antd'
import { SearchOutlined, FilterOutlined } from '@ant-design/icons'
import AccountanceLayout from '../../layouts/AccountanceLayout'
import { goldTableHeader } from '../../utils/tableComponents'
import '../../styles/pages/accountance/attendance.css'

const attendanceData = [
  {
    id: 1,
    name: 'Hoàng Thị Khánh Ly',
    phone: '0919866874',
    days: ['P', 'A', 'HR', '', '', '', '', '', '', '', '', '', '']
  },
  {
    id: 2,
    name: 'Nguyễn Văn A',
    phone: '0913336432',
    days: ['P', '', 'P', '', '', '', '', '', '', '', '', '', '']
  },
  {
    id: 3,
    name: 'Phạm Văn B',
    phone: '0123456789',
    days: ['', '', '', '', '', '', '', '', '', '', '', '', '']
  },
  {
    id: 4,
    name: 'Lê Thị C',
    phone: '0987623455',
    days: ['', '', '', '', '', '', '', '', '', '', '', '', '']
  }
]

const DAY_COLORS = {
  P: { bg: '#d0f5d6', label: 'Có mặt' },
  A: { bg: '#ffd6d6', label: 'Vắng' },
  HR: { bg: '#ffe8a3', label: 'Làm nửa ngày' },
  '': { bg: '#f0f1f5', label: 'Không có dữ liệu' }
}

const dayColumns = Array.from({ length: 13 }, (_, index) => ({
  title: String(index + 1).padStart(2, '0'),
  dataIndex: `day_${index}`,
  key: `day_${index}`,
  width: 60,
  align: 'center',
  render: (value) => {
    const color = DAY_COLORS[value || ''] || DAY_COLORS['']
    return (
      <div className="attendance-cell" style={{ background: color.bg }}>
        {value}
      </div>
    )
  }
}))

export default function Attendance() {
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
      width: 220,
      fixed: 'left',
      render: (_, record) => (
        <div className="attendance-name-cell">
          <div className="attendance-name">{record.name}</div>
          <div className="attendance-phone">{record.phone}</div>
        </div>
      )
    },
    ...dayColumns
  ]

  return (
    <AccountanceLayout>
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
            scroll={{ x: 1200 }}
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
    </AccountanceLayout>
  )
}

