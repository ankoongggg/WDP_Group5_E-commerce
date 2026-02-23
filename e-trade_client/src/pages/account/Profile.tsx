import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const Profile: React.FC = () => {
  const { user, logout } = useAuth();
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
             <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">My Account</h1>
          </div>
          <div className="flex items-center gap-4">
             <Link to="/" className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors font-bold text-sm">Return to Shop</Link>
             <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors font-bold text-sm text-slate-900 dark:text-white">
                <span className="material-symbols-outlined text-lg">logout</span> Logout
             </button>
          </div>
       </header>

       <div className="flex flex-1 overflow-hidden">
          <aside className="w-64 bg-white dark:bg-[#1a110c] border-r border-slate-200 dark:border-slate-800 hidden md:flex flex-col py-6">
             <nav className="flex flex-col gap-1 px-3">
                <Link to="/account" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-primary/10 border-r-4 border-primary text-primary font-medium">
                   <span className="material-symbols-outlined">person</span> Profile
                </Link>
                <Link to="/account/orders" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-primary transition-all">
                   <span className="material-symbols-outlined">shopping_bag</span> Orders
                </Link>
                <Link to="/account/settings" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-primary transition-all">
                   <span className="material-symbols-outlined">settings</span> Settings
                </Link>
             </nav>
          </aside>

          <main className="flex-1 overflow-y-auto p-6 md:p-10">
             <div className="max-w-5xl mx-auto space-y-8">
                <section className="flex flex-col md:flex-row items-center gap-8 bg-white dark:bg-[#2d1e16] p-8 rounded-xl border border-slate-200 dark:border-slate-800">
                   <div className="h-32 w-32 rounded-full overflow-hidden border-4 border-primary/20 flex items-center justify-center bg-primary/10">
                      {user?.avatar ? (
                        <img src={user.avatar} className="h-full w-full object-cover" />
                      ) : (
                        <span className="material-symbols-outlined text-primary text-5xl">person</span>
                      )}
                   </div>
                   <div className="text-center md:text-left flex-1">
                      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{user?.name}</h2>
                      <p className="text-slate-500 dark:text-slate-400">{user?.email}</p>
                      <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-3">
                         <Link to="/account/settings" className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-xl font-bold text-sm">Edit Profile</Link>
                      </div>
                   </div>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                   <div className="lg:col-span-2 space-y-8">
                      <div className="bg-white dark:bg-[#2d1e16] p-8 rounded-xl border border-slate-200 dark:border-slate-800">
                         <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-900 dark:text-white"><span className="material-symbols-outlined text-primary">local_shipping</span> Delivery Addresses</h3>
                         {user?.addresses && user.addresses.length > 0 ? (
                           user.addresses.map((addr: any, i: number) => (
                             <div key={i} className="flex items-start gap-4 p-4 border-2 border-primary/20 bg-primary/5 rounded-xl relative mb-3">
                                <span className="material-symbols-outlined text-primary mt-1">home</span>
                                <div className="flex-1">
                                   <div className="flex items-center gap-2 mb-1">
                                      <span className="font-bold text-slate-900 dark:text-white">{addr.label || 'Address'}</span>
                                      {addr.is_default && <span className="bg-primary text-white text-[10px] uppercase px-2 py-0.5 rounded-full font-bold">Default</span>}
                                   </div>
                                   <p className="text-sm text-slate-500 dark:text-slate-400">{addr.street}, {addr.district}, {addr.city}</p>
                                </div>
                             </div>
                           ))
                         ) : (
                           <p className="text-sm text-slate-400">No addresses added yet.</p>
                         )}
                      </div>
                   </div>

                   <div className="space-y-8">
                      <div className="bg-gradient-to-br from-primary to-orange-600 p-6 rounded-xl text-white">
                         <div className="flex items-center justify-between mb-4">
                            <span className="material-symbols-outlined text-3xl">loyalty</span>
                            <span className="text-xs font-bold bg-white/20 px-2 py-1 rounded-full uppercase">{user?.role?.includes('seller') ? 'Seller' : 'Member'}</span>
                         </div>
                         <div className="space-y-1">
                            <p className="text-white/70 text-sm">Reward Balance</p>
                            <p className="text-3xl font-bold">2,450 pts</p>
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