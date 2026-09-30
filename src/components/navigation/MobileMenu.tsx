import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { cn } from '@/utils/cn';
import { useTheme } from '@/contexts/ThemeContext';
import { FiX, FiSun, FiMoon } from 'react-icons/fi';
import olympiaLogo from '@/assets/olympia.png';

interface MobileMenuProps {
  items: { label: string; href: string; }[];
  onClose: () => void;
  currentPath: string;
}

export const MobileMenu: React.FC<MobileMenuProps> = ({ items, onClose, currentPath }) => {
  const { theme, toggleTheme } = useTheme();
  const isDay = theme === 'day';

  return (
    <motion.div
      initial={{ opacity: 0, clipPath: 'circle(0% at 100% 0)' }}
      animate={{ opacity: 1, clipPath: 'circle(150% at 100% 0)' }}
      exit={{ opacity: 0, clipPath: 'circle(0% at 100% 0)' }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'fixed inset-0 z-50 flex flex-col justify-between px-6 pt-safe pb-safe backdrop-blur-3xl transition-colors duration-300',
        isDay
          ? 'bg-[#F7F6F1]/98 text-slate-900'
          : 'bg-[#080A0D]/98 text-white'
      )}
    >
      {/* Top Bar with Brand & Close Button */}
      <div className="flex items-center justify-between pt-4 pb-2 border-b border-black/5 dark:border-white/10">
        <div className="flex items-center gap-2.5">
          <img src={olympiaLogo} alt="Olympia 2K26" className="h-8 w-auto object-contain" />
          <span className="text-xs font-black uppercase tracking-[0.2em]">
            OLYMPIA <span className={isDay ? 'text-[#1264FF]' : 'text-[#D9A441]'}>2K26</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-xl border transition-all active:scale-90',
              isDay
                ? 'border-slate-200 bg-white text-slate-700 shadow-sm'
                : 'border-white/10 bg-white/5 text-[#FFD21F]'
            )}
          >
            {isDay ? <FiMoon className="h-4 w-4" /> : <FiSun className="h-4 w-4" />}
          </button>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-xl border transition-all active:scale-90',
              isDay
                ? 'border-slate-200 bg-white text-slate-900 shadow-sm'
                : 'border-white/10 bg-white/5 text-white'
            )}
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Nav Links Stack */}
      <div className="relative flex flex-col space-y-4 my-auto py-6">
        {items.map((item, i) => {
          const isActive =
            currentPath === item.href || (item.href !== '/' && currentPath.startsWith(item.href));

          return (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 + 0.15, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <Link
                to={item.href}
                onClick={onClose}
                className={cn(
                  'text-3xl sm:text-4xl font-black uppercase tracking-tight transition-all block py-1.5 flex items-center justify-between group active:scale-95',
                  isActive
                    ? isDay
                      ? 'text-[#1264FF]'
                      : 'text-[#D9A441]'
                    : isDay
                    ? 'text-slate-800 hover:text-[#1264FF]'
                    : 'text-slate-200 hover:text-[#D9A441]'
                )}
              >
                <span>{item.label}</span>
                {isActive && (
                  <span className="text-sm font-bold tracking-widest px-2.5 py-0.5 rounded-full border border-current text-[10px]">
                    ACTIVE
                  </span>
                )}
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* Footer Info */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="pt-4 border-t border-black/5 dark:border-white/10 flex items-center justify-between text-[11px] font-bold tracking-widest uppercase opacity-60"
      >
        <span>Digital Arena Experience</span>
        <span>2026</span>
      </motion.div>
    </motion.div>
  );
};

export default MobileMenu;
