import React, { useEffect, useState } from 'react';
import {
  Row, Col, Card, Statistic, Table, Tag, Space, Alert, Spin, Button,
  Progress, Avatar, Modal, Descriptions, Badge, Tooltip
} from 'antd';
import {
  DollarOutlined,
  ShoppingOutlined,
  UserOutlined,
  RiseOutlined,
  ClockCircleOutlined,
  SkinOutlined,
  ArrowUpOutlined,
  CrownOutlined,
  EyeOutlined,
  PlusOutlined,
  SafetyCertificateOutlined,
  GiftOutlined,
  ThunderboltOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  CarOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
} from 'recharts';
import { Link } from 'react-router-dom';
import { API_BASE } from '../lib/api';

const API = API_BASE;

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [orderModalOpen, setOrderModalOpen] = useState(false);

  const fetchStats = () => {
    const token = localStorage.getItem('admin_token');
    if (!token) return;

    setLoading(true);
    fetch(`${API}/admin/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.success) {
          setStats(data.data);
        }
      })
      .catch((err) => console.error('Lỗi tải thống kê:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '120px 0' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16, fontWeight: 600, color: '#64748b' }}>
          Đang đồng bộ dữ liệu thời gian thực từ PostgreSQL & Redis...
        </div>
      </div>
    );
  }

  const overview = stats?.overview || {};
  const revenueChart = stats?.revenueChart || [];
  const recentOrders = stats?.recentOrders || [];
  const topProducts = stats?.topProducts || [];

  // Format chart data
  const chartData = revenueChart.map((r: any) => ({
    day: new Date(r.date).toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' }),
    revenue: Number(r.revenue || 0),
    orders: Number(r.orders || 0),
  }));

  const handleOpenOrderDetail = (order: any) => {
    setSelectedOrder(order);
    setOrderModalOpen(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* ─── GREETING & QUICK ACTIONS BAR ────────────────────────────────────── */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          borderRadius: 16,
          padding: '24px 28px',
          color: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.2)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <CrownOutlined style={{ fontSize: 24, color: '#eab308' }} />
            <h2 style={{ margin: 0, color: '#fff', fontSize: 20, fontWeight: 800, letterSpacing: '0.02em' }}>
              Trung Tâm Quản Trị Trang Sức Cao Cấp MN
            </h2>
          </div>

          <p style={{ margin: '6px 0 0 0', color: '#94a3b8', fontSize: 13 }}>
            Hệ thống quản trị hoạt động ổn định • Cập nhật dữ liệu thời gian thực {new Date().toLocaleDateString('vi-VN')}
          </p>
        </div>

        {/* Quick Action Buttons */}
        <Space wrap size={10}>
          <Link to="/products">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              style={{
                background: 'linear-gradient(135deg, #ca8a04 0%, #eab308 100%)',
                borderColor: '#eab308',
                color: '#0f172a',
                fontWeight: 700,
                borderRadius: 8,
              }}
            >
              Thêm Sản Phẩm
            </Button>
          </Link>

          <Link to="/orders">
            <Button
              ghost
              icon={<ShoppingOutlined />}
              style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.3)', borderRadius: 8 }}
            >
              Xử Lý Đơn Hàng
            </Button>
          </Link>

          <Link to="/vouchers">
            <Button
              ghost
              icon={<GiftOutlined />}
              style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.3)', borderRadius: 8 }}
            >
              Phát Hành Voucher
            </Button>
          </Link>
        </Space>
      </div>

      {/* ─── 4 LUXURY KPI STAT CARDS ────────────────────────────────────────── */}
      <Row gutter={[18, 18]}>
        {/* Stat 1: Doanh thu */}
        <Col xs={24} sm={12} lg={6}>
          <div className="luxury-stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Doanh Thu Tháng
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: '8px 0 4px', letterSpacing: '-0.02em' }}>
                  {Number(overview.totalRevenue || 0).toLocaleString('vi-VN')} <span style={{ fontSize: 15, fontWeight: 600, color: '#b45309' }}>₫</span>
                </div>
              </div>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#92400e',
                  fontSize: 20,
                }}
              >
                <DollarOutlined />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: 12 }}>
              <Tag color="success" style={{ margin: 0, fontWeight: 700, borderRadius: 4 }}>
                <ArrowUpOutlined /> +18.2%
              </Tag>
              <span style={{ color: '#64748b' }}>Đơn thanh toán thành công</span>
            </div>
          </div>
        </Col>

        {/* Stat 2: Tổng đơn hàng */}
        <Col xs={24} sm={12} lg={6}>
          <div className="luxury-stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Tổng Đơn Hàng
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: '8px 0 4px', letterSpacing: '-0.02em' }}>
                  {overview.totalOrders || 0} <span style={{ fontSize: 14, fontWeight: 600, color: '#64748b' }}>đơn</span>
                </div>
              </div>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#1e40af',
                  fontSize: 20,
                }}
              >
                <ShoppingOutlined />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: 12 }}>
              <Tag color="warning" style={{ margin: 0, fontWeight: 700, borderRadius: 4 }}>
                {overview.pendingOrders || 0} Đang Chờ
              </Tag>
              <span style={{ color: '#64748b' }}>{overview.processingOrders || 0} đang chế tác</span>
            </div>
          </div>
        </Col>

        {/* Stat 3: Sản phẩm đang bán */}
        <Col xs={24} sm={12} lg={6}>
          <div className="luxury-stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Sản Phẩm Trực Tuyến
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: '8px 0 4px', letterSpacing: '-0.02em' }}>
                  {overview.totalProducts || 0} <span style={{ fontSize: 14, fontWeight: 600, color: '#64748b' }}>mẫu</span>
                </div>
              </div>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#065f46',
                  fontSize: 20,
                }}
              >
                <SkinOutlined />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: 12 }}>
              <Tag color="cyan" style={{ margin: 0, fontWeight: 700, borderRadius: 4 }}>PIM 100% Sẵn Sàng</Tag>
              <span style={{ color: '#64748b' }}>Catalog kim hoàn</span>
            </div>
          </div>
        </Col>

        {/* Stat 4: Khách hàng mới */}
        <Col xs={24} sm={12} lg={6}>
          <div className="luxury-stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Khách Hàng Đăng Ký
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: '8px 0 4px', letterSpacing: '-0.02em' }}>
                  {overview.newUsers || 0} <span style={{ fontSize: 14, fontWeight: 600, color: '#64748b' }}>thành viên</span>
                </div>
              </div>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#6d28d9',
                  fontSize: 20,
                }}
              >
                <UserOutlined />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: 12 }}>
              <Tag color="purple" style={{ margin: 0, fontWeight: 700, borderRadius: 4 }}>VIP & Loyalty</Tag>
              <span style={{ color: '#64748b' }}>Tài khoản đã kích hoạt</span>
            </div>
          </div>
        </Col>
      </Row>

      {/* ─── REVENUE CHART & TOP SELLING PRODUCTS ──────────────────────────── */}
      <Row gutter={[20, 20]}>
        {/* Biểu đồ doanh thu 7 ngày */}
        <Col xs={24} lg={15}>
          <Card
            className="luxury-card"
            title={
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ca8a04' }} />
                  <span style={{ fontWeight: 700, fontSize: 15 }}>Biểu Đồ Doanh Thu 7 Ngày Gần Nhất</span>
                </div>
                <Tag color="gold" style={{ fontWeight: 600 }}>Realtime Sync</Tag>
              </div>
            }
          >
            {chartData.length > 0 ? (
              <div style={{ width: '100%', height: 320, marginTop: 10 }}>
                <ResponsiveContainer>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ca8a04" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#ca8a04" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="day"
                      tick={{ fill: '#64748b', fontSize: 12 }}
                      axisLine={{ stroke: '#e2e8f0' }}
                      tickLine={false}
                    />
                    <YAxis
                      tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`}
                      tick={{ fill: '#64748b', fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <RechartsTooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div
                              style={{
                                background: '#0f172a',
                                color: '#ffffff',
                                padding: '10px 14px',
                                borderRadius: 10,
                                boxShadow: '0 10px 20px rgba(0,0,0,0.2)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                fontSize: 12,
                              }}
                            >
                              <div style={{ fontWeight: 700, color: '#facc15', marginBottom: 4 }}>{label}</div>
                              <div>
                                Doanh thu: <b>{Number(payload[0].value).toLocaleString('vi-VN')} ₫</b>
                              </div>
                              <div style={{ color: '#94a3b8' }}>
                                Số đơn hàng: <b>{payload[0].payload.orders} đơn</b>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#ca8a04"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#revenueGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
                Chưa có dữ liệu doanh thu trong khoảng thời gian này.
              </div>
            )}
          </Card>
        </Col>

        {/* Top Sản Phẩm Bán Chạy */}
        <Col xs={24} lg={9}>
          <Card
            className="luxury-card"
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CrownOutlined style={{ color: '#eab308' }} />
                <span style={{ fontWeight: 700, fontSize: 15 }}>Top Trang Sức Bán Chạy</span>
              </div>
            }
          >
            {topProducts.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {topProducts.map((item: any, idx: number) => {
                  const medalColors = ['#eab308', '#94a3b8', '#b45309'];
                  return (
                    <div
                      key={item.name || idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 10px',
                        borderRadius: 8,
                        background: idx === 0 ? '#fefce8' : '#f8fafc',
                        border: idx === 0 ? '1px solid #fef08a' : '1px solid #f1f5f9',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, overflow: 'hidden' }}>
                        <div
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: '50%',
                            background: medalColors[idx] || '#e2e8f0',
                            color: idx < 3 ? '#fff' : '#64748b',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: 12,
                            flexShrink: 0,
                          }}
                        >
                          {idx + 1}
                        </div>
                        <div style={{ overflow: 'hidden' }}>
                          <div style={{ fontWeight: 600, fontSize: 13, color: '#0f172a', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                            {item.name}
                          </div>
                          <div style={{ fontSize: 11, color: '#64748b' }}>
                            Đã bán: <b style={{ color: '#0f172a' }}>{item.sold}</b> chiếc
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: '#b45309' }}>
                          {Number(item.revenue).toLocaleString('vi-VN')} ₫
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '50px 0', color: '#94a3b8' }}>
                Chưa có dữ liệu sản phẩm hoàn tất.
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* ─── RECENT ORDERS TABLE ────────────────────────────────────────────── */}
      <Card
        className="luxury-card"
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShoppingOutlined style={{ color: '#1e40af' }} />
              <span style={{ fontWeight: 700, fontSize: 15 }}>Đơn Hàng Gần Đây Cần Theo Dõi</span>
            </div>
            <Link to="/orders">
              <Button type="link" style={{ fontWeight: 600, padding: 0 }}>
                Xem Tất Cả ({overview.totalOrders || 0} đơn) →
              </Button>
            </Link>
          </div>
        }
      >
        <Table
          dataSource={recentOrders}
          rowKey="id"
          pagination={false}
          size="middle"
          columns={[
            {
              title: 'Mã Đơn Hàng',
              dataIndex: 'order_number',
              key: 'order_number',
              render: (v) => (
                <code
                  style={{
                    background: '#f1f5f9',
                    padding: '4px 8px',
                    borderRadius: 6,
                    fontWeight: 700,
                    fontSize: 12,
                    color: '#0f172a',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  {v}
                </code>
              ),
            },
            {
              title: 'Khách Hàng',
              dataIndex: 'customer_snapshot',
              key: 'customer_snapshot',
              render: (c) => {
                const info = typeof c === 'string' ? JSON.parse(c || '{}') : c || {};
                return (
                  <div>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{info.name || 'Khách Vãng Lai'}</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>{info.phone || '—'}</div>
                  </div>
                );
              },
            },
            {
              title: 'Tổng Giá Trị',
              dataIndex: 'total_amount',
              key: 'total_amount',
              render: (v) => (
                <span style={{ fontWeight: 700, color: '#0f172a' }}>
                  {Number(v).toLocaleString('vi-VN')} ₫
                </span>
              ),
            },
            {
              title: 'Phương Thức',
              dataIndex: 'payment_method',
              key: 'payment_method',
              render: (v) => (
                <Tag color={v === 'vietqr' ? 'purple' : v === 'vnpay' ? 'blue' : 'default'} style={{ fontWeight: 600 }}>
                  {String(v || 'COD').toUpperCase()}
                </Tag>
              ),
            },
            {
              title: 'Thanh Toán',
              dataIndex: 'payment_status',
              key: 'payment_status',
              render: (v) => (
                <Tag color={v === 'paid' ? 'green' : 'gold'} style={{ fontWeight: 600 }}>
                  {v === 'paid' ? 'ĐÃ THANH TOÁN' : 'CHỜ THANH TOÁN'}
                </Tag>
              ),
            },
            {
              title: 'Trạng Thái Đơn',
              dataIndex: 'status',
              key: 'status',
              render: (status) => {
                const statusMap: Record<string, { color: string; label: string }> = {
                  pending: { color: 'gold', label: 'CHỜ XÁC NHẬN' },
                  confirmed: { color: 'blue', label: 'ĐÃ XÁC NHẬN' },
                  processing: { color: 'orange', label: 'ĐANG CHẾ TÁC' },
                  shipping: { color: 'cyan', label: 'ĐANG GIAO' },
                  delivered: { color: 'green', label: 'ĐÃ GIAO HÀNG' },
                  completed: { color: 'green', label: 'HOÀN THÀNH' },
                  cancelled: { color: 'red', label: 'ĐÃ HỦY' },
                };
                const config = statusMap[status] || { color: 'default', label: String(status).toUpperCase() };
                return <Tag color={config.color} style={{ fontWeight: 700 }}>{config.label}</Tag>;
              },
            },
            {
              title: 'Thời Gian',
              dataIndex: 'created_at',
              key: 'created_at',
              render: (d) => <span style={{ fontSize: 12, color: '#64748b' }}>{new Date(d).toLocaleString('vi-VN')}</span>,
            },
            {
              title: 'Thao Tác',
              key: 'actions',
              align: 'center',
              render: (_: any, r: any) => (
                <Button
                  type="text"
                  icon={<EyeOutlined />}
                  onClick={() => handleOpenOrderDetail(r)}
                  style={{ color: '#0284c7' }}
                >
                  Xem
                </Button>
              ),
            },
          ]}
        />
      </Card>

      {/* ─── QUICK ORDER DETAIL MODAL ───────────────────────────────────────── */}
      <Modal
        title={`Chi Tiết Đơn Hàng #${selectedOrder?.order_number}`}
        open={orderModalOpen}
        onCancel={() => setOrderModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setOrderModalOpen(false)}>
            Đóng
          </Button>,
          <Link key="pipeline" to="/orders" onClick={() => setOrderModalOpen(false)}>
            <Button type="primary" style={{ background: '#b45309', borderColor: '#b45309' }}>
              Mở Trang Xử Lý Đơn Hàng →
            </Button>
          </Link>,
        ]}
      >
        {selectedOrder && (
          <Descriptions bordered size="small" column={1} style={{ marginTop: 12 }}>
            <Descriptions.Item label="Mã Đơn">{selectedOrder.order_number}</Descriptions.Item>
            <Descriptions.Item label="Khách Hàng">
              {(() => {
                const info = typeof selectedOrder.customer_snapshot === 'string'
                  ? JSON.parse(selectedOrder.customer_snapshot || '{}')
                  : selectedOrder.customer_snapshot || {};
                return `${info.name || 'Khách vãng lai'} - SĐT: ${info.phone || '—'} - Email: ${info.email || '—'}`;
              })()}
            </Descriptions.Item>
            <Descriptions.Item label="Tổng Tiền">
              <b style={{ color: '#b45309', fontSize: 15 }}>
                {Number(selectedOrder.total_amount).toLocaleString('vi-VN')} ₫
              </b>
            </Descriptions.Item>
            <Descriptions.Item label="Phương Thức Thanh Toán">
              <Tag color="blue">{String(selectedOrder.payment_method || 'COD').toUpperCase()}</Tag> (
              {selectedOrder.payment_status === 'paid' ? 'Đã thanh toán' : 'Chờ thanh toán'})
            </Descriptions.Item>
            <Descriptions.Item label="Trạng Thái">{String(selectedOrder.status).toUpperCase()}</Descriptions.Item>
            <Descriptions.Item label="Ngày Tạo">
              {new Date(selectedOrder.created_at).toLocaleString('vi-VN')}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}


