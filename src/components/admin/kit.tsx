import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';
import { useTheme } from '@/contexts/ThemeContext';
import { FiSearch, FiAlertTriangle, FiInbox, FiChevronRight } from 'react-icons/fi';

/* ============================================================================
 *  Olympia Admin — Dual-Theme Cyber-Luxury Sports Command Center Kit
 *
 *  Design language: UPSCALE · CINEMATIC · GLASSMORPHIC · ANIMATED · DUAL-THEMED
 *  Dynamically adapts to Day (Sandstone/Paper) and Night (Obsidian/Glass) themes.
 * ==========================================================================*/

/* ---------------------------------------------------------------- buttons */

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'warn';

export const Btn: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: Variant;
    size?: 'xs' | 'sm' | 'md';
    icon?: React.ReactNode;
    to?: string;
  }
> = ({ variant = 'secondary', size = 'sm', icon, to, className, children, ...rest }) => {
  const { theme } = useTheme();
  const isDay = theme === 'day';

  const variants: Record<Variant, string> = {
    primary: isDay
      ? 'bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white border border-blue-600 shadow-xs hover:shadow transition-colors font-semibold'
      : 'bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white border border-blue-500/50 shadow-xs hover:shadow transition-colors font-semibold',
    secondary: isDay
      ? 'bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200/90 shadow-2xs font-medium transition-colors'
      : 'bg-slate-800/80 hover:bg-slate-700/80 active:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/80 shadow-2xs font-medium backdrop-blur-md transition-colors',
    danger: isDay
      ? 'bg-rose-50 hover:bg-rose-100 active:bg-rose-200 text-rose-700 border border-rose-200/80 shadow-2xs font-medium transition-colors'
      : 'bg-rose-500/15 hover:bg-rose-500/25 active:bg-rose-500/35 text-rose-300 border border-rose-500/30 shadow-2xs font-medium transition-colors',
    warn: isDay
      ? 'bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white border border-amber-600/30 shadow-2xs font-semibold transition-colors'
      : 'bg-amber-500/20 hover:bg-amber-500/30 active:bg-amber-500/40 text-amber-200 border border-amber-500/40 shadow-2xs font-semibold transition-colors',
    ghost: isDay
      ? 'bg-transparent hover:bg-slate-100/80 active:bg-slate-200/80 text-slate-600 hover:text-slate-900 border border-transparent font-medium transition-colors'
      : 'bg-transparent hover:bg-slate-800/60 active:bg-slate-800 text-slate-400 hover:text-white border border-transparent font-medium transition-colors',
  };

  const classes = cn(
    'relative inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 whitespace-nowrap disabled:pointer-events-none disabled:opacity-40 cursor-pointer select-none',
    size === 'xs'
      ? 'h-8 px-2.5 text-xs rounded-md'
      : size === 'md'
        ? 'h-10 px-4 text-sm rounded-lg'
        : 'h-9 px-3.5 text-xs sm:text-[13px] rounded-lg',
    variants[variant],
    className,
  );

  const inner = (
    <>
      {icon && <span className="shrink-0 transition-transform duration-150">{icon}</span>}
      <span className="truncate">{children}</span>
    </>
  );

  if (to) {
    return (
      <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }} className="inline-block">
        <Link to={to} className={classes}>
          {inner}
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.button
      type="button"
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.98 }}
      className={classes}
      {...(rest as any)}
    >
      {inner}
    </motion.button>
  );
};

/* --------------------------------------------------------------- headers */

export interface Crumb {
  label: string;
  to?: string;
}

