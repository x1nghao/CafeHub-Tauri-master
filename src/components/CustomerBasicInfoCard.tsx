import React from 'react';
import { Card, Descriptions } from 'antd';
import { UserOutlined, CalendarOutlined, PhoneOutlined, ManOutlined, WomanOutlined } from '@ant-design/icons';
import type { Account } from '@/api/user'; // 或 '@/types';

interface CustomerBasicInfoCardProps {
  account: Account | null;
}

const renderGender = (gender?: number | null) => {
  if (gender === 0) return <><ManOutlined style={{ color: '#1890ff' }} /> 男</>;
  if (gender === 1) return <><WomanOutlined style={{ color: '#eb2f96' }} /> 女</>;
  return '未设置';
};

const CustomerBasicInfoCard: React.FC<CustomerBasicInfoCardProps> = ({ account }) => {
  if (!account) {
    return <Card bordered={false} title={<><UserOutlined /> 基本信息</>}><p>无法加载基本信息。</p></Card>;
  }

  return (
    <Card bordered={false} title={<><UserOutlined /> 基本信息</>}>
      <Descriptions column={1} bordered size="small">
        <Descriptions.Item label="用户名">{account.username}</Descriptions.Item>
        <Descriptions.Item label="手机号">
          {account.phone ? <><PhoneOutlined /> {account.phone}</> : '未设置'}
        </Descriptions.Item>
        <Descriptions.Item label="性别">
          {renderGender(account.gender)}
        </Descriptions.Item>
        <Descriptions.Item label="加入时间">
          {account.join_time ? <><CalendarOutlined /> {account.join_time}</> : 'N/A'}
        </Descriptions.Item>
      </Descriptions>
    </Card>
  );
};

export default CustomerBasicInfoCard;