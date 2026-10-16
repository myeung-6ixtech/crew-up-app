import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Alert, Animated, Easing, Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAirlines } from '@/components/crew/airline';
import { CrewAvatar } from '@/components/crew/kit';
import { useAppMenu } from '@/contexts/AppMenuContext';
import { SCREENS } from '@/constants/screens';
import { useAuth, useSession } from '@/hooks/useSession';
import { hapticSelection, hapticWarning } from '@/lib/haptics';
import { fontFamily, useTheme, useThemeControls } from '@/theme';

/**
 * Settings drawer — design/…/CrewUp - Add Trip Flow.dc.html, 3B (light) and 3C (dark).
 * Slides in from the right: profile summary, the four account settings in one card, a dark mode switch,
 * and Sign out at the bottom, away from the rows. Tap the scrim or × to close.
 */

const DRAWER_WIDTH = 322;

const PALETTE = {
  light: {
    panel: '#F7F8F4',
    card: '#FFFFFF',
    tile: '#F2F4EE',
    pressed: '#F2F4EE',
    line: '#EEF0EA',
    ink: '#0E1113',
    muted: '#545A50',
    chevron: '#9AA092',
    border: '#C9CEC1',
    close: '#FFFFFF',
    chip: '#EAECE5',
    track: '#D4D8CD',
    knob: '#FFFFFF',
  },
  dark: {
    panel: '#0E1113',
    card: '#1A1F22',
    tile: '#262C30',
    pressed: '#232A2E',
    line: '#262C30',
    ink: '#EDF1F2',
    muted: '#9AA3A6',
    chevron: '#6F787C',
    border: '#3A4145',
    close: '#1A1F22',
    chip: '#262C30',
    track: '#A8E05F',
    knob: '#0E1113',
  },
} as const;

type Palette = (typeof PALETTE)[keyof typeof PALETTE];

function Glyph({ name, color }: { name: 'profile' | 'eye' | 'globe' | 'lock' | 'sun' | 'moon'; color: string }) {
  const stroke = { stroke: color, strokeWidth: 1.8, fill: 'none' } as const;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      {name === 'profile' ? (
        <>
          <Circle cx={12} cy={8} r={4} {...stroke} />
          <Path d="M4.5 20.5c.8-3.7 3.9-6 7.5-6s6.7 2.3 7.5 6" {...stroke} strokeLinecap="round" />
        </>
      ) : name === 'eye' ? (
        <>
          <Path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" {...stroke} strokeLinejoin="round" />
          <Circle cx={12} cy={12} r={3} {...stroke} />
        </>
      ) : name === 'globe' ? (
        <>
          <Circle cx={12} cy={12} r={9} {...stroke} />
          <Path d="M3 12h18M12 3c2.6 2.6 3.8 5.6 3.8 9s-1.2 6.4-3.8 9c-2.6-2.6-3.8-5.6-3.8-9S9.4 5.6 12 3z" {...stroke} />
        </>
      ) : name === 'lock' ? (
        <>
          <Rect x={4.5} y={10.5} width={15} height={10.5} rx={2.5} {...stroke} />
          <Path d="M8 10.5V7.5a4 4 0 018 0v3" {...stroke} strokeLinecap="round" />
        </>
      ) : name === 'sun' ? (
        <>
          <Circle cx={12} cy={12} r={4} {...stroke} />
          <Path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" {...stroke} strokeLinecap="round" />
        </>
      ) : (
        <Path d="M20 14.5A8 8 0 019.5 4a8 8 0 1010.5 10.5z" {...stroke} strokeLinejoin="round" />
      )}
    </Svg>
  );
}

function IconTile({ children, palette }: { children: ReactNode; palette: Palette }) {
  return <View style={{ width: 36, height: 36, borderRadius: 11, backgroundColor: palette.tile, alignItems: 'center', justifyContent: 'center' }}>{children}</View>;
}

function SectionLabel({ children, palette }: { children: string; palette: Palette }) {
  return (
    <Text style={{ fontFamily: fontFamily.monoMedium, fontSize: 10.5, letterSpacing: 1.2, color: palette.muted, paddingLeft: 4 }}>{children.toUpperCase()}</Text>
  );
}

type Row = { id: string; icon: 'profile' | 'eye' | 'globe' | 'lock'; title: string; body?: string; value?: string; route: Href };

/** 50×30 switch: grey with a white knob off, lime with an ink knob on. */
function ModeSwitch({ on, onToggle, label, palette }: { on: boolean; onToggle: () => void; label: string; palette: Palette }) {
  const x = useRef(new Animated.Value(on ? 20 : 0)).current;
  useEffect(() => {
    Animated.timing(x, { toValue: on ? 20 : 0, duration: 180, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [on, x]);
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: on }}
      hitSlop={8}
      onPress={onToggle}
      style={{ width: 50, height: 30, borderRadius: 15, backgroundColor: palette.track, padding: 3, justifyContent: 'center' }}>
      <Animated.View
        style={{
          width: 24,
          height: 24,
          borderRadius: 12,
          backgroundColor: palette.knob,
          shadowColor: '#0E1113',
          shadowOpacity: 0.25,
          shadowRadius: 3,
          shadowOffset: { width: 0, height: 1 },
          elevation: 2,
          transform: [{ translateX: x }],
        }}
      />
    </Pressable>
  );
}

