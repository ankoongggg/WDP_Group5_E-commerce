import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/');
  };

  return (
    <div class="min-h-screen bg-background-light dark:bg-background-dark flex flex-col">
       <header class="w-full flex items-center justify-between px-6 py-4 md:px-12 sticky top-0 z-50 bg-white/50 dark:bg-background-dark/50 backdrop-blur-md">
        <Link to="/" class="flex items-center gap-2 text-primary">
          <div class="size-8 bg-primary rounded-lg flex items-center justify-center text-white">
            <span class="material-symbols-outlined">shopping_bag</span>
          </div>
          <h2 class="text-xl font-bold tracking-tight text-background-dark dark:text-white">ShopModern</h2>
        </Link>
      </header>
      
      <main class="flex-1 flex items-center justify-center p-6 md:p-12">
        <div class="w-full max-w-[480px] flex flex-col gap-8">
          <div class="text-center">
            <h1 class="text-3xl md:text-4xl font-bold text-background-dark dark:text-white mb-2">Welcome Back</h1>
            <p class="text-background-dark/60 dark:text-white/60">Log in to your account to continue shopping.</p>
          </div>

          <div class="bg-white dark:bg-zinc-900/50 p-8 rounded-xl shadow-xl shadow-primary/5 border border-primary/5">
            <form onSubmit={handleLogin} class="flex flex-col gap-5">
              <div class="flex flex-col gap-2">
                <label class="text-sm font-semibold text-background-dark dark:text-white/90 px-1">Email or Phone Number</label>
                <div class="relative group">
                  <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-background-dark/40 dark:text-white/30 group-focus-within:text-primary transition-colors">mail</span>
                  <input type="text" class="w-full pl-12 pr-4 py-3.5 rounded-lg border border-primary/20 dark:border-white/10 bg-background-light/50 dark:bg-background-dark/40 text-background-dark dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" placeholder="name@example.com" />
                </div>
              </div>
              <div class="flex flex-col gap-2">
                <label class="text-sm font-semibold text-background-dark dark:text-white/90 px-1">Password</label>
                <div class="relative group">
                  <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-background-dark/40 dark:text-white/30 group-focus-within:text-primary transition-colors">lock</span>
                  <input type="password" class="w-full pl-12 pr-12 py-3.5 rounded-lg border border-primary/20 dark:border-white/10 bg-background-light/50 dark:bg-background-dark/40 text-background-dark dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" placeholder="••••••••" />
                  <button type="button" class="absolute right-4 top-1/2 -translate-y-1/2 text-background-dark/40 dark:text-white/30 hover:text-primary transition-colors">
                    <span class="material-symbols-outlined">visibility</span>
                  </button>
                </div>
              </div>
              <div class="flex items-center justify-between py-1">
                <label class="flex items-center gap-2 cursor-pointer group">
                   <div class="relative flex items-center">
                    <input type="checkbox" class="peer appearance-none size-5 rounded border border-primary/30 checked:bg-primary checked:border-primary transition-all cursor-pointer"/>
                    <span class="material-symbols-outlined absolute text-white text-[16px] scale-0 peer-checked:scale-100 transition-transform left-1/2 -translate-x-1/2 pointer-events-none">check</span>
                   </div>
                   <span class="text-sm text-background-dark/70 dark:text-white/70">Remember me</span>
                </label>
                <a href="#" class="text-sm font-semibold text-primary hover:text-primary/80">Forgot password?</a>
              </div>
              <button type="submit" class="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-lg shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 group">
                Sign In
                <span class="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </button>
            </form>

            <div class="relative my-8">
               <div class="absolute inset-0 flex items-center">
                 <div class="w-full border-t border-primary/10 dark:border-white/5"></div>
               </div>
               <div class="relative flex justify-center text-xs uppercase">
                 <span class="bg-white dark:bg-[#18181b] px-4 text-background-dark/40 dark:text-white/40 font-medium tracking-widest">Or continue with</span>
               </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <button class="flex items-center justify-center gap-3 py-3 px-4 rounded-lg border border-primary/10 dark:border-white/10 bg-background-light dark:bg-background-dark/40 hover:bg-primary/5 transition-all">
                <span class="text-sm font-semibold text-background-dark dark:text-white">Google</span>
              </button>
              <button class="flex items-center justify-center gap-3 py-3 px-4 rounded-lg border border-primary/10 dark:border-white/10 bg-background-light dark:bg-background-dark/40 hover:bg-primary/5 transition-all">
                <span class="text-sm font-semibold text-background-dark dark:text-white">Facebook</span>
              </button>
            </div>
          </div>

          <div class="text-center flex flex-col gap-6">
             <p class="text-background-dark/60 dark:text-white/60">Don't have an account?</p>
             <Link to="/register" class="w-full py-3.5 border-2 border-primary text-primary font-bold rounded-lg hover:bg-primary hover:text-white transition-all text-center">
               Create New Account
             </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Login;