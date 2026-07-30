import { ScrollView, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Screen, Card, Title, Subtitle, Button, Badge } from '@/components/ui';
import { useAuth, useSession } from '@/hooks/useSession';
import { SCREENS } from '@/constants/screens';

export default function ProfileTab() {
  const { t } = useTranslation();
  const router = useRouter();
  const { profile, isVerified } = useAuth();
  const { signOut } = useSession();

  return (
    <Screen style={{ padding: 0 }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Title>{profile?.display_name ?? 'Your profile'}</Title>
        <Subtitle>
          {[profile?.role_type, profile?.base_airport].filter(Boolean).join(' · ') || 'Complete your profile'}
        </Subtitle>
        {isVerified ? <Badge label={t('verification.verified')} tone="success" /> : <Badge label={t('verification.pending')} />}

        <Card>
          <Text>Visibility: {profile?.default_visibility ?? 'friends'}</Text>
          <Text>Notifications: {profile?.notification_mode ?? 'realtime'}</Text>
        </Card>

        <Button label="Edit profile" onPress={() => router.push(SCREENS.profile.edit)} variant="secondary" />
        <Button label="Privacy" onPress={() => router.push(SCREENS.profile.privacy)} variant="secondary" />
        <Button label={t('safety.safetyCenter')} onPress={() => router.push(SCREENS.profile.safety)} variant="secondary" />
        <Button label="Verification status" onPress={() => router.push(SCREENS.profile.verification)} variant="secondary" />
        <Button label={t('roster.manage')} onPress={() => router.push(SCREENS.roster.manage)} variant="secondary" />
        <Button label={t('auth.signOut')} onPress={() => void signOut()} variant="danger" />
      </ScrollView>
    </Screen>
  );
}
