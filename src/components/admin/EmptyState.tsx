import React from 'react';
import { FiInbox } from 'react-icons/fi';
import { cn } from '@/utils/cn';
import { useTheme } from '@/contexts/ThemeContext';

interface Props {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

const EmptyState: React.FC<Props> = ({ title, description, action, icon, className }) => {
  const { theme } = useTheme();
  const isDay = theme === 'day';

  return (
    <div
      className={cn(
        "text-center p-8 rounded-xl border border-dashed backdrop-blur-md transition-colors",
        isDay
          ? "bg-white/70 border-slate-300 text-slate-900 shadow-xs"
          : "bg-[#071426]/60 border-white/15 text-white",
        className
      )}
    >
      <div
        className={cn(
          "mx-auto flex h-12 w-12 items-center justify-center rounded-2xl mb-4 border",
          isDay
            ? "bg-slate-100 border-slate-200 text-[#A9761B]"
            : "bg-white/5 border-white/10 text-[#D9A441] shadow-[0_0_15px_rgba(217,164,65,0.2)]",
        )}
      >
        {icon || <FiInbox className="h-6 w-6" />}
      </div>
      <h3 className={cn("mt-2 text-sm font-black tracking-wide", isDay ? "text-slate-900" : "text-white")}>{title}</h3>
      {description && <p className={cn("mt-1 text-xs leading-relaxed max-w-sm mx-auto", isDay ? "text-slate-500" : "text-slate-400")}>{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
};
export default EmptyState;