import React, { useState } from 'react';
import { speechService } from '../lib/speech';
import { hapticService } from '../lib/haptics';
import { AppScreen, UserProfile } from '../types';
import { AccessibleButton } from './AccessibleButton';
import { ChevronLeft, Mic, BookOpen, Smartphone, User, LogOut, Plus, Minus } from 'lucide-react';

interface SettingsProps {
  onNavigate: (screen: AppScreen) => void;
  profile: UserProfile | null;
  onUpdateProfile: (profile: UserProfile) => void;
}

export const Settings: React.FC<SettingsProps> = ({ onNavigate, profile, onUpdateProfile }) => {
  const [localProfile, setLocalProfile] = useState<UserProfile>(profile || {
    name: '사용자',
    measurements: {},
    settings: {
      speechRate: 1.0,
      speechVolume: 1.0,
      hapticIntensity: 1.0,
      detailMode: 'detailed',
    }
  });

  const updateSettings = (key: keyof typeof localProfile.settings, value: any) => {
    const newProfile = {
      ...localProfile,
      settings: { ...localProfile.settings, [key]: value }
    };
    setLocalProfile(newProfile);
    onUpdateProfile(newProfile);
    
    if (key === 'speechRate') {
      speechService.setSettings(value, localProfile.settings.speechVolume);
      speechService.speak(`${value.toFixed(1)} 배속으로 변경합니다.`, true);
    } else if (key === 'speechVolume') {
      speechService.setSettings(localProfile.settings.speechRate, value);
      speechService.speak(`볼륨을 변경합니다.`, true);
    }
    hapticService.tap();
  };

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden">
      <header className="px-6 py-8 pb-4 flex items-center gap-6">
        <button 
          onClick={() => onNavigate(AppScreen.HOME)}
          className="p-4 rounded-3xl bg-synk-offwhite text-synk-navy hover:bg-synk-blue/10 active:scale-95 transition-all"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>
        <h1 className="text-4xl font-display font-black tracking-tighter">SETTINGS</h1>
      </header>

      <div className="flex-1 px-6 pb-12 space-y-8 overflow-y-auto custom-scrollbar">
        {/* Voice Settings */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 text-synk-blue">
            <div className="p-2 rounded-xl bg-synk-blue/10">
              <Mic className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold uppercase tracking-widest text-synk-navy">음성 설정</h2>
          </div>
          
          <div className="bg-synk-offwhite p-6 rounded-[2.5rem] space-y-8 border-2 border-synk-navy/5">
            <div className="space-y-4">
              <div className="flex justify-between font-bold px-2">
                <span className="text-synk-grey">속도</span>
                <span className="text-synk-blue">{localProfile.settings.speechRate.toFixed(1)}x</span>
              </div>
              <input 
                type="range" min="0.5" max="2.0" step="0.1"
                value={localProfile.settings.speechRate}
                onChange={(e) => updateSettings('speechRate', parseFloat(e.target.value))}
                className="w-full h-3 bg-white rounded-full appearance-none accent-synk-blue shadow-inner"
              />
            </div>
            <div className="space-y-4">
              <div className="flex justify-between font-bold px-2">
                <span className="text-synk-grey">볼륨</span>
                <span className="text-synk-blue">{Math.round(localProfile.settings.speechVolume * 100)}%</span>
              </div>
              <input 
                type="range" min="0" max="1.0" step="0.1"
                value={localProfile.settings.speechVolume}
                onChange={(e) => updateSettings('speechVolume', parseFloat(e.target.value))}
                className="w-full h-3 bg-white rounded-full appearance-none accent-synk-blue shadow-inner"
              />
            </div>
          </div>
        </section>

        {/* Description Mode */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 text-synk-blue">
            <div className="p-2 rounded-xl bg-synk-blue/10">
              <BookOpen className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold uppercase tracking-widest text-synk-navy">설명 모드</h2>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => updateSettings('detailMode', 'simple')}
              className={`p-6 rounded-3xl font-bold transition-all border-2 ${localProfile.settings.detailMode === 'simple' ? 'bg-synk-blue text-white border-transparent shadow-lg shadow-synk-blue/20' : 'bg-synk-offwhite text-synk-navy border-synk-navy/5'}`}
            >
              간단 모드
            </button>
            <button 
              onClick={() => updateSettings('detailMode', 'detailed')}
              className={`p-6 rounded-3xl font-bold transition-all border-2 ${localProfile.settings.detailMode === 'detailed' ? 'bg-synk-blue text-white border-transparent shadow-lg shadow-synk-blue/20' : 'bg-synk-offwhite text-synk-navy border-synk-navy/5'}`}
            >
              상세 모드
            </button>
          </div>
        </section>

        {/* Haptic Test */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 text-synk-blue">
            <div className="p-2 rounded-xl bg-synk-blue/10">
              <Smartphone className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold uppercase tracking-widest text-synk-navy">촉각 확인</h2>
          </div>
          
          <AccessibleButton 
            label="진동 강도 테스트" 
            variant="secondary"
            className="w-full"
            icon={<Smartphone className="w-8 h-8" />}
            onClick={() => {
              hapticService.success();
              speechService.speak('진동이 느껴지시나요?');
            }}
          />
        </section>

        {/* Body Data */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 text-synk-blue">
            <div className="p-2 rounded-xl bg-synk-blue/10">
              <User className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold uppercase tracking-widest text-synk-navy">신체 데이터</h2>
          </div>
          
          <div className="bg-synk-offwhite p-6 rounded-[2.5rem] border-2 border-synk-navy/5 space-y-6">
            {[
              { key: 'height', label: '키' },
              { key: 'shoulder', label: '어깨너비' },
              { key: 'chest', label: '가슴둘레' },
              { key: 'waist', label: '허리둘레' }
            ].map(m => (
              <div key={m.key} className="space-y-3">
                <label className="text-sm font-black text-synk-grey uppercase px-2">{m.label}</label>
                <div className="flex items-center">
                  <input
                    type="number"
                    min="0"
                    value={localProfile.measurements[m.key as keyof typeof localProfile.measurements] || ''}
                    onChange={(e) => {
                      const val = Math.max(0, parseInt(e.target.value) || 0);
                      const newProfile = { ...localProfile, measurements: { ...localProfile.measurements, [m.key]: val } };
                      setLocalProfile(newProfile);
                      onUpdateProfile(newProfile);
                    }}
                    onFocus={() => speechService.speak(`${m.label} 입력창입니다. 현재 ${localProfile.measurements[m.key as keyof typeof localProfile.measurements] || 0} 센티미터입니다.`)}
                    className="flex-1 bg-white h-12 rounded-2xl text-center font-black text-xl shadow-inner border-2 border-synk-navy/5 outline-none focus:border-synk-blue/30 transition-colors"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="pt-8">
          <AccessibleButton 
            label="로그아웃" 
            variant="ghost" 
            className="w-full text-red-500 border-red-500/10 hover:bg-red-50"
            icon={<LogOut className="w-8 h-8" />}
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
