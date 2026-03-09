import React, { useEffect, useState } from 'react';
import { SellerLayout } from '../../../SellerLayout';
import { storeApi } from '../../services/api';
import { useCurrency } from '../../context/CurrencyContext';
import { useToast } from '../../context/ToastContext';

const SellerOrders: React.FC = () => {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState('all');
    const { formatPrice } = useCurrency();
    const { toast } = useToast();

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const res: any = await storeApi.getSellerOrders(status === 'all' ? '' : status);
            setOrders(res.data || res);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, [status]);

    const handleUpdateStatus = async (orderId: string, newStatus: string) => {
        try {
            await storeApi.updateOrderStatusBySeller(orderId, newStatus);
            toast.success('Cập nhật trạng thái thành công');
            fetchOrders();
        } catch (error) {
            toast.error('Cập nhật thất bại');
        }
    };

    const tabs = [
        { id: 'all', label: 'Tất cả' },
        { id: 'pending', label: 'Chờ xác nhận' },
        { id: 'confirmed', label: 'Đã xác nhận' },
        { id: 'shipping', label: 'Đang giao' },
        { id: 'completed', label: 'Hoàn thành' },
        { id: 'cancelled', label: 'Đã hủy' },
    ];

    return (
        <SellerLayout>
            <div className="mb-6">
                <h1 className="text-2xl font-bold dark:text-white">Quản lý đơn hàng</h1>
                <p className="text-slate-500">Xem và quản lý các đơn hàng từ khách hàng</p>
            </div>

            {/* Tabs */}
            <div className="flex overflow-x-auto border-b border-slate-200 dark:border-slate-700 mb-6">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setStatus(tab.id)}
                        className={`px-6 py-3 font-medium text-sm whitespace-nowrap transition-colors border-b-2 ${
                            status === tab.id 
                                ? 'border-primary text-primary' 
                                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Orders List */}
            {loading ? (
                <div className="text-center py-10">Đang tải...</div>
            ) : orders.length === 0 ? (
                <div className="text-center py-10 text-slate-500">Không có đơn hàng nào</div>
            ) : (
                <div className="space-y-4">
                    {orders.map(order => (
                        <div key={order._id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                            <div className="flex justify-between items-start mb-4 pb-4 border-b border-slate-100 dark:border-slate-700">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-lg dark:text-white">#{order._id.slice(-6).toUpperCase()}</span>
                                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                                            order.order_status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                            order.order_status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                                            order.order_status === 'completed' ? 'bg-green-100 text-green-700' :
                                            order.order_status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                            'bg-slate-100 text-slate-700'
                                        }`}>
                                            {order.order_status}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-500 mt-1">Ngày đặt: {new Date(order.created_at).toLocaleDateString('vi-VN')}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-slate-500">Tổng tiền</p>
                                    <p className="text-xl font-bold text-primary">{formatPrice(order.total_amount)}</p>
                                </div>
                            </div>

                            <div className="space-y-3 mb-4">
                                {order.items.map((item: any, idx: number) => (
                                    <div key={idx} className="flex gap-4">
                                        <img src={item.image_snapshot} alt="" className="w-16 h-16 rounded-lg object-cover border border-slate-200" />
                                        <div>
                                            <p className="font-medium dark:text-white line-clamp-1">{item.name_snapshot}</p>
                                            <p className="text-sm text-slate-500">x{item.quantity} • {formatPrice(item.price_snapshot)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-700">
                                <div className="text-sm text-slate-500">
                                    Khách hàng: <span className="font-medium text-slate-900 dark:text-white">{order.customer_id?.full_name || 'N/A'}</span>
                                </div>
                                <div className="flex gap-2">
                                    {order.order_status === 'pending' && (
                                        <>
                                            <button onClick={() => handleUpdateStatus(order._id, 'cancelled')} className="px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 font-medium text-sm">Từ chối</button>
                                            <button onClick={() => handleUpdateStatus(order._id, 'confirmed')} className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 font-medium text-sm">Xác nhận đơn</button>
                                        </>
                                    )}
                                    {order.order_status === 'confirmed' && (
                                        <button onClick={() => handleUpdateStatus(order._id, 'shipping')} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium text-sm">Giao hàng</button>
                                    )}
                                    {order.order_status === 'shipping' && (
                                        <button onClick={() => handleUpdateStatus(order._id, 'completed')} className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 font-medium text-sm">Đã giao hàng</button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </SellerLayout>
    );
};

export default SellerOrders;