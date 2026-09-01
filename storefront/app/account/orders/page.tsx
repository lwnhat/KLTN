"use client";
import { getAccessToken } from '@/lib/api';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Package, ChevronRight } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-stone/20 text-stone',
  confirmed: 'bg-info/10 text-info',
  processing: 'bg-info/10 text-info',
  shipping: 'bg-success/10 text-success',
  delivered: 'bg-success/10 text-success',
  completed: 'bg-success text-canvas',
  cancelled: 'bg-sale/10 text-sale',
  refunded: 'bg-stone/20 text-stone',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  processing: 'Đang xử lý',
  shipping: 'Đang giao',
  delivered: 'Đã giao',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
  refunded: 'Đã hoàn tiền',
};

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  useEffect(() => {
    const token = getAccessToken();
    if (!token) { router.push('/account'); return; }

    fetch(`/api/v1/orders?page=${page}&limit=${limit}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setOrders(data.data.data || data.data || []);
          setTotal(data.data.pagination?.total || 0);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, router]);

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/account/dashboard" className="text-mute hover:text-ink transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold uppercase tracking-tight text-ink">Đơn Hàng Của Tôi</h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-ink border-t-transparent rounded-full animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16">
          <Package className="w-12 h-12 text-mute mx-auto mb-4" />
          <p className="text-mute">Bạn chưa có đơn hàng nào.</p>
          <Link href="/products" className="btn-primary mt-4 inline-flex">Mua Sắm Ngay</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order: any) => (
            <Link
              key={order.id}
              href={`/account/orders/${order.order_number}`}
              className="block bg-canvas border border-hairline-soft rounded-lg p-5 hover:bg-soft-cloud transition-colors group"
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="font-bold text-ink">{order.order_number}</span>
                  <span className="text-mute text-xs ml-3">
                    {new Date(order.created_at).toLocaleDateString('vi-VN')}
                  </span>
                </div>
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${STATUS_COLORS[order.status] || 'bg-soft-cloud text-mute'}`}>
                  {STATUS_LABELS[order.status] || order.status}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-mute">{order.payment_method?.toUpperCase()}</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-ink">
                    {parseInt(order.total_amount).toLocaleString('vi-VN')}đ
                  </span>
                  <ChevronRight className="w-4 h-4 text-mute group-hover:text-ink transition-colors" />
                </div>
              </div>
            </Link>
          ))}

          {/* Pagination */}
          {total > limit && (
            <div className="flex justify-center gap-2 pt-4">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="px-4 py-2 text-sm border border-hairline rounded-lg disabled:opacity-40 hover:bg-soft-cloud transition-colors"
              >
                ← Trước
              </button>
              <span className="px-4 py-2 text-sm text-mute">
                Trang {page} / {Math.ceil(total / limit)}
              </span>
              <button
                disabled={page * limit >= total}
                onClick={() => setPage(p => p + 1)}
                className="px-4 py-2 text-sm border border-hairline rounded-lg disabled:opacity-40 hover:bg-soft-cloud transition-colors"
              >
                Sau →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
