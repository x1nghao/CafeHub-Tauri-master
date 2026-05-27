import { EyeOutlined } from '@ant-design/icons';
import { Button, Table, Tag } from 'antd'
import React from 'react'

// Interface for messages sent by the admin
interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  sender_username: string;
  receiver_username: string;
  title: string;
  message_content: string;
  send_date: string; // Assuming NaiveDate is serialized to YYYY-MM-DD string or null
  read_status: 0 | 1;
}

interface AdminSentBoxProps {
  adminSentMessages: Message[];
  setSelectedMessage: React.Dispatch<React.SetStateAction<Message | null>>;
  setIsMessageModalVisible: React.Dispatch<React.SetStateAction<boolean>>;
  loading: boolean;
}

const AdminSentBox: React.FC<AdminSentBoxProps> = ({
  adminSentMessages,
  setSelectedMessage,
  setIsMessageModalVisible,
  loading,
}) => {

  const handleViewMessage = (message: Message) => {
    setSelectedMessage(message);
    setIsMessageModalVisible(true);
  };


  const sentMessagesColumns = [
    {
      title: '接收用户名',
      dataIndex: 'receiver_username',
      key: 'receiver_username',
      render: (receiver_username: string) => `${receiver_username}`,
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '发送日期',
      dataIndex: 'send_date',
      key: 'send_date',
      sorter: (a: Message, b: Message) => new Date(a.send_date).getTime() - new Date(b.send_date).getTime(),
      defaultSortOrder: 'descend' as const,
    },
    {
      title: '用户读取状态', // This would typically be updated by the user's interaction
      dataIndex: 'read_status',
      key: 'read_status',
      render: (status: 0 | 1) => (
        <Tag color={status === 0 ? 'gold' : 'cyan'}>
          {status === 0 ? '用户未读' : '用户已读'}
        </Tag>
      ),
    },
    {
      title: '行动',
      key: 'actions',
      render: (_: any, record: Message) => (
        <div className="space-x-2 flex">
          <Button
            icon={<EyeOutlined />}
            onClick={() => handleViewMessage(record)}
            className="text-blue-500 border-blue-500 hover:text-blue-700 hover:border-blue-700"
            size="small"
          >
            查看
          </Button>
        </div>
      ),
    }
  ];

  return (
    <div>
      {/* <Title level={2} className="mb-6 text-gray-800">管理员已发送</Title> */}
      <Table
        columns={sentMessagesColumns}
        dataSource={adminSentMessages}
        rowKey="id"
        className="bg-white shadow-lg rounded-lg"
        pagination={{ pageSize: 5 }}
        locale={{ emptyText: '暂无已发送消息' }}
        scroll={{ x: 'max-content' }}
        loading={loading}
      />
    </div>
  )
}

export default AdminSentBox