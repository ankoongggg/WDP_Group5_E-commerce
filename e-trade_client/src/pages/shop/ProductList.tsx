import React from 'react';
import { Layout } from '../../../components/Layout';
import { Link } from 'react-router-dom';

const ProductList: React.FC = () => {
  return (
    <Layout>
      <div class="max-w-7xl mx-auto px-6 py-8">
        <div class="flex items-center gap-2 text-sm text-slate-500 mb-8">
          <Link to="/" class="hover:text-primary">Home</Link>
          <span class="material-symbols-outlined text-xs">chevron_right</span>
          <span class="text-primary font-medium">All Products</span>
        </div>

        <div class="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside class="w-full lg:w-72 flex-shrink-0 space-y-8">
            <div>
              <h3 class="text-lg font-bold mb-4 flex items-center gap-2 dark:text-white">
                <span class="material-symbols-outlined text-primary">tune</span> Filters
              </h3>
              <div class="border-t border-slate-200 dark:border-primary/10 py-6 space-y-3">
                 <h4 class="font-semibold mb-4 text-sm uppercase tracking-wider text-slate-400">Categories</h4>
                 {["Headphones", "Speakers", "Microphones", "Accessories"].map(cat => (
                   <label key={cat} class="flex items-center gap-3 cursor-pointer group">
                     <input type="checkbox" class="rounded border-slate-300 text-primary focus:ring-primary bg-transparent" />
                     <span class="text-sm dark:text-slate-300 group-hover:text-primary transition-colors">{cat}</span>
                   </label>
                 ))}
              </div>
            </div>
          </aside>

          {/* Grid */}
          <div class="flex-1">
             <div class="flex justify-between gap-4 mb-8 bg-white dark:bg-primary/5 p-4 rounded-2xl border border-slate-200 dark:border-primary/10">
                <p class="text-sm font-medium dark:text-white"><span class="text-primary">124</span> Products Found</p>
                <div class="flex items-center gap-4">
                  <select class="bg-transparent border-none focus:ring-0 text-sm font-bold cursor-pointer dark:text-white">
                    <option>Latest Arrivals</option>
                    <option>Price: Low to High</option>
                  </select>
                </div>
             </div>

             <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
               {[1, 2, 3, 4, 5, 6].map((i) => (
                 <Link to={`/product/${i}`} key={i} class="group bg-white dark:bg-primary/5 rounded-2xl border border-slate-200 dark:border-primary/10 overflow-hidden hover:border-primary/50 transition-all duration-300 flex flex-col">
                    <div class="relative aspect-square bg-slate-100 dark:bg-primary/10 overflow-hidden">
                       <img src={`https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80&random=${i}`} class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                       <button class="absolute top-3 right-3 bg-white/80 dark:bg-black/20 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:text-primary text-slate-900 dark:text-white">
                         <span class="material-symbols-outlined text-sm">favorite</span>
                       </button>
                    </div>
                    <div class="p-5 flex flex-col flex-1">
                       <div class="flex items-center justify-between mb-2">
                          <span class="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Audio</span>
                          <div class="flex items-center gap-1">
                             <span class="material-symbols-outlined text-amber-400 text-xs fill">star</span>
                             <span class="text-xs font-bold text-slate-400">4.8</span>
                          </div>
                       </div>
                       <h3 class="font-bold text-base mb-2 dark:text-white group-hover:text-primary transition-colors">Studio-X Wireless Pro</h3>
                       <div class="mt-auto flex items-center gap-3">
                          <span class="text-lg font-bold text-primary">$299.00</span>
                       </div>
                    </div>
                 </Link>
               ))}
             </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProductList;