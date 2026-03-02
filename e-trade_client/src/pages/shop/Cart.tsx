import React from 'react';
import { Layout } from '../components/Layout';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useCurrency } from '../../context/CurrencyContext';

const Cart: React.FC = () => {
  const { cart, removeFromCart, updateQuantity, clearCart, cartTotal } = useCart();
  const { formatPrice } = useCurrency();

  if (cart.length === 0) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <div className="text-6xl mb-4">🛒</div>
          <h2 className="text-3xl font-bold mb-4 dark:text-white">Giỏ hàng trống</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-8">Hãy thêm sản phẩm vào giỏ hàng của bạn</p>
          <Link to="/products" className="inline-block bg-primary text-white font-bold py-3 px-8 rounded-xl hover:bg-primary/90">Tiếp tục mua sắm</Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-8 lg:py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 space-y-6">
             <div className="flex items-center justify-between">
               <h2 className="text-3xl font-bold flex items-center gap-3 dark:text-white">
                 Giỏ hàng 
                 <span className="text-sm font-medium bg-primary/10 text-primary px-3 py-1 rounded-full">{cart.length} Sản phẩm</span>
               </h2>
               <button onClick={clearCart} className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
                 <span className="material-symbols-outlined text-sm">delete</span> Xóa tất cả
               </button>
             </div>

             <div className="bg-white dark:bg-slate-900/50 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                   <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-widest font-bold">
                        <tr>
                          <th className="px-6 py-4 min-w-[300px]">Sản phẩm</th>
                          <th className="px-6 py-4">Giá</th>
                          <th className="px-6 py-4">Số lượng</th>
                          <th className="px-6 py-4">Thành tiền</th>
                          <th className="px-6 py-4"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {cart.map((item) => (
                          <tr key={item.productId} className="dark:text-white">
                            <td className="px-6 py-6">
                               <div className="flex items-center gap-4">
                                 <div className="w-20 h-20 rounded-lg bg-slate-100 flex-shrink-0 overflow-hidden">
                                   <img src={item.main_image} alt={item.name} className="w-full h-full object-cover" />
                                 </div>
                                 <div>
                                   <h3 className="font-bold">{item.name}</h3>
                                   <p className="text-xs text-slate-500 mt-1 uppercase">{item.shop_name}</p>
                                 </div>
                               </div>
                            </td>
                            <tdformatPrice
                              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price)}
                            </td>
                            <td className="px-6 py-6">
                              <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg w-max">
                                <button onClick={() => updateQuantity(item.productId, item.quantity - 1)} className="px-3 py-1 hover:bg-slate-100 dark:hover:bg-slate-800">-</button>
                                <span className="px-4 py-1 font-bold">{item.quantity}</span>
                                <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} className="px-3 py-1 hover:bg-slate-100 dark:hover:bg-slate-800">+</button>
                              </div>
                            </td>
                            <td className="px-6 py-6 font-bold">
                              {formatPrice(item.price * item.quantity)}
                            </td>
                            <td className="px-6 py-6">
                              <button onClick={() => removeFromCart(item.productId)} className="text-slate-400 hover:text-red-500 transition-colors">
                                <span className="material-symbols-outlined">delete</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                   </table>
                </div>
             </div>
          </div>
          
          <aside className="w-full lg:w-96">
             <div className="bg-white dark:bg-slate-900/50 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 sticky top-24">
                <h3 className="text-xl font-bold mb-6 dark:text-white">Tóm tắt đơn hàng</h3>
                <div className="space-y-4 text-sm mb-6">
                   <div className="flex justify-between text-slate-500 dark:text-slate-400">
                     <span>Tạm tính</span>
                     <span className="font-bold text-slate-900 dark:text-white">
                       {formatPrice(cartTotal)}
                     </span>
                   </div>
                   <div className="flex justify-between text-slate-500 dark:text-slate-400">
                     <span>Vận chuyển</span>
                     <span className="font-bold text-green-500">Miễn phí</span>
                   </div>
                   <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800">
                     <span className="text-lg font-bold dark:text-white">Tổng</span>
                     <span className="text-2xl font-black text-primary">
                       {formatPrice(cartTotal)}
                     </span>
                   </div>
                </div>
                <Link to="/checkout" className="w-full block bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl text-center shadow-lg shadow-primary/20 transition-all">
                  TIẾN HÀNH THANH TOÁN
                </Link>
             </div>
          </aside>
        </div>
      </div>
    </Layout>
  );
};

export default Cart;