import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const SellerRoute: React.FC = () => {
    const { user, loading } = useAuth();

    if (loading) {
        return <div className="flex justify-center items-center h-screen">Loading...</div>;
    }

    if (!user) {
        return <Navigate to="/login" />;
    }

    if (!user.role?.includes('seller')) {
        return <Navigate to="/account" />;
    }

    return <Outlet />;
};

export default SellerRoute;