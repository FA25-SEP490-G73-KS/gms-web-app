import axios from 'axios';

// In development, use relative path to leverage Vite proxy
// In production, use full URL from env variable
const BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '/api' : 'http://localhost:8080/api');

// Get token from localStorage
function getToken() {
  try {
    return localStorage.getItem('token') || localStorage.getItem('accessToken') || localStorage.getItem('authToken');
  } catch {
    return null;
  }
}

// Create axios instance
const axiosClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// List of public endpoints that don't require authentication
const PUBLIC_ENDPOINTS = [
  '/auth/login',
  '/auth/refresh',
  '/auth/reset-password',
  '/auth/update-password',
];

// Request interceptor to add Bearer token automatically
axiosClient.interceptors.request.use(
  (config) => {
    // Check if skipAuth is set in config (can be boolean true or string 'true')
    const skipAuth = config.skipAuth === true || config.skipAuth === 'true';
    
    // Check if endpoint is in public list
    const isPublicEndpoint = PUBLIC_ENDPOINTS.some(endpoint => 
      config.url?.includes(endpoint) || config.url?.endsWith(endpoint)
    );
    
    // Only add token if skipAuth is not set and endpoint is not public
    if (!skipAuth && !isPublicEndpoint) {
      const token = getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    
    // Remove skipAuth from config as it's not a valid axios option
    // This must be done after checking it
    delete config.skipAuth;
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);


axiosClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
   
      const errorMessage = error.response.data?.message || error.response.data?.error || error.message;
      return Promise.reject(new Error(errorMessage));
    } else if (error.request) {
     
      return Promise.reject(new Error('Không thể kết nối đến server. Vui lòng thử lại.'));
    } else {
      // Something else happened
      return Promise.reject(error);
    }
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
      statusCode: response.status 
    };
  } catch (err) {
    const errorMessage = err.message || 'Đã xảy ra lỗi. Vui lòng thử lại.';
    return { 
      data: undefined, 
      error: errorMessage,
      statusCode: err.response?.status 
    };
  }
}

export async function get(path, init) {
  return request('GET', path, null, init);
}

export async function post(path, body, init) {
  return request('POST', path, body, init);
}

export async function put(path, body, init) {
  return request('PUT', path, body, init);
}

export async function patch(path, body, init) {
  return request('PATCH', path, body, init);
}

export async function del(path, init) {
  return request('DELETE', path, null, init);
}

export const appointmentAPI = {
  getAll: (page = 0, size = 10) => get(`/appointments?page=${page}&size=${size}`),
  getById: (id) => get(`/appointments/${id}`),
  create: (data) => post('/appointments', data),
  updateStatus: (id, status) => patch(`/appointments/${id}/status?status=${status}`),
  getTimeSlots: (date) => get(`/appointments/time-slots?date=${date}`),
};

export const serviceTicketAPI = {
  getAll: (page = 0, size = 10) => get(`/service-tickets?page=${page}&size=${size}`),
  getById: (id) => get(`/service-tickets/${id}`),
  create: (data) => post('/service-tickets', data),
  update: (id, data) => {
    console.log('=== [API] serviceTicketAPI.update ===')
    console.log('Ticket ID:', id)
    console.log('Sending to backend:', JSON.stringify(data, null, 2))
    console.log('====================================')
    return patch(`/service-tickets/${id}`, data)
  },
  updateDeliveryAt: (id, date) => patch(`/service-tickets/${id}/delivery-at`, date),
  getCompletedPerMonth: () => get('/service-tickets/completed-per-month'),
  getCount: (date) => get(`/service-tickets/count?date=${date}`),
  getCountByType: (year, month) => get(`/service-tickets/count-by-type?year=${year}&month=${month}`),
};

export const serviceTypeAPI = {
  getAll: () => get('/services'),
};

export const inventoryAPI = {
  getAll: () => get('/inventory'),
  getById: (id) => get(`/inventory/${id}`),
  create: (data) => post('/inventory', data),
  update: (id, data) => put(`/inventory/${id}`, data),
  delete: (id) => del(`/inventory/${id}`),
};

export const stockExportAPI = {
  getAll: (page = 0, size = 6) => get(`/stock-exports?page=${page}&size=${size}`),
  getById: (id) => get(`/stock-exports/${id}`),
  create: (data) => post('/stock-exports', data),
  update: (id, data) => put(`/stock-exports/${id}`, data),
};

export const otpAPI = {
  send: (phone, purpose, options = {}) => post('/otp/send', { phone, purpose }, options),
  verify: (phone, otpCode, purpose, options = {}) => post('/otp/verify', { phone, otpCode, purpose }, options),
};

