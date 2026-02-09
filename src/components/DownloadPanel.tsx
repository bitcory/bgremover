import { useState } from 'react';
import { Download, ImagePlus } from 'lucide-react';
import type { ImageFormat } from '../types';

interface DownloadPanelProps {
  onDownload: (format: ImageFormat) => void;
  onNewImage: () => void;
  disabled: boolean;
}

export default function DownloadPanel({ onDownload, onNewImage, disabled }: DownloadPanelProps) {
  const [format, setFormat] = useState<ImageFormat>('png');

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">다운로드</h3>

      <div className="flex rounded-lg bg-gray-100 dark:bg-gray-800 p-0.5">
        {(['png', 'webp'] as ImageFormat[]).map((f) => (
          <button
            key={f}
            onClick={() => setFormat(f)}
            className={`flex-1 text-xs py-2 sm:py-1.5 rounded-md transition-colors font-medium uppercase ${
              format === f
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onDownload(format)}
          disabled={disabled}
          className="flex-1 flex items-center justify-center gap-2 py-3 sm:py-2.5 rounded-lg bg-blue-500 hover:bg-blue-600 active:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white disabled:text-gray-500 font-medium text-sm transition-colors"
        >
          <Download className="w-4 h-4" />
          다운로드
        </button>
        <button
          onClick={onNewImage}
          className="flex items-center justify-center gap-2 px-4 py-3 sm:py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 active:bg-gray-200 dark:active:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium text-sm transition-colors"
        >
          <ImagePlus className="w-4 h-4" />
          <span className="hidden sm:inline">새 이미지</span>
        </button>
      </div>
    </div>
  );
}
