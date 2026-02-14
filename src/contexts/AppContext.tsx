import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';
import type { ProcessedImage, Background, ImageFormat } from '../types';
import { DEFAULT_BACKGROUND } from '../types';
import { createPreviewUrl, generateId, getImageDimensions, validateImageFile } from '../utils/file';
import { useBackgroundRemoval } from '../hooks/useBackgroundRemoval';
import { useCanvasComposite } from '../hooks/useCanvasComposite';
import { downloadImage, generateFilename } from '../utils/download';

interface AppContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  images: ProcessedImage[];
  selectedId: string | null;
  selectedImage: ProcessedImage | null;
  addImages: (files: File[]) => void;
  removeImage: (id: string) => void;
  clearAll: () => void;
  selectImage: (id: string | null) => void;
  processImage: (id: string) => Promise<void>;
  processAll: () => void;
  updateBackground: (id: string, bg: Background) => void;
  updateEditedBg: (id: string, url: string | null) => void;
  downloadResult: (id: string, format: ImageFormat) => void;
  fileErrors: string[];
  clearErrors: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme');
      if (stored === 'dark' || stored === 'light') return stored;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });
  const [images, setImages] = useState<ProcessedImage[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [fileErrors, setFileErrors] = useState<string[]>([]);
  const { remove } = useBackgroundRemoval();
  const { composite } = useCanvasComposite();
  const processingRef = useRef(new Set<string>());
  const imagesRef = useRef(images);
  imagesRef.current = images;

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === 'light' ? 'dark' : 'light'));
  }, []);

  const addImages = useCallback((files: File[]) => {
    const errors: string[] = [];
    const validFiles: File[] = [];
    for (const file of files) {
      const err = validateImageFile(file);
      if (err) errors.push(`${file.name}: ${err}`);
      else validFiles.push(file);
    }
    if (errors.length) setFileErrors(errors);

    if (validFiles.length === 0) return;

    const newImages: ProcessedImage[] = [];
    const promises = validFiles.map(async (file) => {
      const url = createPreviewUrl(file);
      const dims = await getImageDimensions(url);
      const img: ProcessedImage = {
        id: generateId(),
        file,
        originalUrl: url,
        removedBgUrl: null,
        editedBgUrl: null,
        compositeUrl: null,
        status: 'idle',
        progress: 0,
        error: null,
        width: dims.width,
        height: dims.height,
        background: { ...DEFAULT_BACKGROUND },
      };
      newImages.push(img);
    });

    Promise.all(promises).then(() => {
      setImages((prev) => {
        const updated = [...prev, ...newImages];
        return updated;
      });
      setSelectedId((prev) => prev ?? newImages[0]?.id ?? null);
    });
  }, []);

  const removeImage = useCallback((id: string) => {
    setImages((prev) => {
      const img = prev.find((i) => i.id === id);
      if (img) {
        URL.revokeObjectURL(img.originalUrl);
        if (img.removedBgUrl) URL.revokeObjectURL(img.removedBgUrl);
        if (img.editedBgUrl) URL.revokeObjectURL(img.editedBgUrl);
        if (img.compositeUrl) URL.revokeObjectURL(img.compositeUrl);
      }
      return prev.filter((i) => i.id !== id);
    });
    setSelectedId((prev) => (prev === id ? null : prev));
  }, []);

  const clearAll = useCallback(() => {
    setImages((prev) => {
      for (const img of prev) {
        URL.revokeObjectURL(img.originalUrl);
        if (img.removedBgUrl) URL.revokeObjectURL(img.removedBgUrl);
        if (img.editedBgUrl) URL.revokeObjectURL(img.editedBgUrl);
        if (img.compositeUrl) URL.revokeObjectURL(img.compositeUrl);
      }
      return [];
    });
    setSelectedId(null);
  }, []);

  const selectImage = useCallback((id: string | null) => {
    setSelectedId(id);
  }, []);

  const updateImageField = useCallback(
    (id: string, update: Partial<ProcessedImage>) => {
      setImages((prev) => prev.map((img) => (img.id === id ? { ...img, ...update } : img)));
    },
    [],
  );

  const processImage = useCallback(
    async (id: string) => {
      if (processingRef.current.has(id)) return;
      processingRef.current.add(id);

      updateImageField(id, { status: 'processing', progress: 0, error: null });

      try {
        const img = imagesRef.current.find((i) => i.id === id);
        if (!img) throw new Error('Image not found');
        const blob = await remove(img.file, {
          onProgress: (p) => updateImageField(id, { progress: p }),
        });
        const removedBgUrl = URL.createObjectURL(blob);
        updateImageField(id, { status: 'done', progress: 100, removedBgUrl });
      } catch (err) {
        const message = err instanceof Error ? err.message : '배경 제거 중 오류가 발생했습니다.';
        updateImageField(id, { status: 'error', error: message });
      } finally {
        processingRef.current.delete(id);
      }
    },
    [remove, updateImageField],
  );

  const processAll = useCallback(async () => {
    const idle = imagesRef.current.filter((img) => img.status === 'idle');
    const CONCURRENCY = 2;
    let index = 0;

    async function next(): Promise<void> {
      if (index >= idle.length) return;
      const img = idle[index++];
      await processImage(img.id);
      return next();
    }

    const workers = Array.from({ length: Math.min(CONCURRENCY, idle.length) }, () => next());
    await Promise.all(workers);
  }, [processImage]);

  const updateBackground = useCallback(
    async (id: string, bg: Background) => {
      updateImageField(id, { background: bg });

      const img = imagesRef.current.find((i) => i.id === id);
      if (!img?.removedBgUrl) return;

      const fgUrl = img.editedBgUrl ?? img.removedBgUrl;
      try {
        const url = await composite(fgUrl, bg, img.width, img.height);
        if (img.compositeUrl) URL.revokeObjectURL(img.compositeUrl);
        updateImageField(id, { compositeUrl: bg.type === 'transparent' ? null : url });
      } catch {
        // ignore composite errors
      }
    },
    [composite, updateImageField],
  );

  const updateEditedBg = useCallback(
    async (id: string, url: string | null) => {
      const img = imagesRef.current.find((i) => i.id === id);
      if (!img) return;
      if (img.editedBgUrl) URL.revokeObjectURL(img.editedBgUrl);
      updateImageField(id, { editedBgUrl: url });

      // Re-composite with new edited foreground
      const fgUrl = url ?? img.removedBgUrl;
      if (!fgUrl) return;
      try {
        const compositeUrl = await composite(fgUrl, img.background, img.width, img.height);
        if (img.compositeUrl) URL.revokeObjectURL(img.compositeUrl);
        updateImageField(id, { compositeUrl: img.background.type === 'transparent' ? null : compositeUrl });
      } catch {
        // ignore composite errors
      }
    },
    [composite, updateImageField],
  );

  const downloadResult = useCallback(
    (id: string, format: ImageFormat) => {
      const img = imagesRef.current.find((i) => i.id === id);
      if (!img) return;

      const url = img.compositeUrl ?? img.editedBgUrl ?? img.removedBgUrl;
      if (!url) return;

      const filename = generateFilename(img.file.name, format);
      downloadImage(url, filename, format);
    },
    [],
  );

  const clearErrors = useCallback(() => setFileErrors([]), []);

  const selectedImage = images.find((i) => i.id === selectedId) ?? null;

  return (
    <AppContext.Provider
      value={{
        theme,
        toggleTheme,
        images,
        selectedId,
        selectedImage,
        addImages,
        removeImage,
        clearAll,
        selectImage,
        processImage,
        processAll,
        updateBackground,
        updateEditedBg,
        downloadResult,
        fileErrors,
        clearErrors,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
