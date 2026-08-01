import { memo, useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Platform, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import type { BottomTabBarProps } from 'expo-router/build/react-navigation/bottom-tabs/types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TabBarIconButton } from '@/components/navigation/TabBarIconButton';
import type { AppIconName } from '@/components/icons/catalog';
import { useTabBarScrollContext } from '@/contexts/TabBarScrollContext';
import {
  TAB_BAR_COMPACT_HEIGHT,
  TAB_BAR_EXPANDED_HEIGHT,
  TAB_BAR_FLOAT_OFFSET,
  TAB_BAR_ICON_COMPACT,
  TAB_BAR_ICON_EXPANDED,
  TAB_BAR_ICON_GAP_COMPACT,
  TAB_BAR_ICON_GAP_EXPANDED,
  TAB_BAR_PADDING_H_COMPACT,
  TAB_BAR_PADDING_H_EXPANDED,
} from '@/constants/tabBar';
import { useTheme } from '@/theme';

/** Maps expo-router tab route names to semantic icon names. */
const TAB_ICONS: Record<string, AppIconName> = {
  index: 'home',
  network: 'network',
  events: 'events',
  messages: 'messages',
  friends: 'friends',
};

const TAB_BAR_Z_INDEX = 50;

function hexToRgba(hex: string, alpha: number): string {
  const normalized = hex.replace('#', '');
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export const FloatingTabBar = memo(function FloatingTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { compact, resetToExpanded } = useTabBarScrollContext();
  const progress = useRef(new Animated.Value(compact ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: compact ? 1 : 0,
      duration: theme.motion.base,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [compact, progress, theme.motion.base]);

  useEffect(() => {
    resetToExpanded();
  }, [state.index, resetToExpanded]);

  const containerHeight = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [TAB_BAR_EXPANDED_HEIGHT, TAB_BAR_COMPACT_HEIGHT],
  });

  const paddingHorizontal = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [TAB_BAR_PADDING_H_EXPANDED, TAB_BAR_PADDING_H_COMPACT],
  });

  const iconGap = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [TAB_BAR_ICON_GAP_EXPANDED, TAB_BAR_ICON_GAP_COMPACT],
  });

  const iconScale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, TAB_BAR_ICON_COMPACT / TAB_BAR_ICON_EXPANDED],
  });

  const surfaceFill = useMemo(
    () => hexToRgba(theme.colors.bgSurfaceRaised, 0.8),
    [theme.colors.bgSurfaceRaised],
  );

  const useBlur = Platform.OS === 'ios';

  return (
    <View
      pointerEvents="box-none"
      style={[
        StyleSheet.absoluteFill,
        {
          top: undefined,
          zIndex: TAB_BAR_Z_INDEX,
          alignItems: 'center',
          justifyContent: 'flex-end',
          paddingBottom: insets.bottom + TAB_BAR_FLOAT_OFFSET,
        },
      ]}>
      <Animated.View
        style={[
          theme.shadow.raised,
          {
            height: containerHeight,
            borderRadius: theme.radius.pill,
            overflow: 'hidden',
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal,
            gap: iconGap,
          },
        ]}>
        {useBlur ? (
          <BlurView
            intensity={60}
            tint={theme.mode === 'dark' ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
          />
        ) : null}
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { backgroundColor: surfaceFill }]}
        />

        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const iconName = TAB_ICONS[route.name];
          if (!iconName) return null;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({ type: 'tabLongPress', target: route.key });
          };

          const label =
            typeof options.tabBarAccessibilityLabel === 'string'
              ? options.tabBarAccessibilityLabel
              : typeof options.title === 'string'
                ? options.title
                : route.name;

          const showBadge = route.name === 'messages' && Boolean(options.tabBarBadge);

          return (
            <Animated.View
              key={route.key}
              style={{ transform: [{ scale: iconScale }] }}>
              <TabBarIconButton
                name={iconName}
                active={isFocused}
                onPress={onPress}
                onLongPress={onLongPress}
                accessibilityLabel={label}
                iconSize={TAB_BAR_ICON_EXPANDED}
                showBadge={showBadge}
              />
            </Animated.View>
          );
        })}
      </Animated.View>
    </View>
  );
});
