import React, { useState, useEffect } from 'react';
import {
  Table, Tag, Button, Space, Modal, Form, Input, Select,
  InputNumber, DatePicker, Typography, message, Popconfirm, Statistic, Row, Col, Card, Tooltip
} from 'antd';
import { PlusOutlined, EditOutlined, StopOutlined, GiftOutlined, CheckCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

// ★ API base URL được cấu hình từ biến môi trường (xem src/lib/api.ts)
import { API_BASE, adminFetch } from '../lib/api';
const API = API_BASE;

export default function VoucherManagementPage() {
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<any>(null);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const [form] = Form.useForm();

  const fetchVouchers = async (page = 1) => {
    setLoading(true);
    try {
      const res = await adminFetch(`/admin/vouchers?page=${page}&limit=20`);
      const data = await res.json();
      if (data.success) {
        const voucherList = Array.isArray(data.data) ? data.data : (data.data?.data || []);
        const totalCount = data.meta?.total || data.data?.pagination?.total || voucherList.length;
        setVouchers(voucherList);
        setPagination(p => ({ ...p, current: page, total: totalCount }));
      }
    } catch {
      message.error('Không thể tải danh sách voucher');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVouchers();
  }, []);

  const openCreate = () => {
    setEditingVoucher(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (voucher: any) => {
    setEditingVoucher(voucher);
    form.setFieldsValue({
      ...voucher,
      startsAt: voucher.starts_at ? dayjs(voucher.starts_at) : null,
      expiresAt: voucher.expires_at ? dayjs(voucher.expires_at) : null,
      minOrderAmount: voucher.min_order_amount,
      maxDiscount: voucher.max_discount,
      usageLimit: voucher.usage_limit,
      perUserLimit: voucher.per_user_limit,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (values: any) => {
    try {
      const payload = {
        ...values,
        startsAt: values.startsAt?.toISOString(),
        expiresAt: values.expiresAt?.toISOString(),
      };
      const endpoint = editingVoucher
        ? `/admin/vouchers/${editingVoucher.id}`
        : `/admin/vouchers`;
      const method = editingVoucher ? 'PUT' : 'POST';

      const res = await adminFetch(endpoint, { method, body: JSON.stringify(payload) });
      const data = await res.json();
      if (data.success) {
        message.success(editingVoucher ? 'Đã cập nhật voucher!' : 'Tạo voucher thành công!');
        setModalOpen(false);
        fetchVouchers();
      } else {
        message.error(data.error?.message || 'Lỗi lưu voucher');
      }
    } catch {
      message.error('Lỗi kết nối máy chủ');
    }
  };

  const handleDeactivate = async (id: string) => {
    try {
      const res = await adminFetch(`/admin/vouchers/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        message.success('Đã vô hiệu hóa voucher');
        fetchVouchers();
      }
    } catch {
      message.error('Lỗi kết nối máy chủ');
    }
  };


  const typeLabel: Record<string, string> = {
    percentage: '% Giảm',
    fixed_amount: 'Giảm cố định',
    free_shipping: 'Miễn ship',
  };

  const columns = [
    {
      title: 'Mã Voucher',
      dataIndex: 'code',
      render: (c: string) => (
        <Space>
          <code style={{ fontWeight: 800, fontSize: 13, color: '#b45309', background: '#fef3c7', padding: '3px 8px', borderRadius: 6, border: '1px solid #fde68a' }}>
            {c}
          </code>
          <Tooltip title="Sao chép mã">
            <Button
              type="text"
              size="small"
              onClick={() => {
                navigator.clipboard.writeText(c);
                message.success(`Đã sao chép mã ${c}`);
              }}
            >
              📋
            </Button>
          </Tooltip>
        </Space>
      ),
    },
    {
      title: 'Tên Chương Trình',
      dataIndex: 'name',
      render: (n: string) => <span style={{ fontWeight: 600 }}>{n}</span>,
    },
    {
      title: 'Loại Giảm',
      dataIndex: 'type',
      render: (t: string) => <Tag color="blue">{typeLabel[t] || t}</Tag>,
    },
    {
      title: 'Mức Giảm',
      render: (_: any, r: any) => (
        <b style={{ color: '#0f172a' }}>
          {r.type === 'percentage' ? `${r.value}%` : `${Number(r.value).toLocaleString('vi-VN')}₫`}
        </b>
      ),
    },
    {
      title: 'Đơn Tối Thiểu',
      dataIndex: 'min_order_amount',
      render: (v: number) => <span>{v ? `${Number(v).toLocaleString('vi-VN')}₫` : '0₫'}</span>,
    },
    {
      title: 'Lượt Dùng',
      render: (_: any, r: any) => (
        <span>{r.used_count || 0}{r.usage_limit ? ` / ${r.usage_limit}` : ' / ∞'}</span>
      ),
    },
    {
      title: 'Hạn Dùng',
      dataIndex: 'expires_at',
      render: (d: string) => {
        const expired = new Date(d) < new Date();
        return <span style={{ color: expired ? '#dc2626' : '#16a34a', fontWeight: 600 }}>{dayjs(d).format('DD/MM/YYYY HH:mm')}</span>;
      },
    },
    {
      title: 'Trạng Thái',
      render: (_: any, r: any) => {
        if (!r.is_active) return <Tag color="default">Đã tắt</Tag>;
        if (r.isExpired) return <Tag color="warning">Hết hạn</Tag>;
        return <Tag color="success" icon={<CheckCircleOutlined />}>Đang hoạt động</Tag>;
      },
    },
    {
      title: 'Thao Tác',
      render: (_: any, record: any) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(record)}>Sửa</Button>
          <Popconfirm title="Vô hiệu hóa voucher này?" onConfirm={() => handleDeactivate(record.id)} okText="Tắt" cancelText="Hủy">
            <Button size="small" danger icon={<StopOutlined />}>Tắt</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const activeCount = vouchers.filter(v => v.is_active && !v.isExpired).length;
  const totalUsage = vouchers.reduce((s, v) => s + (v.used_count || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <Title level={4} style={{ margin: 0, fontWeight: 800, color: '#0f172a' }}>
            🎟️ QUẢN LÝ VOUCHER & MÃ KHUYẾN MÃI
          </Title>
          <Text style={{ color: '#64748b', fontSize: 13 }}>
            Tạo mã coupon giảm giá theo %, giảm tiền mặt, miễn phí vận chuyển cho khách VIP và mùa lễ hội
          </Text>
        </div>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          onClick={openCreate}
          style={{
            background: 'linear-gradient(135deg, #b45309 0%, #d97706 100%)',
            borderColor: '#b45309',
            fontWeight: 700,
            borderRadius: 10,
            boxShadow: '0 4px 14px rgba(180, 83, 9, 0.3)',
          }}
        >
          + Tạo Voucher Mới
        </Button>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <div className="luxury-stat-card">
            <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Voucher Đang Chạy</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#059669', marginTop: 6 }}>{activeCount}</div>
          </div>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <div className="luxury-stat-card">
            <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Tổng Lượt Sử Dụng</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', marginTop: 6 }}>{totalUsage} <span style={{ fontSize: 14, color: '#64748b' }}>lượt</span></div>
          </div>
        </Col>
      </Row>

      <Card className="luxury-card">
        <Table
          columns={columns}
          dataSource={vouchers}
          rowKey="id"
          loading={loading}
          pagination={{ ...pagination, onChange: fetchVouchers }}
          size="middle"
        />
      </Card>

      <Modal
        open={modalOpen}
        title={editingVoucher ? `Chỉnh sửa: ${editingVoucher.code}` : 'Tạo Voucher Mới'}
        onCancel={() => { setModalOpen(false); form.resetFields(); }}
        onOk={() => form.submit()}
        okText={editingVoucher ? 'Lưu' : 'Tạo'}
        width={580}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          {!editingVoucher && (
            <Form.Item label="Mã voucher" name="code" rules={[{ required: true, message: 'Nhập mã voucher' }]}>
              <Input placeholder="VD: SUMMER2026" style={{ textTransform: 'uppercase', fontWeight: 700 }} />
            </Form.Item>
          )}
          <Form.Item label="Tên hiển thị" name="name" rules={[{ required: true }]}>
            <Input placeholder="Giảm 20% dịp Valentine" />
          </Form.Item>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item label="Loại" name="type" rules={[{ required: true }]}>
                <Select options={[
                  { value: 'percentage', label: '% Giảm' },
                  { value: 'fixed_amount', label: 'Giảm cố định (VND)' },
                  { value: 'free_shipping', label: 'Miễn phí vận chuyển' },
                ]} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Giá trị" name="value" rules={[{ required: true }]}>
                <InputNumber min={0} style={{ width: '100%' }} placeholder="20 (%) hoặc 100000 (VND)" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item label="Giảm tối đa (VND)" name="maxDiscount">
                <InputNumber min={0} style={{ width: '100%' }} placeholder="500000" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Đơn tối thiểu (VND)" name="minOrderAmount">
                <InputNumber min={0} style={{ width: '100%' }} placeholder="1000000" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item label="Tổng lượt dùng" name="usageLimit">
                <InputNumber min={1} style={{ width: '100%' }} placeholder="∞ (không giới hạn)" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Lượt/user" name="perUserLimit" initialValue={1}>
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item label="Bắt đầu" name="startsAt" rules={[{ required: true }]}>
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Kết thúc" name="expiresAt" rules={[{ required: true }]}>
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}
