import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { message } from 'antd'
import CustomerLayout from '../../../layouts/CustomerLayout'
import { appointmentAPI, customersAPI, otpAPI, serviceTypeAPI } from '../../../services/api';
import Lottie from "lottie-react";
import successAnim from "../../../assets/animations/Success.json";

export default function AppointmentService() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [otpLoading, setOtpLoading] = useState(false)
  const [verifyOtpLoading, setVerifyOtpLoading] = useState(false)
  const [otpError, setOtpError] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [licenseError, setLicenseError] = useState('')
  const [fullNameError, setFullNameError] = useState('')
  const [serviceTypes, setServiceTypes] = useState([])
  const [serviceTypesLoading, setServiceTypesLoading] = useState(false)
  const [timeSlots, setTimeSlots] = useState([])
  const [timeSlotsLoading, setTimeSlotsLoading] = useState(false)
  const [appointmentResult, setAppointmentResult] = useState(null)
  const [customerLookup, setCustomerLookup] = useState(null)
  const [showCustomerModal, setShowCustomerModal] = useState(false)
  const [customerLookupLoading, setCustomerLookupLoading] = useState(false)
  const [showLicenseDropdown, setShowLicenseDropdown] = useState(false)
  const navigate = useNavigate()
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
            originalIndex: slot.originalIndex,
            startTime: slot.startTime,
            endTime: slot.endTime
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

  /**
   * Validate và normalize số điện thoại theo chuẩn Việt Nam
   * @param {string} phoneNumber - Số điện thoại cần validate
   * @returns {Object} { valid: boolean, normalizedPhone: string | null, errorMessage: string | null }
   */
  const validateAndNormalizePhone = (phoneNumber) => {
    if (!phoneNumber || typeof phoneNumber !== 'string') {
      return {
        valid: false,
        normalizedPhone: null,
        errorMessage: 'Vui lòng nhập số điện thoại hợp lệ (9–10 chữ số).'
      }
    }
    
    // 1. Lọc bỏ tất cả ký tự không phải số (0-9)
    // Bao gồm: khoảng trắng, dấu gạch ngang, dấu ngoặc, dấu +
    let cleaned = phoneNumber.replace(/[\s\-()]/g, '')
    
    // Xử lý dấu + ở đầu
    if (cleaned.startsWith('+')) {
      cleaned = cleaned.substring(1)
    }
    
    // Chỉ giữ lại số (0-9)
    cleaned = cleaned.replace(/\D/g, '')
    
    // 2. Kiểm tra độ dài sau khi lọc
    if (cleaned.length === 0) {
      return {
        valid: false,
        normalizedPhone: null,
        errorMessage: 'Vui lòng nhập số điện thoại hợp lệ (9–10 chữ số).'
      }
    }
    
    // 3. Kiểm tra bắt đầu bằng 0 hoặc 84
    if (!cleaned.startsWith('0') && !cleaned.startsWith('84')) {
      return {
        valid: false,
        normalizedPhone: null,
        errorMessage: 'Chỉ chấp nhận 0xxxxxxxxx hoặc 84xxxxxxxxx.'
      }
    }
    
    // 4. Normalize số điện thoại
    let normalized = cleaned
    if (normalized.startsWith('0')) {
      // 0xxxxxxxxx → 84xxxxxxxxx
      normalized = '84' + normalized.substring(1)
    }
    // 84xxxxxxxxx → giữ nguyên
    
    // 5. Kiểm tra số sau 84 phải có đúng 9 chữ số
    const numberAfter84 = normalized.substring(2)
    if (numberAfter84.length < 9) {
      return {
        valid: false,
        normalizedPhone: null,
        errorMessage: 'Vui lòng nhập số điện thoại hợp lệ (9–10 chữ số).'
      }
    }
    
    // 6. Kiểm tra độ dài sau normalize
    // Sau normalize phải có độ dài 11 (84 + 9 số)
    if (normalized.length !== 11) {
      return {
        valid: false,
        normalizedPhone: null,
        errorMessage: 'Vui lòng nhập số điện thoại hợp lệ (9–10 chữ số).'
      }
    }
    
    return {
      valid: true,
      normalizedPhone: normalized,
      errorMessage: null
    }
  }

  const formatLicensePlate = (value) => {
    if (!value) return ''
    
    // Loại bỏ tất cả ký tự không phải số và chữ cái, chuyển chữ cái thành chữ hoa
    let cleaned = value.replace(/[^0-9A-Za-z]/g, '').toUpperCase()
    
    // Format: 2 số đầu + 1 chữ cái + 6 số cuối = 29A-123456
    // Tổng: 2 số + 1 chữ + 6 số = 9 ký tự (không tính dấu)
    
    if (cleaned.length === 0) return ''
    
    // Lấy 2 số đầu (ký hiệu địa phương)
    const prefix = cleaned.slice(0, 2).replace(/[^0-9]/g, '')
    if (prefix.length < 2) return cleaned
    
    let remaining = cleaned.slice(2)
    
    // Tìm chữ cái seri (chữ cái đầu tiên)
    const letterMatch = remaining.match(/^([A-Z])/)
    if (!letterMatch) {
      // Nếu chưa có chữ cái, trả về phần đã có
      return prefix + remaining.slice(0, 7)
    }
    
    const letter = letterMatch[1]
    remaining = remaining.slice(1)
    
    // Lấy 6 chữ số cuối
    const numbers = remaining.replace(/[^0-9]/g, '').slice(0, 6)
    
    if (numbers.length === 0) {
      return `${prefix}${letter}`
    } else {
      return `${prefix}${letter}-${numbers}`
    }
  }

  const validateLicensePlate = (value) => {
    if (!value) {
      return {
        isValid: false,
        errorMessage: 'Biển số xe không được để trống'
      }
    }

    // Trim và chuyển thành chữ hoa
    const trimmed = value.trim().toUpperCase()
    
    if (trimmed.length === 0) {
      return {
        isValid: false,
        errorMessage: 'Biển số xe không được để trống'
      }
    }

    // Regex: ^[0-9]{2}[A-Z]-[0-9]{3,6}(\\.[0-9]{2})?$
    // Format: TT X - YYYYYY hoặc TT X - YYYY.YY
    const regex = /^[0-9]{2}[A-Z]-[0-9]{3,6}(\.[0-9]{2})?$/
    
    if (!regex.test(trimmed)) {
      return {
        isValid: false,
        errorMessage: 'Biển số xe không hợp lệ. Định dạng đúng: 29A-123456 hoặc 29A-1234.56 (2 số - 1 chữ cái - dấu gạch ngang - 3-6 số, có thể có dấu chấm và 2 số cuối)'
      }
    }

    return {
      isValid: true,
      errorMessage: ''
    }
  }

  const formatVisitDate = (value) => {
    if (!value) return 'Chưa rõ'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return date.toLocaleDateString('vi-VN')
  }

  const handleConfirmCustomer = () => {
    // Tự động điền tên/biển số nếu còn trống
    setForm((prev) => ({
      ...prev,
      fullName: prev.fullName || customerLookup?.fullName || '',
      license: prev.license || formatLicensePlate(customerLookup?.vehicles?.[0]?.licensePlate || '')
    }))
    setShowCustomerModal(false)
    next()
  }

  const handleRejectCustomer = async () => {
    // Thông báo backend tách khách hàng cũ / tạo mới với số điện thoại đang dùng
    if (form.phone) {
      try {
        await customersAPI.notMe(form.phone)
      } catch (err) {
        console.error('Gọi API not-me thất bại:', err)
      }
    }
    // Tiếp tục cho khách tự nhập thông tin đặt lịch
    setShowCustomerModal(false)
    setCustomerLookup(null)
    setForm((prev) => ({
      ...prev,
      fullName: '',
      license: ''
    }))
    // Đi tới bước đặt lịch
    setStep(3)
  }

  const isSlotPast = (dateStr, slot) => {
    if (!dateStr || !slot) return false
    const todayStr = new Date().toISOString().split('T')[0]
    if (dateStr !== todayStr) return false

    const toMinutes = (timeStr) => {
      const [h, m] = (timeStr || '').split(':').map(Number)
      if (Number.isNaN(h) || Number.isNaN(m)) return null
      return h * 60 + m
    }

    // So sánh với endTime nếu có, fallback startTime
    const slotMinutes =
      toMinutes(slot.endTime) ??
      toMinutes(slot.startTime)

    if (slotMinutes == null) return false

    const now = new Date()
    const nowMinutes = now.getHours() * 60 + now.getMinutes()
    return nowMinutes >= slotMinutes
  }

  const formatFullName = (value) => {
    // Trim và convert 2 khoảng trắng liên tiếp thành 1
    let formatted = value.trim()
    formatted = formatted.replace(/\s+/g, ' ')
    return formatted
  }

  const validateFullName = (value) => {
    if (!value) {
      return {
        isValid: false,
        errorMessage: 'Họ tên không được để trống'
      }
    }

    // Trim và format
    const trimmed = formatFullName(value)
    
    if (trimmed.length === 0) {
      return {
        isValid: false,
        errorMessage: 'Họ tên không được để trống'
      }
    }

    // Kiểm tra độ dài
    if (trimmed.length < 2 || trimmed.length > 100) {
      return {
        isValid: false,
        errorMessage: 'Họ tên phải từ 2–100 ký tự và không chứa số hoặc ký tự đặc biệt.'
      }
    }

    // Chỉ cho phép chữ cái (có dấu) và khoảng trắng
    // Regex: chỉ chữ cái tiếng Việt (có dấu) và khoảng trắng
    const regex = /^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂưăạảấầẩẫậắằẳẵặẹẻẽềềểỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵỷỹ\s]+$/
    
    if (!regex.test(trimmed)) {
      return {
        isValid: false,
        errorMessage: 'Họ tên phải từ 2–100 ký tự và không chứa số hoặc ký tự đặc biệt.'
      }
    }

    return {
      isValid: true,
      errorMessage: ''
    }
  }

  const handleSendOTP = async () => {
    if (!form.phoneNumber) {
      setPhoneError('Vui lòng nhập số điện thoại hợp lệ (9–10 chữ số).')
      message.warning('Vui lòng nhập số điện thoại')
      return
    }

    // Validate và normalize số điện thoại
    const validation = validateAndNormalizePhone(form.phoneNumber)
    
    if (!validation.valid) {
      setPhoneError(validation.errorMessage || 'Vui lòng nhập số điện thoại hợp lệ (9–10 chữ số).')
      message.error(validation.errorMessage || 'Vui lòng nhập số điện thoại hợp lệ (9–10 chữ số).')
      return
    }

    setOtpLoading(true)
    setOtpError('')
    setPhoneError('')
    
    const normalizedPhone = validation.normalizedPhone
    
    const { data: response, error } = await otpAPI.send(normalizedPhone, 'APPOINTMENT')
    setOtpLoading(false)

    if (error) {
      message.error('Gửi mã OTP không thành công. Vui lòng thử lại.')
      return
    }

    if (response && (response.statusCode === 200 || response.result)) {
      setForm({ ...form, phone: normalizedPhone })
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
        // Sau khi xác thực OTP, kiểm tra thông tin khách hàng
        await fetchCustomerLookupAfterOtp()
        setVerifyOtpLoading(false)
      } else {
        setOtpError('Mã OTP không đúng hoặc đã hết hạn.')
        setVerifyOtpLoading(false)
      }
    } catch (err) {
      setOtpError(err.message || 'Đã xảy ra lỗi. Vui lòng thử lại.')
      setVerifyOtpLoading(false)
    }
  }

  const fetchCustomerLookupAfterOtp = async () => {
    if (!form.phone) {
      setCustomerLookup(null)
      return
    }
    setCustomerLookupLoading(true)
    try {
      const { data, error } = await customersAPI.checkCustomer(form.phone)
      if (error) {
        throw new Error(error)
      }
      const payload = data?.result || data?.data || data
      
      // Nếu customerId là null, không hiển thị popup và di chuyển đến step 3
      if (!payload?.customerId || payload?.customerId === null || payload?.customerId === 0) {
        setCustomerLookup(null)
        setShowCustomerModal(false)
        setCustomerLookupLoading(false)
        next() // Di chuyển đến step 3 (thông tin đặt lịch)
        return
      }
      
      // Nếu có customerId, hiển thị popup
      const vehiclesRaw = payload?.vehicles || []
      const vehicles = Array.isArray(vehiclesRaw)
        ? vehiclesRaw.map((item, idx) => ({
            id: item.vehicleId || item.id || idx,
            licensePlate: item.licensePlate || item.plate || '',
            model: item.vehicleModelName || item.modelName || item.brandName || item.model || '',
            lastVisit: '' // API check không có history
          }))
        : []

      setCustomerLookup({
        fullName: payload?.fullName || payload?.customerName || payload?.name || '',
        phone: payload?.phone || form.phone || '',
        vehicles
      })
      setShowCustomerModal(true)
    } catch (err) {
      console.error('Không thể lấy thông tin khách hàng sau OTP:', err)
      setCustomerLookup(null)
    } finally {
      setCustomerLookupLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!form.fullName || !form.license || !form.phone || !form.date || !form.time || !form.service) {
      message.warning('Vui lòng điền đầy đủ thông tin bắt buộc')
      return
    }

    // Format và validate họ tên
    const formattedFullName = formatFullName(form.fullName)
    const fullNameValidation = validateFullName(formattedFullName)
    if (!fullNameValidation.isValid) {
      setFullNameError(fullNameValidation.errorMessage)
      message.error(fullNameValidation.errorMessage)
      return
    }
    setFullNameError('')
    // Cập nhật form với tên đã được format
    setForm({ ...form, fullName: formattedFullName })

    // Validate biển số xe
    const licenseValidation = validateLicensePlate(form.license)
    if (!licenseValidation.isValid) {
      setLicenseError(licenseValidation.errorMessage)
      message.error(licenseValidation.errorMessage)
      return
    }
    setLicenseError('')

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
        ? selectedSlot.originalIndex + 1
        : parseInt(form.time) + 1

      const payload = {
        appointmentDate: appointmentDate,
        customerName: formattedFullName,
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
                    // Tự động lọc bỏ ký tự không phải số khi nhập
                    let value = e.target.value.replace(/\D/g, '')
                    // Giới hạn độ dài tối đa 11 số (để cho phép nhập 0xxxxxxxxx hoặc 84xxxxxxxxx)
                    value = value.slice(0, 11)
                    setForm({ ...form, phoneNumber: value })
                    setPhoneError('')
                  }}
                  onPaste={(e) => {
                    // Xử lý khi paste: tự động lọc và normalize
                    e.preventDefault()
                    const pastedText = e.clipboardData.getData('text')
                    // Lọc bỏ tất cả ký tự không phải số
                    let cleaned = pastedText.replace(/[\s\-()]/g, '').replace(/[^\d+]/g, '')
                    if (cleaned.startsWith('+')) {
                      cleaned = cleaned.substring(1)
                    }
                    cleaned = cleaned.replace(/\D/g, '')
                    // Giới hạn độ dài
                    cleaned = cleaned.slice(0, 11)
                    setForm({ ...form, phoneNumber: cleaned })
                    setPhoneError('')
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleSendOTP()
                    }
                  }}
                  placeholder="VD: 0909123456" 
                  style={{ 
                    ...inputStyle, 
                    flex: 1,
                    ...(phoneError ? { borderColor: '#ef4444' } : {})
                  }} 
                />
              </div>
              <div className="appointment-buttons" style={rowBtns}>
                <button style={btnGhost} onClick={() => navigate('/')}>Trang chủ</button>
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
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleVerifyOTP()
                  }
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
                  <label style={labelStyle}>Họ và tên <span style={{ color: '#ef4444' }}>*</span></label>
                  <input 
                    value={form.fullName} 
                    onChange={(e) => {
                      let value = e.target.value
                      // Format: convert 2 khoảng trắng liên tiếp thành 1
                      value = value.replace(/\s+/g, ' ')
                      setForm({ ...form, fullName: value })
                      setFullNameError('')
                    }}
                    onBlur={(e) => {
                      // Trim và validate khi blur
                      const formatted = formatFullName(e.target.value)
                      const validation = validateFullName(formatted)
                      if (!validation.isValid) {
                        setFullNameError(validation.errorMessage)
                      } else {
                        setForm({ ...form, fullName: formatted })
                        setFullNameError('')
                      }
                    }}
                    placeholder="VD: Đặng Thị Huyền" 
                    style={{ 
                      ...inputStyle, 
                      ...(fullNameError ? { borderColor: '#ef4444' } : {})
                    }} 
                  />
                  {fullNameError && (
                    <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>
                      {fullNameError}
                    </div>
                  )}
                </div>
                <div style={{ position: 'relative' }}>
                  <label style={labelStyle}>Biển số xe <span style={{ color: '#ef4444' }}>*</span></label>
                  <input 
                    value={form.license} 
                    onChange={(e) => {
                      const formatted = formatLicensePlate(e.target.value)
                      setForm({ ...form, license: formatted })
                      setLicenseError('')
                    }}
                    onFocus={() => setShowLicenseDropdown(true)}
                    onBlur={() => setTimeout(() => setShowLicenseDropdown(false), 100)}
                    placeholder="VD: 29A-123456" 
                    style={{ 
                      ...inputStyle, 
                      ...(licenseError ? { borderColor: '#ef4444' } : {}),
                      paddingRight: customerLookup?.vehicles?.length ? 36 : 12,
                      cursor: 'text'
                    }} 
                    maxLength={12}
                  />
                  {customerLookup?.vehicles?.length ? (
                    <button
                      type="button"
                      onClick={() => setShowLicenseDropdown((v) => !v)}
                      style={{
                        position: 'absolute',
                        top: 34,
                        right: 8,
                        width: 24,
                        height: 24,
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#6b7280'
                      }}
                      aria-label="Chọn biển số có sẵn"
                    >
                      ▾
                    </button>
                  ) : null}
                  {customerLookup?.vehicles?.length && showLicenseDropdown ? (
                    <div
                      style={{
                        position: 'absolute',
                        zIndex: 10,
                        top: 64,
                        left: 0,
                        right: 0,
                        background: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: 10,
                        boxShadow: '0 12px 30px rgba(0,0,0,0.12)',
                        maxHeight: 220,
                        overflowY: 'auto'
                      }}
                    >
                      {customerLookup.vehicles.map((v) => (
                        <button
                          key={v.id || v.licensePlate}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            const formatted = formatLicensePlate(v.licensePlate || '')
                            setForm({ ...form, license: formatted })
                            setLicenseError('')
                            setShowLicenseDropdown(false)
                          }}
                          style={{
                            width: '100%',
                            textAlign: 'left',
                            padding: '10px 12px',
                            border: 'none',
                            background: '#fff',
                            cursor: 'pointer',
                            borderBottom: '1px solid #f1f5f9'
                          }}
                        >
                          <div style={{ fontWeight: 700, color: '#111', fontSize: 14 }}>{v.licensePlate || ''}</div>
                          {v.model ? (
                            <div style={{ color: '#6b7280', fontSize: 12, marginTop: 2 }}>{v.model}</div>
                          ) : null}
                        </button>
                      ))}
                    </div>
                  ) : null}
                  {licenseError && (
                    <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>
                      {licenseError}
                    </div>
                  )}
                </div>
                <div>
                  <label style={labelStyle}>Số điện thoại <span style={{ color: '#ef4444' }}>*</span></label>
                  <input 
                    value={form.phone ? `+${form.phone.substring(0, 2)} ${form.phone.substring(2)}` : ''} 
                    disabled
                    placeholder="+84 909123456" 
                    style={{ ...inputStyle, background: '#f3f4f6', cursor: 'not-allowed', color: '#6b7280' }} 
                  />
                </div>
                <div>
                  <label style={labelStyle}>Loại dịch vụ <span style={{ color: '#ef4444' }}>*</span></label>
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
                  <label style={labelStyle}>Ngày đặt <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={update('date')}
                    style={inputStyle}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Khung giờ <span style={{ color: '#ef4444' }}>*</span></label>
                  <select 
                    value={form.time} 
                    onChange={update('time')} 
                    disabled={timeSlotsLoading || !form.date}
                    style={{ ...inputStyle, ...(timeSlotsLoading ? { opacity: 0.6, cursor: 'not-allowed' } : {}) }}
                  >
                    <option value="">
                      {timeSlotsLoading ? 'Đang tải khung giờ...' : '--Chọn khung giờ--'}
                    </option>
                    {timeSlots.map(slot => {
                      const past = isSlotPast(form.date, slot)
                      return (
                        <option key={slot.value} value={slot.value} disabled={past}>
                          {slot.label}
                        </option>
                      )
                    })}
                  </select>
                </div>
                <div style={{ gridColumn: '1 / span 2' }}>
                  <label style={labelStyle}>Mô tả chi tiết</label>
                  <textarea value={form.note} onChange={update('note')} placeholder="Nhập mô tả thêm.." style={{ ...inputStyle, height: 96, paddingTop: '10px', paddingBottom: '10px' }} />
                </div>
              </div>
              <div className="appointment-buttons" style={rowBtns}>
                <button style={btnGhost} onClick={() => navigate('/')}>Trang chủ</button>
                <button style={btnPrimary} onClick={handleSubmit} disabled={loading}>
                  {loading ? 'Đang xử lý...' : 'Xác nhận'}
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div style={{ textAlign: 'center' }}>
              <Lottie animationData={successAnim} loop={false} style={{ width: 200, height: 200, marginInline: 'auto' }} />
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
                    <div style={infoValue}>
                      {formatLicensePlate(appointmentResult.licensePlate || form.license) || 'N/A'}
                    </div>
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
              
              <button style={{ ...btnPrimary, width: '60%' }} onClick={() => navigate('/')}>Trang chủ</button>
            </div>
          )}
            </div>
          </div>
        </div>
      </div>
      {showCustomerModal && (
        <div style={modalOverlay}>
          <div style={modalCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontWeight: 700, color: '#CBB081', fontSize: 16 }}>Chúng tôi tìm thấy khách hàng</div>
              <button
                onClick={handleRejectCustomer}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}
                aria-label="Đóng"
              >
                ×
              </button>
            </div>

            <div style={{ fontSize: 14, color: '#4b5563', marginBottom: 12 }}>
              Vui lòng xác nhận thông tin:
            </div>

            <div style={{ background: '#f8fafc', borderRadius: 10, padding: 12, marginBottom: 12 }}>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>
                Họ tên: <span style={{ color: '#111' }}>{customerLookup?.fullName || '—'}</span>
              </div>
              <div style={{ fontWeight: 600 }}>
                Số điện thoại: <span style={{ color: '#111' }}>{customerLookup?.phone || '—'}</span>
              </div>
            </div>

            <div style={{ fontWeight: 600, marginBottom: 8 }}>Xe đã từng đến xưởng:</div>
            <div style={{ maxHeight: 180, overflowY: 'auto', paddingRight: 4, marginBottom: 12 }}>
              {customerLookupLoading ? (
                <div style={{ textAlign: 'center', color: '#6b7280' }}>Đang tải lịch sử...</div>
              ) : customerLookup?.vehicles?.length ? (
                customerLookup.vehicles.map((vehicle) => (
                  <div
                    key={vehicle.id}
                    style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #f1f5f9', marginBottom: 6 }}
                  >
                    <div style={{ fontWeight: 700, color: '#111' }}>{vehicle.licensePlate || '—'}</div>
                    <div style={{ color: '#4b5563', fontSize: 13, marginBottom: 10 }}>
                      {vehicle.model ? `${vehicle.model}` : 'Chưa rõ mẫu xe'}
                      {vehicle.lastVisit ? ` (Lần gần nhất: ${formatVisitDate(vehicle.lastVisit)})` : ''}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ color: '#6b7280', fontSize: 13 }}>Chưa có lịch sử xe.</div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button style={{ ...btnGhost, minWidth: 120 }} onClick={handleRejectCustomer}>
                Không phải tôi
              </button>
              <button style={{ ...btnPrimary, minWidth: 120 }} onClick={handleConfirmCustomer}>
                Đúng là tôi
              </button>
            </div>
          </div>
        </div>
      )}
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
const modalOverlay = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.35)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '16px',
  zIndex: 9999
}
const modalCard = {
  width: '100%',
  maxWidth: 520,
  background: '#fff',
  borderRadius: 12,
  padding: 20,
  boxShadow: '0 20px 40px rgba(0,0,0,0.12)'
}


