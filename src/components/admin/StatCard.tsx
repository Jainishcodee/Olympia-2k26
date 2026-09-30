import React from 'react';
import { cn } from '@/utils/cn';
import { IconType } from 'react-icons';
import { useTheme } from '@/contexts/ThemeContext';
import LoadingSkeleton from './LoadingSkeleton';

interface Props {
  title: string;
  value: string | number;
  icon: IconType;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  isLoading?: boolean;
  className?: string;
}

const StatCard: React.FC<Props> = ({ title, value, icon: Icon, trend, isLoading, className }) => {
  const { theme } = useTheme();
  const isDay = theme === 'day';

  if (isLoading) {
    return <LoadingSkeleton type="card" />;
  }

  return (
    <div
      className={cn(
        "rounded-xl border p-5 backdrop-blur-xl transition-all duration-300",
        isDay
          ? "border-slate-200 bg-white/95 shadow-xs"
          : "border-white/10 bg-[#071426]/90 shadow-md",
        className
      )}
    >
      <div className="flex items-center">
        <div
          className={cn(
            "flex-shrink-0 p-3 rounded-xl border",
            isDay ? "bg-blue-50 border-blue-200/80" : "bg-[#1264FF]/15 border-[#1264FF]/30",
          )}
        >
          <Icon className="h-6 w-6 text-[#1264FF]" />
        </div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className={cn("text-xs font-black uppercase tracking-wider truncate", isDay ? "text-slate-500" : "text-slate-400")}>
              {title}
            </dt>
            <dd className="flex items-baseline mt-1">
              <div className={cn("text-2xl font-black tabular-nums tracking-tight", isDay ? "text-slate-900" : "text-white")}>
                {value}
              </div>
              {trend && (
                <div className={cn(
                  "ml-2 flex items-baseline text-xs font-black",
                  trend.isPositive ? "text-emerald-500" : "text-red-500"
                )}>
                  {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}%
                </div>
              )}
            </dd>
          </dl>
        </div>
      </div>
    </div>
  );
};
export default StatCard;