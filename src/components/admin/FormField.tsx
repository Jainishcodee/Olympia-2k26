import React from 'react';
import { cn } from '@/utils/cn';
import { useTheme } from '@/contexts/ThemeContext';

interface Props extends React.InputHTMLAttributes<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement> {
  label: string;
  error?: string;
  helpText?: string;
  as?: 'input' | 'select' | 'textarea';
  options?: { label: string; value: string | number }[];
}

const FormField = React.forwardRef<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement, Props>(
  ({ label, error, helpText, className, as = 'input', options, ...props }, ref) => {
    const { theme } = useTheme();
    const isDay = theme === 'day';
    
    const baseInputClasses = cn(
      "mt-1.5 block w-full rounded-lg px-3.5 py-2.5 text-sm outline-none transition-all duration-200",
      isDay
        ? "border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:border-[#1264FF] focus:ring-2 focus:ring-[#1264FF]/20 shadow-xs"
        : "border border-white/15 bg-[#0B1A30]/90 text-white placeholder-slate-400 focus:border-[#D9A441] focus:ring-2 focus:ring-[#D9A441]/20",
      error ? (isDay ? "border-red-400 text-red-900 focus:border-red-500 focus:ring-red-500/20" : "border-red-500/50 text-red-200 focus:border-red-400 focus:ring-red-400/20") : "",
      className
    );

    return (
      <div className="mb-4">
        <label className={cn("block text-xs font-black uppercase tracking-wider", isDay ? "text-slate-700" : "text-slate-300")}>
          {label}
        </label>
        
        {as === 'input' && (
          <input
            ref={ref as React.Ref<HTMLInputElement>}
            className={baseInputClasses}
            {...(props as React.InputHTMLAttributes<HTMLInputElement>)}
          />
        )}
        
        {as === 'textarea' && (
          <textarea
            ref={ref as React.Ref<HTMLTextAreaElement>}
            className={baseInputClasses}
            rows={4}
            {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
          />
        )}
        
        {as === 'select' && (
          <select
            ref={ref as React.Ref<HTMLSelectElement>}
            className={baseInputClasses}
            {...(props as React.SelectHTMLAttributes<HTMLSelectElement>)}
          >
            {options?.map((opt) => (
              <option key={opt.value} value={opt.value} className={isDay ? "bg-white text-slate-900" : "bg-[#071426] text-white"}>
                {opt.label}
              </option>
            ))}
          </select>
        )}

        {helpText && !error && (
          <p className={cn("mt-1.5 text-xs", isDay ? "text-slate-500" : "text-slate-400")}>{helpText}</p>
        )}
        
        {error && (
          <p className="mt-1.5 text-xs font-semibold text-red-500">{error}</p>
        )}
      </div>
    );
  }
);
FormField.displayName = 'FormField';
export default FormField;