export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

export const WS_URL = import.meta.env.VITE_WS_URL || 
  (import.meta.env.DEV 
    ? 'http://localhost:8080/ws' 
    : 'http://localhost:8080/ws');


export const USER_ROLES = {
  SERVICE_ADVISOR: 'SERVICE_ADVISOR',
  ACCOUNTANT: 'ACCOUNTANT',
  MANAGER: 'MANAGER',
  WAREHOUSE: 'WAREHOUSE',
};


export const ROLE_LABELS = {
  SERVICE_ADVISOR: 'Cố vấn dịch vụ',
  ACCOUNTANT: 'Kế toán',
  MANAGER: 'Quản lý',
  WAREHOUSE: 'Nhân viên kho',
};


export const ROLE_LABEL_TO_KEY = {
  'Cố vấn dịch vụ': USER_ROLES.SERVICE_ADVISOR,
  'Kế toán': USER_ROLES.ACCOUNTANT,
  'Quản lý': USER_ROLES.MANAGER,
  'Nhân viên kho': USER_ROLES.WAREHOUSE,
};


export const ROLE_KEY_TO_LABEL = {
  [USER_ROLES.SERVICE_ADVISOR]: ROLE_LABELS.SERVICE_ADVISOR,
  [USER_ROLES.ACCOUNTANT]: ROLE_LABELS.ACCOUNTANT,
  [USER_ROLES.MANAGER]: ROLE_LABELS.MANAGER,
  [USER_ROLES.WAREHOUSE]: ROLE_LABELS.WAREHOUSE,
};


export const ROLE_ROUTES = {
  [USER_ROLES.SERVICE_ADVISOR]: '/service-advisor/reports',
  [USER_ROLES.ACCOUNTANT]: '/accountance',
  [USER_ROLES.MANAGER]: '/manager',
  [USER_ROLES.WAREHOUSE]: '/warehouse/report',
};

export const WAREHOUSE_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  EXPORTING: 'EXPORTING',
  COMPLETED: 'COMPLETED',
  DRAFT: 'DRAFT'
};

export const WAREHOUSE_STATUS_LABELS = {
  [WAREHOUSE_STATUS.DRAFT]: 'Bản nháp',
  [WAREHOUSE_STATUS.PENDING]: 'Chờ xác nhận',
  [WAREHOUSE_STATUS.APPROVED]: 'Đã duyệt',
  [WAREHOUSE_STATUS.REJECTED]: 'Từ chối',
  [WAREHOUSE_STATUS.EXPORTING]: 'Đang xuất hàng',
  [WAREHOUSE_STATUS.COMPLETED]: 'Hoàn thành'
};

export const VEHICLE_MODELS = [
  { value: 'Mazda-v3', label: 'Mazda-v3' },
  { value: 'Toyota Vios', label: 'Toyota Vios' },
  { value: 'Honda City', label: 'Honda City' },
  { value: 'Universal', label: 'Universal' },
  { value: 'Tất cả', label: 'Tất cả' }
];

export const ORIGINS = [
  { value: 'VN', label: 'Việt Nam' },
  { value: 'Nhật', label: 'Nhật Bản' },
  { value: 'Trung Quốc', label: 'Trung Quốc' },
  { value: 'Hàn Quốc', label: 'Hàn Quốc' }
];

export const BRANDS = [
  { value: 'Castrol', label: 'Castrol' },
  { value: 'Toyota', label: 'Toyota' },
  { value: 'Honda', label: 'Honda' },
  { value: 'Mazda', label: 'Mazda' },
  { value: 'Universal', label: 'Universal' }
];

