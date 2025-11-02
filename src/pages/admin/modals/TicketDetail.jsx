import { Modal, Row, Col, Divider, Select, InputNumber, Button, Tag, Input } from 'antd'
import { useState } from 'react'
import '/src/styles/pages/admin/modals/ticketdetail.css'

const STATUS_OPTIONS = [
  { label: 'Còn hàng', value: 'Còn hàng', cls: 'green' },
  { label: 'Cần hàng', value: 'Cần hàng', cls: 'blue' },
  { label: 'Hết hàng', value: 'Hết hàng', cls: 'orange' },
  { label: 'Không rõ', value: 'Không rõ', cls: 'gray' },
]

const TECHS = [
  'Hoàng Thị Khánh Ly - 0123456789',
  'Phạm Đức Đạt - 0741852963',
  'Đặng Thị Huyền - 0987654321',
  'Nguyễn Văn B - 0909123456',
]

export default function TicketDetail({ open, onClose, data }) {
  if (!data) return null

  const headerItem = (label, value) => (
    <div className="td-kv">
      <div className="k">{label}</div>
      <div className="v">{value}</div>
    </div>
  )

  const tagColor = data.status === 'Huỷ' ? 'red' : data.status === 'Đang sửa chữa' ? 'blue' : data.status === 'Chờ báo giá' ? 'orange' : data.status === 'Không duyệt' ? 'default' : 'green'

  const Line = ({ idx, item, onDelete }) => (
    <div className="td-line">
      <div className="c stt">{idx < 10 ? `0${idx}` : idx}</div>
      <div className="c name"><Input defaultValue={item.name} size="small" placeholder="Tên linh kiện" /></div>
      <div className="c qty"><InputNumber min={1} defaultValue={item.qty} size="small" /></div>
      <div className="c status">
        <Select
          options={STATUS_OPTIONS.map((o) => ({ value: o.value, label: <span className={`pill ${o.cls}`}>{o.label}</span> }))}
          defaultValue={STATUS_OPTIONS[0].value}
          size="small"
          className="status-select"
          optionLabelProp="value"
        />
      </div>
      <div className="c price">1.000.000</div>
      <div className="c total">1.000.000</div>
      <div className="c action" role="button" onClick={onDelete}>×</div>
    </div>
  )

  const [replaceItems, setReplaceItems] = useState([{ id: 1, name: 'Linh kiện A', qty: 1 }])
  const [paintItems, setPaintItems] = useState([{ id: 1, name: 'Linh kiện A', qty: 1 }])

  const addReplace = () => setReplaceItems((arr) => [...arr, { id: Date.now(), name: `Linh kiện ${arr.length + 1}`, qty: 1 }])
  const addPaint = () => setPaintItems((arr) => [...arr, { id: Date.now(), name: `Linh kiện ${arr.length + 1}`, qty: 1 }])
  const delFrom = (set) => (id) => set((arr) => arr.filter((x) => x.id !== id))

  return (
    <Modal title="PHIẾU DỊCH VỤ CHI TIẾT" open={open} onCancel={onClose} footer={null} width={960}>
      <Row gutter={16}>
        <Col span={12}>
          <div className="td-box">
            {headerItem('Tên khách hàng', 'Nguyễn Văn A')}
            {headerItem('Số điện thoại', '0123456789')}
            {headerItem('Loại xe', 'Mazda-v3')}
            {headerItem('Biển số xe', data.license)}
            {headerItem('Số khung', '1HGCM82633A123456')}
          </div>
        </Col>
        <Col span={12}>
          <div className="td-box">
            {headerItem('Nhân viên lập báo giá', 'Hoàng Văn B')}
            {headerItem('Ngày tạo báo giá', data.createdAt)}
            <div className="td-kv">
              <div className="k">Kỹ thuật viên sửa chữa</div>
              <div className="v">
                <Select
                  mode="multiple"
                  showSearch
                  placeholder="Tìm kiếm"
                  allowClear
                  options={TECHS.map((t) => ({ value: t, label: t }))}
                  className="tech-select"
                  style={{ width: '100%' }}
                />
              </div>
            </div>
            {headerItem('Loại dịch vụ', 'Thay thế phụ tùng')}
            <div className="td-kv">
              <div className="k">Trạng thái</div>
              <div className="v"><Tag color={tagColor}>{data.status}</Tag></div>
            </div>
          </div>
        </Col>
      </Row>

      <Divider orientation="left">BÁO GIÁ CHI TIẾT</Divider>

      <div className="td-section">
        <div className="td-section-title">Thay thế:</div>
        <div className="td-head">
          <div className="h stt">STT</div>
          <div className="h name">Tên linh kiện</div>
          <div className="h qty">Số lượng</div>
          <div className="h status">Trạng thái</div>
          <div className="h price">Đơn giá</div>
          <div className="h total">Thành tiền</div>
          <div className="h action"></div>
        </div>
        {replaceItems.map((it, i) => (
          <Line key={it.id} idx={i + 1} item={it} onDelete={() => delFrom(setReplaceItems)(it.id)} />
        ))}
        <button className="td-add" onClick={addReplace}>+</button>
      </div>

      <div className="td-section">
        <div className="td-section-title">Sơn:</div>
        <div className="td-head">
          <div className="h stt">STT</div>
          <div className="h name">Tên linh kiện</div>
          <div className="h qty">Số lượng</div>
          <div className="h status">Trạng thái</div>
          <div className="h price">Đơn giá</div>
          <div className="h total">Thành tiền</div>
          <div className="h action"></div>
        </div>
        {paintItems.map((it, i) => (
          <Line key={it.id} idx={i + 1} item={it} onDelete={() => delFrom(setPaintItems)(it.id)} />
        ))}
        <button className="td-add" onClick={addPaint}>+</button>
      </div>

      <div className="td-actions">
        <Button danger type="primary">Gửi</Button>
        <Button> Lưu</Button>
        <Button type="primary" style={{ background: '#22c55e' }}>Thanh toán</Button>
      </div>
    </Modal>
  )
}


