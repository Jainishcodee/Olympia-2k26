import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { lookupAdminTitle } from './adminNav';
import { FiMenu, FiChevronsLeft, FiChevronsRight, FiExternalLink, FiCpu, FiRadio } from 'react-icons/fi';

interface Props {
  onMenu: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

/**
 * High-Class Cyber-Luxury Operational Bar.
 */
const AdminTopbar: React.FC<Props> = ({ onMenu, collapsed, onToggleCollapse }) => {
  const { pathname } = useLocation();
  const { user, admin } = useAuth();
  const { title, section } = lookupAdminTitle(pathname);

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-white/10 bg-[#060E1C]/80 px-4 backdrop-blur-2xl md:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenu}
          aria-label="Open navigation"
          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/10 hover:text-white md:hidden"
        >
          <FiMenu className="h-5 w-5" />
        </button>

        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="hidden rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/10 hover:text-white md:block"
        >
          {collapsed ? <FiChevronsRight className="h-4 w-4" /> : <FiChevronsLeft className="h-4 w-4" />}
        </button>

        <div className="ml-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="hidden text-[10px] font-black uppercase tracking-[0.24em] text-[#D9A441] sm:block">
              {section}
            </span>
            <span className="hidden text-slate-600 sm:block">/</span>
            <span className="truncate text-xs md:text-sm font-bold text-white tracking-wide">{title}</span>
          </div>
        </div>
      </div>

      {/* Right controls & live status badge */}
      <div className="flex items-center gap-3 md:gap-4">
        {/* System Pulse */}
        <div className="hidden items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-3 py-1 text-[11px] font-bold tracking-wider text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.2)] md:flex">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="uppercase text-[10px]">SYNC ACTIVE</span>
        </div>

        {/* Scoring Simulator quick link */}
        <Link
          to="/admin/scoring-simulator"
          className="hidden items-center gap-1.5 rounded-lg border border-[#D9A441]/30 bg-[#D9A441]/10 px-3 py-1.5 text-xs font-black uppercase tracking-wider text-[#FFD21F] transition-all hover:bg-[#D9A441]/20 hover:border-[#D9A441]/50 lg:flex"
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
