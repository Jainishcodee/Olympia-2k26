import React from 'react';
import { cn } from '@/utils/cn';

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  fluid?: boolean;
}

export const Container: React.FC<ContainerProps> = ({ children, className, fluid = false }) => {
  return (
    <div className={cn("mx-auto px-4 sm:px-6 lg:px-8 w-full", fluid ? "max-w-none" : "max-w-7xl", className)}>
      {children}
    </div>
  );
};
