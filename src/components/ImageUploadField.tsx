import React, { useState, useRef } from 'react';
import { Upload, Link as LinkIcon, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

interface ImageUploadFieldProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  folder?: string;
  placeholder?: string;
  className?: string;
}

export default function ImageUploadField({ 
  value, 
  onChange, 
  label, 
  folder = 'general', 
  placeholder = 'https://example.com/image.jpg',
  className = ''
}: ImageUploadFieldProps) {
  const { uploadImage } = useAppContext();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [mode, setMode] = useState<'url' | 'upload'>(value && !value.includes('firebasestorage') ? 'url' : 'upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file.');
      return;
    }

    // Validate file size (e.g., 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File size must be less than 5MB.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadError(null);

    try {
      const url = await uploadImage(file, folder, (progress) => {
        setUploadProgress(Math.round(progress));
      });
      onChange(url);
    } catch (error) {
      setUploadError('Failed to upload image. Please try again.');
      console.error(error);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const clearImage = () => {
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block">
          {label}
        </label>
      )}
      
      <div className="flex gap-2 mb-2">
        <button
          type="button"
          onClick={() => setMode('upload')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            mode === 'upload' 
              ? 'bg-emerald-600 text-white shadow-sm' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Upload className="w-3 h-3" /> Direct Upload
        </button>
        <button
          type="button"
          onClick={() => setMode('url')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            mode === 'url' 
              ? 'bg-emerald-600 text-white shadow-sm' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <LinkIcon className="w-3 h-3" /> Image URL
        </button>
      </div>

      {mode === 'upload' ? (
        <div className="space-y-3">
          {!value ? (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-emerald-500 hover:bg-emerald-50 transition-all ${
                isUploading ? 'pointer-events-none opacity-50' : ''
              }`}
            >
              {isUploading ? (
                <div className="flex flex-col items-center gap-2 w-full max-w-[200px]">
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 transition-all duration-300" 
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-xs font-bold text-emerald-600">{uploadProgress}% Uploaded</p>
                </div>
              ) : (
                <Upload className="w-8 h-8 text-gray-300" />
              )}
              <div className="text-center">
                <p className="text-sm font-bold text-gray-900">
                  {isUploading ? 'Uploading...' : 'Click to upload image'}
                </p>
                <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 5MB</p>
              </div>
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden" 
                accept="image/*"
              />
            </div>
          ) : (
            <div className="relative group rounded-xl overflow-hidden border border-gray-100">
              <img 
                src={value} 
                alt="Preview" 
                className="w-full h-48 object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 bg-white text-gray-900 rounded-full hover:bg-emerald-600 hover:text-white transition-colors"
                  title="Change Image"
                >
                  <Upload className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={clearImage}
                  className="p-2 bg-white text-red-600 rounded-full hover:bg-red-600 hover:text-white transition-colors"
                  title="Remove Image"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden" 
                accept="image/*"
              />
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="relative">
            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="url"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all font-medium text-sm"
            />
          </div>
          {value && (
            <div className="relative rounded-xl overflow-hidden border border-gray-100">
              <img 
                src={value} 
                alt="Preview" 
                className="w-full h-48 object-cover"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/error/800/600';
                }}
              />
              <button
                type="button"
                onClick={clearImage}
                className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-red-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {uploadError && (
        <p className="text-xs text-red-600 font-bold flex items-center gap-1">
          <X className="w-3 h-3" /> {uploadError}
        </p>
      )}
    </div>
  );
}
