import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Constants from 'expo-constants';
import { useRouter, type Href } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAirlines } from '@/components/crew/airline';
import { CrewAvatar } from '@/components/crew/kit';
import { SettingsGlyph, VersionStamp, useRowTint, type SettingsIcon } from '@/components/settings/settingsKit';
import { useAppMenu } from '@/contexts/AppMenuContext';
import { SCREENS } from '@/constants/screens';
import { useAuth } from '@/hooks/useSession';
import { fontFamily, useTheme } from '@/theme';

/**
 * Menu drawer — design/…/CrewUp Menu Prototype.dc.html, 6B. A lean, Spotify-style drawer from the right:
 * profile summary (tap for Edit Profile), then four plain rows. Everything configurable lives in Settings & Privacy.
 */

const DRAWER_WIDTH = 318;
const appVersion = Constants.expoConfig?.version;

export function AppSideMenu() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const tint = useRowTint();
  const { width: screenWidth } = useWindowDimensions();
  const width = Math.min(DRAWER_WIDTH, screenWidth - 48);
  const { isOpen, close } = useAppMenu();
  const { profile } = useAuth();
  const airlines = useAirlines();
  const dark = theme.mode === 'dark';

  const [visible, setVisible] = useState(isOpen);
  const scrim = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(width)).current;

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      slide.setValue(width);
      scrim.setValue(0);
      Animated.parallel([
        Animated.timing(scrim, { toValue: 1, duration: 280, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(slide, { toValue: 0, duration: 380, easing: Easing.bezier(0.2, 0.9, 0.25, 1), useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scrim, { toValue: 0, duration: theme.motion.base, easing: Easing.in(Easing.ease), useNativeDriver: true }),
        Animated.timing(slide, { toValue: width, duration: theme.motion.base, easing: Easing.bezier(0.4, 0, 1, 1), useNativeDriver: true }),
      ]).start(({ finished }) => {
        if (finished) setVisible(false);
      });
    }
  }, [isOpen, scrim, slide, theme.motion.base, width]);

  const name = profile?.preferred_name || profile?.full_name || profile?.display_name || t('home.yourProfile');
  const airline = profile?.airline_id ? airlines.get(profile.airline_id)?.name : null;
  const base = (profile?.base_airport_iata ?? '').toUpperCase();
  const summary = [profile?.is_verified ? t('menu.verified') : null, airline, base || null].filter(Boolean).join(' · ');

  const go = (route: Href) => {
    close();
    router.push(route);
  };

  const rows: { id: string; icon: SettingsIcon; label: string; route: Href }[] = [
    { id: 'profile', icon: 'profile', label: t('menu.editProfile'), route: SCREENS.profile.edit },
    { id: 'guidelines', icon: 'guidelines', label: t('about.guidelines'), route: SCREENS.legal.guidelines },
    { id: 'safety', icon: 'safety', label: t('about.safetyTips'), route: SCREENS.legal.safety },
    { id: 'settings', icon: 'settings', label: t('menu.settings'), route: SCREENS.settings.index },
  ];

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={close}>
      <View style={{ flex: 1 }}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(14,17,19,0.5)', opacity: scrim }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={close} accessibilityRole="button" accessibilityLabel={t('common.dismiss')} />
        </Animated.View>

        <Animated.View
          accessibilityViewIsModal
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            width,
            backgroundColor: theme.colors.bgCanvas,
            borderTopLeftRadius: 30,
            borderBottomLeftRadius: 30,
            shadowColor: '#0E1113',
            shadowOpacity: 0.3,
            shadowRadius: 30,
            shadowOffset: { width: -24, height: 0 },
            elevation: 16,
            transform: [{ translateX: slide }],
          }}>
          <ScrollView bounces={false} showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top + 20, paddingBottom: Math.max(insets.bottom, 14) + 22 }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={[name, summary].filter(Boolean).join(', ')}
              accessibilityHint={t('menu.editProfile')}
              onPress={() => go(SCREENS.profile.edit)}
              style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 24, paddingTop: 4, paddingBottom: 22, opacity: pressed ? 0.7 : 1 })}>
              <CrewAvatar name={name} fileId={profile?.avatar_file_id} size={56} tone="ink" />
              <View style={{ flex: 1, gap: 3 }}>
                <Text numberOfLines={1} style={{ fontFamily: fontFamily.jakartaBold, fontSize: 20, letterSpacing: -0.4, color: theme.colors.textPrimary }}>
                  {name}
                </Text>
                {summary ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    {profile?.is_verified ? (
                      <Svg width={13} height={13} viewBox="0 0 24 24">
                        <Path d="M5 12.5l4.5 4.5L19 7.5" stroke={theme.colors.accentText} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                      </Svg>
                    ) : null}
                    <Text numberOfLines={1} style={{ flex: 1, fontFamily: fontFamily.interRegular, fontSize: 13, color: theme.colors.textSecondary }}>
                      {summary}
                    </Text>
                  </View>
                ) : null}
              </View>
            </Pressable>
            <View style={{ height: 1, backgroundColor: dark ? '#262C30' : '#E6E9E1', marginHorizontal: 24, marginBottom: 10 }} />
            {rows.map((row) => (
              <Pressable
                key={row.id}
                accessibilityRole="button"
                onPress={() => go(row.route)}
                style={({ pressed }) => ({ minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 18, paddingHorizontal: 24, backgroundColor: pressed ? tint : 'transparent' })}>
                <SettingsGlyph name={row.icon} color={theme.colors.textPrimary} />
                <Text style={{ fontFamily: fontFamily.jakartaBold, fontSize: 17, color: theme.colors.textPrimary }}>{row.label}</Text>
              </Pressable>
            ))}
            <View style={{ flex: 1, minHeight: 24 }} />
            <View style={{ paddingHorizontal: 24 }}>
              <VersionStamp version={appVersion} />
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}
