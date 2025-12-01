import React, { useState, useEffect } from 'react'
import { Form, Input, Button, Upload, Row, Col, message } from 'antd'
import { InboxOutlined, CloseOutlined, CalendarOutlined } from '@ant-design/icons'
import AccountanceLayout from '../../layouts/AccountanceLayout'
import { manualVoucherAPI } from '../../services/api'
import { getUserNameFromToken } from '../../utils/helpers'
import dayjs from 'dayjs'
import '../../styles/pages/accountance/create-form.css'

const { Dragger } = Upload

const TICKET_TYPES = [
  { value: 'thu', label: 'Thu' },
  { value: 'chi', label: 'Chi' },
  { value: 'ung_luong', label: 'Ứng lương' }
]


export default function CreateForm() {
  const [form] = Form.useForm()
  const [fileList, setFileList] = useState([])
  const [loading, setLoading] = useState(false)
  const [creatorName, setCreatorName] = useState('')

  useEffect(() => {
    const userName = getUserNameFromToken()
    setCreatorName(userName || '')
    form.setFieldsValue({
      creator: userName || '',
      createdAt: dayjs().format('DD/MM/YYYY')
    })
  }, [form])

  const handleSubmit = async (values) => {
    try {
      if (values.ticketType === 'ung_luong') {
        message.error('Loại phiếu "Ứng lương" chưa được hỗ trợ. Vui lòng chọn "Thu" hoặc "Chi".')
        return
      }

      // Map ticketType to API enum values
      const typeMap = {
        'thu': 'Phiếu thu',
        'chi': 'Phiếu chi',
        'ung_luong': 'Ứng lương'
      }
      const type = typeMap[values.ticketType] || values.ticketType

      // Parse amount - loại bỏ dấu chấm và phẩy (format VN: 2.000.000 hoặc 2,000,000)
      let amount = 0
      if (values.amount) {
        const cleanedAmount = String(values.amount).replace(/[.,]/g, '')
        amount = Number(cleanedAmount) || 0
      }

      if (amount <= 0) {
        message.error('Số tiền phải lớn hơn 0')
        return
      }

      // Chuẩn bị payload
      const payload = {
        type,
        amount,
        target: values.subject || '',
        description: values.content || ''
      }

      // Lấy file đầu tiên nếu có
      const file = fileList.length > 0 ? fileList[0].originFileObj || fileList[0] : null

      setLoading(true)

      // Gọi API
      const { data, error } = await manualVoucherAPI.create(payload, file)

      if (error) {
        throw new Error(error)
      }

      message.success('Tạo phiếu thành công!')
      form.resetFields()
      setFileList([])
      // Reset form với giá trị mặc định
      form.setFieldsValue({
        creator: creatorName || '',
        createdAt: dayjs().format('DD/MM/YYYY')
      })
    } catch (err) {
      message.error(err.message || 'Không thể tạo phiếu. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  const handleFileRemove = (file) => {
    setFileList(fileList.filter(f => f.uid !== file.uid))
  }

  const uploadProps = {
    onRemove: handleFileRemove,
    beforeUpload: () => false,
    fileList,
    onChange: ({ fileList: newFileList }) => {
      setFileList(newFileList)
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const getTimeLeft = (percent) => {
    if (percent >= 100) return 'Hoàn tất'
    if (percent >= 90) return '10 seconds left'
    if (percent >= 65) return '1 minute left'
    return 'Uploading...'
  }

  return (
    <AccountanceLayout>
      <div style={{ padding: '24px', minHeight: '100vh' }}>
        <div style={{ 
          background: '#ffffff', 
          borderRadius: '12px', 
          padding: '32px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, marginBottom: '32px', color: '#111' }}>Tạo phiếu</h1>

          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{
              createdAt: dayjs().format('DD/MM/YYYY'),
              creator: creatorName || ''
            }}
            className="create-form"
          >
            <Row gutter={24}>
              {/* Left Column */}
              <Col span={12}>
                <Form.Item
                  label="Loại Phiếu *"
                  name="ticketType"
                  rules={[{ required: true, message: 'Vui lòng chọn loại phiếu' }]}
                >
                  <select
                    style={{
                      width: '100%',
                      height: '40px',
                      padding: '8px 12px',
                      fontSize: '14px',
                      border: '1px solid #d9d9d9',
                      borderRadius: '8px',
                      outline: 'none',
                      color: '#262626',
                      cursor: 'pointer'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#3b82f6'
                      e.target.style.boxShadow = '0 0 0 2px rgba(59,130,246,0.15)'
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#d9d9d9'
                      e.target.style.boxShadow = 'none'
                    }}
                  >
                    <option value="">Chọn loại phiếu</option>
                    {TICKET_TYPES.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </Form.Item>

                <Form.Item
                  label="Danh mục *"
                  name="category"
                  rules={[{ required: true, message: 'Vui lòng chọn danh mục' }]}
                >
                  <select
                    style={{
                      width: '100%',
                      height: '40px',
                      padding: '8px 12px',
                      fontSize: '14px',
                      border: '1px solid #d9d9d9',
                      borderRadius: '8px',
                      outline: 'none',
                      color: '#262626',
                      cursor: 'pointer'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#3b82f6'
                      e.target.style.boxShadow = '0 0 0 2px rgba(59,130,246,0.15)'
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#d9d9d9'
                      e.target.style.boxShadow = 'none'
                    }}
                  >
                    <option value="">Chọn danh mục</option>
                    <option value="supplier">Nhà cung cấp</option>
                    <option value="customer">Khách hàng</option>
                    <option value="employee">Nhân viên</option>
                    <option value="other">Khác</option>
                  </select>
                </Form.Item>

                <Form.Item
                  label="Đối tượng *"
                  name="subject"
                  rules={[{ required: true, message: 'Vui lòng nhập đối tượng' }]}
                >
                  <Input placeholder="VD: Công ty Điện lực" />
                </Form.Item>

                <Form.Item
                  label="Số tiền *"
                  name="amount"
                  rules={[{ required: true, message: 'Vui lòng nhập số tiền' }]}
                >
                  <Input placeholder="VD: 2.000.000" />
                </Form.Item>
              </Col>

              {/* Right Column */}
              <Col span={12}>
                <Form.Item
                  label="Ngày tạo *"
                  name="createdAt"
                  rules={[{ required: true, message: 'Vui lòng nhập ngày tạo' }]}
                >
                  <Input 
                    value={dayjs().format('DD/MM/YYYY')}
                    disabled
                    style={{ 
                      background: '#f5f5f5',
                      cursor: 'not-allowed'
                    }}
                  />
                </Form.Item>

                <Form.Item
                  label="Người tạo *"
                  name="creator"
                  rules={[{ required: true, message: 'Vui lòng nhập người tạo' }]}
                >
                  <Input 
                    disabled
                    style={{ 
                      background: '#f5f5f5',
                      cursor: 'not-allowed'
                    }}
                  />
                </Form.Item>

                <Form.Item
                  label="Nội dung *"
                  name="content"
                  rules={[{ required: true, message: 'Vui lòng nhập nội dung' }]}
                >
                  <Input.TextArea
                    rows={4}
                    placeholder="VD: Xe bị xì lốp"
                    style={{ resize: 'none' }}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={24}>
              <Col span={24}>
                <Form.Item
                  label="File Đính kèm!"
                  name="files"
                >
                  <Dragger {...uploadProps} className="file-upload-dragger">
                    <p className="ant-upload-drag-icon">
                      <InboxOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
                    </p>
                    <p className="ant-upload-text">Drag & Drop or Choose file to upload</p>
                    <p className="ant-upload-hint">
                      Supported file types: fig, zip, pdf, png, jpeg
                    </p>
                  </Dragger>
                  {fileList.length > 0 && (
                    <div style={{ marginTop: '16px' }}>
                      {fileList.map(file => (
                        <div
                          key={file.uid}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '16px',
                            background: '#fafafa',
                            borderRadius: '8px',
                            marginBottom: '12px',
                            border: '1px solid #f0f0f0',
                            transition: 'all 0.2s'
                          }}
                        >
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ 
                              fontWeight: 600, 
                              marginBottom: '6px',
                              fontSize: '14px',
                              color: '#111'
                            }}>
                              {file.name}
                            </div>
                            <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
                              {formatFileSize(file.size)} • {getTimeLeft(file.percent)}
                            </div>
                            {file.percent && file.percent < 100 && (
                              <div
                                style={{
                                  width: '100%',
                                  height: '6px',
                                  background: '#f0f0f0',
                                  borderRadius: '3px',
                                  overflow: 'hidden'
                                }}
                              >
                                <div
                                  style={{
                                    width: `${file.percent}%`,
                                    height: '100%',
                                    background: 'linear-gradient(90deg, #722ed1, #9254de)',
                                    transition: 'width 0.3s ease',
                                    borderRadius: '3px'
                                  }}
                                />
                              </div>
                            )}
                          </div>
                          <Button
                            type="text"
                            danger
                            icon={<CloseOutlined />}
                            onClick={() => handleFileRemove(file)}
                            style={{ 
                              marginLeft: '16px',
                              flexShrink: 0,
                              width: '32px',
                              height: '32px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </Form.Item>
              </Col>
            </Row>

            <div style={{ 
              display: 'flex', 
              justifyContent: 'flex-end', 
              gap: '12px', 
              marginTop: '32px',
              paddingTop: '24px',
              borderTop: '1px solid #f0f0f0'
            }}>
              <Button
                type="default"
                danger
                size="large"
                onClick={() => {
                  form.resetFields()
                  setFileList([])
                  // Reset form với giá trị mặc định
                  form.setFieldsValue({
                    creator: creatorName || '',
                    createdAt: dayjs().format('DD/MM/YYYY')
                  })
                }}
                style={{
                  borderRadius: '8px',
                  fontWeight: 600,
                  padding: '10px 32px',
                  height: 'auto',
                  minWidth: '120px'
                }}
              >
                Hủy
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                loading={loading}
                style={{
                  background: '#22c55e',
                  borderColor: '#22c55e',
                  borderRadius: '8px',
                  fontWeight: 600,
                  padding: '10px 32px',
                  height: 'auto',
                  minWidth: '120px',
                  boxShadow: '0 2px 4px rgba(34, 197, 94, 0.2)'
                }}
              >
                Tạo phiếu
              </Button>
            </div>
          </Form>
        </div>
      </div>
    </AccountanceLayout>
  )
}

