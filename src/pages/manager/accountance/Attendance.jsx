import { useMemo, useState, useEffect } from 'react'
import { Button, Checkbox, Input, Tabs, Table, message, Select } from 'antd'
import ManagerLayout from '../../../layouts/ManagerLayout'
import { goldTableHeader } from '../../../utils/tableComponents'
import { attendanceAPI } from '../../../services/api'
import dayjs from 'dayjs'

const fallbackEmployees = [
  { id: 'EMP-001', fullName: 'Nguyễn Văn A', phone: '0919866874', position: 'Kỹ thuật viên' },
  { id: 'EMP-002', fullName: 'Phạm Văn B', phone: '0123456789', position: 'Nhân viên kho' },
  { id: 'EMP-003', fullName: 'Lê Thị C', phone: '0987123456', position: 'Kế toán' },
  { id: 'EMP-004', fullName: 'Hoàng Văn D', phone: '0356677789', position: 'Kỹ thuật viên' },
  { id: 'EMP-005', fullName: 'Đặng Thị Huyền', phone: '0912334455', position: 'Kỹ thuật viên' },
  { id: 'EMP-006', fullName: 'Nguyễn Văn A', phone: '0915667788', position: 'Kỹ thuật viên' },
  { id: 'EMP-007', fullName: 'Nguyễn Văn A', phone: '0915667789', position: 'Kỹ thuật viên' },
]

const morningLabel = 'Sáng (7:30-11:30)'
const afternoonLabel = 'Chiều (13:30-17:30)'

const DAYS_IN_MONTH = 31
const STATUS_COLORS = {
  present: '#32D74B',
  absent: '#F87171',
  leave: '#FBBF24',
  remote: '#BFBFBF',
  empty: '#E2E8F0',
}

const fallbackOverview = fallbackEmployees.map((emp, idx) => {
  const statuses = {}
  for (let day = 1; day <= DAYS_IN_MONTH; day += 1) {
    const mod = (idx + day) % 7
    let status = 'present'
    if (mod === 0) status = 'absent'
    else if (mod === 1) status = 'leave'
    else if (mod === 2) status = 'remote'
    statuses[day] = mod > 3 ? 'empty' : status
  }
  const totalWorking = Object.values(statuses).filter((value) => value === 'present' || value === 'remote').length
  return {
    id: emp.id,
    fullName: emp.fullName,
    totalWorking,
    statuses,
  }
})

