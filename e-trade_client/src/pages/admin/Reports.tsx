import React, { useState } from 'react';
import { AdminLayout } from '../components/admin/AdminLayout';

export const AdminReports: React.FC = () => {
  const [selectedShop, setSelectedShop] = useState<any>(null);

  const mockShops = [
    { id: 1, name: 'ABC Official Store', owner: 'Công Ty ABC', orders: 1245, revenue: 1550000000 },
    { id: 2, name: 'Tiệm Đồ Cũ Anh Bán', owner: 'Trần Văn Bán', orders: 85, revenue: 24500000 },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Báo cáo doanh thu Shop</h2>
        
        {/* Table Doanh thu */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-sm">
              <tr>
                <th className="p-4 font-medium">Tên Shop</th>
                <th className="p-4 font-medium">Chủ sở hữu</th>
                <th className="p-4 font-medium text-right">Tổng đơn</th>
                <th className="p-4 font-medium text-right">Tổng Doanh thu</th>
                <th className="p-4 font-medium text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
              {mockShops.map((shop) => (
                <tr key={shop.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="p-4 font-bold text-primary">{shop.name}</td>
                  <td className="p-4 dark:text-slate-300">{shop.owner}</td>
                  <td className="p-4 text-right dark:text-slate-300">{shop.orders}</td>
                  <td className="p-4 text-right font-bold text-emerald-600">{shop.revenue.toLocaleString()} ₫</td>
                  <td className="p-4 text-center">
                    <button 
                      onClick={() => setSelectedShop(shop)}
                      className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors"
                    >
                      Xem chi tiết
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal Xem Chi Tiết Doanh Thu Shop */}
        {selectedShop && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <h3 className="text-xl font-bold dark:text-white">Chi tiết: {selectedShop.name}</h3>
                <button onClick={() => setSelectedShop(null)} className="text-slate-400 hover:text-red-500">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl">
                    <p className="text-sm text-slate-500">Tổng doanh thu</p>
                    <p className="text-2xl font-bold text-emerald-600">{selectedShop.revenue.toLocaleString()} ₫</p>
                  </div>
                  <div className="p-4 bg-blue-50 dark:bg-blue-500/10 rounded-xl">
                    <p className="text-sm text-slate-500">Hoa hồng sàn (5%)</p>
                    <p className="text-2xl font-bold text-blue-600">{(selectedShop.revenue * 0.05).toLocaleString()} ₫</p>
                  </div>
                </div>
                <p className="text-sm text-slate-500 mb-2">5 Đơn hàng gần nhất</p>
                <div className="space-y-2">
                   {/* Giả lập list đơn hàng */}
                   {[1,2,3].map(i => (
                     <div key={i} className="flex justify-between p-3 border border-slate-100 dark:border-slate-800 rounded-lg text-sm">
                       <span className="dark:text-slate-300">Đơn hàng #ORD00{i}</span>
                       <span className="font-medium text-emerald-600">Hoàn thành</span>
                     </div>
                   ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};