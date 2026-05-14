import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { speechService } from '../lib/speech';
import { hapticService, HapticPattern } from '../lib/haptics';
import { AppScreen, UserProfile } from '../types';
import { AccessibleButton } from './AccessibleButton';
import { Camera, X, RefreshCw, Info, Save } from 'lucide-react';
import { db, auth, OperationType, handleFirestoreError } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

import { GoogleGenAI } from '@google/genai';
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

  const captureAndAnalyze = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setIsAnalyzing(true);
    hapticService.tap();
    speechService.speak('이미지를 분석하고 있습니다. 잠시만 기다려주세요.');

    const context = canvasRef.current.getContext('2d');
    if (context && videoRef.current) {
      context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
      const imageData = canvasRef.current.toDataURL('image/jpeg');
      
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: {
            parts: [
              { text: `이 이미지는 사용자가 입으려는 옷이나 패션 아이템입니다. 
                 시각장애인 사용자를 위해 다음 형식에 맞추어 한국어로 친절하고 명확하게 설명해주세요.

                 1. [간단 버전]: 한두 줄 내외의 짧은 문장으로 핵심만 요약합니다. 옷의 대표 색상과 가장 어울리는 핵심 상황만 포함합니다.
                 2. [상세 버전]: 3~4문장으로 풍부하게 설명합니다. 
                    - 색상: 색이 주는 느낌과 분위기를 감성적으로 묘사하세요. (예: "신뢰감을 주면서도 열정적인 진한 버건디색")
                    - 재질: 손끝의 감각을 자극하는 형용사를 사용하여 촉감 중심으로 설명하세요. (예: "매끄러운 실크", "포근한 울")
                    - 추천 상황: 이 옷이 어떤 자리에서 사용자를 돋보이게 할지 구체적인 장소나 목적(TPO)을 제안하세요.

                 중요: 
                 - 답변 마지막에 반드시 [MATERIAL:소재명] 형식으로 소재 정보를 포함해주세요. 
                 - 소재명은 다음 중 하나여야 합니다: silk, knit, denim, leather, fur, cotton, linen.
                 - 모든 설명은 TTS(음성 출력)를 고려하여 문장 끝맺음을 확실히 하세요.

                 출력 형식:
                 [간단 버전]
                 (요약 내용)

                 [상세 버전]
                 - 색상: (설명)
                 - 재질: (설명)
                 - 추천 상황: (설명)

                 [MATERIAL:소재명]` },
              {
                inlineData: {
                  mimeType: "image/jpeg",
                  data: imageData.split(',')[1]
                }
              }
            ]
          }
        });

        const analysisText = response.text;
        
        if (!analysisText) throw new Error('Empty analysis result');

        setResult(analysisText);
        
        // Clean speech text
        const speechText = analysisText.replace(/\[MATERIAL:.*?\]/, '').trim();
        speechService.speak(speechText);
        hapticService.success();
      } catch (err) {
        console.error(err);
        const errorMessage = err instanceof Error ? err.message : '분석 중 오류가 발생했습니다.';
        speechService.speak(errorMessage + ' 다시 시도해주세요.');
      } finally {
        setIsAnalyzing(false);
      }
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
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center text-synk-navy gap-6 z-30">
            <RefreshCw className="w-24 h-24 animate-spin text-synk-blue" />
            <p className="text-3xl font-black tracking-tighter">감각 번역 중...</p>
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
