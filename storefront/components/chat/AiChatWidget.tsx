"use client";

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Sparkles, MessageSquare, X, Send, RotateCcw, ChevronDown } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
}

export default function AiChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-1',
      role: 'model',
      text: 'Dạ Daniel Wellington xin kính chào Quý khách! 💎\n\nEm là **Trợ Lý Kim Hoàn AI**. Em có thể hỗ trợ Quý khách tìm mẫu nhẫn, dây chuyền phù hợp ngân sách, hướng dẫn đo cỡ ngón tay hoặc giải đáp chính sách bảo hành ạ ✨',
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Tự động cuộn xuống tin nhắn mới nhất
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages, loading]);

  const quickPrompts = [
    '💍 Tư vấn nhẫn cầu hôn dưới 5 triệu',
    '📏 Hướng dẫn tự đo size ngón tay',
    '✨ Khắc chữ laser mất bao lâu?',
    '🛡️ Chính sách bảo hành 12 tháng',
  ];

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
      // Gửi kèm tối đa 4 tin nhắn trước làm ngữ cảnh
      const history = messages.slice(-4).map((m) => ({
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
        const errorMsg = data?.error?.message || 'Xin lỗi Quý khách, hệ thống đang bận. Quý khách vui lòng thử lại sau giây lát!';
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: 'welcome-reset',
        role: 'model',
        text: 'Dạ phiên trò chuyện đã được làm mới. Em có thể tư vấn mẫu trang sức hoặc giải đáp thắc mắc gì cho Quý khách ạ? 💎',
      },
    ]);
  };

  /**
   * Helper parse markdown đơn giản: in đậm (**text**) và liên kết ([text](url))
   */
  const renderFormattedText = (text: string) => {
    const lines = text.split('\n');

    return lines.map((line, lineIdx) => {
      // Parse markdown link: [name](url) và bold: **bold**
      const parts = [];
      let lastIndex = 0;
      const combinedRegex = /(\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*)/g;
      let match;

      while ((match = combinedRegex.exec(line)) !== null) {
        // Text trước match
        if (match.index > lastIndex) {
          parts.push(line.substring(lastIndex, match.index));
        }

        if (match[1].startsWith('[')) {
          // Link markdown: [text](url)
          const linkText = match[2];
          const linkUrl = match[3];
          parts.push(
            <Link
              key={`link-${match.index}`}
              href={linkUrl}
              onClick={() => setIsOpen(false)}
              className="inline-flex items-center text-amber-600 dark:text-amber-400 font-bold underline hover:text-ink transition-colors bg-amber-50 dark:bg-amber-950/30 px-1.5 py-0.5 rounded text-xs mx-0.5"
            >
              {linkText} →
            </Link>
          );
        } else if (match[1].startsWith('**')) {
          // Bold text: **text**
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
      {/* ─── 1. BONG BÓNG MỞ CHAT (FLOATING BUTTON) ─────────────────────── */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-2.5 bg-ink text-canvas hover:bg-neutral-800 p-3.5 sm:px-5 sm:py-3.5 rounded-full shadow-2xl transition-all duration-300 hover:scale-105 border border-hairline active:scale-95"
          aria-label="Mở Trợ lý AI"
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

      {/* ─── 2. HỘP THOẠI CHAT CHÍNH (POPOVER WINDOW) ───────────────────── */}
      {isOpen && (
        <div className="w-[370px] sm:w-[410px] max-w-[calc(100vw-24px)] h-[560px] max-h-[calc(100vh-100px)] bg-canvas border border-hairline rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
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
                title="Đóng cửa sổ"
                className="p-1.5 hover:text-canvas hover:bg-neutral-800 rounded-md transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs sm:text-sm bg-soft-cloud/30">
            {messages.map((m) => {
              const isUser = m.role === 'user';
              return (
                <div
                  key={m.id}
                  className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
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
                </div>
              );
            })}

            {/* Typing Indicator */}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-canvas border border-hairline rounded-2xl rounded-bl-none px-4 py-3 shadow-sm flex items-center gap-1.5">
                  <span className="text-xs text-mute font-medium mr-1">Trợ lý AI đang soạn câu trả lời</span>
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions Chips */}
          {messages.length <= 2 && !loading && (
            <div className="px-3 py-2 bg-canvas border-t border-hairline-soft flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {quickPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(prompt)}
                  className="shrink-0 text-[11px] font-medium bg-soft-cloud hover:bg-neutral-200 text-ink px-2.5 py-1 rounded-full border border-hairline transition-all"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Input Bar */}
          <div className="p-3 bg-canvas border-t border-hairline shrink-0">
            <div className="flex items-center gap-2 bg-soft-cloud/70 border border-hairline rounded-xl px-3 py-1.5 focus-within:border-ink focus-within:bg-canvas transition-colors">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Hỏi về trang sức, size nhẫn, bảo hành..."
                disabled={loading}
                className="flex-1 bg-transparent text-xs sm:text-sm text-ink outline-none placeholder:text-mute"
              />
              <button
                onClick={() => handleSend()}
                disabled={loading || !input.trim()}
                className="p-1.5 rounded-lg bg-ink text-canvas hover:bg-neutral-800 disabled:opacity-40 disabled:hover:bg-ink transition-colors shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[10px] text-center text-mute mt-1.5">
              Được hỗ trợ bởi Google Gemini AI • Tư vấn viên trang sức 24/7
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
