import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db, auth, OperationType, handleFirestoreError } from '../lib/firebase';
import { ClothingItem, AppScreen } from '../types';
import { AccessibleButton } from './AccessibleButton';
import { speechService } from '../lib/speech';
import { Shirt, ChevronLeft, Plus, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';

interface ClosetProps {
  onNavigate: (screen: AppScreen) => void;
}

export const Closet: React.FC<ClosetProps> = ({ onNavigate }) => {
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }

    const path = `users/${auth.currentUser.uid}/closet`;
    try {
      const q = query(collection(db, path), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClothingItem));
      setItems(fetched);
      speechService.speak(`${fetched.length}개의 옷이 옷장에 있습니다.`);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <header className="p-8 pb-4 flex items-center gap-6 text-synk-navy">
        <button 
          onClick={() => onNavigate(AppScreen.HOME)}
          className="p-4 rounded-3xl bg-synk-offwhite text-synk-navy hover:bg-synk-blue/10 active:scale-95 transition-all"
          aria-label="뒤로 가기"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>
        <h1 className="text-4xl font-display font-black tracking-tighter uppercase">Closet</h1>
      </header>

      <div className="flex-1 overflow-y-auto px-8 space-y-6 pb-40 custom-scrollbar">
        {loading ? (
          <div className="h-full flex items-center justify-center text-synk-grey text-2xl font-bold italic animate-pulse">Loading...</div>
        ) : items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-synk-grey/40 text-center gap-6">
            <Shirt className="w-32 h-32" />
            <p className="text-2xl font-bold">옷장이 비어 있습니다.<br/>분석으로 옷을 추가해보세요.</p>
          </div>
        ) : (
          items.map((item) => (
            <motion.div 
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-synk-offwhite rounded-[2.5rem] p-6 shadow-sm border-2 border-transparent active:border-synk-blue/30 transition-all active:scale-98"
              onClick={() => {
                speechService.speak(`${item.name}. ${item.description}`);
                hapticService.tap();
              }}
            >
              <div className="flex gap-6 items-center">
                <div className="w-28 h-28 rounded-3xl bg-white flex items-center justify-center overflow-hidden shadow-inner border border-synk-navy/5">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <Shirt className="w-14 h-14 text-synk-blue/40" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-black text-synk-navy mb-1 tracking-tight">{item.name}</h3>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-white rounded-full text-xs font-black uppercase text-synk-blue border border-synk-blue/10">{item.category}</span>
                    <span className="px-3 py-1 bg-white rounded-full text-xs font-black uppercase text-synk-grey border border-synk-navy/5">{item.color}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <div className="fixed bottom-12 left-8 right-8">
        <AccessibleButton 
          label="옷 추가하기"
          hint="카메라로 분석하여 옷장에 저장합니다"
          variant="primary"
          icon={<Plus className="w-10 h-10" />}
          onClick={() => onNavigate(AppScreen.ANALYSIS)}
          className="h-28 text-2xl font-black"
        />
      </div>
    </div>
  );
};
