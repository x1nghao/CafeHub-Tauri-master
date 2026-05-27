// src/components/customer/CustomerBalanceCard.tsx
import React from 'react';
import { Card, Statistic } from 'antd';
import { WalletOutlined } from '@ant-design/icons';

interface CustomerBalanceCardProps {
  balance: number | null | undefined;
}

const CustomerBalanceCard: React.FC<CustomerBalanceCardProps> = ({ balance }) => {
  return (
    <Card bordered={false} style={{ marginBottom: '16px' }}>
      <Statistic
        title="账户余额"
        value={balance !== null && balance !== undefined ? balance : 0}
        precision={2}
        prefix={<WalletOutlined />}
        suffix="元"
        valueStyle={{ color: '#3f8600' }}
      />
    </Card>
  );
};

export default CustomerBalanceCard;