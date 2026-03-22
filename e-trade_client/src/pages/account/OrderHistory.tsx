import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCurrency } from '../../context/CurrencyContext';
import { orderApi } from '../../services/api';
import { AccountLayout } from '../components/AccountLayout';

// --- THÀNH PHẦN HIỂN THỊ SAO ---
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

// --- COMPONENT MODAL (CÓ NÚT SỬA ĐÁNH GIÁ) ---
const ReviewDetailModal = ({ review, item, onClose }: { review: any, item: any, onClose: () => void }) => {
  if (!review || !item) return null;

  const productId = typeof item.product_id === 'object' ? item.product_id._id : item.product_id;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 md:p-8 w-full max-w-2xl relative" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 transition-colors">
          <span className="material-symbols-outlined">close</span>
        </button>

        <h1 className="text-2xl font-bold text-center mb-2 dark:text-white">Đánh giá của bạn</h1>
        <p className="text-slate-500 text-center mb-8">Đánh giá vào ngày {new Date(review.created_at).toLocaleDateString('vi-VN')}.</p>

        <div className="flex gap-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-700 mb-8">
          <img src={item.image_snapshot} alt={item.name_snapshot} className="w-20 h-20 rounded-md object-cover" />
          <div className="flex-1">
            <h3 className="font-bold text-lg dark:text-white line-clamp-2">{item.name_snapshot}</h3>
            {item.type && <p className="text-xs text-slate-400 font-medium">Loại: {item.type}</p>}
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
            <div className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 dark:text-white whitespace-pre-wrap">{review.comment || <span className="text-slate-400">Không có bình luận.</span>}</div>
          </div>
          {review.fileUploads && review.fileUploads.length > 0 && (
            <div>
              <label className="block text-sm font-bold mb-2 text-slate-600 dark:text-slate-300">Hình ảnh đính kèm</label>
              <div className="flex flex-wrap gap-3">
                {review.fileUploads.map((url: string, index: number) => (
                  <img key={index} src={url} alt={`Review image ${index + 1}`} className="w-24 h-24 rounded-lg object-cover border border-slate-200 dark:border-slate-600" />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
          {!review.is_edited ? (
            <Link to={`/account/feedback?productId=${productId}&orderId=${review.order_id}`} className="w-full flex items-center justify-center gap-2 bg-primary/10 text-primary hover:bg-primary hover:text-white py-3 rounded-xl font-bold transition-colors">
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

// --- INTERFACE ---
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
  type?: string; 
  user_review?: any;
}

interface Order {
  _id: string;
  order_status: string;
  payment_status: string;
  total_amount: number;
  items: OrderItem[];
  created_at: string;
  seller_id?: {
    _id: string; 
    shop_name?: string;
    full_name?: string;
  }
}

// --- HÀM FORMAT THỜI GIAN ĐẸP MẮT ---
const formatDateTime = (dateString: string) => {
  const date = new Date(dateString);
  const time = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  const day = date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  return `${time} | ${day}`;
};

const OrderHistory: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const { formatPrice } = useCurrency();
  const [selectedReviewItem, setSelectedReviewItem] = useState<any | null>(null);

  // 👉 ĐÃ TÁCH TAB "ĐÃ XÁC NHẬN" VÀ "ĐANG VẬN CHUYỂN" LÀM 2
  const tabs = [
    { id: 'all', label: 'Tất cả' },
    { id: 'pending', label: 'Chờ xác nhận' },
    { id: 'confirmed', label: 'Đã xác nhận' }, // Tab mới cho Credit Card
    { id: 'shipping', label: 'Đang giao' },     // Tab cho quá trình vận chuyển
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
    if (activeTab === 'confirmed') return order.order_status === 'confirmed'; // Lọc đúng confirmed
    if (activeTab === 'shipping') return ['shipping', 'shipped'].includes(order.order_status); // Lọc đúng shipping
    if (activeTab === 'completed') return order.order_status === 'completed';
    if (activeTab === 'cancelled') return order.order_status === 'cancelled';
    return true;
  }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // 👉 TÁCH MÀU CHO DỄ PHÂN BIỆT
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-amber-500';
      case 'confirmed': return 'text-indigo-500'; // Đã xác nhận màu chàm
      case 'shipping': 
      case 'shipped': return 'text-blue-500'; // Đang giao màu xanh lam
      case 'completed': return 'text-green-500';
      case 'cancelled': return 'text-red-500';
      default: return 'text-slate-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Chờ xác nhận';
      case 'confirmed': return 'Đã xác nhận (Chờ lấy hàng)'; // Đổi label rõ ràng hơn
      case 'shipping':
      case 'shipped': return 'Đang vận chuyển';
      case 'completed': return 'Hoàn thành';
      case 'cancelled': return 'Đã hủy';
      default: return status;
    }
  };

  // 👉 ĐỔI ICON TƯƠNG ỨNG TỪNG TRẠNG THÁI
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return 'hourglass_empty';
      case 'confirmed': return 'inventory_2'; // Icon đóng gói hàng
      case 'shipping':
      case 'shipped': return 'local_shipping'; // Icon xe tải
      case 'completed': return 'check_circle';
      case 'cancelled': return 'cancel';
      default: return 'info';
    }
  };

  if (loading) return (
    <AccountLayout>
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center flex flex-col items-center gap-2">
            <span className="material-symbols-outlined animate-spin text-primary text-3xl">sync</span>
            <p className="text-slate-500">Đang tải đơn hàng...</p>
        </div>
      </div>
    </AccountLayout>
  );

  return (
    <AccountLayout>
      <div>
          {selectedReviewItem && (
            <ReviewDetailModal
              item={selectedReviewItem}
              review={selectedReviewItem.user_review}
              onClose={() => setSelectedReviewItem(null)}
            />
          )}
          <div className="max-w-5xl mx-auto">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Lịch sử đơn hàng</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 mb-6">Theo dõi và quản lý tất cả đơn hàng của bạn.</p>

            <div className="">
              <div className="bg-white dark:bg-slate-800 rounded-t-xl shadow-sm border-b border-slate-200 dark:border-slate-700 flex overflow-x-auto hide-scrollbar">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 py-4 px-6 text-sm font-medium whitespace-nowrap transition-all border-b-2 ${activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-primary/70'}`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="space-y-4 mt-4">
                {filteredOrders.length > 0 ? (
                  filteredOrders.map(order => {
                    const firstItem = order.items?.[0];
                    const hasReview = firstItem?.user_review;

                    return (
                      <div key={order._id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 border border-slate-100 dark:border-slate-700">
                        {/* HEADER CARD: CHỨA TÊN SHOP VÀ THỜI GIAN */}
                        <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-700 pb-4 mb-4">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              
                              {order.seller_id?._id ? (
                                <>
                                  {order.seller_id.shop_name ? (
                                    <>
                                    <span className="material-symbols-outlined text-slate-500 text-xl">storefront</span>
                                    <Link to={`/store/${order.seller_id._id}`} className="font-bold text-slate-900 dark:text-white hover:text-primary transition-colors">
                                      {order.seller_id.shop_name}
                                    </Link>
                                    <Link to={`/store/${order.seller_id._id}`} className="bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-xs px-2 py-1 rounded hover:bg-slate-200 transition-colors dark:text-white flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[14px]">store</span> Xem Shop
                                  </Link>
                                    </>
                                    )
                                    : (
                                      <>
                                      <span className="material-symbols-outlined text-slate-500 text-xl">man</span>
                                      <span className="font-bold text-slate-900 dark:text-white">{order.seller_id.full_name || 'Người bán'}</span>
                                    </>
                                    )
                                    }
                                  

                                </>
                              ) : (
                                <span className="font-bold dark:text-white">Cửa hàng</span>
                              )}
                            </div>
                            
                            <div className="text-xs text-slate-500 flex items-center gap-1 font-medium mt-1">
                              <span className="material-symbols-outlined text-[14px]">schedule</span>
                              Đã đặt lúc: {formatDateTime(order.created_at)}
                            </div>
                          </div>

                          <div className={`text-sm font-bold uppercase flex items-center gap-1 ${getStatusColor(order.order_status)}`}>
                            <span className="material-symbols-outlined text-lg">{getStatusIcon(order.order_status)}</span>
                            {getStatusLabel(order.order_status)}
                          </div>
                        </div>

                        <div className="space-y-4">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex gap-4 items-center">
                              {item.product_id?._id ? (
                                <Link to={`/products/${item.product_id._id}`} className="flex gap-4 items-center flex-1 group">
                                  <div className="w-20 h-20 rounded-lg border border-slate-200 dark:border-slate-600 overflow-hidden shrink-0">
                                    <img src={item.image_snapshot || 'https://via.placeholder.com/100'} alt={item.name_snapshot} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                  </div>
                                  <div className="flex-1">
                                    <h3 className="font-medium line-clamp-2 dark:text-white group-hover:text-primary transition-colors">{item.name_snapshot}</h3>
                                    
                                    {item.type && (
                                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1.5 px-2 py-0.5 bg-slate-100 dark:bg-slate-700 inline-block rounded">
                                            Phân loại: {item.type}
                                        </p>
                                    )}

                                    <p className="text-sm text-slate-500 mt-1">Số lượng: {item.quantity}</p>
                                  </div>
                                </Link>
                              ) : (
                                <div className="flex gap-4 items-center flex-1 opacity-60">
                                  <div className="w-20 h-20 rounded-lg border border-slate-200 dark:border-slate-600 overflow-hidden shrink-0"><img src={item.image_snapshot || 'https://via.placeholder.com/100'} alt={item.name_snapshot} className="w-full h-full object-cover" /></div>
                                  <div className="flex-1">
                                    <h3 className="font-medium line-clamp-2 dark:text-white">{item.name_snapshot} <span className="text-xs">(Sản phẩm không còn tồn tại)</span></h3>
                                    
                                    {item.type && (
                                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1.5 px-2 py-0.5 bg-slate-100 dark:bg-slate-700 inline-block rounded">
                                            Phân loại: {item.type}
                                        </p>
                                    )}

                                    <p className="text-sm text-slate-500 mt-1">Số lượng: {item.quantity}</p>
                                  </div>
                                </div>
                              )}
                              <div className="text-right">
                                <span className="text-primary font-medium">{formatPrice(item.price_snapshot)}</span>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="border-t border-slate-100 dark:border-slate-700 pt-4 mt-4 flex flex-col sm:flex-row justify-between items-end sm:items-center gap-4">
                          <div className="text-right sm:text-left">
                            <span className="text-sm text-slate-500 mr-2">Thành tiền:</span>
                            <span className="text-xl font-bold text-primary">{formatPrice(order.total_amount)}</span>
                          </div>
                          <div className="flex gap-3">

                            {order.order_status === 'completed' && firstItem?.product_id?._id && (
                              !hasReview ? (
                                <Link
                                  to={`/account/feedback?productId=${firstItem.product_id._id}&orderId=${order._id}`}
                                  className="px-6 py-2 rounded-lg border border-amber-500 text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400 font-medium hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-colors flex items-center gap-1"
                                >
                                  <span className="material-symbols-outlined text-[18px]">star</span>
                                  Đánh giá
                                </Link>
                              ) : !hasReview.is_edited ? (
                                <button
                                  onClick={() => setSelectedReviewItem(firstItem)}
                                  className="px-6 py-2 rounded-lg border border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-500/10 dark:text-blue-400 font-medium hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors flex items-center gap-1"
                                >
                                  <span className="material-symbols-outlined text-[18px]">edit_note</span>
                                  Sửa đánh giá
                                </button>
                              ) : (
                                <button
                                  onClick={() => setSelectedReviewItem(firstItem)}
                                  className="px-6 py-2 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-1"
                                >
                                  <span className="material-symbols-outlined text-[18px]">visibility</span>
                                  Xem đánh giá
                                </button>
                              )
                            )}

                            <Link to={`/account/orders/${order._id}`} className="px-6 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 shadow-lg shadow-primary/20 transition-colors">Xem chi tiết</Link>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="bg-white dark:bg-slate-800 rounded-xl p-12 text-center shadow-sm">
                    <div className="w-24 h-24 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="material-symbols-outlined text-4xl text-slate-400">receipt_long</span>
                    </div>
                    <h3 className="text-lg font-bold dark:text-white">Chưa có đơn hàng nào</h3>
                    <Link to="/products" className="inline-block px-8 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 mt-4 shadow-lg shadow-primary/20">Mua sắm ngay</Link>
                  </div>
                )}
              </div>
            </div>
          </div>
      </div>
    </AccountLayout>
  );
};

export default OrderHistory;