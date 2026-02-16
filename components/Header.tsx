import React from 'react';
import { Moon, Sun } from 'lucide-react';

interface HeaderProps {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const Header: React.FC<HeaderProps> = ({ isDarkMode, toggleTheme }) => {
  return (
    <header className="sticky top-0 z-40 bg-rose-50/80 dark:bg-slate-900/80 backdrop-blur-md px-6 py-4 flex justify-between items-center border-b border-rose-100/50 dark:border-slate-800 transition-colors duration-500">
      <div>
        <h1 className="text-xl font-serif font-bold text-rose-900 dark:text-rose-400 tracking-tight">
          Bizim <span className="text-rose-500 dark:text-rose-300">Hikayemiz</span>
        </h1>
        <p className="text-xs text-rose-800/60 dark:text-slate-400 font-medium">30.09.2023'ten beri</p>
      </div>
      <button 
        onClick={toggleTheme}
        className="p-2 rounded-full bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-700 active:scale-95 transition-all shadow-sm text-rose-400 dark:text-yellow-400"
      >
        {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
      </button>
    </header>
  );
};

export default Header;