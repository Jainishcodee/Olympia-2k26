import React from 'react';
import { FiAlertTriangle } from 'react-icons/fi';
import { cn } from '@/utils/cn';
import { useTheme } from '@/contexts/ThemeContext';

interface Props {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDestructive?: boolean;
}

const ConfirmDialog: React.FC<Props> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  isDestructive = false
}) => {
  const { theme } = useTheme();
  const isDay = theme === 'day';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:p-0">
        <div 
          className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity" 
          aria-hidden="true" 
          onClick={onCancel}
        />

        <div
          className={cn(
            'relative inline-block transform overflow-hidden rounded-2xl text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-lg border backdrop-blur-2xl z-10',
            isDay ? 'bg-white border-slate-200 text-slate-900 shadow-slate-900/10' : 'bg-[#071426] border-white/10 text-white shadow-black/80',
          )}
        >
          <div className="px-6 pt-6 pb-5 sm:p-7 sm:pb-5">
            <div className="sm:flex sm:items-start">
              <div
                className={cn(
                  'mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl sm:mx-0 sm:h-11 sm:w-11 border',
                  isDestructive
                    ? isDay
                      ? 'bg-red-50 border-red-200 text-red-600'
                      : 'bg-red-500/15 border-red-500/30 text-red-400'
                    : isDay
                      ? 'bg-blue-50 border-blue-200 text-[#1264FF]'
                      : 'bg-[#1264FF]/15 border-[#1264FF]/30 text-blue-400',
                )}
              >
                <FiAlertTriangle className="h-6 w-6" aria-hidden="true" />
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left min-w-0 flex-1">
                <h3
                  className={cn(
                    'text-lg font-black tracking-tight',
                    isDay ? 'text-slate-900' : 'text-white',
                  )}
                  id="modal-title"
                >
                  {title}
                </h3>
                <div className="mt-2">
                  <p className={cn('text-sm leading-relaxed', isDay ? 'text-slate-600' : 'text-slate-400')}>
                    {message}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div
            className={cn(
              'px-6 py-4 sm:flex sm:flex-row-reverse sm:px-7 gap-3 border-t transition-colors',
              isDay ? 'bg-slate-50/80 border-slate-100' : 'bg-black/20 border-white/5',
            )}
          >
            <button
              type="button"
              className={cn(
                'inline-flex w-full justify-center rounded-xl px-4 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-sm focus:outline-none sm:w-auto cursor-pointer transition-all',
                isDestructive 
                  ? 'bg-red-600 hover:bg-red-700 shadow-red-600/30' 
                  : 'bg-gradient-to-r from-[#1264FF] to-[#1747B8] hover:from-[#1747B8] hover:to-[#1264FF] shadow-blue-500/30'
              )}
              onClick={onConfirm}
            >
              {confirmText}
            </button>
            <button
              type="button"
              className={cn(
                'mt-3 inline-flex w-full justify-center rounded-xl border px-4 py-2.5 text-xs font-bold uppercase tracking-wider shadow-sm sm:mt-0 sm:w-auto cursor-pointer transition-all',
                isDay
                  ? 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                  : 'border-white/10 bg-[#0B1A30]/80 text-slate-300 hover:bg-[#102442] hover:text-white',
              )}
              onClick={onCancel}
            >
              {cancelText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;