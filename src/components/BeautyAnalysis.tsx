import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { speechService } from '../lib/speech';
import { hapticService } from '../lib/haptics';
import { AppScreen } from '../types';
import { AccessibleButton } from './AccessibleButton';
import { Sparkles, X, RefreshCw, User, CheckCircle2 } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

interface BeautyAnalysisProps {
  onNavigate: (screen: AppScreen) => void;
}

export const BeautyAnalysis: React.FC<BeautyAnalysisProps> = ({ onNavigate }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' } // Selfie camera for beauty
      });
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setStream(mediaStream);
      speechService.speak('뷰티분석 모드입니다. 전면 카메라를 활성화했습니다. 얼굴을 화면 중앙에 맞추고 분석 버튼을 누르세요.');
    } catch (err) {
      console.error(err);
      speechService.speak('카메라를 시작할 수 없습니다.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  };

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
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: [
            {
              parts: [
                { text: `사용자의 얼굴 이미지를 분석하여 메이크업 가이드를 제공하세요.
                  1. 메이크업의 대칭성 (아이라인 길이 차이, 눈썹 높이 차이 등)을 mm 단위로 추정하여 설명하세요.
                  2. 현재 얼굴에서 강조된 부분과 보완하면 좋을 부분을 설명하세요.
                  3. 시각장애인 사용자를 위해 구체적인 위치 가이드 (예: 왼쪽 눈썹 2mm 아래부터 시작하세요)를 제공하세요.
                  구체적이고 친절한 한국어로 응답하세요.` },
                { inlineData: { mimeType: 'image/jpeg', data: imageData.split(',')[1] } }
              ]
            }
          ]
        });

        const analysisText = response.text;
        setResult(analysisText);
        speechService.speak(analysisText);
        hapticService.success();
      } catch (err) {
        console.error(err);
        speechService.speak('뷰티 분석 중 오류가 발생했습니다.');
      } finally {
        setIsAnalyzing(false);
      }
    }
  };

  return (
    <div className="h-full relative bg-synk-offwhite flex flex-col">
      <div className="absolute top-6 left-6 right-6 z-10 flex justify-between">
        <button 
          onClick={() => onNavigate(AppScreen.HOME)}
          className="p-5 rounded-full bg-white/50 backdrop-blur-md text-synk-navy border border-synk-navy/10"
          aria-label="닫기"
        >
          <X className="w-10 h-10" />
        </button>
      </div>

      <div className="flex-1 w-full relative overflow-hidden flex items-center justify-center">
        <video 
          ref={videoRef}
          autoPlay 
          playsInline 
          className="w-full h-full object-cover scale-x-[-1]" // Mirror for selfie
        />
        <canvas ref={canvasRef} className="hidden" width={640} height={480} />
        
        {/* Face Guide Overlay */}
        <div className="absolute inset-0 border-[40px] border-black/10 pointer-events-none">
          <div className="w-full h-full border-4 border-synk-blue/40 rounded-[100px] flex items-center justify-center">
             <div className="w-1 h-20 bg-synk-blue/20 absolute" />
             <div className="w-20 h-1 bg-synk-blue/20 absolute" />
          </div>
        </div>

        {isAnalyzing && (
          <div className="absolute inset-0 bg-white/60 flex flex-col items-center justify-center text-synk-navy gap-6">
            <RefreshCw className="w-24 h-24 animate-spin text-synk-blue" />
            <p className="text-3xl font-bold">얼굴 좌표 읽는 중...</p>
          </div>
        )}

        {result && (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute inset-x-6 bottom-32 bg-white/95 backdrop-blur-md rounded-[40px] p-8 shadow-2xl text-synk-navy flex flex-col gap-6 border border-synk-navy/5"
          >
            <div className="flex items-center gap-4 text-synk-blue font-bold text-2xl">
              <CheckCircle2 className="w-10 h-10" />
              분석 완료
            </div>
            <p className="text-xl leading-snug max-h-60 overflow-y-auto">{result}</p>
            <AccessibleButton 
               label="다시 분석" 
               variant="ghost" 
               className="py-4"
               onClick={() => setResult(null)} 
            />
          </motion.div>
        )}
      </div>

      <div className="p-8 bg-synk-offwhite border-t border-synk-navy/5">
        {!result && (
          <AccessibleButton
            label={isAnalyzing ? '분석 중...' : '메이크업 대칭 분석'}
            hint="얼굴 전체를 분석합니다"
            icon={<User className="w-12 h-12" />}
            onClick={analyzeBeauty}
            className="h-32 bg-synk-blue text-synk-navy"
          />
        )}
      </div>
    </div>
  );
};
