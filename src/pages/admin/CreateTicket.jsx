import AdminLayout from '../../layouts/AdminLayout'
import '/src/styles/pages/admin/createticket.css'
import { DatePicker, Select, Input, InputNumber, Button, Tag } from 'antd'
import { useState } from 'react'

const TECHS = [
  'HTK Ly', 'DT Huyền', 'Nguyễn Văn B', 'Phạm Đức Đạt'
]

const SERVICES = ['Thay thế phụ tùng', 'Sơn', 'Bảo dưỡng']

export default function CreateTicket() {
  const [form, setForm] = useState({
    phone: '', name: '', address: '',
    plate: '', brand: '', model: '', version: '', vin: '',
    techs: ['HTK Ly', 'DT Huyền'], service: ['Thay thế phụ tùng'],
    receiveDate: null, note: ''
  })

  const onChange = (k) => (e) => setForm({ ...form, [k]: e?.target ? e.target.value : e })

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
                options={TECHS.map(t=>({ value:t, label:t }))}
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
                options={SERVICES.map(s=>({ value:s, label:s }))}
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
          <Button danger>Hủy</Button>
          <Button>Lưu</Button>
          <Button type="primary" style={{ background:'#22c55e' }}>Tạo phiếu</Button>
        </div>
      </div>
    </AdminLayout>
  )
}


