import React from 'react';
import { Link } from 'react-router-dom';

const Settings: React.FC = () => {
  return (
    <div class="min-h-screen bg-background-light dark:bg-background-dark font-display flex flex-col text-slate-900 dark:text-white">
      <header class="flex items-center justify-between border-b border-slate-200 dark:border-primary/20 bg-white dark:bg-background-dark/50 px-10 py-3 backdrop-blur-sm sticky top-0 z-50">
         <div class="flex items-center gap-4">
            <div class="size-8 bg-primary rounded-lg flex items-center justify-center text-white"><span class="material-symbols-outlined">shield</span></div>
            <h2 class="text-lg font-bold">Account Settings</h2>
         </div>
         <Link to="/account" class="text-sm font-bold text-slate-500 hover:text-primary">Back</Link>
      </header>

      <div class="flex flex-1 justify-center py-10 px-4 lg:px-40">
         <div class="flex flex-col md:flex-row gap-8 max-w-[1200px] flex-1">
            <aside class="flex flex-col gap-2 w-full md:w-64 shrink-0">
               <nav class="flex flex-col gap-1">
                  <a href="#" class="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-primary/5 text-slate-600 dark:text-slate-400"><span class="material-symbols-outlined text-[20px]">person</span><span class="text-sm font-medium">Profile</span></a>
                  <a href="#" class="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-primary text-white shadow-lg shadow-primary/20"><span class="material-symbols-outlined text-[20px] fill">lock</span><span class="text-sm font-medium">Security</span></a>
               </nav>
            </aside>

            <main class="flex-1 max-w-[640px]">
               <div class="mb-8">
                  <h2 class="text-3xl font-black tracking-tight mb-2">Change Password</h2>
                  <p class="text-slate-600 dark:text-slate-400">Ensure your account is using a long, random password to stay secure.</p>
               </div>

               <div class="bg-white dark:bg-background-dark/40 border border-slate-200 dark:border-primary/10 rounded-xl p-6 shadow-sm">
                  <form class="flex flex-col gap-6">
                     <div class="flex flex-col gap-2">
                        <label class="text-sm font-semibold">Current Password</label>
                        <input type="password" class="w-full h-12 bg-slate-50 dark:bg-background-dark/60 border border-slate-200 dark:border-primary/20 rounded-lg px-4 focus:border-primary focus:ring-1 focus:ring-primary outline-none" placeholder="••••••••••••" />
                     </div>
                     <hr class="border-slate-100 dark:border-primary/5"/>
                     <div class="flex flex-col gap-2">
                        <label class="text-sm font-semibold">New Password</label>
                        <input type="password" class="w-full h-12 bg-slate-50 dark:bg-background-dark/60 border border-slate-200 dark:border-primary/20 rounded-lg px-4 focus:border-primary focus:ring-1 focus:ring-primary outline-none" placeholder="Enter your new password" />
                        <div class="mt-2 flex gap-1 h-1.5 w-full bg-slate-100 dark:bg-background-dark/80 rounded-full overflow-hidden"><div class="bg-primary w-3/4 rounded-full"></div></div>
                     </div>
                     <div class="flex flex-col gap-2">
                        <label class="text-sm font-semibold">Confirm New Password</label>
                        <input type="password" class="w-full h-12 bg-slate-50 dark:bg-background-dark/60 border border-slate-200 dark:border-primary/20 rounded-lg px-4 focus:border-primary focus:ring-1 focus:ring-primary outline-none" placeholder="Re-enter your new password" />
                     </div>
                     <div class="flex flex-col sm:flex-row gap-3 pt-2">
                        <button class="flex-1 bg-primary hover:bg-primary/90 text-white font-bold h-12 rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"><span class="material-symbols-outlined text-[20px]">sync</span> Update Password</button>
                        <button type="button" class="px-6 h-12 rounded-xl border border-slate-200 dark:border-primary/20 font-semibold hover:bg-slate-50 dark:hover:bg-primary/5 transition-all">Cancel</button>
                     </div>
                  </form>
               </div>
            </main>
         </div>
      </div>
    </div>
  );
};

export default Settings;