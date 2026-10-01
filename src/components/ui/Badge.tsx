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
  const baseStyle = "inline-flex items-center justify-center font-bold uppercase tracking-wider rounded-none";
  const sizeStyles = {
    sm: "px-2 py-1 text-[10px]",
    md: "px-3 py-1.5 text-xs",
  };

  let variantStyle = "bg-white/10 text-white"; // default

  if (status === 'live') variantStyle = "bg-red-500/20 text-[#FF4D3D] border border-[#FF4D3D]/50";
  else if (status === 'paused') variantStyle = "bg-amber-500/20 text-[#D9A441] border border-[#D9A441]/50";
  else if (status === 'upcoming') variantStyle = "bg-blue-500/20 text-[#1264FF] border border-[#1264FF]/50";
  else if (status === 'completed') variantStyle = "bg-green-500/20 text-green-400 border border-green-400/50";
  else if (status === 'cancelled') variantStyle = "bg-gray-500/20 text-gray-400 border border-gray-400/50";
  else if (sport) variantStyle = "bg-[#071426] text-[#D9A441] border border-[#D9A441]/30";

  return (
    <div className={cn(baseStyle, sizeStyles[size], variantStyle, className)}>
      {status === 'live' && (
        <span className="w-1.5 h-1.5 rounded-full bg-[#FF4D3D] animate-pulse mr-1.5" />
      )}
      {status === 'paused' && (
        <span className="w-1.5 h-1.5 rounded-full bg-[#D9A441] mr-1.5" />
      )}
      {children}
    </div>
  );
};
