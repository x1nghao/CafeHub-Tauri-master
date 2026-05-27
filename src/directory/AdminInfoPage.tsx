// src/directory/AdminInfoPage.tsx
import React, { useState, useEffect } from 'react';
import { Col, Row, Typography, Spin } from 'antd';
import AdminStatsCards from '@/components/AdminStatsCards';
import AdminMonthlyConsumptionChart from '@/components/AdminMonthlyConsumptionChart';
import AdminGoodsShareChart from '@/components/AdminGoodsShareChart';
import type { MonthlyConsumptionSummary, GoodsConsumptionShare } from '@/api/user';
import {
  getTotalUsers,
  getNewUsersThisMonth,
  getAdminMonthlyConsumptionSummary,
  getGoodsConsumptionShareCurrentMonth
} from '@/api/info';

const { Title } = Typography;

const AdminInfoPage: React.FC = () => {
  const [totalUsers, setTotalUsers] = useState<number | null>(null);
  const [newUsersThisMonth, setNewUsersThisMonth] = useState<number | null>(null);
  const [monthlyConsumption, setMonthlyConsumption] = useState<MonthlyConsumptionSummary[]>([]);
  const [goodsShare, setGoodsShare] = useState<GoodsConsumptionShare[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const totalUsersData = await getTotalUsers();
        setTotalUsers(totalUsersData);

        const newUsersData = await getNewUsersThisMonth();
        setNewUsersThisMonth(newUsersData);

        const monthlyConsumptionData = await getAdminMonthlyConsumptionSummary();
        setMonthlyConsumption(monthlyConsumptionData);

        const goodsShareData = await getGoodsConsumptionShareCurrentMonth();
        setGoodsShare(goodsShareData);

      } catch (err) {
        console.error("Error in AdminInfoPage fetchData:", err);
        if (err instanceof Error) {
          setError(`加载管理信息失败: ${err.message}`);
        } else if (typeof err === 'string') {
          setError(`加载管理信息失败: ${err}`);
        } else {
          setError("加载管理信息失败，发生未知错误。");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}><Spin size="large" /></div>;
  }

  if (error) {
    console.error("AdminInfoPage rendering error state:", error);
    return <div style={{ textAlign: 'center', marginTop: '50px', color: 'red' }}>{error}</div>;
  }

  return (
    <div style={{ padding: '24px', background: '#f0f2f5', minHeight: 'calc(100vh - 64px)' }}>
      <Title level={2} style={{ marginBottom: '24px', textAlign: 'center' }}>管理信息概览</Title>

      <AdminStatsCards totalUsers={totalUsers} newUsersThisMonth={newUsersThisMonth} />

      <Row gutter={[16, 16]} style={{ marginTop: '32px' }}>
        <Col xs={24} lg={12}>
          <AdminMonthlyConsumptionChart data={monthlyConsumption} />
        </Col>
        <Col xs={24} lg={12}>
          <AdminGoodsShareChart data={goodsShare} />
        </Col>
      </Row>
    </div>
  );
};

export default AdminInfoPage;