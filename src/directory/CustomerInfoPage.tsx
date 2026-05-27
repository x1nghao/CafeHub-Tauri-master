// src/directory/CustomerInfoPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Col, Row, Typography, Spin, Alert, Button, Space, Divider } from 'antd'; // 添加 Button, Space, Divider
import CustomerBasicInfoCard from '@/components/CustomerBasicInfoCard';
import CustomerBalanceCard from '@/components/CustomerBalanceCard';
import CustomerConsumptionChart from '@/components/CustomerConsumptionChart';
import CustomerRechargeCard from '@/components/CustomerRechargeCard';
import CustomerEditProfileModal from '@/components/CustomerEditProfileModal'; // 引入新组件
import CustomerChangePasswordModal from '@/components/CustomerChangePasswordModal'; // 引入新组件
import type { Account, MonthlyConsumptionSummary } from '@/api/user';
import { getUserDetails, getUserMonthlyConsumption } from '@/api/info'; // <-- 引入新的 API 函数

const { Title } = Typography;

const CustomerInfoPage: React.FC = () => {
  const [account, setAccount] = useState<Account | null>(null);
  const [monthlyConsumption, setMonthlyConsumption] = useState<MonthlyConsumptionSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [isEditProfileModalVisible, setIsEditProfileModalVisible] = useState(false);
  const [isChangePasswordModalVisible, setIsChangePasswordModalVisible] = useState(false);

  const fetchCustomerData = useCallback(async (showLoadingSpinner = true) => {
    if (showLoadingSpinner) {
      setLoading(true);
    }
    setError(null);
    try {
      const storedAccountString = localStorage.getItem('loginAccount');
      if (!storedAccountString) {
        throw new Error("用户登录信息未找到，请重新登录。");
      }
      const loggedInAccount: Account = JSON.parse(storedAccountString);
      const userId = loggedInAccount.id;

      if (!userId) {
        throw new Error("无法获取用户ID。");
      }

      const [detailsData, consumptionData] = await Promise.all([
        getUserDetails(userId), // <-- 使用新的 API 函数
        getUserMonthlyConsumption(userId) // <-- 使用新的 API 函数
      ]);

      setAccount(detailsData);
      setMonthlyConsumption(consumptionData); // 后端已处理 Number 转换

    } catch (err) {
      console.error("获取用户信息失败 (CustomerInfoPage fetchData):", err);
      if (err instanceof Error) {
        setError(`加载用户信息失败: ${err.message}`);
      } else if (typeof err === 'string') {
        setError(`加载用户信息失败: ${err}`);
      } else {
        setError("加载用户信息失败，发生未知错误。");
      }
    } finally {
      if (showLoadingSpinner) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchCustomerData();
  }, [fetchCustomerData]);

  const handleRechargeSuccess = async () => { // 移除了 estimatedNewBalance 参数
    await fetchCustomerData(false); // 充值成功后重新获取数据
  };

  const handleProfileUpdateSuccess = () => {
    fetchCustomerData(false); // 个人资料更新成功后重新获取数据
  };

  if (loading) {
    // ... (loading state UI)
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}><Spin size="large" /></div>;
  }

  if (error) {
    // ... (error state UI)
    return (
      <div style={{ padding: '24px' }}>
        <Alert message="错误" description={error} type="error" showIcon />
      </div>
    );
  }

  if (!account) {
    // ... (no account state UI)
    return (
      <div style={{ padding: '24px' }}>
        <Alert message="提示" description="无法加载账户信息，可能需要重新登录。" type="warning" showIcon />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', background: '#f0f2f5', minHeight: 'calc(100vh - 64px)' }}>
      <Title level={2} style={{ marginBottom: '24px', textAlign: 'center' }}>我的信息</Title>

      {/* 操作按钮区域 */}
      <Space style={{ marginBottom: '24px' }}>
        <Button onClick={() => setIsEditProfileModalVisible(true)}>修改资料</Button>
        <Button onClick={() => setIsChangePasswordModalVisible(true)}>修改密码</Button>
      </Space>
      <Divider />

      <Row gutter={[16, 24]}>
        <Col xs={24} md={12}>
          <CustomerBasicInfoCard account={account} />
          <CustomerRechargeCard
            userId={account.id}
            currentBalance={account.balance}
            onRechargeSuccess={handleRechargeSuccess}
          />
        </Col>
        <Col xs={24} md={12}>
          <CustomerBalanceCard balance={account?.balance} />
          <CustomerConsumptionChart data={monthlyConsumption} />
        </Col>
      </Row>

      {/* 弹窗组件 */}
      <CustomerEditProfileModal
        visible={isEditProfileModalVisible}
        onCancel={() => setIsEditProfileModalVisible(false)}
        onProfileUpdateSuccess={() => {
          setIsEditProfileModalVisible(false);
          handleProfileUpdateSuccess();
        }}
        currentUser={account}
      />
      <CustomerChangePasswordModal
        visible={isChangePasswordModalVisible}
        onCancel={() => setIsChangePasswordModalVisible(false)}
        userId={account.id}
      />
    </div>
  );
};

export default CustomerInfoPage;