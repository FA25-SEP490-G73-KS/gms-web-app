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

  const [payOSInitialized, setPayOSInitialized] = useState(false);

  const [payOSConfig, setPayOSConfig] = useState({
    RETURN_URL: `${window.location.origin}/`, // required
    ELEMENT_ID: "payos-checkout-container", // required
    CHECKOUT_URL: null, // required
    embedded: true, // Nếu dùng giao diện nhúng
    onSuccess: async (event) => {
      console.log("Payment successful:", event);
      message.success("Thanh toán thành công!");
      setPaymentData(null);
      setShowDepositForm(false);
      setDepositAmount("");
      setPayOSInitialized(false);
      await transactionsAPI.callback(event.id);
      await fetchInvoiceDetail();

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

      setInvoiceData(response?.result || null);
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
  const remainingAmount = finalAmount - (Number(depositAmount) || 0);

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
      const payload = {
        method: type === "QR" ? "BANK_TRANSFER" : "CASH",
        price: Number(depositAmount),
        type:
          invoiceData?.serviceTicket.status === "WAITING_FOR_DELIVERY"
            ? "PAYMENT"
            : "DEPOSIT",
      };

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
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span>Tổng tiền hàng:</span>
                  <span style={{ fontWeight: 600 }}>
                    {formatCurrency(totalMerchandise)}
                  </span>
                </div>
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span>Tiền công:</span>
                  <span style={{ fontWeight: 600 }}>
                    {formatCurrency(totalLabor)}
                  </span>
                </div>
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span>Chiết khấu:</span>
                  <span style={{ fontWeight: 600, color: "#16a34a" }}>
                    -{formatCurrency(discount)}
                  </span>
                </div>
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span>Tiền cọc đã nhận:</span>
                  <span style={{ fontWeight: 600, color: "#ef4444" }}>
                    -{formatCurrency(depositReceived)}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: "12px",
                    paddingTop: "12px",
                    borderTop: "1px solid #e5e7eb",
                  }}
                >
                  <span className="h5" style={{ fontWeight: 700 }}>
                    Thành tiền:
                  </span>
                  <span
                    className="h5"
                    style={{ fontWeight: 700, color: "#2563eb" }}
                  >
                    {formatCurrency(finalAmount)}
                  </span>
                </div>
                <div style={{ marginTop: "8px" }}>
                  <span style={{ color: "#6b7280" }}>Bằng chữ: </span>
                  <span style={{ fontWeight: 600 }}>
                    {numberToWords(finalAmount)}
                  </span>
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

            {!showDepositForm && (
              <div
                style={{
                  marginTop: "24px",
                  display: "flex",
                  justifyContent: "flex-end",
                }}
              >
                <Button
                  type="primary"
                  size="large"
                  onClick={() => setShowDepositForm(true)}
                  style={{
                    background: "#22c55e",
                    borderColor: "#22c55e",
                    height: "45px",
                    padding: "0 40px",
                    fontWeight: 600,
                    fontSize: "16px",
                  }}
                >
                  Đặt cọc
                </Button>
              </div>
            )}
          </Col>

          {showDepositForm && (
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
                        Số tiền đặt cọc
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

                    <Tabs
                      activeKey={paymentMethod}
                      onChange={(key) => {
                        setPaymentMethod(key);
                        if (key !== "QR") {
                          exit();
                        }
                      }}
                      items={[
                        {
                          key: "QR",
                          label: "QR",
                          children: paymentData?.paymentUrl ? (
                            <div
                              style={{
                                position: "relative",
                                width: "100%",
                                height: "100%",
                              }}
                            >
                              <div
                                id="payos-checkout-container"
                                style={{ height: "350px" }}
                              ></div>
                            </div>
                          ) : (
                            <div
                              style={{ textAlign: "center", padding: "40px 0" }}
                            >
                              <Spin size="large" />
                            </div>
                          ),
                        },
                        {
                          key: "CASH",
                          label: "Tiền mặt",
                          children:
                            paymentData && paymentMethod === "CASH" ? (
                              <div
                                style={{
                                  padding: "20px 0",
                                  textAlign: "center",
                                }}
                              >
                                <div style={{ marginBottom: "20px" }}>
                                  <p
                                    style={{
                                      fontSize: "16px",
                                      color: "#6b7280",
                                      marginBottom: "12px",
                                    }}
                                  >
                                    Số tiền thanh toán
                                  </p>
                                  <div
                                    style={{
                                      fontSize: "24px",
                                      fontWeight: 700,
                                      color: "#2563eb",
                                    }}
                                  >
                                    {formatCurrency(
                                      paymentData.amount || depositAmount
                                    )}
                                  </div>
                                </div>
                                <Button
                                  type="primary"
                                  size="large"
                                  onClick={async () => {
                                    await handlePayment("CASH");
                                    message.success(
                                      "Xác nhận thanh toán tiền mặt thành công"
                                    );
                                    setPaymentData(null);
                                    setShowDepositForm(false);
                                    setDepositAmount("");
                                    fetchInvoiceDetail();
                                  }}
                                  style={{
                                    background: "#22c55e",
                                    borderColor: "#22c55e",
                                    height: "45px",
                                    padding: "0 40px",
                                    fontWeight: 600,
                                    fontSize: "16px",
                                    borderRadius: "8px",
                                    width: "100%",
                                  }}
                                >
                                  Xác nhận
                                </Button>
                              </div>
                            ) : (
                              <div
                                style={{
                                  textAlign: "center",
                                  padding: "40px 0",
                                }}
                              >
                                <Spin size="large" />
                                <p
                                  style={{
                                    marginTop: "12px",
                                    color: "#6b7280",
                                  }}
                                >
                                  Đang tạo giao dịch thanh toán tiền mặt...
                                </p>
                              </div>
                            ),
                        },
                      ]}
                      style={{ marginTop: "20px" }}
                    />
                  </div>
                )}
              </Card>
            </Col>
          )}
        </Row>
      </div>
    </AccountanceLayout>
  );
}
