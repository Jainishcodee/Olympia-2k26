import React from 'react';
import { cn } from '@/utils/cn';
import { useTheme } from '@/contexts/ThemeContext';

interface Props {
  type: 'card' | 'table' | 'text' | 'form';
  count?: number;
}

const LoadingSkeleton: React.FC<Props> = ({ type, count = 1 }) => {
  const { theme } = useTheme();
  const isDay = theme === 'day';

  if (type === 'card') {
    return (
      <div className={cn("rounded-xl p-5 animate-pulse border", isDay ? "border-slate-200 bg-white/95" : "border-white/10 bg-[#071426]/90")}>
        <div className="flex items-center">
          <div className={cn("flex-shrink-0 h-12 w-12 rounded-xl", isDay ? "bg-slate-200" : "bg-white/10")} />
          <div className="ml-5 w-0 flex-1">
            <div className={cn("h-4 rounded w-1/2 mb-2", isDay ? "bg-slate-200" : "bg-white/10")} />
            <div className={cn("h-6 rounded w-1/4", isDay ? "bg-slate-200" : "bg-white/10")} />
          </div>
        </div>
      </div>
    );
  }

  if (type === 'table') {
    return (
      <div className="animate-pulse flex flex-col space-y-4 p-4">
        <div className={cn("h-8 rounded-lg w-full", isDay ? "bg-slate-200" : "bg-white/10")} />
        {[...Array(count || 5)].map((_, i) => (
          <div key={i} className={cn("h-12 rounded-lg w-full", isDay ? "bg-slate-100" : "bg-white/5")} />
        ))}
      </div>
    );
  }

  return (
    <div className="animate-pulse space-y-2">
      {[...Array(count)].map((_, i) => (
        <div key={i} className={cn("h-4 rounded-md w-full", isDay ? "bg-slate-200" : "bg-white/10")} />
      ))}
    </div>
  );
};
export default LoadingSkeleton;