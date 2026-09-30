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
    primary:
      'bg-gradient-to-r from-[#1264FF] to-[#1747B8] text-white border border-blue-400/40 hover:from-[#1747B8] hover:to-[#1264FF] shadow-[0_0_20px_rgba(18,100,255,0.35)] hover:shadow-[0_0_28px_rgba(18,100,255,0.55)]',
    secondary: isDay
      ? 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 shadow-xs'
      : 'bg-[#0B1A30]/80 text-slate-200 border border-white/15 hover:bg-[#102442] hover:border-white/30 hover:text-white backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.2)]',
    danger: isDay
      ? 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 hover:border-red-300 shadow-xs'
      : 'bg-red-500/15 text-red-300 border border-red-500/30 hover:bg-red-500/25 hover:border-red-500/60 shadow-[0_0_15px_rgba(239,68,68,0.2)]',
    warn:
      'bg-gradient-to-r from-[#D9A441] to-[#FFD21F] text-[#071426] font-black border border-yellow-300/60 hover:brightness-110 shadow-[0_0_22px_rgba(217,164,65,0.45)]',
    ghost: isDay
      ? 'bg-transparent text-slate-600 border border-transparent hover:bg-slate-100 hover:text-slate-900 hover:border-slate-200'
      : 'bg-transparent text-slate-400 border border-transparent hover:bg-white/5 hover:text-white hover:border-white/10',
  };

  const classes = cn(
    'relative inline-flex items-center justify-center gap-2 rounded-lg font-bold transition-all duration-200 whitespace-nowrap disabled:pointer-events-none disabled:opacity-40 overflow-hidden group cursor-pointer',
    size === 'xs'
      ? 'h-7 px-2.5 text-[11px] tracking-wide'
      : size === 'md'
        ? 'h-10 px-5 text-sm tracking-wide'
        : 'h-9 px-4 text-[13px] tracking-wide',
    variants[variant],
    className,
  );
  
  const inner = (
    <>
      {/* Subtle shine on hover */}
      <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />
      {icon && <span className="shrink-0 transition-transform duration-200 group-hover:scale-110">{icon}</span>}
      <span className="relative z-10">{children}</span>
    </>
  );

  if (to) {
    return (
      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="inline-block">
        <Link to={to} className={classes}>
          {inner}
        </Link>
      </motion.div>
    );
  }
  
  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.02 }}
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
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'mb-6 flex flex-wrap items-start justify-between gap-4 pb-5 transition-colors',
        isDay ? 'border-b border-slate-200' : 'border-b border-white/10',
      )}
    >
      <div className="min-w-0">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav
            className={cn(
              'mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.2em]',
              isDay ? 'text-slate-500' : 'text-slate-400',
            )}
          >
            {breadcrumbs.map((crumb, index) => (
              <React.Fragment key={`${crumb.label}-${index}`}>
                {index > 0 && <FiChevronRight className={cn('h-3 w-3', isDay ? 'text-[#1264FF]' : 'text-[#D9A441]')} />}
                {crumb.to ? (
                  <Link
                    to={crumb.to}
                    className={cn('transition-colors', isDay ? 'hover:text-[#1264FF]' : 'hover:text-[#D9A441]')}
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
        <div className="flex flex-wrap items-center gap-3">
          <h1
            className={cn(
              'text-2xl md:text-3xl font-black tracking-tight flex items-center gap-3',
              isDay ? 'text-slate-900' : 'text-white',
            )}
          >
            <span>{title}</span>
          </h1>
          {badge}
        </div>
        {subtitle && (
          <p
            className={cn(
              'mt-1.5 max-w-3xl text-sm leading-relaxed font-medium',
              isDay ? 'text-slate-600' : 'text-slate-400',
            )}
          >
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
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
}> = ({ title, hint, actions, className, bodyClassName, flush, glow = 'none', children }) => {
  const { theme } = useTheme();
  const isDay = theme === 'day';

  const glowStyle = isDay
    ? {
        gold: 'border-[#D9A441]/40 shadow-[0_4px_24px_rgba(217,164,65,0.08)]',
        blue: 'border-[#1264FF]/30 shadow-[0_4px_24px_rgba(18,100,255,0.08)]',
        none: 'border-slate-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.04)]',
      }[glow]
    : {
        gold: 'border-[#D9A441]/30 shadow-[0_12px_40px_rgba(217,164,65,0.12)]',
        blue: 'border-[#1264FF]/30 shadow-[0_12px_40px_rgba(18,100,255,0.12)]',
        none: 'border-white/10 shadow-[0_16px_40px_rgba(0,0,0,0.4)]',
      }[glow];

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'relative rounded-xl border backdrop-blur-xl transition-all duration-300',
        isDay
          ? 'bg-white/95 text-slate-900 hover:border-slate-300'
          : 'bg-[#071426]/85 text-slate-100 hover:border-white/20',
        glowStyle,
        className,
      )}
    >
      {(title || actions) && (
        <header
          className={cn(
            'flex items-center justify-between gap-3 px-5 py-4 transition-colors',
            isDay
              ? 'border-b border-slate-200/90 bg-slate-50/70'
              : 'border-b border-white/10 bg-white/[0.02]',
          )}
        >
          <div className="min-w-0">
            <h2
              className={cn(
                'text-xs font-black uppercase tracking-[0.18em] flex items-center gap-2',
                isDay ? 'text-[#A9761B]' : 'text-[#D9A441]',
              )}
            >
              <span
                className={cn(
                  'inline-block h-1.5 w-1.5 rounded-full',
                  isDay ? 'bg-[#A9761B]' : 'bg-[#D9A441] shadow-[0_0_8px_#D9A441]',
                )}
              />
              {title}
            </h2>
            {hint && (
              <p className={cn('mt-0.5 text-xs', isDay ? 'text-slate-500' : 'text-slate-400')}>{hint}</p>
            )}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={cn(flush ? '' : 'p-5', bodyClassName)}>{children}</div>
    </motion.section>
  );
};

/* ----------------------------------------------------------- status pills */

const PILL_TONES: Record<string, string> = {
  live: 'bg-red-500/20 text-red-400 border-red-500/40 shadow-[0_0_12px_rgba(239,68,68,0.25)]',
  paused: 'bg-amber-500/20 text-amber-500 border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.25)]',
  scheduled: 'bg-blue-500/15 text-blue-500 border-blue-500/40 shadow-[0_0_12px_rgba(59,130,246,0.2)]',
  upcoming: 'bg-indigo-500/15 text-indigo-500 border-indigo-500/40 shadow-[0_0_12px_rgba(99,102,241,0.2)]',
  completed: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.2)]',
  ongoing: 'bg-blue-500/15 text-blue-500 border-blue-500/40 shadow-[0_0_12px_rgba(59,130,246,0.2)]',
  finished: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.2)]',
  cancelled: 'bg-slate-500/15 text-slate-500 border-slate-400/30',
  archived: 'bg-slate-500/15 text-slate-500 border-slate-400/30',
  active: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.2)]',
  inactive: 'bg-slate-500/15 text-slate-500 border-slate-400/30',
  disabled: 'bg-slate-500/15 text-slate-500 border-slate-400/30',
  open: 'bg-blue-500/15 text-blue-500 border-blue-500/40 shadow-[0_0_12px_rgba(59,130,246,0.2)]',
  closed: 'bg-slate-500/15 text-slate-500 border-slate-400/30',
  hidden: 'bg-amber-500/15 text-amber-500 border-amber-500/40',
  published: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/40',
  draft: 'bg-slate-500/15 text-slate-500 border-slate-400/30',
  featured: 'bg-[#D9A441]/20 text-[#A9761B] dark:text-[#FFD21F] border-[#D9A441]/50 shadow-[0_0_16px_rgba(217,164,65,0.25)]',
};

