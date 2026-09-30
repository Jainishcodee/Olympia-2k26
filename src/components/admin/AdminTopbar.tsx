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
            'flex h-9 w-9 items-center justify-center rounded-xl border transition-all duration-200',
            isDay
              ? 'border-slate-200 bg-white text-slate-700 shadow-xs hover:border-[#1264FF]/40 hover:text-[#1264FF]'
              : 'border-white/10 bg-[#0B1A30]/80 text-[#FFD21F] shadow-[0_0_15px_rgba(217,164,65,0.15)] hover:border-[#D9A441]/40 hover:bg-[#0B1A30]',
          )}
        >
          {isDay ? <FiMoon className="h-4 w-4 text-slate-700" /> : <FiSun className="h-4 w-4 text-[#FFD21F]" />}
        </motion.button>

        {/* System Pulse */}
        <div
          className={cn(
            'hidden items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-bold tracking-wider md:flex transition-colors',
            isDay
              ? 'border-emerald-500/30 bg-emerald-50 text-emerald-700'
              : 'border-emerald-500/30 bg-emerald-950/40 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.2)]',
          )}
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="uppercase text-[10px]">SYNC ACTIVE</span>
        </div>

        {/* Scoring Simulator quick link */}
        <Link
          to="/admin/scoring-simulator"
          className={cn(
            'hidden items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-black uppercase tracking-wider transition-all lg:flex',
            isDay
              ? 'border-[#D9A441]/50 bg-[#FFF7E6] text-[#A9761B] hover:bg-[#FFEEC7]'
              : 'border-[#D9A441]/30 bg-[#D9A441]/10 text-[#FFD21F] hover:bg-[#D9A441]/20 hover:border-[#D9A441]/50',
          )}
        >
          <FiCpu className="h-3.5 w-3.5" />
          Formula Sandbox
        </Link>

        {/* Public Arena Link */}
        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          <Link
            to="/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 rounded-lg border border-blue-500/40 bg-gradient-to-r from-[#1264FF] to-[#1747B8] px-3.5 py-1.5 text-xs font-black uppercase tracking-wider text-white shadow-[0_0_15px_rgba(18,100,255,0.4)] transition-all hover:shadow-[0_0_22px_rgba(18,100,255,0.6)]"
          >
            <FiRadio className="h-3.5 w-3.5 animate-pulse" />
            <span>Public Arena</span>
            <FiExternalLink className="h-3 w-3 opacity-70" />
          </Link>
        </motion.div>
      </div>
    </header>
  );
};

export default AdminTopbar;
