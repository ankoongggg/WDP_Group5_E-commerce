import React from 'react';
import { Layout } from '../components/Layout';

const Checkout: React.FC = () => {
  return (
    <Layout>
       <div class="max-w-7xl mx-auto px-4 py-8">
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
             <div class="lg:col-span-8 space-y-6">
                <section class="bg-white dark:bg-primary/5 rounded-xl border border-slate-200 dark:border-primary/20 p-6 shadow-sm">
                   <div class="flex items-center justify-between mb-4">
                      <h2 class="text-lg font-bold flex items-center gap-2 dark:text-white"><span class="material-symbols-outlined text-primary">location_on</span> Delivery Address</h2>
                      <button class="text-primary text-sm font-semibold">Change</button>
                   </div>
                   <div class="flex justify-between items-start">
                     <div>
                        <p class="font-bold dark:text-white">Alex Johnson <span class="font-normal text-slate-500">| (+1) 234-567-890</span></p>
                        <p class="text-slate-600 dark:text-slate-400 mt-1">123 Innovation Drive, Tech District, Silicon Valley, CA</p>
                     </div>
                     <span class="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">Default</span>
                   </div>
                </section>

                <section class="bg-white dark:bg-primary/5 rounded-xl border border-slate-200 dark:border-primary/20 p-6 shadow-sm">
                   <h2 class="text-lg font-bold flex items-center gap-2 mb-6 dark:text-white"><span class="material-symbols-outlined text-primary">local_shipping</span> Shipping Method</h2>
                   <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <label class="relative flex cursor-pointer rounded-xl border border-primary bg-primary/5 p-4 ring-2 ring-primary">
                         <input type="radio" name="shipping" class="sr-only" checked />
                         <span class="flex flex-1 flex-col">
                            <span class="block text-sm font-bold text-slate-900 dark:text-white">Standard Delivery</span>
                            <span class="text-xs text-slate-500 mt-1">Arriving Oct 24-26</span>
                         </span>
                         <span class="text-sm font-bold text-primary">$12.00</span>
                      </label>
                      <label class="relative flex cursor-pointer rounded-xl border border-slate-200 dark:border-primary/20 p-4">
                         <input type="radio" name="shipping" class="sr-only" />
                         <span class="flex flex-1 flex-col">
                            <span class="block text-sm font-bold text-slate-900 dark:text-white">Express Delivery</span>
                            <span class="text-xs text-slate-500 mt-1">Arriving Oct 21-22</span>
                         </span>
                         <span class="text-sm font-bold text-slate-900 dark:text-white">$25.00</span>
                      </label>
                   </div>
                </section>

                <section class="bg-white dark:bg-primary/5 rounded-xl border border-slate-200 dark:border-primary/20 p-6 shadow-sm">
                   <h2 class="text-lg font-bold flex items-center gap-2 mb-6 dark:text-white"><span class="material-symbols-outlined text-primary">credit_card</span> Payment Method</h2>
                   <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                      <div class="flex flex-col items-center justify-center p-4 border-2 border-primary rounded-xl bg-primary/5 cursor-pointer">
                         <span class="material-symbols-outlined text-primary">credit_card</span>
                         <span class="text-xs font-bold mt-2 dark:text-white">Credit Card</span>
                      </div>
                      <div class="flex flex-col items-center justify-center p-4 border border-slate-200 dark:border-primary/20 rounded-xl cursor-pointer">
                         <span class="material-symbols-outlined text-slate-500">payments</span>
                         <span class="text-xs font-bold mt-2 text-slate-500">Cash (COD)</span>
                      </div>
                   </div>
                   
                   <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                         <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Card Number</label>
                         <input type="text" placeholder="0000 0000 0000 0000" class="w-full bg-slate-50 dark:bg-background-dark border-slate-200 dark:border-primary/20 rounded-lg" />
                      </div>
                      <div>
                         <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Card Holder</label>
                         <input type="text" placeholder="Alex Johnson" class="w-full bg-slate-50 dark:bg-background-dark border-slate-200 dark:border-primary/20 rounded-lg" />
                      </div>
                   </div>
                </section>
             </div>

             <div class="lg:col-span-4">
                <div class="bg-white dark:bg-primary/5 rounded-xl border border-slate-200 dark:border-primary/20 p-6 shadow-lg sticky top-24">
                   <h2 class="text-lg font-bold mb-6 dark:text-white">Order Summary</h2>
                   <div class="flex gap-2 mb-6">
                      <input type="text" placeholder="Promo code" class="flex-1 bg-slate-50 dark:bg-background-dark border-slate-200 dark:border-primary/20 rounded-lg text-sm" />
                      <button class="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold">Apply</button>
                   </div>
                   <div class="space-y-4 text-sm border-b border-slate-100 dark:border-primary/10 pb-4 mb-4">
                      <div class="flex justify-between text-slate-600 dark:text-slate-400"><span>Subtotal</span><span>$448.00</span></div>
                      <div class="flex justify-between text-slate-600 dark:text-slate-400"><span>Shipping</span><span>$12.00</span></div>
                      <div class="flex justify-between text-primary font-medium"><span>Discount</span><span>-$45.00</span></div>
                   </div>
                   <div class="flex justify-between items-end mb-8">
                      <span class="text-base font-bold dark:text-white">Total Amount</span>
                      <span class="text-2xl font-black text-primary">$456.50</span>
                   </div>
                   <button class="w-full bg-primary hover:bg-primary/90 text-white py-4 rounded-xl font-bold text-lg shadow-xl shadow-primary/20 flex items-center justify-center gap-2">Place Order <span class="material-symbols-outlined">arrow_forward</span></button>
                </div>
             </div>
          </div>
       </div>
    </Layout>
  );
};

export default Checkout;