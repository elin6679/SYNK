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
  { id: 'welcome', label: '환영합니다', hint: 'SYNK는 시각 정보를 감각으로 번역합니다. 로그인을 진행해 주세요. 아래로 스와이프하면 로그인 버튼이 있습니다.' },
  { id: 'voice_setup', label: '음성 설정', hint: '안내 음성의 속도와 크기를 조절합니다.', icon: <Volume2 /> },
  { id: 'description_mode', label: '설명 모드', hint: '분석 결과의 정보량을 선택합니다. 간단 모드는 핵심만, 상세 모드는 풍부한 설명을 제공합니다.', icon: <Palette /> },
  { id: 'haptic_test', label: '촉각 확인', hint: '진동 강도를 확인합니다. 버튼을 누르면 진동이 느껴집니다.', icon: <Mic /> },
  { id: 'measurements', label: '신체 데이터', hint: '정확한 핏 분석을 위해 키와 치수를 입력합니다.', icon: <Ruler /> },
  { id: 'skin_tone', label: '피부톤 분석', hint: '카메라로 피부톤을 분석하여 개인화된 추천을 제공합니다.', icon: <Palette /> }
];

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVoiceLoggingIn, setIsVoiceLoggingIn] = useState(false);
  const [voiceLoginStep, setVoiceLoginStep] = useState<'email' | 'password' | 'done'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [profile, setProfile] = useState<UserProfile>({
    name: '사용자',
    measurements: {},
    settings: {
      speechRate: 1.0,
      speechVolume: 1.0,
      hapticIntensity: 1.0,
      detailMode: 'detailed',
    }
  });

  useEffect(() => {
    const step = STEPS[currentStep];
    if (step.id === 'welcome') {
      speechService.speak('로그인 화면입니다. 아래로 스와이프하면 로그인 버튼이 있습니다. 버튼을 누르면 음성으로 로그인을 진행할 수 있습니다.');
    } else {
      speechService.speak(`${step.label}. ${step.hint}`);
    }
  }, [currentStep]);

  const startVoiceRecognition = (mode: 'email' | 'password') => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      speechService.speak('이 브라우저는 음성 인식을 지원하지 않습니다.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'ko-KR';
    recognition.interimResults = false;

    recognition.onstart = () => {
      hapticService.vibrate(50);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (mode === 'email') {
        const cleanedEmail = transcript.replace(/\s/g, '').toLowerCase();
        setEmail(cleanedEmail);
        speechService.speak(`입력된 이메일은 ${cleanedEmail.split('').join(' ')} 입니다. 비밀번호를 말해주세요.`, true, () => {
          setVoiceLoginStep('password');
          startVoiceRecognition('password');
        });
      } else {
        setPassword(transcript);
        speechService.speak('비밀번호가 입력되었습니다. 로그인을 시도합니다.', true, () => {
          setVoiceLoginStep('done');
          handleNext();
        });
      }
    };

    recognition.onerror = () => {
      speechService.speak('음성 인식에 실패했습니다. 다시 말씀해 주세요.');
    };

    recognition.start();
  };

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
    <div className="h-full flex flex-col p-6 pb-12 bg-synk-offwhite">
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
        {step.id === 'welcome' && !isVoiceLoggingIn && (
          <div className="flex flex-col gap-4">
            <AccessibleButton
              label="음성 로그인 시작"
              hint="버튼을 누르면 이메일을 말하라는 안내가 나옵니다"
              variant="primary"
              icon={<Mic className="w-10 h-10" />}
              onClick={() => {
                setIsVoiceLoggingIn(true);
                speechService.speak('음성 로그인을 시작합니다. 이메일을 말해주세요.', true, () => {
                  startVoiceRecognition('email');
                });
              }}
            />
            <AccessibleButton
              label="Google로 로그인"
              hint="기존 구글 계정으로 로그인합니다"
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
                  speechService.speak('로그인에 실패했습니다. 아이프레임 보안 문제일 수 있으니 앱 오른쪽 상단의 새 탭에서 열기 버튼을 눌러주세요.');
                }
              }}
            />
          </div>
        )}

        {isVoiceLoggingIn && step.id === 'welcome' && (
          <div className="bg-white p-8 rounded-3xl shadow-xl space-y-6 text-center">
            <div className="text-sm text-synk-grey uppercase font-bold tracking-widest">음성 입력 중</div>
            <div className="text-3xl font-bold text-synk-navy">
              {voiceLoginStep === 'email' ? '이메일을 말해주세요' : '비밀번호를 말해주세요'}
            </div>
            <div className="flex flex-col gap-2 text-left">
              <div 
                onFocus={() => speechService.speak('이메일 입력창입니다')} 
                tabIndex={0}
                className="p-4 bg-synk-offwhite rounded-xl border border-synk-navy/10"
              >
                <span className="text-xs block text-synk-grey mb-1">이메일</span>
                <span className="text-lg break-all">{email || '대기 중...'}</span>
              </div>
              <div 
                onFocus={() => speechService.speak('비밀번호 입력창입니다')} 
                tabIndex={0}
                className="p-4 bg-synk-offwhite rounded-xl border border-synk-navy/10"
              >
                <span className="text-xs block text-synk-grey mb-1">비밀번호</span>
                <span className="text-lg">{'*'.repeat(password.length) || '대기 중...'}</span>
              </div>
            </div>
            <AccessibleButton 
              label="다시 시도" 
              variant="ghost" 
              onClick={() => {
                setEmail('');
                setPassword('');
                setVoiceLoginStep('email');
                speechService.speak('처음부터 다시 시작합니다. 이메일을 말해주세요.', true, () => {
                  startVoiceRecognition('email');
                });
              }} 
            />
          </div>
        )}
        
        {step.id === 'description_mode' && (
          <div className="flex flex-col gap-4">
            <AccessibleButton
              label="간단 모드"
              hint="핵심적인 정보만 빠르게 안내합니다"
              variant={profile.settings.detailMode === 'simple' ? 'primary' : 'secondary'}
              onClick={() => {
                setProfile(prev => ({ ...prev, settings: { ...prev.settings, detailMode: 'simple' } }));
                speechService.speak('간단 모드가 선택되었습니다.');
              }}
            />
            <AccessibleButton
              label="상세 모드"
              hint="색감, 분위기, 스타일 등 풍부한 설명을 제공합니다"
              variant={profile.settings.detailMode === 'detailed' ? 'primary' : 'secondary'}
              onClick={() => {
                setProfile(prev => ({ ...prev, settings: { ...prev.settings, detailMode: 'detailed' } }));
                speechService.speak('상세 모드가 선택되었습니다.');
              }}
            />
          </div>
        )}
        
        {step.id === 'haptic_test' && (
          <AccessibleButton
            label="진동 테스트"
            hint="버튼을 눌러 진동을 확인하세요"
            variant="ghost"
            onClick={() => hapticService.vibrate([100, 50, 100])}
          />
        )}

        {step.id === 'measurements' && (
          <div className="bg-white p-6 rounded-[32px] shadow-xl space-y-6">
            {[
              { key: 'height', label: '키', unit: 'cm' },
              { key: 'shoulder', label: '어깨 너비', unit: 'cm' },
              { key: 'chest', label: '가슴 둘레', unit: 'cm' }
            ].map((m) => (
              <div key={m.key} className="flex flex-col gap-2">
                <label className="text-sm font-bold text-synk-grey ml-2">{m.label} ({m.unit})</label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      const currentVal = profile.measurements[m.key as keyof typeof profile.measurements] || 0;
                      const newVal = Math.max(0, currentVal - 1);
                      setProfile(prev => ({
                        ...prev,
                        measurements: { ...prev.measurements, [m.key]: newVal }
                      }));
                      speechService.speak(`${m.label} ${newVal} 센티미터`);
                    }}
                    className="w-14 h-14 rounded-2xl bg-synk-offwhite text-synk-navy flex items-center justify-center text-3xl font-bold active:scale-90 border border-synk-navy/5"
                  > - </button>
                  <input
                    type="number"
                    value={profile.measurements[m.key as keyof typeof profile.measurements] || ''}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      setProfile(prev => ({
                        ...prev,
                        measurements: { ...prev.measurements, [m.key]: val }
                      }));
                    }}
                    onFocus={() => speechService.speak(`${m.label} 입력창입니다. 현재 ${profile.measurements[m.key as keyof typeof profile.measurements] || 0} 센티미터입니다.`)}
                    className="flex-1 h-14 bg-synk-offwhite rounded-2xl text-center text-xl font-bold border-2 border-transparent focus:border-synk-blue outline-none text-synk-navy"
                    placeholder="0"
                  />
                  <button
                    onClick={() => {
                      const currentVal = profile.measurements[m.key as keyof typeof profile.measurements] || 0;
                      const newVal = currentVal + 1;
                      setProfile(prev => ({
                        ...prev,
                        measurements: { ...prev.measurements, [m.key]: newVal }
                      }));
                      speechService.speak(`${m.label} ${newVal} 센티미터`);
                    }}
                    className="w-14 h-14 rounded-2xl bg-synk-offwhite text-synk-navy flex items-center justify-center text-3xl font-bold active:scale-90 border border-synk-navy/5"
                  > + </button>
                </div>
              </div>
            ))}
          </div>
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
