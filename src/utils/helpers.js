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

