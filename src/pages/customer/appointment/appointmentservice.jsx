import { useState, useEffect } from 'react'
import { message } from 'antd'
import CustomerLayout from '../../../layouts/CustomerLayout'
import { appointmentAPI, otpAPI, serviceTypeAPI } from '../../../services/api'

export default function AppointmentService() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [otpLoading, setOtpLoading] = useState(false)
  const [verifyOtpLoading, setVerifyOtpLoading] = useState(false)
  const [otpError, setOtpError] = useState('')
  const [serviceTypes, setServiceTypes] = useState([])
  const [serviceTypesLoading, setServiceTypesLoading] = useState(false)
  const [timeSlots, setTimeSlots] = useState([])
  const [timeSlotsLoading, setTimeSlotsLoading] = useState(false)
  const [appointmentResult, setAppointmentResult] = useState(null)
  const [form, setForm] = useState({
    phonePrefix: '+84',
    phoneNumber: '',
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
    fetchServiceTypes()
  }, [])

  const fetchServiceTypes = async () => {
    setServiceTypesLoading(true)
    try {
      const { data, error } = await serviceTypeAPI.getAll()
      if (error) {
        message.error('Không thể tải danh sách loại dịch vụ. Vui lòng thử lại.')
        setServiceTypes([])
        return
      }
      if (data?.result && Array.isArray(data.result)) {
        setServiceTypes(data.result)
      } else {
        setServiceTypes([])
        message.warning('Không tìm thấy loại dịch vụ khả dụng.')
      }
    } catch (err) {
      console.error('Error fetching service types:', err)
      message.error('Đã xảy ra lỗi khi tải loại dịch vụ.')
      setServiceTypes([])
    } finally {
      setServiceTypesLoading(false)
    }
  }

  useEffect(() => {
    if (step === 3 && form.date) {
      fetchTimeSlots()
    } else if (step === 3) {
      setTimeSlots([])
      setForm({ ...form, time: '' })
    }
  }, [form.date, step])

  const fetchTimeSlots = async () => {
    if (!form.date) {
      setTimeSlots([])
      return
    }

    setTimeSlotsLoading(true)
    setTimeSlots([])
    setForm({ ...form, time: '' })

    try {
      const dateStr = form.date
      const { data: response, error } = await appointmentAPI.getTimeSlots(dateStr)
      
      if (error) {
        console.error('Error fetching time slots:', error)
        message.error('Không thể tải danh sách khung giờ. Vui lòng thử lại.')
        setTimeSlots([])
        setTimeSlotsLoading(false)
        return
      }

      if (response && response.result && Array.isArray(response.result)) {
        const availableSlots = response.result
          .map((slot, originalIndex) => ({
            ...slot,
            originalIndex,
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
        if (availableSlots.length === 0) {
          message.info('Không có khung giờ trống cho ngày đã chọn.')
        }
      } else {
        setTimeSlots([])
        message.warning('Không có khung giờ nào cho ngày đã chọn.')
      }
    } catch (err) {
      console.error('Error fetching time slots:', err)
      message.error('Đã xảy ra lỗi khi tải khung giờ. Vui lòng thử lại.')
      setTimeSlots([])
    } finally {
      setTimeSlotsLoading(false)
    }
  }

  const validatePhone = (phoneNumber) => {
    const cleaned = phoneNumber.replace(/\s+/g, '').replace(/[^\d]/g, '')
    if (cleaned.length < 9 || cleaned.length > 10) {
      return false
    }
    return true
  }

  const handleSendOTP = async () => {
    if (!form.phoneNumber) {
      message.warning('Vui lòng nhập số điện thoại')
      return
    }

    const cleanedNumber = form.phoneNumber.replace(/\s+/g, '').replace(/[^\d]/g, '')
    if (!validatePhone(cleanedNumber)) {
      message.error('Số điện thoại không hợp lệ. Vui lòng nhập 9-10 chữ số')
      return
    }

    setOtpLoading(true)
    setOtpError('')
    
    const fullPhone = '84' + cleanedNumber
    
    const { data: response, error } = await otpAPI.send(fullPhone, 'APPOINTMENT')
    setOtpLoading(false)

    if (error) {
      message.error('Gửi mã OTP không thành công. Vui lòng thử lại.')
      return
    }

    if (response && (response.statusCode === 200 || response.result)) {
      setForm({ ...form, phone: fullPhone })
      message.success('Mã OTP đã được gửi đến số điện thoại của bạn!')
      next()
    } else {
      message.error('Gửi mã OTP không thành công. Vui lòng thử lại.')
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

      if (data && (data.result === true || data.result === 'true' || data.statusCode === 200)) {
        message.success('Xác thực OTP thành công!')
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
      message.warning('Vui lòng điền đầy đủ thông tin bắt buộc')
      return
    }

    const selectedSlot = timeSlots.find(slot => slot.value === parseInt(form.time))
    if (!selectedSlot) {
      message.warning('Vui lòng chọn khung giờ hợp lệ')
      return
    }

    setLoading(true)
    
    try {
      const appointmentDate = form.date
      
      const serviceTypeId = parseInt(form.service, 10)
      if (Number.isNaN(serviceTypeId)) {
        message.error('Loại dịch vụ không hợp lệ')
        setLoading(false)
        return
      }

      const timeSlotIndex = selectedSlot?.originalIndex !== undefined 
        ? selectedSlot.originalIndex 
        : parseInt(form.time)

      const payload = {
        appointmentDate: appointmentDate,
        customerName: form.fullName,
        licensePlate: form.license,
        note: form.note || '',
        phoneNumber: form.phone,
        serviceType: [serviceTypeId],
        timeSlotIndex: timeSlotIndex
      }

      const { data: response, error, statusCode } = await appointmentAPI.create(payload)
      
      if (error) {
        let errorMessage = error
        if (error.includes('Query did not return a unique result') || error.includes('unique result')) {
          errorMessage = 'Có nhiều dữ liệu trùng lặp trong hệ thống. Vui lòng liên hệ quản trị viên để được hỗ trợ.'
        }
        message.error(errorMessage || 'Đặt lịch không thành công. Vui lòng thử lại.')
        setLoading(false)
        return
      }

      if (response && (response.statusCode === 200 || response.statusCode === 201 || response.result)) {
        const appointmentData = response.result || response
        setAppointmentResult({
          ...appointmentData,
          customerName: form.fullName,
          customerPhone: appointmentData.customerPhone || form.phone,
          licensePlate: appointmentData.licensePlate || form.license,
          appointmentDate: appointmentData.appointmentDate || form.date,
          serviceType: appointmentData.serviceType || [serviceTypeId]
        })
        setLoading(false)
        next()
      } else {
        message.error('Đặt lịch không thành công. Vui lòng thử lại.')
        setLoading(false)
      }
    } catch (err) {
      message.error('Đã xảy ra lỗi. Vui lòng thử lại.')
      setLoading(false)
    }
  }

  return (
    <CustomerLayout>
      <style>{`
        @media (max-width: 768px) {
          .appointment-grid {
            grid-template-columns: 1fr !important;
          }
          .appointment-container {
            margin: 0 12px !important;
            padding: 16px !important;
          }
          .appointment-buttons {
            flex-direction: column !important;
          }
          .appointment-buttons button {
            width: 100% !important;
          }
        }
        @media (max-width: 640px) {
          .appointment-grid {
            grid-template-columns: 1fr !important;
          }
          .appointment-container {
            margin: 0 8px !important;
            padding: 16px !important;
          }
          .appointment-buttons {
            flex-direction: column !important;
            gap: 8px !important;
          }
          .appointment-buttons button {
            width: 100% !important;
            padding: 12px 16px !important;
            font-size: 14px !important;
          }
        }
        @media (max-width: 480px) {
          .appointment-container {
            margin: 0 4px !important;
            padding: 12px !important;
          }
          .appointment-grid input,
          .appointment-grid select,
          .appointment-grid textarea {
            font-size: 14px !important;
            padding: 8px 10px !important;
          }
        }
      `}</style>
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        padding: 'clamp(20px, 5vw, 40px) clamp(8px, 2vw, 0)',
        minHeight: '100vh',
        marginTop: '20px'
      }}>
        <div style={{ color: '#CBB081', fontWeight: 700, marginBottom: 8, fontSize: 'clamp(18px, 4vw, 24px)' }}>Đặt dịch vụ của chúng tôi!</div>

        <div className="appointment-container" style={{ 
          width: '100%', 
          maxWidth: 720, 
          background: '#fff', 
          borderRadius: 12, 
          boxShadow: '0 10px 30px rgba(0,0,0,.08)', 
          padding: '20px',
          margin: '0 16px'
        }}>
          <div style={{ maxWidth: 560, margin: '0 auto', width: '100%' }}>
            <Stepper step={step} />

            <div style={{ minHeight: 420 }}>
          {step === 1 && (
            <div>
              <div style={{ color: '#CBB081', fontWeight: 600, marginBottom: 10 }}>Bước 1/4: Xác thực số điện thoại</div>
              <div style={{ marginBottom: 10, fontSize: 14 }}>Vui lòng nhập số điện thoại bạn muốn gửi mã OTP !</div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <input 
                  value={form.phonePrefix} 
                  disabled
                  style={{ ...inputStyle, width: '80px', background: '#f3f4f6', cursor: 'not-allowed', color: '#6b7280', flexShrink: 0 }} 
                />
                <input 
                  value={form.phoneNumber} 
                  onChange={(e) => {
                    let value = e.target.value.replace(/\D/g, '')
                    if (value.startsWith('0')) {
                      value = value.slice(1)
                    }
                    value = value.slice(0, 10)
                    setForm({ ...form, phoneNumber: value })
                  }}
                  placeholder="VD: 909123456" 
                  style={{ ...inputStyle, flex: 1 }} 
                />
              </div>
              <div className="appointment-buttons" style={rowBtns}>
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
              <div className="appointment-buttons" style={rowBtns}>
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
              <div style={{ color: '#CBB081', fontWeight: 600, marginBottom: 14, fontSize: 'clamp(14px, 3vw, 16px)' }}>Bước 3/4: Đặt lịch sửa chữa</div>
              <div className="appointment-grid" style={grid2}>
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
                    value={form.phone ? `+${form.phone.substring(0, 2)} ${form.phone.substring(2)}` : ''} 
                    disabled
                    placeholder="+84 909123456" 
                    style={{ ...inputStyle, background: '#f3f4f6', cursor: 'not-allowed', color: '#6b7280' }} 
                  />
                </div>
                <div>
                  <label style={labelStyle}>Loại dịch vụ *</label>
                  <select
                    value={form.service}
                    onChange={update('service')}
                    disabled={serviceTypesLoading || serviceTypes.length === 0}
                    style={{
                      ...inputStyle,
                      ...(serviceTypesLoading ? { opacity: 0.6, cursor: 'not-allowed' } : {})
                    }}
                  >
                    <option value="">
                      {serviceTypesLoading ? 'Đang tải loại dịch vụ...' : '--Chọn loại dịch vụ--'}
                    </option>
                    {serviceTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Ngày đặt *</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={update('date')}
                    style={inputStyle}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Khung giờ *</label>
                  <select 
                    value={form.time} 
                    onChange={update('time')} 
                    disabled={timeSlotsLoading || !form.date}
                    style={{ ...inputStyle, ...(timeSlotsLoading ? { opacity: 0.6, cursor: 'not-allowed' } : {}) }}
                  >
                    <option value="">
                      {timeSlotsLoading ? 'Đang tải khung giờ...' : '--Chọn khung giờ--'}
                    </option>
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
              <div className="appointment-buttons" style={rowBtns}>
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
              <div style={{ margin: '12px 0', fontSize: 18, fontWeight: 600 }}>Chúc mừng bạn đã đặt lịch thành công!</div>
              
              {appointmentResult && (
                <div style={{ background: '#f8fafc', borderRadius: 12, padding: 20, margin: '20px 0', textAlign: 'left' }}>
                  <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: '#CBB081', textAlign: 'center' }}>Thông tin đặt lịch</div>
                  <div style={infoRow}>
                    <div style={infoLabel}>Họ và tên:</div>
                    <div style={infoValue}>{appointmentResult.customerName || form.fullName || 'N/A'}</div>
                  </div>
                  <div style={infoRow}>
                    <div style={infoLabel}>Số điện thoại:</div>
                    <div style={infoValue}>
                      {appointmentResult.customerPhone 
                        ? `+${appointmentResult.customerPhone.substring(0, 2)} ${appointmentResult.customerPhone.substring(2)}`
                        : form.phone 
                        ? `+${form.phone.substring(0, 2)} ${form.phone.substring(2)}`
                        : 'N/A'}
                    </div>
                  </div>
                  <div style={infoRow}>
                    <div style={infoLabel}>Biển số xe:</div>
                    <div style={infoValue}>{appointmentResult.licensePlate || form.license || 'N/A'}</div>
                  </div>
                  <div style={infoRow}>
                    <div style={infoLabel}>Ngày đặt:</div>
                    <div style={infoValue}>
                      {appointmentResult.appointmentDate 
                        ? new Date(appointmentResult.appointmentDate + 'T00:00:00').toLocaleDateString('vi-VN')
                        : form.date 
                        ? new Date(form.date + 'T00:00:00').toLocaleDateString('vi-VN')
                        : 'N/A'}
                    </div>
                  </div>
                  <div style={infoRow}>
                    <div style={infoLabel}>Khung giờ:</div>
                    <div style={infoValue}>{appointmentResult.timeSlotLabel || 'N/A'}</div>
                  </div>
                  <div style={infoRow}>
                    <div style={infoLabel}>Loại dịch vụ:</div>
                    <div style={infoValue}>
                      {(() => {
                        const ids =
                          appointmentResult.serviceType && appointmentResult.serviceType.length > 0
                            ? appointmentResult.serviceType
                            : form.service
                              ? [parseInt(form.service, 10)]
                              : []
                        if (ids.length === 0) return 'N/A'
                        const names = ids
                          .map((id) => serviceTypes.find((type) => type.id === id)?.name || id)
                          .join(', ')
                        return names || 'N/A'
                      })()}
                    </div>
                  </div>
                  {appointmentResult.note && (
                    <div style={infoRow}>
                      <div style={infoLabel}>Ghi chú:</div>
                      <div style={infoValue}>{appointmentResult.note}</div>
                    </div>
                  )}
                  <div style={infoRow}>
                    <div style={infoLabel}>Mã đặt lịch:</div>
                    <div style={infoValue}>#{appointmentResult.appointmentId || 'N/A'}</div>
                  </div>
                </div>
              )}
              
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
const grid2 = { 
  display: 'grid', 
  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
  gap: 12 
}
const rowBtns = { 
  display: 'flex', 
  justifyContent: 'space-between', 
  alignItems: 'center', 
  gap: 12, 
  marginTop: 14, 
  width: '100%',
  flexWrap: 'wrap'
}
const btnGhost = { background: '#fff', border: '1px solid #ddd', color: '#111', padding: '10px 18px', borderRadius: 12, cursor: 'pointer' }
const btnPrimary = { background: '#CBB081', border: 'none', color: '#111', padding: '10px 18px', borderRadius: 12, cursor: 'pointer', fontWeight: 600 }
const infoRow = { display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e5e7eb' }
const infoLabel = { fontWeight: 600, color: '#6b7280', fontSize: 14 }
const infoValue = { fontWeight: 500, color: '#111', fontSize: 14, textAlign: 'right', flex: 1, marginLeft: 16 }


