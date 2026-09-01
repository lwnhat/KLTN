import React, { useState } from 'react';
import { Card, Form, Input, Button, Alert, Typography, Space, Tag } from 'antd';
import { UserOutlined, LockOutlined, CrownOutlined, SafetyCertificateFilled, ArrowRightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import LuxuryLogo from '../components/LuxuryLogo';
import { API_BASE } from '../lib/api';

const { Title, Text } = Typography;

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const handleLogin = async (values: any) => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(values),
      });

      let data: any = {};
      try {
        data = await res.json();
      } catch {
        throw new Error(`Không thể kết nối đến máy chủ API (${API_BASE}). Vui lòng kiểm tra lại trạng thái Backend.`);
      }

      if (!res.ok) {
        throw new Error(data.error?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại tài khoản.');
      }


      const user = data.data?.user;
      const allowedRoles = ['admin', 'manager', 'staff'];

      // ★ PHÂN QUYỀN VÀO DASHBOARD: Chỉ admin, manager, staff mới được vào
      if (!allowedRoles.includes(user?.role)) {
        throw new Error('Tài khoản của bạn là KHÁCH HÀNG (Customer). Không có quyền truy cập hệ thống Quản Trị Back-Office!');
      }

      // Lưu Token & User vào LocalStorage
      localStorage.setItem('admin_token', data.data.accessToken);
      localStorage.setItem('admin_user', JSON.stringify(user));

      navigate('/');
    } catch (err: any) {
      setErrorMessage(err.message || 'Đã xảy ra lỗi đăng nhập.');
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (email: string, role: string) => {
    form.setFieldsValue({ email, password: 'Admin@123456' });
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(ellipse at center, #1e293b 0%, #0f172a 60%, #090d16 100%)',
        padding: '24px',
        position: 'relative',
      }}
    >
      {/* Decorative Golden Orbs */}
      <div
        style={{
          position: 'absolute',
          width: 300,
          height: 300,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(234, 179, 8, 0.15) 0%, rgba(0, 0, 0, 0) 70%)',
          top: '15%',
          left: '20%',
          filter: 'blur(40px)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 300,
          height: 300,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(180, 83, 9, 0.15) 0%, rgba(0, 0, 0, 0) 70%)',
          bottom: '15%',
          right: '20%',
          filter: 'blur(40px)',
          pointerEvents: 'none',
        }}
      />

      <Card
        style={{
          width: 440,
          background: 'rgba(255, 255, 255, 0.98)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)',
          borderRadius: 20,
          padding: '12px 10px',
          zIndex: 1,
        }}
      >
        {/* Brand Header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 26, textAlign: 'center' }}>
          <div style={{ marginBottom: 12 }}>
            <LuxuryLogo size="lg" collapsed={true} />
          </div>
          <Title level={3} style={{ margin: 0, fontWeight: 800, letterSpacing: '0.08em', color: '#0f172a' }}>
            MN FINE JEWELRY
          </Title>
          <Text style={{ color: '#64748b', fontSize: 12, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: 4 }}>
            Back-Office Management Suite
          </Text>
        </div>



        {errorMessage && (
          <Alert
            message="Không Thể Truy Cập"
            description={errorMessage}
            type="error"
            showIcon
            style={{ marginBottom: 20, borderRadius: 10 }}
          />
        )}

        <Form
          form={form}
          layout="vertical"
          onFinish={handleLogin}
          initialValues={{ email: 'admin@jewelry.com', password: 'Admin@123456' }}
        >
          <Form.Item
            label={<span style={{ fontWeight: 600, color: '#334155' }}>Email Quản Trị</span>}
            name="email"
            rules={[
              { required: true, message: 'Vui lòng nhập Email!' },
              { type: 'email', message: 'Email không hợp lệ!' },
            ]}
          >
            <Input
              prefix={<UserOutlined style={{ color: '#94a3b8' }} />}
              placeholder="admin@jewelry.com"
              size="large"
              style={{ borderRadius: 10 }}
            />
          </Form.Item>

          <Form.Item
            label={<span style={{ fontWeight: 600, color: '#334155' }}>Mật Khẩu Bảo Mật</span>}
            name="password"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#94a3b8' }} />}
              placeholder="••••••••"
              size="large"
              style={{ borderRadius: 10 }}
            />
          </Form.Item>

          <Form.Item style={{ marginTop: 24 }}>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              loading={loading}
              style={{
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                borderColor: '#0f172a',
                height: 48,
                fontWeight: 700,
                fontSize: 15,
                borderRadius: 10,
                boxShadow: '0 4px 14px rgba(15, 23, 42, 0.3)',
              }}
            >
              <SafetyCertificateFilled /> ĐĂNG NHẬP DASHBOARD <ArrowRightOutlined />
            </Button>
          </Form.Item>

          {/* Quick Account Fill Section */}
          <div
            style={{
              background: '#f8fafc',
              padding: '14px 16px',
              borderRadius: 12,
              border: '1px solid #e2e8f0',
              fontSize: 12,
            }}
          >
            <div style={{ fontWeight: 700, color: '#475569', marginBottom: 8 }}>
              Chọn tài khoản đăng nhập nhanh:
            </div>
            <Space wrap size={[6, 6]}>
              <Tag
                color="gold"
                style={{ cursor: 'pointer', padding: '4px 10px', borderRadius: 6, fontWeight: 600 }}
                onClick={() => fillCredentials('admin@jewelry.com', 'Admin')}
              >
                👑 Super Admin
              </Tag>
              <Tag
                color="blue"
                style={{ cursor: 'pointer', padding: '4px 10px', borderRadius: 6, fontWeight: 600 }}
                onClick={() => fillCredentials('manager@jewelry.com', 'Manager')}
              >
                💼 Store Manager
              </Tag>
              <Tag
                color="cyan"
                style={{ cursor: 'pointer', padding: '4px 10px', borderRadius: 6, fontWeight: 600 }}
                onClick={() => fillCredentials('staff@jewelry.com', 'Staff')}
              >
                🏷️ Store Staff
              </Tag>
            </Space>
          </div>
        </Form>
      </Card>
    </div>
  );
}

