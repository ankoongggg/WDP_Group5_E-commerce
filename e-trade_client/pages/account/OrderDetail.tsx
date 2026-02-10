import React from 'react';
import { Link } from 'react-router-dom';

const OrderDetail: React.FC = () => {
  return (
    <div class="min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100">
       <div class="max-w-6xl mx-auto px-4 py-8">
          <nav class="flex items-center justify-between mb-8">
             <div class="flex flex-col gap-1">
                <div class="flex items-center gap-2 text-primary text-sm font-semibold mb-2">
                   <span class="material-symbols-outlined text-sm">arrow_back</span>
                   <Link to="/account/orders" class="hover:underline">Back to Orders</Link>
                </div>
                <h1 class="text-3xl font-black tracking-tight">Order #ORD-2023-882190</h1>
             </div>
             <button class="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-sm">
                <span class="material-symbols-outlined text-lg">download</span> Invoice
             </button>
          </nav>

          <div class="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-8 mb-8">
             <div class="relative flex justify-between">
                <div class="absolute top-5 left-0 w-full h-1 bg-slate-100 dark:bg-slate-700 -z-0"><div class="h-full bg-primary w-2/3"></div></div>
                {["Order Placed", "Processing", "In Transit", "Delivered"].map((step, i) => (
                  <div key={i} class="relative z-10 flex flex-col items-center text-center max-w-[120px]">
                     <div class={`size-10 rounded-full ${i < 3 ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'} flex items-center justify-center mb-3 ring-4 ring-white dark:ring-slate-800`}>
                        <span class="material-symbols-outlined">{['check_circle','settings','local_shipping','package_2'][i]}</span>
                     </div>
                     <p class={`font-bold text-sm ${i === 3 ? 'text-slate-400' : ''}`}>{step}</p>
                  </div>
                ))}
             </div>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
             <div class="lg:col-span-2 space-y-8">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div class="bg-white dark:bg-slate-800/50 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                      <div class="flex items-center gap-2 mb-4 text-primary"><span class="material-symbols-outlined">location_on</span><h3 class="font-bold uppercase tracking-wider text-xs">Shipping Address</h3></div>
                      <p class="font-bold mb-1">John Doe</p>
                      <p class="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">123 Maple Avenue, Springfield<br/>IL 62704, United States</p>
                   </div>
                   <div class="bg-white dark:bg-slate-800/50 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                      <div class="flex items-center gap-2 mb-4 text-primary"><span class="material-symbols-outlined">credit_card</span><h3 class="font-bold uppercase tracking-wider text-xs">Payment</h3></div>
                      <div class="flex items-center gap-3 mb-4"><span class="text-xs font-bold italic bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">VISA</span><p class="text-sm font-medium">Visa ending in 4242</p></div>
                   </div>
                </div>

                <div class="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                   <div class="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center"><h3 class="font-bold text-lg">Order Items (1)</h3></div>
                   <div class="p-6 flex gap-6">
                      <div class="size-24 bg-slate-100 rounded-lg overflow-hidden shrink-0"><img src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&q=80" class="w-full h-full object-cover" /></div>
                      <div class="flex-1 flex flex-col justify-between">
                         <div><h4 class="font-bold">Nike Air Max Velocity</h4><p class="text-xs text-slate-500 mt-1 uppercase tracking-wider font-semibold">Variant: Red / 10.5 US</p></div>
                         <div class="flex justify-between items-end mt-4"><div class="text-sm"><span class="text-slate-400">Qty:</span><span class="font-bold ml-1">1</span></div><p class="font-black text-lg">$145.00</p></div>
                      </div>
                   </div>
                </div>
             </div>
             
             <div class="bg-white dark:bg-slate-800/50 p-6 rounded-xl border border-slate-200 dark:border-slate-700 h-fit">
                <h3 class="font-bold text-lg mb-6 pb-4 border-b border-slate-100 dark:border-slate-700">Order Summary</h3>
                <div class="space-y-4 mb-6 text-sm">
                   <div class="flex justify-between text-slate-500"><span>Subtotal</span><span class="font-semibold">$234.00</span></div>
                   <div class="flex justify-between text-slate-500"><span>Shipping</span><span class="font-semibold">$12.50</span></div>
                   <div class="flex justify-between text-green-600"><span>Discount</span><span class="font-semibold">-$20.00</span></div>
                </div>
                <div class="pt-4 border-t border-slate-200 dark:border-slate-700 mb-8 flex justify-between items-center"><span class="font-bold text-lg">Total</span><span class="font-black text-2xl text-primary">$242.30</span></div>
                <button class="w-full py-4 bg-primary text-white rounded-lg font-bold hover:bg-primary/90 transition-all flex items-center justify-center gap-2">Track Package</button>
             </div>
          </div>
       </div>
    </div>
  );
};

export default OrderDetail;