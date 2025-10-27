# GMS Web App - Garage Management System

## Cấu trúc dự án mới (React + JavaScript)

Dự án đã được chuyển đổi từ TypeScript sang JavaScript và sử dụng cấu trúc React thông thường.

### Công nghệ sử dụng

- **React 18** - Library UI
- **React Router v6** - Routing
- **Zustand** - State Management
- **Axios** - HTTP Client
- **Bootstrap** + **Bootstrap Icons** - UI Components
- **AOS** - Animation on Scroll
- **Vite** - Build Tool

### Cấu trúc thư mục

```
gms-web-app/
├── src/
│   ├── components/         # Các React components
│   │   ├── appointments/   # Components liên quan đến lịch hẹn
│   │   ├── home/          # Homepage components
│   │   ├── serviceTickets/ # Components phiếu dịch vụ
│   │   └── Header.jsx     # Header component
│   ├── layouts/           # Layout components
│   │   └── DashboardLayout.jsx
│   ├── pages/             # Các page components
│   │   ├── HomePage.jsx
│   │   ├── Appointments.jsx
│   │   ├── ServiceTickets.jsx
│   │   └── ServiceTicketsNew.jsx
│   ├── services/          # API services
│   │   └── api.js
│   ├── store/             # Zustand stores
│   │   └── authStore.js
│   ├── styles/            # CSS files
│   ├── utils/             # Utility functions
│   ├── App.jsx            # Main App component
│   ├── App.css            # Global styles
│   └── main.jsx           # Entry point
├── public/                # Static assets
├── index.html            # HTML template
├── package.json
└── vite.config.js

```

### Cài đặt và chạy

```bash
# Cài đặt dependencies
npm install

# Chạy development server
npm run dev

# Build production
npm run build

# Preview production build
npm run preview
```

### State Management với Zustand

Dự án sử dụng Zustand để quản lý state thay cho Context API:

```javascript
// Sử dụng auth store
import useAuthStore from './store/authStore';

function Component() {
  const { user, login, logout } = useAuthStore();
  // ...
}
```

### Routing

Dự án sử dụng React Router v6:

```javascript
// Routes được định nghĩa trong App.jsx
<Routes>
  <Route path="/" element={<HomePage />} />
  <Route path="/appointments" element={<Appointments />} />
  <Route path="/service-tickets" element={<ServiceTickets />} />
  <Route path="/service-tickets-new" element={<ServiceTicketsNew />} />
</Routes>
```

### API Configuration

API base URL được cấu hình trong `src/utils/constants.js`:

```javascript
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
```

Để thay đổi API URL, tạo file `.env`:

```
VITE_API_URL=http://your-api-url/api
```

### Các tính năng chính

1. **Quản lý lịch hẹn** - Xem, tạo, cập nhật lịch hẹn
2. **Phiếu dịch vụ** - Tạo và quản lý phiếu dịch vụ
3. **Dashboard** - Tổng quan hoạt động
4. **Responsive Design** - Tương thích mobile

## License

Private Project