export const AdminHeader: React.FC<{
  title: string;
  subtitle?: string;
  breadcrumbs?: Crumb[];
  actions?: React.ReactNode;
  badge?: React.ReactNode;
}> = ({ title, subtitle, breadcrumbs, actions, badge }) => {
  const { theme } = useTheme();
  const isDay = theme === 'day';

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn(
        'mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-5 transition-colors border-b',
        isDay ? 'border-slate-200' : 'border-white/10',
      )}
    >
      <div className="min-w-0 flex-1">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav
            className={cn(
              'mb-1.5 flex flex-wrap items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider',
              isDay ? 'text-slate-500' : 'text-slate-400',
            )}
          >
            {breadcrumbs.map((crumb, index) => (
              <React.Fragment key={`${crumb.label}-${index}`}>
                {index > 0 && <FiChevronRight className="h-3 w-3 text-slate-400" />}
                {crumb.to ? (
                  <Link
                    to={crumb.to}
                    className={cn('transition-colors', isDay ? 'hover:text-blue-600' : 'hover:text-blue-400')}
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className={isDay ? 'text-slate-700' : 'text-slate-300'}>{crumb.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}
        <div className="flex flex-wrap items-center gap-2.5">
          <h1
            className={cn(
              'text-xl sm:text-2xl font-bold tracking-tight',
              isDay ? 'text-slate-900' : 'text-white',
            )}
          >
            {title}
          </h1>
          {badge}
        </div>
        {subtitle && (
          <p
            className={cn(
              'mt-1 max-w-3xl text-xs sm:text-sm font-normal leading-relaxed',
              isDay ? 'text-slate-500' : 'text-slate-400',
            )}
          >
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 w-full sm:w-auto mt-2 sm:mt-0 shrink-0">
          {actions}
        </div>
      )}
    </motion.div>
  );
};

/* ----------------------------------------------------------------- cards */

export const Card: React.FC<{
  title?: string;
  hint?: string;
  actions?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  flush?: boolean;
  glow?: 'gold' | 'blue' | 'none';
  children: React.ReactNode;
}> = ({ title, hint, actions, className, bodyClassName, flush, children }) => {
  const { theme } = useTheme();
  const isDay = theme === 'day';

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={cn(
        'relative rounded-xl border backdrop-blur-xl transition-all duration-200',
        isDay
          ? 'bg-white border-slate-200/90 shadow-2xs hover:border-slate-300/80 text-slate-900'
          : 'bg-slate-900/60 border-slate-800/80 shadow-sm hover:border-slate-700/80 text-slate-100',
        className,
      )}
    >
      {(title || actions) && (
        <header
          className={cn(
            'flex items-center justify-between gap-3 px-4 sm:px-5 py-3.5 transition-colors border-b',
            isDay
              ? 'border-slate-200/80 bg-slate-50/60'
              : 'border-slate-800/80 bg-slate-800/20',
          )}
        >
          <div className="min-w-0">
            <h2
              className={cn(
                'text-xs font-semibold uppercase tracking-wider flex items-center gap-2',
                isDay ? 'text-slate-700' : 'text-slate-300',
              )}
            >
              {title}
            </h2>
            {hint && (
              <p className={cn('mt-0.5 text-xs font-normal', isDay ? 'text-slate-500' : 'text-slate-400')}>{hint}</p>
            )}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={cn(flush ? '' : 'p-4 sm:p-5', bodyClassName)}>{children}</div>
    </motion.section>
  );
};

/* ----------------------------------------------------------- status pills */

const PILL_TONES: Record<string, string> = {
  live: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25',
  paused: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/25',
  scheduled: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/25',
  upcoming: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/25',
  completed: 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200/90 dark:border-slate-700/60',
  ongoing: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/25',
  finished: 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200/90 dark:border-slate-700/60',
  cancelled: 'bg-slate-100 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700/40',
  archived: 'bg-slate-100 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700/40',
  active: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25',
  inactive: 'bg-slate-100 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700/40',
  disabled: 'bg-slate-100 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700/40',
  open: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/25',
  closed: 'bg-slate-100 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700/40',
  hidden: 'bg-slate-100 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700/40',
  published: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25',
  draft: 'bg-slate-100 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700/40',
  featured: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25',
};

export const StatusPill: React.FC<{ value?: string; className?: string }> = ({ value, className }) => {
  if (!value) return null;
  const key = String(value).toLowerCase();
  const tone = PILL_TONES[key] ?? 'bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700/40';
  const live = key === 'live';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-0.5 text-[11px] font-semibold tracking-normal transition-colors',
        tone,
        className,
      )}
    >
      {live && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-500 opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-rose-600" />
        </span>
      )}
      {String(value)}
    </span>
  );
};

/* ------------------------------------------------------------- stat tiles */

