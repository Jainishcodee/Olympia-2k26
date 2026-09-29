import React from 'react';
import { cn } from '@/utils/cn';

export const Spinner: React.FC<{ className?: string; size?: 'sm'|'md'|'lg' }> = ({ className, size = 'md' }) => {
  const sizeMap = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4'
  };
  
  return (
    <div className={cn("animate-spin rounded-full border-t-[#D9A441] border-r-transparent border-b-[#1747B8] border-l-transparent", sizeMap[size], className)} />
  );
};
