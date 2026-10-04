import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';
import { FiSearch, FiAlertTriangle, FiInbox, FiChevronRight } from 'react-icons/fi';

/* ============================================================================
 *  Olympia Admin — Operational Design System (v2)
 *
 *  Principles
 *  1. TOKENS FIRST. Colour comes from the semantic theme bridge
 *     (`bg-surface`, `border-line`, `text-ink-muted`, …) so Day and Night stay
 *     in sync automatically instead of branching on `isDay` in every cell.
 *  2. DATA DENSE. Tighter controls (h-8.5), 10–11px uppercase eyebrows,
 *     tabular numerals everywhere a number appears.
 *  3. ONE HIERARCHY. Eyebrow → title → body → meta, identically on every page.
 *  4. MOTION IS SUPPORT, NOT SPECTACLE. 1–2px lifts, 150–200ms, no bounce.
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
  const variants: Record<Variant, string> = {
    primary:
      'bg-[#1264FF] hover:bg-[#0E55DE] active:bg-[#0B47BC] text-white border border-[#1264FF] shadow-[0_1px_2px_rgba(18,100,255,0.35)] hover:shadow-[0_5px_16px_rgba(18,100,255,0.30)] font-semibold',
    secondary:
      'bg-surface-2 hover:bg-surface-3 active:bg-surface-3 text-ink border border-line hover:border-line-strong shadow-xs font-semibold',
    danger:
      'bg-rose-500/10 hover:bg-rose-500/20 active:bg-rose-500/25 text-rose-600 dark:text-rose-300 border border-rose-500/25 hover:border-rose-500/45 font-semibold',
    warn:
      'bg-amber-500/15 hover:bg-amber-500/25 active:bg-amber-500/30 text-amber-600 dark:text-amber-200 border border-amber-500/35 hover:border-amber-500/55 font-semibold',
    ghost:
      'bg-transparent hover:bg-surface-soft active:bg-surface-soft-2 text-ink-muted hover:text-ink border border-transparent font-semibold',
  };

  const classes = cn(
    'relative inline-flex items-center justify-center gap-2 transition-all duration-150 whitespace-nowrap disabled:pointer-events-none disabled:opacity-40 cursor-pointer select-none',
    size === 'xs'
      ? 'h-7 px-2.5 text-[11px] rounded-md'
      : size === 'md'
        ? 'h-10 px-4 text-[13px] rounded-lg'
        : 'h-8.5 px-3 text-[12px] rounded-lg',
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

/* ------------------------------------------------------- shared type bits */

/** 10px uppercase eyebrow — the single label style used across the admin. */
export const Eyebrow: React.FC<{ children: React.ReactNode; className?: string; tone?: 'muted' | 'faint' | 'gold' | 'blue' }> = ({
  children,
  className,
  tone = 'muted',
}) => (
  <span
    className={cn(
      'block text-[10px] font-black uppercase tracking-[0.2em]',
      tone === 'muted' && 'text-ink-muted',
      tone === 'faint' && 'text-ink-faint',
      tone === 'gold' && 'text-gold-ink',
      tone === 'blue' && 'text-[#1264FF]',
      className,
    )}
  >
    {children}
  </span>
);

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
}> = ({ title, subtitle, breadcrumbs, actions, badge }) => (
  <motion.header
    initial={{ opacity: 0, y: -8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, ease: 'easeOut' }}
    className="relative mb-5 flex flex-col gap-3 border-b border-line pb-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6"
  >
    {/* premium gold rule bleeding into the divider */}
    <span
      aria-hidden
      className="pointer-events-none absolute -bottom-px left-0 h-[2px] w-24 bg-gradient-to-r from-[#D9A441] via-[#D9A441]/40 to-transparent"
    />

    <div className="min-w-0 flex-1">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="mb-1.5 flex flex-wrap items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-ink-muted">
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={`${crumb.label}-${index}`}>
              {index > 0 && <FiChevronRight className="h-3 w-3 opacity-60" />}
              {crumb.to ? (
                <Link to={crumb.to} className="transition-colors hover:text-[#1264FF]">
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-ink-muted">{crumb.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}
      <div className="flex flex-wrap items-center gap-2.5">
        <h1 className="font-display text-[25px] font-bold leading-none tracking-[-0.02em] text-ink sm:text-[30px]">
          {title}
        </h1>
        {badge}
      </div>
      {subtitle && (
        <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-ink-muted">{subtitle}</p>
      )}
    </div>

    {actions && (
      <div className="flex w-full shrink-0 flex-wrap items-center gap-2 sm:w-auto">{actions}</div>
    )}
  </motion.header>
);

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
}> = ({ title, hint, actions, className, bodyClassName, flush, glow = 'none', children }) => (
  <motion.section
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35, ease: 'easeOut' }}
    className={cn(
      'relative overflow-hidden rounded-xl border border-line bg-surface/95 text-ink shadow-[0_1px_2px_rgba(7,20,38,0.06)] backdrop-blur-md transition-all duration-200 hover:border-line-strong',
      className,
    )}
  >
    {(title || actions) && (
      <header className="flex items-center justify-between gap-3 border-b border-line bg-surface-soft/70 px-4 py-3 transition-colors sm:px-5">
        <div className="flex min-w-0 items-center gap-2.5">
          {glow !== 'none' && (
            <span
              aria-hidden
              className={cn('h-3.5 w-[3px] shrink-0 rounded-full', glow === 'gold' ? 'bg-[#D9A441]' : 'bg-[#1264FF]')}
            />
          )}
          <div className="min-w-0">
            <h2 className="truncate text-[10.5px] font-black uppercase tracking-[0.18em] text-ink-muted">
              {title}
            </h2>
            {hint && <p className="mt-0.5 truncate text-[11px] font-medium text-ink-faint">{hint}</p>}
          </div>
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </header>
    )}
    <div className={cn(flush ? '' : 'p-4 sm:p-5', bodyClassName)}>{children}</div>
  </motion.section>
);

