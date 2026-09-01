import React, { useState, useEffect } from 'react';
import {
  Card, Table, Tag, Button, Space, Steps, Modal, Select, Input,
  Descriptions, Typography, message, Row, Col, Statistic, Badge
} from 'antd';
import {
  EyeOutlined, SyncOutlined, SearchOutlined, ShoppingCartOutlined,
  CheckCircleOutlined, ClockCircleOutlined, CarOutlined, CloseCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
// ★ API base URL được cấu hình từ biến môi trường (xem src/lib/api.ts)
import { API_BASE, adminFetch } from '../lib/api';
const API = API_BASE;

const statusConfig: Record<string, { color: string; label: string; step: number }> = {
  pending: { color: 'default', label: 'Chờ xác nhận (Hold 15m)', step: 0 },
  confirmed: { color: 'blue', label: 'Đã xác nhận / Đã thanh toán', step: 1 },
  processing: { color: 'orange', label: 'Đang chế tác / Khắc chữ', step: 2 },
  shipping: { color: 'cyan', label: 'Đang giao hàng', step: 3 },
  delivered: { color: 'green', label: 'Đã giao hàng', step: 4 },
  completed: { color: 'green', label: 'Hoàn thành', step: 4 },
  cancelled: { color: 'red', label: 'Đã hủy', step: -1 },
};

export default function OrderPipelinePage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | undefined>(undefined);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });

  // Detail Modal
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Status Update Modal
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<string>('');
  const [statusNote, setStatusNote] = useState<string>('');
  const [updating, setUpdating] = useState(false);

  const token = localStorage.getItem('admin_token');
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const fetchOrders = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      if (filterStatus) params.set('status', filterStatus);

      const res = await fetch(`${API}/orders/admin/list?${params}`, { headers });
      const data = await res.json();
      if (data.success) {
        const list = Array.isArray(data.data) ? data.data : (data.data?.data || []);
        const totalCount = data.meta?.total || data.data?.pagination?.total || list.length;
        setOrders(list);
        setPagination(p => ({ ...p, current: page, total: totalCount }));
      }
    } catch {
      message.error('Lỗi khi tải danh sách đơn hàng');
    } finally {
      setLoading(false);
    }

  };

  useEffect(() => { fetchOrders(); }, [search, filterStatus]);

  const handleOpenDetail = async (record: any) => {
    setDetailLoading(true);
    setDetailModalOpen(true);
    try {
      const res = await fetch(`${API}/orders/${record.order_number}`, { headers });
      const data = await res.json();
      if (data.success) {
        setSelectedOrder(data.data);
      } else {
        setSelectedOrder(record);
      }
    } catch {
      setSelectedOrder(record);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleOpenUpdateStatus = (record: any) => {
    setSelectedOrder(record);
    setNewStatus(record.status);
    setStatusNote('');
    setStatusModalOpen(true);
  };

  const handleConfirmUpdateStatus = async () => {
    if (!selectedOrder || !newStatus) return;
    setUpdating(true);
    try {
      const res = await fetch(`${API}/orders/${selectedOrder.id}/status`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status: newStatus, note: statusNote }),
      });
      const data = await res.json();
      if (data.success) {
        message.success(`Đã cập nhật trạng thái đơn sang ${statusConfig[newStatus]?.label || newStatus}`);
        setStatusModalOpen(false);
        fetchOrders(pagination.current);
      } else {
        message.error(data.error?.message || 'Không thể cập nhật trạng thái.');
      }
    } catch {
      message.error('Lỗi kết nối máy chủ');
    } finally {
      setUpdating(false);
    }
  };

  const columns = [
    {
      title: 'Mã Đơn Hàng',
      dataIndex: 'order_number',
      key: 'order_number',
      render: (v: string) => <code style={{ fontWeight: 700, fontSize: 13, color: '#111' }}>{v}</code>,
    },
    {
      title: 'Khách Hàng',
      render: (_: any, r: any) => {
        const info = typeof r.customer_snapshot === 'string'
          ? (() => { try { return JSON.parse(r.customer_snapshot); } catch { return {}; } })()
          : (r.customer_snapshot || r.customer_info || {});
        return (
          <div>
            <div style={{ fontWeight: 600, color: '#0f172a' }}>{info?.name || 'Khách vãng lai'}</div>
            <div style={{ fontSize: 12, color: '#0284c7' }}>{info?.phone || '—'}</div>
            {info?.email && <div style={{ fontSize: 11, color: '#64748b' }}>{info.email}</div>}
          </div>
        );
      },
    },

    {
      title: 'Tổng Tiền',
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: (v: number) => <span style={{ fontWeight: 'bold', color: '#111' }}>{parseFloat(String(v)).toLocaleString('vi-VN')}₫</span>,
    },
    {
      title: 'Thanh Toán',
      render: (_: any, r: any) => (
        <Space direction="vertical" size={2}>
          <Tag color="blue">{r.payment_method?.toUpperCase() || 'VIETQR'}</Tag>
          <Badge
            status={r.payment_status === 'paid' ? 'success' : 'warning'}
            text={r.payment_status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
          />
        </Space>
      ),
    },
    {
      title: 'Trạng Thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const cfg = statusConfig[status] || { color: 'default', label: status };
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
    {
      title: 'Thời Gian Đặt',
      dataIndex: 'created_at',
      render: (d: string) => dayjs(d).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: 'Hành Động',
      key: 'action',
      render: (_: any, record: any) => (
        <Space size="small">
          <Button size="small" icon={<EyeOutlined />} onClick={() => handleOpenDetail(record)}>
            Chi tiết
          </Button>
          <Button
            size="small"
            type="primary"
            icon={<SyncOutlined />}
            style={{ background: '#111' }}
            onClick={() => handleOpenUpdateStatus(record)}
          >
            Đổi Status
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ── Header Title ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <Title level={4} style={{ margin: 0, fontWeight: 800, color: '#0f172a' }}>
            📦 QUẢN LÝ ĐƠN HÀNG & FULFILLMENT PIPELINE
          </Title>
          <Text style={{ color: '#64748b', fontSize: 13 }}>
            Theo dõi quy trình đặt hàng: Hold tồn kho 15p → Xác nhận VietQR → Chế tác & Khắc chữ → Giao hàng bảo hiểm
          </Text>
        </div>
      </div>

      {/* ── Pipeline Steps Banner ── */}
      <Card className="luxury-card" title={<span style={{ fontWeight: 700 }}>🏆 Quy Trình Xử Lý Đơn Hàng Chuẩn Kim Hoàn</span>}>
        <Steps
          current={2}
          size="small"
          items={[
            { title: '1. Tạo Đơn', description: 'Hold tồn kho 15m' },
            { title: '2. Thanh Toán', description: 'VietQR / Napas247' },
            { title: '3. Chế Tác', description: 'Khắc chữ & Đóng gói' },
            { title: '4. Vận Chuyển', description: 'Bảo hiểm hàng cao cấp' },
            { title: '5. Hoàn Tất', description: 'Kích hoạt E-Warranty' },
          ]}
        />
      </Card>

      {/* ── Orders Table with Filter Toolbar ── */}
      <Card className="luxury-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
          <Space wrap size={12}>
            <Input.Search
              placeholder="Tìm theo mã đơn (TJ-2026...), SĐT khách..."
              onSearch={setSearch}
              style={{ width: 340 }}
              prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
              allowClear
            />
            <Select
              placeholder="Tất cả trạng thái đơn"
              allowClear
              style={{ width: 240 }}
              onChange={setFilterStatus}
              options={[
                { value: undefined as any, label: '✨ Tất cả trạng thái' },
                ...Object.entries(statusConfig).map(([v, c]) => ({ value: v, label: c.label })),
              ]}
            />
          </Space>

          <Tag color="gold" style={{ fontWeight: 600, padding: '4px 12px', borderRadius: 6 }}>
            Tổng: {pagination.total || orders.length} đơn hàng
          </Tag>
        </div>

        <Table
          columns={columns}
          dataSource={orders}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            onChange: (p) => fetchOrders(p),
            showTotal: (t) => `Tổng cộng ${t} đơn hàng`,
          }}
          size="middle"
        />
      </Card>


      {/* Modal Chi Tiết Đơn Hàng */}
      <Modal
        open={detailModalOpen}
        title={`Chi Tiết Đơn Hàng: ${selectedOrder?.order_number}`}
        onCancel={() => setDetailModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalOpen(false)}>Đóng</Button>,
          <Button
            key="status"
            type="primary"
            style={{ background: '#111' }}
            onClick={() => {
              setDetailModalOpen(false);
              handleOpenUpdateStatus(selectedOrder);
            }}
          >
            Cập nhật trạng thái
          </Button>,
        ]}
        width={750}
      >
        {selectedOrder && (() => {
          const custInfo = typeof selectedOrder.customer_snapshot === 'string'
            ? (() => { try { return JSON.parse(selectedOrder.customer_snapshot); } catch { return {}; } })()
            : (selectedOrder.customer_snapshot || {});

          const shipAddr = typeof selectedOrder.shipping_address === 'string'
            ? (() => { try { return JSON.parse(selectedOrder.shipping_address); } catch { return {}; } })()
            : (selectedOrder.shipping_address || {});

          const fullAddr = [
            shipAddr.streetAddress || shipAddr.street,
            shipAddr.ward,
            shipAddr.district,
            shipAddr.province || shipAddr.city,
          ].filter(Boolean).join(', ');

          return (
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              {/* 1. Thông tin tổng quan & Khách hàng */}
              <Descriptions bordered size="small" column={2}>
                <Descriptions.Item label="Mã Đơn Hàng" span={1}>
                  <code style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>{selectedOrder.order_number}</code>
                </Descriptions.Item>
                <Descriptions.Item label="Thời Gian Tạo" span={1}>
                  {dayjs(selectedOrder.created_at).format('DD/MM/YYYY HH:mm:ss')}
                </Descriptions.Item>
                <Descriptions.Item label="Khách Hàng" span={1}>
                  <b style={{ color: '#0f172a', fontSize: 13 }}>{custInfo.name || 'Khách vãng lai'}</b>
                </Descriptions.Item>
                <Descriptions.Item label="Số Điện Thoại" span={1}>
                  <b style={{ color: '#0284c7' }}>{custInfo.phone || '—'}</b>
                </Descriptions.Item>
                <Descriptions.Item label="Email Khách" span={2}>
                  <span style={{ color: '#475569' }}>{custInfo.email || '—'}</span>
                </Descriptions.Item>
                <Descriptions.Item label="Địa Chỉ Giao Hàng" span={2}>
                  <span style={{ color: '#334155', fontWeight: 500 }}>{fullAddr || 'Nhận tại cửa hàng'}</span>
                </Descriptions.Item>
                <Descriptions.Item label="Phương Thức">
                  <Tag color="blue" style={{ fontWeight: 600 }}>{String(selectedOrder.payment_method || 'COD').toUpperCase()}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Trạng Thái TT">
                  <Badge
                    status={selectedOrder.payment_status === 'paid' ? 'success' : 'warning'}
                    text={selectedOrder.payment_status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán (Chờ thu tiền)'}
                  />
                </Descriptions.Item>
                <Descriptions.Item label="Trạng Thái Đơn">
                  <Tag color={statusConfig[selectedOrder.status]?.color} style={{ fontWeight: 700 }}>
                    {statusConfig[selectedOrder.status]?.label || selectedOrder.status}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Tổng Tiền Đơn">
                  <span style={{ fontSize: 16, fontWeight: 'bold', color: '#e11d48' }}>
                    {parseFloat(String(selectedOrder.total_amount || 0)).toLocaleString('vi-VN')}₫
                  </span>
                </Descriptions.Item>
              </Descriptions>

              {/* 2. Danh sách sản phẩm trong đơn kèm ảnh */}
              {selectedOrder.items && selectedOrder.items.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <Text strong style={{ display: 'block', marginBottom: 8, fontSize: 13, color: '#0f172a' }}>
                    Danh Sách Trang Sức ({selectedOrder.items.length} món):
                  </Text>
                  <Table
                    dataSource={selectedOrder.items}
                    rowKey="id"
                    pagination={false}
                    size="small"
                    columns={[
                      {
                        title: 'Sản phẩm',
                        dataIndex: 'product_name_snapshot',
                        render: (name, r: any) => {
                          let cleanImg = r.image_snapshot;
                          if (typeof cleanImg === 'string') {
                            try {
                              const p = JSON.parse(cleanImg);
                              if (typeof p === 'string') cleanImg = p;
                              else if (p && p.url) cleanImg = p.url;
                            } catch {}
                            cleanImg = (cleanImg || '').replace(/^["']|["']$/g, '').trim();
                          }
                          if (!cleanImg || cleanImg === 'null' || !cleanImg.startsWith('http')) {
                            cleanImg = 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800';
                          }
                          return (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <img
                                src={cleanImg}
                                alt={name}
                                style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 6, border: '1px solid #e2e8f0', flexShrink: 0 }}
                              />
                              <div>
                                <b style={{ color: '#0f172a', fontSize: 13 }}>{name}</b>
                                {r.variant_name_snapshot && (
                                  <div style={{ fontSize: 12, color: '#64748b' }}>Phân loại: {r.variant_name_snapshot}</div>
                                )}
                                {r.customization_metadata && (
                                  <Tag color="purple" style={{ marginTop: 4 }}>
                                    ✨ Khắc Laser: "{typeof r.customization_metadata === 'string'
                                      ? (() => { try { return JSON.parse(r.customization_metadata).text; } catch { return r.customization_metadata; } })()
                                      : (r.customization_metadata.text || r.customization_metadata)}"
                                  </Tag>
                                )}
                              </div>
                            </div>
                          );
                        },
                      },
                      {
                        title: 'Số lượng',
                        dataIndex: 'quantity',
                        width: 85,
                        align: 'center',
                        render: (q) => <b>× {q}</b>,
                      },
                      {
                        title: 'Đơn giá',
                        dataIndex: 'price_snapshot',
                        width: 120,
                        align: 'right',
                        render: (p) => <span style={{ fontWeight: 600 }}>{parseFloat(String(p)).toLocaleString('vi-VN')}₫</span>,
                      },
                      {
                        title: 'Thành tiền',
                        width: 130,
                        align: 'right',
                        render: (_: any, r: any) => (
                          <span style={{ fontWeight: 700, color: '#0f172a' }}>
                            {(parseFloat(String(r.price_snapshot || 0)) * (r.quantity || 1)).toLocaleString('vi-VN')}₫
                          </span>
                        ),
                      },
                    ]}
                  />
                </div>
              )}
            </Space>
          );
        })()}

      </Modal>

      {/* Modal Cập Nhật Trạng Thái Đơn Hàng */}
      <Modal
        open={statusModalOpen}
        title={`Chuyển Trạng Thái: ${selectedOrder?.order_number}`}
        onCancel={() => setStatusModalOpen(false)}
        onOk={handleConfirmUpdateStatus}
        confirmLoading={updating}
        okText="Lưu Trạng Thái"
        cancelText="Hủy"
      >
        <Space direction="vertical" size="middle" style={{ width: '100%', marginTop: 12 }}>
          <div>
            <Text strong>Chọn trạng thái tiếp theo:</Text>
            <Select
              value={newStatus}
              onChange={setNewStatus}
              style={{ width: '100%', marginTop: 6 }}
              options={[
                { value: 'pending', label: '1. Chờ xác nhận (Pending)' },
                { value: 'confirmed', label: '2. Đã xác nhận / Đã thanh toán (Confirmed)' },
                { value: 'processing', label: '3. Đang chế tác / Khắc chữ Laser (Processing)' },
                { value: 'shipping', label: '4. Đang giao hàng an toàn (Shipping)' },
                { value: 'delivered', label: '5. Đã giao cho khách (Delivered)' },
                { value: 'completed', label: '6. Hoàn tất đơn & Kích hoạt bảo hành (Completed)' },
                { value: 'cancelled', label: '❌ Hủy đơn hàng (Cancelled)' },
              ]}
            />
          </div>
          <div>
            <Text strong>Ghi chú thay đổi (Sẽ lưu lịch sử và gửi thông báo):</Text>
            <Input.TextArea
              rows={3}
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
              placeholder="VD: Đã hoàn tất khắc chữ laser và chuyển cho đơn vị vận chuyển Viettel Post..."
              style={{ marginTop: 6 }}
            />
          </div>
        </Space>
      </Modal>
    </div>
  );
}


