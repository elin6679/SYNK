import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { speechService } from '../lib/speech';
import { hapticService, HapticPattern } from '../lib/haptics';
import { AppScreen, UserProfile } from '../types';
import { AccessibleButton } from './AccessibleButton';
import { Camera, X, RefreshCw, Info, Save } from 'lucide-react';
import { db, auth, OperationType, handleFirestoreError } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

import { cameraManager } from '../lib/camera';

interface AnalysisProps {
  onNavigate: (screen: AppScreen) => void;
  profile: UserProfile | null;
}

export const Analysis: React.FC<AnalysisProps> = ({ onNavigate, profile }) => {
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
            facingMode: 'environment',
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
          speechService.speak('카메라 하드웨어 준비 중입니다. 시뮬레이션 모드를 시작합니다.');
        } else {
          speechService.speak('카메라가 활성화되었습니다.');
        }
      } catch (err: any) {
        console.error('Analysis Camera error:', err);
        if (isMounted) {
          if (err.name === 'NotAllowedError') {
            const msg = '카메라 권한이 거부되었습니다. 브라우저 설정에서 허용해주세요.';
            setCameraError(msg);
            speechService.speak(msg);
          } else {
            const msg = '카메라를 시작할 수 없습니다. 다른 앱에서 카메라를 사용 중인지 확인해주세요.';
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
        try { videoRef.current.load(); } catch (e) {}
      }
      cameraManager.stopStream();
      setStream(null);
    };
  }, []);

  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [scanningStatus, setScanningStatus] = useState('');

  useEffect(() => {
    let isMounted = true;
    // ... rest of the code ...
  }, []);

  const captureAndAnalyze = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setIsAnalyzing(true);
    setAnalysisProgress(0);
    hapticService.tap();
    speechService.speak('이미지를 분석하고 있습니다. 잠시만 기다려주세요.');

    // Simulated scanning sequence
    const statuses = [
      '데이터베이스 연결 중...',
      '패턴 스캔 중...',
      '컬러 추출 중...',
      '소재 질감 분석 중...',
      '스타일 데이터 매칭 중...',
      '분석 완료!'
    ];

    for (let i = 0; i <= 100; i += 2) {
      await new Promise(r => setTimeout(r, 40));
      setAnalysisProgress(i);
      
      const statusIdx = Math.min(Math.floor((i / 100) * statuses.length), statuses.length - 1);
      setScanningStatus(statuses[statusIdx]);
      
      if (i % 20 === 0) hapticService.vibrate(HapticPattern.COTTON);
    }

    try {
      const mockResults = [
        `[간단 버전]
         신선한 포레스트 그린 컬러의 부드러운 코튼 티셔츠입니다.
         
         [상세 버전]
         - 색상: 깊은 숲속을 연상 시키는 차분하고 신뢰감을 주는 초록색입니다.
         - 재질: 자연스러운 면 소재로 통기성이 좋고 피부에 닿는 느낌이 보들보들합니다.
         - 추천 상황: 캐주얼한 데이트나 일상적인 외출 시 편안하면서도 센스 있어 보입니다.
         
         [MATERIAL:cotton]`,
        
        `[간단 버전]
         우아한 진주빛 실크 블라우스로 격식 있는 자리에 어울립니다.
         
         [상세 버전]
         - 색상: 은은한 광택이 도는 미색으로 고귀하고 우아한 분위기를 자아냅니다.
         - 재질: 매끄럽고 찰랑거리는 실크 소재가 몸을 부드럽게 감싸는 느낌입니다.
         - 추천 상황: 중요한 비즈니스 미팅이나 하객 룩으로 세련된 인상을 남길 수 있습니다.
         
         [MATERIAL:silk]`,

        `[간단 버전]
         클래식한 인디고 블루 컬러의 탄탄한 데님 자켓입니다.
         
         [상세 버전]
         - 색상: 세월의 멋이 느껴지는 깊은 청색으로 어떤 하의와도 잘 어울립니다.
         - 재질: 짜임이 촘촘하고 탄탄한 데님 직물로 아주 튼튼한 촉감이 느껴집니다.
         - 추천 상황: 활동적인 나들이나 야외 활동 시 경쾌하고 젊은 느낌을 줍니다.
         
         [MATERIAL:denim]`,

        `[간단 버전]
         포근한 아이보리 컬러의 묵직한 케이블 니트 스웨터입니다.
         
         [상세 버전]
         - 색상: 따뜻하고 부드러운 우유빛 색상으로 보는 사람까지 포근하게 만듭니다.
         - 재질: 털실의 굵기가 굵고 짜임이 입체적인 니트 소재로 중량감이 느껴집니다.
         - 추천 상황: 쌀쌀한 날씨에 카페에서 여유를 즐기거나 가까운 사람과의 만남에 완벽합니다.
         
         [MATERIAL:knit]`,

        `[간단 버전]
         세련된 제트 블랙 컬러의 매끄러운 가죽 자켓입니다.
         
         [상세 버전]
         - 색상: 강렬하면서도 세련된 분위기를 주는 깊은 검정색입니다.
         - 재질: 표면이 매끈하고 힘이 있는 가죽 소재로 묵직한 존재감이 느껴집니다.
         - 추천 상황: 자신감을 표현하고 싶은 자리나 저녁 모임에 멋스럽게 어울립니다.
         
         [MATERIAL:leather]`,

        `[간단 버전]
         화사한 레몬 옐로우 컬러의 시원한 린넨 셔츠입니다.
         
         [상세 버전]
         - 색상: 기분까지 밝게 만드는 상큼하고 활기찬 노란색입니다.
         - 재질: 짜임이 성글고 가벼운 린넨 소재로 사락사락 시원한 촉감이 일품입니다.
         - 추천 상황: 무더운 여름날 해변가 산책이나 피크닉에 이상적인 선택입니다.
         
         [MATERIAL:linen]`
      ];

      const randomIndex = Math.floor(Math.random() * mockResults.length);
      const analysisText = mockResults[randomIndex];

      setResult(analysisText);
      const speechText = analysisText.replace(/\[MATERIAL:.*?\]/, '').trim();
      speechService.speak(speechText);
      hapticService.success();
    } catch (err) {
      console.error(err);
      speechService.speak('분석 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const parseResult = (text: string) => {
    const materialMatch = text.match(/\[MATERIAL:(.*?)\]/);
    const material = materialMatch ? materialMatch[1].toLowerCase() : 'cotton';
    
    let cleanText = text.replace(/\[MATERIAL:.*?\]/, '').trim();
    
    // Improved parsing for Simple vs Detailed sections
    let simple = '';
    let detailed = '';

    if (cleanText.includes('[간단 버전]') && cleanText.includes('[상세 버전]')) {
      const parts = cleanText.split('[상세 버전]');
      simple = parts[0].replace('[간단 버전]', '').trim();
      detailed = parts[1].trim();
    } else {
      // Fallback if formatting is slightly off
      simple = cleanText.split('\n')[0];
      detailed = cleanText;
    }

    return { simple, detailed, material };
  };

  // Rubbing screen interaction
  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!result) return;
    
    // Extract material for real-time haptic feedback
    const materialMatch = result.match(/\[MATERIAL:(.*?)\]/);
    const material = materialMatch ? materialMatch[1].toLowerCase() : 'cotton';
    
    const pattern = (MATERIAL_MAP as any)[material]?.pattern || HapticPattern.COTTON;
    hapticService.vibrate(pattern);
  };

  const saveToCloset = async () => {
    if (!result) return;

    try {
      hapticService.tap();
      
      // Extract material
      const materialMatch = result.match(/\[MATERIAL:(.*?)\]/);
      const materialKey = materialMatch ? materialMatch[1].toLowerCase() : 'cotton';
      const cleanDescription = result.replace(/\[MATERIAL:.*?\]/, '').trim();

      const newItem = {
        id: Date.now().toString(),
        name: 'AI 감각 번역 의류',
        category: 'AI Analysis',
        color: 'Auto',
        texture: 'Auto',
        material: materialKey as any,
        description: cleanDescription,
        imageUrl: canvasRef.current?.toDataURL('image/jpeg'),
        createdAt: Date.now()
      };

      const saved = localStorage.getItem('synk_touch_closet');
      const items = saved ? JSON.parse(saved) : [];
      localStorage.setItem('synk_touch_closet', JSON.stringify([newItem, ...items]));
      
      hapticService.success();
      speechService.speak('옷장에 저장되었습니다. 이제 옷장에서 직접 만져보실 수 있습니다.');
      onNavigate(AppScreen.CLOSET);
    } catch (error) {
      console.error('Save error:', error);
      speechService.speak('저장 중 오류가 발생했습니다.');
    }
  };

  const MATERIAL_MAP = {
    silk: { pattern: HapticPattern.SILK },
    knit: { pattern: HapticPattern.KNIT },
    denim: { pattern: HapticPattern.DENIM },
    leather: { pattern: HapticPattern.LEATHER },
    fur: { pattern: HapticPattern.FUR },
    cotton: { pattern: HapticPattern.COTTON },
    linen: { pattern: HapticPattern.LINEN },
  };

  return (
    <div className="h-full relative bg-white flex flex-col">
      <div className="absolute top-6 left-6 right-6 z-20 flex justify-between">
        <button 
          onClick={() => onNavigate(AppScreen.HOME)}
          className="p-5 rounded-3xl bg-white shadow-xl shadow-black/5 text-synk-navy border border-synk-navy/5 active:scale-95 transition-all"
          aria-label="닫기"
        >
          <X className="w-10 h-10" />
        </button>
        <div className="p-5 rounded-3xl bg-synk-blue text-white shadow-xl shadow-synk-blue/20">
            <Camera className="w-10 h-10" />
        </div>
      </div>

      <div 
        className="flex-1 w-full bg-white relative overflow-hidden flex items-center justify-center bg-synk-offwhite"
        onTouchMove={handleTouchMove}
        onMouseMove={handleTouchMove}
      >
        {!stream && !cameraError && (
          <div className="flex flex-col items-center gap-6 animate-pulse">
            <RefreshCw className="w-16 h-16 text-synk-blue animate-spin" />
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
          <div className="absolute inset-0 bg-synk-navy flex flex-col items-center justify-center gap-8 overflow-hidden">
            <div className="w-full h-full opacity-20 relative">
               <div className="absolute inset-x-0 h-4 bg-white/20 animate-scan-line top-1/2" />
               <div className="w-full h-full bg-[radial-gradient(circle,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[length:20px_20px]" />
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-white/50">
               <Camera className="w-24 h-24 stroke-[1px] animate-pulse" />
               <p className="text-xl font-medium tracking-widest uppercase">Simulated Viewport</p>
            </div>
          </div>
        )}

        <video 
          ref={videoRef}
          autoPlay 
          playsInline 
          muted
          className={`w-full h-full object-cover ${(isSimulated || !stream) ? 'hidden' : 'block'}`}
        />
        <canvas ref={canvasRef} className="hidden" width={640} height={480} />
        
        {isAnalyzing && (
          <div className="absolute inset-0 bg-synk-navy/90 backdrop-blur-md flex flex-col items-center justify-center text-white gap-12 z-50">
            <div className="relative w-72 h-72 flex items-center justify-center">
               <div className="absolute inset-0 border-4 border-cyber-blue/30 rounded-full animate-ping" />
               <div className="absolute inset-4 border-2 border-neon-green/20 rounded-full" />
               <div className="text-6xl font-black text-cyber-blue neon-glow-blue">{analysisProgress}%</div>
               
               {/* Orbital dots */}
               <div className="absolute inset-0 animate-[spin_4s_linear_infinite]">
                 <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-4 bg-neon-green rounded-full shadow-[0_0_15px_#00FF94]" />
               </div>
            </div>

            <div className="w-80 space-y-4">
              <div className="h-4 w-full bg-white/10 rounded-full overflow-hidden border border-white/10 p-1">
                <motion.div 
                   className="h-full bg-gradient-to-r from-cyber-blue to-neon-green rounded-full shadow-[0_0_10px_#00F0FF]"
                   initial={{ width: 0 }}
                   animate={{ width: `${analysisProgress}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-xs font-black tracking-widest uppercase text-white/40">
                <span className="animate-pulse">{scanningStatus}</span>
                <span>AI_ANALYSIS_v3.0</span>
              </div>
            </div>
            
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
               <div className="absolute inset-x-0 h-1 bg-cyber-blue/50 shadow-[0_0_20px_#00F0FF] animate-scan-line" />
            </div>
          </div>
        )}

        {result && (
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            className="absolute inset-x-0 bottom-0 top-0 bg-white p-12 overflow-y-auto text-synk-navy z-40 rounded-t-[3rem] shadow-[0_-20px_50px_rgba(0,0,0,0.1)]"
            onTouchMove={handleTouchMove}
            onMouseMove={handleTouchMove}
            onPointerUp={() => hapticService.stop()}
            onPointerLeave={() => hapticService.stop()}
          >
            <div className="flex flex-col gap-10 pb-32 pt-16">
              <div className="flex items-center justify-between border-b-4 border-synk-blue/10 pb-6">
                <h2 className="text-5xl font-black tracking-tighter text-synk-blue">감각 번역 결과</h2>
                <div className="px-5 py-2 rounded-2xl bg-synk-blue/10 text-synk-blue font-bold text-xl uppercase">
                  {parseResult(result).material}
                </div>
              </div>

              <div className="bg-synk-blue/5 p-6 rounded-3xl text-synk-blue font-bold text-center italic text-xl">
                "이 화면을 문질러 소재의 촉감을 느껴보세요"
              </div>

              {/* 간단 버전 */}
              <div className="space-y-4">
                <div className="inline-block px-4 py-1 rounded-full bg-synk-navy text-white text-base font-bold tracking-widest uppercase">[간단 버전]</div>
                <p className="text-4xl leading-tight font-black text-synk-navy tracking-tight">
                  {parseResult(result).simple}
                </p>
              </div>

              {/* 상세 버전 */}
              <div className="space-y-6 pt-10 border-t-4 border-synk-blue/10">
                <div className="inline-block px-4 py-1 rounded-full bg-synk-blue text-white text-base font-bold tracking-widest uppercase">[상세 버전]</div>
                <div className="space-y-10">
                  {parseResult(result).detailed.split('\n').filter(line => line.trim()).map((line, idx) => {
                    // Check if the line is a label line like "- 색상: ..."
                    const match = line.match(/^[-*]?\s*(.*?):\s*(.*)$/);
                    if (match) {
                      const [, label, content] = match;
                      return (
                        <div key={idx} className="flex flex-col gap-3">
                          <span className="text-synk-blue font-black text-3xl tracking-tighter decoration-synk-blue/30">{label.trim()}</span>
                          <p className="text-2xl leading-relaxed font-bold text-synk-navy/80">{content.trim()}</p>
                        </div>
                      );
                    }
                    return (
                      <p key={idx} className="text-2xl leading-relaxed font-medium text-synk-navy/80">{line.trim()}</p>
                    );
                  })}
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-4 mt-8">
                <AccessibleButton 
                   label="옷장에 저장"
                   hint="나중에 코디할 수 있습니다"
                   variant="primary"
                   icon={<Save className="w-10 h-10" />}
                   onClick={saveToCloset}
                   className="h-24 text-2xl"
                />
                <AccessibleButton 
                   label="다시 촬영"
                   variant="ghost"
                   className="h-24 text-2xl border-2 border-synk-navy/5"
                   icon={<RefreshCw className="w-10 h-10" />}
                   onClick={() => {
                     setResult(null);
                     speechService.speak('다시 촬영을 시작합니다.');
                   }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <div className="p-8 bg-white border-t-2 border-synk-offwhite">
        {!result && (
          <AccessibleButton
            label={isAnalyzing ? '분석 중...' : '이미지 분석'}
            hint="화면 정중앙을 분석합니다"
            variant="primary"
            icon={<Camera className="w-12 h-12" />}
            onClick={captureAndAnalyze}
            className="h-32 text-3xl font-black"
          />
        )}
      </div>
    </div>
  );
};
