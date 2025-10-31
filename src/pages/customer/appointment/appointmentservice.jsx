import { useState } from 'react'
import CustomerLayout from '../../../layouts/CustomerLayout'

export default function AppointmentService() {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    phone: '',
    otp: '',
    fullName: '',
    license: '',
    date: '',
    time: '',
    service: '',
    note: ''
  })

  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value })
  const next = () => setStep((s) => Math.min(4, s + 1))
  const back = () => setStep((s) => Math.max(1, s - 1))

  return (
    <CustomerLayout>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 0' }}>
        <img src="/image/mainlogo.png" alt="logo" style={{ height: 64, marginBottom: 8 }} />
        <div style={{ color: '#CBB081', fontWeight: 700, marginBottom: 8 }}>Garage Hoàng Tuấn</div>

        <div style={{ width: 720, maxWidth: '92%', background: '#fff', borderRadius: 12, boxShadow: '0 10px 30px rgba(0,0,0,.08)', padding: 20 }}>
          <div style={{ maxWidth: 560, margin: '0 auto' }}>
            <Stepper step={step} />

            <div style={{ minHeight: 420 }}>
          {step === 1 && (
            <div>
              <div style={{ color: '#CBB081', fontWeight: 600, marginBottom: 10 }}>Bước 1/4: Xác thực số điện thoại</div>
              <div style={{ marginBottom: 10, fontSize: 14 }}>Vui lòng nhập số điện thoại bạn muốn gửi mã OTP !</div>
              <input value={form.phone} onChange={update('phone')} placeholder="VD: 0123456789" style={inputStyle} />
              <div style={rowBtns}>
                <button style={btnGhost} onClick={() => (window.location.href = '/')}>Trang chủ</button>
                <button style={btnPrimary} onClick={next}>Gửi mã OTP</button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <div style={{ color: '#CBB081', fontWeight: 600, marginBottom: 10 }}>Bước 2/4: Xác thực OTP</div>
              <div style={{ marginBottom: 10, fontSize: 14 }}>Vui lòng nhập mã OTP vừa gửi đến số điện thoại !</div>
              <input value={form.otp} onChange={update('otp')} placeholder="VD: 123456" style={inputStyle} />
              <div style={rowBtns}>
                <button style={btnGhost} onClick={back}>Quay lại</button>
                <button style={btnPrimary} onClick={next}>Xác nhận</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <div style={{ color: '#CBB081', fontWeight: 600, marginBottom: 14 }}>Bước 3/4: Đặt lịch sửa chữa</div>
              <div style={grid2}>
                <div>
                  <label style={labelStyle}>Họ và tên *</label>
                  <input value={form.fullName} onChange={update('fullName')} placeholder="VD: Đặng Thị Huyền" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Biển số xe *</label>
                  <input value={form.license} onChange={update('license')} placeholder="VD: 30A-12345" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Số điện thoại *</label>
                  <input value={form.phone} onChange={update('phone')} placeholder="0123456789" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Loại dịch vụ *</label>
                  <select value={form.service} onChange={update('service')} style={inputStyle}>
                    <option value="">--Chọn loại dịch vụ--</option>
                    <option>Sơn</option>
                    <option>Thay thế phụ tùng</option>
                    <option>Bảo dưỡng</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Ngày đặt *</label>
                  <input type="date" value={form.date} onChange={update('date')} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Khung giờ *</label>
                  <select value={form.time} onChange={update('time')} style={inputStyle}>
                    <option value="">--Chọn khung giờ--</option>
                    <option>08:30 - 09:30</option>
                    <option>09:30 - 10:30</option>
                    <option>13:30 - 15:00</option>
                    <option>15:00 - 17:00</option>
                  </select>
                </div>
                <div style={{ gridColumn: '1 / span 2' }}>
                  <label style={labelStyle}>Mô tả chi tiết</label>
                  <textarea value={form.note} onChange={update('note')} placeholder="Nhập mô tả thêm.." style={{ ...inputStyle, height: 96 }} />
                </div>
              </div>
              <div style={rowBtns}>
                <button style={btnGhost} onClick={back}>Quay lại</button>
                <button style={btnPrimary} onClick={next}>Xác nhận</button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#28c76f', margin: '8px auto', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 40 }}>✓</div>
              <div style={{ margin: '12px 0' }}>Chúc mừng bạn đã đặt lịch thành công !</div>
              <button style={{ ...btnPrimary, width: '60%' }} onClick={() => (window.location.href = '/')}>Trang chủ</button>
            </div>
          )}
            </div>
          </div>
        </div>
      </div>
    </CustomerLayout>
  )
}

function Stepper({ step }) {
  const dot = (active) => (
    <div style={{ width: 14, height: 14, borderRadius: 999, border: '2px solid #CBB081', background: active ? '#CBB081' : '#fff' }} />
  )
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '6px 8px 16px' }}>
      {dot(step >= 1)}
      <div style={{ height: 2, background: '#dec7a4', flex: 1 }} />
      {dot(step >= 2)}
      <div style={{ height: 2, background: '#dec7a4', flex: 1 }} />
      {dot(step >= 3)}
      <div style={{ height: 2, background: '#dec7a4', flex: 1 }} />
      {dot(step >= 4)}
    </div>
  )
}

const inputStyle = {
  width: '100%',
  height: 38,
  border: '1px solid #e5e7eb',
  borderRadius: 8,
  padding: '0 12px',
  outline: 'none',
  background: '#f8fafc'
}

const labelStyle = { fontSize: 14, marginBottom: 6, display: 'block' }
const grid2 = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }
const rowBtns = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginTop: 14, width: '100%' }
const btnGhost = { background: '#fff', border: '1px solid #ddd', color: '#111', padding: '10px 18px', borderRadius: 12, cursor: 'pointer' }
const btnPrimary = { background: '#CBB081', border: 'none', color: '#111', padding: '10px 18px', borderRadius: 12, cursor: 'pointer', fontWeight: 600 }


