import { ROLE_LABEL_TO_KEY } from './constants';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

export function formatDate(date) {
  return new Date(date).toLocaleDateString('vi-VN');
}

export function formatTime(time) {
  return new Date(time).toLocaleTimeString('vi-VN');
}

export function parseDateWithVNTimezone(dateString) {
  if (!dateString) return null;
  
  try {
    if (typeof dateString === 'string') {
      return dayjs(dateString).utcOffset(7);
    }
    
    return dayjs(dateString).utcOffset(7);
  } catch (error) {
    console.error('Error parsing date with VN timezone:', error);
    return dayjs(dateString);
  }
}

export function formatTimeWithVNTimezone(dateString) {
  if (!dateString) return '';
  
  try {
    const date = parseDateWithVNTimezone(dateString);
    if (!date || !date.isValid()) return '';
    
    const now = dayjs().utcOffset(7);
    const diff = now.diff(date, 'minute');
    
    if (diff < 1) return 'Vừa xong';
    if (diff < 60) return `${diff} phút trước`;
    
    const hours = Math.floor(diff / 60);
    if (hours < 24) return `${hours} giờ trước`;
    
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} ngày trước`;
    
    return date.format('DD/MM/YYYY');
  } catch (error) {
    console.error('Error formatting time with VN timezone:', error);
    return '';
  }
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


// Import authStore trực tiếp (không dùng require vì không hoạt động trong browser ES modules)
import useAuthStore from '../store/authStore';

export function getToken() {
  if (typeof window === 'undefined') return null;
  
  try {
    // Lấy token từ authStore (memory) thay vì storage
    const accessToken = useAuthStore.getState().getAccessToken();
    return accessToken;
  } catch (error) {
    console.error('Error getting token from store:', error);
    return null;
  }
}

export function getUserNameFromToken() {
  try {
    const token = getToken();
    if (!token) return null;
    const decoded = decodeJWT(token);
    // Backend lưu fullName vào claim "fullName"
    const username = decoded?.fullName || decoded?.name || decoded?.username || null;
    return username;
  } catch (error) {
    console.error('Error getting user name from token:', error);
    return null;
  }
}

export function getUserIdFromToken() {
  try {
    const token = getToken();
    if (!token) return null;
    const decoded = decodeJWT(token);
    return decoded?.userId || decoded?.id || decoded?.employeeId || decoded?.sub || null;
  } catch (error) {
    console.error('Error getting user ID from token:', error);
    return null;
  }
}

export function getEmployeeIdFromToken() {
  try {
    const token = getToken();
    if (!token) return null;
    const decoded = decodeJWT(token);
    
    return decoded?.employeeId || 
           decoded?.sub || 
           decoded?.userId || 
           decoded?.id || 
           null;
  } catch (error) {
    console.error('Error getting employee ID from token:', error);
    return null;
  }
}

export function getUserPhoneFromToken() {
  try {
    const token = getToken();
    if (!token) return null;
    const decoded = decodeJWT(token);
    // Backend lưu phone vào claim "phone"
    const phone = decoded?.phone || null;
    return phone ? displayPhoneFrom84(phone) : null;
  } catch (error) {
    console.error('Error getting user phone from token:', error);
    return null;
  }
}

export function debugJWTToken(token) {
  try {
    const decoded = decodeJWT(token);
    console.log('=== JWT Token Debug ===');
    console.log('All fields:', decoded);
    console.log('Available fields:', Object.keys(decoded || {}));
    console.log('sub:', decoded?.sub);
    console.log('employeeId:', decoded?.employeeId);
    console.log('userId:', decoded?.userId);
    console.log('id:', decoded?.id);
    console.log('role:', decoded?.role);
    console.log('fullName:', decoded?.fullName);
    console.log('phone:', decoded?.phone);
    return decoded;
  } catch (error) {
    console.error('Error debugging JWT:', error);
    return null;
  }
}


export function normalizeRole(role) {
  if (!role) return null;
  
 
  const roleKeys = ['SERVICE_ADVISOR', 'ACCOUNTANT', 'MANAGER', 'WAREHOUSE'];
  if (roleKeys.includes(role)) {
    return role;
  }
  
  
  if (ROLE_LABEL_TO_KEY[role]) {
    return ROLE_LABEL_TO_KEY[role];
  }
  
 
  const normalizedRole = Object.keys(ROLE_LABEL_TO_KEY).find(
    label => label.toLowerCase() === role.toLowerCase()
  );
  
  if (normalizedRole) {
    return ROLE_LABEL_TO_KEY[normalizedRole];
  }
  
  return role; 
}

export function getRoleFromToken() {
  try {
    const token = getToken();
    if (!token) return null;
    const decoded = decodeJWT(token);
    
    
    const rawRole = decoded?.role || decoded?.userRole || decoded?.authorities?.[0] || decoded?.authority || null;
    
    if (!rawRole) return null;
    

    return normalizeRole(rawRole);
  } catch (error) {
    console.error('Error getting role from token:', error);
    return null;
  }
}

export function mapNotificationActionPath(actionPath) {
  if (!actionPath) return null;
  
  const userRole = getRoleFromToken();
  
  if (actionPath.startsWith('/service-tickets/')) {
    const ticketId = actionPath.replace('/service-tickets/', '');
    
    if (userRole === 'MANAGER') {
      return `/manager/service/orders/${ticketId}`;
    }
    
    return `/service-advisor/orders/${ticketId}`;
  }
  
  if (actionPath.startsWith('/appointments/')) {
    const appointmentId = actionPath.replace('/appointments/', '');
    return `/service-advisor/appointments`;
  }
  
  if (actionPath.startsWith('/quotations/')) {
    const quotationId = actionPath.replace('/quotations/', '');
    
    if (userRole === 'MANAGER') {
      return `/manager/service/orders`;
    }
    
    return `/service-advisor/orders`;
  }
  
  return actionPath;
}

