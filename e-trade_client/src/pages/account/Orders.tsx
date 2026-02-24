import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const Orders: React.FC = () => {
  const { logout } = useAuth();
  const { toast } = useToast();

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark font-display flex flex-col">
      <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1a110c] px-6 flex items-center justify-between sticky top-0 z-50">
          <div className="flex items-center gap-3">
             <Link to="/" className="bg-primary p-1.5 rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-2xl">dashboard</span>
             </Link>
             <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">My Orders</h1>
          </div>
          <div className="flex items-center gap-4">
             <Link to="/account" className="text-sm font-bold text-slate-500 hover:text-primary">Back to Account</Link>
             <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors font-bold text-sm text-slate-900 dark:text-white">
                <span className="material-symbols-outlined text-lg">logout</span> Logout
             </button>
          </div>
       </header>

       <main className="flex-1 overflow-y-auto p-6 md:p-10">
          <div className="max-w-5xl mx-auto space-y-6">
             <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow duration-300">
                <div className="p-6 flex flex-col gap-6">
                   <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                      <div className="flex items-center gap-4">
                         <div className="bg-primary/10 p-2 rounded-xl"><span className="material-symbols-outlined text-primary">local_shipping</span></div>
                         <div><p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Order ID</p><h4 className="text-sm font-bold dark:text-white">ORD-2023-882190</h4></div>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full">
                         <span className="w-2 h-2 bg-blue-500 rounded-full"></span><span className="text-xs font-bold uppercase tracking-wider">In Transit</span>
                      </div>
                   </div>
                   <div className="flex flex-col sm:flex-row gap-6">
                      <div className="size-24 bg-slate-100 rounded-xl overflow-hidden shrink-0"><img src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&q=80" className="w-full h-full object-cover" /></div>
                      <div className="flex-1">
                         <h3 className="text-lg font-bold dark:text-white">UltraBoost Pro X Athletic Sneakers</h3>
                         <p className="text-sm text-slate-500 mt-1">Size: 10, Color: Red Multi</p>
                      </div>
                      <div className="flex flex-col items-end justify-center"><p className="text-2xl font-black dark:text-white">$194.25</p></div>
                   </div>
                   <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                      <Link to="/account/orders/1" className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-bold dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">View Details</Link>
                      <button className="px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all">Track Order</button>
                   </div>
                </div>
             </div>
          </div>
       </main>
    </div>
  );
};

export default Orders;