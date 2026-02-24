import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const Settings: React.FC = () => {
  const { logout } = useAuth();
  const { toast } = useToast();

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
  };
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('security');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const getPasswordStrength = () => {
    if (!newPassword) return { level: 0, label: '', color: '', width: 'w-0' };
    let score = 0;
    if (newPassword.length >= 6) score++;
    if (newPassword.length >= 10) score++;
    if (/[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword)) score++;
    if (/\d/.test(newPassword)) score++;
    if (/[^A-Za-z0-9]/.test(newPassword)) score++;

    if (score <= 2) return { level: 1, label: 'Weak', color: 'bg-red-500', width: 'w-1/3' };
    if (score <= 3) return { level: 2, label: 'Medium', color: 'bg-amber-500', width: 'w-2/3' };
    return { level: 3, label: 'Strong', color: 'bg-green-500', width: 'w-full' };
  };

  const strength = getPasswordStrength();

  const resetForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword) {
      toast.warning('Please enter your current password');
      return;
    }
    if (!newPassword) {
      toast.warning('Please enter a new password');
      return;
    }
    if (newPassword.length < 6) {
      toast.warning('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (currentPassword === newPassword) {
      toast.warning('New password must be different from current password');
      return;
    }

    setIsLoading(true);
    try {
      const data = await authApi.changePassword(currentPassword, newPassword);
      toast.success(data.message || 'Password changed successfully!');
      resetForm();
    } catch (err: any) {
      toast.error(err.message || 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark font-display flex flex-col text-slate-900 dark:text-white">
      <header className="flex items-center justify-between border-b border-slate-200 dark:border-primary/20 bg-white dark:bg-background-dark/50 px-10 py-3 backdrop-blur-sm sticky top-0 z-50">
         <div className="flex items-center gap-4">
            <div className="size-8 bg-primary rounded-lg flex items-center justify-center text-white"><span className="material-symbols-outlined">shield</span></div>
            <h2 className="text-lg font-bold">Account Settings</h2>
         </div>
         <div className="flex items-center gap-4">
           <Link to="/account" className="text-sm font-bold text-slate-500 hover:text-primary">Back</Link>
           <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors font-bold text-sm text-slate-900 dark:text-white">
              <span className="material-symbols-outlined text-lg">logout</span> Logout
           </button>
         </div>
      </header>

      <div className="flex flex-1 justify-center py-10 px-4 lg:px-40">
         <div className="flex flex-col md:flex-row gap-8 max-w-[1200px] flex-1">
            <aside className="flex flex-col gap-2 w-full md:w-64 shrink-0">
               <nav className="flex flex-col gap-1">
                  <button
                    onClick={() => setActiveTab('profile')}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left ${activeTab === 'profile' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'hover:bg-slate-100 dark:hover:bg-primary/5 text-slate-600 dark:text-slate-400'}`}
                  >
                    <span className="material-symbols-outlined text-[20px]">person</span>
                    <span className="text-sm font-medium">Profile</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('security')}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left ${activeTab === 'security' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'hover:bg-slate-100 dark:hover:bg-primary/5 text-slate-600 dark:text-slate-400'}`}
                  >
                    <span className="material-symbols-outlined text-[20px]">lock</span>
                    <span className="text-sm font-medium">Security</span>
                  </button>
               </nav>
            </aside>

            <main className="flex-1 max-w-[640px]">
               {activeTab === 'security' && (
                 <>
                   <div className="mb-8">
                      <h2 className="text-3xl font-black tracking-tight mb-2">Change Password</h2>
                      <p className="text-slate-600 dark:text-slate-400">Ensure your account is using a long, random password to stay secure.</p>
                   </div>

                   <div className="bg-white dark:bg-background-dark/40 border border-slate-200 dark:border-primary/10 rounded-xl p-6 shadow-sm">
                      <form onSubmit={handleChangePassword} className="flex flex-col gap-6">
                         <div className="flex flex-col gap-2">
                            <label className="text-sm font-semibold">Current Password</label>
                            <div className="relative">
                              <input
                                type={showCurrentPw ? 'text' : 'password'}
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className="w-full h-12 bg-slate-50 dark:bg-background-dark/60 border border-slate-200 dark:border-primary/20 rounded-lg px-4 pr-12 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                                placeholder="Enter current password"
                              />
                              <button
                                type="button"
                                onClick={() => setShowCurrentPw(!showCurrentPw)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors"
                              >
                                <span className="material-symbols-outlined text-xl">{showCurrentPw ? 'visibility_off' : 'visibility'}</span>
                              </button>
                            </div>
                         </div>

                         <hr className="border-slate-100 dark:border-primary/5"/>

                         <div className="flex flex-col gap-2">
                            <label className="text-sm font-semibold">New Password</label>
                            <div className="relative">
                              <input
                                type={showNewPw ? 'text' : 'password'}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full h-12 bg-slate-50 dark:bg-background-dark/60 border border-slate-200 dark:border-primary/20 rounded-lg px-4 pr-12 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                                placeholder="Enter your new password"
                              />
                              <button
                                type="button"
                                onClick={() => setShowNewPw(!showNewPw)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors"
                              >
                                <span className="material-symbols-outlined text-xl">{showNewPw ? 'visibility_off' : 'visibility'}</span>
                              </button>
                            </div>
                            {newPassword && (
                              <div className="mt-1">
                                <div className="flex gap-1 h-1.5 w-full bg-slate-100 dark:bg-background-dark/80 rounded-full overflow-hidden">
                                  <div className={`${strength.color} ${strength.width} rounded-full transition-all duration-300`}></div>
                                </div>
                                <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mt-1">{strength.label}</p>
                              </div>
                            )}
                         </div>

                         <div className="flex flex-col gap-2">
                            <label className="text-sm font-semibold">Confirm New Password</label>
                            <div className="relative">
                              <input
                                type={showConfirmPw ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className={`w-full h-12 bg-slate-50 dark:bg-background-dark/60 border rounded-lg px-4 pr-12 focus:ring-1 outline-none transition-colors ${confirmPassword && confirmPassword !== newPassword ? 'border-red-400 focus:border-red-400 focus:ring-red-200' : 'border-slate-200 dark:border-primary/20 focus:border-primary focus:ring-primary'}`}
                                placeholder="Re-enter your new password"
                              />
                              <button
                                type="button"
                                onClick={() => setShowConfirmPw(!showConfirmPw)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors"
                              >
                                <span className="material-symbols-outlined text-xl">{showConfirmPw ? 'visibility_off' : 'visibility'}</span>
                              </button>
                            </div>
                            {confirmPassword && confirmPassword !== newPassword && (
                              <p className="text-xs text-red-500 font-medium">Passwords do not match</p>
                            )}
                         </div>

                         <div className="flex flex-col sm:flex-row gap-3 pt-2">
                            <button
                              type="submit"
                              disabled={isLoading}
                              className="flex-1 bg-primary hover:bg-primary/90 text-white font-bold h-12 rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              {isLoading ? (
                                <>
                                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                  Updating...
                                </>
                              ) : (
                                <>
                                  <span className="material-symbols-outlined text-[20px]">sync</span>
                                  Update Password
                                </>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={resetForm}
                              className="px-6 h-12 rounded-xl border border-slate-200 dark:border-primary/20 font-semibold hover:bg-slate-50 dark:hover:bg-primary/5 transition-all"
                            >
                              Cancel
                            </button>
                         </div>
                      </form>
                   </div>
                 </>
               )}

               {activeTab === 'profile' && (
                 <div className="mb-8">
                    <h2 className="text-3xl font-black tracking-tight mb-2">Profile Settings</h2>
                    <p className="text-slate-600 dark:text-slate-400">Manage your personal information.</p>
                    <div className="mt-8 bg-white dark:bg-background-dark/40 border border-slate-200 dark:border-primary/10 rounded-xl p-8 shadow-sm flex items-center justify-center min-h-[200px]">
                      <p className="text-slate-400 dark:text-slate-500 text-sm">Profile settings coming soon...</p>
                    </div>
                 </div>
               )}
            </main>
         </div>
      </div>
    </div>
  );
};

export default Settings;
