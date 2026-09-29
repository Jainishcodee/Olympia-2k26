import React from 'react';

interface Props {
  type: 'card' | 'table' | 'text' | 'form';
  count?: number;
}

const LoadingSkeleton: React.FC<Props> = ({ type, count = 1 }) => {
  if (type === 'card') {
    return (
      <div className="bg-white rounded-lg shadow p-5 animate-pulse">
        <div className="flex items-center">
          <div className="flex-shrink-0 bg-gray-200 h-12 w-12 rounded-lg" />
          <div className="ml-5 w-0 flex-1">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
            <div className="h-6 bg-gray-200 rounded w-1/4" />
          </div>
        </div>
      </div>
    );
  }

  if (type === 'table') {
    return (
      <div className="animate-pulse flex flex-col space-y-4 p-4">
        <div className="h-8 bg-gray-200 rounded w-full" />
        {[...Array(count || 5)].map((_, i) => (
          <div key={i} className="h-12 bg-gray-100 rounded w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="animate-pulse space-y-2">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="h-4 bg-gray-200 rounded w-full" />
      ))}
    </div>
  );
};
export default LoadingSkeleton;