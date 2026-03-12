import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import ThemeToggle from '../../components/ThemeToggle';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, user } = useAuth();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Xác định trang trước đó người dùng đang truy cập (mặc định là trang chủ)
  const from = (location.state as any)?.from?.pathname || '/';

  // Determine where to send user after authentication (admin goes to admin dashboard)
  const computeRedirect = () => {
    if (user?.role?.includes('admin')) return '/admin';
    return from;
  };

  // Nếu đã đăng nhập rồi thì tự động đẩy về trang cũ, trang chủ hoặc admin
  React.useEffect(() => {
    if (isAuthenticated) navigate(computeRedirect(), { replace: true });
  }, [isAuthenticated, navigate, from, user]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Kiểm tra đầu vào
    if (!email || !password) {
      toast.warning('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      // Gọi hàm login từ AuthContext của Bách
      await login(email, password);
      toast.success('Welcome back! Login successful.');
      navigate(computeRedirect(), { replace: true });
    } catch (err: any) {
      const msg = err.message || 'Login failed. Please try again.';
      setError(msg);
      toast.error(msg);
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
          <h2 className="text-xl font-bold tracking-tight text-background-dark dark:text-white uppercase italic">E-Shop Trading</h2>
        </Link>
        <ThemeToggle size="sm" />
      </header>
      
      <main className="flex-1 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-[480px] flex flex-col gap-8">
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-background-dark dark:text-white mb-2">Welcome Back</h1>
            <p className="text-background-dark/60 dark:text-white/60">Log in to your account to continue shopping.</p>
          </div>

          <div className="bg-white dark:bg-zinc-900/50 p-8 rounded-xl shadow-xl shadow-primary/5 border border-primary/5">
            {error && (
              <div className="mb-5 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3">
                <span className="material-symbols-outlined text-red-500">error</span>
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <form onSubmit={handleLogin} className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-background-dark dark:text-white/90 px-1">Email</label>
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

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-background-dark dark:text-white/90 px-1">Password</label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-background-dark/40 dark:text-white/30 group-focus-within:text-primary transition-colors">lock</span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-3.5 rounded-lg border border-primary/20 dark:border-white/10 bg-background-light/50 dark:bg-background-dark/40 text-background-dark dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-background-dark/40 dark:text-white/30 hover:text-primary transition-colors"
                  >
                    <span className="material-symbols-outlined">{showPassword ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between py-1">
                <label className="flex items-center gap-2 cursor-pointer group">
                   <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="peer appearance-none size-5 rounded border border-primary/30 checked:bg-primary checked:border-primary transition-all cursor-pointer"
                    />
                    <span className="material-symbols-outlined absolute text-white text-[16px] scale-0 peer-checked:scale-100 transition-transform left-1/2 -translate-x-1/2 pointer-events-none">check</span>
                   </div>
                   <span className="text-sm text-background-dark/70 dark:text-white/70">Remember me</span>
                </label>
                <Link to="/forgot-password" className="text-sm font-semibold text-primary hover:text-primary/80">Forgot password?</Link>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-lg shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 group disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                  </>
                )}
              </button>
            </form>

            <div className="relative my-8">
               <div className="absolute inset-0 flex items-center">
                 <div className="w-full border-t border-primary/10 dark:border-white/5"></div>
               </div>
               <div className="relative flex justify-center text-xs uppercase">
                 <span className="bg-white dark:bg-[#18181b] px-4 text-background-dark/40 dark:text-white/40 font-medium tracking-widest">Or continue with</span>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button className="flex items-center justify-center gap-3 py-3 px-4 rounded-lg border border-primary/10 dark:border-white/10 bg-background-light dark:bg-background-dark/40 hover:bg-primary/5 transition-all">
                <span className="text-sm font-semibold text-background-dark dark:text-white">Google</span>
              </button>
              <button className="flex items-center justify-center gap-3 py-3 px-4 rounded-lg border border-primary/10 dark:border-white/10 bg-background-light dark:bg-background-dark/40 hover:bg-primary/5 transition-all">
                <span className="text-sm font-semibold text-background-dark dark:text-white">Facebook</span>
              </button>
            </div>
          </div>

          <div className="text-center flex flex-col gap-6">
             <p className="text-background-dark/60 dark:text-white/60">Don't have an account?</p>
             <Link to="/register" className="w-full py-3.5 border-2 border-primary text-primary font-bold rounded-lg hover:bg-primary hover:text-white transition-all text-center">
                Create New Account
             </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Login;