"use client";
import { getAccessToken } from '@/lib/api';

import { Suspense, useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useToast } from '@/contexts/ToastContext';
import {
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  QrCode,
  Copy,
  Check,
  Package,
  Sparkles,
  Zap,
  Building2,
  ExternalLink,
  Mail,
  Send,
} from 'lucide-react';


const POPULAR_BANKS = [
  { code: 'TCB', name: 'Techcombank' },
  { code: 'MB', name: 'MBBank (Quân Đội)' },
  { code: 'VCB', name: 'Vietcombank' },
  { code: 'ACB', name: 'ACB' },
  { code: 'BIDV', name: 'BIDV' },
  { code: 'CTG', name: 'VietinBank' },
];

function SuccessContent() {

  const searchParams = useSearchParams();
  const orderNumber = searchParams.get('order');
  const method = searchParams.get('method') || 'vietqr';
  const { showSuccess } = useToast();

  const [order, setOrder] = useState<any>(null);
  const [qrData, setQrData] = useState<any>(null);
  const [selectedBank, setSelectedBank] = useState('TCB');
  const [loading, setLoading] = useState(true);
  const [qrLoading, setQrLoading] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [customEmail, setCustomEmail] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const isPaidRef = useRef(false);
  const hasNotifiedRef = useRef(false);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch Order Data
  const fetchOrder = async () => {
    if (!orderNumber) return;
    const token = typeof window !== 'undefined' ? getAccessToken() : null;
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      const res = await fetch(`/api/v1/orders/${orderNumber}`, { headers });
      if (res.ok) {
        const data = await res.json();
        if (data?.data) {
          setOrder(data.data);
          if (data.data.customer_snapshot?.email) {
            setCustomEmail((prev) => prev || data.data.customer_snapshot.email);
          }
          if (data.data.payment_status === 'paid') {
            isPaidRef.current = true;
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
              pollIntervalRef.current = null;
            }
          }
        }
      }
    } catch {

      // ignore
    }
  };

  // Generate VietQR
  const generateQR = async (bankCode: string) => {
    if (!orderNumber) return;
    setQrLoading(true);
    try {
      const res = await fetch('/api/v1/payments/vietqr/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber,
          bankCode,
          template: 'compact2',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.data) {
          setQrData(data.data);
        }
      }
    } catch {
      // ignore
    } finally {
      setQrLoading(false);
    }
  };

  useEffect(() => {
    if (!orderNumber) {
      setLoading(false);
      return;
    }

    fetchOrder().finally(() => setLoading(false));
    generateQR(selectedBank);

    // Auto-polling check payment status every 3 seconds until paid
    pollIntervalRef.current = setInterval(async () => {
      if (isPaidRef.current) {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
        return;
      }

      try {
        const res = await fetch(`/api/v1/orders/${orderNumber}`);
        if (!res.ok) return;
        const d = await res.json();
        if (d?.data?.payment_status === 'paid') {
          isPaidRef.current = true;
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
          setOrder(d.data);
          if (!hasNotifiedRef.current) {
            hasNotifiedRef.current = true;
            showSuccess('Tài khoản ngân hàng đã nhận được tiền! Đơn hàng đã được xác nhận.', 'Thanh toán thành công');
          }
        }
      } catch {
        // ignore
      }
    }, 3000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [orderNumber]);

  const handleBankChange = (bankCode: string) => {
    setSelectedBank(bankCode);
    generateQR(bankCode);
  };

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    showSuccess(`Đã sao chép ${fieldName} vào bộ nhớ tạm: "${text}"`, 'Đã sao chép');
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Demo IPN: Simulate bank transfer completion
  const handleSimulatePaid = async () => {
    setSimulating(true);
    try {
      const res = await fetch('/api/v1/payments/vietqr/simulate-paid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNumber }),
      });
      const data = await res.json();
      if (data.success) {
        isPaidRef.current = true;
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
        setOrder((prev: any) => ({
          ...prev,
          payment_status: 'paid',
          status: 'confirmed',
        }));
        if (!hasNotifiedRef.current) {
          hasNotifiedRef.current = true;
          showSuccess('Đã kích hoạt thanh toán thành công! Đơn hàng đang được chuyển sang bộ phận chế tác.', 'Thanh toán thành công');
        }
      }
    } catch {
      alert('Không thể kích hoạt mô phỏng thanh toán.');
    } finally {
      setSimulating(false);
    }
  };

  const handleSendEmail = async () => {
    if (!orderNumber) return;
    setSendingEmail(true);
    try {
      const res = await fetch('/api/v1/payments/send-payment-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNumber, email: customEmail || undefined }),
      });
      const data = await res.json();
      if (res.ok) {
        setEmailSent(true);
        showSuccess('Đã gửi thông tin đơn hàng về Gmail thành công!', 'Gửi Email');
      } else {
        showSuccess(data.error?.message || 'Không thể gửi email lúc này.', 'Thông báo');
      }
    } catch (err: any) {
      showSuccess(err.message || 'Lỗi gửi email.', 'Lỗi');
    } finally {
      setSendingEmail(false);
    }
  };


  const isPaid = order?.payment_status === 'paid';

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      {/* Header Banner */}
      <div className="text-center space-y-3">
        <CheckCircle2 className="w-16 h-16 text-success mx-auto stroke-1 animate-bounce" />
        <span className="text-xs font-bold text-mute uppercase tracking-widest block">
          ĐẶT HÀNG THÀNH CÔNG
        </span>
        <h1 className="text-3xl font-bold uppercase tracking-tight text-ink">
          CẢM ƠN BẠN ĐÃ ĐẶT HÀNG!
        </h1>
        <p className="text-mute text-sm">
          Đơn hàng{' '}
          <b className="text-ink font-mono bg-soft-cloud px-2 py-0.5 rounded">
            {orderNumber || 'KLTN-...'}
          </b>{' '}
          đã được ghi nhận vào hệ thống.
        </p>
      </div>

      {/* PAID SUCCESS BANNER */}
      {isPaid ? (
        <div className="bg-success/10 border-2 border-success/30 rounded-lg p-6 text-center space-y-3 shadow-sm animate-fade-in">
          <div className="w-12 h-12 bg-success text-canvas rounded-full flex items-center justify-center mx-auto shadow-md">
            <Check className="w-6 h-6 stroke-[3]" />
          </div>
          <h2 className="text-xl font-bold text-success uppercase">
            ĐÃ XÁC NHẬN THANH TOÁN THÀNH CÔNG!
          </h2>
          <p className="text-sm text-mute max-w-md mx-auto">
            Hệ thống đã nhận được tiền chuyển khoản cho đơn hàng <b>{orderNumber}</b>. Đơn hàng đang được chuẩn bị đóng gói và xuất kho.
          </p>
          <div className="pt-2">
            <span className="text-xs bg-success text-canvas font-bold px-3 py-1 rounded-full uppercase">
              Trạng thái: {order?.status === 'confirmed' ? 'Đã xác nhận' : order?.status}
            </span>
          </div>
        </div>
      ) : (
        /* VIETQR PAYMENT BOX */
        qrData && (
          <div className="bg-canvas border-2 border-ink rounded-lg p-6 space-y-5 shadow-sm text-left animate-fade-in">
            {/* Box Header */}
            <div className="flex items-center justify-between border-b border-hairline-soft pb-3">
              <div className="flex items-center gap-2 font-bold text-ink text-sm uppercase">
                <QrCode className="w-5 h-5 text-ink" /> Thanh Toán Chuyển Khoản VietQR (Napas 24/7)
              </div>
              <span className="text-xs bg-amber-500/15 text-amber-700 font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping inline-block" />
                Chờ chuyển khoản
              </span>
            </div>

            {/* Bank Selector Chips */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-mute uppercase flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" /> Chọn ngân hàng nhận tiền:
              </label>
              <div className="flex gap-1.5 flex-wrap">
                {POPULAR_BANKS.map((b) => (
                  <button
                    key={b.code}
                    onClick={() => handleBankChange(b.code)}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                      selectedBank === b.code
                        ? 'bg-ink text-canvas shadow-sm'
                        : 'bg-soft-cloud text-ink hover:bg-hairline-soft'
                    }`}
                  >
                    {b.name}
                  </button>
                ))}
              </div>
            </div>

            {/* QR Code Stage & Transfer Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center pt-2">
              {/* QR Image */}
              <div className="flex flex-col items-center p-4 bg-soft-cloud rounded-lg border border-hairline-soft relative">
                {qrLoading && (
                  <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex items-center justify-center rounded-lg z-10">
                    <div className="w-6 h-6 border-2 border-ink border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrData.qrUrl || qrData.qrDataUrl || qrData.quickLinkUrl}
                  alt="VietQR Payment Code"
                  className="w-52 h-52 object-contain rounded shadow-sm bg-white"
                />
                <span className="text-[11px] text-mute mt-2.5 text-center font-medium">
                  Mở ứng dụng ngân hàng bất kỳ để quét mã
                </span>
              </div>

              {/* Transfer Details Form */}
              <div className="space-y-3 text-xs text-ink">
                <div>
                  <span className="text-mute block text-[11px]">Ngân hàng thụ hưởng:</span>
                  <span className="font-bold text-sm text-ink">{qrData.bank?.name || 'MB Bank'}</span>
                </div>

                <div>
                  <span className="text-mute block text-[11px]">Chủ tài khoản:</span>
                  <span className="font-bold text-sm text-ink">{qrData.accountName}</span>
                </div>

                <div>
                  <span className="text-mute block text-[11px]">Số tài khoản:</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono font-bold text-base text-ink bg-soft-cloud px-2 py-0.5 rounded">
                      {qrData.accountNo}
                    </span>
                    <button
                      onClick={() => handleCopy(qrData.accountNo, 'accountNo')}
                      className="btn-secondary text-[11px] px-2 py-1 flex items-center gap-1"
                      title="Sao chép số tài khoản"
                    >
                      {copiedField === 'accountNo' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-success" /> Đã chép
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" /> Chép
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <span className="text-mute block text-[11px]">Số tiền chính xác:</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-bold text-base text-ink text-red-600">
                      {parseInt(qrData.amount).toLocaleString('vi-VN')}₫
                    </span>
                    <button
                      onClick={() => handleCopy(String(qrData.amount), 'amount')}
                      className="btn-secondary text-[11px] px-2 py-1 flex items-center gap-1"
                      title="Sao chép số tiền"
                    >
                      {copiedField === 'amount' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-success" /> Đã chép
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" /> Chép
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <span className="text-mute block text-[11px]">Nội dung chuyển khoản (Bắt buộc):</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono font-bold bg-soft-cloud px-2 py-1 rounded text-xs text-ink break-all border border-hairline-soft">
                      {qrData.transferContent}
                    </span>
                    <button
                      onClick={() => handleCopy(qrData.transferContent, 'content')}
                      className="btn-secondary text-[11px] px-2 py-1 flex items-center gap-1 shrink-0"
                      title="Sao chép nội dung"
                    >
                      {copiedField === 'content' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-success" /> Đã chép
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" /> Chép
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Test Simulation Trigger */}
            <div className="border-t border-hairline-soft pt-3 flex flex-col sm:flex-row items-center justify-between gap-2 bg-amber-500/5 p-3 rounded-md">
              <span className="text-[11px] text-amber-800 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-600" />
                Kiểm thử hệ thống: Bạn có thể kích hoạt giả lập ngân hàng gửi thông báo tiền về.
              </span>
              <button
                onClick={handleSimulatePaid}
                disabled={simulating}
                className="btn-secondary text-[11px] py-1 px-3 border-amber-500/30 text-amber-900 hover:bg-amber-500/10 shrink-0 font-semibold"
              >
                {simulating ? 'Đang xác thực...' : '⚡ Mô phỏng đã thanh toán (Test)'}
              </button>
            </div>
          </div>
        )
      )}

      {/* Warranty Mobile Badge */}
      <div className="bg-soft-cloud border border-hairline p-5 rounded-lg text-left space-y-2">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-success shrink-0" />
          <div>
            <p className="text-xs font-bold text-ink uppercase">PHIẾU BẢO HÀNH ĐIỆN TỬ ĐÃ ĐƯỢC TẠO</p>
            <p className="text-xs text-mute mt-0.5">
              Hệ thống đã tự động kích hoạt bảo hành 12 tháng chính hãng. Bạn có thể tra cứu quyền lợi bất kỳ lúc nào bằng Số điện thoại.
            </p>
          </div>
        </div>
      </div>

      {/* Gmail Confirmation Notification Card */}
      <div className="bg-canvas border border-hairline p-5 rounded-lg text-left space-y-3 shadow-sm">

        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0 mt-0.5 border border-red-100">
            <Mail className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <p className="text-xs font-bold text-ink uppercase tracking-wider">THÔNG BÁO XÁC NHẬN ĐƠN HÀNG QUA GMAIL</p>
              <span className="text-[10px] font-semibold text-success bg-success/10 px-2 py-0.5 rounded-full border border-success/20">
                Tự động gửi khi thanh toán
              </span>
            </div>
            <p className="text-xs text-mute mt-1 leading-relaxed">
              Biên lai điện tử, danh mục sản phẩm và lộ trình vận chuyển được gửi tự động về hòm thư Gmail của bạn theo chuẩn mẫu giao diện.
            </p>

            <div className="flex flex-col sm:flex-row gap-2 mt-3">
              <input
                type="email"
                placeholder="Nhập địa chỉ Gmail để nhận bản sao..."
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
                className="text-xs bg-canvas border border-hairline px-3 py-2 rounded flex-1 focus:outline-none focus:border-ink"
              />
              <button
                onClick={handleSendEmail}
                disabled={sendingEmail}
                className="btn-secondary text-xs py-2 px-4 shrink-0 font-semibold flex items-center justify-center gap-1.5 hover:border-ink"
              >
                {sendingEmail ? (
                  <>Đang gửi...</>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" /> {emailSent ? '✓ Đã gửi thành công' : 'Gửi lại vào Gmail'}
                  </>
                )}
              </button>
            </div>
            {emailSent && (
              <p className="text-[11px] text-success mt-1.5 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Đã gửi email xác nhận thành công! Vui lòng kiểm tra hộp thư đến (hoặc thư mục Spam/Quảng cáo).
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">

        {orderNumber && (
          <Link href={`/account/orders/${orderNumber}`} className="btn-secondary">
            <Package className="w-4 h-4 mr-2" /> Theo Dõi Đơn Hàng
          </Link>
        )}
        <Link href="/warranty" className="btn-secondary">
          <ShieldCheck className="w-4 h-4 mr-2" /> Tra Cứu Bảo Hành
        </Link>
        <Link href="/products" className="btn-primary">
          Tiếp Tục Mua Sắm <ArrowRight className="w-4 h-4 ml-2" />
        </Link>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <div className="max-w-[800px] mx-auto px-6 sm:px-12 py-16 text-center animate-fade-in">
      <Suspense fallback={<div className="py-20 text-mute">Đang tải thông tin đơn hàng...</div>}>
        <SuccessContent />
      </Suspense>
    </div>
  );
}