export function AppSideMenu() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const { setColorScheme } = useThemeControls();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const width = Math.min(DRAWER_WIDTH, screenWidth - 48);
  const { isOpen, close } = useAppMenu();
  const { profile } = useAuth();
  const { signOut } = useSession();
  const airlines = useAirlines();
  const dark = theme.mode === 'dark';
  const palette = dark ? PALETTE.dark : PALETTE.light;

  const [visible, setVisible] = useState(isOpen);
  const scrim = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(width)).current;

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      slide.setValue(width);
      scrim.setValue(0);
      Animated.parallel([
        Animated.timing(scrim, { toValue: 1, duration: theme.motion.slow, easing: Easing.bezier(0, 0, 0.2, 1), useNativeDriver: true }),
        Animated.timing(slide, { toValue: 0, duration: theme.motion.slow, easing: Easing.bezier(0, 0, 0.2, 1), useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scrim, { toValue: 0, duration: theme.motion.base, easing: Easing.bezier(0.4, 0, 1, 1), useNativeDriver: true }),
        Animated.timing(slide, { toValue: width, duration: theme.motion.base, easing: Easing.bezier(0.4, 0, 1, 1), useNativeDriver: true }),
      ]).start(({ finished }) => {
        if (finished) setVisible(false);
      });
    }
  }, [isOpen, scrim, slide, theme.motion.base, theme.motion.slow, width]);

  const name = profile?.preferred_name || profile?.full_name || profile?.display_name || t('home.yourProfile');
  const airline = profile?.airline_id ? airlines.get(profile.airline_id)?.name : null;
  const crewLine = [airline, profile?.crew_role ? t(`onboarding.crewRoles.${profile.crew_role}`) : null].filter(Boolean).join(' · ');
  const base = (profile?.base_airport_iata ?? '').toUpperCase();
  const language = i18n.resolvedLanguage ?? i18n.language ?? 'en';
  const discoverable = profile?.default_visibility !== 'off';

  const rows: Row[] = [
    { id: 'edit', icon: 'profile', title: t('menu.editProfile'), body: t('menu.editProfileBody'), route: SCREENS.profile.edit },
    { id: 'privacy', icon: 'eye', title: t('menu.privacy'), body: t('menu.privacyBody'), route: SCREENS.profile.privacy },
    { id: 'language', icon: 'globe', title: t('menu.language'), value: t(`settings.languages.${language}`, { defaultValue: language.toUpperCase() }), route: SCREENS.profile.language },
    { id: 'security', icon: 'lock', title: t('menu.accountSecurity'), body: t('menu.accountSecurityBody'), route: SCREENS.profile.security },
  ];

  const go = (route: Href) => {
    close();
    router.push(route);
  };

  const confirmSignOut = () => {
    Alert.alert(t('menu.signOutTitle'), t('menu.signOutMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('auth.signOut'),
        style: 'destructive',
        onPress: () => {
          hapticWarning();
          close();
          void signOut();
        },
      },
    ]);
  };

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={close}>
      <View style={{ flex: 1 }}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(14,17,19,0.42)', opacity: scrim }]}>
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
            backgroundColor: palette.panel,
            borderTopLeftRadius: 30,
            borderBottomLeftRadius: 30,
            shadowColor: '#0E1113',
            shadowOpacity: 0.28,
            shadowRadius: 30,
            shadowOffset: { width: -24, height: 0 },
            elevation: 16,
            transform: [{ translateX: slide }],
          }}>
          <ScrollView
            bounces={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ flexGrow: 1, gap: 22, paddingTop: insets.top + 14, paddingHorizontal: 20, paddingBottom: Math.max(insets.bottom, 14) + 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text accessibilityRole="header" style={{ fontFamily: fontFamily.monoMedium, fontSize: 11, letterSpacing: 1.3, color: palette.muted }}>
                {t('menu.title').toUpperCase()}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('common.close')}
                onPress={close}
                style={({ pressed }) => ({ width: 40, height: 40, borderRadius: 20, backgroundColor: palette.close, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.7 : 1 })}>
                <Svg width={16} height={16} viewBox="0 0 24 24">
                  <Path d="M6 6l12 12M18 6L6 18" stroke={palette.ink} strokeWidth={2.2} strokeLinecap="round" />
                </Svg>
              </Pressable>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <View>
                <CrewAvatar name={name} fileId={profile?.avatar_file_id} size={60} tone="ink" />
                {discoverable ? (
                  <View style={{ position: 'absolute', right: 0, bottom: 0, width: 14, height: 14, borderRadius: 7, backgroundColor: '#A8E05F', borderWidth: 3, borderColor: palette.panel }} />
                ) : null}
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <Text numberOfLines={1} style={{ fontFamily: fontFamily.jakartaBold, fontSize: 19, letterSpacing: -0.4, color: palette.ink }}>
                  {name}
                </Text>
                {crewLine ? (
                  <Text numberOfLines={1} style={{ fontFamily: fontFamily.interRegular, fontSize: 13, color: palette.muted }}>
                    {crewLine}
                  </Text>
                ) : null}
                {profile?.is_verified || base ? (
                  <View style={{ flexDirection: 'row', gap: 6, marginTop: 2 }}>
                    {profile?.is_verified ? (
                      <View style={{ height: 22, paddingHorizontal: 8, borderRadius: 11, backgroundColor: '#A8E05F', flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Svg width={11} height={11} viewBox="0 0 24 24">
                          <Path d="M5 12.5l4.5 4.5L19 7.5" stroke="#0E1113" strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                        </Svg>
                        <Text style={{ fontFamily: fontFamily.interMedium, fontSize: 11.5, color: '#0E1113' }}>{t('menu.verified')}</Text>
                      </View>
                    ) : null}
                    {base ? (
                      <View style={{ height: 22, paddingHorizontal: 8, borderRadius: 11, backgroundColor: palette.chip, justifyContent: 'center' }}>
                        <Text style={{ fontFamily: fontFamily.monoMedium, fontSize: 10.5, color: palette.ink }}>{t('menu.base', { code: base })}</Text>
                      </View>
                    ) : null}
                  </View>
                ) : null}
              </View>
            </View>

            <View style={{ gap: 8 }}>
              <SectionLabel palette={palette}>{t('menu.account')}</SectionLabel>
              <View style={{ backgroundColor: palette.card, borderRadius: 18, overflow: 'hidden' }}>
                {rows.map((row, index) => (
                  <Pressable
                    key={row.id}
                    accessibilityRole="button"
                    accessibilityLabel={[row.title, row.value].filter(Boolean).join(', ')}
                    accessibilityHint={row.body}
                    onPress={() => go(row.route)}
                    style={({ pressed }) => ({
                      minHeight: 62,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                      backgroundColor: pressed ? palette.pressed : 'transparent',
                      borderBottomWidth: index === rows.length - 1 ? 0 : 1,
                      borderBottomColor: palette.line,
                    })}>
                    <IconTile palette={palette}>
                      <Glyph name={row.icon} color={palette.ink} />
                    </IconTile>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={{ fontFamily: fontFamily.interMedium, fontSize: 15, color: palette.ink }}>{row.title}</Text>
                      {row.body ? <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 12.5, color: palette.muted }}>{row.body}</Text> : null}
                    </View>
                    {row.value ? <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 13.5, color: palette.muted }}>{row.value}</Text> : null}
                    <Svg width={16} height={16} viewBox="0 0 24 24">
                      <Path d="M9 5l7 7-7 7" stroke={palette.chevron} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </Svg>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={{ gap: 8 }}>
              <SectionLabel palette={palette}>{t('menu.appearance')}</SectionLabel>
              <View style={{ backgroundColor: palette.card, borderRadius: 18, minHeight: 62, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14 }}>
                <IconTile palette={palette}>
                  <Glyph name={dark ? 'moon' : 'sun'} color={palette.ink} />
                </IconTile>
                <Text style={{ flex: 1, fontFamily: fontFamily.interMedium, fontSize: 15, color: palette.ink }}>{dark ? t('menu.darkMode') : t('menu.lightMode')}</Text>
                <ModeSwitch
                  on={dark}
                  label={t('menu.darkMode')}
                  palette={palette}
                  onToggle={() => {
                    hapticSelection();
                    setColorScheme(dark ? 'light' : 'dark');
                  }}
                />
              </View>
            </View>

            <View style={{ flex: 1 }} />

            <Pressable
              accessibilityRole="button"
              onPress={confirmSignOut}
              style={({ pressed }) => ({
                height: 52,
                borderRadius: 26,
                borderWidth: 1.5,
                borderColor: palette.border,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                backgroundColor: pressed ? palette.pressed : 'transparent',
              })}>
              <Svg width={18} height={18} viewBox="0 0 24 24">
                <Path d="M14 4h3.5A2.5 2.5 0 0120 6.5v11a2.5 2.5 0 01-2.5 2.5H14M10 16l-4-4 4-4M6 12h10" stroke={palette.ink} strokeWidth={1.8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
              <Text style={{ fontFamily: fontFamily.jakartaBold, fontSize: 15, color: palette.ink }}>{t('auth.signOut')}</Text>
            </Pressable>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}
