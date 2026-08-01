import { useEffect, useState } from 'react';
import { ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useApolloClient } from '@/lib/apolloHooks';
import {
  Screen,
  Title,
  Subtitle,
  Input,
  Button,
  BodyText,
  LabelText,
  SelectionOption,
} from '@/components/ui';
import { ROLE_TYPES, VISIBILITY_LEVELS, type VisibilityLevel } from '@/constants/screens';
import { formatApolloError } from '@/lib/graphqlError';
import { createProfile, fetchAirlines } from '@/services/profileService';
import { useSession } from '@/hooks/useSession';
import { SCREENS } from '@/constants/screens';
import { useThemedStyles, useTheme } from '@/theme';

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const client = useApolloClient();
  const theme = useTheme();
  const { refreshProfile, refreshSession } = useSession();
  const styles = useThemedStyles((t) => ({
    content: { padding: t.spacing.lg },
    fieldLabel: { marginTop: t.spacing.sm, marginBottom: t.spacing.sm },
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

  const onSubmit = async () => {
    if (!displayName.trim()) {
      setError('Display name is required.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await createProfile(client, {
        display_name: displayName.trim(),
        role_type: roleType,
        base_airport: baseAirport.trim().toUpperCase(),
        airline_id: airlineId,
        preferred_language: 'en',
        default_visibility: visibility,
      });
      await refreshSession();
      await refreshProfile();
      router.replace(SCREENS.onboarding.rosterIntro);
    } catch (e) {
      setError(formatApolloError(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen style={{ padding: 0 }}>
      <ScrollView contentContainerStyle={styles.content}>
        <Title>{t('onboarding.title')}</Title>
        <Input label="Display name" value={displayName} onChangeText={setDisplayName} placeholder="Alex" />
        <LabelText style={styles.fieldLabel}>{t('onboarding.role')}</LabelText>
        {ROLE_TYPES.map((role) => (
          <SelectionOption
            key={role}
            label={role}
            selected={roleType === role}
            onPress={() => setRoleType(role)}
          />
        ))}
        <Input label={t('onboarding.base')} value={baseAirport} onChangeText={setBaseAirport} placeholder="HKG" />
        <LabelText style={styles.fieldLabel}>Airline (optional)</LabelText>
        {airlinesLoading ? <BodyText muted style={{ marginBottom: 8 }}>Loading airlines…</BodyText> : null}
        {airlinesError ? (
          <BodyText style={{ color: theme.colors.statusOnDuty, marginBottom: 8 }}>{airlinesError}</BodyText>
        ) : null}
        {!airlinesLoading && !airlinesError && airlines.length === 0 ? (
          <BodyText muted style={{ marginBottom: 8 }}>No airlines available yet.</BodyText>
        ) : null}
        {airlines.map((a) => (
          <SelectionOption
            key={a.id}
            label={`${a.name} (${a.code})`}
            selected={airlineId === a.id}
            onPress={() => setAirlineId(a.id)}
          />
        ))}
        <Subtitle>{t('onboarding.visibility')}</Subtitle>
        {VISIBILITY_LEVELS.map((v) => (
          <SelectionOption
            key={v}
            label={v}
            selected={visibility === v}
            onPress={() => setVisibility(v)}
          />
        ))}
        {error ? <BodyText style={{ color: theme.colors.statusOnDuty }}>{error}</BodyText> : null}
        <Button label={t('onboarding.continue')} onPress={onSubmit} loading={loading} />
      </ScrollView>
    </Screen>
  );
}
