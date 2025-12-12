import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from 'react-router'
import router from "@/router";
import '@/App.css'
import '@ant-design/v5-patch-for-react-19';
import { ConfigProvider } from 'antd';

// remember the naming convention camelcase, it always started with variable in lowercase, next word with capital
// app.tsx deprecated, bcs of the main is not currently being used as the main container for all the apps
// it is said that the convention of making router like this is more convenient than the one we used to make
// that is to use the browser router

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#6F4E37',
          colorBgBase: '#F9F6F2',
          colorText: '#3f3a34',
          borderRadius: 12,
          fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
        },
        components: {
          Layout: {
            siderBg: '#F3E5D8',
            triggerBg: '#EEDCC6',
            triggerColor: '#6F4E37',
          },
          Card: {
            boxShadowTertiary: '0 8px 24px rgba(111, 78, 55, 0.12)'
          },
          Menu: {
            itemSelectedBg: '#6F4E37',
            itemSelectedColor: '#ffffff',
            itemHoverBg: '#C4A484',
            itemColor: '#5D4037',
            itemBorderRadius: 8,
            itemMarginBlock: 8,
          },
          Button: {
            colorPrimaryHover: '#5b412f',
            colorPrimaryActive: '#513a2a',
            borderRadius: 10,
          },
        }
      }}
    >
      <RouterProvider router={router} />
    </ConfigProvider>
  </React.StrictMode>,
);
