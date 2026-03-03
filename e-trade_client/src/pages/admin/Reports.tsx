// src/pages/admin/AdminReports.tsx
import React, { useState } from 'react';
import { AdminLayout } from '../../pages/components/admin/AdminLayout';
import { useAdminReport } from '../../hooks/admin/useAdminReport';
import { StoreReportData } from '../../types/storeReport';
import { useCurrency } from '../../context/CurrencyContext'; // Dùng để format giá tiền

export const AdminReports: React.FC = () => {
  const {
    loading,
    error,
    data: shops,
    totalPages,
    currentPage,
    totalItems,
    totalFilteredRevenue,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    handlePageChange
  } = useAdminReport();

  const { formatPrice } = useCurrency(); // Format VNĐ

  // State cho Modal chi tiết
  const [selectedShop, setSelectedShop] = useState<StoreReportData | null>(null);

  // Render status badge
  const renderStatus = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">Hoạt động</span>;
      case 'inactive':
        return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">Ngừng HĐ</span>;
      case 'banned':
        return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">Đã khóa</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        
        {/* Header & Thống kê nhanh */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Báo cáo doanh thu Shop</h2>
            <p className="text-sm text-slate-500 mt-1">Đang hiển thị {totalItems} cửa hàng</p>
          </div>
          <div className="bg-primary/10 text-primary px-4 py-2 rounded-xl border border-primary/20 font-bold">
            Tổng GD: {formatPrice(totalFilteredRevenue)}
          </div>
        </div>

        {/* Toolbar: Search & Filter */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <span className="absolute left-3 top-2.5 text-slate-400 material-symbols-outlined text-[20px]">search</span>
            <input 
              type="text" 
              placeholder="Tìm kiếm theo tên shop..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/50 outline-none dark:text-white transition-all" 
            />
          </div>
          
          {/* Filter Status */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">Trạng thái:</span>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-primary/50 outline-none cursor-pointer"
            >
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
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-sm">
                <tr>
                  <th className="p-4 font-medium">Thông tin Cửa hàng</th>
                  <th className="p-4 font-medium">Trạng thái</th>
                  <th className="p-4 font-medium text-right">Tổng Sản phẩm</th>
                  <th className="p-4 font-medium text-right">Tổng Đơn Hàng</th>
                  <th className="p-4 font-medium text-right">Tổng Doanh Thu</th>
                  <th className="p-4 font-medium text-center">Hành động</th>
                </tr>
              </thead>
              
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">Đang tải dữ liệu...</td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-red-500">{error}</td>
                  </tr>
                ) : shops.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">Không tìm thấy cửa hàng nào phù hợp.</td>
                  </tr>
                ) : (
                  shops.map((shop) => (
                    <tr key={shop._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="p-4">
                        <p className="font-bold text-primary text-base">{shop.shop_name}</p>
                        <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{shop.pickup_address}</p>
                      </td>
                      <td className="p-4">{renderStatus(shop.status)}</td>
                      <td className="p-4 text-right text-slate-700 dark:text-slate-300 font-medium">{shop.total_sales || 0}</td>
                      <td className="p-4 text-right text-slate-700 dark:text-slate-300 font-medium">{shop.total_orders || 0}</td>
                      <td className="p-4 text-right font-bold text-emerald-600 text-base">
                        {formatPrice(shop.total_revenue || 0)}
                      </td>
                      <td className="p-4 text-center">
                        <button 
                          onClick={() => setSelectedShop(shop)}
                          className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-primary hover:text-white dark:hover:bg-primary rounded-lg text-sm font-bold transition-colors"
                        >
                          Chi tiết
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Phân Trang (Pagination) */}
          {!loading && totalPages > 1 && (
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-sm text-slate-500">
                Trang {currentPage} trên {totalPages}
              </span>
              <div className="flex gap-2">
                <button 
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors text-sm font-medium"
                >
                  Trước
                </button>
                <button 
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors text-sm font-medium"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Xem Chi Tiết Doanh Thu Shop */}
        {selectedShop && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-fade-in-up">
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold dark:text-white text-primary mb-1">{selectedShop.shop_name}</h3>
                  <p className="text-sm text-slate-500">Mã Shop: {selectedShop._id}</p>
                </div>
                <button onClick={() => setSelectedShop(null)} className="p-2 text-slate-400 hover:text-red-500 bg-slate-100 hover:bg-red-50 dark:bg-slate-800 rounded-full transition-colors">
                  <span className="material-symbols-outlined block">close</span>
                </button>
              </div>
              <div className="p-6">
                
                {/* Info Cards */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-5 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-xl">
                    <p className="text-sm text-slate-600 dark:text-slate-400 font-medium mb-1">Tổng doanh thu</p>
                    <p className="text-3xl font-extrabold text-emerald-600">{formatPrice(selectedShop.total_revenue || 0)}</p>
                  </div>
                  <div className="p-5 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-xl relative overflow-hidden">
                    <p className="text-sm text-slate-600 dark:text-slate-400 font-medium mb-1">Hoa hồng sàn (5%)</p>
                    <p className="text-3xl font-extrabold text-blue-600">{formatPrice((selectedShop.total_revenue || 0) * 0.05)}</p>
                    <span className="material-symbols-outlined absolute -right-2 -bottom-2 text-6xl text-blue-500/10">account_balance_wallet</span>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
                  <h4 className="font-bold text-slate-800 dark:text-white mb-3 text-sm uppercase tracking-wider">Thông tin thêm</h4>
                  <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                    <li className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                      <span>Người đại diện (CCCD):</span> <span className="font-medium">{selectedShop.identity_card}</span>
                    </li>
                    <li className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                      <span>Địa chỉ kho:</span> <span className="font-medium text-right max-w-[60%]">{selectedShop.pickup_address}</span>
                    </li>
                    <li className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                      <span>Mô tả:</span> <span className="font-medium text-right max-w-[60%]">{selectedShop.description}</span>
                    </li>
                    <li className="flex justify-between pt-1">
                      <span>Ngày tham gia:</span> <span className="font-medium">{new Date(selectedShop.created_at).toLocaleDateString('vi-VN')}</span>
                    </li>
                  </ul>
                </div>
                
              </div>
            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
};