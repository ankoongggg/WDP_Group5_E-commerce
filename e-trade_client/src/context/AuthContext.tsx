import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi, clearTokens, setOnTokenRefreshFailed } from '../services/api';

// 1. CẬP NHẬT INTERFACE: Đã thêm đầy đủ các trường dữ liệu bị thiếu
interface User {
    _id: string;
    name?: string;
    full_name?: string;
    email: string;
    role: string[];
    avatar?: string;
    phone?: string;
    gender?: string;
    dob?: string;
    addresses?: any[];
    status: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string, phone: string, street: string, district: string, city: string) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>; // 2. BỔ SUNG HÀM refreshUser
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const handleSessionExpired = useCallback(() => {
        setUser(null);
        clearTokens();
        navigate('/login');
    }, [navigate]);

    useEffect(() => {
        setOnTokenRefreshFailed(handleSessionExpired);
    }, [handleSessionExpired]);

    // 3. THÊM HÀM NÀY: Để Profile.tsx gọi mỗi khi nhấn Save
    const refreshUser = async () => {
        try {
            const res: any = await authApi.getProfile();
            // Lấy đúng cục "data" từ backend trả về
            setUser(res.data || res.user || res);
        } catch (error) {
            console.error("Failed to refresh user:", error);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            authApi.getProfile()
                .then((res: any) => {
                    // 4. FIX LỖI CẤU TRÚC: Phải lấy res.data thay vì ôm nguyên cục res
                    setUser(res.data || res.user || res);
                })
                .catch(() => {
                    clearTokens();
                    setUser(null);
                })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (email: string, password: string) => {
        const data = await authApi.login(email, password);
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        setUser(data.user);
    };

    const register = async (name: string, email: string, password: string, phone: string, street: string, district: string, city: string) => {
        const data = await authApi.register(name, email, password, phone, street, district, city);
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        setUser(data.user);
    };

    const logout = async () => {
        try {
            await authApi.logout();
        } catch {
            // Ignore errors on logout
        }
        setUser(null);
        clearTokens();
        navigate('/login');
    };

    return (
        // Nhớ export refreshUser ra để các file khác dùng được
        <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser, isAuthenticated: !!user }}>
            {children}
        </AuthContext.Provider>
    );
};