import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import ThemeToggle from '../../components/ThemeToggle';

const ForgotPassword: React.FC = () => {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.warning('Please enter your email address');
      return;
    }

    setIsLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
      toast.success('Reset link sent! Check your email inbox.');
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

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
              <span className="material-symbols-outlined text-primary text-3xl">{sent ? 'mark_email_read' : 'lock_reset'}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-background-dark dark:text-white mb-2">
              {sent ? 'Check Your Email' : 'Forgot Password?'}
            </h1>
            <p className="text-background-dark/60 dark:text-white/60">
              {sent
                ? 'We\'ve sent a password reset link to your email. The link will expire in 15 minutes.'
                : 'No worries, we\'ll send you a link to reset your password.'}
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-900/50 p-8 rounded-xl shadow-xl shadow-primary/5 border border-primary/5">
            {sent ? (
              <div className="flex flex-col gap-5">
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <p className="text-sm text-green-700 dark:text-green-400 text-center">
                    A reset link has been sent to <strong>{email}</strong>
                  </p>
                </div>
                <p className="text-sm text-background-dark/50 dark:text-white/50 text-center">
                  Didn't receive the email? Check your spam folder or
                </p>
                <button
                  onClick={() => { setSent(false); setEmail(''); }}
                  className="w-full py-3.5 border-2 border-primary text-primary font-bold rounded-lg hover:bg-primary hover:text-white transition-all text-center"
                >
                  Try Another Email
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-background-dark dark:text-white/90 px-1">Email Address</label>
                  <div className="relative group">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-background-dark/40 dark:text-white/30 group-focus-within:text-primary transition-colors">mail</span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 rounded-lg border border-primary/20 dark:border-white/10 bg-background-light/50 dark:bg-background-dark/40 text-background-dark dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                      placeholder="name@example.com"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-lg shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 group disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      Send Reset Link
                      <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">send</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          <div className="text-center">
            <Link to="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors">
              <span className="material-symbols-outlined text-lg">arrow_back</span>
              Back to Login
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ForgotPassword;
