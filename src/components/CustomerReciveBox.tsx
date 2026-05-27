import { EyeOutlined } from '@ant-design/icons';
import { Button, Table, Tag, message as AntMessage } from 'antd'; // Added AntMessage
import React from 'react';
import type { Message } from '@/api/message'; // Import Message type
import { markMessageAsReadApi } from '@/api/message'; // Import API for marking as read

interface CustomerReciveBoxProps {
  receivedMessages: Message[];
  setReceivedMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setSelectedReceivedMessage: React.Dispatch<React.SetStateAction<Message | null>>;
  setIsViewReceivedModalVisible: React.Dispatch<React.SetStateAction<boolean>>;
  loading: boolean; // Add loading prop
  currentUserId: number; // Add currentUserId to call markMessageAsReadApi
}

const CustomerReciveBox: React.FC<CustomerReciveBoxProps> = ({
  receivedMessages,
  setReceivedMessages,
  setSelectedReceivedMessage,
  setIsViewReceivedModalVisible,
  loading, // Destructure loading prop
  currentUserId, // Destructure currentUserId
}) => {

  const handleViewReceivedMessage = async (messageToView: Message) => {
    setSelectedReceivedMessage(messageToView);
    setIsViewReceivedModalVisible(true);

    if (messageToView.read_status === 0 && currentUserId !== -1) {
      try {
        const status = await markMessageAsReadApi(messageToView.id, currentUserId);
        if (status === 0) {
          // Successfully marked as read on backend, now update local state
          setReceivedMessages(prevMessages =>
            prevMessages.map(msg =>
              msg.id === messageToView.id ? { ...msg, read_status: 1 } : msg
            )
          );
        } else if (status === 1) {
          // This case means the current user is not the receiver, which shouldn't happen
          // if the message is in their received box and currentUserId is correct.
          console.warn(`Attempted to mark message ${messageToView.id} as read, but user ${currentUserId} is not the receiver.`);
          AntMessage.error('无法将此消息标记为已读：权限不足。');
        } else {
          AntMessage.error(`标记已读时发生未知状态: ${status}`);
        }
      } catch (error: any) {
        console.error(`Failed to mark message ${messageToView.id} as read:`, error);
        AntMessage.error(error.message || '标记已读失败，请稍后重试。');
        // Optionally, still update UI optimistically or handle error differently
        // For now, we only update UI on successful backend confirmation.
      }
    }
  };

  const receivedMessagesColumns = [
    {
      title: '发件人', // Admin is the sender
      dataIndex: 'sender_username',
      key: 'sender_username',
      render: (username: string) => username || '管理员', // Fallback
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: Message) => (
        <span className={`${record.read_status === 0 ? 'font-bold text-blue-700' : 'font-normal'}`}>{text}</span>
      ),
    },
    {
      title: '接收日期',
      dataIndex: 'send_date',
      key: 'send_date',
      sorter: (a: Message, b: Message) => new Date(a.send_date).getTime() - new Date(b.send_date).getTime(),
      defaultSortOrder: 'descend' as const,
    },
    {
      title: '我的状态',
      dataIndex: 'read_status',
      key: 'read_status',
      render: (status: 0 | 1) => (
        <Tag color={status === 0 ? 'orange' : 'cyan'}>
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
      title: '操作',
      key: 'actions',
      render: (_: any, record: Message) => (
        <Button
          icon={<EyeOutlined />}
          onClick={() => handleViewReceivedMessage(record)}
          className="text-green-500 border-green-500 hover:text-green-700 hover:border-green-700"
        >
          查看消息
        </Button>
      ),
    },
  ];

  return (
    <Table
      columns={receivedMessagesColumns}
      dataSource={receivedMessages}
      rowKey="id"
      pagination={{ pageSize: 5, showSizeChanger: false }}
      className="shadow-sm rounded-md overflow-hidden"
      scroll={{ x: 'max-content' }}
      loading={loading} // Pass loading state to Table
      locale={{ emptyText: loading ? '加载中...' : '暂无收到消息' }}
    />
  )
}

export default CustomerReciveBox