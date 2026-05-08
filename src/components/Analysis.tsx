import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { speechService } from '../lib/speech';
import { hapticService } from '../lib/haptics';
import { AppScreen } from '../types';
import { AccessibleButton } from './AccessibleButton';
import { Camera, X, RefreshCw, Info, Save } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { db, auth, OperationType, handleFirestoreError } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

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

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setStream(mediaStream);
      speechService.speak('카메라를 활성화했습니다. 분석할 물체를 화면 중앙에 두고 화면 아래의 분석 버튼을 누르세요.');
    } catch (err) {
      console.error(err);
      speechService.speak('카메라를 시작할 수 없습니다. 권한을 확인해주세요.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const captureAndAnalyze = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setIsAnalyzing(true);
    hapticService.tap();
    speechService.speak('이미지를 분석하고 있습니다. 잠시만 기다려주세요.');

    const context = canvasRef.current.getContext('2d');
    if (context) {
      context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
      const imageData = canvasRef.current.toDataURL('image/jpeg');
      
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
        
        const isDetailed = profile?.settings.detailMode === 'detailed';
        const prompt = isDetailed 
          ? `이 이미지는 사용자가 입으려는 옷이나 패션 아이템입니다. 
             시각장애인 사용자를 위해 아주 상세하고 구체적으로, 감성적인 묘사를 곁들여서 설명해주세요.
             색상이 실제와 정확하지 않아도 되니, 그 색상이 주는 '느낌'과 '상황(TPO)'을 연결해서 아주 풍부하게 설명해주세요.
             예를 들어 "신뢰감을 주는 레드입니다. 이 색상은 중요한 면접이나 자신을 돋보여야 하는 자리에서 침착하면서도 열정적인 존재감을 보여줄 수 있을 것 같습니다. 소재는 부드러운 실크 느낌이며, 전체적으로 우아한 분위기를 풍깁니다."와 같이 아주 길고 자세하게 설명하세요.
             질감, 스타일, 어울리는 장소 등을 모두 포함해 5문장 이상의 긴 설명을 제공하세요. 한국어로 따뜻하고 상세하게 대답하세요.`
          : `이 이미지는 사용자가 입으려는 옷입니다. 시각장애인 사용자를 위해 핵심적인 종류와 색상만 딱 2문장으로 아주 짧게 명확하게 설명해주세요. 
             예: "신뢰감을 주는 레드 셔츠입니다. 면접과 같은 중요한 자리에 잘 어울리는 스타일입니다."와 같이 핵심만 말하세요.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: {
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: imageData.split(',')[1]
                }
              }
            ]
          }
        });

        const analysisText = response.response?.text() || response.text || '';
        if (!analysisText) throw new Error('Empty analysis result');

        setResult(analysisText);
        speechService.speak(analysisText);
        hapticService.success();
      } catch (err) {
        console.error(err);
        speechService.speak('분석 중 오류가 발생했습니다. 다시 시도해주세요.');
      } finally {
        setIsAnalyzing(false);
      }
    }
  };

  // Rubbing screen interaction (Mock)
  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!result) return;
    // Debounce or rate-limit for actual implementation
    // For now, simulate texture haptics based on movement speed or position
    hapticService.texture(Math.random() > 0.7);
  };

  const saveToCloset = async () => {
    if (!result || !auth.currentUser) {
      if (!auth.currentUser) speechService.speak('로그인이 필요한 기능입니다.');
      return;
    }

    const path = `users/${auth.currentUser.uid}/closet`;
    try {
      hapticService.tap();
      await addDoc(collection(db, path), {
        name: '분석된 의류',
        category: '패션',
        color: '분석됨',
        texture: '분석됨',
        description: result,
        ownerId: auth.currentUser.uid,
        createdAt: Date.now()
      });
      hapticService.success();
      speechService.speak('옷장에 저장되었습니다.');
      onNavigate(AppScreen.CLOSET);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  return (
    <div className="h-full relative bg-black flex flex-col">
      <div className="absolute top-6 left-6 right-6 z-10 flex justify-between">
        <button 
          onClick={() => onNavigate(AppScreen.HOME)}
          className="p-5 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/30"
          aria-label="닫기"
        >
          <X className="w-10 h-10" />
        </button>
        <div className="p-5 rounded-full bg-synk-blue text-white shadow-lg animate-pulse">
            <Info className="w-10 h-10" />
        </div>
      </div>

      <div 
        className="flex-1 w-full bg-synk-offwhite relative overflow-hidden"
        onTouchMove={handleTouchMove}
        onMouseMove={handleTouchMove}
      >
        <video 
          ref={videoRef}
          autoPlay 
          playsInline 
          className="w-full h-full object-cover"
        />
        <canvas ref={canvasRef} className="hidden" width={640} height={480} />
        
        {isAnalyzing && (
          <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white gap-6">
            <RefreshCw className="w-20 h-20 animate-spin text-synk-cyan" />
            <p className="text-2xl font-bold">감각 번역 중...</p>
          </div>
        )}

        {result && (
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            className="absolute inset-0 bg-synk-offwhite/98 p-12 overflow-y-auto text-synk-navy"
          >
            <div className="flex flex-col gap-8 pb-32">
              <h2 className="text-4xl font-bold border-b border-synk-navy/20 pb-4">분석 결과</h2>
              <p className="text-2xl leading-relaxed opacity-90">{result}</p>
              
              <div className="grid grid-cols-1 gap-4 mt-8">
                <AccessibleButton 
                   label="옷장에 저장"
                   hint="나중에 코디할 수 있습니다"
                   variant="secondary"
                   icon={<Save className="w-8 h-8" />}
                   onClick={saveToCloset}
                />
                <AccessibleButton 
                   label="다시 촬영"
                   variant="ghost"
                   className="border-synk-navy/30"
                   icon={<RefreshCw className="w-8 h-8" />}
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

      <div className="p-8 bg-synk-offwhite border-t border-synk-navy/5">
        {!result && (
          <AccessibleButton
            label={isAnalyzing ? '분석 중...' : '이미지 분석'}
            hint="화면 정중앙을 분석합니다"
            icon={<Camera className="w-12 h-12" />}
            onClick={captureAndAnalyze}
            className="h-32 bg-synk-cyan text-synk-navy"
          />
        )}
      </div>
    </div>
  );
};
