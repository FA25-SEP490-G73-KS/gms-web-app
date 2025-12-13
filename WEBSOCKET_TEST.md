# Hướng dẫn test WebSocket STOMP

## Cách test WebSocket

### 1. **Truy cập trang test**

Sau khi đăng nhập, truy cập: `/test/websocket`

Hoặc bạn có thể thêm link vào menu sidebar tạm thời.

### 2. **Kiểm tra kết nối tự động**

- WebSocket sẽ tự động kết nối khi bạn đăng nhập vào hệ thống
- Kiểm tra trạng thái kết nối trên trang test
- Nếu chưa kết nối, click nút "Kết nối"

### 3. **Test các tính năng**

#### **A. Kiểm tra trạng thái kết nối**
- Xem tag "Đã kết nối" (màu xanh) hoặc "Chưa kết nối" (màu đỏ)
- Kiểm tra User ID hiển thị

#### **B. Test gửi message**
1. Nhập destination (ví dụ: `/test/message`)
2. Nhập message dạng JSON (ví dụ: `{"type": "test", "message": "Hello"}`)
3. Click "Gửi Message"
4. Message sẽ được gửi đến server với prefix `/app` tự động

#### **C. Test subscribe để nhận message**
1. Nhập destination để subscribe (ví dụ: `/topic/test` hoặc `/queue/test`)
2. Click "Subscribe lại" nếu cần
3. Messages nhận được sẽ hiển thị trong danh sách

#### **D. Test notifications**
- Notifications từ user-specific destination sẽ tự động hiển thị
- Xem danh sách notifications ở cuối trang

### 4. **Test với Browser Console**

Mở Browser Console (F12) để xem logs:

```javascript
// Kiểm tra trạng thái WebSocket
const wsStore = await import('./store/websocketStore');
console.log('Connected:', wsStore.default.getState().isConnected);

// Gửi message thủ công
const wsStore = await import('./store/websocketStore');
wsStore.default.getState().send('/test/message', {
  type: 'test',
  message: 'Hello from console'
});

// Subscribe vào topic
const wsStore = await import('./store/websocketStore');
const unsubscribe = wsStore.default.getState().subscribe('/topic/test', (data) => {
  console.log('Received:', data);
}, { type: 'topic' });
```

### 5. **Các destination prefix**

- **Client gửi lên server**: `/app/*`
  - Ví dụ: `/app/test/message` hoặc chỉ cần nhập `/test/message` (sẽ tự thêm prefix)
  
- **Subscribe topic (broadcast)**: `/topic/*`
  - Ví dụ: `/topic/public/updates`
  
- **Subscribe queue**: `/queue/*`
  - Ví dụ: `/queue/notifications`
  
- **User-specific**: `/user/{userId}/queue/*`
  - Tự động xử lý trong code, chỉ cần nhập queue destination

### 6. **Test real-time updates**

1. Mở trang test trên 2 tab/browser khác nhau (cùng user hoặc khác user)
2. Subscribe vào cùng một topic
3. Gửi message từ một tab
4. Kiểm tra tab kia có nhận được message không

### 7. **Kiểm tra reconnect**

1. Kết nối WebSocket
2. Tắt/ngắt mạng internet
3. Bật lại mạng
4. Kiểm tra WebSocket tự động reconnect (tối đa 5 lần)

## Troubleshooting

### WebSocket không kết nối được
- Kiểm tra backend đã chạy chưa (port 8080)
- Kiểm tra endpoint `/ws` có hoạt động không
- Kiểm tra token trong localStorage
- Xem console để biết lỗi chi tiết

### Không nhận được messages
- Kiểm tra đã subscribe đúng destination chưa
- Kiểm tra backend có gửi message đến destination đó không
- Kiểm tra format message (phải là JSON)

### Messages không được gửi
- Kiểm tra WebSocket đã kết nối chưa
- Kiểm tra destination có đúng format không
- Kiểm tra message có phải JSON hợp lệ không

## Lưu ý

- WebSocket chỉ hoạt động khi user đã đăng nhập
- Khi logout, WebSocket sẽ tự động ngắt kết nối
- WebSocket sẽ tự động reconnect nếu bị ngắt kết nối

