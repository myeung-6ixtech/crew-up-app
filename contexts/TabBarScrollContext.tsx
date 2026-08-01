import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  TAB_BAR_CONTENT_EXTRA,
  TAB_BAR_EXPANDED_HEIGHT,
  TAB_BAR_FLOAT_OFFSET,
  TAB_BAR_SCROLL_DOWN_THRESHOLD,
  TAB_BAR_SCROLL_JITTER,
  TAB_BAR_SCROLL_REST_MS,
} from '@/constants/tabBar';

type TabBarScrollContextValue = {
  compact: boolean;
  contentInsetBottom: number;
  handleScrollDelta: (delta: number, scrollY: number) => void;
  handleScrollRest: () => void;
  resetToExpanded: () => void;
};

const TabBarScrollContext = createContext<TabBarScrollContextValue | null>(null);

export function TabBarScrollProvider({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const [compact, setCompact] = useState(false);
  const downAccumRef = useRef(0);
  const restTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearRestTimer = useCallback(() => {
    if (restTimerRef.current) {
      clearTimeout(restTimerRef.current);
      restTimerRef.current = null;
    }
  }, []);

  const resetToExpanded = useCallback(() => {
    clearRestTimer();
    downAccumRef.current = 0;
    setCompact(false);
  }, [clearRestTimer]);

  const scheduleRestExpand = useCallback(() => {
    clearRestTimer();
    restTimerRef.current = setTimeout(() => {
      downAccumRef.current = 0;
      setCompact(false);
    }, TAB_BAR_SCROLL_REST_MS);
  }, [clearRestTimer]);

  const handleScrollDelta = useCallback(
    (delta: number, scrollY: number) => {
      if (Math.abs(delta) < TAB_BAR_SCROLL_JITTER) return;

      if (scrollY <= 0) {
        resetToExpanded();
        return;
      }

      if (delta < 0) {
        resetToExpanded();
        return;
      }

      downAccumRef.current += delta;
      if (
        downAccumRef.current >= TAB_BAR_SCROLL_DOWN_THRESHOLD &&
        scrollY > TAB_BAR_SCROLL_DOWN_THRESHOLD
      ) {
        setCompact(true);
        downAccumRef.current = 0;
      }

      scheduleRestExpand();
    },
    [resetToExpanded, scheduleRestExpand],
  );

  const handleScrollRest = useCallback(() => {
    scheduleRestExpand();
  }, [scheduleRestExpand]);

  const contentInsetBottom =
    insets.bottom + TAB_BAR_FLOAT_OFFSET + TAB_BAR_EXPANDED_HEIGHT + TAB_BAR_CONTENT_EXTRA;

  const value = useMemo(
    () => ({
      compact,
      contentInsetBottom,
      handleScrollDelta,
      handleScrollRest,
      resetToExpanded,
    }),
    [compact, contentInsetBottom, handleScrollDelta, handleScrollRest, resetToExpanded],
  );

  return (
    <TabBarScrollContext.Provider value={value}>{children}</TabBarScrollContext.Provider>
  );
}

export function useTabBarScrollContext() {
  const ctx = useContext(TabBarScrollContext);
  if (!ctx) {
    throw new Error('useTabBarScrollContext must be used within TabBarScrollProvider');
  }
  return ctx;
}
