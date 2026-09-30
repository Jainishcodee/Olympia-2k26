import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/contexts/ThemeContext';
import { ADMIN_NAV } from './adminNav';
import { FiX, FiLogOut } from 'react-icons/fi';
import olympiaLogo from '@/assets/olympia.png';

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
  const { theme } = useTheme();
  const isDay = theme === 'day';

  const handleLogout = async () => {
    try {
      await signOut();
    } finally {
      navigate('/admin/login', { replace: true });
    }
  };

  const initials = (admin?.displayName || user?.email || 'A')
    .replace(/[^a-zA-Z]/g, '')
    .slice(0, 2)
    .toUpperCase() || 'AD';

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
          'fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col transition-[width,transform,background-color,border-color] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
          'md:static md:z-auto md:translate-x-0',
          isDay
            ? 'border-r border-slate-200 bg-[#FCFBFA]/95 text-slate-700 shadow-xl shadow-slate-900/5 backdrop-blur-2xl'
            : 'border-r border-white/10 bg-[#060E1C]/95 text-slate-300 backdrop-blur-2xl',
          collapsed && 'md:w-[84px]',
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        )}
      >
        {/* ------------------------------------------------------- brand */}
        <div
          className={cn(
            'flex h-18 shrink-0 items-center gap-3 px-5 transition-colors',
            isDay
              ? 'border-b border-slate-200 bg-slate-50/60'
              : 'border-b border-white/10 bg-white/[0.02]',
            collapsed && 'md:justify-center md:px-0',
          )}
        >
          <div className="relative flex shrink-0 items-center justify-center">
            <img
              src={olympiaLogo}
              alt="Olympia 2K26"
              className={cn(
                'h-10 w-auto object-contain transition-transform duration-300 hover:scale-105',
                isDay
                  ? 'drop-shadow-[0_2px_10px_rgba(217,164,65,0.45)]'
                  : 'drop-shadow-[0_0_14px_rgba(217,164,65,0.55)]',
              )}
            />
          </div>
          <div className={cn('min-w-0 flex-1', collapsed && 'md:hidden')}>
            <span
              className={cn(
                'block truncate text-sm font-black tracking-[0.16em]',
                isDay ? 'text-slate-900' : 'text-white',
              )}
            >
              OLYMPIA <span className={isDay ? 'text-[#A9761B]' : 'text-[#D9A441]'}>2K26</span>
            </span>
            <span
              className={cn(
                'block truncate text-[10px] font-black uppercase tracking-[0.24em]',
                isDay ? 'text-[#1264FF]' : 'text-[#1264FF]',
              )}
            >
              COMMAND CENTER
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            aria-label="Close navigation"
            className={cn(
              'rounded-lg p-1.5 transition-colors md:hidden',
              isDay ? 'text-slate-500 hover:bg-slate-100 hover:text-slate-900' : 'text-slate-400 hover:bg-white/10 hover:text-white',
            )}
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        {/* -------------------------------------------------------- nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-5 hide-scrollbar">
          {ADMIN_NAV.map((group) => (
            <div key={group.label} className="mb-6 last:mb-0">
              <h3
                className={cn(
                  'mb-2 px-3 text-[10px] font-black uppercase tracking-[0.24em]',
                  isDay ? 'text-slate-400' : 'text-slate-500',
                  collapsed && 'md:text-center md:px-0',
                )}
              >
                {group.label}
              </h3>
              <ul className="space-y-1">
                {group.items.map((item) => (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      end={item.end}
                      title={collapsed ? item.label : undefined}
                      onClick={() => setIsOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          'relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold tracking-wide transition-all duration-200 group overflow-hidden',
                          collapsed && 'md:justify-center md:px-0',
                          isActive
                            ? isDay
                              ? 'bg-[#1264FF]/10 text-[#1264FF] border border-[#1264FF]/30 shadow-xs font-black'
                              : 'bg-gradient-to-r from-[#D9A441]/20 via-[#1264FF]/10 to-transparent text-[#FFD21F] border border-[#D9A441]/35 shadow-[0_0_20px_rgba(217,164,65,0.18)] font-black'
                            : isDay
                              ? 'text-slate-600 hover:bg-slate-100/90 hover:text-slate-950 border border-transparent'
                              : 'text-slate-400 hover:bg-white/[0.05] hover:text-white border border-transparent',
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && (
                            <motion.span
                              layoutId="sidebar-active-indicator"
                              transition={{ type: 'spring', stiffness: 480, damping: 36 }}
                              className={cn(
                                'absolute inset-y-1.5 left-0 w-[3.5px] rounded-r-full',
                                isDay
                                  ? 'bg-[#1264FF] shadow-[0_0_8px_#1264FF]'
                                  : 'bg-[#D9A441] shadow-[0_0_10px_#D9A441]',
                              )}
                            />
                          )}
                          <item.icon
                            className={cn(
                              'h-4.5 w-4.5 shrink-0 transition-transform duration-200 group-hover:scale-110',
                              isActive
                                ? isDay
                                  ? 'text-[#1264FF]'
                                  : 'text-[#FFD21F] drop-shadow-[0_0_8px_#D9A441]'
                                : isDay
                                  ? 'text-slate-400 group-hover:text-slate-900'
                                  : 'text-slate-400 group-hover:text-white',
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
        <div
          className={cn(
            'shrink-0 p-3.5 transition-colors',
            isDay ? 'border-t border-slate-200 bg-slate-50/70' : 'border-t border-white/10 bg-black/20',
          )}
        >
          <div
            className={cn(
              'flex items-center gap-3 rounded-xl p-2.5 backdrop-blur-md transition-colors',
              isDay
                ? 'border border-slate-200/90 bg-white shadow-xs'
                : 'border border-white/10 bg-[#0B1A30]/80',
              collapsed && 'md:justify-center md:p-2',
            )}
          >
            <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#1264FF] to-[#071426] text-xs font-black text-white shadow-[0_0_12px_rgba(18,100,255,0.5)] border border-blue-400/40">
              {initials}
              <span className={cn(
                'absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 shadow-[0_0_6px_#10B981]',
                isDay ? 'border-white' : 'border-[#060E1C]',
              )} />
            </div>
            
            <div className={cn('min-w-0 flex-1', collapsed && 'md:hidden')}>
              <span
                className={cn(
                  'block truncate text-xs font-black',
                  isDay ? 'text-slate-900' : 'text-white',
                )}
              >
                {admin?.displayName || user?.displayName || user?.email?.split('@')[0] || 'Administrator'}
              </span>
              <span
                className={cn(
                  'block truncate text-[10px] font-bold uppercase tracking-wider',
                  isDay ? 'text-[#A9761B]' : 'text-[#D9A441]',
                )}
              >
                {admin?.role?.replace('_', ' ') ?? 'SUPER ADMIN'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            title="Log out"
            className={cn(
              'mt-2.5 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-200',
              isDay
                ? 'text-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:border hover:border-rose-200'
                : 'text-slate-400 hover:bg-red-500/15 hover:text-red-400 hover:border hover:border-red-500/30',
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
