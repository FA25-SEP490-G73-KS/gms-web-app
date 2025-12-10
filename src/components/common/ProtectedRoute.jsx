import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { getRoleFromToken, getToken } from '../../utils/helpers';

/**
 * ProtectedRoute - Component để bảo vệ routes theo role
 * @param {Object} props
 * @param {React.ReactNode} props.children - Component con cần render
 * @param {string|string[]} props.allowedRoles - Role(s) được phép truy cập
 * @param {boolean} props.requireAuth - Yêu cầu đăng nhập (mặc định: true)
 */
export default function ProtectedRoute({ 
  children, 
  allowedRoles = [], 
  requireAuth = true 
}) {
  const location = useLocation();
  const { user } = useAuthStore();
  
  // Lấy token từ sessionStorage hoặc localStorage
  const token = getToken();
  
  // Kiểm tra xem có token không
  if (requireAuth && !token) {
    // Lưu đường dẫn hiện tại để redirect lại sau khi login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // Nếu không yêu cầu đăng nhập, cho phép truy cập
  if (!requireAuth) {
    return children;
  }
  
  // Lấy role từ token hoặc từ user store
  let userRole = null;
  
  if (token) {
    userRole = getRoleFromToken();
    // Nếu không lấy được từ token, thử từ user store
    if (!userRole && user?.role) {
      userRole = user.role;
    }
  }
  
  // Nếu không có role, chuyển về trang login
  if (!userRole) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // Nếu có quy định allowedRoles, kiểm tra role
  if (allowedRoles && allowedRoles.length > 0) {
    const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    
    if (!rolesArray.includes(userRole)) {
      // Không có quyền, chuyển đến trang 403
      return <Navigate to="/403" replace />;
    }
  }
  
  // Có quyền truy cập, render children
  return children;
}

