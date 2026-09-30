import React, { useRef, useState } from 'react';
import { FiUploadCloud, FiX } from 'react-icons/fi';
import { cn } from '@/utils/cn';
import { useTheme } from '@/contexts/ThemeContext';

interface Props {
  onUpload: (file: File) => void;
  accept?: string;
  previewUrl?: string;
  onClear?: () => void;
}

const FileUpload: React.FC<Props> = ({ onUpload, accept = 'image/*', previewUrl, onClear }) => {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { theme } = useTheme();
  const isDay = theme === 'day';

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onUpload(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      onUpload(e.target.files[0]);
    }
  };

  return (
    <div className="w-full">
      {previewUrl ? (
        <div className="relative inline-block">
          <img
            src={previewUrl}
            alt="Preview"
            className={cn(
              "h-32 w-32 object-cover rounded-xl border",
              isDay ? "border-slate-200 bg-white" : "border-white/20 bg-[#071426]",
            )}
          />
          {onClear && (
            <button 
              type="button"
              onClick={onClear}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 cursor-pointer"
            >
              <FiX size={14} />
            </button>
          )}
        </div>
      ) : (
        <div 
          className={cn(
            "border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all",
            dragActive
              ? "border-[#1264FF] bg-blue-50/20"
              : isDay
                ? "border-slate-300 bg-white hover:bg-slate-50 hover:border-slate-400"
                : "border-white/15 bg-[#0B1A30]/60 hover:bg-[#0B1A30]/90 hover:border-white/30"
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <input 
            ref={inputRef}
            type="file" 
            className="hidden" 
            accept={accept}
            onChange={handleChange}
          />
          <FiUploadCloud className={cn("h-10 w-10 mb-2", isDay ? "text-[#1264FF]" : "text-[#D9A441]")} />
          <p className={cn("text-xs font-bold uppercase tracking-wider", isDay ? "text-slate-800" : "text-white")}>
            Click to upload or drag and drop
          </p>
          <p className={cn("text-xs mt-1", isDay ? "text-slate-500" : "text-slate-400")}>
            PNG, JPG, GIF, WebP up to 5MB
          </p>
        </div>
      )}
    </div>
  );
};

export default FileUpload;