export function formatDate(date) {
  return new Date(date).toLocaleDateString('vi-VN');
}

export function formatTime(time) {
  return new Date(time).toLocaleTimeString('vi-VN');
}