export const StatTile: React.FC<{
  label: string;
  value: React.ReactNode;
  hint?: string;
  accent?: 'blue' | 'gold' | 'red' | 'slate' | 'green';
  isLoading?: boolean;
  icon?: React.ReactNode;
  to?: string;
}> = ({ label, value, hint, accent = 'blue', isLoading, icon, to }) => {
  const { theme } = useTheme();
  const isDay = theme === 'day';

  const iconTones = {
    blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    gold: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    red: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
    green: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    slate: 'bg-slate-500/10 text-slate-600 dark:text-slate-400',
  }[accent];

  const body = (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border p-4 sm:p-4.5 transition-all duration-200',
        isDay
          ? 'border-slate-200/90 bg-white shadow-2xs hover:shadow-xs hover:border-slate-300'
          : 'border-slate-800/80 bg-slate-900/60 backdrop-blur-xl shadow-2xs hover:border-slate-700/80',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className={cn(
            'block text-xs font-medium truncate',
            isDay ? 'text-slate-500' : 'text-slate-400',
          )}
        >
          {label}
        </span>
        {icon && (
          <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm transition-transform duration-150', iconTones)}>
            {icon}
          </span>
        )}
      </div>

      <div className="mt-2 flex items-baseline gap-2">
        <span
          className={cn(
            'text-2xl sm:text-3xl font-bold tabular-nums tracking-tight',
            isDay ? 'text-slate-900' : 'text-slate-100',
          )}
        >
          {isLoading ? (
            <span className={cn('inline-block h-8 w-14 animate-pulse rounded', isDay ? 'bg-slate-100' : 'bg-slate-800')} />
          ) : (
            value
          )}
        </span>
      </div>

      {hint && (
        <span className={cn('mt-1 block text-[11px] font-normal truncate', isDay ? 'text-slate-500' : 'text-slate-400')}>
          {hint}
        </span>
      )}
    </div>
  );

  return to ? (
    <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.99 }}>
      <Link to={to} className="block">
        {body}
      </Link>
    </motion.div>
  ) : (
    <motion.div whileHover={{ y: -1 }}>
      {body}
    </motion.div>
  );
};

/* ---------------------------------------------------------------- toolbar */

export const SearchInput: React.FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}> = ({ value, onChange, placeholder = 'Search…', className }) => {
  const { theme } = useTheme();
  const isDay = theme === 'day';

  return (
    <div className={cn('relative min-w-[200px]', className)}>
      <FiSearch className={cn('pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2', isDay ? 'text-slate-400' : 'text-slate-400')} />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          'h-10 w-full rounded-lg pl-9 pr-3 text-sm outline-none backdrop-blur-md transition-all duration-150',
          isDay
            ? 'border border-slate-200 bg-white text-slate-900 placeholder-slate-400 shadow-2xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500/25'
            : 'border border-slate-800 bg-slate-900/80 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/25',
        )}
      />
    </div>
  );
};

export const FilterSelect: React.FC<{
  value: string;
  onChange: (value: string) => void;
  label?: string;
  options: { value: string; label: string }[];
  className?: string;
}> = ({ value, onChange, label, options, className }) => {
  const { theme } = useTheme();
  const isDay = theme === 'day';

  return (
    <label className={cn('inline-flex items-center gap-2 w-full sm:w-auto', className)}>
      {label && (
        <span
          className={cn(
            'whitespace-nowrap text-[11px] font-semibold uppercase tracking-wider',
            isDay ? 'text-slate-500' : 'text-slate-400',
          )}
        >
          {label}
        </span>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'h-10 w-full sm:w-auto rounded-lg px-3 text-xs font-semibold outline-none backdrop-blur-md transition-all duration-150 cursor-pointer',
          isDay
            ? 'border border-slate-200 bg-white text-slate-800 shadow-2xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500/25'
            : 'border border-slate-800 bg-slate-900/80 text-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/25',
        )}
      >
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            className={isDay ? 'bg-white text-slate-900' : 'bg-slate-900 text-white'}
          >
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
};

export const Toolbar: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  const { theme } = useTheme();
  const isDay = theme === 'day';

  return (
    <div
      className={cn(
        'mb-5 flex flex-wrap items-center gap-2.5 sm:gap-3 rounded-xl p-2.5 sm:p-3 transition-colors border',
        isDay
          ? 'border-slate-200/90 bg-white/80 text-slate-800 shadow-2xs'
          : 'border-slate-800/80 bg-slate-900/60 backdrop-blur-md text-white shadow-2xs',
        className,
      )}
    >
      {children}
    </div>
  );
};

/* ------------------------------------------------------------------ tabs */

export interface TabItem {
  id: string;
  label: string;
  count?: number;
}

