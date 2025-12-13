# 🔍 Hướng dẫn Debug WebSocket Notification

## Kiểm tra nhanh

### 1. Kiểm tra JWT Token và Employee ID

Mở Browser Console (F12) và chạy:

```javascript
// Kiểm tra token
const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
console.log('Token:', token ? '✅ Có' : '❌ Không có');

// Decode token (nếu đã import helpers)
import { decodeJWT, getEmployeeIdFromToken, debugJWTToken } from './src/utils/helpers';
const decoded = decodeJWT(token);
console.log('Decoded token:', decoded);
console.log('Employee ID:', getEmployeeIdFromToken());

// Hoặc debug đầy đủ
debugJWTToken(token);
```

**Kết quả mong đợi:**
- Token có trong localStorage
- Employee ID có giá trị (ví dụ: `2`)
- Subscribe topic sẽ là: `/topic/noti/2`

### 2. Kiểm tra WebSocket Connection

Trong Console, tìm các log sau:

```
✅ STOMP Connected: {...}
📡 Subscribing to notification topic: /topic/noti/2
✅ Successfully subscribed to /topic/noti/2 (subscription ID: ...)
✅ Successfully subscribed to /public/updates
```

**Nếu thấy:**
- `⚠️ STOMP not connected, cannot subscribe` → Connection chưa sẵn sàng
- `❌ Failed to subscribe` → Subscription thất bại
- `⚠️ Employee ID not found` → Không tìm thấy Employee ID trong token

### 3. Kiểm tra Subscription

Trong Console, sau khi connected, bạn sẽ thấy:

```
📡 Subscribing to notification topic: /topic/noti/2
🔔 Attempting to subscribe to: /topic/noti/2
✅ Successfully subscribed to /topic/noti/2 (subscription ID: ...)
```

**Nếu KHÔNG thấy log "Successfully subscribed":**
- Connection chưa hoàn tất
- Employee ID không đúng
- Backend chưa sẵn sàng nhận subscription

### 4. Test nhận Notification

#### Cách 1: Từ Backend (Khuyến nghị)

Backend gửi notification:

```java
template.convertAndSend(
    "/topic/noti/2",  // Thay 2 bằng employeeId thực tế
    notificationDto
);
```

Frontend sẽ nhận:

```
📥 Message received from /topic/noti/2: {...}
📬 Notification received: {...}
```

#### Cách 2: Test manual trong Console

```javascript
// Simulate notification (test UI)
import useWebSocketStore from './src/store/websocketStore';
const { addNotification } = useWebSocketStore.getState();

addNotification({
  notificationId: Date.now(),
  title: "Test Notification",
  message: "Đây là test notification",
  type: "TEST",
  status: "UNREAD",
  createdAt: new Date().toISOString()
});
```

### 5. Kiểm tra trong DevTools Network Tab

1. Mở DevTools (F12)
2. Vào tab **Network**
3. Lọc **WS** (WebSocket)
4. Click vào WebSocket connection
5. Vào tab **Messages**

Bạn sẽ thấy:
- **STOMP CONNECT** → Kết nối thành công
- **STOMP SUBSCRIBE** → Đăng ký topic
- **MESSAGE** → Nhận notification từ server

## Troubleshooting

### ❌ Không kết nối được WebSocket

**Nguyên nhân có thể:**
1. Backend chưa chạy (port 8080)
2. Token không hợp lệ
3. CORS/Network issue

**Cách kiểm tra:**
```javascript
// Console
console.log('WS_URL:', import.meta.env.VITE_WS_URL || 'http://localhost:8080/ws');
console.log('Token:', localStorage.getItem('token'));
```

**Giải pháp:**
- Kiểm tra backend đã chạy chưa
- Kiểm tra token còn hợp lệ không
- Kiểm tra network tab để xem lỗi cụ thể

### ❌ Đã kết nối nhưng không subscribe được

**Nguyên nhân có thể:**
1. Employee ID không tìm thấy
2. Subscription được gọi quá sớm
3. Backend chưa hỗ trợ topic đó

**Cách kiểm tra:**
```javascript
// Console
import { getEmployeeIdFromToken } from './src/utils/helpers';
const employeeId = getEmployeeIdFromToken();
console.log('Employee ID:', employeeId);
console.log('Subscribe topic sẽ là:', `/topic/noti/${employeeId}`);
```

**Giải pháp:**
- Kiểm tra JWT token có field `sub` hoặc `employeeId`
- Đợi connection hoàn tất trước khi subscribe (code đã có setTimeout)
- Kiểm tra backend có hỗ trợ topic `/topic/noti/{employeeId}`

### ❌ Đã subscribe nhưng không nhận được notification

**Nguyên nhân có thể:**
1. Backend gửi đến topic sai
2. Employee ID không khớp
3. Format notification không đúng

**Cách kiểm tra:**

1. **Kiểm tra Employee ID khớp:**
   ```javascript
   // Frontend subscribe vào
   const employeeId = getEmployeeIdFromToken(); // Ví dụ: "2"
   console.log('Frontend subscribe:', `/topic/noti/${employeeId}`);
   
   // Backend phải gửi đến cùng topic
   // template.convertAndSend("/topic/noti/2", ...)
   ```

2. **Kiểm tra format notification:**
   - Backend phải gửi JSON object
   - Frontend sẽ parse JSON và lưu vào store

3. **Kiểm tra Console logs:**
   - Xem có log `📥 Message received` không
   - Xem có log `📬 Notification received` không
   - Xem có lỗi parsing không

**Giải pháp:**
- Đảm bảo backend gửi đến đúng topic: `/topic/noti/{employeeId}`
- Đảm bảo Employee ID khớp giữa frontend và backend
- Kiểm tra format JSON của notification

## Checklist Debug

- [ ] ✅ Token có trong localStorage
- [ ] ✅ JWT decode thành công
- [ ] ✅ Employee ID có giá trị
- [ ] ✅ WebSocket kết nối thành công
- [ ] ✅ Subscribe vào topic thành công
- [ ] ✅ Backend gửi notification đến đúng topic
- [ ] ✅ Frontend nhận được message
- [ ] ✅ Notification được parse và lưu vào store
- [ ] ✅ UI hiển thị notification

## Test nhanh

1. **Đăng nhập** → Mở Console (F12)
2. **Kiểm tra logs:**
   ```
   ✅ STOMP Connected
   📡 Subscribing to notification topic: /topic/noti/2
   ✅ Successfully subscribed
   ```
3. **Backend gửi test notification**
4. **Kiểm tra Console:**
   ```
   📥 Message received from /topic/noti/2: {...}
   📬 Notification received: {...}
   ```
5. **Kiểm tra UI:** Vào `/test/websocket` → Xem Notifications

## Liên hệ

Nếu vẫn gặp vấn đề:
1. Copy toàn bộ Console logs
2. Copy Network tab (WebSocket messages)
3. Kiểm tra backend logs

