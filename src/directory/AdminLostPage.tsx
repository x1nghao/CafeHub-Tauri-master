import { Table, Typography, Tag } from 'antd';
import { useEffect, useState } from 'react';
import { getAllLostItems, LostItem } from '../api/lost';

const { Title } = Typography;

const AdminLostPage = () => {
  const [lostItems, setLostItems] = useState<LostItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLostItems = async () => {
      try {
        setLoading(true);
        const items = await getAllLostItems();
        setLostItems(items);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch lost items:", err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        setLostItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLostItems();
  }, []);

  const columns = [
    { title: '物品名称', dataIndex: 'item_name', key: 'item_name', className: 'text-center' },
    { title: '拾取地点', dataIndex: 'pick_place', key: 'pick_place', className: 'text-center', render: (text?: string) => text || 'N/A' },
    { title: '拾取时间', dataIndex: 'pick_time', key: 'pick_time', className: 'text-center', render: (text?: string) => text ? new Date(text).toLocaleDateString() : 'N/A' },
    { title: '拾取人', dataIndex: 'pick_user_name', key: 'pick_user_name', className: 'text-center', render: (text?: string) => text || 'N/A' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      className: 'text-center',
      render: (status: 0 | 1) => (
        <Tag color={status === 0 ? 'orange' : 'green'}>
          {status === 0 ? '未认领' : '已认领'}
        </Tag>
      ),
    },
    { title: '认领人', dataIndex: 'claim_user_name', key: 'claim_user_name', className: 'text-center', render: (text?: string) => text || 'N/A' },
    { title: '认领时间', dataIndex: 'claim_time', key: 'claim_time', className: 'text-center', render: (text?: string) => text ? new Date(text).toLocaleDateString() : 'N/A' },
  ];

  if (error) {
    return <div className="p-5 font-sans text-center text-red-500">加载失物列表失败: {error}</div>;
  }

  return (
    <div className="p-5 font-sans">
      <Title level={2} className="text-center mb-5 text-gray-700">失物管理</Title>
      <Table
        dataSource={lostItems}
        columns={columns}
        rowKey="id"
        bordered
        loading={loading}
        className="shadow-md rounded-lg"
        pagination={{ pageSize: 5, className: 'mt-4' }}
      />
    </div>
  );
};

export default AdminLostPage;