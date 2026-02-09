import { Play, Trash2, Plus } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import ImageCard from './ImageCard';
import { useRef } from 'react';

export default function ProcessingQueue() {
  const { images, selectedId, selectImage, removeImage, processImage, processAll, clearAll, addImages } = useApp();
  const inputRef = useRef<HTMLInputElement>(null);

  const hasIdle = images.some((img) => img.status === 'idle');

  return (
    <div className="flex flex-col gap-3">
      {/* Action bar - scrollable on mobile */}
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 shrink-0">
          이미지 ({images.length})
        </h2>
        <div className="flex gap-1.5 sm:gap-2 overflow-x-auto hide-scrollbar">
          <button
            onClick={() => inputRef.current?.click()}
            className="flex items-center gap-1 px-2.5 py-1.5 sm:px-2 sm:py-1 text-xs rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 active:bg-gray-300 dark:active:bg-gray-600 text-gray-600 dark:text-gray-300 transition-colors shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>추가</span>
          </button>
          {hasIdle && (
            <button
              onClick={processAll}
              className="flex items-center gap-1 px-2.5 py-1.5 sm:px-2 sm:py-1 text-xs rounded-lg bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white transition-colors shrink-0"
            >
              <Play className="w-3.5 h-3.5" />
              <span>모두 처리</span>
            </button>
          )}
          <button
            onClick={clearAll}
            className="flex items-center gap-1 px-2.5 py-1.5 sm:px-2 sm:py-1 text-xs rounded-lg bg-red-500/10 hover:bg-red-500/20 active:bg-red-500/30 text-red-500 transition-colors shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>삭제</span>
          </button>
        </div>
      </div>

      {/* Grid: 3 cols on mobile, scales up on larger screens */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-3 gap-2 sm:gap-3">
        {images.map((img) => (
          <ImageCard
            key={img.id}
            image={img}
            isSelected={img.id === selectedId}
            onSelect={() => selectImage(img.id)}
            onRemove={() => removeImage(img.id)}
            onProcess={() => processImage(img.id)}
          />
        ))}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) addImages(Array.from(e.target.files));
          e.target.value = '';
        }}
      />
    </div>
  );
}
