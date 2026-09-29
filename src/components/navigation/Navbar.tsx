import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/utils/cn';
import { MobileMenu } from './MobileMenu';
import { ThemeToggle } from './ThemeToggle';
import { useAuth } from '@/hooks/useAuth';

const NAV_ITEMS = [
  { label: 'ARENA', href: '/' },
  { label: 'LIVE', href: '/live' },
  { label: 'MATCHES', href: '/matches' },
  { label: 'SPORTS', href: '/sports' },
  { label: 'TOURNAMENTS', href: '/tournaments' },
  { label: 'LEADERBOARD', href: '/leaderboard' },
  { label: 'RESULTS', href: '/results' },
];

export const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { isAdmin, isLoading: authLoading } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.9, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-500 border-b border-transparent",
          isScrolled
            ? "bg-[#080A0D]/90 backdrop-blur-xl border-white/5 py-3 shadow-[0_18px_50px_-30px_rgba(0,0,0,0.9)]"
            : "bg-transparent py-6"
        )}
      >
        {/* metallic hairline that lights up as soon as you leave the top */}
        <motion.span
          aria-hidden
          initial={false}
          animate={{ scaleX: isScrolled ? 1 : 0, opacity: isScrolled ? 1 : 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-x-0 bottom-0 h-px origin-left"
          style={{ background: 'linear-gradient(90deg, rgba(18,100,255,0) 0%, #D9A441 35%, #FFD21F 60%, rgba(18,100,255,0) 100%)' }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          {/* Left side - OLYMPIA wordmark only on scroll */}
          <Link to="/" className="z-50 relative group flex items-center">
            <motion.span
              className="text-xl md:text-2xl font-black tracking-[0.2em] text-white/60 group-hover:text-white transition-colors"
              style={{ letterSpacing: '0.2em' }}
              animate={{ opacity: isScrolled ? 1 : 0, x: isScrolled ? 0 : -20 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              OLYMPIA
            </motion.span>
          </Link>

          {/* Desktop Nav */}
          <motion.div
            className="hidden lg:flex items-center space-x-8"
            initial="hide"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.06, delayChildren: 0.45 } } }}
          >
            {NAV_ITEMS.map((item) => {
              const isActive = location.pathname === item.href || 
                              (item.href !== '/' && location.pathname.startsWith(item.href));
              
              return (
                <motion.div
                  key={item.label}
                  variants={{ hide: { opacity: 0, y: -14 }, show: { opacity: 1, y: 0 } }}
                  transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                >
                <Link to={item.href} className="relative py-2 group block">
                  <span className={cn(
                    "text-sm font-bold tracking-widest transition-colors",
                    isActive ? "text-white" : "text-white/60 group-hover:text-white"
                  )}>
                    {item.label}
                  </span>
                  <span
                    aria-hidden
                    className="absolute -bottom-0.5 left-0 h-px w-full origin-left scale-x-0 bg-[#D9A441] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-x-100"
                  />
                  {isActive && (
                    <motion.div
                      layoutId="navbar-indicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D9A441]"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                </Link>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Right side actions */}
          <motion.div
            className="flex items-center gap-4 lg:hidden"
            initial="hide"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.06, delayChildren: 0.45 } } }}
          >
            <ThemeToggle className="!pr-2" />
            
            {/* Admin button - mobile */}
            {!authLoading && (
              <Link 
                to={isAdmin ? '/admin' : '/admin/login'} 
                className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-full transition-all duration-300 flex items-center gap-2"
                style={{ 
                  background: isAdmin ? 'linear-gradient(135deg, #1264FF, #1747B8)' : 'linear-gradient(135deg, #D9A441, #FFD21F)',
                  color: isAdmin ? '#071426' : '#071426',
                  boxShadow: isAdmin ? '0 4px 20px #1264FF40' : '0 4px 20px #D9A44140'
                }}
              >
                <span className="flex items-center gap-1">
                  {isAdmin ? '⚙️' : '🔐'}
                  {isAdmin ? 'Admin' : 'Admin Login'}
                </span>
              </Link>
            )}
            
            <button
              className="z-50 relative text-white p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <div className="w-6 h-5 flex flex-col justify-between">
                <span className={cn("w-full h-0.5 bg-white transition-transform origin-left", mobileMenuOpen && "rotate-45 translate-x-1")} />
                <span className={cn("w-full h-0.5 bg-white transition-opacity", mobileMenuOpen && "opacity-0")} />
                <span className={cn("w-full h-0.5 bg-white transition-transform origin-left", mobileMenuOpen && "-rotate-45 translate-x-1")} />
              </div>
            </button>
          </motion.div>

          {/* Desktop right actions */}
          <div className="hidden lg:flex items-center gap-4">
            <ThemeToggle className="!pr-2" />
            
            {/* Admin button - desktop */}
            {!authLoading && (
              <Link 
                to={isAdmin ? '/admin' : '/admin/login'} 
                className="px-5 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-full transition-all duration-300 flex items-center gap-2 group relative overflow-hidden"
                style={{ 
                  background: isAdmin ? 'linear-gradient(135deg, #1264FF, #1747B8)' : 'linear-gradient(135deg, #D9A441, #FFD21F)',
                  color: isAdmin ? '#071426' : '#071426',
                  boxShadow: isAdmin ? '0 4px 20px #1264FF40' : '0 4px 20px #D9A44140'
                }}
              >
                <motion.span
                  initial={false}
                  whileHover={{ scale: 1.1 }}
                  className="flex items-center gap-1"
                >
                  {isAdmin ? '⚙️' : '🔐'}
                  {isAdmin ? 'Dashboard' : 'Admin Login'}
                </motion.span>
                <motion.span
                  className="absolute inset-0 bg-white/20 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300"
                />
              </Link>
            )}
          </div>
        </div>
      </motion.nav>
       
      <AnimatePresence>
        {mobileMenuOpen && (
          <MobileMenu 
            items={NAV_ITEMS} 
            onClose={() => setMobileMenuOpen(false)} 
            currentPath={location.pathname} 
          />
        )}
      </AnimatePresence>
    </>
  );
};
