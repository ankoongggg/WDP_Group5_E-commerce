import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Đã đăng xuất thành công');
      navigate('/login');
    } catch (error) {
      toast.error('Lỗi khi đăng xuất');
    }
  };

  const navItems = [
    { path: '/admin/dashboard', icon: 'dashboard', label: 'Dashboard' },
    { path: '/admin/users', icon: 'group', label: 'Quản lý người dùng' },
    { path: '/admin/products', icon: 'inventory_2', label: 'Duyệt sản phẩm' },
    { path: '/admin/orders', icon: 'receipt_long', label: 'Đơn hàng' },
    { path: '/admin/categories', icon: 'category', label: 'Danh mục' },
    { path: '/admin/blacklist', icon: 'gavel', label: 'Từ khóa cấm' },
    { path: '/admin/reports', icon: 'bar_chart', label: 'Báo cáo doanh thu' },
    { path: '/admin/settings', icon: 'settings', label: 'Cài đặt hệ thống' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-background-dark flex">
      {/* Sidebar */}
      <aside 
        className={`${
          isSidebarOpen ? 'w-64' : 'w-20'
        } transition-all duration-300 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-white/10 hidden md:flex flex-col sticky top-0 h-screen`}
      >
        <div className="h-16 flex items-center justify-center border-b border-slate-200 dark:border-white/10 shrink-0">
          <Link to="/admin/dashboard" className="flex items-center gap-3">
             <div className="w-8 h-8 bg-primary rounded flex items-center justify-center text-white">
                <span className="material-symbols-outlined">shield_person</span>
             </div>
             {isSidebarOpen && <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white uppercase italic">Admin Panel</h2>}
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              title={!isSidebarOpen ? item.label : ''}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                location.pathname.startsWith(item.path)
                  ? 'bg-primary/10 text-primary font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              {isSidebarOpen && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-white/10 shrink-0">
           <button 
             onClick={handleLogout}
             title={!isSidebarOpen ? 'Đăng xuất' : ''}
             className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 p-2 rounded-lg transition-colors"
           >
              <span className="material-symbols-outlined">logout</span>
              {isSidebarOpen && <span className="font-medium">Đăng xuất</span>}
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-white/10 flex items-center justify-between px-6 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors hidden md:block"
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            {/* Mobile menu button (Bạn có thể thêm logic drawer sau) */}
            <button className="md:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">
               <span className="material-symbols-outlined">menu</span>
            </button>
            <h1 className="text-xl font-bold text-slate-800 dark:text-white hidden sm:block">Admin Dashboard</h1>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 relative transition-colors">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
            </button>
            
            <div className="flex items-center gap-3 pl-4 border-l border-slate-200 dark:border-white/10">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-800 dark:text-white">{user?.name || 'System Admin'}</p>
                <p className="text-xs text-slate-500">{user?.role?.[0] || 'Superadmin'}</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-primary/20 overflow-hidden border border-primary/20 flex items-center justify-center text-primary font-bold">
                 {user?.avatar ? <img src={user.avatar} alt="Admin" className="w-full h-full object-cover"/> : 'A'}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
};