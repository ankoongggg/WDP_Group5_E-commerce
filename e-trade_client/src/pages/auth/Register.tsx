import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Register: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div class="min-h-screen bg-background-light dark:bg-background-dark flex flex-col lg:flex-row">
      {/* Left Banner */}
      <div class="relative hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-primary overflow-hidden">
        <div class="absolute inset-0 z-0 opacity-20">
             <div class="absolute inset-0 bg-gradient-to-br from-black via-transparent to-transparent"></div>
             <img src="https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=2070&auto=format&fit=crop" class="h-full w-full object-cover" />
        </div>
        <div class="relative z-10 flex items-center gap-3 text-white">
          <span class="material-symbols-outlined text-4xl">shopping_basket</span>
          <h2 class="text-2xl font-black tracking-tight">ShopModern</h2>
        </div>
        <div class="relative z-10 text-white max-w-md">
           <h1 class="text-5xl font-black mb-6 leading-tight">Elevate your shopping experience.</h1>
           <p class="text-xl opacity-90 font-medium">Join over 2 million shoppers and get access to exclusive weekly drops.</p>
           <div class="mt-12 flex items-center gap-6">
             <div class="flex -space-x-3">
               <img class="h-10 w-10 rounded-full border-2 border-primary object-cover" src="https://randomuser.me/api/portraits/women/44.jpg" />
               <img class="h-10 w-10 rounded-full border-2 border-primary object-cover" src="https://randomuser.me/api/portraits/men/32.jpg" />
               <img class="h-10 w-10 rounded-full border-2 border-primary object-cover" src="https://randomuser.me/api/portraits/women/68.jpg" />
             </div>
             <p class="text-sm font-semibold italic">"The best decision for my wardrobe this year!"</p>
           </div>
        </div>
      </div>

      {/* Right Form */}
      <div class="flex-1 flex flex-col items-center justify-center p-6 md:p-12 lg:p-20">
         <div class="w-full max-w-md">
            <div class="mb-10">
               <h2 class="text-3xl font-black text-slate-900 dark:text-white mb-2">Create your account</h2>
               <p class="text-slate-500 dark:text-slate-400">Join our community for exclusive deals.</p>
            </div>
            
            <form onSubmit={(e) => { e.preventDefault(); navigate('/security'); }} class="space-y-5">
              <div>
                <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Full Name</label>
                <div class="relative">
                  <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">person</span>
                  <input type="text" class="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all dark:text-white" placeholder="John Doe" />
                </div>
              </div>
              
               <div>
                <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Email</label>
                <div class="relative">
                  <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">mail</span>
                  <input type="email" class="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all dark:text-white" placeholder="you@example.com" />
                </div>
              </div>

               <div>
                <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Password</label>
                <div class="relative">
                  <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">lock</span>
                  <input type="password" class="w-full pl-10 pr-12 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all dark:text-white" placeholder="••••••••" />
                </div>
                <div class="mt-2 flex gap-1 h-1 w-full">
                  <div class="flex-1 bg-primary rounded-full"></div>
                  <div class="flex-1 bg-primary rounded-full"></div>
                  <div class="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                </div>
                <p class="text-[10px] uppercase tracking-wider font-bold text-slate-400 mt-1">Medium Strength</p>
              </div>

              <div class="flex items-start gap-3 py-2">
                 <input type="checkbox" class="h-5 w-5 rounded border-slate-300 text-primary focus:ring-primary mt-0.5" />
                 <label class="text-sm font-medium text-slate-600 dark:text-slate-400">I agree to the Terms of Service and Privacy Policy</label>
              </div>

              <button type="submit" class="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 px-6 rounded-lg transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2">
                 Create Account <span class="material-symbols-outlined text-lg">arrow_forward</span>
              </button>
            </form>

            <div class="mt-10 pt-8 border-t border-slate-100 dark:border-slate-800 text-center">
               <p class="text-slate-600 dark:text-slate-400 text-sm">
                 Already have an account? <Link to="/login" class="text-primary font-bold hover:underline ml-1">Log In</Link>
               </p>
            </div>
         </div>
      </div>
    </div>
  );
};

export default Register;