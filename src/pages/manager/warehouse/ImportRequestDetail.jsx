import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button, Table, Tag, message, Spin, Modal, Input } from 'antd'
import { ExclamationCircleOutlined } from '@ant-design/icons'
import ManagerLayout from '../../../layouts/ManagerLayout'
import { purchaseRequestAPI } from '../../../services/api'
import { goldTableHeader } from '../../../utils/tableComponents'

const { TextArea } = Input

export default function ManagerImportRequestDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [detailData, setDetailData] = useState(null)
  const [rejectModalVisible, setRejectModalVisible] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

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

  const handleReject = () => {
    setRejectModalVisible(true)
  }

  const handleCancelReject = () => {
    setRejectModalVisible(false)
    setRejectReason('')
  }

  const handleConfirmReject = async () => {
    if (!rejectReason.trim()) {
      message.warning('Vui lòng nhập lý do từ chối')
      return
    }

    try {
      setLoading(true)
      const { data: response, error } = await purchaseRequestAPI.reject(id, rejectReason)
      
      if (error) {
        message.error(error || 'Có lỗi xảy ra khi từ chối yêu cầu')
        return
      }
      
      message.success('Từ chối yêu cầu thành công')
      setRejectModalVisible(false)
      setRejectReason('')
      // Refresh data after rejection
      fetchDetail()
    } catch (err) {
      console.error('Failed to reject:', err)
      message.error('Có lỗi xảy ra khi từ chối yêu cầu')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async () => {
    try {
      setLoading(true)
      const { data: response, error } = await purchaseRequestAPI.approve(id)
      
      if (error) {
        message.error('Có lỗi xảy ra khi duyệt yêu cầu')
        return
      }
      
      message.success('Duyệt yêu cầu thành công')
      // Refresh data after approval
      fetchDetail()
    } catch (err) {
      console.error('Failed to approve:', err)
      message.error('Có lỗi xảy ra khi duyệt yêu cầu')
    } finally {
      setLoading(false)
    }
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
      <ManagerLayout>
        <div style={{ textAlign: 'center', padding: '100px' }}>
          <Spin size="large" />
        </div>
      </ManagerLayout>
    )
  }

  if (!detailData) {
    return (
      <ManagerLayout>
        <div style={{ textAlign: 'center', padding: '100px' }}>
          Không tìm thấy dữ liệu
        </div>
      </ManagerLayout>
    )
  }

  const statusConfig = getStatusConfig(detailData.reviewStatus)

  return (
    <ManagerLayout>
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

        {/* Action Buttons */}
        {detailData.reviewStatus !== 'Đã duyệt' && detailData.reviewStatus !== 'Từ chối' && (
          <div style={{ 
            marginTop: '24px', 
            display: 'flex', 
            justifyContent: 'flex-end', 
            gap: '12px' 
          }}>
            <Button
              size="large"
              onClick={handleReject}
              style={{
                background: '#ef4444',
                borderColor: '#ef4444',
                color: '#fff',
                fontWeight: 500,
                height: '44px',
                paddingLeft: '24px',
                paddingRight: '24px',
                borderRadius: '8px'
              }}
            >
              Từ chối yêu cầu
            </Button>
            <Button
              type="primary"
              size="large"
              onClick={handleApprove}
              style={{
                background: '#22c55e',
                borderColor: '#22c55e',
                fontWeight: 500,
                height: '44px',
                paddingLeft: '24px',
                paddingRight: '24px',
                borderRadius: '8px'
              }}
            >
              Duyệt yêu cầu
            </Button>
          </div>
        )}

        {/* Reject Modal */}
        <Modal
          title={
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px',
              fontSize: '20px',
              fontWeight: 600,
              color: '#1f2937'
            }}>
              <ExclamationCircleOutlined style={{ 
                color: '#ef4444', 
                fontSize: '24px' 
              }} />
              <span>Từ chối yêu cầu mua hàng</span>
            </div>
          }
          open={rejectModalVisible}
          onCancel={handleCancelReject}
          footer={[
            <Button 
              key="cancel" 
              onClick={handleCancelReject}
              size="large"
              style={{
                height: '44px',
                paddingLeft: '24px',
                paddingRight: '24px',
                borderRadius: '8px',
                fontWeight: 500,
                borderColor: '#d1d5db',
                color: '#6b7280'
              }}
            >
              Hủy
            </Button>,
            <Button
              key="confirm"
              type="primary"
              danger
              onClick={handleConfirmReject}
              loading={loading}
              size="large"
              style={{
                height: '44px',
                paddingLeft: '24px',
                paddingRight: '24px',
                borderRadius: '8px',
                fontWeight: 500,
                background: '#ef4444',
                borderColor: '#ef4444',
                boxShadow: '0 2px 4px rgba(239, 68, 68, 0.2)'
              }}
            >
              Xác nhận
            </Button>
          ]}
          width={600}
          style={{
            top: 100
          }}
          styles={{
            content: {
              borderRadius: '12px',
              padding: '24px'
            },
            header: {
              borderBottom: '1px solid #f0f0f0',
              paddingBottom: '16px',
              marginBottom: '20px'
            },
            footer: {
              borderTop: '1px solid #f0f0f0',
              paddingTop: '16px',
              marginTop: '24px'
            }
          }}
        >
          <div style={{ 
            marginBottom: '20px',
            padding: '16px',
            background: '#fef2f2',
            borderRadius: '8px',
            border: '1px solid #fecaca'
          }}>
            <div style={{ 
              marginBottom: '12px', 
              fontWeight: 600,
              fontSize: '14px',
              color: '#991b1b',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <ExclamationCircleOutlined style={{ fontSize: '16px' }} />
              <span>Vui lòng nhập lý do từ chối để tiếp tục</span>
            </div>
            <div style={{ 
              fontSize: '13px',
              color: '#7f1d1d',
              lineHeight: '1.5'
            }}>
              Lý do từ chối sẽ được ghi nhận và hiển thị cho người tạo yêu cầu.
            </div>
          </div>

          <div>
            <div style={{ 
              marginBottom: '10px', 
              fontWeight: 600,
              fontSize: '15px',
              color: '#374151',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <span>Lý do từ chối</span>
              <span style={{ color: '#ef4444', fontSize: '16px' }}>*</span>
            </div>
            <TextArea
              rows={5}
              placeholder="Ví dụ: Hàng hóa không còn cần thiết, Ngân sách không đủ, Đã có nguồn cung cấp khác..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              maxLength={500}
              showCount
              style={{
                borderRadius: '8px',
                fontSize: '14px',
                padding: '12px',
                borderColor: rejectReason.trim() ? '#d1d5db' : '#fca5a5',
                transition: 'all 0.2s'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#ef4444'
                e.target.style.boxShadow = '0 0 0 2px rgba(239, 68, 68, 0.1)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = rejectReason.trim() ? '#d1d5db' : '#fca5a5'
                e.target.style.boxShadow = 'none'
              }}
            />
            {!rejectReason.trim() && (
              <div style={{ 
                marginTop: '6px',
                fontSize: '12px',
                color: '#ef4444'
              }}>
                Vui lòng nhập lý do từ chối
              </div>
            )}
          </div>
        </Modal>
      </div>
    </ManagerLayout>
  )
}
