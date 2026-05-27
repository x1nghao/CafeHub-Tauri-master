import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Button, message as AntMessage } from 'antd';
import { sendMessageApi, fetchSentMessages } from '@/api/message';
import type { SendMessagePayload, Message } from '@/api/message';

const { TextArea } = Input;

interface AdminReplyModalProps {
  visible: boolean;
  adminId: number; // ID of the admin sending the message
  recipientId: number; // ID of the user receiving the message
  recipientName: string; // Username of the recipient
  originalMessageTitle: string; // Title of the message being replied to
  setAdminSentMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  handleCloseReplyModal: () => void;
}

const AdminReplyModal: React.FC<AdminReplyModalProps> = ({
  visible,
  adminId,
  recipientId,
  recipientName,
  originalMessageTitle,
  setAdminSentMessages,
  handleCloseReplyModal,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      form.setFieldsValue({
        title: originalMessageTitle ? `回复: ${originalMessageTitle}` : '',
        message_content: '',
      });
    }
  }, [visible, originalMessageTitle, form]);

  const handleSendReply = async (values: { title: string; message_content: string }) => {
    if (adminId === -1) {
      AntMessage.error('管理员ID无效，无法发送消息。请确保管理员已登录。');
      return;
    }
    if (!values.message_content.trim()) {
      AntMessage.error('消息内容不能为空！'); // Should be caught by Form rules, but good to double check
      return;
    }
    if (!values.title.trim()) {
      AntMessage.error('消息标题不能为空！'); // Should be caught by Form rules, but good to double check
      return;
    }

    setLoading(true);
    const payload: SendMessagePayload = {
      sender_id: adminId,
      receiver_id: recipientId,
      title: values.title,
      message_content: values.message_content,
    };

    try {
      await sendMessageApi(payload); // sendMessageApi now throws for non-zero status or other errors
      AntMessage.success('回复发送成功！');

      // Refresh the sent messages list in AdminMessagePage
      if (adminId !== -1) {
        const updatedSentMessages = await fetchSentMessages(adminId);
        setAdminSentMessages(updatedSentMessages);
      }
      handleCloseReplyModal();
      form.resetFields();
    } catch (error: any) {
      AntMessage.error(`发送失败: ${error.message || '未知错误'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={`回复 ${recipientName}`}
      open={visible}
      onCancel={() => {
        if (!loading) {
          handleCloseReplyModal();
          form.resetFields();
        }
      }}
      footer={[
        <Button key="back" onClick={() => {
          if (!loading) {
            handleCloseReplyModal();
            form.resetFields();
          }
        }} disabled={loading}>
          取消
        </Button>,
        <Button key="submit" type="primary" loading={loading} onClick={() => form.submit()}>
          发送
        </Button>,
      ]}
      destroyOnClose // Ensures form is reset when modal is closed and re-opened
    >
      <Form form={form} layout="vertical" onFinish={handleSendReply} preserve={false}>
        <Form.Item
          name="title"
          label="标题"
        >
          <Input placeholder="输入回复标题 (可选)" />
        </Form.Item>
        <Form.Item
          name="message_content"
          label="内容"
          rules={[{ required: true, message: '请输入消息内容!' }]}
        >
          <TextArea rows={4} placeholder="输入回复内容" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AdminReplyModal;
