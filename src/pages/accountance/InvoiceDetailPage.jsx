import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  Button,
  Table,
  message,
  Spin,
  Input,
  Row,
  Col,
  Modal,
  Tabs,
} from "antd";
import { ArrowLeftOutlined, CloseOutlined } from "@ant-design/icons";
import { usePayOS } from "@payos/payos-checkout";
import AccountanceLayout from "../../layouts/AccountanceLayout";
import { invoiceAPI, transactionsAPI } from "../../services/api";
import { goldTableHeader } from "../../utils/tableComponents";
import dayjs from "dayjs";
import Lottie from "lottie-react";
import successAnim from "../../assets/animations/Success.json";

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [invoiceData, setInvoiceData] = useState(null);
  const [showDepositForm, setShowDepositForm] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [paymentData, setPaymentData] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("QR");
  const payOSElementRef = useRef(null);
  
  // States for payment form (WAITING_FOR_DELIVERY)
  const [showPaymentTabs, setShowPaymentTabs] = useState(false); // Show tabs when click +
  const [paymentTab, setPaymentTab] = useState("CASH");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [cashReceived, setCashReceived] = useState(""); // Số tiền khách trả
  const [paymentAmountError, setPaymentAmountError] = useState(false); // Lỗi validation cho paymentAmount
  
  // State for debt modal
  const [showDebtModal, setShowDebtModal] = useState(false);
  const [debtDueDate, setDebtDueDate] = useState(dayjs().add(7, 'day').format('YYYY-MM-DD'));
  
  // State for success div
  const [showSuccessDiv, setShowSuccessDiv] = useState(false);
  const [successTransactionData, setSuccessTransactionData] = useState(null);
  const [lastPaymentPrice, setLastPaymentPrice] = useState(null); // Lưu giá trị paymentPrice đã truyền vào payload

  const [payOSInitialized, setPayOSInitialized] = useState(false);

  const [payOSConfig, setPayOSConfig] = useState({
    RETURN_URL: `${window.location.origin}/`, // required
    ELEMENT_ID: "payos-checkout-container", // required
    CHECKOUT_URL: null, // required
    embedded: true, // Nếu dùng giao diện nhúng
    onSuccess: async (event) => {
      console.log("Payment successful:", event);
      await transactionsAPI.callback(event.id);
      await fetchInvoiceDetail();
      
      // Lấy lại dữ liệu invoice để có thông tin giao dịch mới nhất
      const { data: invoiceResponse } = await invoiceAPI.getById(id);
      const latestInvoice = invoiceResponse?.result;
      const latestTransactions = latestInvoice?.transactions || [];
      const latestTransaction = latestTransactions.length > 0 ? latestTransactions[latestTransactions.length - 1] : null;
      
      // Lấy thông tin khách hàng
      const customer = latestInvoice?.serviceTicket?.customer;
      const customerName = customer?.fullName || customer?.name || "N/A";
      const customerPhone = customer?.phone || "N/A";
      
      // Lấy số tiền đã truyền vào payload từ transaction
      // Với QR, số tiền đã truyền vào payload là finalAmount
      const paymentAmount = latestTransaction?.amount || event.amount || finalAmount || 0;
      
      // Hiển thị success div - sử dụng số tiền đã truyền vào payload
      setSuccessTransactionData({
        customerName: customerName,
        customerPhone: customerPhone,
        transactionCode: latestTransaction?.transactionCode || latestTransaction?.code || event.id || 'N/A',
        totalAmount: paymentAmount, // Sử dụng số tiền đã truyền vào payload
        serviceTicketCode: latestInvoice?.serviceTicket?.serviceTicketCode || "N/A"
      });
      console.log("QR Payment successful - Setting showSuccessDiv to true");
      setShowSuccessDiv(true);
      setShowDepositForm(true); // Đảm bảo sidebar hiển thị
      setShowPaymentTabs(false); // Ẩn form thanh toán
      setPaymentData(null);
      setDepositAmount("");
      setPayOSInitialized(false);
      console.log("Success div should be visible now");

      try {
        if (window.opener && !window.opener.closed) {
          window.close();
        }
      } catch (e) {
        console.warn("Không thể tự đóng tab thanh toán:", e);
      }
    },
    onExit: (event) => {
      console.log("User exited payment:", event);
      setPayOSInitialized(false);
    },
    onCancel: (event) => {
      console.log("Payment canceled:", event);
      message.info("Đã hủy thanh toán");
      setPayOSInitialized(false);
    },
  });

  const { exit, open } = usePayOS(payOSConfig);

  useEffect(() => {
    if (payOSConfig.CHECKOUT_URL != null) {
      open();
    }
  }, [payOSConfig]);

  useEffect(() => {
    fetchInvoiceDetail();
  }, [id]);

  // Helper function để kiểm tra có phải trạng thái "Thanh toán" không
  const isPaymentStatus = (status) => {
    if (!status) return false
    const statusStr = status.toString().trim()
    const statusUpper = statusStr.toUpperCase()
    return (
      statusUpper === 'WAITING_FOR_DELIVERY' ||
      statusStr.includes('Chờ bàn giao')
    )
  }
  
  // Helper function để kiểm tra có phải trạng thái "Hoàn thành" không
  const isCompletedStatus = (status) => {
    if (!status) return false
    const statusStr = status.toString().trim()
    const statusUpper = statusStr.toUpperCase()
    return (
      statusStr === 'Hoàn thành' ||
      statusUpper === 'COMPLETED'
    )
  }

  const fetchInvoiceDetail = async () => {
    if (!id) return;

    setLoading(true);
    try {
      const { data: response, error } = await invoiceAPI.getById(id);

      if (error) {
        message.error("Không thể tải chi tiết phiếu thanh toán");
        setLoading(false);
        return;
      }

      const invoiceResult = response?.result || null;
      
      // Fetch transactions for this invoice
      try {
        const { data: transactionsResponse, error: transactionsError } = 
          await transactionsAPI.getByInvoiceId(id);
        
        if (!transactionsError && transactionsResponse?.result) {
          // Merge transactions into invoice data
          invoiceResult.transactions = transactionsResponse.result;
        }
      } catch (transactionsErr) {
        console.error("Failed to fetch transactions:", transactionsErr);
        // Don't show error, just continue without transactions
        invoiceResult.transactions = [];
      }

      setInvoiceData(invoiceResult);
    } catch (err) {
      console.error("Failed to fetch invoice detail:", err);
      message.error("Đã xảy ra lỗi khi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return "0";
    return Number(amount).toLocaleString("vi-VN");
  };

  const numberToWords = (num) => {
    if (!num || num === 0) return "Không đồng";
    return invoiceData?.amountInWords || "Không đồng";
  };

  const quotationItems =
    invoiceData?.serviceTicket?.priceQuotation?.items || [];
  const totalMerchandise = quotationItems
    .filter((item) => item.itemType === "PART")
    .reduce(
      (sum, item) =>
        sum + (item.totalPrice || item.quantity * item.unitPrice || 0),
      0
    );

  const totalLabor = quotationItems
    .filter((item) => item.itemType === "SERVICE")
    .reduce(
      (sum, item) =>
        sum + (item.totalPrice || item.quantity * item.unitPrice || 0),
      0
    );

  const discount = invoiceData?.serviceTicket?.priceQuotation?.discount || 0;
  const depositReceived = invoiceData?.depositReceived || 0;
  const paidAmount = invoiceData?.paidAmount || 0;
  const finalAmount = invoiceData?.finalAmount || 0;

  const quotationColumns = [
    {
      title: "STT",
      key: "index",
      width: 60,
      render: (_, __, index) => String(index + 1).padStart(2, "0"),
    },
    {
      title: "Danh mục",
      dataIndex: "categoryName",
      key: "categoryName",
      render: (text, record) =>
        text || record.partName || record.name || record.itemName || "N/A",
    },
    {
      title: "Số lượng",
      dataIndex: "quantity",
      key: "quantity",
      width: 100,
      align: "right",
      render: (value) => value || 1,
    },
    {
      title: "Đơn giá",
      dataIndex: "unitPrice",
      key: "unitPrice",
      width: 150,
      align: "right",
      render: (value) => formatCurrency(value),
    },
    {
      title: "Thành tiền",
      key: "total",
      width: 150,
      align: "right",
      render: (_, record) => {
        const total =
          record.totalPrice || (record.quantity || 1) * (record.unitPrice || 0);
        return formatCurrency(total);
      },
    },
  ];

  if (loading) {
    return (
      <AccountanceLayout>
        <div style={{ padding: "24px", textAlign: "center" }}>
          <Spin size="large" />
        </div>
      </AccountanceLayout>
    );
  }

  if (!invoiceData) {
    return (
      <AccountanceLayout>
        <div style={{ padding: "24px", textAlign: "center" }}>
          <p>Không tìm thấy phiếu thanh toán</p>
          <Button onClick={() => navigate("/accountance/payments")}>
            Quay lại
          </Button>
        </div>
      </AccountanceLayout>
    );
  }

  const customer = invoiceData?.serviceTicket?.customer;
  const customerName = customer?.fullName || customer?.name || "N/A";
  const serviceTicketCode =
    invoiceData?.serviceTicket?.serviceTicketCode || "N/A";
  
  // Công nợ mới = Thành tiền (finalAmount)
  const remainingAmount = finalAmount || 0;

  const handleDepositChange = (value) => {
    const numValue = value.replace(/[^\d]/g, "");
    const depositNum = Number(numValue);

    if (numValue && depositNum > finalAmount) {
      message.warning("Số tiền đặt cọc không được vượt quá tổng tiền cần thu");
      return;
    }

    setDepositAmount(numValue);
  };

  const handleCancel = () => {
    setShowDepositForm(false);
    setDepositAmount("");
  };

  // Handle payment for modal (WAITING_FOR_DELIVERY)
  const handleModalPayment = async () => {
    if (paymentTab === "CASH") {
      if (!cashReceived || Number(cashReceived) <= 0) {
        message.warning("Vui lòng nhập số tiền nhận của khách");
        return;
      }
    } else if (paymentTab === "QR") {
      // Validation cho QR: yêu cầu nhập số tiền cần thanh toán
      if (!paymentAmount || paymentAmount.trim() === "" || Number(paymentAmount) <= 0) {
        setPaymentAmountError(true);
        message.warning("Vui lòng nhập số tiền cần thanh toán");
        return;
      }
      setPaymentAmountError(false);
    }

    const finalAmount = invoiceData?.finalAmount || 0;

    setPaymentLoading(true);
    try {
      const isPayment = isPaymentStatus(invoiceData?.serviceTicket?.status);
      
      // Nếu số tiền nhận của khách lớn hơn số tiền cần thanh toán, thì chỉ thanh toán số tiền cần thanh toán
      // Với QR, sử dụng paymentAmount nếu có và > 0, nếu không thì dùng finalAmount
      const paymentPrice = paymentTab === "CASH" 
        ? Math.min(Number(cashReceived), finalAmount)
        : (paymentAmount && paymentAmount.trim() !== "" && Number(paymentAmount) > 0 
            ? Number(paymentAmount) 
            : finalAmount);
      
      const payload = {
        method: paymentTab === "CASH" ? "CASH" : "BANK_TRANSFER",
        price: paymentPrice,
        type: isPayment ? "PAYMENT" : "DEPOSIT",
      };

      console.log("=== MODAL PAYMENT DEBUG ===");
      console.log("Payment Tab:", paymentTab);
      console.log("Status:", invoiceData?.serviceTicket?.status);
      console.log("Type:", isPayment ? "PAYMENT" : "DEPOSIT");
      console.log("Payload:", JSON.stringify(payload, null, 2));
      console.log("Payment Price (will be used in success div):", paymentPrice);
      
      // Lưu paymentPrice để sử dụng trong success div
      setLastPaymentPrice(paymentPrice);

      const { data: response, error } = await invoiceAPI.pay(id, payload);

      if (error) {
        message.error(error || "Tạo giao dịch thanh toán thất bại");
        setPaymentLoading(false);
        return;
      }

      const result = response?.result || null;
      console.log("Payment response:", result);

      if (paymentTab === "CASH") {
        // Fetch lại invoice để lấy thông tin giao dịch mới nhất
        await fetchInvoiceDetail();
        
        // Lấy lại dữ liệu invoice để có thông tin giao dịch mới nhất
        const { data: invoiceResponse } = await invoiceAPI.getById(id);
        const latestInvoice = invoiceResponse?.result;
        const latestTransactions = latestInvoice?.transactions || [];
        const latestTransaction = latestTransactions.length > 0 ? latestTransactions[latestTransactions.length - 1] : null;
        
        // Lấy thông tin khách hàng
        const customer = latestInvoice?.serviceTicket?.customer;
        const customerName = customer?.fullName || customer?.name || "N/A";
        const customerPhone = customer?.phone || "N/A";
        
        // Hiển thị success div - sử dụng paymentPrice đã truyền vào payload
        setSuccessTransactionData({
          customerName: customerName,
          customerPhone: customerPhone,
          transactionCode: latestTransaction?.transactionCode || latestTransaction?.code || result?.transactionCode || result?.code || result?.transactionId || 'N/A',
          totalAmount: lastPaymentPrice || paymentPrice, // Sử dụng giá trị đã truyền vào payload
          serviceTicketCode: latestInvoice?.serviceTicket?.serviceTicketCode || "N/A"
        });
        console.log("Setting showSuccessDiv to true");
        setShowSuccessDiv(true);
        setShowDepositForm(true); // Đảm bảo sidebar hiển thị
        setShowPaymentTabs(false); // Ẩn form thanh toán
        setPaymentAmount("");
        console.log("Success div should be visible now");
      } else {
        // QR - show QR code
        if (result?.paymentUrl) {
          setPaymentData(result);
          setPayOSConfig((config) => ({
            ...config,
            CHECKOUT_URL: result?.paymentUrl,
          }));
        }
      }
    } catch (err) {
      console.error("Error creating payment:", err);
      message.error("Đã xảy ra lỗi khi tạo giao dịch thanh toán");
    } finally {
      setPaymentLoading(false);
    }
  };

  const handlePayment = async (type = "QR") => {
    if (!depositAmount || Number(depositAmount) <= 0) {
      message.warning("Vui lòng nhập số tiền đặt cọc");
      return;
    }

    if (Number(depositAmount) > finalAmount) {
      message.error("Số tiền đặt cọc không được vượt quá tổng tiền cần thu");
      return;
    }

    setPaymentLoading(true);
    try {
      const isPayment = isPaymentStatus(invoiceData?.serviceTicket?.status);
      
      const payload = {
        method: type === "QR" ? "BANK_TRANSFER" : "CASH",
        price: Number(depositAmount),
        type: isPayment ? "PAYMENT" : "DEPOSIT",
      };

      console.log("=== PAYMENT DEBUG ===");
      console.log("Status:", invoiceData?.serviceTicket?.status);
      console.log("Type:", isPayment ? "PAYMENT" : "DEPOSIT");
      console.log("Payload:", JSON.stringify(payload, null, 2));

      const { data: response, error } = await invoiceAPI.pay(id, payload);

      if (error) {
        message.error(error || "Tạo giao dịch thanh toán thất bại");
        setPaymentLoading(false);
        return;
      }

      const result = response?.result || null;
      console.log("Payment response:", result);
      console.log("Payment URL:", result?.paymentUrl);
      setPaymentData(result);
      setPaymentMethod(type);

      if (type === "QR") {
        console.log(payOSConfig);
        setPayOSConfig((config) => ({
          ...config,
          CHECKOUT_URL: result?.paymentUrl,
        }));
      }
    } catch (err) {
      console.error("Error creating payment:", err);
      message.error("Đã xảy ra lỗi khi tạo giao dịch thanh toán");
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleCreateDebt = async () => {
    if (!debtDueDate) {
      message.warning('Vui lòng chọn ngày hẹn trả');
      return;
    }

    try {
      const payload = {
        dueDate: debtDueDate
      };
      
      const { data, error } = await invoiceAPI.createDebt(id, payload);
      
      if (error) {
        throw new Error(error);
      }

      message.success('Đã tạo phiếu công nợ thành công');
      setShowDebtModal(false);
      setShowDepositForm(false);
      setShowPaymentTabs(false);
      // Refresh invoice data to get updated information
      await fetchInvoiceDetail();
    } catch (err) {
      console.error('Error creating debt:', err);
      message.error(err?.message || 'Tạo phiếu công nợ thất bại');
    }
  };

  return (
    <AccountanceLayout>
      <div
        style={{ padding: "24px", background: "#ffffff", minHeight: "100vh" }}
      >
        <Row gutter={24}>
          <Col span={showDepositForm ? 16 : 24}>
            <Card style={{ borderRadius: "12px", marginBottom: "24px" }}>
              <h2
                className="h4"
                style={{ fontWeight: 700, marginBottom: "20px" }}
              >
                BÁO GIÁ CHI TIẾT
              </h2>
              <Table
                columns={quotationColumns}
                dataSource={quotationItems.map((item, index) => ({
                  ...item,
                  key: item.id || index,
                }))}
                pagination={false}
                components={goldTableHeader}
              />
            </Card>

            <Card style={{ borderRadius: "12px", marginBottom: "24px" }}>
              <h2
                className="h4"
                style={{ fontWeight: 700, marginBottom: "20px" }}
              >
                Thanh toán
              </h2>
              
              {/* Payment Summary */}
              <div
                style={{
                  border: "2px solid #CBB081",
                  borderRadius: "8px",
                  padding: "16px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  {/* Tổng tiền hàng */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "15px",
                    }}
                  >
                    <span style={{ color: "#374151" }}>Tổng tiền hàng</span>
                    <span style={{ fontWeight: 500 }}>
                      {formatCurrency(invoiceData?.serviceTicket?.priceQuotation?.estimateAmount || 0)}
                    </span>
                  </div>

                  {/* Chiết khấu */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "15px",
                    }}
                  >
                    <span style={{ color: "#374151" }}>Chiết khấu</span>
                    <span style={{ fontWeight: 500 }}>
                      {formatCurrency(invoiceData?.serviceTicket?.priceQuotation?.discount || 0)}%
                    </span>
                  </div>

                  {/* Tiền cọc */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "15px",
                      paddingBottom: "12px",
                      borderBottom: "1px solid #e5e7eb",
                    }}
                  >
                    <span style={{ color: "#374151" }}>Tiền cọc</span>
                    <span style={{ fontWeight: 500 }}>
                      {formatCurrency(invoiceData?.depositReceived || 0)}
                    </span>
                  </div>

                  {/* Đã thanh toán */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "15px",
                    }}
                  >
                    <span style={{ color: "#374151" }}>Đã thanh toán</span>
                    <span style={{ fontWeight: 500 }}>
                      {formatCurrency(paidAmount)}
                    </span>
                  </div>

                  {/* Thành tiền */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "16px",
                    }}
                  >
                    <span style={{ color: "#374151", fontWeight: 600 }}>Thành tiền</span>
                    <span style={{ fontWeight: 700, color: "#CBB081" }}>
                      {formatCurrency(invoiceData?.finalAmount || 0)}
                    </span>
                  </div>

                  {/* Bằng chữ */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "14px",
                      fontStyle: "italic",
                    }}
                  >
                    <span style={{ color: "#6b7280" }}>Bằng chữ</span>
                    <span style={{ color: "#6b7280" }}>
                      {invoiceData?.amountInWords || ""}
                    </span>
                  </div>
                </div>
              </div>

              
            </Card>

            <Card
              style={{
                borderRadius: "12px",
                borderTop: "4px solid #CBB081",
                marginBottom: "24px",
              }}
            >
              <h2
                className="h5"
                style={{ fontWeight: 700, marginBottom: "16px" }}
              >
                Chính sách & điều khoản
              </h2>
              <div style={{ paddingLeft: "20px" }}>
                <ul
                  style={{
                    margin: 0,
                    padding: 0,
                    listStyle: "disc",
                    color: "#374151",
                  }}
                >
                  <li style={{ marginBottom: "8px" }}>
                    Xe đã được kiểm tra và bàn giao đầy đủ.
                  </li>
                  <li style={{ marginBottom: "8px" }}>
                    Thanh toán đầy đủ trước khi nhận xe.
                  </li>
                  <li style={{ marginBottom: "8px" }}>
                    Bảo hành 03 tháng hoặc 3.000 km cho hạng mục sửa chữa.
                  </li>
                  <li style={{ marginBottom: "8px" }}>
                    Không áp dụng bảo hành nếu xe tự ý sửa tại nơi khác, tai nạn
                    hoặc ngập nước.
                  </li>
                  <li>
                    Gara không chịu trách nhiệm với tài sản cá nhân để trong xe.
                  </li>
                </ul>
              </div>
            </Card>

            {!showDepositForm && !showSuccessDiv && !isCompletedStatus(invoiceData?.serviceTicket?.status) && (
              <div
                style={{
                  marginTop: "24px",
                  display: "flex",
                  justifyContent: "flex-end",
                }}
              >
                {/* Ẩn nút "Thanh toán" nếu finalAmount === 0 */}
                {!(isPaymentStatus(invoiceData?.serviceTicket?.status) && finalAmount === 0) && (
                  <Button
                    type="primary"
                    size="large"
                    onClick={() => {
                      setShowDepositForm(true);
                      setShowPaymentTabs(false); // Reset tabs state
                    }}
                    style={{
                      background: "#22c55e",
                      borderColor: "#22c55e",
                      height: "45px",
                      padding: "0 40px",
                      fontWeight: 600,
                      fontSize: "16px",
                    }}
                  >
                    {isPaymentStatus(invoiceData?.serviceTicket?.status) ? "Thanh toán" : "Đặt cọc"}
                  </Button>
                )}
                {/* Hiển thị thông báo nếu finalAmount === 0 và đang ở trạng thái thanh toán */}
                {isPaymentStatus(invoiceData?.serviceTicket?.status) && finalAmount === 0 && (
                  <div style={{ textAlign: "center", padding: "20px", color: "#6b7280", width: "100%" }}>
                    Không có số tiền cần thanh toán
                  </div>
                )}
              </div>
            )}
          </Col>

          {(showDepositForm || showSuccessDiv) && (
            <Col span={8}>
              <Card
                style={{
                  borderRadius: "12px",
                  position: "sticky",
                  top: "24px",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                  border: "1px solid #e5e7eb",
                }}
              >
                {/* Success Div */}
                {showSuccessDiv ? (
                  <div style={{ padding: "12px 0" }}>
                    {/* Header */}
                    <div
                      style={{
                        background: "#CBB081",
                        color: "#fff",
                        padding: "16px 20px",
                        borderRadius: "8px 8px 0 0",
                        margin: "-12px -12px 24px -12px",
                        fontWeight: 700,
                        fontSize: "16px",
                        textAlign: "center",
                      }}
                    >
                      THANH TOÁN
                    </div>

                    {/* Success Animation */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        marginBottom: "24px",
                      }}
                    >
                      <Lottie
                        animationData={successAnim}
                        loop={false}
                        style={{ width: 200, height: 200 }}
                      />
                    </div>

                    {/* Transaction Info */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                      {/* Mã giao dịch */}
                      <div>
                        <label
                          style={{
                            display: "block",
                            marginBottom: "8px",
                            fontWeight: 600,
                            fontSize: "14px",
                            color: "#374151",
                          }}
                        >
                          Mã giao dịch
                        </label>
                        <Input
                          value={successTransactionData?.transactionCode || "N/A"}
                          disabled
                          style={{
                            height: "40px",
                            borderRadius: "8px",
                            backgroundColor: "#f9fafb",
                            borderColor: "#d1d5db",
                          }}
                        />
                      </div>

                      {/* Tên khách hàng */}
                      <div>
                        <label
                          style={{
                            display: "block",
                            marginBottom: "8px",
                            fontWeight: 600,
                            fontSize: "14px",
                            color: "#374151",
                          }}
                        >
                          Tên khách hàng
                        </label>
                        <Input
                          value={successTransactionData?.customerName || "N/A"}
                          disabled
                          style={{
                            height: "40px",
                            borderRadius: "8px",
                            backgroundColor: "#f9fafb",
                            borderColor: "#d1d5db",
                          }}
                        />
                      </div>

                      {/* Số điện thoại */}
                      <div>
                        <label
                          style={{
                            display: "block",
                            marginBottom: "8px",
                            fontWeight: 600,
                            fontSize: "14px",
                            color: "#374151",
                          }}
                        >
                          Số điện thoại
                        </label>
                        <Input
                          value={successTransactionData?.customerPhone || "N/A"}
                          disabled
                          style={{
                            height: "40px",
                            borderRadius: "8px",
                            backgroundColor: "#f9fafb",
                            borderColor: "#d1d5db",
                          }}
                        />
                      </div>

                      {/* Tổng tiền */}
                      <div>
                        <label
                          style={{
                            display: "block",
                            marginBottom: "8px",
                            fontWeight: 600,
                            fontSize: "14px",
                            color: "#374151",
                          }}
                        >
                          Tổng tiền
                        </label>
                        <Input
                          value={
                            successTransactionData?.totalAmount
                              ? Number(successTransactionData.totalAmount).toLocaleString("vi-VN")
                              : "0"
                          }
                          disabled
                          style={{
                            height: "40px",
                            borderRadius: "8px",
                            backgroundColor: "#f9fafb",
                            borderColor: "#d1d5db",
                          }}
                        />
                      </div>

                      {/* Buttons */}
                      <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                        <Button
                          onClick={() => {
                            setShowSuccessDiv(false);
                            setShowDepositForm(false);
                          }}
                          style={{
                            flex: 1,
                            height: "45px",
                            borderRadius: "8px",
                            fontWeight: 600,
                            fontSize: "14px",
                          }}
                        >
                          Hủy
                        </Button>
                        <Button
                          type="primary"
                          onClick={() => {
                            setShowSuccessDiv(false);
                            setShowDepositForm(true);
                            setShowPaymentTabs(false);
                            setPaymentAmount("");
                            setCashReceived("");
                          }}
                          style={{
                            flex: 1,
                            background: "#22c55e",
                            borderColor: "#22c55e",
                            height: "45px",
                            fontWeight: 600,
                            fontSize: "14px",
                            borderRadius: "8px",
                          }}
                        >
                          Tiếp tục
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : isPaymentStatus(invoiceData?.serviceTicket?.status) ? (
                  <div style={{ padding: "12px 0" }}>
                    {/* Step 1: Show transaction table first */}
                    {!showPaymentTabs ? (
                      <>
                        {/* Khách hàng */}
                        <div style={{ marginBottom: "20px" }}>
                          <label
                            style={{
                              display: "block",
                              marginBottom: "8px",
                              fontWeight: 600,
                              fontSize: "14px",
                              color: "#374151",
                            }}
                          >
                            Khách hàng
                          </label>
                          <Input
                            value={customerName}
                            disabled
                            style={{
                              height: "40px",
                              borderRadius: "8px",
                              backgroundColor: "#f9fafb",
                              borderColor: "#d1d5db",
                            }}
                          />
                        </div>

                        {/* Mã phiếu */}
                        <div style={{ marginBottom: "20px" }}>
                          <label
                            style={{
                              display: "block",
                              marginBottom: "8px",
                              fontWeight: 600,
                              fontSize: "14px",
                              color: "#374151",
                            }}
                          >
                            Mã phiếu
                          </label>
                          <Input
                            value={serviceTicketCode}
                            disabled
                            style={{
                              height: "40px",
                              borderRadius: "8px",
                              backgroundColor: "#f9fafb",
                              borderColor: "#d1d5db",
                            }}
                          />
                        </div>

                        {/* Số tiền thực thu */}
                        <div style={{ marginBottom: "20px" }}>
                          <label
                            style={{
                              display: "block",
                              marginBottom: "8px",
                              fontWeight: 600,
                              fontSize: "14px",
                              color: "#374151",
                            }}
                          >
                            Số tiền thực thu
                          </label>
                          <Input
                            value={formatCurrency(invoiceData?.finalAmount || 0)}
                            disabled
                            style={{
                              height: "40px",
                              borderRadius: "8px",
                              backgroundColor: "#f9fafb",
                              borderColor: "#d1d5db",
                            }}
                          />
                        </div>

                        {/* Bảng giao dịch */}
                        <div style={{ marginBottom: "20px" }}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              marginBottom: "12px",
                            }}
                          >
                            <label
                              style={{
                                fontWeight: 600,
                                fontSize: "14px",
                                color: "#374151",
                              }}
                            >
                              Bảng giao dịch
                            </label>
                            <Button
                              type="link"
                              icon={<i className="bi bi-plus-circle" />}
                              style={{ padding: 0, fontSize: "18px" }}
                              onClick={() => {
                                setShowPaymentTabs(true);
                                setPaymentTab("CASH");
                                setPaymentAmount("");
                                setPaymentData(null);
                              }}
                            />
                          </div>
                          <div
                            style={{
                              border: "1px solid #e5e7eb",
                              borderRadius: "8px",
                              overflow: "hidden",
                            }}
                          >
                            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                              <thead>
                                <tr style={{ backgroundColor: "#f9fafb" }}>
                                  <th
                                    style={{
                                      padding: "10px 12px",
                                      textAlign: "left",
                                      fontSize: "13px",
                                      fontWeight: 600,
                                      color: "#6b7280",
                                      borderBottom: "1px solid #e5e7eb",
                                    }}
                                  >
                                    Mã giao dịch
                                  </th>
                                  <th
                                    style={{
                                      padding: "10px 12px",
                                      textAlign: "center",
                                      fontSize: "13px",
                                      fontWeight: 600,
                                      color: "#6b7280",
                                      borderBottom: "1px solid #e5e7eb",
                                    }}
                                  >
                                    Số tiền
                                  </th>
                                  <th
                                    style={{
                                      padding: "10px 12px",
                                      textAlign: "center",
                                      fontSize: "13px",
                                      fontWeight: 600,
                                      color: "#6b7280",
                                      borderBottom: "1px solid #e5e7eb",
                                    }}
                                  >
                                    Phương thức
                                  </th>
                                  <th
                                    style={{
                                      padding: "10px 12px",
                                      width: "40px",
                                      borderBottom: "1px solid #e5e7eb",
                                    }}
                                  ></th>
                                </tr>
                              </thead>
                              <tbody>
                                {invoiceData?.transactions?.length > 0 ? (
                                  invoiceData.transactions.map((transaction, index) => (
                                    <tr
                                      key={transaction.id || index}
                                      style={{
                                        borderBottom:
                                          index < invoiceData.transactions.length - 1
                                            ? "1px solid #f3f4f6"
                                            : "none",
                                      }}
                                    >
                                      <td
                                        style={{
                                          padding: "10px 12px",
                                          fontSize: "13px",
                                          color: "#374151",
                                        }}
                                      >
                                        {transaction.paymentLinkId ||
                                          (transaction.id ? `GD-${transaction.id}` : "N/A")}
                                      </td>
                                      <td
                                        style={{
                                          padding: "10px 12px",
                                          textAlign: "center",
                                          fontSize: "13px",
                                          fontWeight: 500,
                                          color: "#374151",
                                        }}
                                      >
                                        {formatCurrency(transaction.amount || 0)}
                                      </td>
                                      <td
                                        style={{
                                          padding: "10px 12px",
                                          textAlign: "center",
                                          fontSize: "13px",
                                          color: "#374151",
                                        }}
                                      >
                                        {transaction.method === "CASH"
                                          ? "Tiền mặt"
                                          : transaction.method === "BANK_TRANSFER" || transaction.method === "QR"
                                          ? "QR"
                                          : transaction.method || "N/A"}
                                      </td>
                                      <td
                                        style={{
                                          padding: "10px 12px",
                                          textAlign: "center",
                                        }}
                                      >
                                        <Button
                                          type="text"
                                          icon={
                                            <i
                                              className="bi bi-trash"
                                              style={{ color: "#ef4444", fontSize: "14px" }}
                                            />
                                          }
                                          size="small"
                                          style={{ padding: "4px" }}
                                        />
                                      </td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td
                                      colSpan={4}
                                      style={{
                                        padding: "20px",
                                        textAlign: "center",
                                        color: "#9ca3af",
                                        fontSize: "13px",
                                      }}
                                    >
                                      Chưa có giao dịch
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Cộng hợp nhất */}
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            paddingTop: "12px",
                            borderTop: "1px solid #e5e7eb",
                            marginBottom: "20px",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "14px",
                              color: "#6b7280",
                            }}
                          >
                            Cộng hợp nhất
                          </span>
                          <span
                            style={{
                              fontSize: "14px",
                              fontWeight: 600,
                              color: "#374151",
                            }}
                          >
                            {formatCurrency(
                              invoiceData?.transactions?.reduce(
                                (sum, t) => {
                                  // Chỉ tính các transaction SUCCESS
                                  if (!t.status || t.status === 'SUCCESS' || t.status === 'SUCCEEDED') {
                                    return sum + (t.amount || 0);
                                  }
                                  return sum;
                                },
                                0
                              ) || 0
                            )}
                          </span>
                        </div>

                        {/* Cộng nợ mới */}
                        <div style={{ marginBottom: "20px" }}>
                          <label
                            style={{
                              display: "block",
                              marginBottom: "8px",
                              fontWeight: 600,
                              fontSize: "14px",
                              color: "#374151",
                            }}
                          >
                            Cộng nợ mới
                          </label>
                          <Input
                            value={formatCurrency(remainingAmount)}
                            disabled
                            style={{
                              height: "40px",
                              borderRadius: "8px",
                              backgroundColor: "#f9fafb",
                              borderColor: "#d1d5db",
                            }}
                          />
                        </div>

                        {/* Buttons */}
                        <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                          <Button
                            onClick={() => {
                              setShowDepositForm(false);
                              setShowPaymentTabs(false);
                            }}
                            style={{
                              flex: 1,
                              height: "45px",
                              borderRadius: "8px",
                              fontWeight: 600,
                              fontSize: "14px",
                            }}
                          >
                            Hủy
                          </Button>
                          <Button
                            type="primary"
                            disabled={remainingAmount === 0}
                            onClick={() => {
                              if (remainingAmount === 0) {
                                message.info("Khách hàng không còn công nợ");
                                return;
                              }
                              if (remainingAmount > 0) {
                                setShowDebtModal(true);
                              } else {
                                setShowDepositForm(true); // Giữ sidebar hiển thị
                                setShowPaymentTabs(false); // Quay về hiển thị bảng giao dịch
                              }
                            }}
                            style={{
                              flex: 1,
                              background: remainingAmount === 0 ? "#d1d5db" : "#22c55e",
                              borderColor: remainingAmount === 0 ? "#d1d5db" : "#22c55e",
                              height: "45px",
                              fontWeight: 600,
                              fontSize: "14px",
                              borderRadius: "8px",
                              cursor: remainingAmount === 0 ? "not-allowed" : "pointer",
                            }}
                          >
                            Lưu
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Step 2: Show Tabs after clicking + */}
                        <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
                          <Button
                            style={{
                              flex: 1,
                              height: "40px",
                              borderRadius: "8px",
                              background: paymentTab === "CASH" ? "#CBB081" : "#ffffff",
                              color: paymentTab === "CASH" ? "#ffffff" : "#374151",
                              border: paymentTab === "CASH" ? "none" : "1px solid #e5e7eb",
                              fontWeight: 600,
                            }}
                            onClick={() => {
                              setPaymentTab("CASH");
                              setPaymentData(null);
                              setPaymentAmount(""); // Reset paymentAmount khi chuyển sang CASH
                            }}
                          >
                            Tiền mặt
                          </Button>
                          <Button
                            style={{
                              flex: 1,
                              height: "40px",
                              borderRadius: "8px",
                              background: paymentTab === "QR" ? "#CBB081" : "#ffffff",
                              color: paymentTab === "QR" ? "#ffffff" : "#374151",
                              border: paymentTab === "QR" ? "none" : "1px solid #e5e7eb",
                              fontWeight: 600,
                            }}
                            onClick={() => {
                              setPaymentTab("QR");
                              setPaymentData(null);
                              // Tự động fill finalAmount vào paymentAmount khi chuyển sang tab QR
                              const finalAmount = invoiceData?.finalAmount || 0;
                              setPaymentAmount(finalAmount.toString());
                              setPaymentAmountError(false); // Reset lỗi khi chuyển tab
                            }}
                          >
                            QR
                          </Button>
                        </div>

                    {/* Content */}
                    {!paymentData ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                        {/* Khách hàng */}
                        <div>
                          <label
                            style={{
                              display: "block",
                              marginBottom: "8px",
                              fontWeight: 600,
                              fontSize: "14px",
                              color: "#374151",
                            }}
                          >
                            Khách hàng
                          </label>
                          <Input
                            value={customerName}
                            disabled
                            style={{
                              height: "40px",
                              borderRadius: "8px",
                              backgroundColor: "#f9fafb",
                              borderColor: "#d1d5db",
                            }}
                          />
                        </div>

                        {/* Mã phiếu */}
                        <div>
                          <label
                            style={{
                              display: "block",
                              marginBottom: "8px",
                              fontWeight: 600,
                              fontSize: "14px",
                              color: "#374151",
                            }}
                          >
                            Mã phiếu
                          </label>
                          <Input
                            value={serviceTicketCode}
                            disabled
                            style={{
                              height: "40px",
                              borderRadius: "8px",
                              backgroundColor: "#f9fafb",
                              borderColor: "#d1d5db",
                            }}
                          />
                        </div>

                        {/* Số tiền cần thanh toán */}
                        <div>
                          <label
                            style={{
                              display: "block",
                              marginBottom: "8px",
                              fontWeight: 600,
                              fontSize: "14px",
                              color: "#374151",
                            }}
                          >
                            Số tiền cần thanh toán
                          </label>
                          <Input
                            value={
                              paymentTab === "QR"
                                ? paymentAmount
                                  ? Number(paymentAmount).toLocaleString("vi-VN")
                                  : ""
                                : formatCurrency(finalAmount)
                            }
                            disabled={paymentTab === "CASH"}
                            onChange={(e) => {
                              if (paymentTab === "QR") {
                                const value = e.target.value.replace(/[^\d]/g, "");
                                const numValue = Number(value) || 0;
                                
                                // Giới hạn không được vượt quá Thành tiền (finalAmount)
                                if (value === "" || numValue === 0) {
                                  setPaymentAmount(value); // Cho phép xóa hết hoặc nhập 0
                                  if (paymentAmountError) {
                                    setPaymentAmountError(false);
                                  }
                                } else if (numValue > finalAmount) {
                                  // Nếu vượt quá finalAmount, giới hạn ở finalAmount
                                  setPaymentAmount(finalAmount.toString());
                                  message.warning(`Số tiền không được vượt quá ${finalAmount.toLocaleString("vi-VN")} đ`);
                                } else {
                                  setPaymentAmount(value);
                                  // Xóa lỗi khi người dùng nhập đúng
                                  if (paymentAmountError) {
                                    setPaymentAmountError(false);
                                  }
                                }
                              }
                            }}
                            style={{
                              height: "40px",
                              borderRadius: "8px",
                              backgroundColor: paymentTab === "QR" ? "#ffffff" : "#f9fafb",
                              borderColor: paymentAmountError ? "#ef4444" : "#d1d5db",
                              borderWidth: paymentAmountError ? "2px" : "1px",
                            }}
                          />
                        </div>

                        {paymentTab === "CASH" && (
                          <>
                            {/* Số tiền nhận của khách */}
                            <div>
                              <label
                                style={{
                                  display: "block",
                                  marginBottom: "8px",
                                  fontWeight: 600,
                                  fontSize: "14px",
                                  color: "#374151",
                                }}
                              >
                                Số tiền nhận của khách
                              </label>
                              <Input
                                value={
                                  cashReceived
                                    ? Number(cashReceived).toLocaleString("vi-VN")
                                    : ""
                                }
                                onChange={(e) => {
                                  const value = e.target.value.replace(/[^\d]/g, "");
                                  setCashReceived(value);
                                }}
                                placeholder="Nhập số tiền"
                                style={{
                                  height: "40px",
                                  borderRadius: "8px",
                                  fontSize: "14px",
                                }}
                              />
                            </div>

                            {/* Số tiền trả khách */}
                            <div>
                              <label
                                style={{
                                  display: "block",
                                  marginBottom: "8px",
                                  fontWeight: 600,
                                  fontSize: "14px",
                                  color: "#374151",
                                }}
                              >
                                Số tiền trả khách
                              </label>
                              <Input
                                value={
                                  cashReceived && Number(cashReceived) > finalAmount
                                    ? (Number(cashReceived) - finalAmount).toLocaleString("vi-VN")
                                    : "0"
                                }
                                disabled
                                style={{
                                  height: "40px",
                                  borderRadius: "8px",
                                  backgroundColor: "#f9fafb",
                                  borderColor: "#d1d5db",
                                }}
                              />
                            </div>
                          </>
                        )}

                        {/* Buttons */}
                        <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                          <Button
                            onClick={() => {
                              setShowDepositForm(false);
                              setPaymentAmount("");
                              setPaymentData(null);
                            }}
                            style={{
                              flex: 1,
                              height: "45px",
                              borderRadius: "8px",
                              fontWeight: 600,
                              fontSize: "14px",
                            }}
                          >
                            Hủy
                          </Button>
                          <Button
                            type="primary"
                            onClick={handleModalPayment}
                            loading={paymentLoading}
                            disabled={paymentTab === "CASH" ? (!cashReceived || Number(cashReceived) <= 0) : false}
                            style={{
                              flex: 1,
                              background: "#22c55e",
                              borderColor: "#22c55e",
                              height: "45px",
                              fontWeight: 600,
                              fontSize: "14px",
                              borderRadius: "8px",
                            }}
                          >
                            {paymentTab === "CASH" ? "Hoàn tất" : "Tạo QR"}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      // QR Code Display
                      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                        {/* QR Code */}
                        {paymentData?.paymentUrl ? (
                          <div
                            style={{
                              border: "2px solid #CBB081",
                              borderRadius: "12px",
                              padding: "24px",
                              background: "#fafafa",
                              minHeight: "400px",
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              justifyContent: "center",
                              boxShadow: "0 2px 8px rgba(203, 176, 129, 0.15)",
                            }}
                          >
                            <div
                              id="payos-checkout-container"
                              style={{
                                width: "100%",
                                maxWidth: "350px",
                                height: "350px",
                              }}
                            ></div>
                          </div>
                        ) : (
                          <div
                            style={{
                              textAlign: "center",
                              padding: "60px 0",
                              background: "#fafafa",
                              borderRadius: "12px",
                              border: "2px dashed #CBB081",
                              minHeight: "400px",
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Spin size="large" />
                            <p
                              style={{
                                marginTop: "16px",
                                color: "#666",
                                fontSize: "14px",
                              }}
                            >
                              Đang tải mã QR...
                            </p>
                          </div>
                        )}

                        {/* Payment Info */}
                        <div>
                          <label
                            style={{
                              display: "block",
                              marginBottom: "8px",
                              fontWeight: 600,
                              fontSize: "14px",
                              color: "#374151",
                            }}
                          >
                            Ngân hàng
                          </label>
                          <Input
                            value="VietinBank"
                            disabled
                            style={{
                              height: "40px",
                              borderRadius: "8px",
                              backgroundColor: "#f9fafb",
                              borderColor: "#d1d5db",
                            }}
                          />
                        </div>

                        <div>
                          <label
                            style={{
                              display: "block",
                              marginBottom: "8px",
                              fontWeight: 600,
                              fontSize: "14px",
                              color: "#374151",
                            }}
                          >
                            Thu hưởng
                          </label>
                          <Input
                            value={paymentData?.bankAccountName || "HOANG ANH DAT"}
                            disabled
                            style={{
                              height: "40px",
                              borderRadius: "8px",
                              backgroundColor: "#f9fafb",
                              borderColor: "#d1d5db",
                            }}
                          />
                        </div>

                        <div>
                          <label
                            style={{
                              display: "block",
                              marginBottom: "8px",
                              fontWeight: 600,
                              fontSize: "14px",
                              color: "#374151",
                            }}
                          >
                            Số tài khoản
                          </label>
                          <Input
                            value={paymentData?.bankAccountNumber || "0010263503"}
                            disabled
                            style={{
                              height: "40px",
                              borderRadius: "8px",
                              backgroundColor: "#f9fafb",
                              borderColor: "#d1d5db",
                            }}
                          />
                        </div>

                        <div>
                          <label
                            style={{
                              display: "block",
                              marginBottom: "8px",
                              fontWeight: 600,
                              fontSize: "14px",
                              color: "#374151",
                            }}
                          >
                            Số tiền
                          </label>
                          <Input
                            value={formatCurrency(paymentData?.amount || Number(paymentAmount))}
                            disabled
                            style={{
                              height: "40px",
                              borderRadius: "8px",
                              backgroundColor: "#f9fafb",
                              borderColor: "#d1d5db",
                            }}
                          />
                        </div>

                        <div>
                          <label
                            style={{
                              display: "block",
                              marginBottom: "8px",
                              fontWeight: 600,
                              fontSize: "14px",
                              color: "#374151",
                            }}
                          >
                            Nội dung
                          </label>
                          <Input
                            value={paymentData?.description || `Thanh toán - ${serviceTicketCode}`}
                            disabled
                            style={{
                              height: "40px",
                              borderRadius: "8px",
                              backgroundColor: "#f9fafb",
                              borderColor: "#d1d5db",
                            }}
                          />
                        </div>

                        {/* Close Button */}
                        <Button
                          onClick={() => {
                            setShowDepositForm(false);
                            setPaymentAmount("");
                            setPaymentData(null);
                            setPaymentTab("CASH");
                            fetchInvoiceDetail();
                          }}
                          style={{
                            width: "100%",
                            height: "45px",
                            borderRadius: "8px",
                            fontWeight: 600,
                            fontSize: "14px",
                          }}
                        >
                          Gửi
                        </Button>
                      </div>
                    )}
                      </>
                    )}
                  </div>
                ) : (
                  // Form đặt cọc cho các status khác
                  <>
                {!paymentData ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "20px",
                    }}
                  >
                    <div>
                      <label
                        className="subtext"
                        style={{
                          display: "block",
                          marginBottom: "8px",
                          fontWeight: 600,
                          color: "#374151",
                        }}
                      >
                        Khách hàng
                      </label>
                      <Input
                        value={customerName}
                        disabled
                        style={{
                          height: "40px",
                          borderRadius: "8px",
                          borderColor: "#d1d5db",
                          backgroundColor: "#f9fafb",
                          color: "#6b7280",
                        }}
                      />
                    </div>
                    <div>
                      <label
                        style={{
                          display: "block",
                          marginBottom: "8px",
                          fontWeight: 600,
                          fontSize: "14px",
                          color: "#374151",
                        }}
                      >
                        Mã phiếu
                      </label>
                      <Input
                        value={serviceTicketCode}
                        disabled
                        style={{
                          height: "40px",
                          borderRadius: "8px",
                          borderColor: "#d1d5db",
                          backgroundColor: "#f9fafb",
                          color: "#6b7280",
                        }}
                      />
                    </div>
                    <div>
                      <label
                        style={{
                          display: "block",
                          marginBottom: "8px",
                          fontWeight: 600,
                          fontSize: "14px",
                          color: "#374151",
                        }}
                      >
                        Tổng tiền cần thu
                      </label>
                      <Input
                        value={formatCurrency(finalAmount)}
                        disabled
                        style={{
                          height: "40px",
                          borderRadius: "8px",
                          borderColor: "#d1d5db",
                          backgroundColor: "#f9fafb",
                          color: "#6b7280",
                          fontWeight: 600,
                        }}
                      />
                    </div>

                    {/* Chỉ hiển thị bảng giao dịch khi WAITING_FOR_DELIVERY (thanh toán) */}
                    {isPaymentStatus(invoiceData?.serviceTicket?.status) && (
                      <>
                        {/* Bảng giao dịch */}
                        <div>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              marginBottom: "12px",
                            }}
                          >
                            <label
                              style={{
                                fontWeight: 600,
                                fontSize: "14px",
                                color: "#374151",
                              }}
                            >
                              Bảng giao dịch
                            </label>
                            <Button
                              type="link"
                              icon={<i className="bi bi-plus-circle" />}
                              style={{ padding: 0, fontSize: "18px" }}
                              onClick={() => {
                                setShowDepositForm(true);
                                setShowPaymentTabs(true);
                                setPaymentTab("CASH");
                                setPaymentAmount("");
                                setPaymentData(null);
                              }}
                            />
                          </div>
                          <div
                            style={{
                              border: "1px solid #e5e7eb",
                              borderRadius: "8px",
                              overflow: "hidden",
                            }}
                          >
                            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                              <thead>
                                <tr style={{ backgroundColor: "#f9fafb" }}>
                                  <th
                                    style={{
                                      padding: "10px 12px",
                                      textAlign: "left",
                                      fontSize: "13px",
                                      fontWeight: 600,
                                      color: "#6b7280",
                                      borderBottom: "1px solid #e5e7eb",
                                    }}
                                  >
                                    Mã giao dịch
                                  </th>
                                  <th
                                    style={{
                                      padding: "10px 12px",
                                      textAlign: "center",
                                      fontSize: "13px",
                                      fontWeight: 600,
                                      color: "#6b7280",
                                      borderBottom: "1px solid #e5e7eb",
                                    }}
                                  >
                                    Số tiền
                                  </th>
                                  <th
                                    style={{
                                      padding: "10px 12px",
                                      textAlign: "center",
                                      fontSize: "13px",
                                      fontWeight: 600,
                                      color: "#6b7280",
                                      borderBottom: "1px solid #e5e7eb",
                                    }}
                                  >
                                    Phương thức
                                  </th>
                                  <th
                                    style={{
                                      padding: "10px 12px",
                                      width: "40px",
                                      borderBottom: "1px solid #e5e7eb",
                                    }}
                                  ></th>
                                </tr>
                              </thead>
                              <tbody>
                                {invoiceData?.transactions?.length > 0 ? (
                                  invoiceData.transactions.map((transaction, index) => (
                                    <tr
                                      key={transaction.id || index}
                                      style={{
                                        borderBottom:
                                          index < invoiceData.transactions.length - 1
                                            ? "1px solid #f3f4f6"
                                            : "none",
                                      }}
                                    >
                                      <td
                                        style={{
                                          padding: "10px 12px",
                                          fontSize: "13px",
                                          color: "#374151",
                                        }}
                                      >
                                        {transaction.paymentLinkId ||
                                          (transaction.id ? `GD-${transaction.id}` : "N/A")}
                                      </td>
                                      <td
                                        style={{
                                          padding: "10px 12px",
                                          textAlign: "center",
                                          fontSize: "13px",
                                          fontWeight: 500,
                                          color: "#374151",
                                        }}
                                      >
                                        {formatCurrency(transaction.amount || 0)}
                                      </td>
                                      <td
                                        style={{
                                          padding: "10px 12px",
                                          textAlign: "center",
                                          fontSize: "13px",
                                          color: "#374151",
                                        }}
                                      >
                                        {transaction.method === "CASH"
                                          ? "Tiền mặt"
                                          : transaction.method === "BANK_TRANSFER" || transaction.method === "QR"
                                          ? "QR"
                                          : transaction.method || "N/A"}
                                      </td>
                                      <td
                                        style={{
                                          padding: "10px 12px",
                                          textAlign: "center",
                                        }}
                                      >
                                        <Button
                                          type="text"
                                          icon={
                                            <i
                                              className="bi bi-trash"
                                              style={{ color: "#ef4444", fontSize: "14px" }}
                                            />
                                          }
                                          size="small"
                                          style={{ padding: "4px" }}
                                        />
                                      </td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td
                                      colSpan={4}
                                      style={{
                                        padding: "20px",
                                        textAlign: "center",
                                        color: "#9ca3af",
                                        fontSize: "13px",
                                      }}
                                    >
                                      Chưa có giao dịch
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Cộng hợp nhất */}
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            paddingTop: "12px",
                            borderTop: "1px solid #e5e7eb",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "14px",
                              color: "#6b7280",
                            }}
                          >
                            Cộng hợp nhất
                          </span>
                          <span
                            style={{
                              fontSize: "14px",
                              fontWeight: 600,
                              color: "#374151",
                            }}
                          >
                            {formatCurrency(
                              invoiceData?.transactions?.reduce(
                                (sum, t) => {
                                  // Chỉ tính các transaction SUCCESS
                                  if (!t.status || t.status === 'SUCCESS' || t.status === 'SUCCEEDED') {
                                    return sum + (t.amount || 0);
                                  }
                                  return sum;
                                },
                                0
                              ) || 0
                            )}
                          </span>
                        </div>
                      </>
                    )}

                    <div>
                      <label
                        style={{
                          display: "block",
                          marginBottom: "8px",
                          fontWeight: 600,
                          fontSize: "14px",
                          color: "#374151",
                        }}
                      >
                        {isPaymentStatus(invoiceData?.serviceTicket?.status) ? "Số tiền thanh toán" : "Số tiền đặt cọc"}
                      </label>
                      <Input
                        value={
                          depositAmount
                            ? Number(depositAmount).toLocaleString("vi-VN")
                            : ""
                        }
                        onChange={(e) => handleDepositChange(e.target.value)}
                        placeholder="Nhập số tiền"
                        status={
                          depositAmount && Number(depositAmount) > finalAmount
                            ? "error"
                            : ""
                        }
                        style={{
                          height: "40px",
                          borderRadius: "8px",
                          borderColor:
                            depositAmount && Number(depositAmount) > finalAmount
                              ? "#ef4444"
                              : "#d1d5db",
                          fontSize: "14px",
                        }}
                      />
                      {depositAmount && Number(depositAmount) > finalAmount && (
                        <div
                          style={{
                            color: "#ef4444",
                            fontSize: "12px",
                            marginTop: "4px",
                          }}
                        >
                          Số tiền đặt cọc không được vượt quá{" "}
                          {formatCurrency(finalAmount)}
                        </div>
                      )}
                    </div>
                    <div>
                      <label
                        style={{
                          display: "block",
                          marginBottom: "8px",
                          fontWeight: 600,
                          fontSize: "14px",
                          color: "#374151",
                        }}
                      >
                        Số tiền còn lại cần thanh toán
                      </label>
                      <Input
                        value={formatCurrency(remainingAmount)}
                        disabled
                        style={{
                          height: "40px",
                          borderRadius: "8px",
                          borderColor: "#d1d5db",
                          backgroundColor: "#f9fafb",
                          color: "#6b7280",
                          fontWeight: 600,
                        }}
                      />
                    </div>
                    <div
                      style={{ display: "flex", gap: "12px", marginTop: "8px" }}
                    >
                      <Button
                        onClick={handleCancel}
                        style={{
                          flex: 1,
                          height: "45px",
                          borderColor: "#d1d5db",
                          borderRadius: "8px",
                          fontWeight: 600,
                          fontSize: "14px",
                        }}
                      >
                        Hủy
                      </Button>
                      {/* Ẩn nút "Thanh toán" nếu finalAmount === 0 */}
                      {finalAmount > 0 && (
                        <Button
                          type="primary"
                          onClick={() => handlePayment("QR")}
                          loading={paymentLoading}
                          disabled={
                            paymentLoading ||
                            !depositAmount ||
                            Number(depositAmount) <= 0 ||
                            Number(depositAmount) > finalAmount
                          }
                          style={{
                            flex: 1,
                            background: "#22c55e",
                            borderColor: "#22c55e",
                            height: "45px",
                            fontWeight: 600,
                            fontSize: "14px",
                            borderRadius: "8px",
                          }}
                        >
                          Thanh toán
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "20px",
                    }}
                  >
                    <div
                      style={{
                        background: "#CBB081",
                        padding: "16px",
                        borderRadius: "8px",
                        marginBottom: "8px",
                      }}
                    >
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: "18px",
                          color: "#111",
                        }}
                      >
                        THANH TOÁN
                      </span>
                    </div>

                    <div>
                      <style>
                        {`
                          .custom-payment-tabs .ant-tabs-nav {
                            width: 100%;
                          }
                          .custom-payment-tabs .ant-tabs-nav-list {
                            width: 100%;
                            display: flex !important;
                          }
                          .custom-payment-tabs .ant-tabs-tab {
                            flex: 1;
                            margin: 0 4px !important;
                            padding: 0 !important;
                            justify-content: center;
                          }
                          .custom-payment-tabs .ant-tabs-tab:first-child {
                            margin-left: 0 !important;
                          }
                          .custom-payment-tabs .ant-tabs-tab:last-child {
                            margin-right: 0 !important;
                          }
                          .custom-payment-tabs .ant-tabs-tab-btn {
                            width: 100%;
                          }
                          .custom-payment-tabs .ant-tabs-ink-bar {
                            display: none !important;
                          }
                        `}
                      </style>
                      <Tabs
                        activeKey={paymentMethod}
                        onChange={(key) => {
                          setPaymentMethod(key);
                        }}
                      tabBarStyle={{
                        marginBottom: "24px",
                        borderBottom: "none",
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                      tabBarGutter={8}
                      className="custom-payment-tabs"
                      items={[
                        {
                          key: "QR",
                          label: (
                            <span
                              style={{
                                fontWeight: 600,
                                fontSize: "15px",
                                padding: "10px 0",
                                display: "block",
                                width: "100%",
                                textAlign: "center",
                                borderRadius: "8px",
                                background: paymentMethod === "QR" ? "#CBB081" : "#f3f4f6",
                                color: paymentMethod === "QR" ? "#fff" : "#6b7280",
                                transition: "all 0.3s ease",
                              }}
                            >
                              QR
                            </span>
                          ),
                          children: paymentData?.paymentUrl ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                              {/* QR Code */}
                              <div
                                style={{
                                  border: "2px solid #CBB081",
                                  borderRadius: "12px",
                                  padding: "24px",
                                  background: "#fafafa",
                                  minHeight: "400px",
                                  display: "flex",
                                  flexDirection: "column",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  boxShadow: "0 2px 8px rgba(203, 176, 129, 0.15)",
                                }}
                              >
                                <div
                                  id="payos-checkout-container"
                                  style={{
                                    width: "100%",
                                    maxWidth: "350px",
                                    height: "350px",
                                  }}
                                ></div>
                              </div>

                              {/* Payment Info */}
                              <div>
                                <label
                                  style={{
                                    display: "block",
                                    marginBottom: "8px",
                                    fontWeight: 600,
                                    fontSize: "14px",
                                    color: "#374151",
                                  }}
                                >
                                  Ngân hàng
                                </label>
                                <Input
                                  value="VietinBank"
                                  disabled
                                  style={{
                                    height: "40px",
                                    borderRadius: "8px",
                                    backgroundColor: "#f9fafb",
                                    borderColor: "#d1d5db",
                                  }}
                                />
                              </div>

                              <div>
                                <label
                                  style={{
                                    display: "block",
                                    marginBottom: "8px",
                                    fontWeight: 600,
                                    fontSize: "14px",
                                    color: "#374151",
                                  }}
                                >
                                  Thu hưởng
                                </label>
                                <Input
                                  value={paymentData?.bankAccountName || "HOANG ANH TUAN"}
                                  disabled
                                  style={{
                                    height: "40px",
                                    borderRadius: "8px",
                                    backgroundColor: "#f9fafb",
                                    borderColor: "#d1d5db",
                                  }}
                                />
                              </div>

                              <div>
                                <label
                                  style={{
                                    display: "block",
                                    marginBottom: "8px",
                                    fontWeight: 600,
                                    fontSize: "14px",
                                    color: "#374151",
                                  }}
                                >
                                  Số tài khoản
                                </label>
                                <Input
                                  value={paymentData?.bankAccountNumber || "0010263503"}
                                  disabled
                                  style={{
                                    height: "40px",
                                    borderRadius: "8px",
                                    backgroundColor: "#f9fafb",
                                    borderColor: "#d1d5db",
                                  }}
                                />
                              </div>

                              <div>
                                <label
                                  style={{
                                    display: "block",
                                    marginBottom: "8px",
                                    fontWeight: 600,
                                    fontSize: "14px",
                                    color: "#374151",
                                  }}
                                >
                                  Số tiền
                                </label>
                                <Input
                                  value={formatCurrency(paymentData?.amount || Number(depositAmount))}
                                  disabled
                                  style={{
                                    height: "40px",
                                    borderRadius: "8px",
                                    backgroundColor: "#f9fafb",
                                    borderColor: "#d1d5db",
                                  }}
                                />
                              </div>

                              <div>
                                <label
                                  style={{
                                    display: "block",
                                    marginBottom: "8px",
                                    fontWeight: 600,
                                    fontSize: "14px",
                                    color: "#374151",
                                  }}
                                >
                                  Nội dung
                                </label>
                                <Input
                                  value={paymentData?.description || `Đặt cọc - ${serviceTicketCode}`}
                                  disabled
                                  style={{
                                    height: "40px",
                                    borderRadius: "8px",
                                    backgroundColor: "#f9fafb",
                                    borderColor: "#d1d5db",
                                  }}
                                />
                              </div>

                              {/* Close Button */}
                              <Button
                                onClick={() => {
                                  setShowDepositForm(false);
                                  setDepositAmount("");
                                  setPaymentData(null);
                                  fetchInvoiceDetail();
                                }}
                                style={{
                                  width: "100%",
                                  height: "45px",
                                  borderRadius: "8px",
                                  fontWeight: 600,
                                  fontSize: "14px",
                                }}
                              >
                                Gửi
                              </Button>
                            </div>
                          ) : (
                            <div
                              style={{
                                textAlign: "center",
                                padding: "60px 0",
                                background: "#fafafa",
                                borderRadius: "12px",
                                border: "2px dashed #CBB081",
                                minHeight: "400px",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <Spin size="large" />
                              <p
                                style={{
                                  marginTop: "16px",
                                  color: "#666",
                                  fontSize: "14px",
                                }}
                              >
                                Đang tải mã QR...
                              </p>
                            </div>
                          ),
                        },
                        {
                          key: "CASH",
                          label: (
                            <span
                              style={{
                                fontWeight: 600,
                                fontSize: "15px",
                                padding: "10px 0",
                                display: "block",
                                width: "100%",
                                textAlign: "center",
                                borderRadius: "8px",
                                background: paymentMethod === "CASH" ? "#CBB081" : "#f3f4f6",
                                color: paymentMethod === "CASH" ? "#fff" : "#6b7280",
                                transition: "all 0.3s ease",
                              }}
                            >
                              Tiền mặt
                            </span>
                          ),
                          children:
                            paymentData && paymentMethod === "CASH" ? (
                              <div
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: "20px",
                                }}
                              >
                                {/* Khách hàng */}
                                <div>
                                  <label
                                    style={{
                                      display: "block",
                                      marginBottom: "8px",
                                      fontWeight: 600,
                                      fontSize: "14px",
                                      color: "#374151",
                                    }}
                                  >
                                    Khách hàng
                                  </label>
                                  <Input
                                    value={customerName}
                                    disabled
                                    style={{
                                      height: "40px",
                                      borderRadius: "8px",
                                      backgroundColor: "#f9fafb",
                                      borderColor: "#d1d5db",
                                    }}
                                  />
                                </div>

                                {/* Mã phiếu */}
                                <div>
                                  <label
                                    style={{
                                      display: "block",
                                      marginBottom: "8px",
                                      fontWeight: 600,
                                      fontSize: "14px",
                                      color: "#374151",
                                    }}
                                  >
                                    Mã phiếu
                                  </label>
                                  <Input
                                    value={serviceTicketCode}
                                    disabled
                                    style={{
                                      height: "40px",
                                      borderRadius: "8px",
                                      backgroundColor: "#f9fafb",
                                      borderColor: "#d1d5db",
                                    }}
                                  />
                                </div>

                                {/* Số tiền cọc */}
                                <div>
                                  <label
                                    style={{
                                      display: "block",
                                      marginBottom: "8px",
                                      fontWeight: 600,
                                      fontSize: "14px",
                                      color: "#374151",
                                    }}
                                  >
                                    Số tiền cọc
                                  </label>
                                  <Input
                                    value={formatCurrency(depositAmount)}
                                    disabled
                                    style={{
                                      height: "40px",
                                      borderRadius: "8px",
                                      backgroundColor: "#f9fafb",
                                      borderColor: "#d1d5db",
                                    }}
                                  />
                                </div>

                                {/* Số tiền khách trả */}
                                <div>
                                  <label
                                    style={{
                                      display: "block",
                                      marginBottom: "8px",
                                      fontWeight: 600,
                                      fontSize: "14px",
                                      color: "#374151",
                                    }}
                                  >
                                    Số tiền khách trả
                                  </label>
                                  <Input
                                    value={
                                      cashReceived
                                        ? Number(cashReceived).toLocaleString("vi-VN")
                                        : ""
                                    }
                                    onChange={(e) => {
                                      const value = e.target.value.replace(/[^\d]/g, "");
                                      setCashReceived(value);
                                    }}
                                    placeholder="Nhập số tiền khách trả"
                                    style={{
                                      height: "40px",
                                      borderRadius: "8px",
                                      fontSize: "14px",
                                    }}
                                  />
                                </div>

                                {/* Số tiền trả khách */}
                                <div>
                                  <label
                                    style={{
                                      display: "block",
                                      marginBottom: "8px",
                                      fontWeight: 600,
                                      fontSize: "14px",
                                      color: "#374151",
                                    }}
                                  >
                                    Số tiền trả khách
                                  </label>
                                  <Input
                                    value={formatCurrency(
                                      Math.max(0, Number(cashReceived || 0) - Number(depositAmount || 0))
                                    )}
                                    disabled
                                    style={{
                                      height: "40px",
                                      borderRadius: "8px",
                                      backgroundColor: "#f9fafb",
                                      borderColor: "#d1d5db",
                                    }}
                                  />
                                </div>

                                {/* Buttons */}
                                <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                                  <Button
                                    onClick={() => {
                                      setPaymentMethod("QR");
                                      setCashReceived("");
                                    }}
                                    style={{
                                      flex: 1,
                                      height: "45px",
                                      borderRadius: "8px",
                                      fontWeight: 600,
                                      fontSize: "14px",
                                    }}
                                  >
                                    Hủy
                                  </Button>
                                  <Button
                                    type="primary"
                                    onClick={async () => {
                                      setPaymentLoading(true);
                                      try {
                                        const isPayment = isPaymentStatus(invoiceData?.serviceTicket?.status);
                                        
                                        // Tính paymentPrice giống như trong handleModalPayment
                                        const paymentPriceForTabs = Math.min(Number(depositAmount), finalAmount);
                                        
                                        const payload = {
                                          method: "CASH",
                                          price: paymentPriceForTabs,
                                          type: isPayment ? "PAYMENT" : "DEPOSIT",
                                        };
                                        
                                        console.log("=== CASH TAB PAYMENT DEBUG ===");
                                        console.log("Status:", invoiceData?.serviceTicket?.status);
                                        console.log("Type:", isPayment ? "PAYMENT" : "DEPOSIT");
                                        console.log("Payload:", JSON.stringify(payload, null, 2));
                                        console.log("Payment Price (will be used in success div):", paymentPriceForTabs);
                                        
                                        // Lưu paymentPrice để sử dụng trong success div
                                        setLastPaymentPrice(paymentPriceForTabs);
                                        
                                        const { data: response, error } = await invoiceAPI.pay(id, payload);
                                        
                                        if (error) {
                                          message.error(error || "Tạo giao dịch thanh toán thất bại");
                                          setPaymentLoading(false);
                                          return;
                                        }
                                        
                                        const result = response?.result || null;
                                        
                                        // Fetch lại invoice để lấy thông tin giao dịch mới nhất
                                        await fetchInvoiceDetail();
                                        
                                        // Lấy lại dữ liệu invoice để có thông tin giao dịch mới nhất
                                        const { data: invoiceResponse } = await invoiceAPI.getById(id);
                                        const latestInvoice = invoiceResponse?.result;
                                        const latestTransactions = latestInvoice?.transactions || [];
                                        const latestTransaction = latestTransactions.length > 0 ? latestTransactions[latestTransactions.length - 1] : null;
                                        
                                        // Lấy thông tin khách hàng
                                        const customer = latestInvoice?.serviceTicket?.customer;
                                        const customerName = customer?.fullName || customer?.name || "N/A";
                                        const customerPhone = customer?.phone || "N/A";
                                        
                                        // Hiển thị success div - sử dụng số tiền đã truyền vào payload
                                        setSuccessTransactionData({
                                          customerName: customerName,
                                          customerPhone: customerPhone,
                                          transactionCode: latestTransaction?.transactionCode || latestTransaction?.code || result?.transactionCode || result?.code || result?.transactionId || 'N/A',
                                          totalAmount: paymentPriceForTabs, // Sử dụng số tiền đã truyền vào payload
                                          serviceTicketCode: latestInvoice?.serviceTicket?.serviceTicketCode || "N/A"
                                        });
                                        console.log("Setting showSuccessDiv to true");
                                        setShowSuccessDiv(true);
                                        setShowDepositForm(true); // Đảm bảo sidebar hiển thị
                                        setShowPaymentTabs(false); // Ẩn form thanh toán
                                        setPaymentData(null);
                                        setDepositAmount("");
                                      } catch (err) {
                                        console.error("Error creating payment:", err);
                                        message.error("Đã xảy ra lỗi khi tạo giao dịch thanh toán");
                                      } finally {
                                        setPaymentLoading(false);
                                      }
                                    }}
                                    loading={paymentLoading}
                                    style={{
                                      flex: 1,
                                      background: "#22c55e",
                                      borderColor: "#22c55e",
                                      height: "45px",
                                      fontWeight: 600,
                                      fontSize: "14px",
                                      borderRadius: "8px",
                                    }}
                                  >
                                    Hoàn tất
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div
                                style={{
                                  textAlign: "center",
                                  padding: "40px 0",
                                }}
                              >
                                <Spin size="large" />
                              </div>
                            ),
                        },
                      ]}
                      style={{ marginTop: "20px" }}
                    />
                    </div>
                  </div>
                )}
                  </>
                )}
              </Card>
            </Col>
          )}
        </Row>
      </div>

      {/* Debt Modal */}
      <Modal
        title="Cập nhật phiếu công nợ"
        open={showDebtModal}
        onCancel={() => setShowDebtModal(false)}
        footer={null}
        width={450}
        centered
      >
        <div style={{ padding: '20px 0' }}>
          <div style={{ marginBottom: '16px', fontSize: '15px' }}>
            <strong>Tên khách hàng:</strong> {invoiceData?.serviceTicket?.customer?.fullName || invoiceData?.serviceTicket?.customer?.name || invoiceData?.customer?.fullName || invoiceData?.customer?.name || 'N/A'}
          </div>
          <div style={{ marginBottom: '16px', fontSize: '15px' }}>
            <strong>Mã phiếu:</strong> {invoiceData?.serviceTicket?.serviceTicketCode || 'N/A'}
          </div>
          <div style={{ marginBottom: '16px', fontSize: '15px' }}>
            <strong>Số điện thoại:</strong> {invoiceData?.serviceTicket?.customer?.phone || invoiceData?.customer?.phone || 'N/A'}
          </div>
          <div style={{ marginBottom: '24px', fontSize: '15px', color: '#dc2626', fontWeight: 600 }}>
            <strong>Còn lại:</strong> {remainingAmount?.toLocaleString('vi-VN')} đ
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '14px' }}>
              Ngày hẹn trả
            </label>
            <Input
              type="date"
              value={debtDueDate}
              onChange={(e) => setDebtDueDate(e.target.value)}
              style={{ height: '40px', borderRadius: '8px' }}
            />
          </div>
          <Button
            type="primary"
            onClick={handleCreateDebt}
            style={{
              width: '100%',
              height: '45px',
              background: '#22c55e',
              borderColor: '#22c55e',
              fontSize: '16px',
              fontWeight: 600,
              borderRadius: '8px',
              marginTop: '8px'
            }}
          >
            Lưu
          </Button>
        </div>
      </Modal>
    </AccountanceLayout>
  );
}
