// src/pages/admin/AdminDashboard.tsx
import React, { useMemo } from 'react';
import { AdminLayout } from '../components/admin/AdminLayout';
import { Link } from 'react-router-dom';
import { useAdminHomePage } from '@/src/hooks/admin/useAdminHomePage';
import { useAdminReport } from '../../hooks/admin/useAdminReport';
import { useAdminPendingProducts } from '../../hooks/admin/useAdminPendingProducts';
import { useCurrency } from '../../context/CurrencyContext';

// Component con để render thẻ thống kê
const StatCard = ({ title, value, icon, trend, isPositive, colorClass }: any) => (
  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-slate-800 dark:text-white">{value}</h3>
      </div>
      <div className={`p-3 rounded-xl ${colorClass}`}>
        <span className="material-symbols-outlined">{icon}</span>
      </div>
    </div>
    {trend && (
      <div className="mt-4 flex items-center gap-2">
        <span className={`flex items-center text-sm font-bold ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
          <span className="material-symbols-outlined text-sm">{isPositive ? 'trending_up' : 'trending_down'}</span>
          {trend}
        </span>
        <span className="text-sm text-slate-400">so với tháng trước</span>
      </div>
    )}
  </div>
);

const AdminDashboard: React.FC = () => {
  // Lấy dữ liệu từ các hook đã xây dựng
  const { totalUsers, comparison, isPositive, loading: loadingUsers } = useAdminHomePage();
  const { totalPlatformFee, data: shops, totalItems, loading: loadingReport } = useAdminReport(); 
  const { pendingProducts, loading: loadingPending, handleApproveProduct, handleRejectProduct } = useAdminPendingProducts();
  const { formatPrice, currency, setCurrency } = useCurrency();

  // Tính toán Top Shop đóng góp hoa hồng cao nhất (Từ dữ liệu data hiện tại)
  const topShops = useMemo(() => {
    if (!shops) return [];
    return [...shops]
      .sort((a, b) => (b.platform_fee || 0) - (a.platform_fee || 0))
      .slice(0, 5); // Lấy top 5
  }, [shops]);

  const maxFee = topShops.length > 0 ? (topShops[0].platform_fee || 1) : 1;

  return (
    <AdminLayout>
      <div className="space-y-6">
        
        {/* Welcome Section & Nút chuyển đổi tiền tệ */}
        <div className="bg-primary/5 dark:bg-primary/10 rounded-2xl p-6 border border-primary/10 flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Chào mừng trở lại, Admin 👋</h2>
                <p className="text-slate-600 dark:text-slate-400">Đây là tổng quan tình hình hoạt động của sàn giao dịch E-Shop Trading hôm nay.</p>
            </div>
            
            <div className="flex items-center gap-4 shrink-0">
                {/* Nút Toggle USD/VND */}
                <div className="bg-white dark:bg-slate-800 p-1 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center">
                    <button 
                      onClick={() => setCurrency('VND')}
                      className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${currency === 'VND' ? 'bg-primary text-white shadow-md' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'}`}
                    >
                      VND
                    </button>
                    <button 
                      onClick={() => setCurrency('USD')}
                      className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${currency === 'USD' ? 'bg-primary text-white shadow-md' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'}`}
                    >
                      USD
                    </button>
                </div>

                <button className="bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-xl font-bold transition-colors flex items-center gap-2 shadow-lg shadow-primary/20">
                    <span className="material-symbols-outlined">download</span>
                    Xuất báo cáo
                </button>
            </div>
        </div>

        {/* Stats Grid (Sử dụng dữ liệu thật) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Tổng Hoa Hồng Sàn (5%)" 
            value={loadingReport ? "..." : formatPrice(totalPlatformFee)} 
            icon="account_balance_wallet" 
            trend={null} // Ẩn trend nếu chưa có API so sánh tháng trước
            isPositive={true} 
            colorClass="bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20"
          />
          <StatCard 
            title="Sản phẩm chờ duyệt" 
            value={loadingPending ? "..." : pendingProducts.length} 
            icon="inventory_2" 
            trend={null}
            isPositive={true} 
            colorClass="bg-amber-100 text-amber-600 dark:bg-amber-500/20"
          />
          <StatCard 
            title="Tổng số gian hàng" 
            value={loadingReport ? "..." : totalItems} 
            icon="storefront" 
            trend={null}
            isPositive={true} 
            colorClass="bg-purple-100 text-purple-600 dark:bg-purple-500/20"
          />
          <StatCard 
            title="Người dùng mới" 
            value={loadingUsers ? "..." : totalUsers}
            icon="group_add" 
            trend={comparison !== undefined ? (comparison >= 0 ? `+${comparison}` : `${comparison}`) : null}
            isPositive={isPositive} 
            colorClass="bg-blue-100 text-blue-600 dark:bg-blue-500/20"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Cột trái: Sản phẩm cần duyệt (Hiển thị dữ liệu thật) */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
                <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-red-50/50 dark:bg-red-900/10">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-red-500">gavel</span>
                        Sản phẩm chờ kiểm duyệt
                    </h3>
                    <Link to="/admin/products" className="text-primary text-sm font-medium hover:underline">Xem tất cả</Link>
                </div>
                <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left border-collapse min-w-[600px]">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-sm">
                                <th className="p-4 font-medium">Sản phẩm</th>
                                <th className="p-4 font-medium">Người bán</th>
                                <th className="p-4 font-medium">Giá</th>
                                <th className="p-4 font-medium text-right">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                            {loadingPending ? (
                                <tr><td colSpan={4} className="p-8 text-center text-slate-500">Đang tải...</td></tr>
                            ) : pendingProducts.length === 0 ? (
                                <tr><td colSpan={4} className="p-8 text-center text-emerald-500 font-medium">Hiện không có sản phẩm nào vi phạm chờ duyệt!</td></tr>
                            ) : (
                                pendingProducts.slice(0, 4).map((item) => (
                                    <tr key={item._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="p-4 flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-slate-200 overflow-hidden flex-shrink-0 border border-slate-200 dark:border-slate-700">
                                                <img src={item.main_image || 'https://placehold.co/100x100?text=SP'} alt={item.name} className="w-full h-full object-cover" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800 dark:text-slate-200 line-clamp-1 max-w-[200px]" title={item.name}>{item.name}</p>
                                                <p className="text-xs text-slate-500 uppercase">{item.condition}</p>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <p className="text-slate-700 dark:text-slate-300 font-medium line-clamp-1">
                                                {item.store_id?.shop_name || 'N/A'}
                                            </p>
                                        </td>
                                        <td className="p-4 font-bold text-slate-700 dark:text-slate-300">
                                            {formatPrice(item.price)}
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => handleApproveProduct(item._id)} className="p-1.5 rounded-md text-emerald-600 hover:bg-emerald-50 transition-colors" title="Duyệt">
                                                    <span className="material-symbols-outlined text-[20px]">check_circle</span>
                                                </button>
                                                <button onClick={() => handleRejectProduct(item._id)} className="p-1.5 rounded-md text-red-600 hover:bg-red-50 transition-colors" title="Từ chối">
                                                    <span className="material-symbols-outlined text-[20px]">cancel</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Cột phải: Top Shop đóng góp hoa hồng */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
                <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-emerald-500">bar_chart</span>
                        Top Shop Đóng Góp
                    </h3>
                </div>
                <div className="p-6 flex-1 overflow-y-auto">
                    {loadingReport ? (
                        <div className="text-center text-slate-500 mt-10">Đang tải biểu đồ...</div>
                    ) : topShops.length === 0 ? (
                        <div className="text-center text-slate-500 mt-10">Chưa có dữ liệu doanh thu.</div>
                    ) : (
                        <div className="space-y-5">
                            {topShops.map((shop, index) => {
                                const percent = Math.max((shop.platform_fee / maxFee) * 100, 2); // Tối thiểu 2% để hiển thị thanh
                                return (
                                    <div key={shop._id}>
                                        <div className="flex justify-between items-end mb-1.5">
                                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 line-clamp-1">
                                                <span className="text-xs text-slate-400 font-normal">#{index + 1}</span> {shop.shop_name}
                                            </span>
                                            <span className="text-sm font-bold text-primary shrink-0">
                                                {formatPrice(shop.platform_fee)}
                                            </span>
                                        </div>
                                        {/* Thanh Progress Bar mô phỏng biểu đồ ngang */}
                                        <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                            <div 
                                              className="h-full bg-gradient-to-r from-orange-400 to-primary rounded-full transition-all duration-1000" 
                                              style={{ width: `${percent}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
                <div className="p-4 border-t border-slate-200 dark:border-slate-800 text-center shrink-0">
                    <Link to="/admin/reports" className="text-sm font-bold text-primary hover:underline flex items-center justify-center gap-1">
                        Xem chi tiết báo cáo <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </Link>
                </div>
            </div>
        </div>

      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;