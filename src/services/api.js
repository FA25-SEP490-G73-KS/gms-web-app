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

async function request(method, path, body, init = {}) {
  // Remove leading slash from path if BASE_URL already ends with slash
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  const url = path.startsWith('http') ? path : `${BASE_URL}${cleanPath}`;
  
  // Get token if not explicitly disabled
  const token = init.skipAuth ? null : getToken();
  
  const headers = { 'Content-Type': 'application/json', ...(init?.headers || {}) };
  
  // Add Authorization header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const config = {
    method,
    headers,
    ...init,
  };
  
  // Remove skipAuth from config as it's not a valid fetch option
  delete config.skipAuth;
  
  if (body) {
    config.body = JSON.stringify(body);
  }
  
  try {
    const res = await fetch(url, config);
    const data = await res.json();
    if (!res.ok) {
      // Handle API response format: { message, statusCode, ... }
      const errorMessage = data.message || data.error || res.statusText;
      return { data: undefined, error: errorMessage, statusCode: res.status };
    }
    return { data, error: undefined };
  } catch (err) {
    return { data: undefined, error: err.message };
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
  update: (id, data) => put(`/service-tickets/${id}`, data),
};

export const inventoryAPI = {
  getAll: () => get('/inventory'),
  getById: (id) => get(`/inventory/${id}`),
  create: (data) => post('/inventory', data),
  update: (id, data) => put(`/inventory/${id}`, data),
  delete: (id) => del(`/inventory/${id}`),
};

export const otpAPI = {
  send: (phone, purpose) => post('/otp/send', { phone, purpose }, { skipAuth: true }),
  verify: (phone, otpCode, purpose) => post('/otp/verify', { phone, otpCode, purpose }, { skipAuth: true }),
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
};

