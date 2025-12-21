import axios from "axios";
import useAuthStore from "../store/authStore";

const BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "/api" : "http://localhost:8080/api");

function getToken() {
  try {
    if (typeof window === "undefined") return null;

    // Lấy token từ authStore (memory) thay vì storage
    const accessToken = useAuthStore.getState().getAccessToken();
    return accessToken;
  } catch {
    return null;
  }
}

const axiosClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

const PUBLIC_ENDPOINTS = [
  "/auth/login",
  "/auth/refresh",
  "/auth/reset-password",
  "/auth/update-password",
];

// Kiểm tra xem endpoint có phải là public quotation endpoint không
const isQuotationPublicEndpoint = (url) => {
  if (!url) return false;
  // Kiểm tra các endpoint quotation công khai
  // /service-tickets/{id}/quotation - xem quotation theo service ticket id
  // /price-quotations/{id}/confirm - xác nhận quotation
  // /price-quotations/{id}/reject - từ chối quotation
  // /service-tickets/{id}/status?status=Hủy - hủy service ticket
  return (
    (url.includes("/service-tickets/") && url.includes("/quotation")) ||
    (url.includes("/price-quotations/") &&
      (url.includes("/confirm") || url.includes("/reject"))) ||
    (url.includes("/service-tickets/") && url.includes("/status"))
  );
};

axiosClient.interceptors.request.use(
  (config) => {
    const skipAuth = config.skipAuth === true || config.skipAuth === "true";

    const isPublicEndpoint = PUBLIC_ENDPOINTS.some(
      (endpoint) =>
        config.url?.includes(endpoint) || config.url?.endsWith(endpoint)
    );

    // Với skipAuth: true, vẫn gửi token nếu có (để backend validate)
    // nhưng khi lỗi 401 sẽ không redirect về login
    // Với public endpoint thực sự, không gửi token
    if (!isPublicEndpoint) {
      const token = getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    // Lưu skipAuth vào config để interceptor response có thể kiểm tra
    config._skipAuth = skipAuth;
    delete config.skipAuth;

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Flag để tránh infinite loop khi refresh token
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config || {};

    const skipAuth =
      originalRequest._skipAuth === true ||
      originalRequest._skipAuth === "true";

    const isPublicEndpoint = PUBLIC_ENDPOINTS.some(
      (endpoint) =>
        originalRequest.url?.includes(endpoint) ||
        originalRequest.url?.endsWith(endpoint)
    );

    const isQuotationEndpoint = isQuotationPublicEndpoint(originalRequest.url);

    /**
     * ===============================
     * 1️⃣ API PUBLIC → RETURN SỚM
     * ===============================
     * ❌ KHÔNG refresh
     * ❌ KHÔNG logout
     * ❌ KHÔNG redirect
     */
    if (
      error.response?.status === 401 &&
      (skipAuth || isPublicEndpoint || isQuotationEndpoint)
    ) {
      return Promise.reject(
        new Error(
          error.response?.data?.message ||
            error.response?.data?.error ||
            "Bạn không có quyền thực hiện thao tác này"
        )
      );
    }

    /**
     * ===============================
     * 2️⃣ API PRIVATE → HANDLE 401
     * ===============================
     */
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Nếu đang refresh token → đưa request vào queue
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newAccessToken = await useAuthStore
          .getState()
          .refreshAccessToken();

        if (newAccessToken) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          processQueue(null, newAccessToken);
          isRefreshing = false;
          return axiosClient(originalRequest);
        }

        // ❌ Refresh thất bại
        throw new Error("Refresh token failed");
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;

        // Clear auth state
        const isLogoutRequest = originalRequest.url?.includes("/auth/logout");
        const isOnLoginPage =
          typeof window !== "undefined" &&
          window.location.pathname.includes("/login");

        if (!isLogoutRequest && !isOnLoginPage) {
          useAuthStore.getState().logout();
        }

        if (
          typeof window !== "undefined" &&
          !window.location.pathname.includes("/login")
        ) {
          window.location.href = "/login";
        }

        return Promise.reject(
          new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.")
        );
      }
    }

    /**
     * ===============================
     * 3️⃣ CÁC LỖI KHÁC
     * ===============================
     */
    if (error.response) {
      return Promise.reject(
        new Error(
          error.response.data?.message ||
            error.response.data?.error ||
            "Đã xảy ra lỗi"
        )
      );
    }

    if (error.request) {
      return Promise.reject(new Error("Không thể kết nối đến server"));
    }

    return Promise.reject(error);
  }
);

