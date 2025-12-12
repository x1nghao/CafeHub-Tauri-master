import AdminNavBar from '@/components/AdminNavBar';
import WebTitle from '@/icon/WebTitle';
import { ConfigProvider, Layout } from 'antd'
import { Content } from 'antd/es/layout/layout';
import Sider from 'antd/es/layout/Sider';
import { useEffect, useState } from 'react'
import FadeInOutlet from '@/components/FadeInOutlet'
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
        components: {
          Layout: {
            siderBg: '#F5DEB3', // 更浅的渐变背景色
            triggerColor: '#5D4037', // 深棕色触发器
            triggerBg: '#F5DEB3', // 与侧边栏同色
          },
          Menu: {
            // 菜单项背景透明
            itemSelectedBg: '#8B4513', // 深色的菜单选中背景色
            itemSelectedColor: '#ffffff', // 菜单选中文字颜色
            itemHoverBg: '#D2691E', // 更浅的菜单悬停背景色
            itemColor: '#5D4037', // 默认文字颜色
            itemMarginBlock: 8,  // 调整菜单项间距
            itemBorderRadius: 8, // 圆角
          },

        },
      }}
    >
      <Layout className='min-h-screen'>
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={(value) => setCollapsed(value)}
          className='min-h-screen'
          width={240}
          collapsedWidth={80}
          style={{
            height: '100vh',
            position: 'fixed',
            left: 0,
            top: 0,
            zIndex: 100,
            overflowY: 'auto',
            boxShadow: '4px 0 10px rgba(0,0,0,0.1)', // 添加阴影增加层次感
            borderRight: '1px solid rgba(0,0,0,0.05)',
          }}
        >
          <div className='flex items-center justify-center py-6 border-b border-black/5 mb-2'>
            <WebTitle collapsed={collapsed} />
          </div>
          <div className="px-2">
            <AdminNavBar />
          </div>
        </Sider>
        <Content
          style={{
            marginLeft: collapsed ? '80px' : '240px',
            height: '100vh',
            overflowY: 'auto',
            background: '#F9F6F2',
            transition: 'margin-left 0.3s ease',
          }}
        >
          <div>
            <FadeInOutlet />
          </div>
        </Content>
      </Layout>
    </ConfigProvider>
  )
}

export default LayoutPage
