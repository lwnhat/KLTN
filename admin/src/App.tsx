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
    <Layout hasSider style={{ minHeight: '100vh', background: 'var(--soft-cloud)' }}>
      {/* ── SIDEBAR: Storefront ink-black editorial style ────────────────────── */}
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        width={252}
        style={{
          background: 'linear-gradient(180deg, #111111 0%, #1a1a1a 100%)',
          boxShadow: '2px 0 12px rgba(0,0,0,0.18)',
          zIndex: 100,
          position: 'sticky',
          top: 0,
          left: 0,
          height: '100vh',
          maxHeight: '100vh',
        }}
      >
        {/* Brand Identity Block */}
        <div
          style={{
            padding: collapsed ? '16px 8px' : '18px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: 10,
            borderBottom: '1px solid rgba(255,255,255,0.07)',
            marginBottom: 8,
            transition: 'all 0.25s ease',
            flexShrink: 0,
          }}
        >
          {/* Diamond icon */}
          <div style={{
            width: collapsed ? 34 : 32,
            height: collapsed ? 34 : 32,
            borderRadius: collapsed ? '50%' : 8,
            background: 'linear-gradient(135deg, #d4af37 0%, #b45309 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 2px 8px rgba(212,175,55,0.35)',
            fontSize: 15,
            transition: 'all 0.25s ease',
          }}>💎</div>

          {!collapsed && (
            <div style={{ overflow: 'hidden' }}>
              <div style={{
                fontFamily: "'Bebas Neue', Futura, sans-serif",
                fontSize: 15,
                letterSpacing: '0.12em',
                color: '#ffffff',
                lineHeight: 1.1,
                textTransform: 'uppercase',
              }}>DANIEL WELLINGTON</div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: 1 }}>Admin Console</div>
            </div>
          )}
        </div>

        {/* Sidebar Navigation Menu */}
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems as any}
          style={{
            background: 'transparent',
            padding: '4px 8px',
            fontSize: 13,
            fontWeight: 500,
            flex: 1,
            overflowY: 'auto',
          }}
        />

        {/* User Profile Card — bottom of sidebar */}
        {!collapsed && (
          <div
            style={{
              margin: '12px',
              marginTop: 'auto',
              marginBottom: 44,
              padding: '11px 13px',
              borderRadius: 10,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              flexShrink: 0,
            }}
          >
            <Avatar
              icon={<UserOutlined />}
              size={32}
              style={{
                background: 'linear-gradient(135deg, #111111 0%, #39393b 100%)',
                border: '1.5px solid rgba(212,175,55,0.5)',
                flexShrink: 0,
              }}
            />
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <div style={{ color: '#fff', fontSize: 12.5, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3 }}>
                {user.fullName || 'Admin'}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3 }}>
                {user.email}
              </div>
            </div>
          </div>
        )}
      </Sider>

      <Layout style={{ minWidth: 0, background: 'var(--soft-cloud)', display: 'flex', flexDirection: 'column' }}>

        {/* ── TOPBAR: Storefront canvas/hairline style ────────────────────────── */}
        <Header
          style={{
            background: 'var(--canvas)',
            padding: '0 24px',
            height: 58,
            lineHeight: 'normal',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid var(--hairline-soft)',
            boxShadow: 'none',
            position: 'sticky',
            top: 0,
            zIndex: 9,
          }}
        >
          {/* Left: Page title + live status chip */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div>
              <div style={{
                fontFamily: "'Inter', sans-serif",
                fontWeight: 700,
                fontSize: 14,
                color: 'var(--ink)',
                lineHeight: 1.3,
                letterSpacing: '-0.01em',
              }}>
                Hệ Thống Quản Trị Kim Hoàn
              </div>
              <div style={{ fontSize: 11, color: 'var(--mute)', lineHeight: 1.3 }}>
                Daniel Wellington · Back-Office Suite
              </div>
            </div>

            {/* Live status pill */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '3px 10px',
              borderRadius: 999,
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--success)',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)', display: 'inline-block', animation: 'pulse 2s infinite' }} />
              PostgreSQL · Redis
            </div>
          </div>

          {/* Right: actions */}
          <Space size={10} style={{ display: 'flex', alignItems: 'center' }}>
            <Tooltip title="Tải lại">
              <Button
                type="text"
                icon={<ReloadOutlined />}
                onClick={() => window.location.reload()}
                style={{ color: 'var(--stone)', height: 34, width: 34, padding: 0 }}
              />
            </Tooltip>

            {/* View storefront */}
            <Button
              type="default"
              icon={<ShopOutlined />}
              href="https://kltn-ashy.vercel.app"
              target="_blank"
              style={{
                borderColor: 'var(--hairline)',
                background: 'var(--canvas)',
                color: 'var(--ink)',
                fontWeight: 600,
                fontSize: 12,
                height: 34,
              }}
            >
              Xem Storefront ↗
            </Button>

            <Badge count={0} offset={[-2, 2]}>
              <Button
                type="text"
                shape="circle"
                icon={<BellOutlined style={{ fontSize: 16, color: 'var(--ash)' }} />}
                style={{ height: 34, width: 34 }}
              />
            </Badge>

            {/* Divider */}
            <div style={{ width: 1, height: 20, background: 'var(--hairline-soft)' }} />

            {/* User pill */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              padding: '3px 12px 3px 5px',
              borderRadius: 999,
              background: 'var(--soft-cloud)',
              border: '1px solid var(--hairline-soft)',
            }}>
              <Avatar
                size={26}
                icon={<UserOutlined />}
                style={{ background: 'var(--ink)', flexShrink: 0 }}
              />
              <div style={{ lineHeight: 1.1 }}>
                <Text strong style={{ fontSize: 12, display: 'block', lineHeight: 1.2, color: 'var(--ink)' }}>
                  {user.fullName || 'Admin'}
                </Text>
                <span style={{
                  fontSize: 9,
                  fontWeight: 700,
                  color: currentRole.color,
                  letterSpacing: '0.05em',
                  lineHeight: 1,
                  textTransform: 'uppercase',
                }}>
                  {currentRole.label}
                </span>
              </div>
            </div>

            {/* Logout */}
            <Popconfirm
              title="Đăng xuất khỏi hệ thống?"
              description="Bạn sẽ cần đăng nhập lại để tiếp tục quản trị."
              onConfirm={handleLogout}
              okText="Đăng xuất"
              cancelText="Hủy"
              okButtonProps={{ style: { background: 'var(--ink)', borderColor: 'var(--ink)' } }}
            >
              <Button
                type="text"
                icon={<LogoutOutlined />}
                style={{ fontWeight: 600, fontSize: 12, color: 'var(--ash)' }}
              >
                Đăng xuất
              </Button>
            </Popconfirm>
          </Space>
        </Header>

        {/* ── MAIN CONTENT AREA ──────────────────────────────────────────────── */}
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
