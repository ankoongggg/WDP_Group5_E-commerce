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
        account_name?: string;
    };
    pickup_address: string;
    description?: string;
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

    // 👇 STATE CHO POPUP SỬA TRẠNG THÁI
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedStore, setSelectedStore] = useState<StoreData | null>(null);
    const [editStatus, setEditStatus] = useState('active');
    const [updating, setUpdating] = useState(false);

    const fetchStores = async () => {
        setLoading(true);
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

    useEffect(() => {
        fetchStores();
    }, []);

    const filteredStores = stores.filter(store => 
        store.shop_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        store.user_id?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    // 👇 HÀM MỞ POPUP
    const handleEditClick = (store: StoreData) => {
        setSelectedStore(store);
        setEditStatus(store.status === 'active' ? 'active' : 'banned');
        setIsModalOpen(true);
    };

    // 👇 HÀM BẮN API LƯU TRẠNG THÁI
    const handleSaveStatus = async () => {
        if (!selectedStore) return;
        setUpdating(true);
        try {
            const token = localStorage.getItem('accessToken');
            await axios.put(`http://localhost:9999/api/store/admin/stores/${selectedStore._id}/status`, {
                status: editStatus
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            toast.success('Đã cập nhật trạng thái cửa hàng!');
            setIsModalOpen(false);
            fetchStores(); // Tải lại danh sách ngay lập tức
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Cập nhật thất bại!');
        } finally {
            setUpdating(false);
        }
    };

    return (
        <div className="space-y-6 relative">
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
                                            <div className="text-slate-900 dark:text-white">{store.user_id?.full_name || store.user_id?.account_name || 'N/A'}</div>
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
                                            {formatCurrency(store.total_revenue || 0)}
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-bold ${
                                                store.status === 'active' 
                                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                                                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                            }`}>
                                                {store.status === 'active' ? 'Hoạt động' : 'Bị Khóa'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right flex justify-end gap-2">
                                            {/* Nút Xem Shop */}
                                            <Link 
                                                to={`/store/${store._id}`} 
                                                target="_blank"
                                                className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-500 dark:text-slate-300 transition-colors"
                                                title="Xem Shop"
                                            >
                                                <span className="material-symbols-outlined text-lg">visibility</span>
                                            </Link>
                                            {/* 👉 NÚT SỬA TRẠNG THÁI */}
                                            <button 
                                                onClick={() => handleEditClick(store)}
                                                className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-500 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 transition-colors"
                                                title="Đổi trạng thái"
                                            >
                                                <span className="material-symbols-outlined text-lg">edit</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 👇 POPUP MODAL CHỈNH SỬA TRẠNG THÁI 👇 */}
            {isModalOpen && selectedStore && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in duration-200">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                            <h3 className="text-xl font-black dark:text-white">Chi tiết cửa hàng</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-red-500 transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-1">Tên cửa hàng</label>
                                <input type="text" disabled value={selectedStore.shop_name} className="w-full p-3 bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 cursor-not-allowed font-medium" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-1">Chủ cửa hàng</label>
                                <input type="text" disabled value={selectedStore.user_id?.full_name || selectedStore.user_id?.account_name || 'N/A'} className="w-full p-3 bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 cursor-not-allowed font-medium" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-1">Mô tả</label>
                                <textarea disabled value={selectedStore.description || 'Chưa có mô tả'} className="w-full p-3 bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 cursor-not-allowed resize-none h-24 font-medium" />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-bold text-slate-600 dark:text-slate-300 mb-2">
                                    Trạng thái <span className="text-red-500">*</span>
                                </label>
                                <select 
                                    value={editStatus}
                                    onChange={(e) => setEditStatus(e.target.value)}
                                    className={`w-full p-3 border-2 rounded-xl text-sm font-bold outline-none cursor-pointer transition-colors ${
                                        editStatus === 'active' 
                                            ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' 
                                            : 'border-red-500 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                                    }`}
                                >
                                    <option value="active" className="font-bold text-green-600">🟢 Hoạt động</option>
                                    <option value="banned" className="font-bold text-red-600">🔴 Vi phạm (Khóa)</option>
                                </select>
                            </div>
                        </div>
                        
                        <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3">
                            <button 
                                onClick={() => setIsModalOpen(false)} 
                                className="px-6 py-2.5 rounded-xl font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            >
                                Hủy
                            </button>
                            <button 
                                onClick={handleSaveStatus}
                                disabled={updating}
                                className="px-6 py-2.5 rounded-xl font-bold text-white bg-primary hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center gap-2"
                            >
                                {updating ? <span className="material-symbols-outlined animate-spin text-sm">sync</span> : null}
                                Lưu thay đổi
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};