// src/pages/admin/AdminReports.tsx
import React, { useState } from 'react';
import { AdminLayout } from '../../pages/components/admin/AdminLayout';
import { useAdminReport } from '../../hooks/admin/useAdminReport';
import { StoreReportData } from '../../types/storeReport';
import { useCurrency } from '../../context/CurrencyContext'; 

export const AdminReports: React.FC = () => {
  const {
    loading, error,
    data: shops,
    totalPages, currentPage, totalItems,
    totalPlatformFee, // Đổi từ totalFilteredRevenue
    searchTerm, setSearchTerm,
    statusFilter, setStatusFilter,
    handlePageChange,
    handleUpdateStatus // Thêm hàm này
  } = useAdminReport();

  const { formatPrice } = useCurrency();
  const [selectedShop, setSelectedShop] = useState<StoreReportData | null>(null);

  const renderStatus = (status: string) => {
    switch (status) {
      case 'active': return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">Hoạt động</span>;
      case 'inactive': return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">Ngừng HĐ</span>;
      case 'banned': return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">Đã khóa</span>;
      default: return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        
        {/* Header & Thống kê nhanh */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Quản lý Shop & Hoa Hồng</h2>
            <p className="text-sm text-slate-500 mt-1">Đang hiển thị {totalItems} cửa hàng</p>
          </div>
          <div className="bg-primary/10 text-primary px-5 py-3 rounded-xl border border-primary/20 flex items-center gap-3">
             <div className="p-2 bg-white rounded-lg shadow-sm">
                <span className="material-symbols-outlined block text-primary">account_balance_wallet</span>
             </div>
             <div>
                <p className="text-xs text-slate-500 font-bold uppercase">Tổng Hoa Hồng Sàn</p>
                <p className="text-xl font-extrabold">{formatPrice(totalPlatformFee)}</p>
             </div>
          </div>
        </div>

        {/* Toolbar: Search & Filter */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <span className="absolute left-3 top-2.5 text-slate-400 material-symbols-outlined text-[20px]">search</span>
            <input 
              type="text" placeholder="Tìm kiếm theo tên shop..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/50 outline-none dark:text-white transition-all" 
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">Trạng thái:</span>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 outline-none cursor-pointer">
              <option value="all">Tất cả</option>
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Ngừng hoạt động</option>
              <option value="banned">Bị khóa</option>
            </select>
          </div>
        </div>
        
        {/* Bảng Dữ Liệu */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-sm">
                <tr>
                  <th className="p-4 font-medium">Thông tin Cửa hàng</th>
                  <th className="p-4 font-medium">Trạng thái</th>
                  <th className="p-4 font-medium text-right">Tổng Đơn Hàng</th>
                  <th className="p-4 font-medium text-right">Hoa Hồng (5%)</th>
                  <th className="p-4 font-medium text-center">Đổi trạng thái</th>
                  <th className="p-4 font-medium text-center">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                {loading ? (
                  <tr><td colSpan={6} className="p-8 text-center text-slate-500">Đang tải dữ liệu...</td></tr>
                ) : shops.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-slate-500">Không tìm thấy cửa hàng nào.</td></tr>
                ) : (
                  shops.map((shop) => (
                    <tr key={shop._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="p-4">
                        <p className="font-bold text-primary text-base">{shop.shop_name}</p>
                        <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{shop.pickup_address}</p>
                      </td>
                      <td className="p-4">{renderStatus(shop.status)}</td>
                      <td className="p-4 text-right text-slate-700 dark:text-slate-300 font-medium">{shop.total_orders || 0}</td>
                      <td className="p-4 text-right font-bold text-blue-600 text-base">
                        {formatPrice(shop.platform_fee || 0)}
                      </td>
                      <td className="p-4 text-center">
                        <select 
                          value={shop.status}
                          onChange={(e) => handleUpdateStatus(shop._id, e.target.value)}
                          className="bg-slate-100 dark:bg-slate-800 border-none rounded-lg px-2 py-1 text-xs font-medium cursor-pointer"
                        >
                           <option value="active">Active</option>
                           <option value="inactive">Inactive</option>
                           <option value="banned">Ban</option>
                        </select>
                      </td>
                      <td className="p-4 text-center">
                        <button onClick={() => setSelectedShop(shop)} className="p-2 bg-slate-100 dark:bg-slate-800 hover:text-primary rounded-lg transition-colors">
                          <span className="material-symbols-outlined text-[20px] block">visibility</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Phân Trang */}
          {!loading && totalPages > 1 && (
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
               {/* ... (giữ nguyên logic phân trang) */}
            </div>
          )}
        </div>

        {/* Modal Chi Tiết */}
        {selectedShop && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between">
                <h3 className="text-xl font-bold dark:text-white">Chi tiết: {selectedShop.shop_name}</h3>
                <button onClick={() => setSelectedShop(null)}><span className="material-symbols-outlined hover:text-red-500">close</span></button>
              </div>
              <div className="p-6 space-y-4">
                 <div className="p-6 bg-blue-50 dark:bg-blue-500/10 rounded-xl text-center border border-blue-100 dark:border-blue-500/20">
                    <p className="text-sm text-slate-500 font-bold mb-2">TỔNG HOA HỒNG THU ĐƯỢC TỪ SHOP NÀY</p>
                    <p className="text-4xl font-extrabold text-blue-600">{formatPrice(selectedShop.platform_fee || 0)}</p>
                 </div>
                 {/* ... (Giữ phần thông tin user_id, identity_card như cũ) ... */}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};