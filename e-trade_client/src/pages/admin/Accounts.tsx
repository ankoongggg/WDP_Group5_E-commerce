import React, { useState } from 'react';
import { AdminLayout } from '../components/admin/AdminLayout';

export const AdminUsers: React.FC = () => {
  const [users] = useState([
    { id: 1, name: 'Nguyễn Văn Khách', email: 'khach@gmail.com', phone: '0901000001', roles: ['customer'], status: 'active', date: '20/10/2025' },
    { id: 2, name: 'Trần Văn Bán', email: 'seller@gmail.com', phone: '0902000002', roles: ['customer', 'seller'], status: 'active', date: '22/10/2025' },
    { id: 3, name: 'Kẻ Lừa Đảo', email: 'scam@abc.com', phone: '0999999999', roles: ['customer'], status: 'banned', date: '25/10/2025' },
  ]);

  return (
    <AdminLayout>
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Header & Search */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Quản lý người dùng</h2>
            <p className="text-sm text-slate-500">Tổng số: {users.length} tài khoản</p>
          </div>
          <div className="relative w-full sm:w-64">
            <span className="absolute left-3 top-2.5 text-slate-400 material-symbols-outlined text-[20px]">search</span>
            <input type="text" placeholder="Tìm email, sđt..." className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/50 outline-none dark:text-white" />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-sm">
                <th className="p-4 font-medium">Người dùng</th>
                <th className="p-4 font-medium">Liên hệ</th>
                <th className="p-4 font-medium">Vai trò (Role)</th>
                <th className="p-4 font-medium">Trạng thái</th>
                <th className="p-4 font-medium">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{user.name}</p>
                      <p className="text-xs text-slate-500">Tham gia: {user.date}</p>
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="text-slate-700 dark:text-slate-300">{user.email}</p>
                    <p className="text-xs text-slate-500">{user.phone}</p>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-1 flex-wrap">
                      {user.roles.includes('seller') && <span className="px-2 py-1 bg-purple-100 text-purple-700 dark:bg-purple-500/20 text-xs rounded font-medium">Seller</span>}
                      {user.roles.includes('customer') && <span className="px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-500/20 text-xs rounded font-medium">Customer</span>}
                    </div>
                  </td>
                  <td className="p-4">
                    {user.status === 'active' 
                      ? <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">Hoạt động</span>
                      : <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">Đã khóa</span>
                    }
                  </td>
                  <td className="p-4">
                    <button className={`p-2 rounded-lg transition-colors flex items-center gap-1 font-medium text-sm ${user.status === 'active' ? 'text-red-600 hover:bg-red-50' : 'text-emerald-600 hover:bg-emerald-50'}`}>
                      <span className="material-symbols-outlined text-[18px]">{user.status === 'active' ? 'lock' : 'lock_open'}</span>
                      {user.status === 'active' ? 'Khóa' : 'Mở khóa'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};