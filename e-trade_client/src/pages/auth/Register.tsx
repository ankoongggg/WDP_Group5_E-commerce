import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import ThemeToggle from '../../components/ThemeToggle';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [street, setStreet] = useState('');
  const [district, setDistrict] = useState('');
  const [city, setCity] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    if (isAuthenticated) navigate('/', { replace: true });
  }, [isAuthenticated, navigate]);

  const getPasswordStrength = () => {
    if (!password) return { level: 0, label: '', color: '' };
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 2) return { level: 1, label: 'Weak', color: 'bg-red-400' };
    if (score <= 3) return { level: 2, label: 'Medium', color: 'bg-yellow-400' };
    return { level: 3, label: 'Strong', color: 'bg-green-500' };
  };

  const strength = getPasswordStrength();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name || !email || !password) {
      toast.warning('Please fill in all fields');
      return;
    }
    if (!phone || !street || !district || !city) {
      toast.warning('Phone and address (street, district, city) are required');
      return;
    }
    if (password.length < 6) {
      toast.warning('Password must be at least 6 characters');
      return;
    }
    if (!agreeTerms) {
      toast.warning('You must agree to the Terms of Service');
      return;
    }

    setIsLoading(true);
    try {
      await register(name, email, password, phone, street, district, city);
      toast.success('Account created successfully! Welcome aboard.');
      navigate('/', { replace: true });
    } catch (err: any) {
      const msg = err.message || 'Registration failed. Please try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark flex flex-col lg:flex-row">
      {/* Left Banner */}
      <div className="relative hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-primary overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-20">
             <div className="absolute inset-0 bg-gradient-to-br from-black via-transparent to-transparent"></div>
             <img src="https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=2070&auto=format&fit=crop" className="h-full w-full object-cover" />
        </div>
        <div className="relative z-10 flex items-center gap-3 text-white">
          <span className="material-symbols-outlined text-4xl">shopping_basket</span>
          <h2 className="text-2xl font-black tracking-tight">ShopModern</h2>
        </div>
        <div className="relative z-10 text-white max-w-md">
           <h1 className="text-5xl font-black mb-6 leading-tight">Elevate your shopping experience.</h1>
           <p className="text-xl opacity-90 font-medium">Join over 2 million shoppers and get access to exclusive weekly drops.</p>
           <div className="mt-12 flex items-center gap-6">
             <div className="flex -space-x-3">
               <img className="h-10 w-10 rounded-full border-2 border-primary object-cover" src="https://randomuser.me/api/portraits/women/44.jpg" />
               <img className="h-10 w-10 rounded-full border-2 border-primary object-cover" src="https://randomuser.me/api/portraits/men/32.jpg" />
               <img className="h-10 w-10 rounded-full border-2 border-primary object-cover" src="https://randomuser.me/api/portraits/women/68.jpg" />
             </div>
             <p className="text-sm font-semibold italic">"The best decision for my wardrobe this year!"</p>
           </div>
        </div>
      </div>

      {/* Right Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 lg:p-20">
         <div className="w-full max-w-md">
            <div className="mb-10">
               <div className="flex items-center justify-between mb-4">
                 <div>
                   <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-1">Create your account</h2>
                   <p className="text-slate-500 dark:text-slate-400">Join our community for exclusive deals.</p>
                 </div>
                 <ThemeToggle size="sm" />
               </div>
            </div>

            {error && (
              <div className="mb-5 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3">
                <span className="material-symbols-outlined text-red-500">error</span>
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}
            
            <form onSubmit={handleRegister} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Full Name</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">person</span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all dark:text-white"
                    placeholder="John Doe"
                  />
                </div>
              </div>
              
               <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Email</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">mail</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all dark:text-white"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Phone</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">phone</span>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all dark:text-white"
                    placeholder="0123 456 789"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Street</label>
                  <input type="text" value={street} onChange={e => setStreet(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none dark:text-white" placeholder="Street" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">District</label>
                    <input type="text" value={district} onChange={e => setDistrict(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none dark:text-white" placeholder="District" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">City</label>
                    <input type="text" value={city} onChange={e => setCity(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none dark:text-white" placeholder="City" />
                  </div>
                </div>
              </div>

               <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Password</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">lock</span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all dark:text-white"
                    placeholder="••••••••"
                  />
                </div>
                {password && (
                  <>
                    <div className="mt-2 flex gap-1 h-1 w-full">
                      <div className={`flex-1 rounded-full ${strength.level >= 1 ? strength.color : 'bg-slate-200 dark:bg-slate-700'}`}></div>
                      <div className={`flex-1 rounded-full ${strength.level >= 2 ? strength.color : 'bg-slate-200 dark:bg-slate-700'}`}></div>
                      <div className={`flex-1 rounded-full ${strength.level >= 3 ? strength.color : 'bg-slate-200 dark:bg-slate-700'}`}></div>
                    </div>
                    <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mt-1">{strength.label} Strength</p>
                  </>
                )}
              </div>

              <div className="flex items-start gap-3 py-2">
                 <input
                   type="checkbox"
                   checked={agreeTerms}
                   onChange={(e) => setAgreeTerms(e.target.checked)}
                   className="h-5 w-5 rounded border-slate-300 text-primary focus:ring-primary mt-0.5"
                 />
                 <label className="text-sm font-medium text-slate-600 dark:text-slate-400">I agree to the Terms of Service and Privacy Policy</label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 px-6 rounded-lg transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    Create Account <span className="material-symbols-outlined text-lg">arrow_forward</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-10 pt-8 border-t border-slate-100 dark:border-slate-800 text-center">
               <p className="text-slate-600 dark:text-slate-400 text-sm">
                 Already have an account? <Link to="/login" className="text-primary font-bold hover:underline ml-1">Log In</Link>
               </p>
            </div>
         </div>
      </div>
    </div>
  );
};

export default Register;
