// src/components/customer/CustomerRechargeCard.tsx
import React, { useState } from 'react';
import { Card, InputNumber, Button, Form, message, Typography } from 'antd';
import { PropertySafetyOutlined, DollarCircleOutlined } from '@ant-design/icons';
import { invoke } from '@tauri-apps/api/core';

// 如果 Account 类型也包含 balance，可以复用，否则定义一个简单类型
// interface AccountForBalance {
//   balance?: number | string | null;
// }

interface CustomerRechargeCardProps {
  userId: number | null;
  currentBalance: number | string | null | undefined; // 明确它可能从父组件传来的是字符串
  onRechargeSuccess: (estimatedNewBalance: number) => void;
}

const CustomerRechargeCard: React.FC<CustomerRechargeCardProps> = ({ userId, currentBalance, onRechargeSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleRecharge = async (values: { amount: number }) => {
    if (!userId) {
      message.error('用户ID无效，无法充值！请重新登录。');
      return;
    }
    if (values.amount <= 0) {
      message.error('充值金额必须大于0！');
      return;
    }

    setLoading(true);
    try {
      // 1. 构建直接传递给 Rust RechargeBalanceData 结构的数据
      const rechargeDataForRust = {
        user_id: userId,       // 确保字段名与 Rust 结构体中的 user_id 匹配 (snake_case)
        amount: values.amount, // 字段名 amount 与 Rust 结构体匹配
      };

      // 2. 构建传递给 invoke 的 payload，其顶层键名 'data' 对应 Rust 函数的参数名
      const payloadForInvoke = {
        data: rechargeDataForRust
      };

      // 调用后端的 recharge_balance 命令
      const resultMessage = await invoke<string>('recharge_balance', payloadForInvoke);

      message.success(resultMessage || '充值成功！');
      form.resetFields(); // 清空表单

      // 更新余额的逻辑：
      // 将 currentBalance 安全地转换为数字
      const numericCurrentBalance = (currentBalance === null || currentBalance === undefined || currentBalance === '')
        ? 0
        : Number(currentBalance);

      if (isNaN(numericCurrentBalance)) {
        console.warn("Current balance was NaN after conversion. Using 0 for new balance calculation.");
        onRechargeSuccess(values.amount); // 如果当前余额无效，则新余额就是充值金额
      } else {
        onRechargeSuccess(numericCurrentBalance + values.amount);
      }

    } catch (error: any) {
      console.error('充值失败 (CustomerRechargeCard):', error);
      const errorMessage = typeof error === 'string' ? error : (error?.message || '充值操作失败，请稍后再试。');
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 安全地将 currentBalance 转换为数字用于显示，如果无效则显示 0.00
  const displayBalanceValue = (currentBalance === null || currentBalance === undefined || currentBalance === '')
    ? 0
    : Number(currentBalance);
  const formattedDisplayBalance = isNaN(displayBalanceValue) ? '0.00' : displayBalanceValue.toFixed(2);


  return (
    <Card 
      bordered={false} 
      title={
        <div className="flex items-center text-lg font-bold text-gray-800 py-2">
          <DollarCircleOutlined className="mr-3 text-gray-400 text-xl" /> 账户充值
        </div>
      }
      className="shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl overflow-hidden bg-white mt-6"
      headStyle={{ borderBottom: '1px solid #F3F4F6', padding: '0 24px' }}
      bodyStyle={{ padding: '24px' }}
    >
      <Form form={form} layout="vertical" onFinish={handleRecharge}>
        <Form.Item
          name="amount"
          label={<span className="font-medium text-gray-600 text-base">充值金额 (元) <span className="text-red-500">*</span></span>}
          rules={[
            { required: true, message: '请输入充值金额!' },
            { type: 'number', min: 0.01, message: '充值金额必须大于0.00!' } 
          ]}
          className="mb-6"
        >
          <InputNumber
            style={{ width: '100%' }}
            min={0.01}
            precision={2} 
            placeholder="请输入充值金额，例如: 100.00"
            prefix={<span className="text-gray-400">¥</span>}
            size="large"
            className="rounded-lg py-1 text-lg border-gray-300 hover:border-[#6F4E37] focus:border-[#6F4E37]"
          />
        </Form.Item>
        <Form.Item style={{ marginBottom: 0 }}>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            icon={<PropertySafetyOutlined />}
            block
            size="large"
            className="h-12 bg-[#6F4E37] border-none hover:!bg-[#8B5A2B] shadow-md shadow-[#6F4E37]/20 rounded-xl font-bold text-lg transition-all duration-300"
          >
            确认充值
          </Button>
        </Form.Item>
      </Form>
      {/* 显示当前余额 */}
      {(currentBalance !== null && currentBalance !== undefined) && (
        <div className="mt-6 pt-4 border-t border-gray-100 text-center">
          <Typography.Text type="secondary" className="text-gray-500 text-sm">
            当前余额：<span className="font-bold text-gray-800 text-base">¥{formattedDisplayBalance}</span>
          </Typography.Text>
        </div>
      )}
    </Card>
  );
};

export default CustomerRechargeCard;