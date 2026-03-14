import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
// 1. IMPORT LAYOUT CHÍNH VÀO ĐÂY
import { Layout } from './Layout'; 

export const AccountLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { pathname } = useLocation();
  const { logout } = useAuth();

  // (Giữ nguyên các mảng menu links của anh ở đây...)
  // const menuItems = [ ... ]

  return (
    // 2. BỌC TOÀN BỘ BẰNG <Layout> ĐỂ LẤY HEADER/FOOTER CHUẨN
    <Layout>
      {/* Container chính của trang Account */}
      <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col md:flex-row gap-8">
        
        {/* SIDEBAR TRÁI (Giữ nguyên code sidebar cũ của anh) */}
        <aside className="w-full md:w-64 shrink-0">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 sticky top-24">
            
            {/* ... Render Menu Items của anh ở đây ... */}
            
            {/* Nút Đăng xuất (Do mình xóa header cũ nên chuyển nút Đăng xuất xuống dưới cùng của Sidebar cho tiện) */}
            <button 
              onClick={logout}
              className="w-full mt-4 flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
            >
              <span className="material-symbols-outlined text-lg">logout</span>
              Đăng xuất
            </button>

          </div>
        </aside>

        {/* NỘI DUNG CHÍNH (Bên phải) */}
        <main className="flex-1">
          {children}
        </main>
        
      </div>
    </Layout>
  );
};