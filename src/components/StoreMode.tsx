import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { speechService } from '../lib/speech';
import { hapticService } from '../lib/haptics';
import { AppScreen } from '../types';
import { AccessibleButton } from './AccessibleButton';
import { QrCode, X, RefreshCw, Zap } from 'lucide-react';

interface StoreModeProps {
  onNavigate: (screen: AppScreen) => void;
}

export const StoreMode: React.FC<StoreModeProps> = ({ onNavigate }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isScanning, setIsScanning] = useState(false);
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
      speechService.speak('매장 모드입니다. QR 코드나 바코드를 화면에 비춰주세요.');
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

  const simulateScan = () => {
    setIsScanning(true);
    hapticService.vibrate([100, 50, 100]);
    speechService.speak('QR 코드를 스캔하고 있습니다.');
    
    setTimeout(() => {
      setIsScanning(false);
      hapticService.success();
      speechService.speak('스캔 완료. 이 제품은 이번 시즌 한정판 린넨 셔츠입니다. 가격은 5만 9천원이며, 현재 매장에 미디움 사이즈 2벌이 남아있습니다.');
    }, 2000);
  };

  return (
    <div className="h-full relative bg-white flex flex-col pt-24">
      <div className="absolute top-6 left-6 right-6 z-20 flex justify-between">
        <button 
          onClick={() => onNavigate(AppScreen.HOME)}
          className="p-5 rounded-3xl bg-synk-offwhite text-synk-navy border border-synk-navy/5 active:scale-95 transition-all"
        >
          <X className="w-10 h-10" />
        </button>
      </div>

      <div className="flex-1 w-full bg-white relative overflow-hidden flex items-center justify-center">
        <video 
          ref={videoRef}
          autoPlay 
          playsInline 
          className="w-full h-full object-cover grayscale opacity-40"
        />
        
        {/* QR Scanner Frame */}
        <div className="absolute w-80 h-80 border-8 border-synk-blue/40 rounded-[3rem] flex items-center justify-center p-8">
          <div className="w-full h-full border-4 border-synk-blue border-dashed rounded-[2rem] flex items-center justify-center bg-synk-blue/5">
            <Zap className="w-20 h-20 text-synk-blue animate-pulse" />
          </div>
          <div className="w-full h-2 bg-synk-blue absolute top-1/2 left-0 shadow-[0_0_20px_rgba(0,82,255,0.5)] animate-scan-line" />
        </div>

        {isScanning && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center text-synk-navy gap-6 z-30">
            <RefreshCw className="w-24 h-24 animate-spin text-synk-blue" />
            <p className="text-3xl font-black tracking-tighter">코드 해독 중...</p>
          </div>
        )}
      </div>

      <div className="p-8 bg-white border-t-2 border-synk-offwhite">
        <AccessibleButton
          label={isScanning ? '스캔 중' : 'QR 스캔하기'}
          hint="화면 중앙의 사각형에 코드를 맞추세요"
          variant="primary"
          icon={<QrCode className="w-12 h-12" />}
          onClick={simulateScan}
          className="h-32 text-2xl font-black"
        />
      </div>
    </div>
  );
};
