import React, { useState, useEffect } from 'react';
import {
  Table, Tag, Button, Space, Input, Select, Typography,
  message, Popconfirm, Avatar, Badge, Card
} from 'antd';
import {
  SearchOutlined, UserOutlined, LockOutlined, UnlockOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

// ★ API base URL được cấu hình từ biến môi trường (xem src/lib/api.ts)
import { API_BASE, adminFetch } from '../lib/api';
const API = API_BASE;

const roleConfig: Record<string, { color: string; label: string }> = {
  admin: { color: 'red', label: 'Admin' },
  manager: { color: 'gold', label: 'Manager' },
  staff: { color: 'blue', label: 'Nhân viên' },
  customer: { color: 'default', label: 'Khách hàng' },
};

export default function UserManagementPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<string | undefined>(undefined);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });

  const currentUser = JSON.parse(localStorage.getItem('admin_user') || '{}');

  const fetchUsers = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      if (filterRole) params.set('role', filterRole);

      const res = await adminFetch(`/admin/users?${params}`);
      const data = await res.json();
      if (data.success) {
        const userList = Array.isArray(data.data) ? data.data : (data.data?.data || []);
        const totalCount = data.meta?.total || data.data?.pagination?.total || userList.length;
        setUsers(userList);
        setPagination(p => ({ ...p, current: page, total: totalCount }));
      }
    } catch {
      message.error('Không thể tải danh sách người dùng');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, [search, filterRole]);

  const handleRoleChange = async (userId: string, role: string) => {
    try {
      const res = await adminFetch(`/admin/users/${userId}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (data.success) {
        message.success(`Đã đổi role thành ${role}`);
        fetchUsers(pagination.current);
      } else {
        message.error(data.error?.message || 'Lỗi');
      }
    } catch { message.error('Lỗi kết nối máy chủ'); }
  };

  const handleToggleActive = async (userId: string, currentActive: boolean) => {
    try {
      const res = await adminFetch(`/admin/users/${userId}/toggle-active`, { method: 'PUT' });
      const data = await res.json();
      if (data.success) {
        message.success(currentActive ? 'Đã vô hiệu hóa tài khoản' : 'Đã kích hoạt tài khoản');
        fetchUsers(pagination.current);
      }
    } catch { message.error('Lỗi kết nối máy chủ'); }
  };


  const columns = [
    {
      title: 'Người Dùng',
      render: (_: any, r: any) => (
        <Space>
          <Avatar icon={<UserOutlined />} style={{ background: '#111' }} />
          <div>
            <div style={{ fontWeight: 600, fontSize: 13 }}>{r.full_name || '—'}</div>
            <div style={{ fontSize: 12, color: '#707072' }}>{r.email}</div>
          </div>
        </Space>
      ),
    },
    { title: 'Số ĐT', dataIndex: 'phone', render: (p: string) => p || '—' },
    {
      title: 'Role',
      dataIndex: 'role',
      render: (role: string, record: any) => {
        if (currentUser.role !== 'admin') {
          return <Tag color={roleConfig[role]?.color}>{roleConfig[role]?.label || role}</Tag>;
        }
        return (
          <Select
            value={role}
            size="small"
            style={{ width: 130 }}
            disabled={record.id === currentUser.id}
            onChange={(newRole) => handleRoleChange(record.id, newRole)}
            options={Object.entries(roleConfig).map(([v, c]) => ({ value: v, label: c.label }))}
          />
        );
      },
    },
    {
      title: 'Trạng Thái',
      render: (_: any, r: any) => (
        <Space>
          <Badge status={r.is_active ? 'success' : 'error'} />
          <span style={{ color: r.is_active ? '#007d48' : '#d30005' }}>
            {r.is_active ? 'Hoạt động' : 'Bị khóa'}
          </span>
        </Space>
      ),
    },
    {
      title: 'Xác thực Email',
      dataIndex: 'is_verified',
      render: (v: boolean) => <Tag color={v ? 'success' : 'warning'}>{v ? '✅ Đã xác thực' : '⚠️ Chưa xác thực'}</Tag>,
    },
    {
      title: 'Đăng nhập gần nhất',
      dataIndex: 'last_login_at',
      render: (d: string) => d ? new Date(d).toLocaleString('vi-VN') : '—',
    },
    {
      title: 'Hành Động',
      render: (_: any, record: any) => (
        <Popconfirm
          title={record.is_active ? 'Vô hiệu hóa tài khoản này?' : 'Kích hoạt tài khoản này?'}
          onConfirm={() => handleToggleActive(record.id, record.is_active)}
          okText="Xác nhận"
          cancelText="Hủy"
          disabled={record.id === currentUser.id}
        >
          <Button
            size="small"
            danger={record.is_active}
            icon={record.is_active ? <LockOutlined /> : <UnlockOutlined />}
            disabled={record.id === currentUser.id}
          >
            {record.is_active ? 'Khóa' : 'Kích hoạt'}
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <Title level={4} style={{ margin: 0, fontWeight: 800, color: '#0f172a' }}>
            👥 QUẢN LÝ TÀI KHOẢN & PHÂN QUYỀN
          </Title>
          <Text style={{ color: '#64748b', fontSize: 13 }}>
            Phân quyền tài khoản Quản trị viên (Super Admin), Quản lý cửa hàng (Manager), Nhân viên (Staff) và Khách hàng
          </Text>
        </div>
      </div>

      <Card className="luxury-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
          <Space wrap size={12}>
            <Input.Search
              placeholder="Tìm theo tên, email, SĐT..."
              onSearch={setSearch}
              style={{ width: 320 }}
              prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
              allowClear
            />
            <Select
              placeholder="Tất cả vai trò"
              allowClear
              style={{ width: 200 }}
              onChange={setFilterRole}
              options={[
                { value: undefined as any, label: '✨ Tất cả vai trò' },
                ...Object.entries(roleConfig).map(([v, c]) => ({ value: v, label: c.label })),
              ]}
            />
          </Space>

          <Tag color="gold" style={{ fontWeight: 600, padding: '4px 12px', borderRadius: 6 }}>
            Tổng: {pagination.total || users.length} người dùng
          </Tag>
        </div>

        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            onChange: (page) => fetchUsers(page),
            showTotal: (t) => `Tổng cộng ${t} người dùng`,
          }}
          size="middle"
        />
      </Card>
    </div>
  );
}


