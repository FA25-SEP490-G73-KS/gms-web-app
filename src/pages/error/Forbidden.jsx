import { useNavigate } from 'react-router-dom';
import { Button, Result } from 'antd';
import { HomeOutlined, LockOutlined } from '@ant-design/icons';
import useAuthStore from '../../store/authStore';
import { getRoleFromToken } from '../../utils/helpers';
import { ROLE_ROUTES, USER_ROLES } from '../../utils/constants';
import '../../styles/pages/error/error-pages.css';

export default function Forbidden() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  // Lấy role từ token
  const userRole = getRoleFromToken() || user?.role;
  
  // Lấy trang mặc định của role
  const getDefaultRoute = () => {
    if (userRole && ROLE_ROUTES[userRole]) {
      return ROLE_ROUTES[userRole];
    }
    return '/';
  };

  const handleGoHome = () => {
    const defaultRoute = getDefaultRoute();
    navigate(defaultRoute, { replace: true });
  };

  return (
    <div className="error-page-container">
      <Result
        status="403"
        icon={<LockOutlined style={{ color: '#faad14' }} />}
        title="403"
        subTitle="Xin lỗi, bạn không có quyền truy cập trang này."
        extra={[
          <Button 
            type="primary" 
            key="home"
            icon={<HomeOutlined />}
            onClick={handleGoHome}
          >
            Về Trang Của Tôi
          </Button>,
          <Button 
            key="back"
            onClick={() => navigate(-1)}
          >
            Quay Lại
          </Button>
        ]}
      />
    </div>
  );
}

