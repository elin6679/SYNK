export interface UserProfile {
  name: string;
  measurements: {
    height?: number;
    shoulder?: number;
    chest?: number;
  };
  skinTone?: string;
  settings: {
    speechRate: number;
    speechVolume: number;
    hapticIntensity: number;
  };
}

export enum AppScreen {
  ONBOARDING = 'onboarding',
  HOME = 'home',
  ANALYSIS = 'analysis',
  CLOSET = 'closet',
  BEAUTY = 'beauty',
  STORE = 'store',
  SETTINGS = 'settings'
}

export interface ClothingItem {
  id: string;
  name: string;
  category: string;
  color: string;
  texture: string;
  description: string;
  imageUrl?: string;
  createdAt: number;
}
