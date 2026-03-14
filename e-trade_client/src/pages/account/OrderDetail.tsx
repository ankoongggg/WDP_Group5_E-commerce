import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useCurrency } from '../../context/CurrencyContext';
import { useToast } from '../../context/ToastContext';
import { orderApi } from '../../services/api';
import {AccountLayout} from '../components/AccountLayout';

// Helper component for displaying stars
const StarRatingDisplay = ({ rating, size = 'text-sm' }: { rating: number, size?: string }) => {
  return (
    <div className="flex">
      {[...Array(5)].map((_, index) => {
        const ratingValue = index + 1;
        return (
          <span key={ratingValue} className={`material-symbols-outlined fill ${size} ${ratingValue <= rating ? 'text-amber-400' : 'text-slate-300'}`}>star</span>
        );
      })}
    </div>
  );
};

// Modal component to display review details
const ReviewDetailModal = ({ review, item, onClose }: { review: any, item: any, onClose: () => void }) => {
    if (!review || !item) return null;

    const productId = typeof item.product_id === 'object' ? item.product_id._id : item.product_id;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 md:p-8 w-full max-w-lg relative" onClick={e => e.stopPropagation()}>
                <button 
                    onClick={onClose} 
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 transition-colors"
                >
                    <span className="material-symbols-outlined">close</span>
                </button>
                
                <h1 className="text-2xl font-bold text-center mb-2 dark:text-white">Đánh giá của bạn</h1>
                <p className="text-slate-500 text-center mb-8">Đánh giá vào ngày {new Date(review.created_at).toLocaleDateString('vi-VN')}.</p>

                <div className="flex gap-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-700 mb-8">
                    <img src={item.image_snapshot} alt={item.name_snapshot} className="w-20 h-20 rounded-md object-cover" />
                    <div className="flex-1">
                        <h3 className="font-bold text-lg dark:text-white line-clamp-2">{item.name_snapshot}</h3>
                        <p className="text-sm text-slate-500">x{item.quantity}</p>
                    </div>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold mb-2 text-center text-slate-600 dark:text-slate-300">Chất lượng sản phẩm</label>
                        <div className="flex justify-center"><StarRatingDisplay rating={review.rating} size="text-4xl" /></div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-2 text-slate-600 dark:text-slate-300">Nội dung đánh giá</label>
                        <div className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 dark:text-white min-h-[100px] whitespace-pre-wrap">{review.comment || <span className="text-slate-400">Không có bình luận.</span>}</div>
                    </div>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                   {!review.is_edited ? (
                      <Link 
                        to={`/account/feedback?productId=${productId}&orderId=${review.order_id}`}
                        className="w-full flex items-center justify-center gap-2 bg-primary/10 text-primary hover:bg-primary hover:text-white py-3 rounded-xl font-bold transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                        Sửa đánh giá (Còn 1 lần)
                      </Link>
                   ) : (
                      <div className="text-center text-amber-500 text-sm italic font-medium bg-amber-50 dark:bg-amber-500/10 py-3 rounded-lg">
                         Đánh giá này đã được chỉnh sửa và không thể thay đổi thêm.
                      </div>
                   )}
                </div>
            </div>
        </div>
    );
};

const OrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedReviewItem, setSelectedReviewItem] = useState<any | null>(null);
  const { formatPrice } = useCurrency();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrderDetail = async () => {
      if (!id) {
        toast.error('Invalid Order ID');
        navigate('/account/orders');
        return;
      }

      try {
        const data = await orderApi.getOrderDetail(id);
        setOrder(data.data || data);
      } catch (error: any) {
        console.error('Failed to fetch order detail', error);
        toast.error('Không tìm thấy đơn hàng');
        navigate('/account/orders');
      } finally {
        setLoading(false);
      }
    };
    fetchOrderDetail();
  }, [id, navigate, toast]);

  if (loading) return <AccountLayout><div className="p-10 text-center">Đang tải chi tiết đơn hàng...</div></AccountLayout>;
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

  // Xử lý địa chỉ để hiển thị chuẩn xác nhất
  const recipientName = order.shipping_address?.recipient_name || order.customer_id?.full_name || 'Khách hàng';
  const phoneNumber = order.shipping_address?.phone || order.customer_id?.phone || 'Chưa có SĐT';
  
  // Ghép chuỗi địa chỉ
  let fullAddress = '';
  if (order.shipping_address?.full_address) {
      fullAddress = order.shipping_address.full_address;
  } else if (order.shipping_address?.street) {
      fullAddress = `${order.shipping_address.street}, ${order.shipping_address.district}, ${order.shipping_address.city}`;
  } else {
      fullAddress = 'Chưa có thông tin địa chỉ cụ thể';
  }

  return (
    <AccountLayout>
      {selectedReviewItem && (
        <ReviewDetailModal 
            item={selectedReviewItem}
            review={selectedReviewItem.user_review}
            onClose={() => setSelectedReviewItem(null)} 
        />
      )}
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
             <Link to="/account/orders" className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors">
                <span className="material-symbols-outlined">arrow_back</span> TRỞ LẠI DANH SÁCH
             </Link>
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
                    <h4 className="font-bold dark:text-white mb-1">{recipientName}</h4>
                    <p className="text-slate-500 text-sm mb-2">{phoneNumber}</p>
                    <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                        {fullAddress}
                    </p>
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
                <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-slate-500 text-2xl">storefront</span>
                    {order.seller_id?._id ? (
                        order.seller_id.shop_name ? (
                            <>
                                <Link to={`/store/${order.seller_id._id}`} className="font-bold text-lg text-slate-900 dark:text-white hover:text-primary transition-colors">
                                    {order.seller_id.shop_name}
                                </Link>
                                <Link to={`/store/${order.seller_id._id}`} className="bg-white dark:bg-slate-700 text-xs px-3 py-1.5 rounded-md font-medium hover:bg-slate-100 transition-colors dark:text-white border border-slate-200 dark:border-slate-600 flex items-center gap-1 shadow-sm">
                                    <span className="material-symbols-outlined text-[14px]">store</span> Xem Shop
                                </Link>
                            </>
                        ) : (
                            <span className="font-bold text-lg text-slate-900 dark:text-white">{order.seller_id.full_name || 'Người bán'}</span>
                        )
                    ) : (
                        <span className="font-bold text-lg text-slate-900 dark:text-white">{order.seller_id?.shop_name || order.seller_id?.full_name || order.seller_id?.full_name || 'Shop'}</span>
                    )}
                    <button className="text-xs bg-primary text-white px-3 py-1.5 rounded-md font-medium hover:bg-primary/90 transition-colors shadow-sm ml-2">Chat ngay</button>
                </div>
             </div>
             <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {order.items.map((item: any, idx: number) => (
                    <div key={idx} className="p-6 flex gap-4">
                        <div className="w-24 h-24 rounded-lg border border-slate-200 dark:border-slate-600 overflow-hidden shrink-0">
                            <img src={item.image_snapshot} alt={item.name_snapshot} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-lg dark:text-white">{item.name_snapshot}</h3>
                            <p className="text-slate-500 text-sm">x{item.quantity}</p>
                        </div>
                        <div className="text-right flex flex-col items-end justify-between">
                            <p className="text-primary font-bold text-lg">{formatPrice(item.price_snapshot)}</p>
                            {order.order_status === 'completed' && (item.product_id ? (
                                item.user_review ? (
                                    <div className="mt-2 text-right">
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Đánh giá của bạn:</p>
                                        <StarRatingDisplay rating={item.user_review.rating} />
                                        <button onClick={() => setSelectedReviewItem(item)} className="text-xs text-primary hover:underline">
                                            Xem chi tiết
                                        </button>
                                    </div>
                                ) : (
                                    <Link to={`/account/feedback?productId=${item.product_id._id}&orderId=${order._id}`} className="mt-2 inline-block text-sm bg-amber-500 text-white px-3 py-1 rounded-md hover:bg-amber-600 transition-colors">
                                        Đánh giá
                                    </Link>
                                )
                            ) : null)}
                        </div>
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
    </AccountLayout>
  );
};
export default OrderDetail;