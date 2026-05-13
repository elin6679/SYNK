import React, { useState, useEffect, useRef } from 'react';
import { ClothingItem, AppScreen } from '../types';
import { AccessibleButton } from './AccessibleButton';
import { speechService } from '../lib/speech';
import { hapticService, HapticPattern } from '../lib/haptics';
import { Shirt, ChevronLeft, Plus, Trash2, Camera, X, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ClosetProps {
  onNavigate: (screen: AppScreen) => void;
}

const MATERIAL_MAP = {
  silk: { label: '실크', pattern: HapticPattern.SILK },
  knit: { label: '니트', pattern: HapticPattern.KNIT },
  denim: { label: '데님', pattern: HapticPattern.DENIM },
  leather: { label: '가죽', pattern: HapticPattern.LEATHER },
  fur: { label: '퍼/털', pattern: HapticPattern.FUR },
  cotton: { label: '면', pattern: HapticPattern.COTTON },
  linen: { label: '린넨', pattern: HapticPattern.LINEN },
};

export const Closet: React.FC<ClosetProps> = ({ onNavigate }) => {
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ClothingItem | null>(null);
  const [newItem, setNewItem] = useState<Partial<ClothingItem>>({
    material: 'cotton',
    name: '',
    description: '',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('synk_touch_closet');
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load closet', e);
      }
    }
  }, []);

  const saveToStorage = (newItems: ClothingItem[]) => {
    localStorage.setItem('synk_touch_closet', JSON.stringify(newItems));
    setItems(newItems);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewItem(prev => ({ ...prev, imageUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const addItem = () => {
    if (!newItem.name || !newItem.imageUrl) {
      speechService.speak('이름과 사진을 입력해주세요.');
      return;
    }
    const item: ClothingItem = {
      id: Date.now().toString(),
      name: newItem.name,
      description: newItem.description || '',
      material: newItem.material as any,
      imageUrl: newItem.imageUrl,
      category: 'Top', // default
      color: 'Default',
      texture: 'Default',
      createdAt: Date.now(),
    };
    const updated = [item, ...items];
    saveToStorage(updated);
    setIsUploading(false);
    setNewItem({ material: 'cotton', name: '', description: '' });
    speechService.speak(`${item.name}이 옷장에 저장되었습니다.`);
  };

  const deleteItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = items.filter(i => i.id !== id);
    saveToStorage(updated);
    speechService.speak('삭제되었습니다.');
  };

  const handlePointerMove = (item: ClothingItem) => {
    if (item.material && MATERIAL_MAP[item.material]) {
      hapticService.vibrate(MATERIAL_MAP[item.material].pattern);
    }
  };

  const hapticSupported = hapticService.isSupported();

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden">
      <header className="px-6 py-8 pb-4 flex items-center justify-between text-synk-navy bg-white/80 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => onNavigate(AppScreen.HOME)}
            className="p-4 rounded-3xl bg-synk-offwhite text-synk-navy hover:bg-synk-blue/10 active:scale-95 transition-all"
            aria-label="홈으로 가기"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
          <h1 className="text-4xl font-display font-black tracking-tighter uppercase leading-none">Touch Closet</h1>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => onNavigate(AppScreen.ANALYSIS)}
            className="p-4 rounded-3xl bg-synk-cyan text-white shadow-xl shadow-synk-cyan/20 active:scale-95 transition-all"
            aria-label="AI 카메라 분석"
          >
            <Camera className="w-8 h-8" />
          </button>
          <button 
            onClick={() => setIsUploading(true)}
            className="p-4 rounded-3xl bg-synk-blue text-white shadow-xl shadow-synk-blue/20 active:scale-95 transition-all"
            aria-label="옷 수동 추가"
          >
            <Plus className="w-8 h-8" />
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-6 pb-40 custom-scrollbar">
        <div className="mb-8 p-4 bg-synk-offwhite rounded-3xl space-y-3">
          <p className="text-sm font-bold text-synk-navy leading-relaxed">
            "Touch Closet은 옷의 사진과 소재 정보를 저장하고, 사진 위를 손가락으로 문질러 소재별 햅틱 패턴을 체험할 수 있는 패션 보조 기능입니다."
          </p>
          <div className="flex items-start gap-2 opacity-60">
            <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <p className="text-[10px] font-medium leading-normal">
              본 프로토타입은 실제 촉감을 완전히 재현하는 것이 아니라, 소재 정보를 진동 패턴으로 보조 전달하는 실험용 기능입니다. 기기와 브라우저에 따라 햅틱 기능이 작동하지 않을 수 있습니다. Android 모바일 브라우저에 최적화되어 있으며, iPhone/Safari에서는 햅틱 기능이 제한될 수 있습니다.
            </p>
          </div>
          {!hapticSupported && (
            <div className="bg-red-50 text-red-500 text-[10px] p-2 rounded-xl font-bold flex items-center gap-2">
              <X className="w-3 h-3" />
              이 기기/브라우저에서는 햅틱 기능을 지원하지 않습니다.
            </div>
          )}
        </div>

        {items.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-synk-grey/40 text-center gap-6">
            <Shirt className="w-24 h-24" />
            <p className="text-xl font-bold">옷장이 비어 있습니다.<br/>상단 + 버튼으로 옷을 추가해보세요.</p>
          </div>
        ) : (
          <div className="columns-2 gap-4 space-y-4">
            {items.map((item) => (
              <motion.div 
                key={item.id}
                layoutId={item.id}
                onClick={() => setSelectedItem(item)}
                className="break-inside-avoid bg-white rounded-3xl overflow-hidden shadow-md border border-synk-navy/5 relative group active:scale-95 transition-transform"
              >
                <img src={item.imageUrl} alt={item.description} className="w-full h-auto object-cover" />
                <div className="p-3 bg-white">
                  <h3 className="font-black text-sm text-synk-navy truncate">{item.name}</h3>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] font-black text-synk-blue bg-synk-blue/5 px-2 py-0.5 rounded-full uppercase">
                      {item.material ? MATERIAL_MAP[item.material].label : 'Unknown'}
                    </span>
                    <button 
                      onClick={(e) => deleteItem(item.id, e)}
                      className="p-1.5 text-synk-grey hover:text-red-500 transition-colors"
                      aria-label="삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <AnimatePresence>
        {isUploading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-synk-navy/80 backdrop-blur-sm p-6 flex items-center justify-center"
          >
            <motion.div 
              initial={{ y: 50, scale: 0.9 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 50, scale: 0.9 }}
              className="bg-white w-full max-w-md rounded-[3rem] p-8 space-y-6 overflow-y-auto max-h-[90vh] custom-scrollbar"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-synk-navy">새 옷 추가</h2>
                <button onClick={() => setIsUploading(false)} className="p-2 bg-synk-offwhite rounded-full text-synk-grey">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div 
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square bg-synk-offwhite rounded-[2rem] border-4 border-dashed border-synk-navy/10 flex flex-col items-center justify-center gap-4 cursor-pointer overflow-hidden relative"
              >
                {newItem.imageUrl ? (
                  <>
                    <img src={newItem.imageUrl} className="w-full h-full object-cover" alt="Preview" />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center text-white font-bold backdrop-blur-[2px]">
                      사진 변경
                    </div>
                  </>
                ) : (
                  <>
                    <Camera className="w-12 h-12 text-synk-grey" />
                    <span className="font-bold text-synk-grey">사진 선택</span>
                  </>
                )}
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
              </div>

              <div className="space-y-4">
                <input 
                  type="text" 
                  placeholder="옷 이름 (예: 빈티지 데님 자켓)" 
                  value={newItem.name}
                  onChange={e => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full h-14 px-6 bg-synk-offwhite rounded-2xl font-bold border-2 border-transparent focus:border-synk-blue outline-none transition-all"
                  aria-label="옷 이름"
                />
                <textarea 
                  placeholder="설명 (예: 가볍고 통기성이 좋은 린넨 소재의 셔츠입니다.)" 
                  value={newItem.description}
                  onChange={e => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full h-32 p-6 bg-synk-offwhite rounded-2xl font-bold border-2 border-transparent focus:border-synk-blue outline-none transition-all resize-none"
                  aria-label="옷 설명"
                />
                
                <div className="space-y-2">
                  <label className="text-xs font-black text-synk-grey uppercase px-2">소재 선택</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.keys(MATERIAL_MAP) as Array<keyof typeof MATERIAL_MAP>).map(key => (
                      <button
                        key={key}
                        onClick={() => setNewItem(prev => ({ ...prev, material: key }))}
                        className={`h-12 rounded-xl font-bold text-sm border-2 transition-all ${
                          newItem.material === key 
                            ? 'bg-synk-blue text-white border-synk-blue shadow-lg shadow-synk-blue/20' 
                            : 'bg-synk-offwhite text-synk-navy border-transparent'
                        }`}
                      >
                        {MATERIAL_MAP[key].label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <AccessibleButton 
                label="옷장에 저장하기"
                variant="primary"
                onClick={addItem}
                className="h-16 text-lg font-black"
                aria-label="저장하기"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-white p-6 flex flex-col"
          >
            <header className="flex items-center justify-between mb-8">
              <button 
                onClick={() => setSelectedItem(null)}
                className="p-4 rounded-3xl bg-synk-offwhite text-synk-navy active:scale-95 transition-all"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
              <h2 className="text-xl font-black text-synk-navy uppercase tracking-tighter">Item Detail</h2>
              <div className="w-16" />
            </header>

            <div className="flex-1 flex flex-col gap-8 overflow-y-auto custom-scrollbar">
              <div className="relative group aspect-[3/4] max-h-[50vh] w-full bg-synk-offwhite rounded-[3rem] overflow-hidden shadow-2xl">
                <motion.img 
                  layoutId={selectedItem.id}
                  src={selectedItem.imageUrl} 
                  alt={selectedItem.description}
                  className="w-full h-full object-cover select-none pointer-events-none"
                />
                
                {/* Haptic Interaction Zone */}
                <div 
                  className="absolute inset-0 cursor-crosshair touch-none"
                  onPointerDown={() => hapticService.tap()}
                  onPointerMove={() => handlePointerMove(selectedItem)}
                  onPointerUp={() => hapticService.stop()}
                  onPointerLeave={() => hapticService.stop()}
                >
                  <div className="absolute inset-0 bg-synk-blue/5 opacity-0 group-active:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="bg-white/20 backdrop-blur-md rounded-full p-8 border border-white/30">
                      <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6 px-2">
                <div className="text-center space-y-2">
                  <p className="text-synk-blue font-black uppercase text-xs tracking-[0.3em]">Haptic Touch Experience</p>
                  <p className="text-lg font-bold text-synk-navy/60 italic">"사진 위를 손가락으로 문질러 소재 햅틱을 느껴보세요."</p>
                </div>

                <div className="bg-synk-offwhite rounded-[2.5rem] p-8 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-3xl font-black text-synk-navy leading-none">{selectedItem.name}</h3>
                    <span className="px-4 py-1.5 bg-synk-blue text-white rounded-full text-xs font-black uppercase tracking-widest">
                      {selectedItem.material ? MATERIAL_MAP[selectedItem.material].label : 'Unknown'}
                    </span>
                  </div>
                  <p className="text-lg font-medium text-synk-navy/70 leading-relaxed">
                    {selectedItem.description}
                  </p>
                </div>

                <div className="p-6 bg-synk-blue/5 rounded-3xl flex items-start gap-4">
                  <div className="w-12 h-12 bg-synk-blue rounded-2xl flex items-center justify-center text-white flex-shrink-0">
                    <Info className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-bold text-synk-navy/60 leading-normal">
                    {selectedItem.material === 'silk' && '실크: 아주 짧고 부드러운 느낌'}
                    {selectedItem.material === 'knit' && '니트: 작은 울림이 반복되는 느낌'}
                    {selectedItem.material === 'denim' && '데님: 단단하고 짧게 묵직한 느낌'}
                    {selectedItem.material === 'leather' && '가죽: 무게감 있는 두 번의 진동'}
                    {selectedItem.material === 'fur' && '퍼/털: 가볍고 빠르게 여러 번 스치는 느낌'}
                    {selectedItem.material === 'cotton' && '면: 자연스럽고 짧은 기본 진동'}
                    {selectedItem.material === 'linen' && '린넨: 가볍지만 살짝 거친 느낌'}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
