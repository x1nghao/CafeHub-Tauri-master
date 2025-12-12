import CustomerNavBar from '@/components/CustomNavBar';
import WebTitle from '@/icon/WebTitle';
import { ConfigProvider, Layout } from 'antd';
import { Content } from 'antd/es/layout/layout';
import Sider from 'antd/es/layout/Sider';
import { useEffect, useState } from 'react';
import FadeInOutlet from '@/components/FadeInOutlet';
/**
 * 左侧导航栏，中间部分设置各页面
 * 一级路由是LayoutPage，二级路由是各个页面
 * 
 */

const LayoutPage = () => {
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    const onResize = () => {
      setCollapsed(window.innerWidth < 768);
    };
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <ConfigProvider
      theme={{
        token: {
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
          colorText: '#4A4A4A',
        },
        components: {
          Layout: {
            siderBg: '#F3E5D8', // 温暖的咖啡米色背景
            triggerColor: '#6F4E37', // 深咖啡色触发器
            triggerBg: '#EEDCC6', // 略深一点的米色
          },
          Menu: {
            itemSelectedBg: '#6F4E37', // 深咖啡色选中背景
            itemSelectedColor: '#ffffff', // 白色选中文字
            itemHoverBg: '#DCC3A6', // 悬停时的浅咖啡色
            itemColor: '#5D4037', // 默认深咖啡色文字
            itemMarginBlock: 8,
            itemBorderRadius: 8,
            fontSize: 15,
          },
        },
      }}
    >
      <Layout style={{ height: '100vh' }}>
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={(value) => setCollapsed(value)}
          width={260} // 略微加宽侧边栏
          collapsedWidth={80}
          style={{
            height: '100vh',
            position: 'fixed',
            left: 0,
            top: 0,
            zIndex: 100,
            overflowY: 'auto',
            boxShadow: '4px 0 15px rgba(111, 78, 55, 0.1)', // 柔和的咖啡色阴影
            borderRight: '1px solid rgba(111, 78, 55, 0.05)',
          }}
          theme="light" // Explicitly set theme to light to work well with custom colors
        >
          <div className='flex items-center justify-center py-8 mb-4 transition-all duration-300'>
            <WebTitle collapsed={collapsed} />
          </div>
          <div className="px-4">
            <CustomerNavBar />
          </div>
        </Sider>
        <Content
          style={{
            marginLeft: collapsed ? '80px' : '260px',
            height: '100vh',
            overflowY: 'auto',
            background: '#F9F6F2',
            transition: 'all 0.3s ease',
            padding: '0',
          }}
        >
          <div className="min-h-full">
             <FadeInOutlet />
          </div>
        </Content>
      </Layout>
    </ConfigProvider>
  );
};

export default LayoutPage;
