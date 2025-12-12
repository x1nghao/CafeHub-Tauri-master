import { Modal, Input, Button, Typography, Form, message as AntMessage } from 'antd'; // Renamed message to AntMessage
import React, { useState } from 'react';
import { customerSendMessageApi, fetchSentMessages, CustomerSendMessagePayload, Message } from '@/api/message'; // Import necessary items

const { Title } = Typography;
const { TextArea } = Input;

interface CusSendMessageProps {
  isNewMessageModalVisible: boolean;
  setIsNewMessageModalVisible: (visible: boolean) => void;
  setSentMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  currentUserId: number | null; // ID of the logged-in customer, can be null if not logged in
}

const CusSendMessage: React.FC<CusSendMessageProps> = ({
  isNewMessageModalVisible,
  setIsNewMessageModalVisible,
  setSentMessages,
  currentUserId,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleNewMessageModalClose = () => {
    if (loading) return;
    setIsNewMessageModalVisible(false);
    form.resetFields();
  };

  const handleSendMessage = async (values: { title: string; message_content: string }) => {
    if (currentUserId === null || currentUserId === -1) { // Check for null or invalid ID
      AntMessage.error('用户未登录或ID无效，无法发送消息。');
      return;
    }
    setLoading(true);
    const payload: CustomerSendMessagePayload = {
      sender_id: currentUserId,
      title: values.title || undefined, // Send undefined if title is empty, matching Option<String>
      message_content: values.message_content,
    };

    try {
      await customerSendMessageApi(payload);
      AntMessage.success('消息发送成功!');

      // Refresh sent messages list
      const updatedSentMessages = await fetchSentMessages(currentUserId);
      setSentMessages(updatedSentMessages);

      handleNewMessageModalClose();
    } catch (error: any) {
      AntMessage.error(`发送失败: ${error.message || '未知错误'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Modal
        title={<Title level={4} className="text-green-600">发送新消息给管理员</Title>}
        open={isNewMessageModalVisible}
        onCancel={handleNewMessageModalClose}
        footer={null} // Custom footer buttons inside Form
        destroyOnClose
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSendMessage}
          className="mt-4"
        >
          <Form.Item
            name="title"
            label="标题"
            rules={[{ required: true, message: '请输入消息标题!' }]}
          >
            <Input placeholder="请输入消息标题" />
          </Form.Item>
          <Form.Item
            name="message_content"
            label="消息内容"
            rules={[{ required: true, message: '请输入消息内容!' }]}
          >
            <TextArea rows={4} placeholder="请输入详细的消息内容..." />
          </Form.Item>
          <Form.Item className="text-right mt-6">
            <Button onClick={handleNewMessageModalClose} className="mr-2 hover:bg-gray-200" disabled={loading}>
              取消
            </Button>
            <Button type="primary" htmlType="submit" className="bg-green-500 hover:bg-green-600" loading={loading}>
              发送
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default CusSendMessage;