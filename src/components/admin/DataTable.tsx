import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';
import { useTheme } from '@/contexts/ThemeContext';
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
  const { theme } = useTheme();
  const isDay = theme === 'day';

  if (isLoading) {
    return (
      <div className={cn(
        'rounded-xl border overflow-hidden transition-colors',
        isDay ? 'border-slate-200 bg-white/95 shadow-xs' : 'border-white/10 bg-[#071426]/85 backdrop-blur-xl',
      )}>
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
    <div className={cn(
      'rounded-xl border overflow-hidden transition-colors',
      isDay ? 'border-slate-200 bg-white/95 shadow-xs' : 'border-white/10 bg-[#071426]/85 backdrop-blur-xl',
    )}>
      <div className="overflow-x-auto smooth-scroll-x">
        <table className="min-w-full divide-y transition-colors">
          <thead className={isDay ? 'bg-slate-50/90 text-slate-600 border-b border-slate-200' : 'bg-[#0B1A30]/60 text-slate-400 border-b border-white/10'}>
            <tr>
              {columns.map((col, i) => (
                <th 
                  key={i} 
                  scope="col" 
                  className={cn(
                    "px-6 py-3.5 text-left text-[10px] font-black uppercase tracking-wider",
                    col.className
                  )}
                >
                  {col.header}
                </th>
              ))}
              {(onEdit || onDelete) && (
                <th scope="col" className="relative px-6 py-3.5 text-right text-[10px] font-black uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className={cn('divide-y', isDay ? 'divide-slate-100 bg-white' : 'divide-white/5 bg-transparent')}>
            {data.map((item) => (
              <tr 
                key={keyExtractor(item)}
                onClick={() => onRowClick && onRowClick(item)}
                className={cn(
                  "transition-colors",
                  isDay ? "hover:bg-slate-50/80" : "hover:bg-white/[0.03]",
                  onRowClick ? "cursor-pointer" : ""
                )}
              >
                {columns.map((col, i) => (
                  <td key={i} className={cn("px-6 py-4 whitespace-nowrap text-sm", isDay ? "text-slate-800 font-medium" : "text-slate-200", col.className)}>
                    {typeof col.accessor === 'function' ? col.accessor(item) : String(item[col.accessor])}
                  </td>
                ))}
                {(onEdit || onDelete) && (
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                      {onEdit && (
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.94 }}
                          onClick={() => onEdit(item)}
                          title="Edit"
                          className={cn(
                            'p-2 rounded-lg border transition-colors cursor-pointer',
                            isDay
                              ? 'border-blue-200 bg-blue-50/80 text-blue-600 hover:bg-blue-100 shadow-2xs'
                              : 'border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 shadow-2xs',
                          )}
                        >
                          <FiEdit2 size={14} />
                        </motion.button>
                      )}
                      {onDelete && (
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.94 }}
                          onClick={() => onDelete(item)}
                          title="Delete"
                          className={cn(
                            'p-2 rounded-lg border transition-colors cursor-pointer',
                            isDay
                              ? 'border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 shadow-2xs'
                              : 'border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 shadow-2xs',
                          )}
                        >
                          <FiTrash2 size={14} />
                        </motion.button>
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