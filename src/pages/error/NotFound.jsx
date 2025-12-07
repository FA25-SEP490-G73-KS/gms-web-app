import { useNavigate } from 'react-router-dom';
import { Button, Result } from 'antd';
import { HomeOutlined } from '@ant-design/icons';
import '../../styles/pages/error/error-pages.css';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="error-page-container">
      <Result
        status="404"
        title="404"
        subTitle="Xin lỗi, trang bạn đang tìm kiếm không tồn tại."
        extra={
          <Button 
            type="primary" 
            icon={<HomeOutlined />}
            onClick={() => navigate('/')}
          >
            Về Trang Chủ
          </Button>
        }
      />
    </div>
  );
}

