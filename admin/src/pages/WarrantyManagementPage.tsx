import React, { useState, useEffect } from 'react';
import {
  Table, Tag, Button, Space, Input, Select, Modal, Form,
  Typography, Descriptions, Timeline, message, Popconfirm, Badge, Card
} from 'antd';
import {
  SearchOutlined, EyeOutlined, CheckCircleOutlined,
  SafetyCertificateOutlined, PlusOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;


// ★ API base URL được cấu hình từ biến môi trường (xem src/lib/api.ts)
import { API_BASE, adminFetch } from '../lib/api';
const API = API_BASE;

const statusConfig: Record<string, { color: string; label: string }> = {
  active: { color: 'green', label: 'Còn hiệu lực' },
  expired: { color: 'default', label: 'Hết hạn' },
  void: { color: 'red', label: 'Đã hủy' },
  claimed: { color: 'orange', label: 'Đã bảo hành' },
};

export default function WarrantyManagementPage() {
  const [warranties, setWarranties] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | undefined>(undefined);
  const [selectedWarranty, setSelectedWarranty] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [claimOpen, setClaimOpen] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const [claimForm] = Form.useForm();

  const token = localStorage.getItem('admin_token');
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const fetchWarranties = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      if (filterStatus) params.set('status', filterStatus);

      const res = await fetch(`${API}/admin/warranties?${params}`, { headers });
      const data = await res.json();
      if (data.success) {
        const list = Array.isArray(data.data) ? data.data : (data.data?.data || []);
        const totalCount = data.meta?.total || data.data?.pagination?.total || list.length;
        setWarranties(list);
        setPagination(p => ({ ...p, current: page, total: totalCount }));
      }
    } catch {
      message.error('Không thể tải danh sách bảo hành');
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => { fetchWarranties(); }, [search, filterStatus]);

  const handleCreateClaim = async (values: any) => {
    try {
      const res = await fetch(`${API}/admin/warranties/${selectedWarranty.id}/claims`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ claimType: values.claimType, notes: values.notes }),
      });
      const data = await res.json();
      if (data.success) {
        message.success('Đã tạo yêu cầu bảo hành!');
        setClaimOpen(false);
        claimForm.resetFields();
        fetchWarranties();
      } else {
        message.error(data.error?.message || 'Lỗi');
      }
    } catch {
      message.error('Lỗi kết nối');
    }
  };

  const columns = [
    {
      title: 'Mã Bảo Hành',
      dataIndex: 'warranty_code',
      render: (code: string) => <code style={{ fontWeight: 700, fontSize: 13, color: '#111' }}>{code}</code>,
    },
    {
      title: 'Khách Hàng',
      render: (_: any, r: any) => (
        <div>
          <div style={{ fontWeight: 600 }}>{r.customer_name}</div>
          <div style={{ fontSize: 12, color: '#707072' }}>{r.customer_phone}</div>
        </div>
      ),
    },
    { title: 'Sản Phẩm', dataIndex: 'product_name', ellipsis: true },
    {
      title: 'Trạng Thái',
      dataIndex: 'status',
      render: (s: string) => {
        const cfg = statusConfig[s] || { color: 'default', label: s };
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
    {
      title: 'Ngày Mua',
      dataIndex: 'purchase_date',
      render: (d: string) => new Date(d).toLocaleDateString('vi-VN'),
    },
    {
      title: 'Hành Động',
      render: (_: any, record: any) => (
        <Space>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => { setSelectedWarranty(record); setDetailOpen(true); }}
          >
            Chi tiết
          </Button>
          <Button
            size="small"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => { setSelectedWarranty(record); setClaimOpen(true); }}
          >
            Tạo claim
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <Title level={4} style={{ margin: 0, fontWeight: 800, color: '#0f172a' }}>
            🛡️ QUẢN LÝ BẢO HÀNH ĐIỆN TỬ & CHỨNG CHỈ (E-WARRANTY)
          </Title>
          <Text style={{ color: '#64748b', fontSize: 13 }}>
            Tra cứu thẻ bảo hành theo mã thẻ, số điện thoại khách hàng, quản lý đánh bóng, chỉnh size và gắn lại đá quý
          </Text>
        </div>
      </div>

      <Card className="luxury-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
          <Space wrap size={12}>
            <Input.Search
              placeholder="Tìm theo mã BH (WR-2026...), SĐT, tên KH..."
              onSearch={setSearch}
              style={{ width: 340 }}
              prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
              allowClear
            />
            <Select
              placeholder="Tất cả trạng thái bảo hành"
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
            Tổng: {pagination.total || warranties.length} phiếu bảo hành
          </Tag>
        </div>

        <Table
          columns={columns}
          dataSource={warranties}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            onChange: (page) => fetchWarranties(page),
            showTotal: (t) => `Tổng cộng ${t} phiếu`,
          }}
          size="middle"
        />
      </Card>

      {/* Detail Modal */}
      <Modal
        open={detailOpen}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <SafetyCertificateOutlined style={{ color: '#b45309' }} />
            <span>Thẻ Bảo Hành Điện Tử: <b>{selectedWarranty?.warranty_code}</b></span>
          </div>
        }
        onCancel={() => setDetailOpen(false)}
        footer={null}
        width={640}
      >
        {selectedWarranty && (
          <Descriptions bordered column={2} size="middle" style={{ marginTop: 16 }}>
            <Descriptions.Item label="Mã Thẻ BH" span={2}>
              <code style={{ fontWeight: 800, color: '#b45309', background: '#fef3c7', padding: '4px 10px', borderRadius: 6 }}>
                {selectedWarranty.warranty_code}
              </code>
            </Descriptions.Item>
            <Descriptions.Item label="Khách Hàng"><b>{selectedWarranty.customer_name}</b></Descriptions.Item>
            <Descriptions.Item label="Số Điện Thoại">{selectedWarranty.customer_phone}</Descriptions.Item>
            <Descriptions.Item label="Email">{selectedWarranty.customer_email || '—'}</Descriptions.Item>
            <Descriptions.Item label="Ngày Mua">
              {new Date(selectedWarranty.purchase_date).toLocaleDateString('vi-VN')}
            </Descriptions.Item>
            <Descriptions.Item label="Sản Phẩm" span={2}><b>{selectedWarranty.product_name}</b></Descriptions.Item>
            <Descriptions.Item label="Trạng Thái" span={2}>
              <Tag color={statusConfig[selectedWarranty.status]?.color} style={{ fontWeight: 700 }}>
                {statusConfig[selectedWarranty.status]?.label}
              </Tag>
            </Descriptions.Item>
            {selectedWarranty.notes && (
              <Descriptions.Item label="Ghi Chú" span={2}>{selectedWarranty.notes}</Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>

      {/* Create Claim Modal */}
      <Modal
        open={claimOpen}
        title="Tạo Yêu Cầu Tiếp Nhận Bảo Hành"
        onCancel={() => { setClaimOpen(false); claimForm.resetFields(); }}
        onOk={() => claimForm.submit()}
        okText="Tạo Yêu Cầu"
      >
        <Form form={claimForm} layout="vertical" onFinish={handleCreateClaim} style={{ marginTop: 12 }}>
          <Form.Item label="Loại Dịch Vụ Bảo Hành" name="claimType" rules={[{ required: true, message: 'Vui lòng chọn loại bảo hành' }]}>
            <Select options={[
              { value: 'polish', label: '✨ Làm sạch & Đánh bóng trang sức' },
              { value: 'stone_fix', label: '💎 Chỉnh & Đính lại chấu đá quý' },
              { value: 'resize', label: '📏 Chỉnh size nhẫn / lắc tay' },
              { value: 'repair', label: '🛠️ Sửa chữa chi tiết hư hỏng' },
              { value: 'replacement', label: '🔄 Thay thế phụ kiện / móc khóa' },
            ]} />
          </Form.Item>
          <Form.Item label="Ghi Chú Tình Trạng Tiếp Nhận" name="notes">
            <Input.TextArea rows={3} placeholder="Mô tả tình trạng trang sức khi khách gửi và yêu cầu xử lý cụ thể..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}


