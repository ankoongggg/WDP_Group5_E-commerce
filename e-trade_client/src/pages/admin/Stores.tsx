import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useToast } from '../../context/ToastContext';
import { Link } from 'react-router-dom';

interface StoreData {
    _id: string;
    shop_name: string;
    user_id: {
        full_name: string;
        email: string;
        phone: string;
    };
    pickup_address: string;
    phone: string;
    status: string;
    total_revenue: number;
    total_orders: number;
    created_at: string;
}

export const AdminStores: React.FC = () => {
    const [stores, setStores] = useState<StoreData[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchStores = async () => {
            try {
                const token = localStorage.getItem('accessToken');
                const response = await axios.get('http://localhost:9999/api/store/admin/stores', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setStores(response.data);
            } catch (error) {
                console.error(error);
                toast.error('Không thể tải danh sách cửa hàng');
            } finally {
                setLoading(false);
            }
        };
        fetchStores();
    }, []);

    const filteredStores = stores.filter(store => 
        store.shop_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        store.user_id?.full_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Quản lý Cửa hàng</h1>
                    <p className="text-slate-500 dark:text-slate-400">Danh sách các shop đang hoạt động trên sàn</p>
                </div>
                <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                    <input 
                        type="text" 
                        placeholder="Tìm kiếm shop..." 
                        className="pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none w-64"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 font-semibold">
                            <tr>
                                <th className="p-4">Tên Shop</th>
                                <th className="p-4">Chủ sở hữu</th>
                                <th className="p-4">Liên hệ</th>
                                <th className="p-4 text-center">Đơn hàng</th>
                                <th className="p-4 text-right">Doanh thu</th>
                                <th className="p-4 text-center">Trạng thái</th>
                                <th className="p-4 text-right">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {loading ? (
                                <tr><td colSpan={7} className="p-8 text-center text-slate-500">Đang tải dữ liệu...</td></tr>
                            ) : filteredStores.length === 0 ? (
                                <tr><td colSpan={7} className="p-8 text-center text-slate-500">Không tìm thấy cửa hàng nào.</td></tr>
                            ) : (
                                filteredStores.map((store) => (
                                    <tr key={store._id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                        <td className="p-4">
                                            <div className="font-bold text-slate-900 dark:text-white">{store.shop_name}</div>
                                            <div className="text-xs text-slate-500">ID: {store._id.slice(-6)}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-slate-900 dark:text-white">{store.user_id?.full_name || 'N/A'}</div>
                                            <div className="text-xs text-slate-500">{store.user_id?.email}</div>
                                        </td>
                                        <td className="p-4 text-slate-600 dark:text-slate-300">
                                            <div>{store.phone}</div>
                                            <div className="text-xs text-slate-400 truncate max-w-[150px]" title={store.pickup_address}>{store.pickup_address}</div>
                                        </td>
                                        <td className="p-4 text-center font-medium">
                                            {store.total_orders}
                                        </td>
                                        <td className="p-4 text-right font-bold text-primary">
                                            {formatCurrency(store.total_revenue)}
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-bold ${
                                                store.status === 'active' 
                                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                                                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                            }`}>
                                                {store.status === 'active' ? 'Hoạt động' : 'Đã khóa'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <Link 
                                                to={`/store/${store._id}`} 
                                                target="_blank"
                                                className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 hover:bg-primary hover:text-white text-slate-500 transition-colors"
                                                title="Xem Shop"
                                            >
                                                <span className="material-symbols-outlined text-lg">visibility</span>
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};