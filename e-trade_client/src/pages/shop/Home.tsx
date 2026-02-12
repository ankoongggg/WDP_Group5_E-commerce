import React from 'react';
import { Layout } from '../../../components/Layout';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
  return (
    <Layout>
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-12">
        {/* Hero */}
        <section class="relative rounded-2xl overflow-hidden aspect-[21/9] bg-slate-900 group">
           <div class="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop')" }}></div>
           <div class="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent flex items-center px-8 sm:px-16">
             <div class="max-w-lg space-y-4">
               <span class="inline-block px-3 py-1 bg-primary text-white text-xs font-bold rounded-full uppercase tracking-widest">New Arrival</span>
               <h2 class="text-4xl sm:text-6xl font-bold text-white leading-tight">Elevate Your Lifestyle</h2>
               <p class="text-slate-200 text-lg">Experience the future of tech and fashion with our curated summer collection.</p>
               <div class="flex gap-4 pt-4">
                 <Link to="/products" class="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-xl font-bold transition-all transform hover:scale-105">Shop Now</Link>
               </div>
             </div>
           </div>
        </section>

        {/* Flash Sale */}
        <section class="bg-primary/5 dark:bg-primary/10 rounded-2xl p-6 border border-primary/10">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div class="space-y-1">
               <div class="flex items-center gap-2 text-primary font-bold">
                 <span class="material-symbols-outlined">bolt</span>
                 <h3 class="text-2xl">FLASH SALE</h3>
               </div>
               <p class="text-slate-500 dark:text-slate-400">Hurry up! These deals won't last forever.</p>
            </div>
            <div class="flex gap-3">
               {[["02", "Hours"], ["45", "Min"], ["12", "Sec"]].map(([val, label]) => (
                  <div key={label} class="flex flex-col items-center">
                    <div class="bg-primary text-white w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold shadow-lg shadow-primary/20">{val}</div>
                    <span class="text-[10px] uppercase font-bold mt-1 tracking-wider opacity-60">{label}</span>
                  </div>
               ))}
            </div>
          </div>
          
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
             {/* Products */}
             {[
               { name: "Premium Wireless Headphones", price: 199, old: 299, img: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80", off: "40%" },
               { name: "Minimalist Silver Watch", price: 149, old: 199, img: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80", off: "25%" },
               { name: "V-Series Running Shoes", price: 60, old: 120, img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80", off: "50%" },
               { name: "Instant Film Camera", price: 85, old: 99, img: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&q=80", off: "15%" }
             ].map((item, i) => (
               <Link to={`/product/${i}`} key={i} class="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 hover:shadow-xl transition-shadow group relative block">
                  <span class="absolute top-2 left-2 z-10 bg-primary text-white text-[10px] font-bold px-2 py-1 rounded">-{item.off}</span>
                  <div class="aspect-square rounded-lg bg-slate-100 dark:bg-slate-900 mb-3 overflow-hidden">
                    <img src={item.img} alt={item.name} class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  </div>
                  <h4 class="font-medium text-sm truncate dark:text-white">{item.name}</h4>
                  <div class="mt-1 flex items-baseline gap-2">
                    <span class="text-primary font-bold">${item.price}.00</span>
                    <span class="text-slate-400 text-xs line-through">${item.old}.00</span>
                  </div>
               </Link>
             ))}
          </div>
        </section>

        {/* Categories */}
        <section>
           <h3 class="text-2xl font-bold mb-8 dark:text-white">Shop by Category</h3>
           <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
             {["devices", "apparel", "chair", "fitness_center", "face", "headphones"].map((icon, i) => (
                <div key={i} class="group cursor-pointer">
                   <div class="aspect-square bg-slate-100 dark:bg-primary/5 rounded-2xl flex items-center justify-center mb-3 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                     <span class="material-symbols-outlined text-4xl">{icon}</span>
                   </div>
                   <p class="text-center font-bold text-sm dark:text-slate-300">Category {i+1}</p>
                </div>
             ))}
           </div>
        </section>
      </div>
    </Layout>
  );
};

export default Home;