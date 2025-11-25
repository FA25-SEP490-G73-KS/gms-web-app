import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Table, Input, Button, Space, Tag, message, Popconfirm } from 'antd'
import { SearchOutlined, PlusOutlined } from '@ant-design/icons'
import ManagerLayout from '../../layouts/ManagerLayout'
import { goldTableHeader } from '../../utils/tableComponents'
import { suppliersAPI } from '../../services/api'
import '../../styles/pages/manager/suppliers.css'

const STATUS_CONFIG = {
  active: { color: '#1f8f4d', bg: '#eafff5', text: 'Hoạt động' },
  inactive: { color: '#ef4444', bg: '#fef2f2', text: 'Ngưng hoạt động' }
}

const statusFilters = [
  { key: 'all', label: 'Tất cả' },
  { key: 'active', label: 'Hoạt động' },
  { key: 'inactive', label: 'Ngưng hoạt động' }
]

const fallbackSuppliers = [
  {
    id: 1,
    name: 'SupplierA',
    phone: '0913345432',
    email: 'SupplierA@gmail.com',
    address: 'Thạch Thất, Hà Nội',
    totalImports: 10,
    isActive: true
  },
  {
    id: 2,
    name: 'SupplierB',
    phone: '0913345431',
    email: 'SupplierB@gmail.com',
    address: 'Thạch Thất, Hà Nội',
    totalImports: 10,
    isActive: false
  },
  {
    id: 3,
    name: 'SupplierC',
    phone: '0913345430',
    email: 'SupplierC@gmail.com',
    address: 'Thạch Thất, Hà Nội',
    totalImports: 10,
    isActive: true
  },
  {
    id: 4,
    name: 'SupplierD',
    phone: '0913345433',
    email: 'SupplierD@gmail.com',
    address: 'Thạch Thất, Hà Nội',
    totalImports: 10,
    isActive: true
  }
]

const formatSupplier = (supplier, index) => {
  return {
    id: supplier.id || `supplier-${index}`,
    name: supplier.name || 'Không rõ',
    phone: supplier.phone || supplier.phoneNumber || '—',
    email: supplier.email || '—',
    address: supplier.address || '—',
    totalImports: supplier.totalImports || supplier.totalImportOrders || 0,
    isActive: supplier.isActive !== undefined ? supplier.isActive : true
  }
}

