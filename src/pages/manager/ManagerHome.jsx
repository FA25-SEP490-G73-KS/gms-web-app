import React from 'react'
import { Card, Row, Col, Statistic, Typography } from 'antd'
import { 
  CalendarOutlined, 
  FileTextOutlined, 
  DollarOutlined, 
  UserOutlined,
  ShopOutlined,
  BarChartOutlined,
  SettingOutlined
} from '@ant-design/icons'
import ManagerLayout from '../../layouts/ManagerLayout'

const { Title } = Typography

export default function ManagerHome() {
  return (
    <ManagerLayout>
      <div style={{ padding: '24px' }}>
        <Title level={2} style={{ marginBottom: 24 }}>Dashboard - Manager</Title>
        
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Lịch hẹn hôm nay"
                value={12}
                prefix={<CalendarOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Phiếu dịch vụ"
                value={45}
                prefix={<FileTextOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Doanh thu tháng"
                value={125000000}
                prefix={<DollarOutlined />}
                suffix="đ"
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Tổng nhân viên"
                value={28}
                prefix={<UserOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card 
              hoverable
              style={{ textAlign: 'center', cursor: 'pointer' }}
              onClick={() => window.location.href = '/manager/service-advisor'}
            >
              <ShopOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
              <Title level={4}>Service Advisor</Title>
              <p>Quản lý lịch hẹn và phiếu dịch vụ</p>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card 
              hoverable
              style={{ textAlign: 'center', cursor: 'pointer' }}
              onClick={() => window.location.href = '/manager/warehouse'}
            >
              <ShopOutlined style={{ fontSize: 48, color: '#52c41a', marginBottom: 16 }} />
              <Title level={4}>Warehouse</Title>
              <p>Quản lý kho và linh kiện</p>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card 
              hoverable
              style={{ textAlign: 'center', cursor: 'pointer' }}
              onClick={() => window.location.href = '/manager/accountance'}
            >
              <BarChartOutlined style={{ fontSize: 48, color: '#faad14', marginBottom: 16 }} />
              <Title level={4}>Accountance</Title>
              <p>Quản lý tài chính và kế toán</p>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card 
              hoverable
              style={{ textAlign: 'center', cursor: 'pointer' }}
              onClick={() => window.location.href = '/manager/system'}
            >
              <SettingOutlined style={{ fontSize: 48, color: '#722ed1', marginBottom: 16 }} />
              <Title level={4}>Hệ thống</Title>
              <p>Quản lý hệ thống và cài đặt</p>
            </Card>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} lg={12}>
            <Card title="Hoạt động gần đây" style={{ height: '100%' }}>
              <p>Danh sách hoạt động gần đây sẽ được hiển thị ở đây...</p>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="Thống kê nhanh" style={{ height: '100%' }}>
              <p>Thống kê nhanh sẽ được hiển thị ở đây...</p>
            </Card>
          </Col>
        </Row>
      </div>
    </ManagerLayout>
  )
}

