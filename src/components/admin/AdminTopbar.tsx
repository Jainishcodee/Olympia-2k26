import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/contexts/ThemeContext';
import { lookupAdminTitle } from './adminNav';
import { FiMenu, FiChevronsLeft, FiChevronsRight, FiExternalLink, FiCpu, FiRadio, FiSun, FiMoon } from 'react-icons/fi';
import { cn } from '@/utils/cn';

interface Props {
  onMenu: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

/**
 * High-Class Operational Bar supporting both Day & Night themes.
 */
const AdminTopbar: React.FC<Props> = ({ onMenu, collapsed, onToggleCollapse }) => {
  const { pathname } = useLocation();
  const { user, admin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isDay = theme === 'day';
  const { title, section } = lookupAdminTitle(pathname);

  return (
    <header
      className={cn(
        'flex h-16 shrink-0 items-center justify-between gap-3 px-4 transition-colors duration-300 md:px-6',
        isDay
          ? 'border-b border-slate-200 bg-[#FCFBFA]/90 text-slate-800 backdrop-blur-xl shadow-xs'
          : 'border-b border-white/10 bg-[#060E1C]/80 text-white backdrop-blur-2xl',
      )}
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenu}
          aria-label="Open navigation"
          className={cn(
            'rounded-lg p-2 transition-colors md:hidden',
            isDay ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-900' : 'text-slate-400 hover:bg-white/10 hover:text-white',
          )}
        >
          <FiMenu className="h-5 w-5" />
        </button>

        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={cn(
            'hidden rounded-lg p-2 transition-colors md:block',
            isDay ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-900' : 'text-slate-400 hover:bg-white/10 hover:text-white',
          )}
        >
          {collapsed ? <FiChevronsRight className="h-4 w-4" /> : <FiChevronsLeft className="h-4 w-4" />}
        </button>

        <div className="ml-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'hidden text-[10px] font-black uppercase tracking-[0.24em] sm:block',
                isDay ? 'text-[#A9761B]' : 'text-[#D9A441]',
              )}
            >
              {section}
            </span>
            <span className={isDay ? 'hidden text-slate-300 sm:block' : 'hidden text-slate-600 sm:block'}>/</span>
            <span
              className={cn(
                'truncate text-xs md:text-sm font-bold tracking-wide',
                isDay ? 'text-slate-900' : 'text-white',
              )}
            >
              {title}
            </span>
          </div>
        </div>
      </div>

      {/* Right controls & live status badge */}
      <div className="flex items-center gap-2.5 md:gap-3.5">
        {/* Day / Night Theme Switcher */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="button"
          onClick={toggleTheme}
          title={isDay ? 'Switch to Night Mode' : 'Switch to Day Mode'}
          aria-label={isDay ? 'Switch to Night Mode' : 'Switch to Day Mode'}
          className={cn(
            'flex h-8.5 w-8.5 items-center justify-center rounded-lg border transition-colors cursor-pointer',
            isDay
              ? 'border-slate-200 bg-white text-slate-700 shadow-2xs hover:bg-slate-50'
              : 'border-slate-700 bg-slate-800 text-slate-300 shadow-2xs hover:bg-slate-700 hover:text-white',
          )}
        >
          {isDay ? <FiMoon className="h-4 w-4 text-slate-700" /> : <FiSun className="h-4 w-4 text-amber-300" />}
        </motion.button>

        {/* System Pulse */}
        <div
          className={cn(
            'hidden items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-medium tracking-wide md:flex transition-colors',
            isDay
              ? 'border-slate-200 bg-slate-50 text-slate-600'
              : 'border-slate-700/80 bg-slate-800/80 text-slate-400',
          )}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <span className="uppercase text-[9px] tracking-wider">SYNC ACTIVE</span>
        </div>

        {/* Scoring Simulator quick link */}
        <Link
          to="/admin/scoring-simulator"
          className={cn(
            'hidden items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium tracking-wide transition-colors lg:flex',
            isDay
              ? 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-2xs'
              : 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white shadow-2xs',
          )}
        >
          <FiCpu className="h-3.5 w-3.5 text-blue-500" />
          <span>Formula Sandbox</span>
        </Link>

        {/* Public Arena Link */}
        <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}>
          <Link
            to="/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 rounded-lg border border-blue-600 bg-blue-600 hover:bg-blue-500 px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs transition-colors"
          >
            <FiRadio className="h-3.5 w-3.5" />
            <span>Public Arena</span>
            <FiExternalLink className="h-3 w-3 opacity-70" />
          </Link>
        </motion.div>
      </div>
    </header>
  );
};

export default AdminTopbar;
