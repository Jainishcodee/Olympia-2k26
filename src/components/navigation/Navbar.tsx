import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/utils/cn';
import { MobileMenu } from './MobileMenu';
import { ThemeToggle } from './ThemeToggle';
import { useTheme } from '@/contexts/ThemeContext';
import { Magnetic } from '@/components/motion';
import { BRAND } from '@/components/arena/BrandAssets';

const NAV_ITEMS = [
  { label: 'ARENA', href: '/' },
  { label: 'LIVE', href: '/live' },
  { label: 'MATCHES', href: '/matches' },
  { label: 'SPORTS', href: '/sports' },
  { label: 'LEADERBOARD', href: '/leaderboard' },
  { label: 'RESULTS', href: '/results' },
];

export const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { theme } = useTheme();
  const isDay = theme === 'day';
  const isHome = location.pathname === '/';

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
            ? isDay ? "bg-white/80 backdrop-blur-xl border-[#071426]/10 py-3 shadow-[0_18px_50px_-30px_rgba(7,20,38,0.18)]" : "bg-[#080A0D]/90 backdrop-blur-xl border-white/5 py-3 shadow-[0_18px_50px_-30px_rgba(0,0,0,0.9)]"
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
          {/* Left side - OLYMPIA brand mark */}
          <Link to="/" className="z-50 relative group flex items-center">
            <motion.div
              animate={{ opacity: (!isHome || isScrolled) ? 1 : 0, x: (!isHome || isScrolled) ? 0 : -15 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center gap-2.5"
            >
              <img src={isDay ? BRAND.logoLight : BRAND.logoDark} alt="Olympia 2K26" className="h-8 w-auto object-contain" />
              <span
                className={cn("text-lg md:text-xl font-black tracking-[0.2em] transition-colors", isDay ? "text-[#071426]" : "text-white")}
              >
                OLYMPIA
              </span>
            </motion.div>
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
                    isActive ? (isDay ? "text-[#071426]" : "text-white") : (isDay ? "text-[#071426]/55 group-hover:text-[#071426]" : "text-white/60 group-hover:text-white")
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
            
            <button
              className={cn("z-50 relative p-2", isDay ? "text-[#071426]" : "text-white")}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <div className="w-6 h-5 flex flex-col justify-between">
                <span className={cn("w-full h-0.5 transition-transform origin-left", isDay ? "bg-[#071426]" : "bg-white", mobileMenuOpen && "rotate-45 translate-x-1")} />
                <span className={cn("w-full h-0.5 transition-opacity", isDay ? "bg-[#071426]" : "bg-white", mobileMenuOpen && "opacity-0")} />
                <span className={cn("w-full h-0.5 transition-transform origin-left", isDay ? "bg-[#071426]" : "bg-white", mobileMenuOpen && "-rotate-45 translate-x-1")} />
              </div>
            </button>
          </motion.div>

          {/* Desktop right actions */}
          <div className="hidden lg:flex items-center gap-4">
            <ThemeToggle className="!pr-2" />
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
