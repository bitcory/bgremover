import { useCallback, useRef } from 'react';
import { removeBackground } from '@imgly/background-removal';

interface RemoveOptions {
  onProgress?: (progress: number) => void;
}

export function useBackgroundRemoval() {
  const abortControllerRef = useRef<AbortController | null>(null);

  const remove = useCallback(
    async (imageSource: string | Blob, options?: RemoveOptions): Promise<Blob> => {
      abortControllerRef.current = new AbortController();

      const blob = await removeBackground(imageSource, {
        progress: (_key: string, current: number, total: number) => {
          if (total > 0) {
            options?.onProgress?.(Math.round((current / total) * 100));
          }
        },
      });

      return blob as Blob;
    },
    [],
  );

  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  return { remove, cancel };
}
