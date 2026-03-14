// src/pages/account/SalesOrders.tsx
import React, { useState, useEffect } from 'react';
import { AccountLayout } from '../components/AccountLayout';
import { customerPassApi } from '../../services/customerPassService';
import { useToast } from '../../context/ToastContext';
import { useCurrency } from '../../context/CurrencyContext';

const PassingProductSalesOrders: React.FC = () => {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const { toast } = useToast();
    const { formatPrice } = useCurrency();

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const data = await customerPassApi.getSalesOrders(statusFilter);
            setOrders(data);
        } catch (error) {
            toast.error("Lỗi tải danh sách đơn đặt hàng.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, [statusFilter]);

    const handleUpdateStatus = async (orderId: string, newStatus: string, reason?: string) => {
        if (!window.confirm(`Xác nhận đổi trạng thái đơn sang: ${newStatus}?`)) return;
        try {
            await customerPassApi.updateOrderStatus(orderId, newStatus, reason);
            toast.success("Cập nhật đơn thành công");
            fetchOrders();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Cập nhật thất bại.");
        }
    };

    const tabs = [
        { key: '', label: 'Tất cả' },
        { key: 'pending', label: 'Chờ Xác Nhận' },
        { key: 'confirmed', label: 'Đã Xác Nhận' },
        { key: 'shipping', label: 'Đang Giao' },
        { key: 'completed', label: 'Hoàn Thành' },
        { key: 'cancelled', label: 'Đã Hủy' },
    ];

    return (
        <AccountLayout>
            <div className="bg-white dark:bg-[#2d1e16] p-8 rounded-xl border border-slate-200 dark:border-slate-800 min-h-[600px]">
                <h2 className="text-xl font-bold dark:text-white mb-6">Đơn Khách Mua (Hàng Pass)</h2>
                
                {/* Tabs Filter */}
                <div className="flex border-b border-slate-200 dark:border-slate-800 mb-6 overflow-x-auto hide-scrollbar">
                    {tabs.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setStatusFilter(tab.key)}
                            className={`whitespace-nowrap px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                                statusFilter === tab.key 
                                ? 'border-primary text-primary' 
                                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="text-center py-10 text-slate-500">Đang tải đơn hàng...</div>
                ) : orders.length === 0 ? (
                    <div className="text-center py-10 text-slate-500 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                        Chưa có đơn hàng nào.
                    </div>
                ) : (
                    <div className="space-y-6">
                        {orders.map(order => (
                            <div key={order._id} className="border border-slate-200 dark:border-slate-700 rounded-xl p-5">
                                <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                                    <div>
                                        <p className="font-bold text-slate-800 dark:text-white">Mã đơn: <span className="font-mono text-primary">#{order._id.slice(-6)}</span></p>
                                        <p className="text-xs text-slate-500 mt-1">Khách hàng: {order.customer_id?.full_name || order.customer_id?.email}</p>
                                    </div>
                                    <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-full uppercase tracking-wider">
                                        {order.order_status}
                                    </span>
                                </div>

                                {/* List Sản phẩm trong đơn */}
                                <div className="space-y-3 mb-4">
                                    {order.items.map((item: any, idx: number) => (
                                        <div key={idx} className="flex items-center gap-4">
                                            <div className="w-16 h-16 bg-slate-100 rounded-md overflow-hidden shrink-0">
                                                <img src={item.image_snapshot || item.product_id?.main_image || "https://placehold.co/100"} alt="product" className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium text-slate-800 dark:text-slate-200 line-clamp-1">{item.name_snapshot || item.product_id?.name}</p>
                                                <p className="text-sm text-slate-500">x{item.quantity}</p>
                                            </div>
                                            <p className="font-bold text-slate-800 dark:text-white">{formatPrice(item.price_snapshot)}</p>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex flex-col sm:flex-row justify-between items-end sm:items-center gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                    <p className="text-sm text-slate-500">
                                        Tổng thu: <span className="text-lg font-bold text-primary ml-1">{formatPrice(order.total_amount)}</span>
                                    </p>
                                    
                                    {/* Action Buttons dựa trên Order Status */}
                                    <div className="flex gap-2 w-full sm:w-auto">
                                        {order.order_status === 'pending' && (
                                            <>
                                                <button onClick={() => handleUpdateStatus(order._id, 'cancelled', 'Chủ hàng không thể giao')} className="flex-1 sm:flex-none px-4 py-2 border border-red-200 text-red-500 rounded-lg text-sm font-bold hover:bg-red-50 transition-colors">
                                                    Từ chối
                                                </button>
                                                <button onClick={() => handleUpdateStatus(order._id, 'confirmed')} className="flex-1 sm:flex-none px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors">
                                                    Xác nhận có hàng
                                                </button>
                                            </>
                                        )}
                                        {order.order_status === 'confirmed' && (
                                            <button onClick={() => handleUpdateStatus(order._id, 'shipping')} className="flex-1 sm:flex-none px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-bold hover:bg-blue-600 transition-colors">
                                                Đã gửi hàng cho Ship
                                            </button>
                                        )}
                                        {/* Các trạng thái 'shipping', 'completed' thường do Khách hàng bấm nhận hoặc Admin xử lý, nên Seller chỉ xem */}
                                        {(order.order_status === 'shipping' || order.order_status === 'completed' || order.order_status === 'cancelled') && (
                                            <span className="text-sm text-slate-400 italic">Không có hành động khả dụng</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AccountLayout>
    );
};

export default PassingProductSalesOrders;