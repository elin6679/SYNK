import React, { useState, useEffect } from 'react';
import { AppScreen, UserProfile } from './types.ts';
import { Onboarding } from './components/Onboarding';
import { Home } from './components/Home';
import { Analysis } from './components/Analysis';
import { BeautyAnalysis } from './components/BeautyAnalysis';
import { Closet } from './components/Closet';
import { Settings } from './components/Settings';
import { StoreMode } from './components/StoreMode';
import { motion, AnimatePresence } from 'motion/react';
import { speechService } from './lib/speech';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>(AppScreen.ONBOARDING);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Load profile from localStorage or Firebase (later)
    const saved = localStorage.getItem('synk_profile');
    if (saved) {
      setProfile(JSON.parse(saved));
      setCurrentScreen(AppScreen.HOME);
    }
    setIsInitialized(true);
  }, []);

  const handleOnboardingComplete = (newProfile: UserProfile) => {
    setProfile(newProfile);
    localStorage.setItem('synk_profile', JSON.stringify(newProfile));
    setCurrentScreen(AppScreen.HOME);
  };

  const navigateTo = (screen: AppScreen) => {
    setCurrentScreen(screen);
  };

  if (!isInitialized) {
    return <div className="h-screen bg-synk-navy flex items-center justify-center text-white text-3xl font-bold">SYNK.</div>;
  }

  return (
    <div className="h-screen w-full max-w-md mx-auto bg-synk-offwhite shadow-2xl relative overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentScreen}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="h-full w-full"
        >
          {currentScreen === AppScreen.ONBOARDING && (
            <Onboarding onComplete={handleOnboardingComplete} />
          )}
          {currentScreen === AppScreen.HOME && (
            <Home onNavigate={navigateTo} />
          )}
          {currentScreen === AppScreen.ANALYSIS && (
            <Analysis onNavigate={navigateTo} />
          )}
          {currentScreen === AppScreen.BEAUTY && (
            <BeautyAnalysis onNavigate={navigateTo} />
          )}
          {currentScreen === AppScreen.CLOSET && (
            <Closet onNavigate={navigateTo} />
          )}
          {currentScreen === AppScreen.SETTINGS && (
            <Settings onNavigate={navigateTo} profile={profile} />
          )}
          {currentScreen === AppScreen.STORE && (
            <StoreMode onNavigate={navigateTo} />
          )}
          {/* Placeholder for other screens */}
          {![AppScreen.ONBOARDING, AppScreen.HOME, AppScreen.ANALYSIS, AppScreen.BEAUTY, AppScreen.CLOSET, AppScreen.SETTINGS, AppScreen.STORE].includes(currentScreen) && (
            <div className="h-full flex flex-col items-center justify-center p-12 text-center gap-8">
              <h1 className="text-4xl font-bold">{currentScreen} 기능은 준비 중입니다.</h1>
              <AccessibleButton 
                label="홈으로 돌아가기" 
                onClick={() => navigateTo(AppScreen.HOME)} 
              />
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// Internal component for the placeholder back button
import { AccessibleButton } from './components/AccessibleButton';

