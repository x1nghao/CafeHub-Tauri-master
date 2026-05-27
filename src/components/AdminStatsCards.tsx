import React from 'react';
import { Card, Col, Row, Statistic } from 'antd';
import { UserOutlined } from '@ant-design/icons';

interface AdminStatsCardsProps {
  totalUsers: number | null;
  newUsersThisMonth: number | null;
}

const AdminStatsCards: React.FC<AdminStatsCardsProps> = ({ totalUsers, newUsersThisMonth }) => {
  return (
    <Row gutter={[16, 16]} justify="center">
      <Col xs={24} sm={12} md={10} lg={8} xl={6}>
        <Card bordered={false} style={{ textAlign: 'center' }}>
          <Statistic
            title="总用户数 (顾客)"
            value={totalUsers ?? 'N/A'}
            prefix={<UserOutlined />}
            valueStyle={{ color: '#3f8600' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={10} lg={8} xl={6}>
        <Card bordered={false} style={{ textAlign: 'center' }}>
          <Statistic
            title="本月新增用户 (顾客)"
            value={newUsersThisMonth ?? 'N/A'}
            prefix={<UserOutlined />}
            valueStyle={{ color: '#cf1322' }}
          />
        </Card>
      </Col>
    </Row>
  );
};

export default AdminStatsCards;