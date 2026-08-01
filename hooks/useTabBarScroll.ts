import { useCallback, useEffect, useRef } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent, StyleProp, ViewStyle } from 'react-native';
import { useIsFocused } from 'expo-router';
import { useTabBarScrollContext } from '@/contexts/TabBarScrollContext';

type UseTabBarScrollOptions = {
  contentContainerStyle?: StyleProp<ViewStyle>;
};

/** Wire a tab screen's primary ScrollView to the floating tab bar scroll behavior. */
export function useTabBarScroll(options: UseTabBarScrollOptions = {}) {
  const { contentContainerStyle: baseContentStyle } = options;
  const { contentInsetBottom, handleScrollDelta, handleScrollRest, resetToExpanded } =
    useTabBarScrollContext();
  const isFocused = useIsFocused();
  const lastYRef = useRef(0);

  useEffect(() => {
    if (isFocused) {
      lastYRef.current = 0;
      resetToExpanded();
    }
  }, [isFocused, resetToExpanded]);

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!isFocused) return;
      const y = event.nativeEvent.contentOffset.y;
      const delta = y - lastYRef.current;
      lastYRef.current = y;
      handleScrollDelta(delta, y);
    },
    [handleScrollDelta, isFocused],
  );

  const onScrollEnd = useCallback(() => {
    if (!isFocused) return;
    handleScrollRest();
  }, [handleScrollRest, isFocused]);

  return {
    onScroll,
    onScrollEndDrag: onScrollEnd,
    onMomentumScrollEnd: onScrollEnd,
    scrollEventThrottle: 16 as const,
    contentContainerStyle: [baseContentStyle, { paddingBottom: contentInsetBottom }],
  };
}
