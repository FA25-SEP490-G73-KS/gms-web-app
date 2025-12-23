import React, { useState } from 'react'
import { Modal, Row, Col, Button, Input } from 'antd'
import ReactSelect from 'react-select'

const BRANDS = [
  { value: 1, label: 'Vinfast' },
  { value: 2, label: 'Toyota' },
  { value: 3, label: 'Honda' },
  { value: 4, label: 'Mazda' },
]

const MODELS = [
  { value: 1, label: 'VF3' },
  { value: 2, label: 'VF5' },
  { value: 3, label: 'Vios' },
  { value: 4, label: 'City' },
]

const TECHS = [
  { value: 1, label: 'Nguyễn Văn B' },
  { value: 2, label: 'Hoàng Văn B' },
  { value: 3, label: 'Phạm Đức Đạt' },
]

const SERVICES = [
  { value: 1, label: 'Thay thế phụ tùng' },
  { value: 2, label: 'Sơn' },
  { value: 3, label: 'Bảo dưỡng' },
]

export default function TicketDetail({ open, onClose, data }) {
  const [selectedTechs, setSelectedTechs] = useState([])
  const [selectedServices, setSelectedServices] = useState([])
  const [selectedBrand, setSelectedBrand] = useState('')
  const [selectedModel, setSelectedModel] = useState('')

  if (!data) return null

  const formItemStyle = { marginBottom: '16px' }
  const labelStyle = { display: 'block', marginBottom: '6px', fontWeight: 500 }
  const inputHeight = 38
  const selectStyle = { 
    width: '100%', 
    height: inputHeight, 
    padding: '0 12px', 
    color: '#262626', 
    backgroundColor: '#fff', 
    border: '1px solid #d9d9d9', 
    borderRadius: '6px', 
    outline: 'none',
    cursor: 'pointer'
  }

  const multiSelectStyles = {
    control: (base, state) => ({
      ...base,
      minHeight: inputHeight,
      borderRadius: 6,
      borderColor: state.isFocused ? '#3b82f6' : '#d1d5db',
      boxShadow: state.isFocused ? '0 0 0 2px rgba(59,130,246,0.15)' : 'none',
      transition: 'all 0.15s ease',
      '&:hover': { borderColor: '#3b82f6' }
    }),
    indicatorsContainer: (base) => ({ ...base, paddingRight: 8 }),
    valueContainer: (base) => ({ ...base, padding: '2px 8px', gap: 4 }),
    placeholder: (base) => ({ ...base, color: '#9ca3af', fontWeight: 400 }),
    multiValue: (base) => ({ ...base, borderRadius: 12, backgroundColor: '#e0f2ff', border: '1px solid #bae6fd' }),
    multiValueLabel: (base) => ({ ...base, color: '#0f172a', fontWeight: 600, padding: '2px 8px', fontSize: 13 }),
    multiValueRemove: (base) => ({ ...base, color: '#0ea5e9', borderLeft: '1px solid #bae6fd', padding: '2px 6px', ':hover': { backgroundColor: '#bae6fd', color: '#0284c7' } }),
    menu: (base) => ({ ...base, zIndex: 9999, borderRadius: 12 }),
    menuPortal: (base) => ({ ...base, zIndex: 9999 })
  }

  return (
    <Modal
      title="Thông Tin Phiếu Dịch Vụ"
      open={open}
      onCancel={onClose}
      footer={null}
      width={650}
    >
      <div style={{ padding: '8px 0' }}>
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <div style={formItemStyle}>
              <label style={labelStyle}>Tên khách hàng:</label>
              <Input placeholder="Nguyễn Văn A" defaultValue={data?.customer} />
            </div>
          </Col>
          <Col span={12}>
            <div style={formItemStyle}>
              <label style={labelStyle}>Số điện thoại:</label>
              <Input placeholder="0919384239" defaultValue={data?.phone} />
            </div>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col span={12}>
            <div style={formItemStyle}>
              <label style={labelStyle}>Hãng xe:</label>
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                style={selectStyle}
              >
                <option value="">Chọn hãng</option>
                {BRANDS.map((brand) => (
                  <option key={brand.value} value={brand.value}>
                    {brand.label}
                  </option>
                ))}
              </select>
            </div>
          </Col>
          <Col span={12}>
            <div style={formItemStyle}>
              <label style={labelStyle}>Loại xe:</label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                style={selectStyle}
              >
                <option value="">Chọn loại</option>
                {MODELS.map((model) => (
                  <option key={model.value} value={model.value}>
                    {model.label}
                  </option>
                ))}
              </select>
            </div>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col span={12}>
            <div style={formItemStyle}>
              <label style={labelStyle}>Biển số xe:</label>
              <Input placeholder="30A-12345" defaultValue={data?.license} />
            </div>
          </Col>
          <Col span={12}>
            <div style={formItemStyle}>
              <label style={labelStyle}>Số khung:</label>
              <Input placeholder="VNN1234578" />
            </div>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col span={12}>
            <div style={formItemStyle}>
              <label style={labelStyle}>Nhân viên lập báo giá:</label>
              <Input disabled defaultValue="Hoàng Văn B" style={{ background: '#f5f5f5' }} />
            </div>
          </Col>
          <Col span={12}>
            <div style={formItemStyle}>
              <label style={labelStyle}>Ngày tiếp nhận xe:</label>
              <Input disabled defaultValue="12/10/2025" style={{ background: '#f5f5f5' }} />
            </div>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col span={12}>
            <div style={formItemStyle}>
              <label style={labelStyle}>Kỹ thuật viên:</label>
              <ReactSelect
                isMulti
                options={TECHS}
                value={selectedTechs}
                onChange={setSelectedTechs}
                styles={multiSelectStyles}
                placeholder="Chọn kỹ thuật viên"
                menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                classNamePrefix="react-select"
              />
            </div>
          </Col>
          <Col span={12}>
            <div style={formItemStyle}>
              <label style={labelStyle}>Loại dịch vụ:</label>
              <ReactSelect
                isMulti
                options={SERVICES}
                value={selectedServices}
                onChange={setSelectedServices}
                styles={multiSelectStyles}
                placeholder="Chọn loại dịch vụ"
                menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                classNamePrefix="react-select"
              />
            </div>
          </Col>
        </Row>

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '24px' }}>
          <Button 
            type="primary" 
            style={{ 
              background: '#22c55e', 
              borderColor: '#22c55e',
              width: '120px',
              height: '40px',
              fontWeight: 600
            }}
          >
            Lưu
          </Button>
        </div>
      </div>
    </Modal>
  )
}
