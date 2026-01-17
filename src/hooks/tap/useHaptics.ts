'use client';

import { useCallback } from 'react';

type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'error';

const HAPTIC_PATTERNS: Record<HapticType, number[]> = {
  light: [10],
  medium: [20],
  heavy: [30],
  success: [10, 50, 10, 50, 30],
  error: [50, 30, 50],
};

export function useHaptics() {
  const trigger = useCallback((type: HapticType = 'light') => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(HAPTIC_PATTERNS[type]);
    }
  }, []);

  return { trigger };
}
