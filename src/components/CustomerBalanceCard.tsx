// src/components/customer/CustomerBalanceCard.tsx
import React from 'react';
import { Card } from 'antd';
import { WalletOutlined } from '@ant-design/icons';

interface CustomerBalanceCardProps {
  balance: number | null | undefined;
}

const CustomerBalanceCard: React.FC<CustomerBalanceCardProps> = ({ balance }) => {
  return (
    <Card 
      bordered={false} 
      className="shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl overflow-hidden bg-white"
    >
      <div className="flex flex-col h-full justify-between p-2">
        <div className="flex items-start justify-between">
          <div className="flex flex-col">
            <div className="flex items-center text-gray-500 font-medium mb-1">
              <WalletOutlined className="text-[#3BAF4A] mr-2 text-xl" />
              <span>账户余额</span>
            </div>
            <div className="mt-4 flex items-baseline">
              <span className="text-5xl font-bold text-[#3BAF4A] tracking-tight">
                {balance !== null && balance !== undefined ? Number(balance).toFixed(2) : '0.00'}
              </span>
              <span className="text-xl text-gray-400 ml-2 font-medium">元</span>
            </div>
          </div>
          <div className="hidden sm:flex p-4 bg-[#E8F5E9] rounded-full">
            <WalletOutlined className="text-3xl text-[#3BAF4A]" />
          </div>
        </div>
        
        <div className="w-full bg-[#E8F5E9] h-2 rounded-full mt-8 overflow-hidden">
           <div className="bg-[#3BAF4A] h-full rounded-full w-2/3 opacity-80" />
        </div>
      </div>
    </Card>
  );
};

export default CustomerBalanceCard;