async function request(method, path, body, init = {}) {
  try {
    const { skipAuth, signal, ...axiosConfig } = init;

    const config = {
      method,
      url: path,
      skipAuth: skipAuth === true, // Explicitly set skipAuth flag
      signal,
      ...axiosConfig,
    };

    if (body) {
      config.data = body;
    }

    const response = await axiosClient.request(config);

    return {
      data: response.data,
      error: undefined,
      statusCode: response.status,
    };
  } catch (err) {
    const errorMessage = err.message || "Đã xảy ra lỗi. Vui lòng thử lại.";
    return {
      data: undefined,
      error: errorMessage,
      statusCode: err.response?.status,
    };
  }
}

export async function get(path, init) {
  return request("GET", path, null, init);
}

export async function post(path, body, init) {
  return request("POST", path, body, init);
}

export async function put(path, body, init) {
  return request("PUT", path, body, init);
}

export async function patch(path, body, init) {
  return request("PATCH", path, body, init);
}

export async function del(path, init) {
  return request("DELETE", path, null, init);
}

export const appointmentAPI = {
  getAll: (page = 0, size = 10) =>
    get(`/appointments?page=${page}&size=${size}`),
  getById: (id) => get(`/appointments/${id}`),
  create: (data) => post("/appointments", data),
  updateStatus: (id, status) =>
    patch(`/appointments/${id}/status?status=${status}`),
  getTimeSlots: (date) => get(`/appointments/time-slots?date=${date}`),
};

export const serviceTicketAPI = {
  getAll: (page = 0, size = 10) =>
    get(`/service-tickets?page=${page}&size=${size}`),
  getById: (id) => get(`/service-tickets/${id}`),
  create: (data) => post("/service-tickets", data),
  update: (id, data) => {
    console.log("=== [API] serviceTicketAPI.update ===");
    console.log("Ticket ID:", id);
    console.log("Sending to backend:", JSON.stringify(data, null, 2));
    console.log("====================================");
    return patch(`/service-tickets/${id}`, data);
  },
  updateStatus: (id, status, options = {}) =>
    patch(`/service-tickets/${id}/status?status=${status}`, null, options),
  updateDeliveryAt: (id, date) =>
    patch(`/service-tickets/${id}/delivery-at`, date),
  getCompletedPerMonth: () => get("/service-tickets/completed-per-month"),
  getCount: (date) => get(`/service-tickets/count?date=${date}`),
  getCountByType: (year, month) =>
    get(`/service-tickets/count-by-type?year=${year}&month=${month}`),
  getQuotationByCode: (serviceTicketCode, options = {}) =>
    get(`/service-tickets/${serviceTicketCode}/quotation`, options),
};

export const serviceTypeAPI = {
  getAll: () => get("/services"),
  create: (payload) => post("/services", payload),
  delete: (id) => del(`/services/${id}`),
};

export const inventoryAPI = {
  getAll: () => get("/inventory"),
  getById: (id) => get(`/inventory/${id}`),
  create: (data) => post("/inventory", data),
  update: (id, data) => put(`/inventory/${id}`, data),
  delete: (id) => del(`/inventory/${id}`),
};

export const stockExportAPI = {
  getAll: (
    page = 0,
    size = 6,
    keyword = null,
    status = null,
    fromDate = null,
    toDate = null
  ) => {
    const params = new URLSearchParams({ page, size });
    if (keyword) params.append("keyword", keyword);
    if (status) params.append("status", status);
    if (fromDate) params.append("fromDate", fromDate);
    if (toDate) params.append("toDate", toDate);
    return get(`/stock-exports?${params.toString()}`);
  },
  getById: (id) => get(`/stock-exports/${id}`),
  getItemHistory: (itemId) =>
    get(`/stock-exports/export-items/${itemId}/history`),
  getQuotationDetail: (id) => get(`/stock-exports/quotation/${id}`),

  exportItem: (itemId, payload) =>
    post(`/stock-exports/export-items/${itemId}/export`, payload),

  getExportItemDetail: (exportItemId) =>
    get(`/stock-exports/export-items/${exportItemId}`),
  create: (data) => post("/stock-exports", data),
  update: (id, data) => put(`/stock-exports/${id}`, data),
};

