import React, { useMemo, useState } from 'react'
import {
  Table,
  Input,
  Button,
  Tag,
  Space,
  Select,
  Modal,
  Form,
  InputNumber,
  Upload,
  message
} from 'antd'
import { SearchOutlined, PlusOutlined, CloseOutlined, UploadOutlined } from '@ant-design/icons'
import AccountanceLayout from '../../layouts/AccountanceLayout'
import { goldTableHeader } from '../../utils/tableComponents'
import { manualVoucherAPI } from '../../services/api'
import '../../styles/pages/accountance/finance.css'

const { Option } = Select

const STATUS_FILTERS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'pending', label: 'Chờ duyệt' },
  { key: 'completed', label: 'Hoàn tất' },
  { key: 'rejected', label: 'Từ chối' }
]

const TICKET_TYPES = [
  { value: 'all', label: 'Tất cả' },
  { value: 'thu', label: 'Thu' },
  { value: 'chi', label: 'Chi' },
  { value: 'ung_luong', label: 'Ứng lương' }
]

const initialFinanceData = [
  {
    id: 1,
    code: 'PT-2025-000001',
    type: 'thu',
    subject: 'Nguyễn Văn A',
    amount: 500000,
    createdAt: '15/11/2025',
    status: 'completed'
  },
  {
    id: 2,
    code: 'PC-2025-000001',
    type: 'chi',
    subject: 'NCC',
    amount: 500000,
    createdAt: '15/11/2025',
    status: 'pending'
  },
  {
    id: 3,
    code: 'UL-2025-010001',
    type: 'ung_luong',
    subject: 'Nguyễn Văn B',
    amount: 500000,
    createdAt: '15/11/2025',
    status: 'completed'
  },
  {
    id: 4,
    code: 'PC-2025-000002',
    type: 'chi',
    subject: 'Công ty Điện lực',
    amount: 500000,
    createdAt: '15/11/2025',
    status: 'approved'
  },
  {
    id: 5,
    code: 'PT-2025-000002',
    type: 'thu',
    subject: 'Nguyễn Văn C',
    amount: 1000000,
    createdAt: '16/11/2025',
    status: 'pending'
  },
  {
    id: 6,
    code: 'PC-2025-000003',
    type: 'chi',
    subject: 'Nhà cung cấp A',
    amount: 750000,
    createdAt: '16/11/2025',
    status: 'rejected'
  }
]

const getTypeConfig = (type) => {
  const configs = {
    thu: { label: 'Thu', color: '#CBB081' },
    chi: { label: 'Chi', color: '#f97316' },
    ung_luong: { label: 'Ứng lương', color: '#fb923c' }
  }
  return configs[type] || { label: type, color: '#666' }
}

const getStatusConfig = (status) => {
  const configs = {
    completed: { label: 'Hoàn tất', color: '#22c55e', bg: '#dcfce7' },
    pending: { label: 'Chờ duyệt', color: '#3b82f6', bg: '#dbeafe' },
    rejected: { label: 'Từ chối', color: '#ef4444', bg: '#fee2e2' },
    approved: { label: 'Đã duyệt', color: '#3b82f6', bg: '#dbeafe' }
  }
  return configs[status] || { label: status, color: '#666', bg: '#f3f4f6' }
}

