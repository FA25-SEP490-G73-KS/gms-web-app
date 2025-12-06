import React, { useState, useEffect } from 'react'
import { Input, Button, Table, Select, message, Dropdown } from 'antd'
import { CloseOutlined } from '@ant-design/icons'
import WarehouseLayout from '../../layouts/WarehouseLayout'
import { goldTableHeader } from '../../utils/tableComponents'
import { partAPI, employeeAPI } from '../../services/api'

const { Option } = Select

export default function CreateTicket() {
  const [formData, setFormData] = useState({
    ticketType: '',
    receiver: '',
    creator: 'VD: Đặng Thị Huyền',
    creatorName: 'VD: Đặng Thị Huyền'
  })

  const [parts, setParts] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [dropdownVisible, setDropdownVisible] = useState({}) // Track dropdown visibility for each row
  const [selectedSuppliers, setSelectedSuppliers] = useState({}) // Track selected supplier for each part

  useEffect(() => {
    fetchParts()
    fetchEmployees()
  }, [page, pageSize])

  const fetchEmployees = async () => {
    try {
      const { data, error } = await employeeAPI.getAll(0, 100) // Lấy nhiều để có đủ danh sách
      
      if (error) {
        console.error('Error fetching employees:', error)
        return
      }

      const result = data?.result || {}
      const content = result.content || []
      
      setEmployees(content)
    } catch (err) {
      console.error('Failed to fetch employees:', err)
    }
  }

  const fetchParts = async () => {
    setLoading(true)
    try {
      const { data, error } = await partAPI.getAll(page - 1, pageSize)
      
      if (error) {
        message.error('Không thể tải danh sách linh kiện')
        setLoading(false)
        return
      }

      const result = data?.result || {}
      const content = result.content || []
      
      const transformedData = content.map((item, index) => ({
        key: item.partId,
        id: item.partId,
        sku: item.sku,
        name: item.name,
        ton: item.quantity || 0,
        price: item.sellingPrice || 0,
        quantity: 0, // Số lượng xuất mặc định 0
        note: item.note || '',
        categoryName: item.categoryName,
        unitName: item.unitName,
        supplierName: item.supplierName
      }))

      setParts(transformedData)
      setTotal(result.totalElements || 0)
      setLoading(false)
    } catch (err) {
      console.error('Failed to fetch parts:', err)
      message.error('Đã xảy ra lỗi khi tải dữ liệu')
      setLoading(false)
    }
  }

  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleRemovePart = (key) => {
    setParts(parts.filter(item => item.key !== key))
  }

  const handleAddPart = () => {
    message.info('Thêm linh kiện')
  }

  const handleCreateTicket = () => {
    console.log('Creating ticket:', formData, parts)
    message.success('Tạo phiếu thành công')
  }

  const columns = [
    {
      title: 'STT',
      key: 'index',
      width: 80,
      align: 'center',
      render: (_, __, index) => index + 1
    },
    {
      title: 'Tên linh kiện',
      dataIndex: 'name',
      key: 'name',
      width: 250,
      render: (name, record) => {
        // Tạo items cho dropdown menu - hiển thị thông tin chi tiết
        const items = [
          {
            key: 'supplier',
            label: (
              <div style={{ padding: '4px 0' }}>
                <div style={{ fontWeight: 500, marginBottom: '4px' }}>{record.supplierName || 'Không rõ'}</div>
                <div style={{ color: '#888', fontSize: '12px' }}>
                  {record.price ? `${record.price.toLocaleString('vi-VN')} ₫` : 'Chưa có giá'}
                </div>
              </div>
            )
          }
        ]

        return (
          <Dropdown
            menu={{ items }}
            trigger={['click']}
            placement="bottomLeft"
            open={dropdownVisible[record.id]}
            onOpenChange={(visible) => {
              setDropdownVisible(prev => ({
                ...prev,
                [record.id]: visible
              }))
            }}
          >
            <div style={{ cursor: 'pointer' }}>
              {name}
            </div>
          </Dropdown>
        )
      }
    },
    {
      title: 'Tồn',
      dataIndex: 'ton',
      key: 'ton',
      width: 100,
      align: 'center'
    },
    {
      title: 'Giá',
      dataIndex: 'price',
      key: 'price',
      width: 150,
      align: 'right',
      render: (price) => price ? `${price.toLocaleString('vi-VN')} ₫` : '---'
    },
    {
      title: 'SL xuất',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      align: 'center'
    },
    {
      title: 'Ghi chú',
      dataIndex: 'note',
      key: 'note',
      width: 150
    },
    {
      key: 'action',
      width: 80,
      align: 'center',
      render: (_, record) => (
        <Button
          type="text"
          icon={<CloseOutlined />}
          onClick={() => handleRemovePart(record.key)}
          style={{ color: '#ff4d4f' }}
        />
      )
    }
  ]

  return (
    <WarehouseLayout>
      <div style={{ padding: '24px' }}>


        {/* Thông tin chung */}
        <div style={{
          backgroundColor: '#fff',
          padding: '24px',
          borderRadius: '8px',
          marginBottom: '24px',
          border: '1px solid #e8e8e8'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>
            Thông tin chung
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {/* Loại phiếu */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                Loại phiếu <span style={{ color: 'red' }}>*</span>
              </label>
              <Select
                placeholder="Chọn loại phiếu"
                value={formData.ticketType}
                onChange={(value) => handleFormChange('ticketType', value)}
                style={{ width: '100%' }}
              >
                <Option value="export">Phiếu xuất kho</Option>
                <Option value="import">Phiếu nhập kho</Option>
              </Select>
            </div>

            {/* Lý do */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                Lý do <span style={{ color: 'red' }}>*</span>
              </label>
              <Input
                placeholder="Chọn lý do"
                value={formData.receiver}
                onChange={(e) => handleFormChange('receiver', e.target.value)}
              />
            </div>

            {/* Người nhận */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                Người nhận <span style={{ color: 'red' }}>*</span>
              </label>
              <Select
                placeholder="Chọn người nhận"
                value={formData.receiver}
                onChange={(value) => handleFormChange('receiver', value)}
                style={{ width: '100%' }}
                showSearch
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
              >
                {employees.map(emp => (
                  <Option key={emp.employeeId} value={emp.fullName} label={emp.fullName}>
                    {emp.fullName}
                  </Option>
                ))}
              </Select>
            </div>

            {/* Người tạo */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                Người tạo <span style={{ color: 'red' }}>*</span>
              </label>
              <Input
                placeholder="VD: Đặng Thị Huyền"
                value={formData.creatorName}
                onChange={(e) => handleFormChange('creatorName', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Danh sách linh kiện */}
        <div style={{
          backgroundColor: '#fff',
          padding: '24px',
          borderRadius: '8px',
          border: '1px solid #e8e8e8'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>
              Danh sách linh kiện
            </h2>
            <Button
              type="link"
              onClick={handleAddPart}
              style={{ padding: 0 }}
            >
              Thêm linh kiện
            </Button>
          </div>

          <Table
            columns={columns}
            dataSource={parts}
            loading={loading}
            pagination={{
              current: page,
              pageSize,
              total,
              onChange: (newPage) => setPage(newPage),
              showSizeChanger: false,
              showTotal: (total) => `Tổng số ${total} linh kiện`
            }}
            size="middle"
            components={goldTableHeader}
          />
        </div>

        {/* Action Button */}
        <div style={{ marginTop: '24px', textAlign: 'right' }}>
          <Button
            type="primary"
            size="large"
            onClick={handleCreateTicket}
            style={{
              backgroundColor: '#52c41a',
              borderColor: '#52c41a',
              minWidth: '150px',
              height: '45px',
              fontSize: '16px',
              fontWeight: 500
            }}
          >
            Tạo phiếu
          </Button>
        </div>
      </div>
    </WarehouseLayout>
  )
}
