import React from 'react';
import { Link } from 'react-router-dom';

const Profile: React.FC = () => {
  return (
    <div class="min-h-screen bg-background-light dark:bg-background-dark font-display flex flex-col">
       <header class="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1a110c] px-6 flex items-center justify-between sticky top-0 z-50">
          <div class="flex items-center gap-3">
             <Link to="/" class="bg-primary p-1.5 rounded-lg flex items-center justify-center">
                <span class="material-symbols-outlined text-white text-2xl">dashboard</span>
             </Link>
             <h1 class="text-xl font-bold tracking-tight text-slate-900 dark:text-white">My Account</h1>
          </div>
          <div class="flex items-center gap-4">
             <Link to="/" class="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors font-bold text-sm">Return to Shop</Link>
             <button class="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors font-bold text-sm text-slate-900 dark:text-white">
                <span class="material-symbols-outlined text-lg">logout</span> Logout
             </button>
          </div>
       </header>

       <div class="flex flex-1 overflow-hidden">
          <aside class="w-64 bg-white dark:bg-[#1a110c] border-r border-slate-200 dark:border-slate-800 hidden md:flex flex-col py-6">
             <nav class="flex flex-col gap-1 px-3">
                <Link to="/account" class="flex items-center gap-3 px-4 py-3 rounded-lg bg-primary/10 border-r-4 border-primary text-primary font-medium">
                   <span class="material-symbols-outlined">person</span> Profile
                </Link>
                <Link to="/account/orders" class="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-primary transition-all">
                   <span class="material-symbols-outlined">shopping_bag</span> Orders
                </Link>
                <Link to="/account/settings" class="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-primary transition-all">
                   <span class="material-symbols-outlined">settings</span> Settings
                </Link>
             </nav>
          </aside>

          <main class="flex-1 overflow-y-auto p-6 md:p-10">
             <div class="max-w-5xl mx-auto space-y-8">
                {/* Header */}
                <section class="flex flex-col md:flex-row items-center gap-8 bg-white dark:bg-[#2d1e16] p-8 rounded-xl border border-slate-200 dark:border-slate-800">
                   <div class="h-32 w-32 rounded-full overflow-hidden border-4 border-primary/20">
                      <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" class="h-full w-full object-cover" />
                   </div>
                   <div class="text-center md:text-left flex-1">
                      <h2 class="text-2xl font-bold text-slate-900 dark:text-white">Alex Richardson</h2>
                      <p class="text-slate-500 dark:text-slate-400">alex.r@example.com</p>
                      <div class="mt-4 flex flex-wrap justify-center md:justify-start gap-3">
                         <button class="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-xl font-bold text-sm">Edit Profile</button>
                      </div>
                   </div>
                </section>

                <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                   <div class="lg:col-span-2 space-y-8">
                      <div class="bg-white dark:bg-[#2d1e16] p-8 rounded-xl border border-slate-200 dark:border-slate-800">
                         <h3 class="text-lg font-bold mb-6 flex items-center gap-2 text-slate-900 dark:text-white"><span class="material-symbols-outlined text-primary">local_shipping</span> Delivery Addresses</h3>
                         <div class="flex items-start gap-4 p-4 border-2 border-primary/20 bg-primary/5 rounded-xl relative">
                            <span class="material-symbols-outlined text-primary mt-1">home</span>
                            <div class="flex-1">
                               <div class="flex items-center gap-2 mb-1">
                                  <span class="font-bold text-slate-900 dark:text-white">Home</span>
                                  <span class="bg-primary text-white text-[10px] uppercase px-2 py-0.5 rounded-full font-bold">Default</span>
                               </div>
                               <p class="text-sm text-slate-500 dark:text-slate-400">123 Sunset Boulevard, West Hollywood, CA</p>
                            </div>
                         </div>
                      </div>
                   </div>

                   <div class="space-y-8">
                      <div class="bg-gradient-to-br from-primary to-orange-600 p-6 rounded-xl text-white">
                         <div class="flex items-center justify-between mb-4">
                            <span class="material-symbols-outlined text-3xl">loyalty</span>
                            <span class="text-xs font-bold bg-white/20 px-2 py-1 rounded-full uppercase">Pro Member</span>
                         </div>
                         <div class="space-y-1">
                            <p class="text-white/70 text-sm">Reward Balance</p>
                            <p class="text-3xl font-bold">2,450 pts</p>
                         </div>
                      </div>
                   </div>
                </div>
             </div>
          </main>
       </div>
    </div>
  );
};

export default Profile;