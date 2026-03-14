import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Layout } from './Layout';

const AccountLayout: React.FC<{ children: React.ReactNode; sidebarExtras?: React.ReactNode }> = ({ children, sidebarExtras }) => {
    const { user } = useAuth();
    const { pathname } = useLocation();

    const getLinkClassName = (path: string, isExact: boolean = false) => {
        const baseClass = "flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-primary transition-all";
        const activeClass = "rounded-lg bg-primary/10 border-r-4 border-primary text-primary font-medium";

        const isActive = isExact ? pathname === path : pathname.startsWith(path);

        return isActive ? `${baseClass} ${activeClass}` : baseClass;
    };

    return (
        <Layout>
            <div className="flex flex-1 overflow-hidden bg-slate-50 dark:bg-slate-900 font-display">
                <aside className="w-64 bg-white dark:bg-[#1a110c] border-r border-slate-200 dark:border-slate-800 hidden md:flex flex-col py-6 px-3">
                    <nav className="flex flex-col gap-1">
                        <Link to="/account" className={getLinkClassName('/account', true)}>
                            <span className="material-symbols-outlined">person</span> Profile
                        </Link>
                        <Link to="/account/wishlist" className={getLinkClassName('/account/wishlist')}>
                            <span className="material-symbols-outlined">favorite</span> Wishlist & Following
                        </Link>
                        <Link to="/account/orders" className={getLinkClassName('/account/orders')}>
                            <span className="material-symbols-outlined">shopping_bag</span> Orders
                        </Link>
                        <Link to="/account/settings" className={getLinkClassName('/account/settings')}>
                            <span className="material-symbols-outlined">settings</span> Settings
                        </Link>
                        {user?.role?.includes('seller') && (
                            <Link to="/seller/dashboard" className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-primary transition-all">
                                <span className="material-symbols-outlined">storefront</span> Seller Dashboard
                            </Link>
                        )}
                        {sidebarExtras}
                    </nav>
                </aside>
                <main className="flex-1 overflow-y-auto p-6 md:p-10">
                    {children}
                </main>
            </div>
        </Layout>
    );
};

export default AccountLayout;