export const AdminTabs: React.FC<{
  items: TabItem[];
  active: string;
  onChange: (id: string) => void;
  layoutPrefix?: string;
}> = ({ items, active, onChange, layoutPrefix = 'admin-tab' }) => {
  const { theme } = useTheme();
  const isDay = theme === 'day';

  return (
    <div
      className={cn(
        'mb-6 flex gap-1.5 overflow-x-auto pb-px transition-colors no-scrollbar border-b',
        isDay ? 'border-slate-200' : 'border-slate-800',
      )}
    >
      {items.map((item) => {
        const isActive = item.id === active;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            className={cn(
              'relative flex items-center gap-2 whitespace-nowrap rounded-t-lg px-3.5 py-2.5 text-xs font-semibold tracking-wide transition-colors duration-150 cursor-pointer',
              isActive
                ? isDay
                  ? 'text-blue-600 bg-blue-50/50'
                  : 'text-blue-400 bg-blue-500/10'
                : isDay
                  ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40',
            )}
          >
            {item.label}
            {item.count !== undefined && (
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-[10px] font-semibold tabular-nums transition-colors',
                  isActive
                    ? isDay
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-blue-500/20 text-blue-300'
                    : isDay
                      ? 'bg-slate-100 text-slate-600'
                      : 'bg-slate-800 text-slate-400',
                )}
              >
                {item.count}
              </span>
            )}
            {isActive && (
              <motion.span
                layoutId={`${layoutPrefix}-indicator`}
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                className={cn(
                  'absolute inset-x-0 bottom-0 h-[2px]',
                  isDay ? 'bg-blue-600' : 'bg-blue-500',
                )}
              />
            )}
          </button>
        );
      })}
    </div>
  );
};

/* ------------------------------------------------------------- feedback */

export const ErrorNotice: React.FC<{ message: string; className?: string }> = ({ message, className }) => {
  const { theme } = useTheme();
  const isDay = theme === 'day';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'flex items-start gap-3 rounded-xl px-4 py-3.5 text-xs font-medium leading-relaxed backdrop-blur-md',
        isDay
          ? 'border border-red-200 bg-red-50 text-red-800 shadow-xs'
          : 'border border-red-500/30 bg-red-950/40 text-red-200 shadow-[0_0_20px_rgba(239,68,68,0.15)]',
        className,
      )}
    >
      <FiAlertTriangle className={cn('mt-0.5 h-4 w-4 shrink-0', isDay ? 'text-red-600' : 'text-red-400')} />
      <span>{message}</span>
    </motion.div>
  );
};

export const EmptyNotice: React.FC<{
  title?: string;
  message?: string;
  action?: React.ReactNode;
}> = ({ title = 'Nothing here yet', message, action }) => {
  const { theme } = useTheme();
  const isDay = theme === 'day';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'flex flex-col items-center justify-center rounded-xl px-6 py-16 text-center backdrop-blur-md transition-colors',
        isDay
          ? 'border border-slate-200/90 bg-white/70'
          : 'border border-white/10 bg-[#071426]/50',
      )}
    >
      <div
        className={cn(
          'mb-4 flex h-14 w-14 items-center justify-center rounded-full border transition-colors',
          isDay
            ? 'bg-slate-100 border-slate-200 text-[#A9761B]'
            : 'bg-white/5 border-white/10 text-[#D9A441] shadow-[0_0_20px_rgba(217,164,65,0.15)]',
        )}
      >
        <FiInbox className="h-6 w-6" />
      </div>
      <p className={cn('text-base font-black tracking-wide', isDay ? 'text-slate-900' : 'text-white')}>{title}</p>
      {message && (
        <p className={cn('mt-1.5 max-w-sm text-xs leading-relaxed', isDay ? 'text-slate-500' : 'text-slate-400')}>
          {message}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </motion.div>
  );
};

