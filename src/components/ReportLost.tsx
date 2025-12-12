import { Modal, Input, Form, message } from 'antd'; // Removed DatePicker
import React, { useState } from 'react';
import { reportLostItem } from '@/api/lost';

// Interface for form values
interface ReportFormValues {
  item_name: string;
  pick_place?: string;
}

// Interface for the data payload sent to the backend
interface ReportLostItemPayload {
  item_name: string;
  pick_place?: string;
  pick_user_id?: number;
}

interface ReportLostProps {
  isModalOpen: boolean;
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onReportSuccess: () => void;
  currentUserId?: number;
}

const ReportLost: React.FC<ReportLostProps> = ({
  isModalOpen,
  setIsModalOpen,
  onReportSuccess,
  currentUserId,
}) => {
  const [form] = Form.useForm<ReportFormValues>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      setIsSubmitting(true);

      const reportData: ReportLostItemPayload = {
        item_name: values.item_name,
        pick_place: values.pick_place,
        pick_user_id: currentUserId,
        // pick_time is handled by the backend
      };

      reportLostItem(reportData)

      message.success('失物报告成功！');
      form.resetFields();
      setIsModalOpen(false);
      onReportSuccess();
    } catch (error) {
      console.error('Failed to report lost item:', error);
      message.error(error instanceof Error ? error.message : '报告失物失败，请重试。');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModalCancel = () => {
    form.resetFields();
    setIsModalOpen(false);
  };

  return (
    <>
      <Modal
        title="报告新的失物"
        open={isModalOpen}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        okText="提交"
        cancelText="取消"
        confirmLoading={isSubmitting}
      >
        <Form form={form} layout="vertical" name="report_lost_item_form">
          <Form.Item
            name="item_name"
            label="物品名称"
            rules={[{ required: true, message: '请输入物品名称!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="pick_place"
            label="拾取地点"
          >
            <Input placeholder="例如：2号桌，吧台" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default ReportLost;