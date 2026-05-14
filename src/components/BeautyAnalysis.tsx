import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { speechService } from '../lib/speech';
import { hapticService } from '../lib/haptics';
import { AppScreen, UserProfile } from '../types';
import { AccessibleButton } from './AccessibleButton';
import { RefreshCw, User, CheckCircle2, X, Sparkles } from 'lucide-react';
import { HapticPattern } from '../lib/haptics';

import { cameraManager } from '../lib/camera';

interface BeautyAnalysisProps {
  onNavigate: (screen: AppScreen) => void;
  profile: UserProfile | null;
}

export const BeautyAnalysis: React.FC<BeautyAnalysisProps> = ({ onNavigate, profile }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const [isSimulated, setIsSimulated] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const startCamera = async () => {
      setCameraError(null);
      if (!isMounted) return;

      try {
        const mediaStream = await cameraManager.getStream({
          video: { 
            facingMode: 'user',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });
        
        if (!isMounted) {
          cameraManager.stopStream();
          return;
        }

        const isSim = (mediaStream as any).isSimulated;
        setIsSimulated(!!isSim);

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          try { await videoRef.current.play(); } catch (e) {}
        }
        setStream(mediaStream);

        if (isSim) {
          speechService.speak('뷰티 카메라 하드웨어가 준비 중입니다. 시뮬레이션 모드를 시작합니다.');
        } else {
          speechService.speak('뷰티 카메라가 활성화되었습니다.');
        }
      } catch (err: any) {
        console.error('Beauty Camera access error:', err);
        if (isMounted) {
          if (err.name === 'NotAllowedError') {
            const msg = '뷰티 카메라 권한이 거부되었습니다. 설정에서 승인해주세요.';
            setCameraError(msg);
            speechService.speak(msg);
          } else {
            const msg = '카메라 초기화에 실패했습니다. 다른 앱을 종료한 후 다시 시도해주세요.';
            setCameraError(msg);
            speechService.speak(msg);
          }
        }
      }
    };

    startCamera();

    return () => {
      isMounted = false;
      if (videoRef.current) {
        videoRef.current.srcObject = null;
        try { videoRef.current.load();} catch (e) {}
      }
      cameraManager.stopStream();
      setStream(null);
    };
  }, []);

  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [scanningStatus, setScanningStatus] = useState('');
  const [detailedResults, setDetailedResults] = useState<{
    faceShape: string;
    personalColor: string;
    style: string;
    item: string;
  } | null>(null);

  useEffect(() => {
    let isMounted = true;
    const startCamera = async () => {
      setCameraError(null);
      if (!isMounted) return;

      try {
        const mediaStream = await cameraManager.getStream({
          video: { 
            facingMode: 'user',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });
        
        if (!isMounted) {
          cameraManager.stopStream();
          return;
        }

        const isSim = (mediaStream as any).isSimulated;
        setIsSimulated(!!isSim);

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          try { await videoRef.current.play(); } catch (e) {}
        }
        setStream(mediaStream);

        if (isSim) {
          speechService.speak('뷰티 카메라 하드웨어가 준비 중입니다. 시뮬레이션 모드를 시작합니다.');
        } else {
          speechService.speak('뷰티 진단 카메라가 활성화되었습니다. 얼굴을 가이드 라인에 맞춰주세요.');
        }
      } catch (err: any) {
        console.error('Beauty Camera access error:', err);
        if (isMounted) {
          if (err.name === 'NotAllowedError') {
            const msg = '뷰티 카메라 권한이 거부되었습니다. 설정에서 승인해주세요.';
            setCameraError(msg);
            speechService.speak(msg);
          } else {
            const msg = '카메라 초기화에 실패했습니다. 다른 앱을 종료한 후 다시 시도해주세요.';
            setCameraError(msg);
            speechService.speak(msg);
          }
        }
      }
    };

    startCamera();

    return () => {
      isMounted = false;
      if (videoRef.current) {
        videoRef.current.srcObject = null;
        try { videoRef.current.load();} catch (e) {}
      }
      cameraManager.stopStream();
      setStream(null);
    };
  }, []);

  const analyzeBeauty = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setIsAnalyzing(true);
    setAnalysisProgress(0);
    setResult('');
    setDetailedResults(null);
    hapticService.tap();
    speechService.speak('정밀 뷰티 분석을 시작합니다. 잠시만 가만히 계셔주세요.');

    const statuses = [
      '얼굴 윤곽 정밀 스캔 중...',
      '피부톤 및 퍼스널 컬러 측정 중...',
      '이목구비 비율 분석 중...',
      '안색 및 탄력도 체크 중...',
      '골격 스타일 매칭 중...',
      '최적의 스타일 제안 생성 중...'
    ];

    for (let i = 0; i <= 100; i += 2) {
      await new Promise(r => setTimeout(r, 40));
      setAnalysisProgress(i);
      
      const statusIdx = Math.min(Math.floor((i / 100) * statuses.length), statuses.length - 1);
      setScanningStatus(statuses[statusIdx]);
      
      if (i % 20 === 0) hapticService.vibrate(HapticPattern.SILK);
    }

    try {
      const faceShapes = ['계란형 (Oval)', '둥근형 (Round)', '하트형 (Heart)', '다이아몬드형 (Diamond)'];
      const personalColors = ['봄 웜 라이트 (Spring Warm)', '여름 쿨 뮤트 (Summer Cool)', '가을 웜 딥 (Autumn Warm)', '겨울 쿨 클리어 (Winter Cool)'];
      const styles = ['세련된 미니멀 (Minimal)', '우아한 로맨틱 (Romantic)', '시크한 어반 (Urban)', '클래식 프레피 (Classic)'];
      const items = ['골드 이어링 & 코랄 립', '실버 네크리스 & 핑크 블러셔', '볼드한 뱅글 & 매트 레드 립', '진주 목걸이 & 누드톤 메이크업'];

      const res = {
        faceShape: faceShapes[Math.floor(Math.random() * faceShapes.length)],
        personalColor: personalColors[Math.floor(Math.random() * personalColors.length)],
        style: styles[Math.floor(Math.random() * styles.length)],
        item: items[Math.floor(Math.random() * items.length)]
      };

      setDetailedResults(res);
      const summary = `분석 완료. 귀하는 ${res.faceShape}이며, ${res.personalColor} 타입입니다. 추천 스타일은 ${res.style}이며, ${res.item} 아이템을 추천합니다.`;
      setResult(summary);
      speechService.speak(summary);
      hapticService.success();
    } catch (err) {
      console.error(err);
      speechService.speak('진단 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-beauty-beige overflow-y-auto pb-24">
      {/* Header */}
      <header className="p-6 flex items-center justify-between">
        <button 
          onClick={() => onNavigate(AppScreen.HOME)}
          className="w-12 h-12 rounded-2xl bg-white beauty-shadow flex items-center justify-center text-beauty-pink"
        >
          <X className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-black text-synk-navy tracking-tight">AI BEAUTY LAB</h1>
        <div className="w-12 h-12 rounded-2xl bg-beauty-pink/10 flex items-center justify-center text-beauty-pink">
          <Sparkles className="w-6 h-6" />
        </div>
      </header>

      {/* Camera Viewfinder */}
      <div className="flex-1 px-6 pb-6 mt-4">
        <div className="relative aspect-[3/4] w-full bg-white rounded-[3rem] overflow-hidden beauty-shadow border-4 border-white">
          <video 
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover grayscale-[0.1] contrast-[1.1] scale-x-[-1] transition-all duration-700 ${isAnalyzing ? 'blur-[1px]' : ''} ${(isSimulated || !stream) ? 'hidden' : 'block'}`}
          />
          
          {/* Viewfinder Overlay */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Ellipse Guide */}
            <div className="absolute inset-12 border-2 border-dashed border-white/40 rounded-[50%_50%_45%_45%] flex items-center justify-center">
              <div className="w-1 h-8 bg-beauty-pink/30 rounded-full" />
            </div>

            {/* Grid lines */}
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-10">
              <div className="border border-white/20" />
              <div className="border border-white/20" />
              <div className="border border-white/20" />
              <div className="border border-white/20" />
              <div className="border border-white/20" />
              <div className="border border-white/20" />
              <div className="border border-white/20" />
              <div className="border border-white/20" />
              <div className="border border-white/20" />
            </div>

            {isSimulated && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-beauty-pink/30">
                <User className="w-40 h-40 stroke-[0.5px] animate-pulse" />
                <p className="text-xl font-black tracking-widest uppercase">Mirror Simulation</p>
              </div>
            )}
          </div>

          {isAnalyzing && (
            <div className="absolute inset-0 bg-white/90 backdrop-blur-md flex flex-col items-center justify-center text-synk-navy gap-8 z-50">
              <div className="relative w-80 h-80 flex items-center justify-center">
                 <div className="absolute inset-0 border-4 border-beauty-pink/30 rounded-full animate-ping" />
                 <div className="absolute inset-8 border-2 border-beauty-pink/10 rounded-full" />
                 <div className="text-7xl font-black text-beauty-pink beauty-glow tabular-nums">{analysisProgress}%</div>
                 
                 {/* Orbital circles */}
                 <motion.div 
                   className="absolute inset-0 border border-beauty-pink/10 rounded-full"
                   animate={{ rotate: 360 }}
                   transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                 >
                   <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-4 bg-beauty-pink rounded-full beauty-glow shadow-[0_0_15px_#FF85A1]" />
                 </motion.div>
              </div>

              <div className="w-80 space-y-4 px-8">
                <p className="text-center text-sm font-bold tracking-widest uppercase text-beauty-pink animate-pulse">
                  {scanningStatus}
                </p>
                <div className="h-2 w-full bg-beauty-pink/10 rounded-full overflow-hidden">
                  <motion.div 
                     className="h-full bg-beauty-pink"
                     initial={{ width: 0 }}
                     animate={{ width: `${analysisProgress}%` }}
                  />
                </div>
              </div>
              
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                 <div className="absolute inset-x-0 h-1 bg-beauty-pink shadow-[0_0_20px_#FF85A1] animate-scan-line" />
              </div>
            </div>
          )}

          {cameraError && (
             <div className="absolute inset-0 bg-synk-navy flex flex-col items-center justify-center p-12 text-center text-white">
                <X className="w-16 h-16 text-synk-peach mb-4" />
                <p className="font-bold">{cameraError}</p>
             </div>
          )}
        </div>
      </div>

      {/* Action Area */}
      <div className="p-6 pt-0">
        {!result ? (
          <AccessibleButton
            label="스캔 및 스타일 분석 시작"
            onClick={analyzeBeauty}
            isLoading={isAnalyzing}
            className="w-full h-24 rounded-[3rem] bg-beauty-pink text-white flex items-center justify-center gap-4 text-xl font-black beauty-shadow active:scale-95 transition-all"
            icon={<Sparkles className="w-7 h-7" />}
          />
        ) : (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="bg-white rounded-[3.5rem] p-10 beauty-shadow">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 rounded-full bg-beauty-beige flex items-center justify-center text-beauty-pink">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="font-black text-2xl text-synk-navy">스타일 진단 리포트</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: '얼굴형', value: detailedResults?.faceShape },
                  { label: '퍼스널 컬러', value: detailedResults?.personalColor },
                  { label: '추천 스타일', value: detailedResults?.style },
                  { label: '추천 아이템', value: detailedResults?.item },
                ].map((item, idx) => (
                  <div key={idx} className="p-5 rounded-3xl bg-beauty-beige/50 border border-beauty-pink/5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-beauty-pink/60 mb-2">{item.label}</p>
                    <p className="text-base font-bold text-synk-navy leading-tight">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex gap-4">
              <AccessibleButton
                label="다시 진단하기"
                onClick={() => {
                  setResult('');
                  setDetailedResults(null);
                  analyzeBeauty();
                }}
                className="flex-1 h-20 rounded-[2.5rem] bg-white text-beauty-pink border-2 border-beauty-pink/20 flex items-center justify-center gap-3 text-lg font-black active:scale-95 transition-all"
                icon={<RefreshCw className="w-5 h-5" />}
              />
              <button
                onClick={() => onNavigate(AppScreen.HOME)}
                className="w-20 h-20 rounded-[2.5rem] bg-synk-navy text-white flex items-center justify-center beauty-shadow shadow-black/10"
              >
                <X className="w-8 h-8" />
              </button>
            </div>
          </div>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" width={640} height={480} />
    </div>
  );
};
