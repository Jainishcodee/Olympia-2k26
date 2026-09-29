import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';
import { FiSearch, FiAlertTriangle, FiInbox, FiChevronRight } from 'react-icons/fi';

/* ============================================================================
 *  Olympia Admin — shared presentation kit.
 *
 *  Design language: PRECISE · FAST · OPERATIONAL · DATA-DENSE · CLEAR.
 *  Motion is deliberately restrained — colour transitions and one shared
 *  `layoutId` indicator. Nothing here animates on entry, so tables and forms
 *  never feel like they are performing for you.
 * ==========================================================================*/

/* ---------------------------------------------------------------- buttons */

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'warn';

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-[#1264FF] text-white border border-[#1264FF] hover:bg-[#0B4FD1] hover:border-[#0B4FD1]',
  secondary:
    'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 hover:border-slate-400',
  danger:
    'bg-white text-red-600 border border-red-200 hover:bg-red-50 hover:border-red-300',
  warn: 'bg-[#D9A441] text-slate-900 border border-[#D9A441] hover:bg-[#C4912F] hover:border-[#C4912F]',
  ghost: 'bg-transparent text-slate-600 border border-transparent hover:bg-slate-100 hover:text-slate-900',
};

export const Btn: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: Variant;
    size?: 'xs' | 'sm' | 'md';
    icon?: React.ReactNode;
    to?: string;
  }
