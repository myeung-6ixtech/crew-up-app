import { useEffect, useState } from 'react';
import { ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useApolloClient } from '@/lib/apolloHooks';
import { AirlinePickerField } from '@/components/profile/AirlinePickerField';
import {
  Screen,
  Title,
  Input,
  Button,
  BodyText,
  PillSelectorGroup,
} from '@/components/ui';
import { ROLE_TYPES, type VisibilityLevel } from '@/constants/screens';
import { formatOptionLabel } from '@/lib/formatOptionLabel';
import {
  normalizeVisibilityForAffiliation,
  visibilityLevelsForAffiliation,
} from '@/lib/visibilityOptions';
import { formatApolloError, isUniquenessViolation } from '@/lib/graphqlError';
import { fetchAirlines, saveProfile } from '@/services/profileService';
import { useAuth, useSession } from '@/hooks/useSession';
import { SCREENS } from '@/constants/screens';
import { useThemedStyles, useTheme } from '@/theme';

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const client = useApolloClient();
  const theme = useTheme();
  const { hasProfile, loading: authLoading } = useAuth();
  const { refreshProfile, refreshSession } = useSession();
  const styles = useThemedStyles((t) => ({
    content: { padding: t.spacing.lg },
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
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading || !hasProfile) return;
    router.replace(SCREENS.tabs.home);
  }, [authLoading, hasProfile, router]);

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
    if (!displayName.trim()) {
      setError('Display name is required.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const resolvedVisibility = normalizeVisibilityForAffiliation(visibility, airlineId);
      await saveProfile(client, {
        display_name: displayName.trim(),
        role_type: roleType,
        base_airport: baseAirport.trim().toUpperCase(),
        airline_id: airlineId,
        preferred_language: 'en',
        default_visibility: resolvedVisibility,
      });
      await refreshSession();
      await refreshProfile();
      router.replace(SCREENS.onboarding.rosterIntro);
    } catch (e) {
      if (isUniquenessViolation(e)) {
        await refreshProfile();
        router.replace(SCREENS.tabs.home);
        return;
      }
      setError(formatApolloError(e));
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || hasProfile) {
    return (
      <Screen>
        <BodyText muted>{t('common.loading')}</BodyText>
      </Screen>
    );
  }

  return (
    <Screen style={{ padding: 0 }}>
      <ScrollView contentContainerStyle={styles.content}>
        <Title>{t('onboarding.title')}</Title>
        <Input label="Display name" value={displayName} onChangeText={setDisplayName} placeholder="Alex" />
        <PillSelectorGroup
          label={t('onboarding.role')}
          options={ROLE_TYPES.map((role) => ({
            value: role,
            label: formatOptionLabel(role),
          }))}
          value={roleType}
          onChange={setRoleType}
        />
        <Input label={t('onboarding.base')} value={baseAirport} onChangeText={setBaseAirport} placeholder="HKG" />
        <AirlinePickerField
          label={t('onboarding.airline')}
          airlines={airlines}
          value={airlineId}
          onChange={setAirlineId}
          loading={airlinesLoading}
          error={airlinesError || undefined}
          optional
        />
        <PillSelectorGroup
          label={t('onboarding.visibility')}
          options={visibilityLevelsForAffiliation(airlineId).map((v) => ({
            value: v,
            label: formatOptionLabel(v),
          }))}
          value={visibility}
          onChange={setVisibility}
        />
        {error ? <BodyText style={{ color: theme.colors.statusOnDuty }}>{error}</BodyText> : null}
        <Button label={t('onboarding.continue')} onPress={onSubmit} loading={loading} />
      </ScrollView>
    </Screen>
  );
}
