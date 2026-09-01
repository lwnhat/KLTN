"use client";

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import {
  Search,
  ShoppingBag,
  ShieldCheck,
  User,
  ChevronDown,
  Package,
  Heart,
  LogOut,
  LayoutDashboard,
  ShieldAlert,
  Menu,
  X,
} from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { getAccessToken, clearAccessToken, refreshSession } from '@/lib/api';
import LuxuryLogo from '@/components/ui/LuxuryLogo';

export default function Header() {
  const pathname = usePathname();
  const itemCount = useCartStore((state) => state.itemCount);
  const fetchWishlist = useWishlistStore((state) => state.fetchWishlist);
  const clearWishlist = useWishlistStore((state) => state.clearWishlist);

  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState<any>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);


  // Sync user state: Tối ưu hiệu năng — chỉ refresh session nếu có user_info đã lưu
  const syncUser = async () => {
    try {
      const userStr = localStorage.getItem('user_info');
      // Khách vãng lai: không có user_info -> Không gọi refreshSession() để tránh chậm render
      if (!userStr) {
        setUser(null);
        return;
      }

      let token = getAccessToken();
      if (!token) {
        token = await refreshSession();
      }

      if (token && userStr) {
        const parsedUser = JSON.parse(userStr);
        setUser(parsedUser);
        // Pre-fetch wishlist 1 lần duy nhất cho toàn bộ app
        fetchWishlist(token);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    syncUser();

    const handleAuthChange = () => syncUser();
    window.addEventListener('auth-change', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);

    return () => {
      window.removeEventListener('auth-change', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, []); // ★ Chỉ chạy khi mount, không re-trigger khi đổi pathname

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    try {
      const token = getAccessToken();
      if (token) {
        await fetch('/api/v1/auth/logout', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch {
      // Ignored
    } finally {
      clearAccessToken();
      clearWishlist();
      localStorage.removeItem('user_info');
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      setUser(null);
      setDropdownOpen(false);
      window.dispatchEvent(new Event('auth-change'));
      window.location.href = '/';
    }
  };

  const [isCartBouncing, setIsCartBouncing] = useState(false);
  const prevCountRef = useRef(itemCount);

  useEffect(() => {
    if (itemCount > prevCountRef.current) {
      setIsCartBouncing(true);
      const timer = setTimeout(() => setIsCartBouncing(false), 600);
      return () => clearTimeout(timer);
    }
    prevCountRef.current = itemCount;
  }, [itemCount]);

  return (
    <header className="sticky top-0 z-40 bg-canvas/95 backdrop-blur-md border-b border-hairline transition-all duration-300">
      {/* Top Banner */}
      <div className="bg-ink text-canvas text-xs py-2 px-3 sm:px-6 tracking-wide flex justify-center md:justify-between items-center select-none text-center">
        <div className="flex items-center justify-center gap-2 sm:gap-4 text-[11px] sm:text-xs font-medium whitespace-nowrap overflow-hidden">
          <span>✨ Kiểm định GIA & DOJI</span>
          <span className="text-mute/60">•</span>
          <span>💎 Khắc Laser miễn phí</span>
        </div>
        <div className="hidden md:flex items-center gap-4 text-canvas/80">
          <Link href="/warranty" className="hover:text-canvas transition-colors flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> Tra Cứu Bảo Hành
          </Link>
          <span>|</span>
          <Link href="/faq" className="hover:text-canvas transition-colors">Trợ Giúp</Link>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-[1440px] mx-auto px-3 sm:px-12 h-16 sm:h-20 flex items-center justify-between gap-2 sm:gap-6">
        {/* Brand Logo */}
        <Link href="/" className="shrink-0 scale-90 sm:scale-100 origin-left">
          <LuxuryLogo size="md" />
        </Link>

        {/* Navigation Categories */}
        <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-ink">
          <Link
            href="/products"
            className={`transition-colors hover:text-stone uppercase tracking-wider py-1 ${
              pathname === '/products' ? 'text-sand font-bold border-b-2 border-sand' : ''
            }`}
          >
            Tất Cả Sản Phẩm
          </Link>
          <Link
            href="/products?category=nhan"
            className="transition-colors hover:text-stone uppercase tracking-wider py-1"
          >
            Nhẫn Kim Cương
          </Link>
          <Link
            href="/products?category=day-chuyen"
            className="transition-colors hover:text-stone uppercase tracking-wider py-1"
          >
            Dây Chuyền
          </Link>
          <Link
            href="/products?category=bong-tai"
            className="transition-colors hover:text-stone uppercase tracking-wider py-1"
          >
            Bông Tai
          </Link>
          <Link
            href="/products?category=vong-tay"
            className="transition-colors hover:text-stone uppercase tracking-wider py-1"
          >
            Vòng Tay
          </Link>
        </nav>

        {/* Actions & Utilities */}
        <div className="flex items-center gap-1 sm:gap-4 shrink-0">
          {/* Search Bar */}
          <div className="relative hidden md:block w-48 lg:w-64">
            <input
              type="text"
              placeholder="Tìm trang sức, kim cương..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchQuery.trim()) {
                  window.location.href = `/products?search=${encodeURIComponent(searchQuery.trim())}`;
                }
              }}
              className="w-full pl-9 pr-4 py-2 text-xs bg-soft-cloud border border-transparent focus:border-ink rounded-full outline-none transition-all placeholder:text-mute"
            />
            <Search className="w-4 h-4 text-mute absolute left-3 top-2.5" />
          </div>

          {/* User Account / Dropdown */}
          <div className="relative" ref={dropdownRef}>
            {user ? (
              <div>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-1.5 text-xs font-semibold p-1 sm:py-2 sm:px-3 rounded-full hover:bg-soft-cloud transition-colors border border-hairline"
                >
                  <div className="w-6 h-6 rounded-full bg-ink text-canvas flex items-center justify-center text-[10px]">
                    {user.fullName ? user.fullName[0].toUpperCase() : 'U'}
                  </div>
                  <span className="hidden sm:inline-block max-w-[100px] truncate">{user.fullName}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-mute hidden sm:inline-block" />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-canvas border border-hairline shadow-2xl rounded-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-3 py-2 border-b border-hairline mb-1">
                      <p className="text-xs font-bold text-ink truncate">{user.fullName}</p>
                      <p className="text-[11px] text-mute truncate">{user.email}</p>
                    </div>

                    {['admin', 'manager', 'staff'].includes(user.role) && (
                      <a
                        href="http://localhost:3001"
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-amber-700 bg-amber-50/80 rounded-xl hover:bg-amber-100/80 transition-colors mb-1"
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        Quản Trị Admin Panel
                      </a>
                    )}

                    <Link
                      href="/account/dashboard"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs text-ink hover:bg-soft-cloud rounded-xl transition-colors"
                    >
                      <User className="w-4 h-4 text-mute" />
                      Tài Khoản & Hồ Sơ
                    </Link>

                    <Link
                      href="/account/orders"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs text-ink hover:bg-soft-cloud rounded-xl transition-colors"
                    >
                      <Package className="w-4 h-4 text-mute" />
                      Đơn Hàng Của Tôi
                    </Link>

                    <Link
                      href="/account/wishlist"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs text-ink hover:bg-soft-cloud rounded-xl transition-colors"
                    >
                      <Heart className="w-4 h-4 text-mute" />
                      Danh Sách Yêu Thích
                    </Link>

                    <div className="border-t border-hairline my-1"></div>

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Đăng Xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/account"
                className="p-2 rounded-full hover:bg-soft-cloud transition-colors flex items-center justify-center text-ink"
                title="Đăng Nhập"
              >
                <User className="w-5 h-5" />
              </Link>
            )}
          </div>

          {/* Cart Icon & Badge */}
          <Link
            href="/cart"
            aria-label="Giỏ hàng"
            className="relative p-2 rounded-full hover:bg-soft-cloud transition-colors flex items-center justify-center group"
          >
            <ShoppingBag className="w-5 h-5 text-ink transition-transform group-hover:scale-110" />
            {itemCount > 0 && (
              <span
                className={`absolute -top-0.5 -right-0.5 bg-ink text-canvas text-[10px] font-bold w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center border border-canvas transition-all ${
                  isCartBouncing ? 'animate-cart-bounce bg-amber-500 shadow-lg scale-125' : ''
                }`}
              >
                {itemCount > 99 ? '99+' : itemCount}
              </span>
            )}
          </Link>

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden w-10 h-10 rounded-lg hover:bg-soft-cloud active:bg-hairline text-ink transition-colors flex items-center justify-center shrink-0"
            aria-label="Toggle Menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Slide-Down Drawer */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop overlay */}
          <div
            className="lg:hidden fixed inset-0 top-[88px] bg-ink/40 backdrop-blur-sm z-40 transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Content */}
          <div className="lg:hidden absolute top-full inset-x-0 bg-canvas border-t border-hairline px-5 py-5 space-y-4 shadow-2xl max-h-[calc(100vh-88px)] overflow-y-auto z-50 animate-in slide-in-from-top-2 duration-200">
            {/* Mobile Search */}
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Tìm trang sức, kim cương..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    setMobileMenuOpen(false);
                    window.location.href = `/products?search=${encodeURIComponent(searchQuery.trim())}`;
                  }
                }}
                className="w-full pl-9 pr-4 py-2.5 text-xs bg-soft-cloud border border-hairline focus:border-ink rounded-full outline-none transition-all placeholder:text-mute"
              />
              <Search className="w-4 h-4 text-mute absolute left-3 top-3" />
            </div>

            {/* Mobile Categories */}
            <div className="space-y-1">
              <p className="text-[10px] uppercase font-bold tracking-wider text-mute mb-2 px-2">Danh mục sản phẩm</p>
              {[
                { href: '/products', label: 'Tất Cả Sản Phẩm' },
                { href: '/products?category=nhan', label: 'Nhẫn Kim Cương' },
                { href: '/products?category=day-chuyen', label: 'Dây Chuyền' },
                { href: '/products?category=bong-tai', label: 'Bông Tai' },
                { href: '/products?category=vong-tay', label: 'Vòng Tay' },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2.5 text-sm rounded-lg font-medium transition-colors ${
                    pathname === item.href ? 'bg-ink text-canvas font-semibold' : 'text-ink hover:bg-soft-cloud'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Mobile Extra Links */}
            <div className="pt-3 border-t border-hairline space-y-1">
              <Link
                href="/warranty"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 text-xs font-semibold text-ink hover:bg-soft-cloud rounded-lg transition-colors"
              >
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                Tra Cứu Bảo Hành Điện Tử
              </Link>
              <Link
                href="/account/wishlist"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 text-xs font-semibold text-ink hover:bg-soft-cloud rounded-lg transition-colors"
              >
                <Heart className="w-4 h-4 text-rose-500" />
                Danh Sách Yêu Thích
              </Link>
              <Link
                href="/faq"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 text-xs font-semibold text-ink hover:bg-soft-cloud rounded-lg transition-colors"
              >
                <span className="w-4 h-4 flex items-center justify-center text-xs font-bold text-mute">?</span>
                Câu Hỏi Thường Gặp (FAQ)
              </Link>
            </div>
          </div>
        </>
      )}
    </header>
  );
}

