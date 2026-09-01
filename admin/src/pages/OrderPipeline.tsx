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
        const info = typeof r.customer_info === 'string' ? JSON.parse(r.customer_info || '{}') : r.customer_info;
        return (
          <div>
            <div style={{ fontWeight: 600 }}>{info?.name || r.customer_name || 'Khách vãng lai'}</div>
            <div style={{ fontSize: 12, color: '#707072' }}>{info?.phone || r.customer_phone || '—'}</div>
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
        {selectedOrder && (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="Mã Đơn">{selectedOrder.order_number}</Descriptions.Item>
              <Descriptions.Item label="Ngày Tạo">
                {dayjs(selectedOrder.created_at).format('DD/MM/YYYY HH:mm:ss')}
              </Descriptions.Item>
              <Descriptions.Item label="Trạng Thái">
                <Tag color={statusConfig[selectedOrder.status]?.color}>
                  {statusConfig[selectedOrder.status]?.label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Thanh Toán">
                <Tag color="blue">{selectedOrder.payment_method?.toUpperCase()}</Tag> ({selectedOrder.payment_status})
              </Descriptions.Item>
              <Descriptions.Item label="Tổng Tiền" span={2}>
                <span style={{ fontSize: 16, fontWeight: 'bold', color: '#111' }}>
                  {parseFloat(String(selectedOrder.total_amount || 0)).toLocaleString('vi-VN')}₫
                </span>
              </Descriptions.Item>
            </Descriptions>

            {/* Danh sách sản phẩm trong đơn */}
            {selectedOrder.items && selectedOrder.items.length > 0 && (
              <div>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>Sản Phẩm Đã Đặt:</Text>
                <Table
                  dataSource={selectedOrder.items}
                  rowKey="id"
                  pagination={false}
                  size="small"
                  columns={[
                    {
                      title: 'Sản phẩm',
                      dataIndex: 'product_name_snapshot',
                      render: (name, r: any) => (
                        <div>
                          <b>{name}</b>
                          {r.variant_name_snapshot && <div style={{ fontSize: 12, color: '#666' }}>{r.variant_name_snapshot}</div>}
                          {r.customization_metadata && (
                            <Tag color="purple" style={{ marginTop: 4 }}>
                              ✏️ Khắc: "{r.customization_metadata.text || r.customization_metadata}"
                            </Tag>
                          )}
                        </div>
                      ),
                    },
                    { title: 'Số lượng', dataIndex: 'quantity', width: 80 },
                    {
                      title: 'Đơn giá',
                      dataIndex: 'price_snapshot',
                      render: (p) => `${parseFloat(String(p)).toLocaleString('vi-VN')}₫`,
                    },
                  ]}
                />
              </div>
            )}
          </Space>
        )}
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


