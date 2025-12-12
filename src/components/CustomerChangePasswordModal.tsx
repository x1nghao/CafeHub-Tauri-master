// src/components/customer/CustomerChangePasswordModal.tsx
import React from 'react';
import { Modal, Form, Input, message } from 'antd';
import { invoke } from '@tauri-apps/api/core';

interface CustomerChangePasswordModalProps {
  visible: boolean;
  onCancel: () => void;
  userId: number | null;
}

// 这个接口对应表单的字段
interface ChangePasswordFormValues {
  current_password: string;
  new_password: string;
  confirm_new_password: string;
}

const CustomerChangePasswordModal: React.FC<CustomerChangePasswordModalProps> = ({ visible, onCancel, userId }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (values: ChangePasswordFormValues) => {
    if (!userId) {
      message.error('无法获取当前用户信息！');
      return;
    }

    setLoading(true);
    try {
      // 构建直接传递给 Rust UpdatePasswordData 结构的数据
      const updatePasswordPayloadForRust = {
        current_password: values.current_password, // 确保这里是 snake_case
        new_password: values.new_password,         // 确保这里是 snake_case
      };

      // 构建传递给 invoke 的 payload，其顶层键名 'data' 和 'userId' 对应 Rust 函数的参数名
      const payloadForInvoke = {
        userId: userId,                     // 对应 Rust 函数的第一个参数 userId
        data: updatePasswordPayloadForRust  // 对应 Rust 函数的第二个参数 data
      };

      await invoke<string>('update_user_password', payloadForInvoke);

      message.success('密码修改成功！');
      form.resetFields();
      onCancel(); // 关闭弹窗
    } catch (error: any) {
      console.error('修改密码失败:', error);
      const errorMessage = typeof error === 'string' ? error : (error?.message || '修改密码失败，请稍后再试。');
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="修改密码"
      open={visible}
      onCancel={() => {
        form.resetFields();
        onCancel();
      }}
      confirmLoading={loading}
      onOk={() => form.submit()}
      okText="确认修改"
      cancelText="取消"
      destroyOnClose
    >
      <Form form={form} layout="vertical" name="change_password_form" onFinish={handleSubmit}>
        <Form.Item
          name="current_password" // 表单字段名
          label="当前密码"
          rules={[{ required: true, message: '请输入当前密码!' }]}
        >
          <Input.Password placeholder="请输入当前使用的密码" />
        </Form.Item>
        <Form.Item
          name="new_password" // 表单字段名
          label="新密码"
          rules={[
            { required: true, message: '请输入新密码!' },
            { min: 6, message: '密码长度至少为6位!' },
          ]}
          hasFeedback
        >
          <Input.Password placeholder="请输入新密码 (至少6位)" />
        </Form.Item>
        <Form.Item
          name="confirm_new_password" // 表单字段名
          label="确认新密码"
          dependencies={['new_password']}
          hasFeedback
          rules={[
            { required: true, message: '请再次输入新密码!' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('new_password') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('两次输入的密码不一致!'));
              },
            }),
          ]}
        >
          <Input.Password placeholder="请再次确认新密码" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CustomerChangePasswordModal;