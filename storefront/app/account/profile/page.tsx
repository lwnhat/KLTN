"use client";
import { getAccessToken } from '@/lib/api';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, User, Lock, Mail, Phone, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Profile form
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user_info');
    const token = getAccessToken();
    if (!userStr || !token) {
      router.push('/account');
      return;
    }
    const parsed = JSON.parse(userStr);
    setUser(parsed);
    setFullName(parsed.fullName || '');
    setPhone(parsed.phone || '');
  }, [router]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getAccessToken();
    if (!token) return;

    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch('/api/v1/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ fullName, phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Cập nhật thất bại.');

      // Update localStorage
      const updated = { ...user, fullName: data.data.full_name, phone: data.data.phone };
      localStorage.setItem('user_info', JSON.stringify(updated));
      setUser(updated);
      setMsg({ type: 'success', text: 'Cập nhật thông tin thành công!' });
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPwMsg({ type: 'error', text: 'Mật khẩu xác nhận không khớp.' });
      return;
    }

    const token = getAccessToken();
    if (!token) return;

    setPwLoading(true);
    setPwMsg(null);
    try {
      const res = await fetch('/api/v1/auth/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Đổi mật khẩu thất bại.');

      setPwMsg({ type: 'success', text: 'Đổi mật khẩu thành công!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPwMsg({ type: 'error', text: err.message });
    } finally {
      setPwLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-ink border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-12 space-y-10">
      <div className="flex items-center gap-3">
        <Link href="/account/dashboard" className="text-mute hover:text-ink transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-tight text-ink">Hồ Sơ & Bảo Mật</h1>
          <p className="text-mute text-xs">Quản lý thông tin tài khoản và mật khẩu của bạn</p>
        </div>
      </div>

      {/* Profile Form */}
      <form onSubmit={handleUpdateProfile} className="bg-soft-cloud border border-hairline p-6 rounded-lg space-y-4">
        <h2 className="text-base font-bold uppercase text-ink flex items-center gap-2">
          <User className="w-4 h-4" /> Thông Tin Cá Nhân
        </h2>

        {msg && (
          <div
            className={`p-3 rounded text-xs font-semibold ${
              msg.type === 'success'
                ? 'bg-success/10 text-success border border-success/20'
                : 'bg-sale/10 text-sale border border-sale/20'
            }`}
          >
            {msg.text}
          </div>
        )}

        <div className="space-y-1">
          <label className="text-xs font-bold text-mute uppercase">Email (Không thể thay đổi)</label>
          <div className="flex items-center bg-canvas/60 border border-hairline rounded-lg p-3 text-sm text-mute">
            <Mail className="w-4 h-4 mr-2 text-mute" />
            <span>{user.email}</span>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-mute uppercase">Họ và tên</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full bg-canvas border border-hairline rounded-lg p-3 text-sm focus:ring-2 focus:ring-ink focus:outline-none"
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-mute uppercase">Số điện thoại</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="09xxxxxxxx"
            className="w-full bg-canvas border border-hairline rounded-lg p-3 text-sm focus:ring-2 focus:ring-ink focus:outline-none"
          />
        </div>

        <button type="submit" disabled={loading} className="btn-primary py-3 px-6 text-sm">
          {loading ? 'Đang lưu...' : 'Lưu Thay Đổi'}
        </button>
      </form>

      {/* Change Password Form */}
      <form onSubmit={handleChangePassword} className="bg-soft-cloud border border-hairline p-6 rounded-lg space-y-4">
        <h2 className="text-base font-bold uppercase text-ink flex items-center gap-2">
          <Lock className="w-4 h-4" /> Đổi Mật Khẩu
        </h2>

        {pwMsg && (
          <div
            className={`p-3 rounded text-xs font-semibold ${
              pwMsg.type === 'success'
                ? 'bg-success/10 text-success border border-success/20'
                : 'bg-sale/10 text-sale border border-sale/20'
            }`}
          >
            {pwMsg.text}
          </div>
        )}

        <div className="space-y-1">
          <label className="text-xs font-bold text-mute uppercase">Mật khẩu hiện tại</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Nhập mật khẩu đang dùng"
            className="w-full bg-canvas border border-hairline rounded-lg p-3 text-sm focus:ring-2 focus:ring-ink focus:outline-none"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-mute uppercase">Mật khẩu mới</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Tối thiểu 6 ký tự"
              className="w-full bg-canvas border border-hairline rounded-lg p-3 text-sm focus:ring-2 focus:ring-ink focus:outline-none"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-mute uppercase">Xác nhận mật khẩu mới</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Nhập lại mật khẩu mới"
              className="w-full bg-canvas border border-hairline rounded-lg p-3 text-sm focus:ring-2 focus:ring-ink focus:outline-none"
              required
            />
          </div>
        </div>

        <button type="submit" disabled={pwLoading} className="btn-secondary py-3 px-6 text-sm">
          {pwLoading ? 'Đang cập nhật...' : 'Cập Nhật Mật Khẩu'}
        </button>
      </form>
    </div>
  );
}
