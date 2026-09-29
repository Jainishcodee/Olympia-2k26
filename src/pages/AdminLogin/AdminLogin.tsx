import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/config/firebase';
import { FiLock, FiMail, FiEye, FiEyeOff, FiAlertCircle } from 'react-icons/fi';

const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<{ email?: string; password?: string }>({});
  
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  const validateEmail = (value: string) => {
    if (!value) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Enter a valid email address';
    return '';
  };

  const validatePassword = (value: string) => {
    if (!value) return 'Password is required';
    if (value.length < 6) return 'Password must be at least 6 characters';
    return '';
  };

  const handleBlur = (field: 'email' | 'password', value: string) => {
    const validator = field === 'email' ? validateEmail : validatePassword;
    setFormErrors(prev => ({ ...prev, [field]: validator(value) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    
    if (emailError || passwordError) {
      setFormErrors({ email: emailError, password: passwordError });
      return;
    }
    
    if (!auth) {
      setError('Firebase auth not configured. Check your .env file.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/admin');
    } catch (err: any) {
      let message = 'Failed to login';
      if (err.code === 'auth/user-not-found') message = 'No account found with this email';
      else if (err.code === 'auth/wrong-password') message = 'Incorrect password';
      else if (err.code === 'auth/invalid-email') message = 'Invalid email format';
      else if (err.code === 'auth/too-many-requests') message = 'Too many attempts. Please try again later';
      else if (err.message) message = err.message;
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const inputVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    error: { x: [-5, 5, -5, 5, 0], transition: { duration: 0.3 } },
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: '#071426' }}>
      {/* Animated background */}
      <div className="absolute inset-0" aria-hidden="true">
        <motion.div
          className="absolute -top-1/2 -right-1/2 w-[600px] h-[600px] rounded-full blur-[150px]"
          style={{ background: 'radial-gradient(circle, #1264FF40 0%, transparent 70%)' }}
          animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-1/2 -left-1/2 w-[500px] h-[500px] rounded-full blur-[150px]"
          style={{ background: 'radial-gradient(circle, #D9A44140 0%, transparent 70%)' }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23ffffff%22 fill-opacity=%220.02%22%3E%3Cpath d=%22M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2v-4h4v-2h-4z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative z-10"
      >
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          {/* Logo */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1, type: 'spring', stiffness: 100, damping: 15 }}
            className="flex justify-center"
          >
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 rounded-2xl" style={{ background: 'linear-gradient(135deg, #1264FF 0%, #D9A441 100%)' }} />
              <div className="absolute inset-1.5 rounded-[1.1rem] bg-[#071426]" />
              <div className="relative w-full h-full rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0B1B33 0%, #071426 100%)' }}>
                <span className="text-4xl font-black tracking-[0.1em]" style={{ color: '#D9A441' }}>O</span>
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[8px] font-bold uppercase tracking-[0.3em]" style={{ color: '#1264FF' }}>2K26</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-8 text-center"
          >
            <h1 className="text-3xl font-black tracking-tight text-white">OLYMPIA 2K26</h1>
            <p className="mt-2 text-sm font-medium" style={{ color: '#D9A441' }}>Admin Dashboard Portal</p>
            <p className="mt-1 text-xs text-slate-500">Secure access to operations center</p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-8 sm:mx-auto sm:w-full sm:max-w-md"
        >
          <div className="relative rounded-2xl overflow-hidden" style={{ 
            background: 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05) inset'
          }}>
            {/* Top accent bar */}
            <div className="absolute top-0 left-0 right-0 h-1" style={{ 
              background: 'linear-gradient(90deg, #1264FF 0%, #D9A441 50%, #1264FF 100%)' 
            }} />
            
            <div className="p-8 sm:p-10">
              <form className="space-y-6" onSubmit={handleSubmit} noValidate>
                {/* Error alert */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-start gap-3 p-4 rounded-xl"
                      style={{ 
                        background: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: '#fecaca'
                      }}
                    >
                      <FiAlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
                      <p className="text-sm leading-relaxed">{error}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                  {/* Email field */}
                  <motion.div variants={inputVariants}>
                    <label htmlFor="email" className="block text-sm font-semibold text-white mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <FiMail className="h-5 w-5 text-slate-500" />
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
                        className={cn(
                          'w-full pl-12 pr-4 py-3.5 rounded-xl text-white placeholder-slate-500 transition-all duration-200',
                          'bg-white/5 border border-white/10',
                          'focus:outline-none focus:ring-2 focus:ring-[#1264FF]/20 focus:border-[#1264FF]',
                          'disabled:opacity-50 disabled:cursor-not-allowed',
                          formErrors.email && 'border-red-400/50 focus:border-red-400 focus:ring-red-400/20'
                        )}
                        placeholder="admin@olympia.com"
                      />
                    </div>
                    <AnimatePresence>
                      {formErrors.email && (
                        <motion.p
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          className="mt-2 text-sm text-red-400 flex items-center gap-1"
                        >
                          <FiAlertCircle className="h-3.5 w-3.5" />
                          {formErrors.email}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </motion.div>

                  {/* Password field */}
                  <motion.div variants={inputVariants}>
                    <label htmlFor="password" className="block text-sm font-semibold text-white mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <FiLock className="h-5 w-5 text-slate-500" />
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
                        className={cn(
                          'w-full pl-12 pr-12 py-3.5 rounded-xl text-white placeholder-slate-500 transition-all duration-200',
                          'bg-white/5 border border-white/10',
                          'focus:outline-none focus:ring-2 focus:ring-[#1264FF]/20 focus:border-[#1264FF]',
                          'disabled:opacity-50 disabled:cursor-not-allowed',
                          formErrors.password && 'border-red-400/50 focus:border-red-400 focus:ring-red-400/20'
                        )}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={loading}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-white transition-colors"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
                      </button>
                    </div>
                    <AnimatePresence>
                      {formErrors.password && (
                        <motion.p
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          className="mt-2 text-sm text-red-400 flex items-center gap-1"
                        >
                          <FiAlertCircle className="h-3.5 w-3.5" />
                          {formErrors.password}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </motion.div>

                  {/* Submit button */}
                  <motion.button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 px-6 rounded-xl font-semibold text-base text-[#071426] transition-all duration-200 relative overflow-hidden group"
                    style={{ 
                      background: 'linear-gradient(135deg, #D9A441 0%, #FFD21F 100%)',
                      boxShadow: '0 4px 20px rgba(217, 164, 65, 0.3)'
                    }}
                    whileHover={{ scale: 1.01, boxShadow: '0 8px 30px rgba(217, 164, 65, 0.4)' }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <span className="relative flex items-center justify-center gap-2">
                      {loading ? (
                        <>
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                          </svg>
                          <span>Signing in...</span>
                        </>
                      ) : (
                        <>
                          <span>Sign in to Dashboard</span>
                          <motion.div
                            layoutId="arrow"
                            className="w-5 h-5 rounded-full flex items-center justify-center"
                            style={{ background: 'rgba(7, 20, 38, 0.2)' }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                          </motion.div>
                        </>
                      )}
                      </span>
                    </motion.button>

                    <p className="text-center text-xs text-slate-500">
                      By signing in, you agree to the <a href="#" className="text-[#1264FF] hover:underline">Terms of Service</a> and <a href="#" className="text-[#1264FF] hover:underline">Privacy Policy</a>
                    </p>
                </form>
              </div>

              {/* Footer links */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="mt-8 text-center"
              >
                <p className="text-xs text-slate-500">
                  Forgot password?{' '}
                  <a href="#" className="text-[#1264FF] hover:text-[#D9A441] font-medium transition-colors">
                    Reset it
                  </a>
                </p>
                <p className="mt-2 text-xs text-slate-600">
                  Need help? <a href="#" className="text-[#1264FF] hover:text-[#D9A441] font-medium transition-colors">Contact support</a>
                </p>
              </motion.div>
            </div>
          </motion.div>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
