import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import SellerLayout from '../seller/SellerLayout';
import { useToast } from '../../context/ToastContext';
import { storeApi } from '../../services/api'; // Giả định API được export từ đây
import { format } from 'date-fns';

// Debounce hook để tối ưu việc tìm kiếm
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

// Hàm helper để định dạng tiền tệ
const formatCurrency = (amount: number) => {
    if (typeof amount !== 'number') return 'N/A';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

const OrderManagement: React.FC = () => {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');
    const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 500);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalOrders: 0,
    });
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const { toast } = useToast();

    const TABS = [
        { key: 'all', label: 'Tất cả' },
        { key: 'pending', label: 'Chờ xác nhận' },
        { key: 'confirmed', label: 'Đã xác nhận' },
        { key: 'shipping', label: 'Đang giao' },
        { key: 'completed', label: 'Hoàn thành' },
        { key: 'cancelled', label: 'Đã hủy' },
    ];

    const fetchOrders = useCallback(async (status: string, page: number, search: string) => {
        setLoading(true);
        try {
            const response = await storeApi.getSellerOrders(status, page, search) as any;
            if (response && response.success) {
                setOrders(response.data);
                setPagination(response.pagination);
            } else {
                setOrders([]);
                setPagination({ currentPage: 1, totalPages: 1, totalOrders: 0 });
            }
        } catch (error: any) {
            toast.error(error.message || 'Không thể tải danh sách đơn hàng.');
            setOrders([]);
            setPagination({ currentPage: 1, totalPages: 1, totalOrders: 0 });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        // Reset về trang 1 khi người dùng đổi tab hoặc tìm kiếm
        setPagination(p => ({ ...p, currentPage: 1 }));
    }, [activeTab, debouncedSearchTerm]);

    useEffect(() => {
        // Gọi API mỗi khi tab, trang hiện tại, hoặc từ khóa tìm kiếm (đã debounce) thay đổi
        fetchOrders(activeTab, pagination.currentPage, debouncedSearchTerm);
    }, [activeTab, pagination.currentPage, debouncedSearchTerm, fetchOrders]);

    const handlePageChange = (newPage: number) => {
        if (newPage > 0 && newPage <= pagination.totalPages) {
            setPagination(p => ({ ...p, currentPage: newPage }));
        }
    };

    const handleViewDetails = (order: any) => {
        setSelectedOrder(order);
        setIsDetailModalOpen(true);
    };

    const handleUpdateStatus = async (orderId: string, newStatus: string, reason?: string) => {
        setUpdatingStatus(true);
        try {
            await storeApi.updateOrderStatusBySeller(orderId, newStatus, reason);
            toast.success(`Đã cập nhật trạng thái đơn hàng thành công!`);

            // Close any open modals
            if (isDetailModalOpen) setIsDetailModalOpen(false);
            if (isRejectModalOpen) setIsRejectModalOpen(false);

            // Reset states
            setSelectedOrder(null);
            setRejectionReason('');

            // Refetch orders to show the update
            fetchOrders(activeTab, pagination.currentPage, debouncedSearchTerm);
        } catch (error: any) {
            toast.error(error.message || 'Cập nhật trạng thái thất bại.');
        } finally {
            setUpdatingStatus(false);
        }
    };

    const openRejectModal = () => {
        setIsDetailModalOpen(false);
        setIsRejectModalOpen(true);
    };

    const renderStatusBadge = (status: string) => {
        const styles: { [key: string]: string } = {
            pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
            confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
            shipping: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
            completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
            cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
        };
        return (
            <span className={`px-3 py-1 text-xs font-bold rounded-full capitalize ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
                {status}
            </span>
        );
    };

    return (
        <SellerLayout>
            <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1a110c] px-6 flex items-center">
                <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Quản lý Đơn hàng</h1>
            </header>
            <main className="p-6 md:p-10">
                <div className="border-b border-slate-200 dark:border-slate-800 mb-6 pb-3">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                        {/* Tabs */}
                        <nav className="-mb-px flex space-x-6 overflow-x-auto">
                            {TABS.map(tab => (
                                <button
                                    key={tab.key}
                                    onClick={() => {
                                        setActiveTab(tab.key);
                                        setSearchTerm('');
                                    }}
                                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.key
                                        ? 'border-primary text-primary'
                                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:hover:text-slate-200 dark:hover:border-slate-700'
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </nav>

                        {/* Search */}
                        <div className="relative w-full md:w-96">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                search
                            </span>

                            <input
                                type="text"
                                placeholder="Tìm theo mã đơn, tên hoặc email khách..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                    <p className="text-sm text-slate-500 dark:text-slate-400 flex-shrink-0">
                        Hiển thị {orders.length} trên tổng số <strong>{pagination.totalOrders || 0}</strong> đơn hàng.
                    </p>
                </div>

                {/* Order List */}
                <div className="bg-white dark:bg-[#2d1e16] rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                            <thead className="bg-slate-50 dark:bg-slate-900/50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Mã Đơn Hàng</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Ngày Đặt</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Khách Hàng</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tổng Tiền</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Trạng Thái</th>
                                    <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Hành Động</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                {loading ? (
                                    <tr><td colSpan={6} className="text-center py-10 text-slate-500">Đang tải...</td></tr>
                                ) : orders.length > 0 ? (
                                    orders.map(order => (
                                        <tr key={order._id} className="hover:bg-slate-50 dark:hover:bg-slate-900/20 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-primary">#{order._id.slice(-6).toUpperCase()}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">{format(new Date(order.created_at), 'dd/MM/yyyy')}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">{order.customer_id?.full_name || 'N/A'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-800 dark:text-slate-100">{formatCurrency(order.total_amount)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">{renderStatusBadge(order.order_status)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button onClick={() => handleViewDetails(order)} className="text-primary hover:underline">Xem chi tiết</button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan={6} className="text-center py-10 text-slate-500">Không có đơn hàng nào.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {/* Pagination */}
                    <div className="px-6 py-4 flex items-center justify-between border-t border-slate-200 dark:border-slate-800">
                        <span className="text-sm text-slate-500 dark:text-slate-400">
                            Trang <strong>{pagination.currentPage}</strong> / {pagination.totalPages || 1}
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handlePageChange(pagination.currentPage - 1)}
                                disabled={pagination.currentPage <= 1 || loading}
                                className="px-3 py-1.5 text-sm font-bold rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Trước
                            </button>
                            <button
                                onClick={() => handlePageChange(pagination.currentPage + 1)}
                                disabled={pagination.currentPage >= pagination.totalPages || loading}
                                className="px-3 py-1.5 text-sm font-bold rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Sau
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            {/* Order Detail Modal */}
            {isDetailModalOpen && selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-[#2d1e16] rounded-2xl shadow-2xl p-6 md:p-8 w-full max-w-3xl relative max-h-[90vh] overflow-y-auto">
                        <button onClick={() => setIsDetailModalOpen(false)} className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">
                            <span className="material-symbols-outlined">close</span>
                        </button>
                        <h2 className="text-2xl font-bold dark:text-white mb-6">Chi tiết Đơn hàng <span className="font-mono text-primary">#{selectedOrder._id.slice(-6).toUpperCase()}</span></h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Left Column: Customer & Shipping */}
                            <div className="space-y-6">
                                <div>
                                    <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-2">Thông tin khách hàng</h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-400"><b>Tên:</b> {selectedOrder.customer_id?.full_name}</p>
                                    <p className="text-sm text-slate-600 dark:text-slate-400"><b>Email:</b> {selectedOrder.customer_id?.email}</p>
                                    <p className="text-sm text-slate-600 dark:text-slate-400"><b>SĐT:</b> {selectedOrder.customer_id?.phone}</p>
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-2">Địa chỉ giao hàng</h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-400"><b>Người nhận:</b> {selectedOrder.shipping_address?.recipient_name || 'N/A'}</p>
                                    <p className="text-sm text-slate-600 dark:text-slate-400"><b>SĐT:</b> {selectedOrder.shipping_address?.phone || 'N/A'}</p>
                                    <p className="text-sm text-slate-600 dark:text-slate-400"><b>Địa chỉ:</b> {selectedOrder.shipping_address?.full_address || 'N/A'}</p>
                                </div>
                            </div>

                            {/* Right Column: Products */}
                            <div className="space-y-4">
                                <h3 className="font-bold text-slate-800 dark:text-slate-200">Sản phẩm trong đơn</h3>
                                <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                                    {selectedOrder.items.map((item: any) => (
                                        <div key={item.product_id} className="flex items-center gap-4">
                                            <img src={item.image_snapshot} alt={item.name_snapshot} className="w-16 h-16 rounded-lg object-cover" />
                                            <div className="flex-1">
                                                <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">{item.name_snapshot}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">Phân loại: {item.type || 'Mặc định'}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">SL: {item.quantity}</p>
                                            </div>
                                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{formatCurrency(item.price_snapshot * item.quantity)}</p>
                                        </div>
                                    ))}
                                </div>
                                <div className="border-t border-slate-200 dark:border-slate-800 pt-4 space-y-2">
                                    <div className="flex justify-between text-sm"><span className="text-slate-600 dark:text-slate-400">Tạm tính:</span> <span className="dark:text-white">{formatCurrency(selectedOrder.total_price)}</span></div>
                                    <div className="flex justify-between text-sm"><span className="text-slate-600 dark:text-slate-400">Phí vận chuyển:</span> <span className="dark:text-white">{formatCurrency(selectedOrder.shipping_fee)}</span></div>
                                    <div className="flex justify-between font-bold text-lg"><span className="dark:text-white">Tổng cộng:</span> <span className="text-primary">{formatCurrency(selectedOrder.total_amount)}</span></div>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        {['pending', 'confirmed', 'shipping'].includes(selectedOrder.order_status) && (
                            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                                <p className="text-sm font-bold text-slate-600 dark:text-slate-300 mb-4">Hành động:</p>
                                <div className="flex flex-wrap gap-4">
                                    {/* Confirm Button */}
                                    {selectedOrder.order_status === 'pending' && (
                                        <button
                                            onClick={() => handleUpdateStatus(selectedOrder._id, 'confirmed')}
                                            disabled={updatingStatus}
                                            className="flex-1 bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-primary/25 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                                        >
                                            {updatingStatus ? 'Đang xử lý...' : 'Xác nhận đơn hàng'}
                                        </button>
                                    )}

                                    {/* Ship Button */}
                                    {selectedOrder.order_status === 'confirmed' && (
                                        <button
                                            onClick={() => handleUpdateStatus(selectedOrder._id, 'shipping')}
                                            disabled={updatingStatus}
                                            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                                        >
                                            {updatingStatus ? 'Đang xử lý...' : 'Giao cho vận chuyển'}
                                        </button>
                                    )}

                                    {/* Complete Button */}
                                    {selectedOrder.order_status === 'shipping' && (
                                        <button
                                            onClick={() => handleUpdateStatus(selectedOrder._id, 'completed')}
                                            disabled={updatingStatus}
                                            className="flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-green-500/25 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                                        >
                                            {updatingStatus ? 'Đang xử lý...' : 'Hoàn thành đơn'}
                                        </button>
                                    )}

                                    {/* Cancel Button */}
                                    {['pending', 'confirmed'].includes(selectedOrder.order_status) && (
                                        <button
                                            onClick={openRejectModal}
                                            disabled={updatingStatus}
                                            className="flex-1 px-6 py-3 rounded-xl font-bold text-sm bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/40 dark:text-red-300 dark:hover:bg-red-900/60 transition-all disabled:opacity-50"
                                        >
                                            Hủy đơn hàng
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Reject Reason Modal */}
            {isRejectModalOpen && selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-[#2d1e16] rounded-2xl shadow-2xl p-6 md:p-8 w-full max-w-md relative">
                        <h3 className="text-xl font-bold dark:text-white mb-4">Lý do từ chối đơn hàng</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Vui lòng cung cấp lý do từ chối. Khách hàng sẽ nhận được thông báo này.</p>
                        <textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="Ví dụ: Sản phẩm đã hết hàng, không thể liên lạc với khách hàng..."
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none min-h-[120px]"
                        />
                        <div className="mt-6 flex gap-4">
                            <button
                                onClick={() => { setIsRejectModalOpen(false); setIsDetailModalOpen(true); }}
                                className="flex-1 px-6 py-3 rounded-xl font-bold text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={() => {
                                    if (!rejectionReason) {
                                        toast.error('Vui lòng nhập lý do từ chối.');
                                        return;
                                    }
                                    handleUpdateStatus(selectedOrder._id, 'cancelled', rejectionReason);
                                }}
                                disabled={updatingStatus}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-70"
                            >
                                {updatingStatus ? 'Đang gửi...' : 'Xác nhận từ chối'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </SellerLayout>
    );
};

export default OrderManagement;