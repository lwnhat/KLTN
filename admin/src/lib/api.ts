/**
 * SECURE ADMIN API CLIENT — HttpOnly Cookie & Silent Auto-Refresh Interceptor
 */

const defaultUrl = typeof window !== 'undefined' && window.location.hostname !== 'localhost'
  ? 'https://kltn-hx4s.onrender.com'
  : 'http://localhost:5000';
const rawUrl = (import.meta.env.VITE_API_URL as string) || defaultUrl;
export const API_BASE = rawUrl.endsWith('/api/v1') ? rawUrl : `${rawUrl.replace(/\/$/, '')}/api/v1`;




let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

export async function refreshAdminSession(): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'include', // ★ Gửi HttpOnly Cookie
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      throw new Error('Refresh admin session failed');
    }

    const data = await res.json();
    const newAccessToken = data.data?.accessToken;

    if (newAccessToken) {
      localStorage.setItem('admin_token', newAccessToken);
      if (data.data?.user) {
        localStorage.setItem('admin_user', JSON.stringify(data.data.user));
      }
      return newAccessToken;
    }
    return null;
  } catch {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    window.location.href = '/login';
    return null;
  }
}



export async function adminFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = localStorage.getItem('admin_token');
  const fullUrl = url.startsWith('http') ? url : `${API_BASE}${url}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const mergedOptions: RequestInit = {
    ...options,
    credentials: 'include', // ★ Bắt buộc gửi HttpOnly Cookie
    headers,
  };

  let response = await fetch(fullUrl, mergedOptions);

  if (response.status === 401 && !url.includes('/auth/login') && !url.includes('/auth/refresh')) {
    if (!isRefreshing) {
      isRefreshing = true;
      const newToken = await refreshAdminSession();
      isRefreshing = false;

      if (newToken) {
        onRefreshed(newToken);
        headers['Authorization'] = `Bearer ${newToken}`;
        return fetch(fullUrl, { ...mergedOptions, headers });
      } else {
        return response;
      }
    } else {
      return new Promise((resolve) => {
        subscribeTokenRefresh(async (newToken) => {
          headers['Authorization'] = `Bearer ${newToken}`;
          resolve(fetch(fullUrl, { ...mergedOptions, headers }));
        });
      });
    }
  }

  return response;
}