export default function ManagerSuppliers() {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [suppliers, setSuppliers] = useState(fallbackSuppliers)
  const [total, setTotal] = useState(fallbackSuppliers.length)
  const [loading, setLoading] = useState(false)
  const didInit = useRef(false)
  const navigate = useNavigate()

  const fetchSuppliers = useCallback(
    async (pageIndex = 0, size = 10) => {
      setLoading(true)
      try {
        const { data, error } = await suppliersAPI.getAll(pageIndex, size)
        if (error) {
          throw new Error(error)
        }
        const payload = data?.result || data?.data || data
        const list = Array.isArray(payload)
          ? payload
          : payload?.content || payload?.items || payload?.records || []
        setSuppliers(list.map((item, idx) => formatSupplier(item, idx)))
        setTotal(payload?.totalElements || payload?.total || payload?.totalItems || list.length)
        setPage(pageIndex + 1)
        setPageSize(size)
      } catch (err) {
        message.error(err.message || 'Không thể tải danh sách nhà cung cấp')
        setSuppliers(fallbackSuppliers)
        setTotal(fallbackSuppliers.length)
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
      fetchSuppliers(0, pageSize)
      didInit.current = true
    }
  }, [fetchSuppliers, pageSize])

  const filtered = useMemo(() => {
    return suppliers
      .filter((supplier) => {
        const matchesQuery =
          !query ||
          supplier.name.toLowerCase().includes(query.toLowerCase()) ||
          supplier.phone.includes(query) ||
          supplier.email.toLowerCase().includes(query.toLowerCase())
        const matchesStatus =
          status === 'all' ||
          (status === 'active' && supplier.isActive) ||
          (status === 'inactive' && !supplier.isActive)
        return matchesQuery && matchesStatus
      })
      .map((supplier, index) => ({ ...supplier, key: supplier.id, index: index + 1 }))
  }, [suppliers, query, status])

  const columns = [
    {
      title: 'Tên',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (text) => <span style={{ fontWeight: 600 }}>{text}</span>
    },
    {
      title: 'SĐT',
      dataIndex: 'phone',
      key: 'phone',
      width: 150
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: 220
    },
    {
      title: 'Địa chỉ',
      dataIndex: 'address',
      key: 'address',
      width: 200
    },
    {
      title: 'Tổng đơn nhập',
      dataIndex: 'totalImports',
      key: 'totalImports',
      width: 150,
      align: 'center',
      render: (value) => <span style={{ fontWeight: 600 }}>{value}</span>
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      key: 'status',
      width: 160,
      render: (isActive) => {
        const statusKey = isActive ? 'active' : 'inactive'
        const config = STATUS_CONFIG[statusKey]
        return (
          <Tag
            style={{
              color: config.color,
              background: config.bg,
              borderColor: config.color,
              borderRadius: 999,
              fontWeight: 600,
              padding: '4px 12px'
            }}
          >
            {config.text}
          </Tag>
        )
      }
    },
    {
      title: '',
      key: 'actions',
      width: 160,
      render: (_, record) =>
        typeof record.id === 'number' ? (
          <Space>
            <Button type="link" onClick={() => navigate(`/manager/suppliers/${record.id}/edit`)}>
              Sửa
            </Button>
            <Popconfirm
              title="Xóa nhà cung cấp?"
              description="Hệ thống sẽ vô hiệu hóa nhà cung cấp này."
              okText="Xóa"
              cancelText="Hủy"
              onConfirm={async () => {
                try {
                  const { error } = await suppliersAPI.remove(record.id)
                  if (error) {
                    throw new Error(error)
                  }
                  message.success('Đã xóa nhà cung cấp')
                  fetchSuppliers(page - 1, pageSize)
                } catch (err) {
                  message.error(err.message || 'Không thể xóa nhà cung cấp')
                }
              }}
            >
              <Button type="link" danger>
                Xóa
              </Button>
            </Popconfirm>
          </Space>
        ) : null
    }
  ]

  return (
    <ManagerLayout>
      <div className="suppliers-page">
        <div className="suppliers-header">
          <div className="suppliers-title">
            <i className="bi bi-truck" style={{ marginRight: '8px', fontSize: '20px' }} />
            <h1>Nhà cung cấp</h1>
          </div>
          <div className="suppliers-actions">
            <Input
              prefix={<SearchOutlined />}
              placeholder="Tìm kiếm"
              allowClear
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="suppliers-search"
              style={{ width: 300 }}
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              className="add-supplier-btn"
              style={{
                background: '#22c55e',
                borderColor: '#22c55e',
                borderRadius: '8px',
                fontWeight: 600
              }}
              onClick={() => navigate('/manager/suppliers/create')}
            >
              Thêm nhà cung cấp
            </Button>
          </div>
        </div>

        <div className="suppliers-filters">
          <Space>
            {statusFilters.map((filter) => (
              <Button
                key={filter.key}
                type={status === filter.key ? 'primary' : 'default'}
                onClick={() => setStatus(filter.key)}
                className={status === filter.key ? 'status-btn active' : 'status-btn'}
                style={{
                  borderRadius: '8px',
                  fontWeight: 600
                }}
              >
                {filter.label}
              </Button>
            ))}
          </Space>
        </div>

        <div className="suppliers-table-card">
          <Table
            className="suppliers-table"
            columns={columns}
            dataSource={filtered}
            loading={loading}
            pagination={{
              pageSize: pageSize,
              current: page,
              total: total,
              showTotal: (total) => `Tổng ${total} bản ghi`,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50', '100'],
              onChange: (p, size) => {
                fetchSuppliers(p - 1, size)
              },
              onShowSizeChange: (_, size) => {
                fetchSuppliers(0, size)
              }
            }}
            components={goldTableHeader}
          />
        </div>
      </div>
    </ManagerLayout>
  )
}


