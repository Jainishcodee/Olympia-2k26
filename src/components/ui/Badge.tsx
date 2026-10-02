import React from 'react';
import { cn } from '@/utils/cn';

interface BadgeProps {
  status?: 'live' | 'upcoming' | 'completed' | 'cancelled' | 'paused';
  sport?: boolean;
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ status, sport, children, className, size = 'sm' }) => {
  const baseStyle = "inline-flex items-center justify-center font-medium tracking-normal rounded-md transition-colors";
  const sizeStyles = {
    sm: "px-2 py-0.5 text-[11px]",
    md: "px-2.5 py-1 text-xs",
  };

  let variantStyle = "bg-slate-800/80 text-slate-200 border border-slate-700/60";

  if (status === 'live') variantStyle = "bg-rose-500/10 text-rose-500 dark:text-rose-400 border border-rose-500/25";
  else if (status === 'paused') variantStyle = "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25";
  else if (status === 'upcoming') variantStyle = "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/25";
  else if (status === 'completed') variantStyle = "bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60";
  else if (status === 'cancelled') variantStyle = "bg-slate-100 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700/40";
  else if (sport) variantStyle = "bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60";

  return (
    <div className={cn(baseStyle, sizeStyles[size], variantStyle, className)}>
      {status === 'live' && (
        <span className="relative flex h-1.5 w-1.5 mr-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-500 opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-rose-600" />
        </span>
      )}
      {status === 'paused' && (
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5" />
      )}
      {children}
    </div>
  );
};
