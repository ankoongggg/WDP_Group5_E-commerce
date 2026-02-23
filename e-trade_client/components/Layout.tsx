import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../src/context/AuthContext';
import { useToast } from '../src/context/ToastContext';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout, loading } = useAuth();
  const { toast } = useToast();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-white/10 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md">
      <div className="max-w-[1440px] mx-auto px-6 h-16 flex items-center justify-between gap-8">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded flex items-center justify-center text-white">
            <span className="material-symbols-outlined">shopping_bag</span>
          </div>
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white uppercase italic">ShopModern</h2>
        </Link>
        
        <div className="flex-1 max-w-xl hidden md:block">
          <label className="relative flex items-center">
            <span className="absolute left-3 text-slate-400 material-symbols-outlined">search</span>
            <input className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/50 transition-all outline-none" placeholder="Search for products..." type="text"/>
          </label>
        </div>

        <div className="flex items-center gap-3">
          {!loading && isAuthenticated ? (
            <>
              <Link to="/account/orders" className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors relative">
                <span className="material-symbols-outlined">notifications</span>
                <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-white dark:border-background-dark"></span>
              </Link>
              <Link to="/cart" className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors relative">
                <span className="material-symbols-outlined">shopping_cart</span>
              </Link>
              <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 mx-1"></div>
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-2 cursor-pointer group"
                >
                  <div className="size-9 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden border-2 border-primary/20 group-hover:border-primary transition-colors">
                    {user?.avatar ? (
                      <img alt={user.name} className="w-full h-full object-cover" src={user.avatar} />
                    ) : (
                      <span className="material-symbols-outlined text-primary text-xl">person</span>
                    )}
                  </div>
                  <span className="hidden md:block text-sm font-semibold text-slate-700 dark:text-slate-200 max-w-[100px] truncate">
                    {user?.name}
                  </span>
                  <span className="material-symbols-outlined text-slate-400 text-lg">expand_more</span>
                </button>

                {showDropdown && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-zinc-900 rounded-xl shadow-xl shadow-black/10 border border-slate-200 dark:border-white/10 py-2 z-50">
                    <div className="px-4 py-3 border-b border-slate-100 dark:border-white/10">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{user?.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
                    </div>
                    <Link to="/account" onClick={() => setShowDropdown(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                      <span className="material-symbols-outlined text-lg">person</span>
                      My Profile
                    </Link>
                    <Link to="/account/orders" onClick={() => setShowDropdown(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                      <span className="material-symbols-outlined text-lg">receipt_long</span>
                      My Orders
                    </Link>
                    <Link to="/account/settings" onClick={() => setShowDropdown(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                      <span className="material-symbols-outlined text-lg">settings</span>
                      Settings
                    </Link>
                    <div className="border-t border-slate-100 dark:border-white/10 mt-1 pt-1">
                      <button
                        onClick={() => { setShowDropdown(false); logout().then(() => toast.success('Logged out successfully')); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                      >
                        <span className="material-symbols-outlined text-lg">logout</span>
                        Log Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : !loading ? (
            <>
              <Link to="/login" className="px-5 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-primary transition-colors">
                Log In
              </Link>
              <Link to="/register" className="px-5 py-2 text-sm font-bold text-white bg-primary hover:bg-primary/90 rounded-lg transition-all shadow-md shadow-primary/20">
                Sign Up
              </Link>
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
};

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto py-12 border-t border-slate-200 dark:border-white/10 bg-white dark:bg-background-dark">
      <div className="max-w-[1440px] mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="col-span-1 md:col-span-1">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-primary rounded flex items-center justify-center text-white">
              <span className="material-symbols-outlined">shopping_bag</span>
            </div>
            <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white uppercase italic">ShopModern</h2>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">The ultimate destination for tech enthusiasts and trendsetters.</p>
        </div>
        <div>
           <h4 className="font-bold mb-6">Company</h4>
           <ul className="flex flex-col gap-4 text-sm text-slate-500 dark:text-slate-400">
             <li><a href="#" className="hover:text-primary">About Us</a></li>
             <li><a href="#" className="hover:text-primary">Careers</a></li>
             <li><a href="#" className="hover:text-primary">Contact</a></li>
           </ul>
        </div>
        <div>
           <h4 className="font-bold mb-6">Support</h4>
           <ul className="flex flex-col gap-4 text-sm text-slate-500 dark:text-slate-400">
             <li><a href="#" className="hover:text-primary">Help Center</a></li>
             <li><a href="#" className="hover:text-primary">Returns</a></li>
             <li><a href="#" className="hover:text-primary">Shipping</a></li>
           </ul>
        </div>
        <div>
           <h4 className="font-bold mb-6">Newsletter</h4>
           <div className="flex gap-2">
             <input className="flex-1 bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-4 py-2 text-sm" placeholder="Your email" />
             <button className="bg-primary text-white p-2 rounded-xl"><span className="material-symbols-outlined">send</span></button>
           </div>
        </div>
      </div>
    </footer>
  );
};

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
};
