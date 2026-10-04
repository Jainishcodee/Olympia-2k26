import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';
import { useAuth } from '@/hooks/useAuth';
import { ADMIN_NAV } from './adminNav';
import { FiX, FiLogOut } from 'react-icons/fi';
import { useThemeLogo } from '@/components/arena/BrandAssets';

interface Props {
  /** Mobile drawer visibility */
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  /** Tablet / desktop icon-only collapse */
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

const AdminSidebar: React.FC<Props> = ({ isOpen, setIsOpen, collapsed }) => {
  const navigate = useNavigate();
  const { user, admin, signOut } = useAuth();
  const logo = useThemeLogo();

  const handleLogout = async () => {
    try {
      await signOut();
    } finally {
      navigate('/admin/login', { replace: true });
    }
  };

  const initials =
    (admin?.displayName || user?.email || 'A').replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase() || 'AD';

  return (
    <>
      {/* Mobile drawer scrim */}
      <div
        aria-hidden
        onClick={() => setIsOpen(false)}
        className={cn(
          'fixed inset-0 z-40 bg-black/70 backdrop-blur-sm transition-opacity duration-300 md:hidden',
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      />

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-[268px] flex-col border-r border-line bg-surface/97 text-ink-muted shadow-[8px_0_30px_rgba(7,20,38,0.10)] backdrop-blur-xl transition-[width,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
          'md:static md:z-auto md:translate-x-0',
          collapsed && 'md:w-[78px]',
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        )}
      >
        {/* ------------------------------------------------------- brand */}
        <div
          className={cn(
            'flex h-16 shrink-0 items-center gap-3 border-b border-line bg-surface-soft/60 px-4 transition-colors',
            collapsed && 'md:justify-center md:px-0',
          )}
        >
          <div className="relative flex shrink-0 items-center justify-center">
            <img
              src={logo}
              alt="Olympia 2K26"
              className="h-9 w-auto object-contain transition-transform duration-300 hover:scale-105 drop-shadow-[0_2px_10px_rgba(217,164,65,0.35)]"
            />
          </div>
          <div className={cn('min-w-0 flex-1', collapsed && 'md:hidden')}>
            <span className="block truncate font-display text-[13px] font-bold tracking-[0.14em] text-ink">
              OLYMPIA <span className="text-gold-ink">2K26</span>
            </span>
            <span className="mt-0.5 block truncate text-[9.5px] font-black uppercase tracking-[0.26em] text-[#1264FF]">
              Command Center
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            aria-label="Close navigation"
            className="rounded-lg p-1.5 text-ink-muted transition-colors hover:bg-surface-soft hover:text-ink md:hidden"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        {/* -------------------------------------------------------- nav */}
        <nav className="hide-scrollbar flex-1 overflow-y-auto px-2.5 py-4">
          {ADMIN_NAV.map((group) => (
            <div key={group.label} className="mb-5 last:mb-0">
              <h3
                className={cn(
                  'mb-1.5 px-2.5 text-[9.5px] font-black uppercase tracking-[0.24em] text-ink-faint',
                  collapsed && 'px-0 text-center md:px-0',
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
                          'group relative flex items-center gap-2.5 overflow-hidden rounded-lg border px-2.5 py-2 text-[12.5px] font-semibold tracking-tight transition-all duration-150',
                          collapsed && 'md:justify-center md:px-0',
                          isActive
                            ? 'border-[#1264FF]/25 bg-[#1264FF]/10 text-[#1264FF]'
                            : 'border-transparent text-ink-muted hover:bg-surface-soft hover:text-ink',
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && (
                            <motion.span
                              layoutId="sidebar-active-indicator"
                              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                              className="absolute inset-y-1.5 left-0 w-[3px] rounded-r-full bg-[#1264FF]"
                            />
                          )}
                          <item.icon
                            className={cn(
                              'h-4 w-4 shrink-0 transition-transform duration-150',
                              isActive ? 'text-[#1264FF]' : 'text-ink-faint group-hover:text-ink',
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
        <div className="shrink-0 border-t border-line bg-surface-soft/50 p-3">
          <div
            className={cn(
              'flex items-center gap-3 rounded-lg border border-line bg-surface-2 p-2.5',
              collapsed && 'md:justify-center md:p-2',
            )}
          >
            <div className="relative flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-md border border-[#1264FF]/40 bg-gradient-to-br from-[#1264FF] to-[#0B1B33] text-[11px] font-black text-white shadow-[0_0_12px_rgba(18,100,255,0.45)]">
              {initials}
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-surface-2 bg-emerald-500 shadow-[0_0_6px_#10B981]" />
            </div>

            <div className={cn('min-w-0 flex-1', collapsed && 'md:hidden')}>
              <span className="block truncate text-[12.5px] font-bold text-ink">
                {admin?.displayName || user?.displayName || user?.email?.split('@')[0] || 'Administrator'}
              </span>
              <span className="block truncate text-[9.5px] font-black uppercase tracking-[0.18em] text-gold-ink">
                {admin?.role?.replace('_', ' ') ?? 'Super Admin'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            title="Log out"
            className={cn(
              'mt-2 flex w-full items-center gap-2.5 rounded-lg border border-transparent px-3 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-ink-muted transition-all duration-150',
              'hover:border-rose-500/25 hover:bg-rose-500/10 hover:text-rose-500',
              collapsed && 'md:justify-center md:px-0',
            )}
          >
            <FiLogOut className="h-4 w-4 shrink-0" aria-hidden />
            <span className={cn(collapsed && 'md:hidden')}>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
