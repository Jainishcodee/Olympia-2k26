import React from 'react';
import { cn } from '@/utils/cn';
import { FiChevronUp, FiChevronDown, FiMoreVertical, FiEdit2, FiTrash2 } from 'react-icons/fi';
import LoadingSkeleton from './LoadingSkeleton';
import EmptyState from './EmptyState';

export interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  className?: string;
  sortable?: boolean;
}

interface Props<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  onRowClick?: (item: T) => void;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  isLoading?: boolean;
  emptyState?: React.ReactNode;
}

export function DataTable<T>({ 
  columns, 
  data, 
  keyExtractor, 
  onRowClick,
  onEdit,
  onDelete,
  isLoading,
  emptyState 
}: Props<T>) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4"><LoadingSkeleton type="table" /></div>
      </div>
    );
  }

  if (data.length === 0) {
    return emptyState ? <>{emptyState}</> : (
      <EmptyState title="No data found" description="There are no items to display." />
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((col, i) => (
                <th 
                  key={i} 
                  scope="col" 
                  className={cn(
                    "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",
                    col.className
                  )}
                >
                  {col.header}
                </th>
              ))}
              {(onEdit || onDelete) && (
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((item) => (
              <tr 
                key={keyExtractor(item)}
                onClick={() => onRowClick && onRowClick(item)}
                className={cn(
                  "hover:bg-gray-50 transition-colors", 
                  onRowClick ? "cursor-pointer" : ""
                )}
              >
                {columns.map((col, i) => (
                  <td key={i} className={cn("px-6 py-4 whitespace-nowrap text-sm text-gray-900", col.className)}>
                    {typeof col.accessor === 'function' ? col.accessor(item) : String(item[col.accessor])}
                  </td>
                ))}
                {(onEdit || onDelete) && (
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                      {onEdit && (
                        <button onClick={() => onEdit(item)} className="text-blue-600 hover:text-blue-900 bg-blue-50 p-1.5 rounded-md">
                          <FiEdit2 size={16} />
                        </button>
                      )}
                      {onDelete && (
                        <button onClick={() => onDelete(item)} className="text-red-600 hover:text-red-900 bg-red-50 p-1.5 rounded-md">
                          <FiTrash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
export default DataTable;