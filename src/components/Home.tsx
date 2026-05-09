import React from 'react';
import { motion } from 'motion/react';
import { AppScreen } from '../types';
import { AccessibleButton } from './AccessibleButton';
import { Camera, Sparkles, Shirt, MapPin, Settings, User, ChevronRight, Link } from 'lucide-react';
import { speechService } from '../lib/speech';

interface HomeProps {
  onNavigate: (screen: AppScreen) => void;
}

export const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  const menuItems = [
    { id: AppScreen.ANALYSIS, label: '카메라 분석', hint: '주변의 옷이나 색상을 분석합니다', icon: <Camera className="w-10 h-10" />, color: 'bg-synk-blue' },
    { id: AppScreen.BEAUTY, label: '뷰티 분석', hint: '메이크업 대칭과 얼굴 고민을 해결합니다', icon: <Sparkles className="w-10 h-10" />, color: 'bg-synk-cyan' },
    { id: AppScreen.CLOSET, label: '내 옷장', hint: '저장된 나의 옷들을 확인하고 코디합니다', icon: <Shirt className="w-10 h-10" />, color: 'bg-synk-navy' },
    { id: AppScreen.STORE, label: '매장 모드', hint: 'QR 코드와 바코드를 스캔하여 정보를 찾습니다', icon: <MapPin className="w-10 h-10" />, color: 'bg-synk-grey' },
  ];

  React.useEffect(() => {
    speechService.speak('메인 화면입니다. 분석을 시작하거나 옷장을 확인하려면 버튼을 선택하세요.');
  }, []);

  return (
    <div className="h-full flex flex-col overflow-hidden bg-synk-offwhite">
      <div className="flex-1 overflow-y-auto px-6 pb-24 custom-scrollbar">
        <header className="py-10 flex justify-between items-center text-synk-navy">
          <div className="flex flex-col">
            <h1 className="text-4xl font-display font-black tracking-tight">SYNK.</h1>
            <span className="text-sm opacity-60 font-medium">부드러운 감각의 연결</span>
          </div>
          <button 
            onClick={() => onNavigate(AppScreen.SETTINGS)}
            className="p-4 rounded-2xl bg-white shadow-md active:scale-95 transition-all border border-synk-navy/5"
            aria-label="설정"
          >
            <Settings className="w-6 h-6 text-synk-navy" />
          </button>
        </header>

        {/* Status Card - Welcoming message */}
        <div className="mb-10 bg-synk-blue rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-synk-blue/20">
          <div className="relative z-10">
            <h2 className="text-lg font-bold opacity-70 mb-1">반가워요!</h2>
            <p className="text-3xl font-black mb-6 leading-tight">오늘 당신만의<br/>스타일을 찾아보세요.</p>
            
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-2xl px-4 py-2 inline-flex">
              <div className="w-2.5 h-2.5 bg-white rounded-full shadow-[0_0_10px_white]" />
              <span className="text-xs font-bold uppercase tracking-wider">SYNK AI READY</span>
            </div>
          </div>
          
          <div className="absolute right-[-20px] bottom-[-20px] w-40 h-40 opacity-10 transform rotate-12">
            <Sparkles className="w-full h-full" />
          </div>
        </div>

        <section className="mb-10">
          <div className="flex justify-between items-center mb-6 px-2">
            <h3 className="text-2xl font-black text-synk-navy">주요 기능</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  speechService.speak(`${item.label}. ${item.hint}`);
                  onNavigate(item.id);
                }}
                className={`flex flex-col items-center justify-center p-6 rounded-[2rem] bg-white shadow-sm border-2 border-transparent hover:border-synk-blue/20 active:scale-95 transition-all group h-48`}
              >
                <div className={`mb-4 p-4 rounded-2xl ${item.color} text-white shadow-md group-hover:scale-110 transition-transform`}>
                  {item.icon}
                </div>
                <span className="text-xl font-bold text-synk-navy text-center leading-tight">{item.label}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="mb-8">
          <div className="bg-white rounded-[2rem] p-6 border border-synk-navy/5 shadow-sm flex items-center justify-between active:scale-[0.98] transition-transform">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-synk-offwhite flex items-center justify-center">
                <Link className="w-6 h-6 text-synk-navy" />
              </div>
              <div>
                <h3 className="font-black text-synk-navy">URL 분석</h3>
                <p className="text-xs text-synk-grey">쇼핑몰 링크를 분석하고 코디</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-synk-grey" />
          </div>
        </section>
      </div>

      {/* Bottom Nav Bar - Reference style */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/80 backdrop-blur-xl border-t border-synk-navy/5 p-4 pb-8 flex justify-around items-center rounded-t-[2.5rem] shadow-2xl">
        <button className="flex flex-col items-center gap-1.5 text-synk-blue">
          <div className="p-2.5 rounded-2xl bg-synk-blue/10">
            <Camera className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-tighter">Home</span>
        </button>
        <button className="flex flex-col items-center gap-1.5 text-synk-navy/30">
          <div className="p-2.5">
            <Sparkles className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-tighter">Beauty</span>
        </button>
        <button className="flex flex-col items-center gap-1.5 text-synk-navy/30">
          <div className="p-2.5">
            <Shirt className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-tighter">Closet</span>
        </button>
        <button className="flex flex-col items-center gap-1.5 text-synk-navy/30">
          <div className="p-2.5">
            <User className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-tighter">Settings</span>
        </button>
      </nav>
    </div>
  );
};
