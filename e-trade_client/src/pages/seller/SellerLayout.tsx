import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const SellerLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const location = useLocation();

    const navItems = [
        { path: '/seller/dashboard', icon: 'dashboard', label: 'Dashboard' },
        { path: '/seller/orders', icon: 'receipt_long', label: 'Đơn hàng' },
        { path: '/seller/products', icon: 'inventory_2', label: 'Sản phẩm' },
        { path: '/seller/settings', icon: 'settings', label: 'Store Management' },
    ];

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark font-display flex">
            {/* Sidebar */}
            <aside className="w-64 bg-white dark:bg-[#1a110c] border-r border-slate-200 dark:border-slate-800 flex-col py-6 px-3 hidden md:flex">
                <div className="px-4 mb-6">
                    <Link to="/seller/dashboard" className="text-2xl font-bold text-primary">E-Trade Seller</Link>
                </div>
                <nav className="flex flex-col gap-1">
                    {navItems.map(item => {
                        const isActive = location.pathname.startsWith(item.path);
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                    ? 'bg-primary/10 text-primary font-medium'
                                    : 'text-slate-500 hover:text-primary'
                                    }`}
                            >
                                <span className="material-symbols-outlined">{item.icon}</span>
                                {item.label}
                            </Link>
                        );
                    })}
                    <div className="border-t border-slate-200 dark:border-slate-800 my-4"></div>
                    <Link to="/account" className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-primary transition-all">
                        <span className="material-symbols-outlined">arrow_back</span>
                        Quay lại tài khoản
                    </Link>
                </nav>
            </aside>

            <main className="flex-1 flex flex-col overflow-hidden">{children}</main>
        </div>
    );
};

export default SellerLayout;