import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';
import { FiLock, FiMail, FiEye, FiEyeOff, FiAlertCircle, FiArrowLeft, FiShield } from 'react-icons/fi';
import olympiaLogo from '@/assets/olympia.png';

const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<{ email?: string; password?: string }>({});

  const { signIn, isAdmin, user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  // If already authenticated with active admin privileges, redirect immediately
  useEffect(() => {
    if (!authLoading && user && !user.isAnonymous && isAdmin) {
      navigate('/admin', { replace: true });
    }
  }, [user, isAdmin, authLoading, navigate]);

  const validateEmail = (value: string) => {
    if (!value.trim()) return 'Administrator email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return 'Enter a valid email address';
    return '';
  };

  const validatePassword = (value: string) => {
    if (!value) return 'Password is required';
    if (value.length < 6) return 'Password must be at least 6 characters';
    return '';
  };

  const handleBlur = (field: 'email' | 'password', value: string) => {
    const validator = field === 'email' ? validateEmail : validatePassword;
    setFormErrors((prev) => ({ ...prev, [field]: validator(value) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);

    if (emailError || passwordError) {
      setFormErrors({ email: emailError, password: passwordError });
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await signIn(email.trim(), password);
      // Upon successful authentication & admin verification, navigate with replace to prevent back-button loops
      navigate('/admin', { replace: true });
    } catch (err: any) {
      let message = 'Failed to authenticate.';
      const code = err.code || '';
      if (
        code === 'auth/user-not-found' ||
        code === 'auth/wrong-password' ||
        code === 'auth/invalid-credential'
      ) {
        message = 'Invalid administrator credentials. Please check your email and password.';
      } else if (code === 'auth/invalid-email') {
        message = 'Invalid email address format.';
      } else if (code === 'auth/too-many-requests') {
        message = 'Too many failed attempts. Access is temporarily suspended for security.';
      } else if (err.message) {
        message = err.message;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const inputVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#F8FAFC] via-[#EEF4FA] to-[#E5EDF6] text-slate-800 flex flex-col justify-between selection:bg-[#D9A441] selection:text-[#071426]">
      {/* --- Light Mode Ambient Atmosphere & Radiance --- */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {/* Soft Electric Blue upper aura */}
        <div
          className="absolute -top-[20%] -right-[15%] w-[650px] h-[650px] rounded-full blur-[140px]"
          style={{ background: 'radial-gradient(circle, rgba(18, 100, 255, 0.12) 0%, transparent 70%)' }}
        />
        {/* Soft Olympia Gold lower-left aura */}
        <div
          className="absolute -bottom-[20%] -left-[15%] w-[600px] h-[600px] rounded-full blur-[140px]"
          style={{ background: 'radial-gradient(circle, rgba(217, 164, 65, 0.14) 0%, transparent 70%)' }}
        />
        {/* Digital arena light grid pattern */}
        <div className="absolute inset-0 opacity-[0.035] bg-[radial-gradient(#071426_1px,transparent_1px)] [background-size:24px_24px]" />
      </div>

      {/* --- Top Navigation Bar with Return to Public Arena --- */}
      <header className="relative z-20 w-full px-6 py-6 sm:px-10 flex items-center justify-between">
        <Link
          to="/"
          className="group inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-[#071426]/70 hover:text-[#1264FF] transition-colors"
        >
          <FiArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          <span>Return to Public Arena</span>
        </Link>

        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
          <FiShield className="h-3.5 w-3.5 text-[#1264FF]" />
          <span className="hidden sm:inline">Secure 256-Bit Link</span>
        </div>
      </header>

      {/* --- Main Card Stage --- */}
      <main className="relative z-10 flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="sm:mx-auto sm:w-full sm:max-w-md"
        >
          {/* Brand Logo & Titles */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1, type: 'spring', stiffness: 120 }}
              className="flex justify-center mb-5"
            >
              <div className="relative p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-[0_8px_30px_rgba(217,164,65,0.2)]">
                <img
                  src={olympiaLogo}
                  alt="Olympia 2K26"
                  className="h-14 w-auto object-contain drop-shadow-[0_2px_12px_rgba(217,164,65,0.45)]"
                />
              </div>
            </motion.div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#071426]">
              OLYMPIA <span className="text-[#D9A441]">2K26</span>
            </h1>
            <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1264FF]/10 border border-[#1264FF]/20 text-[11px] font-black uppercase tracking-[0.22em] text-[#1264FF]">
              <span>SPORTS SECRETARY & ADMIN</span>
            </div>
            <p className="mt-2 text-xs font-medium text-slate-500">
              Authorized personnel and festival officials access only
            </p>
          </div>

          {/* Frosted Light Mode Login Card */}
          <div className="relative rounded-3xl overflow-hidden bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-[0_25px_60px_-15px_rgba(7,20,38,0.08),0_1px_3px_rgba(0,0,0,0.04)]">
            {/* Top gold & blue racing stripe */}
            <div className="h-1.5 w-full bg-gradient-to-r from-[#1264FF] via-[#D9A441] to-[#FFD21F]" />

            <div className="p-7 sm:p-9">
              <form className="space-y-5" onSubmit={handleSubmit} noValidate>
                {/* Error Banner */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="flex items-start gap-3 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 shadow-xs"
                    >
                      <FiAlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                      <p className="text-xs sm:text-sm font-semibold leading-relaxed">{error}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Email Field */}
                <motion.div variants={inputVariants}>
                  <label htmlFor="email" className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                    Official Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <FiMail className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onBlur={() => handleBlur('email', email)}
                      disabled={loading}
                      placeholder="secretary@olympia.com"
                      className={cn(
                        'w-full pl-10 pr-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                        'bg-slate-50/80 border border-slate-200 text-slate-900 placeholder-slate-400',
                        'focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1264FF]/15 focus:border-[#1264FF]',
                        'disabled:opacity-50 disabled:cursor-not-allowed',
                        formErrors.email && 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/15'
                      )}
                    />
                  </div>
                  <AnimatePresence>
                    {formErrors.email && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="mt-1.5 text-xs text-rose-600 font-semibold flex items-center gap-1"
                      >
                        <FiAlertCircle className="h-3.5 w-3.5 shrink-0" />
                        {formErrors.email}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* Password Field */}
                <motion.div variants={inputVariants}>
                  <div className="flex items-center justify-between mb-2">
                    <label htmlFor="password" className="block text-xs font-black uppercase tracking-wider text-slate-700">
                      Security Password
                    </label>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <FiLock className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onBlur={() => handleBlur('password', password)}
                      disabled={loading}
                      placeholder="••••••••••••"
                      className={cn(
                        'w-full pl-10 pr-11 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                        'bg-slate-50/80 border border-slate-200 text-slate-900 placeholder-slate-400',
                        'focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1264FF]/15 focus:border-[#1264FF]',
                        'disabled:opacity-50 disabled:cursor-not-allowed',
                        formErrors.password && 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/15'
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={loading}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 transition-colors focus:outline-none"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                    </button>
                  </div>
                  <AnimatePresence>
                    {formErrors.password && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="mt-1.5 text-xs text-rose-600 font-semibold flex items-center gap-1"
                      >
                        <FiAlertCircle className="h-3.5 w-3.5 shrink-0" />
                        {formErrors.password}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* Submit Action Button */}
                <div className="pt-2">
                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className={cn(
                      'w-full py-3.5 px-6 rounded-xl font-black text-xs sm:text-sm tracking-[0.16em] uppercase text-[#071426] transition-all duration-200 shadow-[0_8px_25px_rgba(217,164,65,0.35)] hover:shadow-[0_12px_32px_rgba(217,164,65,0.5)] cursor-pointer',
                      'bg-gradient-to-r from-[#D9A441] via-[#FFE27A] to-[#D9A441]',
                      'disabled:opacity-60 disabled:cursor-not-allowed'
                    )}
                  >
                    <span className="flex items-center justify-center gap-2">
                      {loading ? (
                        <>
                          <svg className="animate-spin h-4 w-4 text-[#071426]" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                          </svg>
                          <span>Verifying Credentials...</span>
                        </>
                      ) : (
                        <>
                          <span>Sign In to Admin Console</span>
                          <span className="text-base leading-none">→</span>
                        </>
                      )}
                    </span>
                  </motion.button>
                </div>
              </form>
            </div>
          </div>
        </motion.div>
      </main>

      {/* --- Footer Note --- */}
      <footer className="relative z-10 py-5 text-center text-[11px] font-semibold text-slate-400">
        <p>Olympia 2K26 Digital Arena Operations • Protected by Firebase Security Rules</p>
      </footer>
    </div>
  );
};

export default AdminLogin;
