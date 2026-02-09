import { Sun, Moon } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

export default function Header() {
  const { theme, toggleTheme } = useApp();

  const handleLogoClick = () => {
    window.location.reload();
  };

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between px-4 py-3 md:px-8 border-b border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm" style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}>
      <button
        onClick={handleLogoClick}
        className="flex items-center gap-2 hover:opacity-70 active:opacity-50 transition-opacity"
      >
        <img src="/logo.png" alt="TB" className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg" />
        <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">TB BG Remover</h1>
      </button>

      <button
        onClick={toggleTheme}
        className="p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 active:bg-gray-200 dark:active:bg-gray-700 transition-colors"
        aria-label="테마 전환"
      >
        {theme === 'light' ? (
          <Moon className="w-5 h-5 text-gray-600" />
        ) : (
          <Sun className="w-5 h-5 text-yellow-400" />
        )}
      </button>
    </header>
  );
}