export const employeeAPI = {
  getTechnicians: () => get('/employees/technicians'),
};

export const partsAPI = {
  getAll: ({ page = 0, size = 6, keyword, signal } = {}) => {
    const query = buildQueryString({ page, size, keyword })
    const suffix = query ? `?${query}` : ''
    return get(`/parts${suffix}`, { signal })
  },
  getById: (id) => get(`/parts/${id}`),
  create: (data) => post('/parts', data),
  update: (id, data) => patch(`/parts/${id}`, data),
};

export const unitsAPI = {
  getAll: ({ page = 0, size = 20, sort } = {}) => {
    const query = buildQueryString({ page, size, sort })
    const suffix = query ? `?${query}` : ''
    return get(`/units${suffix}`)
  }
};

export const marketsAPI = {
  getAll: () => get('/markets')
};

export const partCategoriesAPI = {
  getAll: () => get('/part-category')
};

export const vehiclesAPI = {
  getBrands: () => get('/vehicles/brands'),
  getModelsByBrand: (brandId) => get(`/vehicles/brands/${brandId}/models`),
  getByLicensePlate: (licensePlate) => get(`/vehicles?licensePlate=${encodeURIComponent(licensePlate)}`),
};

export const priceQuotationAPI = {
  create: (ticketId) => post(`/price-quotations?ticketId=${ticketId}`),
  update: (id, payload) => put(`/price-quotations/${id}`, payload),
  sendToCustomer: (id) => post(`/price-quotations/${id}/send-to-customer`),
  getPending: (page = 0, size = 6) => get(`/price-quotations/pending?page=${page}&size=${size}`),
  confirmItem: (itemId, payload) => patch(`/quotation-items/${itemId}/confirm/update`, payload),
  rejectItem: (itemId, reason) => patch(`/quotation-items/${itemId}/reject`, reason),
};

export const znsNotificationsAPI = {
  sendQuotation: (quotationId) =>
    post(`/zns-notifications/quotation/${quotationId}/send`),
};

export const authAPI = {
  login: (phone, password) => post('/auth/login', { phone, password }, { skipAuth: true }),
  logout: () => post('/auth/logout', {}, { skipAuth: false }),
  refreshToken: (refreshToken) => post('/auth/refresh', { refreshToken }, { skipAuth: true }),
  resetPassword: (phone) => post('/auth/reset-password', { phone }, { skipAuth: true }),
  // Note: This API endpoint needs to be created in the backend
  // Expected: POST /api/auth/update-password
  // Body: { phone: string, otpCode: string, newPassword: string }
  updatePassword: (phone, otpCode, newPassword) => post('/auth/update-password', { phone, otpCode, newPassword }, { skipAuth: true }),
  changePassword: (currentPassword, newPassword) => put('/auth/change-password', { currentPassword, newPassword }),
};


function buildQueryString(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
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
    sort = 'createdAt,desc',
  }) => {
    const qs = buildQueryString({ customerId, status, keyword, page, size, sort });
    return get(`/debts?${qs}`);
  },
};

export const employeesAPI = {
  getAll: (page = 0, size = 6) => get(`/employees?page=${page}&size=${size}`),
  getTechnicians: () => get('/employees/technicians'),
};

export const suppliersAPI = {
  getAll: (page = 0, size = 6) => get(`/suppliers?page=${page}&size=${size}`),
  getById: (id) => get(`/suppliers/${id}`),
  create: (payload) => post('/suppliers', payload),
  update: (id, payload) => put(`/suppliers/${id}`, payload),
  remove: (id) => del(`/suppliers/${id}`),
};

export const customersAPI = {
  getAll: (page = 0, size = 10) => get(`/customers?page=${page}&size=${size}`),
  getById: (id) => get(`/customers/${id}`),
  getServiceHistory: (phone) => get(`/customers/service-history?phone=${encodeURIComponent(phone)}`),
  getByPhone: (phone) => get(`/customers/phone?phone=${encodeURIComponent(phone)}`),
  create: (payload) => post('/customers', payload),
  update: (id, payload) => put(`/customers/${id}`, payload),
};

export const manualVoucherAPI = {
  create: (payload, file) => {
    const formData = new FormData();
    formData.append('data', JSON.stringify(payload));
    if (file) {
      formData.append('file', file);
    }

    return post('/manual-vouchers', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

export const attendanceAPI = {
  mark: (data) => post('/attendances/mark', data),
  getDaily: (date) => get(`/attendances/daily?date=${date}`),
};
