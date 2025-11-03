const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

async function request(method, path, body, init) {
  const url = path.startsWith('http') ? path : `${BASE_URL}${path}`;
  const config = {
    method,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    ...init,
  };
  
  if (body) {
    config.body = JSON.stringify(body);
  }
  
  try {
    const res = await fetch(url, config);
    const data = await res.json();
    if (!res.ok) return { data: undefined, error: data.message || res.statusText, statusCode: res.status };
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

export const appointmentAPI = {
  getAll: () => get('/appointments'),
  getById: (id) => get(`/appointments/${id}`),
  create: (data) => post('/appointments', data),
  updateStatus: (id, status) => patch(`/appointments/${id}/status?status=${status}`),
  getTimeSlots: (date) => get(`/appointments/time-slots?date=${date}`),
};

export const serviceTicketAPI = {
  getAll: () => get('/service-tickets'),
  getById: (id) => get(`/service-tickets/${id}`),
  create: (data) => post('/service-tickets', data),
  update: (id, data) => put(`/service-tickets/${id}`, data),
};