export const otpAPI = {
  send: (phone, purpose, options = {}) =>
    post("/otp/send", { phone, purpose }, options),
  verify: (phone, otpCode, purpose, options = {}) =>
    post("/otp/verify", { phone, otpCode, purpose }, options),
};

export const employeeAPI = {
  getTechnicians: () => get("/employees/technicians"),
  getAll: ({ page = 0, size = 20, keyword, role } = {}) => {
    const query = buildQueryString({ page, size, keyword, role });
    const suffix = query ? `?${query}` : "";
    return get(`/employees${suffix}`);
  },
};

export const partsAPI = {
  getAll: ({
    page = 0,
    size = 6,
    keyword,
    categoryId,
    status,
    signal,
  } = {}) => {
    const query = buildQueryString({ page, size, keyword, categoryId, status });
    const suffix = query ? `?${query}` : "";
    return get(`/parts${suffix}`, { signal });
  },
  getById: (id) => get(`/parts/${id}`),
  create: (data) => post("/parts", data),
  update: (id, data) => patch(`/parts/${id}`, data),
};

export const unitsAPI = {
  getAll: ({ page = 0, size = 20, sort } = {}) => {
    const query = buildQueryString({ page, size, sort });
    const suffix = query ? `?${query}` : "";
    return get(`/units${suffix}`);
  },
};

export const marketsAPI = {
  getAll: () => get("/markets"),
};

export const partCategoriesAPI = {
  getAll: () => get("/part-category"),
};

export const vehiclesAPI = {
  getBrands: () => get("/vehicles/brands"),
  getModelsByBrand: (brandId) => get(`/vehicles/brands/${brandId}/models`),
  getByLicensePlate: (licensePlate) =>
    get(`/vehicles?licensePlate=${encodeURIComponent(licensePlate)}`),

  checkPlate: (plate, customerId) => {
    const params = new URLSearchParams();
    if (plate) params.append("plate", plate);
    if (customerId != null) params.append("customerId", customerId);
    return get(`/vehicles/check-plate?${params.toString()}`);
  },
};

export const priceQuotationAPI = {
  create: (ticketId) => post(`/price-quotations?ticketId=${ticketId}`),
  update: (id, payload) => put(`/price-quotations/${id}`, payload),
  updateStatus: (id, status) =>
    patch(`/price-quotations/${id}/status`, { status }),
  setDraft: (id) => patch(`/price-quotations/${id}/draft`),
  sendToCustomer: (id) => post(`/price-quotations/${id}/send-to-customer`),
  getPending: (page = 0, size = 6) =>
    get(`/price-quotations/pending?page=${page}&size=${size}`),
  getById: (id) => get(`/price-quotations/${id}`),
  getItemById: (id) => get(`/quotation-items/${id}`),

  confirmItem: (itemId, note) =>
    patch(`/quotation-items/${itemId}/confirm`, note),
  confirmItemUpdate: (itemId, payload) =>
    patch(`/quotation-items/${itemId}/confirm/update`, payload),
  confirmCreateItem: (itemId, payload) =>
    post(`/quotation-items/${itemId}/confirm/create`, payload),
  rejectItem: (itemId, reason) =>
    patch(`/quotation-items/${itemId}/reject`, reason),
  deleteItem: (itemId) => del(`/quotation-items/${itemId}`),
  confirmQuotation: (id, options = {}) =>
    post(`/price-quotations/${id}/confirm`, null, options),
  rejectQuotation: (id, reason, options = {}) =>
    post(`/price-quotations/${id}/reject`, reason, options),
  exportPDF: (id) =>
    get(`/price-quotations/${id}/pdf`, { responseType: "blob" }),
};

export const partAPI = {
  getAll: (page = 0, size = 10) => get(`/parts?page=${page}&size=${size}`),
  getById: (id) => get(`/parts/${id}`),
};

