import React, { useEffect, useMemo, useState } from 'react'
import { Table, Input, Space, Button, DatePicker, Tag, Card, message, Modal } from 'antd'
import { SearchOutlined, CalendarOutlined, DownOutlined, UpOutlined } from '@ant-design/icons'
import WarehouseLayout from '../../layouts/WarehouseLayout'
import { stockExportAPI, employeeAPI } from '../../services/api'
import { goldTableHeader } from '../../utils/tableComponents'

const { Search } = Input

/**
 * Màn "Xuất linh kiện" cho kho.
 * Dữ liệu lấy từ API /api/stock-exports (stockExportAPI.getAll).
 */
export default function ExportParts() {
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState(null)
  const [statusFilter, setStatusFilter] = useState('Tất cả')
  const [expandedRowKeys, setExpandedRowKeys] = useState([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [exportList, setExportList] = useState([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [exportModalOpen, setExportModalOpen] = useState(false)
  const [selectedPart, setSelectedPart] = useState(null)
  const [exportQuantity, setExportQuantity] = useState(0)
  const [technicians, setTechnicians] = useState([])
  const [techniciansLoading, setTechniciansLoading] = useState(false)
  const [selectedTechnicianId, setSelectedTechnicianId] = useState(null)
  const [exportSubmitting, setExportSubmitting] = useState(false)
  const [historyModalOpen, setHistoryModalOpen] = useState(false)
  const [selectedHistory, setSelectedHistory] = useState(null)

  useEffect(() => {
    fetchStockExports()
  }, [page, pageSize])

  // Load danh sách kỹ thuật viên khi mở modal lần đầu
  useEffect(() => {
    if (exportModalOpen && technicians.length === 0 && !techniciansLoading) {
      ;(async () => {
        setTechniciansLoading(true)
        try {
          const { data, error } = await employeeAPI.getTechnicians()
          if (error) {
            console.error('Failed to fetch technicians:', error)
          } else {
            const list = data?.result || data || []
            setTechnicians(list)
          }
        } catch (err) {
          console.error('Failed to fetch technicians:', err)
        } finally {
          setTechniciansLoading(false)
        }
      })()
    }
  }, [exportModalOpen, technicians.length, techniciansLoading])

  const fetchStockExports = async () => {
    setLoading(true)
    try {
      const { data, error } = await stockExportAPI.getAll(page - 1, pageSize)

      if (error) {
        message.error('Không thể tải danh sách xuất linh kiện')
        setLoading(false)
        return
      }

      const result = data?.result || {}
      const content = result.content || []

      const transformedData = content.map((item, idx) => ({
        id: item.priceQuotationId || item.id || idx,
        code: item.priceQuotationCode || item.code || 'N/A',
        customer: item.customerName || 'N/A',
        licensePlate: item.licensePlate || 'N/A',
        // Backend đã trả sẵn dạng dd/MM/yyyy nên dùng trực tiếp, fallback sang format locale nếu cần
        createDate: item.createdAt || 'N/A',
        status: item.exportStatus || 'Chờ xuất hàng',
        parts: [], // sẽ được load chi tiết theo stock-exports/{id} nếu cần trong tương lai
      }))

      setExportList(transformedData)
      setTotal(result.totalElements || transformedData.length)
    } catch (err) {
      console.error('Failed to fetch stock exports:', err)
      message.error('Đã xảy ra lỗi khi tải dữ liệu')
    } finally {
      setLoading(false)
    }
  }

  const getStatusConfig = (status) => {
    if (status === 'Hoàn thành') {
      return {
        color: '#22c55e',
        bgColor: '#f6ffed',
        borderColor: '#b7eb8f',
        text: status,
      }
    }
    if (status === 'Đang xuất hàng') {
      return {
        color: '#1677ff',
        bgColor: '#e6f4ff',
        borderColor: '#91caff',
        text: status,
      }
    }
    if (status === 'Chờ xuất hàng') {
      return {
        color: '#f97316',
        bgColor: '#fff7ed',
        borderColor: '#fed7aa',
        text: status,
      }
    }
    return {
      color: '#666',
      bgColor: '#fafafa',
      borderColor: '#d9d9d9',
      text: status,
    }
  }

  const loadQuotationParts = async (quotationId) => {
    try {
      const { data, error } = await stockExportAPI.getQuotationDetail(quotationId)

      if (error) {
        message.error(error || 'Không thể tải chi tiết xuất linh kiện')
        return null
      }

      const items = data?.result || []
      const mappedParts = Array.isArray(items)
        ? items.map((item, index) => ({
            id: item.itemId || index + 1,
            key: index + 1,
            index: index + 1,
            sku: item.sku || '',
            needed: item.quantity ?? 0,
            inStock: item.quantityInStock ?? 0,
            exported: item.exportedQuantity ?? 0,
            exportStatus: item.exportStatus || 'Chờ xuất hàng',
          }))
        : []

      setExportList((prev) =>
        prev.map((row) => (row.id === quotationId ? { ...row, parts: mappedParts } : row))
      )

      return mappedParts
    } catch (err) {
      console.error('Failed to fetch stock export detail:', err)
      message.error('Đã xảy ra lỗi khi tải chi tiết xuất linh kiện')
      return null
    }
  }

  const toggleExpandRow = async (record) => {
    const key = record.key ?? record.id

    // Nếu đang mở thì chỉ cần đóng lại
    if (expandedRowKeys.includes(key)) {
      setExpandedRowKeys((prev) => prev.filter((k) => k !== key))
      return
    }

    // Nếu chưa có chi tiết linh kiện thì gọi API lấy theo quotationId
    if (!record.parts || record.parts.length === 0) {
      await loadQuotationParts(record.id)
    }

    // Mở row sau khi đã có (hoặc đã cố gắng load) chi tiết
    setExpandedRowKeys((prev) => [...prev, key])
  }

  const filteredData = useMemo(() => {
    return exportList
      .filter((item) => {
        const matchesSearch =
          !searchTerm ||
          item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.licensePlate.toLowerCase().includes(searchTerm.toLowerCase())

        let matchesDate = true
        if (dateFilter && item.createDate) {
          const filterDate = dateFilter.format('DD/MM/YYYY')
          matchesDate = item.createDate === filterDate
        }

        const matchesStatus = statusFilter === 'Tất cả' || item.status === statusFilter

        return matchesSearch && matchesDate && matchesStatus
      })
      .map((item, index) => ({ ...item, key: item.id, index: index + 1 }))
  }, [exportList, searchTerm, dateFilter, statusFilter])

  const columns = [
    {
      title: 'STT',
      dataIndex: 'index',
      key: 'index',
      width: 80,
      render: (_, __, index) => (
        <span style={{ fontWeight: 600, color: '#111' }}>{String(index + 1).padStart(2, '0')}</span>
      ),
    },
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      width: 180,
      render: (text) => <span style={{ fontWeight: 600, color: '#1677ff' }}>{text}</span>,
    },
    {
      title: 'Khách hàng',
      dataIndex: 'customer',
      key: 'customer',
      width: 220,
      render: (text) => <span style={{ fontWeight: 500, color: '#111' }}>{text}</span>,
    },
    {
      title: 'Biển số xe',
      dataIndex: 'licensePlate',
      key: 'licensePlate',
      width: 160,
      render: (text) => (
        <span style={{ fontWeight: 500, color: '#333', fontFamily: 'monospace' }}>{text}</span>
      ),
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createDate',
      key: 'createDate',
      width: 150,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 180,
      render: (status) => {
        const config = getStatusConfig(status)
        return (
          <Tag
            className="subtext"
            style={{
              color: config.color,
              backgroundColor: config.bgColor,
              borderColor: config.borderColor,
              border: '1px solid',
              borderRadius: '6px',
              padding: '4px 12px',
              fontWeight: 500,
              margin: 0,
            }}
          >
            {config.text}
          </Tag>
        )
      },
    },
    {
      title: '',
      key: 'expand',
      width: 60,
      align: 'right',
      render: (_, record) => {
        const key = record.key ?? record.id
        const isExpanded = expandedRowKeys.includes(key)
        return (
          <Button
            type="text"
            icon={isExpanded ? <UpOutlined /> : <DownOutlined />}
            onClick={() => toggleExpandRow(record)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          />
        )
      },
    },
  ]

  const expandedRowRender = (record) => {
    const partsColumns = [
      {
        title: 'STT',
        key: 'index',
        width: 60,
        render: (_, __, index) => (
          <span style={{ fontWeight: 600, color: '#666' }}>
            {String(index + 1).padStart(2, '0')}
          </span>
        ),
      },
      {
        title: 'Mã SKU',
        dataIndex: 'sku',
        key: 'sku',
        width: 220,
      },
      {
        title: 'Cần',
        dataIndex: 'needed',
        key: 'needed',
        width: 120,
        align: 'center',
        render: (value) => (
          <span style={{ fontWeight: 600, color: '#1677ff' }}>{value}</span>
        ),
      },
      {
        title: 'Tồn kho',
        dataIndex: 'inStock',
        key: 'inStock',
        width: 120,
        align: 'center',
        render: (value) => (
          <span
            style={{
              fontWeight: 600,
              color: value > 0 ? '#22c55e' : '#ef4444',
            }}
          >
            {value}
          </span>
        ),
      },
      {
        title: 'Đã xuất',
        dataIndex: 'exported',
        key: 'exported',
        width: 120,
        align: 'center',
        render: (value) => (
          <span style={{ fontWeight: 600, color: '#666' }}>{value}</span>
        ),
      },
      {
        title: 'Hành động',
        key: 'action',
        width: 160,
        render: (_, part) => {
          const isDone =
            part.exportStatus === 'Đã xuất hàng' || part.exported >= part.needed
          const canExport = !isDone && part.inStock >= part.needed

          if (isDone) {
            return (
              <Button
                type="link"
                style={{
                  padding: 0,
                  height: 'auto',
                  color: '#16a34a',
                  fontWeight: 600,
                }}
                onClick={async () => {
                  try {
                    const { data, error } = await stockExportAPI.getExportItemDetail(
                      part.id
                    )
                    if (error) {
                      message.error(error || 'Không thể tải chi tiết xuất kho')
                      return
                    }
                    setSelectedHistory(data?.result || data || null)
                    setHistoryModalOpen(true)
                  } catch (err) {
                    console.error('Failed to fetch export item detail:', err)
                    message.error('Đã xảy ra lỗi khi tải chi tiết xuất kho')
                  }
                }}
              >
                Đã xuất hàng
              </Button>
            )
          }

          return (
            <Button
              type="primary"
              size="small"
              disabled={!canExport}
              onClick={() => {
                if (!canExport) return
                  const maxExport = Math.max(
                    0,
                    Math.min(part.needed - part.exported, part.inStock)
                  )
                setSelectedPart({
                  ...part,
                  quotationId: record.id,
                  customer: record.customer,
                  licensePlate: record.licensePlate,
                  code: record.code,
                })
                  setExportQuantity(maxExport)
                setExportModalOpen(true)
              }}
              style={{
                background: canExport ? '#2563eb' : '#9ca3af',
                borderColor: canExport ? '#2563eb' : '#9ca3af',
                fontWeight: 500,
                borderRadius: '999px',
                height: 32,
                paddingInline: 16,
              }}
            >
              Xuất hàng
            </Button>
          )
        },
      },
    ]

    const data = (record.parts || []).map((p, idx) => ({
      ...p,
      key: idx + 1,
      index: idx + 1,
    }))

    return (
      <div
        style={{
          background: 'linear-gradient(to bottom, #fafafa 0%, #fff 100%)',
          padding: '20px 24px',
          margin: '12px 0',
          borderRadius: '10px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '16px',
            paddingBottom: '12px',
            borderBottom: '2px solid #f0f0f0',
          }}
        >
          <span
            style={{
              fontWeight: 600,
              fontSize: '15px',
              color: '#111',
            }}
          >
            Danh sách linh kiện ({record.parts?.length || 0})
          </span>
        </div>

        <Table
          columns={partsColumns}
          dataSource={data}
          pagination={false}
          size="middle"
          style={{ margin: 0 }}
          components={goldTableHeader}
        />
      </div>
    )
  }

  return (
    <WarehouseLayout>
      <div style={{ padding: '24px', minHeight: '100vh' }}>
        <div style={{ marginBottom: 16 }}>
          <h1 className="h4" style={{ fontWeight: 700, margin: '0 0 4px 0' }}>Xuất linh kiện</h1>
          <p className="subtext" style={{ margin: 0, color: '#6b7280' }}>
            Theo dõi các báo giá đã duyệt và thực hiện xuất linh kiện từ kho theo từng phiếu.
          </p>
        </div>

        <Card
          style={{
            borderRadius: 12,
            marginBottom: 16,
          }}
          bodyStyle={{ padding: 16 }}
        >
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 12,
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Search
              placeholder="Tìm kiếm theo code, khách hàng, biển số xe"
              allowClear
              prefix={<SearchOutlined />}
              style={{ width: '100%', maxWidth: 360 }}
              value={searchTerm}
              onChange={(e) => {
                setPage(1)
                setSearchTerm(e.target.value)
              }}
              onSearch={setSearchTerm}
            />

            <Space>
              <DatePicker
                placeholder="Ngày tạo"
                format="DD/MM/YYYY"
                suffixIcon={<CalendarOutlined />}
                value={dateFilter}
                onChange={setDateFilter}
                style={{ width: 150 }}
              />

              <Space>
                <Button
                  type={statusFilter === 'Chờ xuất hàng' ? 'primary' : 'default'}
                  onClick={() => setStatusFilter('Chờ xuất hàng')}
                  style={{
                    background: statusFilter === 'Chờ xuất hàng' ? '#CBB081' : '#fff',
                    borderColor: statusFilter === 'Chờ xuất hàng' ? '#CBB081' : '#e6e6e6',
                    color: statusFilter === 'Chờ xuất hàng' ? '#111' : '#666',
                    fontWeight: 600,
                  }}
                >
                  Chờ xuất hàng
                </Button>
                <Button
                  type={statusFilter === 'Hoàn thành' ? 'primary' : 'default'}
                  onClick={() => setStatusFilter('Hoàn thành')}
                  style={{
                    background: statusFilter === 'Hoàn thành' ? '#CBB081' : '#fff',
                    borderColor: statusFilter === 'Hoàn thành' ? '#CBB081' : '#e6e6e6',
                    color: statusFilter === 'Hoàn thành' ? '#111' : '#666',
                    fontWeight: 600,
                  }}
                >
                  Hoàn thành
                </Button>
                <Button
                  type={statusFilter === 'Tất cả' ? 'primary' : 'default'}
                  onClick={() => setStatusFilter('Tất cả')}
                  style={{
                    background: statusFilter === 'Tất cả' ? '#CBB081' : '#fff',
                    borderColor: statusFilter === 'Tất cả' ? '#CBB081' : '#e6e6e6',
                    color: statusFilter === 'Tất cả' ? '#111' : '#666',
                    fontWeight: 600,
                  }}
                >
                  Tất cả
                </Button>
              </Space>
            </Space>
          </div>
        </Card>

        <div
          style={{
            background: '#fff',
            borderRadius: 12,
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
        >
          <Table
            columns={columns}
            dataSource={filteredData}
            loading={loading}
            expandable={{
              expandedRowRender,
              expandedRowKeys,
              onExpandedRowsChange: setExpandedRowKeys,
              expandIcon: () => null,
            }}
            pagination={{
              current: page,
              pageSize,
              total,
              showSizeChanger: true,
              showTotal: (t) => `Tổng ${t} phiếu`,
              onChange: (p, ps) => {
                setPage(p)
                setPageSize(ps)
              },
            }}
            rowClassName={(_, index) => (index % 2 === 0 ? 'table-row-even' : 'table-row-odd')}
            components={goldTableHeader}
          />
        </div>

        <Modal
          open={exportModalOpen}
          onCancel={() => {
            setExportModalOpen(false)
            setSelectedPart(null)
          }}
          footer={null}
          width={720}
          title={null}
          styles={{
            header: { display: 'none' },
            body: { padding: 0 },
            content: { borderRadius: 0, padding: 0 },
          }}
          style={{ padding: 0 }}
        >
          {selectedPart && (
            <div>
              {/* Header giống design */}
              <div
                style={{
                  background: '#CBB081',
                  padding: '16px 24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span style={{ fontSize: 20, fontWeight: 700, color: '#111' }}>
                  XUẤT KHO
                </span>
                <Button
                  type="text"
                  onClick={() => {
                    setExportModalOpen(false)
                    setSelectedPart(null)
                  }}
                  style={{
                    color: '#111',
                    fontSize: 18,
                    fontWeight: 700,
                  }}
                >
                  ×
                </Button>
              </div>

              <div style={{ padding: '24px 32px 28px' }}>
                {/* Thông tin linh kiện */}
                <div style={{ marginBottom: 20 }}>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 16,
                      marginBottom: 12,
                    }}
                  >
                    Thông tin linh kiện
                  </div>
                  <div style={{ fontSize: 14, marginBottom: 6 }}>
                    <span style={{ fontWeight: 600 }}>Mã Sku: </span>
                    <span>{selectedPart.sku}</span>
                  </div>
                  <div style={{ fontSize: 14, marginBottom: 6 }}>
                    <span style={{ fontWeight: 600 }}>Số lượng tồn: </span>
                    <span>{selectedPart.inStock}</span>
                  </div>
                  <div style={{ fontSize: 14 }}>
                    <span style={{ fontWeight: 600 }}>Nhà cung cấp: </span>
                    <span>Không có thông tin</span>
                  </div>
                </div>

                <div
                  style={{
                    borderTop: '1px solid #e5e7eb',
                    margin: '8px 0 20px',
                  }}
                />

                {/* Thông tin xuất linh kiện */}
                <div>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 16,
                      marginBottom: 16,
                    }}
                  >
                    Thông tin xuất linh kiện
                  </div>

                  {/* Grid 2 cột cho 2 dòng thông tin, đảm bảo thẳng hàng */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'minmax(260px, 1fr) minmax(260px, 1fr)',
                      columnGap: 32,
                      rowGap: 16,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 14, marginBottom: 4 }}>
                        <span style={{ fontWeight: 600 }}>Số lượng cần xuất: </span>
                        <span>{selectedPart.needed}</span>
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 14, marginBottom: 4 }}>
                        <span style={{ fontWeight: 600 }}>Số lượng đã xuất: </span>
                        <span>{selectedPart.exported}</span>
                      </div>
                    </div>

                    <div>
                      <div
                        style={{
                          fontSize: 14,
                          marginBottom: 6,
                          fontWeight: 600,
                        }}
                      >
                        Số lượng muốn xuất
                      </div>
                      <Input
                        value={exportQuantity}
                        onChange={(e) => {
                          const v = Number(e.target.value.replace(/\D/g, ''))
                          if (Number.isNaN(v)) {
                            setExportQuantity(0)
                            return
                          }
                          const max = Math.max(
                            0,
                            Math.min(
                              selectedPart.needed - selectedPart.exported,
                              selectedPart.inStock
                            )
                          )
                          setExportQuantity(Math.min(v, max))
                        }}
                        placeholder="Nhập số lượng muốn xuất"
                      />
                    </div>

                    <div>
                      <div
                        style={{
                          fontSize: 14,
                          marginBottom: 6,
                          fontWeight: 600,
                        }}
                      >
                        Kỹ thuật viên nhận hàng
                      </div>
                      <select
                        value={selectedTechnicianId || ''}
                        onChange={(e) => {
                          const value = e.target.value
                          setSelectedTechnicianId(value ? Number(value) : null)
                        }}
                        disabled={techniciansLoading}
                        style={{
                          width: '100%',
                          height: 40,
                          borderRadius: 6,
                          border: '1px solid #d1d5db',
                          padding: '0 12px',
                          fontSize: 14,
                          outline: 'none',
                        }}
                      >
                        <option value="">
                          {techniciansLoading
                            ? 'Đang tải danh sách kỹ thuật viên...'
                            : 'Chọn kỹ thuật viên'}
                        </option>
                        {technicians.map((tech) => (
                          <option key={tech.employeeId} value={tech.employeeId}>
                            {tech.fullName} – {tech.phone}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    marginTop: 24,
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: 12,
                  }}
                >
                  <Button
                    onClick={() => {
                      setExportModalOpen(false)
                      setSelectedPart(null)
                    }}
                  >
                    Hủy
                  </Button>
                  <Button
                    type="primary"
                    style={{ background: '#16a34a', borderColor: '#16a34a' }}
                  loading={exportSubmitting}
                  onClick={async () => {
                    if (!selectedPart) return
                    if (!exportQuantity || exportQuantity <= 0) {
                      message.warning('Vui lòng nhập số lượng muốn xuất hợp lệ')
                      return
                    }
                    if (!selectedTechnicianId) {
                      message.warning('Vui lòng chọn kỹ thuật viên nhận hàng')
                      return
                    }

                    try {
                      setExportSubmitting(true)
                      const { data, error } = await stockExportAPI.exportItem(
                        selectedPart.id,
                        {
                          quantity: exportQuantity,
                          receiverId: selectedTechnicianId,
                        }
                      )

                      if (error) {
                        message.error(error || 'Xuất kho không thành công')
                        return
                      }

                      message.success('Xuất kho thành công')
                      await loadQuotationParts(selectedPart.quotationId)
                      setExportModalOpen(false)
                      setSelectedPart(null)
                    } catch (err) {
                      console.error('Export item failed:', err)
                      message.error('Đã xảy ra lỗi khi xuất kho')
                    } finally {
                      setExportSubmitting(false)
                    }
                  }}
                  >
                    Xác nhận
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Modal>

        {/* Modal xem chi tiết dòng xuất kho */}
        <Modal
          open={historyModalOpen}
          onCancel={() => {
            setHistoryModalOpen(false)
            setSelectedHistory(null)
          }}
          footer={null}
          width={720}
          title={null}
          styles={{
            header: { display: 'none' },
            body: { padding: 0 },
            content: { borderRadius: 0, padding: 0 },
          }}
          style={{ padding: 0 }}
        >
          {selectedHistory && (
            <div>
              <div
                style={{
                  background: '#CBB081',
                  padding: '16px 24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span style={{ fontSize: 20, fontWeight: 700, color: '#111' }}>
                  XUẤT KHO
                </span>
                <Button
                  type="text"
                  onClick={() => {
                    setHistoryModalOpen(false)
                    setSelectedHistory(null)
                  }}
                  style={{
                    color: '#111',
                    fontSize: 18,
                    fontWeight: 700,
                  }}
                >
                  ×
                </Button>
              </div>

              <div style={{ padding: '24px 32px 28px' }}>
                <div style={{ marginBottom: 20 }}>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 16,
                      marginBottom: 12,
                    }}
                  >
                    Thông tin linh kiện
                  </div>
                  <div style={{ fontSize: 14, marginBottom: 6 }}>
                    <span style={{ fontWeight: 600 }}>Mã Sku: </span>
                    <span>{selectedHistory.sku || selectedHistory.skuCode}</span>
                  </div>
                  <div style={{ fontSize: 14, marginBottom: 6 }}>
                    <span style={{ fontWeight: 600 }}>Số lượng tồn: </span>
                    <span>{selectedHistory.quantityInStock ?? '-'}</span>
                  </div>
                  <div style={{ fontSize: 14 }}>
                    <span style={{ fontWeight: 600 }}>Nhà cung cấp: </span>
                    <span>Không có thông tin</span>
                  </div>
                </div>

                <div
                  style={{
                    borderTop: '1px solid #e5e7eb',
                    margin: '8px 0 20px',
                  }}
                />

                <div>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 16,
                      marginBottom: 16,
                    }}
                  >
                    Lịch sử xuất hàng
                  </div>

                  <Table
                    size="middle"
                    pagination={false}
                    style={{ margin: 0 }}
                    columns={[
                      {
                        title: 'STT',
                        key: 'index',
                        width: 60,
                        render: (_, __, index) => (
                          <span style={{ fontWeight: 600 }}>
                            {String(index + 1).padStart(2, '0')}
                          </span>
                        ),
                      },
                      {
                        title: 'Số lượng',
                        dataIndex: 'quantity',
                        key: 'quantity',
                        width: 120,
                      },
                      {
                        title: 'Ngày',
                        dataIndex: 'date',
                        key: 'date',
                        width: 160,
                      },
                      {
                        title: 'Người nhận',
                        dataIndex: 'receiver',
                        key: 'receiver',
                      },
                    ]}
                    dataSource={
                      (selectedHistory.history || selectedHistory.logs || []).map(
                        (log, idx) => ({
                          key: idx + 1,
                          quantity: log.quantity ?? '-',
                          date:
                            log.date ||
                            (log.createdAt
                              ? new Date(log.createdAt).toLocaleDateString('vi-VN')
                              : '-'),
                          receiver: log.receiverName || log.receiver || '-',
                        })
                      )
                    }
                    components={goldTableHeader}
                  />
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </WarehouseLayout>
  )
}


