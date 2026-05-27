import CustomerLayout from '@/directory/CustomerLayout' // 主布局
import LoginPage from '@/directory/LoginPage' // 登录页
import AdminLostPage from '@/directory/AdminLostPage'
import AdminMessagePage from '@/directory/AdminMessagePage'
import AdminProductPage from '@/directory/AdminProductPage'
import RegisterPage from '@/directory/RegisterPage' // 注册页
import { createBrowserRouter } from 'react-router'
import AdminLayout from '@/directory/AdminLayout'
import CustomerLostPage from '@/directory/CustomerLostPage'
import CustomerMessagePage from '@/directory/CustomerMessagePage'
import CustomerProductPage from '@/directory/CustomerProductPage'
import AdminInfoPage from '@/directory/AdminInfoPage'
import CustomerInfoPage from '@/directory/CustomerInfoPage'


const router = createBrowserRouter([
  {
    path: '/',
    element: <LoginPage /> // 登录页面
  },
  {
    path: '/register',
    element: <RegisterPage />
  },
  {
    path: '/admin',
    element: <AdminLayout />, // 主布局，包含侧边栏
    children: [
      // --- 修改/添加子路由 ---
      {
        index: true, // 默认子路由
        element: <AdminInfoPage />
      },
      {
        path: '/admin/info', // 这个路径指向 CostPage，
        element: <AdminInfoPage />
      },
      {
        path: '/admin/lost',
        element: <AdminLostPage />
      },
      {
        path: '/admin/product',
        element: <AdminProductPage />
      },
      {
        path: '/admin/message',
        element: <AdminMessagePage />
      },
    ],
  },
  {
    path: '/customer',
    element: <CustomerLayout />, // 主布局，包含侧边栏
    children: [
      // --- 修改/添加子路由 ---
      {
        index: true, // 默认子路由
        element: <CustomerInfoPage />
      },
      {
        path: '/customer/info', // 这个路径指向 CostPage，
        element: <CustomerInfoPage />
      },
      {
        path: '/customer/lost',
        element: <CustomerLostPage />
      },
      {
        path: '/customer/product',
        element: <CustomerProductPage />
      },
      {
        path: '/customer/message',
        element: <CustomerMessagePage />
      }
    ]
  }
])

export default router