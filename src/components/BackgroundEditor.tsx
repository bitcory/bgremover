import { useRef } from 'react';
import { ImagePlus } from 'lucide-react';
import type { Background, BackgroundType } from '../types';
import { PRESET_COLORS } from '../types';

interface BackgroundEditorProps {
  background: Background;
  onChange: (bg: Background) => void;
}

const TAB_LABELS: { type: BackgroundType; label: string }[] = [
  { type: 'transparent', label: '투명' },
  { type: 'color', label: '단색' },
  { type: 'image', label: '이미지' },
];

export default function BackgroundEditor({ background, onChange }: BackgroundEditorProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  const setType = (type: BackgroundType) => {
    onChange({ ...background, type });
  };

  const setColor = (color: string) => {
    onChange({ ...background, type: 'color', color });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    onChange({ ...background, type: 'image', imageUrl: url });
    e.target.value = '';
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">배경 설정</h3>

      {/* Tab selector */}
      <div className="flex rounded-lg bg-gray-100 dark:bg-gray-800 p-0.5">
        {TAB_LABELS.map(({ type, label }) => (
          <button
            key={type}
            onClick={() => setType(type)}
            className={`flex-1 text-xs sm:text-xs py-2 sm:py-1.5 rounded-md transition-colors font-medium ${
              background.type === type
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Color panel */}
      {background.type === 'color' && (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2.5 sm:gap-2">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-9 h-9 sm:w-7 sm:h-7 rounded-full border-2 transition-transform hover:scale-110 active:scale-95 ${
                  background.color === c ? 'border-blue-500 scale-110' : 'border-gray-300 dark:border-gray-600'
                }`}
                style={{ backgroundColor: c }}
                aria-label={c}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={background.color}
              onChange={(e) => setColor(e.target.value)}
              className="w-9 h-9 sm:w-8 sm:h-8 rounded cursor-pointer border-0"
            />
            <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
              {background.color}
            </span>
          </div>
        </div>
      )}

      {/* Image panel */}
      {background.type === 'image' && (
        <div>
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 py-3.5 sm:py-3 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 active:border-blue-500 text-sm text-gray-500 dark:text-gray-400 transition-colors"
          >
            <ImagePlus className="w-4 h-4" />
            배경 이미지 선택
          </button>
          {background.imageUrl && (
            <img
              src={background.imageUrl}
              alt="Background"
              className="mt-2 w-full h-20 object-cover rounded-lg"
            />
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
        </div>
      )}

      {/* Transparent info */}
      {background.type === 'transparent' && (
        <p className="text-xs text-gray-400 dark:text-gray-500">
          배경이 투명한 PNG로 저장됩니다.
        </p>
      )}
    </div>
  );
}
