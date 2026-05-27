import { useEffect, useState } from 'react';
import { Table, Button, Tag, Space, message } from 'antd';
import type { TableProps } from 'antd';
import ReportLost from '@/components/ReportLost';
import { getAllLostItems, LostItem as ApiLostItem, claimLostItem } from '../api/lost';
import type { Account } from '../api/user'; // Added import for Account type

// Helper function to get user ID - updated based on CustomerInfoPage.tsx
const getLoggedInUser = (): number | null => {
  const accountDataString = localStorage.getItem('loginAccount'); // Changed key to 'loginAccount'
  if (accountDataString) {
    try {
      const account: Account = JSON.parse(accountDataString);
      return account && typeof account.id === 'number' ? account.id : null;
    } catch (e) {
      console.error("Failed to parse account data from localStorage", e);
      return null;
    }
  }
  return null;
};

const CustomerLostPage = () => {
  const [lostItems, setLostItems] = useState<ApiLostItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  useEffect(() => {
    const userId = getLoggedInUser();
    setCurrentUserId(userId);
    if (userId === null) {
      message.warning('请先登录以执行操作。'); // Changed from message.warn to message.warning
    }
  }, []);

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

  useEffect(() => {
    fetchLostItems();
  }, []);

  const handleReportLostItem = () => {
    if (currentUserId === null) {
      message.error('请先登录才能报告失物。');
      return;
    }
    setIsModalOpen(true);
  };

  const handleClaimItem = async (itemId: number) => {
    if (currentUserId === null) {
      message.error('请先登录才能认领物品。');
      return;
    }
    const res = await claimLostItem(itemId, currentUserId);
    if (res == 0) {
      message.success('认领成功！');
      fetchLostItems();
    } else {
      message.error('认领失败，请稍后重试。');
    }
  };

  const columns: TableProps<ApiLostItem>['columns'] = [
    {
      title: '物品名称',
      dataIndex: 'item_name',
      key: 'item_name',
    },
    {
      title: '拾取地点',
      dataIndex: 'pick_place',
      key: 'pick_place',
      render: (text?: string) => text || 'N/A',
    },
    {
      title: '拾取时间',
      dataIndex: 'pick_time',
      key: 'pick_time',
      render: (text?: string) => text ? new Date(text).toLocaleDateString() : 'N/A',
    },
    {
      title: '拾取人',
      dataIndex: 'pick_user_name',
      key: 'pick_user_name',
      render: (text?: string) => text || 'N/A',
    },
    {
      title: '状态',
      key: 'status',
      dataIndex: 'status',
      render: (status: 0 | 1) => (
        <Tag color={status === 0 ? 'green' : 'red'}>
          {status === 0 ? '未认领' : '已认领'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record: ApiLostItem) => (
        <Space size="middle">
          {record.status === 0 ? (
            <Button
              type="primary"
              onClick={() => handleClaimItem(record.id)}
              disabled={currentUserId === null}
            >
              认领
            </Button>
          ) : (
            <Button type="primary" disabled>
              已认领
            </Button>
          )}
        </Space>
      ),
    },
  ];

  if (error) {
    return <div className="p-5 font-sans text-center text-red-500">加载失物列表失败: {error}</div>;
  }

  return (
    <div className="p-5 font-sans">
      <div className="flex justify-between items-center mb-5">
        <h1 className="text-2xl">失物招领</h1>
        <Button
          type="primary"
          onClick={handleReportLostItem}
          disabled={currentUserId === null}
        >
          报告失物
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={lostItems}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      {currentUserId !== null && (
        <ReportLost
          isModalOpen={isModalOpen}
          setIsModalOpen={setIsModalOpen}
          onReportSuccess={fetchLostItems}
          currentUserId={currentUserId}
        />
      )}
    </div>
  );
};

export default CustomerLostPage;