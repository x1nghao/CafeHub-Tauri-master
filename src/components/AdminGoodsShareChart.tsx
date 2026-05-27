import React from 'react';
import { Card, Typography } from 'antd';
import { PieChartOutlined } from '@ant-design/icons';
import { Pie } from '@ant-design/charts';
import type { GoodsConsumptionShare } from '@/api/user'; // 或 '@/types';

interface AdminGoodsShareChartProps {
  data: GoodsConsumptionShare[];
}

const AdminGoodsShareChart: React.FC<AdminGoodsShareChartProps> = ({ data }) => {
  const pieConfig = {
    appendPadding: 10,
    data: data,
    angleField: 'amount',
    colorField: 'goods_name',
    radius: 0.8,
    height: 300,
    tooltip: {
      title:
        { field: 'goods_name', valueFormatter: (goods_name: string) => { return `商品名：${goods_name}` } },
      items: [
        { name: '商品消费额', field: 'amount', valueFormatter: (amount: number) => { return `￥${amount}` } }
      ]
    },
    label: {
      type: 'outer' as const, // 'outer' 类型标签通常更易读
      // content: '{name}\n¥{value}', // 显示名称和数值
      formatter: (datum: any) => `${datum.goods_name}\n¥${datum.amount.toFixed(2)}`,
    },
    meta: {
      goods_name: { alias: '商品名称' },
      amount: { alias: '消费额', formatter: (v: number) => `¥${v.toFixed(2)}` },
    },
    interactions: [{ type: 'element-selected' as const }, { type: 'element-active' as const }],
  };

  return (
    <Card title={<><PieChartOutlined /> 本月商品消费占比</>}>
      {data.length > 0 ? <Pie {...pieConfig} /> : <Typography.Text style={{ display: 'block', textAlign: 'center', padding: '20px' }}>暂无本月商品消费数据</Typography.Text>}
    </Card>
  );
};

export default AdminGoodsShareChart;