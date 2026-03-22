import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { storeApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import SellerLayout from './SellerLayout';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { format } from 'date-fns';
import axios from 'axios'; // 👉 THÊM AXIOS ĐỂ GỌI API LẤY STATUS SHOP

const formatCurrency = (amount: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

const StatCard = ({ title, value, icon, colorClass }: { title: string, value: string | number, icon: string, colorClass: string }) => (
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
    </div>
);

const SellerDashboard: React.FC = () => {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [chartLoading, setChartLoading] = useState(false);
    const [activePeriod, setActivePeriod] = useState<'7d' | '30d' | 'custom'>('30d');
    const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });
    const { toast } = useToast();

    // 👇 STATE CHỨA TRẠNG THÁI CỦA SHOP HIỆN TẠI
    const [storeStatus, setStoreStatus] = useState<string>('active');

    // 👇 GỌI API LẤY TRẠNG THÁI SHOP (ĐỂ CHECK XEM CÓ BỊ BAN KHÔNG)
    useEffect(() => {
        const fetchStoreStatus = async () => {
            try {
                const token = localStorage.getItem('accessToken');
                const res = await axios.get('http://localhost:9999/api/store/my-store', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.data?.data?.store?.status) {
                    setStoreStatus(res.data.data.store.status);
                }
            } catch (e) {
                console.error("Lỗi lấy thông tin store", e);
            }
        };
        fetchStoreStatus();
    }, []);

    useEffect(() => {
        const fetchStats = async () => {
            // Nếu đã có dữ liệu, chỉ hiển thị loading cho chart
            if (stats) {
                setChartLoading(true);
            } else {
                setLoading(true);
            }

            try {
                let response;
                if (activePeriod === 'custom' && customDateRange.start && customDateRange.end) {
                    response = await storeApi.getSellerDashboardStats({ startDate: customDateRange.start, endDate: customDateRange.end }) as any;
                } else if (activePeriod !== 'custom') {
                    response = await storeApi.getSellerDashboardStats({ revenuePeriod: activePeriod }) as any;
                } else {
                    return; // Không fetch nếu là custom nhưng chưa có ngày
                }

                if (response.success) {
                    setStats(response.data);
                }
            } catch (error: any) {
                toast.error(error.message || "Không thể tải dữ liệu dashboard.");
            } finally {
                setLoading(false);
                setChartLoading(false);
            }
        };
        fetchStats();
    }, [toast, activePeriod, customDateRange]);

    const renderStatusBadge = (status: string) => {
        const styles: { [key: string]: string } = {
            pending: 'bg-yellow-100 text-yellow-800',
            confirmed: 'bg-blue-100 text-blue-800',
            shipping: 'bg-indigo-100 text-indigo-800',
            completed: 'bg-green-100 text-green-800',
            cancelled: 'bg-red-100 text-red-800',
        };
        return <span className={`px-2 py-0.5 text-xs font-bold rounded-full capitalize ${styles[status] || 'bg-gray-100'}`}>{status}</span>;
    };

    const handleApplyCustomRange = () => {
        const startInput = document.getElementById('startDate') as HTMLInputElement;
        const endInput = document.getElementById('endDate') as HTMLInputElement;
        const startDate = startInput.value;
        const endDate = endInput.value;

        if (startDate && endDate) {
            if (new Date(startDate) > new Date(endDate)) {
                toast.error("Ngày bắt đầu không thể lớn hơn ngày kết thúc.");
                return;
            }
            setActivePeriod('custom');
            setCustomDateRange({ start: startDate, end: endDate });
        } else {
            toast.error("Vui lòng chọn cả ngày bắt đầu và kết thúc.");
        }
    };

    if (loading) {
        return <SellerLayout><div className="p-10 text-center">Đang tải dữ liệu...</div></SellerLayout>;
    }

    if (!stats) {
        return <SellerLayout><div className="p-10 text-center text-red-500">Không thể tải dữ liệu.</div></SellerLayout>;
    }

    return (
        <SellerLayout>
            <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1a110c] px-6 flex items-center">
                <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Dashboard</h1>
            </header>

            <main className="flex-1 overflow-y-auto p-6 md:p-10 space-y-6">
                
                {/* 👇 CẢNH BÁO ĐỎ NẾU SHOP BỊ BAN NẰM Ở ĐÂY 👇 */}
                {storeStatus === 'banned' && (
                    <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-500 rounded-xl p-6 mb-6 flex items-start gap-4 shadow-lg shadow-red-500/10 animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="bg-red-100 dark:bg-red-800/50 p-3 rounded-full text-red-600 dark:text-red-400 shrink-0">
                            <span className="material-symbols-outlined text-3xl">gavel</span>
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-red-700 dark:text-red-400 uppercase mb-1">
                                Cửa hàng của bạn đã bị khóa!
                            </h3>
                            <p className="text-red-600 dark:text-red-300 font-medium leading-relaxed">
                                Do vi phạm chính sách của hệ thống, cửa hàng đã bị tạm ngưng hoạt động. Các sản phẩm của bạn hiện đang bị ẩn khỏi sàn giao dịch. Vui lòng liên hệ Admin để biết thêm chi tiết và hỗ trợ mở lại.
                            </p>
                            <button className="mt-4 px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-lg shadow-md transition-colors flex items-center gap-2">
                                <span className="material-symbols-outlined text-[18px]">support_agent</span> 
                                Liên hệ Admin ngay
                            </button>
                        </div>
                    </div>
                )}
                {/* 👆 KẾT THÚC CẢNH BÁO 👆 */}

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        title="Tổng doanh thu"
                        value={formatCurrency(stats.totalRevenue)}
                        icon="payments"
                        colorClass="bg-green-100 text-green-600 dark:bg-green-500/20"
                    />
                    <StatCard
                        title="Đơn hàng chờ xử lý"
                        value={stats.orderStatusCounts.pending}
                        icon="pending_actions"
                        colorClass="bg-yellow-100 text-yellow-600 dark:bg-yellow-500/20"
                    />
                    <StatCard
                        title="Tổng đơn đã bán"
                        value={stats.orderStatusCounts.completed}
                        icon="shopping_cart_checkout"
                        colorClass="bg-blue-100 text-blue-600 dark:bg-blue-500/20"
                    />
                    <StatCard
                        title="Sản phẩm đã bán"
                        value={stats.productsSold}
                        icon="inventory"
                        colorClass="bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Revenue Chart */}
                    <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all">
                        <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Doanh thu</h3>
                            <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                                <button onClick={() => setActivePeriod('7d')} className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${activePeriod === '7d' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>7 ngày</button>
                                <button onClick={() => setActivePeriod('30d')} className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${activePeriod === '30d' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>30 ngày</button>
                                <button onClick={() => setActivePeriod('custom')} className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${activePeriod === 'custom' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>Tùy chỉnh</button>
                            </div>
                        </div>
                        {activePeriod === 'custom' && (
                            <div className="flex flex-col sm:flex-row items-center gap-2 mb-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                <input type="date" id="startDate" className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md px-2 py-1 text-sm w-full outline-none focus:ring-1 focus:ring-primary"/>
                                <span className="text-slate-500 hidden sm:inline">đến</span>
                                <input type="date" id="endDate" className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md px-2 py-1 text-sm w-full outline-none focus:ring-1 focus:ring-primary"/>
                                <button onClick={handleApplyCustomRange} className="px-3 py-1 bg-primary text-white text-xs font-bold rounded-md hover:bg-primary/90 w-full sm:w-auto mt-2 sm:mt-0">Áp dụng</button>
                            </div>
                        )}
                        <div style={{ width: '100%', height: 300 }}>
                            {chartLoading ? <div className="flex items-center justify-center h-full text-slate-500">Đang tải biểu đồ...</div> :
                            <ResponsiveContainer>
                                <AreaChart data={stats.revenueOverPeriod || []} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ff6f61" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#ff6f61" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.2)" />
                                    <XAxis dataKey="_id" tick={{ fontSize: 12 }} tickFormatter={(date) => format(new Date(date), 'dd/MM')} />
                                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => `${value / 1000000}tr`} />
                                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '10px' }} labelStyle={{ color: '#cbd5e1' }} formatter={(value: number) => [formatCurrency(value), 'Doanh thu']} />
                                    <Area type="monotone" dataKey="dailyRevenue" stroke="#ff6f61" fillOpacity={1} fill="url(#colorRevenue)" />
                                </AreaChart>
                            </ResponsiveContainer>
                            }
                        </div>
                    </div>

                    {/* Recent Orders */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
                        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Đơn hàng gần đây</h3>
                            <Link to="/seller/orders" className="text-primary text-sm font-medium hover:underline">Xem tất cả</Link>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {stats.recentOrders.length > 0 ? stats.recentOrders.map((order: any) => (
                                <div key={order._id} className="flex items-center justify-between gap-4 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <div className="flex-1">
                                        <p className="font-bold text-sm text-slate-800 dark:text-slate-200">{order.customer_id?.full_name || 'Khách hàng'}</p>
                                        <p className="text-xs text-slate-500">{format(new Date(order.created_at), 'dd/MM/yyyy HH:mm')}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-sm text-slate-800 dark:text-slate-200">{formatCurrency(order.total_amount)}</p>
                                        {renderStatusBadge(order.order_status)}
                                    </div>
                                </div>
                            )) : (
                                <p className="text-sm text-slate-500 text-center py-8">Chưa có đơn hàng nào.</p>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </SellerLayout>
    );
};

export default SellerDashboard;