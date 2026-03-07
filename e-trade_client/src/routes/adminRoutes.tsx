import React from 'react';
import { Navigate, Outlet, replace } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function AdminRoute() {
 const { isAuthenticated, user, isAuthLoading } = useAuth();

    // Chờ AuthContext load xong
    if (isAuthLoading) {
        console.log('[AdminRoute] Auth is loading...');
        return <div>Đang kiểm tra quyền truy cập...</div>;
    }

    // Nếu chưa đăng nhập, về trang auth
    if (!isAuthenticated) {
        console.log('[AdminRoute] Not authenticated, redirecting to /login');
        return <Navigate to="/login" replace />;
    }

    if (!user || !user.role || !user.role.includes('admin')) {
        console.warn(`[AdminRoute] Access denied or role mismatch. User role: ${user?.role}. Redirecting to /`);
        // Nếu không phải admin, đá về trang chủ
        return <Navigate to="/" replace />;
    }
    // ------ Nếu đã xác thực và là admin,Outlet để hiển thị component con (AdminDashboard, AdminBlacklist, etc.)
    return <Outlet />;
}

export default AdminRoute;