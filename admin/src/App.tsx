import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { Layout, Menu, Typography, Avatar, Badge, Space, Button, Tag, Popconfirm, Tooltip } from 'antd';
import {
  DashboardOutlined,
  ShoppingOutlined,
  OrderedListOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
  LogoutOutlined,
  BellOutlined,
  ShopOutlined,
  GiftOutlined,
  TeamOutlined,
  StarOutlined,
  CrownOutlined,
  ReloadOutlined,
  CheckCircleFilled,
} from '@ant-design/icons';
import DashboardPage from './pages/Dashboard';
import ProductMasterVariantPage from './pages/ProductMasterVariantPage';
import OrderPipelinePage from './pages/OrderPipeline';
import LoginPage from './pages/LoginPage';
import WarrantyManagementPage from './pages/WarrantyManagementPage';
import VoucherManagementPage from './pages/VoucherManagementPage';
import UserManagementPage from './pages/UserManagementPage';
import ReviewManagementPage from './pages/ReviewManagementPage';
import LuxuryLogo from './components/LuxuryLogo';

const { Header, Sider, Content } = Layout;

const { Text } = Typography;

// ─── AUTH GUARD COMPONENT (PHÂN QUYỀN TRUY CẬP) ──────────────────────────────
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('admin_token');
  const userStr = localStorage.getItem('admin_user');
  let user = null;
  try {
    user = userStr ? JSON.parse(userStr) : null;
  } catch {
    user = null;
  }

  const allowedRoles = ['admin', 'manager', 'staff'];
  if (!token || !user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// ─── ADMIN MAIN LAYOUT ────────────────────────────────────────────────────────
function AdminLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const userStr = localStorage.getItem('admin_user');
  const user = userStr ? JSON.parse(userStr) : { fullName: 'Super Admin', role: 'admin', email: 'admin@jewelry.com' };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    navigate('/login');
  };

  const roleTagConfig: Record<string, { color: string; label: string }> = {
    admin: { color: '#991b1b', label: 'SUPER ADMIN' },
    manager: { color: '#854d0e', label: 'STORE MANAGER' },
    staff: { color: '#1e40af', label: 'STAFF' },
  };

  const currentRole = roleTagConfig[user.role as string] || { color: '#334155', label: 'USER' };

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined style={{ fontSize: 16 }} />,
      label: <Link to="/">Tổng Quan Dashboard</Link>,
    },
    {
      key: '/products',
      icon: <ShoppingOutlined style={{ fontSize: 16 }} />,
      label: <Link to="/products">Quản Lý Sản Phẩm (PIM)</Link>,
    },
    {
      key: '/orders',
      icon: <OrderedListOutlined style={{ fontSize: 16 }} />,
      label: <Link to="/orders">Quy Trình Đơn Hàng</Link>,
    },
    {
      key: '/warranties',
      icon: <SafetyCertificateOutlined style={{ fontSize: 16 }} />,
      label: <Link to="/warranties">Bảo Hành & Chứng Chỉ</Link>,
    },
    {
      key: '/vouchers',
      icon: <GiftOutlined style={{ fontSize: 16 }} />,
      label: <Link to="/vouchers">Voucher & Khuyến Mãi</Link>,
    },
    {
      key: '/users',
      icon: <TeamOutlined style={{ fontSize: 16 }} />,
      label: <Link to="/users">Tài Khoản & Phân Quyền</Link>,
    },
    {
      key: '/reviews',
      icon: <StarOutlined style={{ fontSize: 16 }} />,
      label: <Link to="/reviews">Đánh Giá & Feedback</Link>,
    },
    {
      type: 'divider',
      style: { borderColor: 'rgba(255, 255, 255, 0.1)', margin: '12px 16px' },
    },
    {
      key: 'storefront',
      icon: <ShopOutlined style={{ color: '#eab308', fontSize: 16 }} />,
      label: (
        <a href="http://localhost:3000" target="_blank" rel="noopener noreferrer" style={{ color: '#fde047', fontWeight: 600 }}>
          Trang Bán Hàng Shop ↗
        </a>
      ),
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh', background: '#f8fafc' }}>
      {/* LUXURY DARK SIDER */}
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        width={250}
        style={{
          background: 'linear-gradient(180deg, #0b0f19 0%, #0f172a 60%, #1e293b 100%)',
          boxShadow: '4px 0 20px rgba(0, 0, 0, 0.15)',
          zIndex: 10,
        }}
      >
        {/* Brand Logo Banner */}
        <div
          style={{
            padding: collapsed ? '18px 8px' : '20px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            marginBottom: 12,
            transition: 'all 0.3s ease',
          }}
        >
          <LuxuryLogo size="md" collapsed={collapsed} />
        </div>



        {/* Sidebar Menu */}
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems as any}
          style={{
            background: 'transparent',
            padding: '0 8px',
            fontSize: 13,
            fontWeight: 500,
          }}
        />

        {/* User Card in Sidebar Bottom (when not collapsed) */}
        {!collapsed && (
          <div
            style={{
              position: 'absolute',
              bottom: 50,
              left: 12,
              right: 12,
              padding: '12px 14px',
              borderRadius: 10,
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <Avatar
              icon={<UserOutlined />}
              style={{
                background: 'linear-gradient(135deg, #b45309 0%, #d97706 100%)',
                boxShadow: '0 2px 8px rgba(180, 83, 9, 0.4)',
              }}
            />
            <div style={{ overflow: 'hidden' }}>
              <div style={{ color: '#fff', fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.fullName || 'Admin'}
              </div>
              <div style={{ color: '#94a3b8', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.email}
              </div>
            </div>
          </div>
        )}
      </Sider>

      <Layout style={{ background: '#f8fafc' }}>
        {/* LUXURY TOP HEADER */}
        <Header
          style={{
            background: '#ffffff',
            padding: '0 24px',
            minHeight: 64,
            height: 'auto',
            lineHeight: 'normal',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
            position: 'sticky',
            top: 0,
            zIndex: 9,
            paddingTop: 10,
            paddingBottom: 10,
          }}
        >
          {/* Left Title & Status Indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a', lineHeight: 1.3 }}>
                Hệ Thống Quản Trị Kim Hoàn Cao Cấp
              </div>
              <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.3 }}>
                MN Fine Jewelry Back-Office Management Suite
              </div>

            </div>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 10px',
                borderRadius: 999,
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                fontSize: 11,
                fontWeight: 600,
                color: '#15803d',
                lineHeight: 1.2,
              }}
            >
              <CheckCircleFilled style={{ color: '#16a34a' }} /> Realtime PostgreSQL & Redis
            </div>
          </div>

          {/* Right Action Bar */}
          <Space size={14} style={{ display: 'flex', alignItems: 'center' }}>
            <Tooltip title="Tải lại dữ liệu">
              <Button
                type="text"
                icon={<ReloadOutlined />}
                onClick={() => window.location.reload()}
                style={{ color: '#64748b' }}
              />
            </Tooltip>

            {/* Quick Storefront Button */}
            <Button
              type="default"
              icon={<ShopOutlined style={{ color: '#b45309' }} />}
              href="http://localhost:3000"
              target="_blank"
              style={{
                borderColor: '#fed7aa',
                background: '#fffaf5',
                color: '#9a3412',
                fontWeight: 600,
                fontSize: 12,
                height: 34,
              }}
            >
              Xem Storefront
            </Button>

            <Badge count={3} offset={[-2, 2]}>
              <Button
                type="text"
                shape="circle"
                icon={<BellOutlined style={{ fontSize: 17, color: '#475569' }} />}
              />
            </Badge>

            <div style={{ width: 1, height: 22, background: '#e2e8f0' }} />

            {/* User Profile Badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '4px 10px 4px 6px',
                borderRadius: 24,
                background: '#f1f5f9',
                border: '1px solid #e2e8f0',
              }}
            >
              <Avatar
                size={28}
                icon={<UserOutlined />}
                style={{
                  background: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)',
                }}
              />
              <div style={{ lineHeight: 1.1 }}>
                <Text strong style={{ fontSize: 12, display: 'block', lineHeight: 1.2 }}>
                  {user.fullName || 'Admin'}
                </Text>
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    color: currentRole.color,
                    letterSpacing: '0.04em',
                    lineHeight: 1,
                  }}
                >
                  {currentRole.label}
                </span>
              </div>
            </div>

            {/* Logout Popconfirm */}
            <Popconfirm
              title="Đăng xuất khỏi hệ thống?"
              description="Bạn sẽ cần đăng nhập lại để tiếp tục quản trị."
              onConfirm={handleLogout}
              okText="Đăng xuất"
              cancelText="Hủy"
              okButtonProps={{ danger: true }}
            >
              <Button
                type="text"
                danger
                icon={<LogoutOutlined />}
                style={{ fontWeight: 600, fontSize: 12 }}
              >
                Đăng xuất
              </Button>
            </Popconfirm>
          </Space>
        </Header>

        {/* MAIN BODY CONTENT */}
        <Content style={{ margin: '20px 24px', minHeight: 'calc(100vh - 120px)' }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <Routes>
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/products" element={<ProductMasterVariantPage />} />
                  <Route path="/orders" element={<OrderPipelinePage />} />
                  <Route path="/warranties" element={<WarrantyManagementPage />} />
                  <Route path="/vouchers" element={<VoucherManagementPage />} />
                  <Route path="/users" element={<UserManagementPage />} />
                  <Route path="/reviews" element={<ReviewManagementPage />} />
                  <Route path="*" element={<DashboardPage />} />
                </Routes>
              </AdminLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}
