// src/pages/admin/AdminProducts.tsx
import React, { useState } from 'react';
import { AdminLayout } from '../components/admin/AdminLayout';
import { useAdminCategories } from '../../hooks/admin/useAdminCategories';

export const AdminProducts: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pending' | 'categories'>('pending');

  // Lấy dữ liệu và hàm từ Hook
  const {
    categories,
    loading: catLoading,
    handleAddCategory,
    handleUpdateCategory,
    handleToggleHideAndShowCategory
  } = useAdminCategories();

  // State cục bộ cho việc thêm mới
  const [newCatName, setNewCatName] = useState('');

  // State cục bộ cho việc chỉnh sửa inline
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  // Handle submit form thêm mới
  const onSubmitAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleAddCategory(newCatName);
    setNewCatName(''); // Xóa ô input sau khi thêm
  };

  // Mở chế độ chỉnh sửa
  const startEditing = (id: string, currentName: string) => {
    setEditingId(id);
    setEditingName(currentName);
  };

  // Lưu chỉnh sửa
  const saveEditing = async (id: string) => {
    await handleUpdateCategory(id, editingName);
    setEditingId(null); // Thoát chế độ edit
  };

  // Hủy chỉnh sửa
  const cancelEditing = () => {
    setEditingId(null);
    setEditingName('');
  };

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

        {/* TAB 1: DUYỆT SẢN PHẨM (Tạm thời giữ UI cũ, chưa nối API) */}
        {activeTab === 'pending' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
             {/* ... Code bảng sản phẩm của bạn ... */}
             <div className="p-8 text-center text-slate-500">Chức năng đang phát triển...</div>
          </div>
        )}

        {/* TAB 2: QUẢN LÝ DANH MỤC */}
        {activeTab === 'categories' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Form Thêm danh mục */}
            <div className="col-span-1 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm h-fit">
              <h3 className="font-bold text-lg mb-4 dark:text-white">Thêm Danh Mục Mới</h3>
              <form onSubmit={onSubmitAdd} className="space-y-4">
                <div>
                  <label className="text-sm text-slate-500 mb-1 block">Tên danh mục</label>
                  <input 
                    type="text" 
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-primary/50 dark:text-white transition-all" 
                    placeholder="VD: Đồ điện tử..." 
                    disabled={catLoading}
                  />
                </div>
                <button 
                  type="submit"
                  disabled={catLoading || !newCatName.trim()}
                  className="w-full bg-primary text-white font-bold py-2.5 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {catLoading ? 'Đang xử lý...' : 'Thêm mới'}
                </button>
              </form>
            </div>

            {/* List danh mục */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-sm">
                  <tr>
                    <th className="p-4 font-medium w-[50%]">Tên danh mục</th>
                    <th className="p-4 font-medium">Trạng thái</th>
                    <th className="p-4 font-medium text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                  {categories.length === 0 ? (
                    <tr>
                       <td colSpan={3} className="p-6 text-center text-slate-500">Chưa có danh mục nào.</td>
                    </tr>
                  ) : (
                    categories.map((cat) => (
                      <tr key={cat._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        
                        {/* Cột Tên */}
                        <td className="p-4 font-medium dark:text-white">
                          {editingId === cat._id ? (
                            <input 
                              type="text" 
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              className="w-full bg-white dark:bg-slate-900 border border-primary rounded-lg px-3 py-1 outline-none dark:text-white"
                              autoFocus
                            />
                          ) : (
                            <span className={!cat.is_active ? 'text-slate-400 line-through' : ''}>
                              {cat.name}
                            </span>
                          )}
                        </td>

                        {/* Cột Trạng thái */}
                        <td className="p-4">
                          {cat.is_active ? (
                            <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full font-medium">Hiển thị</span>
                          ) : (
                            <span className="px-2 py-1 bg-slate-100 text-slate-500 text-xs rounded-full font-medium">Đã ẩn</span>
                          )}
                        </td>

                        {/* Cột Hành động */}
                        <td className="p-4 text-right">
                          {editingId === cat._id ? (
                            <div className="flex justify-end gap-2">
                              <button onClick={() => saveEditing(cat._id)} className="text-emerald-500 hover:bg-emerald-50 p-1.5 rounded transition-colors" title="Lưu">
                                <span className="material-symbols-outlined text-[20px]">check</span>
                              </button>
                              <button onClick={cancelEditing} className="text-slate-400 hover:bg-slate-100 p-1.5 rounded transition-colors" title="Hủy">
                                <span className="material-symbols-outlined text-[20px]">close</span>
                              </button>
                            </div>
                          ) : (
                            <div className="flex justify-end items-center gap-3">
                              <button 
                                onClick={() => startEditing(cat._id, cat.name)} 
                                className="text-blue-500 hover:text-blue-700 font-medium transition-colors"
                              >
                                Sửa
                              </button>
                              <span className="text-slate-300">|</span>
                              <button 
                                onClick={() => handleToggleHideAndShowCategory(cat._id)} 
                                className={`${cat.is_active ? 'text-amber-500 hover:text-amber-700' : 'text-emerald-500 hover:text-emerald-700'} font-medium transition-colors`}
                              >
                                {cat.is_active ? 'Ẩn' : 'Hiện'}
                              </button>
                            </div>
                          )}
                        </td>

                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

          </div>
        )}
      </div>
    </AdminLayout>
  );
};