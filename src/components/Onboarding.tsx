import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { speechService } from '../lib/speech';
import { hapticService } from '../lib/haptics';
import { AppScreen, UserProfile } from '../types';
import { AccessibleButton } from '../components/AccessibleButton';
import { ChevronRight, Mic, BookOpen, Smartphone, User, LogIn, Plus, Minus } from 'lucide-react';
import { auth } from '../lib/firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void;
}

const STEPS = [
  { id: 'welcome', label: '환영합니다', hint: 'SYNK는 시각 정보를 감각으로 번역합니다. 로그인을 진행해 주세요. 아래로 스와이프하면 로그인 버튼이 있습니다.' },
  { id: 'voice_setup', label: '음성 설정', hint: '안내 음성의 속도와 크기를 조절합니다.', icon: <Mic /> },
  { id: 'description_mode', label: '설명 모드', hint: '분석 결과의 정보량을 선택합니다. 간단 모드는 핵심만, 상세 모드는 풍부한 설명을 제공합니다.', icon: <BookOpen /> },
  { id: 'haptic_test', label: '촉각 확인', hint: '진동 강도를 확인합니다. 버튼을 누르면 진동이 느껴집니다.', icon: <Smartphone /> },
  { id: 'measurements', label: '신체 데이터', hint: '정확한 핏 분석을 위해 키와 치수를 입력합니다.', icon: <User /> },
  { id: 'skin_tone', label: '피부톤 분석', hint: '카메라로 피부톤을 분석하여 개인화된 추천을 제공합니다.', icon: <ChevronRight /> }
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
    <div className="h-full flex flex-col p-8 pb-16 bg-white text-synk-navy overflow-y-auto">
      <div className="flex-1 flex flex-col justify-center items-center gap-12 text-center py-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={step.id}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            className="flex flex-col items-center gap-10"
          >
            <div className="w-64 h-64 rounded-[4.5rem] flex items-center justify-center -rotate-2 bg-synk-blue shadow-2xl shadow-synk-blue/30 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
              {step.id === 'welcome' ? (
                <div className="font-display font-black text-white text-9xl tracking-tighter text-balloon pt-4 relative z-10">
                  SYNK
                </div>
              ) : (
                <div className="text-white relative z-10 scale-[2.5]">
                  {step.icon}
                </div>
              )}
            </div>
            <div>
              <h1 className="text-6xl font-display font-black mb-6 tracking-tighter leading-none text-synk-navy">{step.label}</h1>
              <p className="text-2xl font-bold text-synk-grey leading-tight max-w-sm mx-auto">
                {step.hint}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="space-y-6">
        {step.id === 'voice_setup' && (
          <div className="bg-white p-10 rounded-[3rem] shadow-2xl space-y-10 border-t-8 border-synk-blue/20">
            <div className="space-y-6">
              <label className="text-xl font-bold text-synk-navy flex justify-between">
                음성 속도
                <span className="text-synk-blue font-black">{profile.settings.speechRate.toFixed(1)}x</span>
              </label>
              <input 
                type="range" 
                min="0.5" max="2.0" step="0.1"
                value={profile.settings.speechRate}
                onChange={(e) => {
                  const rate = parseFloat(e.target.value);
                  setProfile(prev => ({ ...prev, settings: { ...prev.settings, speechRate: rate } }));
                  speechService.setSettings(rate, profile.settings.speechVolume);
                  speechService.speak(`속도를 조절합니다. 현재 ${rate.toFixed(1)} 배속입니다.`, true);
                }}
                className="w-full h-4 bg-synk-offwhite rounded-lg appearance-none cursor-pointer accent-synk-blue"
              />
            </div>
            <div className="space-y-6">
              <label className="text-xl font-bold text-synk-navy flex justify-between">
                음성 크기
                <span className="text-synk-blue font-black">{Math.round(profile.settings.speechVolume * 100)}%</span>
              </label>
              <input 
                type="range" 
                min="0" max="1.0" step="0.1"
                value={profile.settings.speechVolume}
                onChange={(e) => {
                  const vol = parseFloat(e.target.value);
                  setProfile(prev => ({ ...prev, settings: { ...prev.settings, speechVolume: vol } }));
                  speechService.setSettings(profile.settings.speechRate, vol);
                  speechService.speak(`볼륨을 조절합니다. 현재 ${Math.round(vol * 100)} 퍼센트입니다.`, true);
                }}
                className="w-full h-4 bg-synk-offwhite rounded-lg appearance-none cursor-pointer accent-synk-blue"
              />
            </div>
          </div>
        )}

        {step.id === 'welcome' && !isVoiceLoggingIn && (
          <div className="flex flex-col gap-4">
            <AccessibleButton
              label="음성 로그인 시작"
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
              label="Google 로그인"
              variant="primary"
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
          <div className="bg-white p-10 rounded-[3rem] shadow-2xl space-y-8 text-center border-t-8 border-synk-grey/20">
            <div className="text-sm text-synk-blue uppercase font-black tracking-widest bg-synk-blue/5 py-2 rounded-full">Voice Recog Active</div>
            <div className="text-4xl font-black text-synk-navy">
              {voiceLoginStep === 'email' ? '이메일을\n말해주세요' : '비밀번호를\n말해주세요'}
            </div>
            <div className="flex flex-col gap-4 text-left">
              <div 
                className="p-6 bg-synk-offwhite text-synk-navy rounded-3xl border-2 border-synk-navy/5 shadow-inner"
              >
                <span className="text-xs block font-black uppercase opacity-40 mb-1">Email Address</span>
                <span className="text-xl font-bold break-all">{email || 'Waiting...'}</span>
              </div>
              <div 
                className="p-6 bg-synk-offwhite text-synk-navy rounded-3xl border-2 border-synk-navy/5 shadow-inner"
              >
                <span className="text-xs block font-black uppercase opacity-40 mb-1">Secret Key</span>
                <span className="text-xl font-bold">{'*'.repeat(password.length) || 'Waiting...'}</span>
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
              label="간단 모드 (Short)"
              variant={profile.settings.detailMode === 'simple' ? 'secondary' : 'ghost'}
              className={profile.settings.detailMode === 'simple' ? '' : 'text-synk-navy border-synk-navy/5 bg-synk-offwhite'}
              onClick={() => {
                setProfile(prev => ({ ...prev, settings: { ...prev.settings, detailMode: 'simple' } }));
                speechService.speak('간단 모드가 선택되었습니다.');
              }}
            />
            <AccessibleButton
              label="상세 모드 (Detailed)"
              variant={profile.settings.detailMode === 'detailed' ? 'secondary' : 'ghost'}
              className={profile.settings.detailMode === 'detailed' ? '' : 'text-synk-navy border-synk-navy/5 bg-synk-offwhite'}
              onClick={() => {
                setProfile(prev => ({ ...prev, settings: { ...prev.settings, detailMode: 'detailed' } }));
                speechService.speak('상세 모드가 선택되었습니다.');
              }}
            />
          </div>
        )}
        
        {step.id === 'haptic_test' && (
          <AccessibleButton
            label="진동 피드백 테스트"
            variant="secondary"
            onClick={() => hapticService.vibrate([100, 50, 100])}
          />
        )}

        {step.id === 'measurements' && (
          <div className="bg-white p-10 rounded-[3rem] shadow-2xl space-y-8 border-t-8 border-synk-blue/20">
            {[
              { key: 'height', label: '나의 키' },
              { key: 'shoulder', label: '어깨너비' },
              { key: 'chest', label: '가슴둘레' }
            ].map((m) => (
              <div key={m.key} className="flex flex-col gap-4">
                <label className="text-xl font-bold text-synk-navy ml-2 flex items-center justify-between">
                  {m.label}
                  <span className="text-sm font-black opacity-30 uppercase tracking-widest">centimeters</span>
                </label>
                <div className="flex items-center gap-4">
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
                    className="w-18 h-18 rounded-[2rem] bg-synk-blue text-white flex items-center justify-center text-4xl font-black active:scale-90 shadow-xl shadow-synk-blue/20"
                  > <Minus className="w-8 h-8" /> </button>
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
                    className="flex-1 h-18 bg-synk-offwhite rounded-[2rem] text-center text-3xl font-black border-4 border-synk-navy/5 outline-none text-synk-navy focus:border-synk-blue/30 transition-colors"
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
                    className="w-18 h-18 rounded-[2rem] bg-white text-synk-navy flex items-center justify-center text-4xl font-black active:scale-95 shadow-xl shadow-black/5 border-2 border-synk-navy/5"
                  > <Plus className="w-8 h-8" /> </button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {(!isVoiceLoggingIn || step.id !== 'welcome') && (
          <div className="pt-10 flex items-center justify-between mt-auto">
            <div className="text-2xl font-black text-synk-navy/30 tracking-tighter">
              {currentStep + 1} <span className="opacity-50">/</span> {STEPS.length}
            </div>
            
            <div className="flex items-center gap-4">
              {currentStep > 0 && (
                <button 
                  onClick={() => setCurrentStep(prev => prev - 1)}
                  className="px-6 py-3 font-black text-synk-navy/40 uppercase tracking-widest text-sm hover:text-synk-navy transition-colors"
                >
                  Back
                </button>
              )}
              <button
                onClick={handleNext}
                className="bg-gradient-to-r from-synk-blue to-synk-cyan text-white px-8 py-4 rounded-full font-black text-xl shadow-xl shadow-synk-blue/20 flex items-center gap-2 active:scale-95 transition-all"
              >
                {currentStep === STEPS.length - 1 ? '시작하기' : '다음'}
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
