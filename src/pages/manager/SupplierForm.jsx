import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, Card, Col, Form, Input, Row, Space, Spin, message } from 'antd'
import ManagerLayout from '../../layouts/ManagerLayout'
import { suppliersAPI } from '../../services/api'

export default function SupplierForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = useMemo(() => Boolean(id), [id])
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [form] = Form.useForm()

  useEffect(() => {
    if (!isEdit) {
      return
    }
    const supplierId = Number(id)
    if (Number.isNaN(supplierId)) {
      message.error('ID nhà cung cấp không hợp lệ')
      navigate('/manager/suppliers')
      return
    }
    const fetchDetail = async () => {
      try {
        const { data, error } = await suppliersAPI.getById(supplierId)
        if (error) {
          throw new Error(error)
        }
        const payload = data?.result || data?.data || data
        form.setFieldsValue({
          name: payload?.name,
          phone: payload?.phone,
          email: payload?.email,
          province: '',
          district: '',
          addressDetail: payload?.address || '',
        })
      } catch (err) {
        message.error(err.message || 'Không thể tải nhà cung cấp')
        navigate('/manager/suppliers')
      } finally {
        setLoading(false)
      }
    }
    fetchDetail()
  }, [form, id, isEdit, navigate])

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const supplierId = Number(id)
      if (isEdit && Number.isNaN(supplierId)) {
        message.error('ID nhà cung cấp không hợp lệ')
        return
      }
      setSaving(true)
      const address = [values.addressDetail, values.district, values.province]
        .filter(Boolean)
        .map((item) => item.trim())
        .join(', ')
      const payload = {
        name: values.name.trim(),
        phone: values.phone.trim(),
        email: values.email.trim(),
        address,
      }
      const apiCall = isEdit ? suppliersAPI.update(supplierId, payload) : suppliersAPI.create(payload)
      const { error } = await apiCall
      if (error) {
        throw new Error(error)
      }
      message.success(isEdit ? 'Cập nhật nhà cung cấp thành công' : 'Tạo nhà cung cấp thành công')
      navigate('/manager/suppliers')
    } catch (err) {
      if (!err?.errorFields) {
        message.error(err.message || 'Không thể lưu nhà cung cấp')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <ManagerLayout>
      <Spin spinning={loading}>
        <div style={{ padding: 24, minHeight: '100vh', background: '#f5f7fb' }}>
          <Card
            style={{
              borderRadius: 16,
              maxWidth: 900,
              margin: '0 auto',
              boxShadow: '0 20px 45px rgba(15, 23, 42, 0.12)',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <h2 style={{ marginBottom: 8 }}>{isEdit ? 'Sửa nhà cung cấp' : 'Thêm nhà cung cấp'}</h2>
              <p style={{ color: '#98A2B3', margin: 0 }}>
                Nhập thông tin chi tiết để {isEdit ? 'cập nhật' : 'tạo'} nhà cung cấp mới
              </p>
            </div>

            <Form layout="vertical" form={form}>
              <Row gutter={24}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Tên nhà cung cấp"
                    name="name"
                    rules={[{ required: true, message: 'Vui lòng nhập tên nhà cung cấp' }]}
                  >
                    <Input placeholder="VD: SupplierA" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Tỉnh / Thành phố"
                    name="province"
                  >
                    <Input placeholder="VD: Hà Nội" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={24}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Số điện thoại"
                    name="phone"
                    rules={[
                      { required: true, message: 'Vui lòng nhập số điện thoại' },
                      { pattern: /^\d{9,12}$/, message: 'Số điện thoại không hợp lệ' },
                    ]}
                  >
                    <Input placeholder="VD: 0987654321" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Phường / Xã"
                    name="district"
                  >
                    <Input placeholder="VD: Thạch Thất" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={24}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Email"
                    name="email"
                    rules={[
                      { required: true, message: 'Vui lòng nhập email' },
                      { type: 'email', message: 'Email không hợp lệ' },
                    ]}
                  >
                    <Input placeholder="VD: abc@company.com" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Địa chỉ chi tiết"
                    name="addressDetail"
                    rules={[{ required: true, message: 'Vui lòng nhập địa chỉ chi tiết' }]}
                  >
                    <Input placeholder="VD: 123 Nguyễn Trãi" />
                  </Form.Item>
                </Col>
              </Row>
            </Form>

            <Space style={{ marginTop: 32, display: 'flex', justifyContent: 'center' }} size="large">
              <Button onClick={() => navigate('/manager/suppliers')} style={{ padding: '0 32px', height: 42 }}>
                Hủy
              </Button>
              <Button
                type="primary"
                onClick={handleSubmit}
                loading={saving}
                style={{
                  background: '#32D74B',
                  borderColor: '#32D74B',
                  padding: '0 40px',
                  height: 42,
                  fontSize: 16,
                  fontWeight: 600,
                }}
              >
                {isEdit ? 'Lưu' : 'Tạo'}
              </Button>
            </Space>
          </Card>
        </div>
      </Spin>
    </ManagerLayout>
  )
}


