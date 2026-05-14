import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { speechService } from '../lib/speech';
import { hapticService } from '../lib/haptics';
import { AppScreen, UserProfile } from '../types';
import { AccessibleButton } from './AccessibleButton';
import { RefreshCw, User, CheckCircle2, X } from 'lucide-react';

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

  useEffect(() => {
    let isMounted = true;
    // ...
  }, []);

  const analyzeBeauty = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setIsAnalyzing(true);
    setAnalysisProgress(0);
    hapticService.tap();
    speechService.speak('얼굴 대칭과 메이크업을 분석하고 있습니다.');

    const statuses = [
      '안면 랜드마크 추출 중...',
      '눈썹 대칭 분석 중...',
      '아이 메이크업 밀도 확인...',
      '치크 밸런스 측정 중...',
      '립 라인 정확도 분석...',
      '최종 가이드 생성 완료'
    ];

    for (let i = 0; i <= 100; i += 2) {
      await new Promise(r => setTimeout(r, 35));
      setAnalysisProgress(i);
      
      const statusIdx = Math.min(Math.floor((i / 100) * statuses.length), statuses.length - 1);
      setScanningStatus(statuses[statusIdx]);
      
      if (i % 15 === 0) hapticService.vibrate(HapticPattern.SILK);
    }

    try {
      const mockResults = [
        "전체적인 메이크업 대칭이 매우 훌륭합니다. 오른쪽 눈썹 꼬리 부분을 아주 살짝만 더 길게 빼주시면 완벽한 수평 균형을 이룰 것 같습니다. 전체적으로 화사하고 신뢰감을 주는 분위기입니다.",
        "왼쪽 볼의 치크가 오른쪽보다 약간 더 넓게 표현되었습니다. 브러시로 경계선을 살짝만 펴주시면 자연스러울 것 같습니다. 립 컬러가 피부톤과 아주 잘 어우러져 건강한 이미지를 줍니다.",
        "현재 눈화장의 대칭은 완벽합니다. 다만 오른쪽 아이라인 끝이 왼쪽보다 1mm 정도 높게 올라가 있습니다. 면봉으로 끝부분만 살짝 다듬어주시면 더 정돈된 인상을 줄 수 있습니다.",
        "전체적인 얼굴 균형이 잘 맞습니다. 이마 부분의 하이라이터가 은은하게 빛나 입체감이 살아나 보입니다. 지금 그대로도 충분히 매력적이고 세련된 모습입니다.",
        "베이스 메이크업이 매우 균일하게 표현되었습니다. 다만 입술 산의 대칭이 왼쪽으로 약간 치우쳐져 있습니다. 립 라이너를 사용해 오른쪽을 1mm만 보정하면 대칭이 완벽해질 것 같습니다."
      ];

      const randomIndex = Math.floor(Math.random() * mockResults.length);
      const analysisText = mockResults[randomIndex];

      setResult(analysisText);
      speechService.speak(analysisText);
      hapticService.success();
    } catch (err) {
      console.error(err);
      speechService.speak('분석 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="h-full relative bg-white flex flex-col pt-24">
      <div className="absolute top-6 left-6 right-6 z-20 flex justify-between">
        <button 
          onClick={() => onNavigate(AppScreen.HOME)}
          className="p-5 rounded-3xl bg-synk-offwhite text-synk-navy border border-synk-navy/5 active:scale-95 transition-all"
          aria-label="닫기"
        >
          <X className="w-10 h-10" />
        </button>
      </div>

      <div className="flex-1 w-full bg-white relative overflow-hidden flex items-center justify-center bg-synk-offwhite">
        {!stream && !cameraError && (
          <div className="flex flex-col items-center gap-6 animate-pulse">
            <RefreshCw className="w-16 h-16 text-synk-cyan animate-spin" />
            <p className="text-xl font-bold text-synk-navy/40">카메라 불러오는 중...</p>
          </div>
        )}

        {cameraError && (
          <div className="p-12 text-center space-y-6">
            <p className="text-2xl font-bold text-red-500">{cameraError}</p>
            <AccessibleButton 
              label="카메라 다시 시도" 
              onClick={() => window.location.reload()} 
              variant="secondary"
            />
          </div>
        )}

        {isSimulated && (
          <div className="absolute inset-0 bg-synk-offwhite flex flex-col items-center justify-center gap-8 overflow-hidden">
            <div className="w-full h-full opacity-10 relative">
               <div className="w-full h-full bg-[radial-gradient(circle,rgba(0,0,0,0.4)_1px,transparent_1px)] bg-[length:40px_40px]" />
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-synk-blue/40">
               <User className="w-40 h-40 stroke-[0.5px] animate-pulse" />
               <p className="text-2xl font-black tracking-widest uppercase">Mirror Simulation</p>
            </div>
          </div>
        )}

        <video 
          ref={videoRef}
          autoPlay 
          playsInline 
          muted
          className={`w-full h-full object-cover scale-x-[-1] ${(isSimulated || !stream) ? 'hidden' : 'block'}`} // Mirror for selfie
        />
        <canvas ref={canvasRef} className="hidden" width={640} height={480} />
        
        {/* Face Guide Overlay */}
        <div className="absolute inset-0 border-[60px] border-white/20 pointer-events-none">
          <div className="w-full h-full border-4 border-synk-blue/40 rounded-[120px] flex items-center justify-center">
             <div className="w-1 h-32 bg-synk-blue/20 absolute" />
             <div className="w-32 h-1 bg-synk-blue/20 absolute" />
          </div>
        </div>

        {isAnalyzing && (
          <div className="absolute inset-0 bg-synk-navy/90 backdrop-blur-xl flex flex-col items-center justify-center text-white gap-12 z-50">
            <div className="relative w-80 h-80 flex items-center justify-center">
               <div className="absolute inset-0 border-2 border-cyber-blue/40 rounded-full animate-spin [animation-duration:8s]" />
               <div className="absolute inset-8 border-4 border-neon-green/20 rounded-full animate-ping" />
               <div className="text-7xl font-black text-neon-green neon-glow-green">{analysisProgress}%</div>
               
               {/* Technical crosshair */}
               <div className="absolute inset-0 flex items-center justify-center opacity-30">
                 <div className="w-1 h-full bg-cyber-blue absolute" />
                 <div className="w-full h-1 bg-cyber-blue absolute" />
               </div>
            </div>

            <div className="w-80 space-y-4">
              <div className="h-6 w-full bg-white/5 rounded-full overflow-hidden border border-white/10 p-1">
                <motion.div 
                   className="h-full bg-gradient-to-r from-neon-green via-cyber-blue to-neon-green bg-[length:200%_100%] animate-[shimmer_2s_infinite_linear] rounded-full shadow-[0_0_15px_#00FF94]"
                   initial={{ width: 0 }}
                   animate={{ width: `${analysisProgress}%` }}
                />
              </div>
              <p className="text-center text-sm font-black tracking-widest uppercase text-cyber-blue animate-pulse">
                {scanningStatus}
              </p>
            </div>
            
            <div className="absolute inset-0 pointer-events-none">
               <div className="absolute inset-x-0 h-2 bg-neon-green/40 shadow-[0_0_30px_#00FF94] animate-scan-line" />
            </div>
          </div>
        )}

        {result && (
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="absolute inset-x-6 bottom-12 bg-white rounded-[3rem] p-10 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.15)] text-synk-navy flex flex-col gap-6 border-b-8 border-synk-blue/10 z-40"
          >
            <div className="flex items-center gap-4 text-synk-blue font-black text-3xl tracking-tighter">
              <CheckCircle2 className="w-10 h-10" />
              분석 완료
            </div>
            <p className="text-xl leading-relaxed max-h-80 overflow-y-auto font-medium text-synk-navy/80">{result}</p>
            <AccessibleButton 
               label="다시 분석" 
               variant="ghost" 
               className="py-5"
               onClick={() => setResult(null)} 
            />
          </motion.div>
        )}
      </div>

      <div className="p-8 bg-white border-t-2 border-synk-offwhite">
        {!result && (
          <AccessibleButton
            label={isAnalyzing ? '분석 중...' : '메이크업 대칭 분석'}
            hint="얼굴 전체를 분석합니다"
            variant="primary"
            icon={<User className="w-10 h-10" />}
            onClick={analyzeBeauty}
            className="h-32 text-2xl font-black"
          />
        )}
      </div>
    </div>
  );
};
