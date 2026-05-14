import React from 'react';
import { Home as HomeIcon, Sparkles, Shirt, User, Camera } from 'lucide-react';
import { AppScreen } from '../types';

interface NavigationProps {
  currentScreen: AppScreen;
  onNavigate: (screen: AppScreen) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentScreen, onNavigate }) => {
  if ([AppScreen.ONBOARDING].includes(currentScreen)) {
    return null;
  }

  // We might want to hide nav during active analysis sessions 
  // but for now let's keep it visible on main tabs
  const mainTabs = [AppScreen.HOME, AppScreen.BEAUTY, AppScreen.CLOSET, AppScreen.SETTINGS];
  const isAnalysisTab = currentScreen === AppScreen.ANALYSIS || currentScreen === AppScreen.STORE;
  
  // If it's a "tool" screen, we might still want the nav, but the user said 
  // "home bottom nav", which usually implies these 4 main tabs.
  
  const navItems = [
    { id: AppScreen.HOME, label: 'Home', icon: <HomeIcon className="w-6 h-6" /> },
    { id: AppScreen.BEAUTY, label: 'Beauty', icon: <Sparkles className="w-6 h-6" /> },
    { id: AppScreen.CLOSET, label: 'Closet', icon: <Shirt className="w-6 h-6" /> },
    { id: AppScreen.SETTINGS, label: 'Settings', icon: <User className="w-6 h-6" /> },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/80 backdrop-blur-xl border-t border-synk-navy/5 p-4 pb-8 flex justify-around items-center rounded-t-[2.5rem] shadow-2xl z-50">
      {navItems.map((item) => {
        const isActive = currentScreen === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`flex flex-col items-center gap-1.5 transition-colors ${isActive ? 'text-synk-blue' : 'text-synk-navy/30'}`}
          >
            <div className={`p-2.5 rounded-2xl ${isActive ? 'bg-synk-blue/10' : ''}`}>
              {item.icon}
            </div>
            <span className="text-[10px] font-black uppercase tracking-tighter">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
