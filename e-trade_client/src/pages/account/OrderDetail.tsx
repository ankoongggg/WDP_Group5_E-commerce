import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Layout } from '../components/Layout';
import { useCurrency } from '../../context/CurrencyContext';
import { useToast } from '../../context/ToastContext';

const OrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { formatPrice } = useCurrency();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrderDetail = async () => {
      // Fix: Kiểm tra id hợp lệ trước khi gọi API
      if (!id || id === 'undefined') {
        return;
      }

      try {
        const token = localStorage.getItem('accessToken');
        const response = await axios.get(`http://localhost:9999/api/shop/orders/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data.success) {
          setOrder(response.data.data);
        }
      } catch (error) {
        console.error('Failed to fetch order detail', error);
        toast.error('Không tìm thấy đơn hàng');
        navigate('/account/orders');
      } finally {
        setLoading(false);
      }
    };
    fetchOrderDetail();
  }, [id, navigate, toast]);

  if (loading) return <Layout><div className="p-10 text-center">Đang tải chi tiết đơn hàng...</div></Layout>;
  if (!order) return null;

  const steps = [
    { status: 'pending', label: 'Đơn hàng đã đặt', icon: 'receipt_long' },
    { status: 'confirmed', label: 'Đã xác nhận', icon: 'check_circle' },
    { status: 'shipping', label: 'Đang giao hàng', icon: 'local_shipping' },
    { status: 'completed', label: 'Đã giao', icon: 'inventory_2' },
  ];

  let currentStepIndex = 0;
  if (order.order_status === 'confirmed') currentStepIndex = 1;
  else if (order.order_status === 'shipping') currentStepIndex = 2;
  else if (order.order_status === 'completed') currentStepIndex = 3;
  else if (order.order_status === 'cancelled') currentStepIndex = -1;

  return (
    <Layout>
      <div className="bg-slate-50 dark:bg-slate-900 min-h-screen py-8">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
             <Link to="/account/orders" className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors"><span className="material-symbols-outlined">arrow_back</span> TRỞ LẠI</Link>
             <div className="text-sm uppercase font-bold text-primary">MÃ ĐƠN HÀNG: {order._id.slice(-8).toUpperCase()} | <span className="text-slate-500">{order.order_status.toUpperCase()}</span></div>
          </div>

          {order.order_status !== 'cancelled' ? (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-8 mb-6 border border-slate-100 dark:border-slate-700">
                <div className="flex justify-between relative">
                    <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 dark:bg-slate-700 -translate-y-1/2 z-0"></div>
                    <div className="absolute top-1/2 left-0 h-1 bg-green-500 -translate-y-1/2 z-0 transition-all duration-500" style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}></div>
                    {steps.map((step, index) => {
                        const isActive = index <= currentStepIndex;
                        return (
                            <div key={step.status} className="relative z-10 flex flex-col items-center gap-2 bg-white dark:bg-slate-800 px-2">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center border-4 transition-all ${isActive ? 'border-green-500 bg-green-500 text-white' : 'border-slate-200 bg-white text-slate-300'}`}><span className="material-symbols-outlined">{step.icon}</span></div>
                                <span className={`text-xs font-bold ${isActive ? 'text-green-600' : 'text-slate-400'}`}>{step.label}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
          ) : (
            <div className="bg-red-50 border border-red-100 rounded-xl p-6 mb-6 text-center text-red-600 font-bold">ĐƠN HÀNG ĐÃ BỊ HỦY</div>
          )}

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-0 mb-6 border border-slate-100 dark:border-slate-700 overflow-hidden">
             <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-stripes"><h3 className="font-bold text-lg flex items-center gap-2 dark:text-white"><span className="material-symbols-outlined text-primary">location_on</span> Địa chỉ nhận hàng</h3></div>
             <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <h4 className="font-bold dark:text-white mb-1">{order.customer_id?.full_name || 'Khách hàng'}</h4>
                    <p className="text-slate-500 text-sm mb-1">{order.customer_id?.phone || 'Số điện thoại'}</p>
                    <p className="text-slate-600 dark:text-slate-300 text-sm">{order.shipping_address?.street}, {order.shipping_address?.district}, {order.shipping_address?.city}</p>
                </div>
                <div className="border-l border-slate-100 dark:border-slate-700 pl-0 md:pl-8">
                    <div className="flex items-start gap-4 mb-4">
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 shrink-0"><span className="material-symbols-outlined">local_shipping</span></div>
                        <div><p className="font-bold text-sm dark:text-white">Phương thức vận chuyển</p><p className="text-slate-500 text-sm">Giao hàng tiêu chuẩn</p></div>
                    </div>
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-500 shrink-0"><span className="material-symbols-outlined">payments</span></div>
                        <div><p className="font-bold text-sm dark:text-white">Phương thức thanh toán</p><p className="text-slate-500 text-sm uppercase">{order.payment_method === 'cod' ? 'Thanh toán khi nhận hàng' : order.payment_method}</p></div>
                    </div>
                </div>
             </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden mb-6">
             <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-700/50">
                <div className="flex items-center gap-2"><span className="font-bold dark:text-white">{order.seller_id?.shop_name || 'Shop'}</span><button className="text-xs bg-primary text-white px-2 py-0.5 rounded">Chat ngay</button></div>
             </div>
             <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {order.items.map((item: any, idx: number) => (
                    <div key={idx} className="p-6 flex gap-4">
                        <div className="w-24 h-24 rounded-lg border border-slate-200 dark:border-slate-600 overflow-hidden shrink-0"><img src={item.image_snapshot} alt={item.name_snapshot} className="w-full h-full object-cover" /></div>
                        <div className="flex-1"><h3 className="font-bold text-lg dark:text-white">{item.name_snapshot}</h3><p className="text-slate-500 text-sm">x{item.quantity}</p></div>
                        <div className="text-right"><p className="text-primary font-bold text-lg">{formatPrice(item.price_snapshot)}</p></div>
                    </div>
                ))}
             </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
             <div className="p-6 space-y-3">
                <div className="flex justify-between text-slate-500 text-sm"><span>Tổng tiền hàng</span><span>{formatPrice(order.total_amount - (order.shipping_fee || 0))}</span></div>
                <div className="flex justify-between text-slate-500 text-sm"><span>Phí vận chuyển</span><span>{formatPrice(order.shipping_fee || 0)}</span></div>
                <div className="border-t border-slate-100 dark:border-slate-700 pt-4 flex justify-between items-center"><span className="font-bold text-lg dark:text-white">Tổng số tiền</span><span className="font-black text-2xl text-primary">{formatPrice(order.total_amount)}</span></div>
             </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
export default OrderDetail;