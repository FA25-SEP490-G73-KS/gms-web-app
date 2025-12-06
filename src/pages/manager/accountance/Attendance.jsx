import { useMemo, useState, useEffect, useRef } from 'react'
import { Button, Checkbox, Input, Tabs, Table, message } from 'antd'
import { CalendarOutlined } from '@ant-design/icons'
import ManagerLayout from '../../../layouts/ManagerLayout'
import { goldTableHeader } from '../../../utils/tableComponents'
import { attendanceAPI, employeeAPI } from '../../../services/api'
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

const MAX_DAYS_IN_MONTH = 31 // For column generation
const STATUS_COLORS = {
  present: '#32D74B',
  absent: '#F87171',
  leave: '#FBBF24',
  remote: '#BFBFBF',
  empty: '#E2E8F0',
}

const fallbackOverview = fallbackEmployees.map((emp, idx) => {
  const statuses = {}
  for (let day = 1; day <= MAX_DAYS_IN_MONTH; day += 1) {
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
  const [selectedMonth, setSelectedMonth] = useState(dayjs().format('YYYY-MM')) // Current month
  const [overviewData, setOverviewData] = useState([])
  const [overviewLoading, setOverviewLoading] = useState(false)
  const [employees, setEmployees] = useState([])
  const [employeesLoading, setEmployeesLoading] = useState(false)
  const [attendance, setAttendance] = useState([])
  const monthInputRef = useRef(null)

  const filtered = useMemo(() => {
    if (!search || search.trim() === '') return attendance
    const lower = search.toLowerCase()
    return attendance.filter(
      (item) =>
        (item.fullName || '').toLowerCase().includes(lower) ||
        (item.phone || '').includes(lower) ||
        (item.position || '').toLowerCase().includes(lower)
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

  // Fetch employees list on mount
  useEffect(() => {
    fetchEmployees()
  }, [])

  // Fetch overview data from API
  useEffect(() => {
    if (activeTab === 'overview') {
      fetchOverviewData()
    }
  }, [activeTab, selectedMonth])

  const fetchEmployees = async () => {
    try {
      setEmployeesLoading(true)
      
      console.log('=== Fetching Employees ===')
      
      const { data, error } = await employeeAPI.getAll({ size: 100 })
      
      if (error) {
        console.error('Error fetching employees:', error)
        message.error('Không thể tải danh sách nhân viên')
        setEmployees(fallbackEmployees)
        setAttendance(fallbackEmployees.map(emp => ({ ...emp, note: '', present: false })))
        return
      }

      console.log('API Response:', data)

      if (data && data.result && data.result.content) {
        // Transform API data to match component format
        const transformedEmployees = data.result.content
          .filter(emp => emp.employeeId != null && emp.employeeId !== undefined) // Use employeeId from API
          .map((emp) => ({
            id: Number(emp.employeeId), // Map employeeId → id
            fullName: emp.fullName || 'Không rõ',
            phone: emp.phone || '',
            position: emp.role || 'Nhân viên',
            note: '',
            present: false,
          }))
        
        setEmployees(transformedEmployees)
        setAttendance(transformedEmployees)
        
        console.log('=== Employees Loaded ===')
        console.log('Total:', transformedEmployees.length)
        console.log('First 3 employees:', transformedEmployees.slice(0, 3))
        console.log('========================')
        
        // Fetch today's attendance after employees are loaded
        fetchTodayAttendanceForEmployees(transformedEmployees)
      } else {
        console.warn('No content in API response, using fallback')
        setEmployees(fallbackEmployees)
        setAttendance(fallbackEmployees.map(emp => ({ ...emp, note: '', present: false })))
      }
    } catch (err) {
      console.error('Exception fetching employees:', err)
      message.error('Đã xảy ra lỗi khi tải danh sách nhân viên')
      setEmployees(fallbackEmployees)
      setAttendance(fallbackEmployees.map(emp => ({ ...emp, note: '', present: false })))
    } finally {
      setEmployeesLoading(false)
    }
  }

  const fetchTodayAttendanceForEmployees = async (employeesList) => {
    try {
      const today = dayjs().format('YYYY-MM-DD')
      console.log('=== Fetching Today Attendance ===')
      console.log('Date:', today)
      
      const { data, error } = await attendanceAPI.getDaily(today)
      
      if (error) {
        console.log('No attendance data for today or error:', error)
        return // No attendance data yet, that's fine
      }

      console.log('Today Attendance Response:', data)

      if (data && data.result && Array.isArray(data.result)) {
        // Update attendance state with today's data
        const updatedAttendance = employeesList.map((emp) => {
          const todayRecord = data.result.find(
            (record) => Number(record.employeeId) === Number(emp.id)
          )
          
          if (todayRecord) {
            return {
              ...emp,
              present: todayRecord.isPresent || false,
              note: todayRecord.note || ''
            }
          }
          
          return emp
        })
        
        setAttendance(updatedAttendance)
        
        console.log('=== Today Attendance Loaded ===')
        console.log('Records found:', data.result.length)
        console.log('===============================')
      }
    } catch (err) {
      console.error('Exception fetching today attendance:', err)
      // Don't show error message, just log it
    }
  }

  const fetchTodayAttendance = async () => {
    try {
      const today = dayjs().format('YYYY-MM-DD')
      console.log('=== Fetching Today Attendance ===')
      console.log('Date:', today)
      
      const { data, error } = await attendanceAPI.getDaily(today)
      
      if (error) {
        console.log('No attendance data for today or error:', error)
        return // No attendance data yet, that's fine
      }

      console.log('Today Attendance Response:', data)

      if (data && data.result && Array.isArray(data.result)) {
        // Update attendance state with today's data
        setAttendance((prev) => {
          return prev.map((emp) => {
            const todayRecord = data.result.find(
              (record) => Number(record.employeeId) === Number(emp.id)
            )
            
            if (todayRecord) {
              return {
                ...emp,
                present: todayRecord.isPresent || false,
                note: todayRecord.note || ''
              }
            }
            
            return emp
          })
        })
        
        console.log('=== Today Attendance Loaded ===')
        console.log('Records found:', data.result.length)
        console.log('===============================')
      }
    } catch (err) {
      console.error('Exception fetching today attendance:', err)
      // Don't show error message, just log it
    }
  }

  const fetchOverviewData = async () => {
    try {
      setOverviewLoading(true)
      
      // Convert "YYYY-MM" to start and end dates for API
      const [year, month] = selectedMonth.split('-')
      const startDate = dayjs(`${year}-${month}-01`)
      const endDate = startDate.endOf('month')
      const daysInMonth = endDate.date()
      
      const startDateStr = startDate.format('YYYY-MM-DD')
      const endDateStr = endDate.format('YYYY-MM-DD')
      
      console.log('=== Fetching Overview Summary ===')
      console.log('Start Date:', startDateStr)
      console.log('End Date:', endDateStr)
      console.log('Days in month:', daysInMonth)
      console.log('==================================')
      
      const { data, error } = await attendanceAPI.getSummary(startDateStr, endDateStr)
      
      if (error) {
        console.error('Error:', error)
        message.error('Không thể tải dữ liệu điểm danh')
        setOverviewData(fallbackOverview)
        return
      }

      console.log('API Response:', data)

      if (data && data.result) {
        // Transform API data to match table format
        const transformedData = data.result.map((emp) => {
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
                  statuses[dayNum] = record.isPresent ? 'present' : 'absent'
                }
              }
            })
          }
          
          // Count total working days (present)
          const totalWorking = Object.values(statuses).filter(s => s === 'present').length
          
          return {
            id: emp.employeeId,
            fullName: emp.employeeName,
            totalWorking,
            statuses
          }
        })
        
        console.log('Transformed data:', transformedData.length, 'employees')
        setOverviewData(transformedData)
      } else {
        console.warn('No result in API response')
        setOverviewData(fallbackOverview)
      }
    } catch (err) {
      console.error('Exception fetching overview:', err)
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
      // Build array of attendance records for employees who are checked
      const attendanceRecords = filtered
        .filter(emp => emp.present)
        .filter(emp => emp.id != null && emp.id !== undefined) // Filter out invalid IDs
        .map(emp => ({
          employeeId: Number(emp.id), // Ensure it's a number
          isPresent: true, // Backend requires this field
          note: emp.note || ''
        }))

      if (attendanceRecords.length === 0) {
        message.warning('Vui lòng chọn ít nhất một nhân viên để điểm danh')
        return
      }

      console.log('=== Attendance Payload (Array) ===')
      console.log('Total employees:', attendanceRecords.length)
      console.log('Payload:', JSON.stringify(attendanceRecords, null, 2))
      console.log('===================================')

      // Call API once with array of employee records
      const { data, error } = await attendanceAPI.mark(attendanceRecords)

      if (error) {
        console.error('Error:', error)
        message.error(error || 'Không thể lưu điểm danh')
        return
      }

      console.log('Success:', data)
      message.success(`Đã điểm danh thành công cho ${attendanceRecords.length} nhân viên`)
      
      // Fetch today's attendance again to update checkboxes
      await fetchTodayAttendance()
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
    const dayColumns = Array.from({ length: MAX_DAYS_IN_MONTH }, (_, idx) => {
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
                loading={employeesLoading}
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
                <div style={{ position: 'relative', width: 180 }}>
                  <select
                    ref={monthInputRef}
                  value={selectedMonth}
                    onChange={(e) => {
                      e.stopPropagation()
                      setSelectedMonth(e.target.value)
                    }}
                    style={{
                      width: '100%',
                      height: '40px',
                      padding: '8px 12px',
                      paddingRight: '40px',
                      fontSize: '14px',
                      fontWeight: 500,
                      border: '1px solid #d9d9d9',
                      borderRadius: '8px',
                      outline: 'none',
                      color: '#262626',
                      background: '#fff',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      appearance: 'none',
                      WebkitAppearance: 'none',
                      MozAppearance: 'none'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#CBB081'
                      e.target.style.boxShadow = '0 0 0 2px rgba(203, 176, 129, 0.2)'
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#d9d9d9'
                      e.target.style.boxShadow = 'none'
                    }}
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
                  <CalendarOutlined 
                    style={{ 
                      position: 'absolute', 
                      right: '12px', 
                      top: '50%', 
                      transform: 'translateY(-50%)',
                      color: '#9ca3af',
                      pointerEvents: 'none',
                      fontSize: '16px',
                      transition: 'color 0.2s ease',
                      zIndex: 1
                    }} 
                />
                </div>
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


