import React from 'react';
import { Layout } from '../../../components/Layout';

const ProductDetail: React.FC = () => {
  return (
    <Layout>
      <div class="max-w-7xl mx-auto px-4 py-8">
         <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
            <div class="flex flex-col gap-4">
               <div class="relative aspect-square rounded-xl overflow-hidden bg-slate-100 dark:bg-white/5">
                 <img src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200&q=80" class="w-full h-full object-cover" />
               </div>
               <div class="flex gap-4 overflow-x-auto pb-2">
                  {[1,2,3].map(i => (
                    <div key={i} class="shrink-0 w-24 h-24 rounded-lg overflow-hidden border-2 border-transparent hover:border-primary cursor-pointer">
                      <img src={`https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&q=80`} class="w-full h-full object-cover" />
                    </div>
                  ))}
               </div>
            </div>

            <div class="flex flex-col gap-6">
               <div>
                 <span class="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full uppercase tracking-wider mb-2">Premium Series</span>
                 <h1 class="text-4xl font-extrabold tracking-tight dark:text-white">Apex Pro ANC Wireless</h1>
                 <div class="flex items-center gap-4 mt-2">
                    <div class="flex text-primary">
                       {[1,2,3,4,5].map(i => <span key={i} class="material-symbols-outlined fill">star</span>)}
                    </div>
                    <span class="text-slate-400">1,248 Reviews</span>
                 </div>
               </div>

               <div class="flex items-baseline gap-4">
                 <span class="text-4xl font-black text-primary">$299.00</span>
                 <span class="text-xl text-slate-400 line-through font-medium">$349.00</span>
                 <span class="text-sm font-bold text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded">Save 15%</span>
               </div>

               <p class="text-slate-600 dark:text-slate-300 leading-relaxed border-y border-slate-200 dark:border-white/10 py-6">
                 Experience pure sound with the Apex Pro. Engineered with industry-leading Active Noise Cancellation (ANC), 60-hour battery life, and spatial audio.
               </p>

               <div class="flex flex-col gap-6">
                  <div class="flex flex-col gap-2">
                     <span class="text-sm font-bold uppercase tracking-wide text-slate-500">Quantity</span>
                     <div class="flex items-center w-fit border border-slate-300 dark:border-white/20 rounded-lg overflow-hidden">
                       <button class="px-3 py-2 hover:bg-slate-100 dark:hover:bg-white/5"><span class="material-symbols-outlined">remove</span></button>
                       <span class="px-6 py-2 font-bold text-lg min-w-[50px] text-center dark:text-white">1</span>
                       <button class="px-3 py-2 hover:bg-slate-100 dark:hover:bg-white/5"><span class="material-symbols-outlined">add</span></button>
                     </div>
                  </div>

                  <div class="flex flex-col sm:flex-row gap-4">
                    <button class="flex-1 flex items-center justify-center gap-2 px-8 py-4 border-2 border-primary text-primary font-bold rounded-xl hover:bg-primary/5 transition-all">
                      <span class="material-symbols-outlined">shopping_cart</span> Add to Cart
                    </button>
                    <button class="flex-1 flex items-center justify-center gap-2 px-8 py-4 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all">
                      <span class="material-symbols-outlined">bolt</span> Buy Now
                    </button>
                  </div>
               </div>
            </div>
         </div>
      </div>
    </Layout>
  );
};

export default ProductDetail;