import React, { useEffect, useState } from 'react';
import { SellerLayout } from '../../../SellerLayout';
import { storeApi } from '../../services/api';
import { useCurrency } from '../../context/CurrencyContext';
import { useToast } from '../../context/ToastContext';

// --- MODAL CHI TIẾT ĐƠN HÀNG (PHIÊN BẢN PHẪU THUẬT TRIỆT ĐỂ) ---
const OrderDetailModal = ({ order, onClose }: { order: any, onClose: () => void }) => {
    const { formatPrice } = useCurrency();
    if (!order) return null;

    // Kiểm tra trạng thái hủy (không phân biệt hoa thường)
    const isCancelled = order.order_status?.toLowerCase() === 'cancelled';

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 w-full max-w-4xl shadow-2xl relative animate-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                    <span className="material-symbols-outlined text-2xl">close</span>
                </button>

                <h2 className="text-2xl font-black mb-6 dark:text-white">
                    Chi tiết Đơn hàng <span className="text-primary">#{order._id.slice(-6).toUpperCase()}</span>
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    
                    {/* 🚨 🚨 KHỐI LÝ DO HỦY: HIỆN CHÌNH ÌNH NGAY ĐẦU MODAL 🚨 🚨 */}
                    {isCancelled && (
                        <div className="col-span-full p-5 bg-red-50 dark:bg-red-900/30 border-2 border-red-200 dark:border-red-800 rounded-2xl shadow-sm mb-2">
                            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-black uppercase text-sm mb-2">
                                <span className="material-symbols-outlined text-[20px]">report</span>
                                Đơn hàng này đã bị hủy
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                <p className="text-slate-700 dark:text-slate-300">
                                    <strong>Người thực hiện:</strong> <span className="font-bold">{order.cancelled_by === 'customer' ? 'Khách hàng' : 'Người bán / Hệ thống'}</span>
                                </p>
                                <p className="text-slate-700 dark:text-slate-300">
                                    <strong>Lý do hủy:</strong> <span className="text-red-600 dark:text-red-400 font-black italic">"{order.cancel_reason || order.note || 'Không có lý do cụ thể'}"</span>
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Cột trái: Thông tin khách hàng */}
                    <div className="space-y-6">
                        <section>
                            <h4 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary text-[18px]">person</span> Thông tin khách hàng
                            </h4>
                            <div className="text-sm space-y-1 text-slate-600 dark:text-slate-400 ml-7">
                                <p><strong>Tên:</strong> {order.customer_id?.full_name || 'N/A'}</p>
                                <p><strong>Email:</strong> {order.customer_id?.email || 'N/A'}</p>
                                <p><strong>SĐT:</strong> {order.shipping_address?.phone || order.customer_id?.phone || 'N/A'}</p>
                            </div>
                        </section>

                        <section>
                            <h4 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary text-[18px]">location_on</span> Địa chỉ giao hàng
                            </h4>
                            <div className="ml-7">
                                <p className="text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border dark:border-slate-700">
                                    {order.shipping_address?.full_address || 'Chưa cập nhật'}
                                </p>
                            </div>
                        </section>

                        <section>
                            <h4 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary text-[18px]">payments</span> Thông tin thanh toán
                            </h4>
                            <div className="ml-7 flex items-center gap-2">
                                <span className="text-xs font-black bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-lg dark:text-white uppercase">
                                    {order.payment_method}
                                </span>
                                <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${order.payment_status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                                    {order.payment_status}
                                </span>
                            </div>
                        </section>
                    </div>

                    {/* Cột phải: Sản phẩm & Tiền bạc */}
                    <div>
                        <h4 className="font-bold text-slate-900 dark:text-white mb-4">Sản phẩm trong đơn</h4>
                        <div className="space-y-4 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar mb-6">
                            {order.items.map((item: any, idx: number) => (
                                <div key={idx} className="flex gap-4 items-center">
                                    <img src={item.image_snapshot} className="w-14 h-14 rounded-lg object-cover border dark:border-slate-700" alt="" />
                                    <div className="flex-1">
                                        <p className="text-sm font-bold dark:text-white line-clamp-1">{item.name_snapshot}</p>
                                        <p className="text-[11px] text-slate-500">
                                            {item.type && <span className="mr-2 px-1 bg-slate-100 dark:bg-slate-700 rounded">Loại: {item.type}</span>}
                                            Số lượng: {item.quantity}
                                        </p>
                                    </div>
                                    <p className="text-sm font-bold text-primary">{formatPrice(item.price_snapshot)}</p>
                                </div>
                            ))}
                        </div>

                        <div className="border-t-2 border-dashed dark:border-slate-700 pt-4 space-y-2">
                            <div className="flex justify-between text-sm text-slate-500"><span>Tạm tính:</span><span>{formatPrice(order.total_price)}</span></div>
                            <div className="flex justify-between text-sm text-slate-500"><span>Phí vận chuyển:</span><span>{formatPrice(order.shipping_fee)}</span></div>
                            <div className="flex justify-between items-center pt-2">
                                <span className="font-bold dark:text-white text-lg">Tổng cộng:</span>
                                <span className="font-black text-2xl text-primary">{formatPrice(order.total_amount)}</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="mt-8 flex justify-end">
                    <button onClick={onClose} className="px-10 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-white font-bold rounded-xl hover:bg-slate-200 transition-all">ĐÓNG</button>
                </div>
            </div>
        </div>
    );
};

const SellerOrders: React.FC = () => {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState('all');
    const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
    const { formatPrice } = useCurrency();
    const { toast } = useToast();

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const res: any = await storeApi.getSellerOrders(status === 'all' ? '' : status);
            setOrders(res.data || res);
        } catch (error) { console.error(error); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchOrders(); }, [status]);

    const handleUpdateStatus = async (orderId: string, newStatus: string) => {
        try {
            await storeApi.updateOrderStatusBySeller(orderId, newStatus);
            toast.success('Cập nhật trạng thái thành công');
            fetchOrders();
        } catch (error) { toast.error('Cập nhật thất bại'); }
    };

    const tabs = [{ id: 'all', label: 'Tất cả' }, { id: 'pending', label: 'Chờ xác nhận' }, { id: 'confirmed', label: 'Đã xác nhận' }, { id: 'shipping', label: 'Đang giao' }, { id: 'completed', label: 'Hoàn thành' }, { id: 'cancelled', label: 'Đã hủy' }];

    return (
        <SellerLayout>
            {selectedOrder && <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />}
            
            <div className="mb-6"><h1 className="text-2xl font-bold dark:text-white">Quản lý đơn hàng</h1></div>
            
            <div className="flex overflow-x-auto border-b border-slate-200 dark:border-slate-700 mb-6">
                {tabs.map(tab => (
                    <button key={tab.id} onClick={() => setStatus(tab.id)} className={`px-6 py-3 font-medium text-sm whitespace-nowrap transition-colors border-b-2 ${status === tab.id ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}>{tab.label}</button>
                ))}
            </div>

            {loading ? <div className="text-center py-10 dark:text-white">Đang tải...</div> : orders.length === 0 ? <div className="text-center py-10 text-slate-500">Không có đơn hàng nào</div> : (
                <div className="space-y-4">
                    {orders.map(order => (
                        <div key={order._id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4 border-b dark:border-slate-700 pb-4">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-lg dark:text-white">#{order._id.slice(-6).toUpperCase()}</span>
                                        <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${order.order_status === 'pending' ? 'bg-yellow-100 text-yellow-700' : order.order_status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{order.order_status}</span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 mt-1">{new Date(order.created_at).toLocaleString('vi-VN')}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-slate-500 uppercase">Tổng tiền</p>
                                    <p className="text-lg font-black text-primary">{formatPrice(order.total_amount)}</p>
                                </div>
                            </div>

                            {/* Lý do hủy hiển thị nhanh ở danh sách đơn hàng */}
                            {order.order_status === 'cancelled' && (
                                <div className="mb-4 text-xs bg-red-50 dark:bg-red-900/10 p-3 rounded-lg text-red-600 border border-red-100 dark:border-red-900/30">
                                    <strong>Lý do hủy:</strong> {order.cancel_reason || order.note || 'Không có lý do cụ thể'}
                                </div>
                            )}

                            <div className="flex justify-between items-center">
                                <div className="text-sm dark:text-slate-300">
                                    <strong>Khách:</strong> {order.customer_id?.full_name || 'Khách hàng'} 
                                    <span className="mx-2 text-slate-300">|</span> 
                                    <strong>SP:</strong> {order.items[0]?.name_snapshot} {order.items.length > 1 && `(+${order.items.length - 1})`}
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => setSelectedOrder(order)} className="px-4 py-2 rounded-lg border text-xs font-bold dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">Chi tiết</button>
                                    {order.order_status === 'pending' && (
                                        <button onClick={() => handleUpdateStatus(order._id, 'confirmed')} className="px-4 py-2 rounded-lg bg-primary text-white text-xs font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all">Xác nhận</button>
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