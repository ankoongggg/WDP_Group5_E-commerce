import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const SecurityOtp: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div class="min-h-screen bg-background-light dark:bg-background-dark font-display flex flex-col">
       <header class="flex items-center justify-between border-b border-primary/10 px-6 md:px-10 py-4 bg-white dark:bg-[#1a110c]">
         <div class="flex items-center gap-4 text-primary">
            <span class="material-symbols-outlined text-2xl">shield</span>
            <h2 class="text-primary text-lg font-bold">Security Center</h2>
         </div>
         <Link to="/login" class="flex items-center justify-center rounded-xl h-10 w-10 bg-primary/10 text-primary hover:bg-primary/20">
            <span class="material-symbols-outlined">close</span>
         </Link>
       </header>

       <main class="flex-1 flex flex-col items-center justify-center px-4 py-12">
          <div class="w-full max-w-md bg-white dark:bg-[#2a1d17] p-8 rounded-xl shadow-xl border border-primary/5">
             <div class="mb-10 relative">
               <div class="absolute top-1/2 left-0 w-full h-0.5 bg-primary/10 -translate-y-1/2"></div>
               <div class="absolute top-1/2 left-0 w-1/2 h-0.5 bg-primary -translate-y-1/2"></div>
               <div class="flex justify-between relative">
                 <div class="flex flex-col items-center gap-2">
                   <div class="size-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold shadow-lg shadow-primary/20">1</div>
                   <span class="text-xs font-semibold text-primary">Identify</span>
                 </div>
                 <div class="flex flex-col items-center gap-2">
                   <div class="size-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">2</div>
                   <span class="text-xs font-semibold text-primary">Verify</span>
                 </div>
                 <div class="flex flex-col items-center gap-2">
                   <div class="size-8 rounded-full bg-primary/10 text-primary/40 flex items-center justify-center text-sm font-bold">3</div>
                   <span class="text-xs font-semibold text-primary/40">Reset</span>
                 </div>
               </div>
             </div>

             <div class="text-center mb-6">
               <h1 class="text-2xl font-bold text-slate-900 dark:text-white mb-2">Check your inbox</h1>
               <p class="text-sm text-slate-500 dark:text-slate-400">We've sent a 6-digit verification code to <span class="font-semibold text-slate-700 dark:text-slate-200">sarah.j***@example.com</span></p>
             </div>

             <div class="flex justify-between gap-2 mt-4">
               {[4, 8, 2, "", "", ""].map((val, i) => (
                 <input key={i} type="text" maxLength={1} value={val} className="w-12 h-14 text-center text-xl font-bold border-2 border-primary/20 rounded-lg bg-transparent focus:border-primary focus:ring-0 text-slate-900 dark:text-white" />
               ))}
             </div>

             <div class="flex flex-col gap-4 mt-6">
               <button onClick={() => navigate('/')} class="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-lg shadow-lg shadow-primary/25 transition-all flex items-center justify-center gap-2">
                 Verify Code <span class="material-symbols-outlined text-base">arrow_forward</span>
               </button>
               <div class="flex items-center justify-between px-1">
                 <button class="text-sm font-medium text-primary hover:underline">Resend code</button>
                 <span class="text-xs text-gray-400 font-medium">Expires in 01:59</span>
               </div>
             </div>
          </div>
       </main>
    </div>
  );
};

export default SecurityOtp;