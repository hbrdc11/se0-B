import React, { useState } from 'react';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import HomeView from './views/HomeView';
import MemoriesView from './views/MemoriesView';
import GamesView from './views/GamesView';
import LetterView from './views/LetterView';
import MapView from './views/MapView';
import { Tab } from './types';

const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<Tab>(Tab.HOME);
  const [isFullScreenMode, setIsFullScreenMode] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  // Render content based on current tab
  const renderContent = () => {
    switch (currentTab) {
      case Tab.HOME:
        return <HomeView />;
      case Tab.MEMORIES:
        return <MemoriesView />;
      case Tab.MAP:
        return <MapView />;
      case Tab.GAMES:
        // Pass the toggle function to GamesView
        return <GamesView onToggleFullScreen={setIsFullScreenMode} />;
      case Tab.LETTER:
        return <LetterView />;
      default:
        return <HomeView />;
    }
  };

  return (
    // Background Layer - Soft Pink/White Gradient OR Dark Mode Slate
    <div className={`min-h-screen flex justify-center transition-colors duration-500 ${isDarkMode ? 'dark bg-slate-950' : 'bg-slate-50 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-rose-50 via-slate-50 to-slate-100'}`}>
      
      {/* Mobile Container - Constrains width on desktop to simulate mobile app */}
      <div className="w-full max-w-md h-dvh bg-white/50 dark:bg-slate-900/90 relative shadow-2xl flex flex-col overflow-hidden transition-colors duration-500">
        
        {/* Pass toggle props to Header */}
        <Header isDarkMode={isDarkMode} toggleTheme={toggleTheme} />

        {/* Main Scrollable Content Area */}
        <main className={`flex-1 overflow-y-auto overflow-x-hidden p-6 scrollbar-hide dark:text-slate-100 ${isFullScreenMode ? 'pb-0' : ''}`}>
          {renderContent()}
        </main>

        {/* Only show BottomNav if NOT in full screen mode */}
        {!isFullScreenMode && (
          <BottomNav currentTab={currentTab} onTabChange={setCurrentTab} />
        )}
        
      </div>
    </div>
  );
};

export default App;