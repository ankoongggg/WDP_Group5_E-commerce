// src/pages/admin/AdminSellerRequests.tsx
import React, { useState } from 'react';
import { AdminLayout } from '../components/admin/AdminLayout';
import { useSellerRequests } from '../../hooks/admin/useSellerRequest';

export const AdminSellerRequests: React.FC = () => {
  const {
    requests,
    loading,
    searchTerm, setSearchTerm,
    statusFilter, setStatusFilter,
    dateFrom, setDateFrom,
    dateTo, setDateTo,
    handleApprove,
    handleReject
  } = useSellerRequests();

  // State mở modal xem chi tiết CCCD/Mô tả (tùy chọn)
  const [viewingDesc, setViewingDesc] = useState<string | null>(null);

  const renderStatus = (status: string) => {
    switch (status) {
      case 'pending': return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">Chờ duyệt</span>;
      case 'active': return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">Đã duyệt</span>;
      case 'rejected': return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">Từ chối</span>;
      default: return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Tiêu đề */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Yêu cầu mở Shop</h2>
            <p className="text-sm text-slate-500 mt-1">Quản lý người bán đăng ký gian hàng mới</p>
          </div>
        </div>

        {/* Toolbar: Search & Filters */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col xl:flex-row gap-4">
          
          {/* Ô tìm kiếm */}
          <div className="relative flex-1">
            <span className="absolute left-3 top-2.5 text-slate-400 material-symbols-outlined text-[20px]">search</span>
            <input 
              type="text" 
              placeholder="Tìm tên shop, chủ shop, email..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/50 outline-none dark:text-white transition-all" 
            />
          </div>

          {/* Cụm Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-3 rounded-xl border border-transparent focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                <span className="text-slate-400 material-symbols-outlined text-[18px]">calendar_today</span>
                <input 
                    type="date" 
                    value={dateFrom} 
                    onChange={(e) => setDateFrom(e.target.value)} 
                    className="bg-transparent border-none outline-none py-2.5 text-sm text-slate-700 dark:text-slate-200"
                    title="Từ ngày"
                />
                <span className="text-slate-400">-</span>
                <input 
                    type="date" 
                    value={dateTo} 
                    onChange={(e) => setDateTo(e.target.value)} 
                    className="bg-transparent border-none outline-none py-2.5 text-sm text-slate-700 dark:text-slate-200"
                    title="Đến ngày"
                />
            </div>

            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-primary/50 outline-none cursor-pointer"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="pending">Chờ duyệt</option>
              <option value="active">Đã duyệt (Active)</option>
              <option value="rejected">Bị từ chối</option>
            </select>
          </div>
        </div>

        {/* Bảng dữ liệu */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-sm">
                <tr>
                  <th className="p-4 font-medium">Thông tin Shop</th>
                  <th className="p-4 font-medium">Người đại diện</th>
                  <th className="p-4 font-medium">CCCD / Địa chỉ</th>
                  <th className="p-4 font-medium">Ngày Yêu cầu</th>
                  <th className="p-4 font-medium text-center">Trạng thái</th>
                  <th className="p-4 font-medium text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                {loading ? (
                  <tr><td colSpan={6} className="p-8 text-center text-slate-500">Đang tải dữ liệu...</td></tr>
                ) : requests.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-slate-500">Không tìm thấy yêu cầu nào.</td></tr>
                ) : (
                  requests.map((req) => (
                    <tr key={req._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      {/* Cột Shop */}
                      <td className="p-4">
                        <div className="font-bold text-primary text-base mb-1">{req.shop_name}</div>
                        <button 
                            onClick={() => setViewingDesc(req.shop_description || req.description)}
                            className="text-xs text-blue-500 hover:underline flex items-center gap-1"
                        >
                            <span className="material-symbols-outlined text-[14px]">info</span> Xem mô tả
                        </button>
                      </td>

                      {/* Cột Chủ Shop */}
                      <td className="p-4">
                        <p className="font-medium text-slate-800 dark:text-slate-200">{req.user_id?.full_name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{req.user_id?.email}</p>
                      </td>

                      {/* Cột Info định danh */}
                      <td className="p-4">
                        <p className="text-slate-700 dark:text-slate-300"><span className="text-slate-400">CCCD:</span> {req.identity_card}</p>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1 max-w-[200px]" title={req.pickup_address}>{req.pickup_address}</p>
                      </td>

                      {/* Cột Ngày giờ */}
                      <td className="p-4 text-slate-600 dark:text-slate-400">
                        {new Date(req.created_at).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </td>

                      {/* Cột Trạng thái */}
                      <td className="p-4 text-center">
                        {renderStatus(req.status)}
                      </td>

                      {/* Cột Hành động */}
                      <td className="p-4 text-right">
                        {req.status === 'pending' ? (
                            <div className="flex justify-end gap-2">
                                <button 
                                    onClick={() => handleApprove(req._id)}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white rounded-lg font-bold transition-colors"
                                    title="Duyệt Shop"
                                >
                                    <span className="material-symbols-outlined text-[18px]">check_circle</span> Duyệt
                                </button>
                                <button 
                                    onClick={() => handleReject(req._id)}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white rounded-lg font-bold transition-colors"
                                    title="Từ chối"
                                >
                                    <span className="material-symbols-outlined text-[18px]">cancel</span> Hủy
                                </button>
                            </div>
                        ) : (
                            <span className="text-slate-400 italic text-xs">Đã xử lý</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal xem mô tả Shop */}
        {viewingDesc !== null && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-fade-in-up">
                    <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                        <h3 className="font-bold text-lg dark:text-white">Mô tả gian hàng</h3>
                        <button onClick={() => setViewingDesc(null)} className="text-slate-400 hover:text-red-500">
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>
                    <div className="p-5 text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                        {viewingDesc || <span className="italic text-slate-400">Shop không cung cấp mô tả.</span>}
                    </div>
                    <div className="p-4 border-t border-slate-200 dark:border-slate-800 text-right">
                        <button onClick={() => setViewingDesc(null)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg font-bold transition-colors">Đóng</button>
                    </div>
                </div>
            </div>
        )}

      </div>
    </AdminLayout>
  );
};

// Đừng quên default export nếu route đang dùng React.lazy hoặc import trực tiếp
export default AdminSellerRequests;