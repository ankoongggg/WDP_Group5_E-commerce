import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { useCurrency } from '@/src/context/CurrencyContext';
interface CartItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  image: string;
  type?: string;
  storeId?: string;
  storeName?: string;
}

const Cart: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const { formatPrice } = useCurrency();
  // Load cart from localStorage on mount
  useEffect(() => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    setCartItems(cart);
    // Select all by default
    setSelectedItems(new Set(cart.map((_, idx) => idx.toString())));
  }, []);

  // Calculate totals
  const selectedCartItems = cartItems.filter((_, idx) => selectedItems.has(idx.toString()));
  const subtotal = selectedCartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shippingFee = 0; // Free shipping on cart page
  const total = subtotal + shippingFee;
  const totalItems = cartItems.length;
  const selectedCount = selectedItems.size;

  // Toggle item selection
  const toggleItemSelection = (idx: number) => {
    const newSelected = new Set(selectedItems);
    const key = idx.toString();
    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.add(key);
    }
    setSelectedItems(newSelected);
  };

  // Toggle select all
  const toggleSelectAll = () => {
    if (selectedItems.size === cartItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(cartItems.map((_, idx) => idx.toString())));
    }
  };

  // Update quantity
  const updateQuantity = (idx: number, newQty: number) => {
    const updated = [...cartItems];
    if (newQty <= 0) {
      removeItem(idx);
    } else {
      updated[idx].quantity = newQty;
      setCartItems(updated);
      localStorage.setItem('cart', JSON.stringify(updated));
    }
  };

  // Remove item
  const removeItem = (idx: number) => {
    const updated = cartItems.filter((_, i) => i !== idx);
    setCartItems(updated);
    localStorage.setItem('cart', JSON.stringify(updated));
    
    // Also update selected items
    const newSelected = new Set(selectedItems);
    newSelected.delete(idx.toString());
    setSelectedItems(newSelected);
    
    toast.success('Item removed');
  };

  // Clear all
  const clearCart = () => {
    if (window.confirm('Clear all items from cart?')) {
      setCartItems([]);
      setSelectedItems(new Set());
      localStorage.removeItem('cart');
      toast.success('Cart cleared');
    }
  };

  // Proceed to checkout with selected items
  const handleCheckout = () => {
    if (selectedCount === 0) {
      toast.error('Please select items to checkout');
      return;
    }
    
    // Save selected items to localStorage (Overwrite cart logic as requested to revert)
    const checkoutItems = selectedCartItems;
    localStorage.setItem('cart', JSON.stringify(checkoutItems));
    navigate('/checkout');
  };

  if (cartItems.length === 0) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 py-12 text-center">
          <span className="material-symbols-outlined text-6xl text-slate-300 block mb-4">shopping_cart</span>
          <h2 className="text-2xl font-bold mb-2 dark:text-white">Your cart is empty</h2>
          <p className="text-slate-500 mb-6">Add some products to get started</p>
          <Link 
            to="/products" 
            className="inline-block bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-lg font-bold"
          >
            Continue Shopping
          </Link>
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
                Your Cart 
                <span className="text-sm font-medium bg-primary/10 text-primary px-3 py-1 rounded-full">
                  {totalItems} Items
                </span>
              </h2>
              {cartItems.length > 0 && (
                <button 
                  onClick={clearCart}
                  className="text-sm font-medium text-red-500 hover:underline flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">delete</span> Clear
                </button>
              )}
            </div>

            <div className="bg-white dark:bg-slate-900/50 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-widest font-bold">
                    <tr>
                      <th className="px-6 py-4 w-12">
                        <input 
                          type="checkbox" 
                          checked={selectedItems.size === cartItems.length && cartItems.length > 0}
                          onChange={toggleSelectAll}
                          className="rounded border-slate-300 text-primary focus:ring-primary cursor-pointer"
                        />
                      </th>
                      <th className="px-6 py-4 min-w-[300px]">Product</th>
                      <th className="px-6 py-4">Price</th>
                      <th className="px-6 py-4">Quantity</th>
                      <th className="px-6 py-4">Subtotal</th>
                      <th className="px-6 py-4"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {cartItems.map((item, idx) => (
                      <tr key={idx} className="dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800/30">
                        <td className="px-6 py-6 text-center">
                          <input 
                            type="checkbox" 
                            checked={selectedItems.has(idx.toString())}
                            onChange={() => toggleItemSelection(idx)}
                            className="rounded border-slate-300 text-primary focus:ring-primary cursor-pointer"
                          />
                        </td>
                        <td className="px-6 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-20 h-20 rounded-lg bg-slate-100 dark:bg-slate-700 flex-shrink-0 overflow-hidden">
                              <img 
                                src={item.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&q=80'} 
                                alt={item.productName}
                                className="w-full h-full object-cover" 
                              />
                            </div>
                            <div>
                              <h3 className="font-bold hover:text-primary cursor-pointer">
                                <Link to={`/products/${item.productId}`}>{item.productName}</Link>
                              </h3>
                              {item.type && <p className="text-xs text-slate-500 mt-1 uppercase">Type: {item.type}</p>}
                              <p className="text-xs text-primary font-medium mt-1">In Stock</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-6 font-medium">{formatPrice(item.price)}</td>
                        <td className="px-6 py-6">
                          <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg w-max">
                            <button 
                              onClick={() => updateQuantity(idx, item.quantity - 1)}
                              className="px-3 py-1 hover:bg-slate-100 dark:hover:bg-slate-700"
                            >
                              −
                            </button>
                            <span className="px-4 py-1 font-bold min-w-12 text-center">{item.quantity}</span>
                            <button 
                              onClick={() => updateQuantity(idx, item.quantity + 1)}
                              className="px-3 py-1 hover:bg-slate-100 dark:hover:bg-slate-700"
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-6 font-bold">{formatPrice(item.price * item.quantity)}</td>
                        <td className="px-6 py-6">
                          <button 
                            onClick={() => removeItem(idx)}
                            className="text-slate-400 hover:text-red-500 transition-colors"
                          >
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

          {/* Order Summary Sidebar */}
          <aside className="w-full lg:w-96">
            <div className="bg-white dark:bg-slate-900/50 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 sticky top-24">
              <h3 className="text-xl font-bold mb-6 dark:text-white">Order Summary</h3>
              
              <div className="space-y-4 text-sm mb-6">
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>Subtotal ({selectedCount} items)</span>
                  <span className="font-bold text-slate-900 dark:text-white">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>Shipping</span>
                  <span className="font-bold text-green-500">Free</span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800 mb-6">
                <span className="text-lg font-bold dark:text-white">Total</span>
                <span className="text-2xl font-black text-primary">{formatPrice(total)}</span>
              </div>

              <button 
                onClick={handleCheckout}
                className="w-full bg-primary hover:bg-primary/90 disabled:bg-slate-400 text-white font-black py-4 rounded-xl text-center shadow-lg shadow-primary/20 transition-all disabled:cursor-not-allowed"
                disabled={selectedCount === 0}
              >
                PROCEED TO CHECKOUT
              </button>

              {selectedCount === 0 && (
                <p className="text-xs text-slate-500 text-center mt-3">Select items to proceed</p>
              )}

              <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                <p className="text-xs text-slate-500 text-center mb-3">✓ Free shipping on orders over $100</p>
                <p className="text-xs text-slate-500 text-center">✓ 30-day return policy</p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </Layout>
  );
};

export default Cart;