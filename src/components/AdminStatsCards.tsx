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
        <Card bordered={false} className="shadow-md hover:shadow-xl transition-shadow duration-300 rounded-xl overflow-hidden" style={{ textAlign: 'center', background: '#fffaf4' }}>
          <Statistic
            title={<span className="text-gray-600 font-medium">总用户数 (顾客)</span>}
            value={totalUsers ?? 'N/A'}
            prefix={<UserOutlined className="mr-2" style={{ color: '#6F4E37' }} />}
            valueStyle={{ color: '#6F4E37', fontWeight: 'bold', fontSize: '2rem' }}
          />
          <div className="h-1 w-full bg-gradient-to-r from-[#C4A484] to-[#6F4E37] mt-4 rounded-full opacity-30"></div>
        </Card>
      </Col>
      <Col xs={24} sm={12} md={10} lg={8} xl={6}>
        <Card bordered={false} className="shadow-md hover:shadow-xl transition-shadow duration-300 rounded-xl overflow-hidden" style={{ textAlign: 'center', background: '#fffaf4' }}>
          <Statistic
            title={<span className="text-gray-600 font-medium">本月新增用户 (顾客)</span>}
            value={newUsersThisMonth ?? 'N/A'}
            prefix={<UserOutlined className="mr-2" style={{ color: '#C4A484' }} />}
            valueStyle={{ color: '#C4A484', fontWeight: 'bold', fontSize: '2rem' }}
          />
          <div className="h-1 w-full bg-gradient-to-r from-[#C4A484] to-[#6F4E37] mt-4 rounded-full opacity-30"></div>
        </Card>
      </Col>
    </Row>
  );
};

export default AdminStatsCards;
