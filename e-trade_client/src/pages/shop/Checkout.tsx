import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Layout } from '../components/Layout';
import { useCart } from '../../context/CartContext';
import { useCurrency } from '../../context/CurrencyContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const Checkout: React.FC = () => {
  const { cart, cartTotal, clearCart } = useCart();
  const { formatPrice } = useCurrency();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const [shippingMethod, setShippingMethod] = useState<'standard' | 'express'>('standard');
  const [paymentMethod, setPaymentMethod] = useState<'credit' | 'cod'>('credit');
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [useCustomAddress, setUseCustomAddress] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [customAddress, setCustomAddress] = useState({
    street: '',
    district: '',
    city: ''
  });

  const buyNowItems = location.state?.buyNowItems;
  const isBuyNowMode = !!buyNowItems;
  
  const displayItems = isBuyNowMode ? buyNowItems : cart;
  const displayTotal = isBuyNowMode 
    ? buyNowItems.reduce((total: number, item: any) => total + (item.price * item.quantity), 0) 
    : cartTotal;

  const addresses = user?.addresses || [];
  const defaultAddress = addresses.find((addr: any) => addr.is_default || addr.isDefault) || addresses[0];
  
  const getSelectedAddress = () => {
    if (useCustomAddress) return customAddress;
    if (selectedAddressId) return addresses.find((addr: any) => addr._id === selectedAddressId);
    return defaultAddress;
  };
  
  const currentAddress = getSelectedAddress();

  const shippingCost = shippingMethod === 'standard' ? 12000 : 25000;
  const orderTotal = displayTotal + shippingCost; 

  const checkStockAndPlaceOrder = async () => {
    if (!currentAddress) {
      toast.error('Vui lòng chọn địa chỉ giao hàng');
      return;
    }

    if (!displayItems || displayItems.length === 0) {
      toast.error('Không có sản phẩm để thanh toán');
      return;
    }

    try {
      setIsPlacingOrder(true);

      const orderData = {
        items: displayItems.map((item: any) => {
          let pId = item.productId || item._id || item.product_id; 
          
          // --- CHỐNG LỖI MONGODB: CẮT BỎ CÁI ĐUÔI PHÂN LOẠI ĐI ---
          if (typeof pId === 'string' && pId.includes('-')) {
              pId = pId.split('-')[0]; // Chỉ lấy đúng mã ID 24 ký tự ở đằng trước
          }
          // --------------------------------------------------------

          // --- LOGIC MOI PHÂN LOẠI SIÊU CẤP (BẮT MỌI TRƯỜNG HỢP) ---
          let itemType = 'default';
          if (item.type && item.type !== 'default') {
              itemType = item.type;
          } else if (item.variant?.description) {
              itemType = item.variant.description;
          } else if (item._id && typeof item._id === 'string' && item._id.includes('-')) {
              itemType = item._id.split('-').slice(1).join('-');
          } else if (item.name && item.name.includes('(') && item.name.endsWith(')')) {
              const match = item.name.match(/\(([^)]+)\)$/);
              if (match) itemType = match[1].trim();
          }
          // --------------------------------------------------------

          return {
            productId: pId, 
            product_id: pId,  
            quantity: item.quantity,
            type: itemType // TRUYỀN TYPE LÊN CHUẨN ĐÉT
          };
        }),
        
        shipping_address: { 
            recipient_name: user?.full_name || user?.account_name || 'Khách hàng',
            phone: user?.phone || '',
            full_address: `${currentAddress.street}, ${currentAddress.district}, ${currentAddress.city}`
        },
        shippingMethod,
        paymentMethod,
        shippingCost,
      };

      console.log('SENDING ORDER DATA:', orderData);

      const token = localStorage.getItem('accessToken');
      
      const orderResponse = await axios.post('http://localhost:9999/api/shop/orders', orderData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const isSplit = orderResponse.data?.data?.isSplit;
      if (isSplit) {
          toast.success('Đơn hàng đã được tách theo từng Shop!');
      } else {
          toast.success('Đặt hàng thành công!');
      }

      setIsRedirecting(true); 

      setTimeout(() => {
        if (!isBuyNowMode) {
          clearCart();
        }
        navigate(`/account/orders`); 
      }, 1200);

    } catch (error: any) {
      const message = error.response?.data?.message || 'Không thể đặt hàng. Vui lòng thử lại';
      toast.error(message);
      console.error("CHI TIẾT LỖI TẠO ĐƠN: ", error.response?.data);
      setIsPlacingOrder(false); 
    }
  };

  if (isRedirecting) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-screen text-center">
          <div>
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-3xl font-bold mb-2 dark:text-white">Đặt hàng thành công!</h2>
            <p className="text-slate-600 dark:text-slate-400">Đang chuyển bạn đến trang quản lý đơn hàng...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!isBuyNowMode && cart.length === 0) {
    return (
        <Layout>
            <div className="flex justify-center items-center h-screen text-center">
            <div>
                <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">remove_shopping_cart</span>
                <h2 className="text-2xl font-bold mb-2 dark:text-white">Chưa có gì để thanh toán</h2>
                <button onClick={() => navigate('/')} className="text-primary hover:underline mt-2">Quay lại mua sắm</button>
            </div>
            </div>
        </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8">
            <section className="bg-white dark:bg-primary/5 rounded-xl border border-slate-200 dark:border-primary/20 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold flex items-center gap-2 dark:text-white">
                  <span className="material-symbols-outlined text-primary">location_on</span> Địa chỉ giao hàng
                </h2>
                <button onClick={() => setShowAddressModal(true)} className="text-primary text-sm font-semibold hover:underline">Thay đổi</button>
              </div>
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold dark:text-white">
                    {user?.full_name || user?.account_name || 'Khách hàng'} 
                    <span className="font-normal text-slate-500"> | {user?.phone || 'Chưa cập nhật SĐT'}</span>
                  </p>
                  <p className="text-slate-600 dark:text-slate-400 mt-1">
                    {currentAddress ? `${currentAddress.street}, ${currentAddress.district}, ${currentAddress.city}` : 'Chưa có địa chỉ'}
                  </p>
                </div>
                {(currentAddress?.is_default || currentAddress?.isDefault) && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">Mặc định</span>
                )}
              </div>
            </section>

            <section className="bg-white dark:bg-primary/5 rounded-xl border border-slate-200 dark:border-primary/20 p-6 shadow-sm mt-6">
              <h2 className="text-lg font-bold flex items-center gap-2 mb-6 dark:text-white">
                <span className="material-symbols-outlined text-primary">local_shipping</span> Phương thức vận chuyển
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className={`relative flex cursor-pointer rounded-xl border p-4 transition-all ${shippingMethod === 'standard' ? 'border-primary bg-primary/5 ring-2 ring-primary' : 'border-slate-200 dark:border-primary/20'}`}>
                  <input type="radio" name="shipping" value="standard" checked={shippingMethod === 'standard'} onChange={() => setShippingMethod('standard')} className="sr-only" />
                  <span className="flex flex-1 flex-col">
                    <span className="block text-sm font-bold text-slate-900 dark:text-white">Giao hàng thường</span>
                    <span className="text-xs text-slate-500 mt-1">3-5 ngày làm việc</span>
                  </span>
                  <span className="text-sm font-bold text-primary">{formatPrice(12000)}</span>
                </label>
                <label className={`relative flex cursor-pointer rounded-xl border p-4 transition-all ${shippingMethod === 'express' ? 'border-primary bg-primary/5 ring-2 ring-primary' : 'border-slate-200 dark:border-primary/20'}`}>
                  <input type="radio" name="shipping" value="express" checked={shippingMethod === 'express'} onChange={() => setShippingMethod('express')} className="sr-only" />
                  <span className="flex flex-1 flex-col">
                    <span className="block text-sm font-bold text-slate-900 dark:text-white">Giao hàng nhanh</span>
                    <span className="text-xs text-slate-500 mt-1">1-2 ngày làm việc</span>
                  </span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">{formatPrice(25000)}</span>
                </label>
              </div>
            </section>

            <section className="bg-white dark:bg-primary/5 rounded-xl border border-slate-200 dark:border-primary/20 p-6 shadow-sm mt-6">
              <h2 className="text-lg font-bold flex items-center gap-2 mb-6 dark:text-white">
                <span className="material-symbols-outlined text-primary">credit_card</span> Phương thức thanh toán
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <label className={`flex flex-col items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all ${paymentMethod === 'credit' ? 'border-primary bg-primary/5' : 'border-slate-200 dark:border-primary/20'}`}>
                  <input type="radio" name="payment" value="credit" checked={paymentMethod === 'credit'} onChange={() => setPaymentMethod('credit')} className="sr-only" />
                  <span className={`material-symbols-outlined ${paymentMethod === 'credit' ? 'text-primary' : 'text-slate-500'}`}>credit_card</span>
                  <span className={`text-xs font-bold mt-2 ${paymentMethod === 'credit' ? 'text-primary dark:text-white' : 'text-slate-500'}`}>Thẻ tín dụng</span>
                </label>
                <label className={`flex flex-col items-center justify-center p-4 border rounded-xl cursor-pointer transition-all ${paymentMethod === 'cod' ? 'border-primary bg-primary/5' : 'border-slate-200 dark:border-primary/20'}`}>
                  <input type="radio" name="payment" value="cod" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} className="sr-only" />
                  <span className={`material-symbols-outlined ${paymentMethod === 'cod' ? 'text-primary' : 'text-slate-500'}`}>payments</span>
                  <span className={`text-xs font-bold mt-2 ${paymentMethod === 'cod' ? 'text-primary dark:text-white' : 'text-slate-500'}`}>Thanh toán khi nhận</span>
                </label>
              </div>
              
              {paymentMethod === 'credit' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="cardNumber" className="block text-xs font-bold text-slate-500 uppercase mb-1">Số thẻ</label>
                    <input id="cardNumber" type="text" placeholder="0000 0000 0000 0000" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg" />
                  </div>
                  <div>
                    <label htmlFor="cardName" className="block text-xs font-bold text-slate-500 uppercase mb-1">Tên chủ thẻ</label>
                    <input id="cardName" type="text" placeholder={user?.full_name || user?.account_name || 'Tên'} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg" />
                  </div>
                </div>
              )}
            </section>
          </div>

          <div className="lg:col-span-4">
            <div className="bg-white dark:bg-primary/5 rounded-xl border border-slate-200 dark:border-primary/20 p-6 shadow-lg sticky top-24">
              <h2 className="text-lg font-bold mb-6 dark:text-white">Tóm tắt đơn hàng</h2>
              
              <div className="space-y-4 mb-6 border-b border-slate-100 dark:border-primary/10 pb-6 max-h-64 overflow-y-auto">
                {displayItems.map((item: any) => (
                  <div key={item.productId || item._id} className="flex gap-3 text-sm">
                    <img src={item.main_image} alt={item.name} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 dark:text-white truncate">{item.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">x{item.quantity}</p>
                    </div>
                    <p className="font-bold text-slate-900 dark:text-white whitespace-nowrap">{formatPrice(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-4 text-sm border-b border-slate-100 dark:border-primary/10 pb-4 mb-4">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Tạm tính</span>
                  <span className="font-bold text-slate-900 dark:text-white">{formatPrice(displayTotal)}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Vận chuyển</span>
                  <span className="font-bold text-slate-900 dark:text-white">{formatPrice(shippingCost)}</span>
                </div>
              </div>
              
              <div className="flex justify-between items-end mb-8">
                <span className="text-base font-bold dark:text-white">Tổng cộng</span>
                <span className="text-2xl font-black text-primary">{formatPrice(orderTotal)}</span>
              </div>
              
              <button 
                onClick={checkStockAndPlaceOrder}
                disabled={isPlacingOrder}
                className={`w-full text-white py-4 rounded-xl font-bold text-lg shadow-xl shadow-primary/20 flex items-center justify-center gap-2 transition-all ${
                  isPlacingOrder 
                    ? 'bg-slate-400 cursor-not-allowed' 
                    : 'bg-primary hover:bg-primary/90'
                }`}
              >
                {isPlacingOrder ? (
                  <><span className="material-symbols-outlined animate-spin">loop</span> Đang xử lý...</>
                ) : (
                  <>Đặt hàng <span className="material-symbols-outlined">arrow_forward</span></>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showAddressModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold dark:text-white">Chọn địa chỉ giao hàng</h3>
              <button 
                onClick={() => {
                  setShowAddressModal(false);
                  setShowAddressForm(false);
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>
            </div>

            {showAddressForm === false ? (
              <>
                <div className="space-y-3 mb-6">
                  {addresses.map((addr: any) => (
                    <label 
                      key={addr._id}
                      className={`relative flex cursor-pointer rounded-xl border-2 p-4 transition-all ${
                        selectedAddressId === addr._id || (!selectedAddressId && (addr.is_default || addr.isDefault))
                          ? 'border-primary bg-primary/5'
                          : 'border-slate-200 dark:border-slate-700 hover:border-primary/50'
                      }`}
                    >
                      <input 
                        type="radio"
                        name="address"
                        checked={selectedAddressId === addr._id || (!selectedAddressId && (addr.is_default || addr.isDefault))}
                        onChange={() => {
                          setSelectedAddressId(addr._id);
                          setUseCustomAddress(false);
                        }}
                        className="sr-only"
                      />
                      <div className="flex-1">
                        <p className="font-bold text-slate-900 dark:text-white">
                          {addr.street}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                          {addr.district}, {addr.city}
                        </p>
                      </div>
                      {(addr.is_default || addr.isDefault) && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">Mặc định</span>
                      )}
                    </label>
                  ))}
                </div>

                <button
                  onClick={() => setShowAddressForm(true)}
                  className="w-full px-4 py-3 border-2 border-dashed border-primary text-primary rounded-xl font-bold hover:bg-primary/5 transition-all mb-6"
                >
                  <span className="material-symbols-outlined align-middle">add_location</span> Thêm địa chỉ mới
                </button>
              </>
            ) : (
              <>
                <div className="space-y-4 mb-6">
                  <div>
                    <label htmlFor="street" className="block text-sm font-bold text-slate-700 dark:text-white mb-2">Đường/Số nhà</label>
                    <input
                      id="street"
                      type="text"
                      placeholder="VD: 123 Đường Nguyễn Huệ"
                      value={customAddress.street}
                      onChange={(e) => setCustomAddress({ ...customAddress, street: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white"
                    />
                  </div>

                  <div>
                    <label htmlFor="district" className="block text-sm font-bold text-slate-700 dark:text-white mb-2">Quận/Huyện</label>
                    <input
                      id="district"
                      type="text"
                      placeholder="VD: Quận 1"
                      value={customAddress.district}
                      onChange={(e) => setCustomAddress({ ...customAddress, district: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white"
                    />
                  </div>

                  <div>
                    <label htmlFor="city" className="block text-sm font-bold text-slate-700 dark:text-white mb-2">Thành phố/Tỉnh</label>
                    <input
                      id="city"
                      type="text"
                      placeholder="VD: TP. Hồ Chí Minh"
                      value={customAddress.city}
                      onChange={(e) => setCustomAddress({ ...customAddress, city: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white"
                    />
                  </div>
                </div>

                <button
                  onClick={() => setShowAddressForm(false)}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all mb-6"
                >
                  Quay lại danh sách
                </button>
              </>
            )}

            <div className="flex gap-3 mt-6 border-t border-slate-200 dark:border-slate-700 pt-6">
              <button 
                onClick={() => {
                  setShowAddressModal(false);
                  setShowAddressForm(false);
                }}
                disabled={isSavingAddress}
                className="flex-1 px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl font-bold dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all disabled:opacity-50"
              >
                Hủy
              </button>
              
              <button 
                onClick={async () => {
                  if (showAddressForm) {
                    if (!customAddress.street || !customAddress.district || !customAddress.city) {
                      toast.error('Vui lòng nhập đầy đủ thông tin địa chỉ');
                      return;
                    }
                    
                    setIsSavingAddress(true);
                    try {
                      const newAddressObj = {
                        street: customAddress.street,
                        district: customAddress.district,
                        city: customAddress.city,
                        is_default: addresses.length === 0, 
                        recipient_name: user?.full_name || user?.account_name || 'Khách hàng',
                        phone: user?.phone || ''
                      };

                      const token = localStorage.getItem('accessToken');
                      const updatedAddresses = [...addresses, newAddressObj];

                      await axios.put('http://localhost:9999/api/users/me', 
                        { addresses: updatedAddresses },
                        { headers: { Authorization: `Bearer ${token}` } }
                      );

                      toast.success('Đã lưu địa chỉ mới vào hồ sơ!');
                      setUseCustomAddress(true);
                      setShowAddressModal(false);
                      setShowAddressForm(false);
                    } catch (error) {
                      console.error("Lỗi lưu địa chỉ:", error);
                      toast.error('Không thể lưu vào DB nhưng vẫn dùng cho đơn này được.');
                      setUseCustomAddress(true);
                      setShowAddressModal(false);
                      setShowAddressForm(false);
                    } finally {
                      setIsSavingAddress(false);
                    }

                  } else {
                    setUseCustomAddress(false);
                    setShowAddressModal(false);
                    setShowAddressForm(false);
                    toast.success('Đã chọn địa chỉ giao hàng');
                  }
                }}
                disabled={isSavingAddress}
                className="flex-1 px-4 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all flex justify-center items-center gap-2 disabled:bg-slate-400"
              >
                {isSavingAddress ? <span className="material-symbols-outlined animate-spin">sync</span> : null}
                {isSavingAddress ? 'Đang lưu...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Checkout;