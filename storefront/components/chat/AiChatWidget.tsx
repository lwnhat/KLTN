"use client";

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  X,
  Send,
  RotateCcw,
  Copy,
  Check,
  ChevronDown,
  Info,
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
}

const STORAGE_KEY = 'dw_ai_chat_history_v1';

const INITIAL_WELCOME_MESSAGE: Message = {
  id: 'welcome-1',
  role: 'model',
  text: 'Dạ Daniel Wellington xin kính chào Quý khách! 💎\n\nEm là **Trợ Lý Kim Hoàn AI**. Em có thể tư vấn mẫu nhẫn, dây chuyền phù hợp ngân sách, hướng dẫn đo cỡ ngón tay, hoặc kiểm tra đơn hàng & bảo hành giúp Quý khách ạ ✨',
};

export default function AiChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showTeaser, setShowTeaser] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([INITIAL_WELCOME_MESSAGE]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 1. Khôi phục lịch sử chat từ sessionStorage khi khởi tạo
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
        }
      }
    } catch {
      // Bỏ qua lỗi parse
    }

    // Hiện teaser tooltip sau 4 giây nếu chưa mở chat
    const teaserTimer = setTimeout(() => {
      setShowTeaser(true);
    }, 4000);

    return () => clearTimeout(teaserTimer);
  }, []);

  // 2. Tự động lưu lịch sử hội thoại vào sessionStorage
  useEffect(() => {
    try {
      if (messages.length > 1) {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
      }
    } catch {
      // Bỏ qua lỗi quota
    }
  }, [messages]);

  // 3. Tự động cuộn xuống đáy khi có tin nhắn mới hoặc đang gõ
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages, loading]);

  // 4. Lắng nghe phím ESC để đóng nhanh hộp chat
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Chips gợi ý nhanh — luôn hiển thị phía trên ô nhập liệu
  const quickPrompts = [
    '💍 Nhẫn cầu hôn < 5 triệu',
    '📦 Tra đơn hàng theo SĐT',
    '🛡️ Tra bảo hành theo SĐT',
    '📏 Cách đo size ngón tay',
    '✨ Khắc chữ laser mất bao lâu?',
    '📍 Địa chỉ showroom',
  ];

  // Chip thông minh: chip liên quan SĐT thì điền template vào input (không gửi ngay)
  const handleQuickPrompt = (prompt: string) => {
    if (prompt.includes('đơn hàng theo SĐT')) {
      setInput('Tra đơn hàng theo số điện thoại: ');
      setTimeout(() => inputRef.current?.focus(), 50);
    } else if (prompt.includes('bảo hành theo SĐT')) {
      setInput('Tra bảo hành theo số điện thoại: ');
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      handleSend(prompt);
    }
  };

  const handleSend = async (textToSend?: string) => {
    const messageText = (textToSend || input).trim();
    if (!messageText || loading) return;

    const userMsg: Message = {
      id: 'user-' + Date.now(),
      role: 'user',
      text: messageText,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Gửi kèm tối đa 5 tin nhắn trước làm ngữ cảnh
      const history = messages.slice(-5).map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const res = await fetch('/api/v1/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText, history }),
      });

      const data = await res.json();

      if (res.ok && data?.data?.reply) {
        setMessages((prev) => [
          ...prev,
          {
            id: 'model-' + Date.now(),
            role: 'model',
            text: data.data.reply,
          },
        ]);
      } else {
        const errorMsg =
          data?.error?.message ||
          'Xin lỗi Quý khách, em đang gặp gián đoạn tạm thời. Quý khách vui lòng thử lại sau giây lát ạ!';
        setMessages((prev) => [
          ...prev,
          {
            id: 'err-' + Date.now(),
            role: 'model',
            text: `⚠️ ${errorMsg}`,
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: 'err-' + Date.now(),
          role: 'model',
          text: '⚠️ Không thể kết nối với máy chủ AI. Quý khách vui lòng kiểm tra kết nối mạng ạ!',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Làm mới cuộc hội thoại & xóa bộ nhớ đệm
  const handleResetChat = () => {
    const freshMessages = [
      {
        id: 'welcome-reset-' + Date.now(),
        role: 'model' as const,
        text: 'Dạ phiên trò chuyện đã được làm mới. Em có thể tư vấn mẫu trang sức hoặc giải đáp thắc mắc gì cho Quý khách ạ? 💎',
      },
    ];
    setMessages(freshMessages);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  // Sao chép nội dung tin nhắn
  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  /**
   * Helper parse markdown: in đậm (**text**), liên kết ([text](url)) và gạch đầu dòng
   */
  const renderFormattedText = (text: string) => {
    const lines = text.split('\n');

    return lines.map((line, lineIdx) => {
      const parts = [];
      let lastIndex = 0;
      const combinedRegex = /(\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*)/g;
      let match;

      while ((match = combinedRegex.exec(line)) !== null) {
        if (match.index > lastIndex) {
          parts.push(line.substring(lastIndex, match.index));
        }

        if (match[1].startsWith('[')) {
          const linkText = match[2];
          const linkUrl = match[3];
          parts.push(
            <Link
              key={`link-${match.index}`}
              href={linkUrl}
              onClick={() => setIsOpen(false)}
              className="inline-flex items-center text-amber-600 dark:text-amber-400 font-bold underline hover:text-ink transition-colors bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded text-xs mx-0.5"
            >
              {linkText} →
            </Link>
          );
        } else if (match[1].startsWith('**')) {
          const boldText = match[4];
          parts.push(
            <strong key={`bold-${match.index}`} className="font-bold text-ink">
              {boldText}
            </strong>
          );
        }

        lastIndex = match.index + match[0].length;
      }

      if (lastIndex < line.length) {
        parts.push(line.substring(lastIndex));
      }

      return (
        <span key={lineIdx} className="block min-h-[1.25rem]">
          {parts.length > 0 ? parts : line}
        </span>
      );
    });
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* ─── 1. BONG BÓNG GỢI Ý CHÀO HỎI (TEASER TOOLTIP) ────────────────── */}
      {!isOpen && showTeaser && (
        <div className="absolute bottom-16 right-0 mb-2 w-64 bg-canvas text-ink p-3 rounded-2xl shadow-xl border border-hairline animate-in fade-in slide-in-from-bottom-2 duration-300">
          <button
            onClick={() => setShowTeaser(false)}
            className="absolute top-2 right-2 text-mute hover:text-ink p-0.5"
            title="Đóng"
          >
            <X className="w-3 h-3" />
          </button>
          <div
            onClick={() => {
              setIsOpen(true);
              setShowTeaser(false);
            }}
            className="cursor-pointer space-y-1"
          >
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Tư Vấn Kim Hoàn 24/7</span>
            </div>
            <p className="text-xs text-mute leading-snug">
              Cần gợi ý quà tặng hoặc hướng dẫn đo cỡ ngón tay? Nhắn em ngay nhé! 👋
            </p>
          </div>
          {/* Mũi tên trỏ xuống */}
          <div className="absolute -bottom-1.5 right-6 w-3 h-3 bg-canvas border-r border-b border-hairline transform rotate-45" />
        </div>
      )}

      {/* ─── 2. NÚT NỔI MỞ CHAT (FLOATING BUTTON) ───────────────────────── */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            setShowTeaser(false);
          }}
          className="group relative flex items-center gap-2.5 bg-ink text-canvas hover:bg-neutral-800 p-3.5 sm:px-5 sm:py-3.5 rounded-full shadow-2xl transition-all duration-300 hover:scale-105 border border-hairline active:scale-95"
          aria-label="Mở Trợ lý Kim Hoàn AI"
        >
          <div className="relative flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-amber-400 animate-spin-slow" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-canvas" />
          </div>

          <span className="hidden sm:inline-block text-xs uppercase tracking-wider font-bold">
            Trợ Lý Kim Hoàn AI
          </span>
          <span className="sm:hidden text-xs font-bold">AI</span>
        </button>
      )}

      {/* ─── 3. CỬA SỔ CHAT CHÍNH (POPOVER CHAT WINDOW) ─────────────────── */}
      {isOpen && (
        <div className="w-[370px] sm:w-[410px] max-w-[calc(100vw-24px)] h-[580px] max-h-[calc(100vh-100px)] bg-canvas border border-hairline rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div className="bg-ink text-canvas px-4 py-3.5 flex items-center justify-between shrink-0 border-b border-neutral-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-[0.15em] text-canvas">
                  DANIEL WELLINGTON
                </h3>
                <div className="flex items-center gap-1.5 text-[10px] text-mute">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Trợ Lý Kim Hoàn AI (Trực Tuyến)</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 text-mute">
              <button
                onClick={handleResetChat}
                title="Làm mới cuộc trò chuyện"
                className="p-1.5 hover:text-canvas hover:bg-neutral-800 rounded-md transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Đóng (hoặc nhấn ESC)"
                className="p-1.5 hover:text-canvas hover:bg-neutral-800 rounded-md transition-colors"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages List Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs sm:text-sm bg-soft-cloud/30">
            {messages.map((m) => {
              const isUser = m.role === 'user';
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 leading-relaxed ${
                      isUser
                        ? 'bg-ink text-canvas rounded-br-none shadow-sm'
                        : 'bg-canvas text-ink border border-hairline-soft rounded-bl-none shadow-sm space-y-1'
                    }`}
                  >
                    {isUser ? m.text : renderFormattedText(m.text)}
                  </div>

                  {/* Nút Copy cho tin nhắn của bot */}
                  {!isUser && (
                    <div className="mt-1 flex items-center gap-1 pl-1 text-[11px] text-mute">
                      <button
                        onClick={() => handleCopyMessage(m.id, m.text)}
                        className="flex items-center gap-1 hover:text-ink transition-colors"
                        title="Sao chép câu trả lời"
                      >
                        {copiedId === m.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-600 text-[10px]">Đã chép</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span className="text-[10px]">Sao chép</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Typing Indicator */}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-canvas border border-hairline rounded-2xl rounded-bl-none px-4 py-3 shadow-sm flex items-center gap-1.5">
                  <span className="text-xs text-mute font-medium mr-1">
                    Trợ lý AI đang tra cứu & soạn câu trả lời
                  </span>
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions Chips Bar (Luôn hiển thị tiện lợi) */}
          <div className="px-3 py-2 bg-canvas border-t border-hairline-soft flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleQuickPrompt(prompt)}
                disabled={loading}
                className="shrink-0 text-[11px] font-medium bg-soft-cloud hover:bg-neutral-200 text-ink px-2.5 py-1 rounded-full border border-hairline transition-all active:scale-95 disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <div className="p-3 bg-canvas border-t border-hairline shrink-0">
            <div className="flex items-center gap-2 bg-soft-cloud/70 border border-hairline rounded-xl px-3 py-1.5 focus-within:border-ink focus-within:bg-canvas transition-colors">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleInputKeyDown}
                placeholder="Hỏi về trang sức, tra đơn SĐT hoặc mã ORD-..."
                disabled={loading}
                className="flex-1 bg-transparent text-xs sm:text-sm text-ink outline-none placeholder:text-mute"
              />

              {/* Nút xóa nhanh nội dung đang nhập */}
              {input.length > 0 && !loading && (
                <button
                  onClick={() => setInput('')}
                  className="text-mute hover:text-ink p-0.5"
                  title="Xóa nội dung"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                onClick={() => handleSend()}
                disabled={loading || !input.trim()}
                className="p-1.5 rounded-lg bg-ink text-canvas hover:bg-neutral-800 disabled:opacity-40 disabled:hover:bg-ink transition-colors shrink-0"
                title="Gửi câu hỏi (Enter)"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex items-center justify-between text-[10px] text-mute mt-1.5 px-1">
              <span>Hỗ trợ bởi Google Gemini AI</span>
              <span className="hidden sm:inline">Phím tắt: ESC để đóng • Enter để gửi</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
