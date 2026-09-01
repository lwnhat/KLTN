"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, User, Mail, Phone, Lock, ArrowRight, ShieldCheck, KeyRound, CheckCircle2 } from 'lucide-react';
import { setAccessToken, getAccessToken } from '@/lib/api';

type Tab = 'login' | 'register' | 'forgot' | 'reset';

export default function AccountPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    // Kiểm tra token từ in-memory store (XSS-safe) + user_info từ localStorage
    const token = getAccessToken();
    const user = localStorage.getItem('user_info');
    if (token && user) {
      router.push('/account/dashboard');
    }
  }, [router]);

  // Login form state
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });

  // Register form state
  const [registerForm, setRegisterForm] = useState({ fullName: '', email: '', phone: '', password: '' });

  // Forgot password form state
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetForm, setResetForm] = useState({ email: '', code: '', newPassword: '' });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(loginForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Đăng nhập thất bại.');

      // ★ Lưu accessToken vào in-memory store (không localStorage — chống XSS)
      setAccessToken(data.data.accessToken);
      // Chỉ lưu user metadata (không nhạy cảm) vào localStorage để hiển thị UI sau reload
      localStorage.setItem('user_info', JSON.stringify(data.data.user));

      // Đồng bộ admin_token nếu là tài khoản quản trị
      if (['admin', 'manager', 'staff'].includes(data.data.user?.role)) {
        localStorage.setItem('admin_token', data.data.accessToken);
        localStorage.setItem('admin_user', JSON.stringify(data.data.user));
      }

      // Thông báo cho Header cập nhật trạng thái
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('auth-change'));
      }

      setMessage({ type: 'success', text: `Chào mừng ${data.data.user.fullName}! Đăng nhập thành công.` });
      setTimeout(() => router.push('/account/dashboard'), 800);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Đăng ký thất bại.');

      setMessage({ type: 'success', text: 'Đăng ký thành công! Mã OTP xác thực đã được gửi tới email của bạn.' });
      setTab('login');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/v1/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Có lỗi xảy ra.');

      setMessage({ type: 'success', text: 'Mã xác nhận 6 số đã được gửi tới email của bạn!' });
      setResetForm((prev) => ({ ...prev, email: forgotEmail }));
      setTab('reset');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/v1/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resetForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Đặt lại mật khẩu thất bại.');

      setMessage({ type: 'success', text: 'Đặt lại mật khẩu thành công! Vui lòng đăng nhập bằng mật khẩu mới.' });
      setTab('login');
      setLoginForm((prev) => ({ ...prev, email: resetForm.email, password: '' }));
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-canvas border border-hairline rounded-none shadow-sm">
        {/* Header Tabs */}
        {tab !== 'forgot' && tab !== 'reset' ? (
          <div className="grid grid-cols-2 border-b border-hairline">
            <button
              onClick={() => {
                setTab('login');
                setMessage(null);
              }}
              className={`py-4 text-sm font-bold uppercase tracking-wider transition-colors ${
                tab === 'login' ? 'bg-canvas text-ink border-b-2 border-ink -mb-[2px]' : 'bg-soft-cloud text-mute hover:text-ink'
              }`}
            >
              Đăng Nhập
            </button>
            <button
              onClick={() => {
                setTab('register');
                setMessage(null);
              }}
              className={`py-4 text-sm font-bold uppercase tracking-wider transition-colors ${
                tab === 'register' ? 'bg-canvas text-ink border-b-2 border-ink -mb-[2px]' : 'bg-soft-cloud text-mute hover:text-ink'
              }`}
            >
              Đăng Ký
            </button>
          </div>
        ) : (
          <div className="p-4 border-b border-hairline bg-soft-cloud flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-ink">
              {tab === 'forgot' ? 'Khôi Phục Mật Khẩu' : 'Đặt Lại Mật Khẩu'}
            </span>
            <button
              onClick={() => {
                setTab('login');
                setMessage(null);
              }}
              className="text-xs text-mute hover:text-ink underline"
            >
              ← Quay lại đăng nhập
            </button>
          </div>
        )}

        <div className="p-8 space-y-6">
          {/* Status Message */}
          {message && (
            <div
              className={`p-4 rounded-lg text-xs leading-relaxed font-medium ${
                message.type === 'success'
                  ? 'bg-success/10 text-success border border-success/20'
                  : 'bg-sale/10 text-sale border border-sale/20'
              }`}
            >
              {message.text}
            </div>
          )}

          {/* LOGIN FORM */}
          {tab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-ink mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-mute" />
                  <input
                    type="email"
                    required
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                    placeholder="email@example.com"
                    className="w-full bg-canvas border border-hairline text-ink rounded-lg pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-ink focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-ink mb-1.5">Mật Khẩu</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-mute" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full bg-canvas border border-hairline text-ink rounded-lg pl-10 pr-10 py-3 text-sm focus:ring-2 focus:ring-ink focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-mute hover:text-ink"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setTab('forgot');
                    setMessage(null);
                  }}
                  className="text-xs text-mute hover:text-ink underline"
                >
                  Quên mật khẩu?
                </button>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 disabled:opacity-60">
                {loading ? (
                  'Đang đăng nhập...'
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Đăng Nhập <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </button>

              {/* Test account hint */}
              <div className="bg-soft-cloud border border-hairline-soft p-3 rounded-lg text-xs text-mute space-y-1">
                <p className="font-semibold text-ink">Tài khoản mẫu để thử nghiệm:</p>
                <p>
                  👤 Customer: <code className="font-mono bg-white px-1">customer@test.com</code> /{' '}
                  <code className="font-mono bg-white px-1">User@123456</code>
                </p>
              </div>
            </form>
          )}

          {/* REGISTER FORM */}
          {tab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-ink mb-1.5">Họ & Tên</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-mute" />
                  <input
                    type="text"
                    required
                    value={registerForm.fullName}
                    onChange={(e) => setRegisterForm({ ...registerForm, fullName: e.target.value })}
                    placeholder="Nguyễn Văn A"
                    className="w-full bg-canvas border border-hairline text-ink rounded-lg pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-ink focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-ink mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-mute" />
                  <input
                    type="email"
                    required
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                    placeholder="email@example.com"
                    className="w-full bg-canvas border border-hairline text-ink rounded-lg pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-ink focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-ink mb-1.5">Số Điện Thoại</label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-mute" />
                  <input
                    type="tel"
                    value={registerForm.phone}
                    onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                    placeholder="0901234567"
                    className="w-full bg-canvas border border-hairline text-ink rounded-lg pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-ink focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-ink mb-1.5">Mật Khẩu</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-mute" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                    placeholder="Tối thiểu 6 ký tự"
                    className="w-full bg-canvas border border-hairline text-ink rounded-lg pl-10 pr-10 py-3 text-sm focus:ring-2 focus:ring-ink focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-mute hover:text-ink"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 disabled:opacity-60">
                {loading ? (
                  'Đang tạo tài khoản...'
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Tạo Tài Khoản <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </button>
            </form>
          )}

          {/* FORGOT PASSWORD FORM */}
          {tab === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <p className="text-xs text-mute">
                Nhập địa chỉ email tài khoản của bạn. Hệ thống sẽ gửi một mã OTP 6 số để bạn đặt lại mật khẩu.
              </p>

              <div>
                <label className="block text-xs font-semibold uppercase text-ink mb-1.5">Email tài khoản</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-mute" />
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full bg-canvas border border-hairline text-ink rounded-lg pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-ink focus:outline-none"
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 disabled:opacity-60">
                {loading ? 'Đang gửi mã...' : 'Gửi Mã Xác Nhận OTP'}
              </button>
            </form>
          )}

          {/* RESET PASSWORD FORM */}
          {tab === 'reset' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-ink mb-1.5">Email</label>
                <input
                  type="email"
                  required
                  value={resetForm.email}
                  onChange={(e) => setResetForm({ ...resetForm, email: e.target.value })}
                  className="w-full bg-canvas border border-hairline text-ink rounded-lg px-4 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-ink mb-1.5">Mã OTP 6 số</label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-mute" />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={resetForm.code}
                    onChange={(e) => setResetForm({ ...resetForm, code: e.target.value })}
                    placeholder="123456"
                    className="w-full bg-canvas border border-hairline text-ink rounded-lg pl-10 pr-4 py-2.5 text-sm font-mono tracking-widest text-center"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-ink mb-1.5">Mật Khẩu Mới</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-mute" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={resetForm.newPassword}
                    onChange={(e) => setResetForm({ ...resetForm, newPassword: e.target.value })}
                    placeholder="Tối thiểu 6 ký tự"
                    className="w-full bg-canvas border border-hairline text-ink rounded-lg pl-10 pr-4 py-2.5 text-sm"
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 disabled:opacity-60">
                {loading ? 'Đang cập nhật...' : 'Xác Nhận & Đặt Lại Mật Khẩu'}
              </button>
            </form>
          )}
        </div>

        {/* Security Badge */}
        <div className="px-8 pb-8">
          <div className="flex items-center gap-2 text-xs text-mute bg-soft-cloud p-3 rounded-lg border border-hairline-soft">
            <ShieldCheck className="w-4 h-4 text-success shrink-0" />
            <span>Thông tin của bạn được mã hóa SSL và bảo vệ an toàn theo chuẩn thương mại điện tử.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
