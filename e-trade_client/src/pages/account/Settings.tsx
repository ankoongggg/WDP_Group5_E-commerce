import React, { useState } from 'react';
import { authApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { AccountLayout } from '../components/AccountLayout';

const Settings: React.FC = () => {
  const { toast } = useToast();

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

    if (score <= 2) return { level: 1, label: 'Yếu', color: 'bg-red-500', width: 'w-1/3' };
    if (score <= 3) return { level: 2, label: 'Trung bình', color: 'bg-amber-500', width: 'w-2/3' };
    return { level: 3, label: 'Mạnh', color: 'bg-green-500', width: 'w-full' };
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
      toast.warning('Vui lòng nhập mật khẩu hiện tại');
      return;
    }
    if (!newPassword) {
      toast.warning('Vui lòng nhập mật khẩu mới');
      return;
    }
    if (newPassword.length < 6) {
      toast.warning('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Xác nhận mật khẩu không khớp');
      return;
    }
    if (currentPassword === newPassword) {
      toast.warning('Mật khẩu mới phải khác mật khẩu hiện tại');
      return;
    }

    setIsLoading(true);
    try {
      const data = await authApi.changePassword(currentPassword, newPassword);
      toast.success(data.message || 'Đổi mật khẩu thành công! ✅');
      resetForm();
    } catch (err: any) {
      toast.error(err.message || 'Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu hiện tại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AccountLayout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
            <h2 className="text-3xl font-black tracking-tight mb-2 dark:text-white">Đổi Mật Khẩu</h2>
            <p className="text-slate-600 dark:text-slate-400">Bảo vệ tài khoản của bạn bằng một mật khẩu mạnh và không sử dụng lại ở nơi khác.</p>
        </div>

        <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 md:p-8 shadow-sm">
            <form onSubmit={handleChangePassword} className="flex flex-col gap-6">
                
                {/* Current Password */}
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold dark:text-white">Mật khẩu hiện tại</label>
                    <div className="relative">
                        <input
                        type={showCurrentPw ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full h-12 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 dark:text-white rounded-xl px-4 pr-12 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                        placeholder="Nhập mật khẩu hiện tại"
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

                <hr className="border-slate-100 dark:border-slate-700/50"/>

                {/* New Password */}
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold dark:text-white">Mật khẩu mới</label>
                    <div className="relative">
                        <input
                        type={showNewPw ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full h-12 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 dark:text-white rounded-xl px-4 pr-12 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                        placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)"
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
                        <div className="flex gap-1 h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div className={`${strength.color} ${strength.width} rounded-full transition-all duration-300`}></div>
                        </div>
                        <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mt-1">{strength.label}</p>
                        </div>
                    )}
                </div>

                {/* Confirm Password */}
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold dark:text-white">Xác nhận mật khẩu mới</label>
                    <div className="relative">
                        <input
                        type={showConfirmPw ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={`w-full h-12 bg-slate-50 dark:bg-slate-900 border rounded-xl px-4 pr-12 focus:ring-1 outline-none transition-colors dark:text-white ${confirmPassword && confirmPassword !== newPassword ? 'border-red-400 focus:border-red-400 focus:ring-red-200' : 'border-slate-200 dark:border-slate-700 focus:border-primary focus:ring-primary'}`}
                        placeholder="Nhập lại mật khẩu mới"
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
                        <p className="text-xs text-red-500 font-medium">Mật khẩu xác nhận không khớp!</p>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4 mt-2 border-t border-slate-100 dark:border-slate-700/50">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="flex-1 bg-primary hover:bg-primary/90 text-white font-bold h-12 rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Đang cập nhật...
                        </>
                        ) : (
                        <>
                            <span className="material-symbols-outlined text-[20px]">sync_lock</span>
                            Cập nhật mật khẩu
                        </>
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={resetForm}
                        className="px-8 h-12 rounded-xl border border-slate-200 dark:border-slate-600 font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 dark:text-white transition-all"
                    >
                        Hủy
                    </button>
                </div>
            </form>
        </div>
      </div>
    </AccountLayout>
  );
};

export default Settings;