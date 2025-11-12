import React from 'react'
import { Card, Statistic, Row, Col, Typography } from 'antd'
import { ArrowUpOutlined, ArrowDownOutlined, ShoppingOutlined, ShopOutlined } from '@ant-design/icons'
import WarehouseLayout from '../../layouts/WarehouseLayout'

const { Title } = Typography

export default function WarehouseReport() {
  return (
    <WarehouseLayout>
      <div style={{ padding: '24px 0' }}>
        <Title level={2} style={{ marginBottom: 24 }}>Báo cáo kho</Title>
        
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="Tổng nhập kho"
                value={1128}
                prefix={<ArrowDownOutlined />}
                valueStyle={{ color: '#3f8600' }}
                suffix="phiếu"
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Tổng xuất kho"
                value={932}
                prefix={<ArrowUpOutlined />}
                valueStyle={{ color: '#cf1322' }}
                suffix="phiếu"
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Tổng linh kiện"
                value={5420}
                prefix={<ShoppingOutlined />}
                suffix="sản phẩm"
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Đang chờ xử lý"
                value={45}
                prefix={<ShopOutlined />}
                valueStyle={{ color: '#1890ff' }}
                suffix="yêu cầu"
              />
            </Card>
          </Col>
        </Row>

        <Card>
          <Title level={4}>Biểu đồ thống kê</Title>
          <p>Biểu đồ thống kê sẽ được tích hợp ở đây...</p>
        </Card>
      </div>
    </WarehouseLayout>
  )
}
