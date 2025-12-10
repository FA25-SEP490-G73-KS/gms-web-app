import React, { useState, useEffect } from 'react'
import { Input, Button, Table, Select, message, InputNumber } from 'antd'
import { CloseOutlined, PlusOutlined } from '@ant-design/icons'
import { useLocation } from 'react-router-dom'
import WarehouseLayout from '../../layouts/WarehouseLayout'
import { goldTableHeader } from '../../utils/tableComponents'
import { partsAPI, employeesAPI, warehouseAPI } from '../../services/api'
import { getUserNameFromToken } from '../../utils/helpers'

const { Option } = Select

export default function CreateTicket() {
  const location = useLocation()
  const [formData, setFormData] = useState({
    ticketType: undefined,
    reason: '',
    receiver: undefined,
    creator: '',
    creatorName: ''
  })

  const [items, setItems] = useState([]) // Danh sách dòng linh kiện
  const [employees, setEmployees] = useState([])
  const [allParts, setAllParts] = useState([]) // Danh sách parts từ API
  const [searchingPart, setSearchingPart] = useState({}) // Track searching state for each row
  const [creating, setCreating] = useState(false) // Loading state khi tạo phiếu

  useEffect(() => {
    fetchEmployees()
    // Load parts ban đầu để có data cho dropdown
    loadInitialParts()
    
    // Lấy username từ JWT
    const username = getUserNameFromToken()
    if (username) {
      setFormData(prev => ({
        ...prev,
        creatorName: username
      }))
    }
  }, [])

  useEffect(() => {
    // Check if navigating from PartsList with part data
    if (location.state?.part && location.state?.ticketType === 'import') {
      const part = location.state.part
      
      // Set default ticket type to import
      setFormData(prev => ({
        ...prev,
        ticketType: 'import'
      }))

      // Add part to items table
      const partItem = {
        key: Date.now(),
        partId: part.id || part.partId,
        partName: part.name || '',
        ton: part.quantityOnHand || part.quantity || 0,
        reserved: part.reservedQuantity || 0,
        price: part.importPrice || part.purchasePrice || 0,
        quantity: 1,
        totalPrice: (part.importPrice || part.purchasePrice || 0) * 1,
        note: ''
      }
      setItems([partItem])
      
      // Ensure part is in allParts for dropdown
      if (part.id || part.partId) {
        const partExists = allParts.find(p => p.id === (part.id || part.partId))
        if (!partExists) {
          setAllParts(prev => [...prev, {
            id: part.id || part.partId,
            sku: part.sku || '',
            name: part.name || '',
            quantity: part.quantityOnHand || part.quantity || 0,
            reservedQuantity: part.reservedQuantity || 0,
            price: part.sellingPrice || 0,
            purchasePrice: part.importPrice || part.purchasePrice || 0,
            categoryName: part.categoryName || '',
            unitName: part.unit || part.unitName || 'cái',
            supplierName: part.supplierName || ''
          }])
        }
      }
    }
  }, [location.state])

  const loadInitialParts = async () => {
    const parts = await fetchParts('')
    setAllParts(parts)
  }

  const fetchEmployees = async () => {
    try {
      const { data, error } = await employeesAPI.getAll(0, 100)
      
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

  const fetchParts = async (keyword = '') => {
    try {
      const { data, error } = await partsAPI.getAll({ 
        page: 0, 
        size: 20,
        keyword: keyword || undefined
      })
      
      if (error) {
        console.error('Error fetching parts:', error)
        return []
      }

      const result = data?.result || {}
      const content = result.content || []
      
      return content.map((item) => ({
        id: item.partId,
        sku: item.sku,
        name: item.name,
        quantity: item.quantity || 0,
        reservedQuantity: item.reservedQuantity || 0,
        price: item.sellingPrice || 0,
        purchasePrice: item.purchasePrice || 0,
        categoryName: item.categoryName,
        unitName: item.unitName,
        supplierName: item.supplierName,
        marketName: item.marketName || 'VN'
      }))
    } catch (err) {
      console.error('Failed to fetch parts:', err)
      return []
    }
  }

  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Khi đổi loại phiếu, reset danh sách items
    if (field === 'ticketType') {
      setItems([])
    }
  }

  const handleAddItem = () => {
    const newItem = {
      key: Date.now(),
      partId: null,
      partName: '',
      ton: 0,
      reserved: 0,
      price: 0,
      quantity: 0,
      totalPrice: 0,
      note: ''
    }
    setItems([...items, newItem])
  }

  const handleRemoveItem = (key) => {
    setItems(items.filter(item => item.key !== key))
  }

  const handleItemChange = (key, field, value) => {
    setItems(items.map(item => {
      if (item.key === key) {
        const updated = { ...item, [field]: value }
        
        // Tính toán tự động cho phiếu nhập kho
        if (formData.ticketType === 'import') {
          if (field === 'price' || field === 'quantity') {
            updated.totalPrice = (updated.price || 0) * (updated.quantity || 0)
          }
        }
        
        return updated
      }
      return item
    }))
  }

  const handlePartSelect = async (key, partId) => {
    // Tìm part trong allParts
    const selectedPart = allParts.find(p => p.id === partId)
    
    if (selectedPart) {
      setItems(items.map(item => {
        if (item.key === key) {
          return {
            ...item,
            partId: selectedPart.id,
            partName: selectedPart.name,
            ton: selectedPart.quantity,
            reserved: selectedPart.reservedQuantity || 0,
            price: formData.ticketType === 'export' ? selectedPart.price : selectedPart.purchasePrice,
            totalPrice: formData.ticketType === 'import' 
              ? (selectedPart.purchasePrice || 0) * (item.quantity || 0)
              : 0
          }
        }
        return item
      }))
    }
  }

  const handleSearchPart = async (value, key) => {
    setSearchingPart(prev => ({ ...prev, [key]: true }))
    const parts = await fetchParts(value || '')
    setAllParts(parts)
    setSearchingPart(prev => ({ ...prev, [key]: false }))
  }

  const handleDropdownVisibleChange = async (open, key) => {
    // Khi mở dropdown, nếu chưa có data thì load
    if (open && allParts.length === 0) {
      setSearchingPart(prev => ({ ...prev, [key]: true }))
      const parts = await fetchParts('')
      setAllParts(parts)
      setSearchingPart(prev => ({ ...prev, [key]: false }))
    }
  }

  const handleCreateTicket = async () => {
    // Validation
    if (!formData.ticketType) {
      message.warning('Vui lòng chọn loại phiếu')
      return
    }
    
    if (!formData.reason) {
      message.warning('Vui lòng nhập lý do')
      return
    }
    
    if (!formData.receiver) {
      message.warning('Vui lòng chọn người nhận')
      return
    }
    
    if (!formData.creatorName) {
      message.warning('Vui lòng nhập người tạo')
      return
    }
    
    if (items.length === 0) {
      message.warning('Vui lòng thêm ít nhất 1 linh kiện')
      return
    }
    
    // Validate items
    for (let item of items) {
      if (!item.partId) {
        message.warning('Vui lòng chọn linh kiện cho tất cả các dòng')
        return
      }
      if (!item.quantity || item.quantity <= 0) {
        message.warning('Số lượng phải lớn hơn 0')
        return
      }
    }
    
    // Tìm receiverId từ tên
    const receiver = employees.find(emp => emp.fullName === formData.receiver)
    if (!receiver) {
      message.error('Không tìm thấy người nhận')
      return
    }
    
    // Build payload
    const payload = {
      type: formData.ticketType === 'export' ? 'EXPORT' : 'RECEIPT',
      reason: formData.reason,
      note: '', // Có thể thêm field note chung nếu cần
      receiverId: receiver.employeeId,
      createdBy: formData.creatorName,
      isDraft: false,
      supplierId: 0, // Có thể thêm field chọn supplier nếu cần
      items: items.map(item => {
        const part = allParts.find(p => p.id === item.partId)
        return {
          partId: item.partId,
          quantity: item.quantity,
          price: item.price || 0,
          totalPrice: formData.ticketType === 'import' ? item.totalPrice : (item.price * item.quantity),
          unit: part?.unitName || 'cái',
          note: item.note || ''
        }
      })
    }
    
    console.log('Creating ticket with payload:', payload)
    
    setCreating(true)
    try {
      const { data, error } = await warehouseAPI.createManualTransaction(payload)
      
      if (error) {
        message.error('Không thể tạo phiếu: ' + error)
        setCreating(false)
        return
      }
      
      message.success('Tạo phiếu thành công!')
      
      // Chỉ reset danh sách items, giữ nguyên thông tin chung
      setItems([])
      
    } catch (err) {
      console.error('Error creating ticket:', err)
      message.error('Đã xảy ra lỗi khi tạo phiếu')
    } finally {
      setCreating(false)
    }
  }

  // Columns cho phiếu xuất kho
  const exportColumns = [
    {
      title: 'STT',
      key: 'index',
      width: 60,
      align: 'center',
      render: (_, __, index) => index + 1
    },
    {
      title: 'Tên linh kiện',
      key: 'partName',
      width: 250,
      align: 'center',
      render: (_, record) => (
        <Select
          showSearch
          placeholder="Chọn linh kiện"
          value={record.partId}
          onChange={(value) => handlePartSelect(record.key, value)}
          onSearch={(value) => handleSearchPart(value, record.key)}
          onDropdownVisibleChange={(open) => handleDropdownVisibleChange(open, record.key)}
          loading={searchingPart[record.key]}
          filterOption={false}
          style={{ width: '100%' }}
          notFoundContent={searchingPart[record.key] ? 'Đang tải...' : 'Không tìm thấy linh kiện'}
          optionLabelProp="label"
        >
          {allParts.map(part => (
            <Option key={part.id} value={part.id} label={part.name}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'flex-start',
                width: '100%'
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontWeight: 600, 
                    fontSize: '14px', 
                    color: '#111',
                    marginBottom: '4px'
                  }}>
                    {part.name}
                  </div>
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#888',
                    marginTop: '2px'
                  }}>
                    Xuất xứ: {part.marketName || 'VN'}
                  </div>
                </div>
                <div style={{ 
                  fontSize: '14px', 
                  color: '#111',
                  fontWeight: 500,
                  marginLeft: '16px',
                  whiteSpace: 'nowrap'
                }}>
                  SL: {part.quantity || 0}
                </div>
              </div>
            </Option>
          ))}
        </Select>
      )
    },
    {
      title: 'Tồn',
      dataIndex: 'ton',
      key: 'ton',
      width: 80,
      align: 'center'
    },
    {
      title: 'Giữ',
      dataIndex: 'reserved',
      key: 'reserved',
      width: 80,
      align: 'center'
    },
    {
      title: 'SL xuất',
      key: 'quantity',
      width: 100,
      align: 'center',
      render: (_, record) => (
        <InputNumber
          min={0}
          max={record.ton}
          value={record.quantity}
          onChange={(value) => handleItemChange(record.key, 'quantity', value)}
          style={{ width: '100%' }}
        />
      )
    },
    {
      title: 'Ghi chú',
      key: 'note',
      width: 150,
      align: 'center',
      render: (_, record) => (
        <Input
          value={record.note}
          onChange={(e) => handleItemChange(record.key, 'note', e.target.value)}
          placeholder="Nhập ghi chú"
        />
      )
    },
    {
      key: 'action',
      width: 60,
      align: 'center',
      render: (_, record) => (
        <Button
          type="text"
          icon={<CloseOutlined />}
          onClick={() => handleRemoveItem(record.key)}
          style={{ color: '#ff4d4f' }}
        />
      )
    }
  ]

  // Columns cho phiếu nhập kho
  const importColumns = [
    {
      title: 'STT',
      key: 'index',
      width: 60,
      align: 'center',
      render: (_, __, index) => index + 1
    },
    {
      title: 'Tên linh kiện',
      key: 'partName',
      width: 250,
      align: 'center',
      render: (_, record) => (
        <Select
          showSearch
          placeholder="Chọn linh kiện"
          value={record.partId}
          onChange={(value) => handlePartSelect(record.key, value)}
          onSearch={(value) => handleSearchPart(value, record.key)}
          onDropdownVisibleChange={(open) => handleDropdownVisibleChange(open, record.key)}
          loading={searchingPart[record.key]}
          filterOption={false}
          style={{ width: '100%' }}
          notFoundContent={searchingPart[record.key] ? 'Đang tải...' : 'Không tìm thấy linh kiện'}
          optionLabelProp="label"
        >
          {allParts.map(part => (
            <Option key={part.id} value={part.id} label={part.name}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'flex-start',
                width: '100%'
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontWeight: 600, 
                    fontSize: '14px', 
                    color: '#111',
                    marginBottom: '4px'
                  }}>
                    {part.name}
                  </div>
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#888',
                    marginTop: '2px'
                  }}>
                    Xuất xứ: {part.marketName || 'VN'}
                  </div>
                </div>
                <div style={{ 
                  fontSize: '14px', 
                  color: '#111',
                  fontWeight: 500,
                  marginLeft: '16px',
                  whiteSpace: 'nowrap'
                }}>
                  SL: {part.quantity || 0}
                </div>
              </div>
            </Option>
          ))}
        </Select>
      )
    },
    {
      title: 'Đơn giá',
      key: 'price',
      width: 120,
      align: 'center',
      render: (_, record) => (
        <InputNumber
          min={0}
          value={record.price}
          onChange={(value) => handleItemChange(record.key, 'price', value)}
          formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
          parser={value => value.replace(/\$\s?|(,*)/g, '')}
          style={{ width: '100%' }}
        />
      )
    },
    {
      title: 'Thành tiền',
      dataIndex: 'totalPrice',
      key: 'totalPrice',
      width: 120,
      align: 'center',
      render: (price) => price ? `${price.toLocaleString('vi-VN')} ₫` : '0 ₫'
    },
    {
      title: 'SL cần mua',
      key: 'quantity',
      width: 100,
      align: 'center',
      render: (_, record) => (
        <InputNumber
          min={0}
          value={record.quantity}
          onChange={(value) => handleItemChange(record.key, 'quantity', value)}
          style={{ width: '100%' }}
        />
      )
    },
    {
      title: 'Ghi chú',
      key: 'note',
      width: 150,
      align: 'center',
      render: (_, record) => (
        <Input
          value={record.note}
          onChange={(e) => handleItemChange(record.key, 'note', e.target.value)}
          placeholder="Nhập ghi chú"
        />
      )
    },
    {
      key: 'action',
      width: 60,
      align: 'center',
      render: (_, record) => (
        <Button
          type="text"
          icon={<CloseOutlined />}
          onClick={() => handleRemoveItem(record.key)}
          style={{ color: '#ff4d4f' }}
        />
      )
    }
  ]

  const getColumns = () => {
    if (formData.ticketType === 'export') return exportColumns
    if (formData.ticketType === 'import') return importColumns
    return []
  }

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
                allowClear
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
                placeholder="Nhập lý do"
                value={formData.reason}
                onChange={(e) => handleFormChange('reason', e.target.value)}
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
                allowClear
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
                placeholder="Người tạo"
                value={formData.creatorName}
                disabled
                style={{ 
                  backgroundColor: '#f5f5f5',
                  color: '#00000073',
                  cursor: 'not-allowed'
                }}
              />
            </div>
          </div>
        </div>

        {/* Danh sách linh kiện - Chỉ hiện khi đã chọn loại phiếu */}
        {formData.ticketType && (
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
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAddItem}
                style={{
                  backgroundColor: '#CBB081',
                  borderColor: '#CBB081'
                }}
              >
                Thêm linh kiện
              </Button>
            </div>

            <Table
              columns={getColumns()}
              dataSource={items}
              pagination={false}
              size="middle"
              components={goldTableHeader}
              locale={{
                emptyText: 'Chưa có linh kiện nào. Nhấn "Thêm linh kiện" để bắt đầu.'
              }}
            />
          </div>
        )}

        {/* Action Button */}
        {formData.ticketType && (
          <div style={{ marginTop: '24px', textAlign: 'right' }}>
            <Button
              type="primary"
              size="large"
              onClick={handleCreateTicket}
              loading={creating}
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
        )}
      </div>
    </WarehouseLayout>
  )
}
