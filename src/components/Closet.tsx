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
    <div className="h-full flex flex-col p-6 bg-synk-offwhite">
      <header className="py-6 flex items-center gap-4 text-synk-navy">
        <button 
          onClick={() => onNavigate(AppScreen.HOME)}
          className="p-4 rounded-full bg-white/50 backdrop-blur-md shadow-sm active:scale-90 border border-white/50"
          aria-label="뒤로 가기"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>
        <h1 className="text-3xl font-display font-bold">내 옷장</h1>
      </header>

      <div className="flex-1 overflow-y-auto space-y-6 pb-24">
        {loading ? (
          <div className="h-full flex items-center justify-center text-synk-grey text-xl">로딩 중...</div>
        ) : items.length === 0 ? (
          <div className="h-60 flex flex-col items-center justify-center text-synk-grey text-center gap-4">
            <Shirt className="w-20 h-20 opacity-20" />
            <p className="text-xl">옷장이 비어 있습니다.<br/>카메라 분석으로 옷을 추가해보세요.</p>
          </div>
        ) : (
          items.map((item) => (
            <motion.div 
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-[32px] p-6 shadow-md border-2 border-transparent active:border-synk-blue"
              onClick={() => speechService.speak(`${item.name}. ${item.description}`)}
            >
              <div className="flex gap-6">
                <div className="w-24 h-24 rounded-2xl bg-synk-offwhite flex items-center justify-center overflow-hidden">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <Shirt className="w-12 h-12 text-synk-grey" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-1">{item.name}</h3>
                  <p className="text-synk-grey text-lg">{item.color} • {item.category}</p>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <div className="fixed bottom-12 left-6 right-6">
        <AccessibleButton 
          label="옷 추가하기"
          hint="카메라로 분석하여 옷장에 저장합니다"
          icon={<Plus className="w-10 h-10" />}
          onClick={() => onNavigate(AppScreen.ANALYSIS)}
          className="bg-synk-navy py-6"
        />
      </div>
    </div>
  );
};
