"use client";
import { getAccessToken } from '@/lib/api';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShoppingBag,
  Heart,
  Bell,
  User,
  ChevronRight,
  LogOut,
  ShieldCheck,
  Package,
  LayoutDashboard,
  Sparkles,
  ExternalLink,
  ArrowRight,
} from 'lucide-react';


export default function AccountDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({ orders: 0, wishlist: 0 });

  useEffect(() => {
    const userStr = localStorage.getItem('user_info');
    const token = getAccessToken();
    if (!userStr || !token) {
      router.push('/account');
      return;
    }
    setUser(JSON.parse(userStr));

    // Fetch stats
    Promise.all([
      fetch('/api/v1/orders?limit=1', { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
      fetch('/api/v1/wishlist', { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
    ])
      .then(([orders, wishlist]) => {
        setStats({
          orders: orders?.data?.pagination?.total || 0,
          wishlist: Array.isArray(wishlist?.data) ? wishlist.data.length : 0,
        });
      })
      .catch(() => {});
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('user_token');
    localStorage.removeItem('user_info');
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('auth-change'));
    }
    router.push('/');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-ink border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isAdminRole = ['admin', 'manager', 'staff'].includes(user.role);

  const menuItems = [
    { icon: Package, label: 'Đơn hàng của tôi', sub: `${stats.orders} đơn`, href: '/account/orders', color: 'text-info' },
    { icon: Heart, label: 'Danh sách yêu thích', sub: `${stats.wishlist} sản phẩm`, href: '/account/wishlist', color: 'text-sale' },
    { icon: User, label: 'Hồ sơ & Mật khẩu', sub: 'Cập nhật thông tin tài khoản', href: '/account/profile', color: 'text-ink' },
    { icon: ShieldCheck, label: 'Tra cứu bảo hành', sub: 'Kiểm tra phiếu bảo hành', href: '/warranty', color: 'text-success' },
  ];

  return (
    <div className="max-w-2xl mx-auto px-6 py-12 space-y-6">
      {/* Admin Access VIP Banner */}
      {isAdminRole && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-2 border-amber-500/30 rounded-lg p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-amber-500 text-canvas flex items-center justify-center shrink-0 font-bold shadow-sm">
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-ink text-sm">TRANG QUẢN TRỊ VIÊN (BACK-OFFICE)</span>
                <span className="text-[10px] bg-amber-500 text-canvas font-bold px-1.5 py-0.2 rounded uppercase">
                  {user.role}
                </span>
              </div>
              <p className="text-mute text-xs mt-0.5">
                Bạn có toàn quyền truy cập PIM, Đơn hàng, Voucher & Thống kê doanh thu realtime.
              </p>
            </div>
          </div>
          <a
            href={process.env.NEXT_PUBLIC_ADMIN_URL || 'https://kltnadmin.vercel.app'}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary text-xs py-2.5 px-4 shrink-0 flex items-center gap-1.5 shadow-sm"
          >
            Vào Dashboard Admin <ArrowRight className="w-3.5 h-3.5" />
          </a>


        </div>
      )}

      {/* Profile Card */}
      <div className="bg-ink text-canvas p-8 rounded-lg flex items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-canvas/20 flex items-center justify-center text-2xl font-bold">
          {user.fullName?.charAt(0)?.toUpperCase() || 'U'}
        </div>
        <div>
          <h1 className="text-xl font-bold">{user.fullName}</h1>
          <p className="text-canvas/60 text-sm">{user.email}</p>
          <span className="text-xs bg-canvas/20 px-2.5 py-0.5 rounded-full mt-1.5 inline-block capitalize font-medium">
            Vai trò: {user.role}
          </span>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-soft-cloud border border-hairline-soft p-5 rounded-lg text-center">
          <div className="text-3xl font-bold text-ink">{stats.orders}</div>
          <div className="text-sm text-mute mt-1">Tổng đơn hàng</div>
        </div>
        <div className="bg-soft-cloud border border-hairline-soft p-5 rounded-lg text-center">
          <div className="text-3xl font-bold text-ink">{stats.wishlist}</div>
          <div className="text-sm text-mute mt-1">Sản phẩm yêu thích</div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="space-y-2">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-4 p-4 bg-canvas border border-hairline-soft rounded-lg hover:bg-soft-cloud transition-colors group"
          >
            <div className={`w-10 h-10 bg-soft-cloud rounded-full flex items-center justify-center ${item.color}`}>
              <item.icon className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-ink text-sm">{item.label}</p>
              <p className="text-mute text-xs">{item.sub}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-mute group-hover:text-ink transition-colors" />
          </Link>
        ))}
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full flex items-center gap-3 p-4 border border-hairline-soft rounded-lg text-sale hover:bg-sale/5 transition-colors font-medium text-sm"
      >
        <LogOut className="w-5 h-5" />
        <span>Đăng xuất tài khoản</span>
      </button>
    </div>
  );
}
