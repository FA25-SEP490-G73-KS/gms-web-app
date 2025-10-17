// API service: Central place to configure HTTP client and endpoints.
// Replace fetch wrappers with your preferred client (fetch/axios/etc.).

export type ApiResponse<T> = { data: T; error?: string };

const BASE_URL = import.meta.env.VITE_API_URL || "/api";

export async function get<T>(path: string, init?: RequestInit): Promise<ApiResponse<T>> {
  const res = await fetch(`${BASE_URL}${path}`, { ...init, method: "GET" });
  if (!res.ok) return { data: undefined as unknown as T, error: res.statusText };
  return { data: (await res.json()) as T };
}

export async function post<T>(path: string, body: unknown, init?: RequestInit): Promise<ApiResponse<T>> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    body: JSON.stringify(body),
    ...init,
  });
  if (!res.ok) return { data: undefined as unknown as T, error: res.statusText };
  return { data: (await res.json()) as T };
}
