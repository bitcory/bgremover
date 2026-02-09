import { ACCEPTED_TYPES, MAX_FILE_SIZE } from '../types';

export function validateImageFile(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return 'PNG, JPEG, WEBP 형식만 지원합니다.';
  }
  if (file.size > MAX_FILE_SIZE) {
    return '파일 크기는 20MB 이하여야 합니다.';
  }
  return null;
}

export function getImageDimensions(
  url: string,
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = url;
  });
}

export function createPreviewUrl(file: File): string {
  return URL.createObjectURL(file);
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
