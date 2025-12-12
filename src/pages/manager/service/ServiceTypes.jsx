import { useEffect, useMemo, useState } from 'react'
import { Button, Card, Input, Space, message, Modal, Form } from 'antd'
import ManagerLayout from '../../../layouts/ManagerLayout'
import { serviceTypeAPI } from '../../../services/api'

export default function ManagerServiceTypes() {
  const [types, setTypes] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [form] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)

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

  const handleAddServiceType = async (values) => {
    setSubmitting(true)
    try {
      const { data, error } = await serviceTypeAPI.create({ name: values.name })
      if (error) throw new Error(error)
      
      message.success('Thêm loại dịch vụ thành công!')
      setShowAddModal(false)
      form.resetFields()
      
      // Refresh the list
      const { data: refreshData, error: refreshError } = await serviceTypeAPI.getAll()
      if (!refreshError) {
        const payload = refreshData?.result || refreshData?.data || refreshData
        const list = Array.isArray(payload) ? payload : payload?.items || []
        setTypes(list.map((item, idx) => ({ id: item.id || `type-${idx}`, name: item.name || 'Không rõ' })))
      }
    } catch (err) {
      message.error(err.message || 'Không thể thêm loại dịch vụ')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteServiceType = (id, name) => {
    Modal.confirm({
      title: 'Xác nhận xóa',
      content: `Bạn có chắc chắn muốn xóa loại dịch vụ "${name}"?`,
      okText: 'Xác nhận',
      cancelText: 'Hủy',
      okButtonProps: {
        danger: true
      },
      onOk: async () => {
        try {
          const { error } = await serviceTypeAPI.delete(id)
          if (error) throw new Error(error)
          
          message.success('Xóa loại dịch vụ thành công!')
          
          // Refresh the list
          const { data: refreshData, error: refreshError } = await serviceTypeAPI.getAll()
          if (!refreshError) {
            const payload = refreshData?.result || refreshData?.data || refreshData
            const list = Array.isArray(payload) ? payload : payload?.items || []
            setTypes(list.map((item, idx) => ({ id: item.id || `type-${idx}`, name: item.name || 'Không rõ' })))
          }
        } catch (err) {
          message.error(err.message || 'Không thể xóa loại dịch vụ')
        }
      }
    })
  }

  return (
    <ManagerLayout>
      <div style={{ padding: 24, minHeight: '100vh' }}>
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
              <Button 
                type="primary" 
                style={{ background: '#CBB081', borderColor: '#CBB081' }}
                onClick={() => setShowAddModal(true)}
              >
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
                <Button 
                  type="text" 
                  danger 
                  icon={<i className="bi bi-trash" />}
                  onClick={() => handleDeleteServiceType(type.id, type.name)}
                />
              </Card>
            ))}
          </Space>
        </div>
      </div>

      {/* Add Service Type Modal */}
      <Modal
        title="Thêm loại dịch vụ"
        open={showAddModal}
        onCancel={() => {
          setShowAddModal(false)
          form.resetFields()
        }}
        footer={null}
        width={500}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAddServiceType}
        >
          <Form.Item
            label="Tên loại dịch vụ"
            name="name"
            rules={[{ required: true, message: 'Vui lòng nhập tên loại dịch vụ' }]}
          >
            <Input 
              placeholder="VD: Bảo dưỡng"
              style={{ height: 40 }}
            />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <Button onClick={() => {
                setShowAddModal(false)
                form.resetFields()
              }}>
                Hủy
              </Button>
              <Button 
                type="primary" 
                htmlType="submit"
                loading={submitting}
                style={{ background: '#CBB081', borderColor: '#CBB081' }}
              >
                Lưu
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </ManagerLayout>
  )
}


