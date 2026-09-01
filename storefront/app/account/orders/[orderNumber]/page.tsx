"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle, Circle, Truck, Package, XCircle, AlertTriangle } from 'lucide-react';
import { getAccessToken } from '@/lib/api';

const STATUS_STEPS = ['pending', 'confirmed', 'processing', 'shipping', 'delivered', 'completed'];
const STATUS_LABELS: Record<string, string> = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  processing: 'Đang chuẩn bị',
  shipping: 'Đang vận chuyển',
  delivered: 'Đã giao hàng',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
};

export default function OrderDetailPage({ params }: { params: { orderNumber: string } }) {
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  const fetchOrder = () => {
    const token = getAccessToken();
    fetch(`/api/v1/orders/${params.orderNumber}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setOrder(data.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrder();
  }, [params.orderNumber]);

  const handleCancelOrder = async () => {
    if (!confirm('Bạn có chắc chắn muốn hủy đơn hàng này không? Tồn kho sẽ được hoàn trả lại hệ thống.')) {
      return;
    }

    const token = getAccessToken();
    if (!token) {
      alert('Vui lòng đăng nhập để thực hiện thao tác.');
      return;
    }

    setCancelling(true);
    try {
      const res = await fetch(`/api/v1/orders/${order.id}/cancel`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Hủy đơn hàng thất bại.');

      alert('Đã hủy đơn hàng thành công.');
      fetchOrder();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi hủy đơn.');
    } finally {
      setCancelling(false);
    }
  };

  const isCancelled = order?.status === 'cancelled';
  const currentStepIndex = STATUS_STEPS.indexOf(order?.status);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-8 h-8 border-2 border-ink border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-24">
        <p className="text-mute">Đơn hàng không tồn tại.</p>
        <Link href="/account/orders" className="btn-primary mt-4 inline-flex">
          Quay lại
        </Link>
      </div>
    );
  }

  const shippingAddress =
    typeof order.shipping_address === 'string'
      ? JSON.parse(order.shipping_address)
      : order.shipping_address;
  const customerInfo =
    typeof order.customer_snapshot === 'string'
      ? JSON.parse(order.customer_snapshot)
      : order.customer_snapshot;

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/account/orders" className="text-mute hover:text-ink transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold uppercase tracking-tight text-ink font-mono">{order.order_number}</h1>
            <p className="text-mute text-xs">{new Date(order.created_at).toLocaleString('vi-VN')}</p>
          </div>
        </div>

        {/* Cancel Button if status is pending */}
        {order.status === 'pending' && (
          <button
            onClick={handleCancelOrder}
            disabled={cancelling}
            className="text-xs font-semibold text-sale border border-sale/30 px-3 py-1.5 rounded-lg hover:bg-sale/5 transition-colors disabled:opacity-50"
          >
            {cancelling ? 'Đang hủy...' : 'Hủy đơn hàng'}
          </button>
        )}
      </div>

      {/* Status Timeline */}
      {!isCancelled ? (
        <div className="bg-soft-cloud rounded-lg p-6">
          <h2 className="font-bold text-sm uppercase tracking-widest text-ink mb-5">Trạng Thái Đơn Hàng</h2>
          <div className="flex items-center gap-0">
            {STATUS_STEPS.map((step, i) => {
              const done = i <= currentStepIndex;
              const active = i === currentStepIndex;
              return (
                <div key={step} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center gap-1">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                        done ? 'bg-ink text-canvas' : 'bg-hairline-soft text-mute'
                      } ${active ? 'ring-2 ring-ink ring-offset-2' : ''}`}
                    >
                      {done ? <CheckCircle className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                    </div>
                    <span
                      className={`text-[10px] text-center leading-tight ${
                        done ? 'text-ink font-semibold' : 'text-mute'
                      }`}
                    >
                      {STATUS_LABELS[step]}
                    </span>
                  </div>
                  {i < STATUS_STEPS.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-1 mb-4 transition-all ${
                        i < currentStepIndex ? 'bg-ink' : 'bg-hairline-soft'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-sale/5 border border-sale/20 rounded-lg p-4 flex items-center gap-3">
          <XCircle className="w-5 h-5 text-sale shrink-0" />
          <div>
            <span className="font-semibold text-sale block text-sm">Đơn hàng này đã bị hủy</span>
            <span className="text-xs text-mute">Tồn kho sản phẩm đã được tự động hoàn lại hệ thống.</span>
          </div>
        </div>
      )}

      {/* Order Items */}
      <div>
        <h2 className="font-bold text-sm uppercase tracking-widest text-ink mb-3">Sản Phẩm Đã Mua</h2>
        <div className="space-y-3 border-t border-hairline-soft pt-3">
          {(order.items || []).map((item: any) => {
            let imgUrl = '';
            try {
              imgUrl = typeof item.image_snapshot === 'string' ? JSON.parse(item.image_snapshot) : item.image_snapshot;
            } catch {
              imgUrl = item.image_snapshot;
            }

            return (
              <div key={item.id} className="flex gap-4">
                <div className="w-16 h-16 bg-soft-cloud rounded-lg shrink-0 overflow-hidden">
                  {imgUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imgUrl} alt={item.product_name_snapshot} className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-ink text-sm">{item.product_name_snapshot}</p>
                  <p className="text-mute text-xs">
                    {item.variant_name_snapshot} × {item.quantity}
                  </p>
                  {item.customization_metadata && (
                    <p className="text-xs text-info mt-0.5">
                      ✏️ Khắc chữ:{' '}
                      {typeof item.customization_metadata === 'string'
                        ? JSON.parse(item.customization_metadata)?.text
                        : item.customization_metadata?.text}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-bold text-ink text-sm">
                    {Math.round(item.price_snapshot * item.quantity).toLocaleString('vi-VN')}đ
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pricing */}
        <div className="border-t border-hairline-soft mt-4 pt-4 space-y-2 text-sm">
          <div className="flex justify-between text-mute">
            <span>Tạm tính</span>
            <span>{parseInt(order.subtotal).toLocaleString('vi-VN')}đ</span>
          </div>
          {parseFloat(order.discount_amount) > 0 && (
            <div className="flex justify-between text-success">
              <span>Giảm giá ({order.voucher_code})</span>
              <span>-{parseInt(order.discount_amount).toLocaleString('vi-VN')}đ</span>
            </div>
          )}
          <div className="flex justify-between text-mute">
            <span>Phí vận chuyển</span>
            <span>
              {parseFloat(order.shipping_fee) === 0
                ? 'Miễn phí'
                : `${parseInt(order.shipping_fee).toLocaleString('vi-VN')}đ`}
            </span>
          </div>
          <div className="flex justify-between font-bold text-ink text-base pt-2 border-t border-hairline-soft">
            <span>Tổng cộng</span>
            <span>{parseInt(order.total_amount).toLocaleString('vi-VN')}đ</span>
          </div>
        </div>
      </div>

      {/* Delivery Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-soft-cloud p-4 rounded-lg">
          <h3 className="font-bold text-xs uppercase text-mute mb-2">Địa Chỉ Giao Hàng</h3>
          <p className="text-sm text-ink font-semibold">{customerInfo?.name}</p>
          <p className="text-sm text-mute">{customerInfo?.phone}</p>
          <p className="text-sm text-mute">
            {shippingAddress?.street || shippingAddress?.streetAddress}, {shippingAddress?.ward},{' '}
            {shippingAddress?.district}, {shippingAddress?.province || shippingAddress?.city}
          </p>
        </div>
        <div className="bg-soft-cloud p-4 rounded-lg">
          <h3 className="font-bold text-xs uppercase text-mute mb-2">Thanh Toán & Vận Chuyển</h3>
          <p className="text-sm text-ink capitalize">Phương thức: {order.payment_method?.toUpperCase()}</p>
          <p className={`text-sm font-semibold mt-1 ${order.payment_status === 'paid' ? 'text-success' : 'text-amber-600'}`}>
            {order.payment_status === 'paid' ? '✅ Đã thanh toán' : '⏳ Chờ thanh toán'}
          </p>
        </div>
      </div>
    </div>
  );
}
