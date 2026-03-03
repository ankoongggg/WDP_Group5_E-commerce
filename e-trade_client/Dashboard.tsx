import React, { useEffect, useState } from 'react';
import { SellerLayout } from '../components/seller/SellerLayout';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

export const SellerDashboard: React.FC = () => {
    const [shop, setShop] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        const fetchMyStore = async () => {
            try {
                const token = localStorage.getItem('accessToken');
                const res = await axios.get('http://localhost:9999/api/store/my-store', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setShop(res.data);
            } catch (error) {
                console.error("Lỗi tải thông tin shop", error);
            } finally {
                setLoading(false);
            }
        };
        fetchMyStore();
    }, []);

    if (loading) return <SellerLayout><div className="p-10 text-center">Đang tải dữ liệu...</div></SellerLayout>;

    return (
        <SellerLayout>
            <div className="space-y-6">
                {/* Welcome Banner */}
                <div className="bg-gradient-to-r from-primary to-purple-600 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
                    <div className="relative z-10">
                        <h1 className="text-3xl font-bold mb-2">Xin chào, {shop?.shop_name || 'Shop của bạn'}! 👋</h1>
                        <p className="opacity-90">Chúc bạn một ngày kinh doanh hiệu quả. Dưới đây là tổng quan về cửa hàng của bạn.</p>
                    </div>
                    <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-10 translate-y-10">
                        <span className="material-symbols-outlined text-[200px]">storefront</span>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                                <span className="material-symbols-outlined">inventory_2</span>
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Sản phẩm</p>
                                <h3 className="text-2xl font-bold dark:text-white">--</h3>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
                                <span className="material-symbols-outlined">shopping_bag</span>
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Đơn hàng mới</p>
                                <h3 className="text-2xl font-bold dark:text-white">--</h3>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-amber-100 text-amber-600 rounded-xl">
                                <span className="material-symbols-outlined">payments</span>
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Doanh thu tháng</p>
                                <h3 className="text-2xl font-bold dark:text-white">--</h3>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <h3 className="font-bold text-lg mb-4 dark:text-white">Thao tác nhanh</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <Link to="/seller/products/new" className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50 hover:bg-primary/5 hover:border-primary/50 border border-transparent transition-all group">
                                <span className="material-symbols-outlined text-3xl text-slate-400 group-hover:text-primary mb-2">add_box</span>
                                <span className="font-medium text-slate-600 dark:text-slate-300 group-hover:text-primary">Đăng sản phẩm</span>
                            </Link>
                            <Link to="/seller/orders" className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50 hover:bg-primary/5 hover:border-primary/50 border border-transparent transition-all group">
                                <span className="material-symbols-outlined text-3xl text-slate-400 group-hover:text-primary mb-2">list_alt</span>
                                <span className="font-medium text-slate-600 dark:text-slate-300 group-hover:text-primary">Quản lý đơn</span>
                            </Link>
                        </div>
                    </div>
                    
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <h3 className="font-bold text-lg mb-4 dark:text-white">Thông tin Shop</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between border-b border-slate-100 dark:border-slate-700 pb-2">
                                <span className="text-slate-500">Tên Shop</span>
                                <span className="font-medium dark:text-white">{shop?.shop_name}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-100 dark:border-slate-700 pb-2">
                                <span className="text-slate-500">Trạng thái</span>
                                <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-bold uppercase">{shop?.status}</span>
                            </div>
                            <div className="flex justify-between pt-1">
                                <span className="text-slate-500">Ngày tham gia</span>
                                <span className="font-medium dark:text-white">{new Date(shop?.created_at).toLocaleDateString('vi-VN')}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </SellerLayout>
    );
};