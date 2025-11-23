# Manager Role Implementation Notes

## Đã chọn role: MANAGER

### Ngày tạo: 2025-01-20

## Tổng quan

Role **MANAGER** đã được chọn và triển khai trong hệ thống. Manager có quyền truy cập đầy đủ đến tất cả các module trong hệ thống GMS (Garage Management System).

## Quyền truy cập của Manager

### 1. Dashboard & Báo cáo
- Dashboard tổng quan hệ thống
- Báo cáo tổng hợp từ tất cả các module

### 2. Service Advisor Module
- Xem và quản lý lịch hẹn
- Xem và quản lý phiếu dịch vụ
- Quản lý kho hàng của Service Advisor
- Dashboard Service Advisor

### 3. Warehouse Module
- Quản lý linh kiện/phụ tùng
- Quản lý nhập kho
- Quản lý xuất kho
- Báo cáo kho

### 4. Accountance Module
- Thống kê tài chính
- Quản lý thu - chi
- Quản lý nhân sự (HR)
- Quản lý công nợ
- Quản lý thanh toán

### 5. System Management
- Quản lý nhân viên
- Cài đặt hệ thống
- Báo cáo tổng hợp

## Layout

**File:** `src/layouts/ManagerLayout.jsx`

Layout này cung cấp:
- Sidebar với menu đầy đủ các module
- Breadcrumb navigation
- User info display
- Logout functionality
- Responsive design với collapsible sidebar

## Routes

Tất cả routes của Manager bắt đầu với prefix `/manager`:

- `/manager` - Dashboard chính
- `/manager/service-advisor/*` - Service Advisor module
- `/manager/warehouse/*` - Warehouse module
- `/manager/accountance/*` - Accountance module
- `/manager/system/*` - System management

## Authentication

Khi user đăng nhập với role `MANAGER` hoặc `ADMIN`, hệ thống sẽ tự động redirect đến `/manager`.

**File:** `src/pages/auth/Login.jsx` (line 46)

```javascript
if (userRole === 'MANAGER' || userRole === 'ADMIN') {
  navigate('/manager')
}
```

## State Management

Manager sử dụng `useAuthStore` để quản lý authentication state:
- User info được lưu trong store
- Token được lưu trong localStorage
- Logout function xóa token và redirect về login

## Styling

ManagerLayout sử dụng CSS từ `admin-layout.css` để đảm bảo consistency với các layout khác.

## Next Steps

1. Tạo các pages cho Manager routes
2. Implement dashboard với statistics từ tất cả modules
3. Add permission checks nếu cần phân quyền chi tiết hơn
4. Add system settings page
5. Add employee management page

## Notes

- Manager có thể xem và quản lý tất cả dữ liệu trong hệ thống
- Cần đảm bảo các API endpoints hỗ trợ role MANAGER
- Có thể cần thêm permission checks ở backend để đảm bảo security

