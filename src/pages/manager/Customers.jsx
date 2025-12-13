import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Table, Input, Button, Tag, Space, message, Dropdown, Modal } from 'antd'
import { SearchOutlined, ReloadOutlined, MoreOutlined } from '@ant-design/icons'
import ManagerLayout from '../../layouts/ManagerLayout'
import { customersAPI } from '../../services/api'
import { goldTableHeader } from '../../utils/tableComponents'

const loyaltyConfig = {
  BRONZE: { color: '#a97155', text: 'Bronze' },
  SILVER: { color: '#c0c0c0', text: 'Silver' },
  GOLD: { color: '#d4af37', text: 'Gold' },
  PLATINUM: { color: '#4f8cff', text: 'Platinum' }
}

const formatCustomer = (customer, index) => ({
  id: customer.customerId ?? customer.id ?? null,
  fullName: customer.fullName || customer.name || 'Không rõ',
  phone: customer.phone || customer.phoneNumber || '—',
  address: customer.address || '—',
  loyaltyLevel: (customer.loyaltyLevel || 'BRONZE').toUpperCase(),
  customerType: customer.customerType || 'CA_NHAN',
  isActive: customer.isActive === true
})

export default function ManagerCustomers() {
  const [query, setQuery] = useState('')
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [statusFilter, setStatusFilter] = useState('all')
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
        setCustomers([])
        setTotal(0)
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
        // Filter by search query
        const matchesQuery = !query || (
          customer.fullName.toLowerCase().includes(query.toLowerCase()) ||
          customer.phone.includes(query) ||
          customer.address.toLowerCase().includes(query.toLowerCase())
        )
        
        // Filter by status
        const matchesStatus = 
          statusFilter === 'all' ||
          (statusFilter === 'active' && customer.isActive) ||
          (statusFilter === 'inactive' && !customer.isActive)
        
        return matchesQuery && matchesStatus
      })
      .map((customer, index) => ({
        ...customer,
        key: customer.id ?? `customer-${index}`,
        index: index + 1,
      }))
  }, [customers, query, statusFilter])

  const handleToggleStatus = (record) => {
    const actionText = record.isActive ? 'ngưng hoạt động' : 'kích hoạt'
    Modal.confirm({
      title: `Xác nhận ${actionText} tài khoản`,
      content: `Bạn có chắc chắn muốn ${actionText} tài khoản của ${record.fullName}?`,
      okText: 'Xác nhận',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          const { data, error } = await customersAPI.toggleActive(record.id)
          
          if (error) {
            message.error(`Không thể ${actionText} tài khoản`)
            return
          }
          
          message.success(`${actionText.charAt(0).toUpperCase() + actionText.slice(1)} tài khoản thành công`)
          await fetchCustomers(page - 1, pageSize)
        } catch (error) {
          console.error('Toggle customer status error:', error)
          message.error(`Không thể ${actionText} tài khoản`)
        }
      }
    })
  }

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
      title: 'Trạng thái',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 140,
      align: 'center',
      render: (isActive) => (
        <Tag
          style={{
            borderRadius: 999,
            padding: '4px 12px',
            fontWeight: 600,
            borderColor: isActive ? '#10b981' : '#ef4444',
            color: isActive ? '#10b981' : '#ef4444',
            background: isActive ? '#d1fae5' : '#fee2e2'
          }}
        >
          {isActive ? 'Hoạt động' : 'Ngưng hoạt động'}
        </Tag>
      )
    },
    {
      title: '',
      key: 'action',
      width: 60,
      align: 'center',
      render: (_, record) => {
        const items = [
          {
            key: 'view',
            label: 'Xem chi tiết',
            onClick: () => record.id && navigate(`/manager/customers/${record.id}`)
          },
          {
            key: 'toggle',
            label: record.isActive ? 'Ngưng hoạt động' : 'Kích hoạt',
            onClick: () => handleToggleStatus(record)
          }
        ]

        return (
          <Dropdown
            menu={{ items }}
            trigger={['click']}
            placement="bottomRight"
          >
            <Button
              type="text"
              icon={<MoreOutlined style={{ fontSize: 20 }} />}
              style={{ padding: '4px 8px' }}
            />
          </Dropdown>
        )
      },
    },
  ]

  return (
    <ManagerLayout>
      <div style={{ padding: 24, minHeight: '100vh' }}>
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
              alignItems: 'center',
              gap: 12,
              marginBottom: 20
            }}
          >
            <Input
              allowClear
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              prefix={<SearchOutlined />}
              placeholder="Tìm kiếm"
              style={{ width: 280 }}
            />
            
            <Space wrap>
              <Button
                type={statusFilter === 'all' ? 'primary' : 'default'}
                onClick={() => setStatusFilter('all')}
                style={{
                  background: statusFilter === 'all' ? '#CBB081' : '#fff',
                  borderColor: statusFilter === 'all' ? '#CBB081' : '#d9d9d9',
                  color: statusFilter === 'all' ? '#fff' : '#666',
                  fontWeight: 500,
                  borderRadius: 6
                }}
              >
                Tất cả
              </Button>
              <Button
                type={statusFilter === 'active' ? 'primary' : 'default'}
                onClick={() => setStatusFilter('active')}
                style={{
                  background: statusFilter === 'active' ? '#CBB081' : '#fff',
                  borderColor: statusFilter === 'active' ? '#CBB081' : '#d9d9d9',
                  color: statusFilter === 'active' ? '#fff' : '#666',
                  fontWeight: 500,
                  borderRadius: 6
                }}
              >
                Hoạt động
              </Button>
              <Button
                type={statusFilter === 'inactive' ? 'primary' : 'default'}
                onClick={() => setStatusFilter('inactive')}
                style={{
                  background: statusFilter === 'inactive' ? '#CBB081' : '#fff',
                  borderColor: statusFilter === 'inactive' ? '#CBB081' : '#d9d9d9',
                  color: statusFilter === 'inactive' ? '#fff' : '#666',
                  fontWeight: 500,
                  borderRadius: 6
                }}
              >
                Ngưng hoạt động
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

