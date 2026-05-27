import React, { useEffect, useState } from 'react'
import bg from "@/assets/login.png"
import { Button, Input, message, Select, Tooltip } from 'antd'
import { EyeInvisibleOutlined, EyeTwoTone, InfoCircleOutlined, KeyOutlined, PhoneOutlined, UserOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { register } from '@/api/user'

const RegisterPage = () => {
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [gendedr, setGendedr] = useState(0)
  const [phoneStatus, setPhoneStatus] = useState(true)
  const [messageApi, contextHolder] = message.useMessage();

  const onChangeUsername = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value)
  }
  const onChangePassword = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value)
  }
  const onChangePhone = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(e.target.value)
  }
  const onChangeGender = (value: number) => {
    setGendedr(value)
  }

  const handleRegister = async () => {
    try {
      // 调用注册接口
      let account = await register(username, password, phone, gendedr);
      messageApi.open({
        type: 'success',
        content: '注册成功',
        duration: 2,
      });
      localStorage.setItem('loginAccount', JSON.stringify(account));
      localStorage.setItem('isAuthenticated', 'true');
      if (account != null && account.user_type === 1) {
        navigate('/customer');
      }
    } catch (error) {
      console.error('注册接口调用失败', error);
      messageApi.open({
        type: 'error',
        content: '注册失败，请稍后再试',
        duration: 2,
      });
    }
  }

  useEffect(() => {
    const isNumeric = /^\d+$/.test(phone);
    if (phone.length <= 11 && isNumeric) {
      setPhoneStatus(false)
    } else {
      setPhoneStatus(true)
    }
  }, [phone])

  return (
    <div className="flex flex-row min-h-screen" style={{
      backgroundImage: `url(${bg})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      backgroundColor: "rgba(255, 255, 255, 0.5)", // Add a white overlay
      backgroundBlendMode: "lighten" // Blend the overlay with the image
    }}>
      <div className=" flex justify-center items-center w-full">
        <div className="flex flex-col items-center bg-opacity-90 p-8 rounded w-2/5">
          <div className="text-4xl font-bold " style={{ fontFamily: 'STCaiyun, 华文彩云' }} >欢迎来到萃豆馆</div>
          <Input
            placeholder="用户名"
            prefix={<UserOutlined style={{ color: 'rgba(0,0,0,.50)' }} />}
            suffix={
              <Tooltip title="请输入用户名">
                <InfoCircleOutlined style={{ color: 'rgba(0,0,0,.45)' }} />
              </Tooltip>
            }
            onChange={onChangeUsername}
            className="my-4"
          />
          <Input.Password
            placeholder="密码"
            prefix={<KeyOutlined style={{ color: 'rgba(0,0,0,.50)' }} />}
            iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
            className="my-4"
            onChange={onChangePassword}
          />
          <Input
            placeholder="手机号"
            prefix={<PhoneOutlined style={{ color: 'rgba(0,0,0,.50)' }} />}
            suffix={
              <Tooltip title="11位手机号">
                <InfoCircleOutlined style={{ color: 'rgba(0,0,0,.45)' }} />
              </Tooltip>
            }
            maxLength={11}
            onChange={onChangePhone}
            status={phoneStatus ? 'error' : ''}
            className="my-4"
          />
          <div className='w-full flex justify-center my-4'>
            <Select
              onChange={onChangeGender}
              options={[
                { value: 0, label: '男' },
                { value: 1, label: '女' }
              ]}
              className='w-full'
              placeholder="性别"
            />
          </div>
          <div className='w-full flex my-4 justify-between'>
            {contextHolder}
            <Button type="link" onClick={() => navigate('/')}>返回登录</Button>
            <Button type="primary" onClick={handleRegister}>注册</Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage