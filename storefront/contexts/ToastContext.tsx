"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  Heart,
  CheckCircle2,
  AlertCircle,
  Info,
  X,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export type ToastType = 'cart' | 'wishlist' | 'success' | 'error' | 'info';

export interface CartToastItem {
  productName: string;
  variantName?: string;
  price: number;
  image?: string;
  customizationText?: string;
  quantity?: number;
}

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  cartItem?: CartToastItem;
  duration?: number;
}

interface ToastContextType {
  showToast: (toast: Omit<Toast, 'id'>) => void;
  showSuccess: (message: string, title?: string) => void;
  showError: (message: string, title?: string) => void;
  showInfo: (message: string, title?: string) => void;
  showCartToast: (item: CartToastItem) => void;
  showWishlistToast: (productName: string, isAdded: boolean) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (toast: Omit<Toast, 'id'>) => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const duration = toast.duration || (toast.type === 'cart' ? 5500 : 4000);
      const newToast: Toast = { ...toast, id, duration };

      setToasts((prev) => {
        // Prevent duplicate spam of identical message
        if (prev.some((t) => t.title === toast.title && t.message === toast.message)) {
          return prev;
        }
        const updated = [...prev, newToast];
        return updated.slice(-2); // Limit to at most 2 toasts simultaneously
      });

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );


  const showSuccess = useCallback(
    (message: string, title = 'Thành công') => {
      showToast({ type: 'success', title, message });
    },
    [showToast]
  );

  const showError = useCallback(
    (message: string, title = 'Có lỗi xảy ra') => {
      showToast({ type: 'error', title, message, duration: 6000 });
    },
    [showToast]
  );

  const showInfo = useCallback(
    (message: string, title = 'Thông báo') => {
      showToast({ type: 'info', title, message });
    },
    [showToast]
  );

  const showCartToast = useCallback(
    (cartItem: CartToastItem) => {
      showToast({
        type: 'cart',
        title: 'Đã Thêm Vào Giỏ Hàng',
        cartItem,
        duration: 6000,
      });
    },
    [showToast]
  );

  const showWishlistToast = useCallback(
    (productName: string, isAdded: boolean) => {
      showToast({
        type: 'wishlist',
        title: isAdded ? 'Đã Lưu Yêu Thích' : 'Đã Bỏ Yêu Thích',
        message: isAdded
          ? `"${productName}" đã được thêm vào danh sách mong ước của bạn.`
          : `"${productName}" đã được xóa khỏi danh sách mong ước.`,
        duration: 3500,
      });
    },
    [showToast]
  );

  return (
    <ToastContext.Provider
      value={{
        showToast,
        showSuccess,
        showError,
        showInfo,
        showCartToast,
        showWishlistToast,
        removeToast,
      }}
    >
      {children}

      {/* Toast Render Container: Fixed bottom-right with maximum z-index */}
      <div
        aria-live="polite"
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          width: 'calc(100% - 32px)',
          maxWidth: '420px',
          pointerEvents: 'none',
        }}
      >

        {toasts.map((toast) => (
          <div
            key={toast.id}
            style={{
              background: '#ffffff',
              color: '#111111',
              border: '1px solid #e5e5e5',
              boxShadow: '0 20px 45px -10px rgba(0, 0, 0, 0.18), 0 0 1px rgba(0, 0, 0, 0.1)',
              borderRadius: 12,
            }}
            className="pointer-events-auto p-4 overflow-hidden luxury-toast-enter transition-all duration-300 relative group"
          >
            {/* Header / Type Icon */}
            <div className="flex items-start gap-3">
              {toast.type === 'cart' && (
                <div className="w-9 h-9 rounded-full bg-ink text-canvas flex items-center justify-center shrink-0 shadow-sm">
                  <ShoppingBag className="w-4 h-4 text-canvas" />
                </div>
              )}
              {toast.type === 'wishlist' && (
                <div className="w-9 h-9 rounded-full bg-sale/10 border border-sale/30 text-sale flex items-center justify-center shrink-0">
                  <Heart className="w-4 h-4 fill-sale text-sale" />
                </div>
              )}
              {toast.type === 'success' && (
                <div className="w-9 h-9 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-700 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                </div>
              )}
              {toast.type === 'error' && (
                <div className="w-9 h-9 rounded-full bg-sale/10 border border-sale/30 text-sale flex items-center justify-center shrink-0">
                  <AlertCircle className="w-4 h-4 text-sale" />
                </div>
              )}
              {toast.type === 'info' && (
                <div className="w-9 h-9 rounded-full bg-soft-cloud border border-hairline text-ink flex items-center justify-center shrink-0">
                  <Info className="w-4 h-4 text-ink" />
                </div>
              )}

              {/* Main Content */}
              <div className="flex-1 min-w-0 pr-2">
                <div className="flex items-center gap-1.5">
                  <h4 className="font-bold text-sm text-ink uppercase tracking-wider flex items-center gap-1.5">
                    {toast.title}
                    {toast.type === 'cart' && <Sparkles className="w-3.5 h-3.5 text-ink animate-pulse" />}
                  </h4>
                </div>

                {/* Cart Specific Rich Body */}
                {toast.type === 'cart' && toast.cartItem ? (
                  <div
                    style={{
                      background: '#f9fafb',
                      border: '1px solid #e5e5e5',
                      borderRadius: 8,
                      padding: 10,
                    }}
                    className="mt-2.5 flex items-center gap-3"
                  >
                    <img
                      src={toast.cartItem.image || 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=200'}
                      alt={toast.cartItem.productName}
                      style={{ width: 52, height: 52, borderRadius: 6, objectFit: 'cover' }}
                      className="shrink-0 bg-soft-cloud border border-hairline-soft"
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=200';
                      }}
                    />
                    <div className="flex-1 min-w-0 text-xs space-y-0.5">
                      <p className="font-bold text-ink truncate text-xs">{toast.cartItem.productName}</p>
                      {toast.cartItem.variantName && (
                        <p className="text-mute truncate text-[11px]">{toast.cartItem.variantName}</p>
                      )}
                      {toast.cartItem.customizationText && (
                        <p className="text-charcoal text-[10px] truncate font-medium">
                          ✏️ Khắc: "{toast.cartItem.customizationText}"
                        </p>
                      )}
                      <p className="font-bold text-ink text-sm leading-tight pt-0.5">
                        {toast.cartItem.price.toLocaleString('vi-VN')}₫
                      </p>
                    </div>
                  </div>
                ) : (
                  toast.message && (
                    <p className="text-xs text-mute mt-1 leading-relaxed">{toast.message}</p>
                  )
                )}

                {/* Action Button for Cart */}
                {toast.type === 'cart' && (
                  <div className="mt-3 flex items-center justify-between gap-2 pt-2.5 border-t border-hairline-soft">
                    <span className="text-[11px] text-mute font-medium whitespace-nowrap">
                      ⏱️ Giữ kho 15 phút
                    </span>
                    <Link
                      href="/cart"
                      onClick={() => removeToast(toast.id)}
                      className="bg-ink hover:bg-black text-canvas text-xs font-bold uppercase tracking-wider px-3.5 py-2 rounded inline-flex items-center gap-1.5 transition-all shadow-sm active:scale-95 whitespace-nowrap"
                    >
                      Xem Giỏ Hàng <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                )}
              </div>

              {/* Close Button */}
              <button
                onClick={() => removeToast(toast.id)}
                className="text-mute hover:text-ink transition-colors p-1 rounded-full hover:bg-soft-cloud shrink-0"
                aria-label="Đóng thông báo"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Countdown Progress Bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-hairline-soft overflow-hidden">
              <div
                className="h-full bg-ink origin-left"
                style={{
                  animation: `progress-bar ${toast.duration || 6000}ms linear forwards`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
