import { useEffect, useMemo, useState } from 'react'
import { Button, Card, Input, Space, message } from 'antd'
import ManagerLayout from '../../../layouts/ManagerLayout'
import { serviceTypeAPI } from '../../../services/api'

export default function ManagerServiceTypes() {
  const [types, setTypes] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const fetchTypes = async () => {
      setLoading(true)
      try {
        const { data, error } = await serviceTypeAPI.getAll()
        if (error) throw new Error(error)
        const payload = data?.result || data?.data || data
        const list = Array.isArray(payload) ? payload : payload?.items || []
        setTypes(list.map((item, idx) => ({ id: item.id || `type-${idx}`, name: item.name || 'Không rõ' })))
      } catch (err) {
        message.error(err.message || 'Không thể tải loại dịch vụ, hiển thị dữ liệu mẫu.')
        setTypes([
          { id: 1, name: 'Sơn' },
          { id: 2, name: 'Bảo dưỡng xe' },
          { id: 3, name: 'Thay thế phụ tùng' },
        ])
      } finally {
        setLoading(false)
      }
    }
    fetchTypes()
  }, [])

  const filtered = useMemo(() => {
    if (!search) return types
    const text = search.toLowerCase()
    return types.filter((type) => type.name.toLowerCase().includes(text))
  }, [search, types])

  return (
    <ManagerLayout>
      <div style={{ padding: 24, minHeight: '100vh', background: '#f5f7fb' }}>
        <div
          style={{
            background: '#fff',
            borderRadius: 16,
            padding: 24,
            boxShadow: '0 20px 45px rgba(15, 23, 42, 0.08)',
            maxWidth: 900,
            margin: '0 auto',
          }}
        >
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ marginBottom: 8 }}>Loại dịch vụ</h2>
            <p style={{ color: '#98A2B3', margin: 0 }}>Quản lý danh mục dịch vụ của garage</p>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12,
              marginBottom: 24,
            }}
          >
            <Input
              allowClear
              placeholder="Tìm kiếm loại dịch vụ"
              style={{ maxWidth: 260 }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Space>
              <Button> Sắp xếp A-Z </Button>
              <Button type="primary" style={{ background: '#CBB081', borderColor: '#CBB081' }}>
                + Thêm loại dịch vụ
              </Button>
            </Space>
          </div>

          <Space direction="vertical" style={{ width: '100%' }} size={16}>
            {filtered.map((type) => (
              <Card
                key={type.id}
                loading={loading}
                style={{
                  borderRadius: 16,
                  background: '#fdfaf5',
                  border: 'none',
                  boxShadow: '0 8px 24px rgba(15,23,42,0.06)',
                }}
                bodyStyle={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <span style={{ fontSize: 18, fontWeight: 600 }}>{type.name}</span>
                <Space>
                  <Button type="text" icon={<i className="bi bi-pencil" />} />
                  <Button type="text" danger icon={<i className="bi bi-trash" />} />
                </Space>
              </Card>
            ))}
          </Space>
        </div>
      </div>
    </ManagerLayout>
  )
}