> = ({ variant = 'secondary', size = 'sm', icon, to, className, children, ...rest }) => {
  const classes = cn(
    'inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-colors duration-150 whitespace-nowrap disabled:pointer-events-none disabled:opacity-50',
    size === 'xs'
      ? 'h-7 px-2 text-[11px]'
      : size === 'md'
        ? 'h-10 px-4 text-sm'
        : 'h-9 px-3.5 text-[13px]',
    VARIANTS[variant],
    className,
  );
  const inner = (
    <>
      {icon}
      {children}
    </>
  );
  if (to) {
    return (
      <Link to={to} className={classes}>
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" className={classes} {...rest}>
      {inner}
    </button>
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
}> = ({ title, subtitle, breadcrumbs, actions, badge }) => (
  <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
    <div className="min-w-0">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="mb-1.5 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={`${crumb.label}-${index}`}>
              {index > 0 && <FiChevronRight className="h-3 w-3" />}
              {crumb.to ? (
                <Link to={crumb.to} className="transition-colors hover:text-[#1264FF]">
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-slate-500">{crumb.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}
      <div className="flex items-center gap-3">
        <h1 className="truncate text-xl font-bold tracking-tight text-slate-900">{title}</h1>
        {badge}
      </div>
      {subtitle && <p className="mt-1 max-w-3xl text-[13px] leading-relaxed text-slate-500">{subtitle}</p>}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
  </div>
);

/* ----------------------------------------------------------------- cards */

export const Card: React.FC<{
  title?: string;
  hint?: string;
  actions?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  flush?: boolean;
  children: React.ReactNode;
}> = ({ title, hint, actions, className, bodyClassName, flush, children }) => (
  <section className={cn('rounded-lg border border-slate-200 bg-white', className)}>
    {(title || actions) && (
      <header className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
        <div className="min-w-0">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">{title}</h2>
          {hint && <p className="mt-0.5 text-[12px] text-slate-400">{hint}</p>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </header>
    )}
    <div className={cn(flush ? '' : 'p-4', bodyClassName)}>{children}</div>
  </section>
);

/* ----------------------------------------------------------- status pills */

const PILL_TONES: Record<string, string> = {
  live: 'bg-red-50 text-red-700 border-red-200',
  paused: 'bg-amber-50 text-amber-700 border-amber-200',
  scheduled: 'bg-blue-50 text-blue-700 border-blue-200',
  upcoming: 'bg-blue-50 text-blue-700 border-blue-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  ongoing: 'bg-blue-50 text-blue-700 border-blue-200',
  finished: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-slate-100 text-slate-600 border-slate-200',
  archived: 'bg-slate-100 text-slate-500 border-slate-200',
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  inactive: 'bg-slate-100 text-slate-500 border-slate-200',
  disabled: 'bg-slate-100 text-slate-500 border-slate-200',
  open: 'bg-blue-50 text-blue-700 border-blue-200',
  closed: 'bg-slate-100 text-slate-600 border-slate-200',
  hidden: 'bg-amber-50 text-amber-700 border-amber-200',
  published: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  draft: 'bg-slate-100 text-slate-600 border-slate-200',
  featured: 'bg-[#FFF7E6] text-[#A9761B] border-[#F0DFB8]',
};

export const StatusPill: React.FC<{ value?: string; className?: string }> = ({ value, className }) => {
  if (!value) return null;
  const key = String(value).toLowerCase();
  const tone = PILL_TONES[key] ?? 'bg-slate-100 text-slate-600 border-slate-200';
  const live = key === 'live';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
        tone,
        className,
      )}
    >
      {live && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
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
  to?: string;
}> = ({ label, value, hint, accent = 'slate', isLoading, to }) => {
  const bar = {
    blue: 'bg-[#1264FF]',
    gold: 'bg-[#D9A441]',
    red: 'bg-red-500',
    green: 'bg-emerald-500',
    slate: 'bg-slate-400',
  }[accent];

  const body = (
    <>
      <span className={cn('absolute inset-y-0 left-0 w-[3px]', bar)} />
      <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">{label}</span>
      <span className="mt-1.5 block text-2xl font-bold tabular-nums tracking-tight text-slate-900">
        {isLoading ? <span className="inline-block h-7 w-12 animate-pulse rounded bg-slate-200" /> : value}
      </span>
      {hint && <span className="mt-1 block text-[11px] text-slate-400">{hint}</span>}
    </>
  );

  const classes =
    'relative rounded-lg border border-slate-200 bg-white px-4 py-3.5 transition-colors hover:border-slate-300';

  return to ? (
    <Link to={to} className={cn(classes, 'block')}>
      {body}
    </Link>
  ) : (
    <div className={classes}>{body}</div>
  );
};

/* ---------------------------------------------------------------- toolbar */

export const SearchInput: React.FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}> = ({ value, onChange, placeholder = 'Search…', className }) => (
  <div className={cn('relative', className)}>
    <FiSearch className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
    <input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="h-9 w-full rounded-md border border-slate-300 bg-white pl-8 pr-3 text-[13px] text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-[#1264FF] focus:ring-2 focus:ring-[#1264FF]/15"
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
  <label className={cn('inline-flex items-center gap-2', className)}>
    {label && (
      <span className="whitespace-nowrap text-[11px] font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </span>
    )}
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 rounded-md border border-slate-300 bg-white px-2.5 text-[13px] text-slate-700 outline-none transition-colors focus:border-[#1264FF] focus:ring-2 focus:ring-[#1264FF]/15"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
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
  <div className={cn('mb-4 flex flex-wrap items-center gap-2', className)}>{children}</div>
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
  <div className="mb-5 flex gap-1 overflow-x-auto border-b border-slate-200">
    {items.map((item) => {
      const isActive = item.id === active;
      return (
        <button
          key={item.id}
          type="button"
          onClick={() => onChange(item.id)}
          className={cn(
            'relative -mb-px flex items-center gap-1.5 whitespace-nowrap px-3.5 py-2.5 text-[13px] font-semibold transition-colors',
            isActive ? 'text-[#1264FF]' : 'text-slate-500 hover:text-slate-900',
          )}
        >
          {item.label}
          {item.count !== undefined && (
            <span
              className={cn(
                'rounded px-1.5 py-0.5 text-[10px] font-bold tabular-nums',
                isActive ? 'bg-[#1264FF]/10 text-[#1264FF]' : 'bg-slate-100 text-slate-500',
              )}
            >
              {item.count}
            </span>
          )}
          {isActive && (
            <motion.span
              layoutId={`${layoutPrefix}-indicator`}
              transition={{ type: 'spring', stiffness: 500, damping: 40 }}
              className="absolute inset-x-0 -bottom-px h-0.5 bg-[#1264FF]"
            />
          )}
        </button>
      );
    })}
  </div>
);

/* ------------------------------------------------------------- feedback */

export const ErrorNotice: React.FC<{ message: string; className?: string }> = ({ message, className }) => (
  <div
    className={cn(
      'flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-3 text-[13px] leading-relaxed text-amber-900',
      className,
    )}
  >
    <FiAlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
    <span>{message}</span>
  </div>
);

export const EmptyNotice: React.FC<{
  title?: string;
  message?: string;
  action?: React.ReactNode;
}> = ({ title = 'Nothing here yet', message, action }) => (
  <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
    <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-400">
      <FiInbox className="h-5 w-5" />
    </div>
    <p className="text-sm font-semibold text-slate-700">{title}</p>
    {message && <p className="mt-1 max-w-sm text-[13px] leading-relaxed text-slate-400">{message}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export const LoadingRows: React.FC<{ rows?: number; cols?: number }> = ({ rows = 6, cols = 5 }) => (
  <div className="divide-y divide-slate-100">
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="flex items-center gap-4 px-4 py-3">
        {Array.from({ length: cols }).map((__, colIndex) => (
          <span
            key={colIndex}
            className="h-3 animate-pulse rounded bg-slate-100"
            style={{ width: `${((rowIndex + colIndex) % 4) * 12 + 24}%` }}
          />
        ))}
      </div>
    ))}
  </div>
);

export const PageLoading: React.FC<{ label?: string }> = ({ label = 'Loading…' }) => (
  <div className="flex flex-col items-center justify-center gap-3 py-20 text-slate-400">
    <span className="h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-[#1264FF]" />
    <span className="text-[12px] font-semibold uppercase tracking-wider">{label}</span>
  </div>
);

/* ------------------------------------------------------------ form bits */

export const FormSection: React.FC<{
  step?: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}> = ({ step, title, description, children, className }) => (
  <div className={cn('border-b border-slate-100 px-5 py-5 last:border-b-0', className)}>
    <div className="mb-4 flex items-baseline gap-3">
      {step && (
        <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-[#071426] px-1.5 text-[11px] font-bold text-[#D9A441]">
          {step}
        </span>
      )}
      <div className="min-w-0">
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
        {description && <p className="mt-0.5 text-[12px] text-slate-400">{description}</p>}
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
      'flex items-start justify-between gap-4 py-3',
      disabled ? 'opacity-50' : 'cursor-pointer',
    )}
  >
    <span className="min-w-0">
      <span className="block text-[13px] font-semibold text-slate-800">{label}</span>
      {hint && <span className="mt-0.5 block text-[12px] leading-relaxed text-slate-400">{hint}</span>}
    </span>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors duration-150',
        checked ? 'bg-[#1264FF]' : 'bg-slate-300',
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-150',
          checked ? 'translate-x-4' : 'translate-x-0.5',
        )}
      />
    </button>
  </label>
);

/** Two-line definition row used across detail pages. */
export const MetaRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex items-baseline justify-between gap-4 border-b border-slate-100 py-2.5 last:border-b-0">
    <dt className="shrink-0 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</dt>
    <dd className="min-w-0 truncate text-right text-[13px] font-medium text-slate-800">{children}</dd>
  </div>
);
