import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import ThemeToggle from '../../components/ThemeToggle';

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const { toast } = useToast();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const getPasswordStrength = () => {
    if (!password) return { level: 0, label: '', color: '', width: 'w-0' };
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 2) return { level: 1, label: 'Weak', color: 'bg-red-500', width: 'w-1/3' };
    if (score <= 3) return { level: 2, label: 'Medium', color: 'bg-amber-500', width: 'w-2/3' };
    return { level: 3, label: 'Strong', color: 'bg-green-500', width: 'w-full' };
  };

  const strength = getPasswordStrength();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast.error('Invalid reset link. Please request a new one.');
      return;
    }
    if (!password) {
      toast.warning('Please enter a new password');
      return;
    }
    if (password.length < 6) {
      toast.warning('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      await authApi.resetPassword(token, password, confirmPassword);
      setSuccess(true);
      toast.success('Password reset successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-[480px] text-center flex flex-col gap-6">
          <div className="mx-auto size-16 bg-red-100 dark:bg-red-900/20 rounded-2xl flex items-center justify-center">
            <span className="material-symbols-outlined text-red-500 text-3xl">error</span>
          </div>
          <h1 className="text-2xl font-bold text-background-dark dark:text-white">Invalid Reset Link</h1>
          <p className="text-background-dark/60 dark:text-white/60">This password reset link is invalid or missing a token. Please request a new one.</p>
          <Link to="/forgot-password" className="w-full py-3.5 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-all text-center">
            Request New Link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark flex flex-col">
      <header className="w-full flex items-center justify-between px-6 py-4 md:px-12 sticky top-0 z-50 bg-white/50 dark:bg-background-dark/50 backdrop-blur-md">
        <Link to="/" className="flex items-center gap-2 text-primary">
          <div className="size-8 bg-primary rounded-lg flex items-center justify-center text-white">
            <span className="material-symbols-outlined">shopping_bag</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-background-dark dark:text-white">ShopModern</h2>
        </Link>
        <ThemeToggle size="sm" />
      </header>

      <main className="flex-1 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-[480px] flex flex-col gap-8">
          <div className="text-center">
            <div className="mx-auto mb-6 size-16 bg-primary/10 rounded-2xl flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-3xl">{success ? 'check_circle' : 'lock'}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-background-dark dark:text-white mb-2">
              {success ? 'Password Reset!' : 'Set New Password'}
            </h1>
            <p className="text-background-dark/60 dark:text-white/60">
              {success
                ? 'Your password has been changed successfully. You can now log in with your new password.'
                : 'Enter your new password below. Make sure it\'s strong and memorable.'}
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-900/50 p-8 rounded-xl shadow-xl shadow-primary/5 border border-primary/5">
            {success ? (
              <Link
                to="/login"
                className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-lg shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2"
              >
                Go to Login
                <span className="material-symbols-outlined">arrow_forward</span>
              </Link>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-background-dark dark:text-white/90 px-1">New Password</label>
                  <div className="relative group">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-background-dark/40 dark:text-white/30 group-focus-within:text-primary transition-colors">lock</span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-12 pr-12 py-3.5 rounded-lg border border-primary/20 dark:border-white/10 bg-background-light/50 dark:bg-background-dark/40 text-background-dark dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-background-dark/40 dark:text-white/30 hover:text-primary transition-colors"
                    >
                      <span className="material-symbols-outlined">{showPassword ? 'visibility_off' : 'visibility'}</span>
                    </button>
                  </div>
                  {password && (
                    <div className="mt-1">
                      <div className="flex gap-1 h-1.5 w-full bg-slate-100 dark:bg-background-dark/80 rounded-full overflow-hidden">
                        <div className={`${strength.color} ${strength.width} rounded-full transition-all duration-300`}></div>
                      </div>
                      <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mt-1">{strength.label}</p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-background-dark dark:text-white/90 px-1">Confirm Password</label>
                  <div className="relative group">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-background-dark/40 dark:text-white/30 group-focus-within:text-primary transition-colors">lock</span>
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`w-full pl-12 pr-12 py-3.5 rounded-lg border bg-background-light/50 dark:bg-background-dark/40 text-background-dark dark:text-white focus:ring-2 outline-none transition-all ${confirmPassword && confirmPassword !== password ? 'border-red-400 focus:ring-red-200 focus:border-red-400' : 'border-primary/20 dark:border-white/10 focus:ring-primary/20 focus:border-primary'}`}
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-background-dark/40 dark:text-white/30 hover:text-primary transition-colors"
                    >
                      <span className="material-symbols-outlined">{showConfirm ? 'visibility_off' : 'visibility'}</span>
                    </button>
                  </div>
                  {confirmPassword && confirmPassword !== password && (
                    <p className="text-xs text-red-500 font-medium px-1">Passwords do not match</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-lg shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 group disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    <>
                      Reset Password
                      <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {!success && (
            <div className="text-center">
              <Link to="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors">
                <span className="material-symbols-outlined text-lg">arrow_back</span>
                Back to Login
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ResetPassword;
