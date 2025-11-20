import React, { useState } from 'react'
import { Form, Input, Select, DatePicker, Button, Upload, Row, Col, Tag, Space, message } from 'antd'
import { InboxOutlined, CloseOutlined, PlusOutlined } from '@ant-design/icons'
import AccountanceLayout from '../../layouts/AccountanceLayout'
import dayjs from 'dayjs'
import '../../styles/pages/accountance/create-form.css'

const { TextArea } = Input
const { Option } = Select
const { Dragger } = Upload

const TICKET_TYPES = [
  { value: 'thu', label: 'Thu' },
  { value: 'chi', label: 'Chi' },
  { value: 'ung_luong', label: 'Ứng lương' }
]

const APPROVERS = [
  { value: 'htk_ly', label: 'HTK Ly' },
  { value: 'dt_huyen', label: 'DT Huyền' },
  { value: 'nguyen_van_a', label: 'Nguyễn Văn A' },
  { value: 'tran_thi_b', label: 'Trần Thị B' }
]

const CREATORS = [
  { value: 'dt_huyen', label: 'DT Huyền' },
  { value: 'htk_ly', label: 'HTK Ly' },
  { value: 'nguyen_van_a', label: 'Nguyễn Văn A' }
]

export default function CreateForm() {
  const [form] = Form.useForm()
  const [selectedApprovers, setSelectedApprovers] = useState(['htk_ly', 'dt_huyen'])
  const [fileList, setFileList] = useState([])

  const handleSubmit = (values) => {
    console.log('Form values:', values)
    message.success('Tạo phiếu thành công!')
    form.resetFields()
    setSelectedApprovers([])
    setFileList([])
  }

  const handleApproverChange = (value) => {
    setSelectedApprovers(value)
  }

  const handleRemoveApprover = (removedApprover) => {
    setSelectedApprovers(selectedApprovers.filter(a => a !== removedApprover))
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
      <div style={{ padding: '24px', background: '#f5f7fb', minHeight: '100vh' }}>
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
              createdAt: dayjs('2025-10-11'),
              creator: 'dt_huyen'
            }}
            className="create-form"
          >
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item
                  label={<span>Loại Phiếu <span style={{ color: 'red' }}>*</span></span>}
                  name="ticketType"
                  rules={[{ required: true, message: 'Vui lòng chọn loại phiếu' }]}
                >
                  <Select placeholder="Chọn loại phiếu">
                    {TICKET_TYPES.map(type => (
                      <Option key={type.value} value={type.value}>
                        {type.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label={<span>Ngày tạo <span style={{ color: 'red' }}>*</span></span>}
                  name="createdAt"
                  rules={[{ required: true, message: 'Vui lòng chọn ngày tạo' }]}
                >
                  <DatePicker
                    style={{ width: '100%' }}
                    format="DD/MM/YYYY"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={24}>
              <Col span={12}>
                <Form.Item
                  label={<span>Đối tượng <span style={{ color: 'red' }}>*</span></span>}
                  name="subject"
                  rules={[{ required: true, message: 'Vui lòng nhập đối tượng' }]}
                >
                  <Input placeholder="VD: Công ty Điện lực" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label={<span>Người tạo <span style={{ color: 'red' }}>*</span></span>}
                  name="creator"
                  rules={[{ required: true, message: 'Vui lòng chọn người tạo' }]}
                >
                  <Select>
                    {CREATORS.map(creator => (
                      <Option key={creator.value} value={creator.value}>
                        {creator.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={24}>
              <Col span={12}>
                <Form.Item
                  label={<span>Số tiền <span style={{ color: 'red' }}>*</span></span>}
                  name="amount"
                  rules={[{ required: true, message: 'Vui lòng nhập số tiền' }]}
                >
                  <Input placeholder="VD: 2.000.000" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label={<span>Người duyệt <span style={{ color: 'red' }}>*</span></span>}
                  name="approvers"
                  rules={[{ required: true, message: 'Vui lòng chọn người duyệt' }]}
                >
                  <Select
                    mode="multiple"
                    value={selectedApprovers}
                    onChange={handleApproverChange}
                    placeholder="Chọn người duyệt"
                    dropdownRender={(menu) => (
                      <>
                        {menu}
                        <div style={{ padding: '8px', borderTop: '1px solid #f0f0f0' }}>
                          <span style={{ color: '#666', fontSize: '12px' }}>
                            {APPROVERS.length} người duyệt có sẵn
                          </span>
                        </div>
                      </>
                    )}
                  >
                    {APPROVERS.map(approver => (
                      <Option key={approver.value} value={approver.value}>
                        {approver.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
                {selectedApprovers.length > 0 && (
                  <div style={{ 
                    marginTop: '12px', 
                    display: 'flex', 
                    flexWrap: 'wrap', 
                    gap: '8px',
                    padding: '12px',
                    background: '#fafafa',
                    borderRadius: '8px',
                    border: '1px solid #f0f0f0'
                  }}>
                    {selectedApprovers.map(approverId => {
                      const approver = APPROVERS.find(a => a.value === approverId)
                      return (
                        <Tag
                          key={approverId}
                          closable
                          onClose={() => handleRemoveApprover(approverId)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            background: '#e6f7ff',
                            border: '1px solid #91d5ff',
                            color: '#1890ff',
                            fontSize: '14px',
                            fontWeight: 500
                          }}
                        >
                          {approver?.label}
                        </Tag>
                      )
                    })}
                    {APPROVERS.length > selectedApprovers.length && (
                      <Tag
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          background: '#f0f0f0',
                          border: '1px solid #d9d9d9',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: 500,
                          color: '#666'
                        }}
                        onClick={() => {
                          const select = document.querySelector('.ant-select-selector')
                          select?.click()
                        }}
                      >
                        +{APPROVERS.length - selectedApprovers.length}
                      </Tag>
                    )}
                  </div>
                )}
              </Col>
            </Row>

            <Row gutter={24}>
              <Col span={24}>
                <Form.Item
                  label={<span>Nội dung <span style={{ color: 'red' }}>*</span></span>}
                  name="content"
                  rules={[{ required: true, message: 'Vui lòng nhập nội dung' }]}
                >
                  <TextArea
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
                  setSelectedApprovers([])
                  setFileList([])
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

