import React from 'react';
import { TransactionOutlined, InboxOutlined, RestOutlined, MailOutlined, LogoutOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Menu } from 'antd';
import { Link } from 'react-router-dom';

type MenuItem = Required<MenuProps>['items'][number];

const items: MenuItem[] = [
  {
    key: '/customer/info', // 使用路径作为 key
    label: (
      <Link to="/customer/info">信息</Link>
    ),
    icon: <TransactionOutlined />,
  },
  {
    key: '/customer/product',
    label: (
      <Link to="/customer/product">商品</Link>
    ),
    icon: <RestOutlined />,
  },
  {
    key: '/customer/lost',
    label: (
      <Link to="/customer/lost">失物</Link>
    ),
    icon: <InboxOutlined />,
  },
  {
    key: '/customer/message',
    label: (
      <Link to="/customer/message">消息</Link>
    ),
    icon: <MailOutlined />,
  },
  {
    key: 'logout',
    label: (
      <Link to="/">退出</Link>
    ),
    icon: <LogoutOutlined />,
    onClick: () => {
      localStorage.removeItem('isAuthenticated'); // 清除登录状态
      localStorage.removeItem('loginAccount'); // 清除登录状态
    }
  }
];

const CustomerNavBar: React.FC = () => {

  return (
    <Menu
      mode="inline"
      items={items}
      defaultSelectedKeys={['/customer/info']} // 默认选中项
      style={{
        background: 'transparent',
        color: '#ffffff',
      }}
    />
  );
};

export default CustomerNavBar;