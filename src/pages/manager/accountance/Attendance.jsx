import { useMemo, useState } from 'react'
import { Button, Checkbox, Input, Tabs, Table, message, Select } from 'antd'
import ManagerLayout from '../../../layouts/ManagerLayout'
import { goldTableHeader } from '../../../utils/tableComponents'

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
  const [attendance, setAttendance] = useState(() =>
    fallbackEmployees.map((emp) => ({
      ...emp,
      note: '',
      morning: false,
      afternoon: false,
    }))
  )

  const updateAttendance = (id, field, value) => {
    setAttendance((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    )
  }

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

  const columns = [
    {
      title: 'Họ Tên',
      dataIndex: 'fullName',
      key: 'fullName',
      fixed: 'left',
      width: 180,
      render: (_, record) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span
            style={{
              fontWeight: 600,
              maxWidth: 150,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {record.fullName}
          </span>
          <span style={{ color: '#667085', fontSize: 12 }}>{record.phone}</span>
        </div>
      ),
    },
    {
      title: 'Chức vụ',
      dataIndex: 'position',
      key: 'position',
      width: 180,
    },
    {
      title: morningLabel,
      dataIndex: 'morning',
      key: 'morning',
      align: 'center',
      width: 160,
      render: (_, record) => (
        <Checkbox
          checked={record.morning}
          onChange={(e) => updateAttendance(record.id, 'morning', e.target.checked)}
        />
      ),
    },
    {
      title: afternoonLabel,
      dataIndex: 'afternoon',
      key: 'afternoon',
      align: 'center',
      width: 160,
      render: (_, record) => (
        <Checkbox
          checked={record.afternoon}
          onChange={(e) => updateAttendance(record.id, 'afternoon', e.target.checked)}
        />
      ),
    },
    {
      title: 'Ghi chú',
      dataIndex: 'note',
      key: 'note',
      width: 220,
      render: (_, record) => (
        <Input
          value={record.note}
          onChange={(e) => updateAttendance(record.id, 'note', e.target.value)}
          placeholder="Ghi chú"
        />
      ),
    },
  ]

  const handleSave = () => {
    message.success('Đã lưu chấm công cho ' + attendance.length + ' nhân viên')
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
        width: 36,
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
                width: 18,
                height: 18,
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
      <div style={{ padding: 24, minHeight: '100vh', background: '#f5f7fb' }}>
        <div
          style={{
            background: '#fff',
            borderRadius: 16,
            padding: 24,
            boxShadow: '0 12px 30px rgba(15, 23, 42, 0.08)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 16,
              marginBottom: 16,
            }}
          >
            <div>
              <div style={{ fontSize: 14, color: '#98A2B3' }}>manager / Chấm công</div>
              <h2 style={{ marginBottom: 0 }}>Chấm công</h2>
            </div>
            <Input
              allowClear
              prefix={<i className="bi bi-search" />}
              placeholder="Tìm kiếm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ maxWidth: 280, background: '#f5f6fb' }}
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
                scroll={{ x: 900 }}
                components={goldTableHeader}
                style={{ marginBottom: 16 }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  type="primary"
                  size="large"
                  style={{ background: '#32D74B', borderColor: '#32D74B', minWidth: 160 }}
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
                dataSource={fallbackOverview.map((item) => ({ ...item, key: item.id }))}
                pagination={false}
                scroll={{ x: 1400 }}
                components={goldTableHeader}
              />
            </>
          )}
        </div>
      </div>
    </ManagerLayout>
  )
}


