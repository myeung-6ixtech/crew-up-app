import { memo, useEffect, useRef } from 'react';
import { Animated, Easing, Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { useRouter, type Href } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/build/react-navigation/bottom-tabs/types';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SCREENS } from '@/constants/screens';
import { TAB_BAR_FLOAT_OFFSET } from '@/constants/tabBar';
import { useTabBarScrollContext } from '@/contexts/TabBarScrollContext';
import { useAuth } from '@/hooks/useSession';
import { useStorageFileUri } from '@/hooks/useStorageFileUri';
import { hapticSelection } from '@/lib/haptics';
import { fontFamily, useTheme } from '@/theme';
import { NavIcon, type NavTab } from './NavIcons';

/** Nav order: Home · Events · Messages · Friends · Profile. */
export const NAV_TABS: NavTab[] = ['index', 'events', 'messages', 'friends', 'profile'];

const TAB_HREFS: Record<NavTab, Href> = {
  index: SCREENS.tabs.home,
  events: SCREENS.tabs.events,
  messages: SCREENS.tabs.messages,
  friends: SCREENS.tabs.friends,
  profile: SCREENS.tabs.profile,
};

const TAB_LABELS: Record<NavTab, string> = {
  index: 'tabs.home',
  events: 'tabs.events',
  messages: 'tabs.messages',
  friends: 'tabs.friends',
  profile: 'tabs.profile',
};

export const NAV_PILL_HEIGHT = 64;

function NavAvatar({ active }: { active: boolean }) {
  const theme = useTheme();
  const { profile } = useAuth();
  const { uri, headers } = useStorageFileUri(profile?.avatar_file_id);
  const name = profile?.preferred_name || profile?.full_name || profile?.display_name || '';
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
  const outer = active ? 30 : 28;
  return (
    <View
      style={{
        width: outer,
        height: outer,
        borderRadius: outer / 2,
        borderWidth: active ? 2 : 0,
        borderColor: theme.colors.ink,
        padding: active ? 2 : 0,
      }}>
      <View
        style={{
          flex: 1,
          borderRadius: outer,
          overflow: 'hidden',
          backgroundColor: theme.colors.ink,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        {uri ? (
          <Image source={headers ? { uri, headers } : { uri }} style={StyleSheet.absoluteFill} />
        ) : (
          <Text style={{ fontFamily: fontFamily.jakartaBold, fontSize: 9, color: theme.colors.fill }}>{initials || '·'}</Text>
        )}
      </View>
    </View>
  );
}

/**
 * Translucent floating nav pill. Shrinks (scale 0.8) while scrolling down and springs back on scroll up.
 * `active` is null on pushed screens that don't belong to a tab.
 */
export function NavPill({
  active,
  onSelect,
  compact = false,
  badges,
}: {
  active: NavTab | null;
  onSelect: (tab: NavTab) => void;
  compact?: boolean;
  badges?: Partial<Record<NavTab, boolean>>;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const progress = useRef(new Animated.Value(compact ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: compact ? 1 : 0,
      duration: 460,
      easing: Easing.bezier(0.2, 0.9, 0.25, 1.12),
      useNativeDriver: true,
    }).start();
  }, [compact, progress]);

  const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [1, 0.8] });
  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [0, 10] });
  const dark = theme.mode === 'dark';
  const fill = dark ? 'rgba(28,33,36,0.72)' : 'rgba(247,248,244,0.72)';
  const compactFill = dark ? 'rgba(28,33,36,0.58)' : 'rgba(247,248,244,0.58)';
  const fillOpacity = progress.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: 14,
        right: 14,
        bottom: insets.bottom + TAB_BAR_FLOAT_OFFSET - 8,
        zIndex: 50,
      }}>
      <Animated.View
        accessibilityRole="tablist"
        style={{
          height: NAV_PILL_HEIGHT,
          borderRadius: NAV_PILL_HEIGHT / 2,
          overflow: Platform.OS === 'android' ? 'hidden' : 'visible',
          transform: [{ translateY }, { scale }],
          shadowColor: '#0E1113',
          shadowOpacity: 0.16,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 12 },
          elevation: 8,
        }}>
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              borderRadius: NAV_PILL_HEIGHT / 2,
              overflow: 'hidden',
              borderWidth: 1,
              borderColor: dark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.75)',
            },
          ]}>
          {Platform.OS === 'ios' ? (
            <BlurView intensity={40} tint={dark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
          ) : null}
          <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: compactFill }]} />
          <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: fill, opacity: fillOpacity }]} />
        </View>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12 }}>
          {NAV_TABS.map((tab) => {
            const selected = active === tab;
            return (
              <Pressable
                key={tab}
                accessibilityRole="tab"
                accessibilityLabel={t(TAB_LABELS[tab])}
                accessibilityState={{ selected }}
                onPress={() => {
                  hapticSelection();
                  onSelect(tab);
                }}
                hitSlop={6}
                style={({ pressed }) => ({
                  width: 48,
                  height: 44,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: pressed ? 0.6 : 1,
                })}>
                {tab === 'profile' ? (
                  <NavAvatar active={selected} />
                ) : (
                  <NavIcon tab={tab} active={selected} color={theme.colors.ink} cutout={theme.colors.ground} />
                )}
                {badges?.[tab] ? (
                  <View
                    pointerEvents="none"
                    style={{
                      position: 'absolute',
                      top: 7,
                      right: 9,
                      width: 9,
                      height: 9,
                      borderRadius: 5,
                      backgroundColor: theme.colors.fill,
                      borderWidth: 2,
                      borderColor: theme.colors.ground,
                    }}
                  />
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </Animated.View>
    </View>
  );
}

/** The same pill on pushed screens (Add friend, someone's profile, a meet). Navigates back into the tabs. */
export function StandaloneNavPill({ active = null }: { active?: NavTab | null }) {
  const router = useRouter();
  return <NavPill active={active} onSelect={(tab) => router.navigate(TAB_HREFS[tab])} />;
}

export const FloatingTabBar = memo(function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { compact, resetToExpanded } = useTabBarScrollContext();

  useEffect(() => {
    resetToExpanded();
  }, [state.index, resetToExpanded]);

  const focused = state.routes[state.index]?.name as NavTab | undefined;
  const badges: Partial<Record<NavTab, boolean>> = {};
  state.routes.forEach((route) => {
    if (descriptors[route.key]?.options.tabBarBadge) badges[route.name as NavTab] = true;
  });

  return (
    <NavPill
      active={focused && NAV_TABS.includes(focused) ? focused : null}
      compact={compact}
      badges={badges}
      onSelect={(tab) => {
        const route = state.routes.find((item) => item.name === tab);
        if (!route) return;
        const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
        if (focused !== tab && !event.defaultPrevented) navigation.navigate(route.name, route.params);
      }}
    />
  );
});
