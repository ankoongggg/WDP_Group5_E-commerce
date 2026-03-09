import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { useCurrency } from '../../context/CurrencyContext';
import { useAuth } from '../../context/AuthContext';
import { orderApi } from '../../services/api';

interface OrderItem {
  product_id: {
    _id: string;
    name: string;
    main_image: string;
    price: number;
  };
  name_snapshot: string;
  price_snapshot: number;
  quantity: number;
  image_snapshot: string;
}

interface Order {
  _id: string;
  order_status: string;
  payment_status: string;
  total_amount: number;
  items: OrderItem[];
  created_at: string;
  seller_id?: {
      shop_name: string;
  }
}

const OrderHistory: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const { formatPrice } = useCurrency();
  const { user } = useAuth();

  const tabs = [
    { id: 'all', label: 'Tất cả' },
    { id: 'pending', label: 'Chờ thanh toán' },
    { id: 'confirmed', label: 'Vận chuyển' },
    { id: 'completed', label: 'Hoàn thành' },
    { id: 'cancelled', label: 'Đã hủy' },
  ];

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await orderApi.getMyOrders();
        setOrders(Array.isArray(data) ? data : data.data || []);
      } catch (error: any) {
        console.error('Failed to fetch orders', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const filteredOrders = orders.filter(order => {
    if (activeTab === 'all') return true;
    if (activeTab === 'pending') return order.order_status === 'pending';
    if (activeTab === 'confirmed') return ['confirmed', 'shipping', 'shipped'].includes(order.order_status);
    if (activeTab === 'completed') return order.order_status === 'completed';
    if (activeTab === 'cancelled') return order.order_status === 'cancelled';
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-amber-500';
      case 'confirmed': return 'text-blue-500';
      case 'completed': return 'text-green-500';
      case 'cancelled': return 'text-red-500';
      default: return 'text-slate-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Chờ thanh toán';
      case 'confirmed': return 'Đang vận chuyển';
      case 'completed': return 'Hoàn thành';
      case 'cancelled': return 'Đã hủy';
      default: return status;
    }
  };

  if (loading) return <Layout><div className="p-10 text-center">Đang tải đơn hàng...</div></Layout>;

  return (
    <Layout>
      <div className="bg-slate-50 dark:bg-slate-900 min-h-screen py-8">
        <div className="max-w-5xl mx-auto px-4">
          <h1 className="text-2xl font-bold mb-6 dark:text-white">Đơn hàng của tôi</h1>
          <div className="bg-white dark:bg-slate-800 rounded-t-xl shadow-sm border-b border-slate-200 dark:border-slate-700 flex overflow-x-auto">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 py-4 px-6 text-sm font-medium whitespace-nowrap transition-all border-b-2 ${activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-primary/70'}`}>{tab.label}</button>
            ))}
          </div>
          <div className="space-y-4 mt-4">
            {filteredOrders.length > 0 ? (
              filteredOrders.map(order => (
                <div key={order._id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 border border-slate-100 dark:border-slate-700">
                  <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-4 mb-4">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-slate-500">storefront</span>
                        <span className="font-bold dark:text-white">{order.seller_id?.shop_name || 'Cửa hàng'}</span>
                        <Link to={`/account/orders/${order._id}`} className="bg-slate-100 dark:bg-slate-700 text-xs px-2 py-1 rounded hover:bg-slate-200 transition-colors dark:text-white">Xem chi tiết</Link>
                    </div>
                    <div className={`text-sm font-bold uppercase flex items-center gap-1 ${getStatusColor(order.order_status)}`}>
                        <span className="material-symbols-outlined text-lg">{order.order_status === 'completed' ? 'check_circle' : 'local_shipping'}</span>
                        {getStatusLabel(order.order_status)}
                    </div>
                  </div>
                  <div className="space-y-4">
                    {order.items.map((item, idx) => (
                        <div key={idx} className="flex gap-4">
                            <div className="w-20 h-20 rounded-lg border border-slate-200 dark:border-slate-600 overflow-hidden shrink-0">
                                <img src={item.image_snapshot || 'https://via.placeholder.com/100'} alt={item.name_snapshot} className="w-full h-full object-cover"/>
                            </div>
                            <div className="flex-1">
                                <h3 className="font-medium line-clamp-2 dark:text-white">{item.name_snapshot}</h3>
                                <p className="text-sm text-slate-500 mt-1">x{item.quantity}</p>
                            </div>
                            <div className="text-right">
                                <span className="text-primary font-medium">{formatPrice(item.price_snapshot)}</span>
                            </div>
                        </div>
                    ))}
                  </div>
                  <div className="border-t border-slate-100 dark:border-slate-700 pt-4 mt-4 flex flex-col sm:flex-row justify-between items-end sm:items-center gap-4">
                    <div className="text-right sm:text-left"><span className="text-sm text-slate-500 mr-2">Thành tiền:</span><span className="text-xl font-bold text-primary">{formatPrice(order.total_amount)}</span></div>
                    <div className="flex gap-3">
                        <Link to={`/account/orders/${order._id}`} className="px-6 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 shadow-lg shadow-primary/20 transition-colors">Xem chi tiết</Link>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white dark:bg-slate-800 rounded-xl p-12 text-center shadow-sm"><div className="w-24 h-24 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4"><span className="material-symbols-outlined text-4xl text-slate-400">receipt_long</span></div><h3 className="text-lg font-bold dark:text-white">Chưa có đơn hàng nào</h3><Link to="/products" className="inline-block px-8 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 mt-4">Mua sắm ngay</Link></div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};
export default OrderHistory;