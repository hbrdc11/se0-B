import React from 'react';
import { Home, Image as ImageIcon, Gamepad2, Heart, Map } from 'lucide-react';
import { Tab } from '../types';

interface BottomNavProps {
  currentTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onTabChange }) => {
  const navItems = [
    { tab: Tab.HOME, icon: Home, label: 'Ana Sayfa' },
    { tab: Tab.MEMORIES, icon: ImageIcon, label: 'Anılar' },
    { tab: Tab.MAP, icon: Map, label: 'Harita' },
    { tab: Tab.GAMES, icon: Gamepad2, label: 'Eğlence' },
    { tab: Tab.LETTER, icon: Heart, label: 'Notlar' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 pt-2 pointer-events-none">
      {/* Floating Island Design for modern app feel */}
      <nav className="mx-auto max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow-2xl rounded-2xl flex justify-between items-center h-16 px-1 pointer-events-auto transition-colors duration-500">
        {navItems.map((item) => {
          const isActive = currentTab === item.tab;
          const Icon = item.icon;
          
          return (
            <button
              key={item.tab}
              onClick={() => onTabChange(item.tab)}
              className={`relative flex flex-col flex-1 items-center justify-center h-full transition-all duration-300 min-w-[50px] ${
                isActive ? 'text-rose-600 dark:text-rose-400 -translate-y-1' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              {/* Active Indicator Dot */}
              <div className={`absolute top-1 w-1 h-1 rounded-full bg-rose-500 dark:bg-rose-400 transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-0'}`} />
              
              <Icon size={isActive ? 24 : 22} strokeWidth={isActive ? 2.5 : 2} className="transition-transform duration-300" />
              <span className={`text-[9px] font-medium mt-1 whitespace-nowrap transition-all duration-300 ${isActive ? 'opacity-100 font-bold' : 'opacity-80'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default BottomNav;