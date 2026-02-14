import { useRef, useState, useCallback, useEffect } from 'react';
import { Undo2, Redo2, Check, ZoomIn, ZoomOut } from 'lucide-react';
import { loadImage } from '../utils/canvas';

interface ManualEraserProps {
  imageUrl: string;
  width: number;
  height: number;
  onSave: (url: string) => void;
}

const MAX_HISTORY = 20;
const MIN_ZOOM = 1;
const MAX_ZOOM = 10;
const MIN_BRUSH = 5;
const MAX_BRUSH = 100;

export default function ManualEraser({ imageUrl, width, height, onSave }: ManualEraserProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);

  const [brushSize, setBrushSize] = useState(30);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [cursorVisible, setCursorVisible] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  const historyRef = useRef<ImageData[]>([]);
  const historyIndexRef = useRef(-1);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  const isDrawingRef = useRef(false);
  const isPanningRef = useRef(false);
  const panStartMouseRef = useRef({ x: 0, y: 0 });
  const panStartValRef = useRef({ x: 0, y: 0 });
  const spaceHeldRef = useRef(false);

  // Refs synced with state for use in DOM event handlers
  const brushSizeRef = useRef(brushSize);
  brushSizeRef.current = brushSize;
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;
  const panRef = useRef(pan);
  panRef.current = pan;

  // Load image onto canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;
    loadImage(imageUrl).then((img) => {
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      historyRef.current = [];
      historyIndexRef.current = -1;
      saveToHistory();
    });
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [imageUrl, width, height]);

  // Space key for pan mode
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        spaceHeldRef.current = true;
        if (cursorRef.current) cursorRef.current.style.display = 'none';
        if (containerRef.current) containerRef.current.style.cursor = 'grab';
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        spaceHeldRef.current = false;
        if (containerRef.current) containerRef.current.style.cursor = 'none';
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  // Clamp pan so canvas can't go entirely off-screen
  const clampPan = useCallback((px: number, py: number, z: number) => {
    if (z <= 1) return { x: 0, y: 0 };
    const container = containerRef.current;
    if (!container) return { x: px, y: py };
    const cw = container.clientWidth;
    const ch = container.clientHeight;
    return {
      x: Math.max(cw * (1 - z), Math.min(0, px)),
      y: Math.max(ch * (1 - z), Math.min(0, py)),
    };
  }, []);

  // Wheel: Ctrl+scroll = brush size, regular scroll = zoom
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      if (e.ctrlKey || e.metaKey) {
        // Ctrl + scroll → brush size
        const delta = e.deltaY > 0 ? -2 : 2;
        const next = Math.max(MIN_BRUSH, Math.min(MAX_BRUSH, brushSizeRef.current + delta));
        setBrushSize(next);
      } else {
        // Regular scroll → zoom towards cursor
        const rect = container.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        const oldZoom = zoomRef.current;
        const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
        let newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, oldZoom * factor));
        if (Math.abs(newZoom - 1) < 0.05) newZoom = 1;

        // Zoom towards mouse position
        let nx = mx - (mx - panRef.current.x) * (newZoom / oldZoom);
        let ny = my - (my - panRef.current.y) * (newZoom / oldZoom);

        if (newZoom <= 1) {
          nx = 0;
          ny = 0;
        } else {
          const cw = container.clientWidth;
          const ch = container.clientHeight;
          nx = Math.max(cw * (1 - newZoom), Math.min(0, nx));
          ny = Math.max(ch * (1 - newZoom), Math.min(0, ny));
        }

        setZoom(newZoom);
        setPan({ x: nx, y: ny });
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);

  const saveToHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const idx = historyIndexRef.current;
    historyRef.current = historyRef.current.slice(0, idx + 1);
    historyRef.current.push(data);
    if (historyRef.current.length > MAX_HISTORY) {
      historyRef.current.shift();
    }
    historyIndexRef.current = historyRef.current.length - 1;
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(false);
  }, []);

  const undo = useCallback(() => {
    if (historyIndexRef.current <= 0) return;
    historyIndexRef.current--;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.putImageData(historyRef.current[historyIndexRef.current], 0, 0);
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(true);
  }, []);

  const redo = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    historyIndexRef.current++;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.putImageData(historyRef.current[historyIndexRef.current], 0, 0);
    setCanUndo(true);
    setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
  }, []);

  // Convert screen coords → canvas data coords (accounts for zoom & pan)
  const getCanvasPos = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return null;
    const rect = container.getBoundingClientRect();
    // Position in container
    const cx = clientX - rect.left;
    const cy = clientY - rect.top;
    // Reverse CSS transform: translate(pan) scale(zoom) origin 0 0
    const lx = (cx - panRef.current.x) / zoomRef.current;
    const ly = (cy - panRef.current.y) / zoomRef.current;
    // Convert from CSS pixels to canvas data pixels
    const scaleX = canvas.width / container.clientWidth;
    const scaleY = canvas.height / container.clientHeight;
    return { x: lx * scaleX, y: ly * scaleY };
  }, []);

  const erase = useCallback((x: number, y: number) => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d')!;
    const baseScale = canvas.width / container.clientWidth;
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, (brushSizeRef.current / 2) * baseScale, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }, []);

  const eraseLine = useCallback((from: { x: number; y: number }, to: { x: number; y: number }) => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d')!;
    const baseScale = canvas.width / container.clientWidth;
    const radius = (brushSizeRef.current / 2) * baseScale;
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineWidth = radius * 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
    ctx.restore();
  }, []);

  const moveCursor = useCallback((clientX: number, clientY: number) => {
    const container = containerRef.current;
    const cursor = cursorRef.current;
    if (!container || !cursor) return;
    const rect = container.getBoundingClientRect();
    cursor.style.left = `${clientX - rect.left}px`;
    cursor.style.top = `${clientY - rect.top}px`;
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    // Middle mouse or Space+click → pan
    if (e.button === 1 || (e.button === 0 && spaceHeldRef.current)) {
      isPanningRef.current = true;
      panStartMouseRef.current = { x: e.clientX, y: e.clientY };
      panStartValRef.current = { ...panRef.current };
      if (containerRef.current) containerRef.current.style.cursor = 'grabbing';
      return;
    }

    // Left click → erase
    if (e.button === 0) {
      isDrawingRef.current = true;
      const pos = getCanvasPos(e.clientX, e.clientY);
      if (pos) {
        erase(pos.x, pos.y);
        lastPosRef.current = pos;
      }
    }
  }, [getCanvasPos, erase]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    // Update cursor
    if (e.pointerType === 'mouse' && !spaceHeldRef.current) {
      moveCursor(e.clientX, e.clientY);
      if (!cursorVisible) setCursorVisible(true);
    }

    // Panning
    if (isPanningRef.current) {
      const dx = e.clientX - panStartMouseRef.current.x;
      const dy = e.clientY - panStartMouseRef.current.y;
      const clamped = clampPan(
        panStartValRef.current.x + dx,
        panStartValRef.current.y + dy,
        zoomRef.current,
      );
      setPan(clamped);
      return;
    }

    // Erasing
    if (!isDrawingRef.current) return;
    const pos = getCanvasPos(e.clientX, e.clientY);
    if (pos) {
      if (lastPosRef.current) {
        eraseLine(lastPosRef.current, pos);
      } else {
        erase(pos.x, pos.y);
      }
      lastPosRef.current = pos;
    }
  }, [cursorVisible, getCanvasPos, erase, eraseLine, moveCursor, clampPan]);

  const handlePointerUp = useCallback(() => {
    if (isPanningRef.current) {
      isPanningRef.current = false;
      if (containerRef.current) {
        containerRef.current.style.cursor = spaceHeldRef.current ? 'grab' : 'none';
      }
      return;
    }
    if (isDrawingRef.current) {
      isDrawingRef.current = false;
      lastPosRef.current = null;
      saveToHistory();
    }
  }, [saveToHistory]);

  const handlePointerLeave = useCallback(() => {
    setCursorVisible(false);
    if (isPanningRef.current) {
      isPanningRef.current = false;
      return;
    }
    if (isDrawingRef.current) {
      isDrawingRef.current = false;
      lastPosRef.current = null;
      saveToHistory();
    }
  }, [saveToHistory]);

  const zoomTo = useCallback((newZoom: number) => {
    const container = containerRef.current;
    if (!container) return;
    const cw = container.clientWidth;
    const ch = container.clientHeight;
    const oldZoom = zoomRef.current;
    const z = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom));
    // Zoom towards center
    const mx = cw / 2;
    const my = ch / 2;
    let nx = mx - (mx - panRef.current.x) * (z / oldZoom);
    let ny = my - (my - panRef.current.y) * (z / oldZoom);
    const clamped = z <= 1 ? { x: 0, y: 0 } : clampPan(nx, ny, z);
    setZoom(z);
    setPan(clamped);
  }, [clampPan]);

  const handleSave = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        onSave(url);
      }
    }, 'image/png');
  }, [onSave]);

  // Cursor size scales with zoom (same canvas area appears larger when zoomed)
  const cursorSize = brushSize * zoom;

  return (
    <div className="space-y-3">
      {/* Canvas area */}
      <div
        ref={containerRef}
        className="relative w-full aspect-[4/3] sm:aspect-video rounded-xl overflow-hidden select-none"
        style={{
          backgroundImage:
            'linear-gradient(45deg, #e5e7eb 25%, transparent 25%), linear-gradient(-45deg, #e5e7eb 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e5e7eb 75%), linear-gradient(-45deg, transparent 75%, #e5e7eb 75%)',
          backgroundSize: '20px 20px',
          backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
          cursor: 'none',
          touchAction: 'none',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
      >
        {/* Zoomable canvas wrapper */}
        <div
          className="absolute inset-0 origin-top-left pointer-events-none"
          style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
        >
          <canvas ref={canvasRef} className="w-full h-full block" />
        </div>

        {/* Custom brush cursor */}
        <div
          ref={cursorRef}
          className="absolute pointer-events-none"
          style={{
            width: cursorSize,
            height: cursorSize,
            borderRadius: '50%',
            border: '2px solid rgba(255,255,255,0.8)',
            boxShadow: '0 0 0 1px rgba(0,0,0,0.3)',
            transform: 'translate(-50%, -50%)',
            display: cursorVisible ? 'block' : 'none',
          }}
        />

        {/* Label */}
        <div className="absolute top-2 left-2 sm:top-3 sm:left-3 px-1.5 sm:px-2 py-0.5 bg-black/50 rounded text-[10px] sm:text-xs text-white font-medium">
          지우개 모드
        </div>

        {/* Zoom indicator (shown when zoomed) */}
        {zoom > 1 && (
          <div className="absolute top-2 right-2 sm:top-3 sm:right-3 px-1.5 sm:px-2 py-0.5 bg-black/50 rounded text-[10px] sm:text-xs text-white font-medium tabular-nums">
            {Math.round(zoom * 100)}%
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Brush size slider */}
        <div className="flex items-center gap-2 flex-1 min-w-[160px]">
          <div
            className="shrink-0 rounded-full bg-gray-800 dark:bg-gray-200"
            style={{ width: Math.max(8, brushSize * 0.4), height: Math.max(8, brushSize * 0.4) }}
          />
          <input
            type="range"
            min={MIN_BRUSH}
            max={MAX_BRUSH}
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="flex-1 accent-blue-500"
          />
          <span className="text-xs text-gray-500 dark:text-gray-400 w-8 text-right tabular-nums">
            {brushSize}
          </span>
        </div>

        {/* Undo / Redo */}
        <div className="flex items-center gap-1">
          <button
            onClick={undo}
            disabled={!canUndo}
            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 transition-colors"
            title="실행 취소"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 transition-colors"
            title="다시 실행"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => zoomTo(zoom / 1.3)}
            disabled={zoom <= MIN_ZOOM}
            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 transition-colors"
            title="축소"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => zoomTo(1)}
            disabled={zoom === 1}
            className="px-1.5 py-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 transition-colors text-xs tabular-nums min-w-[3rem] text-center"
            title="확대/축소 초기화"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            onClick={() => zoomTo(zoom * 1.3)}
            disabled={zoom >= MAX_ZOOM}
            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 transition-colors"
            title="확대"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Check className="w-4 h-4" />
          완료
        </button>
      </div>
    </div>
  );
}
