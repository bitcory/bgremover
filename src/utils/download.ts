import type { ImageFormat } from '../types';
import { loadImage, canvasToBlob } from './canvas';

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function generateFilename(
  originalName: string,
  format: ImageFormat,
): string {
  const base = originalName.replace(/\.[^.]+$/, '');
  return `${base}_no-bg.${format}`;
}

export async function downloadImage(
  imageUrl: string,
  filename: string,
  format: ImageFormat,
) {
  const img = await loadImage(imageUrl);
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0);
  const blob = await canvasToBlob(canvas, format);
  downloadBlob(blob, filename);
}
