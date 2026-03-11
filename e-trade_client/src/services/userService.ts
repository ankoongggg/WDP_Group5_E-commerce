import axios from 'axios';
import { api } from './api';
// ensure we always have a base URL (other services include fallback) - dùng cho một số API public
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:9999/api';

export interface AdminUser {
    _id: string;
    full_name: string;
    email: string;
    phone?: string;
    role: string[];
    status: string;
    created_at?: string;
    ban_reason?: string;
    banned_until?: string | null;
}

export interface AdminUserListResponse {
    success: boolean;
    data: AdminUser[];
    pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export const UserService = {
    getNumberAndComparison: async () => {
        const res = await axios.get(`${API_BASE_URL}/users/admin/users/total`);
        // backend returns { success: true, data: { totalUsers, comparison } }
        // so we unwrap the inner data for convenience
        return res.data?.data;
    },

    getAdminUsers: async (params?: { search?: string; page?: number; limit?: number; role?: string; status?: string }): Promise<AdminUserListResponse> => {
        const searchParams = new URLSearchParams();
        if (params?.search) searchParams.append('search', params.search);
        if (params?.page) searchParams.append('page', String(params.page));
        if (params?.limit) searchParams.append('limit', String(params.limit));
        if (params?.role) searchParams.append('role', params.role);
        if (params?.status) searchParams.append('status', params.status);

        const query = searchParams.toString();
        const endpoint = `/users/admin/users${query ? `?${query}` : ''}`;

        // Dùng api() để tự động gắn Authorization + refresh token
        const res = await api<AdminUserListResponse>(endpoint, { requireAuth: true });
        return res;
    },

    createAdminUser: async (payload: { full_name: string; email: string; password: string; phone?: string; roles: string[] }) => {
        return api('/users/admin/users', {
            method: 'POST',
            requireAuth: true,
            body: JSON.stringify(payload),
        });
    },

    updateUserRole: async (userId: string, roles: string[]) => {
        return api(`/users/admin/users/${userId}/role`, {
            method: 'PATCH',
            requireAuth: true,
            body: JSON.stringify({ roles }),
        });
    },

    banUser: async (
        userId: string,
        payload: { action: 'ban' | 'unban'; ban_reason?: string; banned_until?: string | null; durationDays?: number },
    ) => {
        return api(`/users/admin/users/${userId}/ban`, {
            method: 'PATCH',
            requireAuth: true,
            body: JSON.stringify(payload),
        });
    },
};