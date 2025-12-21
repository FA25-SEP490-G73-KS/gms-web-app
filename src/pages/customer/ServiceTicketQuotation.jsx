import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Table, message, Spin } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { serviceTicketAPI, priceQuotationAPI } from '../../services/api';
import { goldTableHeader } from '../../utils/tableComponents';

const formatCurrency = (amount) => {
  if (!amount) return '0';
  return Number(amount).toLocaleString('vi-VN');
};

const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('vi-VN');
};

// Convert number to Vietnamese words
const numberToVietnameseWords = (num) => {
  if (!num || num === 0) return 'Không đồng (chưa bao gồm thuế VAT)';
  
  try {
    const ones = ['', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
    
    const readThreeDigits = (n) => {
      if (n === 0) return '';
      let result = '';
      const hundred = Math.floor(n / 100);
      const remainder = n % 100;
      
      if (hundred > 0) {
        result += ones[hundred] + ' trăm ';
      }
      
      if (remainder > 0) {
        if (remainder < 10) {
          result += ones[remainder];
        } else if (remainder === 10) {
          result += 'mười';
        } else if (remainder < 20) {
          result += 'mười ' + (remainder === 11 ? 'một' : ones[remainder % 10]);
        } else {
          const ten = Math.floor(remainder / 10);
          const one = remainder % 10;
          result += (ten === 1 ? 'mười' : ones[ten] + ' mươi');
          if (one > 0) {
            if (one === 1 && ten > 1) result += ' mốt';
            else if (one === 5 && ten > 1) result += ' lăm';
            else result += ' ' + ones[one];
          }
        }
      }
      
      return result.trim();
    };
    
    const millions = Math.floor(num / 1000000);
    const thousands = Math.floor((num % 1000000) / 1000);
    const remainder = num % 1000;
    
    let result = '';
    if (millions > 0) {
      result += readThreeDigits(millions) + ' triệu ';
    }
    if (thousands > 0) {
      result += readThreeDigits(thousands) + ' nghìn ';
    }
    if (remainder > 0) {
      result += readThreeDigits(remainder);
    }
    
    return (result.trim() || 'Không') + ' đồng (chưa bao gồm thuế VAT)';
  } catch (err) {
    console.error('Error converting number to words:', err);
    return 'Không đồng (chưa bao gồm thuế VAT)';
  }
};

// Cấu hình trạng thái báo giá (dùng để hiển thị cho khách)
const QUOTATION_STATUS_CONFIG = {
  DRAFT: {
    label: 'Nháp',
    badgeBg: '#f3f4f6',
    badgeColor: '#6b7280',
  },
  WAITING_WAREHOUSE_CONFIRM: {
    label: 'Chờ kho duyệt',
    badgeBg: '#fef3c7',
    badgeColor: '#92400e',
  },
  WAREHOUSE_CONFIRMED: {
    label: 'Kho đã duyệt',
    badgeBg: '#dcfce7',
    badgeColor: '#15803d',
  },
  WAITING_CUSTOMER_CONFIRM: {
    label: 'Chờ khách xác nhận',
    badgeBg: '#e0e7ff',
    badgeColor: '#3730a3',
  },
  CUSTOMER_CONFIRMED: {
    label: 'Khách đã xác nhận',
    badgeBg: '#d1fae5',
    badgeColor: '#065f46',
  },
  CUSTOMER_REJECTED: {
    label: 'Khách từ chối',
    badgeBg: '#fee2e2',
    badgeColor: '#991b1b',
  },
  COMPLETED: {
    label: 'Hoàn thành',
    badgeBg: '#dbeafe',
    badgeColor: '#1e40af',
  },
};

export default function ServiceTicketQuotation() {
  const { serviceTicketId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [quotationData, setQuotationData] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [hasCancelled, setHasCancelled] = useState(false);

  useEffect(() => {
    if (serviceTicketId) {
      fetchQuotation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceTicketId]);

  const fetchQuotation = async () => {
    if (!serviceTicketId) {
      message.warning('Không tìm thấy ID phiếu dịch vụ');
      return;
    }

    setLoading(true);
    try {
      // Allow viewing quotation without authentication (public endpoint)
      const { data: response, error } = await serviceTicketAPI.getQuotationByCode(serviceTicketId, { skipAuth: true });

      if (error) {
        message.error(error || 'Không thể tải thông tin báo giá');
        setLoading(false);
        return;
      }

      if (!response) {
        message.warning('Không tìm thấy dữ liệu báo giá');
        setLoading(false);
        return;
      }

      const result = response?.result || null;
      if (!result) {
        message.warning('Không tìm thấy dữ liệu báo giá');
        setLoading(false);
        return;
      }

      setQuotationData(result);
    } catch (err) {
      console.error('Failed to fetch quotation:', err);
      message.error('Đã xảy ra lỗi khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    const priceQuotationId = quotationData?.priceQuotation?.priceQuotationId;
    if (!priceQuotationId) {
      message.error('Không tìm thấy ID báo giá');
      return;
    }

    setActionLoading(true);
    try {
      // Allow action without authentication (public endpoint)
      const { data: response, error } = await priceQuotationAPI.confirmQuotation(priceQuotationId, { skipAuth: true });
      
      if (error) {
        message.error(error || 'Không thể xác nhận báo giá');
        return;
      }

      // Check if response indicates success
      if (response && (response.statusCode === 200 || response.message)) {
        message.success('Xác nhận báo giá thành công');
        // Refresh data after confirmation to get updated status
        await fetchQuotation();
      } else {
        message.success('Xác nhận báo giá thành công');
        // Refresh data anyway
        await fetchQuotation();
      }
    } catch (err) {
      console.error('Failed to confirm quotation:', err);
      message.error('Đã xảy ra lỗi khi xác nhận báo giá');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    const priceQuotationId = quotationData?.priceQuotation?.priceQuotationId;
    if (!priceQuotationId) {
      message.error('Không tìm thấy ID báo giá');
      return;
    }

    setActionLoading(true);
    try {
      // Allow action without authentication (public endpoint)
      // Try passing as object with reason field - API might require this format
      const { data: response, error } = await priceQuotationAPI.rejectQuotation(priceQuotationId, { reason: '' }, { skipAuth: true });
      
      console.log('Reject quotation response:', { response, error, priceQuotationId });
      
      if (error) {
        message.error(error || 'Không thể từ chối báo giá');
        return;
      }

      message.success('Từ chối báo giá thành công');
      // Always refresh data after rejection to get updated status
      // Add a small delay to ensure backend has processed the update
      setTimeout(async () => {
        await fetchQuotation();
      }, 500);
    } catch (err) {
      console.error('Failed to reject quotation:', err);
      message.error('Đã xảy ra lỗi khi từ chối báo giá');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    const serviceTicketId = quotationData?.serviceTicketId;
    if (!serviceTicketId) {
      message.error('Không tìm thấy ID phiếu dịch vụ');
      return;
    }

    setActionLoading(true);
    try {
      // Allow action without authentication (public endpoint)
      // Backend enum ServiceTicketStatus dùng key tiếng Anh, ví dụ: CANCELED
      const { data: response, error } = await serviceTicketAPI.updateStatus(
        serviceTicketId,
        'CANCELED',
        { skipAuth: true }
      );
      
      if (error) {
        message.error(error || 'Không thể hủy phiếu dịch vụ');
        return;
      }

      // Check if response indicates success
      if (response && (response.statusCode === 200 || response.message)) {
        message.success('Hủy phiếu dịch vụ thành công');
        setHasCancelled(true);
        // Refresh data sau khi hủy (nếu còn truy cập được)
        await fetchQuotation();
      } else {
        message.success('Hủy phiếu dịch vụ thành công');
        setHasCancelled(true);
        await fetchQuotation();
      }
    } catch (err) {
      console.error('Failed to cancel service ticket:', err);
      message.error('Đã xảy ra lỗi khi hủy phiếu dịch vụ');
    } finally {
      setActionLoading(false);
    }
  };

  const quotationColumns = [
    {
      title: 'STT',
      key: 'index',
      width: 80,
      align: 'center',
      render: (_, __, index) => (
        <span style={{ fontWeight: 600 }}>{String(index + 1).padStart(2, '0')}</span>
      ),
    },
    {
      title: 'Nội dung công việc',
      dataIndex: 'itemName',
      key: 'itemName',
    },
    {
      title: 'Đơn vị',
      dataIndex: 'unit',
      key: 'unit',
      width: 120,
      align: 'center',
      render: (value) => value || '—',
    },
    {
      title: 'Số lượng',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 120,
      align: 'center',
      render: (value) => value ? String(value) : '0',
    },
    {
      title: 'Đơn giá',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      width: 150,
      align: 'right',
      render: (value) => formatCurrency(value),
    },
    {
      title: 'Thành tiền',
      dataIndex: 'totalPrice',
      key: 'totalPrice',
      width: 150,
      align: 'right',
      render: (value) => formatCurrency(value),
    },
  ];

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', minHeight: '100vh', background: '#ffffff' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!quotationData) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', minHeight: '100vh', background: '#ffffff' }}>
        <p>Không tìm thấy thông tin báo giá</p>
        <Button onClick={() => navigate(-1)}>Quay lại</Button>
      </div>
    );
  }

  const customer = quotationData?.customer || {};
  const vehicle = quotationData?.vehicle || {};
  const priceQuotation = quotationData?.priceQuotation || {};
  const quotationItems = priceQuotation?.items || [];

  const totalMerchandise = quotationItems.reduce(
    (sum, item) => sum + (item.totalPrice || 0),
    0
  );
  const discount = priceQuotation?.discount || 0;
  const estimateAmount = priceQuotation?.estimateAmount || 0;

  // Trạng thái báo giá hiện tại
  const quotationStatusRaw = priceQuotation?.status;
  const normalizedQuotationStatus = quotationStatusRaw
    ? String(quotationStatusRaw).toUpperCase()
    : 'DRAFT';
  const quotationStatusConfig =
    QUOTATION_STATUS_CONFIG[normalizedQuotationStatus] ||
    QUOTATION_STATUS_CONFIG.DRAFT;

  // Cho phép khách thao tác khi:
  // - Kho đã duyệt  (WAREHOUSE_CONFIRMED)
  // - Chờ khách xác nhận (WAITING_CUSTOMER_CONFIRM)
  // Và chưa bấm Hủy trên màn này
  const showActionButtons =
    !hasCancelled &&
    (normalizedQuotationStatus === 'WAREHOUSE_CONFIRMED' ||
      normalizedQuotationStatus === 'WAITING_CUSTOMER_CONFIRM');

  // Get quotation date
  const quotationDate = priceQuotation?.createdAt 
    ? formatDate(priceQuotation.createdAt)
    : formatDate(new Date());

  return (
    <>
      {/* Responsive styles for tablet & mobile. Desktop sizes remain unchanged. */}
      <style>
        {`
          /* Tablet (<= 1024px) */
          @media (max-width: 1024px) {
            .quotation-root {
              padding: 32px 20px !important;
            }

            .quotation-header {
              margin-bottom: 28px !important;
              padding-bottom: 16px !important;
            }

            .quotation-logo-img {
              height: 110px !important;
              transform: scale(1.6) translateY(-20px) !important;
            }

            .quotation-logo-text span {
              font-size: 20px !important;
            }

            .quotation-company-info {
              font-size: 14px !important;
              line-height: 1.8 !important;
            }

            .quotation-title {
              font-size: 28px !important;
              margin-bottom: 32px !important;
            }

            .quotation-info-card {
              padding: 16px !important;
            }

            .quotation-policies {
              padding: 18px 20px !important;
            }

            .quotation-policies-title {
              font-size: 15px !important;
              margin-bottom: 14px !important;
            }

            .quotation-policies-list {
              font-size: 13px !important;
              line-height: 1.7 !important;
            }

            .quotation-action-buttons {
              gap: 14px !important;
              margin-top: 28px !important;
              margin-bottom: 20px !important;
            }

            .quotation-action-buttons .ant-btn {
              min-width: 110px !important;
              height: 38px !important;
              font-size: 15px !important;
            }
          }

          /* Mobile (<= 767px) */
          @media (max-width: 767px) {
            .quotation-root {
              padding: 12px 8px !important;
              font-size: 11px !important;
            }

            .quotation-header {
              margin-bottom: 16px !important;
              padding-bottom: 10px !important;
            }

            .quotation-logo-img {
              height: 75px !important;
              transform: scale(1.5) translateY(-10px) !important;
            }

            .quotation-logo-text span {
              font-size: 10px !important;
            }

            .quotation-company-info {
              font-size: 8px !important;
              line-height: 1.5 !important;
            }

            .quotation-company-info > div {
              margin-bottom: 4px !important;
            }

            .quotation-title {
              font-size: 18px !important;
              margin-bottom: 16px !important;
              letter-spacing: 0.3px !important;
            }

            .quotation-info-card {
              padding: 8px !important;
            }

            .quotation-info-card span,
            .quotation-info-card strong {
              font-size: 10px !important;
            }

            .quotation-info-card > div {
              margin-bottom: 6px !important;
            }

            .quotation-info-cards {
              gap: 10px !important;
              margin-bottom: 16px !important;
            }

            .quotation-amount-words {
              font-size: 11px !important;
              margin-bottom: 16px !important;
              margin-top: 4px !important;
            }

            .quotation-policies {
              padding: 12px 14px !important;
              margin-top: 20px !important;
            }

            .quotation-policies-title {
              font-size: 11px !important;
              margin-bottom: 8px !important;
            }

            .quotation-policies-list {
              font-size: 9px !important;
              line-height: 1.5 !important;
              padding-left: 14px !important;
            }

            .quotation-policies-list li {
              margin-bottom: 4px !important;
            }

            /* Table text smaller on mobile */
            .quotation-table-wrapper {
              margin-bottom: 16px !important;
            }

            .quotation-table-wrapper .ant-table-thead > tr > th,
            .quotation-table-wrapper .ant-table-tbody > tr > td {
              font-size: 10px !important;
              padding: 5px 3px !important;
            }

            .quotation-table-wrapper .ant-table-summary td {
              font-size: 10px !important;
              padding: 5px 3px !important;
            }

            .quotation-table-wrapper .ant-table-summary td span {
              font-size: 11px !important;
            }

            .quotation-action-buttons {
              flex-direction: column !important;
              gap: 10px !important;
              margin-top: 20px !important;
              margin-bottom: 16px !important;
            }

            .quotation-action-buttons .ant-btn {
              min-width: 100% !important;
              height: 36px !important;
              font-size: 14px !important;
            }
          }

          /* Table scroll for small screens */
          .quotation-table-wrapper {
            overflow-x: auto;
          }

          .quotation-table-wrapper .ant-table {
            min-width: 800px;
          }

          @media (max-width: 767px) {
            .quotation-table-wrapper .ant-table {
              min-width: 500px;
            }
          }

          .quotation-table-wrapper .ant-table-thead > tr > th,
          .quotation-table-wrapper .ant-table-tbody > tr > td {
            white-space: nowrap;
          }
        `}
      </style>

      <div
        className="quotation-root"
        style={{ 
          padding: '40px 24px', 
          background: '#ffffff', 
          minHeight: '100vh', 
          maxWidth: '1200px', 
          margin: '0 auto',
          fontFamily: 'Arial, sans-serif'
        }}
      >
       {/* Company Header */}
<div
  className="quotation-header"
  style={{
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '36px',
    paddingBottom: '20px',
    borderBottom: '1px solid #E5E7EB'
  }}
>
{/* Logo + Company Name */}
<div
  style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    flex: '0 0 40%'
  }}
>
<img
  src="/image/1.png"
  alt="Garage Hoàng Tuấn"
  className="quotation-logo-img"
  style={{
    height: '130px',
    width: 'auto',
    objectFit: 'contain',
    transform: 'scale(2) translateY(-30px)',
    transformOrigin: 'center top',
    marginBottom: '-6px'
  }}
/>
  <div
    className="quotation-logo-text"
    style={{
      textAlign: 'center',  
      lineHeight: '1.1'
    }}
  >
    <span
      style={{
        fontSize: '22px',
        fontWeight: 600,
        color: '#CBB081',
        marginRight: '6px'
      }}
    >
      Garage
    </span>

    <span
      style={{
        fontSize: '22px',
        fontWeight: 600,
        color: '#111827'
      }}
    >
      Hoàng Tuấn
    </span>
  </div>
</div>




  {/* Company Info */}
  <div
    className="quotation-company-info"
    style={{
      flex: '0 0 60%',
      fontSize: '16px',
      color: '#111827',
      lineHeight: '1.9'
    }}
  >
    <div>
      <strong>Địa chỉ:</strong>{' '}
      <span style={{ fontWeight: 400 }}>
        110 Đường Hoàng Nghiêu - Phố Đông - Phường Đông Tiến - Thanh Hóa
      </span>
    </div>

    <div>
      <strong>ĐT:</strong>{' '}
      <span style={{ fontWeight: 400 }}>0912.603.603</span>
    </div>

    <div>
      <strong>Số tài khoản:</strong>{' '}
      <span style={{ fontWeight: 400 }}>0912603603</span>
    </div>

    <div>
      <strong>Tại NH:</strong>{' '}
      <span style={{ fontWeight: 400 }}>
        Agribank CN Đông Sơn Thanh Hóa
      </span>
    </div>

    <div>
      <strong>Ngày:</strong>{' '}
      <span style={{ fontWeight: 400 }}>{quotationDate}</span>
    </div>
  </div>
</div>

        {/* Document Title */}
        <div
          className="quotation-title"
          style={{ 
            textAlign: 'center', 
            fontSize: '32px', 
            fontWeight: 700, 
            color: '#111827',
            marginBottom: '40px',
            letterSpacing: '1px'
          }}
        >
          BẢNG BÁO GIÁ
        </div>

        {/* Customer and Vehicle Info */}
        <div
          className="quotation-info-cards"
          style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '24px',
            marginBottom: '32px'
          }}
        >
          {/* Customer Info Card */}
          <div
            className="quotation-info-card"
            style={{
              background: '#f3f4f6',
              border: 'none',
              borderRadius: '8px',
              padding: '20px'
            }}
          >
            <div style={{ marginBottom: '12px' }}>
              <span style={{ fontWeight: 700, color: '#111827' }}>Tên khách hàng: </span>
              <span style={{ fontWeight: 400, color: '#111827' }}>{customer?.fullName || '—'}</span>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <span style={{ fontWeight: 700, color: '#111827' }}>Số điện thoại: </span>
              <span style={{ fontWeight: 400, color: '#111827' }}>{customer?.phone || '—'}</span>
            </div>
            <div>
              <span style={{ fontWeight: 700, color: '#111827' }}>Địa chỉ: </span>
              <span style={{ fontWeight: 400, color: '#111827' }}>{customer?.address || '—'}</span>
            </div>
          </div>

          {/* Vehicle Info Card */}
          <div
            className="quotation-info-card"
            style={{
              background: '#f3f4f6',
              border: 'none',
              borderRadius: '8px',
              padding: '20px'
            }}
          >
            <div style={{ marginBottom: '12px' }}>
              <span style={{ fontWeight: 700, color: '#111827' }}>Biển số xe: </span>
              <span style={{ fontWeight: 400, color: '#111827' }}>{vehicle?.licensePlate || '—'}</span>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <span style={{ fontWeight: 700, color: '#111827' }}>Loại xe: </span>
              <span style={{ fontWeight: 400, color: '#111827' }}>
                {vehicle?.brandName || '—'}
                {vehicle?.vehicleModelName ? ` - ${vehicle.vehicleModelName}` : ''}
              </span>
            </div>
            <div>
              <span style={{ fontWeight: 700, color: '#111827' }}>Số khung: </span>
              <span style={{ fontWeight: 400, color: '#111827' }}>{vehicle?.vin || '—'}</span>
            </div>
          </div>
        </div>

        {/* Quotation Items Table */}
        <div className="quotation-table-wrapper" style={{ marginBottom: '32px', overflowX: 'auto' }}>
          <style>
            {`
              .quotation-table .ant-table-container {
                border-radius: 0 !important;
              }
              .quotation-table table {
                border-collapse: collapse;
                min-width: 100%;
              }
              .quotation-table thead tr th,
              .quotation-table tbody tr td,
              .quotation-table tfoot tr th,
              .quotation-table tfoot tr td,
              .quotation-table .ant-table-summary td {
                border: 1px solid #9ca3af !important;
                white-space: nowrap;
              }
              .quotation-table thead tr th {
                background: #f9fafb;
                font-weight: 600;
                color: #111827;
              }
            `}
          </style>
          <Table
            className="quotation-table"
            columns={quotationColumns}
            dataSource={quotationItems.map((item, index) => ({
              ...item,
              key: item.priceQuotationItemId || item.id || index,
            }))}
            pagination={false}
            locale={{
              emptyText: 'Không có dữ liệu',
            }}
            summary={() => {
              const total = estimateAmount;
              return (
                <Table.Summary fixed>
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={5} align="right">
                      <span style={{ fontWeight: 700, fontSize: '16px' }}>Tổng cộng</span>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1} align="right">
                      <span style={{ fontWeight: 700, fontSize: '16px' }}>
                        {formatCurrency(total)}
                      </span>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                </Table.Summary>
              );
            }}
          />
        </div>

        {/* Trạng thái báo giá */}
        {/* <div
          style={{
            marginTop: '8px',
            marginBottom: '12px',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <span style={{ marginRight: 8, fontWeight: 500, color: '#374151' }}>
            Trạng thái:
          </span>
          <span
            style={{
              padding: '4px 10px',
              borderRadius: 999,
              fontSize: 13,
              fontWeight: 600,
              backgroundColor: quotationStatusConfig.badgeBg,
              color: quotationStatusConfig.badgeColor,
            }}
          >
            {quotationStatusConfig.label}
          </span>
        </div> */}

        {/* Amount in Words */}
        <div
          className="quotation-amount-words"
          style={{
            marginTop: '8px',
            marginBottom: '24px',
            fontSize: '16px',
            color: '#111827',
          }}
        >
          <span style={{ fontWeight: 700, marginRight: '6px' }}>BẰNG CHỮ:</span>
          <span style={{ fontWeight: 400 }}>
            {(() => {
              try {
                return numberToVietnameseWords(estimateAmount);
              } catch (err) {
                console.error('Error converting to words:', err);
                return 'Không đồng (chưa bao gồm thuế VAT)';
              }
            })()}
          </span>
        </div>

        {/* Policies & Terms */}
        <div
          className="quotation-policies"
          style={{
            border: '1px solid #D1D5DB',
            borderRadius: '8px',
            padding: '20px 24px',
            marginTop: '32px',
            backgroundColor: '#FFFFFF',
          }}
        >
          <div
            className="quotation-policies-title"
            style={{
              fontWeight: 700,
              fontSize: '16px',
              color: '#CBB081',
              marginBottom: '16px',
            }}
          >
            Chính sách & điều khoản
          </div>

          <ul
            className="quotation-policies-list"
            style={{
              margin: 0,
              paddingLeft: '18px', // để bullet gọn gàng
              listStyle: 'disc',
              color: '#374151',
              fontSize: '15px',
              lineHeight: '1.8',
            }}
          >
            <li style={{ marginBottom: '8px' }}>
              Cung cấp phụ tùng chính hãng.
            </li>
            <li style={{ marginBottom: '8px' }}>
              Những phát sinh sẽ được báo giá sau khi thực hiện cụ thể.
            </li>
            <li style={{ marginBottom: '8px' }}>
              Báo giá có hiệu lực trong vòng 07 ngày kể từ ngày báo giá.
            </li>
            <li style={{ marginBottom: '8px' }}>
              Khi đặt hàng khách hàng vui lòng đặt tiền trước 50% tổng giá trị thanh toán.
            </li>
            <li>
              Một số phụ tùng đặc biệt cần đặt trước 100% giá trị đơn hàng.
            </li>
          </ul>
        </div>

        {/* Thông báo trạng thái sau khi khách thao tác */}
        {normalizedQuotationStatus === 'CUSTOMER_REJECTED' && (
          <div
            style={{
              marginTop: 16,
              marginBottom: 8,
              textAlign: 'center',
              fontSize: 15,
              fontWeight: 600,
              color: '#b91c1c',
            }}
          >
            Khách hàng đã từ chối báo giá này.
          </div>
        )}

        {normalizedQuotationStatus === 'CUSTOMER_CONFIRMED' && (
          <div
            style={{
              marginTop: 16,
              marginBottom: 8,
              textAlign: 'center',
              fontSize: 15,
              fontWeight: 600,
              color: '#166534',
            }}
          >
            Khách hàng đã xác nhận báo giá này.
          </div>
        )}

        {hasCancelled && (
          <div
            style={{
              marginTop: 16,
              marginBottom: 8,
              textAlign: 'center',
              fontSize: 15,
              fontWeight: 600,
              color: '#1e40af',
            }}
          >
            Phiếu dịch vụ đã được hủy.
          </div>
        )}

        {/* Action Buttons (chỉ hiển thị khi chờ khách xác nhận) */}
        {showActionButtons && (
          <div
            className="quotation-action-buttons"
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '16px',
              marginTop: '32px',
              marginBottom: '24px',
            }}
          >
            <Button
              type="primary"
              size="large"
              loading={actionLoading}
              onClick={handleConfirm}
              style={{
                minWidth: '120px',
                height: '40px',
                fontSize: '16px',
                fontWeight: 600,
              }}
            >
              Xác nhận
            </Button>
            <Button
              danger
              size="large"
              loading={actionLoading}
              onClick={handleReject}
              style={{
                minWidth: '120px',
                height: '40px',
                fontSize: '16px',
                fontWeight: 600,
              }}
            >
              Từ chối
            </Button>
            <Button
              size="large"
              loading={actionLoading}
              onClick={handleCancel}
              style={{
                minWidth: '120px',
                height: '40px',
                fontSize: '16px',
                fontWeight: 600,
              }}
            >
              Hủy
            </Button>
          </div>
        )}

      </div>
    </>
  );
}
