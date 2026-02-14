import { useState } from 'react';
import { useApp } from './contexts/AppContext';
import Header from './components/Header';
import DropZone from './components/DropZone';
import ProcessingQueue from './components/ProcessingQueue';
import BeforeAfterSlider from './components/BeforeAfterSlider';
import ManualEraser from './components/ManualEraser';
import BackgroundEditor from './components/BackgroundEditor';
import DownloadPanel from './components/DownloadPanel';
import { AlertCircle, X, SlidersHorizontal, Eraser } from 'lucide-react';

type EditMode = 'compare' | 'erase';

export default function App() {
  const {
    images,
    selectedImage,
    processImage,
    updateBackground,
    updateEditedBg,
    downloadResult,
    clearAll,
    fileErrors,
    clearErrors,
  } = useApp();

  const [editMode, setEditMode] = useState<EditMode>('compare');

  const hasImages = images.length > 0;
  const showControls = selectedImage && selectedImage.status === 'done';
  const showSlider = selectedImage?.status === 'done' && selectedImage.removedBgUrl;

  const handleNewImage = () => {
    clearAll();
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-gray-50 dark:bg-gray-950">
      <Header />

      {/* Error toasts */}
      {fileErrors.length > 0 && (
        <div className="fixed top-16 left-4 right-4 sm:left-auto sm:right-4 sm:w-auto z-50 space-y-2">
          {fileErrors.map((err, i) => (
            <div
              key={i}
              className="flex items-center gap-2 px-3 py-2.5 bg-red-500 text-white rounded-lg shadow-lg text-sm"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="flex-1 text-xs sm:text-sm">{err}</span>
              <button onClick={clearErrors} className="p-1 shrink-0">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <main className="flex-1 p-3 sm:p-4 md:p-8 max-w-7xl mx-auto w-full">
        {!hasImages ? (
          /* No images: centered upload zone */
          <div className="flex items-center justify-center min-h-[60dvh]">
            <div className="w-full max-w-2xl">
              <DropZone />
            </div>
          </div>
        ) : (
          /* Has images: grid layout */
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 sm:gap-6">
            {/* Left: main content */}
            <div className="space-y-4 sm:space-y-6">
              {showSlider ? (
                <div className="space-y-3">
                  {/* Mode toggle */}
                  <div className="flex gap-1 p-1 bg-gray-200 dark:bg-gray-800 rounded-lg w-fit">
                    <button
                      onClick={() => setEditMode('compare')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                        editMode === 'compare'
                          ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                      비교
                    </button>
                    <button
                      onClick={() => setEditMode('erase')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                        editMode === 'erase'
                          ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}
                    >
                      <Eraser className="w-3.5 h-3.5" />
                      지우개
                    </button>
                  </div>

                  {/* Content based on mode */}
                  {editMode === 'compare' ? (
                    <BeforeAfterSlider
                      beforeUrl={selectedImage.originalUrl}
                      afterUrl={selectedImage.compositeUrl ?? selectedImage.editedBgUrl ?? selectedImage.removedBgUrl!}
                    />
                  ) : (
                    <ManualEraser
                      imageUrl={selectedImage.editedBgUrl ?? selectedImage.removedBgUrl!}
                      width={selectedImage.width}
                      height={selectedImage.height}
                      onSave={(url) => {
                        updateEditedBg(selectedImage.id, url);
                        setEditMode('compare');
                      }}
                    />
                  )}
                </div>
              ) : (
                <DropZone
                  image={selectedImage}
                  onProcess={selectedImage ? () => processImage(selectedImage.id) : undefined}
                />
              )}

              {/* Controls inline on mobile */}
              {showControls && (
                <div className="lg:hidden space-y-4 p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                  <BackgroundEditor
                    background={selectedImage.background}
                    onChange={(bg) => updateBackground(selectedImage.id, bg)}
                  />
                  <DownloadPanel
                    onDownload={(format) => downloadResult(selectedImage.id, format)}
                    onNewImage={handleNewImage}
                    disabled={!selectedImage.removedBgUrl}
                  />
                </div>
              )}

              <ProcessingQueue />
            </div>

            {/* Right sidebar: controls (desktop only) */}
            {showControls && (
              <div className="hidden lg:block space-y-6">
                <BackgroundEditor
                  background={selectedImage.background}
                  onChange={(bg) => updateBackground(selectedImage.id, bg)}
                />
                <DownloadPanel
                  onDownload={(format) => downloadResult(selectedImage.id, format)}
                  onNewImage={handleNewImage}
                  disabled={!selectedImage.removedBgUrl}
                />
              </div>
            )}
          </div>
        )}
      </main>

      <footer
        className="text-center py-3 sm:py-4 text-[10px] sm:text-xs text-gray-400 dark:text-gray-600"
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
      >
        모든 처리는 브라우저에서 이루어집니다. 이미지가 서버로 전송되지 않습니다.
      </footer>
    </div>
  );
}
