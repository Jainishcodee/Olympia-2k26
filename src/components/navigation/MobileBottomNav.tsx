import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';
import { useTheme } from '@/contexts/ThemeContext';
import { useCollection } from '@/hooks/useCollection';
import type { Match } from '@/types';
import {
  HiOutlineHome,
  HiOutlineCalendarDays,
  HiOutlineTrophy,
  HiOutlineSquares2X2,
} from 'react-icons/hi2';
import { FiRadio } from 'react-icons/fi';

interface NavItem {
  id: string;
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  isLiveTab?: boolean;
}

const ITEMS: NavItem[] = [
  { id: 'arena', label: 'Arena', to: '/', icon: HiOutlineHome },
  { id: 'live', label: 'Live', to: '/live', icon: FiRadio, isLiveTab: true },
  { id: 'matches', label: 'Matches', to: '/matches', icon: HiOutlineCalendarDays },
  { id: 'leaderboard', label: 'Rankings', to: '/leaderboard', icon: HiOutlineTrophy },
  { id: 'sports', label: 'Sports', to: '/sports', icon: HiOutlineSquares2X2 },
];

export const MobileBottomNav: React.FC = () => {
  const { pathname } = useLocation();
  const { theme } = useTheme();
  const isDay = theme === 'day';

  // Check if any match is currently live
  const matches = useCollection<Match>('matches');
  const hasLiveMatches = matches.data.some((m) => m.status === 'live');

  // Hide on admin routes
  if (pathname.startsWith('/admin')) return null;

  return (
    <aside
      aria-label="Mobile Navigation Dock"
      className="fixed bottom-0 inset-x-0 z-50 pointer-events-none flex justify-center pb-safe pt-2 px-3 lg:hidden"
    >
      <nav
        className={cn(
          'pointer-events-auto w-full max-w-md rounded-2xl border px-2 py-1.5 backdrop-blur-2xl shadow-2xl transition-all duration-300',
          isDay
            ? 'bg-[#FAF6EC]/92 border-[#071426]/12 shadow-[0_12px_40px_rgba(7,20,38,0.14)] text-slate-800'
            : 'bg-[#060E1C]/92 border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.85)] text-slate-200',
        )}
      >
        <ul className="flex items-center justify-around gap-1">
          {ITEMS.map((item) => {
            const isActive =
              item.to === '/'
                ? pathname === '/'
                : pathname === item.to || pathname.startsWith(`${item.to}/`);
            const Icon = item.icon;

            return (
              <li key={item.id} className="relative flex-1">
                <NavLink
                  to={item.to}
                  className={cn(
                    'group relative flex flex-col items-center justify-center py-1.5 px-2 rounded-xl text-center transition-all duration-200 active:scale-90',
                    isActive
                      ? isDay
                        ? 'text-slate-950 font-black'
                        : 'text-white font-black'
                      : isDay
                      ? 'text-slate-500 hover:text-slate-900 font-semibold'
                      : 'text-slate-400 hover:text-white font-semibold',
                  )}
                >
                  {/* Active Indicator Background Pill */}
                  {isActive && (
                    <motion.div
                      layoutId="mobile-bottom-nav-active"
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                      className={cn(
                        'absolute inset-0 rounded-xl -z-10',
                        isDay
                          ? 'bg-white shadow-sm border border-slate-200/80'
                          : 'bg-gradient-to-b from-[#1264FF]/25 to-white/[0.06] border border-white/10 shadow-[0_0_15px_rgba(18,100,255,0.25)]',
                      )}
                    />
                  )}

                  {/* Icon with Live Pulsing Badge */}
                  <div className="relative mb-0.5">
                    <Icon
                      className={cn(
                        'h-5 w-5 transition-transform duration-200 group-hover:scale-110',
                        isActive
                          ? isDay
                            ? 'text-[#1264FF]'
                            : 'text-[#D9A441]'
                          : 'opacity-80',
                      )}
                    />

                    {item.isLiveTab && hasLiveMatches && (
                      <span className="absolute -top-1 -right-1.5 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF4D3D] opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#FF4D3D] shadow-[0_0_8px_#FF4D3D]" />
                      </span>
                    )}
                  </div>

                  {/* Label */}
                  <span
                    className={cn(
                      'text-[10px] tracking-wider uppercase leading-none transition-colors truncate max-w-full',
                      isActive
                        ? isDay
                          ? 'text-slate-950 font-black'
                          : 'text-white font-black'
                        : 'opacity-85',
                    )}
                  >
                    {item.label}
                  </span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
};

export default MobileBottomNav;