/* ----------------------------------------------------------- status pills */

const PILL_TONES: Record<string, string> = {
  live: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
  paused: 'bg-amber-500/12 text-amber-700 dark:text-amber-400 border-amber-500/30',
  scheduled: 'bg-[#1264FF]/10 text-[#1264FF] border-[#1264FF]/25',
  upcoming: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/25',
  completed: 'bg-surface-soft-2 text-ink-muted border-line',
  ongoing: 'bg-[#1264FF]/10 text-[#1264FF] border-[#1264FF]/25',
  finished: 'bg-surface-soft-2 text-ink-muted border-line',
  cancelled: 'bg-surface-soft text-ink-faint border-line',
  archived: 'bg-surface-soft text-ink-faint border-line',
  active: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25',
  inactive: 'bg-surface-soft text-ink-faint border-line',
  disabled: 'bg-surface-soft text-ink-faint border-line',
  open: 'bg-[#1264FF]/10 text-[#1264FF] border-[#1264FF]/25',
  closed: 'bg-surface-soft text-ink-faint border-line',
  hidden: 'bg-surface-soft text-ink-faint border-line',
  published: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25',
  draft: 'bg-surface-soft text-ink-faint border-line',
  featured: 'bg-[#D9A441]/12 text-gold-ink border-[#D9A441]/30',
};

