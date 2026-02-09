import { X, Play, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import type { ProcessedImage } from '../types';
import ProgressBar from './ProgressBar';

interface ImageCardProps {
  image: ProcessedImage;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
  onProcess: () => void;
}

export default function ImageCard({
  image,
  isSelected,
  onSelect,
  onRemove,
  onProcess,
}: ImageCardProps) {
  return (
    <div
      onClick={onSelect}
      className={`
        relative group rounded-xl overflow-hidden cursor-pointer border-2 transition-all duration-200
        active:scale-[0.97]
        ${
          isSelected
            ? 'border-blue-500 ring-2 ring-blue-500/30'
            : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
        }
      `}
    >
      <div className="aspect-square bg-gray-100 dark:bg-gray-800 relative overflow-hidden">
        <img
          src={image.compositeUrl ?? image.removedBgUrl ?? image.originalUrl}
          alt={image.file.name}
          className="w-full h-full object-cover"
          draggable={false}
        />

        {image.status === 'processing' && (
          <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2 p-3">
            <Loader2 className="w-6 h-6 text-white animate-spin" />
            <ProgressBar progress={image.progress} />
            <span className="text-xs text-white">{image.progress}%</span>
          </div>
        )}

        {image.status === 'done' && (
          <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2">
            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
          </div>
        )}

        {image.status === 'error' && (
          <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-1 p-2 sm:p-3">
            <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-400" />
            <span className="text-[10px] sm:text-xs text-red-300 text-center line-clamp-2">{image.error}</span>
          </div>
        )}
      </div>

      {/* Controls: always visible on touch, hover on desktop */}
      <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="p-1.5 sm:p-1 rounded-full bg-black/60 hover:bg-black/80 active:bg-black/90 text-white transition-colors"
          aria-label="삭제"
        >
          <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
        {image.status === 'idle' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onProcess();
            }}
            className="p-1.5 sm:p-1 rounded-full bg-blue-500/80 hover:bg-blue-600 active:bg-blue-700 text-white transition-colors"
            aria-label="처리"
          >
            <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        )}
      </div>

      <div className="p-1.5 sm:p-2">
        <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 truncate">{image.file.name}</p>
        <p className="text-[9px] sm:text-[10px] text-gray-400 dark:text-gray-500">
          {image.width} x {image.height}
        </p>
      </div>
    </div>
  );
}
