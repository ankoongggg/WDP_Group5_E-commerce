import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export const Navbar: React.FC = () => {
  return (
    <header class="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-white/10 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md">
      <div class="max-w-[1440px] mx-auto px-6 h-16 flex items-center justify-between gap-8">
        <Link to="/" class="flex items-center gap-3">
          <div class="w-8 h-8 bg-primary rounded flex items-center justify-center text-white">
            <span class="material-symbols-outlined">shopping_bag</span>
          </div>
          <h2 class="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white uppercase italic">E-Shop Trading</h2>
        </Link>
        
        <div class="flex-1 max-w-xl hidden md:block">
          <label class="relative flex items-center">
            <span class="absolute left-3 text-slate-400 material-symbols-outlined">search</span>
            <input class="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/50 transition-all outline-none" placeholder="Search for products..." type="text"/>
          </label>
        </div>

        <div class="flex items-center gap-4">
          <Link to="/account/orders" class="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors relative">
             <span class="material-symbols-outlined">notifications</span>
             <span class="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-white dark:border-background-dark"></span>
          </Link>
          <Link to="/cart" class="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors relative">
             <span class="material-symbols-outlined">shopping_cart</span>
             <span class="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">3</span>
          </Link>
          <div class="h-8 w-px bg-slate-200 dark:bg-slate-800 mx-2"></div>
          <Link to="/account" class="flex items-center gap-3 cursor-pointer group">
            <div class="size-9 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden border border-primary/20">
              <img alt="User" class="w-full h-full object-cover" src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" />
            </div>
          </Link>
        </div>
      </div>
    </header>
  );
};

export const Footer: React.FC = () => {
  return (
    <footer class="mt-auto py-12 border-t border-slate-200 dark:border-white/10 bg-white dark:bg-background-dark">
      <div class="max-w-[1440px] mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
        <div class="col-span-1 md:col-span-1">
          <div class="flex items-center gap-3 mb-6">
            <div class="w-8 h-8 bg-primary rounded flex items-center justify-center text-white">
              <span class="material-symbols-outlined">shopping_bag</span>
            </div>
            <h2 class="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white uppercase italic">ShopModern</h2>
          </div>
          <p class="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">The ultimate destination for tech enthusiasts and trendsetters.</p>
        </div>
        <div>
           <h4 class="font-bold mb-6">Company</h4>
           <ul class="flex flex-col gap-4 text-sm text-slate-500 dark:text-slate-400">
             <li><a href="#" class="hover:text-primary">About Us</a></li>
             <li><a href="#" class="hover:text-primary">Careers</a></li>
             <li><a href="#" class="hover:text-primary">Contact</a></li>
           </ul>
        </div>
        <div>
           <h4 class="font-bold mb-6">Support</h4>
           <ul class="flex flex-col gap-4 text-sm text-slate-500 dark:text-slate-400">
             <li><a href="#" class="hover:text-primary">Help Center</a></li>
             <li><a href="#" class="hover:text-primary">Returns</a></li>
             <li><a href="#" class="hover:text-primary">Shipping</a></li>
           </ul>
        </div>
        <div>
           <h4 class="font-bold mb-6">Newsletter</h4>
           <div class="flex gap-2">
             <input class="flex-1 bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-4 py-2 text-sm" placeholder="Your email" />
             <button class="bg-primary text-white p-2 rounded-xl"><span class="material-symbols-outlined">send</span></button>
           </div>
        </div>
      </div>
    </footer>
  );
};

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div class="flex flex-col min-h-screen">
      <Navbar />
      <main class="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
};