export const StatusPill: React.FC<{ value?: string; className?: string }> = ({ value, className }) => {
  if (!value) return null;
  const key = String(value).toLowerCase();
  const tone = PILL_TONES[key] ?? 'bg-surface-soft text-ink-muted border-line';
  const live = key === 'live';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border px-2 py-[3px] text-[10px] font-black uppercase tracking-[0.12em] transition-colors',
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

const ACCENT_BAR: Record<string, string> = {
  blue: 'bg-[#1264FF]',
  gold: 'bg-[#D9A441]',
  red: 'bg-[#FF4D3D]',
  green: 'bg-emerald-500',
  slate: 'bg-slate-400',
};

const ACCENT_ICON: Record<string, string> = {
  blue: 'bg-[#1264FF]/10 text-[#1264FF]',
  gold: 'bg-[#D9A441]/12 text-gold-ink',
  red: 'bg-[#FF4D3D]/10 text-[#FF4D3D]',
  green: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  slate: 'bg-surface-soft-2 text-ink-muted',
};

export const StatTile: React.FC<{
  label: string;
  value: React.ReactNode;
  hint?: string;
  accent?: 'blue' | 'gold' | 'red' | 'slate' | 'green';
  isLoading?: boolean;
  icon?: React.ReactNode;
  to?: string;
}> = ({ label, value, hint, accent = 'blue', isLoading, icon, to }) => {
  const body = (
    <div className="relative overflow-hidden rounded-xl border border-line bg-surface/95 p-4 text-ink shadow-[0_1px_2px_rgba(7,20,38,0.06)] transition-all duration-200 hover:border-line-strong hover:shadow-[0_6px_18px_rgba(7,20,38,0.08)]">
      <span aria-hidden className={cn('absolute inset-y-0 left-0 w-[3px]', ACCENT_BAR[accent])} />

      <div className="flex items-start justify-between gap-2 pl-2">
        <span className="block truncate text-[10px] font-black uppercase tracking-[0.18em] text-ink-muted">
          {label}
        </span>
        {icon && (
          <span
            className={cn(
              'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm transition-transform duration-150',
              ACCENT_ICON[accent],
            )}
          >
            {icon}
          </span>
        )}
      </div>

      <div className="mt-1.5 flex items-baseline gap-2 pl-2">
        <span className="font-display text-[26px] font-bold leading-none tabular-nums tracking-[-0.02em] text-ink sm:text-[30px]">
          {isLoading ? (
            <span className="inline-block h-8 w-14 animate-pulse rounded bg-surface-soft-2" />
          ) : (
            value
          )}
        </span>
      </div>

      {hint && (
        <span className="mt-1.5 block truncate pl-2 text-[11px] font-medium text-ink-faint">{hint}</span>
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
    <motion.div whileHover={{ y: -1 }}>{body}</motion.div>
  );
};

/* ---------------------------------------------------------------- toolbar */

export const SearchInput: React.FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}> = ({ value, onChange, placeholder = 'Search…', className }) => (
  <div className={cn('relative min-w-[200px]', className)}>
    <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-faint" />
    <input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="h-9 w-full rounded-lg border border-line bg-surface-2/70 pl-9 pr-3 text-[13px] text-ink outline-none transition-all duration-150 placeholder:text-ink-faint focus:border-[#1264FF] focus:bg-surface focus:ring-2 focus:ring-[#1264FF]/15"
    />
  </div>
);

export const FilterSelect: React.FC<{
  value: string;
  onChange: (value: string) => void;
  label?: string;
  options: { value: string; label: string }[];
  className?: string;
}> = ({ value, onChange, label, options, className }) => (
  <label className={cn('inline-flex w-full items-center gap-2 sm:w-auto', className)}>
    {label && <span className="whitespace-nowrap text-[10px] font-black uppercase tracking-[0.16em] text-ink-muted">{label}</span>}
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 w-full cursor-pointer rounded-lg border border-line bg-surface-2/70 px-3 text-[12px] font-semibold text-ink outline-none transition-all duration-150 focus:border-[#1264FF] focus:ring-2 focus:ring-[#1264FF]/15"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value} className="bg-surface text-ink">
          {option.label}
        </option>
      ))}
    </select>
  </label>
);

export const Toolbar: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <div
    className={cn(
      'mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-line bg-surface/90 p-2 text-ink shadow-[0_1px_2px_rgba(7,20,38,0.05)] backdrop-blur-md sm:gap-2.5',
      className,
    )}
  >
    {children}
  </div>
);

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
}> = ({ items, active, onChange, layoutPrefix = 'admin-tab' }) => (
  <div className="no-scrollbar mb-5 flex gap-1 overflow-x-auto border-b border-line pb-px">
    {items.map((item) => {
      const isActive = item.id === active;
      return (
        <button
          key={item.id}
          type="button"
          onClick={() => onChange(item.id)}
          className={cn(
            'relative flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-t-lg px-3.5 py-2.5 text-[11px] font-black uppercase tracking-[0.14em] transition-colors duration-150',
            isActive
              ? 'bg-[#1264FF]/8 text-[#1264FF]'
              : 'text-ink-faint hover:bg-surface-soft hover:text-ink',
          )}
        >
          {item.label}
          {item.count !== undefined && (
            <span
              className={cn(
                'rounded-md px-1.5 py-0.5 text-[10px] font-bold tabular-nums transition-colors',
                isActive ? 'bg-[#1264FF]/15 text-[#1264FF]' : 'bg-surface-soft-2 text-ink-muted',
              )}
            >
              {item.count}
            </span>
          )}
          {isActive && (
            <motion.span
              layoutId={`${layoutPrefix}-indicator`}
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              className="absolute inset-x-0 bottom-0 h-[2px] rounded-t bg-[#1264FF]"
            />
          )}
        </button>
      );
    })}
  </div>
);

/* ------------------------------------------------------------- feedback */

