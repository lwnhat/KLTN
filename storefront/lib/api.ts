/**
 * SECURE API CLIENT — HttpOnly Cookie + In-Memory Access Token
 *
 * ★ Kiến trúc bảo mật chống XSS & CSRF:
 * - Refresh Token: Lưu trong HttpOnly Cookie (trình duyệt tự quản lý, JavaScript không thể đọc)
 * - Access Token: Lưu trong biến JavaScript in-memory (mất khi refresh tab — intentional)
 * - Thông tin user (metadata không nhạy cảm): Vẫn trong localStorage để hiển thị UI sau reload
 *
 * ★ Luồng hoạt động:
 * 1. Login → backend set HttpOnly Cookie (refresh_token) + trả JSON (accessToken + user)
 * 2. accessToken được lưu vào biến RAM _accessToken (không localStorage)
 * 3. Mọi API call gửi kèm `Authorization: Bearer <accessToken>` + `credentials: 'include'`
 * 4. Khi accessToken hết hạn (401), auto-refresh bằng HttpOnly Cookie → nhận accessToken mới
 * 5. Sau khi refresh tab: token trong RAM biến mất → tự động silent refresh bằng cookie
 */

// ─── In-Memory Token Store (XSS-safe: không lưu vào localStorage) ────────────
let _accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  _accessToken = token;
}

export function getAccessToken(): string | null {
  return _accessToken;
}

export function clearAccessToken() {
  _accessToken = null;
}

// ─── Refresh Token Queue (tránh gọi refresh nhiều lần song song) ─────────────
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

/**
 * Silent Session Refresh qua HttpOnly Cookie
 * Được gọi tự động khi access token hết hạn (401), hoặc khi user reload trang
 */
export async function refreshSession(): Promise<string | null> {
  try {
    const res = await fetch('/api/v1/auth/refresh', {
      method: 'POST',
      credentials: 'include', // ★ Gửi HttpOnly refresh_token cookie
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      throw new Error('Refresh session failed');
    }

    const data = await res.json();
    const newAccessToken = data.data?.accessToken;

    if (newAccessToken) {
      setAccessToken(newAccessToken); // Lưu vào RAM, không localStorage
      if (data.data?.user) {
        // Chỉ lưu user metadata (không nhạy cảm) để hiển thị UI
        localStorage.setItem('user_info', JSON.stringify(data.data.user));
      }
      return newAccessToken;
    }
    return null;
  } catch {
    // Phiên làm việc đã hết hạn hoặc bị thu hồi (cookie expired/revoked)
    clearAccessToken();
    localStorage.removeItem('user_info');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('auth-change'));
    }
    return null;
  }
}

/**
 * Authenticated Fetch Wrapper với Silent Auto-Refresh
 * Dùng cho mọi API call cần authentication trong storefront
 */
export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  // Lấy token từ RAM
  let token = getAccessToken();

  // Chỉ silent refresh nếu user đã từng đăng nhập (có user_info trong localStorage)
  const hasSavedSession = typeof window !== 'undefined' && !!localStorage.getItem('user_info');

  if (!token && hasSavedSession && !url.includes('/auth/login') && !url.includes('/auth/refresh')) {
    token = await refreshSession();
  }


  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const mergedOptions: RequestInit = {
    ...options,
    credentials: 'include', // ★ Luôn đính kèm HttpOnly Cookie cho mọi request
    headers,
  };

  let response = await fetch(url, mergedOptions);

  // Access Token hết hạn (401) — thực hiện silent refresh và retry
  if (response.status === 401 && !url.includes('/auth/login') && !url.includes('/auth/refresh')) {
    if (!isRefreshing) {
      isRefreshing = true;

      const newToken = await refreshSession();
      isRefreshing = false;

      if (newToken) {
        onRefreshed(newToken);
        headers['Authorization'] = `Bearer ${newToken}`;
        return fetch(url, { ...mergedOptions, headers });
      } else {
        return response;
      }
    } else {
      // Có request khác đang refresh → chờ nó xong rồi retry
      return new Promise((resolve) => {
        subscribeTokenRefresh(async (newToken) => {
          headers['Authorization'] = `Bearer ${newToken}`;
          resolve(fetch(url, { ...mergedOptions, headers }));
        });
      });
    }
  }

  return response;
}
