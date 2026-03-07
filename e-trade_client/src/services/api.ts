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
    
    // Đã trả lại hàm register để bạn tạo tài khoản mượt mà
    register: (name: string, email: string, password: string, phone: string, street: string, district: string, city: string) =>
        api('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password, phone, street, district, city }) }),
        
    getProfile: () => api('/users/me', { requireAuth: true }),
    
    updateProfile: (payload: any) => api('/users/me', { method: 'PUT', requireAuth: true, body: JSON.stringify(payload) }),
    
    logout: () => api('/auth/logout', { method: 'POST', requireAuth: true }),
};

export const shopApi = {
    // Lấy danh sách payment methods
    getPaymentMethods: () => api('/shop/payment-methods'),
    
    // Tạo order từ cart
    createOrder: (orderData: any) => 
        api('/shop/orders', { 
            method: 'POST', 
            requireAuth: true, 
            body: JSON.stringify(orderData) 
        }),
    
    // Gửi payment request
    submitPayment: (orderId: string, paymentData: any) => 
        api(`/shop/orders/${orderId}/payment`, { 
            method: 'POST', 
            requireAuth: true, 
            body: JSON.stringify(paymentData) 
        }),
    
    // Lấy danh sách orders của user
    getMyOrders: () => api('/shop/orders', { requireAuth: true }),
    
    // Lấy chi tiết order
    getOrderDetail: (orderId: string) => api(`/shop/orders/${orderId}`, { requireAuth: true }),
};

export const storeApi = {
    // Đăng kí seller (gửi đơn yêu cầu)
    registerSeller: (sellerData: any) =>
        api('/store/register-seller', {
            method: 'POST',
            requireAuth: true,
            body: JSON.stringify(sellerData)
        }),
    
    // Lấy trạng thái đơn đăng kí seller
    getSellerRegistrationStatus: () =>
        api('/store/registration/status', { requireAuth: true }),

    // Cập nhật đơn đăng kí seller
    updateSellerRegistration: (sellerData: any) =>
        api('/store/registration', { // Lưu ý: Route này phải khớp với route đã định nghĩa ở server (storeRoutes)
            method: 'PUT',
            requireAuth: true,
            body: JSON.stringify(sellerData)
        }),

    // Lấy danh sách đơn hàng của người bán
    getSellerOrders: (status?: string, page?: number, search?: string) => {
        const params = new URLSearchParams();
        if (status && status !== 'all') {
            params.append('status', status);
        }
        if (page) {
            params.append('page', page.toString());
        }
        if (search) {
            params.append('search', search);
        }
        const endpoint = `/seller/orders?${params.toString()}`;
        return api(endpoint, { requireAuth: true });
    },

    // Cập nhật trạng thái đơn hàng (xác nhận/từ chối)
    updateOrderStatusBySeller: (orderId: string, status: string, reason?: string) =>
        // Dựa trên orderRoutes.js, endpoint là /seller/:orderId/status
        api(`/seller/${orderId}/status`, {
            method: 'PUT',
            requireAuth: true,
            body: JSON.stringify({ status, reason })
        }),
    
    // Lấy dữ liệu thống kê cho dashboard của người bán
    getSellerDashboardStats: (options?: { revenuePeriod?: '7d' | '30d', startDate?: string, endDate?: string }) => {
        const params = new URLSearchParams();
        // Ưu tiên khoảng thời gian tùy chỉnh
        if (options?.startDate && options?.endDate) {
            params.append('startDate', options.startDate);
            params.append('endDate', options.endDate);
        } else if (options?.revenuePeriod) {
            params.append('revenuePeriod', options.revenuePeriod);
        }
        const endpoint = `/seller/dashboard?${params.toString()}`;
        return api(endpoint, { requireAuth: true });
    },
};