import { useState, useEffect } from 'react'
import CustomerLayout from '../../../layouts/CustomerLayout'
import { appointmentAPI, otpAPI } from '../../../services/api'

const SERVICE_TYPE_MAP = {
  'Sơn': 1,
  'Thay thế phụ tùng': 2,
  'Bảo dưỡng': 3
}

export default function AppointmentService() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [otpLoading, setOtpLoading] = useState(false)
  const [verifyOtpLoading, setVerifyOtpLoading] = useState(false)
  const [otpError, setOtpError] = useState('')
  const [timeSlots, setTimeSlots] = useState([])
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

  useEffect(() => {
    if (step === 3 && form.date) {
      fetchTimeSlots()
    } else if (step === 3) {
      // Reset time slots when date is cleared
      setTimeSlots([])
      setForm({ ...form, time: '' })
    }
  }, [form.date, step])

  const fetchTimeSlots = async () => {
    if (!form.date) {
      setTimeSlots([])
      return
    }

    try {
      // Format date as YYYY-MM-DD for API
      const dateStr = form.date
      const { data: response, error } = await appointmentAPI.getTimeSlots(dateStr)
      
      if (error) {
        console.error('Error fetching time slots:', error)
        setTimeSlots([])
        return
      }

      if (response && response.result && Array.isArray(response.result)) {
        // Filter available slots and map to select options
        // Keep original index from API response for timeSlotIndex
        const availableSlots = response.result
          .map((slot, originalIndex) => ({
            ...slot,
            originalIndex, // Keep original index from API response
            displayLabel: slot.label || `${slot.startTime} - ${slot.endTime}`
          }))
          .filter(slot => slot.available && slot.booked < slot.maxCapacity)
          .map((slot) => ({
            value: slot.originalIndex,
            label: slot.displayLabel,
            id: slot.timeSlotId,
            originalIndex: slot.originalIndex
          }))
        
        setTimeSlots(availableSlots)
      } else {
        setTimeSlots([])
      }
    } catch (err) {
      console.error('Error fetching time slots:', err)
      setTimeSlots([])
    }
  }

  const validatePhone = (phoneNumber) => {
    const cleaned = phoneNumber.replace(/\s+/g, '').replace(/[^\d]/g, '')
    if (cleaned.length < 10 || cleaned.length > 11) {
      return false
    }
    if (!cleaned.startsWith('0')) {
      return false
    }
    return true
  }

  const handleSendOTP = async () => {
    if (!form.phone) {
      alert('Vui lòng nhập số điện thoại')
      return
    }

    // Validate phone number format
    if (!validatePhone(form.phone)) {
      alert('Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại Việt Nam (10-11 chữ số, bắt đầu bằng 0)')
      return
    }

    setOtpLoading(true)
    setOtpError('')
    
    // Clean phone number before sending
    const cleanedPhone = form.phone.replace(/\s+/g, '').replace(/[^\d]/g, '')
    
    const { data: response, error } = await otpAPI.send(cleanedPhone, 'APPOINTMENT')
    setOtpLoading(false)

    if (error) {
      alert('Gửi mã OTP không thành công. Vui lòng thử lại.')
      return
    }

    if (response && (response.statusCode === 200 || response.result)) {
      // Update form with cleaned phone
      setForm({ ...form, phone: cleanedPhone })
      alert('Mã OTP đã được gửi đến số điện thoại của bạn!')
      next()
    } else {
      alert('Gửi mã OTP không thành công. Vui lòng thử lại.')
    }
  }

  const handleVerifyOTP = async () => {
    if (!form.otp) {
      setOtpError('Vui lòng nhập mã OTP')
      return
    }

    if (form.otp.length !== 6) {
      setOtpError('Mã OTP phải có 6 chữ số')
      return
    }

    setVerifyOtpLoading(true)
    setOtpError('')

    try {
      const { data, error: apiError } = await otpAPI.verify(form.phone, form.otp, 'APPOINTMENT')
      
      if (apiError) {
        setOtpError(apiError || 'Mã OTP không đúng hoặc đã hết hạn.')
        setVerifyOtpLoading(false)
        return
      }

      // Check if OTP is valid (result should be true)
      if (data && (data.result === true || data.result === 'true' || data.statusCode === 200)) {
        // OTP verified successfully, proceed to next step
        next()
      } else {
        setOtpError('Mã OTP không đúng hoặc đã hết hạn.')
        setVerifyOtpLoading(false)
      }
    } catch (err) {
      setOtpError(err.message || 'Đã xảy ra lỗi. Vui lòng thử lại.')
      setVerifyOtpLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!form.fullName || !form.license || !form.phone || !form.date || !form.time || !form.service) {
      alert('Vui lòng điền đầy đủ thông tin bắt buộc')
      return
    }

    // Validate that a time slot is selected
    const selectedSlot = timeSlots.find(slot => slot.value === parseInt(form.time))
    if (!selectedSlot) {
      alert('Vui lòng chọn khung giờ hợp lệ')
      return
    }

    setLoading(true)
    
    try {
      // Format date as YYYY-MM-DD
      const appointmentDate = form.date
      
      // Get service type ID
      const serviceTypeId = SERVICE_TYPE_MAP[form.service]
      if (!serviceTypeId) {
        alert('Loại dịch vụ không hợp lệ')
        setLoading(false)
        return
      }

      const payload = {
        customerName: form.fullName,
        phoneNumber: form.phone,
        licensePlate: form.license,
        appointmentDate: appointmentDate,
        timeSlotIndex: parseInt(form.time), // Index in the filtered available slots array
        serviceType: [serviceTypeId], // API expects array
        note: form.note || ''
      }

      const { data: response, error } = await appointmentAPI.create(payload)
      
      if (error) {
        alert(error || 'Đặt lịch không thành công. Vui lòng thử lại.')
        setLoading(false)
        return
      }

      // Check if appointment was created successfully
      if (response && (response.statusCode === 200 || response.statusCode === 201 || response.result)) {
        next()
      } else {
        alert('Đặt lịch không thành công. Vui lòng thử lại.')
        setLoading(false)
      }
    } catch (err) {
      alert('Đã xảy ra lỗi. Vui lòng thử lại.')
      setLoading(false)
    }
  }

  return (
    <CustomerLayout>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 0' }}>
        <div style={{ color: '#CBB081', fontWeight: 700, marginBottom: 8 }}>Đặt dịch vụ của chúng tôi!</div>

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
                <button style={btnPrimary} onClick={handleSendOTP} disabled={otpLoading}>
                  {otpLoading ? 'Đang gửi...' : 'Gửi mã OTP'}
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <div style={{ color: '#CBB081', fontWeight: 600, marginBottom: 10 }}>Bước 2/4: Xác thực OTP</div>
              <div style={{ marginBottom: 10, fontSize: 14 }}>Vui lòng nhập mã OTP vừa gửi đến số điện thoại !</div>
              <input 
                value={form.otp} 
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6)
                  setForm({ ...form, otp: value })
                  setOtpError('')
                }}
                placeholder="VD: 123456" 
                style={inputStyle}
                maxLength={6}
              />
              {otpError && (
                <div style={{ color: '#ef4444', fontSize: 14, marginTop: 8, marginBottom: 8 }}>
                  {otpError}
                </div>
              )}
              <div style={rowBtns}>
                <button style={btnGhost} onClick={back}>Quay lại</button>
                <button 
                  style={btnPrimary} 
                  onClick={handleVerifyOTP} 
                  disabled={verifyOtpLoading}
                >
                  {verifyOtpLoading ? 'Đang xác thực...' : 'Xác nhận'}
                </button>
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
                  <input 
                    value={form.phone} 
                    disabled
                    placeholder="0123456789" 
                    style={{ ...inputStyle, background: '#f3f4f6', cursor: 'not-allowed', color: '#6b7280' }} 
                  />
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
                    {timeSlots.map(slot => (
                      <option key={slot.value} value={slot.value}>{slot.label}</option>
                    ))}
                  </select>
                </div>
                <div style={{ gridColumn: '1 / span 2' }}>
                  <label style={labelStyle}>Mô tả chi tiết</label>
                  <textarea value={form.note} onChange={update('note')} placeholder="Nhập mô tả thêm.." style={{ ...inputStyle, height: 96 }} />
                </div>
              </div>
              <div style={rowBtns}>
                <button style={btnGhost} onClick={back}>Quay lại</button>
                <button style={btnPrimary} onClick={handleSubmit} disabled={loading}>
                  {loading ? 'Đang xử lý...' : 'Xác nhận'}
                </button>
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


