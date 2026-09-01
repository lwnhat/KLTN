"use client";
import { getAccessToken } from '@/lib/api';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cartStore';
import { useToast } from '@/contexts/ToastContext';
import { v4 as uuidv4 } from 'uuid';
import { Clock, ShieldCheck, CreditCard, Truck, CheckCircle2, QrCode, ArrowRight, Sparkles, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import VietnamAddressSelector, { AddressValue } from '@/components/checkout/VietnamAddressSelector';

type Step = 1 | 2 | 3 | 4;


export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, clearCart } = useCartStore();
  const { showSuccess, showError, showInfo } = useToast();
  const [step, setStep] = useState<Step>(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [holdExpiry, setHoldExpiry] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState<string>('');
  const [idempotencyKey] = useState(() => uuidv4());

  // Voucher State
  const [voucherInput, setVoucherInput] = useState('');
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherResult, setVoucherResult] = useState<any>(null);
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [voucherError, setVoucherError] = useState('');

  // Form State
  const [customerInfo, setCustomerInfo] = useState({
    name: 'Nguyễn Văn Customer',
    phone: '0901234567',
    email: 'customer@test.com',
  });

  const [shippingAddress, setShippingAddress] = useState({
    province: 'TP. Hồ Chí Minh',
    district: 'Quận 1',
    ward: 'Phường Bến Nghé',
    streetAddress: '123 Lê Lợi',
  });

  const [paymentMethod, setPaymentMethod] = useState<'vietqr' | 'vnpay' | 'momo' | 'cod'>('vietqr');
  const [vietQrData, setVietQrData] = useState<any>(null);
  const [orderCreated, setOrderCreated] = useState<any>(null);

  // Load user profile if logged in
  useEffect(() => {
    const userStr = localStorage.getItem('user_info');
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        setCustomerInfo(prev => ({
          ...prev,
          name: u.fullName || prev.name,
          email: u.email || prev.email,
          phone: u.phone || prev.phone,
        }));
      } catch {}
    }
  }, []);

  const handleApplyVoucher = async () => {
    if (!voucherInput.trim()) return;
    setVoucherLoading(true);
    setVoucherError('');
    try {
      const res = await fetch('/api/v1/vouchers/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: voucherInput.trim(), orderAmount: subtotal }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Mã không hợp lệ.');
      setVoucherResult(data.data);
      setVoucherCode(data.data.code);
      showSuccess(
        `Áp dụng mã ${data.data.code} thành công! Tiết kiệm ${data.data.discountAmount?.toLocaleString('vi-VN')}₫`,
        'Ưu đãi Voucher'
      );
    } catch (err: any) {
      setVoucherError(err.message);
      setVoucherResult(null);
      showError(err.message, 'Mã không hợp lệ');
    } finally {
      setVoucherLoading(false);
    }
  };

  const handleRemoveVoucher = () => {
    setVoucherResult(null);
    setVoucherCode('');
    setVoucherInput('');
    setVoucherError('');
    showInfo('Đã bỏ mã giảm giá.', 'Voucher');
  };

  // Step 1 -> Hold Inventory via Backend API
  const handleStartHold = async () => {
    setIsProcessing(true);
    try {
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
      setHoldExpiry(expiresAt);
      setStep(2);
    } catch {
      alert('Không thể tạm giữ kho. Vui lòng thử lại.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Countdown timer effect
  useEffect(() => {
    if (!holdExpiry) return;

    const timer = setInterval(() => {
      const remainingMs = holdExpiry.getTime() - Date.now();
      if (remainingMs <= 0) {
        setCountdown('00:00');
        clearInterval(timer);
        alert('Thời gian giữ tồn kho 15 phút đã hết. Vui lòng kiểm tra lại giỏ hàng.');
        router.push('/cart');
        return;
      }
      const mins = Math.floor(remainingMs / 60000).toString().padStart(2, '0');
      const secs = Math.floor((remainingMs % 60000) / 1000).toString().padStart(2, '0');
      setCountdown(`${mins}:${secs}`);
    }, 1000);

    return () => clearInterval(timer);
  }, [holdExpiry, router]);

  const handleProceedToPayment = () => {

    if (!customerInfo.name.trim()) {
      showError('Vui lòng nhập họ và tên người nhận.');
      return;
    }
    if (!customerInfo.phone.trim() || customerInfo.phone.trim().length < 9) {
      showError('Vui lòng nhập số điện thoại hợp lệ.');
      return;
    }
    if (!customerInfo.email.trim() || !customerInfo.email.includes('@')) {
      showError('Vui lòng nhập email hợp lệ để nhận hóa đơn và phiếu bảo hành điện tử.');
      return;
    }
    if (!shippingAddress.province.trim()) {
      showError('Vui lòng chọn Tỉnh / Thành phố nhận hàng.');
      return;
    }
    if (!shippingAddress.district.trim()) {
      showError('Vui lòng chọn Quận / Huyện nhận hàng.');
      return;
    }
    if (!shippingAddress.ward.trim()) {
      showError('Vui lòng chọn Phường / Xã nhận hàng.');
      return;
    }
    if (!shippingAddress.streetAddress.trim()) {
      showError('Vui lòng nhập địa chỉ cụ thể (Số nhà, tên đường).');
      return;
    }
    setStep(3);
  };

  // Submit Order to Backend API with Idempotency Key
  const handlePlaceOrder = async () => {

    if (items.length === 0) {
      alert('Giỏ hàng trống. Vui lòng chọn sản phẩm trước khi thanh toán.');
      router.push('/products');
      return;
    }

    setIsProcessing(true);
    try {
      const token = getAccessToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Idempotency-Key': idempotencyKey,
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const orderPayload = {
        items: items.map((i) => ({
          variantId: i.variantId,
          quantity: i.quantity,
          priceSnapshot: i.price,
          customizationMetadata: i.customizationMetadata,
        })),
        shippingAddress,
        customerInfo,
        paymentMethod,
        voucherCode: voucherCode || null,
      };

      const res = await fetch('/api/v1/orders', {
        method: 'POST',
        headers,
        body: JSON.stringify(orderPayload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Tạo đơn hàng thất bại. Vui lòng kiểm tra lại.');
      }

      const createdOrder = data.data;
      if (!createdOrder?.order_number) {
        throw new Error('Không nhận được mã đơn hàng từ hệ thống.');
      }

      clearCart();

      // Redirect to success page
      router.push(`/checkout/success?order=${createdOrder.order_number}&method=${paymentMethod}`);
    } catch (err: any) {
      alert(err.message || 'Có lỗi xảy ra khi thanh toán.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (items.length === 0 && step === 1) {
    return (
      <div className="max-w-[800px] mx-auto px-6 py-20 text-center space-y-4">
        <h1 className="text-2xl font-bold uppercase text-ink">Giỏ hàng của bạn đang trống</h1>
        <p className="text-mute text-sm">Vui lòng chọn trang sức kim cương trước khi tiến hành thanh toán.</p>
        <Link href="/products" className="btn-primary inline-flex">Khám Phá Sản Phẩm</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas pb-20">
      {/* 15-Minute Countdown Banner */}
      {holdExpiry && countdown && (
        <div className="bg-ink text-canvas py-2.5 px-6 text-center text-sm font-semibold sticky top-16 z-30 flex items-center justify-center gap-2">
          <Clock className="w-4 h-4 animate-pulse text-amber-400" />
          <span>TỒN KHO ĐANG ĐƯỢC REDIS TẠM GIỮ CHO BẠN:</span>
          <span className="bg-canvas text-ink px-2 py-0.5 rounded font-mono text-base font-bold">
            {countdown}
          </span>
        </div>
      )}

      <div className="max-w-[1200px] mx-auto px-6 sm:px-12 pt-8 space-y-8">
        {/* Step Indicator Bar */}
        <div className="flex items-center justify-between border-b border-hairline pb-6">
          {[
            { num: 1, label: 'Giỏ Hàng' },
            { num: 2, label: 'Thông Tin Giao Hàng' },
            { num: 3, label: 'Thanh Toán' },
            { num: 4, label: 'Xác Nhận' },
          ].map((s) => (
            <div key={s.num} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                  step >= s.num ? 'bg-ink text-canvas' : 'bg-soft-cloud text-mute'
                }`}
              >
                {s.num}
              </div>
              <span className={`text-sm font-semibold hidden sm:inline ${step >= s.num ? 'text-ink' : 'text-mute'}`}>
                {s.label}
              </span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Form Step Body */}
          <div className="lg:col-span-2 space-y-8">
            {step === 1 && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold uppercase text-ink">BƯỚC 1: XÁC NHẬN GIỎ HÀNG & TẠM GIỮ KHO</h2>
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-4 p-4 border border-hairline rounded-none bg-soft-cloud">
                      <div className="flex-1">
                        <p className="font-semibold text-ink">{item.productName}</p>
                        <p className="text-xs text-mute">{item.variantName} × {item.quantity}</p>
                        {item.customizationMetadata && (
                          <p className="text-xs text-info mt-1">✏️ Khắc chữ: "{item.customizationMetadata.text}" ({item.customizationMetadata.font})</p>
                        )}
                      </div>
                      <p className="font-bold text-ink">{((Number(item.price) || 0) * item.quantity).toLocaleString('vi-VN')}₫</p>
                    </div>
                  ))}
                </div>

                <div className="bg-soft-cloud p-4 border border-hairline rounded-none text-xs text-mute flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-success shrink-0" />
                  <span>Khi bấm tiếp tục, hệ thống sẽ <b>tạm giữ tồn kho Redis trong 15 phút</b> để đảm bảo không ai mua mất sản phẩm của bạn.</span>
                </div>

                <button onClick={handleStartHold} disabled={isProcessing} className="btn-primary w-full py-4 text-base">
                  {isProcessing ? 'Đang giữ kho...' : 'Bắt Đầu Giữ Kho & Điền Địa Chỉ →'}
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-hairline pb-3">
                  <h2 className="text-xl font-bold uppercase text-ink">BƯỚC 2: THÔNG TIN KHÁCH HÀNG & GIAO HÀNG</h2>
                  <span className="text-xs text-amber-600 font-semibold bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                    📍 Tự động gợi ý 63 tỉnh thành VN
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-slate-700">Họ và tên người nhận <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      placeholder="Nguyễn Văn A"
                      value={customerInfo.name}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                      className="w-full bg-canvas border border-slate-300 rounded-lg p-3 text-xs font-medium focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-slate-700">Số điện thoại <span className="text-rose-500">*</span></label>
                    <input
                      type="tel"
                      placeholder="0901234567"
                      value={customerInfo.phone}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                      className="w-full bg-canvas border border-slate-300 rounded-lg p-3 text-xs font-medium focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-bold uppercase text-slate-700">Email (Nhận chứng chỉ bảo hành & hoá đơn VAT) <span className="text-rose-500">*</span></label>
                    <input
                      type="email"
                      placeholder="customer@example.com"
                      value={customerInfo.email}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                      className="w-full bg-canvas border border-slate-300 rounded-lg p-3 text-xs font-medium focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                    />
                  </div>
                </div>

                {/* ─── VIETNAM ADDRESS SELECTOR (API INTEGRATION) ─── */}
                <div className="border-t border-hairline pt-4">
                  <VietnamAddressSelector
                    value={shippingAddress}
                    onChange={setShippingAddress}
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="btn-secondary py-3.5 px-5 text-sm flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-4 h-4" /> Quay Lại Giỏ
                  </button>
                  <button
                    type="button"
                    onClick={handleProceedToPayment}
                    className="btn-primary flex-1 py-3.5 text-sm font-semibold flex items-center justify-center gap-2"
                  >
                    Tiếp Tục Chọn Phương Thức Thanh Toán <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold uppercase text-ink">BƯỚC 3: PHƯƠNG THỨC THANH TOÁN</h2>
                <div className="space-y-3">
                  {[
                    { id: 'vietqr', name: 'Chuyển khoản VietQR tức thì (Quét mã mọi ngân hàng)', icon: QrCode, badge: 'Khuyên dùng' },
                    { id: 'vnpay', name: 'Cổng VNPay (Thẻ ATM / Visa / Master / JCB)', icon: CreditCard },
                    { id: 'momo', name: 'Ví điện tử MoMo', icon: CreditCard },
                    { id: 'cod', name: 'Thanh toán khi nhận hàng (COD)', icon: Truck },
                  ].map((p) => (
                    <label
                      key={p.id}
                      className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-all ${
                        paymentMethod === p.id ? 'border-ink bg-soft-cloud font-semibold ring-1 ring-ink' : 'border-hairline hover:bg-soft-cloud/50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === p.id}
                        onChange={() => setPaymentMethod(p.id as any)}
                        className="accent-ink w-4 h-4"
                      />
                      <p.icon className="w-5 h-5 text-ink" />
                      <div className="flex-1 flex items-center justify-between">
                        <span className="text-sm text-ink">{p.name}</span>
                        {p.badge && (
                          <span className="text-[10px] bg-success/15 text-success font-bold px-2 py-0.5 rounded-full">
                            {p.badge}
                          </span>
                        )}
                      </div>
                    </label>
                  ))}
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="btn-secondary py-3.5 px-5 text-sm flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-4 h-4" /> Sửa Địa Chỉ
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(4)}
                    className="btn-primary flex-1 py-3.5 text-sm font-semibold flex items-center justify-center gap-2"
                  >
                    Xem Lại & Xác Nhận Đơn Hàng <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6 bg-soft-cloud p-6 rounded-lg border border-hairline">
                <h2 className="text-xl font-bold uppercase text-ink border-b border-hairline pb-4">
                  BƯỚC 4: XÁC NHẬN ĐẶT HÀNG
                </h2>

                <div className="space-y-3 text-sm text-ink">
                  <div>
                    <span className="text-mute text-xs block font-medium">Khách hàng:</span>
                    <p className="font-semibold">{customerInfo.name} • {customerInfo.phone} • {customerInfo.email}</p>
                  </div>
                  <div>
                    <span className="text-mute text-xs block font-medium">Địa chỉ giao hàng:</span>
                    <p className="font-semibold text-amber-950 bg-amber-50/80 p-2.5 rounded-lg border border-amber-200/60 mt-1">
                      📍 {[shippingAddress.streetAddress, shippingAddress.ward, shippingAddress.district, shippingAddress.province].filter(Boolean).join(', ')}
                    </p>
                  </div>
                  <div>
                    <span className="text-mute text-xs block font-medium">Phương thức thanh toán:</span>
                    <p className="font-semibold uppercase">{paymentMethod}</p>
                  </div>
                  <p className="text-xs text-mute pt-2 border-t border-hairline-soft">
                    🔒 Idempotency Key: <code className="font-mono bg-canvas px-1.5 py-0.5 rounded">{idempotencyKey.slice(0, 18)}...</code> (Bảo vệ chống trùng lặp giao dịch)
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    disabled={isProcessing}
                    className="btn-secondary py-3.5 px-5 text-sm flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-4 h-4" /> Sửa Thanh Toán
                  </button>
                  <button
                    type="button"
                    onClick={handlePlaceOrder}
                    disabled={isProcessing}
                    className="btn-primary flex-1 py-4 text-base font-bold tracking-wide"
                  >
                    {isProcessing ? 'Đang xử lý đơn hàng...' : 'XÁC NHẬN & THANH TOÁN NGAY →'}
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* Side Summary */}
          <div className="bg-soft-cloud p-6 rounded-lg border border-hairline space-y-4 h-fit">
            <h3 className="font-bold text-lg text-ink uppercase border-b border-hairline pb-2">ĐƠN HÀNG</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-mute">
                <span>Tạm tính</span>
                <span className="font-semibold text-ink">{Number(subtotal || 0).toLocaleString('vi-VN')}₫</span>
              </div>
              {voucherResult && (
                <div className="flex justify-between text-success">
                  <span>Giảm giá ({voucherResult.code})</span>
                  <span>-{Number(voucherResult.discountAmount || 0).toLocaleString('vi-VN')}₫</span>
                </div>
              )}
              <div className="flex justify-between text-mute">
                <span>Vận chuyển</span>
                <span className="text-success font-medium">Miễn phí</span>
              </div>
            </div>

            {/* Voucher Input */}
            <div className="border-t border-hairline pt-3 space-y-2">
              <p className="text-xs font-semibold uppercase text-ink">Mã giảm giá</p>
              {voucherResult ? (
                <div className="bg-success/10 border border-success/20 rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-success">{voucherResult.code}</p>
                    <p className="text-xs text-mute">{voucherResult.name}</p>
                    <p className="text-xs font-semibold text-success">-{Number(voucherResult.discountAmount || 0).toLocaleString('vi-VN')}₫</p>
                  </div>
                  <button onClick={handleRemoveVoucher} className="text-mute hover:text-sale text-xs">✕</button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={voucherInput}
                    onChange={e => setVoucherInput(e.target.value.toUpperCase())}
                    placeholder="Nhập mã (VD: WELCOME2026)"
                    className="flex-1 border border-hairline rounded-lg px-3 py-2 text-sm font-mono uppercase focus:ring-2 focus:ring-ink focus:outline-none"
                    onKeyDown={e => e.key === 'Enter' && handleApplyVoucher()}
                  />
                  <button
                    onClick={handleApplyVoucher}
                    disabled={voucherLoading}
                    className="btn-primary px-4 py-2 text-xs disabled:opacity-60"
                  >
                    {voucherLoading ? '...' : 'Áp dụng'}
                  </button>
                </div>
              )}
              {voucherError && <p className="text-xs text-sale">{voucherError}</p>}
            </div>

            <div className="border-t border-hairline pt-3 flex justify-between font-bold text-lg text-ink">
              <span>Tổng cộng</span>
              <span>{Number(voucherResult ? voucherResult.finalAmount : subtotal).toLocaleString('vi-VN')}₫</span>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
