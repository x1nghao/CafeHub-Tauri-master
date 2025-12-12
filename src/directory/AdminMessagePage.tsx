import { useEffect, useState } from 'react';
import { Typography, message, Radio } from 'antd'; // Added Radio
import MessageContent from '@/components/MessageContent';
import AdminReplyModal from '@/components/AdminReplyModal';
import AdminReciveBox from '@/components/AdminReciveBox';
import AdminSentBox from '@/components/AdminSentBox';
import { fetchReceivedMessages, fetchSentMessages } from '@/api/message';
import type { Account } from '@/api/user'; // Import Account type

const { Title } = Typography;

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

const AdminMessagePage = () => {
  const [adminId, setAdminId] = useState<number>(-1);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const [isReplyModalVisible, setIsReplyModalVisible] = useState(false);
  const [replyingToMessage, setReplyingToMessage] = useState<Message | null>(null);
  const [adminSentMessages, setAdminSentMessages] = useState<Message[]>([]);
  const [currentView, setCurrentView] = useState<'inbox' | 'sent'>('inbox'); // New state for view toggle
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const storedAccountString = localStorage.getItem('loginAccount');
    if (storedAccountString) {
      const storedAccount: Account = JSON.parse(storedAccountString);
      setAdminId(storedAccount.id);
    } else {
      message.error('请重新登录');
    }

    const loadMessages = async () => {
      setLoading(true);
      try {
        if (currentView === 'inbox') {
          const received = await fetchReceivedMessages(adminId);
          setMessages(received);
        } else if (currentView === 'sent') {
          const sent = await fetchSentMessages(adminId);
          setAdminSentMessages(sent);
        }
      } catch (error) {
        message.error(`加载消息失败: ${error}`);
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, [currentView, adminId]); // Reload messages when currentView changes

  const handleCloseReplyModal = () => {
    setIsReplyModalVisible(false);
    setReplyingToMessage(null);
  };

  const handleViewChange = (e: any) => { // New handler for Radio group
    setCurrentView(e.target.value);
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen space-y-8">
      <div className="flex justify-between items-center mb-6">
        <Title level={2} className="text-gray-800 !mb-0">
          {currentView === 'inbox' ? '管理员消息中心 - 收件箱' : '管理员消息中心 - 已发送'}
        </Title>
        <Radio.Group onChange={handleViewChange} value={currentView}>
          <Radio.Button value="inbox">收件箱</Radio.Button>
          <Radio.Button value="sent">已发送</Radio.Button>
        </Radio.Group>
      </div>

      {currentView === 'inbox' && (
        <AdminReciveBox
          messages={messages}
          setMessages={setMessages}
          setSelectedMessage={setSelectedMessage}
          setIsModalVisible={setIsModalVisible}
          setIsReplyModalVisible={setIsReplyModalVisible}
          setReplyingToMessage={setReplyingToMessage}
          adminId={adminId}
          loading={loading}
        />
      )}

      {currentView === 'sent' && (
        <AdminSentBox
          adminSentMessages={adminSentMessages}
          setSelectedMessage={setSelectedMessage}
          setIsMessageModalVisible={setIsModalVisible}
          loading={loading}
        />
      )}

      {selectedMessage && (
        <MessageContent
          selectedMessage={selectedMessage}
          isModalVisible={isModalVisible}
          setIsModalVisible={setIsModalVisible}
          setSelectedMessage={setSelectedMessage}
        />
      )}

      {replyingToMessage && (
        <AdminReplyModal
          visible={isReplyModalVisible}
          adminId={adminId}
          recipientId={replyingToMessage.sender_id}
          recipientName={replyingToMessage.sender_username}
          originalMessageTitle={replyingToMessage.title}
          setAdminSentMessages={setAdminSentMessages}
          handleCloseReplyModal={handleCloseReplyModal}
        />
      )}

    </div>
  );
};

export default AdminMessagePage;