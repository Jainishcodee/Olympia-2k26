import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { lookupAdminTitle } from './adminNav';
import { FiMenu, FiChevronsLeft, FiChevronsRight, FiExternalLink } from 'react-icons/fi';

interface Props {
  onMenu: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

/**
 * Thin operational bar — section context and shell controls only. Per-page
 * titles live in `AdminHeader` so the content column stays scannable.
 */
const AdminTopbar: React.FC<Props> = ({ onMenu, collapsed, onToggleCollapse }) => {
  const { pathname } = useLocation();
  const { user, admin } = useAuth();
  const { title, section } = lookupAdminTitle(pathname);

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-slate-200 bg-white px-3 md:px-4">
      <button
        type="button"
        onClick={onMenu}
        aria-label="Open navigation"
        className="rounded-md p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 md:hidden"
      >
        <FiMenu className="h-5 w-5" />
      </button>

      <button
        type="button"
        onClick={onToggleCollapse}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className="hidden rounded-md p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900 md:block"
      >
        {collapsed ? <FiChevronsRight className="h-4 w-4" /> : <FiChevronsLeft className="h-4 w-4" />}
      </button>

      <div className="ml-1 min-w-0">
        <span className="hidden text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 sm:block">
          {section}
        </span>
        <span className="block truncate text-[13px] font-bold text-slate-800 sm:hidden">{title}</span>
      </div>

      <div className="ml-auto flex items-center gap-3">
        <Link
          to="/"
          className="hidden items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12px] font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 sm:flex"
        >
          <FiExternalLink className="h-3.5 w-3.5" />
          Public site
        </Link>
        <span className="hidden max-w-[180px] truncate border-l border-slate-200 pl-3 text-[12px] text-slate-500 md:block">
          {admin?.displayName || user?.email || 'Administrator'}
        </span>
      </div>
    </header>
  );
};

export default AdminTopbar;
