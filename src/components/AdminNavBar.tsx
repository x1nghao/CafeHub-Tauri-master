import React from 'react';
import { TransactionOutlined, InboxOutlined, RestOutlined, MailOutlined, LogoutOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Menu } from 'antd';
import { Link } from 'react-router-dom';

type MenuItem = Required<MenuProps>['items'][number];

const items: MenuItem[] = [
  {
    key: '/admin/info', // 使用路径作为 key
    label: (
      <Link to="/admin/info">信息</Link>
    ),
    icon: <TransactionOutlined />,
  },
  {
    key: '/admin/product',
    label: (
      <Link to="/admin/product">商品</Link>
    ),
    icon: <RestOutlined />,
  },
  {
    key: '/admin/lost',
    label: (
      <Link to="/admin/lost">失物</Link>
    ),
    icon: <InboxOutlined />,
  },
  {
    key: '/admin/message',
    label: (
      <Link to="/admin/message">消息</Link>
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

const NavBar: React.FC = () => {

  return (
    <Menu
      mode="inline"
      items={items}
      defaultSelectedKeys={['/admin/info']} // 默认选中项
      style={{
        background: 'transparent',
        color: '#ffffff',
      }}
    />
  );
};

export default NavBar;