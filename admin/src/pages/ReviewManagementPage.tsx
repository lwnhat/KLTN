import React, { useState, useEffect } from 'react';
import {
  Table, Tag, Button, Space, Typography, message, Popconfirm, Rate, Card, Select
} from 'antd';
import {
  StarOutlined, CheckOutlined, DeleteOutlined, UserOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
// ★ API base URL được cấu hình từ biến môi trường (xem src/lib/api.ts)
import { API_BASE, adminFetch } from '../lib/api';
const API = API_BASE;

export default function ReviewManagementPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterApproved, setFilterApproved] = useState<string | undefined>(undefined);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });

  const token = localStorage.getItem('admin_token');
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const fetchReviews = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (filterApproved !== undefined) params.set('approved', filterApproved);

      const res = await fetch(`${API}/admin/reviews?${params}`, { headers });
      const data = await res.json();
      if (data.success) {
        setReviews(data.data?.data || data.data || []);
        setPagination((p) => ({ ...p, current: page, total: data.data?.pagination?.total || data.meta?.total || 0 }));
      }
    } catch {
      message.error('Không thể tải danh sách đánh giá.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [filterApproved]);

  const handleApprove = async (id: string) => {
    try {
      const res = await fetch(`${API}/reviews/${id}/approve`, {
        method: 'PUT',
        headers,
      });
      const data = await res.json();
      if (data.success) {
        message.success('Đã duyệt đánh giá thành công!');
        fetchReviews(pagination.current);
      } else {
        message.error(data.error?.message || 'Lỗi khi duyệt');
      }
    } catch {
      message.error('Lỗi kết nối');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`${API}/reviews/${id}`, {
        method: 'DELETE',
        headers,
      });
      const data = await res.json();
      if (data.success) {
        message.success('Đã xóa đánh giá');
        fetchReviews(pagination.current);
      }
    } catch {
      message.error('Lỗi khi xóa');
    }
  };

  const columns = [
    {
      title: 'Sản phẩm',
      dataIndex: 'product_name',
      key: 'product_name',
      render: (name: string) => <b>{name || 'Sản phẩm'}</b>,
    },
    {
      title: 'Khách hàng',
      render: (_: any, r: any) => (
        <div>
          <div style={{ fontWeight: 600 }}>{r.reviewer_name || 'Khách hàng'}</div>
          <div style={{ fontSize: 11, color: '#8c8c8c' }}>{r.reviewer_email || '—'}</div>
        </div>
      ),
    },
    {
      title: 'Đánh giá',
      dataIndex: 'rating',
      key: 'rating',
      width: 140,
      render: (stars: number) => <Rate disabled defaultValue={stars} style={{ fontSize: 13 }} />,
    },
    {
      title: 'Nội dung nhận xét',
      render: (_: any, r: any) => (
        <div style={{ maxWidth: 360 }}>
          {r.title && <div style={{ fontWeight: 600, fontSize: 13 }}>{r.title}</div>}
          <div style={{ fontSize: 12, color: '#595959', marginTop: 2 }}>{r.body}</div>
        </div>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'is_approved',
      key: 'is_approved',
      width: 130,
      render: (approved: boolean) => (
        <Tag color={approved ? 'green' : 'orange'}>
          {approved ? '✓ Đã duyệt' : '⏳ Chờ duyệt'}
        </Tag>
      ),
    },
    {
      title: 'Thời gian',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 140,
      render: (d: string) => new Date(d).toLocaleDateString('vi-VN'),
    },
    {
      title: 'Hành động',
      key: 'actions',
      width: 150,
      render: (_: any, r: any) => (
        <Space size="small">
          {!r.is_approved && (
            <Button
              type="primary"
              size="small"
              icon={<CheckOutlined />}
              onClick={() => handleApprove(r.id)}
              style={{ background: '#52c41a', borderColor: '#52c41a' }}
            >
              Duyệt
            </Button>
          )}
          <Popconfirm
            title="Xóa đánh giá này?"
            onConfirm={() => handleDelete(r.id)}
            okText="Xác nhận"
            cancelText="Hủy"
          >
            <Button size="small" danger icon={<DeleteOutlined />}>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <Title level={4} style={{ margin: 0, fontWeight: 800, color: '#0f172a' }}>
            ⭐ QUẢN LÝ ĐÁNH GIÁ & PHẢN HỒI KHÁCH HÀNG
          </Title>
          <Text style={{ color: '#64748b', fontSize: 13 }}>
            Kiểm duyệt và phản hồi đánh giá sản phẩm từ khách hàng đã mua trang sức (Verified Buyer)
          </Text>
        </div>
      </div>

      <Card className="luxury-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
          <Space wrap size={12}>
            <Select
              placeholder="Tất cả trạng thái duyệt"
              allowClear
              style={{ width: 220 }}
              onChange={setFilterApproved}
              options={[
                { value: undefined as any, label: '✨ Tất cả đánh giá' },
                { value: 'false', label: '⏳ Chờ duyệt hiển thị' },
                { value: 'true', label: '✅ Đã duyệt hiển thị' },
              ]}
            />
          </Space>

          <Tag color="gold" style={{ fontWeight: 600, padding: '4px 12px', borderRadius: 6 }}>
            Tổng: {pagination.total || reviews.length} đánh giá
          </Tag>
        </div>

        <Table
          columns={columns}
          dataSource={reviews}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            onChange: (page) => fetchReviews(page),
            showTotal: (t) => `Tổng cộng ${t} đánh giá`,
          }}
          size="middle"
        />
      </Card>
    </div>
  );
}


