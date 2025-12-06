import React, { useState, useEffect } from 'react'
import { Card, Statistic, Row, Col, Typography, Table, Select, Spin, message, Dropdown, Modal, Form, Input, InputNumber, Checkbox, Button } from 'antd'
import { UserOutlined, AlertOutlined, DollarOutlined, FileTextOutlined, MoreOutlined, CloseOutlined } from '@ant-design/icons'
import WarehouseLayout from '../../layouts/WarehouseLayout'
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title as ChartTitle,
  Tooltip,
  Legend
} from 'chart.js'
import { goldTableHeader } from '../../utils/tableComponents'
import { dashboardAPI, partsAPI, unitsAPI } from '../../services/api'

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ChartTitle,
  Tooltip,
  Legend
)

const { Title } = Typography
const { Option } = Select

export default function WarehouseReport() {
  const [loading, setLoading] = useState(false)
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear())
  const [monthFilter, setMonthFilter] = useState(new Date().getMonth() + 1)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedPart, setSelectedPart] = useState(null)
  const [detailForm] = Form.useForm()
  const [units, setUnits] = useState([])
  const [dashboardData, setDashboardData] = useState({
    totalPartsInStock: 40,
    lowStockCount: 20,
    totalStockValue: 100000000,
    pendingQuotationsForWarehouse: 10,
    lowStockParts: [
      {
        partId: 1,
        sku: 'LOC-GIO-TOYOTA-CAMRY-2019',
        categoryName: 'Truyền động – Hộp số',
        unitName: 'cái',
        quantity: 50,
        reservedQuantity: 5,
        status: 'Sắp hết'
      },
      {
        partId: 2,
        sku: 'LOC-DAU-HONDA-CIVIC-2020',
        categoryName: 'Động cơ',
        unitName: 'cái',
        quantity: 30,
        reservedQuantity: 8,
        status: 'Sắp hết'
      },
      {
        partId: 3,
        sku: 'MA-PHANH-MAZDA-CX5-2021',
        categoryName: 'Hệ thống phanh',
        unitName: 'bộ',
        quantity: 15,
        reservedQuantity: 15,
        status: 'Hết hàng'
      },
      {
        partId: 4,
        sku: 'BUGI-TOYOTA-VIOS-2019',
        categoryName: 'Hệ thống điện',
        unitName: 'cái',
        quantity: 25,
        reservedQuantity: 5,
        status: 'Sắp hết'
      }
    ],
    monthCosts: [
      { month: 1, year: 2025, importCost: 75000000, exportCost: 65000000 },
      { month: 2, year: 2025, importCost: 110000000, exportCost: 90000000 },
      { month: 3, year: 2025, importCost: 145000000, exportCost: 120000000 },
      { month: 4, year: 2025, importCost: 220000000, exportCost: 190000000 },
      { month: 5, year: 2025, importCost: 310000000, exportCost: 280000000 },
      { month: 6, year: 2025, importCost: 340000000, exportCost: 310000000 },
      { month: 7, year: 2025, importCost: 420000000, exportCost: 390000000 },
      { month: 8, year: 2025, importCost: 360000000, exportCost: 330000000 },
      { month: 9, year: 2025, importCost: 450000000, exportCost: 410000000 },
      { month: 10, year: 2025, importCost: 380000000, exportCost: 350000000 },
      { month: 11, year: 2025, importCost: 540000000, exportCost: 490000000 },
      { month: 12, year: 2025, importCost: 575000000, exportCost: 520000000 }
    ],
    topImportedParts: [
      { partId: 1, partName: 'Má phanh', totalImportedQuantity: 80, unitName: 'bộ' },
      { partId: 2, partName: 'Dầu động cơ', totalImportedQuantity: 75, unitName: 'lít' },
      { partId: 3, partName: 'Lọc dầu', totalImportedQuantity: 70, unitName: 'cái' },
      { partId: 4, partName: 'Bugi', totalImportedQuantity: 85, unitName: 'cái' },
      { partId: 5, partName: 'Ắc quy', totalImportedQuantity: 65, unitName: 'cái' }
    ]
  })

  useEffect(() => {
    fetchDashboardData()
  }, [yearFilter, monthFilter])

  useEffect(() => {
    fetchUnits()
  }, [])

  const fetchUnits = async () => {
    try {
      const { data, error } = await unitsAPI.getAll({ page: 0, size: 20 })
      if (error) {
        console.error('Error fetching units:', error)
        return
      }
      
      const result = data?.result?.content || data?.content || []
      setUnits(Array.isArray(result) ? result : [])
    } catch (err) {
      console.error('Failed to fetch units:', err)
      setUnits([])
    }
  }

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const { data, error } = await dashboardAPI.getWarehouseOverview(yearFilter, monthFilter)
      
      if (error) {
        console.error('Error fetching dashboard:', error)
        // Giữ dữ liệu fake nếu API lỗi
        setLoading(false)
        return
      }

      const result = data?.result || {}
      
      // Chỉ cập nhật nếu có dữ liệu từ API
      if (result && Object.keys(result).length > 0) {
        setDashboardData({
          totalPartsInStock: result.totalPartsInStock || dashboardData.totalPartsInStock,
          lowStockCount: result.lowStockCount || dashboardData.lowStockCount,
          totalStockValue: result.totalStockValue || dashboardData.totalStockValue,
          pendingQuotationsForWarehouse: result.pendingQuotationsForWarehouse || dashboardData.pendingQuotationsForWarehouse,
          lowStockParts: result.lowStockParts && result.lowStockParts.length > 0 ? result.lowStockParts : dashboardData.lowStockParts,
          monthCosts: result.monthCosts && result.monthCosts.length > 0 ? result.monthCosts : dashboardData.monthCosts,
          topImportedParts: result.topImportedParts && result.topImportedParts.length > 0 ? result.topImportedParts : dashboardData.topImportedParts
        })
      }
    } catch (err) {
      console.error('Failed to fetch dashboard:', err)
      // Giữ dữ liệu fake nếu có exception
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDetail = async (partId) => {
    try {
      console.log('Opening detail for partId:', partId)
      const { data: response, error } = await partsAPI.getById(partId)
      console.log('API response:', response)
      console.log('API error:', error)
      
      if (!error && response?.result) {
        const detail = response.result
        console.log('Part detail loaded:', detail)
        
        // Ensure the detail has an id field
        const partData = {
          ...detail,
          id: detail.id || detail.partId || partId
        }
        
        setSelectedPart(partData)
        setModalOpen(true)
        
        detailForm.setFieldsValue({
          name: detail.name,
          origin: detail.marketName || detail.market,
          vehicleBrand: detail.categoryName,
          vehicleModel: detail.universal ? 'All' : (detail.modelName || ''),
          sellingPrice: detail.sellingPrice,
          importPrice: detail.purchasePrice,
          useForAllModels: detail.universal,
          unit: detail.unitId || detail.unitName
        })
      }
    } catch (err) {
      console.error('Error loading part detail:', err)
      message.error('Không thể tải chi tiết linh kiện')
    }
  }

  const handleUpdatePart = async (values) => {
    if (!selectedPart?.id) {
      message.error('Không tìm thấy thông tin linh kiện')
      return
    }

    const detail = selectedPart

    try {
      console.log('=== Update Part Payload ===')
      console.log('Selected Part:', selectedPart)
      console.log('Detail:', detail)
      console.log('Form Values:', values)
      
      // Parse all IDs to ensure they are numbers, not strings
      const parseId = (value) => {
        if (typeof value === 'number') return value
        const parsed = parseInt(value, 10)
        return isNaN(parsed) ? 1 : parsed
      }
      
      const payload = {
        name: values.name,
        marketId: parseId(detail.marketId || detail.market?.id || 1),
        categoryId: parseId(detail.categoryId || detail.category?.id || 1),
        purchasePrice: parseFloat(values.importPrice) || 0,
        sellingPrice: parseFloat(values.sellingPrice) || 0,
        reorderLevel: parseId(detail.reorderLevel || 0),
        unitId: parseId(values.unit || detail.unitId || detail.unit?.id || 1),
        universal: values.useForAllModels || false,
        specialPart: detail.specialPart || false,
        vehicleModelId: parseId(detail.vehicleModelId || detail.vehicleModel?.id || detail.modelId || 1),
        discountRate: parseFloat(detail.discountRate) || 0,
        note: values.note || ''
      }

      console.log('Final Payload:', JSON.stringify(payload, null, 2))
      console.log('===========================')

      const { data: response, error } = await partsAPI.update(selectedPart.id, payload)
      if (error || !response) {
        throw new Error(error || 'Cập nhật linh kiện không thành công.')
      }

      message.success('Cập nhật thành công')
      setModalOpen(false)
      detailForm.resetFields()
      setSelectedPart(null)
      fetchDashboardData()
    } catch (err) {
      console.error(err)
      message.error(err.message || 'Không thể cập nhật linh kiện')
    }
  }

  // Chuẩn bị dữ liệu cho bảng low stock parts
  const lowStockTableData = dashboardData.lowStockParts.map((item, index) => ({
    key: item.partId || index,
    partId: item.partId,
    sku: item.sku || '—',
    category: item.categoryName || '—',
    unit: item.unitName || '—',
    stock: item.quantity || 0,
    reserved: item.reservedQuantity || 0,
    status: item.status || 'Đủ hàng',
    supplierName: item.supplierName,
    reorderLevel: item.reorderLevel
  }))

  // Dữ liệu biểu đồ chi phí kho - từ monthCosts
  const monthLabels = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 
                       'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12']
  
  const importCostsByMonth = new Array(12).fill(0)
  const exportCostsByMonth = new Array(12).fill(0)
  
  dashboardData.monthCosts.forEach(item => {
    if (item.month >= 1 && item.month <= 12) {
      importCostsByMonth[item.month - 1] = item.importCost || 0
      exportCostsByMonth[item.month - 1] = item.exportCost || 0
    }
  })

  const warehouseCostData = {
    labels: monthLabels,
    datasets: [
      {
        label: 'Nhập',
        data: importCostsByMonth,
        backgroundColor: '#8B7355',
      },
      {
        label: 'Xuất',
        data: exportCostsByMonth,
        backgroundColor: '#D4B996',
      }
    ]
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        align: 'end',
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      }
    }
  }

  // Dữ liệu biểu đồ linh kiện nhập nhiều nhất - từ topImportedParts
  const topPartsLabels = dashboardData.topImportedParts.slice(0, 5).map(item => item.partName || '')
  const topPartsQuantities = dashboardData.topImportedParts.slice(0, 5).map(item => item.totalImportedQuantity || 0)

  const topPartsData = {
    labels: topPartsLabels.length > 0 ? topPartsLabels : ['Chưa có dữ liệu'],
    datasets: [
      {
        label: `Tháng ${monthFilter}`,
        data: topPartsQuantities.length > 0 ? topPartsQuantities : [0],
        backgroundColor: '#C9A961',
      }
    ]
  }

  const topPartsOptions = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        align: 'end',
      },
      title: {
        display: false,
      },
    },
    scales: {
      x: {
        beginAtZero: true,
      }
    }
  }

  // Cột cho bảng cảnh báo tồn kho thấp
  const columns = [
    {
      title: <div style={{ textAlign: 'center' }}>Mã SKU</div>,
      dataIndex: 'sku',
      key: 'sku',
      align: 'left',
    },
    {
      title: 'Danh mục',
      dataIndex: 'category',
      key: 'category',
      align: 'center',
    },
    {
      title: 'Đơn vị',
      dataIndex: 'unit',
      key: 'unit',
      align: 'center',
    },
    {
      title: 'Tồn kho',
      dataIndex: 'stock',
      key: 'stock',
      align: 'center',
    },
    {
      title: 'Đang giữ',
      dataIndex: 'reserved',
      key: 'reserved',
      align: 'center',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      align: 'center',
      render: (status) => {
        let color, backgroundColor, borderColor
        if (status === 'Hết hàng') {
          color = '#ff4d4f'
          backgroundColor = '#fff1f0'
          borderColor = '#ffa39e'
        } else if (status === 'Sắp hết' || status === 'Sắp xếp') {
          color = '#faad14'
          backgroundColor = '#fffbe6'
          borderColor = '#ffe58f'
        } else {
          color = '#52c41a'
          backgroundColor = '#f6ffed'
          borderColor = '#b7eb8f'
        }
        return (
          <span style={{
            color: color,
            backgroundColor: backgroundColor,
            border: `1px solid ${borderColor}`,
            borderRadius: '4px',
            padding: '2px 8px',
            fontSize: '12px',
            fontWeight: 500
          }}>
            {status}
          </span>
        )
      }
    },
    {
      title: '',
      key: 'action',
      align: 'center',
      width: 50,
      render: (_, record) => {
        const menuItems = [
          {
            key: 'detail',
            label: 'Xem chi tiết linh kiện',
            onClick: () => handleOpenDetail(record.partId)
          }
        ]
        
        return (
          <Dropdown
            menu={{ items: menuItems }}
            trigger={['click']}
            placement="bottomRight"
          >
            <MoreOutlined 
              style={{ 
                fontSize: '20px', 
                cursor: 'pointer',
                color: '#C9A961'
              }} 
            />
          </Dropdown>
        )
      }
    }
  ]

  return (
    <WarehouseLayout>
      <Spin spinning={loading}>
        <div style={{ padding: '24px 0' }}>
          {/* Filter Section */}
          <div style={{ marginBottom: 24, display: 'flex', gap: 16, justifyContent: 'flex-end' }}>
            <Select 
              value={yearFilter} 
              style={{ width: 120 }}
              onChange={(value) => setYearFilter(value)}
            >
              {[2023, 2024, 2025, 2026].map(year => (
                <Option key={year} value={year}>{year}</Option>
              ))}
            </Select>
            <Select 
              value={monthFilter} 
              style={{ width: 120 }}
              onChange={(value) => setMonthFilter(value)}
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                <Option key={month} value={month}>Tháng {month}</Option>
              ))}
            </Select>
          </div>

          {/* Statistics Cards */}
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col span={6}>
              <Card style={{ borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '8px',
                    backgroundColor: '#FFF7E6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <UserOutlined style={{ fontSize: '24px', color: '#C9A961' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', color: '#666' }}>Số lượng hàng tồn kho</div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{dashboardData.totalPartsInStock}</div>
                  </div>
              </div>
            </Card>
          </Col>
          <Col span={6}>
            <Card style={{ borderRadius: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '8px',
                  backgroundColor: '#FFF7E6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <AlertOutlined style={{ fontSize: '24px', color: '#C9A961' }} />
                </div>
                <div>
                  <div style={{ fontSize: '14px', color: '#666' }}>Cảnh báo tồn kho thấp</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{dashboardData.lowStockCount}</div>
                </div>
              </div>
            </Card>
          </Col>
          <Col span={6}>
            <Card style={{ borderRadius: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '8px',
                  backgroundColor: '#FFF7E6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <DollarOutlined style={{ fontSize: '24px', color: '#C9A961' }} />
                </div>
                <div>
                  <div style={{ fontSize: '14px', color: '#666' }}>Tổng số tiền tồn</div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
                    {dashboardData.totalStockValue.toLocaleString('vi-VN')} vnđ
                  </div>
                </div>
              </div>
            </Card>
          </Col>
          <Col span={6}>
            <Card style={{ borderRadius: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '8px',
                  backgroundColor: '#FFF7E6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <FileTextOutlined style={{ fontSize: '24px', color: '#C9A961' }} />
                </div>
                <div>
                  <div style={{ fontSize: '14px', color: '#666' }}>Số đơn cần xử lý</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{dashboardData.pendingQuotationsForWarehouse}</div>
                </div>
              </div>
            </Card>
          </Col>
        </Row>

        {/* Charts */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={16}>
            <Card 
              title="Tổng chi phí kho"
              style={{ borderRadius: '8px' }}
            >
              <div style={{ height: '300px' }}>
                <Bar data={warehouseCostData} options={chartOptions} />
              </div>
            </Card>
          </Col>
          <Col span={8}>
            <Card 
              title="Linh kiện nhập nhiều nhất"
              style={{ borderRadius: '8px' }}
            >
              <div style={{ height: '300px' }}>
                <Bar data={topPartsData} options={topPartsOptions} />
              </div>
            </Card>
          </Col>
        </Row>

        {/* Low Stock Alert Table */}
        <Card 
          title="Cảnh báo tồn kho thấp"
          style={{ borderRadius: '8px' }}
        >
          <Table 
            columns={columns} 
            dataSource={lowStockTableData}
            pagination={false}
            {...goldTableHeader}
          />
        </Card>
      </div>
      </Spin>

      {/* Modal Chi tiết linh kiện */}
      <Modal
        title={null}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        closable={false}
        footer={null}
        width={600}
        styles={{ body: { background: '#fff', padding: 0 } }}
      >
        {selectedPart && (
          <>
            <div
              style={{
                background: '#CBB081',
                padding: '16px 20px',
                margin: '-24px -24px 0 -24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <span style={{ fontWeight: 700, fontSize: 18, color: '#000' }}>CHI TIẾT LINH KIỆN</span>
              <CloseOutlined 
                style={{ cursor: 'pointer', fontSize: 16, color: '#000' }} 
                onClick={() => setModalOpen(false)} 
              />
            </div>

            <div style={{ padding: '24px 32px' }}>
              <Form layout="vertical" form={detailForm} onFinish={handleUpdatePart}>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item label="Mã SKU" style={{ marginBottom: 16 }}>
                      <Input 
                        value={selectedPart.sku}
                        disabled
                        style={{ backgroundColor: '#f5f5f5' }}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="Nhà cung cấp" style={{ marginBottom: 16 }}>
                      <Input 
                        value={selectedPart.supplierName || '—'}
                        disabled
                        style={{ backgroundColor: '#f5f5f5' }}
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item 
                  label="Tên linh kiện" 
                  name="name" 
                  style={{ marginBottom: 16 }}
                >
                  <Input />
                </Form.Item>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item label="Xuất xứ" name="origin" style={{ marginBottom: 16 }}>
                      <Select
                        placeholder="Chọn xuất xứ"
                        options={[
                          { value: 'VN', label: 'VN' },
                          { value: 'USA', label: 'USA' },
                          { value: 'China', label: 'China' },
                          { value: 'Japan', label: 'Japan' },
                          { value: 'Korea', label: 'Korea' }
                        ]}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="Số lượng tồn" style={{ marginBottom: 16 }}>
                      <Input 
                        value={selectedPart.quantity || 0}
                        disabled
                        style={{ backgroundColor: '#f5f5f5' }}
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item label="Lượng tối thiếu" style={{ marginBottom: 16 }}>
                      <Input 
                        value={selectedPart.reorderLevel || 0}
                        disabled
                        style={{ backgroundColor: '#f5f5f5' }}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="Đơn vị" name="unit" style={{ marginBottom: 16 }}>
                      <Select
                        placeholder="Chọn đơn vị"
                        showSearch
                        allowClear
                        filterOption={(input, option) =>
                          (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                        }
                        options={units.map(unit => ({
                          value: unit.id,
                          label: unit.name
                        }))}
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item name="useForAllModels" valuePropName="checked" style={{ marginBottom: 16 }}>
                  <Checkbox>Dùng chung</Checkbox>
                </Form.Item>

                <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => prevValues.useForAllModels !== currentValues.useForAllModels}>
                  {({ getFieldValue }) =>
                    !getFieldValue('useForAllModels') ? (
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item label="Hãng xe" name="vehicleBrand" style={{ marginBottom: 16 }}>
                            <Select
                              placeholder="Chọn hãng xe"
                              options={[
                                { value: 'Castrol', label: 'Castrol' },
                                { value: 'Toyota', label: 'Toyota' },
                                { value: 'Honda', label: 'Honda' },
                                { value: 'Mazda', label: 'Mazda' }
                              ]}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item label="Dòng xe" name="vehicleModel" style={{ marginBottom: 16 }}>
                            <Select
                              placeholder="Chọn dòng xe"
                              options={[
                                { value: 'All', label: 'All' },
                                { value: 'Camry', label: 'Camry' },
                                { value: 'Vios', label: 'Vios' },
                                { value: 'Civic', label: 'Civic' }
                              ]}
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                    ) : null
                  }
                </Form.Item>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item label="Giá nhập" name="importPrice" style={{ marginBottom: 16 }}>
                      <InputNumber 
                        min={0} 
                        style={{ width: '100%' }}
                        formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={value => value.replace(/\$\s?|(,*)/g, '')}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="Giá bán" name="sellingPrice" style={{ marginBottom: 16 }}>
                      <InputNumber 
                        min={0} 
                        style={{ width: '100%' }}
                        formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={value => value.replace(/\$\s?|(,*)/g, '')}
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <div style={{ display: 'flex', gap: 16, marginTop: 24, justifyContent: 'flex-end' }}>
                  <Button 
                    style={{
                      backgroundColor: '#C9A961',
                      color: '#fff',
                      border: 'none',
                      padding: '8px 40px',
                      height: 'auto',
                      fontSize: '14px',
                      fontWeight: 500
                    }}
                    onClick={() => setModalOpen(false)}
                  >
                    Nhập hàng
                  </Button>
                  <Button 
                    type="primary"
                    htmlType="submit"
                    style={{
                      backgroundColor: '#52c41a',
                      border: 'none',
                      padding: '8px 40px',
                      height: 'auto',
                      fontSize: '14px',
                      fontWeight: 500
                    }}
                  >
                    Lưu
                  </Button>
                </div>
              </Form>
            </div>
          </>
        )}
      </Modal>
    </WarehouseLayout>
  )
}
