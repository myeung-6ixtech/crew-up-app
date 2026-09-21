import { useEffect, useState } from 'react';
import { ScrollView, KeyboardAvoidingView, Platform, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApolloClient } from '@/lib/apolloHooks';
import { AirlinePickerField } from '@/components/profile/AirlinePickerField';
import { AirportPickerField } from '@/components/profile/AirportPickerField';
import {
  Screen,
  Title,
  Subtitle,
  Input,
  Button,
  BodyText,
  SectionLabel,
  PillSelectorGroup,
} from '@/components/ui';
import { ROLE_TYPES, type VisibilityLevel } from '@/constants/screens';
import { formatOptionLabel } from '@/lib/formatOptionLabel';
import {
  normalizeVisibilityForAffiliation,
  visibilityLevelsForAffiliation,
} from '@/lib/visibilityOptions';
import { formatApolloError, isUniquenessViolation } from '@/lib/graphqlError';
import { hasCompletedOnboarding } from '@/lib/profileCompletion';
import {
  fetchAirlines,
  fetchMyProfile,
  saveOrUpdateProfile,
} from '@/services/profileService';
import { useAuth, useSession } from '@/hooks/useSession';
import { SCREENS } from '@/constants/screens';
import { useThemedStyles, useTheme } from '@/theme';

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const client = useApolloClient();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { profile, userId, loading: authLoading, hasCompletedOnboarding: onboardingDone } =
    useAuth();
  const { refreshProfile, refreshSession } = useSession();
  const styles = useThemedStyles((t) => ({
    scroll: { padding: t.spacing.lg, paddingBottom: t.spacing.xxxl + 80 },
    section: { marginBottom: t.spacing.xl },
    sectionHint: { marginBottom: t.spacing.md },
    footer: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      paddingHorizontal: t.spacing.lg,
      paddingTop: t.spacing.md,
      paddingBottom: Math.max(insets.bottom, t.spacing.lg),
      backgroundColor: t.colors.bgCanvas,
      borderTopWidth: 1,
      borderTopColor: t.colors.hairline,
    },
  }));

  const [displayName, setDisplayName] = useState('');
  const [roleType, setRoleType] = useState<string>(ROLE_TYPES[0]);
  const [baseAirport, setBaseAirport] = useState('');
  const [airlineId, setAirlineId] = useState<string | undefined>();
  const [visibility, setVisibility] = useState<VisibilityLevel>('friends');
  const [airlines, setAirlines] = useState<{ id: string; name: string; code: string }[]>([]);
  const [airlinesLoading, setAirlinesLoading] = useState(true);
  const [airlinesError, setAirlinesError] = useState('');
  const [loading, setLoading] = useState(false);
  const [hydrating, setHydrating] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (onboardingDone) {
      router.replace(SCREENS.tabs.home);
    }
  }, [authLoading, onboardingDone, router]);

  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.display_name ?? '');
    setRoleType(profile.role_type ?? ROLE_TYPES[0]);
    setBaseAirport(profile.base_airport ?? '');
    setAirlineId(profile.airline_id ?? undefined);
    setVisibility(profile.default_visibility ?? 'friends');
  }, [profile]);

  useEffect(() => {
    if (authLoading) return;
    if (!userId) {
      setHydrating(false);
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const existing = profile ?? (await fetchMyProfile(client, userId));
        if (cancelled) return;
        if (existing) {
          setDisplayName(existing.display_name ?? '');
          setRoleType(existing.role_type ?? ROLE_TYPES[0]);
          setBaseAirport(existing.base_airport ?? '');
          setAirlineId(existing.airline_id ?? undefined);
          setVisibility(existing.default_visibility ?? 'friends');
        }
      } catch (e) {
        if (!cancelled) {
          setError(formatApolloError(e));
        }
      } finally {
        if (!cancelled) setHydrating(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, client, profile, userId]);

  useEffect(() => {
    let cancelled = false;
    setAirlinesLoading(true);
    setAirlinesError('');
    void fetchAirlines(client)
      .then((rows) => {
        if (!cancelled) setAirlines(rows);
      })
      .catch((e) => {
        if (!cancelled) setAirlinesError(formatApolloError(e));
      })
      .finally(() => {
        if (!cancelled) setAirlinesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [client]);

  useEffect(() => {
    if (!airlineId && visibility === 'same_airline') {
      setVisibility('friends');
    }
  }, [airlineId, visibility]);

  const onSubmit = async () => {
    if (!userId) return;
    if (!displayName.trim()) {
      setError(t('onboarding.displayNameRequired'));
      return;
    }
    setLoading(true);
    setError('');
    try {
      const resolvedVisibility = normalizeVisibilityForAffiliation(visibility, airlineId);
      const payload = {
        display_name: displayName.trim(),
        role_type: roleType,
        base_airport: baseAirport.trim().toUpperCase(),
        airline_id: airlineId,
        preferred_language: 'en',
        default_visibility: resolvedVisibility,
      };

      const existing = profile ?? (await fetchMyProfile(client, userId));
      await saveOrUpdateProfile(client, userId, payload, existing);
      await refreshSession();
      await refreshProfile();
      router.replace(SCREENS.onboarding.rosterIntro);
    } catch (e) {
      if (isUniquenessViolation(e)) {
        await refreshProfile();
        if (hasCompletedOnboarding(await fetchMyProfile(client, userId))) {
          router.replace(SCREENS.tabs.home);
          return;
        }
      }
      setError(formatApolloError(e));
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || hydrating) {
    return (
      <Screen>
        <BodyText muted>{t('common.loading')}</BodyText>
      </Screen>
    );
  }

  if (onboardingDone) {
    return (
      <Screen>
        <BodyText muted>{t('common.loading')}</BodyText>
      </Screen>
    );
  }

  return (
    <Screen style={{ padding: 0 }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Title>{t('onboarding.title')}</Title>
          <Subtitle style={{ marginBottom: theme.spacing.lg }}>{t('onboarding.subtitle')}</Subtitle>

          <View style={styles.section}>
            <SectionLabel>{t('home.editPersonalDetails')}</SectionLabel>
            <BodyText muted style={styles.sectionHint}>
              {t('onboarding.personalHint')}
            </BodyText>
            <Input
              label={t('onboarding.displayName')}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder={t('onboarding.displayNamePlaceholder')}
            />
          </View>

          <View style={styles.section}>
            <SectionLabel>{t('home.editTravelPreferences')}</SectionLabel>
            <BodyText muted style={styles.sectionHint}>
              {t('onboarding.travelHint')}
            </BodyText>
            <PillSelectorGroup
              label={t('onboarding.role')}
              options={ROLE_TYPES.map((role) => ({
                value: role,
                label: formatOptionLabel(role),
              }))}
              value={roleType}
              onChange={setRoleType}
            />
            <AirlinePickerField
              label={t('onboarding.airline')}
              airlines={airlines}
              value={airlineId}
              onChange={setAirlineId}
              loading={airlinesLoading}
              error={airlinesError || undefined}
              optional
            />
            <AirportPickerField
              label={t('onboarding.base')}
              value={baseAirport}
              onChange={setBaseAirport}
              placeholder={t('home.selectBaseAirport')}
              preferIata={profile?.base_airport ?? baseAirport}
            />
          </View>

          <View style={styles.section}>
            <SectionLabel>{t('onboarding.visibilitySection')}</SectionLabel>
            <BodyText muted style={styles.sectionHint}>
              {t('onboarding.visibilityHint')}
            </BodyText>
            <PillSelectorGroup
              label={t('onboarding.visibility')}
              options={visibilityLevelsForAffiliation(airlineId).map((v) => ({
                value: v,
                label: formatOptionLabel(v),
              }))}
              value={visibility}
              onChange={setVisibility}
            />
          </View>

          {error ? (
            <BodyText style={{ color: theme.colors.statusOnDuty, marginBottom: theme.spacing.md }}>
              {error}
            </BodyText>
          ) : null}
        </ScrollView>

        <View style={styles.footer}>
          <Button label={t('onboarding.continue')} onPress={onSubmit} loading={loading} noTopMargin />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
