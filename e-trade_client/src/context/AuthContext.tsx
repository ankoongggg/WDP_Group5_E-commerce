import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi, clearTokens, setOnTokenRefreshFailed } from '../services/api';

interface User {
    _id: string;
    name: string;
    email: string;
    role: string[];
    avatar?: string;
    phone?: string;
    status: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
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

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            authApi.getProfile()
                .then(setUser)
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

    const register = async (name: string, email: string, password: string) => {
        const data = await authApi.register(name, email, password);
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
        <AuthContext.Provider value={{ user, loading, login, register, logout, isAuthenticated: !!user }}>
            {children}
        </AuthContext.Provider>
    );
};
