import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { speechService } from '../lib/speech';
import { hapticService } from '../lib/haptics';
import { AppScreen } from '../types';
import { AccessibleButton } from './AccessibleButton';
import { QrCode, X, RefreshCw, Zap } from 'lucide-react';

import { cameraManager } from '../lib/camera';

interface StoreModeProps {
  onNavigate: (screen: AppScreen) => void;
}

export const StoreMode: React.FC<StoreModeProps> = ({ onNavigate }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isScanning, setIsScanning] = useState(false);
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
            facingMode: 'environment',
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
        speechService.speak('매장용 카메라가 활성화되었습니다.');
      } catch (err: any) {
        console.error('Store Camera access error:', err);
        if (isMounted) {
          setCameraError('카메라를 시작할 수 없습니다.');
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
        {!stream && !cameraError && (
          <div className="flex flex-col items-center gap-6 animate-pulse">
            <RefreshCw className="w-16 h-16 text-synk-blue animate-spin" />
            <p className="text-xl font-bold text-synk-navy/40">카메라 불러오는 중...</p>
          </div>
        )}

        {cameraError && (
          <div className="p-12 text-center space-y-6 z-20">
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
          className={`w-full h-full object-cover grayscale ${!stream ? 'hidden' : 'opacity-40'}`}
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
