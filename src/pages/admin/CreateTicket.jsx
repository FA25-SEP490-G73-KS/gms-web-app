import AdminLayout from '../../layouts/AdminLayout'
import '/src/styles/pages/admin/createticket.css'
import { DatePicker, Select, Input, InputNumber, Button, Tag, message } from 'antd'
import { useState } from 'react'
import { serviceTicketAPI } from '../../services/api'

const TECHS = [
  { id: 1, name: 'HTK Ly' },
  { id: 2, name: 'DT Huyền' },
  { id: 3, name: 'Nguyễn Văn B' },
  { id: 4, name: 'Phạm Đức Đạt' }
]

const SERVICES = [
  { label: 'Thay thế phụ tùng', value: 1 },
  { label: 'Sơn', value: 2 },
  { label: 'Bảo dưỡng', value: 3 }
]

export default function CreateTicket() {
  const [form, setForm] = useState({
    phone: '', name: '', address: '',
    plate: '', brand: '', model: '', vin: '',
    techs: [], service: [],
    receiveDate: null, note: '', advisorId: 1
  })
  const [loading, setLoading] = useState(false)

  const onChange = (k) => (e) => setForm({ ...form, [k]: e?.target ? e.target.value : e })

  const handleCreate = async () => {
    if (!form.phone || !form.name || !form.address || !form.plate || !form.brand || !form.model) {
      message.error('Vui lòng điền đầy đủ thông tin bắt buộc')
      return
    }

    setLoading(true)
    const payload = {
      appointmentId: 0,
      serviceTypeIds: form.service.map(s => s.value || s),
      customer: {
        customerId: 0,
        fullName: form.name,
        phone: form.phone,
        address: form.address,
        customerType: 'CA_NHAN',
        loyaltyLevel: 'NORMAL'
      },
      vehicle: {
        vehicleId: 0,
        licensePlate: form.plate,
        brandId: 0,
        modelId: 0,
        year: 0,
        vin: form.vin || ''
      },
      advisorId: form.advisorId,
      assignedTechnicianIds: form.techs.map(t => t.id || t),
      receiveCondition: '',
      note: form.note || '',
      expectedDeliveryAt: form.receiveDate ? form.receiveDate.format('YYYY-MM-DD') : ''
    }

    const { data, error } = await serviceTicketAPI.create(payload)
    setLoading(false)

    if (error) {
      message.error('Tạo phiếu không thành công')
      return
    }

    message.success('Tạo phiếu dịch vụ thành công')
    // Reset form or redirect
    setForm({
      phone: '', name: '', address: '',
      plate: '', brand: '', model: '', vin: '',
      techs: [], service: [],
      receiveDate: null, note: '', advisorId: 1
    })
  }

  return (
    <AdminLayout>
      <div className="admin-card">
        <h2 style={{ textAlign:'center', marginTop: 0 }}>PHIẾU DỊCH VỤ</h2>

        <div className="ct-grid">
          <div className="ct-box">
            <div className="ct-field">
              <label>Số điện thoại <span className="req">*</span></label>
              <Input value={form.phone} onChange={onChange('phone')} placeholder="VD: 0123456789" />
            </div>
            <div className="ct-field">
              <label>Họ và tên <span className="req">*</span></label>
              <Input value={form.name} onChange={onChange('name')} placeholder="VD: Đặng Thị Huyền" />
            </div>
            <div className="ct-field">
              <label>Địa chỉ <span className="req">*</span></label>
              <Input value={form.address} onChange={onChange('address')} placeholder="VD: Hòa Lạc - Hà Nội" />
            </div>
          </div>

          <div className="ct-box">
            <div className="ct-field">
              <label>Kỹ thuật viên sửa chữa</label>
              <Select
                mode="multiple"
                value={form.techs}
                onChange={(v)=>setForm({...form, techs: v})}
                options={TECHS.map(t=>({ value:t.id, label:t.name }))}
                style={{ width:'100%' }}
                placeholder="Chọn kỹ thuật viên"
              />
            </div>
            <div className="ct-field">
              <label>Ngày nhận xe</label>
              <DatePicker style={{ width:'100%' }} onChange={(d)=>setForm({...form, receiveDate: d})} />
            </div>
            <div className="ct-field">
              <label>Loại dịch vụ</label>
              <Select
                mode="multiple"
                value={form.service}
                onChange={(v)=>setForm({...form, service: v})}
                options={SERVICES}
                style={{ width:'100%' }}
              />
            </div>
          </div>
        </div>

        <div className="ct-grid">
          <div className="ct-box">
            <div className="ct-field">
              <label>Biển số xe <span className="req">*</span></label>
              <Input value={form.plate} onChange={onChange('plate')} placeholder="VD: 30A-12345" suffix={<span className="caret">▾</span>} />
            </div>
            <div className="ct-field">
              <label>Hãng xe <span className="req">*</span></label>
              <Input value={form.brand} onChange={onChange('brand')} placeholder="VD: Mazda" suffix={<span className="caret">▾</span>} />
            </div>
            <div className="ct-field">
              <label>Loại xe <span className="req">*</span></label>
              <Input value={form.model} onChange={onChange('model')} placeholder="VD: Mazda 3" suffix={<span className="caret">▾</span>} />
            </div>
            <div className="ct-field">
              <label>Số khung</label>
              <Input value={form.vin} onChange={onChange('vin')} placeholder="VD: RL4XW4336B9205813" />
            </div>
          </div>

          <div className="ct-box">
            <div className="ct-field">
              <label>Ghi chú</label>
              <Input.TextArea rows={8} value={form.note} onChange={onChange('note')} placeholder="VD: Xe bị xì lốp" />
            </div>
          </div>
        </div>

        <div className="ct-actions">
          <Button danger onClick={() => window.location.href = '/admin/orders'}>Hủy</Button>
          <Button>Lưu</Button>
          <Button type="primary" style={{ background:'#22c55e' }} loading={loading} onClick={handleCreate}>Tạo phiếu</Button>
        </div>
      </div>
    </AdminLayout>
  )
}


