import React from 'react';
import { cn } from '@/utils/cn';

interface Props extends React.InputHTMLAttributes<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement> {
  label: string;
  error?: string;
  helpText?: string;
  as?: 'input' | 'select' | 'textarea';
  options?: { label: string; value: string | number }[];
}

const FormField = React.forwardRef<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement, Props>(
  ({ label, error, helpText, className, as = 'input', options, ...props }, ref) => {
    
    const baseInputClasses = cn(
      "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#1264FF] focus:ring-[#1264FF] sm:text-sm",
      error ? "border-red-300 text-red-900 focus:border-red-500 focus:ring-red-500" : "border-gray-300",
      className
    );

    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">
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
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        )}

        {helpText && !error && (
          <p className="mt-2 text-sm text-gray-500">{helpText}</p>
        )}
        
        {error && (
          <p className="mt-2 text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  }
);
FormField.displayName = 'FormField';
export default FormField;