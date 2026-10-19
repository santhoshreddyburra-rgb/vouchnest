import { AuthUser, Coupon, ClaimRecord, AdminStats } from '../types';

const TOKEN_KEY = 'vouchnest_auth_token';
const USER_KEY = 'vouchnest_auth_user';

export const authStorage = {
  getToken(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  setToken(token: string) {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {}
  },
  getUser(): AuthUser | null {
    try {
      const data = localStorage.getItem(USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },
  setUser(user: AuthUser | null) {
    try {
      if (user) {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(TOKEN_KEY);
      }
    } catch {}
  },
  clear() {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch {}
  },
};

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  const token = authStorage.getToken();

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const errorMessage =
      (typeof data === 'object' && data !== null && 'error' in data && (data as any).error) ||
      `HTTP Error ${response.status}: ${response.statusText}`;
    const error: any = new Error(errorMessage);
    error.status = response.status;
    error.code = (typeof data === 'object' && data !== null && (data as any).code) || undefined;
    error.details = data;
    throw error;
  }

  return data as T;
}

export const api = {
  auth: {
    async loginAdmin(credentials: { email: string; password: string }): Promise<{ user: AuthUser; token: string }> {
      const res = await request<{ user: AuthUser; token: string }>('/api/auth/admin/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
      authStorage.setToken(res.token);
      authStorage.setUser(res.user);
      return res;
    },

    async loginUser(credentials: { email: string; password: string }): Promise<{ user: AuthUser; token: string }> {
      const res = await request<{ user: AuthUser; token: string }>('/api/auth/user/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
      authStorage.setToken(res.token);
      authStorage.setUser(res.user);
      return res;
    },

    async registerUser(data: {
      username: string;
      email: string;
      fullName?: string;
      password: string;
      age?: number;
      phone?: string;
      mobile?: string;
    }): Promise<{ user: AuthUser; token: string }> {
      const res = await request<{ user: AuthUser; token: string }>('/api/auth/user/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      authStorage.setToken(res.token);
      authStorage.setUser(res.user);
      return res;
    },

    async getMe(): Promise<{ user: AuthUser }> {
      return request<{ user: AuthUser }>('/api/auth/me');
    },

    async logout(): Promise<void> {
      try {
        await request('/api/auth/logout', { method: 'POST' });
      } catch {}
      authStorage.clear();
    },
  },

  admin: {
    async getCoupons(): Promise<{ count: number; coupons: Coupon[] }> {
      return request<{ count: number; coupons: Coupon[] }>('/api/admin/coupons');
    },

    async addCoupon(couponData: Partial<Coupon>): Promise<{ message: string; coupon: Coupon }> {
      return request<{ message: string; coupon: Coupon }>('/api/admin/coupons', {
        method: 'POST',
        body: JSON.stringify(couponData),
      });
    },

    async updateCoupon(id: string, couponData: Partial<Coupon>): Promise<{ message: string; coupon: Coupon }> {
      return request<{ message: string; coupon: Coupon }>(`/api/admin/coupons/${id}`, {
        method: 'PUT',
        body: JSON.stringify(couponData),
      });
    },

    async deleteCoupon(id: string): Promise<{ message: string; deletedCouponId: string }> {
      return request<{ message: string; deletedCouponId: string }>(`/api/admin/coupons/${id}`, {
        method: 'DELETE',
      });
    },

    async getClaims(): Promise<{ count: number; claims: ClaimRecord[] }> {
      return request<{ count: number; claims: ClaimRecord[] }>('/api/admin/claims');
    },

    async getStats(): Promise<AdminStats> {
      return request<AdminStats>('/api/admin/stats');
    },

    async testRbac(): Promise<any> {
      return request('/api/admin/test-rbac', { method: 'POST' });
    },
  },

  user: {
    async getCoupons(): Promise<{ count: number; coupons: Coupon[] }> {
      return request<{ count: number; coupons: Coupon[] }>('/api/coupons');
    },

    async getCoupon(id: string): Promise<{ coupon: Coupon }> {
      return request<{ coupon: Coupon }>(`/api/coupons/${id}`);
    },

    async claimCoupon(id: string, details?: { paymentMethod?: string; transactionId?: string }): Promise<{ message: string; code: string; claim: ClaimRecord }> {
      return request<{ message: string; code: string; claim: ClaimRecord }>(`/api/coupons/${id}/claim`, {
        method: 'POST',
        body: JSON.stringify(details || {}),
      });
    },

    async getMyCoupons(): Promise<{ count: number; claims: ClaimRecord[] }> {
      return request<{ count: number; claims: ClaimRecord[] }>('/api/user/my-coupons');
    },
  },
};
