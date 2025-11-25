import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Table, Input, Button, Tag, Space, message } from 'antd'
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons'
import ManagerLayout from '../../layouts/ManagerLayout'
import { customersAPI } from '../../services/api'
import { goldTableHeader } from '../../utils/tableComponents'

const loyaltyConfig = {
  BRONZE: { color: '#a97155', text: 'Bronze' },
  SILVER: { color: '#c0c0c0', text: 'Silver' },
  GOLD: { color: '#d4af37', text: 'Gold' },
  PLATINUM: { color: '#4f8cff', text: 'Platinum' }
}

const fallbackCustomers = [
  {
    id: 'KH-001',
    fullName: 'Doanh Nghiệp A',
    phone: '0909123456',
    address: '12 Nguyễn Huệ, Quận 1, TP.HCM',
    loyaltyLevel: 'GOLD',
    customerType: 'DOANH_NGHIEP'
  },
  {
    id: 'KH-002',
    fullName: 'Nguyễn Văn Minh',
    phone: '0987123456',
    address: '25 Lý Thường Kiệt, Hà Nội',
    loyaltyLevel: 'SILVER',
    customerType: 'CA_NHAN'
  }
]

const formatCustomer = (customer, index) => ({
  id: customer.customerId ?? customer.id ?? null,
  fullName: customer.fullName || customer.name || 'Không rõ',
  phone: customer.phone || customer.phoneNumber || '—',
  address: customer.address || '—',
  loyaltyLevel: (customer.loyaltyLevel || 'BRONZE').toUpperCase(),
  customerType: customer.customerType || 'CA_NHAN'
})

export default function ManagerCustomers() {
  const [query, setQuery] = useState('')
  const [customers, setCustomers] = useState(fallbackCustomers)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(fallbackCustomers.length)
  const didInit = useRef(false)
  const navigate = useNavigate()

  const fetchCustomers = useCallback(
    async (pageIndex = 0, size = 10) => {
      setLoading(true)
      try {
        const { data, error } = await customersAPI.getAll(pageIndex, size)
        if (error) {
          throw new Error(error)
        }
        const payload = data?.result || data?.data || data
        const list = Array.isArray(payload)
          ? payload
          : payload?.content || payload?.items || payload?.records || []
        setCustomers(list.map((item, idx) => formatCustomer(item, idx)))
        setTotal(
          payload?.totalElements ||
            payload?.total ||
            payload?.totalItems ||
            list.length
        )
        setPage(pageIndex + 1)
        setPageSize(size)
      } catch (err) {
        message.error(err.message || 'Không thể tải danh sách khách hàng')
        setCustomers(fallbackCustomers)
        setTotal(fallbackCustomers.length)
        setPage(1)
        setPageSize(10)
      } finally {
        setLoading(false)
      }
    },
    []
  )

  useEffect(() => {
    if (!didInit.current) {
      fetchCustomers(0, pageSize)
      didInit.current = true
    }
  }, [fetchCustomers, pageSize])

  const filtered = useMemo(() => {
    return customers
      .filter((customer) => {
        if (!query) return true
        const lowerQuery = query.toLowerCase()
        return (
          customer.fullName.toLowerCase().includes(lowerQuery) ||
          customer.phone.includes(lowerQuery) ||
          customer.address.toLowerCase().includes(lowerQuery)
        )
      })
      .map((customer, index) => ({
        ...customer,
        key: customer.id ?? `customer-${index}`,
        index: index + 1,
      }))
  }, [customers, query])

  const columns = [
    {
      title: 'STT',
      dataIndex: 'index',
      key: 'index',
      width: 70,
      render: (_, __, index) => (
        <span style={{ fontWeight: 600 }}>{String(index + 1).padStart(2, '0')}</span>
      )
    },
    {
      title: 'Khách hàng',
      dataIndex: 'fullName',
      key: 'fullName',
      width: 240,
      render: (_, record) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: 600 }}>{record.fullName}</span>
          <span style={{ color: '#667085', fontSize: 13 }}>{record.phone}</span>
        </div>
      )
    },
    {
      title: 'Loại khách hàng',
      dataIndex: 'customerType',
      key: 'customerType',
      width: 160,
      render: (value) =>
        value === 'DOANH_NGHIEP' ? 'Doanh nghiệp' : 'Cá nhân'
    },
    {
      title: 'Hạng thành viên',
      dataIndex: 'loyaltyLevel',
      key: 'loyaltyLevel',
      width: 160,
      render: (value) => {
        const config = loyaltyConfig[value] || loyaltyConfig.BRONZE
        return (
          <Tag
            style={{
              borderRadius: 999,
              padding: '2px 12px',
              fontWeight: 600,
              borderColor: config.color,
              color: config.color,
              background: 'transparent'
            }}
          >
            {config.text}
          </Tag>
        )
      }
    },
    {
      title: 'Địa chỉ',
      dataIndex: 'address',
      key: 'address'
    },
    {
      title: '',
      key: 'action',
      width: 90,
      render: (_, record) => (
        <Button
          type="link"
          disabled={!record.id}
          onClick={() => record.id && navigate(`/manager/customers/${record.id}`)}
        >
          Xem
        </Button>
      ),
    },
  ]

  return (
    <ManagerLayout>
      <div style={{ padding: 24, minHeight: '100vh', background: '#f5f7fb' }}>
        <div
          style={{
            background: '#fff',
            borderRadius: 16,
            padding: 24,
            boxShadow: '0 12px 30px rgba(15, 23, 42, 0.08)'
          }}
        >
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              gap: 12,
              marginBottom: 20
            }}
          >
            <div>
              <h2 style={{ margin: 0 }}>Danh sách khách hàng</h2>
              <p style={{ margin: 0, color: '#667085' }}>
                Dữ liệu được lấy từ API `/api/customers`
              </p>
            </div>
            <Space wrap>
              <Input
                allowClear
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                prefix={<SearchOutlined />}
                placeholder="Tìm theo tên, số điện thoại, địa chỉ"
                style={{ width: 280 }}
              />
              <Button
                icon={<ReloadOutlined />}
                onClick={() => fetchCustomers(page - 1, pageSize)}
              >
                Làm mới
              </Button>
            </Space>
          </div>

          <Table
            className="manager-customers-table"
            columns={columns}
            dataSource={filtered}
            loading={loading}
            components={goldTableHeader}
            pagination={{
              current: page,
              pageSize,
              total,
              showSizeChanger: true,
              showTotal: (t) => `Tổng ${t} khách hàng`,
              pageSizeOptions: ['10', '20', '50', '100'],
              onChange: (current, size) => fetchCustomers(current - 1, size)
            }}
            onRow={(record) => ({
              onDoubleClick: () => record.id && navigate(`/manager/customers/${record.id}`),
            })}
          />
        </div>
      </div>
    </ManagerLayout>
  )
}

