/**
 * HapticService handles tactile feedback through patterns of vibration.
 */

export const HapticPattern = {
  TAP: 50,
  SUCCESS: [50, 100, 50],
  FAILURE: [100, 50, 100, 50, 100],
  WARNING: [300, 100, 300],
  ROUGH: [10, 10, 10, 10, 10, 10, 10, 10],
  SMOOTH: [5, 5, 5, 5],
  SOFT: 10,
} as const;

type HapticPatternType = typeof HapticPattern;
type HapticPatternKey = keyof HapticPatternType;

class HapticService {
  vibrate(pattern: number | number[] | readonly number[]) {
    if (typeof window !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(pattern as VibratePattern);
    }
  }

  tap() {
    this.vibrate(HapticPattern.TAP);
  }

  success() {
    this.vibrate(HapticPattern.SUCCESS);
  }

  warning() {
    this.vibrate(HapticPattern.WARNING);
  }

  error() {
    this.vibrate(HapticPattern.FAILURE);
  }

  // Simulate texture feedback
  texture(isRough: boolean) {
    this.vibrate(isRough ? HapticPattern.ROUGH : HapticPattern.SMOOTH);
  }
}

export const hapticService = new HapticService();
