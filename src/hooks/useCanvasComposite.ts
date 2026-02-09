import { useCallback } from 'react';
import { loadImage } from '../utils/canvas';
import type { Background } from '../types';

export function useCanvasComposite() {
  const composite = useCallback(
    async (
      removedBgUrl: string,
      background: Background,
      width: number,
      height: number,
    ): Promise<string> => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;

      if (background.type === 'color') {
        ctx.fillStyle = background.color;
        ctx.fillRect(0, 0, width, height);
      } else if (background.type === 'image' && background.imageUrl) {
        const bgImg = await loadImage(background.imageUrl);
        ctx.drawImage(bgImg, 0, 0, width, height);
      }
      // transparent: leave canvas empty (transparent)

      const fgImg = await loadImage(removedBgUrl);
      ctx.drawImage(fgImg, 0, 0, width, height);

      return canvas.toDataURL('image/png');
    },
    [],
  );

  return { composite };
}
