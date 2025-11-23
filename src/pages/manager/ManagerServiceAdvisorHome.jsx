import React from 'react'
import { Card, Row, Col, Statistic, Typography } from 'antd'
import { CalendarOutlined, FileTextOutlined, DollarOutlined, UserOutlined } from '@ant-design/icons'
import ManagerLayout from '../../layouts/ManagerLayout'

const { Title } = Typography

export default function ManagerServiceAdvisorHome() {
  return (
    <ManagerLayout>
      <div style={{ padding: '24px 0' }}>
        <Title level={2} style={{ marginBottom: 24 }}>Service Advisor - Dashboard</Title>
        
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="Lịch hẹn hôm nay"
                value={12}
                prefix={<CalendarOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Phiếu dịch vụ"
                value={45}
                prefix={<FileTextOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Doanh thu tháng"
                value={125000000}
                prefix={<DollarOutlined />}
                suffix="VND"
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Khách hàng"
                value={328}
                prefix={<UserOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
        </Row>

        <Card>
          <Title level={4}>Hoạt động gần đây</Title>
          <p>Thống kê và biểu đồ sẽ được tích hợp ở đây...</p>
        </Card>
      </div>
    </ManagerLayout>
  )
}

