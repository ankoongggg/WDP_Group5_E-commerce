import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { useCart } from '../../context/CartContext';
import { useCurrency } from '../../context/CurrencyContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import axios from 'axios';

const Checkout: React.FC = () => {
  const { cart, cartTotal, clearCart } = useCart();
  const { formatPrice } = useCurrency();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [shippingMethod, setShippingMethod] = useState<'standard' | 'express'>('standard');
  const [paymentMethod, setPaymentMethod] = useState<'credit' | 'cod'>('credit');
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [useCustomAddress, setUseCustomAddress] = useState(false);
  const [customAddress, setCustomAddress] = useState({
    street: '',
    district: '',
    city: ''
  });

  // Lấy địa chỉ default hoặc địa chỉ đầu tiên
  const addresses = user?.addresses || [];
  const defaultAddress = addresses.find((addr: any) => addr.isDefault) || addresses[0];
  
  // Lấy địa chỉ hiện tại dựa vào mode (form hoặc list)
  const getSelectedAddress = () => {
    if (useCustomAddress) {
      return customAddress;
    }
    if (selectedAddressId) {
      return addresses.find((addr: any) => addr._id === selectedAddressId);
    }
    return defaultAddress;
  };
  
  const currentAddress = getSelectedAddress();

  const shippingCost = shippingMethod === 'standard' ? 12000 : 25000; // VND
  const orderTotal = cartTotal + shippingCost;

  const checkStockAndPlaceOrder = async () => {
    if (!currentAddress) {
      addToast('Vui lòng chọn địa chỉ giao hàng', 'error');
      return;
    }

    if (cart.length === 0) {
      addToast('Giỏ hàng trống', 'error');
      return;
    }

    try {
      setIsPlacingOrder(true);

      // Check stock for each product
      for (const item of cart) {
        const response = await axios.get(
          `http://localhost:9999/api/products/${item.productId}`
        );
        const product = response.data.data || response.data;
        
        if (!product.quantity || product.quantity < item.quantity) {
          addToast(
            `Sản phẩm "${item.name}" không còn đủ hàng. Còn lại: ${product.quantity || 0}`,
            'error'
          );
          setIsPlacingOrder(false);
          return;
        }
      }

      // All items in stock - create order
      const orderData = {
        userId: user?._id,
        items: cart.map(item => ({
          productId: item.productId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          main_image: item.main_image,
          store_id: item.store_id,
          shop_name: item.shop_name
        })),
        address: {
          street: currentAddress.street,
          district: currentAddress.district,
          city: currentAddress.city,
          addressId: currentAddress._id
        },
        shippingMethod,
        paymentMethod,
        subtotal: cartTotal,
        shippingCost,
        total: orderTotal,
        status: 'pending',
        createdAt: new Date()
      };

      const orderResponse = await axios.post(
        'http://localhost:9999/api/shop/orders',
        orderData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      clearCart();
      addToast('Đặt hàng thành công!', 'success');
      
      setTimeout(() => {
        navigate('/account/orders', { 
          state: { orderId: orderResponse.data.data?._id } 
        });
      }, 1500);

    } catch (error: any) {
      const message = error.response?.data?.message || 'Không thể đặt hàng. Vui lòng thử lại';
      addToast(message, 'error');
      console.error('Order placement error:', error);
    } finally {
      setIsPlacingOrder(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Delivery Address Section */}
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
                    {user?.full_name || user?.name || 'Khách hàng'} 
                    <span className="font-normal text-slate-500"> | {user?.phone || 'N/A'}</span>
                  </p>
                  <p className="text-slate-600 dark:text-slate-400 mt-1">
                    {currentAddress ? `${currentAddress.street}, ${currentAddress.district}, ${currentAddress.city}` : 'Chưa có địa chỉ'}
                  </p>
                </div>
                {currentAddress?.isDefault && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">Mặc định</span>
                )}
              </div>
            </section>

            {/* Shipping Method Section */}
            <section className="bg-white dark:bg-primary/5 rounded-xl border border-slate-200 dark:border-primary/20 p-6 shadow-sm">
              <h2 className="text-lg font-bold flex items-center gap-2 mb-6 dark:text-white">
                <span className="material-symbols-outlined text-primary">local_shipping</span> Phương thức vận chuyển
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className={`relative flex cursor-pointer rounded-xl border p-4 transition-all ${shippingMethod === 'standard' ? 'border-primary bg-primary/5 ring-2 ring-primary' : 'border-slate-200 dark:border-primary/20'}`}>
                  <input 
                    type="radio" 
                    name="shipping" 
                    value="standard"
                    checked={shippingMethod === 'standard'}
                    onChange={() => setShippingMethod('standard')}
                    className="sr-only" 
                  />
                  <span className="flex flex-1 flex-col">
                    <span className="block text-sm font-bold text-slate-900 dark:text-white">Giao hàng thường</span>
                    <span className="text-xs text-slate-500 mt-1">3-5 ngày làm việc</span>
                  </span>
                  <span className="text-sm font-bold text-primary">{formatPrice(12000)}</span>
                </label>
                <label className={`relative flex cursor-pointer rounded-xl border p-4 transition-all ${shippingMethod === 'express' ? 'border-primary bg-primary/5 ring-2 ring-primary' : 'border-slate-200 dark:border-primary/20'}`}>
                  <input 
                    type="radio" 
                    name="shipping"
                    value="express"
                    checked={shippingMethod === 'express'}
                    onChange={() => setShippingMethod('express')}
                    className="sr-only" 
                  />
                  <span className="flex flex-1 flex-col">
                    <span className="block text-sm font-bold text-slate-900 dark:text-white">Giao hàng nhanh</span>
                    <span className="text-xs text-slate-500 mt-1">1-2 ngày làm việc</span>
                  </span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">{formatPrice(25000)}</span>
                </label>
              </div>
            </section>

            {/* Payment Method Section */}
            <section className="bg-white dark:bg-primary/5 rounded-xl border border-slate-200 dark:border-primary/20 p-6 shadow-sm">
              <h2 className="text-lg font-bold flex items-center gap-2 mb-6 dark:text-white">
                <span className="material-symbols-outlined text-primary">credit_card</span> Phương thức thanh toán
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <label 
                  className={`flex flex-col items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all ${paymentMethod === 'credit' ? 'border-primary bg-primary/5' : 'border-slate-200 dark:border-primary/20'}`}
                >
                  <input 
                    type="radio" 
                    name="payment"
                    value="credit"
                    checked={paymentMethod === 'credit'}
                    onChange={() => setPaymentMethod('credit')}
                    className="sr-only" 
                  />
                  <span className={`material-symbols-outlined ${paymentMethod === 'credit' ? 'text-primary' : 'text-slate-500'}`}>credit_card</span>
                  <span className={`text-xs font-bold mt-2 ${paymentMethod === 'credit' ? 'text-primary dark:text-white' : 'text-slate-500'}`}>Thẻ tín dụng</span>
                </label>
                <label 
                  className={`flex flex-col items-center justify-center p-4 border rounded-xl cursor-pointer transition-all ${paymentMethod === 'cod' ? 'border-primary bg-primary/5' : 'border-slate-200 dark:border-primary/20'}`}
                >
                  <input 
                    type="radio" 
                    name="payment"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                    className="sr-only" 
                  />
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
                    <input id="cardName" type="text" placeholder={user?.full_name || user?.name || 'Tên'} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg" />
                  </div>
                </div>
              )}
            </section>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-4">
            <div className="bg-white dark:bg-primary/5 rounded-xl border border-slate-200 dark:border-primary/20 p-6 shadow-lg sticky top-24">
              <h2 className="text-lg font-bold mb-6 dark:text-white">Tóm tắt đơn hàng</h2>
              
              {/* Cart Items */}
              <div className="space-y-4 mb-6 border-b border-slate-100 dark:border-primary/10 pb-6 max-h-64 overflow-y-auto">
                {cart.map((item) => (
                  <div key={item.productId} className="flex gap-3 text-sm">
                    <img src={item.main_image} alt={item.name} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 dark:text-white truncate">{item.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">x{item.quantity}</p>
                    </div>
                    <p className="font-bold text-slate-900 dark:text-white whitespace-nowrap">{formatPrice(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-4 text-sm border-b border-slate-100 dark:border-primary/10 pb-4 mb-4">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Tạm tính</span>
                  <span className="font-bold text-slate-900 dark:text-white">{formatPrice(cartTotal)}</span>
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
                  <>
                    <span className="material-symbols-outlined animate-spin">loop</span> Đang xử lý...
                  </>
                ) : (
                  <>
                    Đặt hàng <span className="material-symbols-outlined">arrow_forward</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Address Selection Modal */}
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
                {/* Show saved addresses list */}
                {addresses.length > 0 ? (
                  <div className="space-y-3 mb-6">
                    {addresses.map((addr: any) => (
                      <label 
                        key={addr._id}
                        className={`relative flex cursor-pointer rounded-xl border-2 p-4 transition-all ${
                          selectedAddressId === addr._id || (!selectedAddressId && addr.isDefault)
                            ? 'border-primary bg-primary/5'
                            : 'border-slate-200 dark:border-slate-700 hover:border-primary/50'
                        }`}
                      >
                        <input 
                          type="radio"
                          name="address"
                          checked={selectedAddressId === addr._id || (!selectedAddressId && addr.isDefault)}
                          onChange={() => setSelectedAddressId(addr._id)}
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
                        {addr.isDefault && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">Mặc định</span>
                        )}
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-600 dark:text-slate-400 text-center py-8 mb-6">Chưa có địa chỉ nào</p>
                )}

                {/* Button to add custom address */}
                <button
                  onClick={() => setShowAddressForm(true)}
                  className="w-full px-4 py-3 border-2 border-dashed border-primary text-primary rounded-xl font-bold hover:bg-primary/5 transition-all mb-6"
                >
                  <span className="material-symbols-outlined align-middle">add_location</span> Nhập địa chỉ khác
                </button>
              </>
            ) : (
              <>
                {/* Form to enter custom address */}
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

            {/* Action buttons */}
            <div className="flex gap-3 mt-6 border-t border-slate-200 dark:border-slate-700 pt-6">
              <button 
                onClick={() => {
                  setShowAddressModal(false);
                  setShowAddressForm(false);
                }}
                className="flex-1 px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl font-bold dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                Hủy
              </button>
              <button 
                onClick={() => {
                  if (showAddressForm) {
                    if (!customAddress.street || !customAddress.district || !customAddress.city) {
                      addToast('Vui lòng nhập đầy đủ thông tin địa chỉ', 'error');
                      return;
                    }
                  }
                  setShowAddressModal(false);
                  setShowAddressForm(false);
                  addToast('Đã cập nhật địa chỉ giao hàng', 'success');
                }}
                className="flex-1 px-4 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Checkout;