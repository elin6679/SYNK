import React, { useState } from 'react';
import { speechService } from '../lib/speech';
import { hapticService } from '../lib/haptics';
import { AppScreen, UserProfile } from '../types';
import { AccessibleButton } from './AccessibleButton';
import { ChevronLeft, Volume2, FastForward, LogOut } from 'lucide-react';

interface SettingsProps {
  onNavigate: (screen: AppScreen) => void;
  profile: UserProfile | null;
}

export const Settings: React.FC<SettingsProps> = ({ onNavigate, profile }) => {
  const [rate, setRate] = useState(profile?.settings?.speechRate || 1.0);
  const [volume, setVolume] = useState(profile?.settings?.speechVolume || 1.0);

  const adjustRate = (delta: number) => {
    const newRate = Math.max(0.5, Math.min(2.0, rate + delta));
    setRate(newRate);
    speechService.setSettings(newRate, volume);
    speechService.speak(`말하기 속도를 ${newRate.toFixed(1)}배로 설정했습니다.`);
    hapticService.tap();
  };

  return (
    <div className="h-full flex flex-col p-6 bg-synk-offwhite">
      <header className="py-6 flex items-center gap-4">
        <button 
          onClick={() => onNavigate(AppScreen.HOME)}
          className="p-4 rounded-full bg-white shadow-md active:scale-90"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>
        <h1 className="text-3xl font-display font-bold">설정</h1>
      </header>

      <div className="flex-1 space-y-12 py-8 overflow-y-auto">
        <section className="space-y-6">
          <div className="flex items-center gap-4 text-synk-grey uppercase tracking-widest font-bold text-sm">
            <Volume2 className="w-5 h-5" />
            음성 가이드 설정
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <AccessibleButton 
              label="속도 느리게" 
              variant="ghost" 
              onClick={() => adjustRate(-0.1)} 
            />
            <AccessibleButton 
              label="속도 빠르게" 
              variant="ghost" 
              onClick={() => adjustRate(0.1)} 
            />
          </div>
          <div className="p-8 bg-white rounded-3xl text-center shadow-inner">
            <div className="text-sm text-synk-grey mb-2">현재 속도</div>
            <div className="text-5xl font-black">{rate.toFixed(1)}x</div>
          </div>
        </section>

        <section className="space-y-6">
           <AccessibleButton 
             label="햅틱 강도 테스트" 
             hint="진동을 느껴보세요"
             onClick={() => hapticService.success()}
           />
        </section>

        <div className="pt-12">
          <AccessibleButton 
            label="로그아웃" 
            variant="ghost" 
            className="text-red-500 border-red-500 hover:bg-red-50"
            onClick={() => {
              localStorage.removeItem('synk_profile');
              window.location.reload();
            }}
          />
        </div>
      </div>
    </div>
  );
};