export const znsNotificationsAPI = {
  sendQuotation: (quotationId) =>
    post(`/zns-notifications/quotation/${quotationId}/send`),
  sendVehicleReceipt: (ticketId) =>
    post(`/zns-notifications/vehicle-receipt/${ticketId}/send`),
};

export const notificationAPI = {
  getAll: (page = 0, size = 20, status = null) => {
    const params = new URLSearchParams({ page, size });
    if (status) params.append("status", status);
    return get(`/notifications?${params.toString()}`);
  },
  getUnreadCount: () => get("/notifications/unread-count"),
  markAsRead: (notificationId) =>
    patch(`/notifications/${notificationId}/read`),
  markAllAsRead: () => patch("/notifications/read-all"),
  getById: (id) => get(`/notifications/${id}`),
};

export const invoiceAPI = {
  create: (serviceTicketId, quotationId) =>
    post(
      `/invoices?serviceTicketId=${serviceTicketId}&quotationId=${quotationId}`
    ),
  getAll: (page = 0, size = 6, sort = "createdAt,desc") =>
    get(`/invoices?page=${page}&size=${size}&sort=${sort}`),
  getById: (id) => get(`/invoices/${id}`),
  pay: (id, payload) => post(`/invoices/${id}/pay`, payload),
  createDebt: (paymentId, payload) =>
    post(`/invoices/${paymentId}/debt`, payload),
};

export const authAPI = {
  login: (phone, password, rememberMe = false) =>
    post("/auth/login", { phone, password, rememberMe }, { skipAuth: true }),
  logout: () => post("/auth/logout", {}, { skipAuth: false }),
  refreshToken: (refreshToken) =>
    post("/auth/refresh", { refreshToken }, { skipAuth: true }),
  resetPassword: (phone) =>
    post("/auth/reset-password", { phone }, { skipAuth: true }),
  resetPasswordWithConfirm: (phone, newPassword, confirmPassword) =>
    post(
      "/auth/reset-password",
      {
        phone: phone,
        newPassword: newPassword,
        confirmPassword: confirmPassword,
      },
      { skipAuth: true }
    ),

  updatePassword: (phone, otpCode, newPassword) =>
    post(
      "/auth/update-password",
      { phone, otpCode, newPassword },
      { skipAuth: true }
    ),
  changePassword: (currentPassword, newPassword, confirmPassword) =>
    put("/auth/change-password", {
      currentPassword,
      newPassword,
      confirmPassword,
    }),
};

function buildQueryString(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      search.append(key, value);
    }
  });
  return search.toString();
}

export const debtsAPI = {
  list: ({
    customerId,
    status,
    keyword,
    page = 0,
    size = 10,
    sort,
    fromDate,
    toDate,
  }) => {
    const qs = buildQueryString({
      customerId,
      status,
      keyword,
      page,
      size,
      sort,
      fromDate,
      toDate,
    });
    return get(`/debts/summary?${qs}`);
  },
  getByCustomerId: ({
    customerId,
    page = 0,
    size = 10,
    sort = "createdAt,desc",
  }) => {
    const qs = buildQueryString({
      customerId,
      page,
      size,
      sort,
    });
    return get(`/debts?${qs}`);
  },
  getDebtDetail: (serviceTicketId) => {
    return get(`/debts/${serviceTicketId}/debt-detail`);
  },
  createPayment: (payload) => {
    return post("/debts", payload);
  },
  pay: (debtId, payload) => {
    return post(`/debts/${debtId}/pay`, payload);
  },
  updateDueDate: (id, dueDate) => {
    return patch(`/debts/${id}/due-date?dueDate=${dueDate}`);
  },
};

export const employeesAPI = {
  getAll: (page = 0, size = 6) => get(`/employees?page=${page}&size=${size}`),
  getById: (id) => get(`/employees/${id}`),
  create: (payload) => post("/employees", payload),
  update: (id, payload) => patch(`/employees/${id}`, payload),
  getTechnicians: () => get("/employees/technicians"),
};

export const suppliersAPI = {
  getAll: (page = 0, size = 6) => get(`/suppliers?page=${page}&size=${size}`),
  getById: (id) => get(`/suppliers/${id}`),
  create: (payload) => post("/suppliers", payload),
  update: (id, payload) => patch(`/suppliers/${id}`, payload),
  remove: (id) => del(`/suppliers/${id}`),
  toggleActive: (id) => patch(`/suppliers/${id}/toggle-active`),
};

