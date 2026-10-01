import { useState } from 'react';
import { Image, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { findAirportByIata } from '@/constants/airports';
import { SCREENS } from '@/constants/screens';
import { useAuth, useSession } from '@/hooks/useSession';
import { fontFamily } from '@/theme';
import { DARK, DarkLimePill, DarkOutlinePill, TextPillAction } from '../../components/kit';
import { PhotoCircle } from '../../components/PhotoCircle';
import { useOnboardingState } from '../../hooks/useOnboardingState';

/** Beta ending 2: the dark waiting room. No back, no progress. Profile edits allowed; the rest of the app stays closed. */
export function BetaHoldingScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const { signOut } = useSession();
  const { mode, retryMode, refresh } = useOnboardingState();
  const [checking, setChecking] = useState(false);
  const [checked, setChecked] = useState(false);

  const name = profile?.preferred_name || profile?.full_name || '';
  const airport = findAirportByIata(profile?.base_airport_iata);
  const detail = [
    profile?.crew_role ? t(`onboarding.crewRoles.${profile.crew_role}`) : null,
    airport ? `${airport.iata} · ${airport.city}` : profile?.base_airport_iata,
  ]
    .filter(Boolean)
    .join(' · ');

  const checkAgain = async () => {
    setChecking(true);
    setChecked(false);
    try {
      await Promise.all([retryMode(), refresh()]);
      setChecked(true);
    } finally {
      setChecking(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: DARK.ground }}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top + 18, paddingHorizontal: 24, paddingBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Image
            source={require('@/assets/logos/crewup-wordmark-lime-2400.png')}
            accessibilityRole="image"
            accessibilityLabel={t('appName')}
            resizeMode="contain"
            style={{ width: 112, height: 32 }}
          />
          <Text
            style={{
              fontFamily: fontFamily.monoMedium,
              fontSize: 10.5,
              letterSpacing: 1,
              color: DARK.ground,
              backgroundColor: DARK.lime,
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 12,
              overflow: 'hidden',
            }}>
            {t('onboarding.betaHolding.badge')}
          </Text>
        </View>
        <Text
          accessibilityRole="header"
          style={{
            fontFamily: fontFamily.jakartaBold,
            fontSize: 32,
            lineHeight: 34,
            letterSpacing: -0.8,
            color: DARK.ink,
            marginTop: 56,
          }}>
          {t('onboarding.betaHolding.title', { name })}
        </Text>
        <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 14.5, lineHeight: 22, color: DARK.muted, marginTop: 14 }}>
          {t('onboarding.betaHolding.subtitle')}
        </Text>
        <View
          style={{
            marginTop: 32,
            backgroundColor: DARK.card,
            borderWidth: 1,
            borderColor: DARK.cardBorder,
            borderRadius: 22,
            padding: 18,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 14,
          }}>
          <PhotoCircle size={60} tone="lime" name={name} fileId={profile?.avatar_file_id} />
          <View style={{ flex: 1, gap: 3 }}>
            <Text numberOfLines={1} style={{ fontFamily: fontFamily.jakartaBold, fontSize: 18, color: DARK.ink }}>
              {name}
            </Text>
            {profile?.username ? (
              <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 13, color: DARK.muted }}>@{profile.username}</Text>
            ) : null}
            {detail ? (
              <Text numberOfLines={1} style={{ fontFamily: fontFamily.interMedium, fontSize: 13, color: DARK.lime }}>
                {detail}
              </Text>
            ) : null}
          </View>
        </View>
        {checked && mode === 'beta' ? (
          <View
            accessibilityLiveRegion="polite"
            style={{
              marginTop: 14,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              backgroundColor: DARK.ink,
              borderRadius: 14,
              paddingVertical: 12,
              paddingHorizontal: 14,
            }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#E8C25A' }} />
            <Text style={{ flex: 1, fontFamily: fontFamily.interRegular, fontSize: 13, lineHeight: 18, color: DARK.ground }}>
              {t('onboarding.betaHolding.stillBeta')}
            </Text>
          </View>
        ) : null}
      </ScrollView>
      <View style={{ paddingHorizontal: 24, paddingBottom: Math.max(insets.bottom, 16), gap: 10 }}>
        <DarkLimePill label={t('onboarding.betaHolding.editProfile')} onPress={() => router.push(SCREENS.profile.edit)} />
        <DarkOutlinePill
          height={54}
          label={checking ? t('onboarding.betaHolding.checking') : t('onboarding.betaHolding.checkAgain')}
          onPress={() => void checkAgain()}
        />
        <TextPillAction label={t('onboarding.signOut')} color={DARK.muted} onPress={() => void signOut()} />
      </View>
    </View>
  );
}
