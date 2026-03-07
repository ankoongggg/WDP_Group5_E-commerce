import React, { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../../../context/AuthContext';

interface SellerLayoutProps {
  children: React.ReactNode;
}

export const SellerLayout: React.FC<SellerLayoutProps> = ({ children }) => {
  const { pathname } = useLocation();
  const { logout, user } = useAuth();

  const navItems = useMemo(() => [
    { path: '/seller/dashboard', icon: 'dashboard', label: 'Tổng quan' },
    { path: '/seller/products', icon: 'inventory_2', label: 'Sản phẩm' },
    { path: '/seller/orders', icon: 'shopping_bag', label: 'Đơn hàng' },
    { path: '/seller/settings', icon: 'settings', label: 'Cấu hình Shop' },
  ], []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex font-display">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 fixed h-full z-20 hidden lg:flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-700 gap-3">
           <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">
              <span className="material-symbols-outlined">storefront</span>
           </div>
           <span className="text-lg font-bold text-slate-800 dark:text-white tracking-tight">Seller Center</span>
        </div>
        
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
                <img src={user?.avatar || 'https://via.placeholder.com/40'} alt="Avatar" className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                <div className="overflow-hidden">
                    <p className="font-bold text-sm text-slate-800 dark:text-white truncate">{user?.full_name}</p>
                    <p className="text-xs text-slate-500 truncate">Chủ Shop</p>
                </div>
            </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
             const isActive = pathname === item.path;
             return (
               <Link
                 key={item.path}
                 to={item.path}
                 className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
                   isActive 
                     ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                     : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 dark:text-slate-400'
                 }`}
               >
                 <span className="material-symbols-outlined">{item.icon}</span>
                 {item.label}
               </Link>
             );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
            <Link to="/" className="flex items-center gap-3 px-4 py-3 w-full text-slate-500 hover:text-primary transition-colors font-medium rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 mb-1">
                <span className="material-symbols-outlined">arrow_back</span>
                Về trang chủ
            </Link>
            <button onClick={logout} className="flex items-center gap-3 px-4 py-3 w-full text-slate-500 hover:text-red-500 transition-colors font-medium rounded-xl hover:bg-red-50 dark:hover:bg-red-900/10">
                <span className="material-symbols-outlined">logout</span>
                Đăng xuất
            </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64">
        <div className="p-6 md:p-8 max-w-7xl mx-auto">
            {children}
        </div>
      </main>
    </div>
  );
};