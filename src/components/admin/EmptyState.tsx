import React from 'react';
import { FiInbox } from 'react-icons/fi';
import { cn } from '@/utils/cn';

interface Props {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

const EmptyState: React.FC<Props> = ({ title, description, action, icon, className }) => {
  return (
    <div className={cn("text-center p-8 bg-white rounded-lg shadow border border-gray-100 border-dashed", className)}>
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 mb-4">
        {icon || <FiInbox className="h-6 w-6 text-gray-500" />}
      </div>
      <h3 className="mt-2 text-sm font-semibold text-gray-900">{title}</h3>
      {description && <p className="mt-1 text-sm text-gray-500 max-w-sm mx-auto">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
};
export default EmptyState;