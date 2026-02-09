import { useCallback, useState, useRef } from 'react';
import { Upload, ImagePlus, Play, AlertCircle } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import type { ProcessedImage } from '../types';

interface DropZoneProps {
  image?: ProcessedImage | null;
  onProcess?: () => void;
}

export default function DropZone({ image, onProcess }: DropZoneProps) {
  const { addImages } = useApp();
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      addImages(Array.from(files));
    },
    [addImages],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const hasImage = image && image.status !== 'done';
  const isIdle = image?.status === 'idle';
  const isProcessing = image?.status === 'processing';
  const isError = image?.status === 'error';

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`
        relative rounded-2xl overflow-hidden transition-all duration-200
        ${hasImage
          ? 'bg-gray-100 dark:bg-gray-800'
          : `cursor-pointer border-2 border-dashed active:scale-[0.98] ${
              isDragOver
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 scale-[1.02]'
                : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-gray-50 dark:hover:bg-gray-800/50'
            }`
        }
        ${isDragOver && hasImage ? 'ring-4 ring-blue-500/50' : ''}
      `}
      onClick={!hasImage ? () => inputRef.current?.click() : undefined}
    >
      {/* Empty state: upload UI */}
      {!hasImage && (
        <div className="flex flex-col items-center justify-center gap-3 sm:gap-4 p-8 sm:p-12">
          <div
            className={`p-3 sm:p-4 rounded-full transition-colors ${
              isDragOver
                ? 'bg-blue-100 dark:bg-blue-900'
                : 'bg-gray-100 dark:bg-gray-800'
            }`}
          >
            {isDragOver ? (
              <ImagePlus className="w-8 h-8 sm:w-10 sm:h-10 text-blue-500" />
            ) : (
              <Upload className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400 dark:text-gray-500" />
            )}
          </div>
          <div className="text-center">
            <p className="text-base sm:text-lg font-medium text-gray-700 dark:text-gray-200">
              {isDragOver ? '여기에 놓으세요!' : '이미지를 드래그하거나 탭하여 업로드'}
            </p>
            <p className="text-xs sm:text-sm text-gray-400 dark:text-gray-500 mt-1">
              PNG, JPEG, WEBP (최대 20MB)
            </p>
          </div>
        </div>
      )}

      {/* Image loaded state */}
      {hasImage && image && (
        <>
          <img
            src={image.originalUrl}
            alt={image.file.name}
            className="w-full max-h-[50dvh] sm:max-h-[60vh] object-contain"
          />

          {/* Drag overlay when dragging new image over */}
          {isDragOver && (
            <div className="absolute inset-0 flex items-center justify-center bg-blue-500/30 backdrop-blur-sm z-10">
              <div className="flex flex-col items-center gap-2 text-white">
                <ImagePlus className="w-10 h-10" />
                <span className="font-medium">새 이미지로 교체</span>
              </div>
            </div>
          )}

          {/* Idle: show process button */}
          {isIdle && !isDragOver && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <button
                onClick={onProcess}
                className="flex items-center gap-2 px-5 py-3 sm:px-6 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white rounded-xl font-medium shadow-lg transition-transform active:scale-95"
              >
                <Play className="w-5 h-5" />
                배경 제거 시작
              </button>
            </div>
          )}

          {/* Processing */}
          {isProcessing && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 gap-2 sm:gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
              <div className="text-white font-medium text-sm sm:text-base">
                처리 중... {image.progress}%
              </div>
              <div className="w-40 sm:w-48 bg-white/20 rounded-full h-2">
                <div
                  className="h-full bg-white rounded-full transition-all duration-300"
                  style={{ width: `${image.progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Error */}
          {isError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 gap-2 px-4">
              <AlertCircle className="w-7 h-7 sm:w-8 sm:h-8 text-red-400" />
              <span className="text-red-300 text-xs sm:text-sm text-center">{image.error}</span>
              <button
                onClick={onProcess}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white rounded-lg text-sm"
              >
                다시 시도
              </button>
            </div>
          )}
        </>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        multiple
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = '';
        }}
      />
    </div>
  );
}