export const ErrorNotice: React.FC<{ message: string; className?: string }> = ({ message, className }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.97 }}
    animate={{ opacity: 1, scale: 1 }}
    className={cn(
      'flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-[12.5px] font-medium leading-relaxed text-rose-600 dark:text-rose-200',
      className,
    )}
  >
    <FiAlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
    <span>{message}</span>
  </motion.div>
);

export const EmptyNotice: React.FC<{
  title?: string;
  message?: string;
  action?: React.ReactNode;
}> = ({ title = 'Nothing here yet', message, action }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center rounded-xl border border-dashed border-line bg-surface-soft/40 px-6 py-14 text-center"
  >
    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-line bg-accent-soft text-gold-ink">
      <FiInbox className="h-5 w-5" />
    </div>
    <p className="font-display text-[15px] font-bold tracking-tight text-ink">{title}</p>
    {message && <p className="mt-1.5 max-w-sm text-[12.5px] leading-relaxed text-ink-muted">{message}</p>}
    {action && <div className="mt-5">{action}</div>}
  </motion.div>
);

export const LoadingRows: React.FC<{ rows?: number; cols?: number }> = ({ rows = 6, cols = 5 }) => (
  <div className="divide-y divide-line">
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="flex items-center gap-4 px-4 py-3">
        {Array.from({ length: cols }).map((__, colIndex) => (
          <span
            key={colIndex}
            className="h-3 animate-pulse rounded-md bg-surface-soft-2"
            style={{ width: `${((rowIndex + colIndex) % 4) * 15 + 20}%` }}
          />
        ))}
      </div>
    ))}
  </div>
);

export const PageLoading: React.FC<{ label?: string }> = ({ label = 'Loading Arena…' }) => (
  <div className="flex flex-col items-center justify-center gap-4 py-24 text-ink-faint">
    <div className="relative flex h-10 w-10 items-center justify-center">
      <span className="absolute h-full w-full animate-ping rounded-full bg-[#1264FF]/20" />
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-[#D9A441]" />
    </div>
    <span className="text-[10px] font-black uppercase tracking-[0.22em] text-gold-ink">{label}</span>
  </div>
);

/* ---------------------------------------------------------- table system */

/**
 * Shared table primitives. Every admin table uses these so density, header
 * treatment and hover behaviour are identical across all 34 pages — and pages
 * no longer hand-roll `isDay ? … : …` for each cell.
 */

export const TableShell: React.FC<{
  minW?: number | string;
  className?: string;
  children: React.ReactNode;
}> = ({ minW = 900, className, children }) => (
  <div className={cn('w-full overflow-x-auto', className)}>
    <table
      className="w-full border-collapse text-left"
      style={{ minWidth: typeof minW === 'number' ? `${minW}px` : minW }}
    >
      {children}
    </table>
  </div>
);

export const THead: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <thead className="bg-surface-soft/70">{children}</thead>
);

export const TRow: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  selected?: boolean;
}> = ({ children, onClick, className, selected }) => (
  <tr
    onClick={onClick}
    className={cn(
      'group border-b border-line transition-colors last:border-b-0',
      selected ? 'bg-[#1264FF]/[0.07]' : onClick ? 'cursor-pointer hover:bg-surface-soft/70' : 'hover:bg-surface-soft/50',
      className,
    )}
  >
    {children}
  </tr>
);

export const Th: React.FC<{ children?: React.ReactNode; className?: string; numeric?: boolean }> = ({
  children,
  className,
  numeric,
}) => (
  <th
    className={cn(
      'whitespace-nowrap border-b border-line px-3.5 py-2.5 text-[10px] font-black uppercase tracking-[0.14em] text-ink-muted',
      numeric && 'text-right',
      className,
    )}
  >
    {children}
  </th>
);

export const TBody: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <tbody className="bg-transparent">{children}</tbody>
);

export const Td: React.FC<{
  children?: React.ReactNode;
  className?: string;
  /** Tabular, right-aligned numeric cell. */
  numeric?: boolean;
  /** Bold primary cell (row title). */
  strong?: boolean;
  /** Spans multiple columns (e.g. an inline expansion row). */
  colSpan?: number;
}> = ({ children, className, numeric, strong, colSpan }) => (
  <td
    colSpan={colSpan}
    className={cn(
      'px-3.5 py-3 align-middle text-[13px] text-ink-muted',
      numeric && 'whitespace-nowrap text-right font-mono text-[12.5px] font-bold tabular-nums text-ink',
      strong && 'font-semibold text-ink',
      className,
    )}
  >
    {children}
  </td>
);

