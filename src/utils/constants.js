export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

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