export const StatusPill: React.FC<{ value?: string; className?: string }> = ({ value, className }) => {
  if (!value) return null;
  const key = String(value).toLowerCase();
  const tone = PILL_TONES[key] ?? 'bg-slate-500/15 text-slate-500 border-slate-400/30';
  const live = key === 'live';
  
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider backdrop-blur-md',
        tone,
        className,
      )}
    >
      {live && (
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-90" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500 shadow-[0_0_8px_#EF4444]" />
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
}> = ({ label, value, hint, accent = 'gold', isLoading, icon, to }) => {
  const { theme } = useTheme();
  const isDay = theme === 'day';

  const accents = {
    blue: {
      bar: 'bg-[#1264FF] shadow-[0_0_15px_#1264FF]',
      border: isDay ? 'hover:border-[#1264FF]/60' : 'hover:border-[#1264FF]/40',
      glow: 'from-[#1264FF]/15 to-transparent',
      text: isDay ? 'text-[#1264FF]' : 'text-blue-400',
    },
    gold: {
      bar: isDay ? 'bg-[#A9761B]' : 'bg-[#D9A441] shadow-[0_0_15px_#D9A441]',
      border: isDay ? 'hover:border-[#A9761B]/60' : 'hover:border-[#D9A441]/40',
      glow: 'from-[#D9A441]/15 to-transparent',
      text: isDay ? 'text-[#A9761B]' : 'text-[#D9A441]',
    },
    red: {
      bar: 'bg-red-500 shadow-[0_0_15px_#EF4444]',
      border: 'hover:border-red-500/40',
      glow: 'from-red-500/15 to-transparent',
      text: 'text-red-500',
    },
    green: {
      bar: 'bg-emerald-500 shadow-[0_0_15px_#10B981]',
      border: 'hover:border-emerald-500/40',
      glow: 'from-emerald-500/15 to-transparent',
      text: 'text-emerald-500',
    },
    slate: {
      bar: isDay ? 'bg-slate-400' : 'bg-slate-400',
      border: 'hover:border-slate-500',
      glow: 'from-slate-700/20 to-transparent',
      text: isDay ? 'text-slate-600' : 'text-slate-300',
    },
  }[accent];

  const body = (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border p-5 backdrop-blur-xl transition-all duration-300 group',
        isDay
          ? 'border-slate-200 bg-white/95 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_28px_rgba(0,0,0,0.08)]'
          : 'border-white/10 bg-[#071426]/90 shadow-[0_12px_32px_rgba(0,0,0,0.5)] hover:shadow-[0_16px_40px_rgba(0,0,0,0.6)]',
      )}
    >
      {/* Accent edge light */}
      <span className={cn('absolute inset-y-0 left-0 w-[4px]', accents.bar)} />
      
      {/* Background radiant glow */}
      <div className={cn('absolute -right-10 -bottom-10 h-32 w-32 rounded-full blur-[45px] bg-gradient-to-br opacity-50 transition-opacity duration-300 group-hover:opacity-80', accents.glow)} />

      <div className="flex items-center justify-between">
        <span
          className={cn(
            'block text-[11px] font-black uppercase tracking-[0.2em]',
            isDay ? 'text-slate-500' : 'text-slate-400',
          )}
        >
          {label}
        </span>
        {icon && <span className={cn('text-lg opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all', accents.text)}>{icon}</span>}
      </div>

      <div className="mt-2.5 flex items-baseline gap-2">
        <span
          className={cn(
            'text-3xl md:text-4xl font-black tabular-nums tracking-tight drop-shadow-sm',
            isDay ? 'text-slate-900' : 'text-white',
          )}
        >
          {isLoading ? (
            <span className={cn('inline-block h-9 w-16 animate-pulse rounded', isDay ? 'bg-slate-200' : 'bg-white/10')} />
          ) : (
            value
          )}
        </span>
      </div>

      {hint && (
        <span className={cn('mt-1.5 block text-xs font-semibold', isDay ? 'text-slate-500' : 'text-slate-400')}>
          {hint}
        </span>
      )}
    </div>
  );

  return to ? (
    <motion.div whileHover={{ y: -4, scale: 1.01 }} whileTap={{ scale: 0.98 }}>
      <Link to={to} className="block">
        {body}
      </Link>
    </motion.div>
  ) : (
    <motion.div whileHover={{ y: -3 }}>
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
          'h-10 w-full rounded-lg pl-9 pr-3 text-sm outline-none backdrop-blur-md transition-all duration-200',
          isDay
            ? 'border border-slate-200 bg-white text-slate-900 placeholder-slate-400 shadow-xs focus:border-[#1264FF] focus:ring-2 focus:ring-[#1264FF]/20'
            : 'border border-white/15 bg-[#0B1A30]/80 text-white placeholder-slate-400 focus:border-[#D9A441] focus:ring-2 focus:ring-[#D9A441]/20',
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
    <label className={cn('inline-flex items-center gap-2', className)}>
      {label && (
        <span
          className={cn(
            'whitespace-nowrap text-[11px] font-black uppercase tracking-[0.16em]',
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
          'h-10 rounded-lg px-3 text-xs font-bold outline-none backdrop-blur-md transition-all duration-200 cursor-pointer',
          isDay
            ? 'border border-slate-200 bg-white text-slate-800 shadow-xs focus:border-[#1264FF] focus:ring-2 focus:ring-[#1264FF]/20'
            : 'border border-white/15 bg-[#0B1A30]/90 text-white focus:border-[#D9A441] focus:ring-2 focus:ring-[#D9A441]/20',
        )}
      >
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            className={isDay ? 'bg-white text-slate-900' : 'bg-[#071426] text-white'}
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
        'mb-5 flex flex-wrap items-center gap-3 rounded-xl p-3 backdrop-blur-md transition-colors',
        isDay
          ? 'border border-slate-200/90 bg-white/85 text-slate-800 shadow-xs'
          : 'border border-white/10 bg-[#071426]/60 text-white',
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
        'mb-6 flex gap-2 overflow-x-auto pb-px transition-colors',
        isDay ? 'border-b border-slate-200' : 'border-b border-white/10',
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
              'relative flex items-center gap-2 whitespace-nowrap rounded-t-lg px-4 py-3 text-xs font-black uppercase tracking-[0.16em] transition-all duration-200 cursor-pointer',
              isActive
                ? isDay
                  ? 'text-[#1264FF] bg-blue-50/70 font-black'
                  : 'text-[#FFD21F] bg-white/[0.04]'
                : isDay
                  ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.02]',
            )}
          >
            {item.label}
            {item.count !== undefined && (
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-[10px] font-black tabular-nums transition-colors',
                  isActive
                    ? isDay
                      ? 'bg-[#1264FF]/15 text-[#1264FF] border border-[#1264FF]/30'
                      : 'bg-[#D9A441]/20 text-[#FFD21F] border border-[#D9A441]/40'
                    : isDay
                      ? 'bg-slate-100 text-slate-500'
                      : 'bg-slate-800 text-slate-400',
                )}
              >
                {item.count}
              </span>
            )}
            {isActive && (
              <motion.span
                layoutId={`${layoutPrefix}-indicator`}
                transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                className={cn(
                  'absolute inset-x-0 bottom-0 h-[2.5px]',
                  isDay
                    ? 'bg-gradient-to-r from-[#1264FF] via-[#1747B8] to-[#1264FF] shadow-[0_0_10px_#1264FF]'
                    : 'bg-gradient-to-r from-[#D9A441] via-[#FFD21F] to-[#D9A441] shadow-[0_0_12px_#D9A441]',
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
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'flex h-7 w-7 items-center justify-center rounded border transition-all duration-150 disabled:opacity-40 cursor-pointer',
        primary
          ? 'border-[#1264FF] bg-[#1264FF] text-white hover:bg-[#0B4FD1] shadow-xs'
          : danger
            ? isDay
              ? 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100 hover:border-red-300'
              : 'border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:border-red-500/50'
            : isDay
              ? 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900 hover:bg-slate-50 shadow-xs'
              : 'border-white/10 bg-[#0B1A30]/80 text-slate-300 hover:border-white/20 hover:text-white hover:bg-white/10',
      )}
    >
      {children}
    </button>
  );
};