/** Primary link inside a table row (keeps the brand hover treatment). */
export const TableLink: React.FC<{ to: string; children: React.ReactNode; className?: string }> = ({
  to,
  children,
  className,
}) => (
  <Link
    to={to}
    className={cn(
      'block truncate text-[13px] font-bold text-ink transition-colors hover:text-[#1264FF]',
      className,
    )}
  >
    {children}
  </Link>
);

/** Secondary line under a table title (short code, id, timestamp…). */
export const SubLine: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <span className={cn('block truncate text-[10.5px] font-bold uppercase tracking-[0.12em] text-ink-faint', className)}>
    {children}
  </span>
);

/* ------------------------------------------------------------ form bits */

export const FormSection: React.FC<{
  step?: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}> = ({ step, title, description, children, className }) => (
  <div className={cn('border-b border-line px-5 py-5 last:border-b-0 sm:px-6', className)}>
    <div className="mb-4 flex items-baseline gap-3">
      {step && (
        <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-[#D9A441] text-[11px] font-black text-[#071426] shadow-[0_0_10px_rgba(217,164,65,0.55)]">
          {step}
        </span>
      )}
      <div className="min-w-0">
        <h3 className="font-display text-[15px] font-bold tracking-tight text-ink">{title}</h3>
        {description && <p className="mt-0.5 text-[12px] text-ink-muted">{description}</p>}
      </div>
    </div>
    {children}
  </div>
);

export const FormGrid: React.FC<{
  cols?: 1 | 2 | 3;
  children: React.ReactNode;
  className?: string;
}> = ({ cols = 2, children, className }) => (
  <div
    className={cn(
      'grid gap-4',
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
}> = ({ checked, onChange, label, hint, disabled }) => (
  <label
    className={cn(
      'flex items-start justify-between gap-4 rounded-lg px-3 py-2.5 transition-colors',
      'hover:bg-surface-soft/60',
      disabled ? 'opacity-40' : 'cursor-pointer',
    )}
  >
    <span className="min-w-0">
      <span className="block text-[13px] font-semibold text-ink">{label}</span>
      {hint && <span className="mt-0.5 block text-[12px] leading-relaxed text-ink-muted">{hint}</span>}
    </span>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative mt-0.5 h-6 w-11 shrink-0 rounded-full border transition-all duration-200',
        checked
          ? 'border-transparent bg-[#1264FF] shadow-[0_2px_8px_rgba(18,100,255,0.45)]'
          : 'border-line bg-surface-soft-2',
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 h-4.5 w-4.5 rounded-full bg-white shadow-md transition-transform duration-200',
          checked ? 'translate-x-5.5' : 'translate-x-0.5',
        )}
      />
    </button>
  </label>
);

/** Two-line definition row used across detail pages. */
export const MetaRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex items-baseline justify-between gap-4 border-b border-line py-2.5 last:border-b-0">
    <dt className="shrink-0 text-[10px] font-black uppercase tracking-[0.16em] text-ink-faint">{label}</dt>
    <dd className="min-w-0 truncate text-right text-[13px] font-semibold text-ink">{children}</dd>
  </div>
);

/** Theme-aware action icon button used across admin tables. */
export const ActionIcon: React.FC<{
  label: string;
  onClick?: () => void;
  children: React.ReactNode;
  primary?: boolean;
  danger?: boolean;
  disabled?: boolean;
}> = ({ label, onClick, children, primary, danger, disabled }) => (
  <motion.button
    type="button"
    whileHover={{ scale: 1.06 }}
    whileTap={{ scale: 0.94 }}
    title={label}
    aria-label={label}
    disabled={disabled}
    onClick={onClick}
    className={cn(
      'flex h-7.5 w-7.5 min-w-[30px] cursor-pointer items-center justify-center rounded-md border transition-colors disabled:opacity-40',
      primary
        ? 'border-[#1264FF] bg-[#1264FF] text-white shadow-[0_1px_2px_rgba(18,100,255,0.35)] hover:bg-[#0E55DE]'
        : danger
          ? 'border-rose-500/25 bg-rose-500/10 text-rose-600 dark:text-rose-300 hover:border-rose-500/45 hover:bg-rose-500/20'
          : 'border-line bg-surface-2 text-ink-muted hover:border-line-strong hover:bg-surface-3 hover:text-ink',
    )}
  >
    {children}
  </motion.button>
);
