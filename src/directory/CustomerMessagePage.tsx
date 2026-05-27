import { useState, useEffect } from 'react'; // Added useEffect
import { Button, Typography, Tabs, message as AntMessage } from 'antd'; // Renamed message to AntMessage
import { SendOutlined, InboxOutlined, MailOutlined } from '@ant-design/icons';
import CusSendMessage from '@/components/CusSendMessage';
import MessageContent from '@/components/MessageContent';
import CustomerReciveBox from '@/components/CustomerReciveBox';
import CustomerSentBox from '@/components/CustomerSentBox';
import { fetchReceivedMessages, fetchSentMessages, Message } from '@/api/message'; // Import Message type from API
import type { Account } from '@/api/user'; // Import Account type

const { Title } = Typography;
const { TabPane } = Tabs;

// Removed local Message interface, CURRENT_USER_ID, ADMIN_ID, and mock data

const CustomerMessagePage = () => {
  const [currentUser, setCurrentUser] = useState<Account | null>(null);
  const [sentMessages, setSentMessages] = useState<Message[]>([]);
  const [receivedMessages, setReceivedMessages] = useState<Message[]>([]);

  const [selectedSentMessage, setSelectedSentMessage] = useState<Message | null>(null);
  const [isViewSentModalVisible, setIsViewSentModalVisible] = useState(false);

  const [selectedReceivedMessage, setSelectedReceivedMessage] = useState<Message | null>(null);
  const [isViewReceivedModalVisible, setIsViewReceivedModalVisible] = useState(false);

  const [isNewMessageModalVisible, setIsNewMessageModalVisible] = useState(false);
  const [loading, setLoading] = useState<boolean>(false); // Added loading state

  useEffect(() => {
    const storedAccountString = localStorage.getItem('loginAccount');
    if (storedAccountString) {
      try {
        const storedAccount: Account = JSON.parse(storedAccountString);
        if (storedAccount.user_type !== 1) { // Ensure it's a customer (user_type 1)
          AntMessage.error('您不是客户账户，无法访问此页面。');
          // Potentially redirect or disable functionality
          return;
        }
        setCurrentUser(storedAccount);
      } catch (e) {
        AntMessage.error('登录信息解析失败，请重新登录。');
        localStorage.removeItem('loginAccount');
      }
    } else {
      AntMessage.error('请先登录以访问消息中心。');
      // Potentially redirect to login
    }
  }, []);

  useEffect(() => {
    if (currentUser && currentUser.id !== -1) { // Ensure currentUser and its id are valid
      const loadMessages = async () => {
        setLoading(true);
        try {
          const [sent, received] = await Promise.all([
            fetchSentMessages(currentUser.id),
            fetchReceivedMessages(currentUser.id),
          ]);
          setSentMessages(sent);
          setReceivedMessages(received);
        } catch (error: any) {
          AntMessage.error(`加载消息失败: ${error.message || '未知错误'}`);
        } finally {
          setLoading(false);
        }
      };
      loadMessages();
    }
  }, [currentUser]);


  const handleOpenNewMessageModal = () => {
    if (!currentUser) {
      AntMessage.error('请先登录再发送消息。');
      return;
    }
    setIsNewMessageModalVisible(true);
  };


  return (
    <div className="p-4 md:p-6 bg-gradient-to-br from-slate-100 to-sky-100 min-h-screen">
      <div className="max-w-5xl mx-auto bg-white shadow-2xl rounded-lg p-4 md:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 pb-4 border-b border-gray-200">
          <Title level={2} className="!mb-2 sm:!mb-0 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
            我的消息中心 {currentUser && `- ${currentUser.username}`}
          </Title>
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleOpenNewMessageModal}
            className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 border-none text-white shadow-md hover:shadow-lg transition-shadow duration-300"
            size="large"
            disabled={!currentUser || loading} // Disable if not logged in or loading
          >
            写新消息给管理员
          </Button>
        </div>

        <Tabs defaultActiveKey="inbox" type="line" size="large" centered className="custom-tabs">
          <TabPane
            tab={
              <span className="flex items-center space-x-2 text-lg">
                <InboxOutlined />
                <span>我的收件 ({receivedMessages.filter(m => m.read_status === 0).length} 未读)</span>
              </span>
            }
            key="inbox"
          >
            <div className="mt-4">
              <CustomerReciveBox
                receivedMessages={receivedMessages}
                setReceivedMessages={setReceivedMessages}
                setSelectedReceivedMessage={setSelectedReceivedMessage}
                setIsViewReceivedModalVisible={setIsViewReceivedModalVisible}
                currentUserId={currentUser?.id || -1} // Pass current user ID
                loading={loading}
              />
            </div>
          </TabPane>
          <TabPane
            tab={
              <span className="flex items-center space-x-2 text-lg">
                <MailOutlined />
                <span>我的发件</span>
              </span>
            }
            key="sent"
          >
            <div className="mt-4">
              <CustomerSentBox
                sentMessages={sentMessages}
                setSelectedSentMessage={setSelectedSentMessage}
                setIsViewSentModalVisible={setIsViewSentModalVisible}
                loading={loading} // Pass loading state
              />
            </div>
          </TabPane>
        </Tabs>
      </div>

      {/* Modal for Viewing Sent Message */}
      {selectedSentMessage && (
        <MessageContent
          selectedMessage={selectedSentMessage}
          isModalVisible={isViewSentModalVisible}
          setIsModalVisible={setIsViewSentModalVisible}
          setSelectedMessage={setSelectedSentMessage}
        />
      )}

      {/* Modal for Viewing Received Message */}
      {selectedReceivedMessage && (
        <MessageContent
          selectedMessage={selectedReceivedMessage}
          isModalVisible={isViewReceivedModalVisible}
          setIsModalVisible={setIsViewReceivedModalVisible}
          setSelectedMessage={setSelectedReceivedMessage}
        />
      )}

      {/* Conditionally render CusSendMessage only if currentUser is available */}
      {currentUser && (
        <CusSendMessage
          isNewMessageModalVisible={isNewMessageModalVisible}
          setIsNewMessageModalVisible={setIsNewMessageModalVisible}
          setSentMessages={setSentMessages}
          currentUserId={currentUser.id} // Pass the current user's ID
        />
      )}
    </div>
  );
};

export default CustomerMessagePage;