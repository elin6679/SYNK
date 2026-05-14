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
          speechService.speak('스캔용 카메라 하드웨어 준비 중입니다. 시뮬레이션 모드를 시작합니다.');
        } else {
          speechService.speak('매장용 카메라가 활성화되었습니다.');
        }
      } catch (err: any) {
        console.error('Store Camera access error:', err);
        if (isMounted) {
          if (err.name === 'NotAllowedError') {
            const msg = '스캔용 카메라 권한이 거부되었습니다. 설정에서 허용해주세요.';
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

  const simulateScan = () => {
    setIsScanning(true);
    hapticService.vibrate([100, 50, 100]);
    speechService.speak('QR 코드를 스캔하고 있습니다.');
    
    setTimeout(() => {
      setIsScanning(false);
      hapticService.success();
      
      const mockProducts = [
        '스캔 완료. 이 제품은 이번 시즌 한정판 린넨 셔츠입니다. 가격은 5만 9천원이며, 현재 매장에 미디움 사이즈 2벌이 남아있습니다.',
        '스캔 성공. 고급스러운 캐시미어 혼방 머플러입니다. 현재 30퍼센트 할인 행사 중이며, 가격은 12만 8천원입니다. 베이지와 그레이 색상이 인기입니다.',
        '스캔 완료. 방수 기능이 탁월한 고어텍스 바람막이 점퍼입니다. 가격은 24만 5천원입니다. 아웃도어 활동에 최적화된 상품입니다.',
        '스캔 완료. 부드러운 가죽 재질의 첼시 부츠입니다. 가격은 18만 9천원입니다. 발볼이 넓게 제작되어 시각장애인 분들도 편안하게 착용하실 수 있습니다.'
      ];

      const randomIndex = Math.floor(Math.random() * mockProducts.length);
      speechService.speak(mockProducts[randomIndex]);
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

        {isSimulated && (
          <div className="absolute inset-0 bg-synk-navy/90 flex flex-col items-center justify-center gap-8 overflow-hidden">
            <div className="w-full h-full opacity-10 relative">
               <div className="w-full h-full bg-[radial-gradient(circle,rgba(255,255,255,0.4)_1px,transparent_1px)] bg-[length:30px_30px]" />
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-white/30">
               <QrCode className="w-40 h-40 stroke-[0.5px] animate-pulse" />
               <p className="text-2xl font-black tracking-[0.3em] uppercase">Scanner Sim</p>
            </div>
          </div>
        )}

        <video 
          ref={videoRef}
          autoPlay 
          playsInline 
          muted
          className={`w-full h-full object-cover grayscale ${(isSimulated || !stream) ? 'hidden' : 'opacity-40'}`}
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
