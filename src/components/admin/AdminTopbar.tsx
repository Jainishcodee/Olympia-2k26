import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/contexts/ThemeContext';
import { lookupAdminTitle } from './adminNav';
import { FiMenu, FiChevronsLeft, FiChevronsRight, FiExternalLink, FiCpu, FiSun, FiMoon, FiRadio } from 'react-icons/fi';
import { cn } from '@/utils/cn';

interface Props {
  onMenu: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

/** Operational top bar — status, section context and global destinations. */
const AdminTopbar: React.FC<Props> = ({ onMenu, collapsed, onToggleCollapse }) => {
  const { pathname } = useLocation();
  const { admin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isDay = theme === 'day';
  const { title, section } = lookupAdminTitle(pathname);

  const iconBtn =
    'rounded-lg border border-transparent p-1.5 text-ink-muted transition-colors hover:border-line hover:bg-surface-soft hover:text-ink cursor-pointer';

  return (
    <header className="z-20 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-line bg-surface/85 px-3 backdrop-blur-xl md:h-16 md:px-5">
      <div className="flex min-w-0 items-center gap-2">
        <button type="button" onClick={onMenu} aria-label="Open navigation" className={cn(iconBtn, 'md:hidden')}>
          <FiMenu className="h-5 w-5" />
        </button>

        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={cn(iconBtn, 'hidden md:block')}
        >
          {collapsed ? <FiChevronsRight className="h-4 w-4" /> : <FiChevronsLeft className="h-4 w-4" />}
        </button>

        <div className="ml-1 min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <span className="hidden text-[9.5px] font-black uppercase tracking-[0.24em] text-gold-ink sm:block">
              {section}
            </span>
            <span className="hidden text-line-strong sm:block">/</span>
            <span className="truncate font-display text-[13px] font-bold tracking-tight text-ink md:text-[14.5px]">
              {title}
            </span>
            {admin?.displayName && (
              <span className="hidden truncate text-[11px] font-semibold text-ink-faint lg:block">
                · {admin.displayName}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right controls & live status badge */}
      <div className="flex shrink-0 items-center gap-2 md:gap-2.5">
        {/* Day / Night Theme Switcher */}
        <motion.button
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.95 }}
          type="button"
          onClick={toggleTheme}
          title={isDay ? 'Switch to Night Mode' : 'Switch to Day Mode'}
          aria-label={isDay ? 'Switch to Night Mode' : 'Switch to Day Mode'}
          className="flex h-8.5 w-8.5 cursor-pointer items-center justify-center rounded-lg border border-line bg-surface-2 text-ink-muted shadow-xs transition-colors hover:border-line-strong hover:text-ink"
        >
          {isDay ? <FiMoon className="h-4 w-4" /> : <FiSun className="h-4 w-4 text-amber-300" />}
        </motion.button>

        {/* System Pulse */}
        <div className="hidden items-center gap-1.5 rounded-full border border-line bg-surface-2 px-2.5 py-1 text-ink-muted md:flex">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-70" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </span>
          <span className="text-[9.5px] font-black uppercase tracking-[0.16em]">Sync active</span>
        </div>

        {/* Scoring Simulator quick link */}
        <Link
          to="/admin/scoring-simulator"
          className="hidden items-center gap-1.5 rounded-lg border border-line bg-surface-2 px-3 py-1.5 text-[12px] font-semibold text-ink-muted shadow-xs transition-colors hover:border-line-strong hover:text-ink lg:flex"
        >
          <FiCpu className="h-3.5 w-3.5 text-[#1264FF]" />
          <span>Formula Sandbox</span>
        </Link>

        {/* Public Arena Link */}
        <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}>
          <Link
            to="/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 rounded-lg border border-[#1264FF] bg-[#1264FF] px-3 py-1.5 text-[12px] font-semibold text-white shadow-[0_1px_2px_rgba(18,100,255,0.35)] transition-colors hover:bg-[#0E55DE]"
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
