import React from 'react';
import { Layout } from '../../components/Layout';
import { Link } from 'react-router-dom';

const Cart: React.FC = () => {
  return (
    <Layout>
      <div class="max-w-7xl mx-auto px-4 py-8 lg:py-12">
        <div class="flex flex-col lg:flex-row gap-8">
          <div class="flex-1 space-y-6">
             <div class="flex items-center justify-between">
               <h2 class="text-3xl font-bold flex items-center gap-3 dark:text-white">Your Cart <span class="text-sm font-medium bg-primary/10 text-primary px-3 py-1 rounded-full">3 Items</span></h2>
               <button class="text-sm font-medium text-primary hover:underline flex items-center gap-1"><span class="material-symbols-outlined text-sm">delete</span> Clear</button>
             </div>

             <div class="bg-white dark:bg-slate-900/50 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div class="overflow-x-auto">
                   <table class="w-full text-left border-collapse">
                      <thead class="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-widest font-bold">
                        <tr>
                          <th class="px-6 py-4 w-12"><input type="checkbox" class="rounded border-slate-300 text-primary focus:ring-primary" /></th>
                          <th class="px-6 py-4 min-w-[300px]">Product</th>
                          <th class="px-6 py-4">Price</th>
                          <th class="px-6 py-4">Quantity</th>
                          <th class="px-6 py-4">Subtotal</th>
                          <th class="px-6 py-4"></th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                        <tr class="dark:text-white">
                          <td class="px-6 py-6 text-center"><input type="checkbox" checked class="rounded border-slate-300 text-primary focus:ring-primary" /></td>
                          <td class="px-6 py-6">
                             <div class="flex items-center gap-4">
                               <div class="w-20 h-20 rounded-lg bg-slate-100 flex-shrink-0 overflow-hidden">
                                 <img src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&q=80" class="w-full h-full object-cover" />
                               </div>
                               <div>
                                 <h3 class="font-bold">Studio Wireless Headphones</h3>
                                 <p class="text-xs text-slate-500 mt-1 uppercase">Color: Black</p>
                                 <p class="text-xs text-primary font-medium mt-1">In Stock</p>
                               </div>
                             </div>
                          </td>
                          <td class="px-6 py-6 font-medium">$299.00</td>
                          <td class="px-6 py-6">
                            <div class="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg w-max">
                              <button class="px-3 py-1">-</button>
                              <span class="px-4 py-1 font-bold">1</span>
                              <button class="px-3 py-1">+</button>
                            </div>
                          </td>
                          <td class="px-6 py-6 font-bold">$299.00</td>
                          <td class="px-6 py-6"><button class="text-slate-400 hover:text-red-500"><span class="material-symbols-outlined">delete</span></button></td>
                        </tr>
                      </tbody>
                   </table>
                </div>
             </div>
          </div>
          
          <aside class="w-full lg:w-96">
             <div class="bg-white dark:bg-slate-900/50 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 sticky top-24">
                <h3 class="text-xl font-bold mb-6 dark:text-white">Order Summary</h3>
                <div class="space-y-4 text-sm mb-6">
                   <div class="flex justify-between text-slate-500 dark:text-slate-400"><span>Subtotal</span><span class="font-bold text-slate-900 dark:text-white">$719.00</span></div>
                   <div class="flex justify-between text-slate-500 dark:text-slate-400"><span>Shipping</span><span class="font-bold text-green-500">Free</span></div>
                   <div class="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800"><span class="text-lg font-bold dark:text-white">Total</span><span class="text-2xl font-black text-primary">$719.00</span></div>
                </div>
                <Link to="/checkout" class="w-full block bg-primary hover:bg-primary/90 text-white font-black py-4 rounded-xl text-center shadow-lg shadow-primary/20">PROCEED TO CHECKOUT</Link>
             </div>
          </aside>
        </div>
      </div>
    </Layout>
  );
};

export default Cart;