import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { speechService } from '../lib/speech';
import { hapticService } from '../lib/haptics';
import { AppScreen, UserProfile } from '../types';
import { AccessibleButton } from '../components/AccessibleButton';
import { ChevronRight, Mic, Ruler, Palette, Volume2, LogIn } from 'lucide-react';
import { auth } from '../lib/firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void;
}

const STEPS = [
  { id: 'welcome', label: '환영합니다', hint: 'SYNK는 시각 정보를 감각으로 번역합니다. 시작하려면 로그인이 필요합니다.' },
  { id: 'voice_setup', label: '음성 설정', hint: '안내 음성의 속도와 크기를 조절합니다.', icon: <Volume2 /> },
  { id: 'haptic_test', label: '촉각 확인', hint: '진동 강도를 확인합니다. 버튼을 누르면 진동이 느껴집니다.', icon: <Mic /> },
  { id: 'measurements', label: '신체 데이터', hint: '정확한 핏 분석을 위해 키와 치수를 입력합니다.', icon: <Ruler /> },
  { id: 'skin_tone', label: '피부톤 분석', hint: '카메라로 피부톤을 분석하여 개인화된 추천을 제공합니다.', icon: <Palette /> }
];

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [profile, setProfile] = useState<UserProfile>({
    name: '사용자',
    measurements: {},
    settings: {
      speechRate: 1.0,
      speechVolume: 1.0,
      hapticIntensity: 1.0,
    }
  });

  useEffect(() => {
    const step = STEPS[currentStep];
    speechService.speak(`${step.label}. ${step.hint}`);
  }, [currentStep]);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      hapticService.success();
      speechService.speak('모든 설정이 완료되었습니다. 메인 화면으로 이동합니다.');
      onComplete(profile);
    }
  };

  const step = STEPS[currentStep];

  return (
    <div className="h-full flex flex-col p-6 pb-12">
      <div className="flex-1 flex flex-col justify-center items-center gap-12 text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={step.id}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            className="flex flex-col items-center gap-8"
          >
            <div className="w-32 h-32 rounded-full bg-synk-lavender text-synk-navy flex items-center justify-center text-5xl shadow-xl">
              {step.icon || <div className="font-display font-black">S.</div>}
            </div>
            <div>
              <h1 className="text-5xl font-display font-bold mb-4 text-synk-navy">{step.label}</h1>
              <p className="text-xl text-synk-grey leading-relaxed max-w-xs mx-auto">
                {step.hint}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="space-y-4">
        {step.id === 'welcome' && (
          <AccessibleButton
            label="Google로 로그인"
            hint="음성으로 로그인하시려면 아래를 탭하세요"
            variant="secondary"
            icon={<LogIn className="w-10 h-10" />}
            onClick={async () => {
              try {
                const provider = new GoogleAuthProvider();
                await signInWithPopup(auth, provider);
                hapticService.success();
                speechService.speak('로그인에 성공했습니다. 다음 단계로 이동합니다.');
                handleNext();
              } catch (err) {
                console.error(err);
                speechService.speak('로그인에 실패했습니다. 다시 시도해주세요.');
              }
            }}
          />
        )}
        
        {step.id === 'haptic_test' && (
          <AccessibleButton
            label="진동 테스트"
            hint="버튼을 눌러 진동을 확인하세요"
            variant="ghost"
            onClick={() => hapticService.vibrate([100, 50, 100])}
          />
        )}
        
        <AccessibleButton
          label={currentStep === STEPS.length - 1 ? '시작하기' : '다음으로'}
          hint="화면 오른쪽 아래를 누르세요"
          onClick={handleNext}
          icon={<ChevronRight className="w-12 h-12" />}
        />
      </div>
    </div>
  );
};
