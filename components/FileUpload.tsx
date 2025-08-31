
import React, { useState, useCallback } from 'react';
import { UploadIcon } from './icons/UploadIcon';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFile = (file: File | null) => {
    if (file && (file.type.startsWith('image/') || file.type === 'application/pdf')) {
      setFileName(file.name);
      onFileSelect(file);
    } else {
      alert('Please upload a valid image (PNG, JPG, etc.) or PDF file.');
    }
  };

  const onDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  }, []);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-300">Upload Document</label>
      <div
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
        className={`relative block w-full h-48 rounded-lg border-2 border-dashed ${isDragging ? 'border-cyan-400 bg-gray-700/50' : 'border-gray-600'} transition-colors duration-200 ease-in-out`}
      >
        <div className="flex flex-col justify-center items-center h-full text-center p-4">
          <UploadIcon className="mx-auto h-12 w-12 text-gray-500" />
          <p className="mt-2 text-sm text-gray-400">
            <span className="font-semibold text-cyan-400">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-gray-500">Image or PDF files</p>
          {fileName && (
              <p className="mt-2 text-sm text-green-400 truncate max-w-full px-4">
                  Selected: {fileName}
              </p>
          )}
        </div>
        <input
          id="file-upload"
          name="file-upload"
          type="file"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={onFileChange}
          accept="image/*,application/pdf"
        />
      </div>
    </div>
  );
};
