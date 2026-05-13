import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { speechService } from '../lib/speech';
import { hapticService } from '../lib/haptics';
import { AppScreen, UserProfile } from '../types';
import { AccessibleButton } from './AccessibleButton';
import { RefreshCw, User, CheckCircle2, X } from 'lucide-react';

import { GoogleGenAI } from '@google/genai';
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

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          try { await videoRef.current.play(); } catch (e) {}
        }
        setStream(mediaStream);
        speechService.speak('뷰티 카메라가 활성화되었습니다.');
      } catch (err: any) {
        console.error('Beauty Camera access error:', err);
        if (isMounted) {
          if (err.name === 'NotAllowedError') {
            setCameraError('카메라 권한이 거부되었습니다.');
          } else {
            setCameraError('카메라를 시작할 수 없습니다.');
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
    hapticService.tap();
    speechService.speak('얼굴 대칭과 메이크업을 분석하고 있습니다.');

    const context = canvasRef.current.getContext('2d');
    if (context) {
      context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
      const imageData = canvasRef.current.toDataURL('image/jpeg');
      
      try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
          throw new Error('GEMINI_API_KEY is not configured.');
        }

        const ai = new GoogleGenAI({ apiKey });
        const prompt = profile?.settings.detailMode === 'detailed'
          ? `사용자의 얼굴 이미지를 분석하여 메이크업 가이드를 제공하세요.
             1. 메이크업의 대칭성과 상태를 분석하여 아주 구체적이고 풍부하게 설명해주세요.
             2. 특히 위치 가이드를 줄 때, "오른쪽 아이라인이 왼쪽보다 약 2mm 더 길게 그려졌습니다. 끝부분을 살짝 지우거나 왼쪽을 조금 더 채우면 더 완벽해질 것 같아요"와 같이 mm 단위로 비유하여 상세하게 설명하세요.
             3. 전체적인 분위기가 주는 신뢰감이나 느낌을 아주 감성적으로 묘사하세요. 
             5문장 이상의 긴 설명으로 친절하게 안내하세요. 한국어로 상세하게 답변하세요.`
          : `사용자의 얼굴 이미지를 분석하여 메이크업 가이드를 제공하세요. 
             전체적인 대칭성과 가장 중요한 보완점 딱 한 가지만 2문장으로 아주 짧고 명확하게 설명해주세요. 
             예: "오른쪽 눈썹이 왼쪽보다 약간 높게 그려졌습니다. 전체적으로 깔끔하고 신뢰감을 주는 분위기입니다."와 같이 핵심만 말하세요.`;

        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: {
            parts: [
              { text: prompt },
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
        speechService.speak(analysisText);
        hapticService.success();
      } catch (err) {
        console.error(err);
        const errorMessage = err instanceof Error ? err.message : '뷰티 분석 중 오류가 발생했습니다.';
        speechService.speak(errorMessage + ' 다시 시도해주세요.');
      } finally {
        setIsAnalyzing(false);
      }
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

        <video 
          ref={videoRef}
          autoPlay 
          playsInline 
          muted
          className={`w-full h-full object-cover scale-x-[-1] ${!stream ? 'hidden' : 'block'}`} // Mirror for selfie
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
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center text-synk-navy gap-6 z-30">
            <RefreshCw className="w-24 h-24 animate-spin text-synk-blue" />
            <p className="text-3xl font-black tracking-tighter">얼굴 좌표 읽는 중...</p>
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
