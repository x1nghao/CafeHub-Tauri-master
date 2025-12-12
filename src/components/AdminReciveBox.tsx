import { markMessageAsReadApi } from '@/api/message';
import { EyeOutlined, SendOutlined } from '@ant-design/icons';
import { Button, Table, Tag, message } from 'antd'
import React from 'react'

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

interface AdminReciveBoxProps {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setSelectedMessage: React.Dispatch<React.SetStateAction<Message | null>>;
  setIsModalVisible: React.Dispatch<React.SetStateAction<boolean>>;
  setIsReplyModalVisible: React.Dispatch<React.SetStateAction<boolean>>;
  setReplyingToMessage: React.Dispatch<React.SetStateAction<Message | null>>;
  adminId: number;
  loading: boolean;
}

const AdminReciveBox: React.FC<AdminReciveBoxProps> = (
  {
    messages,
    setMessages,
    setSelectedMessage,
    setIsModalVisible,
    setIsReplyModalVisible,
    setReplyingToMessage,
    adminId,
    loading,
  }
) => {

  const handleViewMessage = async (messageToView: Message) => {
    setSelectedMessage(messageToView);
    setIsModalVisible(true);

    // Only attempt to mark as read if it's currently unread
    if (messageToView.read_status === 0) {
      try {
        const status = await markMessageAsReadApi(messageToView.id, adminId);
        if (status === 0) {
          // Successfully marked as read (or was already read)
          setMessages(prevMessages =>
            prevMessages.map(msg =>
              msg.id === messageToView.id ? { ...msg, read_status: 1 } : msg
            )
          );
          // AntMessage.success('消息已标记为已读'); // Optional: can be too noisy
        } else if (status === 1) {
          // This case should ideally not happen if adminId is correctly the receiver.
          // Logging it for debugging.
          console.warn(`Attempted to mark message ${messageToView.id} as read, but admin ${adminId} is not the receiver.`);
          message.error('无法将此消息标记为已读：权限不足。');
        } else {
          // Handle other unexpected status codes if any are defined in the future
          message.error(`标记已读时发生未知状态: ${status}`);
        }
      } catch (error: any) {
        console.error(`Failed to mark message ${messageToView.id} as read:`, error);
        message.error(error.message || '标记已读失败，请稍后重试。');
      }
    }
  };

  const handleOpenReplyModal = (message: Message) => {
    setReplyingToMessage(message);
    setIsReplyModalVisible(true);
  };

  const receivedMessagesColumns = [
    {
      title: '用户名',
      dataIndex: 'sender_username',
      key: 'sender_username',
      render: (sender_username: string) => `${sender_username}`,
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: Message) => (
        <span className={`${record.read_status === 0 ? 'font-bold text-blue-600' : ''}`}>{text}</span>
      ),
    },
    {
      title: '日期',
      dataIndex: 'send_date',
      key: 'send_date',
      sorter: (a: Message, b: Message) => new Date(a.send_date).getTime() - new Date(b.send_date).getTime(),
      defaultSortOrder: 'descend' as const,
    },
    {
      title: '状态',
      dataIndex: 'read_status',
      key: 'read_status',
      render: (status: 0 | 1) => (
        <Tag color={status === 0 ? 'volcano' : 'green'}>
          {status === 0 ? '未读' : '已读'}
        </Tag>
      ),
      filters: [
        { text: '未读', value: 0 },
        { text: '已读', value: 1 },
      ],
      onFilter: (value: unknown, record: Message) => record.read_status === value,
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
          <Button
            icon={<SendOutlined />}
            onClick={() => handleOpenReplyModal(record)}
            className="text-purple-500 border-purple-500 hover:text-purple-700 hover:border-purple-700"
            size="small"
          >
            回复
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      {/* <Title level={2} className="mb-6 text-gray-800">管理员收件箱</Title> */}
      <Table
        columns={receivedMessagesColumns}
        dataSource={messages}
        rowKey="id"
        className="bg-white shadow-lg rounded-lg"
        pagination={{ pageSize: 5 }}
        scroll={{ x: 'max-content' }}
        loading={loading} // Added loading state to table
        locale={{ emptyText: loading ? '加载中...' : '暂无收到消息' }}
      />
    </div>
  )
}

export default AdminReciveBox