import React from 'react';
import { cn } from '@/utils/cn';
import { IconType } from 'react-icons';
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
  if (isLoading) {
    return <LoadingSkeleton type="card" />;
  }

  return (
    <div className={cn("bg-white rounded-lg shadow p-5", className)}>
      <div className="flex items-center">
        <div className="flex-shrink-0 bg-blue-50 p-3 rounded-lg">
          <Icon className="h-6 w-6 text-[#1264FF]" />
        </div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
            <dd className="flex items-baseline">
              <div className="text-2xl font-semibold text-gray-900">{value}</div>
              {trend && (
                <div className={cn(
                  "ml-2 flex items-baseline text-sm font-semibold",
                  trend.isPositive ? "text-green-600" : "text-red-600"
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