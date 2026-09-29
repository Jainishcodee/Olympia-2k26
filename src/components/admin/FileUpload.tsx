import React, { useRef, useState } from 'react';
import { FiUploadCloud, FiX } from 'react-icons/fi';

interface Props {
  onUpload: (file: File) => void;
  accept?: string;
  previewUrl?: string;
  onClear?: () => void;
}

const FileUpload: React.FC<Props> = ({ onUpload, accept = 'image/*', previewUrl, onClear }) => {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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
          <img src={previewUrl} alt="Preview" className="h-32 w-32 object-cover rounded-md border border-gray-200" />
          {onClear && (
            <button 
              type="button"
              onClick={onClear}
              className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full p-1 hover:bg-red-200"
            >
              <FiX size={16} />
            </button>
          )}
        </div>
      ) : (
        <div 
          className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-colors ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:bg-gray-50'}`}
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
          <FiUploadCloud className="h-10 w-10 text-gray-400 mb-2" />
          <p className="text-sm font-medium text-gray-700">Click to upload or drag and drop</p>
          <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 5MB</p>
        </div>
      )}
    </div>
  );
};

export default FileUpload;