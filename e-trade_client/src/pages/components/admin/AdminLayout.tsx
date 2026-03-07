import React, { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title }) => {
  const { pathname } = useLocation();
  const { logout } = useAuth();

  // Danh sách menu admin được tổng hợp từ cả 2 nhánh conflict
  const navItems = useMemo(() => [
    { path: '/admin', icon: 'dashboard', label: 'Dashboard' },
    { path: '/admin/products', icon: 'inventory_2', label: 'Products' },
    { path: '/admin/categories', icon: 'category', label: 'Categories' },
    { path: '/admin/seller-requests', icon: 'store', label: 'Seller Requests' },
    { path: '/admin/reports', icon: 'analytics', label: 'Reports' },
    { path: '/admin/blacklist', icon: 'block', label: 'Blacklist' },
  ], []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex font-display">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 fixed h-full z-20 hidden lg:flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-700">
          <span className="text-xl font-black text-primary tracking-tight">E-Trade Admin</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
             // Logic active: chính xác path hoặc là sub-path (trừ dashboard /admin để tránh active nhầm)
             const isActive = pathname === item.path || (item.path !== '/admin' && pathname.startsWith(item.path));
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
            <button onClick={logout} className="flex items-center gap-3 px-4 py-3 w-full text-slate-500 hover:text-red-500 transition-colors font-medium rounded-xl hover:bg-red-50 dark:hover:bg-red-900/10">
                <span className="material-symbols-outlined">logout</span>
                Logout
            </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64">
        <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10 px-6 flex items-center justify-between lg:hidden">
            <span className="font-bold text-slate-900 dark:text-white">Admin Panel</span>
        </header>
        <div className="p-6">
            {children}
        </div>
      </main>
    </div>
  );
};
