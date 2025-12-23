import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Result, Button, Typography, Card, Spin, message } from 'antd'
import { CheckCircleOutlined, HomeOutlined, CalendarOutlined } from '@ant-design/icons'
import CustomerLayout from '../../../layouts/CustomerLayout'
import { appointmentAPI } from '../../../services/api'
import dayjs from 'dayjs'
import 'dayjs/locale/vi'
import './AppointmentConfirmSuccess.css'

const { Title, Text } = Typography

dayjs.locale('vi')

export default function AppointmentConfirmSuccess() {
  const { id: token } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [appointmentData, setAppointmentData] = useState(null)
  const [confirmTime, setConfirmTime] = useState(null)
  const canvasRef = useRef(null)
  const animationRef = useRef(null)

  useEffect(() => {
    if (token) {
      confirmAppointment()
    }
  }, [token])

  useEffect(() => {
    if (!loading && appointmentData) {
      startFireworks()
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [loading, appointmentData])

  const confirmAppointment = async () => {
    try {
      setLoading(true)
      
      // Call API to confirm appointment using one-time token
      const { data, error } = await appointmentAPI.confirmFromReminder(token)
      
      if (error) {
        message.error(error || 'Không thể xác nhận lịch hẹn. Vui lòng thử lại.')
        setTimeout(() => {
          navigate('/appointment')
        }, 2000)
        return
      }

      setAppointmentData(data?.result || data)
      setConfirmTime(dayjs())
      
      message.success('Xác nhận lịch hẹn thành công!')
    } catch (err) {
      console.error('Error confirming appointment:', err)
      message.error('Đã xảy ra lỗi khi xác nhận lịch hẹn.')
      setTimeout(() => {
        navigate('/appointment')
      }, 2000)
    } finally {
      setLoading(false)
    }
  }

  const startFireworks = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    const fireworks = []
    const particles = []

    class Firework {
      constructor(x, y, targetX, targetY, hue) {
        this.x = x
        this.y = y
        this.startX = x
        this.startY = y
        this.targetX = targetX
        this.targetY = targetY
        this.distance = Math.sqrt(
          Math.pow(targetX - x, 2) + Math.pow(targetY - y, 2)
        )
        this.traveled = 0
        this.coordinates = []
        this.coordinateCount = 3
        while (this.coordinateCount--) {
          this.coordinates.push([this.x, this.y])
        }
        this.angle = Math.atan2(targetY - y, targetX - x)
        this.speed = 2
        this.acceleration = 1.05
        this.brightness = Math.random() * 50 + 50
        this.targetRadius = 1
        this.hue = hue || Math.random() * 360
      }

      update(index) {
        this.coordinates.pop()
        this.coordinates.unshift([this.x, this.y])

        if (this.targetRadius < 8) {
          this.targetRadius += 0.3
        } else {
          this.targetRadius = 1
        }

        this.speed *= this.acceleration

        const vx = Math.cos(this.angle) * this.speed
        const vy = Math.sin(this.angle) * this.speed

        this.traveled = Math.sqrt(
          Math.pow(this.x - this.startX, 2) + Math.pow(this.y - this.startY, 2)
        )

        if (this.traveled >= this.distance - 5 || this.y > canvas.height) {
          createParticles(this.targetX, this.targetY, this.hue)
          fireworks.splice(index, 1)
        } else {
          this.x += vx
          this.y += vy
        }
      }

      draw() {
        ctx.beginPath()
        ctx.moveTo(
          this.coordinates[this.coordinates.length - 1][0],
          this.coordinates[this.coordinates.length - 1][1]
        )
        ctx.lineTo(this.x, this.y)
        ctx.strokeStyle = `hsl(${this.hue}, 100%, ${this.brightness}%)`
        ctx.lineWidth = 2
        ctx.stroke()

        ctx.beginPath()
        ctx.arc(this.targetX, this.targetY, this.targetRadius, 0, Math.PI * 2)
        ctx.fillStyle = `hsl(${this.hue}, 100%, ${this.brightness}%)`
        ctx.fill()
      }
    }

    class Particle {
      constructor(x, y, hue) {
        this.x = x
        this.y = y
        this.coordinates = []
        this.coordinateCount = 5
        while (this.coordinateCount--) {
          this.coordinates.push([this.x, this.y])
        }
        this.angle = Math.random() * Math.PI * 2
        this.speed = Math.random() * 10 + 2
        this.friction = 0.95
        this.gravity = 1
        this.hue = hue !== undefined ? hue : Math.random() * 360
        this.brightness = Math.random() * 50 + 50
        this.alpha = 1
        this.decay = Math.random() * 0.015 + 0.005
      }

      update(index) {
        this.coordinates.pop()
        this.coordinates.unshift([this.x, this.y])
        this.speed *= this.friction
        this.x += Math.cos(this.angle) * this.speed
        this.y += Math.sin(this.angle) * this.speed + this.gravity
        this.alpha -= this.decay

        if (this.alpha <= this.decay) {
          particles.splice(index, 1)
        }
      }

      draw() {
        ctx.beginPath()
        ctx.moveTo(
          this.coordinates[this.coordinates.length - 1][0],
          this.coordinates[this.coordinates.length - 1][1]
        )
        ctx.lineTo(this.x, this.y)
        ctx.strokeStyle = `hsla(${this.hue}, 100%, ${this.brightness}%, ${this.alpha})`
        ctx.lineWidth = 2
        ctx.stroke()
      }
    }

    const createParticles = (x, y, hue) => {
      const particleCount = 30
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle(x, y, hue))
      }
    }

    const launchFirework = () => {
      const isLeft = Math.random() < 0.5
      const x = isLeft ? 0 : canvas.width
      const y = canvas.height
      const targetX = Math.random() * canvas.width * 0.6 + canvas.width * 0.2
      const targetY = Math.random() * canvas.height * 0.4 + canvas.height * 0.1
      const hue = Math.random() * 360
      fireworks.push(new Firework(x, y, targetX, targetY, hue))
    }

    const animate = () => {
      ctx.globalCompositeOperation = 'destination-out'
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.globalCompositeOperation = 'lighter'

      let i = fireworks.length
      while (i--) {
        fireworks[i].draw()
        fireworks[i].update(i)
      }

      let j = particles.length
      while (j--) {
        particles[j].draw()
        particles[j].update(j)
      }

      if (Math.random() < 0.06 && fireworks.length < 10) {
        launchFirework()
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    // Launch initial fireworks from both sides
    launchFirework()
    setTimeout(() => launchFirework(), 200)
    setTimeout(() => launchFirework(), 400)

    animate()

    // Stop after 6 seconds
    setTimeout(() => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        window.removeEventListener('resize', resizeCanvas)
      }
    }, 6000)
  }

  const formatDateTime = (dateTime) => {
    if (!dateTime) return '—'
    return dayjs(dateTime).format('DD/MM/YYYY HH:mm')
  }

  const formatDate = (date) => {
    if (!date) return '—'
    return dayjs(date).format('dddd, DD/MM/YYYY')
  }

  const formatTime = (time) => {
    if (!time) return '—'
    return time
  }

  if (loading) {
    return (
      <CustomerLayout>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '60vh' 
        }}>
          <Spin size="large" tip="Đang xác nhận lịch hẹn..." />
        </div>
      </CustomerLayout>
    )
  }

  return (
    <CustomerLayout>
      <div className="appointment-confirm-success">
        <canvas 
          ref={canvasRef} 
          className="fireworks-canvas"
        />
        
        <div className="success-content">
          <Result
            icon={<CheckCircleOutlined style={{ color: '#52c41a', fontSize: '80px' }} />}
            title={
              <Title level={2} style={{ color: '#52c41a', marginBottom: '16px' }}>
                Xác nhận lịch hẹn thành công!
              </Title>
            }
            subTitle={
              <div>
                <Text style={{ fontSize: '16px', display: 'block', marginBottom: '8px' }}>
                  Cảm ơn quý khách đã xác nhận lịch hẹn với chúng tôi.
                </Text>
                {confirmTime && (
                  <Text type="secondary" style={{ fontSize: '14px', display: 'block' }}>
                    Thời gian xác nhận: {formatDateTime(confirmTime)}
                  </Text>
                )}
              </div>
            }
            extra={[
              <Card 
                key="info"
                style={{ 
                  marginTop: '24px', 
                  textAlign: 'left',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none'
                }}
              >
                {appointmentData && (
                  <div>
                    <div style={{ marginBottom: '16px' }}>
                      <CalendarOutlined style={{ marginRight: '8px', fontSize: '18px' }} />
                      <Text strong style={{ fontSize: '18px', color: 'white' }}>
                        Thông tin lịch hẹn
                      </Text>
                    </div>
                    
                    {appointmentData.appointmentDate && (
                      <div style={{ marginBottom: '12px' }}>
                        <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: '16px' }}>
                          <strong>Ngày hẹn:</strong> {formatDate(appointmentData.appointmentDate)} {appointmentData.appointmentTime && `lúc ${formatTime(appointmentData.appointmentTime)}`}
                        </Text>
                      </div>
                    )}
                    
                    {appointmentData.appointmentCode && (
                      <div style={{ marginBottom: '12px' }}>
                        <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: '16px' }}>
                          <strong>Mã lịch hẹn:</strong> {appointmentData.appointmentCode}
                        </Text>
                      </div>
                    )}
                    
                    {appointmentData.customer?.fullName && (
                      <div style={{ marginBottom: '12px' }}>
                        <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: '16px' }}>
                          <strong>Khách hàng:</strong> {appointmentData.customer.fullName}
                        </Text>
                      </div>
                    )}
                    
                    {appointmentData.licensePlate && (
                      <div style={{ marginBottom: '12px' }}>
                        <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: '16px' }}>
                          <strong>Biển số xe:</strong> {appointmentData.licensePlate}
                        </Text>
                      </div>
                    )}
                    
                    {appointmentData.serviceType && (
                      <div>
                        <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: '16px' }}>
                          <strong>Loại dịch vụ:</strong> {
                            Array.isArray(appointmentData.serviceType) 
                              ? appointmentData.serviceType.join(', ')
                              : appointmentData.serviceType
                          }
                        </Text>
                      </div>
                    )}
                  </div>
                )}
              </Card>,
              <div key="actions" style={{ marginTop: '32px' }}>
                <Button 
                  type="primary" 
                  size="large" 
                  icon={<HomeOutlined />}
                  onClick={() => navigate('/')}
                  style={{ 
                    marginRight: '16px',
                    height: '48px',
                    paddingLeft: '32px',
                    paddingRight: '32px',
                    fontSize: '16px',
                    borderRadius: '8px'
                  }}
                >
                  Về trang chủ
                </Button>
                <Button 
                  size="large"
                  onClick={() => navigate('/appointment')}
                  style={{ 
                    height: '48px',
                    paddingLeft: '32px',
                    paddingRight: '32px',
                    fontSize: '16px',
                    borderRadius: '8px'
                  }}
                >
                  Đặt lịch hẹn mới
                </Button>
              </div>
            ]}
          />
        </div>
      </div>
    </CustomerLayout>
  )
}
