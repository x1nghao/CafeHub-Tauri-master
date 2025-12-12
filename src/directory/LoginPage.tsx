// LoginPage.tsx (修正版 - 包含背景图和新的登录逻辑)
import { useNavigate } from "react-router-dom";
import { Button, Input, Tooltip, message } from "antd";
import { EyeInvisibleOutlined, EyeTwoTone, InfoCircleOutlined, KeyOutlined, UserOutlined, SettingOutlined } from "@ant-design/icons";
import bg from "@/assets/login.png"; // ****** 1. 确保导入背景图片 ******
import { useState } from "react";
import { login } from "@/api/user";
import type { Account } from "@/api/user";

const LoginPage = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [messageApi, contextHolder] = message.useMessage();

  const handleLogin = async () => {
    try {
      const account: Account | null = await login(username, password);

      if (account) {
        messageApi.open({
          type: 'success',
          content: '登录成功',
          duration: 2,
        });
        localStorage.setItem('loginAccount', JSON.stringify(account));
        localStorage.setItem('isAuthenticated', 'true');
        if (account.user_type === 0) {
          navigate('/admin');
        } else if (account.user_type === 1) {
          navigate('/customer');
        } else {
          console.error("Unknown user type:", account.user_type);
          messageApi.open({
            type: 'error',
            content: '未知的用户类型',
            duration: 2,
          });
        }
      } else {
        console.error('登录失败 (API返回null或发生错误)');
        messageApi.open({
          type: 'error',
          content: '账号或密码错误，或登录服务暂时不可用',
          duration: 2,
        });
        localStorage.removeItem('loginAccount');
        localStorage.removeItem('isAuthenticated');
      }
    } catch (error) {
      console.error('登录流程中发生意外错误:', error);
      messageApi.open({
        type: 'error',
        content: '登录失败，请稍后再试',
        duration: 2,
      });
      localStorage.removeItem('loginAccount');
      localStorage.removeItem('isAuthenticated');
    }
  };

  const onChangeUsername = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
  };
  const onChangePassword = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  return (
    // ****** 2. 确保 style 属性和其中的 backgroundImage 设置被正确应用 ******
    <div className="flex flex-row min-h-screen" style={{
      backgroundImage: `url(${bg})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
    }}>
      <div className="absolute inset-0 bg-[#2b1e16]/40 backdrop-blur-sm" />
      <div className="relative z-10 flex justify-center items-center w-full min-h-screen">
        <div className="flex flex-col items-center bg-[#fffaf4]/90 backdrop-blur-md p-10 rounded-2xl shadow-2xl w-96 transition-all duration-300 hover:shadow-[0_12px_36px_rgba(111,78,55,0.25)] relative">
          <div className="absolute top-4 right-4">
            <Tooltip title="数据库配置">
              <SettingOutlined onClick={() => navigate('/db-config')} className="text-gray-400 hover:text-[#6F4E37] text-xl cursor-pointer" />
            </Tooltip>
          </div>
          <div className="text-4xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-[#6F4E37] to-[#C4A484]" style={{ fontFamily: 'STCaiyun, 华文彩云' }}>萃豆馆</div>
          <div className="w-full space-y-6">
            <Input
              size="large"
              placeholder="用户名"
              prefix={<UserOutlined className="text-[#6F4E37]" />}
              suffix={
                <Tooltip title="请输入您的用户名">
                  <InfoCircleOutlined className="text-gray-400 hover:text-[#6F4E37] transition-colors" />
                </Tooltip>
              }
              onChange={onChangeUsername}
              className="rounded-lg hover:border-[#C4A484] focus:border-[#6F4E37]"
            />
            <Input.Password
              size="large"
              placeholder="密码"
              prefix={<KeyOutlined className="text-[#6F4E37]" />}
              iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
              className="rounded-lg hover:border-[#C4A484] focus:border-[#6F4E37]"
              onChange={onChangePassword}
            />
            {contextHolder}
            <div className="flex flex-col gap-4 mt-4">
              <Button 
                type="primary" 
                size="large" 
                onClick={handleLogin} 
                className="w-full h-12 text-lg font-medium rounded-lg bg-gradient-to-r from-[#6F4E37] to-[#C4A484] border-none hover:opacity-90 shadow-lg"
              >
                登录
              </Button>
              <div className="flex justify-center text-gray-500 text-sm">
                还没有账号？ 
                <span 
                  onClick={() => navigate('/register')} 
                  className="text-[#6F4E37] cursor-pointer ml-1 hover:underline font-medium"
                >
                  立即注册
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
