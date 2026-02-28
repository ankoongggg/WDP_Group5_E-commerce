import React from 'react';
import { AdminLayout } from '../components/admin/AdminLayout';
import { Link } from 'react-router-dom';

// Component con để render thẻ thống kê cho gọn code
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
    <div className="mt-4 flex items-center gap-2">
      <span className={`flex items-center text-sm font-bold ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
        <span className="material-symbols-outlined text-sm">{isPositive ? 'trending_up' : 'trending_down'}</span>
        {trend}
      </span>
      <span className="text-sm text-slate-400">so với tháng trước</span>
    </div>
  </div>
);

const AdminDashboard: React.FC = () => {
  // Giả lập dữ liệu, thực tế bạn sẽ gọi API từ custom hook (ví dụ: const { stats, loading } = useAdminDashboard();)
  
  return (
    <AdminLayout>
      <div className="space-y-6">
        
        {/* Welcome Section */}
        <div className="bg-primary/5 dark:bg-primary/10 rounded-2xl p-6 border border-primary/10 flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Chào mừng trở lại, Admin 👋</h2>
                <p className="text-slate-600 dark:text-slate-400">Đây là tổng quan tình hình hoạt động của sàn giao dịch E-Shop Trading hôm nay.</p>
            </div>
            <button className="bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-xl font-bold transition-colors flex items-center gap-2 shadow-lg shadow-primary/20 shrink-0">
                <span className="material-symbols-outlined">download</span>
                Xuất báo cáo
            </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Tổng Doanh Thu" 
            value="124.5M ₫" 
            icon="payments" 
            trend="+12.5%" 
            isPositive={true} 
            colorClass="bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20"
          />
          <StatCard 
            title="Sản phẩm chờ duyệt" 
            value="45" 
            icon="inventory_2" 
            trend="-5" 
            isPositive={true} // Giảm SP chờ duyệt là tốt
            colorClass="bg-amber-100 text-amber-600 dark:bg-amber-500/20"
          />
          <StatCard 
            title="Người dùng mới" 
            value="128" 
            icon="group_add" 
            trend="+18%" 
            isPositive={true} 
            colorClass="bg-blue-100 text-blue-600 dark:bg-blue-500/20"
          />
          <StatCard 
            title="Cảnh báo vi phạm" 
            value="12" 
            icon="warning" 
            trend="+2" 
            isPositive={false} // Tăng vi phạm là xấu
            colorClass="bg-red-100 text-red-600 dark:bg-red-500/20"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cột trái: Sản phẩm cần duyệt (Chiếm 2 phần) */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-amber-500">pending_actions</span>
                        Sản phẩm chứa từ khóa cấm cần kiểm duyệt
                    </h3>
                    <Link to="/admin/products" className="text-primary text-sm font-medium hover:underline">Xem tất cả</Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[600px]">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-sm">
                                <th className="p-4 font-medium">Sản phẩm</th>
                                <th className="p-4 font-medium">Người bán</th>
                                <th className="p-4 font-medium">Giá</th>
                                <th className="p-4 font-medium">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                            {[1, 2, 3, 4].map((i) => (
                                <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="p-4 flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-slate-200 overflow-hidden flex-shrink-0">
                                            <img src={`https://placehold.co/100x100?text=SP${i}`} alt="Product" className="w-full h-full object-cover" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800 dark:text-slate-200 line-clamp-1">Laptop Gaming Cũ {i}</p>
                                            <p className="text-xs text-slate-500">Đăng 2 giờ trước</p>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <p className="text-slate-700 dark:text-slate-300 font-medium">Shop Anh Bán</p>
                                    </td>
                                    <td className="p-4 font-bold text-slate-700 dark:text-slate-300">12.000.000 ₫</td>
                                    <td className="p-4">
                                        <div className="flex gap-2">
                                            <button className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors flex items-center gap-1 font-medium" title="Duyệt">
                                                <span className="material-symbols-outlined text-[18px]">check</span> Duyệt
                                            </button>
                                            <button className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors flex items-center gap-1 font-medium" title="Từ chối">
                                                <span className="material-symbols-outlined text-[18px]">close</span> Từ chối
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Cột phải: Nhật ký kiểm duyệt (Chiếm 1 phần) */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
                <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-red-500">gavel</span>
                        Nhật ký kiểm duyệt (Auto)
                    </h3>
                </div>
                <div className="p-6 flex-1 overflow-y-auto space-y-6">
                    {/* Timeline Item */}
                    {[
                        { time: '10 phút trước', user: 'user_xyz', action: 'Banned', reason: 'Vi phạm từ khóa: "súng"' },
                        { time: '1 giờ trước', user: 'shop_123', action: 'Warning', reason: 'Sản phẩm có dấu hiệu lừa đảo' },
                        { time: '3 giờ trước', user: 'hacker_99', action: 'Banned', reason: 'Spam tạo tài khoản' },
                    ].map((log, idx) => (
                        <div key={idx} className="flex gap-4 items-start relative">
                            {/* Đường thẳng nối timeline (ẩn ở phần tử cuối) */}
                            {idx !== 2 && <div className="absolute left-[11px] top-6 bottom-[-24px] w-0.5 bg-slate-200 dark:bg-slate-700"></div>}
                            
                            <div className="relative z-10 w-6 h-6 rounded-full flex items-center justify-center bg-white dark:bg-slate-900 shrink-0">
                                <span className={`w-3 h-3 rounded-full ${log.action === 'Banned' ? 'bg-red-500 shadow-[0_0_0_4px_rgba(239,68,68,0.2)]' : 'bg-amber-500 shadow-[0_0_0_4px_rgba(245,158,11,0.2)]'}`}></span>
                            </div>
                            
                            <div>
                                <p className="text-xs text-slate-500 font-medium mb-1">{log.time}</p>
                                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                                    Hệ thống đã {log.action === 'Banned' ? 'khóa' : 'cảnh cáo'} tài khoản <span className="text-primary">{log.user}</span>
                                </p>
                                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 bg-slate-50 dark:bg-slate-800 p-2 rounded-lg inline-block">
                                    Lý do: {log.reason}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="p-4 border-t border-slate-200 dark:border-slate-800 text-center shrink-0">
                    <Link to="/admin/blacklist" className="text-sm font-bold text-primary hover:underline flex items-center justify-center gap-1">
                        Cấu hình từ khóa cấm <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </Link>
                </div>
            </div>
        </div>

      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;