export const customersAPI = {
  getAll: (page = 0, size = 10) =>
    get(`/customers/manager?page=${page}&size=${size}`),
  getById: (id) => get(`/customers/${id}`),
  getServiceHistory: (phone) =>
    get(`/customers/service-history?phone=${encodeURIComponent(phone)}`),
  lookupByOtp: (phone) =>
    get(`/customers/otp/lookup?phone=${encodeURIComponent(phone || "")}`, {
      skipAuth: true,
    }),
  checkCustomer: (phone) =>
    get(`/customers/check?phone=${encodeURIComponent(phone || "")}`, {
      skipAuth: true,
    }),
  notMe: (phone) => post("/customers/not-me", { phone }, { skipAuth: true }),
  getServiceHistoryById: (customerId) =>
    get(`/customers/manager/${customerId}/service-history`),
  getByPhone: (phone) =>
    get(`/customers/phone?phone=${encodeURIComponent(phone)}`),
  create: (payload) => post("/customers", payload),
  update: (id, payload) => patch(`/customers/${id}`, payload),
  toggleActive: (id) => patch(`/customers/${id}/toggle-active`, {}),
};

export const manualVoucherAPI = {
  getAll: (page = 0, size = 6) => {
    const query = buildQueryString({ page, size });
    const suffix = query ? `?${query}` : "";
    return get(`/manual-vouchers${suffix}`);
  },
  create: (payload, file) => {
    const formData = new FormData();
    formData.append("data", JSON.stringify(payload));
    if (file) {
      formData.append("file", file);
    }

    return post("/manual-vouchers", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
};

export const ledgerVoucherAPI = {
  getAll: (page = 0, size = 20, queryString = "") => {
    const baseUrl = `/ledger-vouchers?page=${page}&size=${size}`;
    return queryString ? get(`${baseUrl}&${queryString}`) : get(baseUrl);
  },
  getById: (id) => get(`/ledger-vouchers/${id}`),
  getAttachment: (id) => {
    return axiosClient.get(`/ledger-vouchers/${id}/attachment`, {
      responseType: "blob",
    });
  },
  create: (data, file) => {
    const formData = new FormData();
    formData.append("data", JSON.stringify(data));
    if (file) {
      formData.append("file", file);
    }

    return post("/ledger-vouchers/manual", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
  approve: (id, approvedByEmployeeId = 0) =>
    post(`/ledger-vouchers/${id}/approve`, { approvedByEmployeeId }),
  reject: (id, rejectedByEmployeeId = 0) =>
    post(`/ledger-vouchers/${id}/reject`, { rejectedByEmployeeId }),
  pay: (id) => post(`/ledger-vouchers/${id}/pay`),
};

export const attendanceAPI = {
  mark: (data) => put("/attendances/mark", data),
  getDaily: (date) => get(`/attendances/daily?date=${date}`),
  getSummary: (startDate, endDate) =>
    get(`/attendances/summary?startDate=${startDate}&endDate=${endDate}`),
};

export const payrollAPI = {
  checkExists: (month, year) =>
    get(`/payroll/check-exists?month=${month}&year=${year}`),
  getPreview: (month, year) =>
    get(`/payroll/preview?month=${month}&year=${year}`),
  getList: (month, year) => get(`/payroll/list?month=${month}&year=${year}`),
  getDetail: (employeeId, month, year) =>
    get(`/payroll/detail?employeeId=${employeeId}&month=${month}&year=${year}`),
  getSummary: (month, year) =>
    get(`/payroll/summary-by-month?month=${month}&year=${year}`),
  createAllowance: (payload) => post(`/allowance/create`, payload),
  deleteAllowance: (id) => del(`/allowance/${id}`),
  createDeduction: (payload) => post(`/deduction`, payload),
  deleteDeduction: (id) => del(`/deduction/${id}`),
  paySalary: (payrollId, accountantId) =>
    post(`/payroll/${payrollId}/pay?accountant=${accountantId}`),
  submit: (month, year, accountantId) =>
    post(
      `/payroll/submit?month=${month}&year=${year}&accountant=${accountantId}`
    ),
  approve: (payrollId, managerId) =>
    post(`/payroll/${payrollId}/approve?manager=${managerId}`),
  reject: (payrollId, managerId, reason) =>
    post(`/payroll/${payrollId}/reject?manager=${managerId}`, { reason }),
};

export const stockReceiptAPI = {
  getAll: (
    page = 0,
    size = 10,
    keyword = null,
    status = null,
    fromDate = null,
    toDate = null
  ) => {
    const params = new URLSearchParams({ page, size });
    if (keyword) params.append("keyword", keyword);
    if (status) params.append("status", status);
    if (fromDate) params.append("fromDate", fromDate);
    if (toDate) params.append("toDate", toDate);
    return get(`/stock-receipt?${params.toString()}`);
  },
  getById: (id) => get(`/stock-receipt/${id}`),
  getItemHistory: (itemId) =>
    get(`/stock-receipt/receipt-items/${itemId}/history`),
  getItemById: (itemId) => get(`/stock-receipt/receipt-items/${itemId}`),
  receiveItem: (itemId, formData) => {
    return axiosClient.post(
      `/stock-receipt/receipt-items/${itemId}/receive`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
  },
  getReceiptHistory: (page = 0, size = 10) => {
    const params = new URLSearchParams({ page, size });
    return get(`/stock-receipt/receipt-history?${params.toString()}`);
  },
  getPaymentDetail: (id) =>
    get(`/stock-receipt/receipt-history/${id}/payment-detail`),
  getReceiptHistoryAttachment: (historyId) => {
    return axiosClient.get(
      `/stock-receipt/receipt-history/${historyId}/attachment`,
      {
        responseType: "blob",
      }
    );
  },
  createReceiptPayment: (id, formData) => {
    return axiosClient.post(
      `/ledger-vouchers/receipt-payment/${id}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
  },
};

export const transactionsAPI = {
  callback: (paymentLinkId) =>
    post("/transactions/manual-callback", { paymentLinkId }),
  getByInvoiceId: (invoiceId) => get(`/transactions/invoice/${invoiceId}`),
};

export const warehouseAPI = {
  createManualTransaction: (payload) =>
    post("/warehouse/manual-transaction", payload),
};

export const dashboardAPI = {
  getWarehouseOverview: (year, month) => {
    const params = new URLSearchParams();
    if (year) params.append("year", year);
    if (month) params.append("month", month);
    return get(`/dashboard/warehouse/overview?${params.toString()}`);
  },
  getServiceAdvisorOverview: () => {
    return get("/dashboard/service-advisor/overview");
  },
  getFinancialOverview: (year) => {
    const params = new URLSearchParams();
    if (year) params.append("year", year);
    return get(`/dashboard/financial/overview?${params.toString()}`);
  },
  getStatistics: (fromYear, toYear, year, month) => {
    const params = new URLSearchParams();
    if (fromYear) params.append("fromYear", fromYear);
    if (toYear) params.append("toYear", toYear);
    if (year) params.append("year", year);
    if (month) params.append("month", month);
    return get(`/dashboard/statistics?${params.toString()}`);
  },
};

export const purchaseRequestAPI = {
  getAll: (page = 0, size = 10, queryString = "") => {
    const baseUrl = `/purchase-requests?page=${page}&size=${size}`;
    return queryString ? get(`${baseUrl}&${queryString}`) : get(baseUrl);
  },
  getById: (id) => get(`/purchase-requests/${id}`),
  create: (payload) => post("/purchase-requests", payload),
  update: (id, payload) => put(`/purchase-requests/${id}`, payload),
  delete: (id) => del(`/purchase-requests/${id}`),
  approve: (id) => put(`/purchase-requests/${id}/approve`, {}),
  reject: (id, reason) => {
    const params = new URLSearchParams();
    if (reason) params.append("reason", reason);
    const queryString = params.toString();
    return put(
      `/purchase-requests/${id}/reject${queryString ? `?${queryString}` : ""}`,
      {}
    );
  },
  getSuggestedItems: () => get("/purchase-requests/suggested-items"),
  createManual: (payload) => post("/purchase-requests/manual", payload),
};
