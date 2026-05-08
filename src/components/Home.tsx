import React from 'react';
import { motion } from 'motion/react';
import { AppScreen } from '../types';
import { AccessibleButton } from './AccessibleButton';
import { Camera, Link, Shirt, Sparkles, MapPin, Settings } from 'lucide-react';
import { speechService } from '../lib/speech';

interface HomeProps {
  onNavigate: (screen: AppScreen) => void;
}

export const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  const menuItems = [
    { id: AppScreen.ANALYSIS, label: '카메라 분석', hint: '주변의 옷이나 색상을 분석합니다', icon: <Camera className="w-12 h-12" />, color: 'bg-synk-pink text-synk-navy' },
    { id: AppScreen.BEAUTY, label: '뷰티 분석', hint: '메이크업 대칭과 얼굴 고민을 해결합니다', icon: <Sparkles className="w-12 h-12" />, color: 'bg-synk-lavender text-synk-navy' },
    { id: AppScreen.CLOSET, label: '내 옷장', hint: '저장된 나의 옷들을 확인하고 코디합니다', icon: <Shirt className="w-12 h-12" />, color: 'bg-synk-cyan text-synk-navy' },
    { id: AppScreen.STORE, label: '매장 모드', hint: 'QR 코드와 바코드를 스캔하여 정보를 찾습니다', icon: <MapPin className="w-12 h-12" />, color: 'bg-synk-peach text-synk-navy' },
  ];

  React.useEffect(() => {
    speechService.speak('메인 화면입니다. 분석을 시작하거나 옷장을 확인하려면 버튼을 선택하세요.');
  }, []);

  return (
    <div className="h-full flex flex-col p-6 pb-24 overflow-y-auto custom-scrollbar">
      <header className="py-8 flex justify-between items-center text-synk-navy">
        <h1 className="text-4xl font-display font-black tracking-tighter">SYNK.</h1>
        <button 
          onClick={() => onNavigate(AppScreen.SETTINGS)}
          className="p-4 rounded-full bg-white/50 backdrop-blur-md shadow-sm active:scale-90 transition-transform border border-white/50"
          aria-label="설정"
        >
          <Settings className="w-8 h-8" />
        </button>
      </header>

      <div className="grid grid-cols-1 gap-6">
        {menuItems.map((item) => (
          <AccessibleButton
            key={item.id}
            id={item.id}
            label={item.label}
            hint={item.hint}
            icon={item.icon}
            className={`${item.color} h-48`}
            onClick={() => onNavigate(item.id)}
          />
        ))}
      </div>
      
      <div className="mt-8">
        <AccessibleButton
          label="URL 분석"
          hint="쇼핑몰 링크를 분석합니다"
          variant="ghost"
          icon={<Link className="w-8 h-8" />}
          onClick={() => speechService.speak('URL 분석 기능은 준비 중입니다.')}
        />
      </div>
    </div>
  );
};
