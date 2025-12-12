import { useState, useEffect } from 'react';
import { Form, Input, Button, message, Card, Typography, Alert } from 'antd';
import { DatabaseOutlined, SaveOutlined, ApiOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { invoke } from '@tauri-apps/api/core';
import bg from '../assets/login.png';

const { Text } = Typography;

const DBConfigPage = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; msg: string } | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const config = await invoke<string>('get_current_db_config');
      form.setFieldsValue({ connectionString: config });
    } catch (error) {
      console.error('Failed to load config:', error);
      // message.error('无法加载当前配置 (可能是第一次运行)');
    }
  };

  const onFinish = async (values: { connectionString: string }) => {
    setLoading(true);
    try {
      await invoke('save_db_config', { connectionString: values.connectionString });
      message.success('配置已保存并立即生效！', 5);
    } catch (error: any) {
      console.error('Failed to save config:', error);
      message.error('保存失败: ' + (error.message || error));
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    const connectionString = form.getFieldValue('connectionString');
    if (!connectionString) {
      message.warning('请先输入连接字符串');
      return;
    }

    setTesting(true);
    setTestResult(null);
    try {
      const res = await invoke<string>('test_db_connection', { connectionString });
      setTestResult({ success: true, msg: res });
      message.success('连接测试成功！');
    } catch (error: any) {
      setTestResult({ success: false, msg: error.toString() });
      message.error('连接测试失败');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4" style={{
      backgroundImage: `url(${bg})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      
      <Card 
        className="w-full max-w-2xl relative z-10 shadow-xl rounded-xl"
        title={
          <div className="flex items-center gap-2 text-lg">
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/')} type="text" />
            <DatabaseOutlined className="text-blue-600" />
            <span>数据库连接配置</span>
          </div>
        }
      >
        <Alert
          message="配置说明"
          description={
            <div>
              <p>请输入标准的 PostgreSQL 连接字符串。如果留空或无效，应用将无法启动或连接失败。</p>
              <div className="mt-2 p-2 bg-gray-100 rounded text-xs text-gray-600 font-mono break-all">
                postgresql://username:password@host:port/database
              </div>
              <div className="mt-1 text-xs text-gray-500">
                示例: <Text code>postgresql://postgres:123456@localhost:5432/cafehub</Text>
              </div>
            </div>
          }
          type="info"
          showIcon
          className="mb-6"
        />

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{ connectionString: '' }}
        >
          <Form.Item
            name="connectionString"
            label="连接字符串 (Connection String)"
            rules={[
              { required: true, message: '请输入连接字符串' },
              { pattern: /^(postgres(ql)?|gaussdb):\/\/.+/, message: '格式应以 postgresql:// 或 gaussdb:// 开头' }
            ]}
          >
            <Input.Password 
              placeholder="postgresql://user:pass@host:port/db" 
              size="large"
              visibilityToggle
            />
          </Form.Item>

          {testResult && (
            <Alert
              message={testResult.success ? "连接成功" : "连接失败"}
              description={testResult.msg}
              type={testResult.success ? "success" : "error"}
              showIcon
              className="mb-4"
            />
          )}

          <div className="flex justify-end gap-4 mt-4">
             <Button 
              icon={<ApiOutlined />} 
              onClick={handleTestConnection} 
              loading={testing}
            >
              测试连接
            </Button>
            <Button 
              type="primary" 
              htmlType="submit" 
              icon={<SaveOutlined />} 
              loading={loading}
            >
              保存配置
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default DBConfigPage;
