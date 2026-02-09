export type ImageStatus = 'idle' | 'processing' | 'done' | 'error';

export type BackgroundType = 'transparent' | 'color' | 'image';

export interface Background {
  type: BackgroundType;
  color: string;
  imageUrl: string | null;
}

export type ImageFormat = 'png' | 'webp';

export interface ProcessedImage {
  id: string;
  file: File;
  originalUrl: string;
  removedBgUrl: string | null;
  compositeUrl: string | null;
  status: ImageStatus;
  progress: number;
  error: string | null;
  width: number;
  height: number;
  background: Background;
}

export const DEFAULT_BACKGROUND: Background = {
  type: 'transparent',
  color: '#ffffff',
  imageUrl: null,
};

export const PRESET_COLORS = [
  '#ffffff',
  '#000000',
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#6b7280',
];

export const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
export const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
