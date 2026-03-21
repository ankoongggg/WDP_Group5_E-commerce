const API_BASE = 'http://localhost:9999/api';
export const getGoogleAuthUrl = () => `${API_BASE}/auth/google`;

interface ApiOptions extends RequestInit {
    requireAuth?: boolean;
}

let onTokenRefreshFailed: (() => void) | null = null;
export const setOnTokenRefreshFailed = (callback: () => void) => { onTokenRefreshFailed = callback; };

const getAccessToken = () => localStorage.getItem('accessToken');
const getRefreshToken = () => localStorage.getItem('refreshToken');

export const setTokens = (accessToken: string, refreshToken: string) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
};

export const clearTokens = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
};

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const onRefreshed = (token: string) => {
    refreshSubscribers.forEach(cb => cb(token));
    refreshSubscribers = [];
};

const addRefreshSubscriber = (cb: (token: string) => void) => {
    refreshSubscribers.push(cb);
};

const tryRefreshToken = async (): Promise<string | null> => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return null;
    try {
        const response = await fetch(`${API_BASE}/auth/refresh-token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
        });
        if (!response.ok) return null;
        const data = await response.json();
        setTokens(data.accessToken, data.refreshToken);
        return data.accessToken;
    } catch { return null; }
};

export const api = async <T = any>(endpoint: string, options: ApiOptions = {}): Promise<T> => {
    const { requireAuth = false, headers: customHeaders, ...rest } = options;
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...customHeaders as Record<string, string>,
    };

    if (requireAuth) {
        const token = getAccessToken();
        if (token) headers['Authorization'] = `Bearer ${token}`;
    }

    let response = await fetch(`${API_BASE}${endpoint}`, { ...rest, headers });

    if (response.status === 401 && requireAuth) {
        if (!isRefreshing) {
            isRefreshing = true;
            const newToken = await tryRefreshToken();
            isRefreshing = false;
            if (newToken) {
                onRefreshed(newToken);
                headers['Authorization'] = `Bearer ${newToken}`;
                response = await fetch(`${API_BASE}${endpoint}`, { ...rest, headers });
            } else {
                clearTokens();
                onTokenRefreshFailed?.();
                throw new Error('Session expired');
            }
        } else {
            const newToken = await new Promise<string>(resolve => addRefreshSubscriber(resolve));
            headers['Authorization'] = `Bearer ${newToken}`;
            response = await fetch(`${API_BASE}${endpoint}`, { ...rest, headers });
        }
    }

    const data = await response.json();
    if (!response.ok) throw { status: response.status, ...data };
    return data;
};

export const authApi = {
    login: async (email: string, password: string) => {
        const data = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
        if (data.accessToken) setTokens(data.accessToken, data.refreshToken || '');
        return data;
    },
    
    register: (name: string, email: string, password: string, phone: string, street: string, district: string, city: string) =>
        api('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password, phone, street, district, city }) }),
        
    getProfile: () => api('/users/me', { requireAuth: true }),
    
    updateProfile: (payload: any) => api('/users/me', { method: 'PUT', requireAuth: true, body: JSON.stringify(payload) }),
    
    logout: () => api('/auth/logout', { method: 'POST', requireAuth: true }),

    changePassword: async (currentPassword: string, newPassword: string) => {
        return api('/users/change-password', {
            method: 'PUT',
            requireAuth: true,
            body: JSON.stringify({ currentPassword, newPassword })
        });
    },

    toggleWishlist: (productId: string) => 
        api('/users/wishlist/toggle', {
            method: 'POST',
            requireAuth: true,
            body: JSON.stringify({ productId })
        }),

    toggleFollowStore: (storeId: string) =>
        api('/users/follow/toggle', {
            method: 'POST',
            requireAuth: true,
            body: JSON.stringify({ storeId })
        }),

    getWishlist: (params: { page?: number, search?: string, limit?: number }) => {
        const query = new URLSearchParams();
        if (params.page) query.append('page', params.page.toString());
        if (params.search) query.append('search', params.search);
        if (params.limit) query.append('limit', params.limit.toString());
        return api(`/users/wishlist?${query.toString()}`, { requireAuth: true });
    },

    getFollowingStores: (params: { page?: number, search?: string, limit?: number }) => {
        const query = new URLSearchParams();
        if (params.page) query.append('page', params.page.toString());
        if (params.search) query.append('search', params.search);
        if (params.limit) query.append('limit', params.limit.toString());
        return api(`/users/following?${query.toString()}`, { requireAuth: true });
    },
    forgotPassword: (email: string) =>
        api('/auth/forgot-password', {
            method: 'POST',
            body: JSON.stringify({ email }),
        }),

    resetPassword: (token: string, password: string, confirmPassword: string) =>
        api('/auth/reset-password', {
            method: 'POST',
            body: JSON.stringify({ token, password, confirmPassword }),
        }),
};

// Tìm đến cục shopApi và thay bằng đoạn này:
export const shopApi = {
    getPaymentMethods: () => api('/shop/payment-methods'),
    createOrder: (orderData: any) => api('/shop/orders', { method: 'POST', requireAuth: true, body: JSON.stringify(orderData) }),
    submitPayment: (orderId: string, paymentData: any) => api(`/shop/orders/${orderId}/payment`, { method: 'POST', requireAuth: true, body: JSON.stringify(paymentData) }),
    
    // 👉 ĐÃ FIX: Gọi đúng /orders/my-orders để hiện lại đơn hàng cũ
    getMyOrders: () => api('/orders/my-orders', { requireAuth: true }),
    
    // 👉 ĐÃ FIX: Gọi đúng /orders/detail/...
    getOrderDetail: (orderId: string) => api(`/orders/detail/${orderId}`, { requireAuth: true }),

    // 👉 ĐÃ FIX: Gọi đúng /orders/cancel/...
    cancelOrder: (orderId: string, reason: string) => 
        api(`/orders/cancel/${orderId}`, { 
            method: 'PUT', 
            requireAuth: true, 
            body: JSON.stringify({ reason }) 
        }),
};

export const storeApi = {
    registerSeller: (sellerData: any) => api('/store/register-seller', { method: 'POST', requireAuth: true, body: JSON.stringify(sellerData) }),
    getSellerRegistrationStatus: () => api('/store/registration/status', { requireAuth: true }),
    updateSellerRegistration: (sellerData: any) => api('/store/registration', { method: 'PUT', requireAuth: true, body: JSON.stringify(sellerData) }),
    getMyStore: () => api('/store/my-store', { requireAuth: true }),
    updateMyStore: (payload: any) => api('/store/my-store', { method: 'PUT', requireAuth: true, body: JSON.stringify(payload) }),
    getSellerStats: () => api('/store/stats', { requireAuth: true }),

    // 👉 ĐÃ FIX ĐƯỜNG DẪN SELLER CHO KHỚP VỚI SERVER.JS MỚI
    getSellerOrders: (status?: string, page?: number, search?: string) => {
        const params = new URLSearchParams();
        if (status && status !== 'all') params.append('status', status);
        if (page) params.append('page', page.toString());
        if (search) params.append('search', search);
        return api(`/orders/seller/orders?${params.toString()}`, { requireAuth: true });
    },

    updateOrderStatusBySeller: (orderId: string, status: string, reason?: string) =>
        api(`/orders/seller/status/${orderId}`, {
            method: 'PUT',
            requireAuth: true,
            body: JSON.stringify({ status, reason })
        }),
    
    getSellerDashboardStats: (options?: any) => {
        const params = new URLSearchParams(options).toString();
        return api(`/orders/seller/dashboard?${params}`, { requireAuth: true });
    },
};
export const cartApi = {
    getCart: () => {
        return api('/cart', { requireAuth: true });
    },
    
    syncCart: (items: any[]) => {
        const syncData = items.map(item => {
            let rawId = item.product?._id || item.product;
            let cleanId = typeof rawId === 'string' ? rawId.split('-')[0] : rawId;

            return {
                product_id: cleanId, 
                quantity: item.quantity,
                type: item.type || '',     // 👉 BẮT BUỘC CÓ DÒNG NÀY
                variant: item.type || '' 
            };
        });

        return api('/cart/sync', {
            method: 'PUT',
            requireAuth: true,
            body: JSON.stringify({ items: syncData })
        });
    },
    
    clearCart: () => {
        return api('/cart', { 
            method: 'DELETE', 
            requireAuth: true 
        });
    }
};

export const orderApi = shopApi;