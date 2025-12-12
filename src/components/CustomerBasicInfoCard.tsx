import React from 'react';
import { Card } from 'antd';
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
    return <Card bordered={false} className="shadow-sm rounded-lg" title={<><UserOutlined className="mr-2" /> 基本信息</>}><p className="text-gray-500">无法加载基本信息。</p></Card>;
  }

  return (
    <Card 
      bordered={false} 
      className="shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl overflow-hidden bg-white"
      title={
        <div className="flex items-center text-lg font-bold text-gray-800 py-2">
          <UserOutlined className="mr-3 text-gray-400 text-xl" /> 基本信息
        </div>
      }
      headStyle={{ borderBottom: '1px solid #F3F4F6', padding: '0 24px' }}
      bodyStyle={{ padding: '24px' }}
    >
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between group">
          <span className="text-gray-500 font-medium">用户名：</span>
          <span className="text-lg font-bold text-gray-800 group-hover:text-[#6F4E37] transition-colors">{account.username}</span>
        </div>
        
        <div className="flex items-center justify-between group">
          <span className="text-gray-500 font-medium">手机号：</span>
          <div className="flex items-center">
             {account.phone ? (
               <>
                 <PhoneOutlined className="mr-2 text-gray-400 group-hover:text-[#6F4E37] transition-colors" />
                 <span className="text-lg font-medium text-gray-800">{account.phone}</span>
               </>
             ) : <span className="text-gray-400 italic">未设置</span>}
          </div>
        </div>

        <div className="flex items-center justify-between group">
          <span className="text-gray-500 font-medium">性别：</span>
          <div className="text-lg font-medium text-gray-800">
            {renderGender(account.gender)}
          </div>
        </div>

        <div className="flex items-center justify-between group">
          <span className="text-gray-500 font-medium">加入时间：</span>
          <div className="flex items-center">
            {account.join_time ? (
              <>
                <CalendarOutlined className="mr-2 text-gray-400 group-hover:text-[#6F4E37] transition-colors" />
                <span className="text-lg font-medium text-gray-800">{account.join_time}</span>
              </>
            ) : 'N/A'}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default CustomerBasicInfoCard;