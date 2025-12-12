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
    height: 300,
    smooth: true, // 平滑曲线
    point: { 
      size: 5, 
      shape: 'circle',
      style: {
        fill: '#fff',
        stroke: '#1890ff',
        lineWidth: 2,
      },
    },
    tooltip: {
      showMarkers: true,
      domStyles: {
        'g2-tooltip': {
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          padding: '12px',
        },
      },
      title: 'month',
      items: [
        { channel: 'y', valueFormatter: (d: number) => `￥${Number(d).toFixed(2)}` },
      ],
    },
    style: {
      lineWidth: 3,
      stroke: '#1890ff',
    },
    axis: {
      y: {
        labelFormatter: (v: number) => `¥${Number(v).toFixed(0)}`,
        gridStroke: '#f0f0f0',
        gridLineDash: [4, 4],
      },
      x: {
        lineStroke: '#d9d9d9',
      }
    },
  };

  return (
    <Card 
      title={
        <div className="flex items-center text-lg font-bold text-gray-800 py-2">
          <LineChartOutlined className="mr-3 text-gray-400 text-xl" /> 我的月度消费
        </div>
      }
      bordered={false}
      className="shadow-sm hover:shadow-md transition-shadow duration-300 rounded-2xl overflow-hidden h-full bg-white"
      headStyle={{ borderBottom: '1px solid #F3F4F6', padding: '0 24px' }}
      bodyStyle={{ padding: '24px' }}
    >
      {data && data.length > 0 ? (
        <Line {...lineConfig} />
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
          <LineChartOutlined style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }} />
          <Typography.Text type="secondary">暂无消费记录</Typography.Text>
        </div>
      )}
    </Card>
  );
};

export default CustomerConsumptionChart;