export function AccountanceFinanceContent() {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [ticketType, setTicketType] = useState('all')
  const [data, setData] = useState(initialFinanceData)
  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [uploadFile, setUploadFile] = useState(null)
  const [fileList, setFileList] = useState([])
  const [creating, setCreating] = useState(false)
  const [form] = Form.useForm()

  const filtered = useMemo(() => {
    return data
      .filter((item) => {
        const matchesQuery =
          !query ||
          item.code.toLowerCase().includes(query.toLowerCase()) ||
          item.subject.toLowerCase().includes(query.toLowerCase())
        const matchesStatus =
          status === 'all' ||
          item.status === status
        const matchesType =
          ticketType === 'all' ||
          item.type === ticketType
        return matchesQuery && matchesStatus && matchesType
      })
      .map((item, index) => ({ ...item, key: item.id, index }))
  }, [query, status, ticketType])

  const columns = [
    {
      title: 'Mã phiếu',
      dataIndex: 'code',
      key: 'code',
      width: 180,
      render: (text) => <span style={{ fontWeight: 600 }}>{text}</span>
    },
    {
      title: 'Loại Phiếu',
      dataIndex: 'type',
      key: 'type',
      width: 180,
      render: (type) => {
        const config = getTypeConfig(type)
        return (
          <Space>
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: config.color,
                display: 'inline-block'
              }}
            />
            <span>{config.label}</span>
          </Space>
        )
      }
    },
    {
      title: 'Đối tượng',
      dataIndex: 'subject',
      key: 'subject',
      width: 200
    },
    {
      title: 'Số tiền',
      dataIndex: 'amount',
      key: 'amount',
      width: 150,
      align: 'right',
      render: (value) => value.toLocaleString('vi-VN')
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 140
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 160,
      render: (status) => {
        const config = getStatusConfig(status)
        return (
          <Tag
            style={{
              background: config.bg,
              color: config.color,
              borderColor: config.color,
              borderRadius: 999,
              padding: '4px 12px',
              fontWeight: 600
            }}
          >
            {config.label}
          </Tag>
        )
      }
    },
    {
      title: '',
      key: 'action',
      width: 60,
      align: 'center',
      render: () => (
        <Button
          type="text"
          danger
          icon={<CloseOutlined />}
          style={{ padding: 0, width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        />
      )
    }
  ]

  return (
    <>
    <div style={{ padding: '24px', background: '#ffffff', minHeight: '100vh' }}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, marginBottom: '20px' }}>Danh sách phiếu Thu-Chi</h1>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '20px' }}>
            <Space>
              {STATUS_FILTERS.map((filter) => (
                <Button
                  key={filter.key}
                  type={status === filter.key ? 'primary' : 'default'}
                  onClick={() => setStatus(filter.key)}
                  style={{
                    background: status === filter.key ? '#CBB081' : '#fff',
                    borderColor: status === filter.key ? '#CBB081' : '#e6e6e6',
                    color: status === filter.key ? '#111' : '#666',
                    fontWeight: 600
                  }}
                >
                  {filter.label}
                </Button>
              ))}
            </Space>
            <Input
              prefix={<SearchOutlined />}
              placeholder="Tìm kiếm"
              allowClear
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ width: 260 }}
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              style={{ background: '#22c55e', borderColor: '#22c55e', fontWeight: 600 }}
              onClick={() => setCreateModalVisible(true)}
            >
              Tạo phiếu
            </Button>
            <Select
              value={ticketType}
              onChange={setTicketType}
              style={{ width: 150 }}
            >
              {TICKET_TYPES.map(type => (
                <Option key={type.value} value={type.value}>
                  {type.label}
                </Option>
              ))}
            </Select>
          </div>
        </div>

        <div style={{
          background: '#fff',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <Table
            className="finance-table"
            columns={columns}
            dataSource={filtered}
            pagination={{
              pageSize: 10,
              current: 1,
              total: filtered.length,
              showTotal: (total) => `0 of ${total} row(s) selected.`,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50', '100']
            }}
            components={goldTableHeader}
            rowClassName={(_, index) => (index % 2 === 0 ? 'table-row-even' : 'table-row-odd')}
          />
        </div>
      </div>

      <Modal
        title="Tạo phiếu Thu/Chi"
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        okText="Tạo phiếu"
        confirmLoading={creating}
        onOk={async () => {
          try {
            const values = await form.validateFields()
            setCreating(true)
            const payload = {
              type: values.type,
              amount: Number(values.amount),
              target: values.target,
              description: values.description,
              attachmentUrl: values.attachmentUrl || undefined,
              approvedByEmployeeId: values.approvedByEmployeeId
            }
            const { data: response, error } = await manualVoucherAPI.create(payload, uploadFile)
            if (error) {
              throw new Error(error)
            }
            const result = response?.result || response?.data || response
            const newRecord = {
              id: result?.id || Date.now(),
              code: result?.code || result?.voucherCode || `TMP-${Date.now()}`,
              type: (result?.type || values.type || 'thu').toLowerCase(),
              subject: result?.target || values.target,
              amount: Number(result?.amount || values.amount),
              createdAt: result?.createdAt
                ? new Date(result.createdAt).toLocaleDateString('vi-VN')
                : new Date().toLocaleDateString('vi-VN'),
              status: (result?.status || 'pending').toLowerCase()
            }
            setData((prev) => [newRecord, ...prev])
            message.success('Tạo phiếu thành công')
            form.resetFields()
            setUploadFile(null)
            setFileList([])
            setCreateModalVisible(false)
          } catch (err) {
            if (err?.errorFields) {
              return
            }
            message.error(err.message || 'Tạo phiếu thất bại')
          } finally {
            setCreating(false)
          }
        }}
        destroyOnClose
      >
        <Form layout="vertical" form={form} initialValues={{ type: 'THU' }}>
          <Form.Item
            name="type"
            label="Loại phiếu"
            rules={[{ required: true, message: 'Vui lòng chọn loại phiếu' }]}
          >
            <Select options={[
              { value: 'THU', label: 'Thu' },
              { value: 'CHI', label: 'Chi' }
            ]} />
          </Form.Item>
          <Form.Item
            name="amount"
            label="Số tiền"
            rules={[
              { required: true, message: 'Vui lòng nhập số tiền' },
              { type: 'number', min: 1, message: 'Số tiền phải lớn hơn 0' }
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
              }
              parser={(value) => value?.replace(/\./g, '')}
            />
          </Form.Item>
          <Form.Item
            name="target"
            label="Đối tượng"
            rules={[{ required: true, message: 'Vui lòng nhập đối tượng' }]}
          >
            <Input placeholder="Nhà cung cấp A" />
          </Form.Item>
          <Form.Item
            name="description"
            label="Nội dung"
            rules={[{ required: true, message: 'Vui lòng nhập nội dung' }]}
          >
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item
            name="approvedByEmployeeId"
            label="Người duyệt (ID nhân viên)"
            rules={[{ required: true, message: 'Vui lòng nhập người duyệt' }]}
          >
            <Input placeholder="ID nhân viên" />
          </Form.Item>
          <Form.Item
            name="attachmentUrl"
            label="Link chứng từ (nếu có)"
          >
            <Input placeholder="https://example.com/file.pdf" />
          </Form.Item>
          <Form.Item label="Tệp chứng từ">
            <Upload
              beforeUpload={(file) => {
                setUploadFile(file)
                setFileList([{
                  uid: file.uid || file.name,
                  name: file.name,
                  status: 'done'
                }])
                return false
              }}
              onRemove={() => {
                setUploadFile(null)
                setFileList([])
              }}
              fileList={fileList}
            >
              <Button icon={<UploadOutlined />}>Chọn tệp</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}

export default function AccountanceFinance({ Layout = AccountanceLayout }) {
  const Wrapper = Layout || (({ children }) => <>{children}</>)
  return (
    <Wrapper>
      <AccountanceFinanceContent />
    </Wrapper>
  )
}

