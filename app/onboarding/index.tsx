import { useEffect, useState } from 'react';
import { ScrollView, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useApolloClient } from '@/lib/apolloHooks';
import { Screen, Title, Subtitle, Input, Button } from '@/components/ui';
import { ROLE_TYPES, VISIBILITY_LEVELS, type VisibilityLevel } from '@/constants/screens';
import { createProfile, fetchAirlines } from '@/services/profileService';
import { useSession } from '@/hooks/useSession';
import { SCREENS } from '@/constants/screens';

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const client = useApolloClient();
  const { refreshProfile } = useSession();
  const [displayName, setDisplayName] = useState('');
  const [roleType, setRoleType] = useState<string>(ROLE_TYPES[0]);
  const [baseAirport, setBaseAirport] = useState('');
  const [airlineId, setAirlineId] = useState<string | undefined>();
  const [visibility, setVisibility] = useState<VisibilityLevel>('friends');
  const [airlines, setAirlines] = useState<{ id: string; name: string; code: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    void fetchAirlines(client).then(setAirlines);
  }, [client]);

  const onSubmit = async () => {
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
      await refreshProfile();
      router.replace(SCREENS.onboarding.verification);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen style={{ padding: 0 }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Title>{t('onboarding.title')}</Title>
        <Input label="Display name" value={displayName} onChangeText={setDisplayName} placeholder="Alex" />
        <Text style={{ fontWeight: '600', marginBottom: 8 }}>{t('onboarding.role')}</Text>
        {ROLE_TYPES.map((role) => (
          <Pressable key={role} onPress={() => setRoleType(role)} style={{ paddingVertical: 8 }}>
            <Text style={{ color: roleType === role ? '#0B5FFF' : '#0F172A' }}>{role}</Text>
          </Pressable>
        ))}
        <Input label={t('onboarding.base')} value={baseAirport} onChangeText={setBaseAirport} placeholder="HKG" />
        <Text style={{ fontWeight: '600', marginTop: 8, marginBottom: 8 }}>Airline</Text>
        {airlines.map((a) => (
          <Pressable key={a.id} onPress={() => setAirlineId(a.id)} style={{ paddingVertical: 6 }}>
            <Text style={{ color: airlineId === a.id ? '#0B5FFF' : '#0F172A' }}>{a.name} ({a.code})</Text>
          </Pressable>
        ))}
        <Subtitle>{t('onboarding.visibility')}</Subtitle>
        {VISIBILITY_LEVELS.map((v) => (
          <Pressable key={v} onPress={() => setVisibility(v)} style={{ paddingVertical: 6 }}>
            <Text style={{ color: visibility === v ? '#0B5FFF' : '#0F172A' }}>{v}</Text>
          </Pressable>
        ))}
        {error ? <Text style={{ color: '#DC2626' }}>{error}</Text> : null}
        <Button label={t('onboarding.continue')} onPress={onSubmit} loading={loading} />
      </ScrollView>
    </Screen>
  );
}
