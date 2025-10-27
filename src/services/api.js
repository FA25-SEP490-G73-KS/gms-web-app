// API service: Central place to configure HTTP client and endpoints.
const BASE_URL = import.meta.env.VITE_API_URL || '/api';

export async function get(path, init) {
  const res = await fetch(`${BASE_URL}${path}`, { ...init, method: 'GET' });
  if (!res.ok) return { data: undefined, error: res.statusText };
  return { data: await res.json() };
}

export async function post(path, body, init) {
  const res = await fetch(`http://localhost:8080/api/appointments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    body: JSON.stringify(body),
    ...init,
  });
  if (!res.ok) return { data: undefined, error: res.statusText };
  return { data: await res.json() };
}

