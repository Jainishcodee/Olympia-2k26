import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/utils/cn';

const SunIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-full h-full">
    <circle cx="12" cy="12" r="4.2" />
    <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.2 5.2l1.6 1.6M17.2 17.2l1.6 1.6M18.8 5.2l-1.6 1.6M6.8 17.2l-1.6 1.6" />
  </svg>
);

const MoonIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
    <path d="M20.6 14.4A8.8 8.8 0 0 1 9.6 3.4a8.8 8.8 0 1 0 11 11Z" />
  </svg>
);

/**
 * Day / Night switch. Sits in the Navbar (desktop + mobile) and morphs
 * between a sun and a moon as the theme changes.
 */
export const ThemeToggle: React.FC<{ className?: string }> = ({ className }) => {
  const { theme, toggleTheme } = useTheme();
  const isDay = theme === 'day';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDay ? 'Switch to night theme' : 'Switch to day theme'}
      title={isDay ? 'Night theme' : 'Day theme'}
      className={cn(
        'group relative flex items-center gap-2 h-9 pl-2 pr-3 rounded-full border transition-colors duration-300',
        'border-line text-ink hover:border-accent hover:text-accent',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60',
        className,
      )}
    >
      <span className="relative w-[18px] h-[18px] block overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={theme}
            initial={{ y: 14, opacity: 0, rotate: -60 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            exit={{ y: -14, opacity: 0, rotate: 60 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 block"
          >
            {isDay ? <SunIcon /> : <MoonIcon />}
          </motion.span>
        </AnimatePresence>
      </span>

      <span className="hidden sm:block text-[10px] font-black tracking-[0.18em] uppercase">
        {isDay ? 'Day' : 'Night'}
      </span>
    </button>
  );
};

export default ThemeToggle;
