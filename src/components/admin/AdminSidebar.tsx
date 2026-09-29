import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';
import { useAuth } from '@/hooks/useAuth';
import { ADMIN_NAV } from './adminNav';
import { FiX, FiLogOut } from 'react-icons/fi';

interface Props {
  /** Mobile drawer visibility */
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  /** Tablet / desktop icon-only collapse */
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

const AdminSidebar: React.FC<Props> = ({ isOpen, setIsOpen, collapsed, setCollapsed }) => {
  const navigate = useNavigate();
  const { user, admin, signOut } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
    } finally {
      navigate('/admin/login');
    }
  };

  const initials = (user?.email ?? 'A').replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase() || 'AD';

  return (
    <>
      {/* Mobile drawer scrim */}
      <div
        aria-hidden
        onClick={() => setIsOpen(false)}
        className={cn(
          'fixed inset-0 z-30 bg-slate-950/50 transition-opacity duration-200 md:hidden',
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      />

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-[264px] flex-col bg-[#071426] text-slate-300 transition-[width,transform] duration-200 ease-out',
          'md:static md:z-auto md:translate-x-0',
          collapsed && 'md:w-[76px]',
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        )}
      >
        {/* ------------------------------------------------------- brand */}
        <div
          className={cn(
            'flex h-16 shrink-0 items-center gap-3 border-b border-white/10 px-4',
            collapsed && 'md:justify-center md:px-0',
          )}
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#D9A441] text-base font-black text-[#071426]">
            O
          </span>
          <span className={cn('min-w-0 flex-1', collapsed && 'md:hidden')}>
            <span className="block truncate text-[13px] font-black tracking-[0.18em] text-[#D9A441]">
              OLYMPIA 2K26
            </span>
            <span className="block truncate text-[10px] font-bold uppercase tracking-[0.28em] text-slate-500">
              Admin Control
            </span>
          </span>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            aria-label="Close navigation"
            className="rounded p-1 text-slate-500 transition-colors hover:text-white md:hidden"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        {/* -------------------------------------------------------- nav */}
        <nav className="flex-1 overflow-y-auto px-2.5 py-4">
          {ADMIN_NAV.map((group) => (
            <div key={group.label} className="mb-5 last:mb-0">
              <h3
                className={cn(
                  'mb-1.5 px-2.5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600',
                  collapsed && 'md:text-center md:px-0',
                )}
              >
                {group.label}
              </h3>
              <ul className="space-y-0.5">
                {group.items.map((item) => (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      end={item.end}
                      title={collapsed ? item.label : undefined}
                      onClick={() => setIsOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          'relative flex items-center gap-3 rounded-md px-2.5 py-2 text-[13px] font-semibold transition-colors duration-150',
                          collapsed && 'md:justify-center md:px-0',
                          isActive
                            ? 'bg-[#1264FF]/12 text-[#FFD21F]'
                            : 'text-slate-400 hover:bg-white/5 hover:text-slate-100',
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && (
                            <motion.span
                              layoutId="sidebar-active-indicator"
                              transition={{ type: 'spring', stiffness: 520, damping: 42 }}
                              className="absolute inset-y-1 left-0 w-[3px] rounded-r-full bg-[#D9A441]"
                            />
                          )}
                          <item.icon
                            className={cn(
                              'h-[18px] w-[18px] shrink-0',
                              collapsed && 'md:mr-0',
                            )}
                            aria-hidden
                          />
                          <span className={cn('truncate', collapsed && 'md:hidden')}>{item.label}</span>
                        </>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* ----------------------------------------------------- profile */}
        <div className="shrink-0 border-t border-white/10 p-3">
          <div
            className={cn(
              'flex items-center gap-3 rounded-md bg-white/[0.04] px-2.5 py-2.5',
              collapsed && 'md:justify-center md:px-0',
            )}
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1264FF] text-[11px] font-black text-white">
              {initials}
            </span>
            <span className={cn('min-w-0 flex-1', collapsed && 'md:hidden')}>
              <span className="block truncate text-[12px] font-bold text-slate-100">
                {admin?.displayName || user?.displayName || user?.email || 'Administrator'}
              </span>
              <span className="block truncate text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                {admin?.role ?? 'admin'}
              </span>
            </span>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            title="Log out"
            className={cn(
              'mt-2 flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-[12px] font-bold uppercase tracking-wider text-slate-500 transition-colors hover:bg-white/5 hover:text-red-400',
              collapsed && 'md:justify-center md:px-0',
            )}
          >
            <FiLogOut className="h-4 w-4 shrink-0" aria-hidden />
            <span className={cn(collapsed && 'md:hidden')}>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
