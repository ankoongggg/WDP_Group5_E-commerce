import React, { useState } from 'react';
import { AdminLayout } from '../components/admin/AdminLayout';

export const AdminProducts: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pending' | 'categories'>('pending');

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6">
          <button 
            onClick={() => setActiveTab('pending')}
            className={`pb-3 font-bold text-sm border-b-2 transition-colors ${activeTab === 'pending' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white'}`}
          >
            Duyệt sản phẩm
          </button>
          <button 
            onClick={() => setActiveTab('categories')}
            className={`pb-3 font-bold text-sm border-b-2 transition-colors ${activeTab === 'categories' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white'}`}
          >
            Quản lý Danh mục
          </button>
        </div>

        {/* TAB 1: DUYỆT SẢN PHẨM */}
        {activeTab === 'pending' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-sm">
                  <th className="p-4 font-medium">Sản phẩm</th>
                  <th className="p-4 font-medium">Shop / Người bán</th>
                  <th className="p-4 font-medium">Loại hàng</th>
                  <th className="p-4 font-medium">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                {[1, 2].map((i) => (
                  <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-4 flex gap-3">
                      <img src={`https://placehold.co/80x80?text=SP${i}`} className="w-16 h-16 rounded-lg object-cover" />
                      <div>
                        <p className="font-bold dark:text-white">iPhone 13 Pro Max cũ</p>
                        <p className="text-primary font-bold mt-1">12.000.000 ₫</p>
                      </div>
                    </td>
                    <td className="p-4 dark:text-slate-300">Shop Công Nghệ</td>
                    <td className="p-4"><span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs">Used</span></td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-sm font-bold hover:bg-emerald-600">Duyệt</button>
                        <button className="px-3 py-1.5 bg-red-100 text-red-600 rounded-lg text-sm font-bold hover:bg-red-200">Từ chối</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 2: QUẢN LÝ DANH MỤC */}
        {activeTab === 'categories' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Form Thêm danh mục */}
            <div className="col-span-1 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm h-fit">
              <h3 className="font-bold text-lg mb-4 dark:text-white">Thêm Danh Mục Mới</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-slate-500 mb-1 block">Tên danh mục</label>
                  <input type="text" className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl px-4 py-2 outline-none dark:text-white" placeholder="VD: Đồ điện tử..." />
                </div>
                <button className="w-full bg-primary text-white font-bold py-2 rounded-xl hover:bg-primary/90 transition-colors">
                  Thêm mới
                </button>
              </div>
            </div>

            {/* List danh mục */}
            <div className="col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-sm">
                  <tr>
                    <th className="p-4 font-medium">Tên danh mục</th>
                    <th className="p-4 font-medium">Trạng thái</th>
                    <th className="p-4 font-medium">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                  {['Đồ Điện Tử', 'Thời Trang', 'Gia Dụng'].map((cat, idx) => (
                    <tr key={idx}>
                      <td className="p-4 font-medium dark:text-white">{cat}</td>
                      <td className="p-4">
                        <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full">Hiển thị</span>
                      </td>
                      <td className="p-4 flex gap-2">
                        <button className="text-blue-500 hover:underline">Sửa</button>
                        <span className="text-slate-300">|</span>
                        <button className="text-red-500 hover:underline">Ẩn</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};