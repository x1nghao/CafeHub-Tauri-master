import CustomerNavBar from '@/components/CustomNavBar';
import WebTitle from '@/icon/WebTitle';
import { ConfigProvider, Layout } from 'antd';
import { Content } from 'antd/es/layout/layout';
import Sider from 'antd/es/layout/Sider';
import { useState } from 'react';
import { Outlet } from 'react-router';
/**
 * 左侧导航栏，中间部分设置各页面
 * 一级路由是LayoutPage，二级路由是各个页面
 * 
 */

const LayoutPage = () => {
  const [collapsed, setCollapsed] = useState(false);
  const siderWidth = collapsed ? 80 : 200; // Ant Design default Sider widths

  return (
    <ConfigProvider
      theme={{
        components: {
          Layout: {
            siderBg: '#F5DEB3', // 更浅的渐变背景色
            triggerColor: '#000000', // 浅色的触发器颜色
            triggerBg: 'transparent', // 透明的触发器背景色
          },
          Menu: {
            // 菜单项背景透明
            itemSelectedBg: '#8B4513', // 深色的菜单选中背景色
            itemSelectedColor: '#ffffff', // 菜单选中文字颜色
            itemHoverBg: '#D2691E', // 更浅的菜单悬停背景色
            itemMarginBlock: 30,  // 菜单项之间的间距
          },
        },
      }}
    >
      <Layout style={{ height: '100vh' }}>
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={(value) => setCollapsed(value)}
          width={200} // Explicit width
          collapsedWidth={80} // Explicit collapsed width
          style={{
            height: '100vh',
            position: 'fixed',
            left: 0,
            top: 0,
            zIndex: 100, // Ensure Sider is on top
            overflowY: 'auto', // Allow internal scrolling for Sider if menu is too long
            // The siderBg from theme should apply here
          }}
        >
          <div className='m-2 p-2 ml-5 rounded-lg'>
            <WebTitle collapsed={collapsed} />
          </div>
          <CustomerNavBar />
        </Sider>
        <Content
          style={{
            marginLeft: `${siderWidth}px`, // Offset content by Sider's width
            height: '100vh', // Content area takes full viewport height
            overflowY: 'auto', // Enable vertical scrolling for content area
            // Pages rendered by Outlet (like CustomerProductPage) will manage their own internal padding
          }}
        >
          <Outlet /> {/* 这里是二级路由的内容 */}
        </Content>
      </Layout>
    </ConfigProvider>
  );
};

export default LayoutPage;