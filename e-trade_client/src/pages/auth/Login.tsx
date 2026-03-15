import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getGoogleAuthUrl } from '../../services/api';
import { userInfo } from 'os';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  const validateEmail = (value: string): true | string => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(value) ? true : 'Please enter a valid email address';
  };

  const validatePassword = (value: string) => {
    if (!value) return 'Password is required';
    if (value.length < 6) return 'Password must be at least 6 characters';
    return '';
  };

  const handleBlur = (field: 'email' | 'password') => {
    const emailErr = !email ? 'Email is required' : (validateEmail(email) === true ? '' : validateEmail(email));
    const passwordErr = validatePassword(password);
    setFieldErrors((prev) => ({
      ...prev,
      email: field === 'email' ? (emailErr || undefined) : prev.email,
      password: field === 'password' ? (passwordErr || undefined) : prev.password,
    }));
  };

  useEffect(() => {
    const err = new URLSearchParams(location.search).get('error');
    if (!err) return;

    if (err === 'google_auth_failed') toast.error('Google sign in failed');
    else if (err === 'no_email') toast.error('Google account has no email');
    else if (err === 'server_error') toast.error('Server error. Please try again.');
    else toast.error(err);
  }, [location.search, toast]);

  // NẾU ĐÃ ĐĂNG NHẬP RỒI, ÉP VỀ TRANG CHỦ (KHÔNG QUAY LẠI TRANG CŨ NỮA)
  React.useEffect(() => {
    if (isAuthenticated) navigate('/', { replace: true });
  }, [isAuthenticated, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    const emailErr = !email ? 'Email is required' : (validateEmail(email) === true ? '' : validateEmail(email));
    const passwordErr = validatePassword(password);

    if (emailErr || passwordErr) {
      setFieldErrors({
        ...(emailErr && { email: emailErr }),
        ...(passwordErr && { password: passwordErr }),
      });
      toast.warning(emailErr || passwordErr);
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back! Login successful.');
      
      // ==============================================================
      // ĐỢI 1.5 GIÂY (1500ms) ĐỂ ĐỌC THÔNG BÁO RỒI MỚI ĐÁ VỀ TRANG CHỦ
      // ==============================================================
      if(rememberMe) {
        localStorage.setItem('rememberedEmail', email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }

      setTimeout(() => {
        navigate('/', { replace: true });
      }, 1500); 

    } catch (err: any) {
      const msg = err.message || 'Login failed. Please try again.';
      setError(msg);
      toast.error(msg);
      setIsLoading(false); // Chỉ tắt loading nếu lỗi, nếu thành công thì cứ xoay loading cho đến lúc chuyển trang
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
                <label className="text-sm font-semibold text-background-dark dark:text-white/90 px-1">Email <span className="text-red-500">*</span></label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-background-dark/40 dark:text-white/30 group-focus-within:text-primary transition-colors">mail</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
                    }}
                    onBlur={() => handleBlur('email')}
                    className={`w-full pl-12 pr-4 py-3.5 rounded-lg border bg-background-light/50 dark:bg-background-dark/40 text-background-dark dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all ${
                      fieldErrors.email
                        ? 'border-red-500 dark:border-red-500'
                        : 'border-primary/20 dark:border-white/10'
                    }`}
                    placeholder="name@example.com"
                  />
                </div>
                {fieldErrors.email && (
                  <p className="text-xs text-red-500 dark:text-red-400 px-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">error</span>
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-background-dark dark:text-white/90 px-1">Password <span className="text-red-500">*</span></label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-background-dark/40 dark:text-white/30 group-focus-within:text-primary transition-colors">lock</span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }));
                    }}
                    onBlur={() => handleBlur('password')}
                    className={`w-full pl-12 pr-12 py-3.5 rounded-lg border bg-background-light/50 dark:bg-background-dark/40 text-background-dark dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all ${
                      fieldErrors.password
                        ? 'border-red-500 dark:border-red-500'
                        : 'border-primary/20 dark:border-white/10'
                    }`}
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
                {fieldErrors.password && (
                  <p className="text-xs text-red-500 dark:text-red-400 px-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">error</span>
                    {fieldErrors.password}
                  </p>
                )}
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

            <button
              type="button"
              onClick={() => (window.location.href = getGoogleAuthUrl())}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-6 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 hover:border-slate-300 dark:hover:border-white/20 transition-all shadow-sm hover:shadow"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Continue with Google</span>
            </button>
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