export const LoadingRows: React.FC<{ rows?: number; cols?: number }> = ({ rows = 6, cols = 5 }) => {
  const { theme } = useTheme();
  const isDay = theme === 'day';

  return (
    <div className={cn('divide-y', isDay ? 'divide-slate-100' : 'divide-white/5')}>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex items-center gap-4 px-4 py-3.5">
          {Array.from({ length: cols }).map((__, colIndex) => (
            <span
              key={colIndex}
              className={cn('h-3.5 animate-pulse rounded-md', isDay ? 'bg-slate-200' : 'bg-white/10')}
              style={{ width: `${((rowIndex + colIndex) % 4) * 15 + 20}%` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export const PageLoading: React.FC<{ label?: string }> = ({ label = 'Loading Arena…' }) => {
  const { theme } = useTheme();
  const isDay = theme === 'day';

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-slate-400">
      <div className="relative flex h-10 w-10 items-center justify-center">
        <span className="absolute h-full w-full animate-ping rounded-full bg-[#1264FF]/20" />
        <span className={cn('h-8 w-8 animate-spin rounded-full border-2 border-t-[#D9A441]', isDay ? 'border-slate-200' : 'border-white/10')} />
      </div>
      <span className={cn('text-xs font-black uppercase tracking-[0.2em]', isDay ? 'text-[#A9761B]' : 'text-[#D9A441]')}>{label}</span>
    </div>
  );
};

/* ------------------------------------------------------------ form bits */

export const FormSection: React.FC<{
  step?: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}> = ({ step, title, description, children, className }) => {
  const { theme } = useTheme();
  const isDay = theme === 'day';

  return (
    <div className={cn('border-b px-6 py-6 last:border-b-0', isDay ? 'border-slate-200' : 'border-white/10', className)}>
      <div className="mb-5 flex items-baseline gap-3">
        {step && (
          <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-[#D9A441] text-xs font-black text-[#071426] shadow-[0_0_10px_#D9A441]">
            {step}
          </span>
        )}
        <div className="min-w-0">
          <h3 className={cn('text-base font-black tracking-wide', isDay ? 'text-slate-900' : 'text-white')}>{title}</h3>
          {description && <p className={cn('mt-0.5 text-xs', isDay ? 'text-slate-500' : 'text-slate-400')}>{description}</p>}
        </div>
      </div>
      {children}
    </div>
  );
};

export const FormGrid: React.FC<{
  cols?: 1 | 2 | 3;
  children: React.ReactNode;
  className?: string;
}> = ({ cols = 2, children, className }) => (
  <div
    className={cn(
      'grid gap-5',
      cols === 1 && 'grid-cols-1',
      cols === 2 && 'sm:grid-cols-2',
      cols === 3 && 'sm:grid-cols-2 lg:grid-cols-3',
      className,
    )}
  >
    {children}
  </div>
);

export const Toggle: React.FC<{
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  hint?: string;
  disabled?: boolean;
}> = ({ checked, onChange, label, hint, disabled }) => {
  const { theme } = useTheme();
  const isDay = theme === 'day';

  return (
    <label
      className={cn(
        'flex items-start justify-between gap-4 py-3 rounded-lg px-3 transition-colors',
        isDay ? 'hover:bg-slate-100/50' : 'hover:bg-white/[0.02]',
        disabled ? 'opacity-40' : 'cursor-pointer',
      )}
    >
      <span className="min-w-0">
        <span className={cn('block text-sm font-bold', isDay ? 'text-slate-900' : 'text-white')}>{label}</span>
        {hint && <span className={cn('mt-0.5 block text-xs leading-relaxed', isDay ? 'text-slate-500' : 'text-slate-400')}>{hint}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-all duration-200 border',
          isDay ? 'border-slate-300' : 'border-white/20',
          checked
            ? isDay
              ? 'bg-[#1264FF] shadow-sm'
              : 'bg-[#D9A441] shadow-[0_0_12px_rgba(217,164,65,0.6)]'
            : isDay
              ? 'bg-slate-200'
              : 'bg-slate-800',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-4.5 w-4.5 rounded-full bg-white shadow-md transition-transform duration-200',
            checked ? 'translate-x-5' : 'translate-x-0.5',
          )}
        />
      </button>
    </label>
  );
};

/** Two-line definition row used across detail pages. */
export const MetaRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => {
  const { theme } = useTheme();
  const isDay = theme === 'day';

  return (
    <div
      className={cn(
        'flex items-baseline justify-between gap-4 py-3 border-b last:border-b-0',
        isDay ? 'border-slate-100' : 'border-white/5',
      )}
    >
      <dt className={cn('shrink-0 text-xs font-bold uppercase tracking-[0.16em]', isDay ? 'text-slate-500' : 'text-slate-400')}>
        {label}
      </dt>
      <dd className={cn('min-w-0 truncate text-right text-sm font-semibold', isDay ? 'text-slate-900' : 'text-white')}>
        {children}
      </dd>
    </div>
  );
};

/** Theme-aware action icon button used across admin tables. */
export const ActionIcon: React.FC<{
  label: string;
  onClick?: () => void;
  children: React.ReactNode;
  primary?: boolean;
  danger?: boolean;
  disabled?: boolean;
}> = ({ label, onClick, children, primary, danger, disabled }) => {
  const { theme } = useTheme();
  const isDay = theme === 'day';

  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.94 }}
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'flex h-8 w-8 min-w-[32px] sm:h-7.5 sm:w-7.5 items-center justify-center rounded-md border transition-colors disabled:opacity-40 cursor-pointer',
        primary
          ? 'border-blue-600 bg-blue-600 text-white hover:bg-blue-500 shadow-2xs'
          : danger
            ? isDay
              ? 'border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:border-rose-300'
              : 'border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 hover:border-rose-500/50'
            : isDay
              ? 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900 hover:bg-slate-50 shadow-2xs'
              : 'border-slate-700/80 bg-slate-800/80 text-slate-300 hover:border-slate-600 hover:text-white hover:bg-slate-700/80',
      )}
    >
      {children}
    </motion.button>
  );
};

