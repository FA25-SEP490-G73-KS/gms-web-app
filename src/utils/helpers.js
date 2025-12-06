export function formatDate(date) {
  return new Date(date).toLocaleDateString('vi-VN');
}

export function formatTime(time) {
  return new Date(time).toLocaleTimeString('vi-VN');
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount);
}

export function formatNumber(number) {
  return new Intl.NumberFormat('vi-VN').format(number);
}

export function generateCode(prefix = 'STK') {
  const date = new Date();
  const year = date.getFullYear();
  const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  return `${prefix}-${year}-${random}`;
}

export function normalizePhoneTo84(phone) {
  if (phone === undefined || phone === null) return '';
  const cleaned = String(phone).replace(/\D/g, '');
  if (!cleaned) return '';
  if (cleaned.startsWith('84')) return cleaned;
  if (cleaned.startsWith('0')) return `84${cleaned.slice(1)}`;
  return `84${cleaned}`;
}

export function displayPhoneFrom84(phone) {
  if (!phone) return '';
  const cleaned = String(phone).replace(/\D/g, '');
  if (cleaned.startsWith('84')) {
    return `0${cleaned.slice(2)}`;
  }
  return cleaned;
}

export function normalizePhoneTo0(phone) {
  if (phone === undefined || phone === null) return '';
  const cleaned = String(phone).replace(/\D/g, '');
  if (!cleaned) return '';
  if (cleaned.startsWith('84')) return `0${cleaned.slice(2)}`;
  if (cleaned.startsWith('0')) return cleaned;
  return `0${cleaned}`;
}

export function decodeJWT(token) {
  try {
    if (!token) return null;
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
}

export function getUserNameFromToken() {
  try {
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken') || localStorage.getItem('authToken');
    console.log('Token found:', token ? 'Yes' : 'No');
    if (!token) return null;
    const decoded = decodeJWT(token);
    console.log('Decoded JWT:', decoded);
    console.log('Available fields:', Object.keys(decoded || {}));
    const username = decoded?.fullName || decoded?.name || decoded?.username || decoded?.sub || null;
    console.log('Username extracted:', username);
    return username;
  } catch (error) {
    console.error('Error getting user name from token:', error);
    return null;
  }
}

export function getUserIdFromToken() {
  try {
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken') || localStorage.getItem('authToken');
    if (!token) return null;
    const decoded = decodeJWT(token);
    return decoded?.userId || decoded?.id || decoded?.employeeId || decoded?.sub || null;
  } catch (error) {
    console.error('Error getting user ID from token:', error);
    return null;
  }
}

