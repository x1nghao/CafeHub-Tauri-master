// src/components/customer/CustomerConsumptionChart.tsx
import React from 'react';
import { Card, Typography } from 'antd';
import { LineChartOutlined } from '@ant-design/icons';
import { Line } from '@ant-design/charts';
import type { MonthlyConsumptionSummary } from '@/api/user'; // 或 '@/types';

interface CustomerConsumptionChartProps {
  data: MonthlyConsumptionSummary[];
}

const CustomerConsumptionChart: React.FC<CustomerConsumptionChartProps> = ({ data }) => {

  const lineConfig = {
    data: data,
    xField: 'month',
    yField: 'total_amount',
    height: 268, // 稍微调整高度以适应卡片
    point: { size: 5, shape: 'diamond' as const },
    tooltip: {
      title:
        { field: 'month', valueFormatter: (month: string) => { return `当前月份：${month}` } },
      items: [
        { name: '总消费额', field: 'total_amount', valueFormatter: (total_amount: number) => { return `￥${total_amount}` } }
      ]
    },
    yAxis: {
      label: {
        formatter: (v: string) => `¥${Number(v).toFixed(2)}`,
      },
    },
    meta: {
      month: { alias: '月份' },
      total_amount: { alias: '月消费额', formatter: (v: number) => `¥${Number(v).toFixed(2)}` },
    },
  };

  return (
    <Card title={<><LineChartOutlined /> 我的月度消费</>}>
      {data && data.length > 0 ? (
        <Line {...lineConfig} />
      ) : (
        <Typography.Text style={{ display: 'block', textAlign: 'center', padding: '20px' }}>
          暂无消费记录
        </Typography.Text>
      )}
    </Card>
  );
};

export default CustomerConsumptionChart;