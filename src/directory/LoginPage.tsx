// LoginPage.tsx (修正版 - 包含背景图和新的登录逻辑)
import { useNavigate } from "react-router-dom";
import { Button, Input, Tooltip, message } from "antd";
import { EyeInvisibleOutlined, EyeTwoTone, InfoCircleOutlined, KeyOutlined, UserOutlined } from "@ant-design/icons";
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
      backgroundColor: "rgba(255, 255, 255, 0.5)",
      backgroundBlendMode: "lighten"
    }}>
      <div className=" flex justify-center items-center w-full">
        <div className="flex flex-col items-center bg-opacity-90 p-8 rounded w-2/5">
          <div className="text-4xl font-bold " style={{ fontFamily: 'STCaiyun, 华文彩云' }} >欢迎来到萃豆馆</div>
          <Input
            placeholder="用户名"
            prefix={<UserOutlined style={{ color: 'rgba(0,0,0,.25)' }} />}
            suffix={
              <Tooltip title="请输入您的用户名">
                <InfoCircleOutlined style={{ color: 'rgba(0,0,0,.45)' }} />
              </Tooltip>
            }
            onChange={onChangeUsername}
            className="my-4"
          />
          <Input.Password
            placeholder="密码"
            prefix={<KeyOutlined style={{ color: 'rgba(0,0,0,.25)' }} />}
            iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
            className="my-4"
            onChange={onChangePassword}
          />
          {contextHolder}
          <div className="flex justify-between w-full mt-2">
            <Button type="primary" onClick={handleLogin}>登录</Button>
            <Button onClick={() => navigate('/register')}>注册</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;