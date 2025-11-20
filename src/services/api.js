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

export async function del(path, init) {
    return request('DELETE', path, null, init);
}

export const appointmentAPI = {
    getAll: () => get('/appointments'),
    getById: (id) => get(`/appointments/${id}`),

    @@ -53,3 +57,11 @@ export const serviceTicketAPI = {
        update: (id, data) => put(`/service-tickets/${id}`, data),
    };

    export const inventoryAPI = {
        getAll: () => get('/inventory'),
        getById: (id) => get(`/inventory/${id}`),
        create: (data) => post('/inventory', data),
        update: (id, data) => put(`/inventory/${id}`, data),
        delete: (id) => del(`/inventory/${id}`),
    };