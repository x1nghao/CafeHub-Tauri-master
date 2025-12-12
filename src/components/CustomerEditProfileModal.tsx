// src/components/customer/CustomerEditProfileModal.tsx
import React, { useEffect } from 'react';
import { Modal, Form, Input, Select, message } from 'antd';
import { invoke } from '@tauri-apps/api/core';
import type { Account } from '@/api/user';

const { Option } = Select;

interface CustomerEditProfileModalProps {
  visible: boolean;
  onCancel: () => void;
  onProfileUpdateSuccess: () => void;
  currentUser: Account | null;
}

// 更新 payload 接口以包含 username
interface UpdateUserDetailsPayload {
  username?: string | null; // 新增
  phone?: string | null;
  gender?: number | null;
}


const CustomerEditProfileModal: React.FC<CustomerEditProfileModalProps> = ({
  visible,
  onCancel,
  onProfileUpdateSuccess,
  currentUser,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);

  useEffect(() => {
    if (currentUser && visible) {
      form.setFieldsValue({
        username: currentUser.username, // 设置用户名的初始值
        phone: currentUser.phone,
        gender: currentUser.gender,
      });
    }
    if (!visible) {
      form.resetFields();
    }
  }, [currentUser, visible, form]);

  const handleSubmit = async (values: UpdateUserDetailsPayload) => {
    if (!currentUser || !currentUser.id) {
      message.error('无法获取当前用户信息！');
      return;
    }

    const payload: UpdateUserDetailsPayload = {};
    let changed = false;

    // 检查用户名是否更改
    if (values.username && values.username !== currentUser.username) {
      if (values.username.trim() === "") {
        message.error("用户名不能为空！");
        return;
      }
      payload.username = values.username.trim();
      changed = true;
    }

    // 检查手机号是否更改 (允许清空)
    // 如果 values.phone 是 undefined (用户没碰过输入框) 且 currentUser.phone 是 null/undefined，不视为更改
    // 如果 values.phone 是 "" 且 currentUser.phone 不是 "", 视为更改 (清空)
    if (values.phone !== currentUser.phone) {
      if (values.phone === undefined && (currentUser.phone === null || currentUser.phone === undefined)) {
        // 视为未更改
      } else {
        payload.phone = values.phone ? values.phone.trim() : null; // 如果为空字符串或 undefined，则设为 null
        changed = true;
      }
    }


    // 检查性别是否更改
    if (values.gender !== currentUser.gender && values.gender !== undefined) {
      payload.gender = values.gender;
      changed = true;
    } else if (values.gender === undefined && currentUser.gender !== null && currentUser.gender !== undefined) {
      // 如果用户通过 allowClear 清除了性别选择，并且之前有值
      payload.gender = null; // 或者根据业务逻辑，不允许清除性别，则不设置此项
      changed = true;
    }


    if (!changed) {
      message.info('信息未作更改。');
      onCancel();
      return;
    }

    setLoading(true);
    try {
      await invoke<string>('update_user_details', {
        userId: currentUser.id,
        data: payload, // data 现在可能包含 username, phone, gender
      });
      message.success('用户信息更新成功！');
      onProfileUpdateSuccess();
      onCancel();
    } catch (error: any) {
      console.error('更新用户信息失败:', error);
      message.error(typeof error === 'string' ? error : '更新失败，请稍后再试。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="修改个人资料"
      open={visible}
      onCancel={onCancel}
      confirmLoading={loading}
      onOk={() => form.submit()}
      okText="保存"
      cancelText="取消"
      destroyOnClose
    >
      <Form form={form} layout="vertical" name="edit_profile_form" onFinish={handleSubmit}>
        <Form.Item
          name="username"
          label="用户名"
          rules={[
            { required: true, message: '用户名不能为空!' },
            { min: 3, message: '用户名至少为3个字符!' }, // 示例规则
          ]}
        >
          <Input placeholder="请输入新的用户名" />
        </Form.Item>
        <Form.Item
          name="phone"
          label="手机号码"
          rules={[
            () => ({
              validator(_, value) {
                if (!value || value.trim() === "") { // 允许为空
                  return Promise.resolve();
                }
                if (/^1[3-9]\d{9}$/.test(value)) { // 如果有值，则校验格式
                  return Promise.resolve();
                }
                return Promise.reject(new Error('请输入有效的11位手机号码!'));
              },
            })
          ]}
        >
          <Input placeholder="请输入手机号码 (11位，可留空)" maxLength={11} />
        </Form.Item>
        <Form.Item name="gender" label="性别">
          <Select placeholder="请选择性别" allowClear>
            <Option value={0}>男</Option>
            <Option value={1}>女</Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CustomerEditProfileModal;