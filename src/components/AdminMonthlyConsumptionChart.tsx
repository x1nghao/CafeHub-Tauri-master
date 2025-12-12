import React from 'react';
import { Card, Typography } from 'antd';
import { LineChartOutlined } from '@ant-design/icons';
import { Line } from '@ant-design/charts';
import type { MonthlyConsumptionSummary } from '@/api/user'; // 或 '@/types';

interface AdminMonthlyConsumptionChartProps {
  data: MonthlyConsumptionSummary[];
}

const AdminMonthlyConsumptionChart: React.FC<AdminMonthlyConsumptionChartProps> = ({ data }) => {
  const lineConfig = {
    data: data,
    xField: 'month',
    yField: 'total_amount',
    height: 300,
    point: { size: 5, shape: 'diamond' as const }, // as const 用于确保类型正确
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
      total_amount: { alias: '总消费额', formatter: (v: number) => `¥${v.toFixed(2)}` },
    }
  };

  return (
    <Card title={<><LineChartOutlined /> 月度消费总额趋势</>}>
      {data.length > 0 ? <Line {...lineConfig} /> : <Typography.Text style={{ display: 'block', textAlign: 'center', padding: '20px' }}>暂无月度消费数据</Typography.Text>}
    </Card>
  );
};

export default AdminMonthlyConsumptionChart;