import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Table, Tag, message, Spin } from 'antd'
import WarehouseLayout from '../../layouts/WarehouseLayout'
import { purchaseRequestAPI } from '../../services/api'
import { goldTableHeader } from '../../utils/tableComponents'

export default function WarehousePurchaseRequestDetail() {
  const { id } = useParams()
  const [loading, setLoading] = useState(false)
  const [detailData, setDetailData] = useState(null)

  useEffect(() => {
    fetchDetail()
  }, [id])

  const fetchDetail = async () => {
    setLoading(true)
    try {
      const { data: response, error } = await purchaseRequestAPI.getById(id)
      
      if (error) {
        console.error('API error:', error)
        message.error(error || 'Không thể tải thông tin chi tiết yêu cầu mua hàng')
        setDetailData(null)
        return
      }

      const result = response?.result
      
      if (!result) {
        message.error('Không tìm thấy dữ liệu')
        setDetailData(null)
        return
      }

      // Map API response to UI structure
      const mappedData = {
        code: result.code || 'N/A',
        type: result.reason || 'Từ báo giá',
        createdAt: result.createdAt || 'N/A',
        createdBy: result.createdBy || 'N/A',
        reviewStatus: result.reviewStatus || 'Chờ duyệt',
        customerName: result.customerName || 'N/A',
        items: (result.items || []).map((item, index) => ({
          id: index + 1,
          sku: item.sku || 'N/A',
          name: item.partName || 'N/A',
          quantity: item.quantity || 0,
          unitPrice: item.estimatedPurchasePrice || 0,
          totalPrice: item.total || 0,
          unit: item.unit || 'Cái'
        }))
      }
      setDetailData(mappedData)
    } catch (err) {
      console.error('Failed to fetch detail:', err)
      message.error('Không thể tải thông tin chi tiết yêu cầu mua hàng')
      setDetailData(null)
    } finally {
      setLoading(false)
    }
  }

  const getStatusConfig = (status) => {
    const configs = {
      'Đã duyệt': { color: '#22c55e', bg: '#dcfce7' },
      'Chờ duyệt': { color: '#faad14', bg: '#fffbe6' },
      'Từ chối': { color: '#ef4444', bg: '#fee2e2' }
    }
    return configs[status] || { color: '#666', bg: '#f3f4f6' }
  }

  const columns = [
    {
      title: <div style={{ textAlign: 'center', color: '#fff' }}>Mã SKU</div>,
      dataIndex: 'sku',
      key: 'sku',
      width: 250
    },
    {
      title: <div style={{ textAlign: 'center', color: '#fff' }}>Tên linh kiện</div>,
      dataIndex: 'name',
      key: 'name',
      width: 250
    },
    {
      title: <div style={{ textAlign: 'center', color: '#fff' }}>SL cần</div>,
      dataIndex: 'quantity',
      key: 'quantity',
      width: 120,
      align: 'center'
    },
    {
      title: <div style={{ textAlign: 'center', color: '#fff' }}>Đơn giá</div>,
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      width: 150,
      align: 'right',
      render: (value) => `${value.toLocaleString('vi-VN')} đ`
    },
    {
      title: <div style={{ textAlign: 'center', color: '#fff' }}>Tổng tiền</div>,
      dataIndex: 'totalPrice',
      key: 'totalPrice',
      width: 150,
      align: 'right',
      render: (value) => `${value.toLocaleString('vi-VN')} đ`
    }
  ]

  if (loading) {
    return (
      <WarehouseLayout>
        <div style={{ textAlign: 'center', padding: '100px' }}>
          <Spin size="large" />
        </div>
      </WarehouseLayout>
    )
  }

  if (!detailData) {
    return (
      <WarehouseLayout>
        <div style={{ textAlign: 'center', padding: '100px' }}>
          Không tìm thấy dữ liệu
        </div>
      </WarehouseLayout>
    )
  }

  const statusConfig = getStatusConfig(detailData.reviewStatus)

  return (
    <WarehouseLayout>
      <div style={{ padding: '24px', background: '#fff', minHeight: '100vh' }}>
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ margin: 0 }}>Thông tin chi tiết</h1>
        </div>

        {/* Thông tin chung */}
        <div style={{ 
          background: '#fff', 
          padding: '24px',
          borderRadius: '8px',
          marginBottom: '24px',
          border: '1px solid #f0f0f0'
        }}>
          <h2 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: 600 }}>
            Thông tin chung
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '12px' }}>
            <div style={{ fontWeight: 500 }}>Mã YCMH:</div>
            <div>{detailData.code}</div>

            <div style={{ fontWeight: 500 }}>Lý do: </div>
            <div>{detailData.type}</div>

            <div style={{ fontWeight: 500 }}>Ngày tạo:</div>
            <div>{detailData.createdAt}</div>

            <div style={{ fontWeight: 500 }}>Người tạo:</div>
            <div>{detailData.createdBy}</div>

            <div style={{ fontWeight: 500 }}>Trạng thái:</div>
            <div>
              <Tag
                style={{
                  background: statusConfig.bg,
                  color: statusConfig.color,
                  borderColor: statusConfig.color,
                  borderRadius: 999,
                  padding: '4px 12px',
                  fontWeight: 600,
                  border: '1px solid'
                }}
              >
                {detailData.reviewStatus}
              </Tag>
            </div>
          </div>
        </div>

        {/* Table */}
        <div style={{
          background: '#fff',
          borderRadius: '8px',
          overflow: 'hidden'
        }}>
          <Table
            columns={columns}
            dataSource={detailData.items}
            pagination={false}
            rowKey="id"
            components={goldTableHeader}
            rowClassName={(_, index) => (index % 2 === 0 ? 'table-row-even' : 'table-row-odd')}
          />
        </div>
      </div>
    </WarehouseLayout>
  )
}