export default function AttendanceForManager() {
  const [activeTab, setActiveTab] = useState('checkin')
  const [search, setSearch] = useState('')
  const [selectedMonth, setSelectedMonth] = useState('03/2025')
  const [overviewData, setOverviewData] = useState([])
  const [overviewLoading, setOverviewLoading] = useState(false)
  const [attendance, setAttendance] = useState(() =>
    fallbackEmployees.map((emp) => ({
      ...emp,
      note: '',
      present: false,
    }))
  )

  const filtered = useMemo(() => {
    if (!search) return attendance
    const lower = search.toLowerCase()
    return attendance.filter(
      (item) =>
        item.fullName.toLowerCase().includes(lower) ||
        item.phone.includes(lower) ||
        item.position.toLowerCase().includes(lower)
    )
  }, [attendance, search])

  const updateAttendance = (id, field, value) => {
    setAttendance((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    )
  }

  const handleCheckAll = (checked) => {
    setAttendance((prev) =>
      prev.map((item) => ({ ...item, present: checked }))
    )
  }

  const allChecked = useMemo(() => {
    return filtered.length > 0 && filtered.every((item) => item.present)
  }, [filtered])

  // Fetch overview data from API
  useEffect(() => {
    if (activeTab === 'overview') {
      fetchOverviewData()
    }
  }, [activeTab, selectedMonth])

  const fetchOverviewData = async () => {
    try {
      setOverviewLoading(true)
      
      // Convert "03/2025" to "2025-03-01" for API
      const [month, year] = selectedMonth.split('/')
      const dateStr = `${year}-${month.padStart(2, '0')}-01`
      
      console.log('=== Fetching Overview ===')
      console.log('Date:', dateStr)
      console.log('========================')
      
      const { data, error } = await attendanceAPI.getDaily(dateStr)
      
      if (error) {
        message.error('Không thể tải dữ liệu điểm danh')
        setOverviewData(fallbackOverview) // Fallback to sample data
        return
      }

      if (data && data.result) {
        // Transform API data to match table format
        const transformedData = data.result.map((emp) => {
          const statuses = {}
          
          // Build statuses object for each day of month
          for (let day = 1; day <= DAYS_IN_MONTH; day++) {
            // Default to empty
            statuses[day] = 'empty'
          }
          
          // Override with actual data if present
          if (emp.isPresent) {
            const dayNum = parseInt(emp.recordedAt?.split('-')[2]) || 1
            statuses[dayNum] = 'present'
          }
          
          return {
            id: emp.employeeId,
            fullName: emp.employeeName,
            totalWorking: emp.recordedBy || 0,
            statuses
          }
        })
        
        setOverviewData(transformedData)
      } else {
        setOverviewData(fallbackOverview)
      }
    } catch (err) {
      console.error('Error fetching overview:', err)
      message.error('Đã xảy ra lỗi khi tải dữ liệu')
      setOverviewData(fallbackOverview)
    } finally {
      setOverviewLoading(false)
    }
  }

  const columns = [
    {
      title: 'Họ Tên',
      dataIndex: 'fullName',
      key: 'fullName',
      fixed: 'left',
      width: 200,
      render: (_, record) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span
            style={{
              fontWeight: 600,
              fontSize: 14,
              color: '#1a1a1a',
            }}
          >
            {record.fullName}
          </span>
          <span style={{ color: '#667085', fontSize: 12, marginTop: 2 }}>{record.phone}</span>
        </div>
      ),
    },
    {
      title: 'Chức vụ',
      dataIndex: 'position',
      key: 'position',
      width: 250,
      render: (text) => (
        <span style={{ color: '#344054', fontSize: 14 }}>{text}</span>
      )
    },
    {
      title: (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Checkbox
            checked={allChecked}
            onChange={(e) => handleCheckAll(e.target.checked)}
            style={{ transform: 'scale(1.2)' }}
          />
          <span>Có mặt</span>
        </div>
      ),
      dataIndex: 'present',
      key: 'present',
      align: 'center',
      width: 150,
      render: (_, record) => (
        <Checkbox
          checked={record.present}
          onChange={(e) => updateAttendance(record.id, 'present', e.target.checked)}
          style={{ transform: 'scale(1.3)' }}
        />
      ),
    },
    {
      title: 'Ghi chú',
      dataIndex: 'note',
      key: 'note',
      width: 500,
      render: (_, record) => (
        <Input
          value={record.note}
          onChange={(e) => updateAttendance(record.id, 'note', e.target.value)}
          placeholder="Ghi chú"
          style={{ 
            width: '100%',
            height: 40,
            fontSize: 14,
            borderRadius: 8
          }}
        />
      ),
    },
  ]

  const handleSave = async () => {
    try {
      // Get current date or selected date
      const attendanceDate = dayjs().format('YYYY-MM-DD')
      
      // Build array of attendance records for employees who are checked
      const attendanceRecords = filtered
        .filter(emp => emp.present)
        .map(emp => ({
          employeeId: emp.id,
          isPresent: true,
          note: emp.note || ''
        }))

      if (attendanceRecords.length === 0) {
        message.warning('Vui lòng chọn ít nhất một nhân viên để điểm danh')
        return
      }

      const payload = attendanceRecords.map(record => ({
        ...record,
        date: attendanceDate
      }))

      console.log('=== Attendance Payload ===')
      console.log('Date:', attendanceDate)
      console.log('Records:', JSON.stringify(payload, null, 2))
      console.log('==========================')

      // Call API for each record
      const promises = payload.map(record => attendanceAPI.mark(record))
      await Promise.all(promises)

      message.success(`Đã điểm danh thành công cho ${attendanceRecords.length} nhân viên`)
      
      // Reset attendance state after successful save
      setAttendance((prev) =>
        prev.map((item) => ({
          ...item,
          present: false,
          note: ''
        }))
      )
    } catch (error) {
      console.error('Error marking attendance:', error)
      message.error('Không thể lưu điểm danh. Vui lòng thử lại')
    }
  }

  const overviewColumns = useMemo(() => {
    const base = [
      {
        title: 'Họ Tên',
        dataIndex: 'fullName',
        key: 'fullName',
        width: 200,
        fixed: 'left',
        render: (value) => (
          <span
            style={{
              fontWeight: 600,
              maxWidth: 170,
              display: 'inline-block',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {value}
          </span>
        ),
      },
      {
        title: 'Ngày công',
        dataIndex: 'totalWorking',
        key: 'totalWorking',
        width: 120,
        align: 'center',
        render: (value) => <span style={{ fontWeight: 600 }}>{value}</span>,
      },
    ]
    const dayColumns = Array.from({ length: DAYS_IN_MONTH }, (_, idx) => {
      const day = idx + 1
      return {
        title: day < 10 ? `0${day}` : `${day}`,
        key: `day-${day}`,
        width: 60,
        align: 'center',
        render: (_, record) => {
          const value = record.statuses[day] || 'empty'
          const colors = {
            present: STATUS_COLORS.present,
            absent: STATUS_COLORS.absent,
            leave: STATUS_COLORS.leave,
            remote: STATUS_COLORS.remote,
            empty: STATUS_COLORS.empty,
          }
          const color = colors[value] || STATUS_COLORS.empty
          return (
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: color,
                margin: '0 auto',
              }}
            />
          )
        },
      }
    })
    return [...base, ...dayColumns]
  }, [])

  return (
    <ManagerLayout>
      <div style={{ padding: 24, minHeight: '100vh' }}>
        <div
          style={{
            background: '#fff',
            borderRadius: 16,
            padding: 24,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 16,
              marginBottom: 24,
            }}
          >
            <div>
              <div style={{ fontSize: 14, color: '#98A2B3', marginBottom: 4 }}>manager / Chấm công</div>
              <h2 style={{ marginBottom: 0, fontSize: 28, fontWeight: 700, color: '#1a1a1a' }}>Chấm công</h2>
            </div>
            <Input
              allowClear
              prefix={<i className="bi bi-search" style={{ fontSize: 16, color: '#667085' }} />}
              placeholder="Tìm kiếm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ 
                maxWidth: 320, 
                height: 42,
                background: '#F9FAFB',
                borderRadius: 8,
                border: '1px solid #E5E7EB',
                fontSize: 14
              }}
            />
          </div>

          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              { key: 'checkin', label: 'Điểm danh' },
              { key: 'overview', label: 'Tổng quan' },
            ]}
            style={{ marginBottom: 12 }}
          />

          {activeTab === 'checkin' ? (
            <>
              <Table
                columns={columns}
                dataSource={filtered}
                pagination={false}
                scroll={{ x: 1100 }}
                components={goldTableHeader}
                style={{ marginBottom: 24 }}
                rowClassName={() => 'attendance-row'}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  type="primary"
                  size="large"
                  style={{ 
                    background: '#16A34A', 
                    borderColor: '#16A34A', 
                    minWidth: 180,
                    height: 48,
                    fontSize: 16,
                    fontWeight: 600,
                    borderRadius: 8,
                    boxShadow: '0 2px 8px rgba(22, 163, 74, 0.3)'
                  }}
                  onClick={handleSave}
                >
                  Lưu
                </Button>
              </div>
            </>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                <Select
                  value={selectedMonth}
                  onChange={setSelectedMonth}
                  options={[
                    { label: 'Tháng 3/2025', value: '03/2025' },
                    { label: 'Tháng 2/2025', value: '02/2025' },
                  ]}
                  style={{ width: 180 }}
                />
                <div style={{ display: 'flex', gap: 16 }}>
                  {[
                    { color: STATUS_COLORS.present, label: 'Có mặt' },
                    { color: STATUS_COLORS.absent, label: 'Vắng' },
                    { color: STATUS_COLORS.leave, label: 'Làm nửa ngày' },
                    { color: STATUS_COLORS.remote, label: 'Phép có đăng ký' },
                  ].map((item) => (
                    <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        style={{
                          width: 14,
                          height: 14,
                          borderRadius: '50%',
                          background: item.color,
                          display: 'inline-block',
                        }}
                      />
                      <span style={{ color: '#475467', fontSize: 13 }}>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <Table
                columns={overviewColumns}
                dataSource={overviewData.map((item) => ({ ...item, key: item.id }))}
                pagination={false}
                scroll={{ x: 2200 }}
                components={goldTableHeader}
                loading={overviewLoading}
              />
            </>
          )}
        </div>
      </div>
    </ManagerLayout>
  )
}


