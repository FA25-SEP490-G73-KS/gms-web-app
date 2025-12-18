import React, { useState, useEffect, useMemo } from 'react'
import {
  Table,
  Button,
  Tag,
  Input,
  Dropdown,
  message,
  Modal,
  DatePicker,
  Checkbox,
  Space,
  InputNumber
} from 'antd'
import { SearchOutlined, FilterOutlined, MoreOutlined, CalendarOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import WarehouseLayout from '../../layouts/WarehouseLayout'
import { goldTableHeader } from '../../utils/tableComponents'
import { stockReceiptAPI, purchaseRequestAPI } from '../../services/api'
import dayjs from 'dayjs'
import { getEmployeeIdFromToken } from '../../utils/helpers'

const { TextArea } = Input

export default function ImportList() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [importList, setImportList] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [statusFilter, setStatusFilter] = useState('Tất cả')
  const [dateRange, setDateRange] = useState([null, null])
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)
  const [tempStatuses, setTempStatuses] = useState([])
  const [tempDateRange, setTempDateRange] = useState([null, null])

  // State for "Tạo yêu cầu mua hàng" modal
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false)
  const [purchaseItems, setPurchaseItems] = useState([])
  const [purchaseLoading, setPurchaseLoading] = useState(false)
  const [purchaseError, setPurchaseError] = useState(null)
  const [selectedPurchaseKeys, setSelectedPurchaseKeys] = useState([])
  const [purchaseQuantities, setPurchaseQuantities] = useState({})
  const [purchaseReason, setPurchaseReason] = useState('')
  const [purchaseNote, setPurchaseNote] = useState('')
  const [createPurchaseLoading, setCreatePurchaseLoading] = useState(false)

  useEffect(() => {
    fetchImportList()
  }, [page, pageSize, searchTerm, statusFilter, dateRange])

  const getStatusParam = (filter) => {
    const statusMap = {
      'Chờ nhập': 'PENDING',
      'Nhập một phần': 'PARTIAL_RECEIVED',
      'Đã nhập': 'RECEIVED',
      'Tất cả': null
    }
    return statusMap[filter]
  }

  const fetchImportList = async () => {
    setLoading(true)
    try {
      const status = getStatusParam(statusFilter)
      const fromDate = dateRange[0] ? dateRange[0].format('YYYY-MM-DD') : null
      const toDate = dateRange[1] ? dateRange[1].format('YYYY-MM-DD') : null

      const { data, error } = await stockReceiptAPI.getAll(
        page - 1, 
        pageSize, 
        searchTerm || null, 
        status, 
        fromDate, 
        toDate
      )
      
      if (error) {
        throw new Error(error)
      }

      const result = data?.result || {}
      const content = result.content || []
      
      // Transform API data to match UI structure
      const transformedData = content.map((item) => {
        // Xử lý createdAt: nếu đã là chuỗi format sẵn (DD/MM/YYYY HH:mm) thì dùng trực tiếp
        // Nếu là ISO string hoặc timestamp thì parse bằng dayjs
        let formattedDate = 'N/A'
        if (item.createdAt) {
          // Kiểm tra xem có phải là format DD/MM/YYYY HH:mm không (đã được format sẵn từ backend)
          const datePattern = /^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/
          if (datePattern.test(item.createdAt)) {
            // Đã format sẵn, dùng trực tiếp
            formattedDate = item.createdAt
          } else {
            // Parse bằng dayjs (cho ISO string hoặc timestamp)
            const parsed = dayjs(item.createdAt)
            formattedDate = parsed.isValid() ? parsed.format('DD/MM/YYYY HH:mm') : item.createdAt
          }
        }

        return {
          key: item.id,
          id: item.id,
          code: item.code || 'N/A',
          supplierName: item.supplierName || 'N/A',
          purchaseRequestCode: item.purchaseRequestCode || 'N/A',
          receivedQty: item.receivedQty || 0,
          totalQty: item.totalQty || 0,
          lineCount: item.lineCount || 0,
          createdAt: formattedDate,
          status: mapStatus(item.status)
        }
      })

      setImportList(transformedData)
      setTotal(result.totalElements || 0)
    } catch (err) {
      console.error('Failed to fetch import list:', err)
      message.error('Đã xảy ra lỗi khi tải dữ liệu')
      setImportList([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }

  const mapStatus = (status) => {
    const statusMap = {
      'RECEIVED': 'Đã nhập',
      'PENDING': 'Chờ nhập',
      'PARTIAL_RECEIVED': 'Chờ nhập kho',
      'PARTIALLY_RECEIVED': 'Chờ nhập kho',
      'CANCELLED': 'Đã hủy'
    }
    return statusMap[status] || status || 'N/A'
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN').format(value)
  }

  // ==== Purchase request helpers ====
  const fetchSuggestedItems = async () => {
    setPurchaseLoading(true)
    setPurchaseError(null)
    try {
      const { data, error } = await purchaseRequestAPI.getSuggestedItems()
      if (error) {
        throw new Error(error)
      }
      const result = data?.result || data || []
      const list = Array.isArray(result) ? result : []
      const mapped = list.map((item) => {
        const quantityInStock = item.quantityInStock ?? 0
        const reservedQuantity = item.reservedQuantity ?? 0
        const available =
          item.available != null
            ? item.available
            : quantityInStock - reservedQuantity

        const reorderLevel = item.reorderLevel ?? 0
        const shortage =
          reorderLevel > 0
            ? Math.max(0, reorderLevel - (available ?? 0))
            : 0

        return {
          key: item.partId,
          partId: item.partId,
          sku: item.sku || 'N/A',
          partName: item.partName || 'N/A',
          quantityInStock,
          available,
          reorderLevel,
          shortage,
          suggestedQuantity: item.suggestedQuantity ?? 0,
        }
      })

      const initialQuantities = {}
      mapped.forEach((it) => {
        initialQuantities[it.partId] = it.suggestedQuantity || 0
      })

      setPurchaseItems(mapped)
      setPurchaseQuantities(initialQuantities)
    } catch (err) {
      console.error('Failed to fetch suggested items:', err)
      setPurchaseError(
        err?.message || 'Không thể tải danh sách linh kiện đề xuất. Vui lòng thử lại.'
      )
    } finally {
      setPurchaseLoading(false)
    }
  }

  const handleViewDetail = (id) => {
    navigate(`/warehouse/import-list/${id}`)
  }

  const handleImportWarehouse = (id) => {
    message.info(`Nhập kho cho phiếu ID: ${id}`)
  }

  const getMenuItems = (record) => [
    {
      key: 'view',
      label: (
        <span onClick={() => handleViewDetail(record.id)}>
          Xem chi tiết
        </span>
      )
    },
    {
      key: 'import',
      label: (
        <span onClick={() => handleImportWarehouse(record.id)}>
          Nhập kho
        </span>
      )
    }
  ]

  const getStatusConfig = (status) => {
    const statusMap = {
      'Đã nhập': { color: '#22c55e', bgColor: '#f6ffed', borderColor: '#b7eb8f', text: 'Đã nhập' },
      'Chờ nhập': { color: '#faad14', bgColor: '#fffbe6', borderColor: '#ffe58f', text: 'Chờ nhập' },
      'Chờ nhập kho': { color: '#faad14', bgColor: '#fffbe6', borderColor: '#ffe58f', text: 'Chờ nhập kho' },
      'Nhập một phần': { color: '#1677ff', bgColor: '#e6f4ff', borderColor: '#91caff', text: 'Nhập một phần' },
      'Đã hủy': { color: '#ff4d4f', bgColor: '#fff1f0', borderColor: '#ffccc7', text: 'Đã hủy' }
    }
    return statusMap[status] || { color: '#666', bgColor: '#fafafa', borderColor: '#d9d9d9', text: status || 'Không rõ' }
  }


  const columns = [
    {
      title: 'Mã phiếu',
      dataIndex: 'code',
      key: 'code',
      width: 150
    },
    {
      title: 'Nhà cung cấp',
      dataIndex: 'supplierName',
      key: 'supplierName',
      width: 200
    },
    {
      title: 'Yêu cầu mua',
      dataIndex: 'purchaseRequestCode',
      key: 'purchaseRequestCode',
      width: 150
    },
    {
      title: 'Đã nhập',
      key: 'received',
      width: 120,
      align: 'center',
      render: (_, record) => `${record.receivedQty}/${record.totalQty}`
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 150,
      align: 'center',
      render: (status) => {
        const config = getStatusConfig(status)
        return (
          <Tag
            style={{
              color: config.color,
              backgroundColor: config.bgColor,
              borderColor: config.borderColor,
              border: '1px solid',
              borderRadius: '6px',
              padding: '4px 12px',
              fontWeight: 500,
              fontSize: '14px',
              margin: 0
            }}
          >
            {config.text}
          </Tag>
        )
      }
    },
    {
      title: '',
      key: 'action',
      width: 60,
      align: 'center',
      render: (_, record) => (
        <Dropdown
          menu={{ items: getMenuItems(record) }}
          trigger={['click']}
          placement="bottomRight"
        >
          <Button
            type="text"
            icon={<MoreOutlined style={{ fontSize: '20px' }} />}
            style={{ padding: 0 }}
          />
        </Dropdown>
      )
    }
  ]

  // Columns cho modal tạo yêu cầu mua hàng
  // Checkbox chọn dòng được tạo tự động qua rowSelection → tổng 6 cột như yêu cầu
  const purchaseColumns = [
    {
      title: 'Mã SKU',
      key: 'nameSku',
      width: 260,
      ellipsis: true,
      render: (record) => (
        <span title={`${record.partName} (${record.sku})`}>
          {record.partName}{' '}
          <span style={{ color: '#6b7280' }}>({record.sku})</span>
        </span>
      ),
    },
    {
      title: 'Tồn',
      dataIndex: 'quantityInStock',
      key: 'quantityInStock',
      width: 80,
      align: 'right',
      render: (value) => (value != null ? value : 0),
    },
    {
      title: 'Khả dụng',
      dataIndex: 'available',
      key: 'available',
      width: 90,
      align: 'right',
      render: (value) => (value != null ? value : 0),
    },
    {
      title: 'Thiếu',
      dataIndex: 'shortage',
      key: 'shortage',
      width: 80,
      align: 'right',
      render: (value) => (value != null ? value : 0),
    },
    {
      title: 'SL cần mua',
      key: 'purchaseQuantity',
      width: 110,
      align: 'right',
      render: (_, record) => {
        const value =
          purchaseQuantities[record.partId] ??
          record.suggestedQuantity ??
          0
        return (
          <InputNumber
            min={0}
            value={value}
            onChange={(val) => {
              const num = typeof val === 'number' ? val : 0
              setPurchaseQuantities((prev) => ({
                ...prev,
                [record.partId]: num,
              }))
            }}
            style={{ width: '100%' }}
          />
        )
      },
    },
  ]

  const validPurchaseItems = useMemo(() => {
    if (!purchaseItems || purchaseItems.length === 0) return []
    return purchaseItems.filter((item) => {
      if (!selectedPurchaseKeys.includes(item.partId)) return false
      const qty =
        typeof purchaseQuantities[item.partId] === 'number'
          ? purchaseQuantities[item.partId]
          : item.suggestedQuantity || 0
      return qty > 0
    })
  }, [purchaseItems, selectedPurchaseKeys, purchaseQuantities])

  const handleCreatePurchaseRequest = async () => {
    if (validPurchaseItems.length === 0) return

    const employeeId = getEmployeeIdFromToken()
    if (!employeeId) {
      message.error('Không tìm thấy thông tin nhân viên. Vui lòng đăng nhập lại.')
      return
    }

    const items = validPurchaseItems.map((item) => {
      const qty =
        typeof purchaseQuantities[item.partId] === 'number'
          ? purchaseQuantities[item.partId]
          : item.suggestedQuantity || 0
      return {
        partId: item.partId,
        quantity: qty,
      }
    })

    setCreatePurchaseLoading(true)
    try {
      const payload = {
        createdById: employeeId,
        reason: purchaseReason?.trim() || null,
        note: purchaseNote?.trim() || null,
        items,
      }

      const { data, error } = await purchaseRequestAPI.createManual(payload)
      if (error || !data || (data.statusCode && data.statusCode !== 200 && data.statusCode !== 201)) {
        const msg =
          error ||
          data?.message ||
          'Không thể tạo yêu cầu mua hàng. Vui lòng thử lại.'
        message.error(msg)
        return
      }

      const result = data.result || data
      const codeText = result?.code ? ` (Mã phiếu: ${result.code})` : ''
      message.success(`Tạo yêu cầu mua hàng thành công${codeText}`)
      setIsPurchaseModalOpen(false)
    } catch (err) {
      console.error('Error creating purchase request:', err)
      message.error('Đã xảy ra lỗi khi tạo yêu cầu mua hàng. Vui lòng thử lại.')
    } finally {
      setCreatePurchaseLoading(false)
    }
  }

  return (
    <WarehouseLayout>
      <div style={{ padding: 24 }}>
        {/* Heading */}
        <h1 style={{ margin: 0, marginBottom: 24, fontSize: 24, fontWeight: 600 }}>
          Danh sách nhập kho
        </h1>

        {/* Search / Filter / Create Purchase Request */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
            gap: 12,
          }}
        >
          {/* Search on the left */}
          <Input
            placeholder="Tìm kiếm"
            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: 280,
              borderRadius: '8px',
            }}
          />

          {/* Buttons on the right */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Button
              type="primary"
              onClick={() => {
                setIsPurchaseModalOpen(true)
                setPurchaseItems([])
                setPurchaseError(null)
                setSelectedPurchaseKeys([])
                setPurchaseQuantities({})
                setPurchaseReason('')
                setPurchaseNote('')
                fetchSuggestedItems()
              }}
            >
              Tạo yêu cầu mua hàng
            </Button>

          <Button
            icon={<FilterOutlined />}
            onClick={() => {
              setTempStatuses(
                statusFilter && statusFilter !== 'Tất cả' ? [statusFilter] : []
              )
              setTempDateRange(dateRange)
              setIsFilterModalOpen(true)
            }}
            style={{
              borderRadius: '8px',
            }}
          >
            Bộ lọc
          </Button>
          </div>
        </div>

        <Table
          columns={columns}
          dataSource={importList}
          loading={loading}
          pagination={{
            current: page,
            pageSize: pageSize,
            total: total,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} bản ghi`,
            showQuickJumper: true,
            onChange: (newPage, newPageSize) => {
              setPage(newPage)
              setPageSize(newPageSize)
            }
          }}
          size="middle"
          components={goldTableHeader}
        />
      </div>

      {/* Filter Modal */}
      <Modal
        title="Bộ lọc"
        open={isFilterModalOpen}
        onCancel={() => setIsFilterModalOpen(false)}
        footer={null}
        width={450}
      >
        <div style={{ padding: '8px 0' }}>
          {/* Trạng thái */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Trạng thái</div>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Checkbox
                checked={tempStatuses.includes('Chờ nhập')}
                onChange={() => {
                  setTempStatuses((prev) =>
                    prev.includes('Chờ nhập') ? [] : ['Chờ nhập']
                  )
                }}
              >
                Chờ nhập
              </Checkbox>
              <Checkbox
                checked={tempStatuses.includes('Nhập một phần')}
                onChange={() => {
                  setTempStatuses((prev) =>
                    prev.includes('Nhập một phần') ? [] : ['Nhập một phần']
                  )
                }}
              >
                Nhập một phần
              </Checkbox>
              <Checkbox
                checked={tempStatuses.includes('Đã nhập')}
                onChange={() => {
                  setTempStatuses((prev) =>
                    prev.includes('Đã nhập') ? [] : ['Đã nhập']
                  )
                }}
              >
                Đã nhập
              </Checkbox>
            </Space>
          </div>

          {/* Khoảng ngày tạo */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Khoảng ngày tạo</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <div style={{ fontSize: 13, marginBottom: 4 }}>Từ ngày</div>
                <DatePicker
                  placeholder="dd/mm/yyyy"
                  style={{ width: '100%', borderRadius: 6 }}
                  format="DD/MM/YYYY"
                  value={tempDateRange[0]}
                  onChange={(date) => {
                    setTempDateRange([date, tempDateRange[1]])
                  }}
                  suffixIcon={<CalendarOutlined />}
                />
              </div>
              <div>
                <div style={{ fontSize: 13, marginBottom: 4 }}>Đến ngày</div>
                <DatePicker
                  placeholder="dd/mm/yyyy"
                  style={{ width: '100%', borderRadius: 6 }}
                  format="DD/MM/YYYY"
                  value={tempDateRange[1]}
                  onChange={(date) => {
                    setTempDateRange([tempDateRange[0], date])
                  }}
                  suffixIcon={<CalendarOutlined />}
                />
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 12,
              marginTop: 24
            }}
          >
            <Button
              onClick={() => {
                setTempStatuses([])
                setTempDateRange([null, null])
              }}
            >
              Đặt lại
            </Button>
            <Button
              type="primary"
              onClick={() => {
                const appliedStatus = tempStatuses[0] || 'Tất cả'
                setStatusFilter(appliedStatus)
                setDateRange(tempDateRange)
                setPage(1)
                setIsFilterModalOpen(false)
              }}
              style={{
                backgroundColor: '#1890ff',
                borderColor: '#1890ff'
              }}
            >
              Tìm kiếm
            </Button>
          </div>
        </div>
      </Modal>

      {/* Purchase Request Modal */}
      <Modal
        title="Tạo yêu cầu mua hàng"
        open={isPurchaseModalOpen}
        onCancel={() => setIsPurchaseModalOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsPurchaseModalOpen(false)}>
            Hủy
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={handleCreatePurchaseRequest}
            disabled={validPurchaseItems.length === 0 || createPurchaseLoading}
            loading={createPurchaseLoading}
          >
            Tạo phiếu yêu cầu
          </Button>,
        ]}
        width={900}
        style={{ top: 40 }}
        bodyStyle={{ padding: 16 }}
      >
        <div style={{ marginBottom: 16 }}>
          <p style={{ marginBottom: 0 }}>
            Chọn linh kiện cần mua, chỉnh sửa số lượng nếu cần rồi tạo phiếu yêu cầu mua hàng gửi quản lý duyệt.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16, marginBottom: 16 }}>
          <div>
            <div style={{ marginBottom: 12, fontWeight: 600 }}>Danh sách linh kiện đề xuất</div>
            {purchaseError ? (
              <div style={{ textAlign: 'center', padding: 24 }}>
                <p>{purchaseError}</p>
                <Button onClick={fetchSuggestedItems}>Thử lại</Button>
              </div>
            ) : (
              <Table
                rowSelection={{
                  selectedRowKeys: selectedPurchaseKeys,
                  onChange: (keys) => setSelectedPurchaseKeys(keys),
                }}
                columns={purchaseColumns}
                dataSource={purchaseItems}
                loading={purchaseLoading}
                pagination={false}
                size="small"
              />
            )}
          </div>

          <div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>Lý do (tuỳ chọn)</div>
              <Input
                placeholder="Nhập lý do tạo yêu cầu mua hàng"
                value={purchaseReason}
                onChange={(e) => setPurchaseReason(e.target.value)}
              />
            </div>
            <div>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>Ghi chú (tuỳ chọn)</div>
              <TextArea
                rows={4}
                placeholder="Nhập ghi chú thêm (nếu có)..."
                value={purchaseNote}
                onChange={(e) => setPurchaseNote(e.target.value)}
              />
            </div>
          </div>
        </div>
      </Modal>
    </WarehouseLayout>
  )
}
